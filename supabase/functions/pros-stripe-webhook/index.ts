import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.12.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  // @ts-ignore
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

/**
 * Sync pro_providers and profiles tables when subscription status changes.
 * Ensures payment failures, cancellations, and renewals propagate to pro access.
 */
async function syncProviderStatus(stripeSubscriptionId: string, status: string, endDate: string | null) {
  try {
    const { data: sub } = await supabaseAdmin
      .from("pro_subscriptions")
      .select("provider_id")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .single();

    if (!sub) return;

    const isActive = status === "active" || status === "trialing";

    const providerUpdate: Record<string, any> = {
      subscription_status: status,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };
    if (endDate) {
      providerUpdate.subscription_expires_at = endDate;
    }

    const { data: provider } = await supabaseAdmin
      .from("pro_providers")
      .update(providerUpdate)
      .eq("id", sub.provider_id)
      .select("user_id")
      .single();

    if (!provider?.user_id) return;

    await supabaseAdmin
      .from("profiles")
      .update({
        is_pro: isActive,
        subscription_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", provider.user_id);

    console.log(`Synced provider ${sub.provider_id}: status=${status}, is_active=${isActive}`);
  } catch (error) {
    console.error("Error syncing provider status:", error);
  }
}

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }

  console.log(`Processing Stripe event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (!userId || !subscriptionId) {
          throw new Error("Missing user ID or subscription ID");
        }

        // Get the provider for this user
        const { data: provider } = await supabaseAdmin
          .from("pro_providers")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (!provider) {
          throw new Error(`Provider not found for user: ${userId}`);
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const endDate = new Date(subscription.current_period_end * 1000).toISOString();

        // Upsert pro_subscriptions
        const { data: existingSub } = await supabaseAdmin
          .from("pro_subscriptions")
          .select("id")
          .eq("provider_id", provider.id)
          .single();

        if (existingSub) {
          await supabaseAdmin.from("pro_subscriptions").update({
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            status: "active",
            start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            end_date: endDate,
            updated_at: new Date().toISOString(),
          }).eq("id", existingSub.id);
        } else {
          await supabaseAdmin.from("pro_subscriptions").insert({
            provider_id: provider.id,
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: customerId,
            status: "active",
            tier: "early_adopter",
            price_per_year: 99.00,
            start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            end_date: endDate,
          });
        }

        // Activate the pro
        await syncProviderStatus(subscriptionId, "active", endDate);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const status = subscription.status === "canceled" ? "cancelled" : subscription.status;
        const endDate = new Date(subscription.current_period_end * 1000).toISOString();

        await supabaseAdmin.from("pro_subscriptions").update({
          status,
          end_date: endDate,
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscriptionId);

        await syncProviderStatus(subscriptionId, status, endDate);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        await supabaseAdmin.from("pro_subscriptions").update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscriptionId);

        await syncProviderStatus(subscriptionId, "cancelled", null);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        const subscriptionId = invoice.subscription as string;

        await supabaseAdmin.from("pro_subscriptions").update({
          status: "active",
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscriptionId);

        await syncProviderStatus(subscriptionId, "active", null);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;
        const subscriptionId = invoice.subscription as string;

        await supabaseAdmin.from("pro_subscriptions").update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        }).eq("stripe_subscription_id", subscriptionId);

        await syncProviderStatus(subscriptionId, "past_due", null);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
