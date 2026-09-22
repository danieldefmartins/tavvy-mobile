/**
 * App settings preferences: notifications, privacy and display defaults.
 * Persisted locally (AsyncStorage) so they survive restarts; synced to Supabase
 * per-user where a backend column already exists (push token registration,
 * user_notification_preferences). A module-level cache lets non-React code
 * (formatDistance, the notification handler, HomeScreen's location gate)
 * read the current value synchronously without prop-drilling.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import {
  registerForPushNotifications,
  removePushToken,
  updateNotificationPreferences,
} from './notificationService';
import { userPreferencesService } from './userPreferencesService';

export type DistanceUnit = 'miles' | 'km';
export type MapLayer = 'standard' | 'dark' | 'satellite';

export interface AppSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  liveBusinessAlerts: boolean;
  locationSharing: boolean;
  dataSharing: boolean;
  distanceUnit: DistanceUnit;
  defaultMapLayer: MapLayer;
}

const STORAGE_KEY = '@tavvy_app_settings';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  pushNotifications: true,
  emailNotifications: true,
  liveBusinessAlerts: true,
  locationSharing: true,
  dataSharing: false,
  distanceUnit: 'miles',
  defaultMapLayer: 'standard',
};

let cache: AppSettings = { ...DEFAULT_APP_SETTINGS };
let loaded = false;
let loadPromise: Promise<AppSettings> | null = null;
const listeners = new Set<(settings: AppSettings) => void>();

function notify() {
  for (const listener of listeners) listener(cache);
}

async function loadOnce(): Promise<AppSettings> {
  if (loaded) return cache;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        cache = { ...DEFAULT_APP_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('[settingsPreferences] Failed to load settings:', error);
    } finally {
      loaded = true;
    }
    return cache;
  })();
  return loadPromise;
}

async function persist(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('[settingsPreferences] Failed to save settings:', error);
  }
}

/** Synchronous read of the last-loaded value. Call `loadAppSettings()` once at app start. */
export function getCachedAppSettings(): AppSettings {
  return cache;
}

export async function loadAppSettings(): Promise<AppSettings> {
  return loadOnce();
}

export function subscribeAppSettings(listener: (settings: AppSettings) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Update one setting, persist it, apply the real side effect for that
 * setting, and notify subscribers. Side effects are best-effort: a failed
 * push-registration or sync should never block the toggle from saving.
 */
export async function setAppSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  await loadOnce();
  cache = { ...cache, [key]: value };
  await persist();
  notify();
  await applySideEffect(key, value);
}

async function applySideEffect<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  try {
    switch (key) {
      case 'pushNotifications': {
        if (value) {
          await registerForPushNotifications();
        } else {
          await removePushToken();
        }
        break;
      }
      case 'liveBusinessAlerts': {
        // Live-business alerts ride the "place_trending" push category.
        await updateNotificationPreferences({ place_trending: value as boolean });
        break;
      }
      case 'dataSharing': {
        const { data: { user } } = await supabase.auth.getUser();
        if (value && user) {
          await userPreferencesService.syncToCloud(user.id);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`[settingsPreferences] Side effect for ${String(key)} failed:`, error);
  }
}

export function formatDistanceMeters(meters: number | undefined, unit: DistanceUnit = cache.distanceUnit): string {
  if (meters === undefined || meters === null || typeof meters !== 'number' || !isFinite(meters)) {
    return '';
  }
  if (unit === 'km') {
    const km = meters / 1000;
    if (km < 1) return `${Math.round(meters)} m`;
    return `${km.toFixed(1)} km`;
  }
  const miles = meters / 1609.34;
  if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
