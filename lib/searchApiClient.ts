/**
 * searchApiClient.ts
 *
 * Client for the canonical Tavvy Search API (/api/search/places).
 * Replaces direct Typesense calls — ADMIN key stays server-side only.
 *
 * Base URL is configurable via environment variable:
 *   EXPO_PUBLIC_SEARCH_API_BASE_URL
 *
 * Default (dev): https://tavvy-web.vercel.app
 * Production:    https://tavvy.app (or wherever tavvy-web is deployed)
 */

// ─── Config ─────────────────────────────────────────────────────────────────

const SEARCH_API_BASE_URL =
  process.env.EXPO_PUBLIC_SEARCH_API_BASE_URL ||
  process.env.EXPO_PUBLIC_WEB_URL ||
  'https://tavvy-web.vercel.app';

// ─── Types (mirror API output) ──────────────────────────────────────────────

export interface SearchHit {
  id: string;
  fsq_place_id: string;
  name: string;
  categories: string[];
  locality?: string;
  region?: string;
  country?: string;
  address?: string;
  lat: number;
  lng: number;
  distance_meters?: number;
  score?: number;
  highlights?: Record<string, string>;
  popularity?: number;
  tel?: string;
  website?: string;
}

export interface SearchResponse {
  hits: SearchHit[];
  found: number;
  searchTimeMs: number;
  page: number;
  query: string;
  filters: {
    locality: string | null;
    region: string | null;
    country: string | null;
    category: string | null;
    nearMe: boolean;
    lat: number | null;
    lng: number | null;
    radiusKm: number | null;
  };
}

export interface SearchApiOptions {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
  category?: string;
  locality?: string;
  region?: string;
  country?: string;
  page?: number;
  limit?: number;
  autocomplete?: boolean;
  signal?: AbortSignal;
}

// ─── Main search function ───────────────────────────────────────────────────

export async function searchPlacesApi(options: SearchApiOptions): Promise<SearchResponse> {
  const params = new URLSearchParams();

  if (options.q) params.set('q', options.q);
  if (options.lat !== undefined) params.set('lat', String(options.lat));
  if (options.lng !== undefined) params.set('lng', String(options.lng));
  if (options.radius !== undefined) params.set('radius', String(options.radius));
  if (options.minLat !== undefined) params.set('minLat', String(options.minLat));
  if (options.maxLat !== undefined) params.set('maxLat', String(options.maxLat));
  if (options.minLng !== undefined) params.set('minLng', String(options.minLng));
  if (options.maxLng !== undefined) params.set('maxLng', String(options.maxLng));
  if (options.category) params.set('category', options.category);
  if (options.locality) params.set('locality', options.locality);
  if (options.region) params.set('region', options.region);
  if (options.country) params.set('country', options.country);
  if (options.page !== undefined) params.set('page', String(options.page));
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.autocomplete) params.set('autocomplete', 'true');

  const url = `${SEARCH_API_BASE_URL}/api/search/places?${params.toString()}`;

  const controller = options.signal ? undefined : new AbortController();
  const signal = options.signal || controller?.signal;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 10_000) : undefined;

  try {
    const response = await fetch(url, {
      signal,
      headers: { 'Accept': 'application/json' },
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Search API error ${response.status}: ${errBody}`);
    }

    return response.json();
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);
    throw error;
  }
}

// ─── Convenience: autocomplete ──────────────────────────────────────────────

export async function searchAutocomplete(
  query: string,
  options?: {
    lat?: number;
    lng?: number;
    radius?: number;
    limit?: number;
    signal?: AbortSignal;
  }
): Promise<SearchHit[]> {
  if (!query || query.trim().length < 1) return [];

  const result = await searchPlacesApi({
    q: query,
    autocomplete: true,
    limit: options?.limit || 8,
    lat: options?.lat,
    lng: options?.lng,
    radius: options?.radius || (options?.lat ? 50 : undefined),
    signal: options?.signal,
  });

  return result.hits;
}

// ─── Convenience: bounds search ─────────────────────────────────────────────

export async function searchInBounds(
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  options?: {
    category?: string;
    limit?: number;
    signal?: AbortSignal;
  }
): Promise<SearchResponse> {
  return searchPlacesApi({
    ...bounds,
    category: options?.category,
    limit: options?.limit || 150,
    signal: options?.signal,
  });
}

// ─── Convenience: nearby search ─────────────────────────────────────────────

export async function searchNearby(
  lat: number,
  lng: number,
  options?: {
    query?: string;
    radius?: number;
    category?: string;
    limit?: number;
    signal?: AbortSignal;
  }
): Promise<SearchResponse> {
  return searchPlacesApi({
    q: options?.query || '*',
    lat,
    lng,
    radius: options?.radius || 25,
    category: options?.category,
    limit: options?.limit || 50,
    signal: options?.signal,
  });
}

// ─── Health check ───────────────────────────────────────────────────────────

export async function searchApiHealthCheck(): Promise<{ ok: boolean; message?: string }> {
  try {
    const result = await searchPlacesApi({ q: 'test', limit: 1 });
    return { ok: result.found >= 0 };
  } catch (error: any) {
    return { ok: false, message: error.message };
  }
}
