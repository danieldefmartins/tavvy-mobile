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
  receipt?: { bundle_id?: string };
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
    if (typeof productId !== "string" || typeof transactionReceipt !== "string" || !productId || !transactionReceipt) {
      return new Response(JSON.stringify({ status: "error", message: "Missing productId or transactionReceipt." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (![...ECARD_PRODUCT_IDS, ...PROS_PRODUCT_IDS].includes(productId)) {
      return new Response(JSON.stringify({ status: "error", message: "Unknown product ID." }), {
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

    if (result.receipt?.bundle_id !== "com.360.tavvy") {
      return new Response(JSON.stringify({ status: "error", message: "Receipt is for a different app." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const entry = result.latest_receipt_info
      ?.filter((e) => e.product_id === productId && e.original_transaction_id && Number.isFinite(Number(e.expires_date_ms)))
      .sort((a, b) => Number(b.expires_date_ms) - Number(a.expires_date_ms))[0];
    if (!entry) {
      return new Response(JSON.stringify({ status: "error", message: "Receipt does not contain this subscription." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expiresAt = new Date(Number(entry.expires_date_ms)).toISOString();
    const isActive = new Date(expiresAt).getTime() > Date.now();
    if (!isActive) {
      return new Response(JSON.stringify({ status: "error", message: "This subscription has expired." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Never move an existing Apple transaction from one Tavvy account to
    // another. The unique transaction indexes also reject a concurrent claim.
    const [{ data: ecardOwner, error: ecardOwnerError }, { data: prosOwner, error: prosOwnerError }] = await Promise.all([
      admin.from("user_subscriptions").select("user_id").eq("apple_original_transaction_id", entry.original_transaction_id).maybeSingle(),
      admin.from("pro_providers").select("user_id").eq("apple_original_transaction_id", entry.original_transaction_id).maybeSingle(),
    ]);
    if (ecardOwnerError || prosOwnerError) throw ecardOwnerError ?? prosOwnerError;
    if ((ecardOwner && ecardOwner.user_id !== user.id) || (prosOwner && prosOwner.user_id !== user.id)) {
      return new Response(JSON.stringify({ status: "error", message: "This Apple subscription is linked to another Tavvy account." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ECARD_PRODUCT_IDS.includes(productId)) {
      const planType = productId.endsWith(".annual") ? "ecard_premium_annual" : "ecard_premium_monthly";
      const subscription = {
          user_id: user.id,
          plan_type: planType,
          status: "active",
          current_period_end: expiresAt,
          source: "apple",
          apple_original_transaction_id: entry.original_transaction_id,
          apple_product_id: productId,
          updated_at: new Date().toISOString(),
      };
      const { data: existing, error: existingError } = await admin.from("user_subscriptions")
        .select("id").eq("user_id", user.id).like("plan_type", "ecard_premium%").maybeSingle();
      if (existingError) throw existingError;
      if (existing) {
        const { data, error } = await admin.from("user_subscriptions").update(subscription)
          .eq("id", existing.id).select("id");
        if (error || !data?.length) throw error ?? new Error("Subscription row was not updated.");
      } else {
        const { error } = await admin.from("user_subscriptions").insert(subscription);
        if (error) throw error;
      }
      const { data: profileRows, error: profileError } = await admin.from("profiles").update({
        is_pro: true,
        pro_since: new Date().toISOString(),
        subscription_status: "active",
        subscription_plan: planType,
        subscription_expires_at: expiresAt,
      }).eq("user_id", user.id).select("user_id");
      if (profileError || !profileRows?.length) throw profileError ?? new Error("Profile row was not updated.");
      const { error: roleError } = await admin.from("user_roles").upsert({
        user_id: user.id,
        role: "pro",
        notes: `eCard Premium Apple subscription: ${entry.original_transaction_id}`,
        granted_at: new Date().toISOString(),
      }, { onConflict: "user_id,role" });
      if (roleError) throw roleError;
    } else if (PROS_PRODUCT_IDS.includes(productId)) {
      const { data, error } = await admin.from("pro_providers").update({
        subscription_status: "active",
        subscription_plan: "founding",
        subscription_expires_at: expiresAt,
        subscription_source: "apple",
        apple_original_transaction_id: entry.original_transaction_id,
        is_active: true,
      }).eq("user_id", user.id).select("user_id");
      if (error || !data?.length) throw error ?? new Error("Pros account was not updated.");
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
