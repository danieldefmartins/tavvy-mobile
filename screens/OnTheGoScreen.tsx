/**
 * OnTheGoScreen.tsx
 * Dedicated map view for On The Go mobile businesses
 * Path: screens/OnTheGoScreen.tsx
 *
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Full-screen map as the hero
 * - Floating translucent UI elements
 * - Glassy filter pills
 * - Pulsing live markers
 * - Collapsible "Live Now" tray
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Linking,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Supabase Edge Function URL
const SUPABASE_URL = 'https://scasgwrikoqdwlwlwcff.supabase.co';

// Map Styles Configuration - matching Home Screen
const MAP_STYLES = {
  osm: {
    name: 'Standard',
    type: 'raster',
    tileUrl: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    icon: 'map',
  },
  dark: {
    name: 'Dark',
    type: 'raster',
    tileUrl: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    icon: 'moon',
  },
  satellite: {
    name: 'Satellite',
    type: 'raster',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    icon: 'image',
  },
};

// V2 Design System Colors
const COLORS = {
  background: '#0A0A0F',  // V2 Pure black
  backgroundLight: '#FAFAFA',
  surface: '#1A1A24',  // V2 Card background
  surfaceLight: '#FFFFFF',
  glassy: 'rgba(26, 26, 36, 0.85)',  // V2 Glassy dark
  glassyLight: 'rgba(255, 255, 255, 0.9)',
  accent: '#6B7FFF',  // V2 Blue gradient start
  accentEnd: '#5563E8',  // V2 Blue gradient end
  accentGreen: '#10B981',  // Tavvy green
  accentGold: '#F59E0B',  // Tavvy gold
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',  // V2 Secondary text
  textMuted: '#6B7280',
  live: '#EF4444',
  success: '#10B981',
};

// Category icons mapping
const CATEGORY_ICONS: Record<string, string> = {
  'Food Trucks': 'fast-food',
  'Mobile Services': 'construct',
  'Pop-ups': 'storefront',
  'Coffee': 'cafe',
  'Ice Cream': 'ice-cream',
  'BBQ': 'flame',
  'Tacos': 'restaurant',
  'default': 'location',
};

// Category colors for markers
const CATEGORY_COLORS: Record<string, string> = {
  'Food Trucks': '#EF4444',
  'Mobile Services': '#3B82F6',
  'Pop-ups': '#8B5CF6',
  'Coffee': '#78350F',
  'Ice Cream': '#EC4899',
  'BBQ': '#F97316',
  'Tacos': '#EAB308',
  'default': '#10B981',
};

// Filter categories - On The Go mobile businesses
const FILTER_CATEGORIES = [
  { id: 'all', name: 'All', icon: 'grid-outline' },
  { id: 'live', name: 'Live Now', icon: 'radio-outline' },
  { id: 'food', name: 'Food', icon: 'restaurant-outline' },
  { id: 'pet-grooming', name: 'Pet Grooming', icon: 'paw-outline' },
  { id: 'hair-dresser', name: 'Hair Dresser', icon: 'cut-outline' },
  { id: 'coffee', name: 'Coffee', icon: 'cafe-outline' },
  { id: 'mobile-services', name: 'Services', icon: 'construct-outline' },
];

interface LiveSession {
  session_id?: string;
  tavvy_place_id: string;
  session_lat?: number;
  session_lng?: number;
  place_name: string;
  category?: string;
  subcategory?: string;
  cover_image_url?: string;
  phone?: string;
  service_area?: string;
  location_label?: string;
  session_address?: string;
  today_note?: string;
  started_at?: string;
  scheduled_end_at?: string;
  is_live: boolean;
  has_schedule?: boolean;
}

interface ScheduledPlace {
  tavvy_place_id: string;
  place_name: string;
  category?: string;
  subcategory?: string;
  cover_image_url?: string;
  phone?: string;
  service_area?: string;
  is_live: boolean;
  has_schedule: boolean;
  next_event_label?: string;
  next_event?: {
    location_name: string;
    location_address?: string;
    latitude: number;
    longitude: number;
    scheduled_start: string;
    scheduled_end: string;
  };
}

interface MapDataResponse {
  success: boolean;
  live_count: number;
  scheduled_count: number;
  total_count: number;
  available_categories: string[];
  sessions: LiveSession[];
  scheduled_places: ScheduledPlace[];
}

export default function OnTheGoScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [scheduledPlaces, setScheduledPlaces] = useState<ScheduledPlace[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [selectedScheduledPlace, setSelectedScheduledPlace] = useState<ScheduledPlace | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showTray, setShowTray] = useState(false);
  
  // Map layer switcher state
  // Always default to Standard map (osm), regardless of theme
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('osm');
  const [showMapLayerPopup, setShowMapLayerPopup] = useState(false);
  
  // Animation for pulsing markers
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const trayAnim = useRef(new Animated.Value(0)).current;

  // Start pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Toggle tray animation
  useEffect(() => {
    Animated.spring(trayAnim, {
      toValue: showTray ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [showTray]);

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation([location.coords.longitude, location.coords.latitude]);
      } else {
        setUserLocation([-97.7431, 30.2672]); // Default to Austin, TX
      }
    })();
  }, []);

  // Fetch live sessions
  const fetchSessions = useCallback(async () => {
    try {
      let url = `${SUPABASE_URL}/functions/v1/live-onthego-map-data?include_scheduled=true`;
      
      const categoryMap: Record<string, string> = {
        'food-trucks': 'Food Trucks',
        'coffee': 'Coffee',
        'services': 'Mobile Services',
        'pop-ups': 'Pop-ups',
      };
      
      if (selectedFilter && selectedFilter !== 'all' && selectedFilter !== 'live' && categoryMap[selectedFilter]) {
        url += `&category=${encodeURIComponent(categoryMap[selectedFilter])}`;
      }
      
      const response = await fetch(url);
      const data: MapDataResponse = await response.json();
      
      if (data.success) {
        const sessionsWithLive = data.sessions.map(s => ({ ...s, is_live: true }));
        
        if (selectedFilter === 'live') {
          setSessions(sessionsWithLive);
          setScheduledPlaces([]);
        } else {
          setSessions(sessionsWithLive);
          setScheduledPlaces(data.scheduled_places || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // Handle marker press for live session
  const handleMarkerPress = (session: LiveSession) => {
    setSelectedScheduledPlace(null);
    setSelectedSession(session);
    if (session.session_lng && session.session_lat) {
      cameraRef.current?.setCamera({
        centerCoordinate: [session.session_lng, session.session_lat],
        zoomLevel: 15,
        animationDuration: 500,
      });
    }
  };

  // Handle marker press for scheduled place (offline with upcoming events)
  const handleScheduledPlacePress = (place: ScheduledPlace) => {
    setSelectedSession(null);
    setSelectedScheduledPlace(place);
    if (place.next_event) {
      cameraRef.current?.setCamera({
        centerCoordinate: [place.next_event.longitude, place.next_event.latitude],
        zoomLevel: 15,
        animationDuration: 500,
      });
    }
  };

  // Navigate to schedule screen
  const viewSchedule = (tavvyPlaceId: string, placeName: string) => {
    navigation.navigate('PlaceSchedule', { tavvyPlaceId, placeName });
  };

  // Get directions
  const getDirections = (session: LiveSession) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${session.session_lat},${session.session_lng}`,
      android: `google.navigation:q=${session.session_lat},${session.session_lng}`,
    });
    if (url) Linking.openURL(url);
  };

  // Calculate time remaining
  const getTimeRemaining = (endAt: string) => {
    const now = new Date();
    const end = new Date(endAt);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  // Get marker icon/color
  const getMarkerIcon = (category?: string) => CATEGORY_ICONS[category || 'default'] || CATEGORY_ICONS.default;
  const getMarkerColor = (category?: string) => CATEGORY_COLORS[category || 'default'] || CATEGORY_COLORS.default;

  // Center on user
  const centerOnUser = () => {
    if (userLocation) {
      cameraRef.current?.setCamera({
        centerCoordinate: userLocation,
        zoomLevel: 13,
        animationDuration: 500,
      });
    }
  };

  // V2 Design System - Always use V2 colors
  const glassyBg = isDark ? 'rgba(26, 26, 36, 0.95)' : COLORS.glassyLight;
  const textColor = COLORS.textPrimary;
  const secondaryTextColor = COLORS.textSecondary;

  const trayTranslateY = trayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Full-Screen Map */}
      {isLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>
            Finding live businesses...
          </Text>
        </View>
      ) : (
        <>
          {/* @ts-ignore */}
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
            {/* Raster tile layer for map styles */}
            <MapLibreGL.RasterSource
              id="raster-source"
              tileUrlTemplates={[(MAP_STYLES[mapStyle] as any).tileUrl]}
              tileSize={256}
            >
              <MapLibreGL.RasterLayer id="raster-layer" sourceID="raster-source" style={{ rasterOpacity: 1 }} />
            </MapLibreGL.RasterSource>
            <MapLibreGL.Camera
              ref={cameraRef}
              defaultSettings={{
                centerCoordinate: userLocation || [-97.7431, 30.2672],
                zoomLevel: 12,
              }}
              animationMode="flyTo"
              animationDuration={800}
            />

            {/* User location marker */}
            {userLocation && (
              <MapLibreGL.PointAnnotation id="user-location" coordinate={userLocation}>
                <View style={styles.userLocationMarker}>
                  <View style={styles.userLocationDot} />
                </View>
              </MapLibreGL.PointAnnotation>
            )}

            {/* Live session markers */}
            {sessions.map((session) => (
              <MapLibreGL.PointAnnotation
                key={session.session_id || session.tavvy_place_id}
                id={session.session_id || session.tavvy_place_id}
                coordinate={[session.session_lng!, session.session_lat!]}
                onSelected={() => handleMarkerPress(session)}
              >
                <View style={styles.markerContainer}>
                  <View style={[styles.marker, { backgroundColor: getMarkerColor(session.category) }]}>
                    <Ionicons name={getMarkerIcon(session.category) as any} size={18} color="#FFFFFF" />
                  </View>
                  <View style={[styles.markerPulse, { backgroundColor: getMarkerColor(session.category) }]} />
                </View>
              </MapLibreGL.PointAnnotation>
            ))}

            {/* Scheduled place markers (dimmed) */}
            {scheduledPlaces.map((place) => (
              place.next_event && (
                <MapLibreGL.PointAnnotation
                  key={`scheduled-${place.tavvy_place_id}`}
                  id={`scheduled-${place.tavvy_place_id}`}
                  coordinate={[place.next_event.longitude, place.next_event.latitude]}
                  onSelected={() => handleScheduledPlacePress(place)}
                >
                  <View style={[styles.scheduledMarker, { borderColor: getMarkerColor(place.category) }]}>
                    <Ionicons name="calendar" size={16} color={getMarkerColor(place.category)} />
                  </View>
                </MapLibreGL.PointAnnotation>
              )
            ))}
          </MapLibreGL.MapView>

          {/* Floating Header */}
          {/* V2 Header - Full width black background */}
          <SafeAreaView style={styles.v2Header} edges={['top']}>
            <View style={styles.v2HeaderContent}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.v2BackButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.v2HeaderTitle}>On The Go</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login' as never)} style={styles.v2LoginButton}>
                <Ionicons name="person-circle-outline" size={28} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Floating Filter Pills */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              {FILTER_CATEGORIES.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterPill,
                    { backgroundColor: glassyBg },
                    selectedFilter === filter.id && styles.filterPillActive,
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Ionicons
                    name={filter.icon as any}
                    size={16}
                    color={selectedFilter === filter.id ? '#FFFFFF' : COLORS.accent}
                  />
                  <Text style={[
                    styles.filterPillText,
                    { color: selectedFilter === filter.id ? '#FFFFFF' : textColor },
                  ]}>
                    {filter.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Map Layer Switcher Button */}
          <TouchableOpacity 
            style={[styles.layersButton, { backgroundColor: glassyBg }]} 
            onPress={() => setShowMapLayerPopup(true)}
            accessibilityLabel="Change map layer" 
            accessibilityRole="button"
          >
            <Ionicons name="layers-outline" size={24} color={textColor} />
          </TouchableOpacity>

          {/* My Location Button */}
          <TouchableOpacity style={[styles.myLocationButton, { backgroundColor: glassyBg }]} onPress={centerOnUser}>
            <Ionicons name="locate" size={24} color={COLORS.accent} />
          </TouchableOpacity>

          {/* Live Now Bottom Sheet - unified component */}
          <Animated.View style={[
            styles.liveTray,
            { backgroundColor: glassyBg, transform: [{ translateY: trayTranslateY }] },
          ]}>
            {/* Bottom Sheet Header/Handle */}
            <TouchableOpacity
              style={styles.trayToggle}
              onPress={() => setShowTray(!showTray)}
            >
              <View style={styles.liveDot} />
              <Text style={[styles.trayToggleText, { color: textColor }]}>
                {sessions.length} Live Now
              </Text>
              <Ionicons name={showTray ? 'chevron-down' : 'chevron-up'} size={20} color={secondaryTextColor} />
            </TouchableOpacity>
            
            {/* Live Business Results */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trayScroll}>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.session_id || session.tavvy_place_id}
                  style={[
                    styles.trayCard, 
                    { 
                      backgroundColor: isDark ? COLORS.surface : '#FFFFFF',
                      shadowColor: isDark ? 'transparent' : '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0 : 0.1,
                      shadowRadius: 6,
                      elevation: isDark ? 0 : 3,
                    }
                  ]}
                  onPress={() => handleMarkerPress(session)}
                >
                  {session.cover_image_url ? (
                    <Image source={{ uri: session.cover_image_url }} style={styles.trayCardImage} />
                  ) : (
                    <View style={[styles.trayCardImage, { backgroundColor: getMarkerColor(session.category) }]}>
                      <Ionicons name={getMarkerIcon(session.category) as any} size={24} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={styles.trayCardContent}>
                    <Text style={[styles.trayCardName, { color: textColor }]} numberOfLines={1}>
                      {session.place_name}
                    </Text>
                    <Text style={[styles.trayCardTime, { color: COLORS.live }]}>
                      {getTimeRemaining(session.scheduled_end_at || '')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Selected Session Detail Card */}
          {selectedSession && (
            <View style={[styles.detailCard, { backgroundColor: glassyBg }]}>
              <TouchableOpacity style={styles.detailClose} onPress={() => setSelectedSession(null)}>
                <Ionicons name="close" size={22} color={secondaryTextColor} />
              </TouchableOpacity>
              
              <View style={styles.detailHeader}>
                {selectedSession.cover_image_url ? (
                  <Image source={{ uri: selectedSession.cover_image_url }} style={styles.detailImage} />
                ) : (
                  <View style={[styles.detailImage, { backgroundColor: getMarkerColor(selectedSession.category) }]}>
                    <Ionicons name={getMarkerIcon(selectedSession.category) as any} size={28} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.detailInfo}>
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDotSmall} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                  <Text style={[styles.detailName, { color: textColor }]} numberOfLines={1}>
                    {selectedSession.place_name}
                  </Text>
                  <Text style={[styles.detailLocation, { color: secondaryTextColor }]} numberOfLines={1}>
                    📍 {selectedSession.session_address || selectedSession.location_label || 'Location'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.directionsButton} onPress={() => getDirections(selectedSession)}>
                  <Ionicons name="navigate" size={20} color="#FFFFFF" />
                  <Text style={styles.directionsButtonText}>Get Directions</Text>
                </TouchableOpacity>
                {selectedSession.has_schedule && (
                  <TouchableOpacity 
                    style={styles.scheduleLink} 
                    onPress={() => viewSchedule(selectedSession.tavvy_place_id, selectedSession.place_name)}
                  >
                    <Ionicons name="calendar-outline" size={16} color={COLORS.accent} />
                    <Text style={[styles.scheduleLinkText, { color: COLORS.accent }]}>Check Schedule</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Selected Scheduled Place Detail Card */}
          {selectedScheduledPlace && (
            <View style={[styles.detailCard, { backgroundColor: glassyBg }]}>
              <TouchableOpacity style={styles.detailClose} onPress={() => setSelectedScheduledPlace(null)}>
                <Ionicons name="close" size={22} color={secondaryTextColor} />
              </TouchableOpacity>
              
              <View style={styles.detailHeader}>
                {selectedScheduledPlace.cover_image_url ? (
                  <Image source={{ uri: selectedScheduledPlace.cover_image_url }} style={styles.detailImage} />
                ) : (
                  <View style={[styles.detailImage, { backgroundColor: getMarkerColor(selectedScheduledPlace.category) }]}>
                    <Ionicons name={getMarkerIcon(selectedScheduledPlace.category) as any} size={28} color="#FFFFFF" />
                  </View>
                )}
                <View style={styles.detailInfo}>
                  <View style={styles.offlineBadge}>
                    <Ionicons name="time-outline" size={12} color="#6B7280" />
                    <Text style={styles.offlineText}>OFFLINE</Text>
                  </View>
                  <Text style={[styles.detailName, { color: textColor }]} numberOfLines={1}>
                    {selectedScheduledPlace.place_name}
                  </Text>
                  {selectedScheduledPlace.next_event && (
                    <Text style={[styles.detailLocation, { color: secondaryTextColor }]} numberOfLines={1}>
                      📅 Next: {selectedScheduledPlace.next_event_label || selectedScheduledPlace.next_event.location_name}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.directionsButton, { backgroundColor: COLORS.accent }]} 
                onPress={() => viewSchedule(selectedScheduledPlace.tavvy_place_id, selectedScheduledPlace.place_name)}
              >
                <Ionicons name="calendar" size={20} color="#FFFFFF" />
                <Text style={styles.directionsButtonText}>Check Schedule</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Map Layer Popup Modal */}
      <Modal
        visible={showMapLayerPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMapLayerPopup(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMapLayerPopup(false)}
        >
          <View style={[styles.mapLayerPopup, { backgroundColor: COLORS.surface }]}>
            <Text style={[styles.popupTitle, { color: COLORS.text }]}>Map Type</Text>
            
            <View style={styles.mapLayerOptions}>
              {Object.entries(MAP_STYLES).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.mapLayerOption,
                    mapStyle === key && styles.mapLayerOptionActive,
                    { backgroundColor: 'rgba(255, 255, 255, 0.08)' }
                  ]}
                  onPress={() => {
                    setMapStyle(key as keyof typeof MAP_STYLES);
                    setShowMapLayerPopup(false);
                  }}
                >
                  <Ionicons 
                    name={value.icon as any} 
                    size={28} 
                    color={mapStyle === key ? COLORS.accent : COLORS.textSecondary} 
                  />
                  <Text style={[
                    styles.mapLayerOptionText,
                    { color: mapStyle === key ? COLORS.accent : COLORS.text }
                  ]}>
                    {value.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
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

  // V2 Header - Full width black background
  v2Header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: COLORS.background,
  },
  v2HeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  v2BackButton: {
    padding: 4,
    width: 40,
  },
  v2HeaderTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  v2LoginButton: {
    padding: 4,
    width: 40,
    alignItems: 'flex-end',
  },

  // Filter Pills - positioned below V2 header with proper spacing
  filterContainer: {
    position: 'absolute',
    top: 135,
    left: 0,
    right: 0,
    zIndex: 9,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: '#6B7FFF', // V2 Blue accent
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Map Layers Button
  layersButton: {
    position: 'absolute',
    right: 16,
    bottom: 260,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // My Location Button
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Live Tray Toggle - now header inside bottom sheet
  trayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  trayToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },

  // Live Tray - unified bottom sheet
  liveTray: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 90,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  trayScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  trayCard: {
    width: 140,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  trayCardImage: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trayCardContent: {
    padding: 10,
  },
  trayCardName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  trayCardTime: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Detail Card
  detailCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 180,
    borderRadius: 20,
    padding: 16,
  },
  detailClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.live,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.live,
  },
  detailName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  detailLocation: {
    fontSize: 13,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Markers - Enhanced GPS dot with glow
  userLocationMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(107, 127, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  userLocationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerPulse: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    opacity: 0.3,
  },
  scheduledMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.live,
  },

  // Detail Actions
  detailActions: {
    gap: 12,
  },
  scheduleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  scheduleLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Offline Badge
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },

  // Map Layer Popup Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLayerPopup: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  mapLayerOptions: {
    gap: 12,
  },
  mapLayerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  mapLayerOptionActive: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  mapLayerOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
