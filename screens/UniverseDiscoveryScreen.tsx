/**
 * UniverseDiscoveryScreen.tsx
 * Explore themed universes (theme parks, airports, campuses, etc.)
 * Path: screens/UniverseDiscoveryScreen.tsx
 *
 * PREMIUM DARK MODE REDESIGN - February 2026
 * - Minimalist header with tagline
 * - Full-width featured universe hero with image background
 * - Icon-driven category filters with custom icons
 * - 2x2 popular universes grid with rounded image cards
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getCategories, type AtlasCategory, type AtlasUniverse } from '../lib/atlas';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Design System Colors
const COLORS = {
  accent: '#667EEA',
  activityHigh: '#EF4444',
  activityMedium: '#F59E0B',
};

// Default placeholder image when no image is available
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

// Category configuration with custom icons
const CATEGORY_CONFIG: Record<string, { iconType: 'ionicons' | 'material'; icon: string; label: string }> = {
  'theme-parks': { iconType: 'material', icon: 'ferris-wheel', label: 'Theme Parks' },
  'airports': { iconType: 'ionicons', icon: 'airplane', label: 'Airports' },
  'national-parks': { iconType: 'material', icon: 'tree', label: 'Parks' },
  'cities': { iconType: 'ionicons', icon: 'business', label: 'Cities' },
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
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.error('[UniverseDiscovery] Supabase is not configured! Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
      setLoading(false);
      return;
    }
    
    console.log('[UniverseDiscovery] Supabase is configured, loading data...');
    
    try {
      const cats = await getCategories();
      console.log('[UniverseDiscovery] Categories loaded:', cats.length);
      setCategories(cats);
      await loadUniverses();
    } catch (error) {
      console.error('[UniverseDiscovery] Error loading universe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUniverses = async () => {
    try {
      console.log('[UniverseDiscovery] Loading universes...');
      
      // Query for featured universe - use maybeSingle to avoid errors
      let featuredQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(1);

      // Query for all universes
      let universesQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (activeCategory !== 'All') {
        const selectedCat = categories.find(c => c.name === activeCategory);
        if (selectedCat) {
          featuredQuery = featuredQuery.eq('category_id', selectedCat.id);
          universesQuery = universesQuery.eq('category_id', selectedCat.id);
        }
      }

      const [featuredResult, universesResult] = await Promise.all([
        featuredQuery.maybeSingle(),
        universesQuery.limit(8),
      ]);

      // Debug logging
      console.log('[UniverseDiscovery] Featured result:', featuredResult);
      console.log('[UniverseDiscovery] Universes result:', universesResult);
      console.log('[UniverseDiscovery] Universes count:', universesResult.data?.length || 0);
      
      if (featuredResult.error) {
        console.error('[UniverseDiscovery] Featured query error:', featuredResult.error);
      }
      if (universesResult.error) {
        console.error('[UniverseDiscovery] Universes query error:', universesResult.error);
      }

      if (featuredResult.data) {
        setFeaturedUniverse(featuredResult.data);
      } else {
        // If no featured, use first from list
        setFeaturedUniverse(universesResult.data?.[0] || null);
      }

      setPopularUniverses(universesResult.data || []);
    } catch (error) {
      console.error('[UniverseDiscovery] Error loading universes:', error);
    }
  };

  // Get activity level based on signals
  const getActivityLevel = (signals: number) => {
    if (signals > 100) return { label: 'High Activity', color: COLORS.activityHigh };
    if (signals > 50) return { label: 'Moderate', color: COLORS.activityMedium };
    return { label: 'Active', color: COLORS.activityHigh };
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

  // Render category icon based on type
  const renderCategoryIcon = (config: { iconType: 'ionicons' | 'material'; icon: string }, size: number, color: string) => {
    if (config.iconType === 'material') {
      return <MaterialCommunityIcons name={config.icon as any} size={size} color={color} />;
    }
    return <Ionicons name={config.icon as any} size={size} color={color} />;
  };

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
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
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

        {/* Featured Universe Hero - Full Width Image Card */}
        {featuredUniverse && (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => navigation.navigate('UniverseLanding', { universeId: featuredUniverse.id })}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: featuredUniverse.banner_image_url || featuredUniverse.thumbnail_image_url || PLACEHOLDER_IMAGE }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
            {/* Featured Badge at top-left */}
            <View style={styles.featuredBadgeContainer}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>FEATURED UNIVERSE</Text>
              </View>
            </View>
            {/* Bottom gradient overlay with content */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
              style={styles.featuredGradient}
            >
              <View style={styles.featuredContent}>
                <View style={styles.featuredTextArea}>
                  <Text style={styles.featuredName} numberOfLines={2}>
                    {featuredUniverse.name}
                  </Text>
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
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {Object.entries(CATEGORY_CONFIG).map(([slug, config]) => {
              const isActive = activeCategory === config.label;
              return (
                <TouchableOpacity
                  key={slug}
                  style={[
                    styles.filterButton,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6',
                    },
                    isActive && styles.filterButtonActive,
                  ]}
                  onPress={() => setActiveCategory(isActive ? 'All' : config.label)}
                  activeOpacity={0.7}
                >
                  {renderCategoryIcon(config, 28, isActive ? COLORS.accent : (isDark ? '#9CA3AF' : '#6B7280'))}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
                  <View style={styles.gridImageContainer}>
                    <Image
                      source={{ uri: universe.thumbnail_image_url || universe.banner_image_url || PLACEHOLDER_IMAGE }}
                      style={styles.gridImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.gridContent}>
                    <Text style={[styles.gridName, { color: textColor }]} numberOfLines={1}>
                      {universe.name}
                    </Text>
                    <View style={styles.activityBadge}>
                      <Text style={styles.activityIcon}>🔥</Text>
                      <Text style={[styles.activityText, { color: activity.color }]}>
                        {activity.label}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Bottom spacing */}
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
    fontSize: 15,
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
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 17,
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

  // Featured Card - Full Width Image
  featuredCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 200,
    marginBottom: 28,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1F2937',
  },
  featuredBadgeContainer: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 10,
  },
  featuredBadge: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 60,
  },
  featuredContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  featuredTextArea: {
    flex: 1,
    marginRight: 12,
  },
  featuredName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredMeta: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
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
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
  },

  // Popular Section - Grid
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
  gridImageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
  gridImage: {
    width: '100%',
    height: 120,
  },
  gridContent: {
    paddingTop: 10,
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
