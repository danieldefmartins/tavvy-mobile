/**
 * searchService.ts
 *
 * Centralized search service — now powered by the canonical Search API.
 *
 * Primary path:  /api/search/places (Typesense, server-side)
 * Fallback path: Supabase ILIKE (offline / API unreachable)
 *
 * Features:
 *   1. Location-biased queries (local results first)
 *   2. Client-side caching for instant results
 *   3. Offline fallback to Supabase
 *   4. Pre-fetch nearby places for instant autocomplete
 *   5. Address search (Nominatim)
 */

import { supabase } from './supabaseClient';
import { PlaceCard, PlaceSource } from './placeService';
import {
  searchPlacesApi,
  searchAutocomplete as apiAutocomplete,
  SearchHit,
} from './searchApiClient';

// ============================================
// TYPES
// ============================================

export interface SearchResult extends PlaceCard {
  matchScore?: number;
  distance?: number;
}

export interface SearchOptions {
  query: string;
  location?: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
  };
  filters?: {
    category?: string;
  };
  limit?: number;
  fallbackThreshold?: number;
}

export interface SearchResultResponse {
  results: SearchResult[];
  metrics: {
    fromPlacesSearch: number;
    fromFsqRaw: number;
    fallbackTriggered: boolean;
    totalTime: number;
  };
}

export interface AddressSuggestion {
  id: string;
  displayName: string;
  shortName: string;
  latitude: number;
  longitude: number;
  type: string;
  city?: string;
  state?: string;
  country?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_LIMIT = 20;
const DEFAULT_FALLBACK_THRESHOLD = 10;
const SEARCH_RADIUS_LOCAL = 0.3;
const SEARCH_RADIUS_REGIONAL = 0.8;

// ============================================
// CLIENT-SIDE CACHE
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  location?: { latitude: number; longitude: number };
}

const searchCache = new Map<string, CacheEntry<SearchResult[]>>();
const addressCache = new Map<string, CacheEntry<AddressSuggestion[]>>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 100;

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  if (entry) cache.delete(key);
  return null;
}

function setCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  data: T,
  location?: { latitude: number; longitude: number }
): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now(), location });
}

function getCacheKey(query: string, location?: { latitude: number; longitude: number }): string {
  const normalizedQuery = query.trim().toLowerCase();
  if (location) {
    const lat = Math.round(location.latitude * 100) / 100;
    const lng = Math.round(location.longitude * 100) / 100;
    return `${normalizedQuery}:${lat}:${lng}`;
  }
  return normalizedQuery;
}

export function clearSearchCache(): void {
  searchCache.clear();
  addressCache.clear();
  console.log('[searchService] Cache cleared');
}

// ============================================
// TRANSFORM: API Hit → SearchResult
// ============================================

function hitToSearchResult(hit: SearchHit): SearchResult {
  const isTavvy = hit.id.startsWith('tavvy:');
  return {
    id: hit.id,
    source: (isTavvy ? 'places' : 'fsq_raw') as PlaceSource,
    source_id: hit.fsq_place_id,
    source_type: isTavvy ? 'tavvy' : 'fsq',
    name: hit.name,
    latitude: hit.lat,
    longitude: hit.lng,
    address: hit.address,
    city: hit.locality,
    region: hit.region,
    country: hit.country,
    category: hit.categories?.[0] || 'Other',
    phone: hit.tel,
    website: hit.website,
    distance: hit.distance_meters ? hit.distance_meters / 1000 : undefined, // meters → km
    cover_image_url: undefined,
    photos: [],
    status: 'active',
  };
}

// ============================================
// MAIN SEARCH FUNCTION
// ============================================

/**
 * Search for places — canonical API first, Supabase ILIKE fallback.
 */
