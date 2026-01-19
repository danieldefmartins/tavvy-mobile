// ============================================================================
// RV & CAMPING BROWSE SCREEN
// ============================================================================
// Browse RV parks, campgrounds, and camping spots with TavvY signals
// Place this file in: screens/RVCampingBrowseScreen.tsx
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// ============================================
// TYPES
// ============================================

interface Place {
  id: string;
  name: string;
  category: string;
  address_line1?: string;
  city?: string;
  state_region?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  signals?: Signal[];
}

interface Signal {
  bucket: string;
  tap_total: number;
}

type SortOption = 'popular' | 'recent' | 'nearby';
type FilterOption = 'all' | 'rv_park' | 'campground' | 'dump_station';

// ============================================
// MAIN COMPONENT
// ============================================

export default function RVCampingBrowseScreen({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { theme, isDark } = useThemeContext();
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [hasMore, setHasMore] = useState(true);

  // Categories to filter for RV/camping
  const RV_CATEGORIES: Record<FilterOption, string[]> = {
    all: ['RV Park', 'Campground', 'Camping', 'Caravan Park', 'Trailer Park', 'Dump Station', 'Propane'],
    rv_park: ['RV Park', 'Caravan Park', 'Trailer Park'],
    campground: ['Campground', 'Camping', 'Camp Site'],
    dump_station: ['Dump Station', 'RV Dump'],
  };

  useEffect(() => {
    loadPlaces();
  }, [sortBy, filterBy]);

  const loadPlaces = async (offset = 0) => {
    try {
      if (offset === 0) setLoading(true);

      // Query places with RV-related categories from fsq_places_raw
      const { data: placesData, error } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, latitude, longitude, address, locality, region, fsq_category_labels')
        .is('date_closed', null)
        .limit(100);

      if (error) {
        console.error('Error loading RV places:', error);
        setPlaces([]);
        return;
      }

      if (placesData) {
        const categoriesToMatch = RV_CATEGORIES[filterBy];
        
        // Filter for RV-related categories
        const filteredPlaces = placesData.filter(p => {
          if (!p.fsq_category_labels) return false;
          const labels = Array.isArray(p.fsq_category_labels) 
            ? p.fsq_category_labels.join(' ').toLowerCase() 
            : '';
          return categoriesToMatch.some(cat => labels.includes(cat.toLowerCase()));
        }).map(p => ({
          id: p.fsq_place_id,
          name: p.name,
          category: extractCategory(p.fsq_category_labels),
          address_line1: p.address,
          city: p.locality,
          state_region: p.region,
          latitude: p.latitude,
          longitude: p.longitude,
          photos: [],
          signals: [],
        }));

        setPlaces(filteredPlaces);
        setHasMore(filteredPlaces.length === 100);
      } else {
        setPlaces([]);
      }
    } catch (error) {
      console.error('Error loading RV places:', error);
      setPlaces([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const extractCategory = (labels: any): string => {
    if (!labels || !Array.isArray(labels) || labels.length === 0) return 'Campground';
    const fullCategory = labels[0];
    if (typeof fullCategory === 'string') {
      const parts = fullCategory.split('>');
      return parts[parts.length - 1].trim();
    }
    return 'Campground';
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlaces();
  }, [sortBy, filterBy]);

  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetails', { placeId: place.id });
  };

  // Get category-based fallback image
  const getCategoryFallbackImage = (category: string): string => {
    const lowerCategory = (category || '').toLowerCase();
    
    if (lowerCategory.includes('rv') || lowerCategory.includes('caravan') || lowerCategory.includes('trailer')) {
      return 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800';
    }
    if (lowerCategory.includes('dump')) {
      return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800';
    }
    if (lowerCategory.includes('propane')) {
      return 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800';
    }
    return 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800';
  };

  // Signal helpers
  const getSignalType = (bucket: string): 'positive' | 'neutral' | 'negative' => {
    const bucketLower = bucket.toLowerCase();
    if (bucketLower.includes('good') || bucketLower.includes('great') || bucketLower.includes('the good')) {
      return 'positive';
    }
    if (bucketLower.includes('heads') || bucketLower.includes('tight') || bucketLower.includes('difficult')) {
      return 'negative';
    }
    return 'neutral';
  };

  const getSignalColor = (bucket: string) => {
    const type = getSignalType(bucket);
    if (type === 'positive') return '#0A84FF';
    if (type === 'negative') return '#FF9500';
    return '#8E8E93';
  };

  const getEmptySignalText = (bucket: string) => 'Be the first to tap!';

  // Generate display signals with fallbacks
  const getDisplaySignals = (signals: Signal[]): { bucket: string; tap_total: number; isEmpty: boolean }[] => {
    if (!signals || signals.length === 0) {
      return [
        { bucket: 'The Good', tap_total: 0, isEmpty: true },
        { bucket: 'The Vibe', tap_total: 0, isEmpty: true },
        { bucket: 'Heads Up', tap_total: 0, isEmpty: true },
      ];
    }
    return signals.slice(0, 3).map(s => ({ ...s, isEmpty: false }));
  };

  const getFilterLabel = (filter: FilterOption): string => {
    switch (filter) {
      case 'all': return 'All';
      case 'rv_park': return 'RV Parks';
      case 'campground': return 'Campgrounds';
      case 'dump_station': return 'Dump Stations';
      default: return 'All';
    }
  };

  const renderPlaceCard = ({ item: place, index }: { item: Place; index: number }) => {
    const imageUrl = place.photos && place.photos.length > 0 
      ? place.photos[0] 
      : getCategoryFallbackImage(place.category);
    const location = [place.city, place.state_region].filter(Boolean).join(', ') || 'Unknown Location';

    return (
      <TouchableOpacity
        key={`camp-${place.id}-${index}`}
        style={[styles.card, { backgroundColor: isDark ? theme.surface : '#fff' }]}
        onPress={() => handlePlacePress(place)}
        activeOpacity={0.95}
      >
        {/* Image */}
        <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
        
        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>⛺ {place.category}</Text>
        </View>
        
        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: isDark ? theme.text : '#000' }]} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={[styles.cardSubtitle, { color: isDark ? theme.textSecondary : '#666' }]} numberOfLines={1}>
            📍 {location}
          </Text>
          
          {/* Signal Bars */}
          <View style={styles.signalsContainer}>
            {getDisplaySignals(place.signals || []).map((signal, idx) => (
              <View 
                key={`camp-${place.id}-sig-${idx}`} 
                style={[styles.signalBadge, { backgroundColor: getSignalColor(signal.bucket) }]}
              >
                <Ionicons 
                  name={signal.isEmpty ? 'add-circle-outline' : 'thumbs-up'} 
                  size={12} 
                  color="#FFFFFF" 
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.signalText} numberOfLines={1}>
                  {signal.isEmpty ? getEmptySignalText(signal.bucket) : signal.bucket}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? theme.background : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? theme.text : '#000'} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#000' }]}>🏕️ RV & Camping</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
            Campgrounds and RV parks with real traveler insights
          </Text>
        </View>
      </View>

      {/* Filter Options */}
      <View style={[styles.filterContainer, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'rv_park', 'campground', 'dump_station'] as FilterOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterButton,
                filterBy === option && styles.filterButtonActive,
                { backgroundColor: filterBy === option ? '#34C759' : (isDark ? theme.background : '#F2F2F7') }
              ]}
              onPress={() => setFilterBy(option)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: filterBy === option ? '#fff' : (isDark ? theme.text : '#000') }
              ]}>
                {getFilterLabel(option)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={[styles.sortContainer, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
          {(['popular', 'recent', 'nearby'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortButton,
                sortBy === option && styles.sortButtonActive,
                { backgroundColor: sortBy === option ? '#0A84FF' : (isDark ? theme.background : '#F2F2F7') }
              ]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[
                styles.sortButtonText,
                { color: sortBy === option ? '#fff' : (isDark ? theme.text : '#000') }
              ]}>
                {option === 'popular' ? 'Most Popular' : option === 'recent' ? 'Recently Added' : 'Nearby'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Places List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34C759" />
          <Text style={[styles.loadingText, { color: isDark ? theme.textSecondary : '#666' }]}>
            Loading camping spots...
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          renderItem={renderPlaceCard}
          keyExtractor={(item, index) => `camp-list-${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34C759" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="bonfire-outline" size={48} color={isDark ? theme.textSecondary : '#ccc'} />
              <Text style={[styles.emptyTitle, { color: isDark ? theme.text : '#000' }]}>
                No camping spots found yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
                Check back soon for RV parks and campgrounds!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

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
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sortContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sortScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  sortButtonActive: {
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  signalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  signalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
