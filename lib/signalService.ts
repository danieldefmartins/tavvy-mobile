import { supabase } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export interface ReviewSignalTap {
  signalId: string;
  intensity: number; // 1-3 (tap count)
}

export interface PlaceReview {
  id: string;
  place_id: string;
  user_id: string;
  public_note: string | null;
  private_note_owner: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  source: string;
}

export type ReviewCategory = 'best_for' | 'vibe' | 'heads_up';

export interface SignalAggregate {
  place_id: string;
  signal_id: string;
  tap_total: number;
  current_score: number;
  review_count: number;
  last_tap_at: string | null;
  is_ghost: boolean;
  label?: string;
  icon?: string;
  category?: ReviewCategory;
}

// Signal type for UI components
export interface Signal {
  id: string;
  slug: string;
  label: string;
  icon_emoji: string;
  signal_type: ReviewCategory;
  color: string;
}

// Grouped signals by category
export interface SignalsByCategory {
  best_for: Signal[];
  vibe: Signal[];
  heads_up: Signal[];
}

// ============================================
// SIGNAL CACHE
// ============================================

interface CachedSignal {
  id: string;
  slug: string;
  label: string;
  icon_emoji: string;
  signal_type: ReviewCategory;
  color: string;
}

let signalCache: Map<string, CachedSignal> = new Map();
let signalsBySlug: Map<string, CachedSignal> = new Map();
let cacheLoaded = false;

// Load signals into cache
async function loadSignalCache(): Promise<void> {
  if (cacheLoaded) return;

  try {
    const { data, error } = await supabase
      .from('review_items')
      .select('id, slug, label, icon_emoji, signal_type, color')
      .eq('is_active', true);

    if (error) {
      console.error('Error loading signal cache:', error);
      return;
    }

    signalCache = new Map();
    signalsBySlug = new Map();
    
    (data || []).forEach((item: any) => {
      const signal: CachedSignal = {
        id: item.id,
        slug: item.slug,
        label: item.label,
        icon_emoji: item.icon_emoji,
        signal_type: item.signal_type as ReviewCategory,
        color: item.color,
      };
      signalCache.set(item.id, signal);
      signalsBySlug.set(item.slug, signal);
    });

    cacheLoaded = true;
    console.log(`✅ Signal cache loaded: ${signalCache.size} signals`);
  } catch (err) {
    console.error('Error loading signal cache:', err);
  }
}

// ============================================
// CATEGORY TO SIGNAL PREFIX MAPPING
// ============================================

/**
 * Maps Tavvy primary category slugs to their signal prefixes.
 * Signals are filtered based on these prefixes when displaying
 * category-specific review options.
 */
export const CATEGORY_SIGNAL_PREFIXES: Record<string, string[]> = {
  // Core Categories
  restaurants: ['restaurant_', 'generic_'],
  cafes: ['cafe_', 'generic_'],
  nightlife: ['bar_', 'generic_'],
  lodging: ['hotel_', 'generic_'],
  
  // RV & Camping (fully implemented)
  rv_camping: ['rv_', 'dump_', 'water_', 'wifi_', 'restroom_', 'laundry_', 'generic_'],
  
  // Shopping & Services
  shopping: ['shop_', 'laundry_', 'generic_'],
  beauty: ['beauty_', 'generic_'],
  health: ['health_', 'generic_'],
  fitness: ['fitness_', 'generic_'],
  
  // Automotive
  automotive: ['fuel_', 'auto_', 'dump_', 'generic_'],
  
  // Professional & Business
  home_services: ['service_', 'generic_'],
  professional: ['pro_', 'generic_'],
  financial: ['bank_', 'generic_'],
  
  // Other Services
  pets: ['pet_', 'generic_'],
  education: ['edu_', 'generic_'],
  arts: ['arts_', 'generic_'],
  
  // Entertainment (theme parks, etc.)
  entertainment: ['tp_', 'ent_', 'generic_'],
  
  // Attractions (rides, shows, etc.)
  attraction: ['tp_', 'ent_', 'generic_'],
  
  // Outdoors & Parks
  outdoors: ['outdoor_', 'restroom_', 'generic_'],
  
  // Transportation
  transportation: ['transit_', 'restroom_', 'generic_'],
  
  // Government
  government: ['border_', 'gov_', 'generic_'],
  
  // Religious & Events
  religious: ['religious_', 'generic_'],
  events: ['venue_', 'generic_'],
  
  // Other/Generic
  other: ['generic_'],
  
  // Cities (metropolitan areas)
  city: ['city_', 'generic_'],
};

