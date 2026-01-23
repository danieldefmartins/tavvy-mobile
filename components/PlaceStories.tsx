// ============================================
// PLACE STORIES COMPONENT
// Instagram-style stories row showing nearby places with active stories
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface PlaceWithStories {
  placeId: string;
  placeName: string;
  placeImage: string | null;
  storyCount: number;
  hasUnviewedStories: boolean;
  latestStoryId: string;
}

interface Story {
  id: string;
  placeId: string;
  placeName: string;
  placeImage: string | null;
  userId: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  expiresAt: string;
}

interface PlaceStoriesProps {
  userLocation?: [number, number] | null; // [lng, lat]
  onStoryPress?: (placeId: string, stories: Story[]) => void;
  onAddStoryPress?: () => void;
  maxPlaces?: number;
}

// ============================================
// CONSTANTS
// ============================================

const COLORS = {
  primary: '#1B2B5B',
  accent: '#0F8A8A',
  storyRingActive: ['#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1'],
  storyRingViewed: ['#C4C4C4', '#A0A0A0'],
  background: '#FFFFFF',
  backgroundDark: '#1A1A2E',
  text: '#1B2B5B',
  textDark: '#FFFFFF',
  textSecondary: '#666666',
  textSecondaryDark: '#AAAAAA',
};

const STORY_AVATAR_SIZE = 68;
const STORY_RING_SIZE = STORY_AVATAR_SIZE + 6;

// ============================================
// COMPONENT
// ============================================

