import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.12.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// eCard Premium Price IDs
const ECARD_PRICE_MONTHLY = 'price_1Ssp3yIeV9jtGwIXAI2xbGZx'; // $4.99/month
const ECARD_PRICE_ANNUAL = 'price_1SswRRIeV9jtGwIXUCSIVRP6';  // $39.99/year

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // @ts-ignore
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } }
      }
    )

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get request body for plan type
    const { plan_type = 'monthly' } = await req.json();
    
    // Select price based on plan type
    const priceId = plan_type === 'annual' ? ECARD_PRICE_ANNUAL : ECARD_PRICE_MONTHLY;
    
    // Check if user already has a Stripe customer ID
    const { data: existingCustomer } = await supabase
      .from('stripe_customer_mapping')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = existingCustomer?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer mapping
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabaseAdmin.from('stripe_customer_mapping').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
      });
    }

    // Create checkout session with 7-day free trial
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `tavvy://ecard/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `tavvy://ecard/premium/cancel`,
      client_reference_id: user.id,
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: user.id,
          subscription_type: 'ecard_premium',
          plan_type: plan_type,
        }
      },
      metadata: {
        user_id: user.id,
        subscription_type: 'ecard_premium',
        plan_type: plan_type,
      }
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
