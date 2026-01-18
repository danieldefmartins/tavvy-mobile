// ============================================================================
// CATEGORY BROWSE SCREEN
// ============================================================================
// Browse articles filtered by category (Airports, Theme Parks, etc.)
// Place this file in: screens/CategoryBrowseScreen.tsx
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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  getArticlesByCategory,
  type AtlasCategory,
  type AtlasArticle,
} from '../lib/atlas';

type SortOption = 'popular' | 'recent' | 'most_loved';

export default function CategoryBrowseScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = route.params as { category: AtlasCategory };
  const { t } = useTranslation();

  const [articles, setArticles] = useState<AtlasArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [category.id, sortBy]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await getArticlesByCategory(category.id, {
        limit: 20,
        offset: 0,
        sortBy,
      });
      setArticles(data);
      setHasMore(data.length === 20);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;

    try {
      const data = await getArticlesByCategory(category.id, {
        limit: 20,
        offset: articles.length,
        sortBy,
      });
      setArticles([...articles, ...data]);
      setHasMore(data.length === 20);
    } catch (error) {
      console.error('Error loading more articles:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getSortLabel = (sort: SortOption): string => {
    switch (sort) {
      case 'popular':
        return t('atlas.mostPopular');
      case 'recent':
        return t('atlas.mostRecent');
      case 'most_loved':
        return t('atlas.mostLoved');
      default:
        return t('atlas.sortBy');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Category Info */}
      <View style={[styles.categoryInfo, { backgroundColor: `${category.color}20` }]}>
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>
        <Text style={styles.categoryStats}>
          {t('atlas.articlesAvailable', { count: articles.length })}
        </Text>
      </View>

      {/* Sort Options */}
      <View style={styles.sortBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'popular' && styles.sortChipActive]}
            onPress={() => setSortBy('popular')}
          >
            <Text
              style={[
                styles.sortChipText,
                sortBy === 'popular' && styles.sortChipTextActive,
              ]}
            >
              {t('atlas.mostPopular')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'recent' && styles.sortChipActive]}
            onPress={() => setSortBy('recent')}
          >
            <Text
              style={[
                styles.sortChipText,
                sortBy === 'recent' && styles.sortChipTextActive,
              ]}
            >
              {t('atlas.mostRecent')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'most_loved' && styles.sortChipActive]}
            onPress={() => setSortBy('most_loved')}
          >
            <Text
              style={[
                styles.sortChipText,
                sortBy === 'most_loved' && styles.sortChipTextActive,
              ]}
            >
              {t('atlas.mostLoved')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Articles Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={category.color} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
            if (isCloseToBottom) {
              loadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {/* Featured Article (first one) */}
          {articles.length > 0 && (
            <TouchableOpacity
              style={styles.featuredCard}
              onPress={() =>
                navigation.navigate('ArticleDetail', {
                  article: articles[0],
                })
              }
            >
              <Image
                source={{ uri: articles[0].cover_image_url }}
                style={styles.featuredImage}
              />
              <View style={styles.featuredOverlay}>
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>{t('atlas.featured')}</Text>
                </View>
                <Text style={styles.featuredTitle}>{articles[0].title}</Text>
                <View style={styles.featuredMeta}>
                  <Text style={styles.featuredReadTime}>
                    {t('atlas.minRead', { count: articles[0].read_time_minutes })}
                  </Text>
                  <Text style={styles.featuredDot}>•</Text>
                  <Text style={styles.featuredLoves}>
                    {formatNumber(articles[0].love_count)} ❤️
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Grid of Articles */}
          <View style={styles.articlesGrid}>
            {articles.slice(1).map((article) => (
              <TouchableOpacity
                key={article.id}
                style={styles.articleCard}
                onPress={() =>
                  navigation.navigate('ArticleDetail', {
                    article,
                  })
                }
              >
                <Image
                  source={{ uri: article.cover_image_url }}
                  style={styles.articleImage}
                />
                <View style={styles.articleContent}>
                  <Text style={styles.articleTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <View style={styles.articleMeta}>
                    <Text style={styles.articleReadTime}>
                      {t('atlas.min', { count: article.read_time_minutes })}
                    </Text>
                    <Text style={styles.articleDot}>•</Text>
                    <Text style={styles.articleLoves}>
                      {formatNumber(article.love_count)} ❤️
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Load More Button */}
          {hasMore && !loading && (
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: category.color }]}
              onPress={loadMore}
            >
              <Text style={styles.loadMoreText}>{t('common.loadMore')}</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  categoryInfo: {
    padding: 20,
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryStats: {
    fontSize: 14,
    color: '#666',
  },
  sortBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: '#14b8a6',
  },
  sortChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sortChipTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredReadTime: {
    color: '#fff',
    fontSize: 14,
  },
  featuredDot: {
    color: '#fff',
    marginHorizontal: 8,
  },
  featuredLoves: {
    color: '#fff',
    fontSize: 14,
  },
  articlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
  },
  articleCard: {
    width: '48%',
    margin: '1%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleImage: {
    width: '100%',
    height: 140,
  },
  articleContent: {
    padding: 12,
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  articleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleReadTime: {
    fontSize: 12,
    color: '#666',
  },
  articleDot: {
    color: '#666',
    marginHorizontal: 6,
  },
  articleLoves: {
    fontSize: 12,
    color: '#666',
  },
  loadMoreButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
