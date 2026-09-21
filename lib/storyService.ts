// =============================================
// TAVVY PLACE STORIES SERVICE
// =============================================
// Handles all story-related operations including
// upload, viewing, expiration, and story ring state

import { supabase } from './supabaseClient';
import { getStoryPublishAccess, publishUploadedStory, saveOwnerHighlight, storyErrorMessage, StoryKind, StoryLocation } from './storyPublishing';

// Types
export interface PlaceStory {
  id: string;
  place_id: string;
  user_id: string;
  media_url: string;
  media_type: 'video' | 'image';
  thumbnail_url?: string;
  status: 'active' | 'deleted' | 'reported';
  is_permanent: boolean;
  story_kind?: StoryKind;
  media_path?: string;
  expires_at: string;
  tags: string[];
  caption?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string;
  };
  viewed?: boolean;
}

export interface StoryHighlight {
  id: string;
  place_id: string;
  title: string;
  cover_story_id?: string;
  position: number;
  stories?: PlaceStory[];
  created_at: string;
}

export interface StoryUploadParams {
  media_path?: string;
  story_kind?: StoryKind;
  userLocation?: StoryLocation;
  place_id: string;
  user_id: string;
  media_url: string;
  media_type?: 'video' | 'image';
  thumbnail_url?: string;
  caption?: string;
  tags?: string[];
}

// Helper: Check if string is a valid UUID
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// =============================================
// STORY CRUD OPERATIONS
// =============================================

/**
 * Get all active stories for a place
 */
export async function getPlaceStories(
  placeId: string,
  currentUserId?: string
): Promise<PlaceStory[]> {
  try {
    // Check if placeId is a valid UUID - Foursquare IDs are 24-char hex strings, not UUIDs
    // If not a valid UUID, return empty results (no stories for external places yet)
    if (!isValidUUID(placeId)) {
      // Silently return empty - this is expected for Foursquare/Google places
      return [];
    }

    const { data: stories, error } = await supabase
      .from('place_stories')
      .select('*')
      .eq('place_id', placeId)
      .eq('status', 'active')
      .or(`expires_at.gt.${new Date().toISOString()},and(is_permanent.eq.true,story_kind.eq.owner_highlight)`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // If user is logged in, check which stories they've viewed
    if (currentUserId && stories && stories.length > 0) {
      const storyIds = stories.map(s => s.id);
      const { data: views } = await supabase
        .from('place_story_views')
        .select('story_id')
        .eq('user_id', currentUserId)
        .in('story_id', storyIds);

      const viewedIds = new Set(views?.map(v => v.story_id) || []);
      return stories.map(story => ({
        ...story,
        viewed: viewedIds.has(story.id)
      }));
    }

    return stories || [];
  } catch (error) {
    // Log as info instead of error to avoid showing error screen for expected cases (FSQ IDs)
    console.log('[storyService] Could not fetch stories (expected for FSQ places):', placeId);
    return [];
  }
}

/**
 * Upload a new story
 */
export async function uploadStory(params: StoryUploadParams): Promise<PlaceStory | null> {
  try {
    const expected = new URL(supabase.storage.from('place-stories').getPublicUrl('check').data.publicUrl);
    const provided = new URL(params.media_url);
    const prefix = '/storage/v1/object/public/place-stories/';
    if (provided.origin !== expected.origin || !provided.pathname.startsWith(prefix)) throw new Error('STORY_MEDIA_NOT_OWNED');
    return await publishUploadedStory(supabase, {
      placeId: params.place_id, mediaPath: params.media_path || decodeURIComponent(provided.pathname.slice(prefix.length)),
      mediaType: params.media_type || 'video', kind: params.story_kind || 'customer', caption: params.caption,
      tags: params.tags, location: params.userLocation || (params.story_kind === 'owner_highlight' ? null : await getCurrentLocation()),
    });
  } catch (error) {
    console.error('Story publishing failed:', storyErrorMessage(error));
    return null;
  }
}

/**
 * Delete a story (original author only)
 */
export async function deleteStory(storyId: string, _userId: string): Promise<boolean> {
  const { data: story } = await supabase.from('place_stories').select('media_path').eq('id', storyId).maybeSingle();
  const { error } = await supabase.rpc('delete_my_place_story', { p_story_id: storyId });
  if (error) return false;
  if (story?.media_path) {
    try { await supabase.storage.from('place-stories').remove([story.media_path]); } catch {}
  }
  return true;
}

/**
 * Report a story
 */
export async function reportStory(storyId: string): Promise<boolean> {
  const { error } = await supabase.rpc('report_place_story', { p_story_id: storyId, p_reason: 'other' });
  return !error;
}

/**
 * Mark a story as viewed
 */
export async function markStoryViewed(storyId: string, userId: string): Promise<void> {
  try {
    await supabase
      .from('place_story_views')
      .upsert({
        story_id: storyId,
        user_id: userId,
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'story_id,user_id'
      });
  } catch (error) {
    console.error('Error marking story as viewed:', error);
  }
}

// =============================================
// STORY RING STATE
// =============================================

export type StoryRingState = 'none' | 'unseen' | 'seen';

/**
 * Get the story ring state for a place
 */
export async function getStoryRingState(
  placeId: string,
  currentUserId?: string
): Promise<StoryRingState> {
  try {
    // Check if placeId is a valid UUID
    if (!isValidUUID(placeId)) {
      return 'none';
    }

    // Get active story count
    const { count: totalCount } = await supabase
      .from('place_stories')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', placeId)
      .eq('status', 'active')
      .or(`expires_at.gt.${new Date().toISOString()},and(is_permanent.eq.true,story_kind.eq.owner_highlight)`);

    if (!totalCount || totalCount === 0) {
      return 'none';
    }

    // If no user, show as unseen
    if (!currentUserId) {
      return 'unseen';
    }

    // PostgREST .in requires IDs, not another query builder.
    const { data: activeStories, error: activeError } = await supabase
      .from('place_stories').select('id').eq('place_id', placeId)
      .eq('status', 'active').or(`expires_at.gt.${new Date().toISOString()},and(is_permanent.eq.true,story_kind.eq.owner_highlight)`);
    if (activeError || !activeStories?.length) return 'unseen';
    const { count: viewedCount } = await supabase
      .from('place_story_views').select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId).in('story_id', activeStories.map(story => story.id));

    return (viewedCount || 0) >= totalCount ? 'seen' : 'unseen';
  } catch (error) {
    console.error('Error getting story ring state:', error);
    return 'none';
  }
}

