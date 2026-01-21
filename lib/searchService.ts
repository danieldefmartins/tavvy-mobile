/**
 * searchService.ts
 * 
 * Centralized search service with hybrid strategy:
 * 1. Query `places_search` table first (optimized for search)
 * 2. If results < threshold, fallback to `fsq_places_raw` name search
 * 3. Deduplicate by source_id
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

/**
 * Search for suggestions (autocomplete) - optimized for speed
 * Searches both places database and FSQ raw in parallel
 * Minimum 1 character to start searching
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

  try {
    // Search both sources in parallel for speed
    const [placesResult, fsqResult] = await Promise.all([
      // Search places_search table
      supabase
        .from('places_search')
        .select('place_id, name, city, region, category, latitude, longitude')
        .or(`name_norm.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
        .limit(limit),
      // Search fsq_places_raw table
      supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, locality, region, latitude, longitude, fsq_category_labels')
        .or(`name.ilike.%${searchTerm}%,locality.ilike.%${searchTerm}%`)
        .is('date_closed', null)
        .limit(limit)
    ]);

    const results: SearchResult[] = [];
    const seenNames = new Set<string>();

    // Process places_search results first (higher priority)
    if (placesResult.data) {
      for (const s of placesResult.data) {
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
          if (userLocation && s.latitude && s.longitude) {
            result.distance = calculateDistance(
              userLocation.latitude, userLocation.longitude,
              s.latitude, s.longitude
            );
          }
          results.push(result);
        }
      }
    }

    // Add FSQ results (deduplicated)
    if (fsqResult.data) {
      for (const p of fsqResult.data) {
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
          if (userLocation && p.latitude && p.longitude) {
            result.distance = calculateDistance(
              userLocation.latitude, userLocation.longitude,
              p.latitude, p.longitude
            );
          }
          results.push(result);
        }
      }
    }

    // Sort by distance if location provided, otherwise by name match quality
    if (userLocation) {
      results.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else {
      // Prioritize exact prefix matches
      results.sort((a, b) => {
        const aStartsWith = a.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
        const bStartsWith = b.name.toLowerCase().startsWith(searchTerm) ? 0 : 1;
        return aStartsWith - bStartsWith;
      });
    }

    return results.slice(0, limit);
  } catch (error) {
    console.error('[searchService] Error in searchSuggestions:', error);
    return [];
  }
}

/**
 * Search for address suggestions using Nominatim (OpenStreetMap)
 * Free, no API key required
 */
export async function searchAddresses(
  query: string,
  limit: number = 5
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Tavvy-App/1.0',
        },
      }
    );

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
    console.error('[searchService] Error in searchAddresses:', error);
    return [];
  }
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
