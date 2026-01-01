import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Linking,
  Share,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapLibreGL from '@maplibre/maplibre-react-native';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '../lib/supabase';

MapLibreGL.setAccessToken(null);

const { width, height } = Dimensions.get('window');

interface Signal {
  name: string;
  emoji: string;
  color: string;
  count: number;
}

interface Place {
  id: string;
  name: string;
  address_line1: string;
  address_line2?: string;
  city?: string;
  state_region?: string;
  postal_code?: string;
  category?: string;
  primary_category?: string;
  description?: string;
  phone_e164?: string;
  lat?: number;
  lng?: number;
  cover_image_url?: string;
  current_status?: string;
  signals?: Signal[];
}

export default function HomeScreen({ navigation }: { navigation: any }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapLibreGL.MapView>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);

  const categories = ['All', 'Restaurants', 'Cafes', 'Bars', 'Shopping'];

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    filterPlaces();
  }, [searchQuery, selectedCategory, places]);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('places')
        .select('*')
        .order('name');

      if (fetchError) throw fetchError;

      setPlaces(data || []);
      setFilteredPlaces(data || []);
    } catch (err) {
      console.error('Error fetching places:', err);
      setError('Failed to load places');
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

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    if (place.lat && place.lng && cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: [place.lng, place.lat],
        zoomLevel: 15,
        animationDuration: 1000,
      });
    }
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleWebsite = (place: Place) => {
    console.log('Website for:', place.name);
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

  const getSignalColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: '#53b2f6',
      gray: '#6b7280',
      orange: '#f97316',
    };
    return colors[color] || '#6b7280';
  };

  const renderPlaceCard = ({ item: place }: { item: Place }) => {
    const addressParts = [place.address_line1, place.city, place.state_region].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Address not available';
    const distance = place.lat && place.lng ? '0.0' : null;
    const hasReviews = place.signals && place.signals.length > 0;
    const isSelected = selectedPlace?.id === place.id;

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handlePlaceSelect(place)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHorizontal}>
          <View style={styles.photoContainerSmall}>
            {place.cover_image_url ? (
              <Image source={{ uri: place.cover_image_url }} style={styles.photoSmall} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderPhotoSmall}>
                <Ionicons name="image-outline" size={32} color="#ccc" />
              </View>
            )}
          </View>

          <View style={styles.cardContentHorizontal}>
            <Text style={styles.placeName} numberOfLines={1}>
              {place.name}
            </Text>
            <Text style={styles.placeAddress} numberOfLines={1}>
              {fullAddress}
            </Text>

            {!hasReviews && <Text style={styles.firstReviewText}>Be first to review</Text>}

            {hasReviews && (
              <View style={styles.signalsContainer}>
                {place.signals!.slice(0, 2).map((signal, index) => (
                  <View key={index} style={[styles.signalBadge, { backgroundColor: getSignalColor(signal.color) }]}>
                    <Text style={styles.signalText}>
                      {signal.name} ×{signal.count}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.metaInfo}>
              {place.category && <Text style={styles.metaText}>{place.category}</Text>}
              <Text style={styles.metaDot}> • </Text>
              <Text style={styles.metaText}>$$</Text>
              {distance && (
                <>
                  <Text style={styles.metaDot}> • </Text>
                  <Text style={styles.metaText}>{distance} mi</Text>
                </>
              )}
              {place.current_status && (
                <>
                  <Text style={styles.metaDot}> • </Text>
                  <Text style={styles.openStatus}>● Open</Text>
                </>
              )}
            </View>
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

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPlaces}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapLibreGL.MapView
          ref={mapRef}
          style={styles.map}
          styleURL="https://tiles.openfreemap.org/styles/liberty"
          logoEnabled={false}
        >
          <MapLibreGL.Camera
            ref={cameraRef}
            zoomLevel={12}
            centerCoordinate={[-122.4194, 37.7749]}
            animationMode="flyTo"
            animationDuration={2000}
          />

          {filteredPlaces.map(
            (place ) =>
              place.lat &&
              place.lng && (
                <MapLibreGL.PointAnnotation
                  key={place.id}
                  id={place.id}
                  coordinate={[place.lng, place.lat]}
                  onSelected={() => handlePlaceSelect(place)}
                >
                  <View style={styles.markerContainer}>
                    <View style={[styles.marker, selectedPlace?.id === place.id && styles.markerSelected]} />
                  </View>
                </MapLibreGL.PointAnnotation>
              )
          )}
        </MapLibreGL.MapView>

        {/* Search Overlay */}
        <View style={styles.searchOverlay}>
          <View style={styles.header}>
            <Ionicons name="navigate" size={20} color="#007AFF" style={styles.headerIcon} />
            <Text style={styles.headerSubtitle}>Popular near you</Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="location-outline" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search places or locations"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            <Ionicons name="search" size={20} color="#999" />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
                onPress={() => setSelectedCategory(category)}
              >
                <Ionicons
                  name={
                    category === 'All'
                      ? 'star-outline'
                      : category === 'Restaurants'
                      ? 'restaurant-outline'
                      : category === 'Cafes'
                      ? 'cafe-outline'
                      : category === 'Bars'
                      ? 'wine-outline'
                      : 'cart-outline'
                  }
                  size={16}
                  color={selectedCategory === category ? '#fff' : '#666'}
                />
                <Text style={[styles.categoryButtonText, selectedCategory === category && styles.categoryButtonTextActive]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet ref={bottomSheetRef} index={1} snapPoints={snapPoints} enablePanDownToClose={false}>
        <View style={styles.bottomSheetHeader}>
          <Text style={styles.placeCountText}>{filteredPlaces.length} places near you</Text>
        </View>
        <BottomSheetFlatList
          data={filteredPlaces}
          renderItem={renderPlaceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  categoriesContainer: {
    flexShrink: 0,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#fff',
  },
  markerSelected: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    borderWidth: 4,
  },
  bottomSheetHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  placeCountText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: '#007AFF',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardHorizontal: {
    flexDirection: 'row',
    padding: 12,
  },
  photoContainerSmall: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  photoSmall: {
    width: '100%',
    height: '100%',
  },
  placeholderPhotoSmall: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  cardContentHorizontal: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  firstReviewText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  signalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  signalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  signalText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  metaDot: {
    fontSize: 12,
    color: '#666',
  },
  openStatus: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#00bcd4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
