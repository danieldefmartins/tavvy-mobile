import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Linking,
  Share,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { supabase } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// ============================================
// CONSTANTS
// ============================================

const MAP_PEEK_HEIGHT = height * 0.22; // 22% of screen for map peek

// Map Styles Configuration
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

// Categories for filtering
const categories = ['All', 'Restaurants', 'Cafes', 'Bars', 'Shopping'];

// Searchable categories for autocomplete
const SEARCHABLE_CATEGORIES = [
  { name: 'Restaurants', icon: 'restaurant', type: 'category' },
  { name: 'Cafes', icon: 'cafe', type: 'category' },
  { name: 'Coffee Shops', icon: 'cafe', type: 'category' },
  { name: 'Bars', icon: 'beer', type: 'category' },
  { name: 'Nightlife', icon: 'moon', type: 'category' },
  { name: 'Shopping', icon: 'cart', type: 'category' },
  { name: 'Entertainment', icon: 'film', type: 'category' },
  { name: 'Services', icon: 'briefcase', type: 'category' },
  { name: 'Health', icon: 'fitness', type: 'category' },
  { name: 'Beauty', icon: 'sparkles', type: 'category' },
];

// Storage keys for user preferences
const STORAGE_KEYS = {
  RECENT_SEARCHES: '@tavvy_recent_searches',
  CATEGORY_VIEWS: '@tavvy_category_views',
  PLACE_VIEWS: '@tavvy_place_views',
};

// ============================================
// TYPE DEFINITIONS
// ============================================

interface Signal {
  bucket: string;
  tap_total: number;
}

interface Place {
  id: string;
  name: string;
  address_line1: string;
  city?: string;
  state_region?: string;
  category: string;
  primary_category?: string;
  latitude: number;
  longitude: number;
  lat?: number;
  lng?: number;
  distance?: number;
  current_status?: string;
  cover_image_url?: string;
  phone?: string;
  website?: string;
  instagram_url?: string;
  description?: string;
  signals?: Signal[];
  photos?: string[];
}

interface SearchSuggestion {
  id: string;
  type: 'place' | 'category' | 'location' | 'recent';
  title: string;
  subtitle?: string;
  icon: string;
  data?: any;
}

// ============================================
// MOCK DATA (for testing)
// ============================================

