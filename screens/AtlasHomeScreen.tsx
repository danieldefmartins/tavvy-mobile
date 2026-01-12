// ============================================================================
// ATLAS HOME SCREEN (UPDATED - FULL WIDTH SOLID HEADER)
// ============================================================================
// Features:
// - FULL WIDTH SOLID HEADER: No rounded corners, edge-to-edge banner (#0f1233)
// - White logo + "Atlas" section name
// - Elegant floating cards with soft shadows
// - Complete mock data
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import {
  getFeaturedArticle,
  getTrendingArticles,
  getFeaturedUniverses,
  getCategories,
  type AtlasArticle,
  type AtlasUniverse,
  type AtlasCategory,
} from '../lib/atlas';

const { width } = Dimensions.get('window');

// FULL MOCK DATA
const MOCK_FEATURED = {
  id: 'f1',
  title: 'The Ultimate LAX Survival Guide',
  slug: 'lax-survival-guide',
  excerpt: 'Everything you need to know about navigating Los Angeles International Airport.',
  content: 'This is the full content of the article...',
  cover_image_url:
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop',
  author_id: 'a1',
  author_name: 'Sarah Chen',
  author_avatar_url:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop',
  read_time_minutes: 12,
  view_count: 15420,
  love_count: 2400,
  not_for_me_count: 12,
  save_count: 850,
  is_featured: true,
  status: 'published',
  created_at: new Date().toISOString(),
  published_at: new Date().toISOString(),
  category_id: 'c1',
  universe_id: 'u2',
  category: { id: 'c1', name: 'Airports', color: '#0D9488', icon: '✈️' },
};

const MOCK_TRENDING = [
  {
    id: 't1',
    title: "New York City: First-Time Visitor's Guide",
    slug: 'nyc-guide',
    excerpt: 'The essential guide for your first trip to the Big Apple.',
    content: 'Content here...',
    cover_image_url:
      'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?q=80&w=2070&auto=format&fit=crop',
    author_id: 'a2',
    author_name: 'Mike Ross',
    author_avatar_url: 'https://via.placeholder.com/100',
    read_time_minutes: 11,
    view_count: 12000,
    love_count: 2000,
    not_for_me_count: 5,
    save_count: 600,
    is_featured: false,
    status: 'published',
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    category_id: 'c2',
    universe_id: null,
    category: { id: 'c2', name: 'Cities', color: '#3B82F6', icon: '🏙️' },
  },
  {
    id: 't2',
    title: "Disney World: First Timer's Complete Guide",
    slug: 'disney-guide',
    excerpt: 'How to maximize your magic at Disney World.',
    content: 'Content here...',
    cover_image_url:
      'https://images.unsplash.com/photo-1597466599360-3b9775841aec?q=80&w=2000&auto=format&fit=crop',
    author_id: 'a3',
    author_name: 'Jenny Wilson',
    author_avatar_url: 'https://via.placeholder.com/100',
    read_time_minutes: 15,
    view_count: 9800,
    love_count: 1900,
    not_for_me_count: 2,
    save_count: 450,
    is_featured: false,
    status: 'published',
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    category_id: 'c3',
    universe_id: 'u1',
    category: { id: 'c3', name: 'Theme Parks', color: '#8B5CF6', icon: '🎢' },
  },
  {
    id: 't3',
    title: 'Best Coffee in Seattle',
    slug: 'seattle-coffee',
    excerpt: 'Where to find the best beans in the Emerald City.',
    content: 'Content here...',
    cover_image_url:
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2000&auto=format&fit=crop',
    author_id: 'a4',
    author_name: 'Tom Cook',
    author_avatar_url: 'https://via.placeholder.com/100',
    read_time_minutes: 5,
    view_count: 18000,
    love_count: 3200,
    not_for_me_count: 0,
    save_count: 1200,
    is_featured: false,
    status: 'published',
    created_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    category_id: 'c4',
    universe_id: null,
    category: { id: 'c4', name: 'Food & Drink', color: '#10B981', icon: '☕' },
  },
];

const MOCK_UNIVERSES = [
  {
    id: 'u1',
    name: 'Disney World',
    place_count: 47,
    thumbnail_image_url:
      'https://images.unsplash.com/photo-1545580249-a3b334eb197f?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'u2',
    name: 'LAX Airport',
    place_count: 23,
    thumbnail_image_url:
      'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?q=80&w=1000&auto=format&fit=crop',
  },
  {
    id: 'u3',
    name: 'Yellowstone',
    place_count: 15,
    thumbnail_image_url:
      'https://images.unsplash.com/photo-1565108170253-2db022359792?q=80&w=1000&auto=format&fit=crop',
  },
];

