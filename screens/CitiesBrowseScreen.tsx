/**
 * CitiesBrowseScreen.tsx
 * Browse cities with Tavvy signals
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Featured city hero card
 * - 2x2 popular cities grid with trending badges
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
  trending: '#EF4444',
};

// Sample cities data
const SAMPLE_CITIES = [
  { 
    id: 'city-nyc', 
    name: 'New York City', 
    state_region: 'New York', 
    country: 'USA',
    population: 8336817,
    cover_image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    isFeatured: true,
  },
  { 
    id: 'city-miami', 
    name: 'Miami', 
    state_region: 'Florida', 
    country: 'USA',
    population: 442241,
    cover_image_url: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800',
  },
  { 
    id: 'city-la', 
    name: 'Los Angeles', 
    state_region: 'California', 
    country: 'USA',
    population: 3979576,
    cover_image_url: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
  },
  { 
    id: 'city-austin', 
    name: 'Austin', 
    state_region: 'Texas', 
    country: 'USA',
    population: 978908,
    cover_image_url: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800',
  },
  { 
    id: 'city-chicago', 
    name: 'Chicago', 
    state_region: 'Illinois', 
    country: 'USA',
    population: 2693976,
    cover_image_url: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800',
  },
];

interface City {
  id: string;
  name: string;
  state_region?: string;
  country?: string;
  population?: number;
  cover_image_url?: string;
  isFeatured?: boolean;
}

export default function CitiesBrowseScreen({ navigation }: { navigation: any }) {
  const { theme, isDark } = useThemeContext();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    setLoading(true);
    try {
      // Sort by population (most popular first)
      const sorted = [...SAMPLE_CITIES].sort((a, b) => (b.population || 0) - (a.population || 0));
      setCities(sorted);
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities(SAMPLE_CITIES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCities();
  }, []);

  const handleCityPress = (city: City) => {
    navigation.navigate('CityDetails', { 
      cityId: city.id, 
      cityName: city.name 
    });
  };

  const formatPopulation = (pop?: number): string => {
    if (!pop) return '';
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M people`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K people`;
    return `${pop} people`;
  };

  const backgroundColor = isDark ? COLORS.background : COLORS.backgroundLight;
  const surfaceColor = isDark ? COLORS.surface : COLORS.surfaceLight;
  const glassyColor = isDark ? COLORS.glassy : '#F3F4F6';
  const textColor = isDark ? COLORS.textPrimary : '#1F2937';
  const secondaryTextColor = isDark ? COLORS.textSecondary : COLORS.textMuted;

  const featuredCity = cities.find(c => c.isFeatured) || cities[0];
  const popularCities = cities.filter(c => c.id !== featuredCity?.id).slice(0, 4);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
          Loading cities...
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
          <Text style={[styles.title, { color: textColor }]}>Cities</Text>
          <Text style={[styles.tagline, { color: COLORS.accent }]}>
            Discover vibrant destinations.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBar, { backgroundColor: glassyColor }]}>
            <Ionicons name="search" size={20} color={secondaryTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search cities..."
              placeholderTextColor={secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Featured City Hero */}
        {featuredCity && (
          <View style={styles.featuredSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Featured City</Text>
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => handleCityPress(featuredCity)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: featuredCity.cover_image_url }}
                style={styles.featuredImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.featuredGradient}
              >
                <View style={styles.featuredLabel}>
                  <Text style={styles.featuredLabelText}>FEATURED</Text>
                </View>
                <Text style={styles.featuredName}>{featuredCity.name}</Text>
                <Text style={styles.featuredMeta}>
                  {featuredCity.state_region}, {featuredCity.country} • {formatPopulation(featuredCity.population)}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Popular Cities Grid */}
        <View style={styles.popularSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Popular Cities</Text>
          <View style={styles.gridContainer}>
            {popularCities.map((city) => (
              <TouchableOpacity
                key={city.id}
                style={[styles.gridCard, { backgroundColor: surfaceColor }]}
                onPress={() => handleCityPress(city)}
                activeOpacity={0.8}
              >
                <View style={styles.gridImageContainer}>
                  <Image
                    source={{ uri: city.cover_image_url }}
                    style={styles.gridImage}
                  />
                  <View style={styles.trendingBadge}>
                    <Text style={styles.trendingIcon}>🔥</Text>
                    <Text style={styles.trendingText}>Trending</Text>
                  </View>
                </View>
                <View style={styles.gridContent}>
                  <Text style={[styles.gridName, { color: isDark ? '#E5E7EB' : '#1F2937' }]} numberOfLines={1}>
                    {city.name}
                  </Text>
                  <Text style={[styles.gridLocation, { color: secondaryTextColor }]} numberOfLines={1}>
                    {city.state_region}, {city.country}
                  </Text>
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
    marginBottom: 20,
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
    padding: 20,
    paddingTop: 60,
  },
  featuredLabel: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
  gridImageContainer: {
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: 100,
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendingIcon: {
    fontSize: 10,
  },
  trendingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  gridContent: {
    padding: 12,
  },
  gridName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  gridLocation: {
    fontSize: 13,
  },
});
