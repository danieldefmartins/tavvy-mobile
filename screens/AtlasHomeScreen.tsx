// ============================================================================
// ATLAS HOME SCREEN v2.0
// ============================================================================
// Features:
// - Category filter chips (All, Local Guides, Owner Spotlights, etc.)
// - Featured article hero card with gradient overlay
// - Article grid layout (2 columns)
// - Trending section
// - Matches mockup design with teal/green accent colors
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import {
  getFeaturedArticle,
  getTrendingArticles,
  getCategories,
  getArticlesByCategory,
  type AtlasArticle,
  type AtlasCategory,
} from '../lib/atlas';
import { getCoverImageUrl, getThumbnailUrl } from '../lib/imageUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

// Tavvy brand colors
const TEAL_PRIMARY = '#0D9488';
const TEAL_LIGHT = '#5EEAD4';
const TEAL_BG = '#F0FDFA';

// Default placeholder images
const PLACEHOLDER_ARTICLE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/100';

// Category filter options
const FILTER_OPTIONS = [
  { id: 'all', name: 'All', slug: 'all' },
  { id: 'local-guides', name: 'Local Guides', slug: 'local-guides' },
  { id: 'owner-spotlights', name: 'Owner Spotlights', slug: 'owner-spotlights' },
  { id: 'tavvy-tips', name: 'Tavvy Tips', slug: 'tavvy-tips' },
  { id: 'food-drink', name: 'Food & Drink', slug: 'food-drink' },
  { id: 'services', name: 'Services', slug: 'services' },
];

