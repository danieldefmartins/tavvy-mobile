// =============================================
// ANALYTICS SERVICE
// =============================================
// Tracks story views, engagement, and discovery metrics

import { supabase } from './supabaseClient';

// =============================================
// TYPES
// =============================================

export interface StoryAnalytics {
  storyId: string;
  totalViews: number;
  uniqueViews: number;
  avgWatchTime: number;
  completionRate: number;
  tapForwardCount: number;
  tapBackCount: number;
  shareCount: number;
  profileVisits: number;
  viewsByHour: Record<number, number>;
  viewsByDay: Record<string, number>;
  topViewerLocations: { city: string; count: number }[];
}

export interface PlaceAnalytics {
  placeId: string;
  totalStoryViews: number;
  totalStories: number;
  activeStories: number;
  avgViewsPerStory: number;
  followerCount: number;
  followerGrowth: number;
  happeningScore: number;
  happeningRank: number;
  engagementRate: number;
  topPerformingStories: {
    id: string;
    views: number;
    completionRate: number;
  }[];
  viewsTrend: { date: string; views: number }[];
}

export interface DiscoveryAnalytics {
  totalQuickFindTaps: number;
  quickFindsByPreset: Record<string, number>;
  happeningNowTaps: number;
  storyRingTaps: number;
  trendingTaps: number;
  searchQueries: { query: string; count: number }[];
  popularTags: { tag: string; count: number }[];
}

export interface ViewEvent {
  storyId: string;
  userId?: string;
  sessionId: string;
  watchDuration: number;
  completed: boolean;
  tappedForward: boolean;
  tappedBack: boolean;
  shared: boolean;
  visitedProfile: boolean;
  latitude?: number;
  longitude?: number;
}

// =============================================
// STORY VIEW TRACKING
// =============================================

/**
 * Track a story view event
 */
export async function trackStoryView(event: ViewEvent): Promise<void> {
  try {
    await supabase.from('story_view_events').insert({
      story_id: event.storyId,
      user_id: event.userId || null,
      session_id: event.sessionId,
      watch_duration_ms: event.watchDuration,
      completed: event.completed,
      tapped_forward: event.tappedForward,
      tapped_back: event.tappedBack,
      shared: event.shared,
      visited_profile: event.visitedProfile,
      latitude: event.latitude || null,
      longitude: event.longitude || null,
      created_at: new Date().toISOString(),
    });

    // Update story view count
    await supabase.rpc('increment_story_views', { story_id: event.storyId });
  } catch (error) {
    console.error('Error tracking story view:', error);
  }
}

/**
 * Track story share event
 */