export async function searchPlaces(options: SearchOptions): Promise<SearchResultResponse> {
  const startTime = Date.now();
  const { query, location, filters, limit = DEFAULT_LIMIT } = options;

  if (!query || query.trim().length === 0) {
    return {
      results: [],
      metrics: { fromPlacesSearch: 0, fromFsqRaw: 0, fallbackTriggered: false, totalTime: 0 },
    };
  }

  // ── Try canonical Search API ──
  try {
    const response = await searchPlacesApi({
      q: query.trim(),
      lat: location?.latitude,
      lng: location?.longitude,
      radius: location?.radiusKm || (location ? 50 : undefined),
      category: filters?.category,
      limit,
    });

    const results = response.hits.map(hitToSearchResult);

    return {
      results,
      metrics: {
        fromPlacesSearch: results.filter(r => r.source === 'places').length,
        fromFsqRaw: results.filter(r => r.source === 'fsq_raw').length,
        fallbackTriggered: false,
        totalTime: Date.now() - startTime,
      },
    };
  } catch (apiError) {
    console.warn('[searchService] API search failed, falling back to Supabase:', apiError);
  }

  // ── Fallback: Supabase ILIKE (offline / API down) ──
  return searchPlacesFallback(options, startTime);
}

/**
 * Supabase ILIKE fallback — only used when the Search API is unreachable.
 */
async function searchPlacesFallback(options: SearchOptions, startTime: number): Promise<SearchResultResponse> {
  const { query, location, filters, limit = DEFAULT_LIMIT, fallbackThreshold = DEFAULT_FALLBACK_THRESHOLD } = options;
  const searchTerm = query.trim().toLowerCase();
  let resultsFromFsqRaw: SearchResult[] = [];
  let resultsFromPlacesSearch: SearchResult[] = [];

  try {
    const { data: fsqData } = await supabase
      .from('fsq_places_raw')
      .select('fsq_place_id, name, latitude, longitude, address, locality, region, country, postcode, tel, website, fsq_category_labels')
      .or(`name.ilike.%${searchTerm}%,locality.ilike.%${searchTerm}%`)
      .is('date_closed', null)
      .limit(limit);

    if (fsqData) {
      resultsFromFsqRaw = fsqData.map(p => transformFsqToSearchResult(p, location));
    }
  } catch (error) {
    console.error('[searchService] Fallback fsq_places_raw error:', error);
  }

  if (resultsFromFsqRaw.length < fallbackThreshold) {
    try {
      let searchQuery = supabase
        .from('places')
        .select('id, name, city, region, tavvy_category, tavvy_subcategory, latitude, longitude, cover_image_url, street, phone, website, photos, status')
        .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
        .eq('status', 'active')
        .limit(limit - resultsFromFsqRaw.length);

      if (filters?.category) {
        searchQuery = searchQuery.eq('tavvy_category', filters.category);
      }

      const { data: placesData } = await searchQuery;
      if (placesData) {
        const existingIds = new Set(resultsFromFsqRaw.map(r => r.source_id));
        resultsFromPlacesSearch = placesData
          .filter(p => !existingIds.has(p.id))
          .map(p => transformToSearchResult(p, 'places', location));
      }
    } catch (error) {
      console.error('[searchService] Fallback places error:', error);
    }
  }

  let allResults = [...resultsFromFsqRaw, ...resultsFromPlacesSearch];
  if (location) {
    allResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  }

  return {
    results: allResults,
    metrics: {
      fromPlacesSearch: resultsFromPlacesSearch.length,
      fromFsqRaw: resultsFromFsqRaw.length,
      fallbackTriggered: true,
      totalTime: Date.now() - startTime,
    },
  };
}

// ============================================
// AUTOCOMPLETE SUGGESTIONS
// ============================================

/**
 * Search for suggestions (autocomplete) — canonical API first, Supabase fallback.
 */
