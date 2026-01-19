/**
 * UniverseMapScreen.tsx
 * Full-screen map showing universe markers with Lyft-inspired minimal floating icons
 * Path: screens/UniverseMapScreen.tsx
 * 
 * Features:
 * - Search bar at top with category filters
 * - Minimal floating icons (Lyft-inspired):
 *   - Left: Legend/Info popup
 *   - Right: Weather, Map Layers, Current Location
 * - Draggable bottom sheet with universe cards
 * - Same map style as HomeScreen
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';

const { width, height } = Dimensions.get('window');

// Map Styles Configuration
const MAP_STYLES = {
  osm: {
    name: 'Standard',
    type: 'raster',
    tileUrl: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    icon: 'map-outline',
  },
  satellite: {
    name: 'Satellite',
    type: 'raster',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    icon: 'earth-outline',
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

// Category colors for markers
const CATEGORY_COLORS: Record<string, { color: string; name: string }> = {
  '370839a3-f138-4e05-b357-bffa554a1a43': { color: '#EF4444', name: 'Theme Parks' },
  '74f99eab-4141-4d79-ac4a-b244ed7adaa2': { color: '#3B82F6', name: 'Airports' },
  '4538293c-b3c6-4e33-8673-6413c692e4b9': { color: '#22C55E', name: 'National Parks' },
  '26917772-0a8f-432f-9243-99883165209b': { color: '#F59E0B', name: 'Stadiums' },
  '6d262f3b-40bc-44ff-b076-c9aff3409f43': { color: '#8B5CF6', name: 'Campuses' },
  default: { color: '#06B6D4', name: 'Other' },
};

// Universe type
interface Universe {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  thumbnail_image_url: string | null;
  banner_image_url: string | null;
  place_count: number;
  category_id: string | null;
  location: string | null;
}

export default function UniverseMapScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const [loading, setLoading] = useState(true);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [filteredUniverses, setFilteredUniverses] = useState<Universe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('osm');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Popup states
  const [showLegendPopup, setShowLegendPopup] = useState(false);
  const [showWeatherPopup, setShowWeatherPopup] = useState(false);
  const [showMapLayerPopup, setShowMapLayerPopup] = useState(false);
  
  // Weather data (mock for now - can be connected to real API)
  const [weatherData] = useState({
    temp: 72,
    feelsLike: 70,
    high: 78,
    low: 65,
    condition: 'Sunny',
    icon: 'sunny',
    hourly: [
      { time: 'Now', temp: 72, icon: 'sunny' },
      { time: '11AM', temp: 74, icon: 'sunny' },
      { time: '12PM', temp: 76, icon: 'partly-sunny' },
      { time: '1PM', temp: 78, icon: 'partly-sunny' },
    ],
    airQuality: { status: 'Good', aqi: 32 },
  });

  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Bottom sheet snap points
  const snapPoints = useMemo(() => [60, '35%', '55%'], []);

  // Default center (center of US)
  const defaultCenter: [number, number] = [-98.5795, 39.8283];

  useEffect(() => {
    loadUniverses();
    getUserLocation();
  }, []);

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
        .select('id, name, latitude, longitude, thumbnail_image_url, banner_image_url, place_count, category_id, location')
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

    if (selectedCategory !== 'All') {
      const categoryConfig = UNIVERSE_CATEGORIES.find(c => c.id === selectedCategory);
      if (categoryConfig?.categoryId) {
        filtered = filtered.filter(u => u.category_id === categoryConfig.categoryId);
      }
    }

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
    if (!categoryId) return CATEGORY_COLORS.default.color;
    return CATEGORY_COLORS[categoryId]?.color || CATEGORY_COLORS.default.color;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return CATEGORY_COLORS.default.name;
    return CATEGORY_COLORS[categoryId]?.name || CATEGORY_COLORS.default.name;
  };

  const handleNavigateToUniverse = (universe: Universe) => {
    navigation.navigate('UniverseLanding', { universeId: universe.id });
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

  const selectMapStyle = (style: keyof typeof MAP_STYLES) => {
    setMapStyle(style);
    setShowMapLayerPopup(false);
  };

  // Render universe card for bottom sheet
  const renderUniverseCard = useCallback(({ item }: { item: Universe }) => {
    const categoryName = getCategoryName(item.category_id);
    const categoryColor = getMarkerColor(item.category_id);
    
    return (
      <TouchableOpacity
        style={[styles.universeCard, { backgroundColor: isDark ? theme.surface : '#fff' }]}
        onPress={() => handleNavigateToUniverse(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardImageContainer}>
          {item.banner_image_url || item.thumbnail_image_url ? (
            <Image
              source={{ uri: item.banner_image_url || item.thumbnail_image_url || '' }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
              <Ionicons name="planet" size={32} color="#9CA3AF" />
            </View>
          )}
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
            <Text style={styles.categoryBadgeText}>{categoryName}</Text>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text style={[styles.cardName, { color: isDark ? theme.text : '#111827' }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.cardLocation, { color: isDark ? theme.textSecondary : '#6B7280' }]} numberOfLines={1}>
            {item.location || 'Location TBD'}
          </Text>
          
          {/* 2x2 Review Signal Grid */}
          <View style={styles.signalGrid}>
            {/* Row 1: Two blue "Good" signals */}
            <View style={styles.signalRow}>
              <View style={[styles.signalBar, styles.signalGood]}>
                <Ionicons name="thumbs-up" size={14} color="#fff" />
                <Text style={styles.signalText}>Be the first to tap!</Text>
              </View>
              <View style={[styles.signalBar, styles.signalGood]}>
                <Ionicons name="thumbs-up" size={14} color="#fff" />
                <Text style={styles.signalText}>Be the first to tap!</Text>
              </View>
            </View>
            {/* Row 2: Purple "Vibe" and Orange "Heads Up" */}
            <View style={styles.signalRow}>
              <View style={[styles.signalBar, styles.signalVibe]}>
                <Ionicons name="trending-up" size={14} color="#fff" />
                <Text style={styles.signalText}>Be the first to tap!</Text>
              </View>
              <View style={[styles.signalBar, styles.signalHeadsUp]}>
                <Ionicons name="alert" size={14} color="#fff" />
                <Text style={styles.signalText}>Be the first to tap!</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.cardMeta}>
            <Text style={[styles.cardPlaces, { color: '#06B6D4' }]}>
              {item.place_count || 0} places
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#06B6D4" />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [isDark, theme]);

  // Legend Popup Component
  const LegendPopup = () => (
    <Modal
      visible={showLegendPopup}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLegendPopup(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowLegendPopup(false)}
      >
        <View style={[styles.popupContainer, styles.legendPopup, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
          <Text style={[styles.popupTitle, { color: isDark ? theme.text : '#111827' }]}>Map Legend</Text>
          
          {Object.entries(CATEGORY_COLORS).filter(([key]) => key !== 'default').map(([key, value]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: value.color }]} />
              <Text style={[styles.legendText, { color: isDark ? theme.text : '#374151' }]}>{value.name}</Text>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.popupCloseButton}
            onPress={() => setShowLegendPopup(false)}
          >
            <Text style={styles.popupCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Weather Popup Component
  const WeatherPopup = () => (
    <Modal
      visible={showWeatherPopup}
      transparent
      animationType="fade"
      onRequestClose={() => setShowWeatherPopup(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowWeatherPopup(false)}
      >
        <View style={[styles.popupContainer, styles.weatherPopup, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
          <Text style={[styles.popupTitle, { color: isDark ? theme.text : '#111827' }]}>Weather in the area</Text>
          
          {/* Current Temperature */}
          <View style={styles.weatherMain}>
            <Text style={[styles.weatherTemp, { color: isDark ? theme.text : '#111827' }]}>{weatherData.temp}°</Text>
            <Ionicons name={weatherData.icon as any} size={48} color="#F59E0B" />
          </View>
          
          <Text style={[styles.weatherCondition, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
            {weatherData.condition} · Feels like: {weatherData.feelsLike}°
          </Text>
          <Text style={[styles.weatherHighLow, { color: isDark ? theme.textSecondary : '#9CA3AF' }]}>
            H: {weatherData.high}° L: {weatherData.low}°
          </Text>
          
          {/* Hourly Forecast */}
          <View style={styles.hourlyContainer}>
            {weatherData.hourly.map((hour, index) => (
              <View key={index} style={styles.hourlyItem}>
                <Text style={[styles.hourlyTemp, { color: isDark ? theme.text : '#111827' }]}>{hour.temp}°</Text>
                <Ionicons name={hour.icon as any} size={20} color="#F59E0B" />
                <Text style={[styles.hourlyTime, { color: isDark ? theme.textSecondary : '#6B7280' }]}>{hour.time}</Text>
              </View>
            ))}
          </View>
          
          {/* Air Quality */}
          <View style={[styles.airQualityContainer, { backgroundColor: isDark ? theme.background : '#F3F4F6' }]}>
            <Text style={[styles.airQualityLabel, { color: isDark ? theme.textSecondary : '#6B7280' }]}>Air quality</Text>
            <View style={styles.airQualityValue}>
              <View style={[styles.airQualityDot, { backgroundColor: '#22C55E' }]} />
              <Text style={[styles.airQualityText, { color: isDark ? theme.text : '#111827' }]}>
                {weatherData.airQuality.status} · {weatherData.airQuality.aqi} AQI
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.popupCloseButton}
            onPress={() => setShowWeatherPopup(false)}
          >
            <Text style={styles.popupCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Map Layer Popup Component
  const MapLayerPopup = () => (
    <Modal
      visible={showMapLayerPopup}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMapLayerPopup(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowMapLayerPopup(false)}
      >
        <View style={[styles.popupContainer, styles.mapLayerPopup, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
          <Text style={[styles.popupTitle, { color: isDark ? theme.text : '#111827' }]}>Map Type</Text>
          
          <View style={styles.mapLayerOptions}>
            {Object.entries(MAP_STYLES).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.mapLayerOption,
                  mapStyle === key && styles.mapLayerOptionActive,
                  { backgroundColor: isDark ? theme.background : '#F3F4F6' }
                ]}
                onPress={() => selectMapStyle(key as keyof typeof MAP_STYLES)}
              >
                <Ionicons 
                  name={value.icon as any} 
                  size={28} 
                  color={mapStyle === key ? '#06B6D4' : (isDark ? theme.textSecondary : '#6B7280')} 
                />
                <Text style={[
                  styles.mapLayerOptionText,
                  { color: mapStyle === key ? '#06B6D4' : (isDark ? theme.text : '#374151') }
                ]}>
                  {value.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.popupCloseButton}
            onPress={() => setShowMapLayerPopup(false)}
          >
            <Text style={styles.popupCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
      <MapLibreGL.MapView
        key={mapStyle}
        style={styles.map}
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

        {/* Raster tile source */}
        <MapLibreGL.RasterSource
          id="raster-source"
          tileUrlTemplates={[MAP_STYLES[mapStyle].tileUrl]}
          tileSize={256}
        >
          <MapLibreGL.RasterLayer
            id="raster-layer"
            sourceID="raster-source"
            style={{ rasterOpacity: 1 }}
          />
        </MapLibreGL.RasterSource>

        {/* User Location Marker */}
        {userLocation && (
          <MapLibreGL.PointAnnotation id="user-location" coordinate={userLocation}>
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
            onSelected={() => {
              if (cameraRef.current) {
                cameraRef.current.setCamera({
                  centerCoordinate: [universe.longitude, universe.latitude],
                  zoomLevel: 10,
                  animationDuration: 500,
                });
              }
              bottomSheetRef.current?.snapToIndex(1);
            }}
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
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: isDark ? theme.surface : '#fff' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? theme.text : '#000'} />
          </TouchableOpacity>

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

        {/* Universe Count */}
        <View style={styles.countContainer}>
          <Text style={[styles.countText, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
            {filteredUniverses.length} universes
          </Text>
        </View>
      </SafeAreaView>

      {/* Floating Icons - Left Side (Legend) */}
      <View style={styles.floatingIconsLeft}>
        <TouchableOpacity
          style={[styles.floatingIcon, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={() => setShowLegendPopup(true)}
        >
          <Ionicons name="information-circle-outline" size={24} color={isDark ? theme.text : '#374151'} />
        </TouchableOpacity>
      </View>

      {/* Floating Icons - Right Side (Weather, Layers, Location) */}
      <View style={styles.floatingIconsRight}>
        <TouchableOpacity
          style={[styles.floatingIcon, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={() => setShowWeatherPopup(true)}
        >
          <Ionicons name="partly-sunny-outline" size={24} color={isDark ? theme.text : '#374151'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingIcon, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={() => setShowMapLayerPopup(true)}
        >
          <Ionicons name="layers-outline" size={24} color={isDark ? theme.text : '#374151'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingIcon, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={centerOnUserLocation}
        >
          <Ionicons name="locate-outline" size={24} color={isDark ? theme.text : '#374151'} />
        </TouchableOpacity>
      </View>

      {/* Popups */}
      <LegendPopup />
      <WeatherPopup />
      <MapLayerPopup />

      {/* Bottom Sheet with Universe Cards */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: isDark ? theme.background : '#fff' }]}
        handleIndicatorStyle={[styles.bottomSheetHandle, { backgroundColor: isDark ? theme.textSecondary : '#DEDEDE' }]}
        enablePanDownToClose={false}
        enableContentPanningGesture={false}
      >
        <BottomSheetFlatList
          data={filteredUniverses}
          keyExtractor={(item) => item.id}
          renderItem={renderUniverseCard}
          contentContainerStyle={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="planet-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.emptyText, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
                No universes found
              </Text>
            </View>
          }
        />
      </BottomSheet>
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

  countContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  countText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Floating Icons - Lyft-inspired
  floatingIconsLeft: {
    position: 'absolute',
    left: 16,
    bottom: '42%',
    gap: 12,
  },

  floatingIconsRight: {
    position: 'absolute',
    right: 16,
    bottom: '42%',
    gap: 12,
  },

  floatingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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

  // Modal & Popups
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  popupContainer: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },

  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },

  popupCloseButton: {
    backgroundColor: '#E0F7FA',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },

  popupCloseText: {
    color: '#06B6D4',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Legend Popup
  legendPopup: {
    width: width * 0.75,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },

  legendText: {
    fontSize: 15,
  },

  // Weather Popup
  weatherPopup: {
    width: width * 0.85,
  },

  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },

  weatherTemp: {
    fontSize: 56,
    fontWeight: '300',
  },

  weatherCondition: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },

  weatherHighLow: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },

  hourlyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },

  hourlyItem: {
    alignItems: 'center',
    gap: 4,
  },

  hourlyTemp: {
    fontSize: 16,
    fontWeight: '600',
  },

  hourlyTime: {
    fontSize: 12,
  },

  airQualityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },

  airQualityLabel: {
    fontSize: 14,
  },

  airQualityValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  airQualityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  airQualityText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Map Layer Popup
  mapLayerPopup: {
    width: width * 0.75,
  },

  mapLayerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },

  mapLayerOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },

  mapLayerOptionActive: {
    borderWidth: 2,
    borderColor: '#06B6D4',
  },

  mapLayerOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Bottom Sheet
  bottomSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },

  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // Universe Card
  universeCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  cardImageContainer: {
    position: 'relative',
  },

  cardImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#E5E7EB',
  },

  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  categoryBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  cardContent: {
    padding: 16,
  },

  cardName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },

   cardLocation: {
    fontSize: 14,
    marginBottom: 8,
  },

  // Signal Grid (2x2 review bars)
  signalGrid: {
    marginBottom: 12,
  },

  signalRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },

  signalBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 6,
  },

  signalGood: {
    backgroundColor: '#3B82F6',
  },

  signalVibe: {
    backgroundColor: '#8B5CF6',
  },

  signalHeadsUp: {
    backgroundColor: '#F59E0B',
  },

  signalText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardPlaces: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
});