/**
 * Subcategory-specific signal overrides.
 * Some subcategories need different signals than their parent category.
 */
export const SUBCATEGORY_SIGNAL_OVERRIDES: Record<string, string[]> = {
  // RV & Camping subcategories
  dump_station: ['dump_', 'generic_'],
  propane_station: ['fuel_', 'generic_'],
  water_fill_station: ['water_', 'generic_'],
  public_showers: ['restroom_', 'generic_'],
  laundromat: ['laundry_', 'generic_'],
  wifi_hotspot: ['wifi_', 'generic_'],
  restroom: ['restroom_', 'generic_'],
  
  // Theme Park subcategories
  theme_park_ride: ['tp_', 'generic_'],
  theme_park_attraction: ['tp_', 'generic_'],
  theme_park_food: ['restaurant_', 'tp_', 'generic_'],
  theme_park_restroom: ['restroom_', 'generic_'],
  
  // Attraction subcategories (from places table)
  show: ['tp_', 'generic_'],
  dark_ride: ['tp_', 'generic_'],
  boat_ride: ['tp_', 'generic_'],
  roller_coaster: ['tp_', 'generic_'],
  thrill_ride: ['tp_', 'generic_'],
  water_ride: ['tp_', 'generic_'],
  spinner: ['tp_', 'generic_'],
  simulator: ['tp_', 'generic_'],
  carousel: ['tp_', 'generic_'],
  train: ['tp_', 'generic_'],
  tour: ['tp_', 'generic_'],
  meet_greet: ['tp_', 'generic_'],
  playground: ['tp_', 'generic_'],
  
  // Restaurant cuisine subcategories (categoryConfig slugs)
  italian: ['italian_', 'restaurant_', 'generic_'],
  mexican: ['mexican_', 'restaurant_', 'generic_'],
  chinese: ['asian_', 'restaurant_', 'generic_'],
  japanese: ['sushi_', 'restaurant_', 'generic_'],
  thai: ['thai_', 'restaurant_', 'generic_'],
  indian: ['indian_', 'restaurant_', 'generic_'],
  seafood: ['seafood_', 'restaurant_', 'generic_'],
  steakhouse: ['steak_', 'restaurant_', 'generic_'],
  bbq: ['bbq_', 'restaurant_', 'generic_'],
  pizza: ['pizza_', 'restaurant_', 'generic_'],
  burgers: ['burger_', 'restaurant_', 'generic_'],
  food_truck: ['foodtruck_', 'restaurant_', 'generic_'],
  brazilian: ['brazilian_', 'restaurant_', 'generic_'],
  
  // FSQ raw subcategory names (extracted from category labels)
  Pizzeria: ['pizza_', 'restaurant_', 'generic_'],
  'Pizza Place': ['pizza_', 'restaurant_', 'generic_'],
  'Sushi Restaurant': ['sushi_', 'restaurant_', 'generic_'],
  'Japanese Restaurant': ['sushi_', 'restaurant_', 'generic_'],
  'Ramen Restaurant': ['sushi_', 'restaurant_', 'generic_'],
  'BBQ Joint': ['bbq_', 'restaurant_', 'generic_'],
  'Barbecue Restaurant': ['bbq_', 'restaurant_', 'generic_'],
  'Mexican Restaurant': ['mexican_', 'restaurant_', 'generic_'],
  Taqueria: ['mexican_', 'restaurant_', 'generic_'],
  'Italian Restaurant': ['italian_', 'restaurant_', 'generic_'],
  'Chinese Restaurant': ['asian_', 'restaurant_', 'generic_'],
  'Asian Restaurant': ['asian_', 'restaurant_', 'generic_'],
  'Dim Sum Restaurant': ['asian_', 'restaurant_', 'generic_'],
  'Noodle House': ['asian_', 'restaurant_', 'generic_'],
  'Indian Restaurant': ['indian_', 'restaurant_', 'generic_'],
  'Thai Restaurant': ['thai_', 'restaurant_', 'generic_'],
  'Seafood Restaurant': ['seafood_', 'restaurant_', 'generic_'],
  'Fish Market': ['seafood_', 'restaurant_', 'generic_'],
  Steakhouse: ['steak_', 'restaurant_', 'generic_'],
  'Burger Joint': ['burger_', 'restaurant_', 'generic_'],
  'Burger Restaurant': ['burger_', 'restaurant_', 'generic_'],
  'Fast Food Restaurant': ['burger_', 'restaurant_', 'generic_'],
  'Brazilian Restaurant': ['brazilian_', 'restaurant_', 'generic_'],
  Churrascaria: ['brazilian_', 'restaurant_', 'generic_'],
  'Food Truck': ['foodtruck_', 'restaurant_', 'generic_'],
  'Food Stand': ['foodtruck_', 'restaurant_', 'generic_'],
  'Food Court': ['restaurant_', 'generic_'],
  
  // Automotive subcategories
  gas_station: ['fuel_', 'generic_'],
  ev_charging: ['fuel_', 'generic_'],
  car_wash: ['auto_', 'generic_'],
  auto_repair: ['auto_', 'generic_'],
  
  // Government subcategories
  border_crossing: ['border_', 'generic_'],
  checkpoint: ['border_', 'generic_'],
  dmv_gov: ['gov_', 'generic_'],
  post_office: ['gov_', 'generic_'],
};

