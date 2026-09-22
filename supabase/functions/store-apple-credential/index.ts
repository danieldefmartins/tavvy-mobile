import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Stores the Apple refresh token that Supabase hands the client right after a
 * Sign in with Apple session is established (`session.provider_refresh_token`).
 * delete-account later exchanges it with Apple's /auth/revoke endpoint
 * (Apple Guideline 5.1.1(v)). The table is service-role only, so the client
 * cannot read tokens back; it can only submit its own, for the signed-in user.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ status: "error", message: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ status: "error", message: "Missing Authorization header." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: { user }, error: userError } = await callerClient.auth.getUser();
  if (userError || !user) return json({ status: "error", message: "Could not verify the calling session." }, 401);

  // Only accept a token for an identity that really is an Apple identity of
  // this user; anything else is discarded without error detail.
  const hasAppleIdentity = (user.identities ?? []).some((identity) => identity.provider === "apple");
  if (!hasAppleIdentity) return json({ status: "ignored" });

  let body: { providerRefreshToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ status: "error", message: "Invalid JSON body." }, 400);
  }
  const token = body.providerRefreshToken;
  if (typeof token !== "string" || token.length < 16 || token.length > 4096) {
    return json({ status: "error", message: "Missing providerRefreshToken." }, 400);
  }

  const { error } = await admin.from("user_apple_credentials").upsert({
    user_id: user.id,
    provider_refresh_token: token,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) {
    console.error("[store-apple-credential] Upsert failed:", error);
    return json({ status: "error", message: "Could not store the credential." }, 500);
  }
  return json({ status: "ok" });
});
