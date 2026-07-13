// Supabase Edge Function: pros-jobs-save
// Create or update a worksite/job (employer only). Geofence + job-costing inputs.
// List is done client-side via RLS (pro_jobs_employer_all).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const b = await req.json()
    if (!b.employer_id) throw new Error('employer_id is required')
    if (!b.id && !b.name) throw new Error('name is required')

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // Verify caller owns this employer
    const { data: provider } = await admin
      .from('pro_providers').select('id').eq('id', b.employer_id).eq('user_id', user.id).single()
    if (!provider) throw new Error('Only the employer can manage jobs')

    const fields: Record<string, unknown> = {
      name: b.name, customer_name: b.customer_name ?? null, address: b.address ?? null,
      lat: b.lat ?? null, lng: b.lng ?? null,
      geofence_radius_m: b.geofence_radius_m ?? 150,
      budget_hours: b.budget_hours ?? null, estimate_total: b.estimate_total ?? null,
      est_number: b.est_number ?? null, is_prevailing_wage: b.is_prevailing_wage ?? false,
      wage_determination: b.wage_determination ?? null, status: b.status ?? 'active',
    }
    // Drop undefined so updates only touch provided fields
    Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k])

    let job
    if (b.id) {
      const { data, error } = await admin
        .from('pro_jobs').update(fields).eq('id', b.id).eq('employer_id', b.employer_id).select().single()
      if (error) throw new Error(error.message)
      job = data
    } else {
      const { data, error } = await admin
        .from('pro_jobs').insert({ employer_id: b.employer_id, ...fields }).select().single()
      if (error) throw new Error(error.message)
      job = data
    }
    return new Response(JSON.stringify({ success: true, job }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