/**
 * Get story ring states for multiple places (batch)
 */
export async function getStoryRingStates(
  placeIds: string[],
  currentUserId?: string
): Promise<Map<string, StoryRingState>> {
  const states = new Map<string, StoryRingState>();
  
  try {
    // Filter to only valid UUIDs - non-UUID place IDs (Foursquare, Google) get 'none' state
    const validUUIDs = placeIds.filter(id => isValidUUID(id));
    const invalidIds = placeIds.filter(id => !isValidUUID(id));
    
    // Set non-UUID places to 'none'
    invalidIds.forEach(id => states.set(id, 'none'));
    
    // If no valid UUIDs, return early
    if (validUUIDs.length === 0) {
      return states;
    }

    // Get all active stories for these places
    const { data: stories } = await supabase
      .from('place_stories')
      .select('id, place_id')
      .in('place_id', validUUIDs)
      .eq('status', 'active')
      .or(`expires_at.gt.${new Date().toISOString()},and(is_permanent.eq.true,story_kind.eq.owner_highlight)`);

    if (!stories || stories.length === 0) {
      placeIds.forEach(id => states.set(id, 'none'));
      return states;
    }

    // Group stories by place
    const storiesByPlace = new Map<string, string[]>();
    stories.forEach(story => {
      const existing = storiesByPlace.get(story.place_id) || [];
      existing.push(story.id);
      storiesByPlace.set(story.place_id, existing);
    });

    // Set places with no stories to 'none'
    placeIds.forEach(id => {
      if (!storiesByPlace.has(id)) {
        states.set(id, 'none');
      }
    });

    // If no user, all places with stories are 'unseen'
    if (!currentUserId) {
      storiesByPlace.forEach((_, placeId) => {
        states.set(placeId, 'unseen');
      });
      return states;
    }

    // Get viewed stories for this user
    const allStoryIds = stories.map(s => s.id);
    const { data: views } = await supabase
      .from('place_story_views')
      .select('story_id')
      .eq('user_id', currentUserId)
      .in('story_id', allStoryIds);

    const viewedIds = new Set(views?.map(v => v.story_id) || []);

    // Determine state for each place
    storiesByPlace.forEach((storyIds, placeId) => {
      const allViewed = storyIds.every(id => viewedIds.has(id));
      states.set(placeId, allViewed ? 'seen' : 'unseen');
    });

    return states;
  } catch (error) {
    console.error('Error getting story ring states:', error);
    placeIds.forEach(id => states.set(id, 'none'));
    return states;
  }
}

