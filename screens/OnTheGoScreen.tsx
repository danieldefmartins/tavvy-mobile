/**
 * OnTheGoScreen.tsx
 * Dedicated map view for On The Go mobile businesses
 * Path: screens/OnTheGoScreen.tsx
 *
 * FEATURES:
 * - Full-screen map showing all live On The Go businesses
 * - Category filtering (Food Trucks, Mobile Services, etc.)
 * - Real-time updates (refreshes every 30 seconds)
 * - Pulsing markers for live businesses
 * - Session details bottom sheet
 * - Navigation to business location
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Supabase Edge Function URL
const SUPABASE_URL = 'https://scasgwrikoqdwlwlwcff.supabase.co';

// Map style
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

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

interface LiveSession {
  session_id: string;
  place_id: string;
  session_lat: number;
  session_lng: number;
  place_name: string;
  category?: string;
  subcategory?: string;
  cover_image_url?: string;
  phone?: string;
  location_label?: string;
  today_note?: string;
  started_at: string;
  scheduled_end_at: string;
}

interface MapDataResponse {
  success: boolean;
  count: number;
  available_categories: string[];
  sessions: LiveSession[];
}

export default function OnTheGoScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  
  // Animation for pulsing markers
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Start pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
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

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation([location.coords.longitude, location.coords.latitude]);
      } else {
        // Default to Austin, TX
        setUserLocation([-97.7431, 30.2672]);
      }
    })();
  }, []);

  // Fetch live sessions
  const fetchSessions = useCallback(async () => {
    try {
      let url = `${SUPABASE_URL}/functions/v1/live-onthego-map-data`;
      if (selectedCategory) {
        url += `?category=${encodeURIComponent(selectedCategory)}`;
      }
      
      const response = await fetch(url);
      const data: MapDataResponse = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
        setAvailableCategories(data.available_categories);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // Handle marker press
  const handleMarkerPress = (session: LiveSession) => {
    setSelectedSession(session);
    // Center map on selected session
    cameraRef.current?.setCamera({
      centerCoordinate: [session.session_lng, session.session_lat],
      zoomLevel: 15,
      animationDuration: 500,
    });
  };

  // Get directions to session
  const getDirections = (session: LiveSession) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${session.session_lat},${session.session_lng}`,
      android: `google.navigation:q=${session.session_lat},${session.session_lng}`,
    });
    if (url) Linking.openURL(url);
  };

  // Call business
  const callBusiness = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
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

  // Get marker icon
  const getMarkerIcon = (category?: string) => {
    if (!category) return CATEGORY_ICONS.default;
    return CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
  };

  // Get marker color
  const getMarkerColor = (category?: string) => {
    if (!category) return CATEGORY_COLORS.default;
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  };

  // Dynamic styles
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? theme.background : '#F3F4F6',
    },
    text: {
      color: isDark ? theme.text : '#111827',
    },
    textSecondary: {
      color: isDark ? theme.textSecondary : '#6B7280',
    },
    card: {
      backgroundColor: isDark ? theme.cardBackground : '#FFFFFF',
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>On The Go</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveCount}>{sessions.length} Live</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowCategoryFilter(!showCategoryFilter)}
            >
              <Ionicons 
                name="filter" 
                size={22} 
                color={selectedCategory ? '#10B981' : '#FFFFFF'} 
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Category Filter */}
      {showCategoryFilter && (
        <View style={[styles.categoryFilterContainer, dynamicStyles.card]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive,
              ]}>
                All
              </Text>
            </TouchableOpacity>
            {availableCategories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Ionicons 
                  name={getMarkerIcon(category) as any} 
                  size={16} 
                  color={selectedCategory === category ? '#FFFFFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive,
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={[styles.loadingText, dynamicStyles.textSecondary]}>
              Finding live businesses...
            </Text>
          </View>
        ) : (
          <>
            {/* @ts-ignore - MapLibreGL types are incomplete */}
            <MapLibreGL.MapView
              style={styles.map}
              styleURL={MAP_STYLE_URL}
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
                  centerCoordinate: userLocation || [-97.7431, 30.2672],
                  zoomLevel: 12,
                }}
                animationMode="flyTo"
                animationDuration={800}
              />

              {/* User location marker */}
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

              {/* Live session markers */}
              {sessions.map((session) => (
                <MapLibreGL.PointAnnotation
                  key={session.session_id}
                  id={session.session_id}
                  coordinate={[session.session_lng, session.session_lat]}
                  onSelected={() => handleMarkerPress(session)}
                >
                  <View style={styles.markerContainer}>
                    <View style={[
                      styles.marker,
                      { backgroundColor: getMarkerColor(session.category) },
                    ]}>
                      <Ionicons
                        name={getMarkerIcon(session.category) as any}
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View style={[
                      styles.markerPulse,
                      { backgroundColor: getMarkerColor(session.category) },
                    ]} />
                  </View>
                </MapLibreGL.PointAnnotation>
              ))}
            </MapLibreGL.MapView>

            {/* My Location Button */}
            <TouchableOpacity
              style={styles.myLocationButton}
              onPress={() => {
                if (userLocation) {
                  cameraRef.current?.setCamera({
                    centerCoordinate: userLocation,
                    zoomLevel: 14,
                    animationDuration: 500,
                  });
                }
              }}
            >
              <Ionicons name="locate" size={24} color="#374151" />
            </TouchableOpacity>

            {/* Refresh Button */}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchSessions}
            >
              <Ionicons name="refresh" size={20} color="#374151" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Empty State */}
      {!isLoading && sessions.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyStateContent}>
            <Text style={styles.emptyStateEmoji}>🚚</Text>
            <Text style={[styles.emptyStateTitle, dynamicStyles.text]}>
              No one's live right now
            </Text>
            <Text style={[styles.emptyStateText, dynamicStyles.textSecondary]}>
              {selectedCategory 
                ? `No ${selectedCategory} businesses are live in this area.`
                : 'Check back later to see mobile businesses near you.'
              }
            </Text>
            {selectedCategory && (
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={styles.clearFilterText}>Show all categories</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Selected Session Card */}
      {selectedSession && (
        <View style={[styles.sessionCard, dynamicStyles.card]}>
          <TouchableOpacity
            style={styles.sessionCardClose}
            onPress={() => setSelectedSession(null)}
          >
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.sessionCardHeader}>
            {selectedSession.cover_image_url ? (
              <Image
                source={{ uri: selectedSession.cover_image_url }}
                style={styles.sessionCardImage}
              />
            ) : (
              <LinearGradient
                colors={[getMarkerColor(selectedSession.category), '#F97316']}
                style={styles.sessionCardImage}
              >
                <Ionicons
                  name={getMarkerIcon(selectedSession.category) as any}
                  size={32}
                  color="#FFFFFF"
                />
              </LinearGradient>
            )}
            
            <View style={styles.sessionCardInfo}>
              <View style={styles.sessionCardLive}>
                <View style={styles.liveDotSmall} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={[styles.sessionCardName, dynamicStyles.text]} numberOfLines={1}>
                {selectedSession.place_name}
              </Text>
              {selectedSession.location_label && (
                <Text style={[styles.sessionCardLocation, dynamicStyles.textSecondary]} numberOfLines={1}>
                  📍 {selectedSession.location_label}
                </Text>
              )}
              <Text style={styles.sessionCardTime}>
                {getTimeRemaining(selectedSession.scheduled_end_at)}
              </Text>
            </View>
          </View>

          {selectedSession.today_note && (
            <View style={styles.sessionCardNote}>
              <Text style={[styles.sessionCardNoteText, dynamicStyles.textSecondary]} numberOfLines={2}>
                "{selectedSession.today_note}"
              </Text>
            </View>
          )}

          <View style={styles.sessionCardActions}>
            <TouchableOpacity
              style={styles.sessionCardButton}
              onPress={() => getDirections(selectedSession)}
            >
              <Ionicons name="navigate" size={20} color="#FFFFFF" />
              <Text style={styles.sessionCardButtonText}>Directions</Text>
            </TouchableOpacity>
            
            {selectedSession.phone && (
              <TouchableOpacity
                style={[styles.sessionCardButton, styles.sessionCardButtonSecondary]}
                onPress={() => callBusiness(selectedSession.phone!)}
              >
                <Ionicons name="call" size={20} color="#10B981" />
                <Text style={[styles.sessionCardButtonText, styles.sessionCardButtonTextSecondary]}>
                  Call
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  
  // Header
  header: {
    backgroundColor: '#0F1233',
    zIndex: 10,
  },
  headerSafeArea: {
    backgroundColor: '#0F1233',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  filterButton: {
    padding: 8,
  },

  // Category Filter
  categoryFilterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#10B981',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },

  // Map
  mapContainer: {
    flex: 1,
  },
  map: {
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

  // Markers
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  markerPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    opacity: 0.3,
  },
  userLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Map Buttons
  myLocationButton: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 6,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },

  // Empty State
  emptyState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  emptyStateContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFilterButton: {
    paddingVertical: 8,
  },
  clearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },

  // Session Card
  sessionCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sessionCardClose: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  sessionCardImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionCardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  sessionCardLive: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  sessionCardName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  sessionCardLocation: {
    fontSize: 13,
    marginBottom: 2,
  },
  sessionCardTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F97316',
  },
  sessionCardNote: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  sessionCardNoteText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  sessionCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionCardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10B981',
    gap: 8,
  },
  sessionCardButtonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  sessionCardButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionCardButtonTextSecondary: {
    color: '#10B981',
  },
});
