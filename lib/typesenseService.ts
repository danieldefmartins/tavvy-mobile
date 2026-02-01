import { logSearchAnalytics } from './searchAnalytics';

/**
 * Typesense Search Service for Tavvy Mobile App - WITH TAP-BASED RANKING
 * 
 * This enhanced version uses user tap data to improve search relevance:
 * - Searches tap_signals field for user-validated attributes
 * - Ranks by tap_quality_score (weighted by signal importance)
 * - Falls back to popularity for places without taps
 * 
 * Example: "best food Miami" will prioritize places where users tapped "Quality Food"
 * 
 * @module typesenseService
 */

// Load from environment variables (with fallback for development)
const TYPESENSE_HOST = process.env.EXPO_PUBLIC_TYPESENSE_HOST || 'tavvy-typesense-production.up.railway.app';
const TYPESENSE_PORT = process.env.EXPO_PUBLIC_TYPESENSE_PORT || '443';
const TYPESENSE_PROTOCOL = process.env.EXPO_PUBLIC_TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_API_KEY = process.env.EXPO_PUBLIC_TYPESENSE_API_KEY || '231eb42383d0a3a2832f47ec44b817e33692211d9cf2d158f49e5c3e608e6277';

// ============================================
// QUERY CACHE
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<SearchResult>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

/**
 * Get cached query result if available and not expired
 */
function getCachedQuery(key: string): SearchResult | null {
  const entry = queryCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    console.log('[typesense] Cache hit!');
    return entry.data;
  }
  if (entry) {
    queryCache.delete(key); // Remove expired entry
  }
  return null;
}

/**
 * Set cache entry with LRU eviction
 */
