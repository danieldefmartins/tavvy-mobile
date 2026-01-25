/**
 * UniverseDiscoveryScreen.tsx
 * Explore themed universes (theme parks, airports, campuses, etc.)
 * Path: screens/UniverseDiscoveryScreen.tsx
 *
 * UNIFIED HEADER DESIGN - Teal gradient (#0EA5E9 → #14B8A6)
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
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { getCategories, type AtlasCategory, type AtlasUniverse } from '../lib/atlas';
import { UnifiedHeader } from '../components/UnifiedHeader';

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

  const loadUniverses = async () => {
    try {
      // Build query for featured universe
      let featuredQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(1);

      // Build query for all universes
      let universesQuery = supabase
        .from('atlas_universes')
        .select('*')
        .eq('status', 'published')
        .order('total_signals', { ascending: false });

      // Apply category filter if not "All"
      if (activeCategory !== 'All') {
        const selectedCat = categories.find(c => c.name === activeCategory);
        if (selectedCat) {
          featuredQuery = featuredQuery.eq('category_id', selectedCat.id);
          universesQuery = universesQuery.eq('category_id', selectedCat.id);
        }
      }

      // Execute queries
      const [featuredResult, universesResult] = await Promise.all([
        featuredQuery.single(),
        universesQuery.limit(10),
      ]);

      // Set featured universe
      if (featuredResult.data) {
        setFeaturedUniverse(featuredResult.data);
      } else {
        setFeaturedUniverse(null);
      }

      // Split universes into popular and nearby (for now, just split the list)
      const allUniverses = universesResult.data || [];
      setPopularUniverses(allUniverses.slice(0, 4));
      setNearbyUniverses(allUniverses.slice(0, 3));

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
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={[styles.loadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Loading universes...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F9FAFB' }]}>
      {/* Unified Header */}
      <UnifiedHeader
        screenKey="universes"
        title="Universes"
        searchPlaceholder="Find a universe..."
        onSearch={setSearchQuery}
        showBackButton={false}
      />

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
                  { backgroundColor: isDark ? theme.surface : (isActive ? '#14B8A6' : '#E5E7EB') },
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
          <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#1F2937' }]}>Featured Universe</Text>

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
              <Ionicons name="navigate" size={18} color="#0EA5E9" />
              <Text style={[styles.sectionTitleInline, { color: isDark ? theme.text : '#1F2937' }]}>
                Nearby Universes
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See Map</Text>
            </TouchableOpacity>
          </View>

          {nearbyUniverses.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyContainer}>
              {nearbyUniverses.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
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
          <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#1F2937' }]}>Popular Destinations</Text>

          {popularUniverses.length > 0 ? (
            <View style={styles.gridContainer}>
              {popularUniverses.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
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

  // Content
  scrollContent: { paddingTop: 16 },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },

  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },

  categoryChipActive: {
    backgroundColor: '#0EA5E9',
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionTitleInline: {
    fontSize: 18,
    fontWeight: '700',
  },

  seeAllText: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '600',
  },

  // Featured Card
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 200,
  },

  featuredImage: {
    width: '100%',
    height: '100%',
  },

  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  popularTagText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  featuredName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },

  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  featuredMetaText: {
    color: '#E5E7EB',
    fontSize: 13,
    marginLeft: 4,
  },

  featuredDot: {
    color: '#9CA3AF',
    marginHorizontal: 8,
  },

  // Nearby Cards
  nearbyContainer: {
    paddingRight: 16,
  },

  nearbyCard: {
    width: 160,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },

  nearbyImage: {
    width: '100%',
    height: 100,
  },

  nearbyContent: {
    padding: 12,
  },

  nearbyName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  nearbyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  nearbyType: {
    fontSize: 12,
  },

  nearbyDist: {
    fontSize: 12,
    color: '#0EA5E9',
  },

  // Grid Cards
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  gridCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
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

  gridLocation: {
    fontSize: 12,
    marginBottom: 8,
  },

  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  gridType: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  gridBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  gridBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
