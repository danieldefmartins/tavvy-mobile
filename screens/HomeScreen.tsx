import React, { useState, useEffect, useRef, useMemo } from 'react';
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
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

// OpenFreeMap styles - optimized for Tavvy
const MAP_STYLES = {
  liberty: {
    name: 'Standard',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    icon: 'map',
  },
  bright: {
    name: 'Bright',
    url: 'https://tiles.openfreemap.org/styles/bright',
    icon: 'sunny',
  },
  positron: {
    name: 'Minimal',
    url: 'https://tiles.openfreemap.org/styles/positron',
    icon: 'contrast',
  },
};

// Mock data for testing
const MOCK_PLACES = [
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
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
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
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800',
    ],
  },
  {
    id: '3',
    name: 'The Tipsy Pig',
    address_line1: '2231 Chestnut St',
    city: 'San Francisco',
    state_region: 'CA',
    category: 'Bars',
    primary_category: 'Gastropub',
    latitude: 37.7949,
    longitude: -122.4294,
    current_status: 'Open',
    phone: '415-555-0125',
    website: 'https://tipsypig.com',
    signals: [
      { bucket: 'Great Drinks', tap_total: 156 },
      { bucket: 'Affordable', tap_total: 67 },
      { bucket: 'Lively', tap_total: 92 },
      { bucket: 'Loud', tap_total: 34 },
    ],
    photos: [
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800',
      'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800',
    ],
  },
];

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

interface Weather {
  temp: number;
  condition: string;
  icon: string;
}