export async function trackStoryShare(storyId: string, platform: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('story_share_events').insert({
      story_id: storyId,
      user_id: user?.id || null,
      platform,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking story share:', error);
  }
}

// =============================================
// DISCOVERY TRACKING
// =============================================

/**
 * Track Quick Find tap
 */
export async function trackQuickFindTap(presetId: string, tags: string[]): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('discovery_events').insert({
      event_type: 'quick_find_tap',
      user_id: user?.id || null,
      metadata: {
        preset_id: presetId,
        tags,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking quick find tap:', error);
  }
}

/**
 * Track Happening Now tap
 */
export async function trackHappeningNowTap(placeId: string, score: number): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('discovery_events').insert({
      event_type: 'happening_now_tap',
      user_id: user?.id || null,
      metadata: {
        place_id: placeId,
        score,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking happening now tap:', error);
  }
}

/**
 * Track Story Ring tap
 */
export async function trackStoryRingTap(placeId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('discovery_events').insert({
      event_type: 'story_ring_tap',
      user_id: user?.id || null,
      metadata: {
        place_id: placeId,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking story ring tap:', error);
  }
}

/**
 * Track Trending tap
 */
export async function trackTrendingTap(placeId: string, rank: number): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('discovery_events').insert({
      event_type: 'trending_tap',
      user_id: user?.id || null,
      metadata: {
        place_id: placeId,
        rank,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking trending tap:', error);
  }
}

/**
 * Track search query
 */
export async function trackSearchQuery(query: string, resultsCount: number): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('discovery_events').insert({
      event_type: 'search_query',
      user_id: user?.id || null,
      metadata: {
        query,
        results_count: resultsCount,
      },
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking search query:', error);
  }
}

// =============================================
// ANALYTICS RETRIEVAL
// =============================================

/**
 * Get analytics for a specific story
 */
export async function getStoryAnalytics(storyId: string): Promise<StoryAnalytics | null> {
  try {
    // Get view events
    const { data: events, error } = await supabase
      .from('story_view_events')
      .select('*')
      .eq('story_id', storyId);

    if (error || !events) return null;

    // Calculate metrics
    const uniqueViewers = new Set(events.filter(e => e.user_id).map(e => e.user_id));
    const completedViews = events.filter(e => e.completed);
    const totalWatchTime = events.reduce((sum, e) => sum + (e.watch_duration_ms || 0), 0);

    // Views by hour
    const viewsByHour: Record<number, number> = {};
    events.forEach(e => {
      const hour = new Date(e.created_at).getHours();
      viewsByHour[hour] = (viewsByHour[hour] || 0) + 1;
    });

    // Views by day
    const viewsByDay: Record<string, number> = {};
    events.forEach(e => {
      const day = new Date(e.created_at).toISOString().split('T')[0];
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;
    });

    return {
      storyId,
      totalViews: events.length,
      uniqueViews: uniqueViewers.size,
      avgWatchTime: events.length > 0 ? totalWatchTime / events.length : 0,
      completionRate: events.length > 0 ? (completedViews.length / events.length) * 100 : 0,
      tapForwardCount: events.filter(e => e.tapped_forward).length,
      tapBackCount: events.filter(e => e.tapped_back).length,
      shareCount: events.filter(e => e.shared).length,
      profileVisits: events.filter(e => e.visited_profile).length,
      viewsByHour,
      viewsByDay,
      topViewerLocations: [], // Would require geocoding
    };
  } catch (error) {
    console.error('Error getting story analytics:', error);
    return null;
  }
}

/**
 * Get analytics for a place
 */
export async function getPlaceAnalytics(placeId: string): Promise<PlaceAnalytics | null> {
  try {
    // Get all stories for this place
    const { data: stories, error: storiesError } = await supabase
      .from('place_stories')
      .select('id, view_count, created_at, expires_at, moderation_status')
      .eq('place_id', placeId);

    if (storiesError) return null;

    // Get follower count
    const { count: followerCount } = await supabase
      .from('user_place_follows')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', placeId);

    // Get happening score
    const { data: happeningData } = await supabase
      .from('place_happening_scores')
      .select('score')
      .eq('place_id', placeId)
      .single();

    const activeStories = stories?.filter(s => 
      s.moderation_status === 'active' && 
      new Date(s.expires_at) > new Date()
    ) || [];

    const totalViews = stories?.reduce((sum, s) => sum + (s.view_count || 0), 0) || 0;

    // Calculate views trend (last 7 days)
    const viewsTrend: { date: string; views: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayViews = stories?.filter(s => {
        const storyDate = new Date(s.created_at).toISOString().split('T')[0];
        return storyDate === dateStr;
      }).reduce((sum, s) => sum + (s.view_count || 0), 0) || 0;

      viewsTrend.push({ date: dateStr, views: dayViews });
    }

    // Top performing stories
    const topPerformingStories = (stories || [])
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        views: s.view_count || 0,
        completionRate: 0, // Would need to calculate from events
      }));

    return {
      placeId,
      totalStoryViews: totalViews,
      totalStories: stories?.length || 0,
      activeStories: activeStories.length,
      avgViewsPerStory: stories?.length ? totalViews / stories.length : 0,
      followerCount: followerCount || 0,
      followerGrowth: 0, // Would need historical data
      happeningScore: happeningData?.score || 0,
      happeningRank: 0, // Would need to calculate
      engagementRate: 0, // Would need more data
      topPerformingStories,
      viewsTrend,
    };
  } catch (error) {
    console.error('Error getting place analytics:', error);
    return null;
  }
}

/**
 * Get discovery analytics for admin dashboard
 */
export async function getDiscoveryAnalytics(
  startDate: Date,
  endDate: Date
): Promise<DiscoveryAnalytics | null> {
  try {
    const { data: events, error } = await supabase
      .from('discovery_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) return null;

    const quickFindEvents = events?.filter(e => e.event_type === 'quick_find_tap') || [];
    const happeningNowEvents = events?.filter(e => e.event_type === 'happening_now_tap') || [];
    const storyRingEvents = events?.filter(e => e.event_type === 'story_ring_tap') || [];
    const trendingEvents = events?.filter(e => e.event_type === 'trending_tap') || [];
    const searchEvents = events?.filter(e => e.event_type === 'search_query') || [];

    // Quick finds by preset
    const quickFindsByPreset: Record<string, number> = {};
    quickFindEvents.forEach(e => {
      const presetId = e.metadata?.preset_id;
      if (presetId) {
        quickFindsByPreset[presetId] = (quickFindsByPreset[presetId] || 0) + 1;
      }
    });

    // Search queries
    const searchQueryCounts: Record<string, number> = {};
    searchEvents.forEach(e => {
      const query = e.metadata?.query?.toLowerCase();
      if (query) {
        searchQueryCounts[query] = (searchQueryCounts[query] || 0) + 1;
      }
    });
    const searchQueries = Object.entries(searchQueryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Popular tags from quick finds
    const tagCounts: Record<string, number> = {};
    quickFindEvents.forEach(e => {
      const tags = e.metadata?.tags || [];
      tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const popularTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      totalQuickFindTaps: quickFindEvents.length,
      quickFindsByPreset,
      happeningNowTaps: happeningNowEvents.length,
      storyRingTaps: storyRingEvents.length,
      trendingTaps: trendingEvents.length,
      searchQueries,
      popularTags,
    };
  } catch (error) {
    console.error('Error getting discovery analytics:', error);
    return null;
  }
}

// =============================================
// REAL-TIME ANALYTICS
// =============================================

/**
 * Get real-time view count for a story
 */
export async function getRealTimeViewCount(storyId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('place_stories')
      .select('view_count')
      .eq('id', storyId)
      .single();

    if (error) return 0;
    return data?.view_count || 0;
  } catch (error) {
    return 0;
  }
}

/**
 * Subscribe to real-time view updates for a story
 */
export function subscribeToStoryViews(
  storyId: string,
  callback: (viewCount: number) => void
): () => void {
  const subscription = supabase
    .channel(`story-views-${storyId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'place_stories',
        filter: `id=eq.${storyId}`,
      },
      (payload) => {
        callback(payload.new.view_count || 0);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

// =============================================
// ANALYTICS EXPORT
// =============================================

/**
 * Export analytics data as CSV
 */
export async function exportAnalyticsCSV(
  placeId: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  try {
    const { data: stories } = await supabase
      .from('place_stories')
      .select('id, caption, view_count, created_at, expires_at')
      .eq('place_id', placeId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (!stories || stories.length === 0) {
      return 'No data available for the selected period';
    }

    // Create CSV header
    const headers = ['Story ID', 'Caption', 'Views', 'Created At', 'Expires At'];
    const rows = stories.map(s => [
      s.id,
      `"${(s.caption || '').replace(/"/g, '""')}"`,
      s.view_count || 0,
      s.created_at,
      s.expires_at,
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return 'Error exporting data';
  }
}

// =============================================
// HAPPENING SCORE ANALYTICS
// =============================================

/**
 * Get happening score breakdown for a place
 */
export async function getHappeningScoreBreakdown(placeId: string): Promise<{
  total: number;
  stories: number;
  reviews: number;
  checkins: number;
  photos: number;
  taps: number;
} | null> {
  try {
    const { data, error } = await supabase
      .from('place_happening_scores')
      .select('*')
      .eq('place_id', placeId)
      .single();

    if (error) return null;

    return {
      total: data.score || 0,
      stories: data.story_points || 0,
      reviews: data.review_points || 0,
      checkins: data.checkin_points || 0,
      photos: data.photo_points || 0,
      taps: data.tap_points || 0,
    };
  } catch (error) {
    console.error('Error getting happening score breakdown:', error);
    return null;
  }
}

/**
 * Get top happening places
 */
export async function getTopHappeningPlaces(
  limit: number = 10,
  latitude?: number,
  longitude?: number,
  radiusMiles?: number
): Promise<{ placeId: string; placeName: string; score: number }[]> {
  try {
    let query = supabase
      .from('place_happening_scores')
      .select(`
        place_id,
        score,
        place:fsq_places_raw(name)
      `)
      .gt('score', 0)
      .order('score', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) return [];

    return (data || []).map(d => ({
      placeId: d.place_id,
      placeName: d.place?.name || 'Unknown',
      score: d.score,
    }));
  } catch (error) {
    console.error('Error getting top happening places:', error);
    return [];
  }
}
