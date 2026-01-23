/**
 * searchService.ts
 * 
 * OPTIMIZED Centralized search service with:
 * 1. Location-biased queries (local results first)
 * 2. Progressive search strategy (local → regional → global)
 * 3. Client-side caching for instant results
 * 4. Geo-bounded database queries
 * 5. Parallel query execution for speed
 * 
 * This is the SINGLE source of truth for text-based place search across the app.
 */

import { supabase } from './supabaseClient';
import { PlaceCard, PlaceSource } from './placeService';

// ============================================
// TYPES
// ============================================

export interface SearchResult extends PlaceCard {
  matchScore?: number;           // Relevance score for sorting
  distance?: number;             // Distance from user if location provided
}

export interface SearchOptions {
  query: string;
  location?: {
    latitude: number;
    longitude: number;
    radiusKm?: number;           // Default: 50km
  };
  filters?: {
    category?: string;
  };
  limit?: number;
  fallbackThreshold?: number;    // Default: 10
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
const DEFAULT_RADIUS_KM = 50;

// Progressive search radius tiers (in degrees, ~1 degree ≈ 69 miles)
const SEARCH_RADIUS_LOCAL = 0.3;      // ~20 miles - fastest, most relevant
const SEARCH_RADIUS_REGIONAL = 0.8;   // ~55 miles - expanded search
const SEARCH_RADIUS_STATE = 2.0;      // ~140 miles - state-level

// ============================================
// CLIENT-SIDE CACHE
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  location?: { latitude: number; longitude: number };
}

// LRU Cache for search results
const searchCache = new Map<string, CacheEntry<SearchResult[]>>();
const addressCache = new Map<string, CacheEntry<AddressSuggestion[]>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

/**
 * Get cached results if available and not expired
 */
function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  if (entry) {
    cache.delete(key); // Remove expired entry
  }
  return null;
}

/**
 * Set cache entry with LRU eviction
 */
function setCache<T>(
  cache: Map<string, CacheEntry<T>>, 
  key: string, 
  data: T,
  location?: { latitude: number; longitude: number }
): void {
  // LRU eviction if cache is full
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now(), location });
}

/**
 * Generate cache key from query and location
 */
function getCacheKey(query: string, location?: { latitude: number; longitude: number }): string {
  const normalizedQuery = query.trim().toLowerCase();
  if (location) {
    // Round location to reduce cache fragmentation
    const lat = Math.round(location.latitude * 100) / 100;
    const lng = Math.round(location.longitude * 100) / 100;
    return `${normalizedQuery}:${lat}:${lng}`;
  }
  return normalizedQuery;
}

/**
 * Clear all caches (useful for testing or forced refresh)
 */
export function clearSearchCache(): void {
  searchCache.clear();
  addressCache.clear();
  console.log('[searchService] Cache cleared');
}

// ============================================
// MAIN SEARCH FUNCTION
// ============================================

/**
 * Search for places by text query using hybrid strategy.
 * 
 * Strategy:
 * 1. Query `places_search` table first (full-text + trigram)
 * 2. If results < threshold, query `fsq_places_raw` as fallback
 * 3. Deduplicate by source_id
 * 4. Return unified SearchResult[] format
 */
