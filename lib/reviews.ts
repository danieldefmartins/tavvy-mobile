import { supabase } from './supabase';
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
  tap_total: number;
  review_count: number;
  last_tap_at: string | null;
  // Joined from review_items
  label?: string;
  icon?: string;
  category?: ReviewCategory;
}

// Submit a new review with signal taps
export async function submitReview(
  placeId: string,
  signals: ReviewSignalTap[],
  publicNote?: string,
  privateNote?: string
): Promise<{ success: boolean; error?: any; reviewId?: string }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user, submitting as anonymous');
      // For now, we'll allow anonymous reviews but log it
      // In production, you might want to require authentication
    }

    const userId = user?.id || null;

    // Step 1: Create the review in place_reviews table
    const { data: review, error: reviewError } = await supabase
      .from('place_reviews')
      .insert({
        place_id: placeId,
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
        place_id: placeId,
        signal_id: signal.signalId,
        intensity: signal.intensity,
      }));

      const { error: tapsError } = await supabase
        .from('place_review_signal_taps')
        .insert(signalTaps);

      if (tapsError) {
        console.error('Error saving signal taps:', tapsError);
        // Review was created but taps failed - we should handle this
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

// Fetch aggregated signals for a place
export async function fetchPlaceSignals(placeId: string): Promise<{
  best_for: SignalAggregate[];
  vibe: SignalAggregate[];
  heads_up: SignalAggregate[];
}> {
  try {
    // Query the place_review_signal_taps table and aggregate
    const { data: taps, error } = await supabase
      .from('place_review_signal_taps')
      .select('signal_id, intensity')
      .eq('place_id', placeId);

    if (error) {
      console.error('Error fetching signal taps:', error);
      return { best_for: [], vibe: [], heads_up: [] };
    }

    // Aggregate the taps by signal_id
    const aggregated: Record<string, { tap_total: number; review_count: number }> = {};
    
    (taps || []).forEach(tap => {
      if (!aggregated[tap.signal_id]) {
        aggregated[tap.signal_id] = { tap_total: 0, review_count: 0 };
      }
      aggregated[tap.signal_id].tap_total += tap.intensity;
      aggregated[tap.signal_id].review_count += 1;
    });

    // Organize by category
    const result: {
      best_for: SignalAggregate[];
      vibe: SignalAggregate[];
      heads_up: SignalAggregate[];
    } = {
      best_for: [],
      vibe: [],
      heads_up: [],
    };

    for (const [signalId, data] of Object.entries(aggregated)) {
      const tag = getTagById(signalId);
      const category = getCategoryFromTag(signalId);
      
      if (tag && category) {
        const aggregate: SignalAggregate = {
          place_id: placeId,
          signal_id: signalId,
          tap_total: data.tap_total,
          review_count: data.review_count,
          last_tap_at: null,
          label: tag.label,
          icon: tag.icon,
          category: category,
        };
        
        result[category].push(aggregate);
      }
    }

    // Sort each category by tap_total descending
    result.best_for.sort((a, b) => b.tap_total - a.tap_total);
    result.vibe.sort((a, b) => b.tap_total - a.tap_total);
    result.heads_up.sort((a, b) => b.tap_total - a.tap_total);

    return result;

  } catch (error) {
    console.error('Error fetching place signals:', error);
    return { best_for: [], vibe: [], heads_up: [] };
  }
}

// Fetch user's existing review for a place (if any)
export async function fetchUserReview(placeId: string): Promise<{
  review: PlaceReview | null;
  signals: ReviewSignalTap[];
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { review: null, signals: [] };
    }

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
