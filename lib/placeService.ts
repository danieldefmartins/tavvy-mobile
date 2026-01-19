/**
 * placeService.ts
 * 
 * Centralized place-fetching service with hybrid strategy:
 * 1. Query canonical `places` table first (fast path)
 * 2. If results < threshold, fallback to `fsq_places_raw` (coverage path)
 * 3. Deduplicate by source_id to avoid showing duplicate places
 * 
 * This is the SINGLE source of truth for fetching places across the app.
 * DO NOT scatter place-fetching logic across multiple screens.
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
  filters?: {
    category?: string;
    status?: string;
  };
  limit?: number;
  fallbackThreshold?: number;    // Default: 40
}

export interface FetchPlacesResult {
  places: PlaceCard[];
  metrics: {
    fromPlaces: number;
    fromFsqRaw: number;
    fallbackTriggered: boolean;
    totalTime: number;
  };
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_LIMIT = 150;
const DEFAULT_FALLBACK_THRESHOLD = 40;

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Fetch places within geographic bounds using hybrid strategy.
 * 
 * Strategy:
 * 1. Query `places` table first (canonical, fast)
 * 2. If results < threshold, query `fsq_places_raw` as fallback
 * 3. Deduplicate by source_id
 * 4. Return unified PlaceCard[] format
 */
export async function fetchPlacesInBounds(options: FetchPlacesOptions): Promise<FetchPlacesResult> {
  const startTime = Date.now();
  const { bounds, filters, limit = DEFAULT_LIMIT, fallbackThreshold = DEFAULT_FALLBACK_THRESHOLD } = options;
  const { minLat, maxLat, minLng, maxLng } = bounds;

  let placesFromCanonical: PlaceCard[] = [];
  let placesFromFsqRaw: PlaceCard[] = [];
  let fallbackTriggered = false;

  // ============================================
  // STEP 1: Query canonical `places` table (fast path)
  // ============================================
  try {
    let query = supabase
      .from('places')
      .select('id, source_type, source_id, name, latitude, longitude, address, city, region, country, postcode, tavvy_category, tavvy_subcategory, phone, website, email, instagram, facebook, twitter, cover_image_url, photos, status')
      .gte('latitude', minLat)
      .lte('latitude', maxLat)
      .gte('longitude', minLng)
      .lte('longitude', maxLng)
      .eq('status', 'active')
      .limit(limit);

    if (filters?.category) {
      query = query.eq('tavvy_category', filters.category);
    }

    const { data: placesData, error: placesError } = await query;

    if (placesError) {
      console.warn('[placeService] Error querying places table:', placesError);
    } else if (placesData) {
      placesFromCanonical = placesData.map(transformCanonicalPlace);
      console.log(`[placeService] Fetched ${placesFromCanonical.length} places from canonical table`);
    }
  } catch (error) {
    console.error('[placeService] Exception querying places table:', error);
  }

  // ============================================
  // STEP 2: Check if fallback is needed
  // ============================================
  if (placesFromCanonical.length < fallbackThreshold) {
    fallbackTriggered = true;
    console.log(`[placeService] Fallback triggered: ${placesFromCanonical.length} < ${fallbackThreshold} threshold`);

    // Get source_ids to exclude (already have these from canonical)
    const existingSourceIds = new Set(
      placesFromCanonical
        .filter(p => p.source_id)
        .map(p => p.source_id)
    );

    // ============================================
    // STEP 3: Query fsq_places_raw as fallback
    // ============================================
    try {
      const { data: fsqData, error: fsqError } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, latitude, longitude, address, locality, region, country, postcode, tel, website, email, instagram, facebook_id, twitter, fsq_category_ids, fsq_category_labels, date_created, date_refreshed')
        .gte('latitude', minLat)
        .lte('latitude', maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng)
        .is('date_closed', null)
        .limit(limit - placesFromCanonical.length);

      if (fsqError) {
        console.warn('[placeService] Error querying fsq_places_raw:', fsqError);
      } else if (fsqData) {
        // Filter out places already in canonical table
        const newFsqPlaces = fsqData.filter(p => !existingSourceIds.has(p.fsq_place_id));
        placesFromFsqRaw = newFsqPlaces.map(transformFsqRawPlace);
        console.log(`[placeService] Fetched ${fsqData.length} from fsq_raw, ${placesFromFsqRaw.length} after dedup`);
      }
    } catch (error) {
      console.error('[placeService] Exception querying fsq_places_raw:', error);
    }
  }

  // ============================================
  // STEP 4: Merge and return results
  // ============================================
  const allPlaces = [...placesFromCanonical, ...placesFromFsqRaw];
  const endTime = Date.now();

  const result: FetchPlacesResult = {
    places: allPlaces,
    metrics: {
      fromPlaces: placesFromCanonical.length,
      fromFsqRaw: placesFromFsqRaw.length,
      fallbackTriggered,
      totalTime: endTime - startTime,
    },
  };

  console.log(`[placeService] Total: ${allPlaces.length} places (${result.metrics.fromPlaces} canonical, ${result.metrics.fromFsqRaw} fsq_raw) in ${result.metrics.totalTime}ms`);

  return result;
}

