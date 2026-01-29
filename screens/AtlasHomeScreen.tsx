/**
 * ATLAS HOME SCREEN
 * 
 * Features:
 * - Search bar that searches title, excerpt, content, and author
 * - Category filter chips
 * - All articles displayed in grid
 * - Featured story hero
 */

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
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { type AtlasArticle } from '../lib/atlas';
import { getCoverImageUrl } from '../lib/imageUtils';
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
};

// Default placeholder images
const PLACEHOLDER_ARTICLE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
const PLACEHOLDER_AVATAR = 'https://ui-avatars.com/api/?name=T&background=667EEA&color=fff&size=100';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export default function AtlasHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Data states
  const [allArticles, setAllArticles] = useState<AtlasArticle[]>([]);
  const [displayedArticles, setDisplayedArticles] = useState<AtlasArticle[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('atlas_categories')
        .select('id, name, slug, icon')
        .order('display_order', { ascending: true });

      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch all published articles with content for full-text search
      const { data: articles } = await supabase
        .from('atlas_articles')
        .select('id, title, slug, excerpt, content, cover_image_url, author_name, author_avatar_url, read_time_minutes, view_count, love_count, category_id, published_at, article_template_type')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (articles && articles.length > 0) {
        setAllArticles(articles as AtlasArticle[]);
        setDisplayedArticles(articles as AtlasArticle[]);
      }
    } catch (error) {
      console.error('Error loading Atlas data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search articles
  const filterArticles = useCallback((categoryId: string | null, query: string) => {
    let filtered = allArticles;

    // Filter by category
    if (categoryId) {
      filtered = filtered.filter(a => a.category_id === categoryId);
    }

    // Search in title, excerpt, content, and author name
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(lowerQuery) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(lowerQuery)) ||
        (article.content && article.content.toLowerCase().includes(lowerQuery)) ||
        (article.author_name && article.author_name.toLowerCase().includes(lowerQuery))
      );
    }

    setDisplayedArticles(filtered);
  }, [allArticles]);

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    filterArticles(categoryId, searchQuery);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterArticles(selectedCategory, query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    filterArticles(selectedCategory, '');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const navigateToArticle = (article: AtlasArticle) => {
    if (article.article_template_type === 'owner_spotlight') {
      navigation.navigate('OwnerSpotlight', { article });
    } else {
      navigation.navigate('ArticleDetail', { article });
    }
  };

  const backgroundColor = theme.background;
  const surfaceColor = theme.surface;
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;
  const inputBgColor = isDark ? '#2C2C2E' : '#E5E5EA';

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
          Loading articles...
        </Text>
      </View>
    );
  }

  // Get featured article (first one) and rest for grid
  const featuredArticle = displayedArticles.length > 0 ? displayedArticles[0] : null;
  const gridArticles = displayedArticles.slice(1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Atlas</Text>
          <Text style={[styles.tagline, { color: COLORS.accent }]}>
            Your guide to the exceptional.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: inputBgColor }]}>
            <Ionicons name="search" size={20} color={secondaryTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search articles..."
              placeholderTextColor={secondaryTextColor}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={secondaryTextColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {/* All chip */}
          <TouchableOpacity
            style={[
              styles.filterChip,
              { backgroundColor: selectedCategory === null ? COLORS.accent : surfaceColor }
            ]}
            onPress={() => handleCategorySelect(null)}
          >
            <Text style={styles.chipIcon}>📚</Text>
            <Text style={[
              styles.chipText,
              { color: selectedCategory === null ? '#FFFFFF' : (isDark ? '#E5E7EB' : '#374151') }
            ]}>
              All
            </Text>
          </TouchableOpacity>
          
          {/* Category chips */}
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterChip,
                { backgroundColor: selectedCategory === category.id ? COLORS.accent : surfaceColor }
              ]}
              onPress={() => handleCategorySelect(category.id)}
            >
              {category.icon && <Text style={styles.chipIcon}>{category.icon}</Text>}
              <Text style={[
                styles.chipText,
                { color: selectedCategory === category.id ? '#FFFFFF' : (isDark ? '#E5E7EB' : '#374151') }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results Count */}
        {searchQuery.length > 0 && (
          <View style={styles.resultsCount}>
            <Text style={[styles.resultsText, { color: secondaryTextColor }]}>
              {displayedArticles.length} result{displayedArticles.length !== 1 ? 's' : ''} for "{searchQuery}"
            </Text>
          </View>
        )}

        {/* No Results */}
        {displayedArticles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={secondaryTextColor} />
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>
              No articles found{searchQuery ? ` matching "${searchQuery}"` : ' in this category'}.
            </Text>
          </View>
        ) : (
          <>
            {/* Featured Story Hero */}
            {featuredArticle && (
              <TouchableOpacity
                style={styles.featuredCard}
                onPress={() => navigateToArticle(featuredArticle)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: getCoverImageUrl(featuredArticle.cover_image_url) || PLACEHOLDER_ARTICLE }}
                  style={styles.featuredImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.85)']}
                  style={styles.featuredGradient}
                >
                  <View style={styles.featuredLabel}>
                    <Text style={styles.featuredLabelText}>FEATURED STORY</Text>
                  </View>
                  <Text style={styles.featuredTitle} numberOfLines={2}>
                    {featuredArticle.title}
                  </Text>
                  <View style={styles.authorRow}>
                    <Image
                      source={{ uri: featuredArticle.author_avatar_url || PLACEHOLDER_AVATAR }}
                      style={styles.authorAvatar}
                    />
                    <Text style={styles.authorName}>
                      By {featuredArticle.author_name || 'Tavvy Team'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.readButton}
                    onPress={() => navigateToArticle(featuredArticle)}
                  >
                    <Text style={styles.readButtonText}>Read Article</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* All Articles Grid */}
            {gridArticles.length > 0 && (
              <View style={styles.articlesSection}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                  {searchQuery ? 'Search Results' : 'All Articles'}
                </Text>
                <View style={styles.articlesGrid}>
                  {gridArticles.map((article) => (
                    <TouchableOpacity
                      key={article.id}
                      style={[styles.articleCard, { backgroundColor: surfaceColor }]}
                      onPress={() => navigateToArticle(article)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: getCoverImageUrl(article.cover_image_url) || PLACEHOLDER_ARTICLE }}
                        style={styles.articleImage}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.articleOverlay}
                      >
                        <Text style={styles.articleTitle} numberOfLines={2}>
                          {article.title}
                        </Text>
                      </LinearGradient>
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
    fontSize: 36,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },

  // Filter Chips
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    gap: 8,
  },
  chipIcon: {
    fontSize: 16,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Results Count
  resultsCount: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  resultsText: {
    fontSize: 14,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },

  // Featured Card
  featuredCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    height: 320,
    marginBottom: 32,
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
    padding: 24,
    paddingTop: 80,
  },
  featuredLabel: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  featuredLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  authorName: {
    color: '#E5E7EB',
    fontSize: 14,
  },
  readButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  readButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Articles Section
  articlesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  articlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  articleCard: {
    width: (width - 52) / 2,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  articleImage: {
    width: '100%',
    height: '100%',
  },
  articleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  articleTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
