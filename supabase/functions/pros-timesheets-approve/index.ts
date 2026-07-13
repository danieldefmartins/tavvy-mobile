// Supabase Edge Function: pros-timesheets-approve
// Employer approves one timesheet (timesheet_id) or all drafts in a pay period.
// Optionally locks the pay period so entries can no longer shift under it.

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
    if (!b.timesheet_id && !b.pay_period_id) throw new Error('Provide timesheet_id or pay_period_id')

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: provider } = await admin
      .from('pro_providers').select('id').eq('id', b.employer_id).eq('user_id', user.id).single()
    if (!provider) throw new Error('Only the employer can approve timesheets')

    const patch = { status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }
    let q = admin.from('pro_timesheets').update(patch).eq('employer_id', b.employer_id)
    if (b.timesheet_id) q = q.eq('id', b.timesheet_id)
    else q = q.eq('pay_period_id', b.pay_period_id).in('status', ['draft', 'submitted'])

    const { data: approved, error } = await q.select('id, employee_id, reg_hours, ot_hours, gross_pay, status')
    if (error) throw new Error(error.message)

    if (b.lock_period && b.pay_period_id) {
      await admin.from('pro_pay_periods')
        .update({ is_locked: true, locked_at: new Date().toISOString() })
        .eq('id', b.pay_period_id).eq('employer_id', b.employer_id)
    }

    return new Response(JSON.stringify({ success: true, approved, count: approved?.length ?? 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
