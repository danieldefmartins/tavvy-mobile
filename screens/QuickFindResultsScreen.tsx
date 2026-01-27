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
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RouteParams {
  tags: string[];
  label: string;
  icon: string;
}

interface Place {
  fsq_place_id: string;
  name: string;
  fsq_category_labels?: string;
  locality?: string;
  region?: string;
  address?: string;
  story_count?: number;
}

export default function QuickFindResultsScreen() {
  const { t } = useTranslation();
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
          .select('fsq_place_id, name, fsq_category_labels, locality, region, address')
          .or(tags.map(tag => `name.ilike.%${tag}%,fsq_category_labels.ilike.%${tag}%`).join(','))
          .limit(20);

        if (fallbackError) throw fallbackError;
        
        setPlaces(fallbackPlaces?.map(p => ({ ...p, story_count: 0 })) || []);
        return;
      }

      // Fetch place details
      const { data: placeDetails, error: placeError } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, fsq_category_labels, locality, region, address')
        .in('fsq_place_id', placeIds);

      if (placeError) throw placeError;

      // Merge with story counts and sort by count
      const mergedPlaces = placeDetails?.map(place => ({
        ...place,
        story_count: placeCounts.get(place.fsq_place_id) || 0,
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
    (navigation as any).navigate('PlaceDetails', { placeId: place.fsq_place_id });
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
        {false ? (
          <Image source={{ uri: '' }} style={styles.placeImage} />
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
          {extractCategory(item.fsq_category_labels)}
        </Text>
        {item.locality && (
          <Text style={[styles.placeLocation, { color: isDark ? theme.textSecondary : '#9CA3AF' }]} numberOfLines={1}>
            {item.locality}{item.region ? `, ${item.region}` : ''}
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
          {/* Encouraging Growth Message */}
          <View style={styles.emptyIconContainer}>
            <LinearGradient
              colors={['#F59E0B', '#FBBF24']}
              style={styles.emptyIconGradient}
            >
              <Ionicons name="rocket" size={40} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={[styles.emptyTitle, { color: isDark ? theme.text : '#1F2937' }]}>
            We're Building Something Amazing!
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
            Perfect "{label}" recommendations coming soon
          </Text>
          <View style={[styles.emptyCard, { backgroundColor: isDark ? theme.cardBackground : '#fff' }]}>
            <View style={styles.emptyCardRow}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
              <View style={styles.emptyCardText}>
                <Text style={[styles.emptyCardTitle, { color: isDark ? theme.text : '#1F2937' }]}>
                  Growing Fast
                </Text>
                <Text style={[styles.emptyCardDesc, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
                  Thousands of new users are joining daily, adding reviews and stories
                </Text>
              </View>
            </View>
            <View style={styles.emptyCardDivider} />
            <View style={styles.emptyCardRow}>
              <Ionicons name="sparkles" size={24} color="#8B5CF6" />
              <View style={styles.emptyCardText}>
                <Text style={[styles.emptyCardTitle, { color: isDark ? theme.text : '#1F2937' }]}>
                  Personalized For You
                </Text>
                <Text style={[styles.emptyCardDesc, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
                  We need more data to recommend the perfect places just for you
                </Text>
              </View>
            </View>
            <View style={styles.emptyCardDivider} />
            <View style={styles.emptyCardRow}>
              <Ionicons name="calendar" size={24} color="#3B82F6" />
              <View style={styles.emptyCardText}>
                <Text style={[styles.emptyCardTitle, { color: isDark ? theme.text : '#1F2937' }]}>
                  Check Back Soon
                </Text>
                <Text style={[styles.emptyCardDesc, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
                  Come back in 2-3 weeks for amazing personalized recommendations!
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.exploreButtonGradient}
            >
              <Text style={styles.exploreButtonText}>Explore Other Features</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={places}
          renderItem={renderPlace}
          keyExtractor={(item) => item.fsq_place_id}
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
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyIconContainer: {
    marginBottom: 8,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyCard: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  emptyCardText: {
    flex: 1,
    gap: 2,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyCardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyCardDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  exploreButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  exploreButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
