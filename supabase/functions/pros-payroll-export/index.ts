// Supabase Edge Function: pros-payroll-export
// Exports APPROVED timesheets for a pay period. target='csv' returns a CSV string
// (ships now); target='quickbooks' returns a structured payload + a clear note
// that per-employer QB OAuth is not wired yet (Phase 3). Records the export.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
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
    if (!b.employer_id || !b.pay_period_id) throw new Error('employer_id and pay_period_id are required')
    const target = b.target === 'quickbooks' ? 'quickbooks' : 'csv'

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: provider } = await admin
      .from('pro_providers').select('id, business_name').eq('id', b.employer_id).eq('user_id', user.id).single()
    if (!provider) throw new Error('Only the employer can export payroll')

    const { data: period } = await admin
      .from('pro_pay_periods').select('id, starts_on, ends_on')
      .eq('id', b.pay_period_id).eq('employer_id', b.employer_id).single()
    if (!period) throw new Error('Pay period not found')

    const { data: sheets } = await admin
      .from('pro_timesheets')
      .select('reg_hours, ot_hours, gross_pay, status, employee:pro_employees(full_name, classification, pay_rate, pay_type)')
      .eq('employer_id', b.employer_id).eq('pay_period_id', b.pay_period_id).eq('status', 'approved')

    if (!sheets || sheets.length === 0) throw new Error('No approved timesheets to export for this period')

    const rows = sheets.map((s: any) => ({
      employee: s.employee?.full_name ?? '',
      classification: s.employee?.classification ?? '',
      pay_type: s.employee?.pay_type ?? 'hourly',
      rate: s.employee?.pay_rate ?? '',
      reg_hours: s.reg_hours, ot_hours: s.ot_hours, gross_pay: s.gross_pay,
    }))

    const header = ['Employee', 'Classification', 'Pay Type', 'Rate', 'Reg Hours', 'OT Hours', 'Gross Pay']
    const csv = [
      `# ${provider.business_name} — Payroll ${period.starts_on} to ${period.ends_on}`,
      header.join(','),
      ...rows.map((r) => [r.employee, r.classification, r.pay_type, r.rate, r.reg_hours, r.ot_hours, r.gross_pay].map(csvCell).join(',')),
    ].join('\n')

    const totals = rows.reduce(
      (acc, r) => ({ reg: acc.reg + Number(r.reg_hours || 0), ot: acc.ot + Number(r.ot_hours || 0), gross: acc.gross + Number(r.gross_pay || 0) }),
      { reg: 0, ot: 0, gross: 0 }
    )

    const payload = target === 'csv'
      ? { csv, rows, totals }
      : { rows, totals, note: 'QuickBooks per-employer OAuth is not wired yet (Phase 3). This is the structured payload that will POST to QB Payroll.' }

    const { data: exp } = await admin
      .from('pro_payroll_exports')
      .insert({ employer_id: b.employer_id, pay_period_id: b.pay_period_id, target, payload, status: 'exported', exported_by: user.id, exported_at: new Date().toISOString() })
      .select('id').single()

    // Mark exported sheets so they're not double-run
    await admin.from('pro_timesheets')
      .update({ status: 'exported' })
      .eq('employer_id', b.employer_id).eq('pay_period_id', b.pay_period_id).eq('status', 'approved')

    return new Response(JSON.stringify({ success: true, target, export_id: exp?.id, ...payload }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
