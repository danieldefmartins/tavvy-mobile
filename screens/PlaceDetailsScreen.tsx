import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Share,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { mapGoogleCategoryToBusinessType } from '../lib/businessTypeConfig';
import { supabase } from '../lib/supabaseClient';
import { fetchPlaceSignals, getPlaceReviewCount, SignalAggregate } from '../lib/reviews';
import { Colors } from '../constants/Colors';
import AddYourTapCardEnhanced from '../components/AddYourTapCardEnhanced';
import {
  // usePlaceTapStats,
  useUserGamification,
  useTap,
  useHasUserTapped
} from '../hooks/useTapSystem';

const { width } = Dimensions.get('window');

// Types matching GitHub implementation
interface EntranceData {
  name: string;
  latitude: number;
  longitude: number;
  road?: string;
  notes?: string;
  isPrimary: boolean;
  maxRvLengthFt?: number | null;
  maxRvHeightFt?: number | null;
  roadType?: 'paved' | 'gravel' | 'dirt' | null;
  grade?: 'flat' | 'moderate' | 'steep' | null;
  tightTurns?: boolean | null;
  lowClearance?: boolean | null;
  seasonalAccess?: 'year_round' | 'seasonal' | null;
  seasonalNotes?: string;
}

interface Signal {
  stamp_id: string;
  dimension: string;
  polarity: 'positive' | 'neutral' | 'improvement';
  total_votes: number;
}

// NEW: Photo interface for carousel
interface PlacePhoto {
  id: string;
  url: string;
  user_id?: string;
  user_name?: string;
  caption?: string;
  created_at?: string;
  is_cover?: boolean;
}

interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  priceLevel: '$' | '$$' | '$$$';
  primaryCategory: string;
  features: string[];
  openYearRound: boolean;
  coverImageUrl: string | null;
  currentStatus: string;
  is24_7: boolean;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  website?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  distance: number;
  // NEW: Category-specific fields
  avgMealCost?: string; // For restaurants: "$30-50"
  totalSites?: number; // For RV parks
  starRating?: number; // For hotels
  closingTime?: string; // Operating hours
  opening_hours?: any; // JSON object or array for business hours
  is_insured?: boolean;
  is_licensed?: boolean;
  established_date?: string;
  socials?: Record<string, string>;
  // Entrance fields (up to 6 entrances)
  entrance_1_name?: string;
  entrance_1_latitude?: number;
  entrance_1_longitude?: number;
  entrance_1_is_primary?: boolean;
  entrance_1_road?: string;
  entrance_1_notes?: string;
  entrance_1_max_rv_length_ft?: number;
  entrance_1_max_rv_height_ft?: number;
  entrance_1_road_type?: 'paved' | 'gravel' | 'dirt';
  entrance_1_grade?: 'flat' | 'moderate' | 'steep';
  entrance_1_tight_turns?: boolean;
  entrance_1_low_clearance?: boolean;
  entrance_1_seasonal_access?: 'year_round' | 'seasonal';
  entrance_1_seasonal_notes?: string;
  // ... (entrance_2 through entrance_6 would follow same pattern)
  [key: string]: any; // For dynamic entrance field access
}

// Category emoji mapping
const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    'restaurant': '🍽️',
    'italian restaurant': '🍝',
    'mexican restaurant': '🌮',
    'asian restaurant': '🍜',
    'coffee shop': '☕',
    'cafe': '☕',
    'rv park': '🏕️',
    'campground': '⛺',
    'hotel': '🏨',
    'resort': '🏖️',
    'hospital': '🏥',
    'medical center': '🏥',
    'airport': '✈️',
    'theme park': '🎢',
    'national park': '🏞️',
    'shopping mall': '🛍️',
    'gym': '💪',
    'spa': '💆',
    'bar': '🍺',
    'nightclub': '🎉',
    'museum': '🏛️',
    'zoo': '🦁',
    'aquarium': '🐠',
    'beach': '🏖️',
    'gas station': '⛽',
    'car dealership': '🚗',
    'auto repair': '🔧',
    'default': '📍',
  };
  
  const lowerCategory = category.toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerCategory.includes(key)) return emoji;
  }
  return emojiMap.default;
};

// Get price display based on category
const getPriceDisplay = (place: Place): string | null => {
  const category = place.primaryCategory?.toLowerCase() || '';
  
  // Restaurants, cafes, bars - show meal cost or price level
  if (category.includes('restaurant') || category.includes('cafe') || category.includes('coffee') || category.includes('bar')) {
    if (place.avgMealCost) return `💰 ${place.avgMealCost}`;
    return `💰 ${place.priceLevel}`;
  }
  
  // Hotels - show star rating
  if (category.includes('hotel') || category.includes('resort')) {
    if (place.starRating) return `⭐ ${place.starRating}-star`;
    return `💰 ${place.priceLevel}`;
  }
  
  // RV Parks - show site count
  if (category.includes('rv') || category.includes('campground')) {
    if (place.totalSites) return `🏕️ ${place.totalSites} sites`;
    return null;
  }
  
  // Hospitals, airports, parks - no price
  if (category.includes('hospital') || category.includes('airport') || category.includes('park') || category.includes('museum')) {
    return null;
  }
  
  // Default - show price level if available
  return place.priceLevel ? `💰 ${place.priceLevel}` : null;
};