// ============================================
// TRANSFORM FUNCTIONS
// ============================================

/**
 * Transform a row from the canonical `places` table to PlaceCard format
 */
function transformCanonicalPlace(place: any): PlaceCard {
  return {
    id: place.id,
    source: 'places',
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
}

/**
 * Transform a row from `fsq_places_raw` table to PlaceCard format
 */
function transformFsqRawPlace(place: any): PlaceCard {
  // Extract category from fsq_category_labels
  let category = 'Other';
  let subcategory = '';
  
  if (place.fsq_category_labels) {
    // fsq_category_labels is stored as comma-separated text or array
    let labels: string[] = [];
    if (Array.isArray(place.fsq_category_labels)) {
      labels = place.fsq_category_labels;
    } else if (typeof place.fsq_category_labels === 'string') {
      labels = place.fsq_category_labels.split(',').map((s: string) => s.trim());
    }
    
    if (labels.length > 0) {
      const fullCategory = labels[0];
      if (typeof fullCategory === 'string') {
        const parts = fullCategory.split('>');
        if (parts.length > 1) {
          category = parts[0].trim();
          subcategory = parts[parts.length - 1].trim();
        } else {
          category = fullCategory.trim();
        }
      }
    }
  }

  return {
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
    subcategory,
    phone: place.tel,
    website: place.website,
    email: place.email,
    instagram: place.instagram,
    facebook: place.facebook_id,
    twitter: place.twitter,
    cover_image_url: undefined,
    photos: [],
    status: 'active',
  };
}

// ============================================
// HELPER: Get place ID for navigation
// ============================================

/**
 * Get the ID to use when navigating to PlaceDetails.
 * For canonical places, use the source_id (fsq_id).
 * For fsq_raw places, use the fsq_place_id.
 */
export function getPlaceIdForNavigation(place: PlaceCard): string {
  if (place.source === 'places') {
    return place.source_id;
  }
  // For fsq_raw, strip the 'fsq:' prefix
  return place.source_id;
}

// ============================================
// ADDITIONAL UTILITIES
// ============================================

/**
 * Fetch a single place by ID (for PlaceDetails screen)
 */
export async function fetchPlaceById(placeId: string): Promise<PlaceCard | null> {
  // First try canonical places table
  const { data: canonicalData, error: canonicalError } = await supabase
    .from('places')
    .select('*')
    .or(`id.eq.${placeId},source_id.eq.${placeId}`)
    .single();

  if (canonicalData && !canonicalError) {
    return transformCanonicalPlace(canonicalData);
  }

  // Fallback to fsq_places_raw
  const { data: fsqData, error: fsqError } = await supabase
    .from('fsq_places_raw')
    .select('*')
    .eq('fsq_place_id', placeId)
    .single();

  if (fsqData && !fsqError) {
    return transformFsqRawPlace(fsqData);
  }

  // Try places_unified view as last resort
  const { data: unifiedData, error: unifiedError } = await supabase
    .from('places_unified')
    .select('*')
    .eq('id', placeId)
    .single();

  if (unifiedData && !unifiedError) {
    return {
      id: unifiedData.id,
      source: 'places',
      source_id: unifiedData.id,
      name: unifiedData.name || 'Unknown',
      latitude: unifiedData.latitude,
      longitude: unifiedData.longitude,
      address: unifiedData.address,
      city: unifiedData.city,
      region: unifiedData.region,
      country: unifiedData.country,
      postcode: unifiedData.postcode,
      category: unifiedData.primary_category,
      phone: unifiedData.phone,
      website: unifiedData.website,
      email: unifiedData.email,
      instagram: unifiedData.instagram,
      facebook: unifiedData.facebook,
      twitter: unifiedData.twitter,
      cover_image_url: unifiedData.cover_image_url,
      photos: unifiedData.photos || [],
      status: 'active',
    };
  }

  console.warn(`[placeService] Place not found: ${placeId}`);
  return null;
}