// =============================================
// HIGHLIGHTS
// =============================================

/**
 * Get highlights for a place
 */
export async function getPlaceHighlights(placeId: string): Promise<StoryHighlight[]> {
  try {
    // Check if placeId is a valid UUID
    if (!isValidUUID(placeId)) {
      return [];
    }

    const { data: highlights, error } = await supabase
      .from('place_story_highlights')
      .select(`
        *,
        stories:place_story_highlight_items(
          position,
          story:place_stories(*)
        )
      `)
      .eq('place_id', placeId)
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) throw error;
    return (highlights || []).map(highlight => ({
      ...highlight,
      stories: (highlight.stories || []).sort((a: any, b: any) => a.position - b.position)
        .map((item: any) => item.story).filter((story: any) => story?.status === 'active' && story.story_kind === 'owner_highlight'),
    }));
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return [];
  }
}

/**
 * Save a story to a highlight (makes it permanent)
 */
export async function saveStoryToHighlight(storyId: string, highlightId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('place_story_highlights')
      .select('id,place_id,title,is_active,items:place_story_highlight_items(story_id)').eq('id', highlightId).single();
    if (error || !data) return false;
    await saveOwnerHighlight(supabase, data.place_id, data.title,
      [...new Set([...(data.items || []).map((item: any) => item.story_id as string), storyId])], data.id, data.is_active);
    return true;
  } catch { return false; }
}

// =============================================
// HAPPENING SCORE
// =============================================

/**
 * Update the happening score for a place
 */
export async function updateHappeningScore(
  placeId: string,
  points: number
): Promise<void> {
  try {
    // Upsert the score
    const { data: existing } = await supabase
      .from('place_happening_scores')
      .select('happening_score')
      .eq('place_id', placeId)
      .single();

    const currentScore = existing?.happening_score || 0;
    const newScore = currentScore + points;

    await supabase
      .from('place_happening_scores')
      .upsert({
        place_id: placeId,
        happening_score: newScore,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'place_id'
      });
  } catch (error) {
    console.error('Error updating happening score:', error);
  }
}

/**
 * Get places with high happening scores (What's Happening Now)
 */
export async function getHappeningNowPlaces(
  limit: number = 10,
  minScore: number = 25
): Promise<{ place_id: string; happening_score: number; last_activity_at: string }[]> {
  try {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('place_happening_scores')
      .select('place_id, happening_score, last_activity_at')
      .gte('happening_score', minScore)
      .gte('last_activity_at', threeHoursAgo)
      .order('happening_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching happening now places:', error);
    return [];
  }
}

// =============================================
// QUICK FINDS
// =============================================

export interface QuickFindPreset {
  id: string;
  slug: string;
  label: string;
  icon: string;
  tags: string[];
  position: number;
  is_active: boolean;
}

/**
 * Get all active Quick Find presets
 */
export async function getQuickFindPresets(): Promise<QuickFindPreset[]> {
  try {
    const { data, error } = await supabase
      .from('quick_find_presets')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching quick find presets:', error);
    return [];
  }
}

/**
 * Get places matching Quick Find tags
 */
export async function getQuickFindPlaces(
  tags: string[],
  limit: number = 20
): Promise<{ place_id: string; story_count: number }[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Query places with stories that have matching tags
    const { data, error } = await supabase
      .from('place_stories')
      .select('place_id')
      .eq('status', 'active')
      .gte('created_at', thirtyDaysAgo)
      .overlaps('tags', tags);

    if (error) throw error;

    // Count stories per place
    const placeCounts = new Map<string, number>();
    data?.forEach(story => {
      const count = placeCounts.get(story.place_id) || 0;
      placeCounts.set(story.place_id, count + 1);
    });

    // Sort by count and return top places
    return Array.from(placeCounts.entries())
      .map(([place_id, story_count]) => ({ place_id, story_count }))
      .sort((a, b) => b.story_count - a.story_count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching quick find places:', error);
    return [];
  }
}


// =============================================
// NEARBY PLACES WITH STORIES
// =============================================

export interface PlaceWithStoryInfo {
  placeId: string;
  placeName: string;
  placeImage: string | null;
  storyCount: number;
  hasUnviewedStories: boolean;
  latestStoryId: string;
  latitude: number;
  longitude: number;
}

/**
 * Get nearby places that have active stories
 * Used for the Stories row on Home Screen
 */
