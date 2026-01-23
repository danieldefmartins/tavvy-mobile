// =============================================
// TAVVY PLACE STORIES SERVICE
// =============================================
// Handles all story-related operations including
// upload, viewing, expiration, and story ring state

import { supabase } from './supabaseClient';

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
  place_id: string;
  user_id: string;
  media_url: string;
  media_type?: 'video' | 'image';
  thumbnail_url?: string;
  caption?: string;
  tags?: string[];
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
    const { data: stories, error } = await supabase
      .from('place_stories')
      .select('*')
      .eq('place_id', placeId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
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
    console.error('Error fetching place stories:', error);
    return [];
  }
}

/**
 * Upload a new story
 */
export async function uploadStory(params: StoryUploadParams): Promise<PlaceStory | null> {
  try {
    // Extract hashtags from caption
    const tags = params.tags || [];
    if (params.caption) {
      const hashtagMatches = params.caption.match(/#(\w+)/g);
      if (hashtagMatches) {
        tags.push(...hashtagMatches.map(tag => tag.slice(1).toLowerCase()));
      }
    }

    const { data, error } = await supabase
      .from('place_stories')
      .insert({
        place_id: params.place_id,
        user_id: params.user_id,
        media_url: params.media_url,
        media_type: params.media_type || 'video',
        thumbnail_url: params.thumbnail_url,
        caption: params.caption,
        tags: [...new Set(tags)], // Remove duplicates
        status: 'active',
        is_permanent: false,
        expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days
      })
      .select()
      .single();

    if (error) throw error;

    // Update happening score for the place
    await updateHappeningScore(params.place_id, 50); // +50 for new story

    return data;
  } catch (error) {
    console.error('Error uploading story:', error);
    return null;
  }
}

/**
 * Delete a story (owner or author only)
 */
export async function deleteStory(storyId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('place_stories')
      .update({ status: 'deleted' })
      .eq('id', storyId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting story:', error);
    return false;
  }
}

/**
 * Report a story
 */
export async function reportStory(storyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('place_stories')
      .update({ status: 'reported' })
      .eq('id', storyId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error reporting story:', error);
    return false;
  }
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
    // Get active story count
    const { count: totalCount } = await supabase
      .from('place_stories')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', placeId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

    if (!totalCount || totalCount === 0) {
      return 'none';
    }

    // If no user, show as unseen
    if (!currentUserId) {
      return 'unseen';
    }

    // Get viewed count for this user
    const { count: viewedCount } = await supabase
      .from('place_story_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUserId)
      .in('story_id', 
        supabase
          .from('place_stories')
          .select('id')
          .eq('place_id', placeId)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
      );

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
    // Get all active stories for these places
    const { data: stories } = await supabase
      .from('place_stories')
      .select('id, place_id')
      .in('place_id', placeIds)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString());

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
    const { data: highlights, error } = await supabase
      .from('place_story_highlights')
      .select(`
        *,
        stories:place_story_highlight_items(
          story:place_stories(*)
        )
      `)
      .eq('place_id', placeId)
      .order('position', { ascending: true });

    if (error) throw error;
    return highlights || [];
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return [];
  }
}

/**
 * Save a story to a highlight (makes it permanent)
 */
export async function saveStoryToHighlight(
  storyId: string,
  highlightId: string
): Promise<boolean> {
  try {
    // Add to highlight
    const { error: joinError } = await supabase
      .from('place_story_highlight_items')
      .insert({
        highlight_id: highlightId,
        story_id: storyId
      });

    if (joinError) throw joinError;

    // Make story permanent
    const { error: updateError } = await supabase
      .from('place_stories')
      .update({ is_permanent: true })
      .eq('id', storyId);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error saving story to highlight:', error);
    return false;
  }
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
      .or(`expires_at.gt.${now},is_permanent.eq.true`)
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
