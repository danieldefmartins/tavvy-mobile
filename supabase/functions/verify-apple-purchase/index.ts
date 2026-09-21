import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Must match lib/iapConfig.ts on the client. Duplicated here because Edge
// Functions run in a separate Deno isolate and cannot import RN app code.
const ECARD_PRODUCT_IDS = ["com.360.tavvy.ecard.pro.monthly", "com.360.tavvy.ecard.pro.annual"];
const PROS_PRODUCT_IDS = ["com.360.tavvy.pros.founding.annual"];

const APPLE_VERIFY_PROD = "https://buy.itunes.apple.com/verifyReceipt";
const APPLE_VERIFY_SANDBOX = "https://sandbox.itunes.apple.com/verifyReceipt";

interface AppleVerifyResponse {
  status: number;
  latest_receipt_info?: Array<{
    product_id: string;
    original_transaction_id: string;
    expires_date_ms: string;
  }>;
}

async function callAppleVerify(url: string, receiptData: string, sharedSecret: string): Promise<AppleVerifyResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ "receipt-data": receiptData, password: sharedSecret, "exclude-old-transactions": true }),
  });
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ status: "error", message: "Missing Authorization header." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const sharedSecret = Deno.env.get("APPLE_SHARED_SECRET");

  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: { user }, error: userError } = await callerClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ status: "error", message: "Could not verify the calling session." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!sharedSecret) {
    console.error("[verify-apple-purchase] APPLE_SHARED_SECRET not configured.");
    return new Response(JSON.stringify({ status: "error", message: "Purchase verification is not configured yet." }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { productId, transactionReceipt } = await req.json();
    if (!productId || !transactionReceipt) {
      return new Response(JSON.stringify({ status: "error", message: "Missing productId or transactionReceipt." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result = await callAppleVerify(APPLE_VERIFY_PROD, transactionReceipt, sharedSecret);
    if (result.status === 21007) {
      // Sandbox receipt sent to the production endpoint — standard Apple pattern.
      result = await callAppleVerify(APPLE_VERIFY_SANDBOX, transactionReceipt, sharedSecret);
    }
    if (result.status !== 0) {
      return new Response(JSON.stringify({ status: "error", message: `Apple verification failed (status ${result.status}).` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const entry = result.latest_receipt_info?.find((e) => e.product_id === productId);
    if (!entry) {
      return new Response(JSON.stringify({ status: "error", message: "Receipt does not contain this product." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(Number(entry.expires_date_ms)).toISOString();
    const isActive = new Date(expiresAt).getTime() > Date.now();

    if (ECARD_PRODUCT_IDS.includes(productId)) {
      const planType = productId.endsWith(".annual") ? "annual" : "monthly";
      const { error } = await admin.from("user_subscriptions").upsert(
        {
          user_id: user.id,
          plan_type: planType,
          status: isActive ? "active" : "expired",
          current_period_end: expiresAt,
          source: "apple",
          apple_original_transaction_id: entry.original_transaction_id,
          apple_product_id: productId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "apple_original_transaction_id" },
      );
      if (error) throw error;
      await admin.from("profiles").update({
        subscription_status: isActive ? "active" : "expired",
        subscription_plan: "pro",
        subscription_expires_at: expiresAt,
      }).eq("user_id", user.id);
    } else if (PROS_PRODUCT_IDS.includes(productId)) {
      const { error } = await admin.from("pro_providers").update({
        subscription_status: isActive ? "active" : "expired",
        subscription_plan: "founding",
        subscription_expires_at: expiresAt,
        subscription_source: "apple",
        apple_original_transaction_id: entry.original_transaction_id,
        is_active: isActive,
      }).eq("user_id", user.id);
      if (error) throw error;
    } else {
      return new Response(JSON.stringify({ status: "error", message: "Unknown product ID." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "ok", expiresAt, isActive }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[verify-apple-purchase] Failed:", error);
    return new Response(JSON.stringify({ status: "error", message: "Verification failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
