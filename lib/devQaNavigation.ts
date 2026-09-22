/**
 * Development-only QA navigation. Lets a simulator be driven from the shell:
 *
 *   xcrun simctl openurl <udid> 'tavvy://qa/nav?tab=Profile&screen=Login'
 *   xcrun simctl openurl <udid> 'tavvy://qa/nav?tab=Home&screen=PlaceDetail&params=%7B%22placeId%22%3A%22...%22%7D'
 *
 * Compiled out of release builds: everything is behind __DEV__, and the
 * production app never registers this listener, so the `qa` path is inert
 * for customers. Used for screenshot capture and device-flow checks.
 */
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { supabase } from './supabaseClient';

export const navigationRef = createNavigationContainerRef<any>();

function handleQaUrl(url: string | null): void {
  if (!url || !navigationRef.isReady()) return;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (parsed.protocol !== 'tavvy:' || parsed.hostname !== 'qa') return;
  if (parsed.pathname === '/signin') {
    // Dev-only: sign a disposable QA account in so signed-in screens can be captured.
    const email = parsed.searchParams.get('email');
    const password = parsed.searchParams.get('password');
    if (email && password) {
      void supabase.auth.signInWithPassword({ email, password })
        .then(({ error }) => { if (error) console.warn('[qa] sign-in failed:', error.message); });
    }
    return;
  }
  if (parsed.pathname === '/signout') {
    void supabase.auth.signOut();
    return;
  }
  if (parsed.pathname !== '/nav') return;
  const tab = parsed.searchParams.get('tab');
  const screen = parsed.searchParams.get('screen');
  let params: Record<string, unknown> | undefined;
  const rawParams = parsed.searchParams.get('params');
  if (rawParams) {
    try { params = JSON.parse(rawParams); } catch { params = undefined; }
  }
  try {
    if (tab && screen) navigationRef.navigate(tab, { screen, params });
    else if (tab) navigationRef.navigate(tab);
    else if (screen) navigationRef.navigate(screen, params);
  } catch (error) {
    console.warn('[qa] navigation failed:', error);
  }
}

export function useDevQaDeepLinks(): void {
  useEffect(() => {
    if (!__DEV__) return;
    const subscription = Linking.addEventListener('url', ({ url }) => handleQaUrl(url));
    void Linking.getInitialURL().then(handleQaUrl);
    return () => subscription.remove();
  }, []);
}