export default function PlaceStories({
  userLocation,
  onStoryPress,
  onAddStoryPress,
  maxPlaces = 10,
}: PlaceStoriesProps) {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [placesWithStories, setPlacesWithStories] = useState<PlaceWithStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch places with active stories near the user
  const fetchPlacesWithStories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get active stories (not expired)
      const now = new Date().toISOString();
      
      let query = supabase
        .from('place_stories')
        .select(`
          id,
          place_id,
          media_url,
          media_type,
          caption,
          thumbnail_url,
          created_at,
          expires_at,
          user_id
        `)
        .eq('status', 'active')
        .or(`expires_at.gt.${now},is_permanent.eq.true`)
        .order('created_at', { ascending: false });

      const { data: stories, error: storiesError } = await query;

      if (storiesError) {
        console.error('[PlaceStories] Error fetching stories:', storiesError);
        throw storiesError;
      }

      if (!stories || stories.length === 0) {
        console.log('[PlaceStories] No active stories found');
        setPlacesWithStories([]);
        return;
      }

      // Get unique place IDs
      const placeIds = [...new Set(stories.map((s: any) => s.place_id))];
      console.log('[PlaceStories] Found stories for places:', placeIds.length);

      // Fetch place details for these places
      const { data: places, error: placesError } = await supabase
        .from('places')
        .select('id, name, cover_image_url, latitude, longitude')
        .in('id', placeIds);

      if (placesError) {
        console.error('[PlaceStories] Error fetching places:', placesError);
      }

      // Get user's viewed stories (if logged in)
      let viewedStoryIds = new Set<string>();
      if (user?.id) {
        const { data: views } = await supabase
          .from('place_story_views')
          .select('story_id')
          .eq('user_id', user.id);
        
        if (views) {
          viewedStoryIds = new Set(views.map((v: any) => v.story_id));
        }
      }

      // Build places with stories data
      const placesMap = new Map<string, PlaceWithStories>();
      
      stories.forEach((story: any) => {
        const place = places?.find((p: any) => p.id === story.place_id);
        if (!place) return;

        // Calculate distance if we have user location
        let distance = 0;
        if (userLocation && place.latitude && place.longitude) {
          distance = calculateDistanceMiles(
            userLocation[1], userLocation[0],
            Number(place.latitude), Number(place.longitude)
          );
          // Filter by 20 miles
          if (distance > 20) return;
        }

        const existing = placesMap.get(story.place_id);
        const isUnviewed = !viewedStoryIds.has(story.id);

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
          });
        }
      });

      // Convert to array and limit
      const result = Array.from(placesMap.values()).slice(0, maxPlaces);
      console.log('[PlaceStories] Places with stories:', result.length);
      setPlacesWithStories(result);

    } catch (err: any) {
      console.error('[PlaceStories] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userLocation, user?.id, maxPlaces]);

  useEffect(() => {
    fetchPlacesWithStories();
  }, [fetchPlacesWithStories]);

  // Handle story press - fetch all stories for the place
  const handleStoryPress = async (placeId: string) => {
    if (!onStoryPress) return;

    const now = new Date().toISOString();
    const { data: stories } = await supabase
      .from('place_stories')
      .select('*')
      .eq('place_id', placeId)
      .eq('status', 'active')
      .or(`expires_at.gt.${now},is_permanent.eq.true`)
      .order('created_at', { ascending: true });

    if (stories && stories.length > 0) {
      const place = placesWithStories.find(p => p.placeId === placeId);
      const formattedStories: Story[] = stories.map((s: any) => ({
        id: s.id,
        placeId: s.place_id,
        placeName: place?.placeName || 'Unknown Place',
        placeImage: place?.placeImage || null,
        userId: s.user_id,
        mediaUrl: s.media_url,
        mediaType: s.media_type || 'image',
        caption: s.caption,
        thumbnailUrl: s.thumbnail_url,
        createdAt: s.created_at,
        expiresAt: s.expires_at,
      }));
      onStoryPress(placeId, formattedStories);
    }
  };

  // Render single story avatar
  const renderStoryAvatar = (place: PlaceWithStories) => {
    const ringColors = place.hasUnviewedStories
      ? COLORS.storyRingActive
      : COLORS.storyRingViewed;

    return (
      <TouchableOpacity
        key={place.placeId}
        style={styles.storyItem}
        onPress={() => handleStoryPress(place.placeId)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={ringColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.storyRing}
        >
          <View style={[styles.storyAvatarContainer, isDark && styles.storyAvatarContainerDark]}>
            {place.placeImage ? (
              <Image
                source={{ uri: place.placeImage }}
                style={styles.storyAvatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.storyAvatarPlaceholder, isDark && styles.storyAvatarPlaceholderDark]}>
                <Ionicons
                  name="storefront"
                  size={28}
                  color={isDark ? COLORS.textSecondaryDark : COLORS.textSecondary}
                />
              </View>
            )}
          </View>
        </LinearGradient>
        <Text
          style={[styles.storyName, isDark && styles.storyNameDark]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {place.placeName}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render "Your Story" add button
  const renderAddStoryButton = () => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={onAddStoryPress}
      activeOpacity={0.7}
    >
      <View style={[styles.addStoryContainer, isDark && styles.addStoryContainerDark]}>
        <View style={[styles.storyAvatarContainer, isDark && styles.storyAvatarContainerDark]}>
          <View style={[styles.addStoryAvatar, isDark && styles.addStoryAvatarDark]}>
            <Ionicons
              name="add"
              size={32}
              color={COLORS.accent}
            />
          </View>
        </View>
        <View style={styles.addStoryBadge}>
          <Ionicons name="add" size={12} color="#FFFFFF" />
        </View>
      </View>
      <Text style={[styles.storyName, isDark && styles.storyNameDark]}>
        Your Story
      </Text>
    </TouchableOpacity>
  );

  // Don't render if no stories and not loading
  if (!loading && placesWithStories.length === 0) {
    // Still show "Your Story" button even if no stories exist
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderAddStoryButton()}
          {/* Empty state placeholder stories */}
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.storyItem}>
              <View style={[styles.emptyStoryRing, isDark && styles.emptyStoryRingDark]}>
                <View style={[styles.emptyStoryAvatar, isDark && styles.emptyStoryAvatarDark]}>
                  <Ionicons
                    name="storefront-outline"
                    size={24}
                    color={isDark ? '#444' : '#DDD'}
                  />
                </View>
              </View>
              <Text style={[styles.storyName, styles.emptyStoryName, isDark && styles.storyNameDark]}>
                No stories
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderAddStoryButton()}
          {placesWithStories.map(renderStoryAvatar)}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  containerDark: {
    backgroundColor: COLORS.backgroundDark,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  loadingContainer: {
    height: STORY_RING_SIZE + 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyItem: {
    alignItems: 'center',
    width: STORY_RING_SIZE + 8,
  },
  storyRing: {
    width: STORY_RING_SIZE,
    height: STORY_RING_SIZE,
    borderRadius: STORY_RING_SIZE / 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatarContainer: {
    width: STORY_AVATAR_SIZE,
    height: STORY_AVATAR_SIZE,
    borderRadius: STORY_AVATAR_SIZE / 2,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  storyAvatarContainerDark: {
    backgroundColor: COLORS.backgroundDark,
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: STORY_AVATAR_SIZE / 2,
  },
  storyAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: STORY_AVATAR_SIZE / 2,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatarPlaceholderDark: {
    backgroundColor: '#2A2A3E',
  },
  storyName: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.text,
    textAlign: 'center',
    width: STORY_RING_SIZE,
  },
  storyNameDark: {
    color: COLORS.textDark,
  },
  addStoryContainer: {
    width: STORY_RING_SIZE,
    height: STORY_RING_SIZE,
    borderRadius: STORY_RING_SIZE / 2,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryContainerDark: {
    borderColor: '#444',
  },
  addStoryAvatar: {
    width: STORY_AVATAR_SIZE - 4,
    height: STORY_AVATAR_SIZE - 4,
    borderRadius: (STORY_AVATAR_SIZE - 4) / 2,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryAvatarDark: {
    backgroundColor: '#2A2A3E',
  },
  addStoryBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  emptyStoryRing: {
    width: STORY_RING_SIZE,
    height: STORY_RING_SIZE,
    borderRadius: STORY_RING_SIZE / 2,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStoryRingDark: {
    borderColor: '#333',
  },
  emptyStoryAvatar: {
    width: STORY_AVATAR_SIZE - 4,
    height: STORY_AVATAR_SIZE - 4,
    borderRadius: (STORY_AVATAR_SIZE - 4) / 2,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStoryAvatarDark: {
    backgroundColor: '#2A2A3E',
  },
  emptyStoryName: {
    color: '#999',
  },
});