// Calculate drive time from distance
const getDriveTime = (distanceMiles: number): string => {
  // Assume average speed of 30 mph in mixed traffic
  const minutes = Math.round((distanceMiles / 30) * 60);
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
};

export default function PlaceDetailScreen({ route, navigation }: any) {
  // ===== STATE DECLARATIONS =====
  const { placeId } = route?.params || {};
  const [place, setPlace] = useState<Place | null>(null);
  const [signals, setSignals] = useState<{
    best_for: SignalAggregate[];
    vibe: SignalAggregate[];
    heads_up: SignalAggregate[];
    medals: string[];
  }>({ best_for: [], vibe: [], heads_up: [], medals: [] });
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'positive' | 'neutral' | 'improvement' | null>(null);
  const [activeTab, setActiveTab] = useState<'signals' | 'info' | 'photos' | 'entrances'>('signals');
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [navDestination, setNavDestination] = useState<{lat: number, lng: number, name: string} | null>(null);
  
  // NEW: Photo carousel state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  // Determine business type from place data
  const businessType = place ? mapGoogleCategoryToBusinessType(place.primaryCategory || 'default') : 'default';

  // Helper to render Trust Badges
  const renderTrustBadges = () => {
    if (!place) return null;
    return (
      <View style={styles.trustContainer}>
        {place.is_insured && (
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#059669" />
            <Text style={styles.trustText}>Insured</Text>
          </View>
        )}
        {place.is_licensed && (
          <View style={styles.trustBadge}>
            <Ionicons name="ribbon" size={16} color="#059669" />
            <Text style={styles.trustText}>Licensed</Text>
          </View>
        )}
        {place.established_date && (
          <View style={styles.trustBadge}>
            <Ionicons name="time" size={16} color="#4B5563" />
            <Text style={styles.trustText}>Est. {new Date(place.established_date).getFullYear()}</Text>
          </View>
        )}
      </View>
    );
  };

  // Helper to render Social Icons
  const renderSocials = () => {
    if (!place?.socials) return null;
    const platforms = [
      { key: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
      { key: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
      { key: 'TikTok', icon: 'musical-notes', color: '#000000' },
      { key: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
      { key: 'LinkedIn', icon: 'logo-linkedin', color: '#0077B5' },
      { key: 'X (Twitter)', icon: 'logo-twitter', color: '#000000' },
    ];

    return (
      <View style={styles.socialsContainer}>
        {platforms.map((p) => {
          const url = place.socials?.[p.key];
          if (!url) return null;
          return (
            <TouchableOpacity key={p.key} onPress={() => Linking.openURL(url)} style={styles.socialIcon}>
              <Ionicons name={p.icon as any} size={24} color={p.color} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // ===== ENHANCED TAP SYSTEM HOOKS =====
  // These hooks must be called AFTER place state is declared but they handle null/undefined gracefully
   // const stats = usePlaceTapStats(place?.id);d || '');
  const { gamification } = useUserGamification();
  const { hasTapped, userSignals } = useHasUserTapped(place?.id || '');
  const { quickTap } = useTap();

  // Fetch place data
  useEffect(() => {
    if (!placeId) {
      setError('No place ID provided');
      setLoading(false);
      return;
    }

    const fetchPlaceData = async () => {
      try {
        setLoading(true);
        
        // Check if placeId is a valid UUID (real data) or mock ID
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(placeId);

        if (!isValidUUID) {
          // Mock data fallback for non-UUID IDs (e.g., "1", "2", "3")
          const mockPlace: Place = {
            id: placeId,
            name: "Tony's Town Square Restaurant",
            latitude: 28.4175,
            longitude: -81.5814,
            priceLevel: '$$',
            primaryCategory: 'Italian Restaurant',
            features: ['Family Friendly', 'Reservations', 'Outdoor Seating'],
            openYearRound: true,
            coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            currentStatus: 'Open & Accessible',
            is24_7: false,
            addressLine1: '123 Main Street',
            city: 'Orlando',
            state: 'FL',
            zipCode: '32830',
            phone: '(407) 555-1234',
            website: 'tonystownsquare.com',
            distance: 2.3,
            avgMealCost: '$30-50',
            closingTime: '10 PM',
            entrance_1_name: 'Main Entrance',
            entrance_1_latitude: 28.4175,
            entrance_1_longitude: -81.5814,
            entrance_1_is_primary: true,
            entrance_2_name: 'Patio Entrance',
            entrance_2_latitude: 28.4176,
            entrance_2_longitude: -81.5813,
            entrance_2_is_primary: false,
            // NEW: Mock Data for Trust & Socials
            is_insured: true,
            is_licensed: true,
            established_date: '1989-05-01',
            logo_url: 'https://ui-avatars.com/api/?name=Tonys+Town&background=random&size=200',
            socials: {
              Instagram: 'https://instagram.com/tonystownsquare',
              Facebook: 'https://facebook.com/tonystownsquare',
              WhatsApp: 'https://wa.me/14075551234'
            }
          };
          setPlace(mockPlace);
          
          // Mock photos
          setPhotos([
            { id: '1', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', is_cover: true },
            { id: '2', url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800' },
            { id: '3', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800' },
          ]);
          
          // Mock signals (Updated structure)
          setSignals({
            best_for: [
              { place_id: '1', signal_id: '1', tap_total: 89, current_score: 85.5, review_count: 80, last_tap_at: null, is_ghost: false, label: 'Great Food', icon: '🍽️', category: 'best_for' },
              { place_id: '1', signal_id: '2', tap_total: 67, current_score: 60.2, review_count: 60, last_tap_at: null, is_ghost: false, label: 'Fast Service', icon: '⚡', category: 'best_for' }
            ],
            vibe: [
              { place_id: '1', signal_id: '3', tap_total: 87, current_score: 82.1, review_count: 80, last_tap_at: null, is_ghost: false, label: 'Cozy', icon: '🛋️', category: 'vibe' }
            ],
            heads_up: [
              { place_id: '1', signal_id: '5', tap_total: 12, current_score: 0.8, review_count: 10, last_tap_at: null, is_ghost: true, label: 'Pricey', icon: '💰', category: 'heads_up' }
            ],
            medals: ['vibe_check', 'speed_demon']
          });
          
          setLoading(false);
          return;
        }

        // Fetch real place data from Supabase
        const { data: placeData, error: placeError } = await supabase
          .from('places')
          .select('*')
          .eq('id', placeId)
          .single();

        if (placeError) throw placeError;

          // Map database fields to Place interface
        const mappedPlace: Place = {
          id: placeData.id,
          name: placeData.name,
          latitude: placeData.latitude,
          longitude: placeData.longitude,
          priceLevel: placeData.price_level || '$$',
          primaryCategory: placeData.primary_category || 'Restaurant',
          features: placeData.features || [],
          openYearRound: placeData.open_year_round ?? true,
          coverImageUrl: placeData.cover_image_url,
          currentStatus: placeData.current_status || 'open_accessible',
          is24_7: placeData.is_24_7 ?? false,
          addressLine1: placeData.address_line_1,
          city: placeData.city,
          state: placeData.state,
          zipCode: placeData.zip_code,
          phone: placeData.phone,
          website: placeData.website,
          instagramUrl: placeData.instagram_url,
          facebookUrl: placeData.facebook_url,
          distance: placeData.distance || 0,
          avgMealCost: placeData.avg_meal_cost,
          totalSites: placeData.total_sites,
          starRating: placeData.star_rating,
          closingTime: placeData.closing_time,
          opening_hours: placeData.opening_hours,
          is_insured: placeData.is_insured,
          is_licensed: placeData.is_licensed,
          established_date: placeData.established_date,
          socials: placeData.socials,
          // Map entrance fields
          entrance_1_name: placeData.entrance_1_name,
          entrance_1_latitude: placeData.entrance_1_latitude,
          entrance_1_longitude: placeData.entrance_1_longitude,
          entrance_1_is_primary: placeData.entrance_1_is_primary,
          entrance_1_road: placeData.entrance_1_road,
          entrance_1_notes: placeData.entrance_1_notes,
          entrance_1_max_rv_length_ft: placeData.entrance_1_max_rv_length_ft,
          entrance_1_max_rv_height_ft: placeData.entrance_1_max_rv_height_ft,
          entrance_1_road_type: placeData.entrance_1_road_type,
          entrance_1_grade: placeData.entrance_1_grade,
          entrance_1_tight_turns: placeData.entrance_1_tight_turns,
          entrance_1_low_clearance: placeData.entrance_1_low_clearance,
          entrance_1_seasonal_access: placeData.entrance_1_seasonal_access,
          entrance_1_seasonal_notes: placeData.entrance_1_seasonal_notes,
        };

        setPlace(mappedPlace);

        // Fetch photos
        const { data: photosData } = await supabase
          .from('place_photos')
          .select('*')
          .eq('place_id', placeId)
          .order('is_cover', { ascending: false });

        if (photosData) {
          setPhotos(photosData.map(p => ({
            id: p.id,
            url: p.url,
            user_id: p.user_id,
            user_name: p.user_name,
            caption: p.caption,
            created_at: p.created_at,
            is_cover: p.is_cover,
          })));
        }

        // Fetch signals with Living Score Logic
        const signalData = await fetchPlaceSignals(placeId);
        setSignals(signalData);

        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching place:', err);
        setError(err.message || 'Failed to load place');
        setLoading(false);
      }
    };

    fetchPlaceData();
  }, [placeId]);

  // Extract entrances from place data
  const extractEntrances = (place: Place): EntranceData[] => {
    const entrances: EntranceData[] = [];
    
    for (let i = 1; i <= 6; i++) {
      const name = place[`entrance_${i}_name`];
      const lat = place[`entrance_${i}_latitude`];
      const lng = place[`entrance_${i}_longitude`];
      
      if (name && lat && lng) {
        entrances.push({
          name,
          latitude: lat,
          longitude: lng,
          road: place[`entrance_${i}_road`],
          notes: place[`entrance_${i}_notes`],
          isPrimary: place[`entrance_${i}_is_primary`] ?? false,
          maxRvLengthFt: place[`entrance_${i}_max_rv_length_ft`],
          maxRvHeightFt: place[`entrance_${i}_max_rv_height_ft`],
          roadType: place[`entrance_${i}_road_type`],
          grade: place[`entrance_${i}_grade`],
          tightTurns: place[`entrance_${i}_tight_turns`],
          lowClearance: place[`entrance_${i}_low_clearance`],
          seasonalAccess: place[`entrance_${i}_seasonal_access`],
          seasonalNotes: place[`entrance_${i}_seasonal_notes`],
        });
      }
    }
    
    // Sort so primary entrance is first
    return entrances.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  };

  // Helper to render Medals
  const renderMedal = (medalId: string) => {
    let icon = 'trophy';
    let label = 'Top Rated';
    let color = '#FFD700'; // Gold

    switch (medalId) {
      case 'vibe_check':
        icon = 'heart';
        label = 'Vibe Check Passed';
        color = '#EC4899'; // Pink
        break;
      case 'speed_demon':
        icon = 'flash';
        label = 'Speed Demon';
        color = '#F59E0B'; // Amber
        break;
      case 'hidden_gem':
        icon = 'diamond';
        label = 'Hidden Gem';
        color = '#3B82F6'; // Blue
        break;
      case 'comeback_king':
        icon = 'shield-checkmark';
        label = 'Comeback King';
        color = '#10B981'; // Green
        break;
    }

    return (
      <View key={medalId} style={[styles.medalBadge, { backgroundColor: color + '20', borderColor: color }]}>
        <Ionicons name={icon as any} size={16} color={color} />
        <Text style={[styles.medalText, { color: color }]}>{label}</Text>
      </View>
    );
  };

  // Helper to render Signal Bars
  const renderSignalBar = (item: SignalAggregate, color: string) => {
    const widthPercent = Math.min((item.current_score / 10) * 100, 100); 
    
    return (
      <View key={item.signal_id} style={[styles.signalRow, item.is_ghost && styles.ghostRow]}>
        <Text style={styles.signalIcon}>{item.icon}</Text>
        <View style={styles.signalContent}>
          <View style={styles.signalHeader}>
            <Text style={[styles.signalLabel, item.is_ghost && styles.ghostText]}>
              {item.label}
            </Text>
            <Text style={[styles.signalScore, { color: item.is_ghost ? '#9CA3AF' : color }]}>
              {item.current_score.toFixed(1)}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${widthPercent}%`, backgroundColor: item.is_ghost ? '#D1D5DB' : color }
              ]} 
            />
          </View>
          {item.is_ghost && (
            <Text style={styles.ghostNote}>Fading out... (Old report)</Text>
          )}
        </View>
      </View>
    );
  };

  // Toggle expanded section
  const toggleSection = (section: 'positive' | 'neutral' | 'improvement') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Handle navigation to entrance
  const handleNavigate = (lat: number, lng: number, name: string) => {
    setNavDestination({ lat, lng, name });
    setShowNavModal(true);
  };

  const openMapsApp = (app: 'apple' | 'google' | 'waze') => {
    if (!navDestination) return;
    const { lat, lng, name } = navDestination;
    
    let url = '';
    if (app === 'apple') {
      url = `maps://?daddr=${lat},${lng}&dirflg=d&q=${encodeURIComponent(name)}`;
    } else if (app === 'google') {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name)}`;
    } else if (app === 'waze') {
      url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    }

    Linking.openURL(url).catch(() => {
      alert(`Could not open ${app === 'apple' ? 'Apple Maps' : app === 'google' ? 'Google Maps' : 'Waze'}.`);
    });
    setShowNavModal(false);
  };

  // Handle phone call
  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  // Handle website
  const handleWebsite = (website: string) => {
    const url = website.startsWith('http') ? website : `https://${website}`;
    Linking.openURL(url);
  };

  // Handle share
  const handleShare = async () => {
    if (!place) return;
    try {
      await Share.share({
        message: `Check out ${place.name} on TavvY!`,
        title: place.name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Handle photo carousel scroll
  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / width);
    setCurrentPhotoIndex(index);
  };

  // NEW: Navigate to photos screen
  const handleViewAllPhotos = () => {
    if (place) {
      navigation.navigate('PlacePhotos', {
        placeId: place.id,
        placeName: place.name,
        photos: photos,
      });
    }
  };

  // NEW: Navigate to add photo screen
  const handleAddPhoto = () => {
    if (place) {
      navigation.navigate('AddPhoto', {
        placeId: place.id,
        placeName: place.name,
      });
    }
  };

  const renderSignalLine = (
    type: 'best_for' | 'vibe' | 'heads_up',
    categoryTitle: string,
    signalsList: SignalAggregate[],
    colors: { primary: string; light: string; text: string }
  ) => {
    if (!signalsList || signalsList.length === 0) return null;

    const topSignal = signalsList[0];
    const isExpanded = expandedSection === type;
    const hasMore = signalsList.length > 1;

    // Use PRIMARY color for background (Solid Bar) and WHITE for text
    const bgColor = colors.primary;
    const textColor = '#FFFFFF';

    return (
      <View style={styles.section}>
        {/* Removed Section Title to match the cleaner look, or keep it if preferred. 
            User asked for "The Good", "The Vibe", "Heads Up" text, so we keep it but style it better. */}
        <Text style={[styles.sectionTitle, { color: '#1F2937', marginBottom: 6, fontSize: 17, fontWeight: '700', marginLeft: 4 }]}>{categoryTitle}</Text>
        
        <View style={styles.signalLineContainer}>
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => hasMore && toggleSection(type)}
            style={[styles.signalLine, { 
              backgroundColor: bgColor, 
              borderRadius: 10, // Slightly tighter radius for compact look
              paddingVertical: 12, // Reduced padding for compact look
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 3,
              elevation: 2,
            }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>{topSignal.icon}</Text>
              <Text style={{ color: textColor, fontSize: 15, fontWeight: '700', marginRight: 6 }}>
                {topSignal.label}
              </Text>
              <Text style={{ color: textColor, fontSize: 15, fontWeight: '500', opacity: 0.9 }}>
                 ×{topSignal.tap_total}
              </Text>
            </View>
            
            {hasMore && (
              <Ionicons 
                name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={textColor} 
              />
            )}
          </TouchableOpacity>
          
          {isExpanded && hasMore && (
            <View style={{ 
              marginTop: 4, 
              backgroundColor: bgColor, 
              borderRadius: 12, 
              overflow: 'hidden',
              opacity: 0.95 
            }}>
              {signalsList.slice(1).map((signal, idx) => (
                <View key={idx} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderTopWidth: 1,
                  borderTopColor: 'rgba(255,255,255,0.2)'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 10 }}>{signal.icon}</Text>
                    <Text style={{ color: textColor, fontSize: 15, fontWeight: '600' }}>
                      {signal.label}
                    </Text>
                  </View>
                  <Text style={{ color: textColor, fontSize: 15, fontWeight: '500', opacity: 0.9 }}>
                     ×{signal.tap_total}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEntranceItem = (entrance: EntranceData, idx: number, placeLatLng: { lat: number; lng: number }) => {
    const hasRvWarnings = entrance.tightTurns || entrance.lowClearance || entrance.grade === 'steep';

    return (
      <View key={idx} style={styles.entranceItem}>
        <View style={styles.entranceInfo}>
          <Text style={[styles.entranceName, entrance.isPrimary && styles.entranceNamePrimary]}>
            {entrance.name}
          </Text>
          
          {entrance.maxRvLengthFt && (
            <Text style={styles.entranceDetail}>
              Max RV: {entrance.maxRvLengthFt}ft
            </Text>
          )}
          {entrance.roadType && (
            <Text style={styles.entranceDetail}>
              Road: {entrance.roadType.charAt(0).toUpperCase() + entrance.roadType.slice(1)}
            </Text>
          )}
          {hasRvWarnings && (
            <View style={styles.warningBadge}>
              <Ionicons name="warning" size={12} color="#f97316" />
              <Text style={styles.warningText}>
                {[
                  entrance.tightTurns && 'Tight turns',
                  entrance.lowClearance && 'Low clearance',
                  entrance.grade === 'steep' && 'Steep grade',
                ].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => handleNavigate(entrance.latitude, entrance.longitude, entrance.name)}
        >
          <Text style={styles.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // NEW: Render photo carousel item
  const renderCarouselItem = ({ item }: { item: PlacePhoto }) => (
    <Image
      source={{ uri: item.url }}
      style={styles.carouselImage}
      resizeMode="cover"
    />
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading place details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !place) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color="#999" />
        <Text style={styles.errorText}>{error || 'Place not found'}</Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const entrances = extractEntrances(place);
  // const categorizedSignals = categorizeSignals(signals); // REMOVED: Data comes pre-categorized
  const fullAddress = [place.addressLine1, place.city, place.state, place.zipCode]
    .filter(Boolean)
    .join(', ');
  const isOpen = place.currentStatus === 'open_accessible' || place.currentStatus === 'Open & Accessible';
  
  // Calculate total signals from the new structure
  const totalSignals = (signals.best_for?.length || 0) + 
                       (signals.vibe?.length || 0) + 
                       (signals.heads_up?.length || 0);
  const priceDisplay = getPriceDisplay(place);
  const driveTime = getDriveTime(place.distance);
  const categoryEmoji = getCategoryEmoji(place.primaryCategory);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ===== NEW HERO SECTION ===== */}
        <View style={styles.heroContainer}>
          {/* Photo Carousel */}
          <FlatList
            ref={carouselRef}
            data={photos.length > 0 ? photos : [{ id: 'placeholder', url: 'https://via.placeholder.com/400x300' }]}
            renderItem={renderCarouselItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleCarouselScroll}
            scrollEventThrottle={16}
          />
          
          {/* Gradient Overlay */}
          <View style={styles.heroGradient} />
          
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          {/* Top Right Buttons */}
          <View style={styles.topRightButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="#000" />
            </TouchableOpacity>
          </View>
          
          {/* Photo Count Badge */}
          {photos.length > 1 && (
            <TouchableOpacity style={styles.photoCountBadge} onPress={handleViewAllPhotos}>
              <Ionicons name="camera" size={14} color="#fff" />
              <Text style={styles.photoCountText}>{photos.length}</Text>
            </TouchableOpacity>
          )}
          
          {/* Pagination Dots */}
          {photos.length > 1 && (
            <View style={styles.paginationDots}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentPhotoIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
          
	          {/* Hero Text Overlay */}
	          <View style={styles.heroTextContainer}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 12}}>
                  {place.logo_url && (
                    <Image source={{ uri: place.logo_url }} style={styles.logoImage} />
                  )}
                  <View style={{flex: 1}}>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <View style={styles.heroSubtitle}>
                      <Text style={styles.heroSubtitleText}>
                        {categoryEmoji} {place.primaryCategory}
                      </Text>
                      {priceDisplay && (
                        <Text style={styles.heroSubtitleText}>{priceDisplay}</Text>
                      )}
                      <Text style={styles.heroSubtitleText}>📍 {place.distance} mi</Text>
                    </View>
                  </View>
                </View>
	          </View>
	        </View>

        {/* ===== QUICK INFO BAR ===== */}
        <View style={styles.quickInfoBar}>
          <TouchableOpacity 
            style={styles.quickInfoItem}
            onPress={() => setShowHoursModal(true)}
          >
            <Text style={styles.quickInfoIcon}>🕐</Text>
            <Text style={[styles.quickInfoLabel, isOpen && styles.quickInfoLabelOpen]}>
              {isOpen ? 'Open' : 'Closed'}
            </Text>
            <Text style={styles.quickInfoSub}>
              {place.closingTime ? `Until ${place.closingTime}` : (place.is24_7 ? '24/7' : '')}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.quickInfoDivider} />
          
          <TouchableOpacity 
            style={styles.quickInfoItem}
            onPress={() => handleCall(place.phone || '')}
          >
            <Text style={styles.quickInfoIcon}>📞</Text>
            <Text style={styles.quickInfoValue}>Call</Text>
            <Text style={styles.quickInfoSub}>Business</Text>
          </TouchableOpacity>
          
          <View style={styles.quickInfoDivider} />
          
          <TouchableOpacity 
            style={styles.quickInfoItem}
            onPress={() => setActiveTab('photos')}
          >
            <Text style={styles.quickInfoIcon}>📷</Text>
            <Text style={styles.quickInfoValue}>{photos.length}</Text>
            <Text style={styles.quickInfoSub}>Photos</Text>
          </TouchableOpacity>
          
          <View style={styles.quickInfoDivider} />
          
          <TouchableOpacity 
            style={styles.quickInfoItem}
            onPress={() => handleNavigate(place.latitude, place.longitude, place.name)}
          >
            <Text style={styles.quickInfoIcon}>🚗</Text>
            <Text style={styles.quickInfoValue}>{driveTime}</Text>
            <Text style={styles.quickInfoSub}>Drive</Text>
          </TouchableOpacity>
        </View>

        {/* ===== TAB NAVIGATION ===== */}
        <View style={styles.tabContainer}>
          {(['signals', 'info', 'photos', 'entrances'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== TAB CONTENT ===== */}
        <View style={styles.content}>
          {/* Signals Tab (UPDATED) */}
          {activeTab === 'signals' && (
            <View style={styles.tabContent}>
              {/* Medals Section */}
              {signals.medals && signals.medals.length > 0 && (
                <View style={styles.medalsContainer}>
                  {signals.medals.map(renderMedal)}
                </View>
              )}

              {/* The Good */}
              {renderSignalLine('best_for', 'The Good', signals.best_for, Colors.positive)}

              {/* The Vibe */}
              {renderSignalLine('vibe', 'The Vibe', signals.vibe, Colors.vibe)}

              {/* The Bad (Heads Up) */}
              {renderSignalLine('heads_up', 'Heads Up', signals.heads_up, Colors.negative)}

              {/* Add Your Tap Card (Moved to Bottom) */}
              <View style={{ marginTop: 24 }}>
                <AddYourTapCardEnhanced 
                  placeId={place.id} 
                  placeName={place.name}
                  placeCategory={place.primaryCategory || 'default'}
                  onPress={() => navigation.navigate('AddReview', { placeId: place.id })}
                  onQuickTap={(signalId, signalName) => quickTap(place.id, signalId, signalName)}
                  hasUserReviewed={hasTapped}
                  userSignalsCount={userSignals.length}
                  todayTapCount={0}
                  lastTapTime={null}
                  totalTapCount={0}
                  userStreak={gamification.currentStreak}
                  userBadges={gamification.badges}
                  userImpactCount={gamification.impactCount}
                />
              </View>

              {(!signals.best_for?.length && !signals.vibe?.length && !signals.heads_up?.length) && (
                <Text style={styles.emptyText}>No signals yet. Be the first to tap!</Text>
              )}
            </View>
          )}

	          {/* Info Tab */}
	          {activeTab === 'info' && (
	            <View style={styles.section}>
                  {/* Trust Badges Section */}
                  {(place.is_insured || place.is_licensed || place.established_date) && (
                    <View style={{marginBottom: 20}}>
                      <Text style={styles.sectionTitle}>Trust & Verification</Text>
                      {renderTrustBadges()}
                    </View>
                  )}

                  {/* Social Media Section */}
                  {place.socials && Object.keys(place.socials).length > 0 && (
                    <View style={{marginBottom: 20}}>
                      <Text style={styles.sectionTitle}>Connect</Text>
                      {renderSocials()}
                    </View>
                  )}

	              <Text style={styles.sectionTitle}>Location & Contact</Text>
              
              {fullAddress && (
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => setShowAddressModal(true)}
                >
                  <Ionicons name="location" size={20} color="#007AFF" />
                  <Text style={[styles.contactText, styles.contactLink]}>{fullAddress}</Text>
                </TouchableOpacity>
              )}
              
              {place.phone && (
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => handleCall(place.phone!)}
                >
                  <Ionicons name="call" size={20} color="#007AFF" />
                  <Text style={[styles.contactText, styles.contactLink]}>{place.phone}</Text>
                </TouchableOpacity>
              )}
              
              {place.website && (
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => handleWebsite(place.website!)}
                >
                  <Ionicons name="globe" size={20} color="#007AFF" />
                  <Text style={[styles.contactText, styles.contactLink]}>
                    {place.website.replace(/^https?:\/\//, '')}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Features */}
              {place.features && place.features.length > 0 && (
                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Features</Text>
                  <View style={styles.featuresList}>
                    {place.features.map((feature, idx) => (
                      <View key={idx} style={styles.featureTag}>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Claim Business Button */}
              <View style={styles.claimContainer}>
                <TouchableOpacity 
                  style={styles.claimButton}
                  onPress={() => navigation.navigate('ClaimBusiness', { placeId: place.id, placeName: place.name })}
                >
                  <Ionicons name="business-outline" size={20} color="#6B7280" />
                  <Text style={styles.claimText}>Claim This Business</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Photos</Text>
                {photos.length > 0 && (
                  <TouchableOpacity onPress={handleViewAllPhotos}>
                    <Text style={styles.seeAllText}>See all {photos.length}</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {photos.length > 0 ? (
                <View style={styles.photoGrid}>
                  {photos.slice(0, 4).map((photo, idx) => (
                    <TouchableOpacity 
                      key={photo.id} 
                      style={styles.photoGridItem}
                      onPress={handleViewAllPhotos}
                    >
                      <Image source={{ uri: photo.url }} style={styles.photoGridImage} />
                      {idx === 3 && photos.length > 4 && (
                        <View style={styles.photoGridOverlay}>
                          <Text style={styles.photoGridOverlayText}>+{photos.length - 4}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noPhotosText}>No photos yet</Text>
              )}

              <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <Ionicons name="camera-outline" size={20} color="#007AFF" />
                <Text style={styles.addPhotoText}>Add a Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Entrances Tab */}
          {activeTab === 'entrances' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Entrances</Text>
              
              {entrances.length > 0 ? (
                <View style={styles.entrancesList}>
                  {entrances.map((entrance, idx) => 
                    renderEntranceItem(entrance, idx, { lat: place.latitude, lng: place.longitude })
                  )}
                </View>
              ) : (
                <View style={styles.noEntrancesContainer}>
                  <Ionicons name="navigate-outline" size={48} color="#ccc" />
                  <Text style={styles.noEntrancesText}>No entrance information available</Text>
                  <TouchableOpacity
                    style={styles.defaultNavigateButton}
                    onPress={() => handleNavigate(place.latitude, place.longitude, place.name)}
                  >
                    <Ionicons name="navigate" size={20} color="#fff" />
                    <Text style={styles.defaultNavigateText}>Navigate to {place.name}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Hours Modal */}
      <Modal
        visible={showHoursModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHoursModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowHoursModal(false)}
        >
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
            {/* Header */}
            <View style={{ 
              backgroundColor: '#f8f9fa', 
              padding: 20, 
              borderBottomWidth: 1, 
              borderBottomColor: '#eee',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ionicons name="time-outline" size={24} color="#333" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#333' }}>Business Hours</Text>
            </View>

            {/* Content */}
            <View style={{ padding: 24 }}>
              {place?.opening_hours ? (
                Array.isArray(place.opening_hours) ? (
                  place.opening_hours.map((item: any, index: number) => (
                    <View key={index} style={styles.hoursBlock}>
                      <Text style={styles.dayText}>{item.days || item.day}</Text>
                      <Text style={styles.timeText}>{item.hours || item.time}</Text>
                    </View>
                  ))
                ) : (
                  // Fallback for object format or other structures
                  Object.entries(place.opening_hours).map(([day, hours]: [string, any], index) => (
                    <View key={index} style={styles.hoursBlock}>
                      <Text style={[styles.dayText, { textTransform: 'capitalize' }]}>{day.replace(/_/g, ' ')}</Text>
                      <Text style={styles.timeText}>{String(hours)}</Text>
                    </View>
                  ))
                )
              ) : (
                <View style={styles.hoursBlock}>
                  <Text style={styles.dayText}>Hours not available</Text>
                  <Text style={styles.timeText}>Check with business</Text>
                </View>
              )}
            </View>

            {/* Footer */}
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#eee' }}>
              <TouchableOpacity 
                style={{
                  backgroundColor: '#007AFF',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                onPress={() => setShowHoursModal(false)}
              >
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Navigation App Selection Modal */}
      <Modal
        visible={showNavModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowNavModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowNavModal(false)}
        >
          <View style={[styles.modalContent, { paddingBottom: 30 }]}>
            <Text style={styles.modalTitle}>Navigate with...</Text>
            
            <TouchableOpacity 
              style={styles.navOptionButton}
              onPress={() => openMapsApp('apple')}
            >
              <Ionicons name="map" size={24} color="#007AFF" />
              <Text style={styles.navOptionText}>Apple Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.navOptionButton}
              onPress={() => openMapsApp('google')}
            >
              <Ionicons name="logo-google" size={24} color="#DB4437" />
              <Text style={styles.navOptionText}>Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.navOptionButton}
              onPress={() => openMapsApp('waze')}
            >
              <Ionicons name="car" size={24} color="#33CCFF" />
              <Text style={styles.navOptionText}>Waze</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.closeButton, { marginTop: 16 }]}
              onPress={() => setShowNavModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Address Map Popup Modal */}
      <Modal
        visible={showAddressModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.fullScreenModalOverlay}>
          <View style={styles.fullScreenModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Location</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            
            {place && (
              <View style={styles.popupMapContainer}>
                <MapLibreGL.MapView
                  style={styles.popupMap}
                  styleURL="https://tiles.openfreemap.org/styles/liberty"
                  logoEnabled={false}
                  attributionEnabled={false}
                >
                  <MapLibreGL.Camera
                    zoomLevel={15}
                    centerCoordinate={[place.longitude, place.latitude]}
                    animationMode="none"
                  />
                  <MapLibreGL.PointAnnotation
                    id="popup-marker"
                    coordinate={[place.longitude, place.latitude]}
                  >
                    <View style={styles.markerContainer}>
                      <View style={[styles.marker, { backgroundColor: Colors.primary }]}>
                        <Ionicons name="location" size={24} color="#fff" />
                      </View>
                    </View>
                  </MapLibreGL.PointAnnotation>
                </MapLibreGL.MapView>
              </View>
            )}

            <View style={styles.addressPopupContent}>
              <Text style={styles.addressPopupText}>{fullAddress}</Text>
              
              <Text style={styles.navigateLabel}>Navigate with:</Text>
              
              <View style={styles.navButtonsRow}>
                <TouchableOpacity 
                  style={styles.navCircleButton}
                  onPress={() => {
                    setNavDestination({ lat: place?.latitude || 0, lng: place?.longitude || 0, name: place?.name || '' });
                    openMapsApp('apple');
                    setShowAddressModal(false);
                  }}
                >
                  <View style={[styles.navCircleIcon, { backgroundColor: '#007AFF' }]}>
                    <Ionicons name="map" size={24} color="#fff" />
                  </View>
                  <Text style={styles.navCircleText}>Apple Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.navCircleButton}
                  onPress={() => {
                    setNavDestination({ lat: place?.latitude || 0, lng: place?.longitude || 0, name: place?.name || '' });
                    openMapsApp('google');
                    setShowAddressModal(false);
                  }}
                >
                  <View style={[styles.navCircleIcon, { backgroundColor: '#DB4437' }]}>
                    <Ionicons name="logo-google" size={24} color="#fff" />
                  </View>
                  <Text style={styles.navCircleText}>Google Maps</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.navCircleButton}
                  onPress={() => {
                    setNavDestination({ lat: place?.latitude || 0, lng: place?.longitude || 0, name: place?.name || '' });
                    openMapsApp('waze');
                    setShowAddressModal(false);
                  }}
                >
                  <View style={[styles.navCircleIcon, { backgroundColor: '#33CCFF' }]}>
                    <Ionicons name="car" size={24} color="#fff" />
                  </View>
                  <Text style={styles.navCircleText}>Waze</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // ===== NEW HERO STYLES =====
  heroContainer: {
    position: 'relative',
    height: 320,
    backgroundColor: '#000',
  },
  carouselImage: {
    width: width,
    height: 320,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'transparent',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  topRightButtons: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#fff',
  },
  placeName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginBottom: 6,
  },
  trustContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 12,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  socialsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  socialIcon: {
    padding: 4,
  },
  heroSubtitle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroSubtitleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // ===== QUICK INFO BAR =====
  quickInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  quickInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickInfoIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  quickInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  quickInfoLabelOpen: {
    color: '#10b981',
  },
  quickInfoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  quickInfoSub: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  quickInfoDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e5e5e5',
  },
  
  // ===== TAB NAVIGATION =====
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // ===== CONTENT =====
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  
  // ===== SIGNALS & MEDALS =====
  medalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
    paddingHorizontal: 20,
  },
  medalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  medalText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ghostRow: {
    opacity: 0.6,
  },
  signalIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  signalContent: {
    flex: 1,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  signalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  ghostText: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  signalScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  ghostNote: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
    fontStyle: 'italic',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  addReviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  
  // ===== CLAIM BUSINESS =====
  claimContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  claimText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  // ===== CONTACT =====
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  contactLink: {
    color: '#007AFF',
  },
  featuresContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  featureText: {
    fontSize: 13,
    color: '#333',
  },
  
  // ===== PHOTOS =====
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 16,
  },
  photoGridItem: {
    width: (width - 48 - 4) / 2,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  photoGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGridOverlayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  noPhotosText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  
  // ===== ENTRANCES =====
  entrancesList: {
    gap: 12,
  },
  entranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
  },
  entranceInfo: {
    flex: 1,
    marginRight: 12,
  },
  entranceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  entranceNamePrimary: {
    color: '#007AFF',
  },
  entranceDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#f97316',
  },
  navigateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  noEntrancesContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noEntrancesText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
  },
  defaultNavigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  defaultNavigateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  hoursBlock: {
    marginBottom: 20,
    alignItems: 'center',
  },
  dayText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '700',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#007AFF',
    borderRadius: 24,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  navOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    width: '100%',
  },
  navOptionText: {
    fontSize: 18,
    color: '#333',
    marginLeft: 16,
    fontWeight: '500',
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  fullScreenModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  popupMapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  popupMap: {
    flex: 1,
  },
  addressPopupContent: {
    padding: 20,
    backgroundColor: '#fff',
  },
  addressPopupText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  navigateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  navButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  navCircleButton: {
    alignItems: 'center',
  },
  navCircleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  navCircleText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
    // ===== MISSING STYLES =====
  signalLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  signalLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});