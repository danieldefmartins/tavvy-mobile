// Supabase Edge Function: pros-timeclock-clock-out
// Closes the currently-open time entry for a crew member.
//
// Modes mirror clock-in:
//   - self  (default): the authenticated user is the employee.
//   - kiosk (PIN):      the authenticated user is the EMPLOYER; { employer_id, pin }
//                       resolves the worker (shop-tablet flow).
//
// Returns the closed entry plus worked_hours (gross of overtime; OT is computed
// later at the timesheet roll-up, which needs the whole week).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClockOutRequest {
  employer_id?: string
  pin?: string
  lat?: number
  lng?: number
  break_minutes?: number
  note?: string
  clock_out_at?: string // offline replay
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const body: ClockOutRequest = await req.json().catch(() => ({}))

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ---- Resolve the employee (same logic as clock-in) -----------------------
    let employeeId: string | null = null

    if (body.pin) {
      if (!body.employer_id) throw new Error('employer_id is required for PIN clock-out')
      const { data: provider } = await admin
        .from('pro_providers')
        .select('id')
        .eq('id', body.employer_id)
        .eq('user_id', user.id)
        .single()
      if (!provider) throw new Error('Only the employer can run kiosk clock-out')

      const { data: emp } = await admin
        .from('pro_employees')
        .select('id')
        .eq('employer_id', body.employer_id)
        .eq('pin', body.pin)
        .eq('status', 'active')
        .single()
      if (!emp) throw new Error('Invalid PIN')
      employeeId = emp.id
    } else {
      let q = admin
        .from('pro_employees')
        .select('id, employer_id')
        .eq('auth_user_id', user.id)
        .eq('status', 'active')
      if (body.employer_id) q = q.eq('employer_id', body.employer_id)
      const { data: emps, error: empErr } = await q
      if (empErr) throw new Error(empErr.message)
      if (!emps || emps.length === 0) throw new Error('No active employee record for this user')
      if (emps.length > 1) throw new Error('Multiple employers — please pass employer_id')
      employeeId = emps[0].id
    }

    // ---- Find the open entry -------------------------------------------------
    const { data: entry, error: openErr } = await admin
      .from('pro_time_entries')
      .select('id, clock_in_at, break_minutes')
      .eq('employee_id', employeeId)
      .eq('status', 'open')
      .maybeSingle()
    if (openErr) throw new Error(openErr.message)
    if (!entry) throw new Error('No open entry to clock out')

    const clockOutAt = body.clock_out_at ? new Date(body.clock_out_at).toISOString() : new Date().toISOString()
    const breakMinutes = body.break_minutes ?? entry.break_minutes ?? 0

    if (new Date(clockOutAt).getTime() <= new Date(entry.clock_in_at).getTime()) {
      throw new Error('Clock-out time must be after clock-in time')
    }

    // ---- Close it ------------------------------------------------------------
    const { data: closed, error: updErr } = await admin
      .from('pro_time_entries')
      .update({
        clock_out_at: clockOutAt,
        clock_out_lat: body.lat ?? null,
        clock_out_lng: body.lng ?? null,
        break_minutes: breakMinutes,
        note: body.note ?? null,
        status: 'closed',
      })
      .eq('id', entry.id)
      .eq('status', 'open') // guard against a double clock-out race
      .select()
      .single()
    if (updErr) throw new Error(`Failed to clock out: ${updErr.message}`)

    const grossMs = new Date(clockOutAt).getTime() - new Date(entry.clock_in_at).getTime()
    const workedHours = Math.max(0, grossMs / 3_600_000 - breakMinutes / 60)

    return new Response(
      JSON.stringify({ success: true, entry: closed, worked_hours: Math.round(workedHours * 100) / 100 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('clock-out error:', error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