export async function searchPlaces(options: SearchOptions): Promise<SearchResultResponse> {
  const startTime = Date.now();
  const { query, location, filters, limit = DEFAULT_LIMIT, fallbackThreshold = DEFAULT_FALLBACK_THRESHOLD } = options;

  if (!query || query.trim().length === 0) {
    return {
      results: [],
      metrics: {
        fromPlacesSearch: 0,
        fromFsqRaw: 0,
        fallbackTriggered: false,
        totalTime: 0,
      },
    };
  }

  const searchTerm = query.trim().toLowerCase();
  let resultsFromPlacesSearch: SearchResult[] = [];
  let resultsFromFsqRaw: SearchResult[] = [];
  let fallbackTriggered = false;

  // ============================================
  // STEP 1: Query places_search table (optimized path)
  // ============================================
  try {
    // Use ilike for simple matching (trigram index will help)
    // For full-text search, we'd use: .textSearch('search_tsv', searchTerm)
    let searchQuery = supabase
      .from('places_search')
      .select('place_id, name, name_norm, city, region, category, subcategory, latitude, longitude')
      .or(`name_norm.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .limit(limit);

    if (filters?.category) {
      searchQuery = searchQuery.eq('category', filters.category);
    }

    const { data: searchData, error: searchError } = await searchQuery;

    if (searchError) {
      console.warn('[searchService] Error querying places_search:', searchError);
    } else if (searchData) {
      // Fetch full place data for the matched place_ids
      const placeIds = searchData.map(s => s.place_id);
      
      if (placeIds.length > 0) {
        const { data: placesData, error: placesError } = await supabase
          .from('places')
          .select('*')
          .in('id', placeIds);

        if (!placesError && placesData) {
          resultsFromPlacesSearch = placesData.map(p => transformToSearchResult(p, 'places', location));
        }
      }
      
      console.log(`[searchService] Found ${resultsFromPlacesSearch.length} results from places_search`);
    }
  } catch (error) {
    console.error('[searchService] Exception querying places_search:', error);
  }

  // ============================================
  // STEP 2: Check if fallback is needed
  // ============================================
  if (resultsFromPlacesSearch.length < fallbackThreshold) {
    fallbackTriggered = true;
    console.log(`[searchService] Fallback triggered: ${resultsFromPlacesSearch.length} < ${fallbackThreshold} threshold`);

    // Get source_ids to exclude
    const existingSourceIds = new Set(
      resultsFromPlacesSearch
        .filter(r => r.source_id)
        .map(r => r.source_id)
    );

    // ============================================
    // STEP 3: Query fsq_places_raw as fallback
    // ============================================
    try {
      const { data: fsqData, error: fsqError } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, latitude, longitude, address, locality, region, country, postcode, tel, website, fsq_category_labels')
        .ilike('name', `%${query}%`)
        .is('date_closed', null)
        .limit(limit - resultsFromPlacesSearch.length);

      if (fsqError) {
        console.warn('[searchService] Error querying fsq_places_raw:', fsqError);
      } else if (fsqData) {
        // Filter out places already in results
        const newFsqResults = fsqData.filter(p => !existingSourceIds.has(p.fsq_place_id));
        resultsFromFsqRaw = newFsqResults.map(p => transformFsqToSearchResult(p, location));
        console.log(`[searchService] Found ${fsqData.length} from fsq_raw, ${resultsFromFsqRaw.length} after dedup`);
      }
    } catch (error) {
      console.error('[searchService] Exception querying fsq_places_raw:', error);
    }
  }

  // ============================================
  // STEP 4: Merge, sort, and return results
  // ============================================
  let allResults = [...resultsFromPlacesSearch, ...resultsFromFsqRaw];

  // Sort by distance if location provided, otherwise by name
  if (location) {
    allResults.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
  } else {
    allResults.sort((a, b) => a.name.localeCompare(b.name));
  }

  const endTime = Date.now();

  const result: SearchResultResponse = {
    results: allResults,
    metrics: {
      fromPlacesSearch: resultsFromPlacesSearch.length,
      fromFsqRaw: resultsFromFsqRaw.length,
      fallbackTriggered,
      totalTime: endTime - startTime,
    },
  };

  console.log(`[searchService] Total: ${allResults.length} results (${result.metrics.fromPlacesSearch} search, ${result.metrics.fromFsqRaw} fsq_raw) in ${result.metrics.totalTime}ms`);

  return result;
}

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

/**
 * Transform a canonical place to SearchResult format
 */
function transformToSearchResult(place: any, source: PlaceSource, location?: { latitude: number; longitude: number }): SearchResult {
  const result: SearchResult = {
    id: place.id,
    source,
    source_id: place.source_id || place.id,
    source_type: place.source_type,
    name: place.name || 'Unknown',
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address,
    city: place.city,
    region: place.region,
    country: place.country,
    postcode: place.postcode,
    category: place.tavvy_category,
    subcategory: place.tavvy_subcategory,
    phone: place.phone,
    website: place.website,
    email: place.email,
    instagram: place.instagram,
    facebook: place.facebook,
    twitter: place.twitter,
    cover_image_url: place.cover_image_url,
    photos: place.photos || [],
    status: place.status,
  };

  if (location && place.latitude && place.longitude) {
    result.distance = calculateDistance(
      location.latitude,
      location.longitude,
      place.latitude,
      place.longitude
    );
  }

  return result;
}

/**
 * Transform an FSQ raw place to SearchResult format
 */
function transformFsqToSearchResult(place: any, location?: { latitude: number; longitude: number }): SearchResult {
  // Extract category
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
    result.distance = calculateDistance(
      location.latitude,
      location.longitude,
      place.latitude,
      place.longitude
    );
  }

  return result;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
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

// ============================================
// OPTIMIZED AUTOCOMPLETE SEARCH
// ============================================

/**
 * OPTIMIZED Search for suggestions (autocomplete)
 * 
 * Features:
 * - Client-side caching for instant results
 * - Geo-bounded queries (local results first)
 * - Progressive search (local → regional if needed)
 * - Parallel query execution
 * 
 * @param query - Search query string
 * @param limit - Maximum results to return
 * @param userLocation - User's current location for geo-biasing
 * @returns Promise<SearchResult[]>
 */
export async function searchSuggestions(
  query: string, 
  limit: number = 8,
  userLocation?: { latitude: number; longitude: number }
): Promise<SearchResult[]> {
  // Start searching from 1 character
  if (!query || query.trim().length < 1) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();
  const cacheKey = getCacheKey(searchTerm, userLocation);
  
  // Check cache first (instant results!)
  const cached = getCached(searchCache, cacheKey);
  if (cached) {
    console.log(`[searchService] Cache hit for "${searchTerm}"`);
    return cached;
  }

  const startTime = Date.now();

  try {
    let results: SearchResult[] = [];
    
    if (userLocation) {
      // PROGRESSIVE SEARCH: Start local, expand if needed
      results = await searchWithGeoBounds(
        searchTerm, 
        userLocation, 
        SEARCH_RADIUS_LOCAL, 
        limit
      );
      
      // If not enough results, expand to regional
      if (results.length < 3) {
        console.log(`[searchService] Expanding search to regional (${results.length} local results)`);
        const regionalResults = await searchWithGeoBounds(
          searchTerm, 
          userLocation, 
          SEARCH_RADIUS_REGIONAL, 
          limit
        );
        
        // Merge and dedupe
        const seenIds = new Set(results.map(r => r.id));
        for (const r of regionalResults) {
          if (!seenIds.has(r.id)) {
            results.push(r);
            seenIds.add(r.id);
          }
        }
      }
      
      // Sort by distance
      results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else {
      // No location - use standard search
      results = await searchWithoutLocation(searchTerm, limit);
    }

    // Limit results
    results = results.slice(0, limit);
    
    // Cache results
    setCache(searchCache, cacheKey, results, userLocation);
    
    console.log(`[searchService] Suggestions: ${results.length} results in ${Date.now() - startTime}ms`);
    return results;
    
  } catch (error) {
    console.error('[searchService] Error in searchSuggestions:', error);
    return [];
  }
}

/**
 * Search with geo-bounded queries for faster, more relevant results
 */
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

  // Search both sources in parallel with geo bounds
  const [placesResult, fsqResult] = await Promise.all([
    // Search places_search table with geo bounds
    supabase
      .from('places_search')
      .select('place_id, name, city, region, category, latitude, longitude')
      .or(`name_norm.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .limit(limit),
    // Search fsq_places_raw table with geo bounds
    supabase
      .from('fsq_places_raw')
      .select('fsq_place_id, name, locality, region, latitude, longitude, fsq_category_labels')
      .or(`name.ilike.%${searchTerm}%,locality.ilike.%${searchTerm}%`)
      .is('date_closed', null)
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .limit(limit)
  ]);

  return processSearchResults(placesResult.data, fsqResult.data, location, searchTerm);
}

