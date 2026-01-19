/**
 * UniverseMapScreen.tsx
 * Full-screen map showing only universe markers
 * Path: screens/UniverseMapScreen.tsx
 * 
 * Shows all universes as markers on a map.
 * Tapping a marker navigates to the UniverseLanding screen.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';

const { width, height } = Dimensions.get('window');

// Map style - using OpenStreetMap tiles
const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

// Universe type
interface Universe {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  thumbnail_image_url: string | null;
  place_count: number;
  category_id: string | null;
}

// Category colors for markers
const CATEGORY_COLORS: Record<string, string> = {
  '370839a3-f138-4e05-b357-bffa554a1a43': '#EF4444', // Theme Parks - Red
  '74f99eab-4141-4d79-ac4a-b244ed7adaa2': '#3B82F6', // Airports - Blue
  '4538293c-b3c6-4e33-8673-6413c692e4b9': '#22C55E', // National Parks - Green
  '26917772-0a8f-432f-9243-99883165209b': '#F59E0B', // Stadiums - Amber
  '6d262f3b-40bc-44ff-b076-c9aff3409f43': '#8B5CF6', // Campuses - Purple
  default: '#06B6D4', // Default - Cyan
};

export default function UniverseMapScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  // Default center (Orlando, FL area)
  const [center, setCenter] = useState<[number, number]>([-81.5, 28.4]);

  useEffect(() => {
    loadUniverses();
  }, []);

  const loadUniverses = async () => {
    try {
      const { data, error } = await supabase
        .from('atlas_universes')
        .select('id, name, latitude, longitude, thumbnail_image_url, place_count, category_id')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('status', 'published');

      if (error) throw error;

      setUniverses(data || []);
    } catch (error) {
      console.error('Error loading universes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (categoryId: string | null) => {
    if (!categoryId) return CATEGORY_COLORS.default;
    return CATEGORY_COLORS[categoryId] || CATEGORY_COLORS.default;
  };

  const handleMarkerPress = (universe: Universe) => {
    setSelectedUniverse(universe);
    // Center map on selected universe
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [universe.longitude, universe.latitude],
        zoomLevel: 10,
        animationDuration: 500,
      });
    }
  };

  const handleNavigateToUniverse = () => {
    if (selectedUniverse) {
      navigation.navigate('UniverseLanding', { universeId: selectedUniverse.id });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: isDark ? theme.background : '#F9FAFB' }]}>
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={[styles.loadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          Loading universes...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map */}
      {/* @ts-ignore - MapLibreGL types are incomplete */}
      <MapLibreGL.MapView
        style={styles.map}
        styleJSON={JSON.stringify(MAP_STYLE)}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: center,
            zoomLevel: 4,
          }}
        />

        {/* Universe Markers */}
        {universes.map((universe) => (
          <MapLibreGL.PointAnnotation
            key={universe.id}
            id={universe.id}
            coordinate={[universe.longitude, universe.latitude]}
            onSelected={() => handleMarkerPress(universe)}
          >
            <View style={[styles.marker, { backgroundColor: getMarkerColor(universe.category_id) }]}>
              <Ionicons name="planet" size={16} color="#fff" />
            </View>
            <MapLibreGL.Callout title={universe.name} />
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>

      {/* Header */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Universe Map</Text>
          <View style={styles.headerRight}>
            <Text style={styles.universeCount}>{universes.length} universes</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Weather Icon (subtle, top right) */}
      <View style={styles.weatherContainer}>
        <Ionicons name="partly-sunny" size={20} color="#6B7280" />
      </View>

      {/* Selected Universe Card */}
      {selectedUniverse && (
        <View style={styles.selectedCardContainer}>
          <TouchableOpacity
            style={styles.selectedCard}
            onPress={handleNavigateToUniverse}
            activeOpacity={0.9}
          >
            {selectedUniverse.thumbnail_image_url && (
              <Image
                source={{ uri: selectedUniverse.thumbnail_image_url }}
                style={styles.selectedCardImage}
              />
            )}
            <View style={styles.selectedCardContent}>
              <Text style={styles.selectedCardName} numberOfLines={1}>
                {selectedUniverse.name}
              </Text>
              <Text style={styles.selectedCardMeta}>
                {selectedUniverse.place_count} places
              </Text>
            </View>
            <View style={styles.selectedCardArrow}>
              <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedUniverse(null)}
          >
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Theme Parks</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Airports</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendText}>National Parks</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Stadiums</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={styles.legendText}>Campuses</Text>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={() => {
            if (cameraRef.current) {
              cameraRef.current.setCamera({
                centerCoordinate: [-98.5795, 39.8283], // Center of US
                zoomLevel: 3,
                animationDuration: 500,
              });
            }
          }}
        >
          <Ionicons name="globe-outline" size={22} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
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

  map: {
    flex: 1,
  },

  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginTop: Platform.OS === 'android' ? 40 : 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  backButton: {
    padding: 4,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  headerRight: {
    alignItems: 'flex-end',
  },

  universeCount: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  weatherContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 100 : 70,
    right: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  selectedCardContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    zIndex: 10,
  },

  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  selectedCardImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },

  selectedCardContent: {
    flex: 1,
    marginLeft: 12,
  },

  selectedCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },

  selectedCardMeta: {
    fontSize: 13,
    color: '#6B7280',
  },

  selectedCardArrow: {
    padding: 8,
  },

  closeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  legendContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  legendText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },

  mapControls: {
    position: 'absolute',
    bottom: 40,
    right: 16,
  },

  mapControlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
