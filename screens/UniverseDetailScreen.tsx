/**
 * UniverseDetailScreen.tsx
 * Universe detail view with curved carousel planet selector
 * Supports dark mode (default) and light mode
 * 
 * Features:
 * - Universe name at top with galaxy icon
 * - Curved carousel showing 5 planets (center one larger)
 * - Horizontal scroll to navigate between planets
 * - Selected planet info with stats
 * - Places list for selected planet
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { type AtlasUniverse } from '../lib/atlas';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Planet carousel configuration
const PLANET_SIZE_LARGE = 100;  // Center planet
const PLANET_SIZE_MEDIUM = 70;  // Adjacent planets
const PLANET_SIZE_SMALL = 50;   // Edge planets
const CAROUSEL_HEIGHT = 200;

// Default placeholder images
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

// Planet colors based on index (for visual variety)
const PLANET_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#EF4444', // Red
  '#84CC16', // Lime
];

// Get category-based fallback image
const getCategoryFallbackImage = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  const imageMap: Record<string, string> = {
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'ride': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'attraction': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  };
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerCategory.includes(key)) return url;
  }
  return imageMap.default;
};

interface Place {
  id: string;
  name: string;
  tavvy_category?: string;
  tavvy_subcategory?: string;
  cover_image_url?: string;
}

export default function UniverseDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  // Support both universeId param and universe object param for backward compatibility
  const universeId = route.params?.universeId || route.params?.universe?.id;
  const passedUniverse = route.params?.universe;
  const { theme, isDark } = useThemeContext();

  const [loading, setLoading] = useState(true);
  const [universe, setUniverse] = useState<AtlasUniverse | null>(passedUniverse || null);
  const [planets, setPlanets] = useState<AtlasUniverse[]>([]);
  const [selectedPlanetIndex, setSelectedPlanetIndex] = useState(0);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (universeId) {
      loadUniverseData();
    }
  }, [universeId]);

  // Load places when selected planet changes
  useEffect(() => {
    if (planets.length > 0 && selectedPlanetIndex >= 0) {
      loadPlanetPlaces(planets[selectedPlanetIndex].id);
    }
  }, [selectedPlanetIndex, planets]);

  const loadUniverseData = async () => {
    setLoading(true);
    try {
      // Fetch the universe details if not passed
      let universeData = passedUniverse;
      if (!universeData) {
        const { data, error } = await supabase
          .from('atlas_universes')
          .select('*')
          .eq('id', universeId)
          .single();

        if (error) throw error;
        universeData = data;
      }
      setUniverse(universeData);

      // Fetch sub-universes (planets) for this universe
      const { data: planetsData, error: planetsError } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('parent_universe_id', universeId)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if (!planetsError && planetsData && planetsData.length > 0) {
        setPlanets(planetsData);
        setSelectedPlanetIndex(Math.floor(planetsData.length / 2)); // Start with middle planet
      } else {
        // If no sub-universes, treat the universe itself as the only "planet"
        setPlanets([universeData]);
        setSelectedPlanetIndex(0);
      }

    } catch (error) {
      console.error('Error loading universe data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlanetPlaces = async (planetId: string) => {
    setLoadingPlaces(true);
    try {
      const { data: placesData, error: placesError } = await supabase
        .from('atlas_universe_places')
        .select(`
          place:places(
            id,
            name,
            tavvy_category,
            tavvy_subcategory,
            cover_image_url
          )
        `)
        .eq('universe_id', planetId)
        .order('display_order', { ascending: true });

      if (!placesError && placesData) {
        const extractedPlaces = placesData
          .map((item: any) => item.place)
          .filter(Boolean);
        setPlaces(extractedPlaces);
      }
    } catch (error) {
      console.error('Error loading planet places:', error);
    } finally {
      setLoadingPlaces(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  };

  const handlePlanetPress = (index: number) => {
    setSelectedPlanetIndex(index);
  };

  const handlePlanetScroll = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left' 
      ? Math.max(0, selectedPlanetIndex - 1)
      : Math.min(planets.length - 1, selectedPlanetIndex + 1);
    setSelectedPlanetIndex(newIndex);
  };

  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetails', { placeId: place.id });
  };

  const selectedPlanet = planets[selectedPlanetIndex];

  // Calculate visible planets (5 at a time, centered on selected)
  const getVisiblePlanets = () => {
    const result = [];
    for (let i = -2; i <= 2; i++) {
      const index = selectedPlanetIndex + i;
      if (index >= 0 && index < planets.length) {
        result.push({ planet: planets[index], position: i, index });
      } else {
        result.push({ planet: null, position: i, index });
      }
    }
    return result;
  };

  const getPlanetStyle = (position: number) => {
    const absPos = Math.abs(position);
    let size = PLANET_SIZE_SMALL;
    let opacity = 0.5;
    let translateY = 30;

    if (absPos === 0) {
      size = PLANET_SIZE_LARGE;
      opacity = 1;
      translateY = 0;
    } else if (absPos === 1) {
      size = PLANET_SIZE_MEDIUM;
      opacity = 0.8;
      translateY = 15;
    }

    return { size, opacity, translateY };
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: theme.background,
    },
    text: {
      color: theme.text,
    },
    textSecondary: {
      color: theme.textSecondary,
    },
    card: {
      backgroundColor: theme.card,
    },
    border: {
      borderColor: theme.border,
    },
  };

  if (loading) {
    return (
      <View style={[styles.container, dynamicStyles.container, styles.loadingContainer]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, dynamicStyles.textSecondary]}>Loading universe...</Text>
      </View>
    );
  }

  if (!universe) {
    return (
      <View style={[styles.container, dynamicStyles.container, styles.loadingContainer]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <Ionicons name="planet-outline" size={48} color={theme.textSecondary} />
        <Text style={[styles.loadingText, dynamicStyles.textSecondary]}>Universe not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonSmall, { backgroundColor: theme.primary }]}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.galaxyIcon}>🌌</Text>
            <Text style={[styles.universeName, dynamicStyles.text]} numberOfLines={1}>{universe.name}</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Planet Carousel */}
          <View style={styles.carouselContainer}>
            {/* Curved Arc Background */}
            <View style={[styles.arcBackground, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
            
            {/* Navigation Arrows */}
            {selectedPlanetIndex > 0 && (
              <TouchableOpacity 
                style={[styles.navArrow, styles.navArrowLeft]}
                onPress={() => handlePlanetScroll('left')}
              >
                <Ionicons name="chevron-back" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
            {selectedPlanetIndex < planets.length - 1 && (
              <TouchableOpacity 
                style={[styles.navArrow, styles.navArrowRight]}
                onPress={() => handlePlanetScroll('right')}
              >
                <Ionicons name="chevron-forward" size={28} color={theme.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Planets */}
            <View style={styles.planetsRow}>
              {getVisiblePlanets().map((item, idx) => {
                if (!item.planet) {
                  return <View key={`empty-${idx}`} style={styles.planetPlaceholder} />;
                }
                
                const { size, opacity, translateY } = getPlanetStyle(item.position);
                const isSelected = item.position === 0;
                const planetColor = PLANET_COLORS[item.index % PLANET_COLORS.length];

                return (
                  <TouchableOpacity
                    key={item.planet.id}
                    style={[
                      styles.planetContainer,
                      { opacity, transform: [{ translateY }] }
                    ]}
                    onPress={() => handlePlanetPress(item.index)}
                    activeOpacity={0.8}
                  >
                    {/* Planet Glow (for selected) */}
                    {isSelected && (
                      <View style={[styles.planetGlow, { backgroundColor: planetColor }]} />
                    )}
                    
                    {/* Planet Image/Icon */}
                    <View style={[
                      styles.planet,
                      { 
                        width: size, 
                        height: size, 
                        borderRadius: size / 2,
                        borderColor: isSelected ? planetColor : 'transparent',
                        borderWidth: isSelected ? 3 : 0,
                      }
                    ]}>
                      {item.planet.thumbnail_image_url ? (
                        <Image 
                          source={{ uri: item.planet.thumbnail_image_url }} 
                          style={[styles.planetImage, { borderRadius: size / 2 }]}
                        />
                      ) : (
                        <View style={[
                          styles.planetFallback, 
                          { backgroundColor: planetColor, borderRadius: size / 2 }
                        ]}>
                          <Ionicons 
                            name="planet" 
                            size={size * 0.5} 
                            color="rgba(255,255,255,0.9)" 
                          />
                        </View>
                      )}
                    </View>

                    {/* Planet Name */}
                    <Text 
                      style={[
                        styles.planetName, 
                        dynamicStyles.text,
                        { fontSize: isSelected ? 13 : 10, fontWeight: isSelected ? '600' : '400' }
                      ]}
                      numberOfLines={2}
                    >
                      {item.planet.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Pagination Dots */}
            {planets.length > 1 && (
              <View style={styles.paginationDots}>
                {planets.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: index === selectedPlanetIndex 
                          ? theme.primary 
                          : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                        width: index === selectedPlanetIndex ? 20 : 6,
                      }
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Selected Planet Info */}
          {selectedPlanet && (
            <View style={styles.selectedPlanetInfo}>
              <Text style={[styles.selectedPlanetName, dynamicStyles.text]}>
                {selectedPlanet.name}
              </Text>
              <Text style={[styles.selectedPlanetStats, dynamicStyles.textSecondary]}>
                {selectedPlanet.place_count || places.length} Places
              </Text>
            </View>
          )}

          {/* Places Section */}
          <View style={styles.placesSection}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>
              Places in {selectedPlanet?.name || 'this Universe'}
            </Text>

            {loadingPlaces ? (
              <View style={styles.placesLoading}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : places.length > 0 ? (
              places.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={[styles.placeCard, dynamicStyles.card, dynamicStyles.border]}
                  onPress={() => handlePlacePress(place)}
                >
                  <Image
                    source={{ uri: place.cover_image_url || getCategoryFallbackImage(place.tavvy_category || '') }}
                    style={styles.placeImage}
                  />
                  <View style={styles.placeContent}>
                    <Text style={[styles.placeName, dynamicStyles.text]} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <Text style={[styles.placeCategory, dynamicStyles.textSecondary]} numberOfLines={1}>
                      {place.tavvy_category || 'Attraction'}
                    </Text>
                    <View style={styles.placeSignals}>
                      <Ionicons name="location" size={12} color={theme.primary} />
                      <Text style={[styles.placeSignalText, { color: theme.primary }]}>
                        {place.tavvy_subcategory || 'Place'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyStateText, dynamicStyles.textSecondary]}>
                  No places added yet
                </Text>
              </View>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
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
  backButtonSmall: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  galaxyIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  universeName: {
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Carousel
  carouselContainer: {
    height: CAROUSEL_HEIGHT,
    position: 'relative',
    marginTop: 10,
  },
  arcBackground: {
    position: 'absolute',
    bottom: 50,
    left: 30,
    right: 30,
    height: 100,
    borderBottomLeftRadius: 200,
    borderBottomRightRadius: 200,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  navArrow: {
    position: 'absolute',
    top: '35%',
    zIndex: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowLeft: {
    left: 4,
  },
  navArrowRight: {
    right: 4,
  },
  planetsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: CAROUSEL_HEIGHT - 50,
    paddingHorizontal: 10,
  },
  planetPlaceholder: {
    width: PLANET_SIZE_SMALL,
    marginHorizontal: 6,
  },
  planetContainer: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  planetGlow: {
    position: 'absolute',
    top: -10,
    width: PLANET_SIZE_LARGE + 20,
    height: PLANET_SIZE_LARGE + 20,
    borderRadius: (PLANET_SIZE_LARGE + 20) / 2,
    opacity: 0.25,
  },
  planet: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetImage: {
    width: '100%',
    height: '100%',
  },
  planetFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planetName: {
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 70,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },

  // Selected Planet Info
  selectedPlanetInfo: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  selectedPlanetName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedPlanetStats: {
    fontSize: 14,
  },

  // Places Section
  placesSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  placesLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  placeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeContent: {
    flex: 1,
    marginLeft: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  placeCategory: {
    fontSize: 13,
    marginBottom: 4,
  },
  placeSignals: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeSignalText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
  },
});
