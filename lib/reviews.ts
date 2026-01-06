import { supabase } from './supabaseClient';
import { getTagById, getCategoryFromTag, CATEGORY_COLORS, ReviewCategory } from './reviewTags';

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

// Helper: Get or Create Place to ensure we have a valid UUID
async function getOrCreatePlace(googlePlaceId: string, placeName: string): Promise<string | null> {
  try {
    // 1. Check if place exists by google_place_id
    const { data: existingPlace, error: fetchError } = await supabase
      .from('places')
      .select('id')
      .eq('google_place_id', googlePlaceId)
      .maybeSingle();

    if (existingPlace) {
      return existingPlace.id;
    }

    // 2. If not, create it
    console.log('Place not found, creating new place for:', googlePlaceId);
    const { data: newPlace, error: createError } = await supabase
      .from('places')
      .insert({
        google_place_id: googlePlaceId,
        name: placeName,
        // Add other default fields if necessary
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating place:', createError);
      return null;
    }

    return newPlace.id;
  } catch (error) {
    console.error('Error in getOrCreatePlace:', error);
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

    // RESOLVE PLACE ID (Fix for 22P02)
    // We assume the input might be a Google Place ID. We need a UUID.
    let targetPlaceId = googlePlaceId;
    
    // Simple check: If it doesn't look like a UUID (length 36), treat as Google ID
    if (googlePlaceId.length !== 36) {
      const resolvedId = await getOrCreatePlace(googlePlaceId, placeName);
      if (!resolvedId) {
        return { success: false, error: 'Failed to resolve Place UUID' };
      }
      targetPlaceId = resolvedId;
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
      const tag = getTagById(signalId);
      const category = getCategoryFromTag(signalId);
      
      if (tag && category) {
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
            label: tag.label,
            icon: tag.icon,
            category: category,
          };
          
          result[category].push(aggregate);

          // Track scores for Medals
          if (category === 'best_for' || category === 'vibe') {
            totalPositiveScore += data.current_score;
          } else if (category === 'heads_up') {
            totalNegativeScore += data.current_score;
          }

          if (tag.label === 'Fast Service') fastServiceScore += data.current_score;
          if (tag.label === 'Slow Service') slowServiceScore += data.current_score;
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

    if (reviewError || !review) {
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