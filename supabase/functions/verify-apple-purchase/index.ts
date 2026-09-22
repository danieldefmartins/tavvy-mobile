import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  applyAppleEntitlement,
  ECARD_PRODUCT_IDS,
  PROS_PRODUCT_IDS,
  TAVVY_BUNDLE_ID,
} from "../_shared/appleEntitlements.ts";

/**
 * Verifies an iOS StoreKit receipt with Apple and binds the subscription to
 * the calling Tavvy account (the JWT's user, never a user id from the body).
 *
 * Guarantees:
 *  - the receipt must belong to Tavvy's bundle and contain the requested product;
 *  - an Apple original transaction stays with the first Tavvy account that
 *    claimed it (409 for any other caller; the unique index backs this up);
 *  - an expired subscription is recorded as expired (status EXPIRED, 400) so the
 *    client can finish the transaction instead of retrying forever;
 *  - entitlement rows and profile flags are written through the same helper
 *    App Store Server Notifications use, so both paths agree.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APPLE_VERIFY_PROD = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_VERIFY_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt";

interface AppleReceiptEntry {
  product_id: string;
  original_transaction_id: string;
  transaction_id?: string;
  expires_date_ms: string;
  purchase_date_ms?: string;
  cancellation_date_ms?: string;
  is_trial_period?: string;
  is_in_intro_offer_period?: string;
  app_account_token?: string;
}

interface AppleVerifyResponse {
  status: number;
  environment?: string;
  receipt?: { bundle_id?: string; in_app?: AppleReceiptEntry[] };
  latest_receipt_info?: AppleReceiptEntry[];
  pending_renewal_info?: Array<{
    product_id?: string;
    auto_renew_product_id?: string;
    auto_renew_status?: string;
    original_transaction_id?: string;
    expiration_intent?: string;
    is_in_billing_retry_period?: string;
    grace_period_expires_date_ms?: string;
  }>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function callAppleVerify(url: string, receiptData: string, sharedSecret: string): Promise<AppleVerifyResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "receipt-data": receiptData, password: sharedSecret, "exclude-old-transactions": true }),
  });
  if (!res.ok) throw new Error(`Apple verifyReceipt responded ${res.status}`);
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ status: "error", code: "METHOD", message: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ status: "error", code: "NO_AUTH", message: "Missing Authorization header." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const sharedSecret = Deno.env.get("APPLE_SHARED_SECRET");

  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: { user }, error: userError } = await callerClient.auth.getUser();
  if (userError || !user) return json({ status: "error", code: "NOT_AUTHENTICATED", message: "Could not verify the calling session." }, 401);

  if (!sharedSecret) {
    console.error("[verify-apple-purchase] APPLE_SHARED_SECRET not configured.");
    return json({ status: "error", code: "NOT_CONFIGURED", message: "Purchase verification is not configured yet." }, 503);
  }

  try {
    let body: { productId?: unknown; transactionReceipt?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ status: "error", code: "BAD_JSON", message: "Invalid JSON body." }, 400);
    }
    const { productId, transactionReceipt } = body;
    if (typeof productId !== "string" || typeof transactionReceipt !== "string" || !productId || !transactionReceipt) {
      return json({ status: "error", code: "BAD_REQUEST", message: "Missing productId or transactionReceipt." }, 400);
    }
    if (transactionReceipt.length > 2_000_000) {
      return json({ status: "error", code: "BAD_REQUEST", message: "Receipt is too large." }, 400);
    }
    if (![...ECARD_PRODUCT_IDS, ...PROS_PRODUCT_IDS].includes(productId)) {
      return json({ status: "error", code: "UNKNOWN_PRODUCT", message: "Unknown product ID." }, 400);
    }

    let result = await callAppleVerify(APPLE_VERIFY_PROD, transactionReceipt, sharedSecret);
    if (result.status === 21007) {
      // Sandbox receipt sent to the production endpoint — Apple's documented pattern.
      result = await callAppleVerify(APPLE_VERIFY_SANDBOX, transactionReceipt, sharedSecret);
    }
    if (result.status !== 0) {
      const retryable = result.status === 21005 || result.status >= 21100;
      return json({ status: "error", code: retryable ? "APPLE_UNAVAILABLE" : "APPLE_REJECTED", message: `Apple verification failed (status ${result.status}).` }, retryable ? 503 : 400);
    }

    if (result.receipt?.bundle_id !== TAVVY_BUNDLE_ID) {
      return json({ status: "error", code: "WRONG_APP", message: "Receipt is for a different app." }, 400);
    }
    const entries = result.latest_receipt_info ?? result.receipt?.in_app ?? [];
    const entry = entries
      .filter((e) => e.product_id === productId && e.original_transaction_id && Number.isFinite(Number(e.expires_date_ms)))
      .sort((a, b) => Number(b.expires_date_ms) - Number(a.expires_date_ms))[0];
    if (!entry) {
      return json({ status: "error", code: "PRODUCT_NOT_IN_RECEIPT", message: "Receipt does not contain this subscription." }, 400);
    }
    // Apple stamps the appAccountToken the app supplied at purchase time (the
    // Tavvy user id). When present it must match the caller.
    if (entry.app_account_token && entry.app_account_token.toLowerCase() !== user.id.toLowerCase()) {
      return json({ status: "error", code: "ACCOUNT_MISMATCH", message: "This Apple subscription was purchased for a different Tavvy account." }, 409);
    }

    const revokedAt = entry.cancellation_date_ms ? new Date(Number(entry.cancellation_date_ms)) : null;
    const expiresAt = new Date(Number(entry.expires_date_ms));
    const renewal = result.pending_renewal_info?.find((r) => r.original_transaction_id === entry.original_transaction_id);
    const graceUntil = renewal?.grace_period_expires_date_ms ? new Date(Number(renewal.grace_period_expires_date_ms)) : null;
    const outcome = await applyAppleEntitlement(admin, {
      userId: user.id,
      productId,
      originalTransactionId: entry.original_transaction_id,
      expiresAt,
      revokedAt,
      graceUntil,
      autoRenew: renewal?.auto_renew_status === "1",
      environment: result.environment ?? "Production",
      source: "receipt",
    });

    if (outcome.status === "conflict") {
      return json({ status: "error", code: "OWNED_BY_OTHER_ACCOUNT", message: "This Apple subscription is linked to another Tavvy account." }, 409);
    }
    if (outcome.status === "expired") {
      return json({ status: "error", code: "EXPIRED", message: "This subscription has expired.", expiresAt: expiresAt.toISOString() }, 400);
    }
    if (outcome.status === "no_pros_profile") {
      return json({ status: "error", code: "NO_PROS_PROFILE", message: "Create your Tavvy Pros profile first, then restore this purchase." }, 409);
    }
    if (outcome.status !== "active") {
      // Unreachable with a caller-bound userId; kept for exhaustiveness.
      return json({ status: "error", code: "INTERNAL", message: "Verification failed." }, 500);
    }

    return json({ status: "ok", expiresAt: expiresAt.toISOString(), isActive: true, plan: outcome.plan, environment: result.environment ?? null });
  } catch (error) {
    console.error("[verify-apple-purchase] Failed:", error);
    return json({ status: "error", code: "INTERNAL", message: "Verification failed." }, 500);
  }
});
