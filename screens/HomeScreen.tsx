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
  Platform,
  Alert,
} from 'react-native';
// Clipboard functionality - will show address in alert for now
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
  PARKING_LOCATION: '@tavvy_parking_location',
  SAVED_LOCATIONS: '@tavvy_saved_locations',
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
  savedAt: number; // timestamp
  note?: string;
}

interface SavedLocation {
  id: string;
  name: string; // e.g., "Home", "Work", "Gym"
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
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [targetLocation, setTargetLocation] = useState<[number, number] | null>(null);
  const [searchedAddressName, setSearchedAddressName] = useState<string>('');
  const [searchedAddress, setSearchedAddress] = useState<AddressInfo | null>(null);
  
  // Location states
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  
  // Map states
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('osm');
  
  // Personalization states
  const [greeting, setGreeting] = useState('');
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  
  // Parking and saved locations
  const [parkingLocation, setParkingLocation] = useState<ParkingLocation | null>(null);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
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

  // Handle camera movement when targetLocation changes
  useEffect(() => {
    if (targetLocation && viewMode === 'map') {
      console.log('Moving camera to targetLocation:', targetLocation);
      
      // Use multiple attempts with increasing delays to ensure map is ready
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
        // Fallback to Google Maps web
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

  // Debounce timer for geocoding
  const geocodeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      generateSearchSuggestions(searchQuery);
    } else {
      setSearchSuggestions([]);
      setIsSearchingAddress(false);
    }
  }, [searchQuery, places, recentSearches]);

  // Geocode address using Nominatim (OpenStreetMap)
  const geocodeAbortRef = useRef<AbortController | null>(null);
  
