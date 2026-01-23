// =============================================
// HAPPENING NOW COMPONENT
// =============================================
// Horizontal carousel showing real events from Ticketmaster, PredictHQ, and Tavvy
// "What's Happening Now" - real-time discovery

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getHappeningNowEvents, TavvyEvent } from '../lib/eventsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;

// Default placeholder image for events without images
const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600';

interface HappeningNowProps {
  onEventPress?: (event: TavvyEvent) => void;
}

export const HappeningNow: React.FC<HappeningNowProps> = ({
  onEventPress,
}) => {
  const [events, setEvents] = useState<TavvyEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const navigation = useNavigation();

  // Get user location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          // Default to Orlando, FL
          setUserLocation({ lat: 28.5383, lng: -81.3792 });
          return;
        }
        
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch (err) {
        console.error('[HappeningNow] Location error:', err);
        // Default to Orlando, FL
        setUserLocation({ lat: 28.5383, lng: -81.3792 });
      }
    })();
  }, []);

  // Fetch events when location is available
  useEffect(() => {
    if (userLocation) {
      loadEvents();
    }
  }, [userLocation]);

  const loadEvents = async () => {
    if (!userLocation) return;
    
    setIsLoading(true);
    try {
      const fetchedEvents = await getHappeningNowEvents({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusMiles: 50,
        timeFilter: 'week', // Show events for the next week
        limit: 10,
      });

      setEvents(fetchedEvents);
    } catch (error) {
      console.error('[HappeningNow] Error loading events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatEventDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Tonight';
    if (isTomorrow) return 'Tomorrow';
    
    // Check if this weekend
    const dayOfWeek = now.getDay();
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
    const saturday = new Date(now);
    saturday.setDate(saturday.getDate() + daysUntilSaturday);
    const sunday = new Date(saturday);
    sunday.setDate(sunday.getDate() + 1);
    
    if (date >= saturday && date <= sunday) {
      return 'This Weekend';
    }
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Get time context badge color
  const getTimeBadgeColor = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil < 0) return '#EF4444'; // Already started - red
    if (hoursUntil < 6) return '#8B5CF6'; // Tonight - purple
    if (hoursUntil < 24) return '#F59E0B'; // Tomorrow - amber
    if (hoursUntil < 72) return '#10B981'; // This weekend - green
    return '#3B82F6'; // Later - blue
  };

  // Format distance
  const formatDistance = (miles?: number): string => {
    if (!miles) return '';
    if (miles < 1) return `${Math.round(miles * 5280)} ft`;
    return `${miles.toFixed(1)} mi`;
  };

  const handleEventPress = (event: TavvyEvent) => {
    if (onEventPress) {
      onEventPress(event);
    } else {
      (navigation as any).navigate('HappeningNowDetail', { 
        eventId: event.id,
        event: event,
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  // Show placeholder cards if no events found
  const showPlaceholder = events.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Happening Now</Text>
          <Text style={styles.subtitle}>Time-sensitive experiences near you</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton} onPress={() => (navigation as any).navigate('HappeningNow')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
      >
        {showPlaceholder ? (
          // Placeholder cards when no events available
          [
            { 
              id: 'tonight', 
              title: 'Tonight', 
              description: 'Events coming soon', 
              examples: 'Live music • Pop-ups',
              icon: 'moon-outline', 
              color: '#8B5CF6' 
            },
            { 
              id: 'this-weekend', 
              title: 'This Weekend', 
              description: 'Local events', 
              examples: 'Festivals • Special hours',
              icon: 'calendar-outline', 
              color: '#F59E0B' 
            },
          ].map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.card}
              onPress={() => (navigation as any).navigate('HappeningNow', { filter: item.id })}
              activeOpacity={0.9}
            >
              <View style={[styles.placeholderImage, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon as any} size={48} color={item.color} />
              </View>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.gradient}
              />
              <View style={[styles.activityBadge, { backgroundColor: item.color }]}>
                <Text style={styles.activityText}>{item.title}</Text>
              </View>
              <View style={styles.content}>
                <Text style={styles.placeName}>{item.description}</Text>
                <Text style={styles.placeholderSubtext}>{item.examples}</Text>
                <Text style={styles.checkBackText}>Check back for updates</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          events.map((event) => {
            const badgeColor = getTimeBadgeColor(event.start_time);
            
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.card}
                onPress={() => handleEventPress(event)}
                activeOpacity={0.9}
              >
                {/* Background Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: event.image_url || DEFAULT_EVENT_IMAGE }}
                    style={styles.backgroundImage}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                  />
                </View>

                {/* Time Context Badge */}
                <View style={[styles.activityBadge, { backgroundColor: badgeColor }]}>
                  <Text style={styles.activityText}>{formatEventDate(event.start_time)}</Text>
                </View>

                {/* Source Badge */}
                <View style={[styles.sourceBadge, { 
                  backgroundColor: event.source === 'ticketmaster' ? '#009CDE' : 
                                   event.source === 'predicthq' ? '#FF6B6B' : '#0F8A8A' 
                }]}>
                  <Text style={styles.sourceBadgeText}>
                    {event.source === 'ticketmaster' ? 'TM' : 
                     event.source === 'predicthq' ? 'PHQ' : 'Tavvy'}
                  </Text>
                </View>

                {/* Content */}
                <View style={styles.content}>
                  <Text style={styles.placeName} numberOfLines={2}>
                    {event.title}
                  </Text>
                  <View style={styles.metaRow}>
                    {event.venue_name && (
                      <Text style={styles.category} numberOfLines={1}>{event.venue_name}</Text>
                    )}
                    {event.distance && (
                      <>
                        <Text style={styles.dot}>•</Text>
                        <Text style={styles.city}>{formatDistance(event.distance)}</Text>
                      </>
                    )}
                  </View>
                  {event.price_min !== undefined && (
                    <Text style={styles.lastActivity}>
                      {event.price_min === 0 ? 'Free' : `From $${event.price_min}`}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  seeAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F8A8A', // ACCENT color for consistency
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1F2937',
  },
  imageContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  activityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  sourceBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  placeName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'left',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    flex: 1,
  },
  dot: {
    color: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 6,
  },
  city: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  lastActivity: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
  placeholderSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  checkBackText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default HappeningNow;