const MOCK_PLACES: Place[] = [
  {
    id: '1',
    name: 'Ocean House',
    address_line1: '123 Ocean Ave',
    city: 'San Francisco',
    state_region: 'CA',
    category: 'Restaurants',
    primary_category: 'Seafood',
    latitude: 37.7749,
    longitude: -122.4194,
    current_status: 'Open',
    phone: '415-555-0123',
    website: 'https://oceanhouse.com',
    signals: [
      { bucket: 'Great Food', tap_total: 89 },
      { bucket: 'Amazing Service', tap_total: 76 },
      { bucket: 'Cozy', tap_total: 87 },
      { bucket: 'Pricey', tap_total: 12 },
    ],
    photos: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    ],
  },
  {
    id: '2',
    name: 'Blue Bottle Coffee',
    address_line1: '66 Mint St',
    city: 'San Francisco',
    state_region: 'CA',
    category: 'Cafes',
    primary_category: 'Coffee',
    latitude: 37.7849,
    longitude: -122.4094,
    current_status: 'Open',
    phone: '415-555-0124',
    website: 'https://bluebottlecoffee.com',
    signals: [
      { bucket: 'Great Coffee', tap_total: 124 },
      { bucket: 'Excellent Pastries', tap_total: 98 },
      { bucket: 'Cozy', tap_total: 89 },
      { bucket: 'Pricey', tap_total: 45 },
    ],
    photos: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    ],
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function HomeScreen({ navigation }: { navigation: any }) {
  // View mode: 'content' (default) or 'map' (search/swipe triggered)
  const [viewMode, setViewMode] = useState<'content' | 'map'>('content');
  
  // Data states
  const [places, setPlaces] = useState<Place[]>(MOCK_PLACES);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(MOCK_PLACES);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  
  // Location states
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  
  // Map states
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('osm');
  
  // Personalization states
  const [greeting, setGreeting] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Refs
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const searchInputRef = useRef<TextInput>(null);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    updateGreeting();
    loadRecentSearches();
    requestLocationPermission();
    fetchPlaces();
  };

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good morning');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good afternoon');
    } else if (hour >= 17 && hour < 21) {
      setGreeting('Good evening');
    } else {
      setGreeting('Good night');
    }
  };

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const updated = [query, ...recentSearches.filter(s => s.toLowerCase() !== query.toLowerCase())].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(updated));
    } catch (error) {
      console.log('Error saving recent search:', error);
    }
  };

  // ============================================
  // LOCATION HANDLING
  // ============================================

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const coords: [number, number] = [location.coords.longitude, location.coords.latitude];
        setUserLocation(coords);
        
        // Get location name
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          setLocationName(`${address.city || ''}, ${address.region || ''}`);
        }
      }
    } catch (error) {
      console.log('Error getting location:', error);
    }
  };

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchPlaces = async () => {
    try {
      setLoading(true);

      const { data: placesData, error: placesError } = await supabase
        .from('places')
        .select('*')
        .order('name');

      if (placesError) {
        console.warn('Supabase error, using mock data:', placesError);
        setPlaces(MOCK_PLACES);
        setFilteredPlaces(MOCK_PLACES);
        return;
      }

      if (placesData && placesData.length > 0) {
        // Fetch signals for places
        const placeIds = placesData.map(p => p.id);
        
        const { data: signalTaps } = await supabase
          .from('place_review_signal_taps')
          .select('place_id, signal_id, intensity')
          .in('place_id', placeIds);

        const { data: reviewItems } = await supabase
          .from('review_items')
          .select('id, label, signal_type');

        const itemsMap = new Map(
          (reviewItems || []).map(item => [item.id, { label: item.label, type: item.signal_type }])
        );

        // Fetch photos
        const { data: photosData } = await supabase
          .from('place_photos')
          .select('place_id, url')
          .in('place_id', placeIds)
          .order('is_cover', { ascending: false });

        const photosByPlace: Record<string, string[]> = {};
        (photosData || []).forEach(photo => {
          if (!photosByPlace[photo.place_id]) {
            photosByPlace[photo.place_id] = [];
          }
          photosByPlace[photo.place_id].push(photo.url);
        });

        // Process places with signals
        const placesWithSignals = placesData.map(place => {
          const placeSignals = (signalTaps || [])
            .filter(tap => tap.place_id === place.id)
            .reduce((acc: Record<string, number>, tap) => {
              const item = itemsMap.get(tap.signal_id);
              if (item) {
                const key = item.label;
                acc[key] = (acc[key] || 0) + tap.intensity;
              }
              return acc;
            }, {});

          const signals = Object.entries(placeSignals).map(([bucket, tap_total]) => ({
            bucket,
            tap_total,
          }));

          return {
            ...place,
            signals,
            photos: photosByPlace[place.id] || [],
          };
        });

        setPlaces(placesWithSignals);
        setFilteredPlaces(placesWithSignals);
      } else {
        setPlaces(MOCK_PLACES);
        setFilteredPlaces(MOCK_PLACES);
      }
    } catch (err) {
      console.error('Error fetching places:', err);
      setPlaces(MOCK_PLACES);
      setFilteredPlaces(MOCK_PLACES);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SMART SEARCH & AUTOCOMPLETE
  // ============================================

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      generateSearchSuggestions(searchQuery);
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery, places, recentSearches]);

  const generateSearchSuggestions = (query: string) => {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // 1. Match places by name
    const matchingPlaces = places.filter(place =>
      place.name.toLowerCase().includes(queryLower)
    ).slice(0, 5);

    matchingPlaces.forEach(place => {
      suggestions.push({
        id: `place-${place.id}`,
        type: 'place',
        title: place.name,
        subtitle: `${place.category} • ${place.city || ''}`,
        icon: 'location',
        data: place,
      });
    });

    // 2. Match categories
    const matchingCategories = SEARCHABLE_CATEGORIES.filter(cat =>
      cat.name.toLowerCase().includes(queryLower)
    ).slice(0, 3);

    matchingCategories.forEach(cat => {
      suggestions.push({
        id: `category-${cat.name}`,
        type: 'category',
        title: cat.name,
        subtitle: 'Category',
        icon: cat.icon,
        data: cat,
      });
    });

    // 3. Match locations (cities from places)
    const cities = [...new Set(places.map(p => p.city).filter(Boolean))];
    const matchingCities = cities.filter(city =>
      city!.toLowerCase().includes(queryLower)
    ).slice(0, 2);

    matchingCities.forEach(city => {
      suggestions.push({
        id: `location-${city}`,
        type: 'location',
        title: city!,
        subtitle: 'Location',
        icon: 'navigate',
        data: { city },
      });
    });

    // 4. Add matching recent searches
    const matchingRecent = recentSearches.filter(search =>
      search.toLowerCase().includes(queryLower) && search.toLowerCase() !== queryLower
    ).slice(0, 2);

    matchingRecent.forEach(search => {
      suggestions.push({
        id: `recent-${search}`,
        type: 'recent',
        title: search,
        subtitle: 'Recent search',
        icon: 'time',
        data: { query: search },
      });
    });

    setSearchSuggestions(suggestions);
  };

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    // Don't switch to map mode - stay on content mode while typing
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    // Don't switch to map mode - stay on content mode
  };

  const handleSearchBlur = () => {
    // Delay to allow suggestion tap to register
    setTimeout(() => {
      setIsSearchFocused(false);
    }, 200);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    Keyboard.dismiss();
    setIsSearchFocused(false);
    
    switch (suggestion.type) {
      case 'place':
        // Navigate directly to place details
        saveRecentSearch(suggestion.title);
        setSearchQuery('');
        navigation.navigate('PlaceDetails', { placeId: suggestion.data.id });
        break;
        
      case 'category':
        // Go to map mode filtered by category
        saveRecentSearch(suggestion.title);
        setSelectedCategory(suggestion.title);
        setSearchQuery('');
        setViewMode('map');
        break;
        
      case 'location':
        // Go to map mode centered on location
        saveRecentSearch(suggestion.title);
        setSearchQuery(suggestion.title);
        setViewMode('map');
        break;
        
      case 'recent':
        // Re-run the recent search
        setSearchQuery(suggestion.data.query);
        handleSearchSubmit(suggestion.data.query);
        break;
    }
  };

  const handleSearchSubmit = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      Keyboard.dismiss();
      setIsSearchFocused(false);
      saveRecentSearch(searchTerm.trim());
      setViewMode('map');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchSuggestions([]);
    searchInputRef.current?.focus();
  };

  // ============================================
  // FILTER PLACES (for map mode)
  // ============================================

  useEffect(() => {
    filterPlaces();
  }, [searchQuery, selectedCategory, places, viewMode]);

  const filterPlaces = () => {
    let filtered = places;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        (place) =>
          place.category?.toLowerCase() === selectedCategory.toLowerCase() ||
          place.primary_category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim() && viewMode === 'map') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (place) =>
          (place.name && place.name.toLowerCase().includes(query)) ||
          (place.city && place.city.toLowerCase().includes(query)) ||
          (place.category && place.category.toLowerCase().includes(query)) ||
          (place.primary_category && place.primary_category.toLowerCase().includes(query)) ||
          (place.address_line1 && place.address_line1.toLowerCase().includes(query)) ||
          (place.state_region && place.state_region.toLowerCase().includes(query)) ||
          (place.description && place.description.toLowerCase().includes(query))
      );
    }

    setFilteredPlaces(filtered);
  };

  const handleSearchFromRecent = (query: string) => {
    setSearchQuery(query);
    setViewMode('map');
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  // ============================================
  // VIEW MODE TRANSITIONS
  // ============================================

  const switchToMapMode = () => {
    Keyboard.dismiss();
    setIsSearchFocused(false);
    setViewMode('map');
  };

  const switchToContentMode = () => {
    setViewMode('content');
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  // ============================================
  // PLACE CARD HANDLERS
  // ============================================

  const handleMarkerPress = (place: Place) => {
    setSelectedPlace(place);
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handlePlacePress = async (place: Place) => {
    navigation.navigate('PlaceDetails', { placeId: place.id });
  };

  const handleCall = (place: Place) => {
    if (place.phone) {
      Linking.openURL(`tel:${place.phone}`);
    }
  };

  const handleWebsite = (place: Place) => {
    if (place.website) {
      Linking.openURL(place.website);
    }
  };

  const handleShare = async (place: Place) => {
    try {
      await Share.share({
        message: `Check out ${place.name} on TavvY!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // ============================================
  // SIGNAL HELPERS
  // ============================================

  const getSignalType = (bucket: string): 'positive' | 'neutral' | 'negative' => {
    const bucketLower = bucket.toLowerCase();
    
    if (bucketLower.includes('great') || bucketLower.includes('excellent') || 
        bucketLower.includes('amazing') || bucketLower.includes('affordable') ||
        bucketLower.includes('good') || bucketLower.includes('friendly') ||
        bucketLower.includes('fast') || bucketLower.includes('clean') ||
        bucketLower.includes('fresh') || bucketLower.includes('delicious')) {
      return 'positive';
    }
    
    if (bucketLower.includes('pricey') || bucketLower.includes('expensive') || 
        bucketLower.includes('crowded') || bucketLower.includes('loud') ||
        bucketLower.includes('slow') || bucketLower.includes('dirty') ||
        bucketLower.includes('rude') || bucketLower.includes('limited') ||
        bucketLower.includes('wait') || bucketLower.includes('noisy')) {
      return 'negative';
    }
    
    return 'neutral';
  };

  const getSignalColor = (bucket: string) => {
    const type = getSignalType(bucket);
    if (type === 'positive') return '#0A84FF';
    if (type === 'negative') return '#FF9500';
    return '#8E8E93';
  };

  const sortSignalsForDisplay = (signals: Signal[]): Signal[] => {
    const positive = signals.filter(s => getSignalType(s.bucket) === 'positive');
    const neutral = signals.filter(s => getSignalType(s.bucket) === 'neutral');
    const negative = signals.filter(s => getSignalType(s.bucket) === 'negative');
    
    const result: Signal[] = [];
    result.push(...positive.slice(0, 2));
    if (neutral.length > 0) result.push(neutral[0]);
    if (negative.length > 0) result.push(negative[0]);
    
    return result;
  };

  const getMarkerColor = (category?: string) => {
    if (!category) return '#007AFF';
    const colors: Record<string, string> = {
      restaurants: '#FF6B6B',
      cafes: '#4ECDC4',
      bars: '#FFD93D',
      shopping: '#95E1D3',
    };
    return colors[category.toLowerCase()] || '#007AFF';
  };

  // ============================================
  // RENDER: SEARCH SUGGESTIONS DROPDOWN
  // ============================================

  const renderSearchSuggestions = () => {
    if (!isSearchFocused || searchSuggestions.length === 0) {
      return null;
    }

    return (
      <View style={styles.suggestionsContainer}>
        {searchSuggestions.map((suggestion) => (
          <TouchableOpacity
            key={suggestion.id}
            style={styles.suggestionItem}
            onPress={() => handleSuggestionSelect(suggestion)}
          >
            <View style={[
              styles.suggestionIconContainer,
              suggestion.type === 'place' && styles.suggestionIconPlace,
              suggestion.type === 'category' && styles.suggestionIconCategory,
              suggestion.type === 'location' && styles.suggestionIconLocation,
              suggestion.type === 'recent' && styles.suggestionIconRecent,
            ]}>
              <Ionicons
                name={suggestion.icon as any}
                size={18}
                color={
                  suggestion.type === 'place' ? '#0A84FF' :
                  suggestion.type === 'category' ? '#34C759' :
                  suggestion.type === 'location' ? '#FF9500' : '#8E8E93'
                }
              />
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              {suggestion.subtitle && (
                <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>
              )}
            </View>
            <Ionicons
              name={suggestion.type === 'place' ? 'chevron-forward' : 'arrow-forward'}
              size={16}
              color="#C7C7CC"
            />
          </TouchableOpacity>
        ))}
        
        {/* Show "Search for..." option */}
        {searchQuery.trim().length > 0 && (
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleSearchSubmit()}
          >
            <View style={[styles.suggestionIconContainer, styles.suggestionIconSearch]}>
              <Ionicons name="search" size={18} color="#0A84FF" />
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text style={styles.suggestionTitle}>Search for "{searchQuery}"</Text>
              <Text style={styles.suggestionSubtitle}>See all results on map</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ============================================
  // RENDER: PHOTO CAROUSEL
  // ============================================

  const PhotoCarousel = ({ photos, placeName, placeAddress }: { photos?: string[], placeName: string, placeAddress: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const displayPhotos = photos && photos.length > 0 ? photos : [null];

    return (
      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / (width - 48));
            setCurrentIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {displayPhotos.slice(0, 3).map((photo, index) => (
            <View key={index} style={styles.carouselImage}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderPhoto}>
                  <Ionicons name="image-outline" size={48} color="#ccc" />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.photoGradientOverlay}
        >
          <Text style={styles.overlayPlaceName} numberOfLines={1}>{placeName}</Text>
          <Text style={styles.overlayPlaceAddress} numberOfLines={1}>{placeAddress}</Text>
        </LinearGradient>
        
        {displayPhotos.length > 1 && (
          <View style={styles.dotsContainer}>
            {displayPhotos.slice(0, 3).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  // ============================================
  // RENDER: PLACE CARD
  // ============================================

  const renderPlaceCard = ({ item: place }: { item: Place }) => {
    const fullAddress = place.city && place.state_region
      ? `${place.address_line1}, ${place.city}, ${place.state_region}`
      : place.address_line1;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePlacePress(place)}
        activeOpacity={0.95}
      >
        <PhotoCarousel
          photos={place.photos}
          placeName={place.name}
          placeAddress={fullAddress}
        />
        
        {/* Signals */}
        {place.signals && place.signals.length > 0 && (
          <View style={styles.signalsContainer}>
            {sortSignalsForDisplay(place.signals).map((signal, index) => (
              <View
                key={index}
                style={[styles.signalPill, { backgroundColor: getSignalColor(signal.bucket) }]}
              >
                <Text style={styles.signalText}>
                  {signal.bucket} ×{signal.tap_total}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Meta info */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{place.category}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>$$</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={[styles.metaText, { color: '#34C759' }]}>
            {place.current_status || 'Open'}
          </Text>
        </View>
        
        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleCall(place)}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleWebsite(place)}>
            <Ionicons name="globe-outline" size={20} color="#666" />
            <Text style={styles.actionText}>Website</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="images-outline" size={20} color="#666" />
            <Text style={styles.actionText}>Photos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(place)}>
            <Ionicons name="share-outline" size={20} color="#666" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================
  // RENDER: CONTENT MODE (Default Home Screen)
  // ============================================

  const renderContentMode = () => (
    <View style={styles.contentModeContainer}>
      {/* Map Peek at Top */}
      <TouchableOpacity 
        style={styles.mapPeekContainer}
        onPress={switchToMapMode}
        activeOpacity={0.9}
      >
        {/* @ts-ignore */}
        <MapLibreGL.MapView
          style={styles.mapPeek}
          styleURL={MAP_STYLES[mapStyle].type === 'vector' ? (MAP_STYLES[mapStyle] as any).url : undefined}
          logoEnabled={false}
          attributionEnabled={false}
          scrollEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          zoomEnabled={false}
        >
          <MapLibreGL.Camera
            zoomLevel={13}
            centerCoordinate={userLocation || [-97.7431, 30.2672]}
          />
          
          {MAP_STYLES[mapStyle].type === 'raster' && (
            <MapLibreGL.RasterSource
              id="raster-source-peek"
              tileUrlTemplates={[MAP_STYLES[mapStyle].tileUrl!]}
              tileSize={256}
            >
              <MapLibreGL.RasterLayer
                id="raster-layer-peek"
                sourceID="raster-source-peek"
                style={{ rasterOpacity: 1 }}
              />
            </MapLibreGL.RasterSource>
          )}
          
          {userLocation && (
            <MapLibreGL.PointAnnotation
              id="user-location-peek"
              coordinate={userLocation}
            >
              <View style={styles.userLocationMarker}>
                <View style={styles.userLocationDot} />
              </View>
            </MapLibreGL.PointAnnotation>
          )}
        </MapLibreGL.MapView>
        
        {/* Tap to expand overlay */}
        <View style={styles.mapPeekOverlay}>
          <Ionicons name="expand-outline" size={20} color="#fff" />
          <Text style={styles.mapPeekText}>Tap to explore map</Text>
        </View>
      </TouchableOpacity>
      
      {/* Content Area */}
      <View style={styles.contentArea}>
        {/* Header */}
        <View style={styles.contentHeader}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.titleText}>What are you looking for?</Text>
          {locationName ? (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#0A84FF" />
              <Text style={styles.locationText}>{locationName}</Text>
            </View>
          ) : null}
        </View>
        
        {/* Search Bar with Autocomplete */}
        <View style={styles.searchWrapper}>
          <View style={[
            styles.contentSearchBar,
            isSearchFocused && styles.contentSearchBarFocused
          ]}>
            <Ionicons name="search" size={20} color="#8E8E93" />
            <TextInput
              ref={searchInputRef}
              style={styles.contentSearchInput}
              placeholder="Search places, categories..."
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={handleSearchInputChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onSubmitEditing={() => handleSearchSubmit()}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Search Suggestions Dropdown */}
          {renderSearchSuggestions()}
        </View>
        
        {/* Only show rest of content when not focused on search */}
        {!isSearchFocused && (
          <>
            {/* Category Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScrollView}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive,
                  ]}
                  onPress={() => {
                    handleCategorySelect(category);
                    if (category !== 'All') {
                      switchToMapMode();
                    }
                  }}
                >
                  <Ionicons
                    name={
                      category === 'All' ? 'apps' :
                      category === 'Restaurants' ? 'restaurant' :
                      category === 'Cafes' ? 'cafe' :
                      category === 'Bars' ? 'beer' : 'cart'
                    }
                    size={16}
                    color={selectedCategory === category ? '#fff' : '#666'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Scrollable Content */}
            <ScrollView 
              style={styles.contentScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.contentSection}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <View style={styles.recentSearchesRow}>
                    {recentSearches.slice(0, 4).map((term, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.recentSearchChip}
                        onPress={() => handleSearchFromRecent(term)}
                      >
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <Text style={styles.recentSearchText}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              {/* Trending Near You */}
              <View style={styles.contentSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Trending Near You</Text>
                  <TouchableOpacity onPress={switchToMapMode}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendingScrollContent}
                >
                  {filteredPlaces.slice(0, 5).map((place) => (
                    <TouchableOpacity
                      key={place.id}
                      style={styles.trendingCard}
                      onPress={() => handlePlacePress(place)}
                    >
                      {place.photos && place.photos[0] ? (
                        <Image
                          source={{ uri: place.photos[0] }}
                          style={styles.trendingImage}
                        />
                      ) : (
                        <View style={[styles.trendingImage, styles.placeholderPhoto]}>
                          <Ionicons name="image-outline" size={32} color="#ccc" />
                        </View>
                      )}
                      <Text style={styles.trendingName} numberOfLines={1}>{place.name}</Text>
                      <Text style={styles.trendingCategory}>{place.category}</Text>
                      {place.signals && place.signals.length > 0 && (
                        <View style={styles.trendingSignalRow}>
                          <Ionicons name="radio" size={12} color="#0A84FF" />
                          <Text style={styles.trendingSignalText}>
                            {place.signals.reduce((sum, s) => sum + s.tap_total, 0)} taps
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Explore Categories */}
              <View style={styles.contentSection}>
                <Text style={styles.sectionTitle}>Explore</Text>
                <View style={styles.exploreGrid}>
                  {['Restaurants', 'Cafes', 'Bars', 'Shopping', 'Entertainment', 'Services'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={styles.exploreItem}
                      onPress={() => {
                        handleCategorySelect(cat);
                        switchToMapMode();
                      }}
                    >
                      <View style={styles.exploreIconContainer}>
                        <Ionicons
                          name={
                            cat === 'Restaurants' ? 'restaurant' :
                            cat === 'Cafes' ? 'cafe' :
                            cat === 'Bars' ? 'beer' :
                            cat === 'Shopping' ? 'cart' :
                            cat === 'Entertainment' ? 'film' : 'briefcase'
                          }
                          size={24}
                          color="#0A84FF"
                        />
                      </View>
                      <Text style={styles.exploreText}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Did You Know */}
              <View style={styles.contentSection}>
                <View style={styles.didYouKnowCard}>
                  <View style={styles.didYouKnowIcon}>
                    <Ionicons name="bulb" size={24} color="#FFD60A" />
                  </View>
                  <View style={styles.didYouKnowContent}>
                    <Text style={styles.didYouKnowTitle}>Did you know?</Text>
                    <Text style={styles.didYouKnowText}>
                      TavvY uses tap-based signals instead of star ratings to give you 
                      honest, structured insights about places.
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Bottom padding */}
              <View style={{ height: 100 }} />
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );

  // ============================================
  // RENDER: MAP MODE (Search Results)
  // ============================================

  const renderMapMode = () => (
    <View style={styles.mapModeContainer}>
      {/* Full Map */}
      {/* @ts-ignore */}
      <MapLibreGL.MapView
        key={mapStyle}
        style={styles.fullMap}
        styleURL={MAP_STYLES[mapStyle].type === 'vector' ? (MAP_STYLES[mapStyle] as any).url : undefined}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={userLocation || [-97.7431, 30.2672]}
          animationMode="flyTo"
          animationDuration={2000}
        />

        {MAP_STYLES[mapStyle].type === 'raster' && (
          <MapLibreGL.RasterSource
            id="raster-source"
            tileUrlTemplates={[MAP_STYLES[mapStyle].tileUrl!]}
            tileSize={256}
          >
            <MapLibreGL.RasterLayer
              id="raster-layer"
              sourceID="raster-source"
              style={{ rasterOpacity: 1 }}
            />
          </MapLibreGL.RasterSource>
        )}

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

        {filteredPlaces.map((place) => (
          <MapLibreGL.PointAnnotation
            key={place.id}
            id={place.id}
            coordinate={[place.longitude || place.lng || 0, place.latitude || place.lat || 0]}
            onSelected={() => handleMarkerPress(place)}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  { backgroundColor: getMarkerColor(place.category) },
                ]}
              >
                <Ionicons
                  name={
                    place.category?.toLowerCase() === 'restaurants' ? 'restaurant' :
                    place.category?.toLowerCase() === 'cafes' ? 'cafe' :
                    place.category?.toLowerCase() === 'bars' ? 'beer' : 'location'
                  }
                  size={20}
                  color="#fff"
                />
              </View>
            </View>
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>

      {/* Search Overlay */}
      <View style={styles.mapSearchOverlay}>
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={switchToContentMode}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        {/* Search Bar */}
        <View style={styles.mapSearchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.mapSearchInput}
            placeholder="Search places or locations"
            placeholderTextColor="#999"
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
      
      {/* Category Filters */}
      <View style={styles.mapCategoryOverlay}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mapCategoryContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.mapCategoryChip,
                selectedCategory === category && styles.mapCategoryChipActive,
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <Ionicons
                name={
                  category === 'All' ? 'star' :
                  category === 'Restaurants' ? 'restaurant' :
                  category === 'Cafes' ? 'cafe' :
                  category === 'Bars' ? 'beer' : 'cart'
                }
                size={12}
                color={selectedCategory === category ? '#fff' : '#666'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.mapCategoryChipText,
                  selectedCategory === category && styles.mapCategoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Sheet with Place Cards */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={['15%', '50%', '90%']}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
      >
        <BottomSheetFlatList
          data={filteredPlaces}
          keyExtractor={(item) => item.id}
          renderItem={renderPlaceCard}
          contentContainerStyle={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheet>
    </View>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={styles.loadingText}>Loading places...</Text>
      </View>
    );
  }

  return viewMode === 'content' ? renderContentMode() : renderMapMode();
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  
  // Content Mode
  contentModeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapPeekContainer: {
    height: MAP_PEEK_HEIGHT,
    overflow: 'hidden',
  },
  mapPeek: {
    flex: 1,
  },
  mapPeekOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mapPeekText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 20,
  },
  contentHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  
  // Search
  searchWrapper: {
    position: 'relative',
    zIndex: 1000,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  contentSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contentSearchBarFocused: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#0A84FF',
  },
  contentSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  
  // Search Suggestions
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 300,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  suggestionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionIconPlace: {
    backgroundColor: '#E8F4FF',
  },
  suggestionIconCategory: {
    backgroundColor: '#E8FFF0',
  },
  suggestionIconLocation: {
    backgroundColor: '#FFF5E8',
  },
  suggestionIconRecent: {
    backgroundColor: '#F2F2F7',
  },
  suggestionIconSearch: {
    backgroundColor: '#E8F4FF',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  
  // Categories
  categoryScrollView: {
    marginBottom: 16,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#0A84FF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  contentScrollView: {
    flex: 1,
  },
  contentSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: '500',
  },
  recentSearchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  recentSearchText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  trendingScrollContent: {
    paddingRight: 20,
  },
  trendingCard: {
    width: 160,
    marginRight: 12,
  },
  trendingImage: {
    width: 160,
    height: 120,
    borderRadius: 12,
    marginBottom: 8,
  },
  trendingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  trendingCategory: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  trendingSignalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingSignalText: {
    fontSize: 12,
    color: '#0A84FF',
    marginLeft: 4,
  },
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exploreItem: {
    width: (width - 52) / 3,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  exploreIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  exploreText: {
    fontSize: 13,
    color: '#000',
    fontWeight: '500',
  },
  didYouKnowCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
  },
  didYouKnowIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF3CD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  didYouKnowContent: {
    flex: 1,
  },
  didYouKnowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  didYouKnowText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  
  // Map Mode
  mapModeContainer: {
    flex: 1,
  },
  fullMap: {
    flex: 1,
  },
  mapSearchOverlay: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  mapCategoryOverlay: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
  },
  mapCategoryContent: {
    paddingHorizontal: 16,
  },
  mapCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  mapCategoryChipActive: {
    backgroundColor: '#0A84FF',
  },
  mapCategoryChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  mapCategoryChipTextActive: {
    color: '#fff',
  },
  
  // Map markers
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  userLocationMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 122, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  
  // Bottom Sheet
  bottomSheetBackground: {
    backgroundColor: '#F2F2F7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetHandle: {
    backgroundColor: '#C7C7CC',
    width: 36,
    height: 5,
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  
  // Place Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  carouselContainer: {
    height: 180,
    position: 'relative',
  },
  carouselImage: {
    width: width - 32,
    height: 180,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 40,
  },
  overlayPlaceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  overlayPlaceAddress: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  dotInactive: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  signalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  signalPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  signalText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  metaDot: {
    fontSize: 14,
    color: '#C7C7CC',
    marginHorizontal: 8,
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
