import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * One writer for Apple subscription state, used by verify-apple-purchase
 * (receipt path) and apple-server-notifications (renewal/cancel/refund path)
 * so both agree on rows, statuses and profile flags, and so Stripe-sourced
 * rows are never overwritten by Apple rows or vice versa.
 *
 * Product IDs must match lib/iapConfig.ts on the client. Duplicated here
 * because Edge Functions run in a separate Deno isolate.
 */
export const TAVVY_BUNDLE_ID = "com.360.tavvy";
export const ECARD_PRODUCT_IDS = ["com.360.tavvy.ecard.pro.monthly", "com.360.tavvy.ecard.pro.annual"];
export const PROS_PRODUCT_IDS = ["com.360.tavvy.pros.founding.annual"];
export const ALL_PRODUCT_IDS = [...ECARD_PRODUCT_IDS, ...PROS_PRODUCT_IDS];

export interface AppleEntitlementInput {
  /** Caller-bound user for the receipt path; null for notifications, which locate the owner by transaction. */
  userId: string | null;
  productId: string;
  originalTransactionId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  graceUntil: Date | null;
  autoRenew: boolean;
  environment: string;
  source: "receipt" | "notification";
  notificationType?: string;
}

export type AppleEntitlementOutcome =
  | { status: "active"; userId: string; plan: string; subscriptionStatus: string }
  | { status: "expired"; userId: string; plan: string; subscriptionStatus: string }
  | { status: "conflict"; ownerId: string }
  | { status: "unknown_owner" }
  | { status: "no_pros_profile"; userId: string };

function ecardPlanType(productId: string): string {
  return productId.endsWith(".annual") ? "ecard_premium_annual" : "ecard_premium_monthly";
}

/** Maps Apple's state onto the status vocabulary the Stripe webhooks already use. */
export function deriveSubscriptionStatus(input: Pick<AppleEntitlementInput, "expiresAt" | "revokedAt" | "graceUntil">, now = new Date()): { status: string; active: boolean } {
  if (input.revokedAt) return { status: "canceled", active: false };
  if (input.expiresAt.getTime() > now.getTime()) return { status: "active", active: true };
  if (input.graceUntil && input.graceUntil.getTime() > now.getTime()) return { status: "past_due", active: true };
  return { status: "expired", active: false };
}

async function findOwner(admin: SupabaseClient, originalTransactionId: string): Promise<{ ecard: string | null; pros: string | null }> {
  const [{ data: ecardRow, error: ecardError }, { data: prosRow, error: prosError }] = await Promise.all([
    admin.from("user_subscriptions").select("user_id").eq("apple_original_transaction_id", originalTransactionId).maybeSingle(),
    admin.from("pro_providers").select("user_id").eq("apple_original_transaction_id", originalTransactionId).maybeSingle(),
  ]);
  if (ecardError) throw ecardError;
  if (prosError) throw prosError;
  return { ecard: ecardRow?.user_id ?? null, pros: prosRow?.user_id ?? null };
}

/** Re-derives the profile's eCard Pro flags from every subscription row the user has (Stripe or Apple). */
export async function syncEcardProfile(admin: SupabaseClient, userId: string): Promise<void> {
  const nowIso = new Date().toISOString();
  const { data: rows, error } = await admin.from("user_subscriptions")
    .select("plan_type, status, current_period_end, source, apple_original_transaction_id, stripe_subscription_id")
    .eq("user_id", userId).like("plan_type", "ecard_premium%");
  if (error) throw error;
  const live = (rows ?? [])
    .filter((r) => ["active", "trialing", "past_due"].includes(r.status) && r.current_period_end && r.current_period_end > nowIso)
    .sort((a, b) => (b.current_period_end ?? "").localeCompare(a.current_period_end ?? ""))[0];
  const latest = (rows ?? []).sort((a, b) => (b.current_period_end ?? "").localeCompare(a.current_period_end ?? ""))[0];

  const profileUpdate = live
    ? { is_pro: true, subscription_status: "active", subscription_plan: live.plan_type, subscription_expires_at: live.current_period_end }
    : { is_pro: false, subscription_status: latest?.status === "canceled" ? "canceled" : "expired", subscription_expires_at: latest?.current_period_end ?? null };
  const { error: profileError } = await admin.from("profiles").update(profileUpdate).eq("user_id", userId);
  if (profileError) throw profileError;

  if (live) {
    const ref = live.source === "apple" ? `apple:${live.apple_original_transaction_id}` : String(live.stripe_subscription_id ?? "stripe");
    const { error: roleError } = await admin.from("user_roles").upsert({
      user_id: userId,
      role: "pro",
      // Must keep the "eCard Premium subscription:" prefix: get_my_ecard_entitlement()
      // treats any other 'pro' role note as a manual, non-expiring grant.
      notes: `eCard Premium subscription: ${ref}`,
      granted_at: new Date().toISOString(),
    }, { onConflict: "user_id,role" });
    if (roleError) throw roleError;
  } else {
    const { error: roleError } = await admin.from("user_roles").delete()
      .eq("user_id", userId).eq("role", "pro").like("notes", "eCard Premium subscription:%");
    if (roleError) throw roleError;
  }
}

