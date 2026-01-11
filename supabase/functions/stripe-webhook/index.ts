import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const INTRO_PRICE = Deno.env.get("STRIPE_PRICE_INTRO")!;
const RENEW_PRICE = Deno.env.get("STRIPE_PRICE_RENEW")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
      const placeId = session.metadata?.place_id as string | undefined;

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
    }

    if (type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription as string | undefined;
      if (subscriptionId) {
        await supabase.from("pro_subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    if (type === "invoice.paid") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription as string | undefined;
      if (subscriptionId) {
        await supabase.from("pro_subscriptions")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    if (type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const subscriptionId = sub.id as string | undefined;
      if (subscriptionId) {
        await supabase.from("pro_subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(`Webhook handler error: ${String(e)}`, { status: 500 });
  }
});