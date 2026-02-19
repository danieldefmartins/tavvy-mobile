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
    bg: '#8B5CF6',  // Purple
    text: '#FFFFFF',
  },
  heads_up: {
    bg: '#FF9500',
    text: '#FFFFFF',
  },
} as const;

// Helper: Resolve a place identifier (UUID, FSQ ID, or Google Place ID) to a valid UUID
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

// Submit a new review with signal taps
export async function submitReview(
  googlePlaceId: string, // This might be a Google ID or a UUID
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

// Helper: Check if string is a valid UUID
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
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

    // Check if placeId is a valid UUID - Foursquare IDs are 24-char hex strings, not UUIDs
    // If not a valid UUID, return empty results (no taps for Foursquare places yet)
    if (!isValidUUID(placeId)) {
      console.log('Non-UUID placeId detected, returning empty signals:', placeId);
      return { best_for: [], vibe: [], heads_up: [], medals: [] };
    }

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

        // Only include if score > 0 (Dead zombies are filtered out)
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

          // Track scores for Medals
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

    // Sort each category by current_score descending (Living Score)
    result.best_for.sort((a, b) => b.current_score - a.current_score);
    result.vibe.sort((a, b) => b.current_score - a.current_score);
    result.heads_up.sort((a, b) => b.current_score - a.current_score);

    // --- MEDAL LOGIC ---
    const totalScore = totalPositiveScore + totalNegativeScore;

    // 🏆 Vibe Check: >90% Positive
    if (totalScore > 10 && (totalPositiveScore / totalScore) > 0.9) {
      result.medals.push('vibe_check');
    }

    // ⚡ Speed Demon: Fast > 2x Slow
    if (fastServiceScore > 5 && fastServiceScore > (slowServiceScore * 2)) {
      result.medals.push('speed_demon');
    }

    // 💎 Hidden Gem: High Positive, Low Volume
    if (totalPositiveScore > 10 && totalScore < 50 && (totalPositiveScore / totalScore) > 0.95) {
      result.medals.push('hidden_gem');
    }

    return result;

  } catch (error) {
    console.error('Error fetching place signals:', error);
    return { best_for: [], vibe: [], heads_up: [], medals: [] };
  }
}

// Fetch user's existing review for a place (if any)
export async function fetchUserReview(placeId: string): Promise<{
  review: PlaceReview | null;
  signals: ReviewSignalTap[];
}> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData?.user) {
      // Not logged in or auth error - just return null, don't throw
      return { review: null, signals: [] };
    }

    const user = authData.user;

    // Get the user's review
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

    // Get the signal taps for this review
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

// Update an existing review
export async function updateReview(
  reviewId: string,
  placeId: string,
  signals: ReviewSignalTap[],
  publicNote?: string,
  privateNote?: string
): Promise<{ success: boolean; error?: any }> {
  try {
    // Update the review
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

    // Delete existing signal taps
    const { error: deleteError } = await supabase
      .from('place_review_signal_taps')
      .delete()
      .eq('review_id', reviewId);

    if (deleteError) {
      console.error('Error deleting old signal taps:', deleteError);
    }

    // Insert new signal taps
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

// Get review count for a place
export async function getPlaceReviewCount(placeId: string): Promise<number> {
  try {
    // Check if placeId is a valid UUID - Foursquare IDs are not UUIDs
    if (!isValidUUID(placeId)) {
      return 0; // No reviews for non-UUID places yet
    }

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

// Preload signal cache (call early in app lifecycle)
export async function preloadSignalCache(): Promise<void> {
  await loadSignalCache();
}

// Clear signal cache (call when signals are updated)
export function clearSignalCache(): void {
  signalCache = new Map();
  cacheLoaded = false;
}

// ============================================
// THERMOMETER BADGE - Recent Activity (Last 3 Months)
// ============================================

// Helper: Check if a date is within the specified number of days
function withinDays(dateString: string, days: number): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}

// Fetch thermometer data for a place (positive/negative taps in last 3 months)
export async function fetchPlaceThermometer(placeId: string, months: number = 3): Promise<{
  positiveTaps: number;
  negativeTaps: number;
}> {
  try {
    // Ensure signal cache is loaded
    await loadSignalCache();

    const daysInPeriod = months * 30; // Approximate days in the period

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
      console.error('Error fetching thermometer data:', error);
      return { positiveTaps: 0, negativeTaps: 0 };
    }

    let positiveTaps = 0;
    let negativeTaps = 0;

    (taps || []).forEach((tap: any) => {
      const createdAt = tap.place_reviews?.created_at;
      
      // Only count taps within the specified period
      if (!createdAt || !withinDays(createdAt, daysInPeriod)) {
        return;
      }

      const signal = getSignalById(tap.signal_id);
      const category = signal?.signal_type;

      if (category === 'best_for' || category === 'vibe') {
        // Positive taps (intensity-weighted)
        positiveTaps += tap.intensity;
      } else if (category === 'heads_up') {
        // Negative taps (intensity-weighted)
        negativeTaps += tap.intensity;
      }
    });

    return { positiveTaps, negativeTaps };

  } catch (error) {
    console.error('Error fetching thermometer data:', error);
    return { positiveTaps: 0, negativeTaps: 0 };
  }
}

// Batch fetch thermometer data for multiple places (more efficient)
export async function fetchPlacesThermometer(placeIds: string[], months: number = 3): Promise<Map<string, { positiveTaps: number; negativeTaps: number }>> {
  const result = new Map<string, { positiveTaps: number; negativeTaps: number }>();
  
  if (placeIds.length === 0) {
    return result;
  }

  try {
    // Ensure signal cache is loaded
    await loadSignalCache();

    const daysInPeriod = months * 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInPeriod);

    // Query all taps for the given places
    const { data: taps, error } = await supabase
      .from('place_review_signal_taps')
      .select(`
        place_id,
        signal_id,
        intensity,
        place_reviews (
          created_at
        )
      `)
      .in('place_id', placeIds);

    if (error) {
      console.error('Error fetching batch thermometer data:', error);
      return result;
    }

    // Initialize all places with zero counts
    placeIds.forEach(id => {
      result.set(id, { positiveTaps: 0, negativeTaps: 0 });
    });

    // Aggregate taps by place
    (taps || []).forEach((tap: any) => {
      const createdAt = tap.place_reviews?.created_at;
      
      // Only count taps within the specified period
      if (!createdAt || !withinDays(createdAt, daysInPeriod)) {
        return;
      }

      const signal = getSignalById(tap.signal_id);
      const category = signal?.signal_type;
      const placeData = result.get(tap.place_id);

      if (placeData) {
        if (category === 'best_for' || category === 'vibe') {
          placeData.positiveTaps += tap.intensity;
        } else if (category === 'heads_up') {
          placeData.negativeTaps += tap.intensity;
        }
      }
    });

    return result;

  } catch (error) {
    console.error('Error fetching batch thermometer data:', error);
    return result;
  }
}
