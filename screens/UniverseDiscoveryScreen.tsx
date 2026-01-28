/**
 * UniverseDiscoveryScreen.tsx
 * Explore themed universes (theme parks, airports, campuses, etc.)
 * Path: screens/UniverseDiscoveryScreen.tsx
 *
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Full-width featured universe hero
 * - Icon-driven category filters
 * - 2x2 popular universes grid with activity signals
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { getCategories, type AtlasCategory, type AtlasUniverse } from '../lib/atlas';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Design System Colors - Uses theme from context for consistency
const COLORS = {
  accent: '#667EEA',
  activityHigh: '#EF4444',
  activityMedium: '#F59E0B',
};

// Default placeholder image when no image is available
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

// Category icons for the filter buttons
const CATEGORY_ICONS: Record<string, { icon: string; label: string }> = {
  'theme-parks': { icon: 'rocket-outline', label: 'Theme Parks' },
  'airports': { icon: 'airplane-outline', label: 'Airports' },
  'national-parks': { icon: 'leaf-outline', label: 'Parks' },
  'cities': { icon: 'business-outline', label: 'Cities' },
};

export default function UniverseDiscoveryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Real data from Supabase
  const [featuredUniverse, setFeaturedUniverse] = useState<AtlasUniverse | null>(null);
  const [popularUniverses, setPopularUniverses] = useState<AtlasUniverse[]>([]);
  const [categories, setCategories] = useState<AtlasCategory[]>([]);

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Refetch when category changes
  useEffect(() => {
    loadUniverses();
  }, [activeCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
      await loadUniverses();
    } catch (error) {
      console.error('Error loading universe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUniverses = async () => {
    try {
      // Query ALL universes (removed status filter for debugging)
      let featuredQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(1);

      let universesQuery = supabase
        .from('atlas_universes')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeCategory !== 'All') {
        const selectedCat = categories.find(c => c.name === activeCategory);
        if (selectedCat) {
          featuredQuery = featuredQuery.eq('category_id', selectedCat.id);
          universesQuery = universesQuery.eq('category_id', selectedCat.id);
        }
      }

      const [featuredResult, universesResult] = await Promise.all([
        featuredQuery.single(),
        universesQuery.limit(4),
      ]);

      // Debug logging
      console.log('Featured result:', featuredResult);
      console.log('Universes result:', universesResult);
      
      if (featuredResult.error) {
        console.error('Featured query error:', featuredResult.error);
      }
      if (universesResult.error) {
        console.error('Universes query error:', universesResult.error);
      }

      if (featuredResult.data) {
        setFeaturedUniverse(featuredResult.data);
      } else {
        setFeaturedUniverse(null);
      }

      setPopularUniverses(universesResult.data || []);
    } catch (error) {
      console.error('Error loading universes:', error);
    }
  };

  // Get activity level based on signals
  const getActivityLevel = (signals: number) => {
    if (signals > 100) return { label: 'High Activity', color: COLORS.activityHigh };
    if (signals > 50) return { label: 'Moderate', color: COLORS.activityMedium };
    return { label: 'Active', color: COLORS.accent };
  };

  // Get category type from universe
  const getCategoryType = (categoryId: string | null) => {
    if (!categoryId) return 'Universe';
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Universe';
  };

  const backgroundColor = theme.background;
  const surfaceColor = theme.surface;
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
          Loading universes...
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
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Universes</Text>
          <Text style={[styles.tagline, { color: COLORS.accent }]}>
            Explore curated worlds.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[
            styles.searchBar, 
            { 
              backgroundColor: isDark ? theme.surface : '#FFFFFF',
              borderWidth: isDark ? 0 : 1,
              borderColor: '#E5E7EB',
            }
          ]}>
            <Ionicons name="search" size={20} color={secondaryTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search parks, airports, cities..."
              placeholderTextColor={secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Featured Universe Hero */}
        {featuredUniverse && (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => navigation.navigate('UniverseLanding', { universeId: featuredUniverse.id })}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: featuredUniverse.banner_image_url || PLACEHOLDER_IMAGE }}
              style={styles.featuredImage}
            />
            {/* Featured Badge at top-left */}
            <View style={styles.featuredLabelContainer}>
              <View style={styles.featuredLabel}>
                <Text style={styles.featuredLabelText}>FEATURED UNIVERSE</Text>
              </View>
            </View>
            {/* Bottom gradient with title and button */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.85)']}
              style={styles.featuredGradient}
            >
              <View style={styles.featuredBottomRow}>
                <View style={styles.featuredTextContent}>
                  <Text style={styles.featuredName}>{featuredUniverse.name}</Text>
                  <Text style={styles.featuredMeta}>
                    {getCategoryType(featuredUniverse.category_id)} • {featuredUniverse.location || 'Explore Now'}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.exploreButton}
                  onPress={() => navigation.navigate('UniverseLanding', { universeId: featuredUniverse.id })}
                >
                  <Text style={styles.exploreButtonText}>Explore Universe</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Filter by Category */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Filter by Category</Text>
          <View style={styles.filterGrid}>
            {Object.entries(CATEGORY_ICONS).map(([slug, { icon, label }]) => {
              const isActive = activeCategory === label;
              return (
                <TouchableOpacity
                  key={slug}
                  style={[
                    styles.filterButton,
                    { 
                      backgroundColor: isDark ? theme.surface : '#FFFFFF',
                      borderWidth: isDark ? 0 : 1,
                      borderColor: isActive ? COLORS.accent : '#E5E7EB',
                    },
                    isActive && styles.filterButtonActive,
                  ]}
                  onPress={() => setActiveCategory(isActive ? 'All' : label)}
                >
                  <Ionicons
                    name={icon as any}
                    size={24}
                    color={isActive ? COLORS.accent : secondaryTextColor}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Popular Universes Grid */}
        <View style={styles.popularSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Popular Universes</Text>
          <View style={styles.gridContainer}>
            {popularUniverses.map((universe) => {
              const activity = getActivityLevel(universe.total_signals || 0);
              return (
                <TouchableOpacity
                  key={universe.id}
                  style={styles.gridCard}
                  onPress={() => navigation.navigate('UniverseLanding', { universeId: universe.id })}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: universe.thumbnail_image_url || PLACEHOLDER_IMAGE }}
                    style={styles.gridImage}
                  />
                  <View style={styles.gridContent}>
                    <Text style={[styles.gridName, { color: textColor }]} numberOfLines={1}>
                      {universe.name}
                    </Text>
                    <View style={styles.activityBadge}>
                      <Text style={styles.activityIcon}>🔥</Text>
                      <Text style={[styles.activityText, { color: COLORS.activityHigh }]}>
                        {activity.label}
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

  // Featured Card
  featuredCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
    marginBottom: 24,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredLabelContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 50,
  },
  featuredBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  featuredTextContent: {
    flex: 1,
    marginRight: 12,
  },
  featuredLabel: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredLabelText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuredName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  featuredMeta: {
    color: '#D1D5DB',
    fontSize: 13,
  },
  exploreButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Filter Section
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  filterGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    borderWidth: 2,
    borderColor: COLORS.accent,
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
    marginBottom: 20,
  },
  gridImage: {
    width: '100%',
    height: 110,
    borderRadius: 14,
  },
  gridContent: {
    paddingTop: 8,
  },
  gridName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activityIcon: {
    fontSize: 13,
  },
  activityText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
