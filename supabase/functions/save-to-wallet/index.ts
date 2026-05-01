import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const method = req.method;

    if (method === "POST") {
      // Save card to wallet
      const { card_id } = await req.json();
      
      if (!card_id) {
        return new Response(
          JSON.stringify({ error: "Missing card_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if already saved
      const { data: existing } = await supabase
        .from("user_wallet")
        .select("id")
        .eq("user_id", user.id)
        .eq("card_id", card_id)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ message: "Card already in wallet" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Save to wallet
      const { data, error } = await supabase
        .from("user_wallet")
        .insert({
          user_id: user.id,
          card_id: card_id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (method === "DELETE") {
      // Remove card from wallet
      const { card_id } = await req.json();
      
      if (!card_id) {
        return new Response(
          JSON.stringify({ error: "Missing card_id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("user_wallet")
        .delete()
        .eq("user_id", user.id)
        .eq("card_id", card_id);

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (method === "GET") {
      // Get user's wallet
      const { data, error } = await supabase
        .from("user_wallet")
        .select(`
          id,
          saved_at,
          pro_cards (
            id,
            slug,
            company_name,
            tagline,
            category,
            city,
            state,
            phone,
            email,
            gradient_color_1,
            gradient_color_2,
            profile_photo_url,
            verified,
            enabled_tabs,
            services
          )
        `)
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (error) {
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Wallet error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
