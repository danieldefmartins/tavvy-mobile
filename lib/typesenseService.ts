/**
 * Typesense Search Service for Tavvy Mobile App
 * 
 * Provides lightning-fast search across 12.7M+ places with <50ms response times.
 * Replaces slow Supabase ILIKE queries for search functionality.
 * 
 * @module typesenseService
 */

const TYPESENSE_HOST = 'tavvy-typesense-production.up.railway.app';
const TYPESENSE_PORT = '443';
const TYPESENSE_PROTOCOL = 'https';
const TYPESENSE_API_KEY = '231eb42383d0a3a2832f47ec44b817e33692211d9cf2d158f49e5c3e608e6277';

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
  distance?: number; // in miles
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
function transformTypesensePlace(doc: TypesensePlace, distance?: number): PlaceSearchResult {
  const category = doc.categories && doc.categories.length > 0 
    ? doc.categories[0].split('>')[0].trim() 
    : undefined;
  
  const subcategory = doc.categories && doc.categories.length > 0
    ? doc.categories[0].split('>').pop()?.trim()
    : undefined;

  return {
    id: `fsq:${doc.fsq_place_id}`,
    fsq_place_id: doc.fsq_place_id,
    name: doc.name,
    category,
    subcategory,
    address: doc.address,
    locality: doc.locality,
    region: doc.region,
    country: doc.country,
    postcode: doc.postcode,
    latitude: doc.latitude,
    longitude: doc.longitude,
    tel: doc.tel,
    website: doc.website,
    email: doc.email,
    instagram: doc.instagram,
    facebook_id: doc.facebook_id,
    popularity: doc.popularity,
    distance,
  };
}

/**
 * Build Typesense API URL
 */
function buildSearchUrl(params: Record<string, any>): string {
  const baseUrl = `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places/documents/search`;
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  
  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Make Typesense API request
 */
async function typesenseRequest(url: string): Promise<any> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Typesense request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search places using Typesense
 * 
 * @param options Search options
 * @returns Search results with places and metadata
 * 
 * @example
 * ```typescript
 * const result = await searchPlaces({
 *   query: 'coffee',
 *   latitude: 40.7128,
 *   longitude: -74.0060,
 *   radiusKm: 5,
 *   limit: 20
 * });
 * 
 * console.log(`Found ${result.totalFound} places in ${result.searchTimeMs}ms`);
 * ```
 */
export async function searchPlaces(
  options: SearchOptions
): Promise<SearchResult> {
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

  // Build filter query
  const filters: string[] = [];
  
  if (country) {
    filters.push(`country:=${country}`);
  }
  
  if (region) {
    filters.push(`region:=${region}`);
  }
  
  if (locality) {
    filters.push(`locality:=${locality}`);
  }

  if (categories && categories.length > 0) {
    const categoryFilter = categories.map(c => `categories:=${c}`).join(' || ');
    filters.push(`(${categoryFilter})`);
  }

  // Calculate page number (Typesense uses 1-indexed pages)
  const page = Math.floor(offset / limit) + 1;

  // Build search parameters
  const searchParams: Record<string, any> = {
    q: query || '*',
    query_by: 'name,categories,address,locality,region',
    sort_by: 'popularity:desc',
    per_page: limit,
    page: page,
  };

  // Add filters
  if (filters.length > 0) {
    searchParams.filter_by = filters.join(' && ');
  }

  // Add geo-search if location provided
  if (latitude !== undefined && longitude !== undefined) {
    const geoFilter = `location:(${latitude}, ${longitude}, ${radiusKm} km)`;
    searchParams.filter_by = searchParams.filter_by 
      ? `${searchParams.filter_by} && ${geoFilter}`
      : geoFilter;
    searchParams.sort_by = `location(${latitude}, ${longitude}):asc,popularity:desc`;
  }

  try {
    const startTime = Date.now();
    const url = buildSearchUrl(searchParams);
    const searchResults = await typesenseRequest(url);
    const searchTimeMs = Date.now() - startTime;

    const places: PlaceSearchResult[] = (searchResults.hits || []).map((hit: any) => {
      const doc = hit.document as TypesensePlace;
      const distance = hit.geo_distance_meters?.location
        ? Math.round(hit.geo_distance_meters.location / 1609.34 * 10) / 10 // Convert to miles
        : undefined;
      return transformTypesensePlace(doc, distance);
    });

    console.log(`[Typesense] Found ${searchResults.found} places in ${searchTimeMs}ms`);

    return {
      places,
      totalFound: searchResults.found || 0,
      searchTimeMs,
      page,
    };
  } catch (error) {
    console.error('[Typesense] Search error:', error);
    throw error;
  }
}

/**
 * Get autocomplete suggestions
 * 
 * @param query Search query (minimum 2 characters)
 * @param limit Maximum number of suggestions
 * @param latitude Optional latitude for location-based prioritization
 * @param longitude Optional longitude for location-based prioritization
 * @returns Array of place name suggestions
 * 
 * @example
 * ```typescript
 * const suggestions = await getAutocompleteSuggestions('pizz', 10);
 * // Returns: ['Pizza Hut', 'Pizza Express', 'Pizzeria Uno', ...]
 * ```
 */
export async function getAutocompleteSuggestions(
  query: string,
  limit: number = 10,
  latitude?: number,
  longitude?: number
): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const searchParams: Record<string, any> = {
      q: query,
      query_by: 'name,categories',
      per_page: limit,
      prefix: true,
    };

    // Prioritize nearby results if location provided
    if (latitude !== undefined && longitude !== undefined) {
      searchParams.sort_by = `location(${latitude}, ${longitude}):asc`;
    }

    const url = buildSearchUrl(searchParams);
    const searchResults = await typesenseRequest(url);

    const suggestions = new Set<string>();
    
    (searchResults.hits || []).forEach((hit: any) => {
      const doc = hit.document;
      if (doc.name) {
        suggestions.add(doc.name);
      }
    });

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('[Typesense] Autocomplete error:', error);
    return [];
  }
}

