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

// eCard Premium Price IDs for identification
const ECARD_PRICE_MONTHLY = 'price_1Ssp3yIeV9jtGwIXAI2xbGZx';
const ECARD_PRICE_ANNUAL = 'price_1SswRRIeV9jtGwIXUCSIVRP6';

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
    console.error("Webhook signature verification failed:", err.message);
    return new Response(err.message, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string;
        const subscriptionType = session.metadata?.subscription_type;

        // Only handle eCard Premium subscriptions
        if (subscriptionType !== 'ecard_premium') {
          console.log('Not an eCard subscription, skipping');
          break;
        }

        if (!userId || !subscriptionId) {
          throw new Error("Missing user ID or subscription ID");
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const planType = session.metadata?.plan_type || 'monthly';
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

        // Check if user already has an eCard subscription
        const { data: existingSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('plan_type', planType === 'annual' ? 'ecard_premium_annual' : 'ecard_premium_monthly')
          .single();

        if (existingSub) {
          // Update existing subscription
          await supabaseAdmin
            .from('user_subscriptions')
            .update({
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: currentPeriodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSub.id);
        } else {
          // Create new subscription record
          await supabaseAdmin.from('user_subscriptions').insert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscriptionId,
            plan_type: planType === 'annual' ? 'ecard_premium_annual' : 'ecard_premium_monthly',
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: currentPeriodEnd.toISOString(),
          });
        }

        // Update user's profile to mark as Pro
        await supabaseAdmin
          .from('profiles')
          .update({ 
            is_pro: true,
            pro_since: new Date().toISOString(),
          })
          .eq('id', userId);

        console.log(`eCard Premium subscription created for user ${userId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;
        const status = subscription.status;

        // Check if this is an eCard subscription
        const { data: subRecord } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id, user_id, plan_type')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (!subRecord || !subRecord.plan_type?.includes('ecard_premium')) {
          console.log('Not an eCard subscription, skipping');
          break;
        }

        // Update subscription status
        await supabaseAdmin
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
        await supabaseAdmin
          .from('profiles')
          .update({ is_pro: isPro })
          .eq('id', subRecord.user_id);

        console.log(`eCard subscription ${subscriptionId} updated to status: ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const subscriptionId = subscription.id;

        // Check if this is an eCard subscription
        const { data: subRecord } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id, user_id, plan_type')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (!subRecord || !subRecord.plan_type?.includes('ecard_premium')) {
          console.log('Not an eCard subscription, skipping');
          break;
        }

        // Update subscription to canceled
        await supabaseAdmin
          .from('user_subscriptions')
          .update({ 
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        // Check if user has any other active subscriptions
        const { data: otherSubs } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', subRecord.user_id)
          .in('status', ['active', 'trialing'])
          .neq('stripe_subscription_id', subscriptionId);

        // Only remove Pro status if no other active subscriptions
        if (!otherSubs || otherSubs.length === 0) {
          await supabaseAdmin
            .from('profiles')
            .update({ is_pro: false })
            .eq('id', subRecord.user_id);
        }

        console.log(`eCard subscription ${subscriptionId} canceled`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Check if this is an eCard subscription
        const { data: subRecord } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id, plan_type')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (!subRecord || !subRecord.plan_type?.includes('ecard_premium')) {
          break;
        }

        // Update status to past_due
        await supabaseAdmin
          .from('user_subscriptions')
          .update({ 
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);

        console.log(`Payment failed for eCard subscription ${subscriptionId}`);
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
