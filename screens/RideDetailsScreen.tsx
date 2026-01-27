// ============================================================================
// RIDE DETAILS SCREEN
// ============================================================================
// Detailed view of a theme park ride with Tavvy signals
// Place this file in: screens/RideDetailsScreen.tsx
// Based on mockup: VelociCoaster design with universal review bars
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchPlaceSignals, SignalAggregate } from '../lib/reviews';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Category colors matching the universal review system
const CATEGORY_COLORS = {
  best_for: '#0A84FF',  // Blue - The Good
  vibe: '#8B5CF6',      // Purple - The Vibe
  heads_up: '#FF9500',  // Orange - Heads Up
};

interface RideData {
  id: string;
  name: string;
  parkName: string;
  landName?: string;
  description: string;
  image: string;
  thumbnails: string[];
  videoUrl?: string;
  keyInfo: {
    thrillLevel: string;
    rideType: string;
    audience: string;
    minHeight?: string;
    duration?: string;
    maxSpeed?: string;
    inversions?: number;
  };
}

interface RouteParams {
  rideId: string;
  rideName?: string;
  parkName?: string;
}

// Helper functions for ride data
const getThrillLevelLabel = (subcategory: string | undefined): string => {
  if (!subcategory) return 'Moderate';
  const lower = subcategory.toLowerCase();
  if (lower.includes('thrill') || lower === 'roller_coaster') return 'High Thrill';
  if (lower.includes('water') || lower === 'simulator') return 'Moderate-High';
  if (lower === 'dark_ride' || lower === 'boat_ride') return 'Moderate';
  if (lower === 'carousel' || lower === 'train' || lower === 'show') return 'Mild';
  return 'Moderate';
};

