/**
 * Which third-party sign-in providers the Supabase Auth project actually has
 * enabled. The login screens only render an Apple / Google button when the
 * matching provider is configured server-side; otherwise the button would
 * open a browser tab that immediately fails ("Unsupported provider"), which
 * is exactly the kind of dead control Apple's review rejects under 2.1.
 *
 * Apple Guideline 4.8 additionally requires Sign in with Apple whenever any
 * other third-party login is offered, so Google is never shown without Apple.
 *
 * The answer comes from Supabase's public settings endpoint, which needs only
 * the anon key. It is cached for the process lifetime; the app defaults to
 * "email only" until the first answer arrives or when the request fails.
 */
import { useEffect, useState } from 'react';

export interface EnabledAuthProviders {
  apple: boolean;
  google: boolean;
  /** true once the settings request has finished (success or failure). */
  resolved: boolean;
}

const NONE: EnabledAuthProviders = { apple: false, google: false, resolved: false };

let cached: EnabledAuthProviders | null = null;
let inflight: Promise<EnabledAuthProviders> | null = null;

export function deriveProviders(external: Record<string, unknown> | null | undefined): EnabledAuthProviders {
  const apple = external?.apple === true;
  const google = external?.google === true;
  // Guideline 4.8: a Google button without Apple is not allowed on iOS, so
  // Google is only offered once Apple is configured as well.
  return { apple, google: google && apple, resolved: true };
}

export async function fetchEnabledAuthProviders(): Promise<EnabledAuthProviders> {
  if (cached) return cached;
  if (inflight) return inflight;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { ...NONE, resolved: true };
  inflight = (async () => {
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 6000) : null;
      const res = await fetch(`${url.replace(/\/$/, '')}/auth/v1/settings`, {
        headers: { apikey: anonKey },
        signal: controller?.signal,
      });
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error(`settings ${res.status}`);
      const json = await res.json();
      cached = deriveProviders(json?.external);
    } catch (error) {
      console.warn('[auth] Could not read enabled sign-in providers; showing email sign-in only.', error);
      cached = { ...NONE, resolved: true };
    } finally {
      inflight = null;
    }
    return cached!;
  })();
  return inflight;
}

/** Reset the cache (tests only). */
export function __resetAuthProvidersCache(): void {
  cached = null;
  inflight = null;
}

export function useEnabledAuthProviders(): EnabledAuthProviders {
  const [state, setState] = useState<EnabledAuthProviders>(cached ?? NONE);
  useEffect(() => {
    let active = true;
    fetchEnabledAuthProviders().then(result => { if (active) setState(result); });
    return () => { active = false; };
  }, []);
  return state;
}
