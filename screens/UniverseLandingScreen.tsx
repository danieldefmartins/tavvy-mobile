/**
 * UniverseLandingScreen.tsx
 * Display a single universe with its sub-universes (planets) and places
 * Path: screens/UniverseLandingScreen.tsx
 *
 * Features:
 * - Working tabs: Places, Map, Reviews, Info
 * - Add Place button for signed-in users
 * - Reviews section matching Place Details style
 * - Suggest Changes functionality
 */

import CruiseUniverse from '../components/cruises/CruiseUniverse';
import ContentSafetyActions,{CONTENT_SAFETY_CHANGED} from '../components/ContentSafetyActions';
import {DeviceEventEmitter} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Share,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { type AtlasUniverse } from '../lib/atlas';
import { useTranslation } from 'react-i18next';
import { StoriesRow } from '../components/StoriesRow';

const { width } = Dimensions.get('window');

import { useAuth } from '../contexts/AuthContext';
import { loadUniversePlaces, hasUniverseCoordinates } from '../lib/universePlaces';
import { searchFoodMenus } from '../lib/foodMenu';

// Default placeholder images
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

// Get category-based fallback image URL when place has no photo
const getCategoryFallbackImage = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  
  const imageMap: Record<string, string> = {
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'ride': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'attraction': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'theme park': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'restroom': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
    'dining': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  };
  
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerCategory.includes(key)) return url;
  }
  
  return imageMap.default;
};

interface Place {
  universe_ids?: string[];
  id: string;
  name: string;
  tavvy_category?: string;
  tavvy_subcategory?: string;
  cover_image_url?: string;
  latitude?: number;
  longitude?: number;
}

interface Review {
  id: string;
  type: 'good' | 'vibe' | 'heads_up';
  text: string;
  user_name: string;
  created_at: string;
}

interface MenuItem {
  id: string;
  place_id: string;
  item_name: string;
  description?: string;
  price?: number;
  category?: string;
  dietary_tags?: string[];
  image_url?: string;
  place_name?: string;
  place_thumbnail?: string;
}