const formatSubcategory = (subcategory: string | undefined): string => {
  if (!subcategory) return 'Attraction';
  return subcategory
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getAudienceFromSubcategory = (subcategory: string | undefined): string => {
  if (!subcategory) return 'All Ages';
  const lower = subcategory.toLowerCase();
  if (lower.includes('thrill') || lower === 'roller_coaster') return 'Teens & Adults';
  if (lower === 'playground' || lower === 'meet_greet') return 'Kids & Families';
  return 'All Ages';
};

const getDefaultImage = (subcategory: string | undefined): string => {
  if (!subcategory) return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
  const lower = subcategory.toLowerCase();
  if (lower.includes('coaster') || lower.includes('thrill')) {
    return 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800';
  }
  if (lower.includes('water') || lower.includes('boat')) {
    return 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800';
  }
  if (lower === 'dark_ride') {
    return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
  }
  return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
};

const extractPhotos = (photos: any): string[] => {
  if (!photos) return [];
  if (Array.isArray(photos)) {
    return photos.map((p: any) => typeof p === 'string' ? p : p.url || p.photo_url || '').filter(Boolean).slice(0, 4);
  }
  return [];
};

// Sample ride data
const SAMPLE_RIDES: Record<string, RideData> = {
  'ride-velocicoaster': {
    id: 'ride-velocicoaster',
    name: 'VELOCICOASTER',
    parkName: 'Islands of Adventure',
    landName: 'Jurassic Park',
    description: 'Experience the apex predator of coasters. Launch into the raptor paddock, twist through inversions, and speed over water on this intense thrill ride.',
    image: 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    thumbnails: [
      'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=400',
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400',
      'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=400',
      'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=400',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=example',
    keyInfo: {
      thrillLevel: 'High Thrill',
      rideType: 'Coaster',
      audience: 'Teens & Adults',
      minHeight: '51"',
      duration: '2 min',
      maxSpeed: '70 mph',
      inversions: 4,
    },
  },
  'ride-hagrids': {
    id: 'ride-hagrids',
    name: "HAGRID'S MAGICAL CREATURES",
    parkName: 'Islands of Adventure',
    landName: 'Wizarding World',
    description: 'Join Hagrid and his magical creatures on a thrilling motorbike adventure through the Forbidden Forest.',
    image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
    thumbnails: [],
    keyInfo: {
      thrillLevel: 'Moderate',
      rideType: 'Family Coaster',
      audience: 'All Ages',
      minHeight: '48"',
      duration: '3 min',
      maxSpeed: '50 mph',
      inversions: 0,
    },
  },
  'ride-avatar': {
    id: 'ride-avatar',
    name: 'AVATAR FLIGHT OF PASSAGE',
    parkName: "Disney's Animal Kingdom",
    landName: 'Pandora',
    description: 'Soar on a Banshee over the breathtaking world of Pandora in this immersive flying simulator.',
    image: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800',
    thumbnails: [],
    keyInfo: {
      thrillLevel: 'Moderate',
      rideType: 'Simulator',
      audience: 'All Ages',
      minHeight: '44"',
      duration: '5 min',
      maxSpeed: 'N/A',
      inversions: 0,
    },
  },
};

export default function RideDetailsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [ride, setRide] = useState<RideData | null>(null);
  const [signals, setSignals] = useState<{
    best_for: SignalAggregate[];
    vibe: SignalAggregate[];
    heads_up: SignalAggregate[];
  }>({ best_for: [], vibe: [], heads_up: [] });
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    loadRideData();
  }, [params?.rideId]);

  const loadRideData = async () => {
    if (!params?.rideId) {
      setLoading(false);
      return;
    }

    try {
      // First try to fetch from Supabase places table
      const { data: placeData, error: placeError } = await supabase
        .from('places')
        .select('id, name, tavvy_category, tavvy_subcategory, city, region, cover_image_url, photos')
        .eq('id', params.rideId)
        .single();

      let rideData: RideData;

      if (placeData && !placeError) {
        // Build ride data from Supabase place
        const thrillLevel = getThrillLevelLabel(placeData.tavvy_subcategory);
        const rideType = formatSubcategory(placeData.tavvy_subcategory);
        const audience = getAudienceFromSubcategory(placeData.tavvy_subcategory);
        
        rideData = {
          id: placeData.id,
          name: placeData.name?.toUpperCase() || 'RIDE',
          parkName: params.parkName || placeData.city || 'Theme Park',
          description: `Experience ${placeData.name}, a ${rideType.toLowerCase()} at ${placeData.city || 'this theme park'}.`,
          image: placeData.cover_image_url || getDefaultImage(placeData.tavvy_subcategory),
          thumbnails: extractPhotos(placeData.photos),
          keyInfo: {
            thrillLevel,
            rideType,
            audience,
          },
        };
      } else {
        // Fallback to sample data or default
        rideData = SAMPLE_RIDES[params.rideId] || {
          id: params.rideId,
          name: params.rideName?.toUpperCase() || 'RIDE',
          parkName: params.parkName || 'Theme Park',
          description: 'Experience this amazing attraction!',
          image: 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
          thumbnails: [],
          keyInfo: {
            thrillLevel: 'Moderate',
            rideType: 'Attraction',
            audience: 'All Ages',
          },
        };
      }

      setRide(rideData);

      // Fetch signals using the universal review system
      try {
        const signalData = await fetchPlaceSignals(params.rideId);
        setSignals({
          best_for: signalData.best_for || [],
          vibe: signalData.vibe || [],
          heads_up: signalData.heads_up || [],
        });
      } catch (signalError) {
        console.log('No signals found for ride, using empty state');
        setSignals({ best_for: [], vibe: [], heads_up: [] });
      }

    } catch (error) {
      console.error('Error loading ride data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Navigate to the universal AddReview screen
  const handleAddReview = () => {
    if (!ride) return;
    navigation.navigate('AddReview' as never, { 
      placeId: ride.id, 
      placeName: ride.name, 
      placeCategory: 'ride' 
    } as never);
  };

  // Render signal bar (matching PlaceDetailsScreen/CityDetailsScreen exactly)
  const renderSignalBar = (
    type: 'best_for' | 'vibe' | 'heads_up',
    categoryTitle: string,
    signalsList: SignalAggregate[],
    bgColor: string,
    iconName: string
  ) => {
    const isExpanded = expandedSection === type;
    const hasMore = signalsList && signalsList.length > 1;
    const hasSignals = signalsList && signalsList.length > 0;

    // Render a single solid colored signal bar
    const renderSolidSignalBar = (signal: SignalAggregate, index: number) => {
      return (
        <TouchableOpacity 
          key={signal.signal_id || index}
          activeOpacity={0.9}
          onPress={() => hasMore && toggleSection(type)}
          style={{
            backgroundColor: bgColor,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>{signal.icon || '📍'}</Text>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 16, 
              fontWeight: '700',
              flex: 1,
            }}>
              {signal.label}
            </Text>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 16, 
              fontWeight: '600',
              marginLeft: 8,
            }}>
              ×{signal.tap_total || signal.current_score || 0}
            </Text>
          </View>
          
          {index === 0 && hasMore && (
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#FFFFFF" 
              style={{ marginLeft: 8 }}
            />
          )}
        </TouchableOpacity>
      );
    };

    // Empty state bar (matching PlaceDetailsScreen)
    const renderEmptyBar = () => (
      <TouchableOpacity 
        onPress={handleAddReview}
        activeOpacity={0.8}
        style={{
          backgroundColor: bgColor,
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Ionicons name={iconName as any} size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600', fontStyle: 'italic', opacity: 0.9 }}>
          {categoryTitle} · Be the first to tap!
        </Text>
      </TouchableOpacity>
    );

    return (
      <View style={{ marginBottom: 8 }}>
        {hasSignals ? (
          <>
            {/* Top Signal (Always Visible) */}
            {renderSolidSignalBar(signalsList[0], 0)}
            
            {/* Expanded Signals List */}
            {isExpanded && signalsList.length > 1 && (
              <View>
                {signalsList.slice(1).map((signal, idx) => 
                  renderSolidSignalBar(signal, idx + 1)
                )}
              </View>
            )}
          </>
        ) : (
          renderEmptyBar()
        )}
      </View>
    );
  };

  // Render Key Info Tag
  const renderKeyInfoTag = (icon: string, label: string, color: string) => (
    <View style={[styles.keyInfoTag, { backgroundColor: color }]}>
      <Text style={styles.keyInfoTagIcon}>{icon}</Text>
      <Text style={styles.keyInfoTagText}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={styles.loadingText}>Loading ride...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Ride not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#0A84FF', marginTop: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header with Back Button */}
        <SafeAreaView style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.rideName}>{ride.name}</Text>
            <Text style={styles.parkName}>
              {ride.parkName}{ride.landName ? ` / ${ride.landName}` : ''}
            </Text>
          </View>
        </SafeAreaView>

        {/* Main Image */}
        <View style={styles.mainImageContainer}>
          <Image source={{ uri: ride.image }} style={styles.mainImage} resizeMode="cover" />
        </View>

        {/* Thumbnail Gallery */}
        {ride.thumbnails && ride.thumbnails.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.thumbnailScroll}
            contentContainerStyle={styles.thumbnailContainer}
          >
            {ride.thumbnails.map((thumb, index) => (
              <TouchableOpacity key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: thumb }} style={styles.thumbnail} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Video Preview (if available) */}
        {ride.videoUrl && (
          <TouchableOpacity 
            style={styles.videoPreview}
            onPress={() => ride.videoUrl && Linking.openURL(ride.videoUrl)}
          >
            <View style={styles.videoThumbnail}>
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
                style={styles.videoOverlay}
              >
                <View style={styles.playButton}>
                  <Ionicons name="play" size={32} color="#fff" />
                </View>
              </LinearGradient>
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle}>{ride.name} POV - 4K</Text>
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
            </View>
          </TouchableOpacity>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description} numberOfLines={showFullDescription ? undefined : 3}>
            {ride.description}
          </Text>
        </View>

        {/* Key Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key info</Text>
          
          {/* Tags Row */}
          <View style={styles.keyInfoTagsRow}>
            {renderKeyInfoTag('🔥', ride.keyInfo.thrillLevel, '#FEE2E2')}
            {renderKeyInfoTag('🎢', ride.keyInfo.rideType, '#E0E7FF')}
            {renderKeyInfoTag('👥', ride.keyInfo.audience, '#FEF3C7')}
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {ride.keyInfo.minHeight && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>📏</Text>
                <Text style={styles.statValue}>{ride.keyInfo.minHeight} min height</Text>
              </View>
            )}
            {ride.keyInfo.duration && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⏱️</Text>
                <Text style={styles.statValue}>{ride.keyInfo.duration} duration</Text>
              </View>
            )}
            {ride.keyInfo.maxSpeed && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>💨</Text>
                <Text style={styles.statValue}>Max Speed: {ride.keyInfo.maxSpeed}</Text>
              </View>
            )}
            {ride.keyInfo.inversions !== undefined && ride.keyInfo.inversions > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>🔄</Text>
                <Text style={styles.statValue}>Inversions: {ride.keyInfo.inversions}</Text>
              </View>
            )}
          </View>

          {/* Read More Button */}
          <TouchableOpacity 
            style={styles.readMoreButton}
            onPress={() => setShowFullDescription(!showFullDescription)}
          >
            <Text style={styles.readMoreText}>Read More</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Community Signals Section */}
        <View style={styles.section}>
          <View style={styles.signalsCard}>
            <Text style={styles.signalsCardTitle}>Community Signals</Text>
            
            {/* The Good - Blue */}
            {renderSignalBar('best_for', 'The Good', signals.best_for, CATEGORY_COLORS.best_for, 'thumbs-up')}
            
            {/* The Vibe - Purple */}
            {renderSignalBar('vibe', 'The Vibe', signals.vibe, CATEGORY_COLORS.vibe, 'sparkles')}
            
            {/* Heads Up - Orange */}
            {renderSignalBar('heads_up', 'Heads Up', signals.heads_up, CATEGORY_COLORS.heads_up, 'alert-circle')}
          </View>
        </View>

        {/* Been Here CTA */}
        <View style={styles.section}>
          <View style={styles.beenHereCard}>
            <Text style={styles.beenHereTitle}>Been here?</Text>
            <Text style={styles.beenHereSubtitle}>Share your experience to help others.</Text>
            
            <Text style={styles.quickTapLabel}>QUICK TAP:</Text>
            {/* Quick tap buttons could go here */}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={handleAddReview}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  // Header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  rideName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  parkName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  // Main Image
  mainImageContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#F3F4F6',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  // Thumbnails
  thumbnailScroll: {
    marginTop: 12,
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnailWrapper: {
    width: 80,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  // Video Preview
  videoPreview: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  videoThumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#1F2937',
  },
  videoOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  // Key Info
  keyInfoTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  keyInfoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  keyInfoTagIcon: {
    fontSize: 14,
  },
  keyInfoTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    gap: 8,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 14,
    color: '#4B5563',
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    gap: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  // Signals Card
  signalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  signalsCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  // Been Here Card
  beenHereCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  beenHereTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  beenHereSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  quickTapLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2DD4BF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
