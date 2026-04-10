import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
      throw new Error("User not found");
    }

    const form = await req.json();

    // Map camelCase client fields to snake_case database columns
    const dbRecord: Record<string, any> = {
      user_id: user.id,
      business_name: form.businessName || form.business_name,
      description: form.description,
      phone: form.phone,
      email: form.email || user.email,
      website: form.website,
      address: form.address,
      city: form.city,
      state: form.state,
      zip_code: form.zipCode || form.zip_code,
      service_radius: form.serviceRadius || form.service_radius || 25,
      years_in_business: form.yearsInBusiness || form.years_in_business || null,
      license_number: form.licenseNumber || form.license_number || null,
      location: form.location || (form.city && form.state ? `${form.city}, ${form.state}` : null),
      is_insured: form.isInsured || form.is_insured || false,
      trade_category: form.tradeCategory || form.trade_category || null,
      is_active: true,
    };

    // Remove undefined/null optional fields to avoid overwriting defaults
    Object.keys(dbRecord).forEach(key => {
      if (dbRecord[key] === undefined) delete dbRecord[key];
    });

    const { data, error } = await supabase
      .from('pro_providers')
      .insert(dbRecord)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