// ============================================
// SIGNAL LOOKUP FUNCTIONS
// ============================================

export function getSignalById(signalId: string): CachedSignal | undefined {
  return signalCache.get(signalId);
}

export function getSignalBySlug(slug: string): CachedSignal | undefined {
  return signalsBySlug.get(slug);
}

export function getSignalLabel(signalId: string): string {
  const signal = signalCache.get(signalId);
  if (signal) return signal.label;
  
  return signalId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getCategoryFromSignal(signalId: string): ReviewCategory | null {
  const signal = signalCache.get(signalId);
  return signal?.signal_type || null;
}

// Backward compatibility aliases
export const getTagById = getSignalById;
export const getTagLabel = getSignalLabel;
export const getCategoryFromTag = getCategoryFromSignal;

// ============================================
// CATEGORY-SPECIFIC SIGNAL FILTERING
// ============================================

/**
 * Get the signal prefixes for a given category/subcategory.
 */
export function getSignalPrefixesForCategory(
  primaryCategory: string,
  subcategory?: string
): string[] {
  if (subcategory && SUBCATEGORY_SIGNAL_OVERRIDES[subcategory]) {
    return SUBCATEGORY_SIGNAL_OVERRIDES[subcategory];
  }
  return CATEGORY_SIGNAL_PREFIXES[primaryCategory] || ['generic_'];
}

/**
 * Get all signals available for a specific category.
 * Returns signals grouped by signal_type (best_for, vibe, heads_up).
 */
export async function getSignalsForCategory(
  primaryCategory: string,
  subcategory?: string
): Promise<SignalsByCategory> {
  await loadSignalCache();
  
  const prefixes = getSignalPrefixesForCategory(primaryCategory, subcategory);
  
  const result: SignalsByCategory = {
    best_for: [],
    vibe: [],
    heads_up: [],
  };
  
  signalsBySlug.forEach((signal) => {
    const matchesPrefix = prefixes.some(prefix => signal.slug.startsWith(prefix));
    
    if (matchesPrefix) {
      const signalForUI: Signal = {
        id: signal.id,
        slug: signal.slug,
        label: signal.label,
        icon_emoji: signal.icon_emoji,
        signal_type: signal.signal_type,
        color: signal.color,
      };
      result[signal.signal_type].push(signalForUI);
    }
  });
  
  // Sort each category alphabetically by label
  result.best_for.sort((a, b) => a.label.localeCompare(b.label));
  result.vibe.sort((a, b) => a.label.localeCompare(b.label));
  result.heads_up.sort((a, b) => a.label.localeCompare(b.label));
  
  return result;
}

/**
 * Fetch signals for a specific place based on its category.
 * This is the main function used by AddReviewScreen.
 */
export async function fetchSignalsForPlace(placeId: string): Promise<SignalsByCategory> {
  await loadSignalCache();
  
  try {
    // Try to get the place's category from places_unified or tavvy_places
    const { data: place, error } = await supabase
      .from('places_unified')
      .select('tavvy_primary_category, tavvy_subcategory')
      .eq('id', placeId)
      .maybeSingle();
    
    if (place && place.tavvy_primary_category) {
      return await getSignalsForCategory(
        place.tavvy_primary_category,
        place.tavvy_subcategory
      );
    }
    
    // Fallback: Try tavvy_places table
    const { data: tavvyPlace } = await supabase
      .from('tavvy_places')
      .select('primary_category, subcategory')
      .eq('id', placeId)
      .maybeSingle();
    
    if (tavvyPlace && tavvyPlace.primary_category) {
      return await getSignalsForCategory(
        tavvyPlace.primary_category,
        tavvyPlace.subcategory
      );
    }
    
    // Fallback: Try places table (for cities and other entities)
    const { data: simplePlace } = await supabase
      .from('places')
      .select('tavvy_category, tavvy_subcategory')
      .eq('id', placeId)
      .maybeSingle();
    
    if (simplePlace) {
      const category = simplePlace.tavvy_category;
      const subcategory = simplePlace.tavvy_subcategory;
      if (category) {
        return await getSignalsForCategory(category, subcategory);
      }
    }
    
    // Default: Return generic signals for all categories
    return await getSignalsForCategory('other');
    
  } catch (error) {
    console.error('Error fetching place category:', error);
    // Return generic signals on error
    return await getSignalsForCategory('other');
  }
}

/**
 * Get all signals as a flat array for a category.
 */
export async function getAllSignalsForCategory(
  primaryCategory: string,
  subcategory?: string
): Promise<Signal[]> {
  const grouped = await getSignalsForCategory(primaryCategory, subcategory);
  return [...grouped.best_for, ...grouped.vibe, ...grouped.heads_up];
}

/**
 * Check if a signal is applicable to a category.
 */
export function isSignalApplicableToCategory(
  signalSlug: string,
  primaryCategory: string,
  subcategory?: string
): boolean {
  const prefixes = getSignalPrefixesForCategory(primaryCategory, subcategory);
  return prefixes.some(prefix => signalSlug.startsWith(prefix));
}

// ============================================
// CONSTANTS
// ============================================

export const CATEGORY_COLORS = {
  best_for: {
    bg: '#0A84FF',
    text: '#FFFFFF',
  },
  vibe: {
    bg: '#8B5CF6',  // Purple
    text: '#FFFFFF',
  },
  heads_up: {
    bg: '#FF9500',
    text: '#FFFFFF',
  },
} as const;

// Legacy exports for backward compatibility
export const SIGNAL_COLORS = CATEGORY_COLORS;
export const SIGNAL_LABELS = {
  best_for: 'The Good',
  vibe: 'The Vibe',
  heads_up: 'Heads Up',
} as const;

// ============================================
// PLACE RESOLUTION
// ============================================

async function resolvePlaceId(placeIdentifier: string, placeName: string): Promise<string | null> {
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(placeIdentifier);
    
    // If it's already a UUID, verify it exists in the places table
    if (isUUID) {
      const { data } = await supabase
        .from('places')
        .select('id')
        .eq('id', placeIdentifier)
        .maybeSingle();
      if (data) return data.id;
    }

    // 1. Check canonical places table by source_id (handles FSQ IDs stored there)
    const { data: bySourceId } = await supabase
      .from('places')
      .select('id')
      .eq('source_id', placeIdentifier)
      .maybeSingle();
    if (bySourceId) return bySourceId.id;

    // 2. Check by google_place_id (handles Google Place IDs)
    const { data: byGoogleId } = await supabase
      .from('places')
      .select('id')
      .eq('google_place_id', placeIdentifier)
      .maybeSingle();
    if (byGoogleId) return byGoogleId.id;

    // 3. Check fsq_places_raw table and auto-promote to canonical places
    const { data: fsqPlace } = await supabase
      .from('fsq_places_raw')
      .select('fsq_place_id, name, latitude, longitude, address, locality, region, country, postcode, tel, website, email')
      .eq('fsq_place_id', placeIdentifier)
      .maybeSingle();

    if (fsqPlace) {
      // Promote FSQ place to canonical places table
      console.log('Promoting FSQ place to canonical:', placeIdentifier);
      const { data: newPlace, error: createError } = await supabase
        .from('places')
        .insert({
          name: fsqPlace.name || placeName,
          source_type: 'fsq',
          source_id: fsqPlace.fsq_place_id,
          latitude: fsqPlace.latitude,
          longitude: fsqPlace.longitude,
          address: fsqPlace.address,
          city: fsqPlace.locality,
          region: fsqPlace.region,
          country: fsqPlace.country,
          postcode: fsqPlace.postcode,
          phone: fsqPlace.tel,
          website: fsqPlace.website,
          email: fsqPlace.email,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error promoting FSQ place:', createError);
        return null;
      }
      return newPlace.id;
    }

    // 4. Last resort: create a minimal place entry
    console.log('Place not found anywhere, creating new place for:', placeIdentifier);
    const { data: newPlace, error: createError } = await supabase
      .from('places')
      .insert({
        google_place_id: placeIdentifier,
        name: placeName,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating place:', createError);
      return null;
    }

    return newPlace.id;
  } catch (error) {
    console.error('Error in resolvePlaceId:', error);
    return null;
  }
}

// ============================================
// REVIEW SUBMISSION
// ============================================

export async function submitReview(
  googlePlaceId: string,
  placeName: string,
  signals: ReviewSignalTap[],
  publicNote?: string,
  privateNote?: string
): Promise<{ success: boolean; error?: any; reviewId?: string }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user, submitting as anonymous');
    }

    const userId = user?.id || null;

    // RESOLVE PLACE ID — handles UUIDs, FSQ IDs, and Google Place IDs
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(googlePlaceId);
    let targetPlaceId = googlePlaceId;
    
    if (!isValidUUID) {
      const resolvedId = await resolvePlaceId(googlePlaceId, placeName);
      if (!resolvedId) {
        return { success: false, error: 'Failed to resolve Place UUID' };
      }
      targetPlaceId = resolvedId;
    } else {
      // Even if it looks like a UUID, verify it exists
      const resolvedId = await resolvePlaceId(googlePlaceId, placeName);
      if (resolvedId) {
        targetPlaceId = resolvedId;
      }
    }

    const { data: review, error: reviewError } = await supabase
      .from('place_reviews')
      .insert({
        place_id: targetPlaceId,
        user_id: userId,
        public_note: publicNote || null,
        private_note_owner: privateNote || null,
        source: 'mobile_app',
        status: 'live',
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return { success: false, error: reviewError };
    }

    if (signals.length > 0) {
      const signalTaps = signals.map(signal => ({
        review_id: review.id,
        place_id: targetPlaceId,
        signal_id: signal.signalId,
        intensity: signal.intensity,
      }));

      const { error: tapsError } = await supabase
        .from('place_review_signal_taps')
        .insert(signalTaps);

      if (tapsError) {
        console.error('Error saving signal taps:', tapsError);
        return { success: false, error: tapsError };
      }
    }

    console.log('✅ Review submitted successfully!', review.id);
    return { success: true, reviewId: review.id };

  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, error };
  }
}

