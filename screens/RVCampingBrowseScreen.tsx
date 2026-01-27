/**
 * RVCampingBrowseScreen.tsx
 * Browse RV parks, campgrounds, and camping spots
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Glassy filter pills
 * - Featured campground hero with amenity icons
 * - Popular spots grid
 * - Real data from Supabase
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
  tavvy_category: string;
  tavvy_subcategory?: string;
  city?: string;
  region?: string;
  cover_image_url?: string;
  photos?: string[];
  status?: string;
}

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
  restrooms: { icon: 'home', label: 'Restrooms' },
  pets: { icon: 'paw', label: 'Pet Friendly' },
};

// Placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800';

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
      // Build query for RV & Camping places from canonical places table
      let query = supabase
        .from('places')
        .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, status')
        .eq('tavvy_category', 'rv_camping')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      // Apply filter by subcategory
      if (filterBy === 'rv_park') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, status')
          .eq('tavvy_category', 'rv_camping')
          .ilike('tavvy_subcategory', '%rv_park%')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(20);
      } else if (filterBy === 'campground') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, status')
          .eq('tavvy_category', 'rv_camping')
          .or('tavvy_subcategory.ilike.%campground%,tavvy_subcategory.ilike.%established_campground%')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(20);
      } else if (filterBy === 'dump_station') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, status')
          .eq('tavvy_category', 'rv_camping')
          .ilike('tavvy_subcategory', '%dump_station%')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(20);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading RV places:', error);
        setPlaces([]);
      } else {
        setPlaces(data || []);
      }
    } catch (error) {
      console.error('Error loading places:', error);
      setPlaces([]);
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

  const backgroundColor = theme.background;
  const surfaceColor = theme.surface;
  const glassyColor = isDark ? theme.surface : '#F3F4F6';
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;

  // Filter by search query
  const filteredPlaces = searchQuery
    ? places.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : places;

  const featuredPlace = filteredPlaces[0];
  const popularPlaces = filteredPlaces.slice(1, 5);

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
          <View style={[
            styles.searchBar, 
            { 
              backgroundColor: isDark ? glassyColor : '#FFFFFF',
              borderWidth: isDark ? 0 : 1,
              borderColor: '#E5E7EB',
            }
          ]}>
            <Ionicons name="search" size={20} color={secondaryTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search campgrounds..."
              placeholderTextColor={secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={secondaryTextColor} />
              </TouchableOpacity>
            )}
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
                { 
                  backgroundColor: filterBy === option.key ? COLORS.accent : (isDark ? glassyColor : '#FFFFFF'),
                  borderWidth: isDark ? 0 : 1,
                  borderColor: filterBy === option.key ? COLORS.accent : '#E5E7EB',
                },
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

        {/* Empty State */}
        {filteredPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: glassyColor }]}>
              <Ionicons name="bonfire-outline" size={48} color={secondaryTextColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No campgrounds yet</Text>
            <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
              RV parks and campgrounds will appear here once added.
            </Text>
          </View>
        ) : (
          <>
            {/* Featured / Near You Section */}
            {featuredPlace && (
              <View style={styles.featuredSection}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Near You</Text>
                <TouchableOpacity
                  style={[
                    styles.featuredCard, 
                    { 
                      backgroundColor: surfaceColor,
                      shadowColor: isDark ? 'transparent' : '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0 : 0.08,
                      shadowRadius: 8,
                      elevation: isDark ? 0 : 3,
                    }
                  ]}
                  onPress={() => handlePlacePress(featuredPlace)}
                  activeOpacity={0.9}
                >
                  <View style={styles.featuredRow}>
                    <Image
                      source={{ uri: featuredPlace.cover_image_url || featuredPlace.photos?.[0] || PLACEHOLDER_IMAGE }}
                      style={styles.featuredImage}
                    />
                    <View style={styles.featuredInfo}>
                      <Text style={[styles.featuredName, { color: textColor }]} numberOfLines={2}>
                        {featuredPlace.name}
                      </Text>
                      <View style={styles.locationRow}>
                        <Ionicons name="location" size={14} color={secondaryTextColor} />
                        <Text style={[styles.locationText, { color: secondaryTextColor }]}>
                          {featuredPlace.city}{featuredPlace.region ? `, ${featuredPlace.region}` : ''}
                        </Text>
                      </View>
                      {/* Subcategory badge */}
                      {featuredPlace.tavvy_subcategory && (
                        <View style={[styles.amenityBadge, { backgroundColor: isDark ? theme.surface : '#F3F4F6', marginTop: 8 }]}>
                          <Text style={{ color: COLORS.accent, fontSize: 12 }}>
                            {featuredPlace.tavvy_subcategory.replace(/_/g, ' ')}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Popular Spots Grid */}
            {popularPlaces.length > 0 && (
              <View style={styles.popularSection}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Popular Spots</Text>
                <View style={styles.gridContainer}>
                  {popularPlaces.map((place) => (
                    <TouchableOpacity
                      key={place.id}
                      style={[
                        styles.gridCard, 
                        { 
                          backgroundColor: surfaceColor,
                          shadowColor: isDark ? 'transparent' : '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isDark ? 0 : 0.08,
                          shadowRadius: 8,
                          elevation: isDark ? 0 : 3,
                        }
                      ]}
                      onPress={() => handlePlacePress(place)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: place.cover_image_url || place.photos?.[0] || PLACEHOLDER_IMAGE }}
                        style={styles.gridImage}
                      />
                      <View style={styles.gridInfo}>
                        <Text style={[styles.gridName, { color: textColor }]} numberOfLines={1}>
                          {place.name}
                        </Text>
                        <Text style={[styles.gridLocation, { color: secondaryTextColor }]} numberOfLines={1}>
                          {place.city}{place.region ? `, ${place.region}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

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
    fontSize: 16,
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
    gap: 6,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Sections
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Featured Card
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
  },
  featuredRow: {
    flexDirection: 'row',
  },
  featuredImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  featuredInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  openBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  openBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  featuredName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
  },
  amenitiesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  amenityBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Popular Grid
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
  gridInfo: {
    padding: 12,
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridLocation: {
    fontSize: 12,
  },
});
