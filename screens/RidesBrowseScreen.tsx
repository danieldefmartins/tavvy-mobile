/**
 * RidesBrowseScreen.tsx
 * Browse theme park rides and attractions
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Glassy filter pills
 * - Featured ride hero with "MUST RIDE" badge
 * - Popular rides grid with thrill level badges (no stars)
 * - Real data from Supabase
 * - Search by ride name OR theme park name
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
import { useTranslation } from 'react-i18next';

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
  mustRide: '#EF4444',
  thrill: '#F59E0B',
};

type FilterOption = 'all' | 'thrill_rides' | 'family_rides' | 'dark_rides' | 'shows' | 'characters' | 'explore' | 'animals' | 'water_rides' | 'simulators' | 'interactive';

interface Ride {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  park_name?: string;
  universe_name?: string;
  cover_image_url?: string;
  photos?: string[];
  thrill_level?: 'mild' | 'moderate' | 'thrilling' | 'extreme';
  is_must_ride?: boolean;
  is_featured?: boolean;
  min_height_inches?: number;
  description?: string;
  short_description?: string;
}

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'thrill_rides', label: 'Thrill Rides' },
  { key: 'family_rides', label: 'Family Rides' },
  { key: 'dark_rides', label: 'Dark Rides' },
  { key: 'shows', label: 'Shows' },
  { key: 'characters', label: 'Characters' },
  { key: 'explore', label: 'Explore' },
  { key: 'animals', label: 'Animals' },
  { key: 'water_rides', label: 'Water Rides' },
  { key: 'simulators', label: 'Simulators' },
  { key: 'interactive', label: 'Interactive' },
];

const THRILL_LABELS: Record<string, { label: string; color: string }> = {
  mild: { label: 'Mild', color: '#10B981' },
  moderate: { label: 'Moderate', color: '#3B82F6' },
  thrilling: { label: 'Thrilling', color: '#F59E0B' },
  extreme: { label: 'Extreme', color: '#EF4444' },
};

// Placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';

// Helper function to determine thrill level from subcategory (case-insensitive)
const getThrillLevelFromSubcategory = (subcategory: string | undefined): 'mild' | 'moderate' | 'thrilling' | 'extreme' => {
  if (!subcategory) return 'moderate';
  const lower = subcategory.toLowerCase();
  if (lower === 'thrill_rides') return 'extreme';
  if (lower === 'simulators' || lower === 'water_rides') return 'thrilling';
  if (lower === 'dark_rides') return 'moderate';
  if (lower === 'family_rides' || lower === 'shows' || lower === 'characters' || lower === 'explore' || lower === 'animals' || lower === 'interactive') return 'mild';
  return 'moderate';
};

// Get fallback image based on subcategory
const getCategoryFallbackImage = (subcategory: string | undefined): string => {
  if (!subcategory) return PLACEHOLDER_IMAGE;
  const lower = subcategory.toLowerCase();
  
  if (lower.includes('coaster') || lower.includes('thrill')) {
    return 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800';
  }
  if (lower.includes('water') || lower.includes('boat') || lower.includes('flume')) {
    return 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800';
  }
  if (lower.includes('dark')) {
    return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
  }
  return PLACEHOLDER_IMAGE;
};

// Format subcategory for display
const formatSubcategory = (subcategory: string | undefined): string => {
  if (!subcategory) return 'Attraction';
  // Already formatted (e.g., "Roller Coaster") - just return it
  if (subcategory.includes(' ')) return subcategory;
  // Convert snake_case to Title Case
  return subcategory
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function RidesBrowseScreen({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  const { theme, isDark } = useThemeContext();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchingByPark, setSearchingByPark] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadRides();
  }, [filterBy]);

  // Search with debounce
  useEffect(() => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchRides(searchQuery);
      } else if (searchQuery.length === 0) {
        loadRides();
      }
    }, 300);
    
    setSearchTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [searchQuery]);

  const loadRides = async () => {
    setLoading(true);
    setSearchingByPark(false);
    try {
      // Query places table with attraction category
      // Use ilike for case-insensitive matching
      let query = supabase
        .from('places')
        .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, description, short_description, min_height_inches')
        .eq('tavvy_category', 'attraction')
        .order('name', { ascending: true })
        .limit(100);

      // Apply filter based on experience category
      if (filterBy !== 'all') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, description, short_description, min_height_inches')
          .eq('tavvy_category', 'attraction')
          .eq('tavvy_subcategory', filterBy)
          .order('name', { ascending: true })
          .limit(100);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading rides:', error);
        setRides([]);
      } else {
        // Map places data to Ride interface
        const mappedRides: Ride[] = (data || []).map((place: any) => ({
          id: place.id,
          name: place.name,
          category: place.tavvy_category || 'attraction',
          subcategory: place.tavvy_subcategory,
          park_name: place.city,
          cover_image_url: place.cover_image_url,
          photos: place.photos,
          description: place.description,
          short_description: place.short_description,
          min_height_inches: place.min_height_inches,
          thrill_level: getThrillLevelFromSubcategory(place.tavvy_subcategory),
          is_must_ride: place.tavvy_subcategory === 'thrill_rides',
          is_featured: false,
        }));
        setRides(mappedRides);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
      setRides([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchRides = async (query: string) => {
    setLoading(true);
    
    try {
      // First, try to find a universe/theme park matching the search
      const { data: universeData } = await supabase
        .from('atlas_universes')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(1);

      if (universeData && universeData.length > 0) {
        // Found a theme park - get all its rides
        const universeId = universeData[0].id;
        const universeName = universeData[0].name;
        setSearchingByPark(true);

        // Get place IDs linked to this universe
        const { data: placeLinks } = await supabase
          .from('atlas_universe_places')
          .select('place_id')
          .eq('universe_id', universeId)
          .limit(200);

        if (placeLinks && placeLinks.length > 0) {
          const placeIds = placeLinks.map((link: any) => link.place_id);
          
          // Get the places that are attractions
          const { data: placesData } = await supabase
            .from('places')
            .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, description, short_description, min_height_inches')
            .in('id', placeIds)
            .eq('tavvy_category', 'attraction')
            .order('name', { ascending: true });

          if (placesData) {
            const mappedRides: Ride[] = placesData.map((place: any) => ({
              id: place.id,
              name: place.name,
              category: place.tavvy_category || 'attraction',
              subcategory: place.tavvy_subcategory,
              park_name: universeName,
              universe_name: universeName,
              cover_image_url: place.cover_image_url,
              photos: place.photos,
              description: place.description,
              short_description: place.short_description,
              min_height_inches: place.min_height_inches,
              thrill_level: getThrillLevelFromSubcategory(place.tavvy_subcategory),
              is_must_ride: (place.tavvy_subcategory || '').toLowerCase().includes('coaster'),
              is_featured: false,
            }));
            setRides(mappedRides);
            setLoading(false);
            return;
          }
        }
      }

      // No theme park found, search by ride name
      setSearchingByPark(false);
      const { data, error } = await supabase
        .from('places')
        .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos, description, short_description, min_height_inches')
        .eq('tavvy_category', 'attraction')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error searching rides:', error);
        setRides([]);
      } else {
        const mappedRides: Ride[] = (data || []).map((place: any) => ({
          id: place.id,
          name: place.name,
          category: place.tavvy_category || 'attraction',
          subcategory: place.tavvy_subcategory,
          park_name: place.city,
          cover_image_url: place.cover_image_url,
          photos: place.photos,
          description: place.description,
          short_description: place.short_description,
          min_height_inches: place.min_height_inches,
          thrill_level: getThrillLevelFromSubcategory(place.tavvy_subcategory),
          is_must_ride: (place.tavvy_subcategory || '').toLowerCase().includes('coaster'),
          is_featured: false,
        }));
        setRides(mappedRides);
      }
    } catch (error) {
      console.error('Error searching rides:', error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (searchQuery.length >= 2) {
      searchRides(searchQuery);
    } else {
      loadRides();
    }
  }, [filterBy, searchQuery]);

  const handleRidePress = (ride: Ride) => {
    navigation.navigate('RideDetails', { 
      rideId: ride.id, 
      rideName: ride.name,
      parkName: ride.park_name || ride.universe_name,
    });
  };

  const backgroundColor = theme.background;
  const surfaceColor = theme.surface;
  const glassyColor = isDark ? theme.surface : '#F3F4F6';
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;

  // Apply filter to rides (for when searching by park)
  const filteredRides = rides.filter(r => {
    if (filterBy === 'all') return true;
    const sub = (r.subcategory || '').toLowerCase();
    if (filterBy === 'roller_coaster') return sub.includes('coaster');
    if (filterBy === 'water') return sub.includes('water') || sub.includes('boat') || sub.includes('flume');
    if (filterBy === 'family') return sub.includes('carousel') || sub.includes('train') || sub.includes('spinner') || sub.includes('show');
    if (filterBy === 'dark') return sub.includes('dark');
    return true;
  });

  const featuredRide = filteredRides.find(r => r.is_must_ride || r.is_featured) || filteredRides[0];
  const popularRides = filteredRides.filter(r => r.id !== featuredRide?.id).slice(0, 20);

  if (loading && rides.length === 0) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
          Loading rides...
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={textColor} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: textColor }]}>Rides</Text>
            <Text style={[styles.tagline, { color: COLORS.accent }]}>
              Theme park thrills await.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={20} color={secondaryTextColor} />
          </TouchableOpacity>
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
              placeholder="Search rides or theme parks..."
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
          {searchingByPark && searchQuery && (
            <Text style={[styles.searchHint, { color: COLORS.accent }]}>
              Showing rides from "{searchQuery}"
            </Text>
          )}
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
            >
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

        {/* Content */}
        {filteredRides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: glassyColor }]}>
              <Ionicons name="train-outline" size={40} color={secondaryTextColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No rides found</Text>
            <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
              {searchQuery ? `No rides matching "${searchQuery}"` : 'Theme park rides and attractions will appear here.'}
            </Text>
          </View>
        ) : (
          <>
            {/* Featured Ride */}
            {featuredRide && (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => handleRidePress(featuredRide)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: featuredRide.cover_image_url || getCategoryFallbackImage(featuredRide.subcategory) }}
                  style={styles.featuredImage}
                  defaultSource={{ uri: PLACEHOLDER_IMAGE }}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.featuredGradient}
                >
                  <View style={styles.featuredBadges}>
                    {featuredRide.is_must_ride && (
                      <View style={[styles.badge, { backgroundColor: COLORS.mustRide }]}>
                        <Text style={styles.badgeText}>MUST RIDE</Text>
                      </View>
                    )}
                    {featuredRide.thrill_level && THRILL_LABELS[featuredRide.thrill_level] && (
                      <View style={[styles.badge, { backgroundColor: THRILL_LABELS[featuredRide.thrill_level].color }]}>
                        <Text style={styles.badgeText}>{THRILL_LABELS[featuredRide.thrill_level].label}</Text>
                      </View>
                    )}
                    {featuredRide.min_height_inches && (
                      <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Text style={styles.badgeText}>{featuredRide.min_height_inches}" min</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.featuredName}>{featuredRide.name}</Text>
                  <Text style={styles.featuredSubtitle}>
                    {formatSubcategory(featuredRide.subcategory)} • {featuredRide.park_name || featuredRide.universe_name || 'Theme Park'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Rides Count */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                {searchingByPark ? 'Rides & Attractions' : 'Popular Rides'}
              </Text>
              <Text style={[styles.ridesCount, { color: secondaryTextColor }]}>
                {filteredRides.length} rides
              </Text>
            </View>

            {/* Rides Grid */}
            <View style={styles.ridesGrid}>
              {popularRides.map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  style={[styles.rideCard, { backgroundColor: surfaceColor }]}
                  onPress={() => handleRidePress(ride)}
                  activeOpacity={0.8}
                >
                  <View style={styles.rideImageContainer}>
                    <Image
                      source={{ uri: ride.cover_image_url || getCategoryFallbackImage(ride.subcategory) }}
                      style={styles.rideImage}
                      defaultSource={{ uri: PLACEHOLDER_IMAGE }}
                    />
                    {ride.thrill_level && THRILL_LABELS[ride.thrill_level] && (
                      <View style={[styles.thrillBadge, { backgroundColor: THRILL_LABELS[ride.thrill_level].color }]}>
                        <Text style={styles.thrillBadgeText}>{THRILL_LABELS[ride.thrill_level].label}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.rideInfo}>
                    <Text style={[styles.rideName, { color: textColor }]} numberOfLines={1}>
                      {ride.name}
                    </Text>
                    <Text style={[styles.rideSubtitle, { color: secondaryTextColor }]} numberOfLines={1}>
                      {formatSubcategory(ride.subcategory)}
                      {ride.min_height_inches && ` • ${ride.min_height_inches}"`}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  tagline: {
    fontSize: 14,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  searchHint: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  featuredCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    height: 180,
    marginBottom: 20,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  featuredBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  featuredName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  featuredSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  ridesCount: {
    fontSize: 14,
  },
  ridesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  rideCard: {
    width: (width - 36) / 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rideImageContainer: {
    position: 'relative',
    height: 100,
  },
  rideImage: {
    width: '100%',
    height: '100%',
  },
  thrillBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thrillBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '600',
  },
  rideInfo: {
    padding: 10,
  },
  rideName: {
    fontSize: 13,
    fontWeight: '600',
  },
  rideSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },
});