export async function searchSuggestions(
  query: string,
  limit: number = 8,
  userLocation?: { latitude: number; longitude: number }
): Promise<SearchResult[]> {
  if (!query || query.trim().length < 1) return [];

  const searchTerm = query.trim().toLowerCase();
  const cacheKey = getCacheKey(searchTerm, userLocation);

  // Check cache first
  const cached = getCached(searchCache, cacheKey);
  if (cached) {
    console.log(`[searchService] Cache hit for "${searchTerm}"`);
    return cached;
  }

  const startTime = Date.now();

  // ── Try canonical Search API ──
  try {
    const hits = await apiAutocomplete(searchTerm, {
      lat: userLocation?.latitude,
      lng: userLocation?.longitude,
      radius: userLocation ? 50 : undefined,
      limit,
    });

    if (hits.length > 0) {
      const results = hits.map(hitToSearchResult);
      setCache(searchCache, cacheKey, results, userLocation);
      console.log(`[searchService] ⚡ API: ${results.length} results in ${Date.now() - startTime}ms`);
      return results;
    }
  } catch (apiError) {
    console.warn('[searchService] API autocomplete failed, falling back to Supabase:', apiError);
  }

  // ── Fallback: Supabase ILIKE ──
  try {
    let results: SearchResult[] = [];

    if (userLocation) {
      results = await searchWithGeoBounds(searchTerm, userLocation, SEARCH_RADIUS_LOCAL, limit);
      if (results.length < 3) {
        const regional = await searchWithGeoBounds(searchTerm, userLocation, SEARCH_RADIUS_REGIONAL, limit);
        const seenIds = new Set(results.map(r => r.id));
        for (const r of regional) {
          if (!seenIds.has(r.id)) results.push(r);
        }
      }
      if (results.length === 0) {
        results = await searchWithoutLocation(searchTerm, limit);
      }
      results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else {
      results = await searchWithoutLocation(searchTerm, limit);
    }

    results = results.slice(0, limit);
    setCache(searchCache, cacheKey, results, userLocation);
    console.log(`[searchService] Supabase fallback: ${results.length} results in ${Date.now() - startTime}ms`);
    return results;
  } catch (error) {
    console.error('[searchService] Error in searchSuggestions:', error);
    return [];
  }
}

// ============================================
// SUPABASE FALLBACK HELPERS
// ============================================

async function searchWithGeoBounds(
  searchTerm: string,
  location: { latitude: number; longitude: number },
  radiusDegrees: number,
  limit: number
): Promise<SearchResult[]> {
  const { latitude, longitude } = location;
  const minLat = latitude - radiusDegrees;
  const maxLat = latitude + radiusDegrees;
  const minLng = longitude - radiusDegrees;
  const maxLng = longitude + radiusDegrees;

  const [placesResult, fsqResult] = await Promise.all([
    supabase
      .from('places')
      .select('id, name, city, region, tavvy_category, latitude, longitude, cover_image_url, street, phone')
      .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .eq('status', 'active')
      .gte('latitude', minLat).lte('latitude', maxLat)
      .gte('longitude', minLng).lte('longitude', maxLng)
      .limit(limit),
    supabase
      .from('fsq_places_raw')
      .select('fsq_place_id, name, locality, region, latitude, longitude, fsq_category_labels')
      .or(`name.ilike.%${searchTerm}%,locality.ilike.%${searchTerm}%`)
      .is('date_closed', null)
      .gte('latitude', minLat).lte('latitude', maxLat)
      .gte('longitude', minLng).lte('longitude', maxLng)
      .limit(limit)
  ]);

  return processSearchResults(placesResult.data, fsqResult.data, location, searchTerm);
}

async function searchWithoutLocation(searchTerm: string, limit: number): Promise<SearchResult[]> {
  const [placesResult, fsqResult] = await Promise.all([
    supabase
      .from('places')
      .select('id, name, city, region, tavvy_category, latitude, longitude, cover_image_url, street, phone')
      .or(`name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .eq('status', 'active')
      .limit(limit),
    supabase
      .from('fsq_places_raw')
      .select('fsq_place_id, name, locality, region, latitude, longitude, fsq_category_labels')
      .or(`name.ilike.%${searchTerm}%,locality.ilike.%${searchTerm}%`)
      .is('date_closed', null)
      .limit(limit)
  ]);

  return processSearchResults(placesResult.data, fsqResult.data, undefined, searchTerm);
}

function processSearchResults(
  placesData: any[] | null,
  fsqData: any[] | null,
  location: { latitude: number; longitude: number } | undefined,
  searchTerm: string
): SearchResult[] {
  const results: SearchResult[] = [];
  const seenNames = new Set<string>();

  if (placesData) {
    for (const s of placesData) {
      const nameKey = s.name.toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        const result: SearchResult = {
          id: s.id,
          source: 'places' as PlaceSource,
          source_id: s.id,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
          city: s.city,
          region: s.region,
          category: s.tavvy_category,
          cover_image_url: s.cover_image_url,
          address: s.street,
          phone: s.phone,
        };
        if (location && s.latitude && s.longitude) {
          result.distance = calculateDistance(location.latitude, location.longitude, s.latitude, s.longitude);
        }
        results.push(result);
      }
    }
  }

  if (fsqData) {
    for (const p of fsqData) {
      const nameKey = p.name.toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        const result: SearchResult = {
          id: `fsq:${p.fsq_place_id}`,
          source: 'fsq_raw' as PlaceSource,
          source_id: p.fsq_place_id,
          name: p.name,
          latitude: p.latitude,
          longitude: p.longitude,
          city: p.locality,
          region: p.region,
          category: extractCategory(p.fsq_category_labels),
        };
        if (location && p.latitude && p.longitude) {
          result.distance = calculateDistance(location.latitude, location.longitude, p.latitude, p.longitude);
        }
        results.push(result);
      }
    }
  }

  results.sort((a, b) => {
    const aStartsWith = a.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
    const bStartsWith = b.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
    if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
    return (a.distance || Infinity) - (b.distance || Infinity);
  });

  return results;
}

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

function transformToSearchResult(place: any, source: PlaceSource, location?: { latitude: number; longitude: number }): SearchResult {
  const result: SearchResult = {
    id: place.id,
    source,
    source_id: place.source_id || place.id,
    source_type: place.source_type,
    name: place.name || 'Unknown',
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.street,
    city: place.city,
    region: place.region,
    country: place.country,
    postcode: place.postcode,
    category: place.tavvy_category,
    subcategory: place.tavvy_subcategory,
    phone: place.phone,
    website: place.website,
    cover_image_url: place.cover_image_url,
    photos: place.photos || [],
    status: place.status,
  };

  if (location && place.latitude && place.longitude) {
    result.distance = calculateDistance(location.latitude, location.longitude, place.latitude, place.longitude);
  }

  return result;
}

function transformFsqToSearchResult(place: any, location?: { latitude: number; longitude: number }): SearchResult {
  let category = 'Other';
  if (place.fsq_category_labels) {
    let labels: string[] = [];
    if (Array.isArray(place.fsq_category_labels)) {
      labels = place.fsq_category_labels;
    } else if (typeof place.fsq_category_labels === 'string') {
      labels = place.fsq_category_labels.split(',').map((s: string) => s.trim());
    }
    if (labels.length > 0) {
      const parts = labels[0].split('>');
      category = parts[parts.length - 1].trim();
    }
  }

  const result: SearchResult = {
    id: `fsq:${place.fsq_place_id}`,
    source: 'fsq_raw',
    source_id: place.fsq_place_id,
    source_type: 'fsq',
    name: place.name || 'Unknown',
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address,
    city: place.locality,
    region: place.region,
    country: place.country,
    postcode: place.postcode,
    category,
    phone: place.tel,
    website: place.website,
    cover_image_url: undefined,
    photos: [],
    status: 'active',
  };

  if (location && place.latitude && place.longitude) {
    result.distance = calculateDistance(location.latitude, location.longitude, place.latitude, place.longitude);
  }

  return result;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function extractCategory(labels: any): string {
  if (!labels) return 'Other';
  let labelArray: string[] = [];
  if (Array.isArray(labels)) {
    labelArray = labels;
  } else if (typeof labels === 'string') {
    labelArray = labels.split(',').map(s => s.trim());
  }
  if (labelArray.length > 0) {
    const parts = labelArray[0].split('>');
    return parts[parts.length - 1].trim();
  }
  return 'Other';
}

// ============================================
// ADDRESS SEARCH (Nominatim — unchanged)
// ============================================

export async function searchAddresses(
  query: string,
  limit: number = 5,
  userLocation?: { latitude: number; longitude: number },
  countryCode: string = 'us'
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];

  const cacheKey = `addr:${getCacheKey(query, userLocation)}`;
  const cached = getCached(addressCache, cacheKey);
  if (cached) return cached;

  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`;

    if (userLocation) {
      const viewboxSize = 0.5;
      const viewbox = [
        userLocation.longitude - viewboxSize,
        userLocation.latitude + viewboxSize,
        userLocation.longitude + viewboxSize,
        userLocation.latitude - viewboxSize
      ].join(',');
      url += `&viewbox=${viewbox}&bounded=1`;
    }
    if (countryCode) url += `&countrycodes=${countryCode}`;

    const response = await fetch(url, { headers: { 'User-Agent': 'Tavvy-App/1.0' } });

    if (!response.ok) {
      if (userLocation) return searchAddressesUnbounded(query, limit, countryCode);
      return [];
    }

    let results = await response.json();
    if (results.length === 0 && userLocation) {
      return searchAddressesUnbounded(query, limit, countryCode);
    }

    const suggestions = results.map((r: any) => ({
      id: r.place_id,
      displayName: r.display_name,
      shortName: r.display_name.split(',')[0],
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      type: r.type,
      city: r.address?.city || r.address?.town || r.address?.village,
      state: r.address?.state,
      country: r.address?.country,
    }));

    setCache(addressCache, cacheKey, suggestions, userLocation);
    return suggestions;
  } catch (error) {
    console.error('[searchService] Error in searchAddresses:', error);
    return [];
  }
}

async function searchAddressesUnbounded(
  query: string,
  limit: number,
  countryCode: string
): Promise<AddressSuggestion[]> {
  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`;
    if (countryCode) url += `&countrycodes=${countryCode}`;

    const response = await fetch(url, { headers: { 'User-Agent': 'Tavvy-App/1.0' } });
    if (!response.ok) return [];

    const results = await response.json();
    return results.map((r: any) => ({
      id: r.place_id,
      displayName: r.display_name,
      shortName: r.display_name.split(',')[0],
      latitude: parseFloat(r.lat),
      longitude: parseFloat(r.lon),
      type: r.type,
      city: r.address?.city || r.address?.town || r.address?.village,
      state: r.address?.state,
      country: r.address?.country,
    }));
  } catch (error) {
    console.error('[searchService] Error in searchAddressesUnbounded:', error);
    return [];
  }
}

// ============================================
// PRE-FETCH NEARBY PLACES
// ============================================

export async function prefetchNearbyPlaces(
  userLocation: { latitude: number; longitude: number },
  limit: number = 100
): Promise<SearchResult[]> {
  const { latitude, longitude } = userLocation;
  const radiusDegrees = SEARCH_RADIUS_LOCAL;

  const minLat = latitude - radiusDegrees;
  const maxLat = latitude + radiusDegrees;
  const minLng = longitude - radiusDegrees;
  const maxLng = longitude + radiusDegrees;

  try {
    const { data, error } = await supabase
      .from('places')
      .select('id, name, city, region, tavvy_category, latitude, longitude, cover_image_url, street, phone')
      .gte('latitude', minLat).lte('latitude', maxLat)
      .gte('longitude', minLng).lte('longitude', maxLng)
      .eq('status', 'active')
      .limit(limit);

    if (error) {
      console.error('[searchService] Error pre-fetching places:', error);
      return [];
    }

    const results: SearchResult[] = (data || []).map(s => ({
      id: s.id,
      source: 'places' as PlaceSource,
      source_id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      city: s.city,
      region: s.region,
      category: s.tavvy_category,
      cover_image_url: s.cover_image_url,
      address: s.street,
      phone: s.phone,
      distance: calculateDistance(latitude, longitude, s.latitude, s.longitude),
    }));

    results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    return results;
  } catch (error) {
    console.error('[searchService] Exception pre-fetching places:', error);
    return [];
  }
}

export function searchPrefetchedPlaces(
  query: string,
  prefetchedPlaces: SearchResult[],
  limit: number = 5
): SearchResult[] {
  if (!query || query.trim().length < 1 || !prefetchedPlaces.length) return [];

  const searchTerm = query.trim().toLowerCase();

  return prefetchedPlaces
    .filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      (p.city && p.city.toLowerCase().includes(searchTerm))
    )
    .sort((a, b) => {
      const aStartsWith = a.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
      const bStartsWith = b.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
      if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
      return (a.distance || Infinity) - (b.distance || Infinity);
    })
    .slice(0, limit);
}