export default function AtlasHomeScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Data states
  const [featuredArticle, setFeaturedArticle] = useState<AtlasArticle | null>(null);
  const [articles, setArticles] = useState<AtlasArticle[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<AtlasArticle[]>([]);
  const [categories, setCategories] = useState<AtlasCategory[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadFilteredArticles();
  }, [selectedFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [featured, trending, cats] = await Promise.all([
        getFeaturedArticle(),
        getTrendingArticles(10),
        getCategories(),
      ]);

      setFeaturedArticle(featured);
      setTrendingArticles(trending);
      setCategories(cats);
      setArticles(trending);
    } catch (error) {
      console.error('Error loading Atlas data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredArticles = async () => {
    if (selectedFilter === 'all') {
      setArticles(trendingArticles);
      return;
    }

    try {
      const category = categories.find(c => c.slug === selectedFilter);
      if (category) {
        const filtered = await getArticlesByCategory(category.id, { limit: 20 });
        setArticles(filtered);
      }
    } catch (error) {
      console.error('Error loading filtered articles:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const navigateToArticle = (article: AtlasArticle) => {
    // Check if it's an owner spotlight article
    if (article.article_template_type === 'owner_spotlight') {
      navigation.navigate('OwnerSpotlight', { article });
    } else {
      navigation.navigate('ArticleDetail', { article });
    }
  };

  // Render category filter chip
  const renderFilterChip = (filter: typeof FILTER_OPTIONS[0]) => {
    const isSelected = selectedFilter === filter.slug;
    return (
      <TouchableOpacity
        key={filter.id}
        style={[
          styles.filterChip,
          isSelected ? styles.filterChipSelected : styles.filterChipUnselected,
        ]}
        onPress={() => setSelectedFilter(filter.slug)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterChipText,
            isSelected ? styles.filterChipTextSelected : styles.filterChipTextUnselected,
          ]}
        >
          {filter.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render featured article hero card
  const renderFeaturedArticle = () => {
    if (!featuredArticle) return null;

    return (
      <TouchableOpacity
        style={styles.featuredCard}
        activeOpacity={0.95}
        onPress={() => navigateToArticle(featuredArticle)}
      >
        <Image
          source={{ uri: getCoverImageUrl(featuredArticle.cover_image_url) || PLACEHOLDER_ARTICLE }}
          style={styles.featuredImage}
        />
        <View style={styles.featuredOverlay}>
          {/* Category badge */}
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>
              {featuredArticle.category?.name || 'Local Guides'}
            </Text>
          </View>

          {/* Article info */}
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {featuredArticle.title}
            </Text>

            <View style={styles.featuredMeta}>
              <Image
                source={{ uri: featuredArticle.author_avatar_url || PLACEHOLDER_AVATAR }}
                style={styles.featuredAuthorAvatar}
              />
              <View>
                <Text style={styles.featuredAuthorName}>
                  {featuredArticle.author_name || 'Tavvy Team'}
                </Text>
                <Text style={styles.featuredReadTime}>
                  {featuredArticle.read_time_minutes} min read
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render article card for grid
  const renderArticleCard = (article: AtlasArticle, index: number) => {
    const isLeftCard = index % 2 === 0;
    return (
      <TouchableOpacity
        key={article.id}
        style={[
          styles.articleCard,
          { marginLeft: isLeftCard ? 0 : 8, marginRight: isLeftCard ? 8 : 0 },
        ]}
        activeOpacity={0.9}
        onPress={() => navigateToArticle(article)}
      >
        <Image
          source={{ uri: getThumbnailUrl(article.cover_image_url) || PLACEHOLDER_ARTICLE }}
          style={styles.articleCardImage}
        />
        <View style={styles.articleCardContent}>
          <Text style={styles.articleCardTitle} numberOfLines={2}>
            {article.title}
          </Text>
          <View style={styles.articleCardMeta}>
            <Image
              source={{ uri: article.author_avatar_url || PLACEHOLDER_AVATAR }}
              style={styles.articleCardAvatar}
            />
            <View style={styles.articleCardMetaText}>
              <Text style={styles.articleCardAuthor} numberOfLines={1}>
                {article.author_name || 'Tavvy Team'}
              </Text>
              <Text style={styles.articleCardReadTime}>
                {article.read_time_minutes} min read
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render article grid (2 columns)
  const renderArticleGrid = () => {
    // Skip the first article if it's the featured one
    const gridArticles = articles.filter(a => a.id !== featuredArticle?.id);
    const rows = [];
    
    for (let i = 0; i < gridArticles.length; i += 2) {
      const row = (
        <View key={i} style={styles.articleRow}>
          {renderArticleCard(gridArticles[i], 0)}
          {gridArticles[i + 1] && renderArticleCard(gridArticles[i + 1], 1)}
        </View>
      );
      rows.push(row);
    }
    
    return rows;
  };

  // Render trending section
  const renderTrendingSection = () => {
    if (trendingArticles.length === 0) return null;

    return (
      <View style={styles.trendingSection}>
        <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#111827' }]}>
          Trending
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trendingScroll}
        >
          {trendingArticles.slice(0, 5).map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.trendingCard}
              activeOpacity={0.9}
              onPress={() => navigateToArticle(article)}
            >
              <Image
                source={{ uri: getThumbnailUrl(article.cover_image_url) || PLACEHOLDER_ARTICLE }}
                style={styles.trendingImage}
              />
              <View style={styles.trendingContent}>
                <Text style={styles.trendingTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                <View style={styles.trendingMeta}>
                  <Ionicons name="heart" size={12} color="#EF4444" />
                  <Text style={styles.trendingLoves}>
                    {formatNumber(article.love_count || 0)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? theme.background : '#fff' }]}>
        <ActivityIndicator size="large" color={TEAL_PRIMARY} />
        <Text style={[styles.loadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Loading articles...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F9FAFB' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AtlasSearch', {})}
            style={styles.searchButton}
          >
            <Ionicons name="search" size={24} color={isDark ? '#fff' : '#374151'} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#111827' }]}>
            Atlas
          </Text>

          <TouchableOpacity style={styles.profileButton}>
            <Image
              source={{ uri: PLACEHOLDER_AVATAR }}
              style={styles.profileAvatar}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={TEAL_PRIMARY}
          />
        }
      >
        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTER_OPTIONS.map(renderFilterChip)}
        </ScrollView>

        {/* Featured Article */}
        {renderFeaturedArticle()}

        {/* Article Grid */}
        <View style={styles.gridContainer}>
          {renderArticleGrid()}
        </View>

        {/* Trending Section */}
        {renderTrendingSection()}

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
  safeArea: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // Filters
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: TEAL_PRIMARY,
  },
  filterChipUnselected: {
    backgroundColor: '#E5E7EB',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  filterChipTextUnselected: {
    color: '#374151',
  },

  scrollView: {
    flex: 1,
  },

  // Featured Card
  featuredCard: {
    marginHorizontal: 16,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 16,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'space-between',
    padding: 16,
  },
  featuredBadge: {
    backgroundColor: TEAL_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredContent: {
    marginTop: 'auto',
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  featuredAuthorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  featuredReadTime: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },

  // Article Grid
  gridContainer: {
    paddingHorizontal: 16,
  },
  articleRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  articleCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  articleCardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  articleCardContent: {
    padding: 12,
  },
  articleCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 10,
  },
  articleCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleCardAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  articleCardMetaText: {
    flex: 1,
  },
  articleCardAuthor: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  articleCardReadTime: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },

  // Trending Section
  trendingSection: {
    marginTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    paddingHorizontal: 16,
    letterSpacing: -0.5,
  },
  trendingScroll: {
    paddingHorizontal: 16,
  },
  trendingCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  trendingImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  trendingContent: {
    padding: 10,
  },
  trendingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
    marginBottom: 6,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingLoves: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
});
