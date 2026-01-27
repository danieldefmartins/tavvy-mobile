/**
 * RVCampingBrowseScreen.tsx
 * Browse RV parks, campgrounds, and camping spots
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Glassy filter pills
 * - Featured campground hero with amenity icons
 * - Popular spots grid
 */

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
  TextInput,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';

const { width } = Dimensions.get('window');

// Design System Colors
const COLORS = {
  background: '#0F0F0F',
  backgroundLight: '#FAFAFA',
  surface: '#111827',
  surfaceLight: '#FFFFFF',
  glassy: '#1A1A1A',
  accent: '#667EEA',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#10B981',
};

type FilterOption = 'all' | 'rv_park' | 'campground' | 'dump_station';

interface Place {
  id: string;
  name: string;
  category: string;
  city?: string;
  state_region?: string;
  photos?: string[];
  amenities?: string[];
  isOpen?: boolean;
}

// Sample data
const SAMPLE_CAMPGROUNDS: Place[] = [
  {
    id: 'camp-1',
    name: 'Yellowstone RV Park',
    category: 'RV Park',
    city: 'Yellowstone',
    state_region: 'WY',
    photos: ['https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800'],
    amenities: ['wifi', 'water', 'electric'],
    isOpen: true,
  },
  {
    id: 'camp-2',
    name: 'Grand Teton Campground',
    category: 'Campground',
    city: 'Jackson Hole',
    state_region: 'WY',
    photos: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'],
    amenities: ['wifi', 'water', 'hiking'],
  },
  {
    id: 'camp-3',
    name: 'Joshua Tree Oasis',
    category: 'Campground',
    city: 'Joshua Tree',
    state_region: 'CA',
    photos: ['https://images.unsplash.com/photo-1533632359083-0185df1be85d?w=800'],
    amenities: ['wifi', 'water', 'stargazing'],
  },
  {
    id: 'camp-4',
    name: 'Glacier View RV Resort',
    category: 'RV Park',
    city: 'Glacier',
    state_region: 'MT',
    photos: ['https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800'],
    amenities: ['wifi', 'electric', 'showers'],
  },
  {
    id: 'camp-5',
    name: 'Redwood Forest Camp',
    category: 'Campground',
    city: 'Crescent City',
    state_region: 'CA',
    photos: ['https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800'],
    amenities: ['hiking', 'water'],
  },
];

const FILTER_OPTIONS: { key: FilterOption; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'rv_park', label: 'RV Parks', icon: 'car-outline' },
  { key: 'campground', label: 'Campgrounds', icon: 'bonfire-outline' },
  { key: 'dump_station', label: 'Dump Stations', icon: 'water-outline' },
];

const AMENITY_ICONS: Record<string, { icon: string; label: string }> = {
  wifi: { icon: 'wifi', label: 'WiFi' },
  water: { icon: 'water', label: 'Water' },
  electric: { icon: 'flash', label: 'Electric' },
  showers: { icon: 'water-outline', label: 'Showers' },
  hiking: { icon: 'walk', label: 'Hiking' },
  stargazing: { icon: 'star', label: 'Stargazing' },
};

