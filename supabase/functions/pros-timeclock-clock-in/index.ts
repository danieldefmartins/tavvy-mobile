// Supabase Edge Function: pros-timeclock-clock-in
// Opens a time entry for a crew member.
//
// Two modes:
//   - self  (default): the authenticated user IS the employee (mobile GPS clock-in).
//   - kiosk (PIN):      the authenticated user is the EMPLOYER (shop tablet), and a
//                       worker punches their PIN — { employer_id, pin } resolves the
//                       employee. Generalizes the kiw_shop_workers shop-tablet flow.
//
// Security: the employee is always derived server-side (from auth or PIN), never
// trusted from the client. Writes use the service-role client so offline/kiosk
// timestamps are accepted; the RLS insert policy remains a defense-in-depth guard
// for any direct client insert.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClockInRequest {
  employer_id?: string   // required if the user works for >1 employer, or for kiosk mode
  job_id?: string        // worksite; enables geofence check
  lat?: number
  lng?: number
  pin?: string           // kiosk mode
  note?: string
  // clock_in_at lets the mobile app replay an offline-queued punch (ISO string).
  clock_in_at?: string
}

// Haversine distance in meters between two lat/lng points.
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
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

    const body: ClockInRequest = await req.json().catch(() => ({}))

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ---- Resolve which employee is clocking in -------------------------------
    let employee: { id: string; employer_id: string; full_name: string } | null = null
    let source: 'self' | 'kiosk' = 'self'

    if (body.pin) {
      // Kiosk/PIN mode: caller must be the employer (owner) of employer_id.
      if (!body.employer_id) throw new Error('employer_id is required for PIN clock-in')
      const { data: provider } = await admin
        .from('pro_providers')
        .select('id')
        .eq('id', body.employer_id)
        .eq('user_id', user.id)
        .single()
      if (!provider) throw new Error('Only the employer can run kiosk clock-in')

      const { data: emp } = await admin
        .from('pro_employees')
        .select('id, employer_id, full_name')
        .eq('employer_id', body.employer_id)
        .eq('pin', body.pin)
        .eq('status', 'active')
        .single()
      if (!emp) throw new Error('Invalid PIN')
      employee = emp
      source = 'kiosk'
    } else {
      // Self mode: the authenticated user is the employee.
      let q = admin
        .from('pro_employees')
        .select('id, employer_id, full_name')
        .eq('auth_user_id', user.id)
        .eq('status', 'active')
      if (body.employer_id) q = q.eq('employer_id', body.employer_id)
      const { data: emps, error: empErr } = await q
      if (empErr) throw new Error(empErr.message)
      if (!emps || emps.length === 0) throw new Error('No active employee record for this user')
      if (emps.length > 1) throw new Error('Multiple employers — please pass employer_id')
      employee = emps[0]
    }

    // ---- Guard: only one open entry per employee -----------------------------
    const { data: openEntry } = await admin
      .from('pro_time_entries')
      .select('id, clock_in_at')
      .eq('employee_id', employee.id)
      .eq('status', 'open')
      .maybeSingle()
    if (openEntry) {
      throw new Error('Already clocked in. Clock out before starting a new entry.')
    }

    // ---- Optional geofence check against the job -----------------------------
    let inGeofence: boolean | null = null
    let job: { id: string; lat: number | null; lng: number | null; geofence_radius_m: number } | null = null
    if (body.job_id) {
      const { data: j } = await admin
        .from('pro_jobs')
        .select('id, employer_id, lat, lng, geofence_radius_m')
        .eq('id', body.job_id)
        .eq('employer_id', employee.employer_id)
        .single()
      if (!j) throw new Error('Job not found for this employer')
      job = j
      if (j.lat != null && j.lng != null && body.lat != null && body.lng != null) {
        const dist = distanceMeters(Number(j.lat), Number(j.lng), body.lat, body.lng)
        inGeofence = dist <= (j.geofence_radius_m ?? 150)
      }
    }

    // ---- Insert the open entry ----------------------------------------------
    const clockInAt = body.clock_in_at ? new Date(body.clock_in_at).toISOString() : new Date().toISOString()
    const { data: entry, error: insErr } = await admin
      .from('pro_time_entries')
      .insert({
        employer_id: employee.employer_id,
        employee_id: employee.id,
        job_id: job?.id ?? null,
        clock_in_at: clockInAt,
        clock_in_lat: body.lat ?? null,
        clock_in_lng: body.lng ?? null,
        in_geofence: inGeofence,
        source,
        note: body.note ?? null,
        status: 'open',
      })
      .select()
      .single()
    if (insErr) throw new Error(`Failed to clock in: ${insErr.message}`)

    return new Response(
      JSON.stringify({ success: true, entry, employee_name: employee.full_name, in_geofence: inGeofence }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('clock-in error:', error)
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