async function applyEcard(admin: SupabaseClient, userId: string, input: AppleEntitlementInput): Promise<AppleEntitlementOutcome> {
  const { status, active } = deriveSubscriptionStatus(input);
  const planType = ecardPlanType(input.productId);
  const nowIso = new Date().toISOString();
  const row = {
    user_id: userId,
    plan_type: planType,
    status,
    current_period_end: input.expiresAt.toISOString(),
    source: "apple",
    apple_original_transaction_id: input.originalTransactionId,
    apple_product_id: input.productId,
    updated_at: nowIso,
  };
  // One Apple row per user for eCard: the group has one active subscription and
  // a monthly↔annual switch keeps the same original transaction id.
  const { data: existing, error: existingError } = await admin.from("user_subscriptions")
    .select("id, apple_original_transaction_id")
    .eq("user_id", userId).eq("source", "apple").like("plan_type", "ecard_premium%")
    .order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (existingError) throw existingError;
  if (existing) {
    const { data, error } = await admin.from("user_subscriptions").update(row).eq("id", existing.id).select("id");
    if (error || !data?.length) throw error ?? new Error("Subscription row was not updated.");
  } else {
    const { error } = await admin.from("user_subscriptions").insert(row);
    if (error) throw error;
  }
  await syncEcardProfile(admin, userId);
  return { status: active ? "active" : "expired", userId, plan: planType, subscriptionStatus: status };
}

async function applyPros(admin: SupabaseClient, userId: string, input: AppleEntitlementInput): Promise<AppleEntitlementOutcome> {
  const { status, active } = deriveSubscriptionStatus(input);
  const { data: providers, error } = await admin.from("pro_providers").update({
    subscription_status: status,
    subscription_plan: "founding",
    subscription_expires_at: input.expiresAt.toISOString(),
    subscription_source: "apple",
    apple_original_transaction_id: input.originalTransactionId,
    is_active: active,
  }).eq("user_id", userId).select("id");
  if (error) throw error;
  if (!providers?.length) return { status: "no_pros_profile", userId };

  // Mirror the Stripe webhook's pro_subscriptions record so the dashboard's
  // "my subscription" reads the same shape for Apple buyers.
  for (const provider of providers) {
    const { data: existing, error: existingError } = await admin.from("pro_subscriptions")
      .select("id").eq("provider_id", provider.id).is("stripe_subscription_id", null)
      .order("updated_at", { ascending: false }).limit(1).maybeSingle();
    if (existingError) throw existingError;
    const record = {
      provider_id: provider.id,
      tier: "founding",
      status,
      price_per_year: 199,
      end_date: input.expiresAt.toISOString(),
      cancelled_at: input.revokedAt ? input.revokedAt.toISOString() : null,
      updated_at: new Date().toISOString(),
    };
    if (existing) {
      const { error: updateError } = await admin.from("pro_subscriptions").update(record).eq("id", existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await admin.from("pro_subscriptions").insert({ ...record, start_date: new Date().toISOString() });
      if (insertError) throw insertError;
    }
  }
  return { status: active ? "active" : "expired", userId, plan: "founding", subscriptionStatus: status };
}

/**
 * Applies one Apple subscription state to Tavvy's entitlement tables.
 * Ownership rule: an original transaction belongs to the first Tavvy account
 * that claimed it. A receipt from another account is a conflict; a
 * notification for a transaction nobody claimed yet is "unknown_owner" and is
 * applied later when that customer signs in and restores.
 */
export async function applyAppleEntitlement(admin: SupabaseClient, input: AppleEntitlementInput): Promise<AppleEntitlementOutcome> {
  const isEcard = ECARD_PRODUCT_IDS.includes(input.productId);
  const isPros = PROS_PRODUCT_IDS.includes(input.productId);
  if (!isEcard && !isPros) throw new Error(`Unknown product ${input.productId}`);

  const owner = await findOwner(admin, input.originalTransactionId);
  const existingOwner = isEcard ? owner.ecard : owner.pros;
  const crossOwner = isEcard ? owner.pros : owner.ecard;
  if (input.userId) {
    if ((existingOwner && existingOwner !== input.userId) || (crossOwner && crossOwner !== input.userId)) {
      return { status: "conflict", ownerId: (existingOwner ?? crossOwner)! };
    }
  }
  const userId = input.userId ?? existingOwner;
  if (!userId) return { status: "unknown_owner" };

  return isEcard ? applyEcard(admin, userId, input) : applyPros(admin, userId, input);
}
