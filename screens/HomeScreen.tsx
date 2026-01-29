import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Platform,
  Alert,
  ImageBackground,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetFlatList, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { supabase } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchPlacesInBounds, PlaceCard, getPlaceIdForNavigation, formatDistance } from '../lib/placeService';
import { searchSuggestions as searchPlaceSuggestions, searchAddresses, prefetchNearbyPlaces, searchPrefetchedPlaces, SearchResult } from '../lib/searchService';
import { searchPlaces as typesenseSearchPlaces } from '../lib/typesenseService';
import { fetchWeatherData, getDefaultWeatherData, WeatherData } from '../lib/weatherService';
// Integrated Discovery Components
import { StoriesRow } from '../components/StoriesRow';
import { HappeningNow } from '../components/HappeningNow';
import { QuickFinds } from '../components/QuickFinds';
import { CategoryIconRow } from '../components/CategoryIconRow';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

// ============================================
// CONSTANTS
// ============================================

// Debug flag for place fetching - set to true to see metrics
const DEBUG_PLACES = false;

const MAP_PEEK_HEIGHT = height * 0.22;

// ============================================
// BOTTOM SHEET LAYOUT CONSTRAINTS (LOCKED)
// ============================================
// These values ensure the bottom sheet NEVER overlaps the fixed header elements
// Fixed header includes: search bar, category chips, and "Search this area" button
// This is a PERMANENT constraint - DO NOT change without explicit approval
//
// iOS Layout:
//   - Search bar: top 60px, height 44px → ends at 104px
//   - Category chips: top 116px, height ~36px → ends at ~152px  
//   - "Search this area" button: top 170px, height ~40px → ends at ~210px
//   - Add 10px padding below button = 220px total
//
// The topInset prop tells the bottom sheet where to STOP at the top
// This prevents the sheet from overlapping the fixed header elements
const BOTTOM_SHEET_TOP_INSET = Platform.OS === 'ios' ? 220 : 180;

// Map Styles Configuration
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

// Categories for filtering - Filter icon first, then category chips
// 'Filter' is a special category that opens the advanced filter modal
const categories = ['Filter', 'All', 'Restaurants', 'Cafes', 'Bars', 'Gas', 'Shopping', 'RV & Camping', 'Hotels'];

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
  // RV & Camping
  { name: 'RV & Camping', icon: 'bonfire', type: 'category' },
  { name: 'Campgrounds', icon: 'bonfire', type: 'category' },
  { name: 'RV Parks', icon: 'car', type: 'category' },
  { name: 'Dump Stations', icon: 'water', type: 'category' },
  { name: 'Propane', icon: 'flame', type: 'category' },
  // Gas & Automotive
  { name: 'Gas', icon: 'car', type: 'category' },
  { name: 'Gas Stations', icon: 'car', type: 'category' },
  { name: 'Fuel', icon: 'car', type: 'category' },
  // Hotels & Lodging
  { name: 'Hotels', icon: 'bed', type: 'category' },
  // Theme Parks
  { name: 'Theme Parks', icon: 'happy', type: 'category' },
  { name: 'Rides', icon: 'rocket', type: 'category' },
  // Amenities
  { name: 'Restrooms', icon: 'water', type: 'category' },
  { name: 'Showers', icon: 'water', type: 'category' },
  { name: 'Laundromat', icon: 'shirt', type: 'category' },
];

// Storage keys for user preferences
const STORAGE_KEYS = {
  RECENT_SEARCHES: '@tavvy_recent_searches',
  CATEGORY_VIEWS: '@tavvy_category_views',
  PLACE_VIEWS: '@tavvy_place_views',
  PARKING_LOCATION: '@tavvy_parking_location',
  SAVED_LOCATIONS: '@tavvy_saved_locations',
};

// Category-specific filter configurations
// Each category has its own type-specific filters (cuisines, fuel types, amenities, etc.)
const CATEGORY_FILTERS: { [key: string]: {
  typeLabel?: string; // Label for the type selector (e.g., "Cuisine", "Fuel Type")
  types?: { name: string; icon: string }[];
  amenities: string[];
}} = {
  Restaurants: {
    typeLabel: 'Cuisine',
    types: [
      { name: 'Any', icon: '' },
      { name: 'American', icon: 'restaurant' },
      { name: 'Barbecue', icon: 'flame' },
      { name: 'Chinese', icon: 'restaurant' },
      { name: 'French', icon: 'restaurant' },
      { name: 'Hamburger', icon: 'fast-food' },
      { name: 'Indian', icon: 'restaurant' },
      { name: 'Italian', icon: 'pizza' },
      { name: 'Japanese', icon: 'restaurant' },
      { name: 'Mexican', icon: 'restaurant' },
      { name: 'Pizza', icon: 'pizza' },
      { name: 'Seafood', icon: 'fish' },
      { name: 'Steak', icon: 'restaurant' },
      { name: 'Sushi', icon: 'restaurant' },
      { name: 'Thai', icon: 'restaurant' },
      { name: 'Vegetarian', icon: 'leaf' },
    ],
    amenities: ['Dine-in', 'Takeout', 'Delivery', 'Reservations', 'Outdoor Seating', 'WiFi', 'Parking', 'Wheelchair Accessible', 'Good for Kids', 'Good for Groups', 'Pet Friendly', 'Beer', 'Wine', 'Full Bar', 'Happy Hour'],
  },
  Cafes: {
    typeLabel: 'Type',
    types: [
      { name: 'Any', icon: '' },
      { name: 'Coffee Shop', icon: 'cafe' },
      { name: 'Tea House', icon: 'cafe' },
      { name: 'Bakery', icon: 'cafe' },
      { name: 'Juice Bar', icon: 'nutrition' },
    ],
    amenities: ['WiFi', 'Outdoor Seating', 'Drive-Through', 'Work Friendly', 'Study Friendly', 'Parking', 'Wheelchair Accessible', 'Pet Friendly'],
  },
  Bars: {
    typeLabel: 'Type',
    types: [
      { name: 'Any', icon: '' },
      { name: 'Bar', icon: 'beer' },
      { name: 'Pub', icon: 'beer' },
      { name: 'Nightclub', icon: 'musical-notes' },
      { name: 'Lounge', icon: 'wine' },
      { name: 'Brewery', icon: 'beer' },
      { name: 'Wine Bar', icon: 'wine' },
      { name: 'Sports Bar', icon: 'football' },
    ],
    amenities: ['Live Music', 'DJ', 'Karaoke', 'Pool Tables', 'Darts', 'Trivia Night', 'Happy Hour', 'Outdoor Seating', 'Parking', 'Wheelchair Accessible'],
  },
  Gas: {
    typeLabel: 'Fuel Type',
    types: [
      { name: 'Any', icon: '' },
      { name: 'Regular', icon: 'car' },
      { name: 'Midgrade', icon: 'car' },
      { name: 'Premium', icon: 'car' },
      { name: 'Diesel', icon: 'car' },
      { name: 'E85', icon: 'leaf' },
      { name: 'Electric Charging', icon: 'flash' },
    ],
    amenities: ['Convenience Store', 'Restrooms', 'ATM', 'Car Wash', 'Air Pump', 'Propane', 'Cash', 'Credit', 'Mobile Pay'],
  },
  Shopping: {
    typeLabel: 'Type',
    types: [
      { name: 'Any', icon: '' },
      { name: 'Mall', icon: 'storefront' },
      { name: 'Boutique', icon: 'shirt' },
      { name: 'Department Store', icon: 'storefront' },
      { name: 'Grocery', icon: 'cart' },
      { name: 'Pharmacy', icon: 'medkit' },
      { name: 'Electronics', icon: 'phone-portrait' },
      { name: 'Clothing', icon: 'shirt' },
      { name: 'Home & Garden', icon: 'home' },
    ],
    amenities: ['Parking', 'Wheelchair Accessible', 'Returns Accepted', 'Accepts Credit Cards'],
  },
  Hotels: {
    typeLabel: 'Type',
    types: [
      { name: 'Any', icon: '' },
      { name: 'Hotel', icon: 'bed' },
      { name: 'Motel', icon: 'bed' },
      { name: 'Resort', icon: 'sunny' },
      { name: 'Inn', icon: 'bed' },
      { name: 'Hostel', icon: 'people' },
      { name: 'Vacation Rental', icon: 'home' },
    ],
    amenities: ['Pool', 'Gym/Fitness', 'Free WiFi', 'Free Breakfast', 'Parking', 'Pet Friendly', 'Room Service', 'Spa', 'Kitchen', 'Balcony', 'Ocean View'],
  },
  'RV & Camping': {
    typeLabel: 'Type',
    types: [
      { name: 'Any', icon: '' },
      { name: 'RV Park', icon: 'car' },
      { name: 'Campground', icon: 'bonfire' },
      { name: 'Boondocking', icon: 'compass' },
      { name: 'Dump Station', icon: 'water' },
    ],
    amenities: ['Full Hookups', 'Partial Hookups', 'Electric Only', 'No Hookups', 'Restrooms', 'Showers', 'Laundry', 'WiFi', 'Pool', 'Playground', 'Pet Friendly', 'Fire Pits', 'Picnic Tables', 'Propane', 'Dump Station', 'Store'],
  },
  default: {
    amenities: ['Wheelchair Accessible', 'Parking', 'Accepts Credit Cards'],
  },
};

// Theme colors
const BG = '#F9F7F2';
const ACCENT = '#0F1233';

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
  type: 'place' | 'category' | 'location' | 'recent' | 'address';
  title: string;
  subtitle?: string;
  icon: string;
  data?: any;
}

interface AddressInfo {
  displayName: string;
  shortName: string;
  coordinates: [number, number];
  road?: string;
  city?: string;
  state?: string;
  country?: string;
  postcode?: string;
}

interface ParkingLocation {
  coordinates: [number, number];
  address?: string;
  savedAt: number;
  note?: string;
}

interface SavedLocation {
  id: string;
  name: string;
  coordinates: [number, number];
  address: string;
  icon: string;
  createdAt: number;
}

interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  address?: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}



