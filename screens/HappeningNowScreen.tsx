/**
 * Happening Now Screen
 * Install path: screens/HappeningNowScreen.tsx
 * 
 * Discover seasonal and live experiences nearby – events, holiday lights, concerts, games, and more.
 * Fetches real events from Ticketmaster, PredictHQ, and Tavvy community.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { getHappeningNowEvents, TavvyEvent } from '../lib/eventsService';
import { UnifiedHeader } from '../components/UnifiedHeader';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Happening Now colors - Updated to match new black design system
const HappeningColors = {
  primary: '#667EEA', // Blue accent (matching other screens)
  secondary: '#818CF8',
  background: '#000000', // Pure black
  cardBg: '#1C1C1E', // Dark charcoal for cards
  text: '#FFFFFF', // White text
  textLight: '#9CA3AF', // Gray text
  textMuted: '#6B7280', // Muted gray
  gradientStart: '#667EEA',
  gradientEnd: '#818CF8',
};

// Event categories
const CATEGORIES = [
  { id: 'all', name: 'All', icon: 'sparkles' },
  { id: 'concerts', name: 'Concerts', icon: 'musical-notes' },
  { id: 'sports', name: 'Sports', icon: 'football' },
  { id: 'festivals', name: 'Festivals', icon: 'balloon' },
  { id: 'holiday', name: 'Holiday', icon: 'snow' },
  { id: 'food', name: 'Food & Drink', icon: 'restaurant' },
  { id: 'arts', name: 'Arts', icon: 'color-palette' },
];

// Time filters
const TIME_FILTERS = [
  { id: 'all', name: 'All' },
  { id: 'tonight', name: 'Tonight' },
  { id: 'weekend', name: 'This Weekend' },
  { id: 'week', name: 'This Week' },
];

type NavigationProp = NativeStackNavigationProp<any>;

// Format date for display
function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  
  if (isToday) {
    return 'Today';
  } else if (isTomorrow) {
    return 'Tomorrow';
  } else {
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
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// Format time for display
function formatEventTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Format price for display
function formatPrice(min?: number, max?: number, currency?: string): string {
  if (!min && !max) return 'Free';
  if (min === 0 && !max) return 'Free';
  
  const currencySymbol = currency === 'USD' ? '$' : currency || '$';
  
  if (min && max && min !== max) {
    return `${currencySymbol}${min} - ${currencySymbol}${max}`;
  }
  return `From ${currencySymbol}${min || max}`;
}

// Format distance for display
function formatDistance(miles?: number): string {
  if (!miles) return '';
  if (miles < 1) return `${Math.round(miles * 5280)} ft`;
  return `${miles.toFixed(1)} mi`;
}

// Default placeholder image
const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600';

export default function HappeningNowScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'all' | 'tonight' | 'weekend' | 'week'>('all');
  const [events, setEvents] = useState<TavvyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Fetch events
  const fetchEvents = useCallback(async (showRefreshing = false) => {
    if (!userLocation) return;
    
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const fetchedEvents = await getHappeningNowEvents({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusMiles: 50,
        timeFilter: selectedTimeFilter,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        limit: 50,
      });

      setEvents(fetchedEvents);
    } catch (err) {
      console.error('[HappeningNow] Error fetching events:', err);
      setError('Unable to load events. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userLocation, selectedTimeFilter, selectedCategory]);

  // Fetch events when location or filters change
  useEffect(() => {
    if (userLocation) {
      fetchEvents();
    }
  }, [userLocation, selectedTimeFilter, selectedCategory, fetchEvents]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEventPress = async (event: TavvyEvent) => {
    // Open event URL in browser if available
    if (event.url) {
      try {
        const canOpen = await Linking.canOpenURL(event.url);
        if (canOpen) {
          await Linking.openURL(event.url);
        } else {
          Alert.alert('Cannot Open', 'Unable to open this event link.');
        }
      } catch (error) {
        console.error('Error opening event URL:', error);
        Alert.alert('Error', 'Failed to open event link.');
      }
    } else {
      // If no URL, show event details in an alert
      Alert.alert(
        event.title,
        `${event.venue_name ? event.venue_name + '\n' : ''}${event.address || ''}\n\nStarts: ${new Date(event.start_time).toLocaleString()}${event.price_min !== undefined ? '\n\nPrice: ' + (event.price_min === 0 ? 'Free' : 'From $' + event.price_min) : ''}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleRefresh = () => {
    fetchEvents(true);
  };

  // Filter events for featured section (top ranked)
  const featuredEvents = events.slice(0, 3);
  const allEvents = events;

  const renderFeaturedEvent = ({ item }: { item: TavvyEvent }) => (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item.image_url || DEFAULT_EVENT_IMAGE }} 
        style={styles.featuredImage} 
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.featuredGradient}
      />
      <View style={styles.featuredContent}>
        <View style={styles.featuredBadge}>
          <Ionicons name="sparkles" size={12} color="#FFFFFF" />
          <Text style={styles.featuredBadgeText}>Featured</Text>
        </View>
        <Text style={styles.featuredTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.featuredMeta}>
          <Ionicons name="calendar-outline" size={14} color="#FFFFFF" />
          <Text style={styles.featuredMetaText}>{formatEventDate(item.start_time)}</Text>
          {item.distance && (
            <>
              <Ionicons name="location-outline" size={14} color="#FFFFFF" style={{ marginLeft: 12 }} />
              <Text style={styles.featuredMetaText}>{formatDistance(item.distance)}</Text>
            </>
          )}
        </View>
      </View>
      {/* Source badge */}
      <View style={[styles.sourceBadge, { backgroundColor: item.source === 'ticketmaster' ? '#009CDE' : item.source === 'predicthq' ? '#FF6B6B' : '#0F8A8A' }]}>
        <Text style={styles.sourceBadgeText}>
          {item.source === 'ticketmaster' ? 'TM' : item.source === 'predicthq' ? 'PHQ' : 'Tavvy'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEventCard = ({ item }: { item: TavvyEvent }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.image_url || DEFAULT_EVENT_IMAGE }} 
        style={styles.eventImage} 
      />
      <View style={styles.eventInfo}>
        <View style={styles.eventDateBadge}>
          <Text style={styles.eventDateText}>{formatEventDate(item.start_time)}</Text>
        </View>
        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
        {item.description && (
          <Text style={styles.eventDescription} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.eventMeta}>
          {item.venue_name && (
            <View style={styles.eventMetaItem}>
              <Ionicons name="location-outline" size={14} color={HappeningColors.textLight} />
              <Text style={styles.eventMetaText} numberOfLines={1}>{item.venue_name}</Text>
            </View>
          )}
          <View style={styles.eventMetaItem}>
            <Ionicons name="time-outline" size={14} color={HappeningColors.textLight} />
            <Text style={styles.eventMetaText}>{formatEventTime(item.start_time)}</Text>
          </View>
        </View>
        <View style={styles.eventFooter}>
          <Text style={styles.eventPrice}>{formatPrice(item.price_min, item.price_max, item.currency)}</Text>
          {item.distance && (
            <View style={styles.eventDistance}>
              <Ionicons name="navigate-outline" size={14} color={HappeningColors.textMuted} />
              <Text style={styles.eventDistanceText}>{formatDistance(item.distance)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color={HappeningColors.textMuted} />
      <Text style={styles.emptyStateTitle}>No Events Found</Text>
      <Text style={styles.emptyStateText}>
        {selectedCategory !== 'all' 
          ? `No ${CATEGORIES.find(c => c.id === selectedCategory)?.name} events found nearby.`
          : 'No events found in your area. Try expanding your search.'}
      </Text>
      <TouchableOpacity 
        style={styles.emptyStateButton}
        onPress={() => {
          setSelectedCategory('all');
          setSelectedTimeFilter('all');
        }}
      >
        <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header - Matching Atlas/Cities/Rides Design */}
      <View style={styles.customHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Happening Now</Text>
            <Text style={styles.headerTagline}>Time-sensitive experiences near you.</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={HappeningColors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor={HappeningColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Bar - Realtors-style design */}
      <View style={styles.filterBarContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContent}
        >
          {/* Time Filters */}
          {TIME_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterPill,
                selectedTimeFilter === filter.id && styles.filterPillActive,
              ]}
              onPress={() => setSelectedTimeFilter(filter.id as any)}
            >
              <Ionicons 
                name={filter.id === 'all' ? 'calendar-outline' : filter.id === 'tonight' ? 'moon-outline' : filter.id === 'weekend' ? 'sunny-outline' : 'time-outline'} 
                size={16} 
                color={selectedTimeFilter === filter.id ? '#FFFFFF' : HappeningColors.textLight} 
              />
              <Text style={[
                styles.filterPillText,
                selectedTimeFilter === filter.id && styles.filterPillTextActive,
              ]}>
                {filter.name}
              </Text>
            </TouchableOpacity>
          ))}
          {/* Separator */}
          <View style={styles.filterSeparator} />
          {/* Category Filters */}
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterPill,
                selectedCategory === category.id && styles.filterPillActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons 
                name={category.icon as any} 
                size={16} 
                color={selectedCategory === category.id ? '#FFFFFF' : HappeningColors.textLight} 
              />
              <Text style={[
                styles.filterPillText,
                selectedCategory === category.id && styles.filterPillTextActive,
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={HappeningColors.primary}
          />
        }
      >

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={HappeningColors.primary} />
            <Text style={styles.loadingText}>Finding events near you...</Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={HappeningColors.primary} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchEvents()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Events Content */}
        {!loading && !error && (
          <>
            {events.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                {/* Featured Events */}
                {selectedCategory === 'all' && featuredEvents.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Featured Events</Text>
                    <FlatList
                      data={featuredEvents}
                      renderItem={renderFeaturedEvent}
                      keyExtractor={(item) => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.featuredList}
                    />
                  </View>
                )}

                {/* All Events */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {selectedCategory === 'all' ? 'All Events' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
                    {' '}({allEvents.length})
                  </Text>
                  {allEvents.map((event) => (
                    <View key={event.id}>
                      {renderEventCard({ item: event })}
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HappeningColors.background,
  },
  // Custom Header Styles - Matching Atlas/Cities/Rides
  customHeader: {
    backgroundColor: HappeningColors.background,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerTagline: {
    fontSize: 14,
    color: '#667EEA', // Blue accent
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E', // Dark charcoal
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  // Legacy header styles (kept for compatibility)
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerLogo: {
    width: 28,
    height: 28,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Filter Bar - Realtors-style design with elegant white shade separator
  filterBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2C2C2E', // Dark charcoal for inactive pills
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: HappeningColors.primary,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: HappeningColors.textLight, // Gray for inactive
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterSeparator: {
    width: 1,
    height: 24,
    backgroundColor: '#3C3C3E', // Subtle separator for dark mode
    marginHorizontal: 4,
  },
  // Legacy filter styles (kept for compatibility)
  timeFiltersContainer: {
    paddingTop: 16,
  },
  timeFiltersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  timeFilterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: HappeningColors.textMuted,
    marginRight: 8,
  },
  timeFilterPillActive: {
    backgroundColor: HappeningColors.primary,
    borderColor: HappeningColors.primary,
  },
  timeFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: HappeningColors.text,
  },
  timeFilterTextActive: {
    color: '#FFFFFF',
  },
  categoriesContainer: {
    paddingTop: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: HappeningColors.primary,
    gap: 6,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: HappeningColors.primary,
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: HappeningColors.primary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: HappeningColors.textLight,
  },
  errorContainer: {
    padding: 60,
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: HappeningColors.textLight,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: HappeningColors.primary,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: HappeningColors.text,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  featuredCard: {
    width: width * 0.75,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: HappeningColors.cardBg,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HappeningColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMetaText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 4,
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
  eventCard: {
    flexDirection: 'row',
    backgroundColor: HappeningColors.cardBg,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  eventImage: {
    width: 120,
    height: 140,
  },
  eventInfo: {
    flex: 1,
    padding: 12,
  },
  eventDateBadge: {
    backgroundColor: HappeningColors.primary + '30', // Slightly more visible in dark mode
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  eventDateText: {
    color: HappeningColors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: HappeningColors.text,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 13,
    color: HappeningColors.textLight,
    marginBottom: 8,
    lineHeight: 18,
  },
  eventMeta: {
    gap: 4,
    marginBottom: 8,
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventMetaText: {
    fontSize: 12,
    color: HappeningColors.textLight,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  eventPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: HappeningColors.primary,
  },
  eventDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDistanceText: {
    fontSize: 12,
    color: HappeningColors.textMuted,
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: HappeningColors.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: HappeningColors.textLight,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyStateButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: HappeningColors.primary,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
