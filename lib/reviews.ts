import { submitReview, updateReview, fetchUserReview } from './reviewPersistence';
export { submitReview, updateReview, fetchUserReview };
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

    // Aggregate server-side via RPC. Pulling raw tap rows is silently capped
    // at 1000 rows by PostgREST, so popular places showed wrong Signal Matrix
    // numbers when aggregated client-side.
    const { data: countRows, error } = await supabase
      .rpc('get_places_signal_counts', { p_place_ids: [placeId] });

    if (error) {
      console.error('Error fetching signal counts:', error);
      return { best_for: [], vibe: [], heads_up: [], medals: [] };
    }

    // Map RPC rows into the existing aggregate shape
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

// ============================================
// RECENT REVIEWS (parity with web place page)
// Reconstructs each person's review from their signal taps.
// Bounded queries only — no unbounded tap pulls.
// ============================================

export interface RecentReview {
  text?:string;
  createdAt?:string;
  dateSource?:string;
  isEdit?:boolean;
  reviewId: string;
  historyEntryId?: string;
  initial: string;
  name: string;
  when: string; // relative time, e.g. "2w ago"
  signals: Array<{ label: string; category: ReviewCategory }>;
}

function relativeTime(dateString: string): string {
  const then = new Date(dateString).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export async function fetchRecentReviews(placeId: string, limit: number = 10): Promise<RecentReview[]> {
  if (!isValidUUID(placeId)) return [];
  const {data:recentRows,error}=await supabase.rpc('get_place_recent_reviews',{p_place_id:placeId,p_limit:Math.min(20,Math.max(1,limit)),p_offset:0});
  const rows=recentRows as Array<{id:string;user_id:string|null;created_at:string;public_note:string|null}>|null;
  if(error||!Array.isArray(rows))throw new Error('Reviews are temporarily unavailable.');if(!rows.length)return [];
  const ids=rows.map(r=>r.id);const userIds=[...new Set(rows.map(r=>r.user_id).filter(Boolean))];
  const {data:taps,error:tapError}=await supabase.from('place_review_signal_taps').select('review_id,signal_id').eq('place_id',placeId).in('review_id',ids);if(tapError)throw new Error('Review details are temporarily unavailable.');
  const signalIds=[...new Set((taps||[]).map(t=>t.signal_id))];
  const {data:definitions,error:catalogError}=signalIds.length?await supabase.from('review_items').select('id,label,signal_type').in('id',signalIds):{data:[],error:null};if(catalogError)throw new Error('Review details are temporarily unavailable.');
  const {data:profiles}=userIds.length?await supabase.from('profiles').select('user_id,display_name,username').in('user_id',userIds):{data:[]};const names=new Map((profiles||[]).map(p=>[p.user_id,p.display_name||p.username]));const catalog=new Map((definitions||[]).map(d=>[d.id,d]));
  return rows.map(row=>{const name=String(names.get(row.user_id)||'Tavvy member');return {reviewId:row.id,name,initial:name.charAt(0).toUpperCase(),when:relativeTime(row.created_at),createdAt:row.created_at,text:row.public_note||undefined,signals:(taps||[]).filter(t=>t.review_id===row.id).flatMap(t=>{const d=catalog.get(t.signal_id);return d&&['best_for','vibe','heads_up'].includes(d.signal_type)?[{label:d.label,category:d.signal_type as ReviewCategory}]:[]})}});
}

export async function fetchReviewHistory(placeId: string, page = 0): Promise<{ total: number; reviews: (RecentReview & { date: string; note: string | null; dateSource?: string; recordedAt?: string; isEdit?: boolean })[] }> {
  if (!isValidUUID(placeId)) return { total: 0, reviews: [] };
  const { data: history, error: historyError } = await supabase.rpc('get_place_review_history', { p_place_id: placeId, p_offset: Math.max(0, page) * 20, p_limit: 20 });
  if (!historyError) {
    if (!history || !Array.isArray(history.reviews) || typeof history.total !== 'number') throw new Error('Review history could not be loaded completely.');
    const userIds = [...new Set(history.reviews.map((row: any) => row.user_id).filter(Boolean))];
    const { data: profiles } = userIds.length ? await supabase.from('profiles').select('user_id,display_name,username').in('user_id', userIds) : { data: [] as any[] };
    const names = new Map((profiles || []).map((profile: any) => [profile.user_id, profile.display_name || profile.username || 'Tavvy member']));
    const category: Record<string, ReviewCategory> = { good: 'best_for', vibe: 'vibe', headsup: 'heads_up' };
    return { total: history.total, reviews: history.reviews.map((row: any) => {
      const name = String(names.get(row.user_id) || 'Tavvy member');
      return { reviewId: row.review_id, historyEntryId: row.id, createdAt: row.visited_at, name, initial: name.charAt(0).toUpperCase(), date: row.visited_at, dateSource: row.date_source,
        recordedAt: row.recorded_at, isEdit: row.is_edit, note: row.public_note || null,
        when: row.date_source === 'reported' ? row.visited_at.slice(0, 10) : new Date(row.visited_at).toLocaleDateString(),
        signals: (row.signals || []).filter((signal: any) => category[signal.category]).map((signal: any) => ({ label: signal.label, category: category[signal.category] })),
      };
    }) };
  }
  if (!['PGRST202', '42883'].includes(historyError.code)) throw new Error('Review history is temporarily unavailable.');
  await loadSignalCache();
  const { data: rows, count, error } = await supabase.from('place_reviews')
    .select('id,user_id,created_at,public_note', { count: 'exact' }).eq('place_id', placeId).eq('status', 'live')
    .order('created_at', { ascending: false }).range(page * 20, page * 20 + 19);
  if (error) throw error;
  const ids = (rows || []).map(r => r.id);
  const { data: taps, error: tapsError } = ids.length ? await supabase.from('place_review_signal_taps')
    .select('review_id,signal_id').in('review_id', ids) : { data: [], error: null };
  if (tapsError) throw tapsError;
  const userIds = [...new Set((rows || []).map(r => r.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length ? await supabase.from('profiles')
    .select('user_id,display_name,username').in('user_id', userIds) : { data: [] as any[] };
  const names = new Map((profiles || []).map(p => [p.user_id, p.display_name || p.username || 'Tavvy member']));
  return { total: count || 0, reviews: (rows || []).map(row => {
    const name = names.get(row.user_id) || 'Tavvy member';
    return { reviewId: row.id, name, initial: name.charAt(0).toUpperCase(), date: row.created_at, note: row.public_note || null,
      when: new Date(row.created_at).toLocaleDateString(),
      signals: (taps || []).filter(t => t.review_id === row.id).map(t => {
        const signal = getSignalById(t.signal_id);
        return signal ? { label: signal.label, category: signal.signal_type } : null;
      }).filter(Boolean) as RecentReview['signals'],
    };
  }) };
}

// Fetch user's existing review for a place (if any)

// Update an existing review


// Get review count for a place
export async function getPlaceReviewCount(placeId: string): Promise<number> {
  try {
    // Check if placeId is a valid UUID - Foursquare IDs are not UUIDs
    if (!isValidUUID(placeId)) {
      return 0; // No reviews for non-UUID places yet
    }

    const { data: count, error } = await supabase.rpc('get_place_public_review_count',{p_place_id:placeId});

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
// THERMOMETER BADGE - Signal Activity
// ============================================
// NOTE: Counts are aggregated server-side via the get_places_signal_counts
// RPC. Pulling raw tap rows is silently capped at 1000 by PostgREST, which
// made popular places under-count. The RPC returns all-time tap counts, so
// the previous 3-month window / intensity weighting is traded for accuracy.

// Fetch thermometer data for a place (positive/negative signal taps)
export async function fetchPlaceThermometer(placeId: string, months: number = 3): Promise<{
  positiveTaps: number;
  negativeTaps: number;
}> {
  const results = await fetchPlacesThermometer([placeId], months);
  return results.get(placeId) || { positiveTaps: 0, negativeTaps: 0 };
}

// Batch fetch thermometer data for multiple places (more efficient)
export async function fetchPlacesThermometer(placeIds: string[], _months: number = 3): Promise<Map<string, { positiveTaps: number; negativeTaps: number }>> {
  const result = new Map<string, { positiveTaps: number; negativeTaps: number }>();

  if (placeIds.length === 0) {
    return result;
  }

  try {
    // Ensure signal cache is loaded
    await loadSignalCache();

    // Initialize all places with zero counts
    placeIds.forEach(id => {
      result.set(id, { positiveTaps: 0, negativeTaps: 0 });
    });

    // RPC takes uuid[]; fsq ids are not uuids and have no taps
    const uuidIds = placeIds.filter(isValidUUID);
    if (uuidIds.length === 0) {
      return result;
    }

    const { data: countRows, error } = await supabase
      .rpc('get_places_signal_counts', { p_place_ids: uuidIds });

    if (error) {
      console.error('Error fetching batch thermometer data:', error);
      return result;
    }

    (countRows || []).forEach((row: any) => {
      const tapCount = Number(row.tap_count) || 0;
      if (tapCount <= 0) return;

      const signal = getSignalById(row.signal_id);
      const category = signal?.signal_type;
      const placeData = result.get(row.place_id);

      if (placeData) {
        if (category === 'best_for' || category === 'vibe') {
          placeData.positiveTaps += tapCount;
        } else if (category === 'heads_up') {
          placeData.negativeTaps += tapCount;
        }
      }
    });

    return result;

  } catch (error) {
    console.error('Error fetching batch thermometer data:', error);
    return result;
  }
}
