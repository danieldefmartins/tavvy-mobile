import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { useThemeContext } from '../contexts/ThemeContext';
import type { ParamListBase as DynamicStackParams } from '@react-navigation/native';
import type { NativeStackNavigationProp as DynamicStackNavigation } from '@react-navigation/native-stack';
// =============================================
// STORIES ROW COMPONENT
// =============================================
// Horizontal scrollable row of place story avatars
// Similar to Instagram/Facebook stories at the top
// Shows nearby places even without active stories

import {CONTENT_SAFETY_CHANGED} from './ContentSafetyActions';
import {DeviceEventEmitter} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
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
  universeId?: string;
  currentUserId?: string;
  userLocation?: [number, number];
  maxDistance?: number; // in miles
  onAddStoryPress?: () => void;
}

export const StoriesRow: React.FC<StoriesRowProps> = ({
  currentUserId,
  universeId,
  userLocation,
  maxDistance = 20,
  onAddStoryPress,
}) => {
  const copy = useReleaseCopy();
  const { theme, isDark } = useThemeContext();
  const navigation = useNavigation<DynamicStackNavigation<DynamicStackParams>>();
  const [safetyVersion,setSafetyVersion]=useState(0);
  useEffect(()=>{const subscription=DeviceEventEmitter.addListener(CONTENT_SAFETY_CHANGED,()=>{setIsViewerVisible(false);setSelectedStories([]);setSafetyVersion(v=>v+1)});return()=>subscription.remove()},[]);
  const [places, setPlaces] = useState<PlaceWithStories[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<PlaceWithStories | null>(null);
  const [selectedStories, setSelectedStories] = useState<PlaceStory[]>([]);
  const [isViewerVisible, setIsViewerVisible] = useState(false);

  const scopeKey = JSON.stringify([universeId || null, currentUserId || null, userLocation || null, maxDistance, safetyVersion]);
  const scopeRef = useRef(scopeKey), loadGeneration = useRef(0);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  if (scopeRef.current !== scopeKey) { scopeRef.current = scopeKey; loadGeneration.current += 1; }
  useEffect(() => {
    setIsViewerVisible(false); setSelectedPlace(null); setSelectedStories([]);
    void loadNearbyPlaces();
    return () => { loadGeneration.current += 1; };
  }, [scopeKey]);

  const loadNearbyPlaces = async () => {
    if (scopeRef.current !== scopeKey) return;
    const generation = ++loadGeneration.current;
    const isCurrent = () => generation === loadGeneration.current && scopeRef.current === scopeKey;
    const commitPlaces = (next: PlaceWithStories[]) => { if (isCurrent()) { setPlaces(next); setLoadedScope(scopeKey); } };
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

      // Universe pages must show stories for their linked places only.
      if (universeId) {
        const { data: links, error: linksError } = await supabase
          .from('atlas_universe_places').select('place_id').eq('universe_id', universeId);
        if (linksError) throw linksError;
        if (!isCurrent()) return;
        if (!links?.length) { commitPlaces([]); return; }
        placesQuery = placesQuery.in('id', links.map(link => link.place_id));
      }

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

      if (!isCurrent()) return;
      if (!nearbyPlaces || nearbyPlaces.length === 0) {
        // An empty Universe stays empty; the discovery fallback is unscoped only.
        if (universeId) { commitPlaces([]); return; }
        // Fallback: fetch any places if no nearby ones found
        const { data: fallbackPlaces } = await supabase
          .from('places')
          .select('id, name, cover_image_url, tavvy_category, latitude, longitude')
          .eq('is_active', true)
          .not('cover_image_url', 'is', null)
          .limit(20);

        if (fallbackPlaces && fallbackPlaces.length > 0) {
          const placesWithStories = buildPlacesList(fallbackPlaces, storyCountMap, placeIdsWithStories, new Map());
          commitPlaces(placesWithStories);
        } else {
          commitPlaces([]);
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
          if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) return false;
          const distance = calculateDistance(
            userLocation[1], userLocation[0],
            place.latitude, place.longitude
          );
          return distance <= maxDistance;
        });
      }

      const placesWithStories = buildPlacesList(filteredPlaces, storyCountMap, placeIdsWithStories, ringStates);
      commitPlaces(placesWithStories);

    } catch (error) {
      console.error('[StoriesRow] Error loading places:', error);
      commitPlaces([]);
    } finally {
      if (isCurrent()) setIsLoading(false);
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
    const generation = loadGeneration.current;
    const isCurrent = () => generation === loadGeneration.current && scopeRef.current === scopeKey;
    if (!isCurrent()) return;
    if (place.has_stories && place.story_count > 0) {
      // Load and show stories
      const stories = await getPlaceStories(place.place_id, currentUserId);
      if (!isCurrent()) return;
      if (stories.length > 0) {
        setSelectedPlace(place);
        setSelectedStories(stories);
        setIsViewerVisible(true);
        return;
      }
    }
    
    // No stories - navigate to place details
    navigation.navigate('PlaceDetails', { placeId: place.place_id });
  };

  const handleStoryViewed = (storyId: string) => {
    if (scopeRef.current !== scopeKey) return;
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
    if (scopeRef.current !== scopeKey) return;
    setIsViewerVisible(false);
    setSelectedPlace(null);
    setSelectedStories([]);
    // Refresh to update ring states
    loadNearbyPlaces();
  };

  if (isLoading || loadedScope !== scopeKey) {
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
        <Ionicons name="sparkles-outline" size={28} color="#06B6D4" style={{ marginBottom: 8 }} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>{copy('Stories are coming soon')}</Text>
        <Text style={[styles.emptyText, { color: isDark ? '#BDB6CA' : '#56576B' }]}>
          {copy('Great stories about your favorite places are about to go live. Stay tuned!')}
        </Text>
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
            <Text style={[styles.addStoryLabel, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>Your Story</Text>
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
    paddingVertical: 24,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
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
