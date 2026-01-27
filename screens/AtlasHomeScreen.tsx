/**
 * ATLAS HOME SCREEN - Premium Redesign
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Clean, minimal magazine-style layout
 * - Large featured story hero
 * - Just 2 trending guide cards
 * - Lots of breathing room
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import {
  getFeaturedArticle,
  getAllArticles,
  type AtlasArticle,
} from '../lib/atlas';
import { getCoverImageUrl } from '../lib/imageUtils';

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
const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/100';

export default function AtlasHomeScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [featuredArticle, setFeaturedArticle] = useState<AtlasArticle | null>(null);
  const [trendingArticles, setTrendingArticles] = useState<AtlasArticle[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [featured, articles] = await Promise.all([
        getFeaturedArticle(),
        getAllArticles({ limit: 4, offset: 0, shuffle: true }),
      ]);

      setFeaturedArticle(featured);
      // Get 2 articles that are not the featured one
      const trending = articles.filter(a => a.id !== featured?.id).slice(0, 2);
      setTrendingArticles(trending);
    } catch (error) {
      console.error('Error loading Atlas data:', error);
    } finally {
      setLoading(false);
    }
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

  const backgroundColor = isDark ? COLORS.background : COLORS.backgroundLight;
  const surfaceColor = isDark ? COLORS.surface : COLORS.surfaceLight;
  const textColor = isDark ? COLORS.textPrimary : '#1F2937';
  const secondaryTextColor = isDark ? COLORS.textSecondary : COLORS.textMuted;

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

        {/* Trending Guides */}
        <View style={styles.trendingSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Trending Guides</Text>
          <View style={styles.trendingGrid}>
            {trendingArticles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={[styles.trendingCard, { backgroundColor: surfaceColor }]}
                onPress={() => navigateToArticle(article)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: getCoverImageUrl(article.cover_image_url) || PLACEHOLDER_ARTICLE }}
                  style={styles.trendingImage}
                />
                <View style={styles.trendingContent}>
                  <Text style={[styles.trendingTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]} numberOfLines={2}>
                    {article.title}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Browse All Button */}
        <View style={styles.browseSection}>
          <TouchableOpacity
            style={[styles.browseButton, { backgroundColor: isDark ? COLORS.glassy : '#F3F4F6' }]}
            onPress={() => navigation.navigate('AtlasSearch')}
          >
            <Ionicons name="compass-outline" size={24} color={COLORS.accent} />
            <Text style={[styles.browseText, { color: textColor }]}>Browse All Articles</Text>
            <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
          </TouchableOpacity>
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
    paddingBottom: 24,
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
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
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
    fontSize: 15,
    fontWeight: '600',
  },

  // Trending Section
  trendingSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  trendingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendingCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  trendingImage: {
    width: '100%',
    height: 140,
  },
  trendingContent: {
    padding: 14,
  },
  trendingTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },

  // Browse Section
  browseSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  browseText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});