/**
 * Search places within map bounds
 * 
 * @param bounds Map bounds (northeast and southwest coordinates)
 * @param category Optional category filter
 * @param limit Maximum number of results
 * @returns Array of places within bounds
 * 
 * @example
 * ```typescript
 * const places = await searchPlacesInBounds({
 *   ne: [-73.9, 40.8],
 *   sw: [-74.1, 40.7]
 * }, 'Restaurant', 100);
 * ```
 */
export async function searchPlacesInBounds(
  bounds: {
    ne: [number, number]; // [lng, lat]
    sw: [number, number]; // [lng, lat]
  },
  category?: string,
  limit: number = 150
): Promise<PlaceSearchResult[]> {
  const minLng = bounds.sw[0];
  const maxLng = bounds.ne[0];
  const minLat = bounds.sw[1];
  const maxLat = bounds.ne[1];

  try {
    const filters: string[] = [
      `latitude:>=${minLat}`,
      `latitude:<=${maxLat}`,
      `longitude:>=${minLng}`,
      `longitude:<=${maxLng}`,
    ];

    if (category && category !== 'All') {
      filters.push(`categories:=${category}`);
    }

    const searchParams: Record<string, any> = {
      q: '*',
      query_by: 'name',
      filter_by: filters.join(' && '),
      sort_by: 'popularity:desc',
      per_page: limit,
    };

    const url = buildSearchUrl(searchParams);
    const searchResults = await typesenseRequest(url);

    return (searchResults.hits || []).map((hit: any) => 
      transformTypesensePlace(hit.document as TypesensePlace)
    );
  } catch (error) {
    console.error('[Typesense] Bounds search error:', error);
    throw error;
  }
}

/**
 * Search nearby places
 * 
 * @param latitude Latitude
 * @param longitude Longitude
 * @param radiusKm Search radius in kilometers
 * @param categories Optional category filters
 * @param limit Maximum number of results
 * @returns Array of nearby places sorted by distance
 * 
 * @example
 * ```typescript
 * const nearby = await searchNearbyPlaces(
 *   40.7128,
 *   -74.0060,
 *   5,
 *   ['Restaurant', 'Cafe'],
 *   20
 * );
 * ```
 */
export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  categories?: string[],
  limit: number = 50
): Promise<PlaceSearchResult[]> {
  try {
    const result = await searchPlaces({
      query: '*',
      latitude,
      longitude,
      radiusKm,
      categories,
      limit,
    });

    return result.places;
  } catch (error) {
    console.error('[Typesense] Nearby search error:', error);
    throw error;
  }
}

/**
 * Get place by Foursquare ID
 * 
 * @param fsqPlaceId Foursquare place ID
 * @returns Place details or null if not found
 * 
 * @example
 * ```typescript
 * const place = await getPlaceById('4bf58dd8d48988d1c4941735');
 * if (place) {
 *   console.log(place.name, place.address);
 * }
 * ```
 */
export async function getPlaceById(
  fsqPlaceId: string
): Promise<PlaceSearchResult | null> {
  try {
    const searchParams: Record<string, any> = {
      q: fsqPlaceId,
      query_by: 'fsq_place_id',
      filter_by: `fsq_place_id:=${fsqPlaceId}`,
      per_page: 1,
    };

    const url = buildSearchUrl(searchParams);
    const result = await typesenseRequest(url);

    if (result.hits && result.hits.length > 0) {
      return transformTypesensePlace(result.hits[0].document as TypesensePlace);
    }

    return null;
  } catch (error) {
    console.error('[Typesense] Get place by ID error:', error);
    return null;
  }
}

/**
 * Health check
 * 
 * @returns True if Typesense server is healthy
 * 
 * @example
 * ```typescript
 * const isHealthy = await healthCheck();
 * if (!isHealthy) {
 *   // Fallback to Supabase
 * }
 * ```
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(
      `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/health`,
      {
        method: 'GET',
        headers: {
          'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.ok === true;
  } catch (error) {
    console.error('[Typesense] Health check failed:', error);
    return false;
  }
}

/**
 * Get collection statistics
 * 
 * @returns Collection stats or null if error
 */
export async function getCollectionStats(): Promise<{
  numDocuments: number;
  isHealthy: boolean;
} | null> {
  try {
    const response = await fetch(
      `${TYPESENSE_PROTOCOL}://${TYPESENSE_HOST}:${TYPESENSE_PORT}/collections/places`,
      {
        method: 'GET',
        headers: {
          'X-TYPESENSE-API-KEY': TYPESENSE_API_KEY,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const collection = await response.json();
    const isHealthy = await healthCheck();
    
    return {
      numDocuments: collection.num_documents || 0,
      isHealthy,
    };
  } catch (error) {
    console.error('[Typesense] Get stats error:', error);
    return null;
  }
}
