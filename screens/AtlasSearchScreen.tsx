// ============================================================================
// ATLAS SEARCH SCREEN
// ============================================================================
// Search articles, universes, and places
// Place this file in: screens/AtlasSearchScreen.tsx
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  searchArticles,
  type AtlasArticle,
} from '../lib/atlas';

export default function AtlasSearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<AtlasArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);
      const data = await searchArticles(searchQuery);
      setResults(data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const navigateToArticle = (article: AtlasArticle) => {
    if (article.article_template_type === 'owner_spotlight') {
      navigation.navigate('OwnerSpotlight' as never, { article } as never);
    } else {
      navigation.navigate('ArticleDetail' as never, { article } as never);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles, universes, places..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#14b8a6" />
          </View>
        ) : hasSearched ? (
          <>
            {/* Results Count */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {results.length} results for "{searchQuery}"
              </Text>
            </View>

            {/* Results List */}
            {results.length > 0 ? (
              <View style={styles.resultsList}>
                {results.map((article) => (
                  <TouchableOpacity
                    key={article.id}
                    style={styles.resultCard}
                    onPress={() => navigateToArticle(article)}
                  >
                    <Image
                      source={{ uri: article.cover_image_url }}
                      style={styles.resultImage}
                    />
                    <View style={styles.resultContent}>
                      <View
                        style={[
                          styles.resultBadge,
                          { backgroundColor: article.category?.color || '#14b8a6' },
                        ]}
                      >
                        <Text style={styles.resultBadgeText}>ARTICLE</Text>
                      </View>
                      <Text style={styles.resultTitle} numberOfLines={2}>
                        {article.title}
                      </Text>
                      {article.excerpt && (
                        <Text style={styles.resultExcerpt} numberOfLines={2}>
                          {article.excerpt}
                        </Text>
                      )}
                      <View style={styles.resultMeta}>
                        <Text style={styles.resultAuthor}>
                          {article.author_name}
                        </Text>
                        <Text style={styles.resultDot}>•</Text>
                        <Text style={styles.resultReadTime}>
                          {article.read_time_minutes} min read
                        </Text>
                        <Text style={styles.resultDot}>•</Text>
                        <Text style={styles.resultLoves}>
                          {formatNumber(article.love_count)} ❤️
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No results found</Text>
                <Text style={styles.emptyText}>
                  Try different keywords or browse categories
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>Search Tavvy Atlas</Text>
            <Text style={styles.emptyText}>
              Find articles, guides, and universes
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 18,
    color: '#666',
  },
  searchButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  resultsHeader: {
    padding: 20,
    paddingBottom: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
  },
  resultsList: {
    paddingHorizontal: 20,
  },
  resultCard: {
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
  resultImage: {
    width: 120,
    height: 140,
  },
  resultContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  resultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  resultBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  resultExcerpt: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  resultAuthor: {
    fontSize: 12,
    color: '#666',
  },
  resultDot: {
    color: '#666',
    marginHorizontal: 6,
  },
  resultReadTime: {
    fontSize: 12,
    color: '#666',
  },
  resultLoves: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
