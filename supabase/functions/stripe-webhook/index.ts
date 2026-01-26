import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const INTRO_PRICE = Deno.env.get("STRIPE_PRICE_INTRO")!;
const RENEW_PRICE = Deno.env.get("STRIPE_PRICE_RENEW")!;

// eCard Premium Price IDs
const ECARD_PRICE_MONTHLY = 'price_1Ssp3yIeV9jtGwIXAI2xbGZx';
const ECARD_PRICE_ANNUAL = 'price_1SswRRIeV9jtGwIXUCSIVRP6';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============ RBAC Role Management ============

// Get Tavvy user_id from Stripe customer metadata or email
async function getTavvyUserId(stripeCustomerId: string, customerEmail?: string): Promise<string | null> {
  // First, check if we have a mapping in our database
  const { data: mapping } = await supabase
    .from("stripe_customer_mapping")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (mapping?.user_id) {
    return mapping.user_id;
  }

  // Fallback: try to find user by email
  if (customerEmail) {
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();

    if (user?.id) {
      // Save the mapping for future use
      await supabase.from("stripe_customer_mapping").upsert({
        stripe_customer_id: stripeCustomerId,
        user_id: user.id,
      });
      return user.id;
    }
  }

  return null;
}

// Grant 'pro' role to user
async function grantProRole(userId: string, stripeSubscriptionId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_roles").upsert(
      {
        user_id: userId,
        role: "pro",
        notes: `Stripe subscription: ${stripeSubscriptionId}`,
        granted_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,role",
      }
    );

    if (error) {
      console.error("[Webhook] Error granting pro role:", error);
      return false;
    }

    console.log(`[Webhook] Granted pro role to user ${userId}`);
    return true;
  } catch (err) {
    console.error("[Webhook] Exception granting pro role:", err);
    return false;
  }
}

// Revoke 'pro' role from user
async function revokeProRole(userId: string, reason: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "pro");

    if (error) {
      console.error("[Webhook] Error revoking pro role:", error);
      return false;
    }

    console.log(`[Webhook] Revoked pro role from user ${userId}. Reason: ${reason}`);
    return true;
  } catch (err) {
    console.error("[Webhook] Exception revoking pro role:", err);
    return false;
  }
}

// ============ eCard Premium Functions ============

// Handle eCard Premium subscription checkout
async function handleECardCheckout(session: any): Promise<void> {
  const userId = session.client_reference_id;
  const subscriptionId = session.subscription as string;
  const planType = session.metadata?.plan_type || 'monthly';
  const customerId = session.customer as string;

  if (!userId || !subscriptionId) {
    throw new Error("Missing user ID or subscription ID for eCard checkout");
  }

  console.log(`[Webhook] Processing eCard Premium checkout for user ${userId}`);

  // Get subscription details from Stripe
  const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  const subscription = await subRes.json();

  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);

  // Check if user already has an eCard subscription
  const { data: existingSub } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .like('plan_type', 'ecard_premium%')
    .maybeSingle();

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    plan_type: planType === 'annual' ? 'ecard_premium_annual' : 'ecard_premium_monthly',
    status: subscription.status,
    current_period_start: currentPeriodStart.toISOString(),
    current_period_end: currentPeriodEnd.toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existingSub) {
    await supabase
      .from('user_subscriptions')
      .update(subscriptionData)
      .eq('id', existingSub.id);
  } else {
    await supabase.from('user_subscriptions').insert(subscriptionData);
  }

  // Update user's profile to mark as Pro
  await supabase
    .from('profiles')
    .update({ 
      is_pro: true,
      pro_since: new Date().toISOString(),
    })
    .eq('id', userId);

  // Also grant the 'pro' role via RBAC
  await grantProRole(userId, subscriptionId);

  // Publish the user's eCard (make it live)
  const { data: userCard } = await supabase
    .from('digital_cards')
    .select('id, is_published')
    .eq('user_id', userId)
    .maybeSingle();

  if (userCard && !userCard.is_published) {
    await supabase
      .from('digital_cards')
      .update({ 
        is_published: true,
        is_premium: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userCard.id);
    console.log(`[Webhook] eCard published for user ${userId}`);
  }

  console.log(`[Webhook] eCard Premium subscription created for user ${userId}`);
}