export async function getNearbyPlacesWithStories(
  userLocation: [number, number] | null, // [lng, lat]
  currentUserId?: string,
  maxDistance: number = 20, // miles
  limit: number = 15
): Promise<PlaceWithStoryInfo[]> {
  try {
    const now = new Date().toISOString();
    
    // Get all active stories (not expired)
    const { data: stories, error: storiesError } = await supabase
      .from('place_stories')
      .select('id, place_id, created_at')
      .eq('status', 'active')
      .or(`expires_at.gt.${now},and(is_permanent.eq.true,story_kind.eq.owner_highlight)`)
      .order('created_at', { ascending: false });

    if (storiesError) {
      console.error('[storyService] Error fetching stories:', storiesError);
      return [];
    }

    if (!stories || stories.length === 0) {
      console.log('[storyService] No active stories found');
      return [];
    }

    // Get unique place IDs
    const placeIds = [...new Set(stories.map(s => s.place_id))];
    console.log('[storyService] Places with stories:', placeIds.length);

    // Fetch place details
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('id, name, cover_image_url, latitude, longitude')
      .in('id', placeIds);

    if (placesError) {
      console.error('[storyService] Error fetching places:', placesError);
      return [];
    }

    // Get user's viewed stories
    let viewedStoryIds = new Set<string>();
    if (currentUserId) {
      const { data: views } = await supabase
        .from('place_story_views')
        .select('story_id')
        .eq('user_id', currentUserId);
      
      if (views) {
        viewedStoryIds = new Set(views.map(v => v.story_id));
      }
    }

    // Build places with stories data
    const placesMap = new Map<string, PlaceWithStoryInfo>();
    
    stories.forEach(story => {
      const place = places?.find(p => p.id === story.place_id);
      if (!place || !place.latitude || !place.longitude) return;

      // Calculate distance if we have user location
      if (userLocation) {
        const distance = calculateDistanceMiles(
          userLocation[1], userLocation[0],
          Number(place.latitude), Number(place.longitude)
        );
        if (distance > maxDistance) return;
      }

      const isUnviewed = !viewedStoryIds.has(story.id);
      const existing = placesMap.get(story.place_id);

      if (existing) {
        existing.storyCount++;
        if (isUnviewed) existing.hasUnviewedStories = true;
      } else {
        placesMap.set(story.place_id, {
          placeId: story.place_id,
          placeName: place.name,
          placeImage: place.cover_image_url,
          storyCount: 1,
          hasUnviewedStories: isUnviewed,
          latestStoryId: story.id,
          latitude: Number(place.latitude),
          longitude: Number(place.longitude),
        });
      }
    });

    // Sort by: unviewed first, then by story count
    const result = Array.from(placesMap.values())
      .sort((a, b) => {
        if (a.hasUnviewedStories !== b.hasUnviewedStories) {
          return a.hasUnviewedStories ? -1 : 1;
        }
        return b.storyCount - a.storyCount;
      })
      .slice(0, limit);

    console.log('[storyService] Nearby places with stories:', result.length);
    return result;
  } catch (error) {
    console.error('[storyService] Error getting nearby places with stories:', error);
    return [];
  }
}

// Helper function for distance calculation
function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


// =============================================
// LOCATION GATING & MODERATION SYSTEM
// =============================================
// Implements Tavvy Stories (Live Experience) v1
// - Location gating (150m radius)
// - 2-3 day lifespan
// - 1-tap reporting → Tavvy moderation
// - Strike system (2 strikes = suspension)

import * as Location from 'expo-location';

// Constants
export const STORY_EXPIRY_HOURS = 72; // 3 days
export const DEFAULT_RADIUS_METERS = 150; // Standard places
export const LARGE_VENUE_RADIUS_METERS = 500; // Airports, malls, theme parks
export const MAX_STORIES_PER_USER_PER_DAY = 10;
export const MAX_STORIES_PER_PLACE_PER_USER_PER_DAY = 3;

// Additional Types for Moderation
export interface StoryReport {
  id: string;
  story_id: string;
  reporter_user_id: string;
  reason: 'sexual' | 'explicit' | 'harassment' | 'violent' | 'spam' | 'other';
  created_at: string;
}

export interface UserStrike {
  user_id: string;
  strike_count: number;
  last_strike_at?: string;
  status: 'active' | 'suspended';
  suspended_until?: string;
  notes?: string;
}

export interface ModerationEvent {
  id: string;
  story_id: string;
  actor_type: 'system' | 'business_admin' | 'super_admin';
  actor_user_id?: string;
  action: 'auto_scan_passed' | 'auto_scan_flagged' | 'reported_to_review' | 'approved' | 'removed';
  details?: any;
  created_at: string;
}

