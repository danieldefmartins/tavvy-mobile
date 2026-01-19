/**
 * UniverseDiscoveryScreen.tsx
 * Explore themed universes (theme parks, airports, campuses, etc.)
 * Path: screens/UniverseDiscoveryScreen.tsx
 *
 * HEADER LAYOUT:
 * Left  = Logo
 * Center = "Universes"
 * Right = Profile icon
 * 
 * NOW CONNECTED TO SUPABASE - Fetches real data from atlas_universes table
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { getCategories, type AtlasCategory, type AtlasUniverse } from '../lib/atlas';

const { width } = Dimensions.get('window');

// Default placeholder image when no image is available
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

export default function UniverseDiscoveryScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Real data from Supabase
  const [featuredUniverse, setFeaturedUniverse] = useState<AtlasUniverse | null>(null);
  const [popularUniverses, setPopularUniverses] = useState<AtlasUniverse[]>([]);
  const [nearbyUniverses, setNearbyUniverses] = useState<AtlasUniverse[]>([]);
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
      // Load categories
      const cats = await getCategories();
      setCategories(cats);

      // Load universes
      await loadUniverses();
    } catch (error) {
      console.error('Error loading universe data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Specific universe IDs for our curated parks
  const FEATURED_PARK_IDS = [
    '122e166f-9a09-4b11-8441-f4f4052df0d1', // Walt Disney World
    '44a3967a-58d6-5b56-76c6-3a2816500f8f', // Universal Studios Florida
    'bb61f8a0-ec49-4cea-4f0c-d4bcf2dc526c', // Islands of Adventure
    'bf7beab6-45bb-492e-8f8b-c424f7eab9ed', // SeaWorld Orlando
  ];

  const loadUniverses = async () => {
    try {
      // Build query for featured universe (Walt Disney World)
      let featuredQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('id', '122e166f-9a09-4b11-8441-f4f4052df0d1')
        .single();

      // Build query for popular universes - only our curated parks
      let popularQuery = supabase
        .from('atlas_universes')
        .select('*')
        .in('id', FEATURED_PARK_IDS)
        .eq('status', 'published')
        .order('place_count', { ascending: false })
        .limit(5);

      // Build query for nearby universes - same parks for now
      let nearbyQuery = supabase
        .from('atlas_universes')
        .select('*')
        .in('id', FEATURED_PARK_IDS)
        .eq('status', 'published')
        .order('place_count', { ascending: false })
        .limit(4);

      // Apply category filter if not "All"
      if (activeCategory !== 'All') {
        const selectedCat = categories.find(c => c.name === activeCategory);
        if (selectedCat) {
          // Check if this is Theme Parks category - show our curated parks
          if (activeCategory === 'Theme Parks') {
            popularQuery = supabase
              .from('atlas_universes')
              .select('*')
              .in('id', FEATURED_PARK_IDS)
              .eq('status', 'published')
              .eq('category_id', selectedCat.id)
              .order('place_count', { ascending: false })
              .limit(5);
            
            nearbyQuery = supabase
              .from('atlas_universes')
              .select('*')
              .in('id', FEATURED_PARK_IDS)
              .eq('status', 'published')
              .eq('category_id', selectedCat.id)
              .order('place_count', { ascending: false })
              .limit(4);
          } else {
            // For other categories, show all universes in that category
            popularQuery = supabase
              .from('atlas_universes')
              .select('*')
              .eq('status', 'published')
              .eq('category_id', selectedCat.id)
              .order('place_count', { ascending: false })
              .limit(5);
            
            nearbyQuery = supabase
              .from('atlas_universes')
              .select('*')
              .eq('status', 'published')
              .eq('category_id', selectedCat.id)
              .order('place_count', { ascending: false })
              .limit(4);
            
            // For non-Theme Parks categories, don't show featured
            featuredQuery = supabase
              .from('atlas_universes')
              .select('*')
              .eq('status', 'published')
              .eq('category_id', selectedCat.id)
              .eq('is_featured', true)
              .order('place_count', { ascending: false })
              .limit(1);
          }
        }
      }

      // Execute queries
      const [featuredResult, popularResult, nearbyResult] = await Promise.all([
        featuredQuery,
        popularQuery,
        nearbyQuery,
      ]);

      // Set featured universe - handle both single result and array result
      if (featuredResult.data) {
        // If it's an array (from non-Theme Parks query), take the first item
        if (Array.isArray(featuredResult.data)) {
          setFeaturedUniverse(featuredResult.data[0] || null);
        } else {
          setFeaturedUniverse(featuredResult.data);
        }
      } else {
        setFeaturedUniverse(null);
      }

      // Set popular universes (up to 5)
      setPopularUniverses(popularResult.data || []);
      
      // Set nearby universes
      setNearbyUniverses(nearbyResult.data || []);

    } catch (error) {
      console.error('Error loading universes:', error);
    }
  };

  // Build category chips from real data
  const categoryChips = [
    { id: 'All', label: 'All', icon: null },
    ...categories.map(cat => ({
      id: cat.name,
      label: cat.name,
      icon: getCategoryIcon(cat.slug),
    })),
  ];

  // Map category slug to icon
  function getCategoryIcon(slug: string): string | null {
    const iconMap: Record<string, string> = {
      'theme-parks': 'ticket-outline',
      'airports': 'airplane-outline',
      'national-parks': 'leaf-outline',
      'cities': 'business-outline',
      'food-drink': 'restaurant-outline',
      'travel-tips': 'compass-outline',
    };
    return iconMap[slug] || null;
  }

  // Empty state component
  const EmptyState = ({ message }: { message: string }) => (
    <View style={styles.emptyState}>
      <Ionicons name="planet-outline" size={48} color="#9CA3AF" />
      <Text style={[styles.emptyStateText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
        {message}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? theme.background : '#F9FAFB' }]}>
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={[styles.loadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Loading universes...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F9FAFB' }]}>
      <StatusBar barStyle="light-content" />

      {/* Full-width gradient header */}
      <LinearGradient
        colors={['#06B6D4', '#0891B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          {/* Header row: Title (L) / Icon (R) */}
          <View style={styles.headerRow}>
            {/* Left: Title */}
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Universes</Text>
            </View>

            {/* Right: Profile */}
            <TouchableOpacity style={styles.headerRight}>
              <Ionicons name="person-circle-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.headerSubtitle}>Explore worlds with many places inside</Text>

          {/* Search bar */}
          <View style={[styles.searchContainer, { backgroundColor: isDark ? theme.surface : '#F3F4F6', borderWidth: isDark ? 0 : 1, borderColor: '#E5E7EB' }]}>
            <Ionicons name="search" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} style={styles.searchIcon} />
            <TextInput
              placeholder="Find a universe..."
              placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
              style={[styles.searchInput, { color: isDark ? '#fff' : '#111827' }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {categoryChips.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: isDark ? theme.surface : (isActive ? '#06B6D4' : '#E5E7EB') },
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(cat.id)}
              >
                {cat.icon && (
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={isActive ? '#fff' : '#9CA3AF'}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text style={[styles.categoryText, { color: isActive ? '#fff' : (isDark ? '#E5E7EB' : '#374151') }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured Universe */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#06B6D4' }]}>Featured Universe</Text>

          {featuredUniverse ? (
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() => navigation.navigate('UniverseLanding', { universeId: featuredUniverse.id })}
            >
              <Image
                source={{ uri: featuredUniverse.banner_image_url || PLACEHOLDER_IMAGE }}
                style={styles.featuredImage}
              />
              <View style={styles.featuredOverlay}>
                <View style={styles.popularTag}>
                  <Ionicons name="flame" size={12} color="#F59E0B" />
                  <Text style={styles.popularTagText}>Popular</Text>
                </View>

                <Text style={styles.featuredName}>{featuredUniverse.name}</Text>

                <View style={styles.featuredMeta}>
                  <Ionicons name="location" size={14} color="#EF4444" />
                  <Text style={styles.featuredMetaText}>{featuredUniverse.location || 'Location TBD'}</Text>
                  <Text style={styles.featuredDot}>•</Text>
                  <Text style={styles.featuredMetaText}>{featuredUniverse.place_count} Places</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <EmptyState message="No featured universes yet. Check back soon!" />
          )}
        </View>

        {/* Nearby Universes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="navigate" size={18} color="#06B6D4" />
              <Text style={[styles.sectionTitleInline, { color: '#06B6D4' }]}>
                Nearby Universes
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('UniverseMap')}>
              <Text style={styles.seeAllText}>See Map</Text>
            </TouchableOpacity>
          </View>

          {nearbyUniverses.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyContainer}>
              {nearbyUniverses.map((item, index) => (
                <TouchableOpacity 
                  key={`nearby-${item.id}-${index}`} 
                  style={[styles.nearbyCard, { backgroundColor: isDark ? theme.surface : '#111827' }]}
                  onPress={() => navigation.navigate('UniverseLanding', { universeId: item.id })}
                >
                  <Image source={{ uri: item.thumbnail_image_url || PLACEHOLDER_IMAGE }} style={styles.nearbyImage} />
                  <View style={styles.nearbyContent}>
                    <Text style={[styles.nearbyName, { color: '#E5E7EB' }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.nearbyMeta}>
                      <Text style={[styles.nearbyType, { color: '#9CA3AF' }]}>{item.place_count} places</Text>
                      <Text style={styles.nearbyDist}>{item.total_signals || 0} signals</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <EmptyState message="No nearby universes found" />
          )}
        </View>

        {/* Popular Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#06B6D4' }]}>Popular Destinations</Text>

          {popularUniverses.length > 0 ? (
            <View style={styles.gridContainer}>
              {popularUniverses.map((item, index) => (
                <TouchableOpacity 
                  key={`popular-${item.id}-${index}`} 
                  style={[styles.gridCard, { backgroundColor: isDark ? theme.surface : '#111827' }]}
                  onPress={() => navigation.navigate('UniverseLanding', { universeId: item.id })}
                >
                  <Image source={{ uri: item.thumbnail_image_url || PLACEHOLDER_IMAGE }} style={styles.gridImage} />
                  <View style={styles.gridContent}>
                    <Text style={[styles.gridName, { color: '#E5E7EB' }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.gridLocation, { color: '#9CA3AF' }]} numberOfLines={1}>
                      {item.location || 'Location TBD'}
                    </Text>
                    <View style={styles.gridFooter}>
                      <Text style={styles.gridType}>{item.article_count || 0} articles</Text>
                      <View style={[styles.gridBadge, { backgroundColor: '#0B1220' }]}>
                        <Text style={[styles.gridBadgeText, { color: '#E5E7EB' }]}>{item.place_count}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EmptyState message="No popular destinations yet" />
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },

  headerGradient: {
    paddingBottom: 14,
  },

  // Header layout
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  headerRight: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },

  headerSubtitle: {
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'left',
  },

  // Search
  searchContainer: {
    marginHorizontal: 20,
    height: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },

  searchIcon: { marginRight: 12 },

  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  // Content
  scrollContent: { paddingTop: 16 },

  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },

  categoryChipActive: {
    backgroundColor: '#06B6D4',
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },

  section: { marginBottom: 28 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 20,
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  sectionTitleInline: {
    fontSize: 18,
    fontWeight: '700',
  },

  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06B6D4',
  },

  // Featured
  featuredCard: {
    marginHorizontal: 20,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },

  featuredImage: { width: '100%', height: '100%' },

  featuredOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 60,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },

  popularTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  featuredName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  featuredMeta: { flexDirection: 'row', alignItems: 'center' },

  featuredMetaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },

  featuredDot: { color: '#fff', marginHorizontal: 8 },

  // Nearby
  nearbyContainer: { paddingHorizontal: 20 },

  nearbyCard: {
    width: 160,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  nearbyImage: { width: '100%', height: 100 },

  nearbyContent: { padding: 10 },

  nearbyName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  nearbyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  nearbyType: { fontSize: 11 },

  nearbyDist: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06B6D4',
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },

  gridCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  gridImage: { width: '100%', height: 110 },

  gridContent: { padding: 12 },

  gridName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },

  gridLocation: { fontSize: 12, marginBottom: 8 },

  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  gridType: {
    fontSize: 11,
    color: '#06B6D4',
    fontWeight: '700',
  },

  gridBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  gridBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
