// Supabase Edge Function: pros-employees-save
// Create/update a crew member (employer only). Creating = an "invite": the row is
// made with the employee's email + status 'invited'; the crew member later links
// their login via pros-employee-accept-invite.

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
    if (!b.id && !b.full_name) throw new Error('full_name is required')

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: provider } = await admin
      .from('pro_providers').select('id').eq('id', b.employer_id).eq('user_id', user.id).single()
    if (!provider) throw new Error('Only the employer can manage crew')

    const role = b.role && ['owner', 'foreman', 'crew'].includes(b.role) ? b.role : 'crew'
    const fields: Record<string, unknown> = {
      full_name: b.full_name, email: b.email ?? null, phone: b.phone ?? null,
      role, pay_type: b.pay_type ?? 'hourly', pay_rate: b.pay_rate ?? null,
      ot_multiplier: b.ot_multiplier ?? 1.5, classification: b.classification ?? null,
      pin: b.pin ?? null, preferred_lang: b.preferred_lang ?? 'en',
    }
    Object.keys(fields).forEach((k) => fields[k] === undefined && delete fields[k])

    let employee
    if (b.id) {
      if (b.status) fields.status = b.status
      const { data, error } = await admin
        .from('pro_employees').update(fields).eq('id', b.id).eq('employer_id', b.employer_id).select().single()
      if (error) throw new Error(error.message)
      employee = data
    } else {
      const { data, error } = await admin
        .from('pro_employees')
        .insert({ employer_id: b.employer_id, ...fields, status: 'invited', invited_at: new Date().toISOString() })
        .select().single()
      if (error) throw new Error(error.message)
      employee = data
    }
    return new Response(JSON.stringify({ success: true, employee }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
