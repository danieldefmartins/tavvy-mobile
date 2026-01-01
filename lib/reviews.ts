import { supabase } from './supabase';

export interface ReviewSignal {
  signalId: string;
  label: string;
  tapCount: number;
  category: 'bestFor' | 'vibe' | 'headsUp';
}

export async function submitReview(
  placeId: string,
  signals: ReviewSignal[]
) {
  try {
    // Insert each signal as a separate review row
    const reviewPromises = signals.map(signal => 
      supabase
        .from('reviews')
        .insert({
          place_id: placeId,
          tap_count: signal.tapCount,
          // Leave user_id and review_item_id as NULL for now
          // We'll add proper user authentication later
        })
    );

    const results = await Promise.all(reviewPromises);
    
    // Check if any failed
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Error saving reviews:', errors);
      return { success: false, error: errors[0].error };
    }

    console.log('✅ Reviews saved!', results.length);
    return { success: true, data: results };

  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, error };
  }
}