// Handle eCard subscription updates
async function handleECardSubscriptionUpdate(subscription: any): Promise<void> {
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const { data: subRecord } = await supabase
    .from('user_subscriptions')
    .select('id, user_id, plan_type')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (!subRecord || !subRecord.plan_type?.includes('ecard_premium')) {
    return; // Not an eCard subscription
  }

  await supabase
    .from('user_subscriptions')
    .update({ 
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  // Update profile is_pro based on status
  const isPro = ['active', 'trialing'].includes(status);
  await supabase
    .from('profiles')
    .update({ is_pro: isPro })
    .eq('id', subRecord.user_id);

  console.log(`[Webhook] eCard subscription ${subscriptionId} updated to status: ${status}`);
}

// Handle eCard subscription cancellation
async function handleECardSubscriptionDeleted(subscription: any): Promise<void> {
  const subscriptionId = subscription.id;
  const customerId = subscription.customer as string;

  const { data: subRecord } = await supabase
    .from('user_subscriptions')
    .select('id, user_id, plan_type')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (!subRecord || !subRecord.plan_type?.includes('ecard_premium')) {
    return; // Not an eCard subscription
  }

  await supabase
    .from('user_subscriptions')
    .update({ 
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId);

  // Check if user has any other active subscriptions
  const { data: otherSubs } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', subRecord.user_id)
    .in('status', ['active', 'trialing'])
    .neq('stripe_subscription_id', subscriptionId);

  // Only remove Pro status if no other active subscriptions
  if (!otherSubs || otherSubs.length === 0) {
    await supabase
      .from('profiles')
      .update({ is_pro: false })
      .eq('id', subRecord.user_id);

    // Also revoke the 'pro' role
    await revokeProRole(subRecord.user_id, "eCard subscription cancelled");
  }

  console.log(`[Webhook] eCard subscription ${subscriptionId} canceled`);
}

// ============ Stripe API Helpers ============

async function stripePost(path: string, params: URLSearchParams) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

async function verifyStripeSignature(req: Request, rawBody: string) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) throw new Error("Missing stripe-signature header");

  const parts = Object.fromEntries(sig.split(",").map((kv) => kv.split("=") as [string, string]));
  const timestamp = parts["t"];
  const v1 = parts["v1"];
  if (!timestamp || !v1) throw new Error("Invalid stripe-signature header");

  const signedPayload = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const hex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");

  if (hex !== v1) throw new Error("Webhook signature verification failed");
}

// ============ Main Webhook Handler ============

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();
  try {
    await verifyStripeSignature(req, rawBody);
  } catch (e) {
    return new Response(`Invalid signature: ${String(e)}`, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const type = event.type;

  try {
    if (type === "checkout.session.completed") {
      const session = event.data.object;
      const subscriptionId = session.subscription as string | undefined;
      const subscriptionType = session.metadata?.subscription_type as string | undefined;
      const placeId = session.metadata?.place_id as string | undefined;

      // ========== eCard Premium Checkout ==========
      if (subscriptionType === 'ecard_premium') {
        await handleECardCheckout(session);
        return new Response(JSON.stringify({ received: true, type: 'ecard_premium' }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // ========== Pro Portal Checkout (place-based) ==========
      if (!subscriptionId || !placeId) {
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create schedule from subscription
      const schedule = await stripePost("subscription_schedules", new URLSearchParams({
        "from_subscription": subscriptionId,
      }));

      // Update schedule phases: 1 year $99, then ongoing $499
      const updateParams = new URLSearchParams();
      updateParams.set("phases[0][items][0][price]", INTRO_PRICE);
      updateParams.set("phases[0][items][0][quantity]", "1");
      updateParams.set("phases[0][duration][interval]", "year");
      updateParams.set("phases[0][duration][interval_count]", "1");

      updateParams.set("phases[1][items][0][price]", RENEW_PRICE);
      updateParams.set("phases[1][items][0][quantity]", "1");

      updateParams.set("end_behavior", "release");

      await stripePost(`subscription_schedules/${schedule.id}`, updateParams);

      // Upsert pro_subscriptions row
      const { error } = await supabase.from("pro_subscriptions").upsert({
        place_id: placeId,
        status: "active",
        stripe_customer_id: session.customer,
        stripe_subscription_id: subscriptionId,
        stripe_schedule_id: schedule.id,
        intro_price_id: INTRO_PRICE,
        renew_price_id: RENEW_PRICE,
        updated_at: new Date().toISOString(),
      });

      if (error) throw new Error(error.message);

      // Grant 'pro' role to the user who owns this place
      const customerId = session.customer as string;
      const customerEmail = session.customer_email as string | undefined;
      const userId = await getTavvyUserId(customerId, customerEmail);
      if (userId) {
        await grantProRole(userId, subscriptionId);
      } else {
        console.warn(`[Webhook] Could not find user for customer ${customerId} to grant pro role`);
      }
    }

    if (type === "customer.subscription.updated") {
      const subscription = event.data.object;
      
      // Check if this is an eCard subscription first
      await handleECardSubscriptionUpdate(subscription);
    }

    if (type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription as string | undefined;
      if (subscriptionId) {
        // Update pro_subscriptions (Pro Portal)
        await supabase.from("pro_subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);

        // Update user_subscriptions (eCard)
        await supabase.from("user_subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    if (type === "invoice.paid") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription as string | undefined;
      if (subscriptionId) {
        // Update pro_subscriptions (Pro Portal)
        await supabase.from("pro_subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);

        // Update user_subscriptions (eCard)
        await supabase.from("user_subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    if (type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const subscriptionId = sub.id as string | undefined;
      const customerId = sub.customer as string | undefined;

      // Handle eCard subscription cancellation
      await handleECardSubscriptionDeleted(sub);

      // Handle Pro Portal subscription cancellation
      if (subscriptionId) {
        await supabase.from("pro_subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);

        // Revoke 'pro' role from the user
        if (customerId) {
          const userId = await getTavvyUserId(customerId);
          if (userId) {
            await revokeProRole(userId, "Subscription cancelled");
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[Webhook] Error:", e);
    return new Response(`Webhook handler error: ${String(e)}`, { status: 500 });
  }
});
