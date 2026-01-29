import { supabase } from './supabaseClient';

// Types for event reviews
export interface ReviewSignalTap {
  signalId: string;
  intensity: number; // 1-3 (tap count)
}

export interface EventReview {
  id: string;
  event_id: string;
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
  event_id: string;
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

// Signal cache
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

// Load event signals into cache
async function loadSignalCache(): Promise<void> {
  if (cacheLoaded) return;

  try {
    const { data, error } = await supabase
      .from('review_items')
      .select('id, slug, label, icon_emoji, signal_type, color')
      .eq('is_active', true)
      .like('slug', 'event_%'); // Only load event signals

    if (error) {
      console.error('Error loading event signal cache:', error);
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
    console.log(`✅ Event signal cache loaded: ${signalCache.size} signals`);
  } catch (err) {
    console.error('Error loading event signal cache:', err);
  }
}

// Get signal info by ID
export function getSignalById(signalId: string): CachedSignal | undefined {
  return signalCache.get(signalId);
}

// Get signal label by ID
export function getSignalLabel(signalId: string): string {
  const signal = signalCache.get(signalId);
  if (signal) return signal.label;
  
  return signalId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Category colors
export const CATEGORY_COLORS = {
  best_for: {
    bg: '#0A84FF',
    text: '#FFFFFF',
  },
  vibe: {
    bg: '#8B5CF6',
    text: '#FFFFFF',
  },
  heads_up: {
    bg: '#FF9500',
    text: '#FFFFFF',
  },
} as const;

// Get or create event in database
async function getOrCreateEvent(eventId: string, eventName: string): Promise<string | null> {
  try {
    // Check if event exists
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('id')
      .eq('external_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      return existingEvent.id;
    }

    // Create new event
    console.log('Event not found, creating new event for:', eventId);
    const { data: newEvent, error: createError } = await supabase
      .from('events')
      .insert({
        external_id: eventId,
        name: eventName,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating event:', createError);
      return null;
    }

    return newEvent.id;
  } catch (error) {
    console.error('Error in getOrCreateEvent:', error);
    return null;
  }
}

// Submit a new event review
export async function submitEventReview(
  eventId: string,
  eventName: string,
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

    // Get or create event UUID
    const targetEventId = await getOrCreateEvent(eventId, eventName);
    if (!targetEventId) {
      return { success: false, error: 'Failed to resolve Event UUID' };
    }

    // Create the review in event_reviews table
    const { data: review, error: reviewError } = await supabase
      .from('event_reviews')
      .insert({
        event_id: targetEventId,
        user_id: userId,
        public_note: publicNote || null,
        private_note_owner: privateNote || null,
        source: 'mobile_app',
        status: 'live',
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating event review:', reviewError);
      return { success: false, error: reviewError };
    }

    // Insert signal taps
    if (signals.length > 0) {
      const signalTaps = signals.map(signal => ({
        review_id: review.id,
        event_id: targetEventId,
        signal_id: signal.signalId,
        intensity: signal.intensity,
      }));

      const { error: tapsError } = await supabase
        .from('event_review_signal_taps')
        .insert(signalTaps);

      if (tapsError) {
        console.error('Error saving event signal taps:', tapsError);
        return { success: false, error: tapsError };
      }
    }

    console.log('✅ Event review submitted successfully!', review.id);
    return { success: true, reviewId: review.id };

  } catch (error) {
    console.error('Error submitting event review:', error);
    return { success: false, error };
  }
}

// Update existing event review
export async function updateEventReview(
  reviewId: string,
  eventId: string,
  signals: ReviewSignalTap[],
  publicNote?: string,
  privateNote?: string
): Promise<{ success: boolean; error?: any }> {
  try {
    // Update the review
    const { error: reviewError } = await supabase
      .from('event_reviews')
      .update({
        public_note: publicNote || null,
        private_note_owner: privateNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId);

    if (reviewError) {
      console.error('Error updating event review:', reviewError);
      return { success: false, error: reviewError };
    }

    // Delete old signal taps
    const { error: deleteError } = await supabase
      .from('event_review_signal_taps')
      .delete()
      .eq('review_id', reviewId);

    if (deleteError) {
      console.error('Error deleting old signal taps:', deleteError);
    }

    // Insert new signal taps
    if (signals.length > 0) {
      const signalTaps = signals.map(signal => ({
        review_id: reviewId,
        event_id: eventId,
        signal_id: signal.signalId,
        intensity: signal.intensity,
      }));

      const { error: tapsError } = await supabase
        .from('event_review_signal_taps')
        .insert(signalTaps);

      if (tapsError) {
        console.error('Error saving new signal taps:', tapsError);
        return { success: false, error: tapsError };
      }
    }

    console.log('✅ Event review updated successfully!');
    return { success: true };

  } catch (error) {
    console.error('Error updating event review:', error);
    return { success: false, error };
  }
}

// Fetch user's existing review for an event
export async function fetchUserEventReview(eventId: string): Promise<{
  review: EventReview | null;
  signals: Array<{ signalId: string; intensity: number }>;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { review: null, signals: [] };
    }

    // Get event UUID
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('external_id', eventId)
      .maybeSingle();

    if (!event) {
      return { review: null, signals: [] };
    }

    // Fetch user's review
    const { data: review, error: reviewError } = await supabase
      .from('event_reviews')
      .select('*')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .eq('status', 'live')
      .maybeSingle();

    if (reviewError || !review) {
      return { review: null, signals: [] };
    }

    // Fetch signal taps
    const { data: taps, error: tapsError } = await supabase
      .from('event_review_signal_taps')
      .select('signal_id, intensity')
      .eq('review_id', review.id);

    if (tapsError) {
      console.error('Error fetching signal taps:', tapsError);
      return { review, signals: [] };
    }

    const signals = (taps || []).map(tap => ({
      signalId: tap.signal_id,
      intensity: tap.intensity,
    }));

    return { review, signals };

  } catch (error) {
    console.error('Error fetching user event review:', error);
    return { review: null, signals: [] };
  }
}

// Fetch aggregated signals for an event
export async function fetchEventSignals(eventId: string): Promise<{
  best_for: SignalAggregate[];
  vibe: SignalAggregate[];
  heads_up: SignalAggregate[];
}> {
  try {
    // Ensure signal cache is loaded
    await loadSignalCache();

    // Get event UUID
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('external_id', eventId)
      .maybeSingle();

    if (!event) {
      return { best_for: [], vibe: [], heads_up: [] };
    }

    // Query signal taps
    const { data: taps, error } = await supabase
      .from('event_review_signal_taps')
      .select(`
        signal_id,
        intensity,
        event_reviews (
          created_at
        )
      `)
      .eq('event_id', event.id);

    if (error) {
      console.error('Error fetching event signal taps:', error);
      return { best_for: [], vibe: [], heads_up: [] };
    }

    // Aggregate by signal_id
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

      aggregated[tap.signal_id].tap_total += tap.intensity;
      aggregated[tap.signal_id].current_score += tap.intensity; // No time decay for events
      aggregated[tap.signal_id].review_count += 1;
      
      const createdAt = tap.event_reviews?.created_at || new Date().toISOString();
      if (!aggregated[tap.signal_id].last_tap_at || new Date(createdAt) > new Date(aggregated[tap.signal_id].last_tap_at!)) {
        aggregated[tap.signal_id].last_tap_at = createdAt;
      }
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

    Object.entries(aggregated).forEach(([signalId, stats]) => {
      const signal = signalCache.get(signalId);
      if (!signal) return;

      const aggregate: SignalAggregate = {
        event_id: event.id,
        signal_id: signalId,
        tap_total: stats.tap_total,
        current_score: stats.current_score,
        review_count: stats.review_count,
        last_tap_at: stats.last_tap_at,
        is_ghost: false,
        label: signal.label,
        icon: signal.icon_emoji,
        category: signal.signal_type,
      };

      result[signal.signal_type].push(aggregate);
    });

    // Sort by current_score descending
    result.best_for.sort((a, b) => b.current_score - a.current_score);
    result.vibe.sort((a, b) => b.current_score - a.current_score);
    result.heads_up.sort((a, b) => b.current_score - a.current_score);

    return result;

  } catch (error) {
    console.error('Error fetching event signals:', error);
    return { best_for: [], vibe: [], heads_up: [] };
  }
}

// Get event review count
export async function getEventReviewCount(eventId: string): Promise<number> {
  try {
    const { data: event } = await supabase
      .from('events')
      .select('id')
      .eq('external_id', eventId)
      .maybeSingle();

    if (!event) return 0;

    const { count, error } = await supabase
      .from('event_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'live');

    if (error) {
      console.error('Error getting event review count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting event review count:', error);
    return 0;
  }
}

// Fetch event signals for display (returns all event signals grouped by category)
export async function fetchSignalsForEvent(eventId: string): Promise<{
  best_for: Array<{ id: string; slug: string; label: string; icon_emoji: string; signal_type: ReviewCategory; color: string }>;
  vibe: Array<{ id: string; slug: string; label: string; icon_emoji: string; signal_type: ReviewCategory; color: string }>;
  heads_up: Array<{ id: string; slug: string; label: string; icon_emoji: string; signal_type: ReviewCategory; color: string }>;
}> {
  try {
    await loadSignalCache();

    const result: {
      best_for: any[];
      vibe: any[];
      heads_up: any[];
    } = {
      best_for: [],
      vibe: [],
      heads_up: [],
    };

    // Convert cache to array and group by category
    Array.from(signalCache.values()).forEach(signal => {
      result[signal.signal_type].push(signal);
    });

    return result;
  } catch (error) {
    console.error('Error fetching signals for event:', error);
    return { best_for: [], vibe: [], heads_up: [] };
  }
}