// ============================================
// MAIN COMPONENT
// ============================================

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { t } = useTranslation();
  // Theme context for dark mode support
  const { theme, isDark } = useThemeContext();
  
  // Auth context for current user
  const { user, profile } = useAuth();
  
  // View mode: 'standard' (default) or 'map' (search/swipe triggered)
  const [viewMode, setViewMode] = useState<'standard' | 'map'>('standard');
  
  // Data states - start with empty arrays, will be populated from database
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [prefetchedPlaces, setPrefetchedPlaces] = useState<SearchResult[]>([]); // Pre-fetched nearby places for instant search
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);
  const [searchedAddressName, setSearchedAddressName] = useState<string>('');
  const [searchedAddress, setSearchedAddress] = useState<AddressInfo | null>(null);
  
  // Category results view states
  const [showCategoryResults, setShowCategoryResults] = useState(false);
  const [categoryResultsPlaces, setCategoryResultsPlaces] = useState<Place[]>([]);
  const [isLoadingCategoryResults, setIsLoadingCategoryResults] = useState(false);
  
  // Filter modal states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    sortBy: string;
    distance: string;
    hours: string;
    tapQuality: string;
    price: string;
    type: string; // Category-specific type (cuisine, fuel type, etc.)
    amenities: string[];
  }>({
    sortBy: 'Distance',
    distance: 'Any',
    hours: 'Any',
    tapQuality: 'Any',
    price: 'Any',
    type: 'Any',
    amenities: [],
  });
  
  // Location states
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  
  // User location pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Map states - default to dark style in dark mode
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>(isDark ? 'dark' : 'osm');
  const [currentMapBounds, setCurrentMapBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } | null>(null);
  const [showSearchThisArea, setShowSearchThisArea] = useState(false);
  const [isSearchingArea, setIsSearchingArea] = useState(false);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(1); // Track bottom sheet position (0=collapsed, 1=mid, 2=expanded)
  
  // Floating icon popup states
  const [showLegendPopup, setShowLegendPopup] = useState(false);
  const [showWeatherPopup, setShowWeatherPopup] = useState(false);
  const [showMapLayerPopup, setShowMapLayerPopup] = useState(false);
  
  // Weather data - fetched from real API
  const [weatherData, setWeatherData] = useState<WeatherData>(getDefaultWeatherData());
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  
  // Personalization states
  const [greeting, setGreeting] = useState('');
  
  // Trending items from multiple sources
  const [trendingItems, setTrendingItems] = useState<any[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);
  
  // Explore Tavvy items (Atlas, Ride, Airport, Happening Now)
  const [exploreItems, setExploreItems] = useState<any[]>([]);
  const [isLoadingExplore, setIsLoadingExplore] = useState(false);
  
  // How Tavvy Works section - collapsed by default per v1 spec
  // Home = action, not explanation
  const [howItWorksExpanded, setHowItWorksExpanded] = useState(false);
  
  // Parking and saved locations
  const [parkingLocation, setParkingLocation] = useState<ParkingLocation | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Refs
  const cameraRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const categoryBottomSheetRef = useRef<BottomSheet>(null);
  const searchInputRef = useRef<TextInput>(null);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    initializeApp();
    
    // Cleanup debounce timer on unmount
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Pulse animation for user location dot
  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startPulseAnimation();
  }, [pulseAnim]);

  // Auto-switch map style when theme changes
  useEffect(() => {
    setMapStyle(isDark ? 'dark' : 'osm');
  }, [isDark]);

  // Handle camera movement when targetLocation changes
  useEffect(() => {
    if (targetLocation && viewMode === 'map') {
      console.log('Moving camera to targetLocation:', targetLocation);
      
      const attempts = [100, 300, 600, 1000];
      const timeoutIds: NodeJS.Timeout[] = [];
      
      attempts.forEach((delay) => {
        const timeoutId = setTimeout(() => {
          if (cameraRef.current) {
            try {
              cameraRef.current.setCamera({
                centerCoordinate: targetLocation,
                zoomLevel: 16,
                animationDuration: 500,
              });
              console.log('Camera moved successfully at delay:', delay);
            } catch (e) {
              console.log('Camera move failed at delay:', delay, e);
            }
          }
        }, delay);
        timeoutIds.push(timeoutId);
      });
      
      return () => timeoutIds.forEach(id => clearTimeout(id));
    }
  }, [targetLocation, viewMode]);

  const initializeApp = async () => {
    updateGreeting();
    loadRecentSearches();
    loadParkingLocation();
    loadSavedLocations();
    loadTrendingItems();
    loadExploreItems();
    requestLocationPermission();
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

  /**
   * Calculate distance between two coordinates in miles (Haversine formula)
   */
  const calculateDistanceMiles = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Load trending items: Restaurants, Coffee Shops, and Pros ONLY
   * Filtering rules:
   * - Must have address AND phone number
   * - Must be within 20 miles of user's location
   * - Only categories: Restaurants, Coffee Shops, Pros
   * - Prioritize places with recent activity/signals (reviews in last 30 days)
   * - Must always feel alive, not random
   */
  const loadTrendingItems = async (userCoords?: [number, number] | null) => {
    setIsLoadingTrending(true);
    try {
      const items: any[] = [];
      const MAX_DISTANCE_MILES = 20;
      const RECENT_DAYS = 30; // Signals in the last X days
      const recentDate = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000).toISOString();
      
      // Use provided coords or current userLocation
      const coords = userCoords || userLocation;
      
      // First, get places with recent reviews/signals (trending = recent activity)
      const { data: recentReviews, error: reviewsError } = await supabase
        .from('place_reviews')
        .select('place_id')
        .gte('created_at', recentDate)
        .limit(200);
      
      // Get unique place IDs with recent activity
      const placesWithActivity = new Set<string>();
      if (recentReviews && !reviewsError) {
        recentReviews.forEach((r: any) => placesWithActivity.add(r.place_id));
      }
      
      // Also check for recent stories
      const { data: recentStories, error: storiesError } = await supabase
        .from('place_stories')
        .select('place_id')
        .gte('created_at', recentDate)
        .eq('status', 'active')
        .limit(100);
      
      if (recentStories && !storiesError) {
        recentStories.forEach((s: any) => placesWithActivity.add(s.place_id));
      }
      
      console.log('Places with recent activity:', placesWithActivity.size);
      
      // Fetch places from fsq_places_raw table - Restaurants, Cafes, Bars, Dining
      // Categories in DB are like: "[Dining and Drinking > Restaurant]"
      // Use geo-bounding box to filter by location at database level
      
      // Calculate bounding box for 20 mile radius (approx 0.29 degrees per mile at equator)
      // Using a slightly larger box to account for latitude variations
      const DEGREES_PER_MILE = 0.0145; // ~1/69 degrees per mile
      const boxSize = MAX_DISTANCE_MILES * DEGREES_PER_MILE;
      
      let placesQuery = supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, address, locality, region, fsq_category_labels, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .or('fsq_category_labels.ilike.%restaurant%,fsq_category_labels.ilike.%dining%,fsq_category_labels.ilike.%cafe%,fsq_category_labels.ilike.%coffee%,fsq_category_labels.ilike.%bar%,fsq_category_labels.ilike.%bakery%');
      
      // Add geo-bounding box filter if we have user coordinates
      if (coords) {
        const userLat = coords[1]; // coords is [lng, lat]
        const userLng = coords[0];
        const minLat = userLat - boxSize;
        const maxLat = userLat + boxSize;
        const minLng = userLng - boxSize;
        const maxLng = userLng + boxSize;
        
        console.log('[Trending] Geo bounds:', { userLat, userLng, minLat, maxLat, minLng, maxLng });
        
        placesQuery = placesQuery
          .gte('latitude', minLat)
          .lte('latitude', maxLat)
          .gte('longitude', minLng)
          .lte('longitude', maxLng);
      }
      
      const { data: places, error: placesError } = await placesQuery.limit(100);
      
      console.log('[Trending] Query result:', { count: places?.length, error: placesError, hasCoords: !!coords });
      
      if (places && !placesError) {
        places.forEach((place: any) => {
          if (!place.latitude || !place.longitude) return;
          
          // Calculate distance if we have user coords
          let distance = 0;
          if (coords) {
            distance = calculateDistanceMiles(
              coords[1], coords[0], // userLocation is [lng, lat]
              Number(place.latitude), Number(place.longitude)
            );
            // Only filter by distance if we have user location
            if (distance > MAX_DISTANCE_MILES) return;
          }
          
          // Determine category type for display
          const categoryLower = (place.fsq_category_labels || '').toLowerCase();
          let displayCategory = 'Restaurant'; // Default
          if (categoryLower.includes('cafe') || categoryLower.includes('coffee')) {
            displayCategory = 'Coffee';
          } else if (categoryLower.includes('bar')) {
            displayCategory = 'Bar';
          } else if (categoryLower.includes('bakery')) {
            displayCategory = 'Bakery';
          }
          
          // Check if this place has recent activity (trending indicator)
          const hasRecentActivity = placesWithActivity.has(place.fsq_place_id);
          
          items.push({
            id: place.fsq_place_id,
            name: place.name,
            subtitle: place.locality ? `${place.locality}, ${place.region || ''}`.trim() : place.address,
            image: null, // fsq_places_raw doesn't have cover images
            type: 'place',
            category: displayCategory,
            latitude: place.latitude,
            longitude: place.longitude,
            distance: distance,
            hasRecentActivity: hasRecentActivity,
            activityScore: hasRecentActivity ? 100 : (coords ? 0 : 50), // Give score to all if no location
          });
        });
      }
      
      // Fetch Pros (service providers) - Must have address and phone
      const { data: pros, error: prosError } = await supabase
        .from('tavvy_pros')
        .select('id, business_name, service_category, city, state, profile_image_url, latitude, longitude, phone, address')
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .not('address', 'is', null)
        .neq('address', '')
        .not('phone', 'is', null)
        .neq('phone', '')
        .limit(50);
      
      if (pros && !prosError) {
        pros.forEach((pro: any) => {
          // MUST have user location for distance filtering - skip if no coords
          if (!coords || !pro.latitude || !pro.longitude) return;
          
          // Calculate distance and filter by 20 miles max
          const distance = calculateDistanceMiles(
            coords[1], coords[0], // userLocation is [lng, lat]
            Number(pro.latitude), Number(pro.longitude)
          );
          if (distance > MAX_DISTANCE_MILES) return;
          
          items.push({
            id: pro.id,
            name: pro.business_name,
            subtitle: pro.service_category || (pro.city ? `${pro.city}, ${pro.state || ''}`.trim() : 'Service Provider'),
            image: pro.profile_image_url,
            type: 'pro',
            category: 'Pros',
            latitude: pro.latitude,
            longitude: pro.longitude,
            distance: distance,
            hasRecentActivity: true, // Pros are always considered active
            activityScore: 50, // Medium priority
          });
        });
      }
      
      console.log('[Trending] Total items before sort:', items.length);
      
      // If no items found with location filter, show random places as fallback
      if (items.length === 0 && places && places.length > 0) {
        console.log('[Trending] No nearby items, showing random places as fallback');
        // Take first 10 places without distance filter
        places.slice(0, 10).forEach((place: any) => {
          const categoryLower = (place.fsq_category_labels || '').toLowerCase();
          let displayCategory = 'Restaurant';
          if (categoryLower.includes('cafe') || categoryLower.includes('coffee')) {
            displayCategory = 'Coffee';
          } else if (categoryLower.includes('bar')) {
            displayCategory = 'Bar';
          }
          
          items.push({
            id: place.fsq_place_id,
            name: place.name,
            subtitle: place.locality ? `${place.locality}, ${place.region || ''}`.trim() : place.address,
            image: null,
            type: 'place',
            category: displayCategory,
            latitude: place.latitude,
            longitude: place.longitude,
            distance: 0,
            hasRecentActivity: false,
            activityScore: 50,
          });
        });
      }
      
      // Sort by: 1) Recent activity first, 2) Then by distance
      // This ensures trending feels alive, not random
      const sorted = items
        .sort((a, b) => {
          // First sort by activity score (places with signals first)
          if (b.activityScore !== a.activityScore) {
            return b.activityScore - a.activityScore;
          }
          // Then by distance (closest first)
          return (a.distance || 999) - (b.distance || 999);
        })
        .slice(0, 10);
      
      console.log('[Trending] Final items:', sorted.length);
      setTrendingItems(sorted);
    } catch (error) {
      console.log('Error loading trending items:', error);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  /**
   * Load Explore Tavvy items - Universes Preview
   * Per v1 spec: Show Airports, Theme Parks, RV & Camping as large Universe cards
   * Future-ready: Food & Dining, Nightlife
   * Cards are discoverability, not promises - Coming Soon badge is acceptable
   */
  const loadExploreItems = async () => {
    setIsLoadingExplore(true);
    try {
      const items: any[] = [];
      
      // 1. Airports Universe (Coming Soon badge OK per spec)
      const { data: airports } = await supabase
        .from('atlas_universes')
        .select('id, name, location, thumbnail_image_url, category_id')
        .eq('status', 'published')
        .or('name.ilike.%airport%,name.ilike.%international%,category_id.eq.airports')
        .limit(5);
      
      if (airports && airports.length > 0) {
        const randomAirport = airports[Math.floor(Math.random() * airports.length)];
        items.push({
          id: randomAirport.id,
          type: 'universe',
          universeType: 'airports',
          title: 'Airports',
          subtitle: randomAirport.location || 'Terminals, lounges & more',
          image: randomAirport.thumbnail_image_url,
          icon: 'airplane-outline',
          color: '#3B82F6',
          route: 'UniverseLanding',
          data: randomAirport,
          isPlaceholder: false,
        });
      } else {
        // Placeholder with Coming Soon - per spec this is acceptable
        items.push({
          id: 'airports-placeholder',
          type: 'universe',
          universeType: 'airports',
          title: 'Airports',
          subtitle: 'Terminals, lounges & more',
          image: null,
          icon: 'airplane-outline',
          color: '#3B82F6',
          route: 'UniverseDiscovery',
          isPlaceholder: true,
        });
      }
      
      // 2. Theme Parks Universe (renamed from Rides & Attractions per spec)
      const { data: themeParks } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, address, locality, region, fsq_category_labels, latitude, longitude')
        .or('fsq_category_labels.ilike.%theme park%,fsq_category_labels.ilike.%amusement park%,fsq_category_labels.ilike.%water park%')
        .limit(20);
      
      if (themeParks && themeParks.length > 0) {
        items.push({
          id: 'theme-parks-universe',
          type: 'universe',
          universeType: 'theme-parks',
          title: 'Theme Parks',
          subtitle: `${themeParks.length}+ parks to explore`,
          image: null,
          icon: 'rocket-outline',
          color: '#8B5CF6',
          route: 'RidesBrowse',
          data: { count: themeParks.length },
          isPlaceholder: false,
        });
      } else {
        items.push({
          id: 'theme-parks-placeholder',
          type: 'universe',
          universeType: 'theme-parks',
          title: 'Theme Parks',
          subtitle: 'Rides & attractions',
          image: null,
          icon: 'rocket-outline',
          color: '#8B5CF6',
          route: 'RidesBrowse',
          isPlaceholder: true,
        });
      }
      
      // 3. RV & Camping Universe
      const { data: camping } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, address, locality, region, fsq_category_labels, latitude, longitude')
        .or('fsq_category_labels.ilike.%rv park%,fsq_category_labels.ilike.%campground%,fsq_category_labels.ilike.%camping%')
        .limit(20);
      
      if (camping && camping.length > 0) {
        items.push({
          id: 'camping-universe',
          type: 'universe',
          universeType: 'camping',
          title: 'RV & Camping',
          subtitle: `${camping.length}+ campgrounds nearby`,
          image: null,
          icon: 'bonfire-outline',
          color: '#10B981',
          route: 'RVCampingBrowse',
          data: { count: camping.length },
          isPlaceholder: false,
        });
      } else {
        items.push({
          id: 'camping-placeholder',
          type: 'universe',
          universeType: 'camping',
          title: 'RV & Camping',
          subtitle: 'Campgrounds & RV parks',
          image: null,
          icon: 'bonfire-outline',
          color: '#10B981',
          route: 'RVCampingBrowse',
          isPlaceholder: true,
        });
      }
      
      // Future universes can be added here:
      // - Food & Dining
      // - Nightlife
      
      setExploreItems(items);
    } catch (error) {
      console.log('Error loading explore items:', error);
    } finally {
      setIsLoadingExplore(false);
    }
  };

  /**
   * Load weather data for user's location
   */
  const loadWeatherData = async (coords: [number, number]) => {
    setIsLoadingWeather(true);
    try {
      const data = await fetchWeatherData(coords[1], coords[0]); // lat, lng
      if (data) {
        setWeatherData(data);
      }
    } catch (error) {
      console.log('Error loading weather:', error);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  /**
   * Center map on user's current location
   */
  const centerOnUserLocation = () => {
    if (userLocation && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: userLocation,
        zoomLevel: 14,
        animationDuration: 500,
      });
    }
  };

  // ============================================
  // PARKING LOCATION
  // ============================================

  const loadParkingLocation = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PARKING_LOCATION);
      if (stored) {
        setParkingLocation(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading parking location:', error);
    }
  };

  const saveParkingLocation = async (location?: [number, number], address?: string) => {
    try {
      const coords = location || userLocation;
      if (!coords) {
        Alert.alert('Location Required', 'Unable to get your current location. Please try again.');
        return;
      }
      
      const parking: ParkingLocation = {
        coordinates: coords,
        address: address || 'Current Location',
        savedAt: Date.now(),
      };
      
      setParkingLocation(parking);
      await AsyncStorage.setItem(STORAGE_KEYS.PARKING_LOCATION, JSON.stringify(parking));
      Alert.alert('Parking Saved!', 'Your parking location has been saved. Tap the car icon on the map to navigate back.');
    } catch (error) {
      console.log('Error saving parking location:', error);
    }
  };

  const clearParkingLocation = async () => {
    try {
      setParkingLocation(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.PARKING_LOCATION);
    } catch (error) {
      console.log('Error clearing parking location:', error);
    }
  };

  const navigateToParking = () => {
    if (!parkingLocation) return;
    
    const [lon, lat] = parkingLocation.coordinates;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lon}`,
      android: `google.navigation:q=${lat},${lon}`,
    });
    
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
      });
    }
  };

  const getParkingDuration = (): string => {
    if (!parkingLocation) return '';
    
    const minutes = Math.floor((Date.now() - parkingLocation.savedAt) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // ============================================
  // SAVED LOCATIONS
  // ============================================

  const loadSavedLocations = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_LOCATIONS);
      if (stored) {
        setSavedLocations(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading saved locations:', error);
    }
  };

  const saveLocation = async (name: string, coordinates: [number, number], address: string, icon: string = 'bookmark') => {
    try {
      const newLocation: SavedLocation = {
        id: Date.now().toString(),
        name,
        coordinates,
        address,
        icon,
        createdAt: Date.now(),
      };
      
      const updated = [...savedLocations, newLocation];
      setSavedLocations(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOCATIONS, JSON.stringify(updated));
      Alert.alert('Location Saved!', `"${name}" has been added to your saved locations.`);
    } catch (error) {
      console.log('Error saving location:', error);
    }
  };

  const removeSavedLocation = async (id: string) => {
    try {
      const updated = savedLocations.filter(loc => loc.id !== id);
      setSavedLocations(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOCATIONS, JSON.stringify(updated));
    } catch (error) {
      console.log('Error removing saved location:', error);
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
        
        fetchPlaces(coords);
        loadWeatherData(coords);
        loadTrendingItems(coords); // Reload trending with user location for distance filtering
        
        // Pre-fetch nearby places for instant autocomplete
        prefetchNearbyPlaces({ latitude: coords[1], longitude: coords[0] }, 100)
          .then(places => {
            setPrefetchedPlaces(places);
            console.log(`[HomeScreen] Pre-fetched ${places.length} nearby places for instant search`);
          })
          .catch(err => console.log('[HomeScreen] Pre-fetch error:', err));
        
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          setLocationName(`${address.city || ''}, ${address.region || ''}`);
        }
      } else {
        fetchPlaces();
      }
    } catch (error) {
      console.log('Error getting location:', error);
      fetchPlaces();
    }
  };

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchPlaces = async (location?: [number, number]) => {
    try {
      setLoading(true);

      // Default to San Francisco for simulator testing
      const defaultLng = -122.4194; // San Francisco
      const defaultLat = 37.7749;
      
      const centerLng = location?.[0] || userLocation?.[0] || defaultLng;
      const centerLat = location?.[1] || userLocation?.[1] || defaultLat;
      
      const latDelta = 0.1;
      const lngDelta = 0.1;
      
      const minLat = centerLat - latDelta;
      const maxLat = centerLat + latDelta;
      const minLng = centerLng - lngDelta;
      const maxLng = centerLng + lngDelta;

      console.log(`Fetching places near [${centerLng}, ${centerLat}]`);

      // Use centralized placeService with hybrid strategy:
      // 1. Query canonical `places` table first (fast path)
      // 2. Fallback to `fsq_places_raw` if results < threshold
      // 3. Sort by distance from user location
      const result = await fetchPlacesInBounds({
        bounds: { minLat, maxLat, minLng, maxLng },
        userLocation: userLocation ? { latitude: userLocation[1], longitude: userLocation[0] } : undefined,
        limit: 150,
        fallbackThreshold: 40,
        sortByDistance: true,
      });

      // Debug logging (only when DEBUG_PLACES is true)
      if (DEBUG_PLACES) {
        console.log(`[DEBUG] Places fetched: ${result.places.length}`);
        console.log(`[DEBUG] From canonical: ${result.metrics.fromPlaces}`);
        console.log(`[DEBUG] From fsq_raw: ${result.metrics.fromFsqRaw}`);
        console.log(`[DEBUG] Fallback triggered: ${result.metrics.fallbackTriggered}`);
        console.log(`[DEBUG] Total time: ${result.metrics.totalTime}ms`);
      }

      console.log(`Fetched ${result.places.length} places (${result.metrics.fromPlaces} canonical, ${result.metrics.fromFsqRaw} fsq_raw)`);

      if (result.places.length > 0) {
        // Get signal aggregates for the places
        const placeIds = result.places.map(p => p.source_id);
        
        let signalAggregates: any[] = [];
        try {
          const { data: signalData } = await supabase
            .from('place_signal_aggregates')
            .select('place_id, signal_label, total_taps')
            .in('place_id', placeIds);
          signalAggregates = signalData || [];
        } catch (e) {
          console.log('No signal aggregates table or data');
        }

        // Map PlaceCard[] to existing Place[] shape for UI compatibility
        const processedPlaces = result.places
          .filter((place) => {
            return typeof place.longitude === 'number' && typeof place.latitude === 'number' && 
                   !isNaN(place.longitude) && !isNaN(place.latitude) && 
                   place.longitude !== 0 && place.latitude !== 0;
          })
          .map(place => {
            // Get signals for this place
            const placeSignals = signalAggregates
              .filter(s => s.place_id === place.source_id)
              .map(s => ({
                bucket: s.signal_label || 'Unknown',
                tap_total: s.total_taps || 0,
              }));

            // Map PlaceCard to existing Place interface
            return {
              id: place.source_id, // Use source_id for navigation (fsq_id or tavvy place id)
              name: place.name,
              latitude: place.latitude,
              longitude: place.longitude,
              address_line1: place.address || '',
              city: place.city || '',
              state_region: place.region || '',
              country: place.country || '',
              category: place.category || 'Other',
              phone: place.phone || '',
              website: place.website || '',
              instagram_url: place.instagram || '',
              signals: placeSignals,
              photos: place.photos || [],
            };
          });

        setPlaces(processedPlaces as Place[]);
        setFilteredPlaces(processedPlaces as Place[]);
      } else {
        console.log('No places found in database for this location');
        setPlaces([]);
        setFilteredPlaces([]);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setPlaces([]);
      setFilteredPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate dynamic limit based on visible map area
   * Larger visible area = more places to show
   */
  const calculateDynamicLimit = (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }): number => {
    const latDelta = bounds.maxLat - bounds.minLat;
    const lngDelta = bounds.maxLng - bounds.minLng;
    
    // Calculate approximate area in degrees squared
    const areaDegrees = latDelta * lngDelta;
    
    // Base limit for small area (city block level, ~0.01 sq degrees)
    // Scale up for larger areas, cap at 500 for very zoomed out views
    if (areaDegrees < 0.01) {
      return 100;  // Very zoomed in (neighborhood level)
    } else if (areaDegrees < 0.1) {
      return 150;  // City level
    } else if (areaDegrees < 1) {
      return 250;  // Metro area level
    } else if (areaDegrees < 5) {
      return 400;  // Regional level
    } else {
      return 500;  // State/country level - max limit
    }
  };

  /**
   * Fetch places for the current visible map bounds
   * Called when user taps "Search this Area" button
   */
  const fetchPlacesForBounds = async (bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => {
    try {
      setIsSearchingArea(true);
      
      // Calculate dynamic limit based on visible area size
      const dynamicLimit = calculateDynamicLimit(bounds);
      console.log(`Fetching places for bounds: [${bounds.minLng}, ${bounds.minLat}] to [${bounds.maxLng}, ${bounds.maxLat}] with limit ${dynamicLimit}`);

      const result = await fetchPlacesInBounds({
        bounds,
        userLocation: userLocation ? { latitude: userLocation[1], longitude: userLocation[0] } : undefined,
        limit: dynamicLimit,
        fallbackThreshold: 40,
        sortByDistance: true,
      });

      console.log(`Fetched ${result.places.length} places for map bounds`);

      if (result.places.length > 0) {
        // Get signal aggregates for the places
        const placeIds = result.places.map(p => p.source_id);
        
        let signalAggregates: any[] = [];
        try {
          const { data: signalData } = await supabase
            .from('place_signal_aggregates')
            .select('place_id, signal_label, total_taps')
            .in('place_id', placeIds);
          signalAggregates = signalData || [];
        } catch (e) {
          console.log('No signal aggregates table or data');
        }

        // Map PlaceCard[] to existing Place[] shape for UI compatibility
        const processedPlaces = result.places
          .filter((place) => {
            return typeof place.longitude === 'number' && typeof place.latitude === 'number' && 
                   !isNaN(place.longitude) && !isNaN(place.latitude) && 
                   place.longitude !== 0 && place.latitude !== 0;
          })
          .map(place => {
            const placeSignals = signalAggregates
              .filter(s => s.place_id === place.source_id)
              .map(s => ({
                bucket: s.signal_label || 'Unknown',
                tap_total: s.total_taps || 0,
              }));

            return {
              id: place.source_id,
              name: place.name,
              latitude: place.latitude,
              longitude: place.longitude,
              address_line1: place.address || '',
              city: place.city || '',
              state_region: place.region || '',
              country: place.country || '',
              category: place.category || 'Other',
              phone: place.phone || '',
              website: place.website || '',
              instagram_url: place.instagram || '',
              signals: placeSignals,
              photos: place.photos || [],
            };
          });

        setPlaces(processedPlaces as Place[]);
        setFilteredPlaces(processedPlaces as Place[]);
      } else {
        console.log('No places found in this area');
        setPlaces([]);
        setFilteredPlaces([]);
      }
      
      setShowSearchThisArea(false);
    } catch (error) {
      console.error('Error fetching places for bounds:', error);
    } finally {
      setIsSearchingArea(false);
    }
  };

  /**
   * Handle map region change - show "Search this Area" button only when map is moved
   */
  const handleMapRegionChange = (feature: any) => {
    if (!feature?.properties?.visibleBounds) return;
    
    const visibleBounds = feature.properties.visibleBounds;
    // visibleBounds is [[ne_lng, ne_lat], [sw_lng, sw_lat]]
    const [[neLng, neLat], [swLng, swLat]] = visibleBounds;
    
    const newBounds = {
      minLat: swLat,
      maxLat: neLat,
      minLng: swLng,
      maxLng: neLng,
    };
    
    // Only show "Search this area" if bounds have significantly changed from current
    if (currentMapBounds) {
      const latDiff = Math.abs(newBounds.minLat - currentMapBounds.minLat) + 
                      Math.abs(newBounds.maxLat - currentMapBounds.maxLat);
      const lngDiff = Math.abs(newBounds.minLng - currentMapBounds.minLng) + 
                      Math.abs(newBounds.maxLng - currentMapBounds.maxLng);
      
      // Only show button if map moved significantly (threshold ~0.01 degrees = ~1km)
      if (latDiff > 0.01 || lngDiff > 0.01) {
        setShowSearchThisArea(true);
      }
    }
    
    setCurrentMapBounds(newBounds);
  };

  /**
   * Handle "Search this Area" button press
   */
  const handleSearchThisArea = () => {
    if (currentMapBounds) {
      fetchPlacesForBounds(currentMapBounds);
    }
  };

  // ============================================
  // SEARCH FUNCTIONS
  // ============================================

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    
    // Clear previous debounce timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    if (text.trim().length === 0) {
      setSearchSuggestions([]);
      return;
    }

    // INSTANT: Search pre-fetched places first (sub-millisecond)
    if (prefetchedPlaces.length > 0) {
      const instantResults = searchPrefetchedPlaces(text, prefetchedPlaces, 5);
      if (instantResults.length > 0) {
        const instantSuggestions: SearchSuggestion[] = instantResults.map(place => ({
          id: `place-${place.source_id}`,
          type: 'place' as const,
          title: place.name,
          subtitle: `${place.category || 'Other'} • ${place.city || 'Nearby'}`,
          icon: 'location',
          data: {
            id: place.source_id,
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            address_line1: place.address || '',
            city: place.city || '',
            category: place.category || 'Other',
            signals: [],
            photos: [],
          },
        }));
        setSearchSuggestions(instantSuggestions); // Show instant results immediately
      }
    }

    // Debounce search by 200ms for faster response (optimized)
    searchDebounceRef.current = setTimeout(async () => {
      const suggestions: SearchSuggestion[] = [];
      const query = text.toLowerCase();

      // Search database for matching places using centralized searchService
      try {
      const searchResults = await searchPlaceSuggestions(text, 8, userLocation || undefined);

      if (searchResults && searchResults.length > 0) {
        searchResults.forEach(place => {
          suggestions.push({
            id: `place-${place.source_id}`,
            type: 'place',
            title: place.name,
            subtitle: `${place.category || 'Other'} • ${place.city || 'Nearby'}`,
            icon: 'location',
            data: {
              id: place.source_id,
              name: place.name,
              latitude: place.latitude,
              longitude: place.longitude,
              address_line1: place.address || '',
              city: place.city || '',
              category: place.category || 'Other',
              signals: [],
              photos: [],
            },
          });
        });
      }
    } catch (e) {
      console.log('Search error:', e);
      // Fallback to local search
      const matchingPlaces = places
        .filter(p => p.name.toLowerCase().includes(query))
        .slice(0, 3);
      
      matchingPlaces.forEach(place => {
        suggestions.push({
          id: `place-${place.id}`,
          type: 'place',
          title: place.name,
          subtitle: place.category,
          icon: 'location',
          data: place,
        });
      });
    }

    // Add matching categories
    const matchingCategories = SEARCHABLE_CATEGORIES
      .filter(c => c.name.toLowerCase().includes(query))
      .slice(0, 2);
    
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

    // Add recent searches
    const matchingRecent = recentSearches
      .filter(s => s.toLowerCase().includes(query))
      .slice(0, 2);
    
    matchingRecent.forEach(search => {
      suggestions.push({
        id: `recent-${search}`,
        type: 'recent',
        title: search,
        subtitle: 'Recent search',
        icon: 'time',
      });
    });

    setSearchSuggestions(suggestions);

    // Always search for addresses when query is long enough (using optimized location-biased search)
    if (text.length >= 3) {
      setIsSearchingAddress(true);
      try {
        // Use optimized searchAddresses with location bias for faster, more relevant results
        const addressResults = await searchAddresses(
          text,
          5,
          userLocation ? { latitude: userLocation[1], longitude: userLocation[0] } : undefined,
          'us' // Default to US, can be made dynamic based on user's country
        );
        
        addressResults.forEach((result, index) => {
          suggestions.push({
            id: `address-${index}`,
            type: 'address',
            title: result.shortName,
            subtitle: result.displayName,
            icon: 'navigate',
            data: {
              display_name: result.displayName,
              lat: String(result.latitude),
              lon: String(result.longitude),
            },
          });
        });
        
        setSearchSuggestions([...suggestions]);
      } catch (error) {
        console.log('Address search error:', error);
      } finally {
        setIsSearchingAddress(false);
      }
    }
    }, 200); // End of debounce setTimeout (optimized from 300ms)
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      setIsSearchFocused(false);
    }, 200);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      saveRecentSearch(searchQuery.trim());
      
      // Keywords that indicate universe/atlas searches
      const universeKeywords = ['universe', 'atlas', 'theme park', 'airport', 'stadium', 'mall', 'campus', 'resort', 'park', 'zoo', 'museum', 'disney', 'universal', 'seaworld'];
      
      // Check if query matches universe keywords
      const isUniverseSearch = universeKeywords.some(keyword => query.includes(keyword));
      
      if (isUniverseSearch) {
        // Navigate to universes with search query
        Keyboard.dismiss();
        navigation.navigate('Explore', { searchQuery: searchQuery.trim() });
      } else {
        // Default to map/places search
        filterPlaces(searchQuery.trim());
        switchToMapMode();
      }
    }
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    Keyboard.dismiss();
    setIsSearchFocused(false);
    
    switch (suggestion.type) {
      case 'place':
        // Navigate to map and center on the selected place
        const place = suggestion.data;
        if (place.latitude && place.longitude) {
          // Switch to map mode first, then set location (to avoid it being cleared)
          switchToMapMode();
          // Use setTimeout to ensure state updates happen after mode switch
          setTimeout(() => {
            setTargetLocation([place.longitude, place.latitude]);
            setSelectedPlace(place);
            setSearchQuery(place.name);
          }, 50);
        } else {
          handlePlacePress(place);
        }
        break;
      case 'category':
        handleCategorySelect(suggestion.data.name);
        // Don't switch to map mode - show category results view instead
        break;
      case 'address':
        const result = suggestion.data as GeocodingResult;
        const coords: [number, number] = [parseFloat(result.lon), parseFloat(result.lat)];
        setTargetLocation(coords);
        setSearchedAddressName(suggestion.title);
        setSearchedAddress({
          displayName: result.display_name,
          shortName: suggestion.title,
          coordinates: coords,
          road: result.address?.road,
          city: result.address?.city,
          state: result.address?.state,
          country: result.address?.country,
          postcode: result.address?.postcode,
        });
        setSearchQuery(suggestion.title);
        switchToMapMode();
        break;
      case 'recent':
        setSearchQuery(suggestion.title);
        filterPlaces(suggestion.title);
        switchToMapMode();
        break;
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchSuggestions([]);
    setTargetLocation(null);
    setSearchedAddress(null);
    setSearchedAddressName('');
    setFilteredPlaces(places);
  };

  const filterPlaces = (query: string) => {
    const q = query.toLowerCase();
    const filtered = places.filter(place => 
      place.name.toLowerCase().includes(q) ||
      place.category?.toLowerCase().includes(q) ||
      place.address_line1?.toLowerCase().includes(q)
    );
    setFilteredPlaces(filtered.length > 0 ? filtered : places);
  };

  // ============================================
  // CATEGORY HANDLING
  // ============================================

  const handleCategorySelect = async (category: string) => {
    // Special handling for Filter button - opens advanced filter modal
    if (category === 'Filter') {
      setShowAdvancedFilterModal(true);
      return;
    }
    
    setSelectedCategory(category);
    
    if (category === 'All') {
      setFilteredPlaces(places);
      setShowCategoryResults(false);
    } else {
      // Show category results view with filter bottom sheet
      setShowCategoryResults(true);
      setIsLoadingCategoryResults(true);
      
      // Reset filters when changing category
      setActiveFilters({
        sortBy: 'Distance',
        distance: 'Any',
        hours: 'Any',
        tapQuality: 'Any',
        price: 'Any',
        type: 'Any',
        amenities: [],
      });
      
      // Fetch places for this category from database
      await fetchCategoryPlaces(category);
    }
  };

  const fetchCategoryPlaces = async (category: string, filters?: typeof activeFilters) => {
    // Use default San Francisco location if userLocation is not available (for simulator)
    const defaultLocation: [number, number] = [-122.4194, 37.7749]; // San Francisco
    const locationToUse = userLocation || defaultLocation;

    try {
      const [centerLng, centerLat] = locationToUse;

      // Map user-friendly category names to search queries for Typesense
      const categoryMappings: { [key: string]: string } = {
        'Restaurants': 'restaurant',
        'Cafes': 'coffee cafe',
        'Coffee Shops': 'coffee cafe',
        'Bars': 'bar pub',
        'Contractors': 'contractor',
        'Hotels': 'hotel',
        'Shopping': 'shop store',
        'Entertainment': 'entertainment',
        'Health': 'health medical',
        'Beauty': 'beauty salon',
        'Fitness': 'gym fitness',
        'Gas': 'gas station fuel',
        'Gas Stations': 'gas station',
        'RV & Camping': 'campground rv',
        'Campgrounds': 'campground',
        'RV Parks': 'rv park',
        'Dump Stations': 'dump station',
        'Propane': 'propane',
        'Theme Parks': 'theme park',
        'Rides': 'ride',
        'Live Music': 'live music',
        'Events': 'event',
        'Nightlife': 'nightclub',
        'Fast Food': 'fast food',
        'Outdoor': 'park outdoor',
        'Pros': 'contractor service',
        'Healthcare': 'hospital clinic',
        'Restrooms': 'restroom',
        'Showers': 'shower',
        'Laundromat': 'laundromat',
        'Border Crossings': 'border crossing',
      };

      // Get search query for this category
      const searchQuery = categoryMappings[category] || category.toLowerCase();

      console.log(`[Typesense] Fetching ${category} near [${centerLng}, ${centerLat}] with query: "${searchQuery}"`);

      // Use Typesense for lightning-fast category search
      const startTime = Date.now();
      const result = await typesenseSearchPlaces({
        query: searchQuery,
        latitude: centerLat,
        longitude: centerLng,
        radiusKm: 25, // 25km radius (~15 miles)
        limit: 200, // Get more results from Typesense
      });

      const searchTime = Date.now() - startTime;
      console.log(`[Typesense] Found ${result.places.length} places in ${searchTime}ms (Typesense: ${result.searchTimeMs}ms)`);

      if (result.places.length > 0) {
        // Transform Typesense results to app format
        const processedPlaces = result.places
          .filter((place) => {
            return typeof place.longitude === 'number' && typeof place.latitude === 'number' && 
                   !isNaN(place.longitude) && !isNaN(place.latitude) && 
                   place.longitude !== 0 && place.latitude !== 0;
          })
          .map(place => ({
            id: place.fsq_place_id,
            name: place.name,
            latitude: place.latitude!,
            longitude: place.longitude!,
            address_line1: place.address || '',
            city: place.locality || '',
            state_region: place.region || '',
            country: place.country || '',
            category: place.category || 'Other',
            phone: place.tel || '',
            website: place.website || '',
            instagram_url: place.instagram || '',
            signals: [],
            photos: [],
            distance: place.distance,
          }))
          .slice(0, 100); // Limit to 100 results for UI

        console.log(`[Typesense] Final processed places: ${processedPlaces.length}`);
        setCategoryResultsPlaces(processedPlaces as Place[]);
      } else {
        console.log(`[Typesense] No ${category} found nearby`);
        setCategoryResultsPlaces([]);
      }
    } catch (error) {
      console.error('[Typesense] Error fetching category places:', error);
      
      // Fallback to local filtering from already loaded places
      const filtered = places.filter(place => 
        place.category?.toLowerCase().includes(category.toLowerCase())
      );
      setCategoryResultsPlaces(filtered);
    } finally {
      setIsLoadingCategoryResults(false);
    }
  };

  const closeCategoryResults = () => {
    setShowCategoryResults(false);
    setSelectedCategory('All');
    setCategoryResultsPlaces([]);
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    // Re-fetch with filters applied
    fetchCategoryPlaces(selectedCategory, activeFilters);
  };

  const clearFilters = () => {
    setActiveFilters({
      sortBy: 'Distance',
      distance: 'Any',
      hours: 'Any',
      tapQuality: 'Any',
      price: 'Any',
      type: 'Any',
      amenities: [],
    });
  };

  const toggleAmenityFilter = (amenity: string) => {
    setActiveFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  // ============================================
  // VIEW MODE SWITCHING
  // ============================================

  const switchToMapMode = () => {
    setViewMode('map');
    setSearchedAddress(null);
    setTargetLocation(null);
  };

  const switchToStandardMode = () => {
    setViewMode('standard');
    setSearchedAddress(null);
    setTargetLocation(null);
  };

  // ============================================
  // PLACE HANDLING
  // ============================================

  const handlePlacePress = (place: Place) => {
    setSelectedPlace(place);
    if (navigation?.navigate) {
      // Use the place ID directly - it's already in the correct format (source_id)
      const placeId = place.id;
      console.log('[HomeScreen] Navigating to PlaceDetails with ID:', placeId);
      navigation.navigate('PlaceDetails', { placeId });
    }
  };

  const handleMarkerPress = (place: Place) => {
    setSelectedPlace(place);
    // Snap the appropriate bottom sheet based on current view
    if (showCategoryResults) {
      categoryBottomSheetRef.current?.snapToIndex(1);
    } else {
      bottomSheetRef.current?.snapToIndex(1);
    }
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleDirections = (place: Place) => {
    const lat = place.latitude || place.lat;
    const lon = place.longitude || place.lng;
    if (lat && lon) {
      const url = Platform.select({
        ios: `maps://app?daddr=${lat},${lon}`,
        android: `google.navigation:q=${lat},${lon}`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
        });
      }
    }
  };

  const handleWebsite = (website?: string) => {
    if (website) {
      Linking.openURL(website);
    }
  };

  const handleSocial = (instagram?: string) => {
    if (instagram) {
      Linking.openURL(instagram);
    }
  };

  // ============================================
  // SIGNAL HELPERS
  // ============================================

  const getSignalType = (bucket: string): 'positive' | 'neutral' | 'negative' => {
    const bucketLower = bucket.toLowerCase();
    
    // Check for exact category names first
    if (bucketLower === 'the good' || bucketLower.includes('the good')) {
      return 'positive';
    }
    if (bucketLower === 'the vibe' || bucketLower.includes('the vibe')) {
      return 'neutral';
    }
    if (bucketLower === 'heads up' || bucketLower.includes('heads up')) {
      return 'negative';
    }
    
    // Fallback to keyword detection for actual signal names
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
        bucketLower.includes('wait') || bucketLower.includes('noisy') ||
        bucketLower.includes('heads')) {
      return 'negative';
    }
    
    return 'neutral';
  };

  const getSignalColor = (bucket: string) => {
    const type = getSignalType(bucket);
    if (type === 'positive') return '#0A84FF'; // Blue - The Good
    if (type === 'negative') return '#FF9500'; // Orange - Heads Up
    return '#8B5CF6'; // Purple - The Vibe
  };

  const getSignalIconColor = (bucket: string) => {
    // White icons on solid colored backgrounds
    return '#FFFFFF';
  };

  const getSignalIcon = (bucket: string): string => {
    const type = getSignalType(bucket);
    if (type === 'positive') return 'thumbs-up';
    if (type === 'negative') return 'alert';
    return 'trending-up';
  };

  // Get category-based fallback image URL when place has no photo
  const getCategoryFallbackImage = (category: string | undefined): string => {
    const lowerCategory = (category || '').toLowerCase();
    
    const imageMap: Record<string, string> = {
      'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      'italian': 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800',
      'mexican': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
      'asian': 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
      'coffee': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
      'cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
      'rv park': 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=800',
      'campground': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
      'camping': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
      'hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'resort': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      'bar': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
      'nightclub': 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800',
      'shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
      'mall': 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800',
      'gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      'spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
      'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
      'sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
      'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
      'taco': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
      'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    };
    
    for (const [key, url] of Object.entries(imageMap)) {
      if (lowerCategory.includes(key)) return url;
    }
    
    return imageMap.default;
  };

  // Generate display signals with fallbacks for missing categories
  // Always returns exactly 4 signals: 2 "The Good" (top row), 1 "The Vibe" + 1 "Heads Up" (bottom row)
  const getDisplaySignals = (signals: Signal[] | undefined): { bucket: string; tap_total: number; isEmpty: boolean }[] => {
    const positive = signals?.filter(s => getSignalType(s.bucket) === 'positive') || [];
    const neutral = signals?.filter(s => getSignalType(s.bucket) === 'neutral') || [];
    const negative = signals?.filter(s => getSignalType(s.bucket) === 'negative') || [];

    const result: { bucket: string; tap_total: number; isEmpty: boolean }[] = [];

    // TOP ROW: 2 "The Good" (positive) signals
    if (positive.length >= 2) {
      result.push({ ...positive[0], isEmpty: false });
      result.push({ ...positive[1], isEmpty: false });
    } else if (positive.length === 1) {
      result.push({ ...positive[0], isEmpty: false });
      result.push({ bucket: 'The Good', tap_total: 0, isEmpty: true });
    } else {
      result.push({ bucket: 'The Good', tap_total: 0, isEmpty: true });
      result.push({ bucket: 'The Good', tap_total: 0, isEmpty: true });
    }

    // BOTTOM ROW: 1 "The Vibe" (neutral) + 1 "Heads Up" (negative)
    if (neutral.length > 0) {
      result.push({ ...neutral[0], isEmpty: false });
    } else {
      result.push({ bucket: 'The Vibe', tap_total: 0, isEmpty: true });
    }

    if (negative.length > 0) {
      result.push({ ...negative[0], isEmpty: false });
    } else {
      result.push({ bucket: 'Heads Up', tap_total: 0, isEmpty: true });
    }

    return result; // Always exactly 4 items
  };

  // Get the placeholder text for empty signal categories
  const getEmptySignalText = (bucket: string): string => {
    // All empty states now use the same encouraging call-to-action
    return 'Be the first to tap!';
  };

  const sortSignalsForDisplay = (signals: Signal[]): Signal[] => {
    const positive = signals.filter(s => getSignalType(s.bucket) === 'positive');
    const neutral = signals.filter(s => getSignalType(s.bucket) === 'neutral');
    const negative = signals.filter(s => getSignalType(s.bucket) === 'negative');
    
    const result: Signal[] = [];
    result.push(...positive.slice(0, 2));
    if (neutral.length > 0) result.push(neutral[0]);
    if (negative.length > 0) result.push(negative[0]);
    
    return result.slice(0, 4);
  };

  const getMarkerColor = (category?: string) => {
    if (!category) return '#007AFF';
    // Colors match the Map Legend - expanded for more categories
    const colors: Record<string, string> = {
      // Food & Drink
      restaurants: '#EF4444',      // Red
      restaurant: '#EF4444',       // Red
      'food': '#EF4444',           // Red
      'dining': '#EF4444',         // Red
      cafes: '#F59E0B',            // Orange/Amber
      cafe: '#F59E0B',             // Orange/Amber
      'coffee': '#F59E0B',         // Orange/Amber
      'coffee shop': '#F59E0B',    // Orange/Amber
      bars: '#8B5CF6',             // Purple
      bar: '#8B5CF6',              // Purple
      'nightlife': '#8B5CF6',      // Purple
      'pub': '#8B5CF6',            // Purple
      'brewery': '#8B5CF6',        // Purple
      // Shopping
      shopping: '#3B82F6',         // Blue
      'retail': '#3B82F6',         // Blue
      'store': '#3B82F6',          // Blue
      'mall': '#3B82F6',           // Blue
      // Travel & Lodging
      'rv & camping': '#22C55E',   // Green
      'camping': '#22C55E',        // Green
      'outdoors': '#22C55E',       // Green
      'parks': '#22C55E',          // Green
      'park': '#22C55E',           // Green
      hotels: '#EC4899',           // Pink
      hotel: '#EC4899',            // Pink
      'lodging': '#EC4899',        // Pink
      // Gas & Automotive
      'gas': '#FF6B35',            // Orange-Red
      'gas station': '#FF6B35',    // Orange-Red
      'fuel': '#FF6B35',           // Orange-Red
      'automotive': '#FF6B35',     // Orange-Red
      // Entertainment
      'entertainment': '#10B981',  // Emerald
      'arts': '#10B981',           // Emerald
      'museum': '#10B981',         // Emerald
      'theater': '#10B981',        // Emerald
      'cinema': '#10B981',         // Emerald
      // Services
      'services': '#6366F1',       // Indigo
      'health': '#6366F1',         // Indigo
      'medical': '#6366F1',        // Indigo
      'fitness': '#6366F1',        // Indigo
      'gym': '#6366F1',            // Indigo
      // Travel
      'travel': '#0EA5E9',         // Sky Blue
      'airport': '#0EA5E9',        // Sky Blue
      'transit': '#0EA5E9',        // Sky Blue
      // Attractions
      'attractions': '#F43F5E',    // Rose
      'theme park': '#F43F5E',     // Rose
      'landmark': '#F43F5E',       // Rose
    };
    return colors[category.toLowerCase()] || '#007AFF';
  };

  // Get icon name based on category
  const getMarkerIcon = (category?: string): string => {
    if (!category) return 'location';
    const icons: Record<string, string> = {
      // Food & Drink
      restaurants: 'restaurant',
      restaurant: 'restaurant',
      'food': 'restaurant',
      'dining': 'restaurant',
      cafes: 'cafe',
      cafe: 'cafe',
      'coffee': 'cafe',
      'coffee shop': 'cafe',
      bars: 'beer',
      bar: 'beer',
      'nightlife': 'moon',
      'pub': 'beer',
      'brewery': 'beer',
      // Shopping
      shopping: 'cart',
      'retail': 'cart',
      'store': 'storefront',
      'mall': 'storefront',
      // Travel & Lodging
      'rv & camping': 'bonfire',
      'camping': 'bonfire',
      'outdoors': 'leaf',
      'parks': 'leaf',
      'park': 'leaf',
      hotels: 'bed',
      hotel: 'bed',
      'lodging': 'bed',
      // Gas & Automotive
      'gas': 'car',
      'gas station': 'car',
      'fuel': 'car',
      'automotive': 'car',
      // Entertainment
      'entertainment': 'game-controller',
      'arts': 'color-palette',
      'museum': 'business',
      'theater': 'film',
      'cinema': 'film',
      // Services
      'services': 'construct',
      'health': 'medical',
      'medical': 'medical',
      'fitness': 'fitness',
      'gym': 'fitness',
      // Travel
      'travel': 'airplane',
      'airport': 'airplane',
      'transit': 'bus',
      // Attractions
      'attractions': 'star',
      'theme park': 'happy',
      'landmark': 'flag',
    };
    return icons[category.toLowerCase()] || 'location';
  };

  // ============================================
  // RENDER: SEARCH SUGGESTIONS DROPDOWN
  // ============================================

  const renderSearchSuggestions = () => {
    if (!isSearchFocused) {
      return null;
    }

    if (searchSuggestions.length === 0 && searchQuery.trim().length === 0) {
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
              suggestion.type === 'address' && styles.suggestionIconAddress,
              suggestion.type === 'recent' && styles.suggestionIconRecent,
            ]}>
              <Ionicons
                name={suggestion.icon as any}
                size={18}
                color={
                  suggestion.type === 'place' ? '#0A84FF' :
                  suggestion.type === 'category' ? '#34C759' :
                  suggestion.type === 'location' ? '#FF9500' :
                  suggestion.type === 'address' ? '#AF52DE' : '#8E8E93'
                }
              />
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text style={[styles.suggestionTitle, { color: isDark ? theme.text : '#000' }]}>{suggestion.title}</Text>
              {suggestion.subtitle && (
                <Text style={[styles.suggestionSubtitle, { color: isDark ? theme.textSecondary : '#8E8E93' }]}>{suggestion.subtitle}</Text>
              )}
            </View>
            <Ionicons
              name={suggestion.type === 'place' ? 'chevron-forward' : 'arrow-forward'}
              size={16}
              color="#C7C7CC"
            />
          </TouchableOpacity>
        ))}
        
        {isSearchingAddress && (
          <View style={styles.suggestionItem}>
            <View style={[styles.suggestionIconContainer, styles.suggestionIconAddress]}>
              <ActivityIndicator size="small" color="#AF52DE" />
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text style={[styles.suggestionTitle, { color: isDark ? theme.text : '#000' }]}>Searching addresses...</Text>
              <Text style={[styles.suggestionSubtitle, { color: isDark ? theme.textSecondary : '#8E8E93' }]}>Looking up location</Text>
            </View>
          </View>
        )}
        
        {searchQuery.trim().length > 0 && (
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleSearchSubmit()}
          >
            <View style={[styles.suggestionIconContainer, styles.suggestionIconSearch]}>
              <Ionicons name="search" size={18} color="#0A84FF" />
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text style={[styles.suggestionTitle, { color: isDark ? theme.text : '#000' }]}>Search for "{searchQuery}"</Text>
              <Text style={[styles.suggestionSubtitle, { color: isDark ? theme.textSecondary : '#8E8E93' }]}>See all results on map</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#C7C7CC" />
          </TouchableOpacity>
        )}
      </View>
    );
  };



  // ============================================
  // RENDER: ADDRESS INFO CARD
  // ============================================

  const renderAddressInfoCard = () => {
    if (!searchedAddress) return null;

    const handleShare = async () => {
      try {
        const [lon, lat] = searchedAddress.coordinates;
        const message = `Check out this location: ${searchedAddress.displayName}\n\nOpen in Maps: https://www.google.com/maps?q=${lat},${lon}`;
        
        await Share.share({
          message,
          title: 'Share Location',
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    };

    const handleAddressDirections = () => {
      const [lon, lat] = searchedAddress.coordinates;
      const url = Platform.select({
        ios: `maps://app?daddr=${lat},${lon}`,
        android: `google.navigation:q=${lat},${lon}`,
      });
      
      if (url) {
        Linking.openURL(url).catch(() => {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
        });
      }
    };

    const handleCopyAddress = () => {
      Alert.alert(
        'Address',
        searchedAddress.displayName,
        [{ text: 'OK', style: 'default' }]
      );
    };

    const handleSaveParking = () => {
      saveParkingLocation(searchedAddress.coordinates, searchedAddress.shortName);
    };

    const handleSaveLocation = () => {
      Alert.prompt(
        'Save Location',
        'Give this location a name (e.g., Home, Work, Gym)',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            onPress: (name) => {
              if (name && name.trim()) {
                saveLocation(name.trim(), searchedAddress.coordinates, searchedAddress.displayName);
              }
            },
          },
        ],
        'plain-text',
        '',
        'default'
      );
    };

    const getDistance = (): string => {
      if (!userLocation) return '';
      const [lon1, lat1] = userLocation;
      const [lon2, lat2] = searchedAddress.coordinates;
      
      const R = 3959;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      if (distance < 0.1) return 'Nearby';
      if (distance < 1) return `${(distance * 5280).toFixed(0)} ft away`;
      return `${distance.toFixed(1)} mi away`;
    };

    const nearbyPlaces = places.filter(place => {
      const [lon, lat] = searchedAddress.coordinates;
      const placeLat = place.latitude || place.lat || 0;
      const placeLon = place.longitude || place.lng || 0;
      const distance = Math.sqrt(Math.pow(placeLat - lat, 2) + Math.pow(placeLon - lon, 2));
      return distance < 0.01;
    }).slice(0, 3);

    return (
      <View style={styles.addressCardContainer}>
        <View style={styles.addressCardHeader}>
          <View style={styles.addressIconContainer}>
            <Ionicons name="location" size={28} color="#AF52DE" />
          </View>
          <View style={styles.addressTextContainer}>
            <Text style={[styles.addressCardTitle, { color: isDark ? theme.text : '#000' }]} numberOfLines={2}>
              {searchedAddress.shortName}
            </Text>
            {searchedAddress.city && (
              <Text style={[styles.addressCardSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
                {searchedAddress.city}{searchedAddress.state ? `, ${searchedAddress.state}` : ''}
              </Text>
            )}
            {userLocation && (
              <Text style={styles.addressDistance}>{getDistance()}</Text>
            )}
          </View>
        </View>

        <View style={styles.addressActionsRow}>
          <TouchableOpacity style={styles.addressActionButton} onPress={handleAddressDirections} accessibilityLabel="Get directions" accessibilityRole="button">
            <View style={[styles.addressActionIcon, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="navigate" size={20} color="#fff" />
            </View>
            <Text style={[styles.addressActionText, { color: isDark ? theme.textSecondary : '#666' }]}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressActionButton} onPress={handleShare} accessibilityLabel="Share location" accessibilityRole="button">
            <View style={[styles.addressActionIcon, { backgroundColor: '#34C759' }]}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </View>
            <Text style={[styles.addressActionText, { color: isDark ? theme.textSecondary : '#666' }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressActionButton} onPress={handleSaveParking} accessibilityLabel="Save parking location" accessibilityRole="button">
            <View style={[styles.addressActionIcon, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="car" size={20} color="#fff" />
            </View>
            <Text style={[styles.addressActionText, { color: isDark ? theme.textSecondary : '#666' }]}>Park Here</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressActionButton} onPress={handleCopyAddress} accessibilityLabel="Copy address" accessibilityRole="button">
            <View style={[styles.addressActionIcon, { backgroundColor: '#8E8E93' }]}>
              <Ionicons name="copy-outline" size={20} color="#fff" />
            </View>
            <Text style={[styles.addressActionText, { color: isDark ? theme.textSecondary : '#666' }]}>Copy</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.saveLocationButton, { backgroundColor: isDark ? theme.surface : '#F2F2F7' }]} onPress={handleSaveLocation} accessibilityLabel="Save to my places" accessibilityRole="button">
          <Ionicons name="bookmark-outline" size={20} color="#007AFF" />
          <Text style={styles.saveLocationText}>Save to My Places</Text>
        </TouchableOpacity>

        {nearbyPlaces.length > 0 && (
          <View style={styles.nearbySection}>
            <Text style={[styles.nearbySectionTitle, { color: isDark ? theme.text : '#000' }]}>Nearby on Tavvy</Text>
            {nearbyPlaces.map((place, nearbyIndex) => (
              <TouchableOpacity
                key={`nearby-${place.id}-${nearbyIndex}`}
                style={styles.nearbyPlaceItem}
                onPress={() => handlePlacePress(place)}
              >
                <View style={[styles.nearbyPlaceIcon, { backgroundColor: isDark ? theme.surface : '#F2F2F7' }]}>
                  <Ionicons
                    name={
                      place.category === 'Restaurants' ? 'restaurant' :
                      place.category === 'Cafes' ? 'cafe' :
                      place.category === 'Bars' ? 'beer' : 'storefront'
                    }
                    size={16}
                    color={isDark ? theme.textSecondary : '#666'}
                  />
                </View>
                <View style={styles.nearbyPlaceInfo}>
                  <Text style={[styles.nearbyPlaceName, { color: isDark ? theme.text : '#000' }]}>{place.name}</Text>
                  <Text style={[styles.nearbyPlaceCategory, { color: isDark ? theme.textSecondary : '#666' }]}>{place.category}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={[styles.fullAddressSection, { backgroundColor: isDark ? theme.surface : '#F9F9F9' }]}>
          <Text style={[styles.fullAddressLabel, { color: isDark ? theme.textSecondary : '#8E8E93' }]}>Full Address</Text>
          <Text style={[styles.fullAddressText, { color: isDark ? theme.text : '#333' }]}>{searchedAddress.displayName}</Text>
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER: PHOTO CAROUSEL
  // ============================================

  const PhotoCarousel = ({ photos, placeName, placeAddress, placeCategory }: { photos?: string[], placeName: string, placeAddress: string, placeCategory?: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    // Use category fallback image if no photos exist
    const fallbackImage = getCategoryFallbackImage(placeCategory || '');
    const displayPhotos = photos && photos.length > 0 ? photos : [fallbackImage];

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
              <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
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
  // RENDER: PLACE CARD (for bottom sheet)
  // ============================================

  const renderPlaceCard = ({ item: place }: { item: Place }) => {
    const fullAddress = place.city && place.state_region
      ? `${place.address_line1}, ${place.city}, ${place.state_region}`
      : place.address_line1;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: isDark ? theme.surface : '#fff' }]}
        onPress={() => handlePlacePress(place)}
        activeOpacity={0.95}
      >
        <PhotoCarousel
          photos={place.photos}
          placeName={place.name}
          placeAddress={fullAddress}
          placeCategory={place.category || place.primary_category}
        />
        
        {/* Signals - Always show with fallbacks for empty categories */}
        <View style={styles.signalsContainer}>
          <View style={styles.signalsRow}>
            {getDisplaySignals(place.signals).slice(0, 2).map((signal, index) => (
              <View key={`${place.id}-row1-sig-${index}`} style={styles.signalPillWrapper}>
                <View style={[styles.signalPill, { backgroundColor: getSignalColor(signal.bucket) }]}>
                  <Ionicons 
                    name={getSignalIcon(signal.bucket) as any} 
                    size={12} 
                    color={getSignalIconColor(signal.bucket)} 
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.signalText, signal.isEmpty && styles.signalTextEmpty]} numberOfLines={1}>
                    {signal.isEmpty ? getEmptySignalText(signal.bucket) : signal.bucket}
                  </Text>
                </View>
                {!signal.isEmpty && (
                  <Text style={styles.signalTapCount}>x{signal.tap_total}</Text>
                )}
              </View>
            ))}
          </View>
          {getDisplaySignals(place.signals).length > 2 && (
            <View style={styles.signalsRow}>
              {getDisplaySignals(place.signals).slice(2, 4).map((signal, index) => (
                <View key={`${place.id}-row2-sig-${index}`} style={styles.signalPillWrapper}>
                  <View style={[styles.signalPill, { backgroundColor: getSignalColor(signal.bucket) }]}>
                    <Ionicons 
                      name={getSignalIcon(signal.bucket) as any} 
                      size={12} 
                      color={getSignalIconColor(signal.bucket)} 
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.signalText, signal.isEmpty && styles.signalTextEmpty]} numberOfLines={1}>
                      {signal.isEmpty ? getEmptySignalText(signal.bucket) : signal.bucket}
                    </Text>
                  </View>
                  {!signal.isEmpty && (
                    <Text style={styles.signalTapCount}>x{signal.tap_total}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Quick Actions */}
        <View style={[styles.quickActions, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleCall(place.phone)} accessibilityLabel="Call business" accessibilityRole="button">
            <Ionicons name="call-outline" size={20} color={isDark ? theme.textSecondary : '#666'} />
            <Text style={[styles.actionText, { color: isDark ? theme.textSecondary : '#666' }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDirections(place)} accessibilityLabel="Get directions" accessibilityRole="button">
            <Ionicons name="navigate-outline" size={20} color={isDark ? theme.textSecondary : '#666'} />
            <Text style={[styles.actionText, { color: isDark ? theme.textSecondary : '#666' }]}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleSocial(place.instagram_url)} accessibilityLabel="View Instagram" accessibilityRole="button">
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={isDark ? theme.textSecondary : '#666'} />
            <Text style={[styles.actionText, { color: isDark ? theme.textSecondary : '#666' }]}>Social</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleWebsite(place.website)} accessibilityLabel="Visit website" accessibilityRole="button">
            <Ionicons name="globe-outline" size={20} color={isDark ? theme.textSecondary : '#666'} />
            <Text style={[styles.actionText, { color: isDark ? theme.textSecondary : '#666' }]}>Website</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================
  // RENDER: STANDARD MODE (New Layout Design)
  // ============================================

  // Standard card width for Trending Near You - matches HappeningNow and Explore Tavvy (70%)
  const trendingCardWidth = width * 0.7;
  const trendingCardHeight = 180;

  // Get user's first name for greeting
  const firstName = profile?.display_name?.split(' ')[0] || 'there';
  
  const renderStandardMode = () => (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? '#0F0F0F' : '#FAFAFA' }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ===== GREETING SECTION ===== */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingRow}>
            <View>
              <Text style={[styles.greetingText, { color: isDark ? '#888' : '#6B7280' }]}>
                {greeting}
              </Text>
              <Text style={[styles.userName, { color: isDark ? '#fff' : '#111827' }]}>
                {firstName} 👋
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#22D3EE', marginRight: 6 }} />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#22D3EE' }}>
                  Find your perfect spot in seconds. Not hours.
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.avatarButton, { backgroundColor: isDark ? '#2D2D2D' : '#667EEA' }]}
              onPress={() => navigation.navigate('Apps', { screen: 'ProfileMain' })}
            >
              <Text style={styles.avatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== SEARCH CARD ===== */}
        <View style={[
          styles.searchCard, 
          { 
            backgroundColor: isDark ? '#1E1E1E' : '#fff',
            borderWidth: isDark ? 1 : 0,
            borderColor: 'rgba(255,255,255,0.06)',
            shadowColor: isDark ? 'transparent' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0 : 0.06,
            shadowRadius: 12,
            elevation: isDark ? 0 : 4,
          }
        ]}>
          <View style={[
              styles.searchInputNew, 
              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' },
              isSearchFocused && { borderColor: '#667EEA', borderWidth: 2 }
            ]}>
            <Ionicons name="search" size={20} color={isDark ? '#888' : '#6B7280'} />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={handleSearchInputChange}
              placeholder="What are you in the mood for?"
              placeholderTextColor={isDark ? '#888' : '#9CA3AF'}
              style={[styles.searchInputTextInput, { color: isDark ? '#fff' : '#111827' }]}
              returnKeyType="search"
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onSubmitEditing={handleSearchSubmit}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={20} color={isDark ? '#888' : '#8E8E93'} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Search Suggestions Dropdown */}
          {isSearchFocused && searchSuggestions.length > 0 && (
            <View style={[styles.searchSuggestionsCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
              {searchSuggestions.slice(0, 5).map((suggestion, index) => (
                <TouchableOpacity
                  key={`${suggestion.type}-${index}`}
                  style={[styles.suggestionItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB' }]}
                  onPress={() => handleSuggestionSelect(suggestion)}
                >
                  <Ionicons 
                    name={suggestion.type === 'place' ? 'location' : suggestion.type === 'category' ? 'grid' : suggestion.type === 'address' ? 'map' : 'time'} 
                    size={18} 
                    color={isDark ? '#888' : '#6B7280'} 
                  />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.suggestionTitle, { color: isDark ? '#fff' : '#111' }]}>{suggestion.title}</Text>
                    {suggestion.subtitle && (
                      <Text style={[styles.suggestionSubtitle, { color: isDark ? '#888' : '#6B7280' }]}>{suggestion.subtitle}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {!isSearchFocused && (
          <View style={styles.quickActionsRow}>
            <TouchableOpacity 
              style={[
                styles.quickAction, 
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                }
              ]}
              onPress={switchToMapMode}
            >
              <Text style={styles.quickActionIcon}>📍</Text>
              <Text style={[styles.quickActionText, { color: isDark ? '#888' : '#6B7280' }]}>Near Me</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.quickAction, 
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                }
              ]}
              onPress={switchToMapMode}
            >
              <Text style={styles.quickActionIcon}>🗺️</Text>
              <Text style={[styles.quickActionText, { color: isDark ? '#888' : '#6B7280' }]}>Map</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.quickAction, 
                { 
                  backgroundColor: isDark 
                    ? 'rgba(17, 24, 39, 0.3)' 
                    : 'rgba(17, 24, 39, 0.1)',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(17, 24, 39, 0.2)',
                }
              ]}
              onPress={() => {
                // Surprise me - navigate to a random trending place
                if (trendingItems.length > 0) {
                  const randomItem = trendingItems[Math.floor(Math.random() * trendingItems.length)];
                  if (randomItem.type === 'place' || randomItem.place) {
                    navigation.navigate('PlaceDetails', { placeId: randomItem.id || randomItem.place?.id });
                  }
                }
              }}
            >
              <Text style={styles.quickActionIcon}>🎲</Text>
              <Text style={[styles.quickActionText, { color: isDark ? '#fff' : '#111827' }]}>Surprise</Text>
              <Text style={[styles.quickActionSubtext, { color: isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF' }]}>Let Tavvy decide</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.quickAction, 
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
                }
              ]}
              onPress={() => navigation.navigate('Apps', { screen: 'SavedMain' })}
            >
              <Text style={styles.quickActionIcon}>⭐</Text>
              <Text style={[styles.quickActionText, { color: isDark ? '#888' : '#6B7280' }]}>Saved</Text>
            </TouchableOpacity>
          </View>
          )}
        </View>

        {/* ===== MOOD CARDS ===== */}
        <View style={styles.moodSection}>
          <Text style={[styles.moodSectionLabel, { color: isDark ? '#555' : '#9CA3AF' }]}>
            What's your mood?
          </Text>
          <View style={styles.moodGrid}>
            {/* Hungry Card */}
            <TouchableOpacity 
              style={[styles.moodCard, styles.moodCardSmall]}
              onPress={() => {
                handleCategorySelect('Restaurants');
                switchToMapMode();
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#E85D5D', '#E07A47']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.moodPopular}>
                <Text style={styles.moodPopularText}>🔥 Popular</Text>
              </View>
              <Text style={styles.moodEmoji}>🍕</Text>
              <Text style={styles.moodTitle}>Hungry</Text>
              <Text style={styles.moodSubtitle}>Restaurants & Food</Text>
            </TouchableOpacity>
            
            {/* Thirsty Card */}
            <TouchableOpacity 
              style={[styles.moodCard, styles.moodCardSmall]}
              onPress={() => {
                handleCategorySelect('Bars');
                switchToMapMode();
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#5A6FD6', '#6A4292']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.moodPopular}>
                <Text style={styles.moodPopularText}>📈 Trending</Text>
              </View>
              <Text style={styles.moodEmoji}>🍸</Text>
              <Text style={styles.moodTitle}>Thirsty</Text>
              <Text style={styles.moodSubtitle}>Bars & Cafes</Text>
            </TouchableOpacity>
            
            {/* Explore Card */}
            <TouchableOpacity 
              style={[styles.moodCard, styles.moodCardLarge]}
              onPress={() => navigation.getParent()?.navigate('Apps')}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={isDark ? ['#0F2027', '#203A43', '#2C5364'] : ['#E0E7FF', '#C7D2FE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={[styles.moodPopular, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(67, 56, 202, 0.15)' }]}>
                <Text style={[styles.moodPopularText, { color: isDark ? 'rgba(255,255,255,0.9)' : '#4338CA' }]}>
                  ✨ {exploreItems.length || 89} experiences nearby
                </Text>
              </View>
              <Text style={styles.moodEmoji}>🌟</Text>
              <Text style={[styles.moodTitle, { color: isDark ? '#fff' : '#4338CA' }]}>Explore Something New</Text>
              <Text style={[styles.moodSubtitle, { color: isDark ? 'rgba(255,255,255,0.7)' : '#6366F1' }]}>
                Events, activities & hidden gems
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ===== LIVE NOW / HAPPENING NOW ===== */}
        <View style={styles.liveSection}>
          <View style={styles.liveHeader}>
            <View style={styles.liveTitleRow}>
              <View style={styles.liveDot} />
              <Text style={[styles.liveLabel, { color: isDark ? '#fff' : '#111827' }]}>Live Now</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Apps')}>
              <Text style={styles.liveSeeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {/* Use existing HappeningNow component */}
          <HappeningNow
            onPlacePress={(placeId) => navigation.navigate("PlaceDetails" as never, { placeId } as never)}
          />
        </View>

        {/* ===== STORIES ROW ===== */}
        <View style={{ marginBottom: 20 }}>
          <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#111', fontSize: 16, fontWeight: '700' }]}>
              Check how your favorite places look now
            </Text>
          </View>
          <StoriesRow
            currentUserId={user?.id}
            userLocation={userLocation}
            maxDistance={20}
          />
        </View>

        {/* ===== TOP PICKS NEARBY ===== */}
        <View style={styles.nearbySection}>
          <Text style={[styles.moodSectionLabel, { color: isDark ? '#555' : '#9CA3AF' }]}>
            Top Picks Nearby
          </Text>
          <View style={styles.nearbyList}>
            {isLoadingTrending ? (
              <ActivityIndicator size="small" color="#667EEA" />
            ) : trendingItems.slice(0, 3).map((item, index) => (
              <TouchableOpacity
                key={`nearby-${item.id}-${index}`}
                style={[
                  styles.nearbyItem,
                  { 
                    backgroundColor: isDark ? '#1A1A1A' : '#fff',
                    borderWidth: isDark ? 1 : 0,
                    borderColor: 'rgba(255,255,255,0.04)',
                    shadowColor: isDark ? 'transparent' : '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0 : 0.06,
                    shadowRadius: 8,
                    elevation: isDark ? 0 : 2,
                  }
                ]}
                onPress={() => {
                  if (item.type === 'place' || item.place) {
                    navigation.navigate('PlaceDetails', { placeId: item.id || item.place?.id });
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.nearbyRank, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }]}>
                  <Text style={[styles.nearbyRankText, { color: isDark ? '#888' : '#6B7280' }]}>{index + 1}</Text>
                </View>
                <View style={[
                  styles.nearbyImage, 
                  { 
                    backgroundColor: index === 0 ? '#FF6B6B' : index === 1 ? '#667EEA' : '#10B981',
                  }
                ]}>
                  {item.image && (
                    <Image source={{ uri: item.image }} style={[styles.nearbyImage, { position: 'absolute' }]} />
                  )}
                </View>
                <View style={styles.nearbyInfo}>
                  <Text style={[styles.nearbyName, { color: isDark ? '#fff' : '#111827' }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.nearbyCategory, { color: isDark ? '#666' : '#6B7280' }]}>
                    {item.category} • {item.subtitle || '0.4 mi'}
                  </Text>
                </View>
                <View style={[styles.nearbySignal, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <Text style={styles.nearbySignalIcon}>📶</Text>
                  <Text style={[styles.nearbySignalText, { color: '#10B981' }]}>Strong</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={[
            styles.searchWrap, 
            { 
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,18,51,0.14)', 
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fff' 
            },
            isSearchFocused && styles.searchWrapFocused
          ]}>
            <Ionicons name="search" size={18} color={isDark ? theme.textSecondary : '#8A8A8A'} style={{ marginRight: 10 }} />
            <TextInput
              ref={searchInputRef}
              value={searchQuery}
              onChangeText={handleSearchInputChange}
              placeholder="What are you in the mood for?"
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : '#A0A0A0'}
              style={[styles.searchInput, { color: isDark ? theme.text : '#111' }]}
              returnKeyType="search"
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onSubmitEditing={handleSearchSubmit}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color={isDark ? theme.textSecondary : '#8E8E93'} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Search Suggestions Dropdown */}
          {renderSearchSuggestions()}
        </View>

        {/* Only show rest of content when not focused on search */}
        {!isSearchFocused && (
          <>
            {/* Did You Know */}
            <View style={styles.didYouKnowSection}>
              <View style={[styles.didYouKnowCard, { backgroundColor: isDark ? theme.surface : '#FFF9E6' }]}>
                <View style={styles.didYouKnowIcon}>
                  <Ionicons name="bulb" size={24} color="#FFD60A" />
                </View>
                <View style={styles.didYouKnowContent}>
                  <Text style={[styles.didYouKnowTitle, { color: isDark ? theme.text : '#000' }]}>Did you know?</Text>
                  <Text style={[styles.didYouKnowText, { color: isDark ? theme.textSecondary : '#666' }]}>
                    Tavvy uses tap-based signals instead of star ratings to give you honest, structured insights about places.
                  </Text>
                </View>
              </View>
            </View>

            {/* ===== TOP CONTRIBUTORS SECTION ===== */}
            <View style={styles.sectionContainer}>
              <View style={styles.featureSectionHeader}>
                <Text style={[styles.featureSectionTitle, { color: isDark ? theme.text : '#000' }]}>🏆 Top Contributors</Text>
                {/* See All button removed - LeaderboardScreen not yet implemented */}
              </View>
              <Text style={[styles.sectionSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
                Community members making a difference
              </Text>
              <View style={[styles.leaderboardCard, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
                {[
                  { rank: 1, name: 'Sarah M.', taps: 1247, badge: '🥇', streak: 45 },
                  { rank: 2, name: 'Mike R.', taps: 1089, badge: '🥈', streak: 32 },
                  { rank: 3, name: 'Jenny W.', taps: 956, badge: '🥉', streak: 28 },
                  { rank: 4, name: 'Tom C.', taps: 823, badge: '⭐', streak: 21 },
                  { rank: 5, name: 'Lisa K.', taps: 712, badge: '⭐', streak: 18 },
                ].map((user, index) => (
                  <View key={user.rank} style={[styles.leaderboardRow, index < 4 && styles.leaderboardRowBorder]}>
                    <View style={styles.leaderboardLeft}>
                      <Text style={styles.leaderboardBadge}>{user.badge}</Text>
                      <View style={styles.leaderboardAvatar}>
                        <Text style={styles.leaderboardAvatarText}>{user.name.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={[styles.leaderboardName, { color: isDark ? theme.text : '#000' }]}>{user.name}</Text>
                        <Text style={[styles.leaderboardStreak, { color: isDark ? theme.textSecondary : '#888' }]}>🔥 {user.streak} day streak</Text>
                      </View>
                    </View>
                    <View style={styles.leaderboardRight}>
                      <Text style={[styles.leaderboardTaps, { color: isDark ? theme.text : '#000' }]}>{user.taps.toLocaleString()}</Text>
                      <Text style={[styles.leaderboardTapsLabel, { color: isDark ? theme.textSecondary : '#888' }]}>taps</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ===== HOW TAVVY WORKS SECTION (COLLAPSIBLE) ===== */}
            {/* Per v1 spec: Keep collapsed by default. Home = action, not explanation */}
            <View style={styles.howItWorksSection}>
              <TouchableOpacity 
                style={styles.howItWorksHeader}
                onPress={() => setHowItWorksExpanded(!howItWorksExpanded)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={[styles.howItWorksTitle, { color: isDark ? theme.text : '#000' }]}>
                    ✨ How Tavvy Works
                  </Text>
                  <Text style={[styles.howItWorksSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
                    A smarter way to discover and review places
                  </Text>
                </View>
                <Ionicons 
                  name={howItWorksExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={24} 
                  color={isDark ? theme.textSecondary : '#666'} 
                />
              </TouchableOpacity>
              
              {howItWorksExpanded && (
                <>
                  <View style={[styles.howItWorksCard, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
                    {[
                      { icon: '👆', title: 'Tap, Don\'t Type', desc: 'Quick 1-3 tap signals instead of writing long reviews. Share your experience in seconds.' },
                      { icon: '🎯', title: 'Honest Insights', desc: 'See what places are actually good for with The Good, The Vibe, and Heads Up signals.' },
                      { icon: '👥', title: 'Community Powered', desc: 'Real signals from real people, not algorithms. Authentic experiences you can trust.' },
                      { icon: '⚡', title: 'Compare Instantly', desc: 'Compare places at a glance without reading paragraphs. Make decisions faster.' },
                      { icon: '🔄', title: 'Second Chances', desc: 'Bad reviews refresh if not recurring. Everyone deserves a chance to improve.' },
                    ].map((item, index) => (
                      <View key={index} style={[styles.howItWorksRow, index < 4 && styles.howItWorksRowBorder]}>
                        <Text style={styles.howItWorksIcon}>{item.icon}</Text>
                        <View style={styles.howItWorksContent}>
                          <Text style={[styles.howItWorksItemTitle, { color: isDark ? theme.text : '#000' }]}>{item.title}</Text>
                          <Text style={[styles.howItWorksItemDesc, { color: isDark ? theme.textSecondary : '#666' }]}>{item.desc}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.learnMoreButton}
                    onPress={() => Linking.openURL('https://tavvy.com/about-us')}
                  >
                    <Text style={styles.learnMoreText}>Learn More About Tavvy</Text>
                    <Ionicons name="arrow-forward" size={16} color="#0A84FF" />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Bottom padding */}
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  // ============================================
  // RENDER: MAP MODE (Search Results)
  // ============================================

  const renderMapMode = () => (
    <View style={styles.mapModeContainer}>
      {/* Full Map */}
      {/* @ts-ignore - MapLibreGL types are incomplete */}
      <MapLibreGL.MapView
        key={mapStyle}
        style={styles.fullMap}
        // @ts-ignore
        styleURL={MAP_STYLES[mapStyle].type === 'vector' ? (MAP_STYLES[mapStyle] as any).url : undefined}
        logoEnabled={false}
        attributionEnabled={false}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={true}
        pitchEnabled={true}
        onRegionDidChange={handleMapRegionChange}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: targetLocation || userLocation || [-97.7431, 30.2672],
            zoomLevel: targetLocation ? 16 : 14,
          }}
          animationMode="flyTo"
          animationDuration={800}
          minZoomLevel={3}
          maxZoomLevel={20}
        />
        
        {/* Target location marker (for address searches) */}
        {targetLocation && (
          <MapLibreGL.PointAnnotation
            id="target-location"
            coordinate={targetLocation}
          >
            <View style={styles.targetLocationMarker}>
              <Ionicons name="location" size={32} color="#AF52DE" />
            </View>
          </MapLibreGL.PointAnnotation>
        )}

        {/* Parking Location Marker */}
        {parkingLocation && (
          <MapLibreGL.PointAnnotation
            id="parking-location"
            coordinate={parkingLocation.coordinates}
            onSelected={() => {
              Alert.alert(
                'Your Parked Car',
                `Parked ${getParkingDuration()}\n${parkingLocation.address || 'Current Location'}`,
                [
                  { text: 'Navigate', onPress: navigateToParking },
                  { text: 'Clear', onPress: clearParkingLocation, style: 'destructive' },
                  { text: 'OK', style: 'cancel' },
                ]
              );
            }}
          >
            <View style={styles.parkingMarker}>
              <View style={styles.parkingMarkerInner}>
                <Ionicons name="car" size={20} color="#fff" />
              </View>
              <Text style={styles.parkingMarkerTime}>{getParkingDuration()}</Text>
            </View>
          </MapLibreGL.PointAnnotation>
        )}

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

        {userLocation && (
          <MapLibreGL.PointAnnotation
            id="user-location"
            coordinate={userLocation}
          >
            <View style={styles.userLocationMarker}>
              <Animated.View 
                style={[
                  styles.userLocationPulse,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.5],
                      outputRange: [0.6, 0],
                    }),
                  },
                ]} 
              />
              <View style={styles.userLocationDot} />
            </View>
          </MapLibreGL.PointAnnotation>
        )}

        {/* Show category-filtered pins when category is selected, otherwise show all places */}
        {(showCategoryResults ? categoryResultsPlaces : filteredPlaces)
          .filter((place) => {
            const lon = place.longitude || place.lng;
            const lat = place.latitude || place.lat;
            return typeof lon === 'number' && typeof lat === 'number' && 
                   !isNaN(lon) && !isNaN(lat) && 
                   lon !== 0 && lat !== 0;
          })
          .map((place, mapIndex) => (
          <MapLibreGL.PointAnnotation
            key={`map-${place.id}-${mapIndex}`}
            id={`${place.id}-${mapIndex}`}
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
                  name={getMarkerIcon(place.category) as any}
                  size={18}
                  color="#fff"
                />
              </View>
            </View>
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>

      {/* Search Overlay - Transparent, just search bar and chips */}
      <View style={styles.mapSearchOverlay}>
        {/* Search Row - Back button + Search Bar */}
        <View style={styles.mapSearchRow}>
          {/* Back button */}
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: isDark ? theme.surface : '#fff' }]}
            onPress={switchToStandardMode} accessibilityLabel="Back to list view" accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? theme.text : '#000'} />
          </TouchableOpacity>
          
          {/* Search Bar */}
          <View style={[styles.mapSearchBar, targetLocation && styles.mapSearchBarWithAddress, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
          {targetLocation ? (
            <Ionicons name="location" size={20} color="#AF52DE" />
          ) : (
            <Ionicons name="search" size={20} color="#999" />
          )}
          <TextInput
            style={[styles.mapSearchInput, { color: isDark ? theme.text : '#000' }]}
            placeholder="Search places or locations"
            placeholderTextColor={isDark ? theme.textSecondary : '#999'}
            value={searchQuery}
            onChangeText={(text) => {
              handleSearchInputChange(text);
              if (targetLocation && text !== searchedAddressName) {
                setTargetLocation(null);
                setSearchedAddressName('');
              }
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setTargetLocation(null);
              setSearchedAddressName('');
            }}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          </View>
        </View>
        
        {/* Category Chips Row - Always visible */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mapCategoryChipsRow}
          contentContainerStyle={styles.mapCategoryChipsContent}
        >
          {categories.filter(c => c !== 'Filter').map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.mapCategoryChip,
                selectedCategory === category && {
                  backgroundColor: '#22D3EE',
                  borderWidth: 0,
                },
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text style={[
                styles.mapCategoryChipText,
                { color: selectedCategory === category ? '#000' : '#fff' },
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Full-Screen Search Suggestions Overlay - Google Maps Style */}
      {searchQuery.trim().length > 0 && (searchSuggestions.length > 0 || isSearchingAddress) && (
        <View style={[styles.fullScreenSearchOverlay, { backgroundColor: isDark ? theme.background : '#fff' }]}>
          {/* Search Header */}
          <SafeAreaView style={styles.fullScreenSearchHeader}>
            <TouchableOpacity 
              style={styles.fullScreenBackButton}
              onPress={() => {
                setSearchQuery('');
                setSearchSuggestions([]);
              }}
            >
              <Ionicons name="chevron-back" size={28} color={isDark ? theme.text : '#000'} />
            </TouchableOpacity>
            <View style={[styles.fullScreenSearchInputContainer, { backgroundColor: isDark ? theme.surface : '#f5f5f5' }]}>
              <TextInput
                style={[styles.fullScreenSearchInput, { color: isDark ? theme.text : '#000' }]}
                value={searchQuery}
                onChangeText={handleSearchInputChange}
                placeholder="Search places or locations"
                placeholderTextColor={isDark ? theme.textSecondary : '#999'}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
          
          {/* Suggestions List */}
          <ScrollView style={styles.fullScreenSuggestionsList} keyboardShouldPersistTaps="handled">
            {searchSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.fullScreenSuggestionItem}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <View style={[
                  styles.fullScreenSuggestionIcon,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }
                ]}>
                  <Ionicons
                    name={suggestion.type === 'address' ? 'location-outline' : (suggestion.icon as any)}
                    size={20}
                    color={isDark ? theme.textSecondary : '#666'}
                  />
                </View>
                <View style={styles.fullScreenSuggestionText}>
                  <Text style={[styles.fullScreenSuggestionTitle, { color: isDark ? theme.text : '#000' }]} numberOfLines={1}>
                    {suggestion.title}
                  </Text>
                  {suggestion.subtitle && (
                    <Text style={[styles.fullScreenSuggestionSubtitle, { color: isDark ? theme.textSecondary : '#666' }]} numberOfLines={1}>
                      {suggestion.subtitle}
                    </Text>
                  )}
                </View>
                <Ionicons name="arrow-forward" size={20} color="#999" style={{ transform: [{ rotate: '-45deg' }] }} />
              </TouchableOpacity>
            ))}
            
            {isSearchingAddress && (
              <View style={styles.fullScreenSuggestionItem}>
                <View style={[
                  styles.fullScreenSuggestionIcon,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }
                ]}>
                  <ActivityIndicator size="small" color="#666" />
                </View>
                <View style={styles.fullScreenSuggestionText}>
                  <Text style={[styles.fullScreenSuggestionTitle, { color: isDark ? theme.text : '#000' }]}>Searching addresses...</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      )}
      
      {/* Category Filters moved to bottom sheet for cleaner map view */}

      {/* Search this Area Button - only show when bottom sheet is collapsed (full-screen map view) */}
      {showSearchThisArea && viewMode === 'map' && bottomSheetIndex === 0 && (
        <TouchableOpacity
          style={[
            styles.searchThisAreaButton,
            { backgroundColor: isDark ? theme.primary : '#007AFF' },
          ]}
          onPress={handleSearchThisArea} accessibilityLabel="Search this area" accessibilityRole="button"
          disabled={isSearchingArea}
        >
          {isSearchingArea ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.searchThisAreaText}>Search this area</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Floating Icons - Left Side (Legend) */}
      <View style={styles.floatingIconsLeft}>
        <TouchableOpacity
          style={[styles.floatingIcon, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={() => setShowLegendPopup(true)} accessibilityLabel="Show map legend" accessibilityRole="button"
        >
          <Ionicons name="information-circle-outline" size={24} color={isDark ? theme.text : '#374151'} />
        </TouchableOpacity>
      </View>

      {/* Floating Icons - Right Side (Weather, Layers, Location) */}
      <View style={styles.floatingIconsRight}>
        <TouchableOpacity
          style={[styles.floatingIcon, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={() => setShowWeatherPopup(true)} accessibilityLabel="Show weather" accessibilityRole="button"
        >
          <Ionicons name="partly-sunny-outline" size={24} color={isDark ? theme.text : '#374151'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingIcon, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={() => setShowMapLayerPopup(true)} accessibilityLabel="Change map layer" accessibilityRole="button"
        >
          <Ionicons name="layers-outline" size={24} color={isDark ? theme.text : '#374151'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.floatingIcon, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={centerOnUserLocation} accessibilityLabel="Center on my location" accessibilityRole="button"
        >
          <Ionicons name="locate-outline" size={24} color={isDark ? theme.text : '#374151'} />
        </TouchableOpacity>
      </View>

      {/* Legend Popup */}
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
            
            {[
              { color: '#EF4444', name: 'Restaurants' },
              { color: '#F59E0B', name: 'Cafes' },
              { color: '#8B5CF6', name: 'Bars' },
              { color: '#3B82F6', name: 'Shopping' },
              { color: '#22C55E', name: 'RV & Camping' },
              { color: '#EC4899', name: 'Hotels' },
            ].map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                <Text style={[styles.legendText, { color: isDark ? theme.text : '#374151' }]}>{item.name}</Text>
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

      {/* Weather Popup */}
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

      {/* Map Layer Popup */}
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
                  onPress={() => {
                    setMapStyle(key as keyof typeof MAP_STYLES);
                    setShowMapLayerPopup(false);
                  }}
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

      {/* Bottom Sheet with Place Cards or Address Card - hide when category results showing */}
      {!showCategoryResults && (
        <BottomSheet
          ref={bottomSheetRef}
          index={1}
          snapPoints={searchedAddress ? [40, '40%', '85%'] : (selectedPlace ? [40, '45%', '85%'] : [40, '35%', '85%'])}
          topInset={BOTTOM_SHEET_TOP_INSET}
          backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: isDark ? theme.background : '#fff' }]}
          handleIndicatorStyle={[styles.bottomSheetHandle, { backgroundColor: isDark ? theme.textSecondary : '#DEDEDE' }]}
          enablePanDownToClose={false}
          enableContentPanningGesture={true}
          animateOnMount={true}
          onChange={(index) => setBottomSheetIndex(index)}
        >
          {/* Category chips are now only shown under the search bar - removed duplicate from bottom sheet */}
          
          {searchedAddress ? (
            <ScrollView 
              style={styles.addressCardScrollView}
              showsVerticalScrollIndicator={false}
            >
              {renderAddressInfoCard()}
            </ScrollView>
          ) : selectedPlace ? (
            /* Show selected place card when pin is clicked */
            <BottomSheetScrollView contentContainerStyle={styles.bottomSheetContent}>
              <View style={styles.selectedPlaceHeader}>
                <Text style={[styles.selectedPlaceTitle, { color: isDark ? theme.text : '#000' }]}>Selected Place</Text>
                <TouchableOpacity onPress={() => setSelectedPlace(null)} style={styles.clearSelectionBtn}>
                  <Ionicons name="close-circle" size={24} color={isDark ? theme.textSecondary : '#999'} />
                </TouchableOpacity>
              </View>
              {renderPlaceCard({ item: selectedPlace })}
            </BottomSheetScrollView>
          ) : (
            <BottomSheetFlatList
              data={filteredPlaces}
              keyExtractor={(item) => item.id}
              renderItem={renderPlaceCard}
              contentContainerStyle={styles.bottomSheetContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <Text style={[styles.bottomSheetResultsCount, { color: isDark ? theme.textSecondary : '#666' }]}>
                  {filteredPlaces.length} places nearby
                </Text>
              }
            />
          )}
        </BottomSheet>
      )}

      {/* Category Results Bottom Sheet - overlay on map */}
      {showCategoryResults && (
        <BottomSheet
          ref={categoryBottomSheetRef}
          index={1}
          snapPoints={['15%', '45%', '90%']}
          topInset={BOTTOM_SHEET_TOP_INSET}
          backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: isDark ? theme.background : '#fff' }]}
          handleIndicatorStyle={[styles.bottomSheetHandle, { backgroundColor: isDark ? theme.textSecondary : '#DEDEDE' }]}
          enablePanDownToClose={false}
          onChange={(index) => setBottomSheetIndex(index)}
        >
          {/* Category Header - Google Maps Style */}
          <View style={[styles.categorySheetHeader, { backgroundColor: isDark ? theme.background : '#fff' }]}>
            {/* Title Row with Close Button */}
            <View style={styles.categoryResultsTitleRow}>
              <Text style={[styles.categoryResultsTitle, { color: isDark ? theme.text : '#000' }]}>{selectedCategory}</Text>
              <TouchableOpacity 
                onPress={closeCategoryResults} 
                style={[styles.categoryResultsCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }]}
              >
                <Ionicons name="close" size={20} color={isDark ? theme.text : '#000'} />
              </TouchableOpacity>
            </View>
            
            {/* Filter Pills Row - Google Maps Style */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.filterPillsRow}
            >
              {/* Filter Icon Button */}
              <TouchableOpacity 
                style={[styles.filterPillIcon, { backgroundColor: 'rgba(55, 65, 81, 0.85)', borderColor: 'transparent' }]}
                onPress={() => setShowFilterModal(true)}
              >
                <Ionicons name="options-outline" size={18} color="#fff" />
              </TouchableOpacity>
              
              {/* Sort By Dropdown */}
              <TouchableOpacity 
                style={[
                  styles.filterPill, 
                  { borderColor: 'transparent' },
                  activeFilters.sortBy !== 'Distance' && styles.filterPillActive
                ]}
                onPress={() => setShowFilterModal(true)}
              >
                <Text style={[
                  styles.filterPillText, 
                  activeFilters.sortBy !== 'Distance' && styles.filterPillTextActive
                ]}>
                  Sort by
                </Text>
                <Ionicons 
                  name="chevron-down" 
                  size={14} 
                  color={activeFilters.sortBy !== 'Distance' ? '#000' : '#fff'} 
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
              
              {/* Open Now Toggle */}
              <TouchableOpacity 
                style={[
                  styles.filterPill, 
                  { borderColor: 'transparent' },
                  activeFilters.hours === 'Open now' && styles.filterPillActive
                ]}
                onPress={() => setActiveFilters(prev => ({ ...prev, hours: prev.hours === 'Open now' ? 'Any' : 'Open now' }))}
              >
                <Text style={[
                  styles.filterPillText, 
                  activeFilters.hours === 'Open now' && styles.filterPillTextActive
                ]}>
                  Open now
                </Text>
              </TouchableOpacity>
              
              {/* Cuisine/Type Dropdown (for Restaurants/Cafes/Bars) */}
              {['Restaurants', 'Cafes', 'Bars', 'Fast Food'].includes(selectedCategory) && (
                <TouchableOpacity 
                  style={[
                    styles.filterPill, 
                    { borderColor: 'transparent' },
                    activeFilters.type !== 'Any' && styles.filterPillActive
                  ]}
                  onPress={() => setShowFilterModal(true)}
                >
                  <Text style={[
                    styles.filterPillText, 
                    activeFilters.type !== 'Any' && styles.filterPillTextActive
                  ]}>
                    {selectedCategory === 'Restaurants' ? 'Cuisine' : 'Type'}
                  </Text>
                  <Ionicons 
                    name="chevron-down" 
                    size={14} 
                    color={activeFilters.type !== 'Any' ? '#000' : '#fff'} 
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              )}
              
              {/* Price Dropdown */}
              <TouchableOpacity 
                style={[
                  styles.filterPill, 
                  { borderColor: 'transparent' },
                  activeFilters.price !== 'Any' && styles.filterPillActive
                ]}
                onPress={() => setShowFilterModal(true)}
              >
                <Text style={[
                  styles.filterPillText, 
                  activeFilters.price !== 'Any' && styles.filterPillTextActive
                ]}>
                  Price
                </Text>
                <Ionicons 
                  name="chevron-down" 
                  size={14} 
                  color={activeFilters.price !== 'Any' ? '#000' : '#fff'} 
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
              
              {/* Distance Dropdown */}
              <TouchableOpacity 
                style={[
                  styles.filterPill, 
                  { borderColor: 'transparent' },
                  activeFilters.distance !== 'Any' && styles.filterPillActive
                ]}
                onPress={() => setShowFilterModal(true)}
              >
                <Text style={[
                  styles.filterPillText, 
                  activeFilters.distance !== 'Any' && styles.filterPillTextActive
                ]}>
                  Distance
                </Text>
                <Ionicons 
                  name="chevron-down" 
                  size={14} 
                  color={activeFilters.distance !== 'Any' ? '#000' : '#fff'} 
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Results List */}
          {isLoadingCategoryResults ? (
            <View style={styles.categoryResultsLoading}>
              <ActivityIndicator size="large" color="#0A84FF" />
              <Text style={[styles.loadingText, { color: isDark ? theme.textSecondary : '#666' }]}>Finding {selectedCategory.toLowerCase()}...</Text>
            </View>
          ) : (
            <BottomSheetScrollView contentContainerStyle={styles.categoryResultsList}>
              {categoryResultsPlaces.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={48} color={isDark ? theme.textSecondary : '#999'} />
                  <Text style={[styles.noResultsText, { color: isDark ? theme.textSecondary : '#666' }]}>No {selectedCategory.toLowerCase()} found nearby</Text>
                  <Text style={[styles.noResultsSubtext, { color: isDark ? theme.textSecondary : '#999' }]}>Try adjusting your filters or search in a different area</Text>
                </View>
              ) : (
                categoryResultsPlaces.map((place, catIndex) => (
                  <TouchableOpacity
                    key={`category-${place.id}-${catIndex}`}
                    style={[styles.categoryResultCard, { backgroundColor: isDark ? theme.surface : '#fff' }]}
                    onPress={() => handlePlacePress(place)}
                    activeOpacity={0.9}
                  >
                    {/* Photo */}
                    <View style={styles.categoryResultPhotoContainer}>
                      <Image
                        source={{ uri: place.photo || getCategoryFallbackImage(place.category) }}
                        style={styles.categoryResultPhoto}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={styles.categoryResultPhotoGradient}
                      />
                      <View style={styles.categoryResultPhotoOverlay}>
                        <Text style={styles.categoryResultPhotoName} numberOfLines={1}>{place.name}</Text>
                        <Text style={styles.categoryResultPhotoMeta} numberOfLines={1}>
                          {place.category} • {place.city || place.address_line1 || 'Nearby'}
                        </Text>
                      </View>
                    </View>
                    
                    {/* 2x2 Signal Grid */}
                    <View style={styles.categoryResultSignalGrid}>
                      {getDisplaySignals(place.signals).map((signal, idx) => (
                        <View 
                          key={`cat-${catIndex}-${place.id}-sig-${idx}`} 
                          style={[styles.categoryResultSignalBadge2x2, { backgroundColor: getSignalColor(signal.bucket) }]}
                        >
                          <Ionicons 
                            name={getSignalIcon(signal.bucket) as any} 
                            size={14} 
                            color="#FFFFFF" 
                            style={{ marginRight: 4 }} 
                          />
                          <Text style={styles.categoryResultSignalText2x2} numberOfLines={1}>
                            {signal.isEmpty ? getEmptySignalText(signal.bucket) : signal.bucket}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </BottomSheetScrollView>
          )}
        </BottomSheet>
      )}

      {/* Filter Modal for Category Results - Quick Filters */}
      <Modal
        visible={showFilterModal && showCategoryResults}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={[styles.filterModalContainer, { backgroundColor: isDark ? theme.background : '#fff' }]}>
          <View style={[styles.filterModalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee' }]}>
            <Text style={[styles.filterModalTitle, { color: isDark ? theme.text : '#000' }]}>
              {selectedCategory} Filters
            </Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.filterModalClose}>
              <View style={[styles.filterModalCloseCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }]}>
                <Ionicons name="close" size={20} color={isDark ? theme.text : '#000'} />
              </View>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.filterModalContent}>
            {/* Hours - Quick access to Open Now */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Hours</Text>
              <View style={styles.filterOptionsRow}>
                {['Any', 'Open Now', 'Open 24h'].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={[
                      styles.filterOption,
                      activeFilters.hours === hours && styles.filterOptionActive,
                      { backgroundColor: activeFilters.hours === hours ? '#0F8A8A' : (isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5') },
                    ]}
                    onPress={() => setActiveFilters(prev => ({ ...prev, hours }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: activeFilters.hours === hours ? '#fff' : (isDark ? theme.text : '#000') },
                    ]}>{hours}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Sort By</Text>
              <View style={styles.filterOptionsRow}>
                {['Distance', 'Most Taps', 'Trending'].map((sort) => (
                  <TouchableOpacity
                    key={sort}
                    style={[
                      styles.filterOption,
                      activeFilters.sortBy === sort && styles.filterOptionActive,
                      { backgroundColor: activeFilters.sortBy === sort ? '#0F8A8A' : (isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5') },
                    ]}
                    onPress={() => setActiveFilters(prev => ({ ...prev, sortBy: sort }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: activeFilters.sortBy === sort ? '#fff' : (isDark ? theme.text : '#000') },
                    ]}>{sort}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Price Range - for relevant categories */}
            {(selectedCategory === 'Restaurants' || selectedCategory === 'Cafes' || selectedCategory === 'Bars' || selectedCategory === 'Shopping' || selectedCategory === 'Hotels') && (
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Price Range</Text>
                <View style={styles.filterOptionsRow}>
                  {['$', '$$', '$$$', '$$$$', 'Any'].map((price) => (
                    <TouchableOpacity
                      key={price}
                      style={[
                        styles.filterOption,
                        activeFilters.price === price && styles.filterOptionActive,
                        { backgroundColor: activeFilters.price === price ? '#0F8A8A' : (isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5') },
                      ]}
                      onPress={() => setActiveFilters(prev => ({ ...prev, price }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        { color: activeFilters.price === price ? '#fff' : (isDark ? theme.text : '#000') },
                      ]}>{price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
          <View style={[styles.filterModalButtons, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee', backgroundColor: isDark ? theme.background : '#fff' }]}>
            <TouchableOpacity style={[styles.filterClearBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e8f4f8' }]} onPress={clearFilters}>
              <Text style={[styles.filterClearBtnText, { color: '#0A84FF' }]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterApplyBtn} onPress={applyFilters}>
              <Text style={styles.filterApplyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Advanced Filter Modal - Category-Aware Tap System Filters */}
      <Modal
        visible={showAdvancedFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdvancedFilterModal(false)}
      >
        <SafeAreaView style={[styles.filterModalContainer, { backgroundColor: isDark ? theme.background : '#fff' }]}>
          <View style={[styles.filterModalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee' }]}>
            <Text style={[styles.filterModalTitle, { color: isDark ? theme.text : '#000' }]}>
              {selectedCategory !== 'All' && selectedCategory !== 'Filter' ? `${selectedCategory} Filters` : 'Filters'}
            </Text>
            <TouchableOpacity onPress={() => setShowAdvancedFilterModal(false)} style={styles.filterModalClose}>
              <View style={[styles.filterModalCloseCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }]}>
                <Ionicons name="close" size={20} color={isDark ? theme.text : '#000'} />
              </View>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.filterModalContent}>
            {/* Sort By - Universal */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Sort By</Text>
              <View style={styles.filterOptionsRow}>
                {['Distance', 'Most Taps', 'Trending', 'Newest'].map((sort) => (
                  <TouchableOpacity
                    key={sort}
                    style={[
                      styles.filterOption,
                      activeFilters.sortBy === sort && styles.filterOptionActive,
                      { backgroundColor: activeFilters.sortBy === sort ? '#0F8A8A' : (isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5') },
                    ]}
                    onPress={() => setActiveFilters(prev => ({ ...prev, sortBy: sort }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: activeFilters.sortBy === sort ? '#fff' : (isDark ? theme.text : '#000') },
                    ]}>{sort}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Hours - Universal with Open Now priority */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Hours</Text>
              <View style={styles.filterOptionsRow}>
                {['Any', 'Open Now', 'Open 24h'].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={[
                      styles.filterOption,
                      activeFilters.hours === hours && styles.filterOptionActive,
                      { backgroundColor: activeFilters.hours === hours ? '#0F8A8A' : (isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5') },
                    ]}
                    onPress={() => setActiveFilters(prev => ({ ...prev, hours }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: activeFilters.hours === hours ? '#fff' : (isDark ? theme.text : '#000') },
                    ]}>{hours}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Distance - Universal */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Distance</Text>
              <View style={styles.filterOptionsRow}>
                {['1 mi', '5 mi', '10 mi', '25 mi', 'Any'].map((dist) => (
                  <TouchableOpacity
                    key={dist}
                    style={[
                      styles.filterOption,
                      activeFilters.distance === dist && styles.filterOptionActive,
                      { backgroundColor: activeFilters.distance === dist ? '#0F8A8A' : (isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5') },
                    ]}
                    onPress={() => setActiveFilters(prev => ({ ...prev, distance: dist }))}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: activeFilters.distance === dist ? '#fff' : (isDark ? theme.text : '#000') },
                    ]}>{dist}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tap Quality - Replaces Rating (Tavvy's Tap System) */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Tap Quality</Text>
              <Text style={[styles.filterSectionSubtitle, { color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }]}>
                Based on Tavvy's community taps
              </Text>
              <View style={[styles.filterOptionsRow, { flexWrap: 'wrap' }]}>
                {['Any', 'Mostly Positive', 'Highly Rated', 'Trending', 'No Heads Up'].map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.filterChip,
                      activeFilters.tapQuality === quality && styles.filterChipActive,
                      { 
                        backgroundColor: activeFilters.tapQuality === quality ? '#0F8A8A' : (isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5'),
                        marginBottom: 8,
                        marginRight: 8,
                      },
                    ]}
                    onPress={() => setActiveFilters(prev => ({ ...prev, tapQuality: quality }))}
                  >
                    <Text style={[
                      styles.filterChipText,
                      { color: activeFilters.tapQuality === quality ? '#fff' : (isDark ? theme.text : '#000') },
                    ]}>{quality}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range - Show for relevant categories */}
            {(selectedCategory === 'All' || selectedCategory === 'Restaurants' || selectedCategory === 'Cafes' || selectedCategory === 'Bars' || selectedCategory === 'Shopping' || selectedCategory === 'Hotels') && (
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Price Range</Text>
                <View style={styles.filterOptionsRow}>
                  {['$', '$$', '$$$', '$$$$', 'Any'].map((price) => (
                    <TouchableOpacity
                      key={price}
                      style={[
                        styles.filterOption,
                        activeFilters.price === price && styles.filterOptionActive,
                        { backgroundColor: activeFilters.price === price ? '#0F8A8A' : (isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5') },
                      ]}
                      onPress={() => setActiveFilters(prev => ({ ...prev, price }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        { color: activeFilters.price === price ? '#fff' : (isDark ? theme.text : '#000') },
                      ]}>{price}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Category-Specific Type Filter (Cuisine, Fuel Type, etc.) */}
            {(() => {
              const categoryConfig = CATEGORY_FILTERS[selectedCategory] || CATEGORY_FILTERS.default;
              if (categoryConfig.types && categoryConfig.typeLabel) {
                return (
                  <View style={styles.filterSection}>
                    <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>
                      {categoryConfig.typeLabel}
                    </Text>
                    <View style={styles.cuisineGrid}>
                      {categoryConfig.types.map((type, index) => (
                        <TouchableOpacity
                          key={type.name}
                          style={[
                            styles.cuisineOption,
                            activeFilters.type === type.name && styles.cuisineOptionActive,
                            { 
                              backgroundColor: activeFilters.type === type.name ? '#0F8A8A' : (isDark ? 'rgba(255,255,255,0.05)' : '#fff'),
                              borderRightWidth: (index + 1) % 4 === 0 ? 0 : 1,
                            },
                          ]}
                          onPress={() => setActiveFilters(prev => ({ ...prev, type: type.name }))}
                        >
                          {type.icon ? (
                            <Ionicons 
                              name={type.icon as any} 
                              size={20} 
                              color={activeFilters.type === type.name ? '#fff' : (isDark ? theme.text : '#333')} 
                            />
                          ) : null}
                          <Text style={[
                            styles.cuisineOptionText,
                            { color: activeFilters.type === type.name ? '#fff' : (isDark ? theme.text : '#333') },
                          ]}>{type.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              }
              return null;
            })()}

            {/* Category-Specific Amenities */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>
                {selectedCategory === 'Gas' ? 'Amenities & Services' : 
                 selectedCategory === 'RV & Camping' ? 'Amenities & Hookups' : 
                 selectedCategory === 'Hotels' ? 'Hotel Amenities' : 'Amenities'}
              </Text>
              <View style={styles.moreFiltersWrap}>
                {(CATEGORY_FILTERS[selectedCategory]?.amenities || CATEGORY_FILTERS.default.amenities).map((amenity) => (
                  <TouchableOpacity
                    key={amenity}
                    style={[
                      styles.moreFilterChip,
                      activeFilters.amenities.includes(amenity) && styles.moreFilterChipActive,
                      { backgroundColor: activeFilters.amenities.includes(amenity) ? '#0F8A8A' : (isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5') },
                    ]}
                    onPress={() => {
                      setActiveFilters(prev => ({
                        ...prev,
                        amenities: prev.amenities.includes(amenity)
                          ? prev.amenities.filter(a => a !== amenity)
                          : [...prev.amenities, amenity]
                      }));
                    }}
                  >
                    <Text style={[
                      styles.moreFilterChipText,
                      { color: activeFilters.amenities.includes(amenity) ? '#fff' : (isDark ? theme.text : '#000') },
                    ]}>{amenity}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          {/* Filter Count Badge */}
          {(() => {
            const filterCount = 
              (activeFilters.sortBy !== 'Distance' ? 1 : 0) +
              (activeFilters.hours !== 'Any' ? 1 : 0) +
              (activeFilters.distance !== 'Any' ? 1 : 0) +
              (activeFilters.tapQuality !== 'Any' ? 1 : 0) +
              (activeFilters.price !== 'Any' ? 1 : 0) +
              (activeFilters.type !== 'Any' ? 1 : 0) +
              activeFilters.amenities.length;
            
            return filterCount > 0 ? (
              <View style={[styles.filterCountBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }]}>
                <Text style={[styles.filterCountText, { color: isDark ? theme.text : '#666' }]}>
                  {filterCount} filter{filterCount !== 1 ? 's' : ''} selected
                </Text>
              </View>
            ) : null;
          })()}
          
          <View style={[styles.filterModalButtons, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee', backgroundColor: isDark ? theme.background : '#fff' }]}>
            <TouchableOpacity 
              style={[styles.filterClearBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e8f4f8' }]} 
              onPress={() => {
                setActiveFilters({
                  sortBy: 'Distance',
                  distance: 'Any',
                  hours: 'Any',
                  tapQuality: 'Any',
                  price: 'Any',
                  type: 'Any',
                  amenities: [],
                });
              }}
            >
              <Text style={[styles.filterClearBtnText, { color: '#0A84FF' }]}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.filterApplyBtn} 
              onPress={() => {
                setShowAdvancedFilterModal(false);
                // TODO: Apply filters to search results
              }}
            >
              <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? theme.background : '#fff' }]}>
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={[styles.loadingText, { color: isDark ? theme.textSecondary : '#666' }]}>Loading places...</Text>
      </View>
    );
  }

  // Get filter config for current category
  const filterConfig = CATEGORY_FILTERS[selectedCategory] || CATEGORY_FILTERS.default;


  return viewMode === 'standard' ? renderStandardMode() : renderMapMode();
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
  
  // Safe Area & Scroll
  safe: { 
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 18,
  },

  // Segmented Control - Moved higher
  segmentWrap: {
    paddingHorizontal: 18,
    marginTop: 8, // Reduced from 28 to save space
    marginBottom: 10,
  },
  segment: {
    height: 44,
    borderRadius: 18,
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.0,
    shadowRadius: 12,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Title - Smaller for smaller screens
  title: {
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 16,
    fontSize: 29, // Increased ~10% for headline emphasis - Tavvy's core promise
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34, // Increased line height for readability
  },

  // Search
  searchWrapper: {
    position: 'relative',
    zIndex: 1000,
    marginHorizontal: 18,
    marginBottom: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52, // Slightly reduced
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchWrapFocused: {
    borderWidth: 2,
    borderColor: '#0A84FF',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },

  // Categories - Text only, rounded pills
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    marginTop: 8,
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 6, // Skinnier
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Hint
  hint: {
    paddingHorizontal: 18,
    marginTop: 12,
    marginBottom: 14,
    fontSize: 14,
    fontWeight: '500',
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 22, // Further reduced
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F8A8A', // ACCENT color - uniform across all sections
  },

  // Trending Scroll
  trendingScroll: {
    paddingLeft: 18,
    paddingRight: 10,
    paddingBottom: 6,
  },

  // Preview Card
  previewCard: {
    borderRadius: 20,
    marginRight: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  previewImage: {
    height: 160,
    width: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  previewImageRadius: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  placeName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  placeMeta: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '24%',
  },
  actionBtnText: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: '600',
  },

  // Signals Grid - Skinnier badges with x89 OUTSIDE on top-right
  signalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingBottom: 12,
    gap: 6,
  },
  signalBadgeWrapper: {
    width: '48%',
    position: 'relative',
  },
  signalBadge: {
    borderRadius: 10,
    paddingVertical: 6, // Skinnier
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32, // Skinnier
  },
  signalLabel: {
    flex: 1,
    fontSize: 11, // Smaller font for full text
    fontWeight: '700',
    color: '#FFFFFF', // White text on solid backgrounds
  },
  signalLabelEmpty: {
    fontWeight: '500',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.85)', // White with slight transparency for empty states
    fontSize: 10,
  },
  signalCount: {
    position: 'absolute',
    top: -6,
    right: -4,
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: '#333',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Explore Section
  exploreSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  exploreSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 18,
  },
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  exploreItem: {
    width: (width - 56) / 3,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Explore Tavvy Cards (Universe-style) - 70% width to match HappeningNow
  exploreCard: {
    width: width * 0.7, // Match HappeningNow card width (70%)
    height: 180, // Match HappeningNow card height
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  exploreCardImage: {
    width: '100%',
    height: '100%', // Fill entire card
    position: 'absolute',
  },
  exploreCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for text readability
  },
  exploreCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  exploreCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exploreCardBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  exploreCardSubtitle: {
    fontSize: 14,
    flex: 1,
  },
  placeholderBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  placeholderBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  // Trending Near You Cards - 70% width, 180px height to match HappeningNow and Explore Tavvy
  trendingCard: {
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  trendingCardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  trendingTypeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  trendingCardContent: {
    padding: 12,
  },
  trendingCardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'left',
  },
  trendingCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingCardCategory: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  trendingCardDot: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 6,
    fontSize: 12,
  },
  trendingCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },

  // Did You Know
  didYouKnowSection: {
    paddingHorizontal: 18,
    marginTop: 8,
  },
  didYouKnowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
  },
  didYouKnowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 214, 10, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  didYouKnowContent: {
    flex: 1,
  },
  didYouKnowTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  didYouKnowText: {
    fontSize: 14,
    lineHeight: 20,
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
  searchSuggestionsCard: {
    marginTop: -8,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
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
  suggestionIconAddress: {
    backgroundColor: '#F5E8FF',
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
    fontSize: 15,
    fontWeight: '500',
  },
  suggestionSubtitle: {
    fontSize: 13,
    marginTop: 2,
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
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
    // Transparent background - no container background
  },
  mapSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapCategoryChipsRow: {
    marginTop: 10,
    marginLeft: -16,
    marginRight: -16,
  },
  mapCategoryChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  mapCategoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
  },
  mapCategoryChipActive: {
    // Handled inline with border
  },
  mapCategoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mapCategoryChipTextActive: {
    // Handled inline
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mapSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mapSearchBarWithAddress: {
    borderWidth: 2,
    borderColor: '#AF52DE',
  },
  mapSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  mapSearchSuggestions: {
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  // Full-Screen Search Overlay - Google Maps Style
  fullScreenSearchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  fullScreenSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  fullScreenBackButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenSearchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  fullScreenSearchInput: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 0,
  },
  fullScreenSuggestionsList: {
    flex: 1,
  },
  fullScreenSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  fullScreenSuggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fullScreenSuggestionText: {
    flex: 1,
  },
  fullScreenSuggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  fullScreenSuggestionSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  mapSuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  mapCategoryOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 116 : 76,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  // Search this Area Button
  searchThisAreaButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 170 : 130,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 15,
  },
  searchThisAreaText: {
    color: '#fff',
    fontSize: 14,
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
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  // Bottom Sheet Category Header (moved from map overlay)
  bottomSheetCategoryHeader: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  bottomSheetCategoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  bottomSheetCategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  bottomSheetCategoryChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  bottomSheetCategoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSheetCategoryChipTextActive: {
    color: '#fff',
  },
  bottomSheetResultsCount: {
    fontSize: 13,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingTop: 4, // Reduced top padding
    paddingBottom: 20,
  },
  selectedPlaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  selectedPlaceTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  clearSelectionBtn: {
    padding: 4,
  },

  // Place Card (for bottom sheet)
  card: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  carouselContainer: {
    height: 180,
    position: 'relative',
  },
  carouselImage: {
    width: width - 48,
    height: 180,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  overlayPlaceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  overlayPlaceAddress: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
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

  // Signals Container (for bottom sheet cards)
  signalsContainer: {
    padding: 12,
    paddingTop: 16, // Extra space for x89 badges
    gap: 8,
  },
  signalsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signalPillWrapper: {
    flex: 1,
    position: 'relative',
  },
  signalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6, // Skinnier
    paddingHorizontal: 10,
    borderRadius: 10,
    minHeight: 32, // Skinnier
  },
  signalText: {
    flex: 1,
    fontSize: 11, // Smaller for full text
    fontWeight: '700',
    color: '#FFFFFF', // White text on solid backgrounds
  },
  signalTextEmpty: {
    fontWeight: '500',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.85)', // White with slight transparency for empty states
    fontSize: 10,
  },
  signalTapCount: {
    position: 'absolute',
    top: -8,
    right: -2,
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: '#333',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Quick Actions (for bottom sheet cards)
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  actionButton: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },

  // Map Markers
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  userLocationMarker: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  userLocationDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  targetLocationMarker: {
    alignItems: 'center',
  },
  parkingMarker: {
    alignItems: 'center',
  },
  parkingMarkerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  parkingMarkerTime: {
    fontSize: 10,
    color: '#FF9500',
    fontWeight: '700',
    marginTop: 2,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Address Card
  addressCardScrollView: {
    flex: 1,
  },
  addressCardContainer: {
    padding: 20,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  addressIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  addressCardSubtitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  addressDistance: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: '500',
  },
  addressActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  addressActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  addressActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addressActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  saveLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  saveLocationText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  nearbySection: {
    marginBottom: 20,
  },
  nearbySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  nearbyPlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  nearbyPlaceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nearbyPlaceInfo: {
    flex: 1,
  },
  nearbyPlaceName: {
    fontSize: 15,
    fontWeight: '500',
  },
  nearbyPlaceCategory: {
    fontSize: 13,
  },
  fullAddressSection: {
    padding: 14,
    borderRadius: 12,
  },
  fullAddressLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fullAddressText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Category Results View
  categorySheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 4, // Reduced from 8
    paddingBottom: 4, // Reduced from 8
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryResultsHeader: {
    paddingHorizontal: 20,
    paddingTop: 8, // Reduced from 16
    paddingBottom: 8, // Reduced from 12
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryResultsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced from 16
  },
  categoryResultsTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  categoryResultsClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryResultsCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  // Google Maps Style Filter Pills
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8, // Reduced from 12
  },
  filterPillIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(55, 65, 81, 0.85)', // Dark translucent background
  },
  filterPillActive: {
    backgroundColor: '#22D3EE',
    borderColor: '#22D3EE',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff', // White text by default
  },
  filterPillTextActive: {
    color: '#000', // Black text when active (cyan background)
  },
  // Legacy filter chip styles (keep for backwards compatibility)
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#0F1233',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryResultsLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  categoryResultsList: {
    padding: 16,
    gap: 12,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  categoryResultCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryResultPhotoContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  categoryResultPhoto: {
    width: '100%',
    height: '100%',
  },
  categoryResultPhotoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  categoryResultPhotoOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  categoryResultPhotoName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  categoryResultPhotoMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryResultSignalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 6,
  },
  categoryResultSignalBadge2x2: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    width: '48%',
  },
  categoryResultSignalText2x2: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  // Legacy styles kept for compatibility
  categoryResultCardContent: {
    flex: 1,
  },
  categoryResultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryResultMeta: {
    fontSize: 13,
    marginBottom: 8,
  },
  categoryResultSignals: {
    flexDirection: 'row',
    gap: 6,
  },
  categoryResultSignalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryResultSignalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Filter Modal
  filterModalContainer: {
    flex: 1,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterModalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  filterModalClose: {
    padding: 4,
  },
  filterModalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalContent: {
    padding: 20,
    paddingBottom: 100,
  },
  filterSection: {
    marginBottom: 28,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  priceRangeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  priceRangeLabel: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterOptionsRow: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  filterOptionActive: {
    backgroundColor: '#e8e8e8',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    fontWeight: '700',
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cuisineOption: {
    width: '25%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  cuisineOptionActive: {
    backgroundColor: '#e8e8e8',
  },
  cuisineOptionText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  cuisineOptionTextActive: {
    fontWeight: '700',
  },
  moreFiltersWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moreFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  moreFilterChipActive: {
    backgroundColor: '#0F1233',
  },
  moreFilterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  moreFilterChipTextActive: {
    color: '#fff',
  },
  filterModalButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    backgroundColor: '#fff',
  },
  filterClearBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterClearBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterApplyBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F8A8A',
  },
  filterApplyBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  filterSectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
    marginTop: -8,
  },
  filterCountBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
  },
  filterCountText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ===== NEW SECTIONS STYLES =====
  sectionContainer: {
    paddingHorizontal: 18,
    marginTop: 24,
  },
  featureSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  featureSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F8A8A', // ACCENT color for consistency
  },

  // Feature Cards (Rides, RV & Camping)
  featureCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureCardImage: {
    width: '100%',
    height: 120,
  },
  featureCardContent: {
    padding: 12,
  },
  featureCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  featureCardSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  featureCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureCardBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  featureCardSignals: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Leaderboard
  leaderboardCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  leaderboardRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leaderboardBadge: {
    fontSize: 20,
    marginRight: 10,
    width: 28,
    textAlign: 'center',
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderboardAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A84FF',
  },
  leaderboardName: {
    fontSize: 15,
    fontWeight: '600',
  },
  leaderboardStreak: {
    fontSize: 12,
    marginTop: 2,
  },
  leaderboardRight: {
    alignItems: 'flex-end',
  },
  leaderboardTaps: {
    fontSize: 18,
    fontWeight: '700',
  },
  leaderboardTapsLabel: {
    fontSize: 11,
    marginTop: 1,
  },

  // How Tavvy Works Section
  howItWorksSection: {
    paddingHorizontal: 18,
    marginTop: 24,
    marginBottom: 16,
  },
  howItWorksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  howItWorksTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  howItWorksSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 0,
  },
  howItWorksCard: {
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  howItWorksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  howItWorksRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  howItWorksIcon: {
    fontSize: 24,
    marginRight: 14,
    width: 32,
    textAlign: 'center',
  },
  howItWorksContent: {
    flex: 1,
  },
  howItWorksItemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  howItWorksItemDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
  },
  learnMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0A84FF',
    marginRight: 6,
  },
  emptyFeatureCard: {
    width: width - 32,
    height: 120,
    borderRadius: 16,
    marginTop: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyFeatureText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },

  // Floating Icons - Positioned at bottom of map, above tab bar
  floatingIconsLeft: {
    position: 'absolute',
    left: 16,
    bottom: 100,
    gap: 12,
  },
  floatingIconsRight: {
    position: 'absolute',
    right: 16,
    bottom: 100,
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

  // ===== NEW HOME SCREEN DESIGN STYLES =====
  
  // Greeting Section
  greetingSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 2,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  // Search Card
  searchCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  searchInputNew: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  searchInputText: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
  },
  searchInputTextInput: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    paddingVertical: 0,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  quickActionSubtext: {
    fontSize: 8,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },

  // Mood Cards
  moodSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  moodSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodCard: {
    borderRadius: 20,
    padding: 20,
    minHeight: 120,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  moodCardSmall: {
    width: (width - 52) / 2,
  },
  moodCardLarge: {
    width: '100%',
    minHeight: 130,
  },
  moodPopular: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  moodPopularText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  moodEmoji: {
    fontSize: 36,
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.9,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  moodSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  // Live Now Section
  liveSection: {
    marginBottom: 20,
  },
  liveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  liveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  liveSeeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667EEA',
  },

  // Nearby Section
  nearbySection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  nearbyList: {
    gap: 12,
  },
  nearbyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  nearbyRank: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyRankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  nearbyImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  nearbyCategory: {
    fontSize: 12,
  },
  nearbySignal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  nearbySignalIcon: {
    fontSize: 12,
  },
  nearbySignalText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
