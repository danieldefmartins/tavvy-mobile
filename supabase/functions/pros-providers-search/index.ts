import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req ) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { categorySlug, query, city, state, zipCode, limit = 10, offset = 0 } = await req.json();

    // Start building the query
    let queryBuilder = supabaseAdmin
      .from('pro_providers')
      .select('*, service_categories!inner(*)', { count: 'exact' });

    // Filter by category slug if provided
    if (categorySlug && categorySlug !== 'all') {
        queryBuilder = queryBuilder.eq('service_categories.slug', categorySlug);
    }

    // Filter by search query (FTS)
    if (query) {
        queryBuilder = queryBuilder.ilike('business_name', `%${query}%`);
    }

    // Filter by location
    if (city) {
        queryBuilder = queryBuilder.ilike('city', `%${city}%`);
    }

    if (state) {
        queryBuilder = queryBuilder.eq('state', state);
    }

    if (zipCode) {
        queryBuilder = queryBuilder.eq('zip_code', zipCode);
    }

    // Ensure provider is active
    queryBuilder = queryBuilder.eq('is_active', true);

    // Pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Search error:', error);
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
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
