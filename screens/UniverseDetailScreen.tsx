// ============================================================================
// UNIVERSE DETAIL SCREEN
// ============================================================================
// Hub page for universes (Disney World, LAX Airport, etc.)
// Place this file in: screens/UniverseDetailScreen.tsx
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
import {
  getArticlesByUniverse,
  getSubUniverses,
  getUniversePlaces,
  type AtlasUniverse,
  type AtlasArticle,
} from '../lib/atlas';

export default function UniverseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { universe } = route.params as { universe: AtlasUniverse };

  const [activeTab, setActiveTab] = useState<'overview' | 'places' | 'articles' | 'guides'>(
    'overview'
  );
  const [articles, setArticles] = useState<AtlasArticle[]>([]);
  const [subUniverses, setSubUniverses] = useState<AtlasUniverse[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [universe.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [articlesData, subUniversesData, placesData] = await Promise.all([
        getArticlesByUniverse(universe.id),
        getSubUniverses(universe.id),
        getUniversePlaces(universe.id),
      ]);

      setArticles(articlesData);
      setSubUniverses(subUniversesData);
      setPlaces(placesData);
    } catch (error) {
      console.error('Error loading universe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image source={{ uri: universe.banner_image_url }} style={styles.bannerImage} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>

          <View style={styles.bannerOverlay}>
            <Text style={styles.universeName}>{universe.name}</Text>
            <Text style={styles.universeLocation}>{universe.location}</Text>
            <View style={styles.universeBadge}>
              <Text style={styles.universeBadgeText}>UNIVERSE</Text>
            </View>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📍</Text>
            <Text style={styles.statNumber}>{universe.place_count}</Text>
            <Text style={styles.statLabel}>Places</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🌐</Text>
            <Text style={styles.statNumber}>{universe.sub_universe_count}</Text>
            <Text style={styles.statLabel}>Sub-Universes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📄</Text>
            <Text style={styles.statNumber}>{universe.article_count}</Text>
            <Text style={styles.statLabel}>Articles</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statNumber}>{formatNumber(universe.total_signals)}</Text>
            <Text style={styles.statLabel}>Signals</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'overview' && styles.tabTextActive,
              ]}
            >
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'places' && styles.tabActive]}
            onPress={() => setActiveTab('places')}
          >
            <Text
              style={[styles.tabText, activeTab === 'places' && styles.tabTextActive]}
            >
              Places
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'articles' && styles.tabActive]}
            onPress={() => setActiveTab('articles')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'articles' && styles.tabTextActive,
              ]}
            >
              Articles
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'guides' && styles.tabActive]}
            onPress={() => setActiveTab('guides')}
          >
            <Text
              style={[styles.tabText, activeTab === 'guides' && styles.tabTextActive]}
            >
              Guides
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#14b8a6" style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Featured Guides */}
              {articles.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Featured Guides</Text>
                  {articles.slice(0, 2).map((article) => (
                    <TouchableOpacity
                      key={article.id}
                      style={styles.guideCard}
                      onPress={() =>
                        navigation.navigate('ArticleDetail' as never, {
                          article,
                        } as never)
                      }
                    >
                      <Image
                        source={{ uri: article.cover_image_url }}
                        style={styles.guideImage}
                      />
                      <View style={styles.guideContent}>
                        <Text style={styles.guideTitle} numberOfLines={2}>
                          {article.title}
                        </Text>
                        <View style={styles.guideMeta}>
                          <Text style={styles.guideReadTime}>
                            {article.read_time_minutes} min read
                          </Text>
                          <Text style={styles.guideDot}>•</Text>
                          <Text style={styles.guideLoves}>
                            {formatNumber(article.love_count)} ❤️
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Popular Places */}
              {places.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Popular Places</Text>
                  <View style={styles.placesGrid}>
                    {places.slice(0, 4).map((place) => (
                      <TouchableOpacity
                        key={place.id}
                        style={styles.placeCard}
                        onPress={() =>
                          navigation.navigate('PlaceDetails' as never, {
                            place,
                          } as never)
                        }
                      >
                        {place.photos && place.photos[0] && (
                          <Image
                            source={{ uri: place.photos[0] }}
                            style={styles.placeImage}
                          />
                        )}
                        <View style={styles.placeInfo}>
                          <Text style={styles.placeName} numberOfLines={1}>
                            {place.name}
                          </Text>
                          {place.primary_category && (
                            <Text style={styles.placeCategory}>
                              {place.primary_category}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Sub-Universes */}
              {subUniverses.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Sub-Universes</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.subUniversesScroll}
                  >
                    {subUniverses.map((subUniverse) => (
                      <TouchableOpacity
                        key={subUniverse.id}
                        style={styles.subUniverseCard}
                        onPress={() =>
                          navigation.push('UniverseDetail' as never, {
                            universe: subUniverse,
                          } as never)
                        }
                      >
                        <Image
                          source={{ uri: subUniverse.thumbnail_image_url }}
                          style={styles.subUniverseImage}
                        />
                        <View style={styles.subUniverseInfo}>
                          <Text style={styles.subUniverseName} numberOfLines={1}>
                            {subUniverse.name}
                          </Text>
                          <Text style={styles.subUniversePlaces}>
                            {subUniverse.place_count} places
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>

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
  bannerContainer: {
    position: 'relative',
    height: 280,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    color: '#fff',
    fontSize: 24,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  universeName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  universeLocation: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  universeBadge: {
    backgroundColor: '#ec4899',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  universeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14b8a6',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#14b8a6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#14b8a6',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  guideCard: {
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
  guideImage: {
    width: 140,
    height: 140,
  },
  guideContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  guideMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideReadTime: {
    fontSize: 12,
    color: '#666',
  },
  guideDot: {
    color: '#666',
    marginHorizontal: 6,
  },
  guideLoves: {
    fontSize: 12,
    color: '#666',
  },
  placesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  placeCard: {
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
  placeImage: {
    width: '100%',
    height: 120,
  },
  placeInfo: {
    padding: 12,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: 12,
    color: '#666',
  },
  subUniversesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  subUniverseCard: {
    width: 180,
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
  subUniverseImage: {
    width: '100%',
    height: 120,
  },
  subUniverseInfo: {
    padding: 12,
  },
  subUniverseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  subUniversePlaces: {
    fontSize: 12,
    color: '#666',
  },
});
