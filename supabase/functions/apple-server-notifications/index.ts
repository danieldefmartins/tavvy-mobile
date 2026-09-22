import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AppleJwsError, verifyAppleJws } from "../_shared/appleJws.ts";
import { ALL_PRODUCT_IDS, applyAppleEntitlement, TAVVY_BUNDLE_ID } from "../_shared/appleEntitlements.ts";

/**
 * App Store Server Notifications V2 endpoint. Register its URL in App Store
 * Connect → App Information → App Store Server Notifications (production and
 * sandbox). Apple POSTs `{ signedPayload }` for renewals, billing problems,
 * cancellations, refunds, plan switches and more; this keeps Tavvy's
 * entitlement rows in step without polling.
 *
 * Security: no Supabase JWT (Apple cannot send one; deploy with verify_jwt
 * off). Authenticity comes from the JWS certificate chain anchored at Apple
 * Root CA - G3 (see _shared/appleJws.ts). Every notification is stored in
 * apple_server_notifications; notificationUUID makes redelivery idempotent.
 *
 * Response codes: 200 once stored (even when nothing applies, so Apple stops
 * retrying), 401 for a bad signature, 400 for a malformed body, 5xx only when
 * storage failed and a retry is wanted.
 */

interface NotificationPayload {
  notificationType: string;
  subtype?: string;
  notificationUUID: string;
  version?: string;
  signedDate?: number;
  data?: {
    environment?: string;
    bundleId?: string;
    appAppleId?: number;
    status?: number;
    signedTransactionInfo?: string;
    signedRenewalInfo?: string;
  };
  summary?: { environment?: string; bundleId?: string };
}

interface TransactionInfo {
  originalTransactionId: string;
  transactionId?: string;
  productId: string;
  bundleId?: string;
  purchaseDate?: number;
  expiresDate?: number;
  revocationDate?: number;
  revocationReason?: number;
  appAccountToken?: string;
  environment?: string;
  type?: string;
}

interface RenewalInfo {
  originalTransactionId?: string;
  autoRenewProductId?: string;
  autoRenewStatus?: number;
  expirationIntent?: number;
  gracePeriodExpiresDate?: number;
  isInBillingRetryPeriod?: boolean;
  productId?: string;
  environment?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method !== "POST") return json({ status: "error", message: "Method not allowed" }, 405);

  let body: { signedPayload?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ status: "error", message: "Invalid JSON body." }, 400);
  }
  if (typeof body.signedPayload !== "string") return json({ status: "error", message: "Missing signedPayload." }, 400);

  let notification: NotificationPayload;
  let transaction: TransactionInfo | null = null;
  let renewal: RenewalInfo | null = null;
  try {
    notification = verifyAppleJws<NotificationPayload>(body.signedPayload).payload;
    if (notification.data?.signedTransactionInfo) {
      transaction = verifyAppleJws<TransactionInfo>(notification.data.signedTransactionInfo).payload;
    }
    if (notification.data?.signedRenewalInfo) {
      renewal = verifyAppleJws<RenewalInfo>(notification.data.signedRenewalInfo).payload;
    }
  } catch (error) {
    if (error instanceof AppleJwsError) {
      console.warn("[apple-server-notifications] Rejected unsigned/invalid payload:", error.message);
      return json({ status: "error", message: "Signature verification failed." }, 401);
    }
    console.error("[apple-server-notifications] Verification crashed:", error);
    return json({ status: "error", message: "Verification failed." }, 500);
  }

  if (!notification.notificationUUID || !notification.notificationType) {
    return json({ status: "error", message: "Notification lacks type or UUID." }, 400);
  }
  const bundleId = notification.data?.bundleId ?? notification.summary?.bundleId ?? transaction?.bundleId;
  if (bundleId && bundleId !== TAVVY_BUNDLE_ID) {
    console.warn("[apple-server-notifications] Ignoring notification for bundle", bundleId);
    return json({ status: "ignored", reason: "bundle" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceKey);

  // 1. Store first (idempotent on notificationUUID). A duplicate delivery is acknowledged and not re-applied.
  const environment = notification.data?.environment ?? notification.summary?.environment ?? transaction?.environment ?? null;
  const { data: stored, error: storeError } = await admin.from("apple_server_notifications").insert({
    notification_uuid: notification.notificationUUID,
    notification_type: notification.notificationType,
    subtype: notification.subtype ?? null,
    environment,
    original_transaction_id: transaction?.originalTransactionId ?? renewal?.originalTransactionId ?? null,
    transaction_id: transaction?.transactionId ?? null,
    product_id: transaction?.productId ?? renewal?.productId ?? null,
    signed_date: notification.signedDate ? new Date(notification.signedDate).toISOString() : null,
    payload: { notification, transaction, renewal },
  }).select("id").maybeSingle();
  if (storeError) {
    if (storeError.code === "23505") return json({ status: "duplicate" });
    console.error("[apple-server-notifications] Could not store notification:", storeError);
    return json({ status: "error", message: "Storage failed." }, 500);
  }

  const finish = async (outcome: string, userId: string | null, error?: string) => {
    await admin.from("apple_server_notifications").update({
      processed_at: new Date().toISOString(),
      outcome,
      user_id: userId,
      error: error ?? null,
    }).eq("id", stored?.id);
  };

  // 2. Apply. Anything without a subscription transaction (TEST, CONSUMPTION_REQUEST, …) is only recorded.
  if (!transaction || !transaction.originalTransactionId || !transaction.productId || !transaction.expiresDate) {
    await finish("recorded", null);
    return json({ status: "recorded" });
  }
  if (!ALL_PRODUCT_IDS.includes(transaction.productId)) {
    await finish("unknown_product", null);
    return json({ status: "recorded", reason: "unknown_product" });
  }

  try {
    // appAccountToken is the Tavvy user id the app supplied at purchase time,
    // carried inside Apple's signed transaction. It must still be a real user.
    let userId: string | null = null;
    if (transaction.appAccountToken && UUID_RE.test(transaction.appAccountToken)) {
      const { data: found } = await admin.auth.admin.getUserById(transaction.appAccountToken);
      userId = found?.user?.id ?? null;
    }
    const outcome = await applyAppleEntitlement(admin, {
      userId,
      productId: transaction.productId,
      originalTransactionId: transaction.originalTransactionId,
      expiresAt: new Date(transaction.expiresDate),
      revokedAt: transaction.revocationDate ? new Date(transaction.revocationDate) : null,
      graceUntil: renewal?.gracePeriodExpiresDate ? new Date(renewal.gracePeriodExpiresDate) : null,
      autoRenew: renewal?.autoRenewStatus === 1,
      environment: environment ?? "Production",
      source: "notification",
      notificationType: `${notification.notificationType}${notification.subtype ? `/${notification.subtype}` : ""}`,
    });
    const resolvedUser = "userId" in outcome ? outcome.userId : "ownerId" in outcome ? outcome.ownerId : null;
    await finish(outcome.status, resolvedUser);
    return json({ status: "ok", outcome: outcome.status });
  } catch (error) {
    console.error("[apple-server-notifications] Apply failed:", error);
    await finish("error", null, error instanceof Error ? error.message : String(error));
    // Stored for reconciliation; a 200 stops Apple from retrying a payload we already hold.
    return json({ status: "stored", outcome: "error" });
  }
});
