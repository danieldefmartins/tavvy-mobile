/**
 * useMyTimesheet — a crew member's own hours for a pay period.
 * All reads are RLS-scoped to the signed-in employee (self-access policies).
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface MyEmployee { id: string; employer_id: string; full_name: string; pay_type: string; pay_rate: number | null }
export interface MyPeriod { id: string; starts_on: string; ends_on: string; is_locked: boolean }
export interface MyEntry {
  id: string; clock_in_at: string; clock_out_at: string | null; break_minutes: number;
  in_geofence: boolean | null; status: string; job?: { name: string } | null;
}
export interface MySheet { reg_hours: number; ot_hours: number; gross_pay: number; status: string }

const DAY_MS = 86_400_000;

export function entryHours(e: MyEntry): number {
  if (!e.clock_out_at) return 0;
  const ms = new Date(e.clock_out_at).getTime() - new Date(e.clock_in_at).getTime();
  return Math.max(0, ms / 3_600_000 - (e.break_minutes ?? 0) / 60);
}

export function useMyTimesheet() {
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<MyEmployee | null>(null);
  const [periods, setPeriods] = useState<MyPeriod[]>([]);
  const [periodId, setPeriodId] = useState<string | null>(null);
  const [entries, setEntries] = useState<MyEntry[]>([]);
  const [sheet, setSheet] = useState<MySheet | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resolve employee + their employer's pay periods
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('not_logged_in'); setLoading(false); return; }
      const { data: emps } = await supabase
        .from('pro_employees')
        .select('id, employer_id, full_name, pay_type, pay_rate')
        .eq('auth_user_id', user.id).eq('status', 'active')
        .order('created_at', { ascending: true });
      const emp = emps?.[0] ?? null;
      setEmployee(emp);
      if (!emp) { setLoading(false); return; }
      const { data: pers } = await supabase
        .from('pro_pay_periods')
        .select('id, starts_on, ends_on, is_locked')
        .eq('employer_id', emp.employer_id)
        .order('starts_on', { ascending: false });
      const rows = (pers as MyPeriod[]) ?? [];
      setPeriods(rows);
      setPeriodId(rows[0]?.id ?? null);
      setLoading(false);
    })();
  }, []);

  // Load entries + timesheet for the selected period
  const loadPeriod = useCallback(async () => {
    if (!employee || !periodId) return;
    const period = periods.find((p) => p.id === periodId);
    if (!period) return;
    const startISO = new Date(period.starts_on + 'T00:00:00Z').toISOString();
    const endISO = new Date(new Date(period.ends_on + 'T00:00:00Z').getTime() + DAY_MS).toISOString();
    const [{ data: ent }, { data: ts }] = await Promise.all([
      supabase
        .from('pro_time_entries')
        .select('id, clock_in_at, clock_out_at, break_minutes, in_geofence, status, job:pro_jobs(name)')
        .eq('employee_id', employee.id)
        .gte('clock_in_at', startISO).lt('clock_in_at', endISO)
        .order('clock_in_at', { ascending: false }),
      supabase
        .from('pro_timesheets')
        .select('reg_hours, ot_hours, gross_pay, status')
        .eq('employee_id', employee.id).eq('pay_period_id', periodId).maybeSingle(),
    ]);
    setEntries((ent as any) ?? []);
    setSheet((ts as MySheet) ?? null);
  }, [employee, periodId, periods]);
  useEffect(() => { loadPeriod(); }, [loadPeriod]);

  const totalHours = entries.reduce((sum, e) => sum + entryHours(e), 0);

  return { loading, error, employee, periods, periodId, setPeriodId, entries, sheet, totalHours, reload: loadPeriod };
}
