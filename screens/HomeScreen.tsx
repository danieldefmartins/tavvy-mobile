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
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { supabase } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

// ============================================
// CONSTANTS
// ============================================

const MAP_PEEK_HEIGHT = height * 0.22;

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

// Categories for filtering - text only, no icons
const categories = ['All', 'Restaurants', 'Cafes', 'Bars', 'Shopping', 'RV & Camping', 'Hotels'];

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
const CATEGORY_FILTERS: { [key: string]: {
  cuisines?: { name: string; icon: string }[];
  moreFilters: string[];
}} = {
  Restaurants: {
    cuisines: [
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
    ],
    moreFilters: ['Wheelchair accessible', 'Accepts reservations', 'Delivery', 'Beer', 'Wine', 'Takeout', 'Dine-in', 'Dinner', 'Lunch', 'Good for kids', 'Tourists', "Kids' menu", 'Vegetarian options'],
  },
  Cafes: {
    cuisines: [
      { name: 'Any', icon: '' },
      { name: 'Coffee', icon: 'cafe' },
      { name: 'Tea', icon: 'cafe' },
      { name: 'Bakery', icon: 'cafe' },
      { name: 'Dessert', icon: 'ice-cream' },
    ],
    moreFilters: ['Wheelchair accessible', 'WiFi', 'Outdoor seating', 'Takeout', 'Good for work', 'Pet friendly'],
  },
  Bars: {
    cuisines: [
      { name: 'Any', icon: '' },
      { name: 'Sports Bar', icon: 'beer' },
      { name: 'Wine Bar', icon: 'wine' },
      { name: 'Cocktail Bar', icon: 'beer' },
      { name: 'Pub', icon: 'beer' },
      { name: 'Brewery', icon: 'beer' },
    ],
    moreFilters: ['Wheelchair accessible', 'Live music', 'Happy hour', 'Outdoor seating', 'Late night', 'Dancing'],
  },
  Shopping: {
    moreFilters: ['Wheelchair accessible', 'Accepts credit cards', 'Parking', 'Returns accepted', 'Gift wrapping'],
  },
  Services: {
    moreFilters: ['Wheelchair accessible', 'Accepts credit cards', 'By appointment', 'Walk-ins welcome', 'Online booking'],
  },
  default: {
    moreFilters: ['Wheelchair accessible', 'Parking', 'Accepts credit cards'],
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
  
  // View mode: 'standard' (default) or 'map' (search/swipe triggered)
  const [viewMode, setViewMode] = useState<'standard' | 'map'>('standard');
  
  // Data states - start with empty arrays, will be populated from database
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
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
  const [activeFilters, setActiveFilters] = useState<{
    cuisine: string;
    priceMin: number;
    priceMax: number;
    rating: string;
    tapCount: string;
    hours: string;
    moreFilters: string[];
  }>({
    cuisine: 'Any',
    priceMin: 1,
    priceMax: 100,
    rating: 'any',
    tapCount: 'Any',
    hours: 'Any',
    moreFilters: [],
  });
  
  // Location states
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  
  // Map states
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('osm');
  
  // Personalization states
  const [greeting, setGreeting] = useState('');
  
  // Parking and saved locations
  const [parkingLocation, setParkingLocation] = useState<ParkingLocation | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Refs
  const cameraRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const searchInputRef = useRef<TextInput>(null);

  // ============================================
  // INITIALIZATION
  // ============================================

  useEffect(() => {
    initializeApp();
  }, []);

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

      // Query from both fsq_places_raw (Foursquare) and tavvy_places (user-added)
      
      // 1. Fetch from Foursquare data
      const { data: fsqPlacesData, error: fsqError } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, latitude, longitude, address, locality, region, country, postcode, tel, website, email, instagram, facebook_id, twitter, fsq_category_ids, fsq_category_labels, date_created, date_refreshed, date_closed')
        .gte('latitude', minLat)
        .lte('latitude', maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng)
        .is('date_closed', null)
        .limit(150);
      
      // 2. Fetch from user-added places
      const { data: tavvyPlacesData, error: tavvyError } = await supabase
        .from('tavvy_places')
        .select('id, name, latitude, longitude, address, city, region, country, postcode, phone, website, email, instagram, facebook, twitter, tavvy_category, tavvy_subcategory, photos, cover_image_url, created_at')
        .gte('latitude', minLat)
        .lte('latitude', maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng)
        .eq('is_deleted', false)
        .limit(50);
      
      // Combine both sources
      const fsqPlaces = (fsqPlacesData || []).map(p => ({ ...p, source: 'foursquare' }));
      const tavvyPlaces = (tavvyPlacesData || []).map(p => ({ 
        ...p, 
        source: 'user',
        fsq_place_id: p.id, // Use id as the identifier
        locality: p.city,
        tel: p.phone,
        fsq_category_labels: [p.tavvy_subcategory || p.tavvy_category || 'Other']
      }));
      
      const placesData = [...fsqPlaces, ...tavvyPlaces];
      const placesError = fsqError || tavvyError;
      
      console.log(`Fetched ${fsqPlaces.length} Foursquare places, ${tavvyPlaces.length} user-added places`);

      if (placesError) {
        console.warn('Supabase error:', placesError);
        setPlaces([]);
        setFilteredPlaces([]);
        setLoading(false);
        return;
      }

      console.log('Fetched places from Supabase:', placesData?.length || 0);

      if (placesData && placesData.length > 0) {
        const placeIds = placesData.map((p: any) => p.id);
        
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

        const processedPlaces = placesData
          .filter((place) => {
            return typeof place.longitude === 'number' && typeof place.latitude === 'number' && 
                   !isNaN(place.longitude) && !isNaN(place.latitude) && 
                   place.longitude !== 0 && place.latitude !== 0;
          })
          .map(place => {
            // Get signals for this place using fsq_place_id
            const placeSignals = signalAggregates
              .filter(s => s.place_id === place.fsq_place_id)
              .map(s => ({
                bucket: s.signal_label || 'Unknown',
                tap_total: s.total_taps || 0,
              }));

            // Get category from fsq_category_labels - it's an array like ["Business > Hair Salon"]
            let category = 'Other';
            if (place.fsq_category_labels && Array.isArray(place.fsq_category_labels) && place.fsq_category_labels.length > 0) {
              // Extract the last part of the category path (e.g., "Hair Salon" from "Business > Hair Salon")
              const fullCategory = place.fsq_category_labels[0];
              if (typeof fullCategory === 'string') {
                const parts = fullCategory.split('>');
                category = parts[parts.length - 1].trim();
              }
            }

            return {
              id: place.fsq_place_id,
              name: place.name,
              latitude: place.latitude,
              longitude: place.longitude,
              address_line1: place.address || '',
              city: place.locality || '',
              state_region: place.region || '',
              country: place.country || '',
              category: category,
              phone: place.tel || '',
              website: place.website || '',
              instagram_url: place.instagram || '',
              signals: placeSignals,
              photos: [], // No photos column in fsq_places_raw
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

  // ============================================
  // SEARCH FUNCTIONS
  // ============================================

  const handleSearchInputChange = async (text: string) => {
    setSearchQuery(text);
    
    if (text.trim().length === 0) {
      setSearchSuggestions([]);
      return;
    }

    const suggestions: SearchSuggestion[] = [];
    const query = text.toLowerCase();

    // Search database for matching places
    try {
      const { data: searchResults, error } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, latitude, longitude, address, locality, region, fsq_category_labels')
        .ilike('name', `%${text}%`)
        .is('date_closed', null)
        .limit(5);

      if (!error && searchResults && searchResults.length > 0) {
        searchResults.forEach(place => {
          let category = 'Other';
          if (place.fsq_category_labels && Array.isArray(place.fsq_category_labels) && place.fsq_category_labels.length > 0) {
            const fullCategory = place.fsq_category_labels[0];
            if (typeof fullCategory === 'string') {
              const parts = fullCategory.split('>');
              category = parts[parts.length - 1].trim();
            }
          }
          
          suggestions.push({
            id: `place-${place.fsq_place_id}`,
            type: 'place',
            title: place.name,
            subtitle: `${category} • ${place.locality || 'Nearby'}`,
            icon: 'location',
            data: {
              id: place.fsq_place_id,
              name: place.name,
              latitude: place.latitude,
              longitude: place.longitude,
              address_line1: place.address || '',
              city: place.locality || '',
              category: category,
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

    // Geocode address if query looks like an address
    if (text.length > 5 && /\d/.test(text)) {
      setIsSearchingAddress(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=3`
        );
        const results: GeocodingResult[] = await response.json();
        
        results.forEach((result, index) => {
          suggestions.push({
            id: `address-${index}`,
            type: 'address',
            title: result.display_name.split(',')[0],
            subtitle: result.display_name,
            icon: 'navigate',
            data: result,
          });
        });
        
        setSearchSuggestions([...suggestions]);
      } catch (error) {
        console.log('Geocoding error:', error);
      } finally {
        setIsSearchingAddress(false);
      }
    }
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
      saveRecentSearch(searchQuery.trim());
      filterPlaces(searchQuery.trim());
      switchToMapMode();
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
          setTargetLocation([place.longitude, place.latitude]);
          setSelectedPlace(place);
          setSearchQuery(place.name);
          switchToMapMode();
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
        cuisine: 'Any',
        priceMin: 1,
        priceMax: 100,
        rating: 'any',
        tapCount: 'Any',
        hours: 'Any',
        moreFilters: [],
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
      const latDelta = 0.5; // Larger radius for category search (about 35 miles)
      const lngDelta = 0.5;
      
      const minLat = centerLat - latDelta;
      const maxLat = centerLat + latDelta;
      const minLng = centerLng - lngDelta;
      const maxLng = centerLng + lngDelta;

      // Map user-friendly category names to Foursquare category patterns
      const categoryMappings: { [key: string]: string[] } = {
        'Restaurants': ['restaurant', 'dining', 'food', 'eatery', 'bistro', 'grill', 'kitchen'],
        'Coffee Shops': ['coffee', 'café', 'cafe', 'tea', 'espresso', 'bakery'],
        'Bars': ['bar', 'pub', 'nightclub', 'lounge', 'brewery', 'tavern', 'wine'],
        'Contractors': ['contractor', 'construction', 'home service', 'repair', 'plumber', 'electrician'],
        'Hotels': ['hotel', 'motel', 'inn', 'lodging', 'resort', 'hostel'],
        'Shopping': ['shop', 'store', 'retail', 'mall', 'market', 'boutique'],
        'Entertainment': ['entertainment', 'theater', 'cinema', 'museum', 'gallery', 'amusement', 'theme park'],
        'Health': ['health', 'medical', 'doctor', 'hospital', 'clinic', 'pharmacy', 'dentist'],
        'Beauty': ['beauty', 'salon', 'spa', 'hair', 'nail', 'barber'],
        'Fitness': ['gym', 'fitness', 'yoga', 'sports', 'athletic'],
        // RV & Camping
        'RV & Camping': ['campground', 'rv park', 'camping', 'camper', 'caravan', 'motorhome', 'boondocking'],
        'Campgrounds': ['campground', 'camping', 'campsite', 'tent', 'camp'],
        'RV Parks': ['rv park', 'rv', 'motorhome', 'caravan', 'trailer park'],
        'Dump Stations': ['dump station', 'sanitation', 'rv dump', 'sewage'],
        'Propane': ['propane', 'lpg', 'gas refill'],
        // Theme Parks
        'Theme Parks': ['theme park', 'amusement park', 'water park', 'attraction'],
        'Rides': ['ride', 'roller coaster', 'attraction'],
        // Amenities
        'Restrooms': ['restroom', 'bathroom', 'toilet', 'washroom', 'lavatory'],
        'Showers': ['shower', 'bath house'],
        'Laundromat': ['laundromat', 'laundry', 'coin laundry'],
        // Government
        'Border Crossings': ['border', 'customs', 'immigration', 'port of entry'],
      };

      // Get search patterns for this category (lowercase for matching)
      const searchPatterns = categoryMappings[category] || [category.toLowerCase()];

      console.log(`Fetching ${category} near [${centerLng}, ${centerLat}] with patterns:`, searchPatterns);

      // Query all places in the area first, then filter locally
      // This is more reliable than complex Supabase text queries
      const { data: placesData, error } = await supabase
        .from('fsq_places_raw')
        .select('fsq_place_id, name, latitude, longitude, address, locality, region, country, postcode, tel, website, email, instagram, facebook_id, twitter, fsq_category_ids, fsq_category_labels, date_created, date_refreshed, date_closed')
        .gte('latitude', minLat)
        .lte('latitude', maxLat)
        .gte('longitude', minLng)
        .lte('longitude', maxLng)
        .is('date_closed', null)
        .limit(500); // Get more results to filter locally

      console.log('Raw query results:', placesData?.length || 0);

      if (error) {
        console.warn('Category search error:', error);
        // Fallback to local filtering
        const filtered = places.filter(place => 
          place.category?.toLowerCase().includes(category.toLowerCase())
        );
        setCategoryResultsPlaces(filtered);
        setIsLoadingCategoryResults(false);
        return;
      }

      if (placesData && placesData.length > 0) {
        // Filter places locally by category patterns
        const filteredByCategory = placesData.filter((place) => {
          // Check if any category label matches our search patterns
          if (place.fsq_category_labels && Array.isArray(place.fsq_category_labels)) {
            const categoryString = place.fsq_category_labels.join(' ').toLowerCase();
            return searchPatterns.some(pattern => categoryString.includes(pattern));
          }
          // Also check the place name for category keywords
          const nameLower = place.name?.toLowerCase() || '';
          return searchPatterns.some(pattern => nameLower.includes(pattern));
        });

        console.log(`Filtered to ${filteredByCategory.length} ${category} places`);

        // Deduplicate by fsq_place_id first, then by name to catch duplicates with different IDs
        const uniqueById = Array.from(
          new Map(filteredByCategory.map(p => [p.fsq_place_id, p])).values()
        );
        // Also deduplicate by name (case-insensitive) to catch same places with different IDs
        const uniquePlaces = Array.from(
          new Map(uniqueById.map(p => [p.name?.toLowerCase().trim(), p])).values()
        );

        const processedPlaces = uniquePlaces
          .filter((place) => {
            return typeof place.longitude === 'number' && typeof place.latitude === 'number' && 
                   !isNaN(place.longitude) && !isNaN(place.latitude) && 
                   place.longitude !== 0 && place.latitude !== 0;
          })
          .map(place => {
            let placeCategory = 'Other';
            if (place.fsq_category_labels && Array.isArray(place.fsq_category_labels) && place.fsq_category_labels.length > 0) {
              const fullCategory = place.fsq_category_labels[0];
              if (typeof fullCategory === 'string') {
                const parts = fullCategory.split('>');
                placeCategory = parts[parts.length - 1].trim();
              }
            }

            return {
              id: place.fsq_place_id,
              name: place.name,
              latitude: place.latitude,
              longitude: place.longitude,
              address_line1: place.address || '',
              city: place.locality || '',
              state_region: place.region || '',
              country: place.country || '',
              category: placeCategory,
              phone: place.tel || '',
              website: place.website || '',
              instagram_url: place.instagram || '',
              signals: [],
              photos: [],
              fsq_category_labels: place.fsq_category_labels, // Keep for debugging
            };
          })
          .slice(0, 100); // Limit to 100 results

        console.log(`Final processed places: ${processedPlaces.length}`);
        setCategoryResultsPlaces(processedPlaces as Place[]);
      } else {
        // Fallback to local filtering if no results from database
        const filtered = places.filter(place => 
          place.category?.toLowerCase().includes(category.toLowerCase())
        );
        setCategoryResultsPlaces(filtered);
      }
    } catch (error) {
      console.error('Error fetching category places:', error);
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
      cuisine: 'Any',
      priceMin: 1,
      priceMax: 100,
      rating: 'any',
      tapCount: 'Any',
      hours: 'Any',
      moreFilters: [],
    });
  };

  const toggleMoreFilter = (filter: string) => {
    setActiveFilters(prev => ({
      ...prev,
      moreFilters: prev.moreFilters.includes(filter)
        ? prev.moreFilters.filter(f => f !== filter)
        : [...prev.moreFilters, filter],
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
      navigation.navigate('PlaceDetails', { placeId: place.id });
    }
  };

  const handleMarkerPress = (place: Place) => {
    setSelectedPlace(place);
    bottomSheetRef.current?.snapToIndex(1);
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
          <TouchableOpacity style={styles.addressActionButton} onPress={handleAddressDirections}>
            <View style={[styles.addressActionIcon, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="navigate" size={20} color="#fff" />
            </View>
            <Text style={[styles.addressActionText, { color: isDark ? theme.textSecondary : '#666' }]}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressActionButton} onPress={handleShare}>
            <View style={[styles.addressActionIcon, { backgroundColor: '#34C759' }]}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </View>
            <Text style={[styles.addressActionText, { color: isDark ? theme.textSecondary : '#666' }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressActionButton} onPress={handleSaveParking}>
            <View style={[styles.addressActionIcon, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="car" size={20} color="#fff" />
            </View>
            <Text style={[styles.addressActionText, { color: isDark ? theme.textSecondary : '#666' }]}>Park Here</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressActionButton} onPress={handleCopyAddress}>
            <View style={[styles.addressActionIcon, { backgroundColor: '#8E8E93' }]}>
              <Ionicons name="copy-outline" size={20} color="#fff" />
            </View>
            <Text style={[styles.addressActionText, { color: isDark ? theme.textSecondary : '#666' }]}>Copy</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.saveLocationButton, { backgroundColor: isDark ? theme.surface : '#F2F2F7' }]} onPress={handleSaveLocation}>
          <Ionicons name="bookmark-outline" size={20} color="#007AFF" />
          <Text style={styles.saveLocationText}>Save to My Places</Text>
        </TouchableOpacity>

        {nearbyPlaces.length > 0 && (
          <View style={styles.nearbySection}>
            <Text style={[styles.nearbySectionTitle, { color: isDark ? theme.text : '#000' }]}>Nearby on TavvY</Text>
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
          <TouchableOpacity style={styles.actionButton} onPress={() => handleCall(place.phone)}>
            <Ionicons name="call-outline" size={20} color={isDark ? theme.textSecondary : '#666'} />
            <Text style={[styles.actionText, { color: isDark ? theme.textSecondary : '#666' }]}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDirections(place)}>
            <Ionicons name="navigate-outline" size={20} color={isDark ? theme.textSecondary : '#666'} />
            <Text style={[styles.actionText, { color: isDark ? theme.textSecondary : '#666' }]}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleSocial(place.instagram_url)}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={isDark ? theme.textSecondary : '#666'} />
            <Text style={[styles.actionText, { color: isDark ? theme.textSecondary : '#666' }]}>Social</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleWebsite(place.website)}>
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

  const cardWidth = Math.min(320, width * 0.78);

  const renderStandardMode = () => (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? theme.background : BG }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Segmented Control: Standard / Map - Moved higher */}
        <View style={styles.segmentWrap}>
          <View style={[styles.segment, { 
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,18,51,0.12)', 
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)' 
          }]}>
            <TouchableOpacity
              style={[styles.segmentItem, viewMode === 'standard' && [styles.segmentItemActive, { backgroundColor: ACCENT }]]}
              onPress={() => setViewMode('standard')}
              activeOpacity={0.9}
            >
              <Text style={[styles.segmentText, { color: viewMode === 'standard' ? '#fff' : (isDark ? theme.textSecondary : '#6B6B6B') }]}>Standard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentItem, viewMode === 'map' && [styles.segmentItemActive, { backgroundColor: ACCENT }]]}
              onPress={switchToMapMode}
              activeOpacity={0.9}
            >
              <Text style={[styles.segmentText, { color: viewMode === 'map' ? '#fff' : (isDark ? theme.textSecondary : '#6B6B6B') }]}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Title - Smaller font for smaller screens */}
        <Text style={[styles.title, { color: isDark ? theme.text : ACCENT }]}>
          Find a place that fits{'\n'}your moment
        </Text>

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
            {/* Category Pills - Text only, no icons, rounded */}
            <View style={styles.categoriesRow}>
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catPill,
                      {
                        backgroundColor: active ? ACCENT : (isDark ? 'rgba(255,255,255,0.06)' : '#FDFBF6'),
                        borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,18,51,0.14)',
                      },
                    ]}
                    onPress={() => handleCategorySelect(cat)}
                    activeOpacity={0.9}
                  >
                    <Text 
                      style={[
                        styles.catText, 
                        { color: active ? '#fff' : (isDark ? theme.text : '#1C1C1C') }
                      ]} 
                      numberOfLines={1}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Hint Text */}
            <Text style={[styles.hint, { color: isDark ? theme.textSecondary : '#666' }]}>
              Signals are Tavvy reviews — compare places in seconds
            </Text>

            {/* Trending Near You Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#111' }]}>Trending Near You</Text>
              <TouchableOpacity onPress={switchToMapMode} activeOpacity={0.8}>
                <Text style={[styles.seeAll, { color: ACCENT }]}>See All</Text>
              </TouchableOpacity>
            </View>

            {/* Trending Carousel */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.trendingScroll}
            >
              {filteredPlaces.slice(0, 10).map((place, trendingIndex) => (
                <TouchableOpacity
                  key={`trending-${place.id}-${trendingIndex}`}
                  onPress={() => handlePlacePress(place)}
                  activeOpacity={0.92}
                  style={[styles.previewCard, { width: cardWidth, backgroundColor: isDark ? theme.surface : '#fff' }]}
                >
                  {/* Image with overlay */}
                  <ImageBackground 
                    source={{ uri: place.photos?.[0] || getCategoryFallbackImage(place.category || place.primary_category) }} 
                    style={styles.previewImage} 
                    imageStyle={styles.previewImageRadius}
                  >
                    <View style={styles.imageOverlay} />
                    <Text style={styles.placeName} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <Text style={styles.placeMeta} numberOfLines={1}>
                      {place.primary_category || place.category} • {place.city || 'Nearby'}
                    </Text>
                  </ImageBackground>

                  {/* Actions Row */}
                  <View style={[styles.actionsRow, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
                    <TouchableOpacity onPress={() => handleCall(place.phone)} style={styles.actionBtn} activeOpacity={0.8}>
                      <Ionicons name="call-outline" size={18} color={isDark ? theme.textSecondary : '#666'} />
                      <Text style={[styles.actionBtnText, { color: isDark ? theme.textSecondary : '#666' }]}>Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDirections(place)} style={styles.actionBtn} activeOpacity={0.8}>
                      <Ionicons name="navigate-outline" size={18} color={isDark ? theme.textSecondary : '#666'} />
                      <Text style={[styles.actionBtnText, { color: isDark ? theme.textSecondary : '#666' }]}>Directions</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleSocial(place.instagram_url)} style={styles.actionBtn} activeOpacity={0.8}>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color={isDark ? theme.textSecondary : '#666'} />
                      <Text style={[styles.actionBtnText, { color: isDark ? theme.textSecondary : '#666' }]}>Social</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleWebsite(place.website)} style={styles.actionBtn} activeOpacity={0.8}>
                      <Ionicons name="globe-outline" size={18} color={isDark ? theme.textSecondary : '#666'} />
                      <Text style={[styles.actionBtnText, { color: isDark ? theme.textSecondary : '#666' }]}>Website</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Signals Grid - Always show with fallbacks for empty categories */}
                  <View style={[styles.signalsGrid, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
                    {getDisplaySignals(place.signals).map((signal, idx) => (
                      <View key={`trending-${trendingIndex}-${place.id}-sig-${idx}`} style={styles.signalBadgeWrapper}>
                        <View style={[styles.signalBadge, { backgroundColor: getSignalColor(signal.bucket) }]}>
                          <Ionicons 
                            name={getSignalIcon(signal.bucket) as any} 
                            size={12} 
                            color={getSignalIconColor(signal.bucket)} 
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[styles.signalLabel, signal.isEmpty && styles.signalLabelEmpty]} numberOfLines={1}>
                            {signal.isEmpty ? getEmptySignalText(signal.bucket) : signal.bucket}
                          </Text>
                        </View>
                        {!signal.isEmpty && (
                          <Text style={styles.signalCount}>x{signal.tap_total}</Text>
                        )}
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Explore Categories */}
            <View style={styles.exploreSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#000', marginBottom: 12 }]}>Explore</Text>
              <View style={styles.exploreGrid}>
                {['Restaurants', 'Cafes', 'Bars', 'Shopping', 'Entertainment', 'Services'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.exploreItem, { backgroundColor: isDark ? theme.surface : '#F2F2F7' }]}
                    onPress={() => {
                      handleCategorySelect(cat);
                      switchToMapMode();
                    }}
                  >
                    <View style={[styles.exploreIconContainer, { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : '#F2F7FF' }]}>
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
                    <Text style={[styles.exploreText, { color: isDark ? theme.text : '#000' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Did You Know */}
            <View style={styles.didYouKnowSection}>
              <View style={[styles.didYouKnowCard, { backgroundColor: isDark ? theme.surface : '#FFF9E6' }]}>
                <View style={styles.didYouKnowIcon}>
                  <Ionicons name="bulb" size={24} color="#FFD60A" />
                </View>
                <View style={styles.didYouKnowContent}>
                  <Text style={[styles.didYouKnowTitle, { color: isDark ? theme.text : '#000' }]}>Did you know?</Text>
                  <Text style={[styles.didYouKnowText, { color: isDark ? theme.textSecondary : '#666' }]}>
                    TavvY uses tap-based signals instead of star ratings to give you honest, structured insights about places.
                  </Text>
                </View>
              </View>
            </View>

            {/* ===== RIDES & ATTRACTIONS SECTION ===== */}
            <View style={styles.sectionContainer}>
              <View style={styles.featureSectionHeader}>
                <Text style={[styles.featureSectionTitle, { color: isDark ? theme.text : '#000' }]}>🎢 Rides & Attractions</Text>
                <TouchableOpacity onPress={() => navigation.navigate('RidesBrowse')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.sectionSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
                Theme park experiences reviewed by the community
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                {[
                  { id: 'ride1', name: 'Space Mountain', universe: 'Magic Kingdom', signals: 234, type: 'Thrill', image: 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=400' },
                  { id: 'ride2', name: 'Hagrid\'s Motorbike', universe: 'Universal Orlando', signals: 456, type: 'Family', image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=400' },
                  { id: 'ride3', name: 'Avatar Flight', universe: 'Animal Kingdom', signals: 312, type: 'Immersive', image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400' },
                ].map((ride) => (
                  <TouchableOpacity
                    key={ride.id}
                    style={[styles.featureCard, { backgroundColor: isDark ? theme.surface : '#fff' }]}
                    onPress={() => navigation.navigate('RideDetails', { placeId: ride.id })}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: ride.image }} style={styles.featureCardImage} />
                    <View style={styles.featureCardContent}>
                      <Text style={[styles.featureCardTitle, { color: isDark ? theme.text : '#000' }]} numberOfLines={1}>{ride.name}</Text>
                      <Text style={[styles.featureCardSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>{ride.universe}</Text>
                      <View style={styles.featureCardMeta}>
                        <View style={[styles.featureCardBadge, { backgroundColor: '#E8F4FD' }]}>
                          <Text style={[styles.featureCardBadgeText, { color: '#0A84FF' }]}>✨ {ride.type}</Text>
                        </View>
                        <Text style={[styles.featureCardSignals, { color: isDark ? theme.textSecondary : '#888' }]}>×{ride.signals}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ===== RV & CAMPING SECTION ===== */}
            <View style={styles.sectionContainer}>
              <View style={styles.featureSectionHeader}>
                <Text style={[styles.featureSectionTitle, { color: isDark ? theme.text : '#000' }]}>🏕️ RV & Camping</Text>
                <TouchableOpacity onPress={() => navigation.navigate('RVCampingBrowse')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.sectionSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
                Campgrounds and RV parks with real traveler insights
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                {[
                  { id: 'camp1', name: 'Fort Wilderness', location: 'Orlando, FL', signals: 189, type: 'Full Hookups', image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?w=400' },
                  { id: 'camp2', name: 'Yosemite Pines', location: 'Groveland, CA', signals: 234, type: 'Scenic', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400' },
                  { id: 'camp3', name: 'KOA Yellowstone', location: 'West Yellowstone, MT', signals: 156, type: 'Family', image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400' },
                ].map((camp) => (
                  <TouchableOpacity
                    key={camp.id}
                    style={[styles.featureCard, { backgroundColor: isDark ? theme.surface : '#fff' }]}
                    onPress={() => navigation.navigate('RideDetails', { placeId: camp.id })}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: camp.image }} style={styles.featureCardImage} />
                    <View style={styles.featureCardContent}>
                      <Text style={[styles.featureCardTitle, { color: isDark ? theme.text : '#000' }]} numberOfLines={1}>{camp.name}</Text>
                      <Text style={[styles.featureCardSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>{camp.location}</Text>
                      <View style={styles.featureCardMeta}>
                        <View style={[styles.featureCardBadge, { backgroundColor: '#E8F8E8' }]}>
                          <Text style={[styles.featureCardBadgeText, { color: '#34C759' }]}>⛺ {camp.type}</Text>
                        </View>
                        <Text style={[styles.featureCardSignals, { color: isDark ? theme.textSecondary : '#888' }]}>×{camp.signals}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ===== TOP CONTRIBUTORS SECTION ===== */}
            <View style={styles.sectionContainer}>
              <View style={styles.featureSectionHeader}>
                <Text style={[styles.featureSectionTitle, { color: isDark ? theme.text : '#000' }]}>🏆 Top Contributors</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'Leaderboard' })}>
                  <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
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

            {/* ===== HOW TAVVY WORKS SECTION ===== */}
            <View style={styles.howItWorksSection}>
              <Text style={[styles.howItWorksTitle, { color: isDark ? theme.text : '#000' }]}>
                ✨ How TavvY Works
              </Text>
              <Text style={[styles.howItWorksSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
                A smarter way to discover and review places
              </Text>
              
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
                onPress={() => navigation.navigate('Apps', { screen: 'About' })}
              >
                <Text style={styles.learnMoreText}>Learn More About TavvY</Text>
                <Ionicons name="arrow-forward" size={16} color="#0A84FF" />
              </TouchableOpacity>
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
              <View style={styles.userLocationDot} />
            </View>
          </MapLibreGL.PointAnnotation>
        )}

        {filteredPlaces
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
          style={[styles.backButton, { backgroundColor: isDark ? theme.surface : '#fff' }]}
          onPress={switchToStandardMode}
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
              setSearchQuery(text);
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
      
      {/* Category Filters - Text only, rounded */}
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
                { backgroundColor: isDark ? theme.surface : '#fff' },
                selectedCategory === category && styles.mapCategoryChipActive,
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text
                style={[
                  styles.mapCategoryChipText,
                  { color: isDark ? theme.text : '#333' },
                  selectedCategory === category && styles.mapCategoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Sheet with Place Cards or Address Card */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={searchedAddress ? [40, '40%', '55%'] : [40, '35%', '55%']}
        backgroundStyle={[styles.bottomSheetBackground, { backgroundColor: isDark ? theme.background : '#fff' }]}
        handleIndicatorStyle={[styles.bottomSheetHandle, { backgroundColor: isDark ? theme.textSecondary : '#DEDEDE' }]}
        enablePanDownToClose={false}
        enableContentPanningGesture={false}
      >
        {searchedAddress ? (
          <ScrollView 
            style={styles.addressCardScrollView}
            showsVerticalScrollIndicator={false}
          >
            {renderAddressInfoCard()}
          </ScrollView>
        ) : (
          <BottomSheetFlatList
            data={filteredPlaces}
            keyExtractor={(item) => item.id}
            renderItem={renderPlaceCard}
            contentContainerStyle={styles.bottomSheetContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </BottomSheet>
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

  // Render category results view with filter bottom sheet
  if (showCategoryResults) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: isDark ? theme.background : BG }]}>
        {/* Category Results Header */}
        <View style={[styles.categoryResultsHeader, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
          <View style={styles.categoryResultsTitleRow}>
            <Text style={[styles.categoryResultsTitle, { color: isDark ? theme.text : '#000' }]}>{selectedCategory}</Text>
            <TouchableOpacity onPress={closeCategoryResults} style={styles.categoryResultsClose}>
              <Ionicons name="close" size={24} color={isDark ? theme.text : '#000'} />
            </TouchableOpacity>
          </View>
          
          {/* Quick Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersRow}>
            <TouchableOpacity 
              style={[styles.filterChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="options-outline" size={16} color={isDark ? theme.text : '#333'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterChip, 
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' },
                activeFilters.hours === 'Open now' && styles.filterChipActive
              ]}
              onPress={() => setActiveFilters(prev => ({ ...prev, hours: prev.hours === 'Open now' ? 'Any' : 'Open now' }))}
            >
              <Text style={[styles.filterChipText, { color: isDark ? theme.text : '#333' }]}>Open now</Text>
            </TouchableOpacity>
            {filterConfig.cuisines && (
              <TouchableOpacity 
                style={[
                  styles.filterChip, 
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' },
                  activeFilters.cuisine !== 'Any' && styles.filterChipActive
                ]}
                onPress={() => setShowFilterModal(true)}
              >
                <Text style={[styles.filterChipText, { color: isDark ? theme.text : '#333' }]}>
                  {activeFilters.cuisine === 'Any' ? 'Cuisine' : activeFilters.cuisine}
                </Text>
                <Ionicons name="chevron-down" size={14} color={isDark ? theme.text : '#333'} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[
                styles.filterChip, 
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' },
                activeFilters.priceMax < 100 && styles.filterChipActive
              ]}
              onPress={() => setShowFilterModal(true)}
            >
              <Text style={[styles.filterChipText, { color: isDark ? theme.text : '#333' }]}>Price</Text>
              <Ionicons name="chevron-down" size={14} color={isDark ? theme.text : '#333'} />
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
          <ScrollView contentContainerStyle={styles.categoryResultsList}>
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
          </ScrollView>
        )}

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <SafeAreaView style={[styles.filterModalContainer, { backgroundColor: isDark ? theme.background : '#fff' }]}>
            {/* Modal Header */}
            <View style={[styles.filterModalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee' }]}>
              <Text style={[styles.filterModalTitle, { color: isDark ? theme.text : '#000' }]}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.filterModalClose}>
                <View style={[styles.filterModalCloseCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0' }]}>
                  <Ionicons name="close" size={20} color={isDark ? theme.text : '#000'} />
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.filterModalContent}>
              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Price per person</Text>
                <View style={styles.priceRangeContainer}>
                  <Text style={[styles.priceRangeLabel, { color: isDark ? theme.text : '#000' }]}>
                    ${activeFilters.priceMin}–${activeFilters.priceMax}+
                  </Text>
                </View>
              </View>

              {/* Tap Rating */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Tap Rating</Text>
                <View style={styles.moreFiltersWrap}>
                  {[
                    { key: 'any', label: 'Any' },
                    { key: 'mostly_positive', label: 'Mostly Positive' },
                    { key: 'highly_rated', label: 'Highly Rated' },
                    { key: 'trending', label: 'Trending' },
                    { key: 'no_heads_up', label: 'No Heads Up (3mo)' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.moreFilterChip,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f0f0f0', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#ddd' },
                        activeFilters.rating === option.key && styles.moreFilterChipActive
                      ]}
                      onPress={() => setActiveFilters(prev => ({ ...prev, rating: option.key }))}
                    >
                      <Text style={[
                        styles.moreFilterChipText,
                        { color: isDark ? theme.text : '#333' },
                        activeFilters.rating === option.key && styles.moreFilterChipTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Number of Taps */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Number of taps</Text>
                <View style={styles.filterOptionsRow}>
                  {['Any', '50+', '100+', '500+'].map((count) => (
                    <TouchableOpacity
                      key={count}
                      style={[
                        styles.filterOption,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5' },
                        activeFilters.tapCount === count && styles.filterOptionActive
                      ]}
                      onPress={() => setActiveFilters(prev => ({ ...prev, tapCount: count }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        { color: isDark ? theme.text : '#000' },
                        activeFilters.tapCount === count && styles.filterOptionTextActive
                      ]}>{count}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Hours */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Hours</Text>
                <View style={styles.filterOptionsRow}>
                  {['Any', 'Open now', 'Custom'].map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={[
                        styles.filterOption,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5' },
                        activeFilters.hours === hours && styles.filterOptionActive
                      ]}
                      onPress={() => setActiveFilters(prev => ({ ...prev, hours }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        { color: isDark ? theme.text : '#000' },
                        activeFilters.hours === hours && styles.filterOptionTextActive
                      ]}>{hours}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Cuisine (if applicable) */}
              {filterConfig.cuisines && (
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>Cuisine</Text>
                  <View style={styles.cuisineGrid}>
                    {filterConfig.cuisines.map((cuisine) => (
                      <TouchableOpacity
                        key={cuisine.name}
                        style={[
                          styles.cuisineOption,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5' },
                          activeFilters.cuisine === cuisine.name && styles.cuisineOptionActive
                        ]}
                        onPress={() => setActiveFilters(prev => ({ ...prev, cuisine: cuisine.name }))}
                      >
                        {cuisine.icon && <Ionicons name={cuisine.icon as any} size={20} color={isDark ? theme.text : '#333'} />}
                        <Text style={[
                          styles.cuisineOptionText,
                          { color: isDark ? theme.text : '#000' },
                          activeFilters.cuisine === cuisine.name && styles.cuisineOptionTextActive
                        ]}>{cuisine.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* More Filters */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: isDark ? theme.text : '#000' }]}>More filters</Text>
                <View style={styles.moreFiltersWrap}>
                  {filterConfig.moreFilters.map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.moreFilterChip,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5' },
                        activeFilters.moreFilters.includes(filter) && styles.moreFilterChipActive
                      ]}
                      onPress={() => toggleMoreFilter(filter)}
                    >
                      <Text style={[
                        styles.moreFilterChipText,
                        { color: isDark ? theme.text : '#000' },
                        activeFilters.moreFilters.includes(filter) && styles.moreFilterChipTextActive
                      ]}>{filter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={[styles.filterModalButtons, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : '#eee' }]}>
              <TouchableOpacity style={[styles.filterClearBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#e8f4f8' }]} onPress={clearFilters}>
                <Text style={[styles.filterClearBtnText, { color: '#0A84FF' }]}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterApplyBtn} onPress={applyFilters}>
                <Text style={styles.filterApplyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

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
    marginTop: 6,
    marginBottom: 14,
    fontSize: 26, // Further reduced for smaller screens
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
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
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 16,
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
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
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
  mapCategoryOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 116 : 76,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  mapCategoryContent: {
    paddingHorizontal: 16,
  },
  mapCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapCategoryChipActive: {
    backgroundColor: '#0A84FF',
  },
  mapCategoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mapCategoryChipTextActive: {
    color: '#fff',
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
  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#fff',
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
  categoryResultsHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryResultsTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryResultsTitle: {
    fontSize: 28,
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
  quickFiltersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
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

  // ===== NEW SECTIONS STYLES =====
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  featureSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A84FF',
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

  // How TavvY Works Section
  howItWorksSection: {
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },
  howItWorksTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  howItWorksSubtitle: {
    fontSize: 14,
    marginBottom: 16,
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
});