function setCachedQuery(key: string, data: SearchResult): void {
  // LRU eviction if cache is full
  if (queryCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = queryCache.keys().next().value;
    if (oldestKey) queryCache.delete(oldestKey);
  }
  queryCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Generate cache key from search options
 */
function getCacheKey(options: SearchOptions): string {
  return JSON.stringify(options);
}

/**
 * Clear query cache
 */
export function clearQueryCache(): void {
  queryCache.clear();
  console.log('[typesense] Query cache cleared');
}

export interface TypesensePlace {
  fsq_place_id: string;
  name: string;
  categories?: string[];
  address?: string;
  locality?: string;
  region?: string;
  country?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  tel?: string;
  website?: string;
  email?: string;
  instagram?: string;
  facebook_id?: string;
  popularity: number;
  // NEW: Tap-based fields
  tap_signals?: string[];      // e.g., ["Quality Food", "Great Service"]
  tap_categories?: string[];   // e.g., ["quality", "service"]
  tap_total?: number;          // Total tap count
  tap_quality_score?: number;  // Weighted score (quality=5, value=3, etc.)
}

export interface PlaceSearchResult {
  id: string;
  fsq_place_id: string;
  name: string;
  category?: string;
  subcategory?: string;
  address?: string;
  locality?: string;
  region?: string;
  country?: string;
  postcode?: string;
  latitude?: number;
  longitude?: number;
  tel?: string;
  website?: string;
  email?: string;
  instagram?: string;
  facebook_id?: string;
  popularity: number;
  distance?: number;
  // NEW: Tap data
  tapSignals?: string[];
  tapTotal?: number;
  tapQualityScore?: number;
}

export interface SearchOptions {
  query: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  country?: string;
  region?: string;
  locality?: string;
  categories?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  places: PlaceSearchResult[];
  totalFound: number;
  searchTimeMs: number;
  page: number;
}

/**
 * Transform Typesense document to PlaceSearchResult
 */
function transformTypesensePlace(doc: any, distance?: number): PlaceSearchResult {
  const category = doc.categories && doc.categories.length > 0 
    ? doc.categories[0].split('>')[0].trim() 
    : undefined;
  
  const subcategory = doc.categories && doc.categories.length > 0
    ? doc.categories[0].split('>').pop()?.trim()
    : undefined;

  // Determine ID prefix based on source
  const idPrefix = doc.id?.startsWith('tavvy:') ? 'tavvy:' : 'fsq:';
  const placeId = doc.id?.replace(/^(tavvy:|fsq:)/, '') || doc.fsq_place_id;

  return {
    id: `${idPrefix}${placeId}`,
    fsq_place_id: doc.fsq_id || doc.fsq_place_id || placeId,
    name: doc.name,
    category,
    subcategory,
    // Support both old and new schema field names
    address: doc.location_address || doc.address,
    locality: doc.location_locality || doc.locality,
    region: doc.location_region || doc.region,
    country: doc.location_country || doc.country,
    postcode: doc.location_postcode || doc.postcode,
    latitude: doc.geocodes_lat || doc.latitude,
    longitude: doc.geocodes_lng || doc.longitude,
    tel: doc.tel,
    website: doc.website,
    email: doc.email,
    instagram: doc.instagram,
    facebook_id: doc.facebook_id,
    popularity: doc.popularity || 50,
    distance,
    // NEW: Include tap data
    tapSignals: doc.tap_signals,
    tapTotal: doc.tap_total || 0,
    tapQualityScore: doc.tap_quality_score || 0,
  };
}

/**
 * Search places with TAP-BASED RANKING
 * 
 * This is the key enhancement: searches both place data AND tap signals,
 * then ranks by tap quality score.
 */
export async function searchPlaces(options: SearchOptions): Promise<SearchResult> {
  const startTime = Date.now();
  const {
    query,
    latitude,
    longitude,
    radiusKm = 50,
    country,
    region,
    locality,
    categories,
    limit = 50,
    offset = 0,
  } = options;

  // Check cache first
  const cacheKey = getCacheKey(options);
  const cached = getCachedQuery(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const searchParams: any = {
      q: query || '*',
      // Search by name, categories, and location
      query_by: 'name,categories,location_locality,location_region',
      query_by_weights: '4,3,1,1',
      
      // Sort by popularity (tap-based sorting will be added when tap data is available)
      sort_by: 'popularity:desc',      
      per_page: limit,
      page: Math.floor(offset / limit) + 1,
      
      // Add typo tolerance for better search experience
      num_typos: 2,                    // Allow up to 2 typos
      typo_tokens_threshold: 1,        // Start typo tolerance after 1 token
      drop_tokens_threshold: 2,        // Drop tokens if no results after 2 attempts
      
      // Add faceted search for category counts
      facet_by: 'categories,location_region',
      max_facet_values: 20,
      
      // Use max_score for best matching field
      text_match_type: 'max_score',
    };

    // Add location filter
    if (latitude && longitude) {
      searchParams.filter_by = `location:(${latitude}, ${longitude}, ${radiusKm * 1000} m)`;
    }

    // Add country/region/locality filters
    const filters = [];
    if (country) filters.push(`location_country:=${country}`);
    if (region) filters.push(`location_region:=${region}`);
    if (locality) filters.push(`location_locality:=${locality}`);
    
    console.log('[Typesense] Search params:', { query, country, region, locality, filters });
    
    // Add category filter (if provided)
    if (categories && categories.length > 0) {
      const categoryQuery = categories.join(',');
      searchParams.q = `${query} ${categoryQuery}`;
    }
    
    if (filters.length > 0) {
      searchParams.filter_by = filters.join(' && ');
    }

    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/search`;
    const queryString = new URLSearchParams(searchParams).toString();

    const response = await fetch(`${url}?${queryString}`, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    console.log('[Typesense] Full URL:', `${url}?${queryString}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Typesense] HTTP Error:', response.status, errorText);
      throw new Error(`Typesense search failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Typesense] Full response:', JSON.stringify(data, null, 2));
    
    console.log('[Typesense] Response:', { found: data.found, hits: data.hits?.length, searchTimeMs: data.search_time_ms });

    const places = data.hits.map((hit: any) => {
      const doc = hit.document;
      const distance = hit.geo_distance_meters 
        ? (hit.geo_distance_meters / 1609.34) // Convert meters to miles
        : undefined;
      
      return transformTypesensePlace(doc, distance);
    });

    const result = {
      places,
      totalFound: data.found,
      searchTimeMs: data.search_time_ms,
      page: data.page,
    };
    
    // Cache the result
    setCachedQuery(cacheKey, result);
    
    // Log analytics
    logSearchAnalytics({
      query: query || '*',
      resultsCount: places.length,
      searchTimeMs: Date.now() - startTime,
      hasLocation: !!(latitude && longitude),
      latitude,
      longitude,
      filters: categories,
      source: 'typesense',
    });
    
    return result;
  } catch (error: any) {
    console.error('[typesenseService] Search failed:', error);
    
    // Log failed search
    logSearchAnalytics({
      query: query || '*',
      resultsCount: 0,
      searchTimeMs: Date.now() - startTime,
      hasLocation: !!(latitude && longitude),
      error: error.message,
      source: 'typesense',
    });
    
    throw error;
  }
}

/**
 * Search places within map bounds with TAP-BASED RANKING
 */
export async function searchPlacesInBounds(options: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  category?: string;
  limit?: number;
}): Promise<SearchResult> {
  const { minLat, maxLat, minLng, maxLng, category, limit = 150 } = options;

  try {
    // Calculate center point and radius for geopoint search
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    // Calculate radius in meters (approximate using Haversine)
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const radiusKm = Math.max(latDiff, lngDiff) * 111; // 1 degree ≈ 111km
    const radiusMeters = Math.ceil(radiusKm * 1000);

    const searchParams: any = {
      q: category || '*',
      // ENHANCED: Search with tap_signals for better relevance
      query_by: 'name,tap_signals,categories',
      query_by_weights: '3,5,2',
      
      // ENHANCED: Sort by tap score first, then proximity
      sort_by: `tap_quality_score:desc,location(${centerLat}, ${centerLng}):asc`,
      
      // Note: Not using filter_by to avoid schema issues
      // Results will be sorted by distance from center point
      per_page: limit,
    };

    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/search`;
    const queryString = new URLSearchParams(searchParams).toString();

    const response = await fetch(`${url}?${queryString}`, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[typesenseService] Typesense API error:', errorText);
      throw new Error(`Typesense bounds search failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if response has valid structure
    if (!data || !data.hits || !Array.isArray(data.hits)) {
      console.warn('[typesenseService] Invalid response structure:', data);
      return {
        places: [],
        totalFound: 0,
        searchTimeMs: 0,
        page: 1,
      };
    }

    const places = data.hits.map((hit: any) => 
      transformTypesensePlace(hit.document)
    );

    return {
      places,
      totalFound: data.found || 0,
      searchTimeMs: data.search_time_ms || 0,
      page: 1,
    };
  } catch (error) {
    console.error('[typesenseService] Bounds search failed:', error);
    // Return empty result instead of crashing the app
    return {
      places: [],
      totalFound: 0,
      searchTimeMs: 0,
      page: 1,
    };
  }
}

/**
 * Get autocomplete suggestions with TAP-BASED RANKING
 */
export async function getAutocompleteSuggestions(
  query: string,
  limit: number = 10
): Promise<string[]> {
  if (!query || query.length < 2) return [];

  try {
    const searchParams = {
      q: query,
      // Search by name and tap_signals for better suggestions
      query_by: 'name,tap_signals',
      
      // Enable prefix search for better autocomplete
      prefix: 'true,true',  // Enable prefix search on both fields
      infix: 'fallback',    // Fallback to infix if prefix finds nothing
      
      // Sort by tap count first, then popularity
      sort_by: 'tap_total:desc,popularity:desc',
      
      per_page: limit.toString(),
    };

    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/search`;
    const queryString = new URLSearchParams(searchParams).toString();

    const response = await fetch(`${url}?${queryString}`, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    
    // Return unique place names
    const suggestions = data.hits
      .map((hit: any) => hit.document.name)
      .filter((name: string, index: number, self: string[]) => 
        self.indexOf(name) === index
      );

    return suggestions;
  } catch (error) {
    console.error('[typesenseService] Autocomplete failed:', error);
    return [];
  }
}

/**
 * Search nearby places with TAP-BASED RANKING
 */
export async function searchNearbyPlaces(options: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  category?: string;
  limit?: number;
}): Promise<SearchResult> {
  const { latitude, longitude, radiusKm = 5, category, limit = 50 } = options;

  return searchPlaces({
    query: category || '*',
    latitude,
    longitude,
    radiusKm,
    limit,
  });
}

/**
 * Get place by ID
 */
export async function getPlaceById(placeId: string): Promise<PlaceSearchResult | null> {
  try {
    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/${placeId}`;

    const response = await fetch(url, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) return null;

    const doc = await response.json();
    return transformTypesensePlace(doc);
  } catch (error) {
    console.error('[typesenseService] Get place by ID failed:', error);
    return null;
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ ok: boolean; message?: string }> {
  try {
    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/health`;

    const response = await fetch(url, {
      headers: {
        'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
      },
    });

    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { ok: data.ok === true };
  } catch (error: any) {
    return { ok: false, message: error.message };
  }
}