export default function RVCampingBrowseScreen({ navigation }: { navigation: any }) {
  const { theme, isDark } = useThemeContext();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  useEffect(() => {
    loadPlaces();
  }, [filterBy]);

  const loadPlaces = async () => {
    setLoading(true);
    try {
      // Filter sample data based on selection
      let filtered = SAMPLE_CAMPGROUNDS;
      if (filterBy === 'rv_park') {
        filtered = SAMPLE_CAMPGROUNDS.filter(p => p.category.toLowerCase().includes('rv'));
      } else if (filterBy === 'campground') {
        filtered = SAMPLE_CAMPGROUNDS.filter(p => p.category.toLowerCase().includes('campground'));
      } else if (filterBy === 'dump_station') {
        filtered = SAMPLE_CAMPGROUNDS.filter(p => p.category.toLowerCase().includes('dump'));
      }
      setPlaces(filtered);
    } catch (error) {
      console.error('Error loading places:', error);
      setPlaces(SAMPLE_CAMPGROUNDS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlaces();
  }, [filterBy]);

  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetails', { placeId: place.id });
  };

  const backgroundColor = isDark ? COLORS.background : COLORS.backgroundLight;
  const surfaceColor = isDark ? COLORS.surface : COLORS.surfaceLight;
  const glassyColor = isDark ? COLORS.glassy : '#F3F4F6';
  const textColor = isDark ? COLORS.textPrimary : '#1F2937';
  const secondaryTextColor = isDark ? COLORS.textSecondary : COLORS.textMuted;

  const featuredPlace = places[0];
  const popularPlaces = places.slice(1, 5);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
          Finding campgrounds...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>RV & Camping</Text>
          <Text style={[styles.tagline, { color: COLORS.accent }]}>
            Find your perfect campsite.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: glassyColor }]}>
            <Ionicons name="search" size={20} color={secondaryTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search campgrounds..."
              placeholderTextColor={secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterPill,
                { backgroundColor: filterBy === option.key ? COLORS.accent : glassyColor },
              ]}
              onPress={() => setFilterBy(option.key)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={option.icon as any}
                size={16}
                color={filterBy === option.key ? '#FFFFFF' : secondaryTextColor}
              />
              <Text
                style={[
                  styles.filterText,
                  { color: filterBy === option.key ? '#FFFFFF' : secondaryTextColor },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured / Near You Section */}
        {featuredPlace && (
          <View style={styles.featuredSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Near You</Text>
            <TouchableOpacity
              style={[styles.featuredCard, { backgroundColor: surfaceColor }]}
              onPress={() => handlePlacePress(featuredPlace)}
              activeOpacity={0.9}
            >
              <View style={styles.featuredRow}>
                <Image
                  source={{ uri: featuredPlace.photos?.[0] }}
                  style={styles.featuredImage}
                />
                <View style={styles.featuredInfo}>
                  {featuredPlace.isOpen && (
                    <View style={styles.openBadge}>
                      <Text style={styles.openBadgeText}>OPEN NOW</Text>
                    </View>
                  )}
                  <Text style={[styles.featuredName, { color: textColor }]} numberOfLines={2}>
                    {featuredPlace.name}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color={secondaryTextColor} />
                    <Text style={[styles.locationText, { color: secondaryTextColor }]}>
                      {featuredPlace.city}, {featuredPlace.state_region}
                    </Text>
                  </View>
                  <View style={styles.amenitiesRow}>
                    {featuredPlace.amenities?.slice(0, 3).map((amenity, idx) => (
                      <View key={idx} style={styles.amenityIcon}>
                        <Ionicons
                          name={(AMENITY_ICONS[amenity]?.icon || 'checkmark') as any}
                          size={18}
                          color={COLORS.accent}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Popular Spots Grid */}
        <View style={styles.popularSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Popular Spots</Text>
          <View style={styles.gridContainer}>
            {popularPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={[styles.gridCard, { backgroundColor: surfaceColor }]}
                onPress={() => handlePlacePress(place)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: place.photos?.[0] }}
                  style={styles.gridImage}
                />
                <View style={styles.gridContent}>
                  <Text style={[styles.gridName, { color: isDark ? '#E5E7EB' : '#1F2937' }]} numberOfLines={2}>
                    {place.name}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={12} color={secondaryTextColor} />
                    <Text style={[styles.gridLocation, { color: secondaryTextColor }]} numberOfLines={1}>
                      {place.city}, {place.state_region}
                    </Text>
                  </View>
                  <View style={styles.amenitiesRow}>
                    {place.amenities?.slice(0, 3).map((amenity, idx) => (
                      <Ionicons
                        key={idx}
                        name={(AMENITY_ICONS[amenity]?.icon || 'checkmark') as any}
                        size={14}
                        color={COLORS.accent}
                        style={{ marginRight: 8 }}
                      />
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },

  // Search
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  // Filters
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Featured Section
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  featuredRow: {
    flexDirection: 'row',
  },
  featuredImage: {
    width: 160,
    height: 160,
  },
  featuredInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  openBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  openBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  featuredName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
  },
  amenitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amenityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Popular Section
  popularSection: {
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gridImage: {
    width: '100%',
    height: 100,
  },
  gridContent: {
    padding: 12,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridLocation: {
    fontSize: 12,
    marginLeft: 2,
  },
});
