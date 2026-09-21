import { submitReview, updateReview, fetchUserReview } from './reviewPersistence';
export { submitReview, updateReview, fetchUserReview };
import { supabase } from './supabaseClient';
import { getSignalPrefixesForCategory, signalMatchesCategory, loadActiveSignalCatalog, loadPlaceSignalCategory } from './signalCatalog';
export { CATEGORY_SIGNAL_PREFIXES, SUBCATEGORY_SIGNAL_OVERRIDES, getSignalPrefixesForCategory } from './signalCatalog';

// Canonical place ids are uuids; fsq ids are not.
export const SIGNAL_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  is_universal?: boolean;
  category?: string | null;
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
  const data = await loadActiveSignalCatalog(supabase);
  signalCache = new Map();
  signalsBySlug = new Map();
  data.forEach((item: any) => {
    signalCache.set(item.id, item);
    signalsBySlug.set(item.slug, item);
  });
  cacheLoaded = true;
}

// ============================================
// CATEGORY TO SIGNAL PREFIX MAPPING
// ============================================

/**
 * Maps Tavvy primary category slugs to their signal prefixes.
 * Signals are filtered based on these prefixes when displaying
 * category-specific review options.
 */
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
    const matchesPrefix = signalMatchesCategory(signal, primaryCategory, subcategory);
    
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
  const category = await loadPlaceSignalCategory(supabase, placeId);
  return getSignalsForCategory(category.primary, category.subcategory);
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
  const signal = signalsBySlug.get(signalSlug);
  return signalMatchesCategory(signal || { id: '', slug: signalSlug, label: '', signal_type: 'best_for' }, primaryCategory, subcategory);
}

// ============================================
// CONSTANTS
// ============================================

export const CATEGORY_COLORS = {
  best_for: {
    bg: '#00C2CB',
    text: '#FFFFFF',
  },
  vibe: {
    bg: '#8A05BE',  // Brand Purple
    text: '#FFFFFF',
  },
  heads_up: {
    bg: '#F5A623',
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



// ============================================
// THE TAVVY ENGINE: Time Decay Calculation
// ============================================

export function calculateDecayedScore(intensity: number, createdAt: string): number {
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

    // The RPC takes uuid[]; fsq ids are not uuids and have no taps.
    if (!SIGNAL_UUID_REGEX.test(placeId)) {
      return { best_for: [], vibe: [], heads_up: [], medals: [] };
    }

    // Aggregate server-side via RPC. Pulling raw tap rows is silently capped
    // at 1000 rows by PostgREST, so popular places showed wrong Signal Matrix
    // numbers when aggregated client-side.
    const { data: countRows, error } = await supabase
      .rpc('get_places_signal_counts', { p_place_ids: [placeId] });

    if (error) {
      console.error('Error fetching signal counts:', error);
      return { best_for: [], vibe: [], heads_up: [], medals: [] };
    }

    const aggregated: Record<string, {
      tap_total: number;
      current_score: number;
      review_count: number;
      last_tap_at: string | null
    }> = {};

    (countRows || []).forEach((row: any) => {
      const tapCount = Number(row.tap_count) || 0;
      if (tapCount <= 0) return;
      aggregated[row.signal_id] = {
        tap_total: tapCount,
        // Per-tap intensity/decay data is not pulled anymore (it required raw
        // rows); the accurate total tap count is the score.
        current_score: tapCount,
        review_count: tapCount,
        last_tap_at: null,
      };
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




// ============================================
// UTILITY FUNCTIONS
// ============================================

export async function getPlaceReviewCount(placeId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('place_reviews')
      .select('id', { count: 'exact', head: true })
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
