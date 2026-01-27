/**
 * PlaceScheduleScreen.tsx
 * View upcoming scheduled events for an On The Go business
 * Path: screens/PlaceScheduleScreen.tsx
 *
 * FEATURES:
 * - Shows all upcoming scheduled locations for a business
 * - Displays date, time, and location for each event
 * - Get directions to scheduled location
 * - Set reminder for upcoming event
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const SUPABASE_URL = 'https://scasgwrikoqdwlwlwcff.supabase.co';

// Category colors
const CATEGORY_COLORS: Record<string, string[]> = {
  'Food Trucks': ['#EF4444', '#DC2626'],
  'Mobile Services': ['#3B82F6', '#2563EB'],
  'Pop-ups': ['#8B5CF6', '#7C3AED'],
  'default': ['#10B981', '#059669'],
};

interface ScheduledEvent {
  id: string;
  event_title?: string;
  event_description?: string;
  location_name: string;
  location_address?: string;
  latitude: number;
  longitude: number;
  scheduled_start: string;
  scheduled_end: string;
  formatted_date: string;
  formatted_time: string;
  relative_time: string;
  days_until: number;
}

interface PlaceInfo {
  id: string;
  name: string;
  tavvy_category?: string;
  cover_image_url?: string;
  phone?: string;
  service_area?: string;
  is_active_today: boolean;
  current_address?: string;
}

interface ScheduleResponse {
  success: boolean;
  tavvy_place_id: string;
  place: PlaceInfo | null;
  is_live_now: boolean;
  has_upcoming_events: boolean;
  event_count: number;
  events: ScheduledEvent[];
}

type RouteParams = {
  PlaceSchedule: {
    tavvyPlaceId: string;
    placeName?: string;
  };
};

export default function PlaceScheduleScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'PlaceSchedule'>>();
  const { theme, isDark } = useThemeContext();
  
  const { tavvyPlaceId, placeName } = route.params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [place, setPlace] = useState<PlaceInfo | null>(null);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [isLiveNow, setIsLiveNow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/get-place-schedule?tavvy_place_id=${tavvyPlaceId}&include_place=true`
      );
      const data: ScheduleResponse = await response.json();
      
      if (data.success) {
        setPlace(data.place);
        setEvents(data.events);
        setIsLiveNow(data.is_live_now);
        setError(null);
      } else {
        setError('Failed to load schedule');
      }
    } catch (err) {
      console.error('Fetch schedule error:', err);
      setError('Unable to load schedule');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [tavvyPlaceId]);

  const getDirections = (event: ScheduledEvent) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${event.latitude},${event.longitude}`,
      android: `google.navigation:q=${event.latitude},${event.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  const callBusiness = () => {
    if (place?.phone) {
      Linking.openURL(`tel:${place.phone}`);
    }
  };

  const getCategoryColors = (category?: string) => {
    if (!category) return CATEGORY_COLORS.default;
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  };

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

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, dynamicStyles.container]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={[styles.loadingText, dynamicStyles.textSecondary]}>
          Loading schedule...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={getCategoryColors(place?.tavvy_category)}
        style={styles.header}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {place?.name || placeName || 'Schedule'}
              </Text>
              {isLiveNow && (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE NOW</Text>
                </View>
              )}
            </View>
            
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchSchedule(true)}
            tintColor="#10B981"
          />
        }
      >
        {/* Place Info Card */}
        {place && (
          <View style={[styles.placeCard, dynamicStyles.card]}>
            <View style={styles.placeHeader}>
              {place.cover_image_url ? (
                <Image
                  source={{ uri: place.cover_image_url }}
                  style={styles.placeImage}
                />
              ) : (
                <LinearGradient
                  colors={getCategoryColors(place.tavvy_category)}
                  style={styles.placeImage}
                >
                  <Ionicons name="storefront" size={32} color="#FFFFFF" />
                </LinearGradient>
              )}
              
              <View style={styles.placeInfo}>
                <Text style={[styles.placeName, dynamicStyles.text]}>
                  {place.name}
                </Text>
                {place.tavvy_category && (
                  <Text style={[styles.placeCategory, dynamicStyles.textSecondary]}>
                    {place.tavvy_category}
                  </Text>
                )}
                {place.service_area && (
                  <Text style={[styles.placeServiceArea, dynamicStyles.textSecondary]}>
                    📍 {place.service_area}
                  </Text>
                )}
              </View>
            </View>

            {/* Current Status */}
            <View style={styles.statusContainer}>
              {isLiveNow ? (
                <View style={styles.statusLive}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusLiveText}>Currently Live</Text>
                </View>
              ) : (
                <View style={styles.statusOffline}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={[styles.statusOfflineText, dynamicStyles.textSecondary]}>
                    {place.current_address || 'Business offline'}
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            {place.phone && (
              <TouchableOpacity style={styles.callButton} onPress={callBusiness}>
                <Ionicons name="call" size={18} color="#10B981" />
                <Text style={styles.callButtonText}>Call Business</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Schedule Section */}
        <View style={styles.scheduleSection}>
          <Text style={[styles.sectionTitle, dynamicStyles.text]}>
            Upcoming Schedule
          </Text>
          
          {events.length === 0 ? (
            <View style={[styles.emptyState, dynamicStyles.card]}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={[styles.emptyTitle, dynamicStyles.text]}>
                No Upcoming Events
              </Text>
              <Text style={[styles.emptySubtitle, dynamicStyles.textSecondary]}>
                This business hasn't scheduled any upcoming locations yet.
              </Text>
            </View>
          ) : (
            events.map((event, index) => (
              <View key={event.id} style={[styles.eventCard, dynamicStyles.card]}>
                {/* Date Badge */}
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>{event.relative_time}</Text>
                </View>

                <View style={styles.eventContent}>
                  {/* Event Title */}
                  {event.event_title && (
                    <Text style={[styles.eventTitle, dynamicStyles.text]}>
                      {event.event_title}
                    </Text>
                  )}

                  {/* Date & Time */}
                  <View style={styles.eventRow}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={[styles.eventText, dynamicStyles.textSecondary]}>
                      {event.formatted_date}
                    </Text>
                  </View>
                  
                  <View style={styles.eventRow}>
                    <Ionicons name="time" size={16} color="#6B7280" />
                    <Text style={[styles.eventText, dynamicStyles.textSecondary]}>
                      {event.formatted_time}
                    </Text>
                  </View>

                  {/* Location */}
                  <View style={styles.eventRow}>
                    <Ionicons name="location" size={16} color="#10B981" />
                    <View style={styles.locationInfo}>
                      <Text style={[styles.locationName, dynamicStyles.text]}>
                        {event.location_name}
                      </Text>
                      {event.location_address && (
                        <Text style={[styles.locationAddress, dynamicStyles.textSecondary]}>
                          {event.location_address}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Description */}
                  {event.event_description && (
                    <Text style={[styles.eventDescription, dynamicStyles.textSecondary]}>
                      {event.event_description}
                    </Text>
                  )}

                  {/* Actions */}
                  <View style={styles.eventActions}>
                    <TouchableOpacity
                      style={styles.directionsButton}
                      onPress={() => getDirections(event)}
                    >
                      <Ionicons name="navigate" size={16} color="#FFFFFF" />
                      <Text style={styles.directionsButtonText}>Get Directions</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  // Header
  header: {
    paddingBottom: 16,
  },
  headerSafeArea: {},
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
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
    marginTop: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Place Card
  placeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  placeImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  placeName: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeCategory: {
    fontSize: 14,
    marginTop: 2,
  },
  placeServiceArea: {
    fontSize: 13,
    marginTop: 4,
  },
  statusContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statusLive: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusLiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  statusOffline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusOfflineText: {
    fontSize: 14,
    marginLeft: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
    marginTop: 12,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
  },

  // Schedule Section
  scheduleSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },

  // Event Card
  eventCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateBadge: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dateBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventText: {
    fontSize: 14,
    marginLeft: 10,
  },
  locationInfo: {
    flex: 1,
    marginLeft: 10,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  eventDescription: {
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  eventActions: {
    marginTop: 16,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
  },
  directionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
