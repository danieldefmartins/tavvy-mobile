/**
 * CitiesBrowseScreen.tsx
 * Browse cities with Tavvy signals
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Featured city hero card
 * - 2x2 popular cities grid with trending badges
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
  trending: '#EF4444',
};

interface City {
  id: string;
  name: string;
  state_region?: string;
  country?: string;
  population?: number;
  cover_image_url?: string;
  is_featured?: boolean;
  total_signals?: number;
}

// Placeholder image
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800';

export default function CitiesBrowseScreen({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
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
      // Fetch cities from tavvy_cities table
      const { data, error } = await supabase
        .from('tavvy_cities')
        .select('*')
        .order('population', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading cities:', error);
        setCities([]);
      } else {
        setCities(data || []);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities([]);
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

  const backgroundColor = theme.background;
  const surfaceColor = theme.surface;
  const glassyColor = isDark ? theme.surface : '#F3F4F6';
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;

  // Filter by search query
  const filteredCities = searchQuery
    ? cities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : cities;

  const featuredCity = filteredCities.find(c => c.is_featured) || filteredCities[0];
  const popularCities = filteredCities.filter(c => c.id !== featuredCity?.id).slice(0, 4);

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
            Discover urban adventures.
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
              placeholder="Search cities..."
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

        {/* Empty State */}
        {filteredCities.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: glassyColor }]}>
              <Ionicons name="business-outline" size={48} color={secondaryTextColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No cities yet</Text>
            <Text style={[styles.emptySubtitle, { color: secondaryTextColor }]}>
              Cities will appear here once added to the platform.
            </Text>
          </View>
        ) : (
          <>
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
                    source={{ uri: featuredCity.cover_image_url || PLACEHOLDER_IMAGE }}
                    style={styles.featuredImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={styles.featuredGradient}
                  >
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>FEATURED</Text>
                    </View>
                    <Text style={styles.featuredName}>{featuredCity.name}</Text>
                    <Text style={styles.featuredMeta}>
                      {featuredCity.state_region}{featuredCity.country ? `, ${featuredCity.country}` : ''}
                      {featuredCity.population ? ` • ${formatPopulation(featuredCity.population)}` : ''}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Popular Cities Grid */}
            {popularCities.length > 0 && (
              <View style={styles.popularSection}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>Popular Cities</Text>
                <View style={styles.gridContainer}>
                  {popularCities.map((city) => (
                    <TouchableOpacity
                      key={city.id}
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
                      onPress={() => handleCityPress(city)}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: city.cover_image_url || PLACEHOLDER_IMAGE }}
                        style={styles.gridImage}
                      />
                      <View style={styles.gridInfo}>
                        <Text style={[styles.gridName, { color: textColor }]} numberOfLines={1}>
                          {city.name}
                        </Text>
                        <Text style={[styles.gridLocation, { color: secondaryTextColor }]} numberOfLines={1}>
                          {city.state_region}{city.country ? `, ${city.country}` : ''}
                        </Text>
                        {city.total_signals && city.total_signals > 50 && (
                          <View style={styles.trendingBadge}>
                            <Ionicons name="flame" size={12} color={COLORS.trending} />
                            <Text style={styles.trendingText}>Trending</Text>
                          </View>
                        )}
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
    marginBottom: 24,
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
  featuredBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
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
  gridLocation: {
    fontSize: 12,
    marginBottom: 8,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingText: {
    color: COLORS.trending,
    fontSize: 11,
    fontWeight: '600',
  },
});