// ============================================
// THE TAVVY ENGINE: Time Decay Calculation
// ============================================

function calculateDecayedScore(intensity: number, createdAt: string): number {
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const MAX_AGE_DAYS = 180;

  if (diffDays >= MAX_AGE_DAYS) {
    return 0;
  }

  const decayFactor = 1 - (diffDays / MAX_AGE_DAYS);
  return intensity * decayFactor;
}

// ============================================
// FETCH PLACE SIGNALS (Living Score)
// ============================================

export async function fetchPlaceSignals(placeId: string): Promise<{
  best_for: SignalAggregate[];
  vibe: SignalAggregate[];
  heads_up: SignalAggregate[];
  medals: string[];
}> {
  try {
    await loadSignalCache();

    const { data: taps, error } = await supabase
      .from('place_review_signal_taps')
      .select(`
        signal_id,
        intensity,
        place_reviews (
          created_at
        )
      `)
      .eq('place_id', placeId);

    if (error) {
      console.error('Error fetching signal taps:', error);
      return { best_for: [], vibe: [], heads_up: [], medals: [] };
    }

    const aggregated: Record<string, { 
      tap_total: number; 
      current_score: number;
      review_count: number;
      last_tap_at: string | null 
    }> = {};
    
    (taps || []).forEach((tap: any) => {
      if (!aggregated[tap.signal_id]) {
        aggregated[tap.signal_id] = { 
          tap_total: 0, 
          current_score: 0,
          review_count: 0,
          last_tap_at: null 
        };
      }

      const createdAt = tap.place_reviews?.created_at || new Date().toISOString();
      const decayedValue = calculateDecayedScore(tap.intensity, createdAt);

      aggregated[tap.signal_id].tap_total += tap.intensity;
      aggregated[tap.signal_id].current_score += decayedValue;
      aggregated[tap.signal_id].review_count += 1;
      
      if (!aggregated[tap.signal_id].last_tap_at || new Date(createdAt) > new Date(aggregated[tap.signal_id].last_tap_at!)) {
        aggregated[tap.signal_id].last_tap_at = createdAt;
      }
    });

    const result: {
      best_for: SignalAggregate[];
      vibe: SignalAggregate[];
      heads_up: SignalAggregate[];
      medals: string[];
    } = {
      best_for: [],
      vibe: [],
      heads_up: [],
      medals: [],
    };

    let totalPositiveScore = 0;
    let totalNegativeScore = 0;
    let fastServiceScore = 0;
    let slowServiceScore = 0;

    for (const [signalId, data] of Object.entries(aggregated)) {
      const signal = getSignalById(signalId);
      const category = getCategoryFromSignal(signalId);
      
      if (signal && category) {
        const isGhost = data.current_score > 0 && data.current_score < 1.0;

        if (data.current_score > 0) {
          const aggregate: SignalAggregate = {
            place_id: placeId,
            signal_id: signalId,
            tap_total: data.tap_total,
            current_score: parseFloat(data.current_score.toFixed(2)),
            review_count: data.review_count,
            last_tap_at: data.last_tap_at,
            is_ghost: isGhost,
            label: signal.label,
            icon: signal.icon_emoji,
            category: category,
          };
          
          result[category].push(aggregate);

          if (category === 'best_for' || category === 'vibe') {
            totalPositiveScore += data.current_score;
          } else if (category === 'heads_up') {
            totalNegativeScore += data.current_score;
          }

          if (signal.label === 'Fast Service') fastServiceScore += data.current_score;
          if (signal.label === 'Slow Service') slowServiceScore += data.current_score;
        }
      }
    }

    result.best_for.sort((a, b) => b.current_score - a.current_score);
    result.vibe.sort((a, b) => b.current_score - a.current_score);
    result.heads_up.sort((a, b) => b.current_score - a.current_score);

    const totalScore = totalPositiveScore + totalNegativeScore;

    if (totalScore > 10 && (totalPositiveScore / totalScore) > 0.9) {
      result.medals.push('vibe_check');
    }

    if (fastServiceScore > 5 && fastServiceScore > (slowServiceScore * 2)) {
      result.medals.push('speed_demon');
    }

    if (totalPositiveScore > 10 && totalScore < 50 && (totalPositiveScore / totalScore) > 0.95) {
      result.medals.push('hidden_gem');
    }

    return result;

  } catch (error) {
    console.error('Error fetching place signals:', error);
    return { best_for: [], vibe: [], heads_up: [], medals: [] };
  }
}