export default function HomeScreen({ navigation }: { navigation: any } ) {
  const [places, setPlaces] = useState<Place[]>(MOCK_PLACES);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(MOCK_PLACES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('liberty');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showWeatherPopup, setShowWeatherPopup] = useState(false);
  const [showSearchAreaBtn, setShowSearchAreaBtn] = useState(false);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [weather, setWeather] = useState<Weather>({
    temp: 72,
    condition: 'Sunny',
    icon: 'sunny',
  });
  
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  const snapPoints = useMemo(() => ['8%', '50%', '90%'], []);

  const categories = ['All', 'Restaurants', 'Cafes', 'Bars', 'Shopping'];

  useEffect(() => {
    MapLibreGL.setAccessToken(null);
    requestLocationPermission();
    fetchPlaces();
  }, []);

  useEffect(() => {
    filterPlaces();
  }, [searchQuery, selectedCategory, places]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation([location.coords.longitude, location.coords.latitude]);
      } else {
        setUserLocation([-97.7431, 30.2672]); // Default to Austin, TX
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setUserLocation([-97.7431, 30.2672]); // Default to Austin, TX
    }
  };

  // UPDATED: fetchPlaces now uses place_review_signal_taps table
  const fetchPlaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: placesData, error: placesError } = await supabase
        .from('places')
        .select('*')
        .order('name');

      if (placesError) {
        console.warn('Supabase error, using mock data:', placesError);
        alert(`Database Error: ${placesError.message}`); // ADDED ALERT
        setPlaces(MOCK_PLACES);
        setFilteredPlaces(MOCK_PLACES);
        return;
      }

      if (placesData && placesData.length > 0) {
        // Fetch all signal taps for these places
        const placeIds = placesData.map(p => p.id);
        
        const { data: signalTaps } = await supabase
          .from('place_review_signal_taps')
          .select('place_id, signal_id, intensity')
          .in('place_id', placeIds);

        // Fetch review_items to get labels
        const { data: reviewItems } = await supabase
          .from('review_items')
          .select('id, label, signal_type');

        const itemsMap = new Map(
          (reviewItems || []).map(item => [item.id, { label: item.label, type: item.signal_type }])
        );

        // Aggregate signals per place
        const signalsByPlace: Record<string, Record<string, number>> = {};
        (signalTaps || []).forEach(tap => {
          if (!signalsByPlace[tap.place_id]) {
            signalsByPlace[tap.place_id] = {};
          }
          if (!signalsByPlace[tap.place_id][tap.signal_id]) {
            signalsByPlace[tap.place_id][tap.signal_id] = 0;
          }
          signalsByPlace[tap.place_id][tap.signal_id] += tap.intensity;
        });

        // Attach signals to places
        const placesWithSignals = placesData
          .filter(place => (place.latitude || place.lat) && (place.longitude || place.lng))
          .map(place => {
            // Ensure latitude/longitude are set (fallback to lat/lng)
            if (!place.latitude && place.lat) place.latitude = place.lat;
            if (!place.longitude && place.lng) place.longitude = place.lng;

            const placeSignals = signalsByPlace[place.id] || {};
          const signals: Signal[] = Object.entries(placeSignals)
            .map(([signalId, tapTotal]) => {
              const item = itemsMap.get(signalId);
              return {
                bucket: item?.label || 'Unknown',
                tap_total: tapTotal,
              };
            })
            .sort((a, b) => b.tap_total - a.tap_total);

          return {
            ...place,
            signals,
          };
        });

        setPlaces(placesWithSignals);
        setFilteredPlaces(placesWithSignals);
      } else {
        setPlaces(MOCK_PLACES);
        setFilteredPlaces(MOCK_PLACES);
      }
    } catch (err: any) {
      console.error('Error fetching places:', err);
      alert(`Unexpected Error: ${err.message || JSON.stringify(err)}`); // ADDED ALERT
      setPlaces(MOCK_PLACES);
      setFilteredPlaces(MOCK_PLACES);
    } finally {
      setLoading(false);
    }
  };

  const filterPlaces = () => {
    let filtered = places;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(
        (place) =>
          place.category?.toLowerCase() === selectedCategory.toLowerCase() ||
          place.primary_category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (place) =>
          place.name.toLowerCase().includes(query) ||
          place.city?.toLowerCase().includes(query) ||
          place.category?.toLowerCase().includes(query)
      );
    }

    setFilteredPlaces(filtered);
  };

  const handleMarkerPress = (place: Place) => {
    setSelectedPlace(place);
    bottomSheetRef.current?.snapToIndex(1);
    
    cameraRef.current?.setCamera({
      centerCoordinate: [place.longitude, place.latitude],
      zoomLevel: 15,
      animationDuration: 1000,
    });
  };

  const handleRegionChange = async (feature: any) => {
    setMapRegion(feature);
    setShowSearchAreaBtn(true);
  };

  const handleSearchArea = () => {
    setShowSearchAreaBtn(false);
    if (mapRegion) {
      // In a real implementation, we would pass the bounds to fetchPlaces
      // For now, we just re-fetch everything which includes the new seeded place
      fetchPlaces();
    }
  };

  const handleMyLocation = () => {
    if (userLocation) {
      cameraRef.current?.setCamera({
        centerCoordinate: userLocation,
        zoomLevel: 14,
        animationDuration: 1000,
      });
    }
  };

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleWebsite = (website?: string) => {
    if (website) {
      Linking.openURL(website);
    }
  };

  const handlePhotos = (place: Place) => {
    console.log('Open photos for:', place.name);
  };

  const handleShare = async (place: Place) => {
    try {
      await Share.share({
        message: `Check out ${place.name} on Tavvy!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getMarkerColor = (category: string) => {
    const colors: Record<string, string> = {
      restaurants: '#FF6B6B',
      cafes: '#4ECDC4',
      bars: '#FFD93D',
      shopping: '#95E1D3',
    };
    return colors[category.toLowerCase()] || '#007AFF';
  };

  const getSignalType = (bucket: string): 'positive' | 'neutral' | 'negative' => {
    const bucketLower = bucket.toLowerCase();
    
    if (bucketLower.includes('great') || bucketLower.includes('excellent') || 
        bucketLower.includes('amazing') || bucketLower.includes('affordable')) {
      return 'positive';
    }
    
    if (bucketLower.includes('pricey') || bucketLower.includes('expensive') || 
        bucketLower.includes('crowded') || bucketLower.includes('loud') ||
        bucketLower.includes('slow')) {
      return 'negative';
    }
    
    return 'neutral';
  };

  const getSignalColor = (bucket: string) => {
    const type = getSignalType(bucket);
    
    if (type === 'positive') return '#3b82f6';
    if (type === 'negative') return '#f97316';
    return '#6b7280';
  };

  const sortSignalsForDisplay = (signals: Signal[]): Signal[] => {
    const positive = signals.filter(s => getSignalType(s.bucket) === 'positive');
    const neutral = signals.filter(s => getSignalType(s.bucket) === 'neutral');
    const negative = signals.filter(s => getSignalType(s.bucket) === 'negative');
    
    const result: Signal[] = [];
    result.push(...positive.slice(0, 2));
    if (neutral.length > 0) {
      result.push(neutral[0]);
    }
    if (negative.length > 0) {
      result.push(negative[0]);
    }
    
    return result;
  };

  const PhotoCarousel = ({ photos }: { photos?: string[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const displayPhotos = photos && photos.length > 0 ? photos : [null, null, null];

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
      </View>
    );
  };

  const renderPlaceCard = ({ item: place }: { item: Place }) => {
    const fullAddress = place.city && place.state_region
      ? `${place.address_line1}, ${place.city}, ${place.state_region}`
      : place.address_line1;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          navigation.navigate('PlaceDetails', { placeId: place.id });
          bottomSheetRef.current?.close();
        }}
        activeOpacity={0.9}
      >
        <PhotoCarousel photos={place.photos} />

        <View style={styles.cardContent}>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.placeAddress}>{fullAddress}</Text>

          {place.signals && place.signals.length > 0 && (
            <View style={styles.signalsContainer}>
              {sortSignalsForDisplay(place.signals).map((signal, index) => (
                <View
                  key={index}
                  style={[
                    styles.signalBadge,
                    styles.signalBadgeFixed,
                    { backgroundColor: getSignalColor(signal.bucket) },
                  ]}
                >
                  <Text style={styles.signalText} numberOfLines={1}>
                    {signal.bucket} ×{signal.tap_total}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.metaInfo}>
            <Text style={styles.metaText}>{place.category}</Text>
            <Text style={styles.metaDot}> • </Text>
            <Text style={styles.metaText}>$$</Text>
            {place.distance && (
              <>
                <Text style={styles.metaDot}> • </Text>
                <Text style={styles.metaText}>
                  {place.distance.toFixed(1)} mi
                </Text>
              </>
            )}
            {place.current_status && (
              <>
                <Text style={styles.metaDot}> • </Text>
                <Text style={[styles.metaText, styles.statusOpen]}>
                  {place.current_status}
                </Text>
              </>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCall(place.phone)}
            >
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleWebsite(place.website)}
            >
              <Ionicons name="globe-outline" size={20} color="#666" />
              <Text style={styles.actionButtonText}>Website</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePhotos(place)}
            >
              <Ionicons name="images-outline" size={20} color="#666" />
              <Text style={styles.actionButtonText}>Photos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleShare(place)}
            >
              <Ionicons name="share-outline" size={20} color="#666" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00bcd4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={MAP_STYLES[mapStyle].url}
        logoEnabled={false}
        attributionEnabled={false}
        onRegionDidChange={handleRegionChange}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={userLocation || [-97.7431, 30.2672]} // Default to Austin, TX
          animationMode="flyTo"
          animationDuration={2000}
        />

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
            coordinate={[place.longitude, place.latitude]}
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
                    place.category.toLowerCase() === 'restaurants'
                      ? 'restaurant'
                      : place.category.toLowerCase() === 'cafes'
                      ? 'cafe'
                      : place.category.toLowerCase() === 'bars'
                      ? 'beer'
                      : 'location'
                  }
                  size={20}
                  color="#fff"
                />
              </View>
            </View>
          </MapLibreGL.PointAnnotation>
        ))}
      </MapLibreGL.MapView>

      <View style={styles.searchOverlay}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search places or locations"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Ionicons
                name={
                  category === 'All'
                    ? 'star'
                    : category === 'Restaurants'
                    ? 'restaurant'
                    : category === 'Cafes'
                    ? 'cafe'
                    : category === 'Bars'
                    ? 'beer'
                    : 'cart'
                }
                size={12}
                color={selectedCategory === category ? '#fff' : '#666'}
                style={{ marginRight: 4 }}
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


      </View>

      {/* Search This Area Button */}
      {showSearchAreaBtn && (
        <TouchableOpacity style={styles.searchAreaBtn} onPress={handleSearchArea}>
          <Text style={styles.searchAreaText}>Search this area</Text>
        </TouchableOpacity>
      )}

      {/* Weather Popup */}
      {showWeatherPopup && (
        <View style={styles.weatherPopup}>
          <View style={styles.weatherHeader}>
            <Text style={styles.weatherTitle}>Current Weather</Text>
            <TouchableOpacity onPress={() => setShowWeatherPopup(false)}>
              <Ionicons name="close-circle" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.weatherContent}>
            <Ionicons name={weather.icon as any} size={48} color="#FF9500" />
            <Text style={styles.weatherBigTemp}>{weather.temp}°</Text>
            <Text style={styles.weatherCondition}>{weather.condition}</Text>
          </View>
          <View style={styles.weatherDetails}>
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailLabel}>Humidity</Text>
              <Text style={styles.weatherDetailValue}>45%</Text>
            </View>
            <View style={styles.weatherDetailItem}>
              <Text style={styles.weatherDetailLabel}>Wind</Text>
              <Text style={styles.weatherDetailValue}>8 mph</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomRightControls}>
        {showStylePicker && (
          <View style={styles.stylePickerContainer}>
            {Object.entries(MAP_STYLES).map(([key, style]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.styleOption,
                  mapStyle === key && styles.styleOptionActive,
                ]}
                onPress={() => {
                  setMapStyle(key as keyof typeof MAP_STYLES);
                  setShowStylePicker(false);
                }}
              >
                <Ionicons
                  name={style.icon as any}
                  size={20}
                  color={mapStyle === key ? '#007AFF' : '#666'}
                />
                <Text
                  style={[
                    styles.styleOptionText,
                    mapStyle === key && styles.styleOptionTextActive,
                  ]}
                >
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.combinedControlCard}>
          <TouchableOpacity
            style={styles.iconOnlyButton}
            onPress={handleMyLocation}
          >
            <Ionicons name="navigate" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.horizontalDivider} />

          <TouchableOpacity
            style={styles.iconOnlyButton}
            onPress={() => setShowStylePicker(!showStylePicker)}
          >
            <Ionicons name="layers" size={22} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.horizontalDivider} />

          <TouchableOpacity
            style={styles.iconOnlyButton}
            onPress={() => setShowWeatherPopup(!showWeatherPopup)}
          >
            <Ionicons name={weather.icon as any} size={22} color="#FF9500" />
          </TouchableOpacity>
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetFlatList
          data={filteredPlaces}
          renderItem={renderPlaceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.bottomSheetContent}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  searchAreaBtn: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  searchAreaText: {
    fontWeight: '600',
    color: '#000',
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#fff',
  },
  searchOverlay: {
    zIndex: 10,
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  searchBar: {
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
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  categoriesScroll: {
    marginTop: 12,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  categoryChip: {
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
  categoryChipActive: {
    backgroundColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  weatherPopup: {
    position: 'absolute',
    bottom: 240,
    right: 16,
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  weatherContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherBigTemp: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginVertical: 4,
  },
  weatherCondition: {
    fontSize: 16,
    color: '#666',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
  },
  weatherDetailItem: {
    alignItems: 'center',
  },
  weatherDetailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  weatherDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bottomRightControls: {
    position: 'absolute',
    bottom: 180,
    right: 16,
    alignItems: 'flex-end',
  },
  combinedControlCard: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Apple-style frosted look
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  iconOnlyButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalDivider: {
    height: 1,
    width: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: 2,
  },
  stylePickerContainer: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  styleOptionActive: {
    backgroundColor: '#f0f0f0',
  },
  styleOptionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  styleOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  locationButton: {
    marginTop: 12,
  },
  bottomSheetBackground: {
    backgroundColor: '#ebebeb',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetIndicator: {
    backgroundColor: '#ccc',
    width: 40,
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  carouselContainer: {
    height: 140,
    position: 'relative',
  },
  carouselImage: {
    width: width - 48,
    height: 140,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#000',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardContent: {
    padding: 12,
  },
  placeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  signalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  signalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 6,
  },
  signalBadgeFixed: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  metaDot: {
    fontSize: 15,
    color: '#666',
  },
  statusOpen: {
    color: '#10b981',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionButtonText: {
    marginTop: 3,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});