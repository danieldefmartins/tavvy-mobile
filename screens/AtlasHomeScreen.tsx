// ============================================================================
// ATLAS HOME SCREEN
// ============================================================================
// Main discovery page for Tavvy Atlas
// Place this file in: screens/AtlasHomeScreen.tsx
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
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  getFeaturedArticle,
  getTrendingArticles,
  getFeaturedUniverses,
  getCategories,
  type AtlasArticle,
  type AtlasUniverse,
  type AtlasCategory,
} from '../lib/atlas';

export default function AtlasHomeScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [featuredArticle, setFeaturedArticle] = useState<AtlasArticle | null>(null);
  const [trendingArticles, setTrendingArticles] = useState<AtlasArticle[]>([]);
  const [universes, setUniverses] = useState<AtlasUniverse[]>([]);
  const [categories, setCategories] = useState<AtlasCategory[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [featured, trending, universesData, categoriesData] = await Promise.all([
        getFeaturedArticle(),
        getTrendingArticles(3),
        getFeaturedUniverses(6),
        getCategories(),
      ]);

      setFeaturedArticle(featured);
      setTrendingArticles(trending);
      setUniverses(universesData);
      setCategories(categoriesData);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🗺️</Text>
          <Text style={styles.headerTitle}>Tavvy Atlas</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('AtlasSearch' as never)}
          style={styles.searchButton}
        >
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Featured Article */}
        {featuredArticle && (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() =>
              navigation.navigate('ArticleDetail' as never, {
                article: featuredArticle,
              } as never)
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
              <Text style={styles.featuredTitle}>{featuredArticle.title}</Text>
              <View style={styles.featuredMeta}>
                <Text style={styles.featuredAuthor}>{featuredArticle.author_name}</Text>
                <Text style={styles.featuredDot}>•</Text>
                <Text style={styles.featuredReadTime}>
                  {featuredArticle.read_time_minutes} min read
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Trending Now */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          {trendingArticles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.trendingCard}
              onPress={() =>
                navigation.navigate('ArticleDetail' as never, { article } as never)
              }
            >
              <Image
                source={{ uri: article.cover_image_url }}
                style={styles.trendingImage}
              />
              <View style={styles.trendingContent}>
                <Text style={styles.trendingTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                <View style={styles.trendingMeta}>
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
                  <Text style={styles.trendingStats}>
                    {formatNumber(article.love_count)} ❤️
                  </Text>
                  <Text style={styles.trendingDot}>•</Text>
                  <Text style={styles.trendingReadTime}>
                    {article.read_time_minutes} min read
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Explore Universes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Universes</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.universesScroll}
          >
            {universes.map((universe) => (
              <TouchableOpacity
                key={universe.id}
                style={styles.universeCard}
                onPress={() =>
                  navigation.navigate('UniverseDetail' as never, { universe } as never)
                }
              >
                <Image
                  source={{ uri: universe.thumbnail_image_url }}
                  style={styles.universeImage}
                />
                <View style={styles.universeInfo}>
                  <Text style={styles.universeName} numberOfLines={1}>
                    {universe.name}
                  </Text>
                  <Text style={styles.universePlaces}>{universe.place_count} places</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { borderColor: category.color }]}
                onPress={() =>
                  navigation.navigate('CategoryBrowse' as never, { category } as never)
                }
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    backgroundColor: '#14b8a6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchButton: {
    padding: 8,
  },
  searchIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  featuredCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  featuredImage: {
    width: '100%',
    height: 240,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  featuredBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  featuredBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredAuthor: {
    color: '#fff',
    fontSize: 14,
  },
  featuredDot: {
    color: '#fff',
    marginHorizontal: 8,
  },
  featuredReadTime: {
    color: '#fff',
    fontSize: 14,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  trendingCard: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendingImage: {
    width: 120,
    height: 120,
  },
  trendingContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  trendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  trendingStats: {
    fontSize: 12,
    color: '#666',
  },
  trendingDot: {
    color: '#666',
    marginHorizontal: 6,
  },
  trendingReadTime: {
    fontSize: 12,
    color: '#666',
  },
  universesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  universeCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  universeImage: {
    width: '100%',
    height: 120,
  },
  universeInfo: {
    padding: 12,
  },
  universeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  universePlaces: {
    fontSize: 12,
    color: '#666',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCard: {
    width: '31%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
});