// =============================================
// LOCATION UTILITIES
// =============================================

/**
 * Calculate distance between two coordinates using Haversine formula (meters)
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if user is within allowed radius of place
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  placeLat: number,
  placeLon: number,
  radiusMeters: number = DEFAULT_RADIUS_METERS
): { withinRadius: boolean; distance: number } {
  const distance = calculateDistanceMeters(userLat, userLon, placeLat, placeLon);
  return {
    withinRadius: distance <= radiusMeters,
    distance: Math.round(distance),
  };
}

/**
 * Get current user location
 */
export async function getCurrentLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}

// =============================================
// STRIKE SYSTEM
// =============================================

/**
 * Get user's strike status
 */
export async function getUserStrikeStatus(userId: string): Promise<UserStrike | null> {
  const { data, error } = await supabase.from('user_strikes').select('created_at,expires_at').eq('user_id', userId);
  if (error) throw new Error(storyErrorMessage(error));
  const now = Date.now();
  const active = (data || []).filter(row => !row.expires_at || Date.parse(row.expires_at) > now);
  if (!active.length) return null;
  const last = Math.max(...active.map(row => Date.parse(row.created_at)));
  const until = last + 7 * 24 * 60 * 60 * 1000;
  return { user_id: userId, strike_count: active.length, last_strike_at: new Date(last).toISOString(),
    status: active.length >= 2 && until > now ? 'suspended' : 'active', suspended_until: new Date(until).toISOString() };
}

/**
 * Check if user can create stories (not suspended)
 */
export async function canUserCreateStory(_userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try { await getStoryPublishAccess(supabase, null, 'customer', null, false); return { allowed: true }; }
  catch (error: any) { return { allowed: false, reason: error.message }; }
}

/**
 * Check if user can create story for specific place (rate limit)
 */
export async function canUserCreateStoryForPlace(_userId: string, placeId: string): Promise<{ allowed: boolean; reason?: string }> {
  try { await getStoryPublishAccess(supabase, placeId, 'customer', null, false); return { allowed: true }; }
  catch (error: any) { return { allowed: false, reason: error.message }; }
}

/**
 * Apply strike to user
 */
export async function applyStrike(_userId: string, _notes?: string): Promise<{ success: boolean; newStrikeCount: number; suspended: boolean }> {
  // Strikes may only be issued by trusted Tavvy moderation, never a restaurant client.
  return { success: false, newStrikeCount: 0, suspended: false };
}

// =============================================
// LOCATION-GATED STORY CREATION
// =============================================

export interface CreateStoryWithLocationParams {
  place_id: string;
  user_id: string;
  media_url: string;
  media_type: 'video' | 'image';
  thumbnail_url?: string;
  caption?: string;
  tags?: string[];
  userLocation: {
    latitude: number;
    longitude: number;
  };
  placeLocation: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Create a story with location validation
 * Enforces 150m radius requirement
 */
export async function createStoryWithLocation(params: CreateStoryWithLocationParams): Promise<{ success: boolean; story?: PlaceStory; error?: string }> {
  try {
    const expected = new URL(supabase.storage.from('place-stories').getPublicUrl('check').data.publicUrl);
    const provided = new URL(params.media_url);
    const prefix = '/storage/v1/object/public/place-stories/';
    if (provided.origin !== expected.origin || !provided.pathname.startsWith(prefix)) throw new Error('STORY_MEDIA_NOT_OWNED');
    const story = await publishUploadedStory(supabase, {
      placeId: params.place_id, mediaPath: decodeURIComponent(provided.pathname.slice(prefix.length)),
      mediaType: params.media_type, kind: 'customer', caption: params.caption, tags: params.tags,
      location: params.userLocation,
    });
    return { success: true, story };
  } catch (error: any) { return { success: false, error: error.message || storyErrorMessage(error) }; }
}

// =============================================
// REPORTING & MODERATION
// =============================================

/**
 * Report a story for Tavvy moderation without letting merchants censor customer reports
 */
export async function reportStoryWithReason(storyId: string, _reporterUserId: string, reason: StoryReport['reason']): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('report_place_story', { p_story_id: storyId, p_reason: reason });
  return error ? { success: false, error: storyErrorMessage(error) } : { success: true };
}

/**
 * Get stories pending review for business admin
 */
