// ============================================================================
// ATLAS HOME SCREEN v2.1
// ============================================================================
// Features:
// - Dynamic category filters based on actual articles
// - Display all articles on load (not just on search)
// - Infinite scroll to load more articles
// - Randomized/mixed article display
// - Working "All" filter
// ============================================================================

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  getAllArticles,
  type AtlasArticle,
  type AtlasCategory,
} from '../lib/atlas';
import { supabase } from '../lib/supabaseClient';
import { getCoverImageUrl, getThumbnailUrl } from '../lib/imageUtils';
import { UnifiedHeader } from '../components/UnifiedHeader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

// Atlas brand colors (Purple theme)
const ATLAS_PRIMARY = '#7C3AED';
const ATLAS_LIGHT = '#A78BFA';
const ATLAS_BG = '#F5F3FF';

// Default placeholder images
const PLACEHOLDER_ARTICLE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/100';

// Dynamic filter types based on article content
type FilterType = 'all' | 'family' | 'restaurants' | 'city';

interface FilterOption {
  id: FilterType;
  name: string;
  keywords: string[];
}

// Filter options based on article content patterns
const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', name: 'All', keywords: [] },
  { id: 'family', name: 'Family & Kids', keywords: ['kids', 'family', 'children'] },
  { id: 'restaurants', name: 'Restaurants', keywords: ['restaurant', 'best restaurants', 'eats', 'food'] },
  { id: 'city', name: 'City Guides', keywords: ['things to do', 'guide'] },
];

