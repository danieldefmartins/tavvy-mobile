// =============================================
// STORIES ROW COMPONENT
// =============================================
// Horizontal scrollable row of place story avatars
// Similar to Instagram/Facebook stories at the top
// Shows nearby places even without active stories

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { getStoryRingStates, getPlaceStories, PlaceStory } from '../lib/storyService';
import { StoryRing, StoryRingState } from './StoryRing';
import { StoryViewer } from './StoryViewer';
import { useNavigation } from '@react-navigation/native';

interface PlaceWithStories {
  place_id: string;
  name: string;
  cover_image_url?: string;
  category?: string;
  story_count: number;
  ring_state: StoryRingState;
  has_stories: boolean;
}

interface StoriesRowProps {
  currentUserId?: string;
  userLocation?: [number, number];
  maxDistance?: number; // in miles
  onAddStoryPress?: () => void;
}

export const StoriesRow: React.FC<StoriesRowProps> = ({
  currentUserId,
  userLocation,
  maxDistance = 20,
  onAddStoryPress,
}) => {
  const navigation = useNavigation();
  const [places, setPlaces] = useState<PlaceWithStories[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithStories | null>(null);
  const [selectedStories, setSelectedStories] = useState<PlaceStory[]>([]);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  useEffect(() => {
    loadNearbyPlaces();
  }, [userLocation, currentUserId]);

  const loadNearbyPlaces = async () => {
    setIsLoading(true);
    try {
      // First, get places that have active stories
      const { data: storiesData } = await supabase
        .from('place_stories')
        .select('place_id')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Count stories per place
      const storyCountMap = new Map<string, number>();
      if (storiesData) {
        storiesData.forEach(s => {
          const count = storyCountMap.get(s.place_id) || 0;
          storyCountMap.set(s.place_id, count + 1);
        });
      }

      const placeIdsWithStories = Array.from(storyCountMap.keys());

      // Build query for nearby places
      let placesQuery = supabase
        .from('places')
        .select('id, name, cover_image_url, tavvy_category, latitude, longitude')
        .eq('is_active', true)
        .limit(50);

      // Add geo-bounding box filter if user location is available
      if (userLocation) {
        const DEGREES_PER_MILE = 0.0145;
        const boxSize = maxDistance * DEGREES_PER_MILE;
        const userLat = userLocation[1];
        const userLng = userLocation[0];

        placesQuery = placesQuery
          .gte('latitude', userLat - boxSize)
          .lte('latitude', userLat + boxSize)
          .gte('longitude', userLng - boxSize)
          .lte('longitude', userLng + boxSize);
      }

      const { data: nearbyPlaces, error } = await placesQuery;

      if (error) {
        console.error('[StoriesRow] Error fetching nearby places:', error);
        throw error;
      }

      if (!nearbyPlaces || nearbyPlaces.length === 0) {
        // Fallback: fetch any places if no nearby ones found
        const { data: fallbackPlaces } = await supabase
          .from('places')
          .select('id, name, cover_image_url, tavvy_category, latitude, longitude')
          .eq('is_active', true)
          .not('cover_image_url', 'is', null)
          .limit(20);

        if (fallbackPlaces && fallbackPlaces.length > 0) {
          const placesWithStories = buildPlacesList(fallbackPlaces, storyCountMap, placeIdsWithStories, new Map());
          setPlaces(placesWithStories);
        } else {
          setPlaces([]);
        }
        return;
      }

      // Get story ring states for places that have stories
      const ringStates = placeIdsWithStories.length > 0 
        ? await getStoryRingStates(placeIdsWithStories, currentUserId)
        : new Map<string, StoryRingState>();

      // Filter by exact distance if user location is available
      let filteredPlaces = nearbyPlaces;
      if (userLocation) {
        filteredPlaces = nearbyPlaces.filter(place => {
          if (!place.latitude || !place.longitude) return false;
          const distance = calculateDistance(
            userLocation[1], userLocation[0],
            place.latitude, place.longitude
          );
          return distance <= maxDistance;
        });
      }

      const placesWithStories = buildPlacesList(filteredPlaces, storyCountMap, placeIdsWithStories, ringStates);
      setPlaces(placesWithStories);

    } catch (error) {
      console.error('[StoriesRow] Error loading places:', error);
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildPlacesList = (
    placesData: any[],
    storyCountMap: Map<string, number>,
    placeIdsWithStories: string[],
    ringStates: Map<string, StoryRingState>
  ): PlaceWithStories[] => {
    const placesWithStories: PlaceWithStories[] = placesData.map(place => {
      const hasStories = placeIdsWithStories.includes(place.id);
      return {
        place_id: place.id,
        name: place.name,
        cover_image_url: place.cover_image_url,
        category: extractCategory(place.tavvy_category),
        story_count: storyCountMap.get(place.id) || 0,
        ring_state: hasStories ? (ringStates.get(place.id) || 'unseen') : 'none',
        has_stories: hasStories,
      };
    });

    // Sort: places with unseen stories first, then seen stories, then no stories
    placesWithStories.sort((a, b) => {
      // Unseen stories first
      if (a.ring_state === 'unseen' && b.ring_state !== 'unseen') return -1;
      if (a.ring_state !== 'unseen' && b.ring_state === 'unseen') return 1;
      // Then seen stories
      if (a.ring_state === 'seen' && b.ring_state === 'none') return -1;
      if (a.ring_state === 'none' && b.ring_state === 'seen') return 1;
      // Then by story count
      return b.story_count - a.story_count;
    });

    return placesWithStories.slice(0, 20); // Limit to 20 places
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const extractCategory = (category?: string): string => {
    if (!category) return '';
    const parts = category.split('>');
    return parts[parts.length - 1]?.trim() || '';
  };

  const handlePlacePress = async (place: PlaceWithStories) => {
    if (place.has_stories && place.story_count > 0) {
      // Load and show stories
      const stories = await getPlaceStories(place.place_id, currentUserId);
      if (stories.length > 0) {
        setSelectedPlace(place);
        setSelectedStories(stories);
        setIsViewerVisible(true);
        return;
      }
    }
    
    // No stories - navigate to place details
    navigation.navigate('PlaceDetails' as never, { placeId: place.place_id } as never);
  };

  const handleStoryViewed = (storyId: string) => {
    // Update the ring state for the place
    setPlaces(prev => prev.map(p => {
      if (p.place_id === selectedPlace?.place_id) {
        // Check if all stories are now viewed
        const allViewed = selectedStories.every(s => s.id === storyId || s.viewed);
        return { ...p, ring_state: allViewed ? 'seen' : p.ring_state };
      }
      return p;
    }));
  };

  const handleViewerClose = () => {
    setIsViewerVisible(false);
    setSelectedPlace(null);
    setSelectedStories([]);
    // Refresh to update ring states
    loadNearbyPlaces();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  // Always show the row, even if no places (will show Add Story button if available)
  if (places.length === 0 && !onAddStoryPress) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Discovering nearby places...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Story Button (if callback provided) */}
        {onAddStoryPress && (
          <TouchableOpacity style={styles.addStoryButton} onPress={onAddStoryPress}>
            <View style={styles.addStoryCircle}>
              <Ionicons name="add" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.addStoryLabel}>Your Story</Text>
          </TouchableOpacity>
        )}

        {/* Place Avatars */}
        {places.map((place) => (
          <StoryRing
            key={place.place_id}
            imageUrl={place.cover_image_url}
            placeName={place.name}
            size={64}
            state={place.ring_state}
            onPress={() => handlePlacePress(place)}
            showLabel
          />
        ))}
      </ScrollView>

      {/* Story Viewer Modal */}
      <StoryViewer
        visible={isViewerVisible}
        stories={selectedStories}
        placeName={selectedPlace?.name}
        placeImage={selectedPlace?.cover_image_url}
        currentUserId={currentUserId}
        onClose={handleViewerClose}
        onStoryViewed={handleStoryViewed}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  loadingContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  addStoryButton: {
    alignItems: 'center',
    width: 80,
  },
  addStoryCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addStoryLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '500',
  },
});

export default StoriesRow;
