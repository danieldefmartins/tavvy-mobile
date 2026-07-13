// Supabase Edge Function: pros-employee-accept-invite
// The authenticated crew member links their login to any 'invited' employee rows
// matching their email (across employers). Sets auth_user_id + status 'active'.

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
    if (!user.email) throw new Error('Your account has no email to match an invite')

    const b = await req.json().catch(() => ({}))
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    let q = admin
      .from('pro_employees')
      .update({ auth_user_id: user.id, status: 'active' })
      .is('auth_user_id', null)
      .ilike('email', user.email)
    if (b.employer_id) q = q.eq('employer_id', b.employer_id)

    const { data: linked, error } = await q.select('id, employer_id, full_name')
    if (error) throw new Error(error.message)
    if (!linked || linked.length === 0) throw new Error('No pending invite found for your email')

    return new Response(JSON.stringify({ success: true, linked }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