export async function getPendingStoriesForAdmin(placeId: string): Promise<PlaceStory[]> {
  try {
    const { data, error } = await supabase
      .from('place_stories')
      .select('*')
      .eq('place_id', placeId)
      .eq('status', 'reported')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending stories:', error);
      return [];
    }

    return data as PlaceStory[];
  } catch (error) {
    console.error('Error in getPendingStoriesForAdmin:', error);
    return [];
  }
}

/**
 * Approve a reported story (business admin action)
 */
export async function approveReportedStory(_storyId: string, _adminUserId: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Customer reports are reviewed by Tavvy. Restaurant accounts cannot approve or remove them.' };
}

/**
 * Remove a reported story (business admin action) - applies strike to uploader
 */
export async function removeReportedStory(_storyId: string, _adminUserId: string, _notes?: string): Promise<{ success: boolean; strikeApplied: boolean; error?: string }> {
  return { success: false, strikeApplied: false, error: 'Customer reports are reviewed by Tavvy. Restaurant accounts cannot approve or remove them.' };
}

/**
 * Check if user is a business admin for a place
 */
export async function isBusinessAdmin(userId: string, placeId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('place_admins')
      .select('id')
      .eq('user_id', userId)
      .eq('place_id', placeId)
      .single();

    if (error) return false;
    return !!data;
  } catch (error) {
    return false;
  }
}

// =============================================
// TIME UTILITIES
// =============================================

/**
 * Get time ago string
 */
export function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/**
 * Get time remaining until expiry
 */
export function getTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) return 'Expired';

  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  if (diffDays > 0) {
    return `${diffDays}d ${remainingHours}h left`;
  }
  return `${diffHours}h left`;
}


// =============================================
// BUSINESS ADMIN MODERATION HELPERS
// =============================================

export interface ReportedStoryWithDetails extends PlaceStory {
  reports?: {
    id: string;
    reason: string;
    created_at: string;
  }[];
}

export type ModerationAction = 'approve' | 'remove' | 'dismiss';

/**
 * Get reported stories for a business admin with report details
 */
export async function getReportedStoriesForAdmin(
  adminUserId: string,
  placeId: string
): Promise<ReportedStoryWithDetails[]> {
  try {
    // First verify user is admin for this place
    const isAdmin = await isBusinessAdmin(adminUserId, placeId);
    if (!isAdmin) {
      console.error('User is not admin for this place');
      return [];
    }

    // Get reported stories with their reports
    const { data: stories, error: storiesError } = await supabase
      .from('place_stories')
      .select('*')
      .eq('place_id', placeId)
      .in('status', ['reported', 'under_review'])
      .order('created_at', { ascending: false });

    if (storiesError) {
      console.error('Error fetching reported stories:', storiesError);
      return [];
    }

    if (!stories || stories.length === 0) {
      return [];
    }

    // Get reports for these stories
    const storyIds = stories.map(s => s.id);
    const { data: reports, error: reportsError } = await supabase
      .from('story_reports')
      .select('id, story_id, reason, created_at')
      .in('story_id', storyIds)
      .order('created_at', { ascending: false });

    if (reportsError) {
      console.error('Error fetching reports:', reportsError);
    }

    // Combine stories with their reports
    const storiesWithReports: ReportedStoryWithDetails[] = stories.map(story => ({
      ...story,
      reports: reports?.filter(r => r.story_id === story.id).map(r => ({
        id: r.id,
        reason: r.reason,
        created_at: r.created_at,
      })) || [],
    }));

    return storiesWithReports;
  } catch (error) {
    console.error('Error in getReportedStoriesForAdmin:', error);
    return [];
  }
}

/**
 * Moderate a story (approve, remove, or dismiss report)
 */
export async function moderateStory(_storyId: string, _adminUserId: string, _action: ModerationAction, _notes?: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Customer reports are reviewed by Tavvy. Restaurant accounts cannot approve or remove them.' };
}

/**
 * Get user's suspension info for display
 */
export async function getUserSuspensionInfo(userId: string): Promise<{
  isSuspended: boolean;
  suspendedUntil?: string;
  strikeCount: number;
} | null> {
  try {
    const strikeStatus = await getUserStrikeStatus(userId);
    
    if (!strikeStatus) {
      return { isSuspended: false, strikeCount: 0 };
    }

    return {
      isSuspended: strikeStatus.status === 'suspended',
      suspendedUntil: strikeStatus.suspended_until,
      strikeCount: strikeStatus.strike_count,
    };
  } catch (error) {
    console.error('Error getting suspension info:', error);
    return null;
  }
}