export default function AtlasHomeScreen() {
  const navigation = useNavigation();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Data states
  const [featuredArticle, setFeaturedArticle] = useState<AtlasArticle | null>(null);
  const [allArticles, setAllArticles] = useState<AtlasArticle[]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<AtlasArticle[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<AtlasArticle[]>([]);
  const [followingArticles, setFollowingArticles] = useState<AtlasArticle[]>([]);
  const [categories, setCategories] = useState<AtlasCategory[]>([]);
  
  // Pagination
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [selectedFilter, allArticles]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [featured, articles, cats] = await Promise.all([
        getFeaturedArticle(),
        getAllArticles({ limit: PAGE_SIZE, offset: 0, shuffle: true }),
        getCategories(),
      ]);

      setFeaturedArticle(featured);
      setAllArticles(articles);
      setTrendingArticles(articles.slice(0, 10));
      setCategories(cats);
      setOffset(PAGE_SIZE);
      setHasMore(articles.length >= PAGE_SIZE);

      // Load articles from followed authors
      await loadFollowingArticles();
    } catch (error) {
      console.error('Error loading Atlas data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowingArticles = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFollowingArticles([]);
        return;
      }

      // Get followed authors
      const { data: follows } = await supabase
        .from('atlas_author_follows')
        .select('author_name')
        .eq('user_id', user.id);

      if (!follows || follows.length === 0) {
        setFollowingArticles([]);
        return;
      }

      const authorNames = follows.map(f => f.author_name);

      // Get articles from followed authors
      const { data: articles } = await supabase
        .from('atlas_articles')
        .select(`
          *,
          category:atlas_categories(*)
        `)
        .in('author_name', authorNames)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10);

      setFollowingArticles(articles || []);
    } catch (error) {
      console.error('Error loading following articles:', error);
    }
  };

  const loadMoreArticles = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const moreArticles = await getAllArticles({ 
        limit: PAGE_SIZE, 
        offset: offset,
        shuffle: true 
      });
      
      if (moreArticles.length > 0) {
        setAllArticles(prev => [...prev, ...moreArticles]);
        setOffset(prev => prev + PAGE_SIZE);
        setHasMore(moreArticles.length >= PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const filterArticles = () => {
    if (selectedFilter === 'all') {
      setDisplayedArticles(allArticles);
      return;
    }

    const filterOption = FILTER_OPTIONS.find(f => f.id === selectedFilter);
    if (!filterOption) {
      setDisplayedArticles(allArticles);
      return;
    }

    const filtered = allArticles.filter(article => {
      const titleLower = article.title.toLowerCase();
      const excerptLower = (article.excerpt || '').toLowerCase();
      
      return filterOption.keywords.some(keyword => 
        titleLower.includes(keyword.toLowerCase()) || 
        excerptLower.includes(keyword.toLowerCase())
      );
    });

    setDisplayedArticles(filtered);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setOffset(0);
    setHasMore(true);
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
  const renderFilterChip = (filter: FilterOption) => {
    const isSelected = selectedFilter === filter.id;
    
    // Count articles for this filter
    let count = 0;
    if (filter.id === 'all') {
      count = allArticles.length;
    } else {
      count = allArticles.filter(article => {
        const titleLower = article.title.toLowerCase();
        const excerptLower = (article.excerpt || '').toLowerCase();
        return filter.keywords.some(keyword => 
          titleLower.includes(keyword.toLowerCase()) || 
          excerptLower.includes(keyword.toLowerCase())
        );
      }).length;
    }

    return (
      <TouchableOpacity
        key={filter.id}
        style={[
          styles.filterChip,
          isSelected ? styles.filterChipSelected : styles.filterChipUnselected,
        ]}
        onPress={() => setSelectedFilter(filter.id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterChipText,
            isSelected ? styles.filterChipTextSelected : styles.filterChipTextUnselected,
          ]}
        >
          {filter.name} ({count})
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
              {featuredArticle.category?.name || 'Featured'}
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
    const gridArticles = displayedArticles.filter(a => a.id !== featuredArticle?.id);
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

  // Render following section (articles from followed authors)
  const renderFollowingSection = () => {
    if (followingArticles.length === 0) return null;

    return (
      <View style={styles.followingSection}>
        <View style={styles.followingSectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#111827' }]}>
            From Authors You Follow
          </Text>
          <View style={styles.followingBadge}>
            <Ionicons name="person-circle" size={14} color="#fff" />
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.followingScroll}
        >
          {followingArticles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.followingCard}
              activeOpacity={0.9}
              onPress={() => navigateToArticle(article)}
            >
              <Image
                source={{ uri: getThumbnailUrl(article.cover_image_url) || PLACEHOLDER_ARTICLE }}
                style={styles.followingImage}
              />
              <View style={styles.followingContent}>
                <Text style={styles.followingTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                <View style={styles.followingMeta}>
                  <Image
                    source={{ uri: article.author_avatar_url || PLACEHOLDER_AVATAR }}
                    style={styles.followingAuthorAvatar}
                  />
                  <Text style={styles.followingAuthorName} numberOfLines={1}>
                    {article.author_name || 'Tavvy Team'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render load more indicator
  const renderLoadMoreIndicator = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={ATLAS_PRIMARY} />
        <Text style={styles.loadMoreText}>Loading more articles...</Text>
      </View>
    );
  };

  // Handle scroll to load more
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 100;
    
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadMoreArticles();
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? theme.background : '#fff' }]}>
        <ActivityIndicator size="large" color={ATLAS_PRIMARY} />
        <Text style={[styles.loadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Loading articles...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F9FAFB' }]}>
      <StatusBar barStyle="light-content" />

      {/* Unified Header */}
      <UnifiedHeader
        screenKey="atlas"
        title="Atlas"
        searchPlaceholder="Search articles..."
        onSearch={(text) => navigation.navigate('AtlasSearch', { query: text })}
        showBackButton={false}
      />

      {/* Category Filters - Fixed outside ScrollView */}
      <View style={styles.filterBarContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContent}
        >
          {FILTER_OPTIONS.map(renderFilterChip)}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ATLAS_PRIMARY}
          />
        }
      >

        {/* Results count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {displayedArticles.length} article{displayedArticles.length !== 1 ? 's' : ''}
            {selectedFilter !== 'all' && ` in ${FILTER_OPTIONS.find(f => f.id === selectedFilter)?.name}`}
          </Text>
        </View>

        {/* Featured Article */}
        {selectedFilter === 'all' && renderFeaturedArticle()}

        {/* Following Section - Articles from followed authors */}
        {selectedFilter === 'all' && renderFollowingSection()}

        {/* Article Grid */}
        <View style={styles.gridContainer}>
          {displayedArticles.length > 0 ? (
            renderArticleGrid()
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No articles found for this filter</Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setSelectedFilter('all')}
              >
                <Text style={styles.emptyStateButtonText}>View All Articles</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Load More Indicator */}
        {renderLoadMoreIndicator()}

        {/* Trending Section */}
        {selectedFilter === 'all' && renderTrendingSection()}

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

  // Filter Bar - Realtors-style design with elegant white shade separator
  filterBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Legacy filter styles (kept for compatibility)
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: `rgba(124, 58, 237, 0.1)`,
    gap: 6,
  },
  filterChipSelected: {
    backgroundColor: ATLAS_PRIMARY,
  },
  filterChipUnselected: {
    backgroundColor: `rgba(124, 58, 237, 0.1)`,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  filterChipTextUnselected: {
    color: ATLAS_PRIMARY,
  },

  // Results header
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: '#6B7280',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
    justifyContent: 'space-between',
  },
  featuredBadge: {
    backgroundColor: ATLAS_PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredContent: {
    gap: 12,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'left',
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featuredAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  },

  // Grid
  gridContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  articleCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E5E7EB',
  },
  articleCardContent: {
    padding: 12,
  },
  articleCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 8,
  },
  articleCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  articleCardAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
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
  },

  // Trending
  trendingSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  trendingScroll: {
    paddingHorizontal: 16,
  },
  trendingCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  trendingImage: {
    width: '100%',
    height: 100,
    backgroundColor: '#E5E7EB',
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
    gap: 4,
  },
  trendingLoves: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: ATLAS_PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Load more
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Following section
  followingSection: {
    marginTop: 16,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  followingSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  followingBadge: {
    backgroundColor: ATLAS_PRIMARY,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingScroll: {
    paddingHorizontal: 16,
  },
  followingCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: ATLAS_LIGHT,
  },
  followingImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E5E7EB',
  },
  followingContent: {
    padding: 12,
  },
  followingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 8,
  },
  followingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followingAuthorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  followingAuthorName: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
});