// ============================================
// USER REVIEW MANAGEMENT
// ============================================

export async function fetchUserReview(placeId: string): Promise<{
  review: PlaceReview | null;
  signals: ReviewSignalTap[];
}> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData?.user) {
      return { review: null, signals: [] };
    }

    const user = authData.user;

    const { data: review, error: reviewError } = await supabase
      .from('place_reviews')
      .select('*')
      .eq('place_id', placeId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (reviewError) {
      console.error('Error fetching user review:', reviewError);
      return { review: null, signals: [] };
    }

    if (!review) {
      return { review: null, signals: [] };
    }

    const { data: taps, error: tapsError } = await supabase
      .from('place_review_signal_taps')
      .select('signal_id, intensity')
      .eq('review_id', review.id);

    if (tapsError) {
      return { review: review as PlaceReview, signals: [] };
    }

    const signals: ReviewSignalTap[] = (taps || []).map(tap => ({
      signalId: tap.signal_id,
      intensity: tap.intensity,
    }));

    return { review: review as PlaceReview, signals };

  } catch (error) {
    console.error('Error fetching user review:', error);
    return { review: null, signals: [] };
  }
}

export async function updateReview(
  reviewId: string,
  placeId: string,
  signals: ReviewSignalTap[],
  publicNote?: string,
  privateNote?: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const { error: reviewError } = await supabase
      .from('place_reviews')
      .update({
        public_note: publicNote || null,
        private_note_owner: privateNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (reviewError) {
      return { success: false, error: reviewError };
    }

    const { error: deleteError } = await supabase
      .from('place_review_signal_taps')
      .delete()
      .eq('review_id', reviewId);

    if (deleteError) {
      console.error('Error deleting old signal taps:', deleteError);
    }

    if (signals.length > 0) {
      const signalTaps = signals.map(signal => ({
        review_id: reviewId,
        place_id: placeId,
        signal_id: signal.signalId,
        intensity: signal.intensity,
      }));

      const { error: tapsError } = await supabase
        .from('place_review_signal_taps')
        .insert(signalTaps);

      if (tapsError) {
        return { success: false, error: tapsError };
      }
    }

    console.log('✅ Review updated successfully!');
    return { success: true };

  } catch (error) {
    console.error('Error updating review:', error);
    return { success: false, error };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function getPlaceReviewCount(placeId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('place_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', placeId)
      .eq('status', 'live');

    if (error) {
      console.error('Error getting review count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting review count:', error);
    return 0;
  }
}

export async function preloadSignalCache(): Promise<void> {
  await loadSignalCache();
}

export function clearSignalCache(): void {
  signalCache = new Map();
  signalsBySlug = new Map();
  cacheLoaded = false;
}

export function getSignalCacheSize(): number {
  return signalCache.size;
}

export function debugListSignals(): void {
  console.log('=== SIGNAL CACHE DEBUG ===');
  console.log(`Total signals: ${signalCache.size}`);
  
  const byType: Record<string, number> = { best_for: 0, vibe: 0, heads_up: 0 };
  signalCache.forEach(signal => {
    byType[signal.signal_type]++;
  });
  
  console.log('By type:', byType);
  
  const byPrefix: Record<string, number> = {};
  signalsBySlug.forEach((signal, slug) => {
    const prefix = slug.split('_')[0] + '_';
    byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
  });
  
  console.log('By prefix:', byPrefix);
}

// ============================================
// HAPPENING SCORE INTEGRATION
// ============================================
// Updates the place_happening_scores table when activity occurs

// Activity point values
const HAPPENING_POINTS = {
  NEW_STORY: 50,
  NEW_REVIEW: 25,
  NEW_CHECKIN: 15,
  NEW_PHOTO: 10,
  NEW_TAP_SIGNAL: 5,
};

/**
 * Record a new review and update happening score
 */
export async function recordReviewActivity(placeId: string): Promise<void> {
  try {
    const { updateHappeningScore } = await import('./storyService');
    await updateHappeningScore(placeId, HAPPENING_POINTS.NEW_REVIEW);
  } catch (error) {
    console.error('Error recording review activity:', error);
  }
}

/**
 * Record a new tap signal and update happening score
 */
export async function recordTapActivity(placeId: string): Promise<void> {
  try {
    const { updateHappeningScore } = await import('./storyService');
    await updateHappeningScore(placeId, HAPPENING_POINTS.NEW_TAP_SIGNAL);
  } catch (error) {
    console.error('Error recording tap activity:', error);
  }
}

/**
 * Record a new photo upload and update happening score
 */
export async function recordPhotoActivity(placeId: string): Promise<void> {
  try {
    const { updateHappeningScore } = await import('./storyService');
    await updateHappeningScore(placeId, HAPPENING_POINTS.NEW_PHOTO);
  } catch (error) {
    console.error('Error recording photo activity:', error);
  }
}

/**
 * Record a check-in and update happening score
 */
export async function recordCheckinActivity(placeId: string): Promise<void> {
  try {
    const { updateHappeningScore } = await import('./storyService');
    await updateHappeningScore(placeId, HAPPENING_POINTS.NEW_CHECKIN);
  } catch (error) {
    console.error('Error recording checkin activity:', error);
  }
}