export default function UniverseLandingScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const universeId = route.params?.universeId;

  const [loading, setLoading] = useState(true);
  const [universe, setUniverse] = useState<AtlasUniverse | null>(null);
  const [subUniverses, setSubUniverses] = useState<AtlasUniverse[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewType, setReviewType] = useState<'good' | 'vibe' | 'heads_up' | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [activeTab, setActiveTab] = useState('Places');
  const [activeZone, setActiveZone] = useState('All Zones');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // Modal states
  const [showAddPlaceModal, setShowAddPlaceModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [addPlaceType, setAddPlaceType] = useState<string | null>(null);
  
  // Food search states
  const [showFoodSearchModal, setShowFoodSearchModal] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodSearchResults, setFoodSearchResults] = useState<MenuItem[]>([]);
  const [foodSearchLoading, setFoodSearchLoading] = useState(false);
  const [foodSearchError, setFoodSearchError] = useState('');
  const foodRequest = useRef(0);

  const { user } = useAuth();
  const canContribute = !!user;
  const [loadError, setLoadError] = useState('');
  const [reviewsError, setReviewsError] = useState('');

  useEffect(() => {
    if (universeId) {
      loadUniverseData();
    }
    const subscription=DeviceEventEmitter.addListener(CONTENT_SAFETY_CHANGED,()=>loadUniverseData());return()=>subscription.remove();
  }, [universeId,user?.id]);

  const loadUniverseData = async () => {
    setLoading(true);
    setUniverse(null); setPlaces([]); setSubUniverses([]); setReviews([]);
    setLoadError(''); setReviewsError(''); setActiveZone('All Zones');
    try {
      console.log('[UniverseLanding] Loading universe with ID:', universeId);
      
      // Fetch the universe details
      const { data: universeData, error: universeError } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('id', universeId)
        .maybeSingle();

      if (universeError) {
        console.error('[UniverseLanding] Error fetching universe:', universeError);
        throw universeError;
      }
      
      if (!universeData) {
        console.error('[UniverseLanding] Universe not found for ID:', universeId);
        setLoading(false);
        return;
      }
      
      console.log('[UniverseLanding] Universe loaded:', universeData.name);
      setUniverse(universeData);
      if (universeData.universe_kind === 'cruise_ship') return;

      // Fetch sub-universes (planets) for this universe
      const { data: subUniversesData, error: subError } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('parent_universe_id', universeId)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if (subError) throw subError;
      if (subUniversesData) {
        setSubUniverses(subUniversesData);
      }

      setPlaces(await loadUniversePlaces([universeId, ...(subUniversesData || []).map(s => s.id)]));

      // Fetch reviews for this universe
      const { data: reviewsData, error: reviewReadError } = await supabase
        .from('universe_reviews')
        .select('*')
        .eq('universe_id', universeId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (reviewReadError) setReviewsError('Reviews are unavailable. Please try again later.');
      if (!reviewReadError && reviewsData) {
        setReviews(reviewsData);
      }

    } catch (error) {
      setUniverse(null);
      setLoadError('Unable to load this universe. Please try again.');
      console.error('Error loading universe data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build stats from real data
  const stats = [
    { val: String(universe?.place_count || places.length || 0), label: "Places", icon: "location" },
    { val: "—", label: "Map", icon: "map" },
    { val: formatNumber(reviews.length || 0), label: "Reviews", icon: "chatbubbles" },
    { val: "Info", label: "Info", icon: "information-circle" }
  ];

  const zones = [{ id: 'All Zones', name: 'All Zones' }, ...subUniverses.map(s => ({ id: s.id, name: s.name }))];

  // Category filter definitions
  const RIDE_SUBCATEGORIES = ['water_rides', 'thrill_rides', 'dark_rides', 'family_rides', 'simulators'];
  const ATTRACTION_SUBCATEGORIES = ['explore', 'interactive', 'animals'];

  // Filter places by search, zone, and category
  const filteredPlaces = places.filter(place => {
    const matchesSearch = !searchQuery || 
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.tavvy_category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (place.tavvy_subcategory || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = activeZone === 'All Zones' || !!place.universe_ids?.includes(activeZone);
    
    // Category filter
    let matchesFilter = true;
    if (activeFilter) {
      const cat = (place.tavvy_category || '').toLowerCase();
      const sub = (place.tavvy_subcategory || '').toLowerCase();
      switch (activeFilter) {
        case 'rides':
          matchesFilter = RIDE_SUBCATEGORIES.includes(sub);
          break;
        case 'attractions':
          matchesFilter = ATTRACTION_SUBCATEGORIES.includes(sub) || (cat === 'attraction' && !RIDE_SUBCATEGORIES.includes(sub) && sub !== 'shows' && sub !== 'characters');
          break;
        case 'characters':
          matchesFilter = sub === 'characters';
          break;
        case 'shows':
          matchesFilter = sub === 'shows';
          break;
        case 'fireworks':
          matchesFilter = sub === 'fireworks' || place.name.toLowerCase().includes('firework');
          break;
        case 'special_events':
          matchesFilter = sub === 'special_events' || cat === 'special_events';
          break;
        case 'entrance':
          matchesFilter = cat === 'entrance' || place.name.toLowerCase().includes('entrance');
          break;
        case 'dining':
          matchesFilter = cat === 'restaurant' || cat === 'dining' || place.name.toLowerCase().includes('dining') || place.name.toLowerCase().includes('restaurant');
          break;
        case 'restroom':
          matchesFilter = cat === 'restroom' || place.name.toLowerCase().includes('restroom');
          break;
        case 'parking':
          matchesFilter = cat === 'parking' || place.name.toLowerCase().includes('parking');
          break;
      }
    }
    
    return matchesSearch && matchesZone && matchesFilter;
  });

  // Format large numbers
  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  // Handle place press - navigate to PlaceDetails
  const handlePlacePress = (place: Place) => {
    navigation.navigate('PlaceDetails', { placeId: place.id });
  };

  // Handle sub-universe (planet) press
  const handleSubUniversePress = (subUniverse: AtlasUniverse) => {
    navigation.push('UniverseLanding', { universeId: subUniverse.id });
  };

  // Handle stat press - switch to appropriate tab
  const handleStatPress = (label: string) => {
    if (label === 'Places') setActiveTab('Places');
    else if (label === 'Map') setActiveTab('Map');
    else if (label === 'Reviews') setActiveTab('Reviews');
    else if (label === 'Info') setActiveTab('Info');
  };

  // Handle add place
  const handleAddPlace = (type: string) => {
    setAddPlaceType(type);
    // Navigate to add place screen with pre-selected type
    navigation.navigate('AddPlace', { 
      universeId: universeId, 
      universeName: universe?.name,
      placeType: type 
    });
    setShowAddPlaceModal(false);
  };

  // Query the same menu data used by the restaurant's online menu.
  const handleFoodSearch = async (query: string) => {
    const current = ++foodRequest.current;
    setFoodSearchQuery(query); setFoodSearchError(''); setFoodSearchResults([]);
    if (!query.trim() || !universeId) { setFoodSearchLoading(false); return; }
    setFoodSearchLoading(true);
    try {
      const results = await searchFoodMenus({ query, universeId: universeId });
      if (current === foodRequest.current) setFoodSearchResults(results as MenuItem[]);
    } catch (error) {
      if (current === foodRequest.current) setFoodSearchError((error as Error).message);
    } finally {
      if (current === foodRequest.current) setFoodSearchLoading(false);
    }
  };

  // Handle submit suggestion
  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) {
      Alert.alert('Error', 'Please enter your suggestion');
      return;
    }

    try {
      // Get current user for the suggestion
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Sign in to submit a suggestion.');
      // Insert suggestion into database
      const { error } = await supabase
        .from('universe_suggestions')
        .insert({
          universe_id: universeId,
          user_id: user!.id,
          suggestion_text: suggestionText,
          status: 'pending'
        });

      if (error) throw error;

      Alert.alert('Thank you!', 'Your suggestion has been submitted for review.');
      setSuggestionText('');
      setShowSuggestModal(false);
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      Alert.alert('Error', 'Failed to submit suggestion. Please try again.');
    }
  };

  const submitReview = async () => {
    if (!user || !universe || !reviewType || !reviewText.trim() || reviewSaving) return;
    setReviewSaving(true); setReviewSubmitError('');
    try {
      const { error } = await supabase.from('universe_reviews').insert({ universe_id: universe.id, user_id: user.id, type: reviewType, text: reviewText.trim() });
      if (error) throw error;
      setReviewType(null); setReviewText(''); await loadUniverseData(); setActiveTab('Reviews');
    } catch { setReviewSubmitError('Unable to post your review. Please try again.'); }
    finally { setReviewSaving(false); }
  };

  // Group reviews by type
  const goodReviews = reviews.filter(r => r.type === 'good');
  const vibeReviews = reviews.filter(r => r.type === 'vibe');
  const headsUpReviews = reviews.filter(r => r.type === 'heads_up');

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#06B6D4" />
        <Text style={styles.loadingText}>Loading universe...</Text>
      </View>
    );
  }

  if (!universe) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Ionicons name="planet-outline" size={48} color="#9CA3AF" />
        <Text style={styles.loadingText}>{loadError || 'Universe not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonStyle}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (universe.universe_kind === 'cruise_ship') return <CruiseUniverse universeId={universe.id}/>;

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'Places':
        return renderPlacesTab();
      case 'Map':
        return renderMapTab();
      case 'Reviews':
        return renderReviewsTab();
      case 'Info':
        return renderInfoTab();
      default:
        return renderPlacesTab();
    }
  };

  // Places Tab
  const renderPlacesTab = () => (
    <>
      {/* Search & Filter */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search places..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        {zones.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zonesContainer}>
            {zones.map((zone) => (
              <TouchableOpacity 
                key={zone.id}
                style={[styles.zoneChip, activeZone === zone.id && styles.zoneChipActive]}
                onPress={() => setActiveZone(zone.id)}
              >
                <Text style={[styles.zoneText, activeZone === zone.id && styles.zoneTextActive]}>{zone.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Sub-Universes (Planets) Section */}
      {subUniverses.length > 0 && (
        <View style={styles.subUniversesSection}>
          <Text style={styles.sectionTitle}>Parks & Areas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subUniversesContainer}>
            {subUniverses.map((subUniverse) => (
              <TouchableOpacity 
                key={subUniverse.id} 
                style={styles.subUniverseCard}
                onPress={() => handleSubUniversePress(subUniverse)}
              >
                <Image 
                  source={{ uri: subUniverse.thumbnail_image_url || PLACEHOLDER_IMAGE }} 
                  style={styles.subUniverseImage} 
                />
                <View style={styles.subUniverseContent}>
                  <Text style={styles.subUniverseName} numberOfLines={1}>{subUniverse.name}</Text>
                  <Text style={styles.subUniverseCount}>{subUniverse.place_count || 0} places</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Category Filter Icons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        style={{ marginBottom: 16 }}
      >
        {[
          { icon: 'rocket-outline' as const, label: 'Rides', filter: 'rides', color: '#EF4444' },
          { icon: 'star-outline' as const, label: 'Attractions', filter: 'attractions', color: '#F59E0B' },
          { icon: 'people-outline' as const, label: 'Characters', filter: 'characters', color: '#8A05BE' },
          { icon: 'musical-notes-outline' as const, label: 'Shows', filter: 'shows', color: '#EC4899' },
          { icon: 'flash-outline' as const, label: 'Fireworks', filter: 'fireworks', color: '#00C2CB' },
          { icon: 'calendar-outline' as const, label: 'Events', filter: 'special_events', color: '#06B6D4' },
          { icon: 'exit-outline' as const, label: 'Entrances', filter: 'entrance', color: '#6366F1' },
          { icon: 'restaurant-outline' as const, label: 'Dining', filter: 'dining', color: '#00C2CB' },
          { icon: 'water-outline' as const, label: 'Restrooms', filter: 'restroom', color: '#8A05BE' },
          { icon: 'car-outline' as const, label: 'Parking', filter: 'parking', color: '#6B7280' },
        ].map((item, i) => {
          const isActive = activeFilter === item.filter;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (isActive) {
                  setActiveFilter(null);
                } else {
                  setActiveFilter(item.filter);
                }
              }}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isActive ? item.color : '#fff',
                  borderWidth: isActive ? 0 : 1,
                  borderColor: '#E5E7EB',
                  shadowOpacity: isActive ? 0.15 : 0.05,
                }
              ]}
            >
              <Ionicons 
                name={item.icon as any} 
                size={22} 
                color={isActive ? '#FFFFFF' : item.color} 
              />
              <Text style={[
                styles.filterLabel,
                { color: isActive ? '#FFFFFF' : '#6B7280' }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Places List */}
      <View style={styles.placesSection}>
        <View style={styles.placesHeader}>
          <Text style={styles.placesTitle}>Places in this Universe</Text>
          <Text style={styles.placesCount}>{filteredPlaces.length} places</Text>
        </View>

        {filteredPlaces.length > 0 ? (
          filteredPlaces.map((place) => (
            <TouchableOpacity 
              key={place.id} 
              style={styles.placeCard}
              onPress={() => handlePlacePress(place)}
            >
              <Image 
                source={{ uri: place.cover_image_url || getCategoryFallbackImage(place.tavvy_category || '') }} 
                style={styles.placeImage} 
              />
              <View style={styles.placeContent}>
                <View style={styles.placeHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                    <Text style={styles.placeZone}>{place.tavvy_category || 'Attraction'}</Text>
                  </View>
                </View>
                <View style={styles.placeTags}>
                  <View style={styles.placeTag}>
                    <Text style={styles.placeTagText}>{place.tavvy_subcategory || 'Place'}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No places found</Text>
            {canContribute && (
              <TouchableOpacity 
                style={styles.addFirstPlaceButton}
                onPress={() => setShowAddPlaceModal(true)}
              >
                <Text style={styles.addFirstPlaceText}>Add the first place</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </>
  );

  // Map Tab
  const renderMapTab = () => {
    const markers = filteredPlaces.filter(hasUniverseCoordinates);
    const points = markers.length ? markers : hasUniverseCoordinates(universe) ? [universe!] : [];
    if (!points.length) return <View style={styles.emptyState}><Text>No location data is available for these places.</Text></View>;
    const latitudes = points.map(p => p.latitude!);
    const longitudes = points.map(p => p.longitude!);
    return <View style={styles.mapTabContainer}>
      <Text style={{ padding: 16 }}>{markers.length} of {filteredPlaces.length} matching places have map locations. Filters from Places apply here.</Text>
      <MapLibreGL.MapView style={styles.fullMap} mapStyle={{ version: 8, sources: {}, layers: [] }} attributionEnabled>
        <MapLibreGL.RasterSource id="universe-tiles" tileUrlTemplates={['https://tile.openstreetmap.org/{z}/{x}/{y}.png']} tileSize={256} attribution="© OpenStreetMap contributors">
          <MapLibreGL.RasterLayer id="universe-layer" sourceID="universe-tiles" />
        </MapLibreGL.RasterSource>
        <MapLibreGL.Camera maxZoomLevel={18} defaultSettings={points.length === 1 ? { centerCoordinate: [longitudes[0], latitudes[0]], zoomLevel: 15 } : { bounds: { ne: [Math.max(...longitudes), Math.max(...latitudes)], sw: [Math.min(...longitudes), Math.min(...latitudes)], paddingTop: 40, paddingBottom: 40, paddingLeft: 40, paddingRight: 40 } }} />
        {points.map(point => <MapLibreGL.PointAnnotation key={point.id} id={point.id} coordinate={[point.longitude!, point.latitude!]} onSelected={() => { if (point.id !== universe!.id) handlePlacePress(point as Place); }}>
          <View style={{ backgroundColor: '#06B6D4', borderRadius: 14, borderWidth: 2, borderColor: '#fff', padding: 6 }}><Ionicons name="location" color="#fff" size={18} /></View>
          <MapLibreGL.Callout title={point.name} />
        </MapLibreGL.PointAnnotation>)}
      </MapLibreGL.MapView>
    </View>;
  };

  // Reviews Tab (matching Place Details style)
  const renderReviewsTab = () => (
    <View style={styles.reviewsTabContainer}>
      {!!reviewsError && <Text accessibilityRole="alert">{reviewsError}</Text>}
      {/* Community Signals Card */}
      <View style={styles.signalsCard}>
        <Text style={styles.signalsTitle}>Community Reviews</Text>
        
        {/* The Good - Blue */}
        <TouchableOpacity 
          style={[styles.signalBar, { backgroundColor: '#00C2CB' }]}
          onPress={() => { setReviewSubmitError(''); setReviewType('good'); }}
          activeOpacity={0.8}
        >
          <Ionicons name="thumbs-up" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.signalBarText}>
            {goodReviews.length > 0 
              ? `The Good · ${goodReviews.length} reviews` 
              : 'The Good · Be the first to tap!'}
          </Text>
        </TouchableOpacity>
        
        {/* The Vibe - Purple */}
        <TouchableOpacity 
          style={[styles.signalBar, { backgroundColor: '#8A05BE' }]}
          onPress={() => { setReviewSubmitError(''); setReviewType('vibe'); }}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.signalBarText}>
            {vibeReviews.length > 0 
              ? `The Vibe · ${vibeReviews.length} reviews` 
              : 'The Vibe · Be the first to tap!'}
          </Text>
        </TouchableOpacity>
        
        {/* Heads Up - Orange */}
        <TouchableOpacity 
          style={[styles.signalBar, { backgroundColor: '#F5A623', marginBottom: 0 }]}
          onPress={() => { setReviewSubmitError(''); setReviewType('heads_up'); }}
          activeOpacity={0.8}
        >
          <Ionicons name="alert-circle" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.signalBarText}>
            {headsUpReviews.length > 0 
              ? `Heads Up · ${headsUpReviews.length} reviews` 
              : 'Heads Up · Be the first to tap!'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <View style={styles.recentReviewsSection}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {reviews.slice(0, 5).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={[
                styles.reviewTypeBadge,
                review.type === 'good' && { backgroundColor: '#00C2CB' },
                review.type === 'vibe' && { backgroundColor: '#8A05BE' },
                review.type === 'heads_up' && { backgroundColor: '#F5A623' },
              ]}>
                <Ionicons 
                  name={review.type === 'good' ? 'thumbs-up' : review.type === 'vibe' ? 'sparkles' : 'alert-circle'} 
                  size={12} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.reviewContent}>
                <Text style={styles.reviewText}>{review.text}</Text>
                <ContentSafetyActions kind="universe_review" contentId={review.id}/>
                <Text style={styles.reviewMeta}>{review.user_name} · {new Date(review.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Been Here Section */}
      <View style={styles.beenHereCard}>
        <Text style={styles.beenHereTitle}>Been here?</Text>
        <Text style={styles.beenHereSubtext}>Share your experience with the community</Text>
        <TouchableOpacity 
          style={styles.writeReviewButton}
          onPress={() => { setReviewSubmitError(''); setReviewType('good'); }}
        >
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
          <Text style={styles.writeReviewButtonText}>Write a Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Info Tab
  const renderInfoTab = () => (
    <View style={styles.infoTabContainer}>
      {/* Universe Description */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>About {universe?.name}</Text>
        <Text style={styles.infoCardText}>
          {universe?.description || 'No description available yet. Be the first to suggest one!'}
        </Text>
      </View>

      {/* Location Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Location</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#06B6D4" />
          <Text style={styles.infoRowText}>{universe?.location || 'Location not specified'}</Text>
        </View>
        {universe?.latitude && universe?.longitude && (
          <View style={styles.infoRow}>
            <Ionicons name="navigate" size={20} color="#06B6D4" />
            <Text style={styles.infoRowText}>
              {universe.latitude.toFixed(4)}, {universe.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{universe?.place_count || places.length}</Text>
            <Text style={styles.statBoxLabel}>Places</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{subUniverses.length}</Text>
            <Text style={styles.statBoxLabel}>Parks/Areas</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{reviews.length}</Text>
            <Text style={styles.statBoxLabel}>Reviews</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{places.length}</Text>
            <Text style={styles.statBoxLabel}>Places</Text>
          </View>
        </View>
      </View>

      {/* Suggest Changes */}
      <TouchableOpacity 
        style={styles.suggestButton}
        onPress={() => setShowSuggestModal(true)}
      >
        <Ionicons name="create-outline" size={20} color="#06B6D4" />
        <Text style={styles.suggestButtonText}>Suggest a Change</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: universe.banner_image_url || PLACEHOLDER_IMAGE }} 
            style={styles.heroImage} 
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          
          {/* Hero Nav */}
          <SafeAreaView style={styles.heroNav}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.navActions}>
              <TouchableOpacity accessibilityLabel="Share universe" style={styles.navButton} onPress={() => Share.share({ message: `${universe.name} https://tavvy.com/app/universe/${universe.slug || universe.id}` }).catch(() => Alert.alert('Unable to share', 'Please try again.'))}>
                <Ionicons name="share-outline" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={styles.universeBadge}>
              <Text style={styles.universeBadgeIcon}>🌌</Text>
              <Text style={styles.universeBadgeText}>UNIVERSE</Text>
            </View>
            <Text style={styles.heroTitle}>{universe.name}</Text>
            <View style={styles.heroMeta}>
              <Ionicons name="location" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.heroMetaText}>{universe.location || 'Location TBD'}</Text>
            </View>
          </View>
        </View>

        {/* Stats Bar - Now Clickable */}
        <View style={styles.statsContainer}>
          {stats.map((stat, i) => (
            <TouchableOpacity 
              key={i} 
              style={styles.statItem}
              onPress={() => handleStatPress(stat.label)}
            >
              <Ionicons name={stat.icon as any} size={20} color={activeTab === stat.label ? '#06B6D4' : '#9CA3AF'} />
              <Text style={[styles.statValue, activeTab === stat.label && styles.statValueActive]}>{stat.val}</Text>
              <Text style={[styles.statLabel, activeTab === stat.label && styles.statLabelActive]}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stories Row */}
        <StoriesRow
          universeId={universe?.id}
          onAddStoryPress={() => navigation.navigate('StoryUpload' as never, { universeId: universe?.id, universeName: universe?.name } as never)}
        />

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          {["Places", "Map", "Reviews", "Info"].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Place Button - Only for verified users */}
      {canContribute && (
        <TouchableOpacity 
          style={styles.floatingAddButton}
          onPress={() => setShowAddPlaceModal(true)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Add Place Modal */}
      <Modal visible={!!reviewType} transparent animationType="slide" onRequestClose={() => { if (!reviewSaving) setReviewType(null); }}>
        <View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Write a review</Text>
          {!user ? <Text>Sign in to post a review.</Text> : <>
            <View style={{ flexDirection: 'row', gap: 12, marginVertical: 16 }}>{(['good', 'vibe', 'heads_up'] as const).map(type => <TouchableOpacity key={type} onPress={() => setReviewType(type)}><Text style={{ color: reviewType === type ? '#0891B2' : '#374151' }}>{type === 'good' ? 'The Good' : type === 'vibe' ? 'The Vibe' : 'Heads Up'}</Text></TouchableOpacity>)}</View>
            <TextInput accessibilityLabel="Your review" value={reviewText} onChangeText={setReviewText} multiline maxLength={4000} style={styles.suggestionInput} />
            <TouchableOpacity disabled={reviewSaving || !reviewText.trim()} onPress={submitReview} style={styles.submitButton}><Text style={styles.submitButtonText}>{reviewSaving ? 'Posting…' : 'Post review'}</Text></TouchableOpacity>
          </>}
          {!!reviewSubmitError && <Text accessibilityRole="alert">{reviewSubmitError}</Text>}
          <TouchableOpacity disabled={reviewSaving} onPress={() => setReviewType(null)} style={{ padding: 16 }}><Text>Close</Text></TouchableOpacity>
        </View></View>
      </Modal>
      <Modal
        visible={showAddPlaceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddPlaceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a Place</Text>
              <TouchableOpacity onPress={() => setShowAddPlaceModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>What type of place would you like to add?</Text>
            
            <View style={styles.placeTypeGrid}>
              {[
                { icon: 'rocket-outline', label: 'Ride', type: 'ride' },
                { icon: 'restaurant-outline', label: 'Dining', type: 'dining' },
                { icon: 'water-outline', label: 'Restroom', type: 'restroom' },
                { icon: 'storefront-outline', label: 'Shop', type: 'shop' },
                { icon: 'ticket-outline', label: 'Attraction', type: 'attraction' },
                { icon: 'car-outline', label: 'Parking', type: 'parking' },
                { icon: 'exit-outline', label: 'Entrance', type: 'entrance' },
                { icon: 'ellipsis-horizontal', label: 'Other', type: 'other' },
              ].map((item) => (
                <TouchableOpacity 
                  key={item.type}
                  style={styles.placeTypeButton}
                  onPress={() => handleAddPlace(item.type)}
                >
                  <Ionicons name={item.icon as any} size={32} color="#06B6D4" />
                  <Text style={styles.placeTypeLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Suggest Changes Modal */}
      <Modal
        visible={showSuggestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSuggestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suggest a Change</Text>
              <TouchableOpacity onPress={() => setShowSuggestModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Help us improve {universe?.name}. Your suggestion will be reviewed by our team.
            </Text>
            
            <TextInput
              style={styles.suggestionInput}
              placeholder="Describe your suggestion..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              value={suggestionText}
              onChangeText={setSuggestionText}
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmitSuggestion}
            >
              <Text style={styles.submitButtonText}>Submit Suggestion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Food Search Modal */}
      <Modal
        visible={showFoodSearchModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { setShowFoodSearchModal(false); setFoodSearchQuery(''); setFoodSearchResults([]); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🍽️ What do you want to eat?</Text>
              <TouchableOpacity onPress={() => { setShowFoodSearchModal(false); setFoodSearchQuery(''); setFoodSearchResults([]); }}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Search for a food item and we'll show you which restaurants have it!
            </Text>
            
            {/* Search Input */}
            <View style={styles.foodSearchInput}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.foodSearchTextInput}
                placeholder="e.g., pizza, burger, vegan..."
                placeholderTextColor="#9CA3AF"
                value={foodSearchQuery}
                onChangeText={handleFoodSearch}
                autoFocus
              />
              {foodSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setFoodSearchQuery(''); setFoodSearchResults([]); }}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Suggestions */}
            {!foodSearchQuery && (
              <View style={styles.foodSuggestions}>
                <Text style={styles.foodSuggestionsLabel}>POPULAR SEARCHES</Text>
                <View style={styles.foodSuggestionsRow}>
                  {['Pizza', 'Burger', 'Ice Cream', 'Chicken', 'Salad', 'Vegan', 'Fries', 'Hot Dog'].map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={styles.foodSuggestionChip}
                      onPress={() => handleFoodSearch(suggestion)}
                    >
                      <Text style={styles.foodSuggestionText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Results */}
            <ScrollView style={styles.foodResultsContainer}>
              {foodSearchError ? <Text accessibilityRole="alert">{foodSearchError}</Text> : foodSearchLoading ? (
                <View style={styles.foodEmptyState}>
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>🔍</Text>
                  <Text style={styles.foodEmptyText}>Searching menus...</Text>
                </View>
              ) : foodSearchQuery && foodSearchResults.length === 0 ? (
                <View style={styles.foodEmptyState}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>🤷</Text>
                  <Text style={styles.foodEmptyText}>No menu items found for "{foodSearchQuery}"</Text>
                  <Text style={styles.foodEmptySubtext}>Try a different search term or check back later as menus are being added.</Text>
                </View>
              ) : foodSearchResults.length > 0 ? (
                <View>
                  <Text style={styles.foodResultsCount}>
                    {foodSearchResults.length} RESULT{foodSearchResults.length !== 1 ? 'S' : ''} FOUND
                  </Text>
                  {foodSearchResults.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.foodResultCard}
                      onPress={() => {
                        setShowFoodSearchModal(false);
                        navigation.navigate('MenuGallery', { placeId: item.place_id, placeName: item.place_name, dishId: item.id });
                      }}
                    >
                      {item.image_url || item.place_thumbnail ? (
                        <Image
                          source={{ uri: item.image_url || item.place_thumbnail || '' }}
                          style={styles.foodResultImage}
                        />
                      ) : (
                        <View style={styles.foodResultImagePlaceholder}>
                          <Text style={{ fontSize: 32 }}>🍽️</Text>
                        </View>
                      )}
                      <View style={styles.foodResultContent}>
                        <Text style={styles.foodResultName} numberOfLines={1}>{item.item_name}</Text>
                        <Text style={styles.foodResultRestaurant} numberOfLines={1}>📍 {item.place_name}</Text>
                        <View style={styles.foodResultMeta}>
                          {item.price && (
                            <Text style={styles.foodResultPrice}>${item.price.toFixed(2)}</Text>
                          )}
                          {item.category && (
                            <View style={styles.foodResultCategory}>
                              <Text style={styles.foodResultCategoryText}>{item.category}</Text>
                            </View>
                          )}
                          {item.dietary_tags && item.dietary_tags.length > 0 && (
                            <Text style={styles.foodResultDietary}>
                              {item.dietary_tags.includes('vegan') ? '🌱' : ''}
                              {item.dietary_tags.includes('vegetarian') ? '🥬' : ''}
                              {item.dietary_tags.includes('gluten-free') ? '🌾' : ''}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.foodEmptyState}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>🍔</Text>
                  <Text style={styles.foodEmptyText}>Search for your favorite food above!</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  backButtonStyle: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#06B6D4',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  heroNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  navButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  universeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.9)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  universeBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  universeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 4,
  },
  statValueActive: {
    color: '#06B6D4',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statLabelActive: {
    color: '#06B6D4',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#06B6D4',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#06B6D4',
  },
  filterSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  zonesContainer: {
    paddingRight: 16,
  },
  zoneChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  zoneChipActive: {
    backgroundColor: '#06B6D4',
  },
  zoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  zoneTextActive: {
    color: '#fff',
  },
  subUniversesSection: {
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  subUniversesContainer: {
    paddingHorizontal: 16,
  },
  subUniverseCard: {
    width: 140,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  subUniverseImage: {
    width: '100%',
    height: 90,
  },
  subUniverseContent: {
    padding: 10,
  },
  subUniverseName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  subUniverseCount: {
    fontSize: 11,
    color: '#6B7280',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
  },
  filterButton: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 68,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  placesSection: {
    paddingHorizontal: 16,
  },
  placesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  placesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  placesCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  placeImage: {
    width: 100,
    height: 100,
  },
  placeContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  placeZone: {
    fontSize: 11,
    color: '#06B6D4',
    fontWeight: '500',
  },
  placeTags: {
    flexDirection: 'row',
    marginTop: 8,
  },
  placeTag: {
    backgroundColor: '#ECFEFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFFAFE',
  },
  placeTagText: {
    fontSize: 10,
    color: '#0891B2',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  addFirstPlaceButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#06B6D4',
    borderRadius: 8,
  },
  addFirstPlaceText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Map Tab Styles
  mapTabContainer: {
    flex: 1,
    minHeight: 400,
  },
  fullMap: {
    width: '100%',
    height: 400,
  },
  mapPlaceholder: {
    height: 400,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0284C7',
    marginTop: 16,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    gap: 8,
  },
  openMapsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Reviews Tab Styles
  reviewsTabContainer: {
    padding: 16,
  },
  signalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  signalsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  signalBar: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  signalBarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  recentReviewsSection: {
    marginBottom: 16,
  },
  reviewCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewTypeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewContent: {
    flex: 1,
  },
  reviewText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
  },
  reviewMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  beenHereCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  beenHereTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  beenHereSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06B6D4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  writeReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Info Tab Styles
  infoTabContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoCardText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  infoRowText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '47%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#06B6D4',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  suggestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  suggestButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06B6D4',
  },
  // Floating Button
  floatingAddButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  placeTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  placeTypeButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  placeTypeLabel: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 6,
    fontWeight: '500',
  },
  suggestionInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Food Search Modal Styles
  foodSearchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  foodSearchTextInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  foodSuggestions: {
    marginBottom: 16,
  },
  foodSuggestionsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  foodSuggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  foodSuggestionChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  foodSuggestionText: {
    fontSize: 14,
    color: '#374151',
  },
  foodResultsContainer: {
    flex: 1,
  },
  foodResultsCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  foodResultCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  foodResultImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  foodResultImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodResultContent: {
    flex: 1,
    justifyContent: 'center',
  },
  foodResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  foodResultRestaurant: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  foodResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodResultPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  foodResultCategory: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  foodResultCategoryText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  foodResultDietary: {
    fontSize: 14,
  },
  foodEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  foodEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  foodEmptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});