  const geocodeAddress = async (query: string): Promise<SearchSuggestion[]> => {
    // Cancel any pending request
    if (geocodeAbortRef.current) {
      geocodeAbortRef.current.abort();
    }
    
    // Create new abort controller
    geocodeAbortRef.current = new AbortController();
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4&addressdetails=1&countrycodes=us`,
        {
          headers: {
            'User-Agent': 'TavvY-App/1.0',
            'Accept': 'application/json',
          },
          signal: geocodeAbortRef.current.signal,
        }
      );
      
      if (!response.ok) return [];
      
      const results: GeocodingResult[] = await response.json();
      
      return results.map((result, index) => {
        // Format a nice display name
        const parts = result.display_name.split(', ');
        const shortName = parts.slice(0, 3).join(', ');
        
        return {
          id: `address-${index}-${result.lat}`,
          type: 'address' as const,
          title: shortName,
          subtitle: result.type === 'house' ? 'Address' : 
                   result.type === 'city' ? 'City' :
                   result.type === 'state' ? 'State' : 'Location',
          icon: 'map',
          data: {
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            displayName: result.display_name,
            road: result.address?.road,
            city: result.address?.city || result.address?.town || result.address?.village,
            state: result.address?.state,
            country: result.address?.country,
            postcode: result.address?.postcode,
          },
        };
      });
    } catch (error: any) {
      // Don't log abort errors
      if (error.name !== 'AbortError') {
        console.log('Geocoding error:', error);
      }
      return [];
    }
  };

  const generateSearchSuggestions = async (query: string) => {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // 1. Match places by name AND address
    const matchingPlaces = places.filter(place =>
      place.name.toLowerCase().includes(queryLower) ||
      (place.address_line1 && place.address_line1.toLowerCase().includes(queryLower)) ||
      (place.city && place.city.toLowerCase().includes(queryLower))
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
        subtitle: 'City',
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

    // Set initial suggestions immediately
    setSearchSuggestions(suggestions);

    // 5. Geocode address if query looks like an address (3+ chars, no exact place match)
    if (query.length >= 3 && matchingPlaces.length < 3) {
      // Clear previous timer
      if (geocodeTimerRef.current) {
        clearTimeout(geocodeTimerRef.current);
      }
      
      // Debounce geocoding to avoid too many API calls
      geocodeTimerRef.current = setTimeout(async () => {
        setIsSearchingAddress(true);
        const addressSuggestions = await geocodeAddress(query);
        setIsSearchingAddress(false);
        
        if (addressSuggestions.length > 0) {
          // Add address suggestions to existing ones
          setSearchSuggestions(prev => {
            // Filter out old address suggestions
            const nonAddressSuggestions = prev.filter(s => s.type !== 'address');
            return [...nonAddressSuggestions, ...addressSuggestions];
          });
        }
      }, 350); // 350ms debounce for faster response
    }
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
        
      case 'address':
        // Go to map mode centered on geocoded address
        console.log('ADDRESS SELECTED:', suggestion.title, suggestion.data);
        const addressCoords: [number, number] = [suggestion.data.lon, suggestion.data.lat];
        const addressName = suggestion.title;
        
        // Save to recent searches
        saveRecentSearch(addressName);
        
        // Create full address info object
        const addressInfo: AddressInfo = {
          displayName: suggestion.data.displayName || addressName,
          shortName: addressName,
          coordinates: addressCoords,
          road: suggestion.data.road,
          city: suggestion.data.city,
          state: suggestion.data.state,
          country: suggestion.data.country,
          postcode: suggestion.data.postcode,
        };
        
        // Set all states before switching view mode
        setSearchedAddressName(addressName);
        setSearchQuery(addressName);
        setTargetLocation(addressCoords);
        setSearchedAddress(addressInfo);
        
        // Switch to map mode
        setViewMode('map');
        
        console.log('States set - searchQuery:', addressName, 'targetLocation:', addressCoords);
        break;
        
      case 'recent':
        // Re-run the recent search - need to geocode if it looks like an address
        const recentQuery = suggestion.data.query;
        setSearchQuery(recentQuery);
        
        // Check if this looks like an address (contains numbers or common address words)
        const looksLikeAddress = /\d/.test(recentQuery) || 
          /\b(street|st|avenue|ave|road|rd|blvd|boulevard|drive|dr|lane|ln|way|court|ct)\b/i.test(recentQuery);
        
        if (looksLikeAddress) {
          // Geocode the address and then navigate
          setIsSearchingAddress(true);
          geocodeAddress(recentQuery).then(results => {
            setIsSearchingAddress(false);
            if (results.length > 0) {
              // Use the first result
              const firstResult = results[0];
              const coords: [number, number] = [firstResult.data.lon, firstResult.data.lat];
              
              const addressInfo: AddressInfo = {
                displayName: firstResult.data.displayName || firstResult.title,
                shortName: firstResult.title,
                coordinates: coords,
                road: firstResult.data.road,
                city: firstResult.data.city,
                state: firstResult.data.state,
                country: firstResult.data.country,
                postcode: firstResult.data.postcode,
              };
              
              setSearchedAddressName(firstResult.title);
              setSearchQuery(firstResult.title);
              setTargetLocation(coords);
              setSearchedAddress(addressInfo);
              setViewMode('map');
            } else {
              // No geocoding results, just go to map
              saveRecentSearch(recentQuery);
              setViewMode('map');
            }
          });
        } else {
          // Not an address, just search normally
          saveRecentSearch(recentQuery);
          setViewMode('map');
        }
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
    // Only filter when in map mode or when category/places change
    if (viewMode === 'map' || selectedCategory !== 'All') {
      filterPlaces();
    }
  }, [selectedCategory, places, viewMode]);
  
  // Separate effect for search query changes (debounced)
  useEffect(() => {
    if (viewMode === 'map' && searchQuery.trim()) {
      const timer = setTimeout(() => {
        filterPlaces();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

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
    setTargetLocation(null);
    setSearchedAddressName('');
    setSearchedAddress(null);
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
    // Show suggestions when focused, even if empty (to show "Search for..." option)
    if (!isSearchFocused) {
      return null;
    }

    // If no suggestions and no query, don't show anything
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
        
        {/* Loading indicator for address search */}
        {isSearchingAddress && (
          <View style={styles.suggestionItem}>
            <View style={[styles.suggestionIconContainer, styles.suggestionIconAddress]}>
              <ActivityIndicator size="small" color="#AF52DE" />
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text style={styles.suggestionTitle}>Searching addresses...</Text>
              <Text style={styles.suggestionSubtitle}>Looking up location</Text>
            </View>
          </View>
        )}
        
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
  // RENDER: INSIGHTS SECTION
  // ============================================

  const renderInsightsSection = () => {
    // Generate personalized insights based on user behavior
    const insights = [
      {
        id: 'discover',
        icon: 'compass',
        iconColor: '#FF9500',
        bgColor: '#FFF3E0',
        title: 'Discover New Places',
        subtitle: 'Explore highly-rated spots in your area',
        action: () => switchToMapMode(),
      },
      {
        id: 'trending',
        icon: 'trending-up',
        iconColor: '#34C759',
        bgColor: '#E8F5E9',
        title: 'Trending This Week',
        subtitle: `${places.length} places getting attention nearby`,
        action: () => switchToMapMode(),
      },
      {
        id: 'tip',
        icon: 'bulb',
        iconColor: '#AF52DE',
        bgColor: '#F3E5F5',
        title: 'TavvY Tip',
        subtitle: 'Tap signals to see what makes places special',
        action: null,
      },
      {
        id: 'parking',
        icon: 'car',
        iconColor: '#007AFF',
        bgColor: '#E3F2FD',
        title: parkingLocation ? 'Your Car is Saved' : 'Save Your Parking',
        subtitle: parkingLocation 
          ? `Parked ${getParkingDuration()} at ${parkingLocation.address || 'saved location'}`
          : 'Never forget where you parked again',
        action: parkingLocation ? navigateToParking : () => saveParkingLocation(),
      },
    ];

    // Filter out parking insight if no parking and user hasn't used the feature
    const filteredInsights = insights.filter(i => {
      if (i.id === 'parking' && !parkingLocation) {
        // Only show parking tip occasionally
        return currentInsightIndex % 3 === 0;
      }
      return true;
    });

    const currentInsight = filteredInsights[currentInsightIndex % filteredInsights.length];

    return (
      <View style={styles.insightsSection}>
        <TouchableOpacity
          style={[styles.insightCard, { backgroundColor: currentInsight.bgColor }]}
          onPress={currentInsight.action || undefined}
          activeOpacity={currentInsight.action ? 0.7 : 1}
        >
          <View style={styles.insightIconContainer}>
            <Ionicons name={currentInsight.icon as any} size={24} color={currentInsight.iconColor} />
          </View>
          <View style={styles.insightTextContainer}>
            <Text style={styles.insightTitle}>{currentInsight.title}</Text>
            <Text style={styles.insightSubtitle}>{currentInsight.subtitle}</Text>
          </View>
          {currentInsight.action && (
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          )}
        </TouchableOpacity>
        
        {/* Dots indicator */}
        <View style={styles.insightDotsContainer}>
          {filteredInsights.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.insightDot,
                index === currentInsightIndex % filteredInsights.length && styles.insightDotActive,
              ]}
              onPress={() => setCurrentInsightIndex(index)}
            />
          ))}
        </View>
      </View>
    );
  };

  // Auto-rotate insights every 5 seconds (only in content mode)
  useEffect(() => {
    if (viewMode !== 'content') return;
    
    const timer = setInterval(() => {
      setCurrentInsightIndex(prev => prev + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [viewMode]);

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

    const handleDirections = () => {
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
      // Show address in alert - user can manually copy
      // To enable clipboard: npx expo install expo-clipboard, then rebuild
      Alert.alert(
        'Address',
        searchedAddress.displayName,
        [
          { text: 'OK', style: 'default' },
        ]
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

    // Calculate distance from user location
    const getDistance = (): string => {
      if (!userLocation) return '';
      const [lon1, lat1] = userLocation;
      const [lon2, lat2] = searchedAddress.coordinates;
      
      const R = 3959; // Earth's radius in miles
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

    // Get nearby places from our database
    const nearbyPlaces = places.filter(place => {
      const [lon, lat] = searchedAddress.coordinates;
      const placeLat = place.latitude || place.lat || 0;
      const placeLon = place.longitude || place.lng || 0;
      const distance = Math.sqrt(Math.pow(placeLat - lat, 2) + Math.pow(placeLon - lon, 2));
      return distance < 0.01; // Roughly within 1km
    }).slice(0, 3);

    return (
      <View style={styles.addressCardContainer}>
        {/* Address Header */}
        <View style={styles.addressCardHeader}>
          <View style={styles.addressIconContainer}>
            <Ionicons name="location" size={28} color="#AF52DE" />
          </View>
          <View style={styles.addressTextContainer}>
            <Text style={styles.addressCardTitle} numberOfLines={2}>
              {searchedAddress.shortName}
            </Text>
            {searchedAddress.city && (
              <Text style={styles.addressCardSubtitle}>
                {searchedAddress.city}{searchedAddress.state ? `, ${searchedAddress.state}` : ''}
              </Text>
            )}
            {userLocation && (
              <Text style={styles.addressDistance}>{getDistance()}</Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.addressActionsRow}>
          <TouchableOpacity style={styles.addressActionButton} onPress={handleDirections}>
            <View style={[styles.addressActionIcon, { backgroundColor: '#007AFF' }]}>
              <Ionicons name="navigate" size={20} color="#fff" />
            </View>
            <Text style={styles.addressActionText}>Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressActionButton} onPress={handleShare}>
            <View style={[styles.addressActionIcon, { backgroundColor: '#34C759' }]}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.addressActionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressActionButton} onPress={handleSaveParking}>
            <View style={[styles.addressActionIcon, { backgroundColor: '#FF9500' }]}>
              <Ionicons name="car" size={20} color="#fff" />
            </View>
            <Text style={styles.addressActionText}>Park Here</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addressActionButton} onPress={handleCopyAddress}>
            <View style={[styles.addressActionIcon, { backgroundColor: '#8E8E93' }]}>
              <Ionicons name="copy-outline" size={20} color="#fff" />
            </View>
            <Text style={styles.addressActionText}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Save Location Button */}
        <TouchableOpacity style={styles.saveLocationButton} onPress={handleSaveLocation}>
          <Ionicons name="bookmark-outline" size={20} color="#007AFF" />
          <Text style={styles.saveLocationText}>Save to My Places</Text>
        </TouchableOpacity>

        {/* Nearby TavvY Places */}
        {nearbyPlaces.length > 0 && (
          <View style={styles.nearbySection}>
            <Text style={styles.nearbySectionTitle}>Nearby on TavvY</Text>
            {nearbyPlaces.map((place) => (
              <TouchableOpacity
                key={place.id}
                style={styles.nearbyPlaceItem}
                onPress={() => handlePlacePress(place)}
              >
                <View style={styles.nearbyPlaceIcon}>
                  <Ionicons
                    name={
                      place.category === 'Restaurants' ? 'restaurant' :
                      place.category === 'Cafes' ? 'cafe' :
                      place.category === 'Bars' ? 'beer' : 'storefront'
                    }
                    size={16}
                    color="#666"
                  />
                </View>
                <View style={styles.nearbyPlaceInfo}>
                  <Text style={styles.nearbyPlaceName}>{place.name}</Text>
                  <Text style={styles.nearbyPlaceCategory}>{place.category}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Full Address */}
        <View style={styles.fullAddressSection}>
          <Text style={styles.fullAddressLabel}>Full Address</Text>
          <Text style={styles.fullAddressText}>{searchedAddress.displayName}</Text>
        </View>
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
        
        {/* Signals - 2x2 Grid with fixed widths */}
        {place.signals && place.signals.length > 0 && (
          <View style={styles.signalsContainer}>
            <View style={styles.signalsRow}>
              {sortSignalsForDisplay(place.signals).slice(0, 2).map((signal, index) => (
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
            {sortSignalsForDisplay(place.signals).length > 2 && (
              <View style={styles.signalsRow}>
                {sortSignalsForDisplay(place.signals).slice(2, 4).map((signal, index) => (
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
          <Ionicons name="expand-outline" size={16} color="#007AFF" />
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
              {/* Insights Section - Rotating personalized content */}
              {renderInsightsSection()}
              
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
          centerCoordinate={targetLocation || userLocation || [-97.7431, 30.2672]}
          zoomLevel={targetLocation ? 16 : 14}
          animationMode="flyTo"
          animationDuration={800}
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

        {filteredPlaces
          .filter((place) => {
            // Validate coordinates are valid numbers
            const lon = place.longitude || place.lng;
            const lat = place.latitude || place.lat;
            return typeof lon === 'number' && typeof lat === 'number' && 
                   !isNaN(lon) && !isNaN(lat) && 
                   lon !== 0 && lat !== 0;
          })
          .map((place) => (
          <MapLibreGL.PointAnnotation
            key={place.id}
            id={place.id}
            coordinate={[place.longitude || place.lng, place.latitude || place.lat]}
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
        <View style={[styles.mapSearchBar, targetLocation && styles.mapSearchBarWithAddress]}>
          {targetLocation ? (
            <Ionicons name="location" size={20} color="#AF52DE" />
          ) : (
            <Ionicons name="search" size={20} color="#999" />
          )}
          <TextInput
            style={styles.mapSearchInput}
            placeholder="Search places or locations"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              // Clear target location if user starts typing something new
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

      {/* Bottom Sheet with Place Cards or Address Card */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={searchedAddress ? [40, '40%', '65%'] : [40, '35%', '65%']}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        enablePanDownToClose={false}
      >
        {searchedAddress ? (
          // Show Address Info Card when viewing a searched address
          <ScrollView 
            style={styles.addressCardScrollView}
            showsVerticalScrollIndicator={false}
          >
            {renderAddressInfoCard()}
          </ScrollView>
        ) : (
          // Show place cards for normal browsing
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
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  mapPeekText: {
    color: '#333',
    fontSize: 13,
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
    maxHeight: 50,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    height: 36,
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
  mapSearchBarWithAddress: {
    borderWidth: 2,
    borderColor: '#AF52DE',
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
  targetLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 12,
    gap: 8,
  },
  signalsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  signalPill: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  
  // Address Card Styles
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
    color: '#000',
    marginBottom: 4,
  },
  addressCardSubtitle: {
    fontSize: 15,
    color: '#666',
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
    color: '#666',
    fontWeight: '500',
  },
  saveLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
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
    color: '#000',
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
    backgroundColor: '#F2F2F7',
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
    color: '#000',
  },
  nearbyPlaceCategory: {
    fontSize: 13,
    color: '#666',
  },
  fullAddressSection: {
    backgroundColor: '#F9F9F9',
    padding: 14,
    borderRadius: 12,
  },
  fullAddressLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fullAddressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  
  // Parking Marker Styles
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
  
  // Insights Section Styles
  insightsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  insightIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  insightSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  insightDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D1D6',
    marginHorizontal: 4,
  },
  insightDotActive: {
    backgroundColor: '#007AFF',
    width: 18,
  },
});
