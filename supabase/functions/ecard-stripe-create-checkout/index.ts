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
    let plan_type = 'monthly';
    try {
      const body = await req.json();
      plan_type = body.plan_type || 'monthly';
    } catch (e) {
      // If body parsing fails, use default
      console.log('Using default plan type');
    }
    
    // Select price based on plan type
    const priceId = plan_type === 'annual' ? ECARD_PRICE_ANNUAL : ECARD_PRICE_MONTHLY;

    // Create checkout session with 7-day free trial
    // Using the same simple pattern as the working pros-stripe-create-checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // Use HTTPS URLs that redirect to the app via universal links
      success_url: `https://tavvy.com/ecard/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://tavvy.com/ecard/premium/cancel`,
      client_reference_id: user.id,
      customer_email: user.email, // Pre-fill email for better UX
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
