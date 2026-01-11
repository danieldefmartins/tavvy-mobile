import { supabase } from './supabaseClient';

// Types matching the database schema
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
  tap_total: number; // Raw total (historical)
  current_score: number; // Time-decayed score (Living Score)
  review_count: number;
  last_tap_at: string | null;
  is_ghost: boolean; // True if score is low but > 0 (fading warning)
  // Joined from review_items
  label?: string;
  icon?: string;
  category?: ReviewCategory;
}

// Signal cache for dynamic lookups
interface CachedSignal {
  id: string;
  slug: string;
  label: string;
  icon_emoji: string;
  signal_type: ReviewCategory;
  color: string;
}

let signalCache: Map<string, CachedSignal> = new Map();
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
    (data || []).forEach((item: any) => {
      signalCache.set(item.id, {
        id: item.id,
        slug: item.slug,
        label: item.label,
        icon_emoji: item.icon_emoji,
        signal_type: item.signal_type as ReviewCategory,
        color: item.color,
      });
    });

    cacheLoaded = true;
  } catch (err) {
    console.error('Error loading signal cache:', err);
  }
}

// Get signal info by ID (dynamic from database)
export function getSignalById(signalId: string): CachedSignal | undefined {
  return signalCache.get(signalId);
}

// Get signal label by ID
export function getSignalLabel(signalId: string): string {
  const signal = signalCache.get(signalId);
  if (signal) return signal.label;
  
  // Fallback: convert ID to title case
  return signalId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get category from signal ID
export function getCategoryFromSignal(signalId: string): ReviewCategory | null {
  const signal = signalCache.get(signalId);
  return signal?.signal_type || null;
}

// Backward compatibility aliases
export const getTagById = getSignalById;
export const getTagLabel = getSignalLabel;
export const getCategoryFromTag = getCategoryFromSignal;

// Category colors (matching signalService.ts)
export const CATEGORY_COLORS = {
  best_for: {
    bg: '#0A84FF',
    text: '#FFFFFF',
  },
  vibe: {
    bg: '#8E8E93',
    text: '#FFFFFF',
  },
  heads_up: {
    bg: '#FF9500',
    text: '#FFFFFF',
  },
} as const;

// Helper: Get or Create Place - now uses fsq_places_raw
// For Foursquare places, we use fsq_place_id directly (no UUID needed)
async function getOrCreatePlace(placeId: string, placeName: string): Promise<string | null> {
  try {
    // Check if it's a Foursquare ID (alphanumeric, no dashes) or UUID
    const isFoursquareId = placeId && !placeId.includes('-');
    
    if (isFoursquareId) {
      // For Foursquare places, verify it exists in fsq_places_raw
      const { data: existingPlace, error: fetchError } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id')
        .eq('fsq_place_id', placeId)
        .maybeSingle();

      if (existingPlace) {
        return existingPlace.fsq_place_id;
      }
      
      // Foursquare place not found - this shouldn't happen for map places
      console.warn('Foursquare place not found:', placeId);
      return placeId; // Return as-is, let the review be linked anyway
    }
    
    // For non-Foursquare IDs (UUIDs), return as-is
    // These would be user-added places in the old places table
    return placeId;
  } catch (error) {
    console.error('Error in getOrCreatePlace:', error);
    return placeId; // Return original ID on error
  }
}

// Submit a new review with signal taps
export async function submitReview(
  placeId: string, // Foursquare ID or UUID
  placeName: string,
  signals: ReviewSignalTap[],
  publicNote?: string,
  privateNote?: string
): Promise<{ success: boolean; error?: any; reviewId?: string }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user, submitting as anonymous');
    }

    const userId = user?.id || null;

    // Resolve place ID (verify it exists)
    const targetPlaceId = await getOrCreatePlace(placeId, placeName);
    if (!targetPlaceId) {
      return { success: false, error: 'Failed to resolve Place ID' };
    }

    // Step 1: Create the review in place_reviews table
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

    // Step 2: Insert signal taps into place_review_signal_taps table
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

// THE TAVVY ENGINE: Time Decay Calculation
function calculateDecayedScore(intensity: number, createdAt: string): number {
  const now = new Date();
  const created = new Date(createdAt);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const MAX_AGE_DAYS = 180; // 6 Months

  if (diffDays >= MAX_AGE_DAYS) {
    return 0; // The Zombie is Dead ⚰️
  }

  // Linear Decay Formula: Value = Intensity * (1 - (Age / 180))
  const decayFactor = 1 - (diffDays / MAX_AGE_DAYS);
  return intensity * decayFactor;
}

// Fetch aggregated signals for a place with LIVING SCORE logic
export async function fetchPlaceSignals(placeId: string): Promise<{
  best_for: SignalAggregate[];
  vibe: SignalAggregate[];
  heads_up: SignalAggregate[];
  medals: string[]; // List of earned medal IDs
}> {
  try {
    // Ensure signal cache is loaded
    await loadSignalCache();

    // Query the place_review_signal_taps table and JOIN with place_reviews to get created_at
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

    // Aggregate the taps by signal_id
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
      
      // Track last tap time
      if (!aggregated[tap.signal_id].last_tap_at || new Date(createdAt) > new Date(aggregated[tap.signal_id].last_tap_at!)) {
        aggregated[tap.signal_id].last_tap_at = createdAt;
      }
    });

    // Organize by category
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
        // Ghost Logic: If score is low (< 1.0) but not zero, mark as ghost
        const isGhost = data.current_score > 0 && data.current_score < 1.0;

        const aggregate: SignalAggregate = {
          place_id: placeId,
          signal_id: signalId,
          tap_total: data.tap_total,
          current_score: data.current_score,
          review_count: data.review_count,
          last_tap_at: data.last_tap_at,
          is_ghost: isGhost,
          label: signal.label,
          icon: signal.icon_emoji,
          category: category,
        };

        // Track scores for medal calculations
        if (category === 'best_for' || category === 'vibe') {
          totalPositiveScore += data.current_score;
        } else if (category === 'heads_up') {
          totalNegativeScore += data.current_score;
        }

        // Track specific signals for medals
        if (signal.slug === 'fast_service') {
          fastServiceScore = data.current_score;
        } else if (signal.slug === 'slow_service') {
          slowServiceScore = data.current_score;
        }

        // Add to appropriate category (skip ghosts from display but keep for calculations)
        if (!isGhost) {
          result[category].push(aggregate);
        }
      }
    }

    // Sort each category by current_score descending
    result.best_for.sort((a, b) => b.current_score - a.current_score);
    result.vibe.sort((a, b) => b.current_score - a.current_score);
    result.heads_up.sort((a, b) => b.current_score - a.current_score);

    // MEDAL LOGIC
    // 1. Vibe Check Medal: Strong vibe signals
    if (result.vibe.some(s => s.current_score >= 5)) {
      result.medals.push('vibe_check');
    }

    // 2. Speed Demon Medal: Fast service with no slow service complaints
    if (fastServiceScore >= 3 && slowServiceScore < 1) {
      result.medals.push('speed_demon');
    }

    // 3. Community Favorite: High positive, low negative
    if (totalPositiveScore >= 10 && totalNegativeScore < 2) {
      result.medals.push('community_favorite');
    }

    return result;

  } catch (error) {
    console.error('Error fetching place signals:', error);
    return { best_for: [], vibe: [], heads_up: [], medals: [] };
  }
}

// Get reviews for a place
export async function getPlaceReviews(placeId: string): Promise<PlaceReview[]> {
  try {
    const { data, error } = await supabase
      .from('place_reviews')
      .select('*')
      .eq('place_id', placeId)
      .eq('status', 'live')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}
