import { supabase } from './supabaseClient';

/**
 * Invoke a Supabase Edge Function in a way that works for:
 * - logged-in users (Authorization: Bearer <access_token>)
 * - logged-out users (Authorization: Bearer <anon key>)
 */
export async function invokeEdgeFunction<T>(
  functionName: string,
  body: Record<string, any>
): Promise<T> {
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token || anonKey;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Edge function error: ${res.status}`);
  }

  return (await res.json()) as T;
}
