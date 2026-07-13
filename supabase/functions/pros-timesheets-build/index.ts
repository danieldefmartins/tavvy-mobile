// Supabase Edge Function: pros-timesheets-build
// Rolls closed time entries in a pay period into per-employee timesheets, with
// weekly overtime (hours over 40 in a 7-day workweek = ot_multiplier pay).
//
// Assumptions (documented for later refinement):
//   - Workweeks are 7-day buckets starting from the pay period's starts_on
//     (a weekly period = 1 bucket; biweekly = 2). Good default; MA lets the
//     employer define the workweek, which we can make configurable later.
//   - Only 'closed' entries count. Salary employees get hours but gross_pay = 0
//     (salary is handled in the payroll system, not accrued hourly here).
//   - Approved/exported timesheets are NOT overwritten (idempotent re-runs).

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAY_MS = 86_400_000
const WEEK_MS = 7 * DAY_MS

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
    if (!b.employer_id || !b.pay_period_id) throw new Error('employer_id and pay_period_id are required')

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: provider } = await admin
      .from('pro_providers').select('id').eq('id', b.employer_id).eq('user_id', user.id).single()
    if (!provider) throw new Error('Only the employer can build timesheets')

    const { data: period } = await admin
      .from('pro_pay_periods').select('id, starts_on, ends_on')
      .eq('id', b.pay_period_id).eq('employer_id', b.employer_id).single()
    if (!period) throw new Error('Pay period not found')

    const periodStart = new Date(period.starts_on + 'T00:00:00Z').getTime()
    // ends_on is inclusive → add a day for an exclusive upper bound
    const periodEnd = new Date(period.ends_on + 'T00:00:00Z').getTime() + DAY_MS

    // Active employees with pay info
    const { data: employees } = await admin
      .from('pro_employees')
      .select('id, full_name, pay_type, pay_rate, ot_multiplier')
      .eq('employer_id', b.employer_id)
      .eq('status', 'active')
    if (!employees || employees.length === 0) {
      return new Response(JSON.stringify({ success: true, timesheets: [], note: 'No active employees' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    // Closed entries in range
    const { data: entries } = await admin
      .from('pro_time_entries')
      .select('employee_id, clock_in_at, clock_out_at, break_minutes')
      .eq('employer_id', b.employer_id)
      .eq('status', 'closed')
      .gte('clock_in_at', new Date(periodStart).toISOString())
      .lt('clock_in_at', new Date(periodEnd).toISOString())

    // Bucket worked hours per employee per 7-day workweek
    const perEmp = new Map<string, number[]>() // employee_id -> [weekHours...]
    const weekIndex = (t: number) => Math.floor((t - periodStart) / WEEK_MS)
    for (const e of entries ?? []) {
      if (!e.clock_out_at) continue
      const worked = Math.max(
        0,
        (new Date(e.clock_out_at).getTime() - new Date(e.clock_in_at).getTime()) / 3_600_000 - (e.break_minutes ?? 0) / 60
      )
      const wi = Math.max(0, weekIndex(new Date(e.clock_in_at).getTime()))
      const arr = perEmp.get(e.employee_id) ?? []
      arr[wi] = (arr[wi] ?? 0) + worked
      perEmp.set(e.employee_id, arr)
    }

    const results: any[] = []
    for (const emp of employees) {
      const weeks = perEmp.get(emp.id) ?? []
      let reg = 0, ot = 0
      for (const wh of weeks) {
        if (!wh) continue
        reg += Math.min(wh, 40)
        ot += Math.max(0, wh - 40)
      }
      reg = Math.round(reg * 100) / 100
      ot = Math.round(ot * 100) / 100
      const rate = emp.pay_type === 'hourly' ? Number(emp.pay_rate ?? 0) : 0
      const otMult = Number(emp.ot_multiplier ?? 1.5)
      const gross = Math.round((reg * rate + ot * rate * otMult) * 100) / 100

      // Don't clobber an already-approved/exported sheet
      const { data: existing } = await admin
        .from('pro_timesheets').select('id, status')
        .eq('employee_id', emp.id).eq('pay_period_id', b.pay_period_id).maybeSingle()
      if (existing && ['approved', 'exported'].includes(existing.status)) {
        results.push({ employee_id: emp.id, full_name: emp.full_name, reg_hours: reg, ot_hours: ot, gross_pay: gross, status: existing.status, skipped: true })
        continue
      }

      const { data: saved, error: upErr } = await admin
        .from('pro_timesheets')
        .upsert(
          { employer_id: b.employer_id, employee_id: emp.id, pay_period_id: b.pay_period_id,
            reg_hours: reg, ot_hours: ot, gross_pay: gross, status: 'draft' },
          { onConflict: 'employee_id,pay_period_id' }
        )
        .select().single()
      if (upErr) throw new Error(upErr.message)
      results.push({ ...saved, full_name: emp.full_name })
    }

    return new Response(JSON.stringify({ success: true, timesheets: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
