// =============================================
// STORIES ROW COMPONENT
// =============================================
// Horizontal scrollable row of place story avatars
// Similar to Instagram/Facebook stories at the top

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

interface PlaceWithStories {
  place_id: string;
  name: string;
  cover_image_url?: string;
  category?: string;
  story_count: number;
  ring_state: StoryRingState;
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
  const [places, setPlaces] = useState<PlaceWithStories[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithStories | null>(null);
  const [selectedStories, setSelectedStories] = useState<PlaceStory[]>([]);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  useEffect(() => {
    loadPlacesWithStories();
  }, [userLocation, currentUserId]);

  const loadPlacesWithStories = async () => {
    setIsLoading(true);
    try {
      // Get places that have active stories
      const { data: storiesData, error } = await supabase
        .from('place_stories')
        .select('place_id')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!storiesData || storiesData.length === 0) {
        setPlaces([]);
        return;
      }

      // Count stories per place and get unique place IDs
      const storyCountMap = new Map<string, number>();
      storiesData.forEach(s => {
        const count = storyCountMap.get(s.place_id) || 0;
        storyCountMap.set(s.place_id, count + 1);
      });

      const placeIds = Array.from(storyCountMap.keys());

      // Fetch place details from the canonical places table
      const { data: placeDetails } = await supabase
        .from('places')
        .select('id, name, cover_image_url, tavvy_category, latitude, longitude')
        .in('id', placeIds);

      // Get story ring states
      const ringStates = await getStoryRingStates(placeIds, currentUserId);

      // Filter by distance if user location is available
      let filteredPlaces = placeDetails || [];
      if (userLocation) {
        filteredPlaces = filteredPlaces.filter(place => {
          if (!place.latitude || !place.longitude) return true;
          const distance = calculateDistance(
            userLocation[1], userLocation[0],
            place.latitude, place.longitude
          );
          return distance <= maxDistance;
        });
      }

      // Build final list sorted by unseen first, then by story count
      const placesWithStories: PlaceWithStories[] = filteredPlaces.map(place => ({
        place_id: place.id,
        name: place.name,
        cover_image_url: place.cover_image_url,
        category: extractCategory(place.tavvy_category),
        story_count: storyCountMap.get(place.id) || 0,
        ring_state: ringStates.get(place.id) || 'unseen',
      }));

      // Sort: unseen first, then by story count
      placesWithStories.sort((a, b) => {
        if (a.ring_state === 'unseen' && b.ring_state !== 'unseen') return -1;
        if (a.ring_state !== 'unseen' && b.ring_state === 'unseen') return 1;
        return b.story_count - a.story_count;
      });

      setPlaces(placesWithStories.slice(0, 20)); // Limit to 20 places
    } catch (error) {
      console.error('Error loading places with stories:', error);
    } finally {
      setIsLoading(false);
    }
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
    // Load stories for this place
    const stories = await getPlaceStories(place.place_id, currentUserId);
    if (stories.length > 0) {
      setSelectedPlace(place);
      setSelectedStories(stories);
      setIsViewerVisible(true);
    }
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
    loadPlacesWithStories();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  if (places.length === 0 && !onAddStoryPress) {
    return null; // Don't show if no stories and no add button
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Story Button (if logged in) */}
        {onAddStoryPress && (
          <TouchableOpacity style={styles.addStoryButton} onPress={onAddStoryPress}>
            <View style={styles.addStoryCircle}>
              <Ionicons name="add" size={28} color="#3B82F6" />
            </View>
            <Text style={styles.addStoryLabel}>Add Story</Text>
          </TouchableOpacity>
        )}

        {/* Place Story Avatars */}
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
