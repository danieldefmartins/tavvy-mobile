import { searchAcrossProviders } from './placeSearch';
import { SearchContext } from './searchIntent';
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
import { searchPlaces as typesenseSearch } from './typesenseService';

// ============================================
// TYPES
// ============================================

export interface SearchResult extends PlaceCard {
  matchScore?: number;           // Relevance score for sorting
  distance?: number;             // Distance from user if location provided
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

// Progressive search radius tiers (in degrees, ~1 degree ≈ 69 miles)
const SEARCH_RADIUS_LOCAL = 0.3;      // ~20 miles - fastest, most relevant
const SEARCH_RADIUS_REGIONAL = 0.8;   // ~55 miles - expanded search

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
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
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
export async function searchSuggestions(query: string, limit = 8, userLocation?: { latitude: number; longitude: number }, context: SearchContext = {}): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const response = await searchAcrossProviders(query, limit, { coordinates: userLocation, ...context });
  return response.places as SearchResult[];
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
    // Use 'places' table (canonical) instead of 'places_search' which may not exist
    const { data, error } = await supabase
      .from('places')
      .select('id, name, city, region, tavvy_category, tavvy_subcategory, latitude, longitude, cover_image_url, street, phone')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
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
      subcategory: s.tavvy_subcategory,
      cover_image_url: s.cover_image_url,
      address: s.street,
      phone: s.phone,
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
      (p.city && p.city.toLowerCase().includes(searchTerm)) ||
      (p.category && p.category.toLowerCase().includes(searchTerm)) ||
      (p.subcategory && p.subcategory.toLowerCase().includes(searchTerm))
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
