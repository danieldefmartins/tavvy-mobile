/**
 * UniverseMapScreen.tsx
 * Full-screen map showing only universe markers
 * Path: screens/UniverseMapScreen.tsx
 * 
 * Shows all universes as markers on a map with:
 * - Search bar at top
 * - Category filter chips (All, Theme Parks, Airports, etc.)
 * - Satellite view toggle
 * - Same map style as HomeScreen
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
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';

const { width, height } = Dimensions.get('window');

// Map Styles Configuration (same as HomeScreen)
const MAP_STYLES = {
  osm: {
    name: 'Standard',
    type: 'raster',
    tileUrl: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    icon: 'map',
  },
  satellite: {
    name: 'Satellite',
    type: 'raster',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    icon: 'image',
  },
  liberty: {
    name: 'Vector',
    type: 'vector',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    icon: 'layers',
  },
};

// Universe categories for filtering
const UNIVERSE_CATEGORIES = [
  { id: 'All', label: 'All', categoryId: null },
  { id: 'Theme Parks', label: 'Theme Parks', categoryId: '370839a3-f138-4e05-b357-bffa554a1a43' },
  { id: 'Airports', label: 'Airports', categoryId: '74f99eab-4141-4d79-ac4a-b244ed7adaa2' },
  { id: 'National Parks', label: 'National Parks', categoryId: '4538293c-b3c6-4e33-8673-6413c692e4b9' },
  { id: 'Stadiums', label: 'Stadiums', categoryId: '26917772-0a8f-432f-9243-99883165209b' },
  { id: 'Campuses', label: 'Campuses', categoryId: '6d262f3b-40bc-44ff-b076-c9aff3409f43' },
];

// Universe type
interface Universe {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  thumbnail_image_url: string | null;
  place_count: number;
  category_id: string | null;
  location: string | null;
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
  const [filteredUniverses, setFilteredUniverses] = useState<Universe[]>([]);
  const [selectedUniverse, setSelectedUniverse] = useState<Universe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('osm');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  // Default center (center of US)
  const defaultCenter: [number, number] = [-98.5795, 39.8283];

  useEffect(() => {
    loadUniverses();
    getUserLocation();
  }, []);

  // Filter universes when category or search changes
  useEffect(() => {
    filterUniverses();
  }, [universes, selectedCategory, searchQuery]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation([location.coords.longitude, location.coords.latitude]);
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  const loadUniverses = async () => {
    try {
      const { data, error } = await supabase
        .from('atlas_universes')
        .select('id, name, latitude, longitude, thumbnail_image_url, place_count, category_id, location')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('status', 'published');

      if (error) throw error;

      setUniverses(data || []);
      setFilteredUniverses(data || []);
    } catch (error) {
      console.error('Error loading universes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUniverses = () => {
    let filtered = [...universes];

    // Filter by category
    if (selectedCategory !== 'All') {
      const categoryConfig = UNIVERSE_CATEGORIES.find(c => c.id === selectedCategory);
      if (categoryConfig?.categoryId) {
        filtered = filtered.filter(u => u.category_id === categoryConfig.categoryId);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) ||
        (u.location && u.location.toLowerCase().includes(query))
      );
    }

    setFilteredUniverses(filtered);
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

  const centerOnUserLocation = () => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: userLocation,
        zoomLevel: 10,
        animationDuration: 500,
      });
    }
  };

  const cycleMapStyle = () => {
    const styles = Object.keys(MAP_STYLES) as (keyof typeof MAP_STYLES)[];
    const currentIndex = styles.indexOf(mapStyle);
    const nextIndex = (currentIndex + 1) % styles.length;
    setMapStyle(styles[nextIndex]);
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
        key={mapStyle}
        style={styles.map}
        // @ts-ignore
        styleURL={MAP_STYLES[mapStyle].type === 'vector' ? (MAP_STYLES[mapStyle] as any).url : undefined}
        logoEnabled={false}
        attributionEnabled={false}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: userLocation || defaultCenter,
            zoomLevel: 4,
          }}
          minZoomLevel={2}
          maxZoomLevel={18}
        />

        {/* Raster tile source for OSM and Satellite */}
        {MAP_STYLES[mapStyle].type === 'raster' && (
          <MapLibreGL.RasterSource
            id="raster-source"
            tileUrlTemplates={[(MAP_STYLES[mapStyle] as any).tileUrl]}
            tileSize={256}
          >
            <MapLibreGL.RasterLayer
              id="raster-layer"
              sourceID="raster-source"
              style={{ rasterOpacity: 1 }}
            />
          </MapLibreGL.RasterSource>
        )}

        {/* User Location Marker */}
        {userLocation && (
          <MapLibreGL.PointAnnotation
            id="user-location"
            coordinate={userLocation}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationDot} />
            </View>
          </MapLibreGL.PointAnnotation>
        )}

        {/* Universe Markers */}
        {filteredUniverses.map((universe) => (
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

      {/* Search Overlay */}
      <SafeAreaView style={styles.searchOverlay}>
        <View style={styles.searchRow}>
          {/* Back Button */}
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: isDark ? theme.surface : '#fff' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? theme.text : '#000'} />
          </TouchableOpacity>

          {/* Search Bar */}
          <View style={[styles.searchBar, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={[styles.searchInput, { color: isDark ? theme.text : '#000' }]}
              placeholder="Search universes..."
              placeholderTextColor={isDark ? theme.textSecondary : '#999'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoriesContainer}
        >
          {UNIVERSE_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: isActive ? '#06B6D4' : (isDark ? theme.surface : '#fff') },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[
                  styles.categoryText, 
                  { color: isActive ? '#fff' : (isDark ? theme.text : '#374151') }
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Weather Icon (subtle, top right) */}
      <View style={styles.weatherContainer}>
        <Ionicons name="partly-sunny" size={20} color="#6B7280" />
      </View>

      {/* Map Controls (right side) */}
      <View style={styles.mapControls}>
        {/* Map Style Toggle */}
        <TouchableOpacity
          style={[styles.mapControlButton, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={cycleMapStyle}
        >
          <Ionicons 
            name={MAP_STYLES[mapStyle].icon as any} 
            size={22} 
            color={isDark ? theme.text : '#374151'} 
          />
        </TouchableOpacity>

        {/* My Location Button */}
        <TouchableOpacity
          style={[styles.mapControlButton, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={centerOnUserLocation}
        >
          <Ionicons name="locate" size={22} color={isDark ? theme.text : '#374151'} />
        </TouchableOpacity>
      </View>

      {/* Universe Count Badge */}
      <View style={[styles.countBadge, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
        <Text style={[styles.countText, { color: isDark ? theme.text : '#374151' }]}>
          {filteredUniverses.length} universes
        </Text>
      </View>

      {/* Selected Universe Card */}
      {selectedUniverse && (
        <View style={styles.selectedCardContainer}>
          <TouchableOpacity
            style={[styles.selectedCard, { backgroundColor: isDark ? theme.surface : '#fff' }]}
            onPress={handleNavigateToUniverse}
            activeOpacity={0.9}
          >
            {selectedUniverse.thumbnail_image_url ? (
              <Image
                source={{ uri: selectedUniverse.thumbnail_image_url }}
                style={styles.selectedCardImage}
              />
            ) : (
              <View style={[styles.selectedCardImage, styles.selectedCardImagePlaceholder]}>
                <Ionicons name="planet" size={24} color="#9CA3AF" />
              </View>
            )}
            <View style={styles.selectedCardContent}>
              <Text style={[styles.selectedCardName, { color: isDark ? theme.text : '#111827' }]} numberOfLines={1}>
                {selectedUniverse.name}
              </Text>
              <Text style={[styles.selectedCardLocation, { color: isDark ? theme.textSecondary : '#6B7280' }]} numberOfLines={1}>
                {selectedUniverse.location || 'Location TBD'}
              </Text>
              <Text style={[styles.selectedCardMeta, { color: '#06B6D4' }]}>
                {selectedUniverse.place_count} places
              </Text>
            </View>
            <View style={styles.selectedCardArrow}>
              <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: isDark ? theme.surface : '#fff' }]}
            onPress={() => setSelectedUniverse(null)}
          >
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Legend */}
      <View style={[styles.legendContainer, { backgroundColor: isDark ? theme.surface : 'rgba(255, 255, 255, 0.95)' }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: isDark ? theme.text : '#374151' }]}>Theme Parks</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.legendText, { color: isDark ? theme.text : '#374151' }]}>Airports</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={[styles.legendText, { color: isDark ? theme.text : '#374151' }]}>National Parks</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.legendText, { color: isDark ? theme.text : '#374151' }]}>Stadiums</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8B5CF6' }]} />
          <Text style={[styles.legendText, { color: isDark ? theme.text : '#374151' }]}>Campuses</Text>
        </View>
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

  // Search Overlay
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },

  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Weather Icon
  weatherContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 56 : 60,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Map Controls
  mapControls: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    gap: 8,
  },

  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Count Badge
  countBadge: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 130 : 140,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  countText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // User Location Marker
  userLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#06B6D4',
    borderWidth: 2,
    borderColor: '#fff',
  },

  // Universe Marker
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

  // Selected Universe Card
  selectedCardContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    zIndex: 10,
  },

  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
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

  selectedCardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  selectedCardContent: {
    flex: 1,
    marginLeft: 12,
  },

  selectedCardName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },

  selectedCardLocation: {
    fontSize: 13,
    marginBottom: 2,
  },

  selectedCardMeta: {
    fontSize: 13,
    fontWeight: '600',
  },

  selectedCardArrow: {
    padding: 8,
  },

  closeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Legend
  legendContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
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
    fontWeight: '500',
  },
});
