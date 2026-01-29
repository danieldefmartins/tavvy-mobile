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
import { searchPlacesInBounds as typesenseSearchBounds } from './typesenseService';

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
  fallbackThreshold?: number;    // Default: 40
  sortByDistance?: boolean;      // Default: true when userLocation is provided
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
  const { bounds, userLocation, filters, limit = DEFAULT_LIMIT, fallbackThreshold = DEFAULT_FALLBACK_THRESHOLD, sortByDistance = true } = options;
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
    // STEP 3: Try Typesense first (100x faster!)
    // ============================================
    try {
      const typesenseResults = await typesenseSearchBounds(
        {
          ne: [maxLng, maxLat],
          sw: [minLng, minLat]
        },
        filters?.category,
        limit - placesFromCanonical.length
      );

      if (typesenseResults && typesenseResults.length > 0) {
        // Transform and filter out duplicates
        const newTypesensePlaces = typesenseResults
          .filter(p => {
            const isTavvy = p.id.startsWith('tavvy:');
            const sourceId = isTavvy ? p.id.replace('tavvy:', '') : p.fsq_place_id;
            return !existingSourceIds.has(sourceId);
          })
          .map(p => {
            const isTavvy = p.id.startsWith('tavvy:');
            return {
            id: p.id,
            source: (isTavvy ? 'places' : 'fsq_raw') as PlaceSource,
            source_id: isTavvy ? p.id.replace('tavvy:', '') : p.fsq_place_id,
            source_type: isTavvy ? 'tavvy' : 'fsq',
            name: p.name,
            latitude: p.latitude!,
            longitude: p.longitude!,
            address: p.address,
            city: p.locality,
            region: p.region,
            country: p.country,
            postcode: p.postcode,
            category: p.category,
            subcategory: p.subcategory,
            phone: p.tel,
            website: p.website,
            email: p.email,
            instagram: p.instagram,
            facebook: p.facebook_id,
            cover_image_url: undefined,
            photos: [],
            status: 'active',
          };
          });
        
        placesFromFsqRaw = newTypesensePlaces;
        console.log(`[placeService] ⚡ Typesense: ${placesFromFsqRaw.length} places in bounds`);
        
        // Skip Supabase fallback if Typesense succeeded
        if (placesFromFsqRaw.length > 0) {
          // Jump to merge step
        } else {
          throw new Error('No Typesense results');
        }
      }
    } catch (typesenseError) {
      console.warn('[placeService] Typesense failed, falling back to Supabase:', typesenseError);
    }

    // ============================================
    // STEP 4: Fallback to fsq_places_raw (if Typesense failed)
    // ============================================
    if (placesFromFsqRaw.length === 0) {
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
  }

  // ============================================
  // STEP 4: Merge, deduplicate, and return results
  // ============================================
  const allPlaces = [...placesFromCanonical, ...placesFromFsqRaw];
  
  // Additional deduplication by name + proximity
  // This catches duplicates that have different source_ids but are the same place
  let deduplicatedPlaces = deduplicateByNameAndProximity(allPlaces);
  
  // ============================================
  // STEP 5: Calculate distance and sort by proximity
  // ============================================
  if (userLocation && sortByDistance) {
    // Add distance to each place
    deduplicatedPlaces = deduplicatedPlaces.map(place => ({
      ...place,
      distance: getDistanceInMeters(
        userLocation.latitude,
        userLocation.longitude,
        place.latitude,
        place.longitude
      )
    }));
    
    // Sort by distance (closest first)
    deduplicatedPlaces.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    
    console.log(`[placeService] Sorted ${deduplicatedPlaces.length} places by distance from user`);
  }
  
  const endTime = Date.now();

  const result: FetchPlacesResult = {
    places: deduplicatedPlaces,
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

// ============================================
// DEDUPLICATION HELPER
// ============================================

/**
 * Calculate distance between two coordinates in meters
 */
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normalize place name for comparison
 * Removes common suffixes, punctuation, and extra spaces
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[^\w\s']/g, '')
    .replace(/\s+(inc|llc|ltd|corp|restaurant|cafe|bar|grill|kitchen|eatery|bistro|diner)\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deduplicate places by name similarity and geographic proximity
 * Two places are considered duplicates if:
 * 1. Their normalized names match exactly, AND
 * 2. They are within 100 meters of each other
 * 
 * When duplicates are found, prefer the one from 'places' table (canonical)
 */
function deduplicateByNameAndProximity(places: PlaceCard[]): PlaceCard[] {
  const PROXIMITY_THRESHOLD_METERS = 100;
  const seen = new Map<string, PlaceCard>();
  const result: PlaceCard[] = [];
  
  for (const place of places) {
    const normalizedName = normalizeName(place.name);
    let isDuplicate = false;
    
    // Check against all seen places with similar names
    for (const [key, existingPlace] of seen.entries()) {
      const existingNormalizedName = normalizeName(existingPlace.name);
      
      // Check if names match
      if (normalizedName === existingNormalizedName) {
        // Check proximity
        const distance = getDistanceInMeters(
          place.latitude,
          place.longitude,
          existingPlace.latitude,
          existingPlace.longitude
        );
        
        if (distance <= PROXIMITY_THRESHOLD_METERS) {
          isDuplicate = true;
          
          // If current place is from canonical table and existing is from fsq_raw, replace it
          if (place.source === 'places' && existingPlace.source === 'fsq_raw') {
            seen.set(key, place);
            // Update result array
            const idx = result.findIndex(p => p.id === existingPlace.id);
            if (idx !== -1) {
              result[idx] = place;
            }
          }
          break;
        }
      }
    }
    
    if (!isDuplicate) {
      const key = `${normalizedName}-${place.latitude.toFixed(4)}-${place.longitude.toFixed(4)}`;
      seen.set(key, place);
      result.push(place);
    }
  }
  
  const duplicatesRemoved = places.length - result.length;
  if (duplicatesRemoved > 0) {
    console.log(`[placeService] Removed ${duplicatesRemoved} duplicate places by name+proximity`);
  }
  
  return result;
}


// ============================================
// DISTANCE FORMATTING HELPER
// ============================================

/**
 * Format distance in meters to a human-readable string
 * @param meters Distance in meters
 * @returns Formatted string like "0.3 mi" or "2.5 mi"
 */
export function formatDistance(meters: number | undefined): string {
  if (meters === undefined || meters === null) {
    return '';
  }
  
  // Convert meters to miles (1 mile = 1609.34 meters)
  const miles = meters / 1609.34;
  
  if (miles < 0.1) {
    // Less than 0.1 miles, show in feet
    const feet = Math.round(meters * 3.28084);
    return `${feet} ft`;
  } else if (miles < 10) {
    // Less than 10 miles, show 1 decimal
    return `${miles.toFixed(1)} mi`;
  } else {
    // 10+ miles, show whole number
    return `${Math.round(miles)} mi`;
  }
}

/**
 * Get distance in miles from meters
 */
export function getDistanceInMiles(meters: number | undefined): number {
  if (meters === undefined || meters === null) {
    return Infinity;
  }
  return meters / 1609.34;
}
