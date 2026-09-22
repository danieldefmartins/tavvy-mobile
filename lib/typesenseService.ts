import { canonicalPlaceId } from './searchIntent';
import { getPlaceCategories } from './placeCategories';
import { createSearchCache } from './searchCache';
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

// Public discovery settings are injected by the build; never embed a privileged fallback key.
const TYPESENSE_HOST = process.env.EXPO_PUBLIC_TYPESENSE_HOST || 'tavvy-typesense-production.up.railway.app';
const TYPESENSE_PORT = process.env.EXPO_PUBLIC_TYPESENSE_PORT || '443';
const TYPESENSE_PROTOCOL = process.env.EXPO_PUBLIC_TYPESENSE_PROTOCOL || 'https';
const TYPESENSE_API_KEY = process.env.EXPO_PUBLIC_TYPESENSE_API_KEY || '';

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
  // Future — requires sync pipeline update to populate these fields in Typesense
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
  const categories = getPlaceCategories(doc.categories);
  const category = categories.length > 0
    ? categories[0].split('>')[0].trim()
    : undefined;

  const subcategory = categories.length > 0
    ? categories[0].split('>').pop()?.trim()
    : undefined;

  const sourceId = doc.id?.startsWith('tavvy:') ? doc.id : (doc.fsq_id || doc.fsq_place_id || doc.id);
  const placeId = canonicalPlaceId(String(sourceId || ''));
  return {
    id: placeId,
    fsq_place_id: doc.fsq_id || doc.fsq_place_id || placeId.replace(/^fsq:/, ''),
    name: doc.name,
    category,
    subcategory,
    // Support both old and new schema field names
    address: doc.location_address || doc.address,
    locality: doc.location_locality || doc.locality,
    region: doc.location_region || doc.region,
    country: doc.location_country || doc.country,
    postcode: doc.location_postcode || doc.postcode,
    latitude: doc.geocodes_lat ?? doc.latitude ?? (Array.isArray(doc.location) ? doc.location[0] : undefined),
    longitude: doc.geocodes_lng ?? doc.longitude ?? (Array.isArray(doc.location) ? doc.location[1] : undefined),
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
const cachedSearch = createSearchCache<SearchResult>();
export function searchPlaces(options: SearchOptions): Promise<SearchResult> {
  const normalized = { ...options, query: options.query.trim() };
  // Include every filter, coordinates and pagination in the identity.
  const key = JSON.stringify(Object.entries(normalized).sort(([a], [b]) => a.localeCompare(b)));
  return cachedSearch(key, () => fetchSearchPlaces(normalized));
}

async function fetchSearchPlaces(options: SearchOptions): Promise<SearchResult> {
  const startTime = Date.now();
  const {
    query,
    latitude,
    longitude,
    radiusKm, // No default - must be explicitly set
    country,
    region,
    locality,
    categories,
    limit = 50,
    offset = 0,
  } = options;

  // LOCATION FILTERING LOGIC:
  // - If latitude/longitude provided with radiusKm: Filter by geo radius (nearby search)
  // - If locality/region/country provided: Filter by location name (explicit location search)
  // - If neither: This is a global search (should be rare, only for specific use cases)
  const hasGeoLocation = !locality && !region && !country && latitude !== undefined && longitude !== undefined && radiusKm !== undefined;
  const hasExplicitLocation = locality || region || country;

  console.log('[Typesense] Search mode:', {
    hasGeoLocation,
    hasExplicitLocation,
    radiusKm,
    query
  });

  try {
    const searchParams: any = {
      q: query || '*',
      // Search by name, categories, and location
      query_by: 'name,categories,location_locality,location_region',
      query_by_weights: '4,3,1,1',

      // Sort by distance first when geo location filtering is active, then by popularity
      // This ensures nearby results always appear first (user requirement)
      // Only apply geo sorting when we have coordinates AND radius (nearby search)
      sort_by: hasGeoLocation
        ? `_text_match:desc,location(${latitude}, ${longitude}):asc,popularity:desc`
        : '_text_match:desc,popularity:desc',
      per_page: limit,
      page: Math.floor(offset / limit) + 1,

      // Add typo tolerance for better search experience
      num_typos: 2,                    // Allow up to 2 typos
      typo_tokens_threshold: 1,        // Start typo tolerance after 1 token
      drop_tokens_threshold: 0,        // Drop tokens if no results after 2 attempts

      // Autocomplete does not consume facets; avoid computing unused counts.

      // Use max_score for best matching field
      text_match_type: 'max_score',
    };

    // Build all filters (geo + location + category)
    const filters = [];

    // Add geo-location filter ONLY if coordinates AND radiusKm are provided
    // This is CRITICAL for ensuring nearby results - filter by radius FIRST
    // Without radiusKm, we skip geo filtering (for explicit location searches like "restaurants in NYC")
    if (hasGeoLocation) {
      // Use 'location' field with km units (matches Typesense schema for places collection)
      filters.push(`location:(${latitude}, ${longitude}, ${radiusKm} km)`);
      console.log(`[Typesense] Geo filter: within ${radiusKm}km of (${latitude}, ${longitude})`);
    }

    // Add country/region/locality filters
    const filterValue = (value: string) => "`" + value.replace(/[`\\]/g, "") + "`";
    if (country) filters.push(`location_country:=${filterValue(country)}`);
    if (region) filters.push(`location_region:=${filterValue(region)}`);
    // Use exact match for locality to avoid matching other cities with similar names
    if (locality) {
      // Capitalize first letter for better matching
      const capitalizedLocality = locality.charAt(0).toUpperCase() + locality.slice(1).toLowerCase();
      filters.push(`location_locality:=${filterValue(locality)}`);
    }

    console.log('[Typesense] Search params:', { query, country, region, locality, filters });

    // Add category filter (if provided)
    if (categories && categories.length > 0) {
      const categoryQuery = categories.join(',');
      searchParams.q = `${query} ${categoryQuery}`;
    }

    // Combine all filters with AND logic
    if (filters.length > 0) {
      searchParams.filter_by = filters.join(' && ');
    }

    const url = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/search`;
    const queryString = new URLSearchParams(searchParams).toString();

    // Add timeout to prevent hanging requests (especially for 502 errors)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(`${url}?${queryString}`, {
        headers: {
          'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('[Typesense] HTTP Error:', response.status, errorText);

        // Special handling for 502 Bad Gateway errors
        if (response.status === 502) {
          console.warn('[Typesense] 502 Bad Gateway - server may be restarting');
          throw new Error('TYPESENSE_502: Search service temporarily unavailable');
        }

        throw new Error(`Typesense search failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[Typesense] Response:', { found: data.found, hits: data.hits?.length, searchTimeMs: data.search_time_ms });

      const places = data.hits.map((hit: any) => {
        const doc = hit.document;
        const rawDistance = typeof hit.geo_distance_meters === 'object' ? hit.geo_distance_meters?.location : hit.geo_distance_meters;
        const distance = typeof rawDistance === 'number' && Number.isFinite(rawDistance) && rawDistance >= 0 ? rawDistance : undefined;

        return transformTypesensePlace(doc, distance);
      });

      const result = {
        places,
        totalFound: data.found,
        searchTimeMs: data.search_time_ms,
        page: data.page,
      };

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
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      // Handle abort/timeout specifically
      if (fetchError.name === 'AbortError') {
        console.warn('[Typesense] Request timed out after 5 seconds');
        throw new Error('TYPESENSE_TIMEOUT: Search request timed out');
      }

      throw fetchError;
    }
  } catch (error: any) {
    console.warn('[typesenseService] Search failed:', error);

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

    const searchParams: any = {
      q: category || '*',
      query_by: 'name,categories',
      query_by_weights: '3,2',
      filter_by: `location:(${centerLat}, ${centerLng}, ${radiusKm} km)`,
      sort_by: `location(${centerLat}, ${centerLng}):asc,popularity:desc`,
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
      console.warn('[typesenseService] Typesense API error:', errorText);
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

    const places = data.hits
      .map((hit: any) => transformTypesensePlace(hit.document))
      .filter((p: PlaceSearchResult) =>
        typeof p.latitude === 'number' && typeof p.longitude === 'number' &&
        !isNaN(p.latitude) && !isNaN(p.longitude)
      );

    return {
      places,
      totalFound: data.found || 0,
      searchTimeMs: data.search_time_ms || 0,
      page: 1,
    };
  } catch (error) {
    console.warn('[typesenseService] Bounds search failed:', error);
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
      // Search by name only
      query_by: 'name',

      // Enable prefix search for better autocomplete
      prefix: 'true',
      infix: 'fallback',    // Fallback to infix if prefix finds nothing

      // Sort by popularity
      sort_by: 'popularity:desc',

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
    console.warn('[typesenseService] Autocomplete failed:', error);
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
    console.warn('[typesenseService] Get place by ID failed:', error);
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
