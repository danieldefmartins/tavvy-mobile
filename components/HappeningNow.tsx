// =============================================
// HAPPENING NOW COMPONENT
// =============================================
// Horizontal carousel showing places with high activity scores
// "What's Happening Now" - real-time discovery

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getHappeningNowPlaces } from '../lib/storyService';
import { supabase } from '../lib/supabaseClient';
import { StoryRing, StoryRingState } from './StoryRing';
import { trackDiscoveryEvent } from '../lib/analyticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;

interface HappeningPlace {
  place_id: string;
  happening_score: number;
  last_activity_at: string;
  // Joined place data
  name?: string;
  category?: string;
  cover_image_url?: string;
  city?: string;
  story_ring_state?: StoryRingState;
  story_count?: number;
}

interface HappeningNowProps {
  onPlacePress?: (placeId: string) => void;
  onStoryPress?: (placeId: string) => void;
}

export const HappeningNow: React.FC<HappeningNowProps> = ({
  onPlacePress,
  onStoryPress,
}) => {
  const [places, setPlaces] = useState<HappeningPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    loadHappeningPlaces();
  }, []);

  const loadHappeningPlaces = async () => {
    setIsLoading(true);
    try {
      // First try to get places with high happening scores
      let happeningData = await getHappeningNowPlaces(10, 25);
      
      // If no happening scores, fall back to places with recent stories
      if (happeningData.length === 0) {
        happeningData = await getPlacesWithRecentActivity();
      }
      
      if (happeningData.length === 0) {
        // Final fallback: get places with recent reviews
        happeningData = await getPlacesWithRecentReviews();
      }

      if (happeningData.length === 0) {
        setPlaces([]);
        return;
      }

      // Fetch place details for each
      const placeIds = happeningData.map(h => h.place_id);
      const { data: placeDetails } = await supabase
        .from('fsq_places_raw')
        .select('fsq_id, name, category, cover_image_url, city')
        .in('fsq_id', placeIds);

      // Merge data
      const mergedPlaces = happeningData.map(h => {
        const details = placeDetails?.find(p => p.fsq_id === h.place_id);
        return {
          ...h,
          name: details?.name || 'Unknown Place',
          category: extractCategory(details?.category),
          cover_image_url: details?.cover_image_url,
          city: details?.city,
          story_ring_state: (h as any).story_count > 0 ? 'unseen' as StoryRingState : 'none' as StoryRingState,
        };
      });

      setPlaces(mergedPlaces);
    } catch (error) {
      console.error('Error loading happening places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: Get places with recent stories
  const getPlacesWithRecentActivity = async (): Promise<HappeningPlace[]> => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('place_stories')
        .select('place_id, created_at')
        .eq('status', 'active')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by place and count stories
      const placeMap = new Map<string, { count: number; lastActivity: string }>();
      data?.forEach(story => {
        const existing = placeMap.get(story.place_id);
        if (!existing) {
          placeMap.set(story.place_id, { count: 1, lastActivity: story.created_at });
        } else {
          existing.count++;
        }
      });

      // Convert to HappeningPlace format
      return Array.from(placeMap.entries())
        .map(([place_id, { count, lastActivity }]) => ({
          place_id,
          happening_score: count * 10, // Simple score based on story count
          last_activity_at: lastActivity,
          story_count: count,
        }))
        .sort((a, b) => b.happening_score - a.happening_score)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting places with recent activity:', error);
      return [];
    }
  };

  // Final fallback: Get places with recent reviews
  const getPlacesWithRecentReviews = async (): Promise<HappeningPlace[]> => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('place_reviews')
        .select('place_id, created_at')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group by place and count reviews
      const placeMap = new Map<string, { count: number; lastActivity: string }>();
      data?.forEach(review => {
        const existing = placeMap.get(review.place_id);
        if (!existing) {
          placeMap.set(review.place_id, { count: 1, lastActivity: review.created_at });
        } else {
          existing.count++;
        }
      });

      // Convert to HappeningPlace format
      return Array.from(placeMap.entries())
        .map(([place_id, { count, lastActivity }]) => ({
          place_id,
          happening_score: count * 5, // Lower score for reviews
          last_activity_at: lastActivity,
          story_count: 0,
        }))
        .sort((a, b) => b.happening_score - a.happening_score)
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting places with recent reviews:', error);
      return [];
    }
  };

  const extractCategory = (category?: string): string => {
    if (!category) return 'Place';
    // Extract the last part of hierarchical category
    const parts = category.split('>');
    return parts[parts.length - 1]?.trim() || 'Place';
  };

  const formatActivityTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getActivityLevel = (score: number): { label: string; color: string } => {
    if (score >= 100) return { label: '🔥 Very Active', color: '#EF4444' };
    if (score >= 50) return { label: '⚡ Active', color: '#F59E0B' };
    if (score >= 20) return { label: '✨ Buzzing', color: '#10B981' };
    return { label: '📍 Recent', color: '#3B82F6' };
  };

  const handlePlacePress = async (place: HappeningPlace) => {
    // Track the tap event
    try {
      await trackDiscoveryEvent('happening_now_tap', {
        place_id: place.place_id,
        place_name: place.name,
        happening_score: place.happening_score,
      });
    } catch (error) {
      console.error('Error tracking happening now tap:', error);
    }

    if (onPlacePress) {
      onPlacePress(place.place_id);
    } else {
      (navigation as any).navigate('PlaceDetails', { placeId: place.place_id });
    }
  };

  const handleStoryPress = async (place: HappeningPlace) => {
    // Track the tap event
    try {
      await trackDiscoveryEvent('story_ring_tap', {
        place_id: place.place_id,
        place_name: place.name,
        source: 'happening_now',
      });
    } catch (error) {
      console.error('Error tracking story ring tap:', error);
    }

    if (onStoryPress) {
      onStoryPress(place.place_id);
    } else {
      // Navigate to story viewer for this place
      (navigation as any).navigate('PlaceDetails', { 
        placeId: place.place_id,
        openStories: true,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  if (places.length === 0) {
    return null; // Don't show section if no happening places
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🎯 What's Happening Now</Text>
          <Text style={styles.subtitle}>Places with recent activity</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadHappeningPlaces}>
          <Ionicons name="refresh" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      >
        {places.map((place, index) => {
          const activity = getActivityLevel(place.happening_score);
          
          return (
            <TouchableOpacity
              key={place.place_id}
              style={styles.card}
              onPress={() => handlePlacePress(place)}
              activeOpacity={0.9}
            >
              {/* Background Image */}
              <View style={styles.imageContainer}>
                {place.cover_image_url ? (
                  <Image
                    source={{ uri: place.cover_image_url }}
                    style={styles.backgroundImage}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Ionicons name="business" size={40} color="#9CA3AF" />
                  </View>
                )}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.gradient}
                />
              </View>

              {/* Activity Badge */}
              <View style={[styles.activityBadge, { backgroundColor: activity.color }]}>
                <Text style={styles.activityText}>{activity.label}</Text>
              </View>

              {/* Story Ring (if has stories) */}
              {place.story_ring_state !== 'none' && (
                <TouchableOpacity
                  style={styles.storyRingContainer}
                  onPress={() => handleStoryPress(place)}
                >
                  <StoryRing
                    imageUrl={place.cover_image_url}
                    size={48}
                    state={place.story_ring_state || 'none'}
                  />
                </TouchableOpacity>
              )}

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.placeName} numberOfLines={1}>
                  {place.name}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.category}>{place.category}</Text>
                  {place.city && (
                    <>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.city}>{place.city}</Text>
                    </>
                  )}
                </View>
                <Text style={styles.lastActivity}>
                  Last activity: {formatActivityTime(place.last_activity_at)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  activityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  storyRingContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  placeName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'left',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  dot: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 6,
  },
  city: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  lastActivity: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
});

export default HappeningNow;