export default function AtlasHomeScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);

  const [featuredArticle, setFeaturedArticle] = useState<AtlasArticle | null>(
    MOCK_FEATURED as any
  );
  const [trendingArticles, setTrendingArticles] = useState<AtlasArticle[]>(
    MOCK_TRENDING as any
  );
  const [universes, setUniverses] = useState<AtlasUniverse[]>(
    MOCK_UNIVERSES as any
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(false);
    } catch (error) {
      console.error('Error loading Atlas data:', error);
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDark ? theme.background : '#fff' },
        ]}
      >
        <ActivityIndicator size="large" color="#2DD4BF" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? theme.background : '#F9FAFB' },
      ]}
    >
      <StatusBar barStyle="light-content" />

      {/* FULL WIDTH SOLID HEADER - NO rounded corners */}
      <View style={styles.headerGradient}>
        <SafeAreaView>
          {/* Header Content with Logo */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require('../assets/brand/tavvy-logo-white.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerSectionName}>Atlas</Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('AtlasSearch', {})}
              style={styles.searchButton}
            >
              <Ionicons name="search" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Featured Article - Floating Card */}
        {featuredArticle && (
          <TouchableOpacity
            style={styles.featuredCard}
            activeOpacity={0.95}
            onPress={() =>
              navigation.navigate('ArticleDetail', {
                article: featuredArticle,
              })
            }
          >
            <Image
              source={{ uri: featuredArticle.cover_image_url }}
              style={styles.featuredImage}
            />
            <View style={styles.featuredOverlay}>
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>FEATURED</Text>
              </View>

              <View style={styles.featuredTextContainer}>
                <Text style={styles.featuredTitle}>{featuredArticle.title}</Text>

                <View style={styles.featuredMeta}>
                  <Image
                    source={{
                      uri:
                        featuredArticle.author_avatar_url ||
                        'https://via.placeholder.com/32',
                    }}
                    style={styles.featuredAuthorAvatar}
                  />
                  <Text style={styles.featuredAuthor}>
                    {featuredArticle.author_name}
                  </Text>
                  <Text style={styles.featuredDot}>•</Text>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color="#E5E7EB"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.featuredReadTime}>
                    {featuredArticle.read_time_minutes} min read
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Trending Now */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#111827' }]}>
            Trending Now
          </Text>

          {trendingArticles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={[
                styles.trendingCard,
                {
                  backgroundColor: isDark ? theme.surface : '#fff',
                  borderColor: isDark ? theme.border : '#F3F4F6',
                },
              ]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ArticleDetail', { article })}
            >
              <Image source={{ uri: article.cover_image_url }} style={styles.trendingImage} />

              <View style={styles.trendingContent}>
                <Text
                  style={[
                    styles.trendingTitle,
                    { color: isDark ? theme.text : '#1F2937' },
                  ]}
                  numberOfLines={2}
                >
                  {article.title}
                </Text>

                <View style={styles.trendingFooter}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: article.category?.color || '#14b8a6' },
                    ]}
                  >
                    <Text style={styles.categoryBadgeText}>
                      {article.category?.name.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.trendingStatsRow}>
                    <Ionicons name="heart" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text
                      style={[
                        styles.trendingStatsText,
                        { color: isDark ? theme.textSecondary : '#6B7280' },
                      ]}
                    >
                      {formatNumber(article.love_count)}
                    </Text>
                    <Text style={[styles.trendingDot, { color: isDark ? theme.border : '#D1D5DB' }]}>
                      •
                    </Text>
                    <Text
                      style={[
                        styles.trendingStatsText,
                        { color: isDark ? theme.textSecondary : '#6B7280' },
                      ]}
                    >
                      {article.read_time_minutes} min read
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Explore Universes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#111827' }]}>
            Explore Universes
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.universesScroll}
            contentContainerStyle={{ paddingRight: 20, paddingLeft: 20 }}
          >
            {universes.map((universe) => (
              <TouchableOpacity
                key={universe.id}
                style={[
                  styles.universeCard,
                  { backgroundColor: isDark ? theme.surface : '#fff' },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('UniverseDetail', { universeId: universe.id, universe })
                }
              >
                <Image source={{ uri: universe.thumbnail_image_url }} style={styles.universeImage} />
                <View style={styles.universeInfo}>
                  <Text
                    style={[
                      styles.universeName,
                      { color: isDark ? theme.text : '#111827' },
                    ]}
                    numberOfLines={1}
                  >
                    {universe.name}
                  </Text>
                  <Text
                    style={[
                      styles.universePlaces,
                      { color: isDark ? theme.textSecondary : '#6B7280' },
                    ]}
                  >
                    {universe.place_count} places
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  // FULL WIDTH SOLID HEADER - NO rounded corners
  headerGradient: {
    backgroundColor: '#0f1233',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 192,
    height: 58,
    marginRight: 8,
  },
  headerSectionName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
    marginLeft: -10,
    // fontFamily: 'SpaceGrotesk-Bold',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },

  // Featured Card
  featuredCard: {
    marginHorizontal: 20,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 8,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'space-between',
    padding: 20,
  },
  featuredBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featuredTextContainer: {},
  featuredTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 30,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredAuthorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  featuredAuthor: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  featuredDot: {
    color: 'rgba(255,255,255,0.7)',
    marginHorizontal: 8,
  },
  featuredReadTime: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '500',
  },

  // Sections
  section: {
    marginTop: 28,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    paddingHorizontal: 20,
    color: '#111827',
    letterSpacing: -0.5,
  },

  // Trending Cards
  trendingCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  trendingImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  trendingContent: {
    flex: 1,
    paddingLeft: 14,
    paddingVertical: 2,
    justifyContent: 'space-between',
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 22,
    marginBottom: 6,
  },
  trendingFooter: {},
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 6,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  trendingStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingStatsText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  trendingDot: {
    color: '#D1D5DB',
    marginHorizontal: 6,
  },

  // Universe Cards
  universesScroll: {
    marginHorizontal: 0,
  },
  universeCard: {
    width: 150,
    marginRight: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 8,
  },
  universeImage: {
    width: '100%',
    height: 110,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  universeInfo: {
    padding: 10,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  universeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  universePlaces: {
    fontSize: 12,
    color: '#6B7280',
  },
});
