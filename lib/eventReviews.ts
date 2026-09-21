const EVENT_API = (process.env.EXPO_PUBLIC_WEB_URL || 'https://tavvy.com').replace(/\/$/, '');
import { supabase } from './supabaseClient';
import { loadActiveSignalCatalog } from './signalCatalog';
import { validateReviewSignals } from './reviewPersistence';
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


const EMPTY = () => ({ best_for: [] as any[], vibe: [] as any[], heads_up: [] as any[] });
let catalog: any[] | null = null;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const CATEGORY_COLORS = { best_for: { bg: '#00C2CB', text: '#FFFFFF' }, vibe: { bg: '#8A05BE', text: '#FFFFFF' }, heads_up: { bg: '#F5A623', text: '#FFFFFF' } };
export function getSignalById(id: string) { return catalog?.find(signal => signal.id === id); }
export function getSignalLabel(id: string) { return getSignalById(id)?.label || 'Signal'; }
export async function fetchSignalsForEvent(_eventId?: string) {
  if (!catalog) catalog = (await loadActiveSignalCatalog(supabase)).filter(signal => signal.slug.startsWith('event_') || signal.slug.startsWith('generic_') || signal.is_universal);
  const result = EMPTY();
  catalog.forEach(signal => { if (signal.signal_type in result) result[signal.signal_type as ReviewCategory].push(signal); });
  Object.values(result).forEach(rows => rows.sort((a,b) => a.label.localeCompare(b.label)));
  return result;
}
async function save(eventId: string, signals: ReviewSignalTap[], publicNote?: string, privateNote?: string, reviewId?: string) {
  try {
    validateReviewSignals(signals);
    if ((publicNote?.length || 0) > 4000 || (privateNote?.length || 0) > 4000) throw new Error('Notes must be 4000 characters or fewer.');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('Sign in to save your review.');
    if (/^(tm|phq)_/.test(eventId)) {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(EVENT_API + '/api/events/subject', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` }, body: JSON.stringify({ eventId }) });
      if (!response.ok) throw new Error('This event could not be verified. Try again later.');
    } else if (!UUID.test(eventId)) throw new Error('Invalid event identifier.');
    const { data, error } = await supabase.rpc('save_event_review', { p_event_identifier: eventId, p_signals: signals.map(signal => ({ signal_id: signal.signalId, intensity: signal.intensity })), p_public_note: publicNote || null, p_private_note: privateNote || null, p_review_id: reviewId || null });
    if (error) throw new Error(error.code === '22023' || error.code === '42501' ? error.message : 'Your review could not be saved. Try again later.');
    if (typeof data !== 'string' || !UUID.test(data)) throw new Error('The server did not confirm your review.');
    return { success: true, reviewId: data };
  } catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Your review could not be saved.' }; }
}
export async function submitEventReview(id: string, _name: string, signals: ReviewSignalTap[], publicNote?: string, privateNote?: string) { return save(id,signals,publicNote,privateNote); }
export async function updateEventReview(reviewId: string,id: string,signals: ReviewSignalTap[],publicNote?: string,privateNote?: string) { return save(id,signals,publicNote,privateNote,reviewId); }
export async function fetchUserEventReview(id: string): Promise<{ review: EventReview | null; signals: ReviewSignalTap[] }> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError?.name === 'AuthSessionMissingError') return { review: null, signals: [] };
  if (authError) throw authError;
  if (!auth.user) return { review: null, signals: [] };
  const { data, error } = await supabase.rpc('get_my_event_review', { p_identifier: id });
  if (error) throw new Error('Your existing event review could not be loaded.');
  const review = data?.[0] as EventReview | undefined;
  if (!review) return { review: null, signals: [] };
  const { data: taps, error: tapError } = await supabase.from('event_review_signal_taps').select('signal_id,intensity').eq('review_id',review.id).eq('event_id',review.event_id);
  if (tapError) throw new Error('Your saved taps could not be loaded.');
  return { review, signals: (taps || []).map(tap => ({ signalId:tap.signal_id,intensity:tap.intensity })) };
}
export async function fetchEventSignals(id: string): Promise<{best_for:SignalAggregate[];vibe:SignalAggregate[];heads_up:SignalAggregate[]}> {
  const { data,error } = await supabase.rpc('get_event_signal_totals',{p_identifier:id});
  if(error)throw new Error('Event taps could not be loaded.');
  const result=EMPTY();
  for(const row of data||[]) if(row.category in result)result[row.category as ReviewCategory].push({...row,tap_total:Number(row.tap_total),current_score:Number(row.current_score),review_count:Number(row.review_count)});
  Object.values(result).forEach(rows=>rows.sort((a,b)=>b.current_score-a.current_score));return result;
}
export async function getEventReviewCount(id:string):Promise<number>{
  const {data:eventId,error:resolveError}=await supabase.rpc('find_event_review_subject',{p_identifier:id});
  if(resolveError)throw new Error('Event reviews could not be loaded.');
  if(!eventId)return 0;
  const {count,error}=await supabase.from('event_reviews').select('id',{count:'exact',head:true}).eq('event_id',eventId).eq('status','live');
  if(error)throw new Error('Event reviews could not be loaded.');return count||0;
}
