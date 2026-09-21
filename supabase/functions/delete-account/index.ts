import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleDeleteAccount, checkAccountDeletionAvailability } from "./handler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ status: "error", code: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const result = url.searchParams.get("mode") === "check"
    ? await checkAccountDeletionAvailability()
    : await handleDeleteAccount(req);
  const status = result.status === "error" ? 400 : 200;

  return new Response(JSON.stringify(result), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
