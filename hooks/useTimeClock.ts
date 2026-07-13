/**
 * useTimeClock — crew self clock-in/out for the Workforce module.
 *
 * Reads (employee record, open entry, active jobs) come straight from Supabase;
 * RLS restricts them to the current crew member / their employer. Writes go
 * through the edge functions (pros-timeclock-clock-in / -clock-out), which run
 * with service-role and validate geofence + tenancy server-side.
 *
 * Offline-tolerant: if a punch can't reach the network it's persisted to
 * AsyncStorage with its real timestamp and replayed on next load / retry.
 */
import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabaseClient';

const QUEUE_KEY = 'timeclock_pending_v1';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export interface TCEmployee { id: string; employer_id: string; full_name: string; preferred_lang: string | null }
export interface TCJob { id: string; name: string; address: string | null; lat: number | null; lng: number | null; geofence_radius_m: number }
export interface TCOpenEntry { id: string; clock_in_at: string; in_geofence: boolean | null; job_id: string | null; job?: { name: string } | null }

interface PendingPunch {
  type: 'in' | 'out';
  employer_id: string;
  job_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  at: string; // ISO timestamp of the punch
}

interface ClockResult { ok: boolean; queued?: boolean; error?: string; in_geofence?: boolean | null }

async function callEdge(fn: string, body: Record<string, unknown>): Promise<any> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token || ANON_KEY;
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  // Read JSON regardless of status so we can surface {success,error}
  const json = await res.json().catch(() => ({}));
  return json;
}

export function useTimeClock() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employee, setEmployee] = useState<TCEmployee | null>(null);
  const [openEntry, setOpenEntry] = useState<TCOpenEntry | null>(null);
  const [jobs, setJobs] = useState<TCJob[]>([]);
  const [pendingSync, setPendingSync] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }, []);

  const flushQueue = useCallback(async () => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) { setPendingSync(false); return; }
    let queue: PendingPunch[] = [];
    try { queue = JSON.parse(raw); } catch { queue = []; }
    const remaining: PendingPunch[] = [];
    for (const p of queue) {
      try {
        const fn = p.type === 'in' ? 'pros-timeclock-clock-in' : 'pros-timeclock-clock-out';
        const body: Record<string, unknown> = { employer_id: p.employer_id, lat: p.lat, lng: p.lng };
        if (p.type === 'in') { body.job_id = p.job_id; body.clock_in_at = p.at; }
        else { body.clock_out_at = p.at; }
        const json = await callEdge(fn, body);
        if (!json?.success) remaining.push(p); // keep if server rejected transiently
      } catch {
        remaining.push(p); // still offline
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    setPendingSync(remaining.length > 0);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('not_logged_in'); setEmployee(null); return; }

      // Employee record (RLS: self read). Take the first if the user works for >1 employer.
      const { data: emps } = await supabase
        .from('pro_employees')
        .select('id, employer_id, full_name, preferred_lang')
        .eq('auth_user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true });
      const emp = emps?.[0] ?? null;
      setEmployee(emp);
      if (!emp) return;

      // Best-effort flush before we read status, so UI reflects synced state.
      await flushQueue();

      const [{ data: open }, { data: jobRows }] = await Promise.all([
        supabase
          .from('pro_time_entries')
          .select('id, clock_in_at, in_geofence, job_id, job:pro_jobs(name)')
          .eq('status', 'open')
          .order('clock_in_at', { ascending: false })
          .limit(1),
        supabase
          .from('pro_jobs')
          .select('id, name, address, lat, lng, geofence_radius_m')
          .eq('employer_id', emp.employer_id)
          .eq('status', 'active')
          .order('name'),
      ]);
      setOpenEntry((open?.[0] as any) ?? null);
      setJobs((jobRows as TCJob[]) ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [flushQueue]);

  useEffect(() => { load(); }, [load]);

  const clockIn = useCallback(async (jobId: string | null): Promise<ClockResult> => {
    if (!employee) return { ok: false, error: 'no_employee' };
    setSubmitting(true);
    try {
      const loc = await getLocation();
      const at = new Date().toISOString();
      const body = { employer_id: employee.employer_id, job_id: jobId, lat: loc?.lat ?? null, lng: loc?.lng ?? null };
      try {
        const json = await callEdge('pros-timeclock-clock-in', body);
        if (!json?.success) return { ok: false, error: json?.error || 'clock_in_failed' };
        await load();
        return { ok: true, in_geofence: json.in_geofence };
      } catch {
        // Offline — queue it
        const raw = await AsyncStorage.getItem(QUEUE_KEY);
        const queue: PendingPunch[] = raw ? JSON.parse(raw) : [];
        queue.push({ type: 'in', employer_id: employee.employer_id, job_id: jobId, lat: loc?.lat, lng: loc?.lng, at });
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        setPendingSync(true);
        setOpenEntry({ id: 'pending', clock_in_at: at, in_geofence: null, job_id: jobId });
        return { ok: true, queued: true };
      }
    } finally {
      setSubmitting(false);
    }
  }, [employee, getLocation, load]);

  const clockOut = useCallback(async (): Promise<ClockResult> => {
    if (!employee) return { ok: false, error: 'no_employee' };
    setSubmitting(true);
    try {
      const loc = await getLocation();
      const at = new Date().toISOString();
      const body = { employer_id: employee.employer_id, lat: loc?.lat ?? null, lng: loc?.lng ?? null };
      try {
        const json = await callEdge('pros-timeclock-clock-out', body);
        if (!json?.success) return { ok: false, error: json?.error || 'clock_out_failed' };
        await load();
        return { ok: true };
      } catch {
        const raw = await AsyncStorage.getItem(QUEUE_KEY);
        const queue: PendingPunch[] = raw ? JSON.parse(raw) : [];
        queue.push({ type: 'out', employer_id: employee.employer_id, lat: loc?.lat, lng: loc?.lng, at });
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        setPendingSync(true);
        setOpenEntry(null);
        return { ok: true, queued: true };
      }
    } finally {
      setSubmitting(false);
    }
  }, [employee, getLocation, load]);

  return { loading, submitting, employee, openEntry, jobs, pendingSync, error, clockIn, clockOut, reload: load };
}
