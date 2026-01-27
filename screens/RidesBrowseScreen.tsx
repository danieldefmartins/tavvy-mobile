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
  mustRide: '#EF4444',
  thrill: '#F59E0B',
};

type FilterOption = 'all' | 'roller_coaster' | 'water' | 'family' | 'dark';

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
}

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'roller_coaster', label: 'Roller Coasters' },
  { key: 'water', label: 'Water Rides' },
  { key: 'family', label: 'Family' },
  { key: 'dark', label: 'Dark Rides' },
];

const THRILL_LABELS: Record<string, { label: string; color: string }> = {
  mild: { label: 'Mild', color: '#10B981' },
  moderate: { label: 'Moderate', color: '#3B82F6' },
  thrilling: { label: 'Thrilling', color: '#F59E0B' },
  extreme: { label: 'Extreme', color: '#EF4444' },
};

// Placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';

// Helper function to determine thrill level from subcategory
const getThrillLevelFromSubcategory = (subcategory: string | undefined): 'mild' | 'moderate' | 'thrilling' | 'extreme' => {
  if (!subcategory) return 'moderate';
  const lower = subcategory.toLowerCase();
  if (lower.includes('thrill') || lower === 'roller_coaster') return 'extreme';
  if (lower.includes('water') || lower === 'simulator') return 'thrilling';
  if (lower === 'dark_ride' || lower === 'boat_ride') return 'moderate';
  if (lower === 'carousel' || lower === 'train' || lower === 'playground' || lower === 'show' || lower === 'meet_greet') return 'mild';
  return 'moderate';
};

export default function RidesBrowseScreen({ navigation }: { navigation: any }) {
  const { theme, isDark } = useThemeContext();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  useEffect(() => {
    loadRides();
  }, [filterBy]);

  const loadRides = async () => {
    setLoading(true);
    try {
      // First try tavvy_places, then fallback to places table
      // Use correct column names: tavvy_category, tavvy_subcategory
      let query = supabase
        .from('places')
        .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
        .eq('tavvy_category', 'attraction')
        .order('created_at', { ascending: false })
        .limit(50);

      // Apply filter based on subcategory
      if (filterBy === 'roller_coaster') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
          .eq('tavvy_category', 'attraction')
          .eq('tavvy_subcategory', 'roller_coaster')
          .order('created_at', { ascending: false })
          .limit(50);
      } else if (filterBy === 'water') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
          .eq('tavvy_category', 'attraction')
          .or('tavvy_subcategory.eq.water_ride,tavvy_subcategory.eq.boat_ride')
          .order('created_at', { ascending: false })
          .limit(50);
      } else if (filterBy === 'family') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
          .eq('tavvy_category', 'attraction')
          .or('tavvy_subcategory.eq.carousel,tavvy_subcategory.eq.train,tavvy_subcategory.eq.spinner,tavvy_subcategory.eq.playground')
          .order('created_at', { ascending: false })
          .limit(50);
      } else if (filterBy === 'dark') {
        query = supabase
          .from('places')
          .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
          .eq('tavvy_category', 'attraction')
          .eq('tavvy_subcategory', 'dark_ride')
          .order('created_at', { ascending: false })
          .limit(50);
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
          thrill_level: getThrillLevelFromSubcategory(place.tavvy_subcategory),
          is_must_ride: place.tavvy_subcategory === 'roller_coaster' || place.tavvy_subcategory === 'thrill_ride',
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRides();
  }, [filterBy]);

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

  // Filter by search query
  const filteredRides = searchQuery
    ? rides.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : rides;

  const featuredRide = filteredRides.find(r => r.is_must_ride || r.is_featured) || filteredRides[0];
  const popularRides = filteredRides.filter(r => r.id !== featuredRide?.id).slice(0, 4);

  if (loading) {
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
          <Text style={[styles.title, { color: textColor }]}>Rides</Text>
          <Text style={[styles.tagline, { color: COLORS.accent }]}>
            Theme park thrills await.
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
              placeholder="Search rides & attractions..."
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
        {filteredRides.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: glassyColor }]}>
              <Ionicons name="train-outline" size={48} color={secondaryTextColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No rides yet</Text>
            <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
              Theme park rides and attractions will appear here once added.
            </Text>
          </View>
        ) : (
          <>
            {/* Featured Ride Hero */}
            {featuredRide && (
              <View style={styles.featuredSection}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Featured Ride</Text>
                <TouchableOpacity
                  style={styles.featuredCard}
                  onPress={() => handleRidePress(featuredRide)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: featuredRide.cover_image_url || featuredRide.photos?.[0] || PLACEHOLDER_IMAGE }}
                    style={styles.featuredImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={styles.featuredGradient}
                  >
                    {featuredRide.is_must_ride && (
                      <View style={styles.mustRideBadge}>
                        <Text style={styles.mustRideText}>MUST RIDE</Text>
                      </View>
                    )}
                    <Text style={styles.featuredName}>{featuredRide.name}</Text>
                    <Text style={styles.featuredMeta}>
                      {featuredRide.park_name || featuredRide.universe_name || 'Theme Park'} • {featuredRide.category || 'Attraction'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Popular Rides Grid */}
            {popularRides.length > 0 && (
              <View style={styles.popularSection}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Popular Rides</Text>
                <View style={styles.gridContainer}>
                  {popularRides.map((ride) => {
                    const thrillInfo = THRILL_LABELS[ride.thrill_level || 'moderate'];
                    return (
                      <TouchableOpacity
                        key={ride.id}
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
                        onPress={() => handleRidePress(ride)}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: ride.cover_image_url || ride.photos?.[0] || PLACEHOLDER_IMAGE }}
                          style={styles.gridImage}
                        />
                        <View style={styles.gridInfo}>
                          <Text style={[styles.gridName, { color: textColor }]} numberOfLines={1}>
                            {ride.name}
                          </Text>
                          <Text style={[styles.gridPark, { color: secondaryTextColor }]} numberOfLines={1}>
                            {ride.park_name || ride.universe_name || 'Theme Park'}
                          </Text>
                          {ride.thrill_level && (
                            <View style={[styles.thrillBadge, { backgroundColor: thrillInfo.color + '20' }]}>
                              <Text style={[styles.thrillText, { color: thrillInfo.color }]}>
                                {thrillInfo.label}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
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
    borderRadius: 20,
    overflow: 'hidden',
    height: 200,
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
  mustRideBadge: {
    backgroundColor: COLORS.mustRide,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  mustRideText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredMeta: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
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
    marginBottom: 2,
  },
  gridPark: {
    fontSize: 12,
    marginBottom: 8,
  },
  thrillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  thrillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
