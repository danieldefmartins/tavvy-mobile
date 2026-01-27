/**
 * UniverseLandingScreen.tsx
 * Display a single universe with its sub-universes (planets) and places
 * Path: screens/UniverseLandingScreen.tsx
 *
 * NOW CONNECTED TO SUPABASE - Fetches real data from atlas_universes and places tables
 */

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { type AtlasUniverse } from '../lib/atlas';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

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
    'family': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'themed': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    'unique': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  };
  
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerCategory.includes(key)) return url;
  }
  
  return imageMap.default;
};

interface Place {
  id: string;
  name: string;
  tavvy_category?: string;
  tavvy_subcategory?: string;
  total_signals?: number;
  thumbnail_url?: string;
  is_open?: boolean;
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
  const [activeTab, setActiveTab] = useState('Places');
  const [activeZone, setActiveZone] = useState('All Zones');

  useEffect(() => {
    if (universeId) {
      loadUniverseData();
    }
  }, [universeId]);

  const loadUniverseData = async () => {
    setLoading(true);
    try {
      // Fetch the universe details
      const { data: universeData, error: universeError } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('id', universeId)
        .single();

      if (universeError) throw universeError;
      setUniverse(universeData);

      // Fetch sub-universes (planets) for this universe
      const { data: subUniversesData, error: subError } = await supabase
        .from('atlas_universes')
        .select('*')
        .eq('parent_universe_id', universeId)
        .eq('status', 'published')
        .order('name', { ascending: true });

      if (!subError && subUniversesData) {
        setSubUniverses(subUniversesData);
      }

      // Fetch places linked to this universe via atlas_universe_places
      const { data: placesData, error: placesError } = await supabase
        .from('atlas_universe_places')
        .select(`
          place:places(
            id,
            name,
            tavvy_category,
            tavvy_subcategory,
            total_signals,
            thumbnail_url
          )
        `)
        .eq('universe_id', universeId)
        .order('display_order', { ascending: true });

      if (!placesError && placesData) {
        const extractedPlaces = placesData
          .map((item: any) => item.place)
          .filter(Boolean);
        setPlaces(extractedPlaces);
      }

    } catch (error) {
      console.error('Error loading universe data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build stats from real data
  const stats = [
    { val: String(universe?.place_count || places.length || 0), label: "Places" },
    { val: formatNumber(universe?.total_signals || 0), label: "Signals" },
    { val: String(universe?.sub_universe_count || subUniverses.length || 0), label: "Parks" },
    { val: "—", label: "Entrances" }
  ];

  // Build zones from sub-universes
  const zones = [
    "All Zones",
    ...subUniverses.map(su => su.name)
  ];

  // Filter places by zone if needed
  const filteredPlaces = places; // For now, show all places

  // Format large numbers
  function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  // Handle place press - navigate to PlaceDetails
  const handlePlacePress = (place: Place) => {
    // Navigate to PlaceDetails within the Universe stack
    navigation.navigate('PlaceDetails', { placeId: place.id });
  };

  // Handle sub-universe (planet) press
  const handleSubUniversePress = (subUniverse: AtlasUniverse) => {
    // Navigate to the same screen but with the sub-universe ID
    navigation.push('UniverseLanding', { universeId: subUniverse.id });
  };

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
        <Text style={styles.loadingText}>Universe not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <View style={styles.heroOverlay} />
          
          {/* Hero Nav */}
          <SafeAreaView style={styles.heroNav}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.navActions}>
              <TouchableOpacity style={styles.navButton}>
                <Ionicons name="heart-outline" size={24} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton}>
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

        {/* Stats Bar */}
        <View style={styles.statsContainer}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.val}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          {["Places", "Map", "Signals", "Info"].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search & Filter */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>Search in this universe...</Text>
          </View>
          
          {zones.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zonesContainer}>
              {zones.map((zone) => (
                <TouchableOpacity 
                  key={zone}
                  style={[styles.zoneChip, activeZone === zone && styles.zoneChipActive]}
                  onPress={() => setActiveZone(zone)}
                >
                  <Text style={[styles.zoneText, activeZone === zone && styles.zoneTextActive]}>{zone}</Text>
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

        {/* Map Preview */}
        <TouchableOpacity style={styles.mapPreview}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>View Universe Map →</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'exit-outline', label: "Entrances" },
            { icon: 'restaurant-outline', label: "Dining" },
            { icon: 'water-outline', label: "Restrooms" },
            { icon: 'car-outline', label: "Parking" }
          ].map((action, i) => (
            <TouchableOpacity key={i} style={styles.actionButton}>
              <Ionicons name={action.icon as any} size={24} color="#374151" />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

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
                  source={{ uri: place.thumbnail_url || getCategoryFallbackImage(place.tavvy_category || '') }} 
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
                      <Text style={styles.placeTagText}>✨ {place.total_signals || 0} signals</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No places added yet</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  backButton: {
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
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  heroDot: {
    color: '#fff',
    marginHorizontal: 8,
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
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06B6D4',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
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
  searchPlaceholder: {
    marginLeft: 8,
    color: '#9CA3AF',
    fontSize: 13,
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
  mapPreview: {
    marginHorizontal: 16,
    marginBottom: 16,
    height: 140,
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  mapIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
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
  placeCardClosed: {
    opacity: 0.7,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusOpen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  statusClosed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: '#059669',
  },
  statusTextClosed: {
    color: '#DC2626',
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
});
