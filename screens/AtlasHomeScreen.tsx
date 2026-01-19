// ============================================================================
// ATLAS HOME SCREEN (UPDATED - FULL WIDTH SOLID HEADER)
// ============================================================================
// Features:
// - FULL WIDTH SOLID HEADER: No rounded corners, edge-to-edge banner (#0f1233)
// - White logo + "Atlas" section name
// - Elegant floating cards with soft shadows
// - NOW CONNECTED TO SUPABASE - Fetches real data from atlas_articles table
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
import { useTranslation } from 'react-i18next';
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

// Default placeholder images
const PLACEHOLDER_ARTICLE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';
const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/100';

export default function AtlasHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);

  // Real data from Supabase (initialized as null/empty)
  const [featuredArticle, setFeaturedArticle] = useState<AtlasArticle | null>(null);
  const [trendingArticles, setTrendingArticles] = useState<AtlasArticle[]>([]);
  const [universes, setUniverses] = useState<AtlasUniverse[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all data from Supabase in parallel
      const [featured, trending, featuredUniverses] = await Promise.all([
        getFeaturedArticle(),
        getTrendingArticles(5),
        getFeaturedUniverses(5),
      ]);

      setFeaturedArticle(featured);
      setTrendingArticles(trending);
      setUniverses(featuredUniverses);
    } catch (error) {
      console.error('Error loading Atlas data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  // Empty state component
  const EmptyState = ({ message, icon }: { message: string; icon: string }) => (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={48} color="#9CA3AF" />
      <Text style={[styles.emptyStateText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
        {message}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDark ? theme.background : '#fff' },
        ]}
      >
        <ActivityIndicator size="large" color="#2DD4BF" />
        <Text style={[styles.loadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Loading articles...
        </Text>
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
          {/* Header Content */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Atlas</Text>

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
        {featuredArticle ? (
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
              source={{ uri: featuredArticle.cover_image_url || PLACEHOLDER_ARTICLE }}
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
                      uri: featuredArticle.author_avatar_url || PLACEHOLDER_AVATAR,
                    }}
                    style={styles.featuredAuthorAvatar}
                  />
                  <Text style={styles.featuredAuthor}>
                    {featuredArticle.author_name || 'Tavvy Team'}
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
        ) : (
          <View style={styles.featuredEmptyCard}>
            <EmptyState message="No featured articles yet. Check back soon!" icon="newspaper-outline" />
          </View>
        )}

        {/* Trending Now */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#111827' }]}>
            Trending Now
          </Text>

          {trendingArticles.length > 0 ? (
            trendingArticles.map((article) => (
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
                <Image 
                  source={{ uri: article.cover_image_url || PLACEHOLDER_ARTICLE }} 
                  style={styles.trendingImage} 
                />

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
                        {(article.category?.name || 'GENERAL').toUpperCase()}
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
                        {formatNumber(article.love_count || 0)}
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
            ))
          ) : (
            <EmptyState message="No trending articles yet" icon="trending-up-outline" />
          )}
        </View>

        {/* Explore Universes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#111827' }]}>
            Explore Universes
          </Text>

          {universes.length > 0 ? (
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
                  <Image 
                    source={{ uri: universe.thumbnail_image_url || PLACEHOLDER_ARTICLE }} 
                    style={styles.universeImage} 
                  />
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
          ) : (
            <EmptyState message="No universes to explore yet" icon="planet-outline" />
          )}
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

  featuredEmptyCard: {
    marginHorizontal: 20,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  // FULL WIDTH SOLID HEADER - NO rounded corners
  headerGradient: {
    backgroundColor: '#0f1233',
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    height: 44,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
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
