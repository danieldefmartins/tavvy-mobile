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
    const fieldMap: Record<string, string> = {
      businessName: 'business_name',
      description: 'description',
      phone: 'phone',
      email: 'email',
      website: 'website',
      address: 'address',
      city: 'city',
      state: 'state',
      zipCode: 'zip_code',
      serviceRadius: 'service_radius',
      yearsInBusiness: 'years_in_business',
      licenseNumber: 'license_number',
      isInsured: 'is_insured',
      tradeCategory: 'trade_category',
      specialties: 'specialties',
      location: 'location',
      bio: 'bio',
      profilePhotoUrl: 'profile_photo_url',
      coverPhotoUrl: 'cover_photo_url',
    };

    const dbUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const [key, value] of Object.entries(form)) {
      const dbKey = fieldMap[key] || key;
      dbUpdate[dbKey] = value;
    }

    const { data, error } = await supabase
      .from('pro_providers')
      .update(dbUpdate)
      .eq('user_id', user.id)
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
