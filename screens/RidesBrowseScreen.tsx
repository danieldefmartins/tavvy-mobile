/**
 * RidesBrowseScreen.tsx
 * Browse theme park rides and attractions
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Glassy filter pills
 * - Featured ride hero with "MUST RIDE" badge
 * - Popular rides grid with thrill level badges (no stars)
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
  parkName?: string;
  photos?: string[];
  thrillLevel?: 'mild' | 'moderate' | 'thrilling' | 'extreme';
  isMustRide?: boolean;
}

// Sample data
const SAMPLE_RIDES: Ride[] = [
  {
    id: 'ride-1',
    name: 'Space Mountain',
    category: 'Roller Coaster',
    parkName: 'Magic Kingdom',
    photos: ['https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800'],
    thrillLevel: 'thrilling',
    isMustRide: true,
  },
  {
    id: 'ride-2',
    name: 'Tron Lightcycle / Run',
    category: 'Roller Coaster',
    parkName: 'Magic Kingdom',
    photos: ['https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800'],
    thrillLevel: 'extreme',
  },
  {
    id: 'ride-3',
    name: 'Guardians of the Galaxy',
    category: 'Roller Coaster',
    parkName: 'EPCOT',
    photos: ['https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800'],
    thrillLevel: 'extreme',
  },
  {
    id: 'ride-4',
    name: 'Splash Mountain',
    category: 'Water Ride',
    parkName: 'Magic Kingdom',
    photos: ['https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800'],
    thrillLevel: 'moderate',
  },
  {
    id: 'ride-5',
    name: 'Pirates of the Caribbean',
    category: 'Dark Ride',
    parkName: 'Magic Kingdom',
    photos: ['https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=800'],
    thrillLevel: 'mild',
  },
];

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
      let filtered = SAMPLE_RIDES;
      if (filterBy === 'roller_coaster') {
        filtered = SAMPLE_RIDES.filter(r => r.category.toLowerCase().includes('coaster'));
      } else if (filterBy === 'water') {
        filtered = SAMPLE_RIDES.filter(r => r.category.toLowerCase().includes('water'));
      } else if (filterBy === 'family') {
        filtered = SAMPLE_RIDES.filter(r => r.thrillLevel === 'mild' || r.thrillLevel === 'moderate');
      } else if (filterBy === 'dark') {
        filtered = SAMPLE_RIDES.filter(r => r.category.toLowerCase().includes('dark'));
      }
      setRides(filtered);
    } catch (error) {
      console.error('Error loading rides:', error);
      setRides(SAMPLE_RIDES);
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
      parkName: ride.parkName,
    });
  };

  const backgroundColor = isDark ? COLORS.background : COLORS.backgroundLight;
  const surfaceColor = isDark ? COLORS.surface : COLORS.surfaceLight;
  const glassyColor = isDark ? COLORS.glassy : '#F3F4F6';
  const textColor = isDark ? COLORS.textPrimary : '#1F2937';
  const secondaryTextColor = isDark ? COLORS.textSecondary : COLORS.textMuted;

  const featuredRide = rides.find(r => r.isMustRide) || rides[0];
  const popularRides = rides.filter(r => r.id !== featuredRide?.id).slice(0, 4);

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
          <View style={[styles.searchBar, { backgroundColor: glassyColor }]}>
            <Ionicons name="search" size={20} color={secondaryTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search rides & attractions..."
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
                source={{ uri: featuredRide.photos?.[0] }}
                style={styles.featuredImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.featuredGradient}
              >
                {featuredRide.isMustRide && (
                  <View style={styles.mustRideBadge}>
                    <Text style={styles.mustRideText}>MUST RIDE</Text>
                  </View>
                )}
                <Text style={styles.featuredName}>{featuredRide.name}</Text>
                <Text style={styles.featuredMeta}>
                  {featuredRide.parkName} • {featuredRide.category}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Popular Rides Grid */}
        <View style={styles.popularSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Popular Rides</Text>
          <View style={styles.gridContainer}>
            {popularRides.map((ride) => {
              const thrillInfo = THRILL_LABELS[ride.thrillLevel || 'moderate'];
              return (
                <TouchableOpacity
                  key={ride.id}
                  style={[styles.gridCard, { backgroundColor: surfaceColor }]}
                  onPress={() => handleRidePress(ride)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: ride.photos?.[0] }}
                    style={styles.gridImage}
                  />
                  <View style={styles.gridContent}>
                    <Text style={[styles.gridName, { color: isDark ? '#E5E7EB' : '#1F2937' }]} numberOfLines={2}>
                      {ride.name}
                    </Text>
                    <Text style={[styles.gridPark, { color: secondaryTextColor }]} numberOfLines={1}>
                      {ride.parkName}
                    </Text>
                    <View style={[styles.thrillBadge, { backgroundColor: `${thrillInfo.color}20` }]}>
                      <Ionicons name="flash" size={12} color={thrillInfo.color} />
                      <Text style={[styles.thrillText, { color: thrillInfo.color }]}>
                        {thrillInfo.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
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
    height: 220,
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
    padding: 20,
    paddingTop: 80,
  },
  mustRideBadge: {
    backgroundColor: COLORS.mustRide,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  mustRideText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredMeta: {
    color: '#E5E7EB',
    fontSize: 14,
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
    marginBottom: 2,
  },
  gridPark: {
    fontSize: 12,
    marginBottom: 8,
  },
  thrillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  thrillText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
