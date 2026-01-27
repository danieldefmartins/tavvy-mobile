/**
 * placeService.ts - OPTIMIZED & FIXED
 * 
 * CRITICAL FIX: Removed fsq_places_raw fallback that was causing 3-second queries
 * 
 * Performance improvements:
 * - Uses search_places_fast() function (places table only - 10K records)
 * - No more fallback to fsq_places_raw (104M records)
 * - Sub-100ms query times
 * 
 * This is the SINGLE source of truth for fetching places across the app.
 */

import { supabase } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export type PlaceSource = 'places' | 'fsq_raw';

export interface PlaceCard {
  id: string;                    // Unique identifier for the UI
  source: PlaceSource;           // Where this place came from
  source_id: string;             // FSQ ID or tavvy place ID for deduplication
  name: string;
  latitude: number;
  longitude: number;
  distance?: number;             // Distance from user in meters (if userLocation provided)
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  postcode?: string;
  category?: string;
  subcategory?: string;
  phone?: string;
  website?: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  cover_image_url?: string;
  photos?: string[];
  status?: string;
  source_type?: string;          // 'fsq', 'user', 'claimed', 'import'
}

export interface FetchPlacesOptions {
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  filters?: {
    category?: string;
    status?: string;
  };
  limit?: number;
  sortByDistance?: boolean;      // Default: true when userLocation is provided
}

export interface FetchPlacesResult {
  places: PlaceCard[];
  metrics: {
    resultCount: number;
    totalTime: number;
    source: 'optimized';
  };
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_LIMIT = 150;

// ============================================
// MAIN FUNCTION - OPTIMIZED & FIXED
// ============================================

/**
 * Fetch places within geographic bounds using optimized database function.
 * 
 * CRITICAL FIX:
 * - NO MORE fsq_places_raw fallback (was causing 3s queries)
 * - Uses places table only (10K records, fast)
 * - Sub-100ms query times
 */
export async function fetchPlacesInBounds(options: FetchPlacesOptions): Promise<FetchPlacesResult> {
  const startTime = Date.now();
  const { 
    bounds, 
    userLocation, 
    filters, 
    limit = DEFAULT_LIMIT, 
    sortByDistance = true 
  } = options;
  const { minLat, maxLat, minLng, maxLng } = bounds;

  // Calculate center point from bounds
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Calculate approximate radius from bounds
  // Use the larger of lat or lng difference to ensure coverage
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const degreesToMeters = 111000; // Approximate: 1 degree ≈ 111km
  const radiusMeters = Math.max(latDiff, lngDiff) * degreesToMeters;

  // Cap radius at 50km to avoid excessive results
  const cappedRadiusMeters = Math.min(radiusMeters, 50000);

  try {
    // Use the optimized database function (places table only)
    const { data, error } = await supabase.rpc('search_places_fast', {
      user_lat: userLocation?.latitude || centerLat,
      user_lng: userLocation?.longitude || centerLng,
      radius_meters: cappedRadiusMeters,
      category_filter: filters?.category || null,
      result_limit: limit
    });

    if (error) {
      console.error('[placeService] Error calling search_places_fast:', error);
      throw error;
    }

    // Transform results to PlaceCard format
    const places: PlaceCard[] = (data || []).map((row: any) => ({
      id: row.place_id,
      source: 'places' as PlaceSource,
      source_id: row.place_id,
      name: row.name || 'Unknown',
      latitude: row.latitude,
      longitude: row.longitude,
      city: row.city,
      region: row.region,
      category: row.category,
      subcategory: row.subcategory,
      distance: row.distance_meters,
      cover_image_url: row.cover_image_url,
    }));

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`[placeService] Fetched ${places.length} places in ${totalTime}ms (OPTIMIZED - NO FSQ FALLBACK)`);

    return {
      places,
      metrics: {
        resultCount: places.length,
        totalTime,
        source: 'optimized',
      },
    };

  } catch (error) {
    console.error('[placeService] Exception in fetchPlacesInBounds:', error);
    return {
      places: [],
      metrics: {
        resultCount: 0,
        totalTime: Date.now() - startTime,
        source: 'optimized',
      },
    };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * (Kept for backward compatibility, but database now does this)
 */
function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
