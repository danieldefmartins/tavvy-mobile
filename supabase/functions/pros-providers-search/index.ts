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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { categorySlug, query, city, state, zipCode, limit = 10, offset = 0 } = await req.json();

    let queryBuilder = supabaseAdmin.from('pro_providers').select('*, service_categories(*)', { count: 'exact' });

    if (categorySlug) {
        queryBuilder = queryBuilder.eq('service_categories.slug', categorySlug);
    }

    if (query) {
        queryBuilder = queryBuilder.textSearch('fts', query);
    }

    if (city) {
        queryBuilder = queryBuilder.ilike('city', `%${city}%`);
    }

    if (state) {
        queryBuilder = queryBuilder.eq('state', state);
    }

    if (zipCode) {
        queryBuilder = queryBuilder.eq('zip_code', zipCode);
    }

    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ providers: data, total: count }),
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