/**
 * Search without location constraints
 */
async function searchWithoutLocation(
  searchTerm: string,
  limit: number
): Promise<SearchResult[]> {
  const [placesResult, fsqResult] = await Promise.all([
    supabase
      .from('places_search')
      .select('place_id, name, city, region, category, latitude, longitude')
      .or(`name_norm.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
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

/**
 * Process and merge search results from both sources
 */
function processSearchResults(
  placesData: any[] | null,
  fsqData: any[] | null,
  location: { latitude: number; longitude: number } | undefined,
  searchTerm: string
): SearchResult[] {
  const results: SearchResult[] = [];
  const seenNames = new Set<string>();

  // Process places_search results first (higher priority)
  if (placesData) {
    for (const s of placesData) {
      const nameKey = s.name.toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        const result: SearchResult = {
          id: s.place_id,
          source: 'places' as PlaceSource,
          source_id: s.place_id,
          name: s.name,
          latitude: s.latitude,
          longitude: s.longitude,
          city: s.city,
          region: s.region,
          category: s.category,
        };
        if (location && s.latitude && s.longitude) {
          result.distance = calculateDistance(
            location.latitude, location.longitude,
            s.latitude, s.longitude
          );
        }
        results.push(result);
      }
    }
  }

  // Add FSQ results (deduplicated)
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
          result.distance = calculateDistance(
            location.latitude, location.longitude,
            p.latitude, p.longitude
          );
        }
        results.push(result);
      }
    }
  }

  // Sort: prioritize exact prefix matches, then by distance
  results.sort((a, b) => {
    const aStartsWith = a.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
    const bStartsWith = b.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
    if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
    return (a.distance || Infinity) - (b.distance || Infinity);
  });

  return results;
}

// ============================================
// OPTIMIZED ADDRESS SEARCH
// ============================================

/**
 * OPTIMIZED Search for address suggestions using Nominatim
 * 
 * Features:
 * - Location bias (viewbox) for faster local results
 * - Country code restriction
 * - Client-side caching
 * - Progressive search (bounded first, then unbounded)
 * 
 * @param query - Address search query
 * @param limit - Maximum results
 * @param userLocation - User's location for biasing
 * @param countryCode - Country code to restrict results (default: 'us')
 */
export async function searchAddresses(
  query: string,
  limit: number = 5,
  userLocation?: { latitude: number; longitude: number },
  countryCode: string = 'us'
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  const cacheKey = `addr:${getCacheKey(query, userLocation)}`;
  
  // Check cache first
  const cached = getCached(addressCache, cacheKey);
  if (cached) {
    console.log(`[searchService] Address cache hit for "${query}"`);
    return cached;
  }

  const startTime = Date.now();

  try {
    // Build URL with location bias
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`;
    
    // Add location bias for faster, more relevant results
    if (userLocation) {
      // Create a viewbox ~50 miles around user (0.5 degrees ≈ 35 miles)
      const viewboxSize = 0.5;
      const viewbox = [
        userLocation.longitude - viewboxSize, // west
        userLocation.latitude + viewboxSize,  // north
        userLocation.longitude + viewboxSize, // east
        userLocation.latitude - viewboxSize   // south
      ].join(',');
      
      url += `&viewbox=${viewbox}&bounded=1`;
    }
    
    // Add country code to limit search scope
    if (countryCode) {
      url += `&countrycodes=${countryCode}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Tavvy-App/1.0',
      },
    });

    if (!response.ok) {
      // If bounded search fails, try unbounded
      if (userLocation) {
        console.log('[searchService] Bounded search failed, trying unbounded');
        return searchAddressesUnbounded(query, limit, countryCode);
      }
      return [];
    }

    let results = await response.json();
    
    // If no results with bounds, try without bounds
    if (results.length === 0 && userLocation) {
      console.log('[searchService] No bounded results, expanding search');
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
    
    // Cache results
    setCache(addressCache, cacheKey, suggestions, userLocation);
    
    console.log(`[searchService] Address search: ${suggestions.length} results in ${Date.now() - startTime}ms`);
    return suggestions;
    
  } catch (error) {
    console.error('[searchService] Error in searchAddresses:', error);
    return [];
  }
}

/**
 * Unbounded address search (fallback when bounded search returns no results)
 */
async function searchAddressesUnbounded(
  query: string,
  limit: number,
  countryCode: string
): Promise<AddressSuggestion[]> {
  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`;
    
    if (countryCode) {
      url += `&countrycodes=${countryCode}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Tavvy-App/1.0',
      },
    });

    if (!response.ok) {
      return [];
    }

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

/**
 * Pre-fetch nearby places for instant autocomplete
 * Call this on app launch to cache local places
 * 
 * @param userLocation - User's current location
 * @param limit - Maximum places to cache (default: 100)
 */
export async function prefetchNearbyPlaces(
  userLocation: { latitude: number; longitude: number },
  limit: number = 100
): Promise<SearchResult[]> {
  const { latitude, longitude } = userLocation;
  const radiusDegrees = SEARCH_RADIUS_LOCAL; // ~20 miles
  
  const minLat = latitude - radiusDegrees;
  const maxLat = latitude + radiusDegrees;
  const minLng = longitude - radiusDegrees;
  const maxLng = longitude + radiusDegrees;

  console.log(`[searchService] Pre-fetching nearby places within ${radiusDegrees} degrees`);
  const startTime = Date.now();

  try {
    const { data, error } = await supabase
      .from('places_search')
      .select('place_id, name, city, region, category, latitude, longitude')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .limit(limit);

    if (error) {
      console.error('[searchService] Error pre-fetching places:', error);
      return [];
    }

    const results: SearchResult[] = (data || []).map(s => ({
      id: s.place_id,
      source: 'places' as PlaceSource,
      source_id: s.place_id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      city: s.city,
      region: s.region,
      category: s.category,
      distance: calculateDistance(latitude, longitude, s.latitude, s.longitude),
    }));

    // Sort by distance
    results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

    console.log(`[searchService] Pre-fetched ${results.length} nearby places in ${Date.now() - startTime}ms`);
    return results;
    
  } catch (error) {
    console.error('[searchService] Exception pre-fetching places:', error);
    return [];
  }
}

/**
 * Search pre-fetched places locally (instant results)
 * 
 * @param query - Search query
 * @param prefetchedPlaces - Array of pre-fetched places
 * @param limit - Maximum results
 */
export function searchPrefetchedPlaces(
  query: string,
  prefetchedPlaces: SearchResult[],
  limit: number = 5
): SearchResult[] {
  if (!query || query.trim().length < 1 || !prefetchedPlaces.length) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();
  
  // Filter and sort matching places
  const matches = prefetchedPlaces
    .filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      (p.city && p.city.toLowerCase().includes(searchTerm))
    )
    .sort((a, b) => {
      // Prioritize prefix matches
      const aStartsWith = a.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
      const bStartsWith = b.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
      if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
      // Then by distance
      return (a.distance || Infinity) - (b.distance || Infinity);
    })
    .slice(0, limit);

  return matches;
}

/**
 * Extract category from fsq_category_labels
 */
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
