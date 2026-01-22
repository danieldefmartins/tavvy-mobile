// =============================================
// QUICK FIND RESULTS SCREEN
// =============================================
// Shows places matching the selected Quick Find preset tags

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { useThemeContext } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RouteParams {
  tags: string[];
  label: string;
  icon: string;
}

interface Place {
  fsq_id: string;
  name: string;
  category: string;
  cover_image_url?: string;
  city?: string;
  state_region?: string;
  address_line1?: string;
  story_count?: number;
}

export default function QuickFindResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { tags, label, icon } = (route.params as RouteParams) || { tags: [], label: 'Results', icon: '🔍' };
  const { theme, isDark } = useThemeContext();

  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlaces();
  }, [tags]);

  const loadPlaces = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, find places with stories that have matching tags
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: storiesData, error: storiesError } = await supabase
        .from('place_stories')
        .select('place_id')
        .eq('status', 'active')
        .gte('created_at', thirtyDaysAgo)
        .overlaps('tags', tags);

      if (storiesError) throw storiesError;

      // Count stories per place
      const placeCounts = new Map<string, number>();
      storiesData?.forEach(story => {
        const count = placeCounts.get(story.place_id) || 0;
        placeCounts.set(story.place_id, count + 1);
      });

      const placeIds = Array.from(placeCounts.keys());

      if (placeIds.length === 0) {
        // If no places with matching story tags, search by category/name
        const { data: fallbackPlaces, error: fallbackError } = await supabase
          .from('fsq_places_raw')
          .select('fsq_id, name, category, cover_image_url, city, state_region, address_line1')
          .or(tags.map(tag => `name.ilike.%${tag}%,category.ilike.%${tag}%`).join(','))
          .limit(20);

        if (fallbackError) throw fallbackError;
        
        setPlaces(fallbackPlaces?.map(p => ({ ...p, story_count: 0 })) || []);
        return;
      }

      // Fetch place details
      const { data: placeDetails, error: placeError } = await supabase
        .from('fsq_places_raw')
        .select('fsq_id, name, category, cover_image_url, city, state_region, address_line1')
        .in('fsq_id', placeIds);

      if (placeError) throw placeError;

      // Merge with story counts and sort by count
      const mergedPlaces = placeDetails?.map(place => ({
        ...place,
        story_count: placeCounts.get(place.fsq_id) || 0,
      })).sort((a, b) => (b.story_count || 0) - (a.story_count || 0)) || [];

      setPlaces(mergedPlaces);
    } catch (err) {
      console.error('Error loading quick find places:', err);
      setError('Failed to load places. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlacePress = (place: Place) => {
    (navigation as any).navigate('PlaceDetails', { placeId: place.fsq_id });
  };

  const extractCategory = (category?: string): string => {
    if (!category) return 'Place';
    const parts = category.split('>');
    return parts[parts.length - 1]?.trim() || 'Place';
  };

  const renderPlace = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={[styles.placeCard, { backgroundColor: isDark ? theme.cardBackground : '#fff' }]}
      onPress={() => handlePlacePress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {item.cover_image_url ? (
          <Image source={{ uri: item.cover_image_url }} style={styles.placeImage} />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
            <Ionicons name="business" size={32} color={isDark ? '#6B7280' : '#9CA3AF'} />
          </View>
        )}
        {(item.story_count || 0) > 0 && (
          <View style={styles.storyBadge}>
            <Ionicons name="videocam" size={12} color="#fff" />
            <Text style={styles.storyCount}>{item.story_count}</Text>
          </View>
        )}
      </View>
      <View style={styles.placeInfo}>
        <Text style={[styles.placeName, { color: isDark ? theme.text : '#1F2937' }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.placeCategory, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
          {extractCategory(item.category)}
        </Text>
        {item.city && (
          <Text style={[styles.placeLocation, { color: isDark ? theme.textSecondary : '#9CA3AF' }]} numberOfLines={1}>
            {item.city}{item.state_region ? `, ${item.state_region}` : ''}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={isDark ? theme.textSecondary : '#9CA3AF'} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? theme.background : '#F9FAFB' }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? theme.cardBackground : '#fff' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? theme.text : '#1F2937'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>{icon}</Text>
          <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#1F2937' }]}>{label}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={[styles.tag, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
            <Text style={[styles.tagText, { color: isDark ? theme.text : '#374151' }]}>#{tag}</Text>
          </View>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[styles.loadingText, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
            Finding places...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={[styles.errorText, { color: isDark ? theme.text : '#1F2937' }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPlaces}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : places.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color={isDark ? '#6B7280' : '#9CA3AF'} />
          <Text style={[styles.emptyTitle, { color: isDark ? theme.text : '#1F2937' }]}>
            No places found
          </Text>
          <Text style={[styles.emptyText, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
            We couldn't find any places matching "{label}". Try a different search.
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          renderItem={renderPlace}
          keyExtractor={(item) => item.fsq_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  storyCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  placeInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeCategory: {
    fontSize: 13,
  },
  placeLocation: {
    fontSize: 12,
  },
});
