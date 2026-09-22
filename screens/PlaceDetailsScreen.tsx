import { categoryImageForPlace, realPlacePhotos } from '../lib/placePreviewImage';
import {useReleaseCopy} from '../hooks/useReleaseCopy';
import { placeShareUrl, normalizePlaceShareId } from '../lib/placeShare';
import { lookupPlaceDetails, isCanonicalPlaceId } from '../lib/placeDetailsLookup';
import { getPlaceById } from '../lib/typesenseService';
import { resolvePhotoPlace } from '../lib/placePhotoUpload';
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
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { mapGoogleCategoryToBusinessType } from '../lib/businessTypeConfig';
import {
  getCategoryEmoji as getCategoryEmojiFromConfig,
  shouldShowEntrancesTab,
  getQuickInfoPills,
  QuickInfoPill,
} from '../lib/categories';
import { supabase } from '../lib/supabaseClient';
import { fetchPlaceSignals, getPlaceReviewCount, fetchRecentReviews, fetchReviewHistory, RecentReview, SignalAggregate } from '../lib/reviews';
import SignalMatrix from '../components/SignalMatrix';
import {useThemeContext} from '../contexts/ThemeContext';
import {useAuth} from '../contexts/AuthContext';
import {useIsFavorite,useAddFavorite,useRemoveAllFavoritesForPlace} from '../hooks/useFavorite';
import {parseHours} from '../lib/placeHours';
import {reviewDateLabel} from '../lib/placePresentation';
import { Colors } from '../constants/Colors';
import AddYourTapCardEnhanced from '../components/AddYourTapCardEnhanced';
import MomentumThermometer from '../components/MomentumThermometer';
import ContentSafetyActions,{CONTENT_SAFETY_CHANGED} from '../components/ContentSafetyActions';
import {DeviceEventEmitter} from 'react-native';
import {
  // usePlaceTapStats,
  useUserGamification,
  useTap,
  useHasUserTapped
} from '../hooks/useTapSystem';
import { getPlaceStories, PlaceStory, getStoryRingState, StoryRingState, calculateDistanceMeters } from '../lib/storyService';
import { StoryViewer } from '../components/StoryViewer';
import { LinearGradient } from 'expo-linear-gradient';
import StoryActionRing from '../components/StoryActionRing';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { withScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { fetchPlaceEvidence } from '../lib/placeEvidenceService';
import { PlaceEvidence, buildPlaceEvidence, coreForCategory, secondaryGoodSignals } from '../lib/placeEvidence';
import { buildPlaceReviewSummary } from '../lib/placeReviewSummary';
import PlaceReviewGrid from '../components/PlaceReviewGrid';
import OnTheGoStatus from '../components/OnTheGoStatus';
import CruiseVenueInfo from '../components/cruises/CruiseVenueInfo';
import {CruiseVenueReadError,CruiseVenueContext,CRUISE_VENUE_STORY_NOTICE,CRUISE_VENUE_REVIEW_NOTICE} from '../lib/cruises/venueContext';

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
  sourceType?: string;
  cruiseVenue?: CruiseVenueContext | null;
  name: string;
  latitude: number;
  longitude: number;
  priceLevel: '' | '$' | '$$' | '$$$';
  primaryCategory: string;
  subcategory?: string;
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

// Category emoji mapping - Enhanced with new category config
const getCategoryEmoji = (category: string): string => {
  // First try the new comprehensive category config
  const configEmoji = getCategoryEmojiFromConfig(category);
  if (configEmoji && configEmoji !== '📍') {
    return configEmoji;
  }
  
  // Fallback to existing local mapping for backward compatibility
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

// Get category-based fallback image URL when place has no photo
const getCategoryFallbackImage = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  
  // Category-specific Unsplash images (free to use)
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
    'hospital': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
    'medical': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
    'airport': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
    'theme park': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'amusement': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'national park': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
    'park': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800',
    'shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    'mall': 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800',
    'gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    'fitness': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    'spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800',
    'bar': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800',
    'nightclub': 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800',
    'museum': 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800',
    'zoo': 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800',
    'aquarium': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    'gas station': 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800',
    'automotive': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    'car': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
    'pizza': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    'sushi': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    'seafood': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    'steak': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    'fast food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800',
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    'taco': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    'default': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
  };
  
  // Find matching category
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerCategory.includes(key)) return url;
  }
  
  return imageMap.default;
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

function PlaceDetailScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const copy = useReleaseCopy();
  // ===== STATE DECLARATIONS =====
  const requestedPlaceId = route?.params?.placeId;
  const [place, setPlace] = useState<Place | null>(null);
  const [placeRetry,setPlaceRetry] = useState(0);
  const placeId = place?.id || normalizePlaceShareId(requestedPlaceId) || '';
  const canonicalPlaceId = isCanonicalPlaceId(place?.id) ? place.id : null;
  const showMobileStatus = isCanonicalPlaceId(route?.params?.mobileBusinessId)
    || /\b(on the go|food trucks?|mobile)\b/i.test((place?.primaryCategory || '').replace(/[_-]/g, ' '));
  const [signals, setSignals] = useState<{
    best_for: SignalAggregate[];
    vibe: SignalAggregate[];
    heads_up: SignalAggregate[];
    medals: string[];
  }>({ best_for: [], vibe: [], heads_up: [], medals: [] });
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [failedHeroPhotos, setFailedHeroPhotos] = useState<string[]>([]);
  const [photosUnavailable,setPhotosUnavailable]=useState(false);
  const [hasActiveMenu, setHasActiveMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [activePlaceTab, setActivePlaceTab] = useState<'overview' | 'reviews' | 'media' | 'menu'>('overview');
  const [reviewPeriod, setReviewPeriod] = useState<'recent' | 'all'>('recent');
  const [withNotes, setWithNotes] = useState(false);
  const [sortOldest, setSortOldest] = useState(false);
  const [reviewsShown, setReviewsShown] = useState(10);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroWidth, setHeroWidth] = useState(Dimensions.get('window').width);
  const heroScrollRef = useRef<ScrollView>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSummary, setSelectedSummary] = useState<'main' | 'good' | 'vibe' | 'headsup' | null>(null);
  useEffect(() => { setSelectedTopic(null); setSelectedSummary(null); }, [placeId]);
  const [reviewsUnavailable,setReviewsUnavailable]=useState(false);
  const [confirmedLinks,setConfirmedLinks]=useState<{label:string;url:string}[]>([]);
  const [ecardSlug,setEcardSlug]=useState<string|null>(null);
  const [historyLoading,setHistoryLoading]=useState(false);
  const [safetyVersion,setSafetyVersion]=useState(0);
  useEffect(()=>{const sub=DeviceEventEmitter.addListener(CONTENT_SAFETY_CHANGED,()=>{setHistoryPage(0);setSafetyVersion(v=>v+1)});return()=>sub.remove()},[]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyRows, setHistoryRows] = useState<(RecentReview & { date: string; note: string | null; dateSource?:string; recordedAt?:string; isEdit?:boolean })[]>([]);
  const [historyError, setHistoryError] = useState('');
  const [evidence, setEvidence] = useState<PlaceEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [expandedSection, setExpandedSection] = useState<'best_for' | 'vibe' | 'heads_up' | null>(null);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [navDestination, setNavDestination] = useState<{lat: number, lng: number, name: string} | null>(null);
  
  // NEW: Photo carousel state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  
  // Stories state
  const [stories, setStories] = useState<PlaceStory[]>([]);
  const [storyRingState, setStoryRingState] = useState<StoryRingState>('none');
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  useEffect(() => {
    if (!canonicalPlaceId) { setHasActiveMenu(false); return; }
    let cancelled = false;
    supabase.from('menus').select('id').eq('place_id', canonicalPlaceId).eq('is_active', true).limit(1).maybeSingle()
      .then(({ data: menu }) => { if (!cancelled) setHasActiveMenu(!!menu); });
    return () => { cancelled = true; };
  }, [canonicalPlaceId]);
  
  useEffect(()=>{let active=true;setConfirmedLinks([]);setEcardSlug(null);if(!canonicalPlaceId)return;const placeId=canonicalPlaceId;
    supabase.from('places').select('hours,phone,website').eq('id',placeId).maybeSingle().then(({data})=>{if(active&&data)setPlace(current=>current?{...current,opening_hours:data.hours,phone:data.phone,website:data.website}:current)});
    supabase.from('place_external_profiles').select('provider,external_url').eq('place_id',placeId).then(({data})=>{if(!active)return;const providers:Record<string,{label:string;hosts:string[]}>= {instagram:{label:'Instagram',hosts:['instagram.com']},facebook:{label:'Facebook',hosts:['facebook.com']},tiktok:{label:'TikTok',hosts:['tiktok.com']},youtube:{label:'YouTube',hosts:['youtube.com','youtu.be']},doordash:{label:'DoorDash',hosts:['doordash.com']},ubereats:{label:'Uber Eats',hosts:['ubereats.com']},grubhub:{label:'Grubhub',hosts:['grubhub.com']},opentable:{label:'Reservations · OpenTable',hosts:['opentable.com']},resy:{label:'Reservations · Resy',hosts:['resy.com']}};setConfirmedLinks((data||[]).flatMap(row=>{const spec=providers[String(row.provider).replace(/_/g,'')];if(!spec)return[];try{const url=new URL(row.external_url);return url.protocol==='https:'&&!url.username&&!url.password&&spec.hosts.some(h=>url.hostname===h||url.hostname.endsWith('.'+h))?[{label:spec.label,url:url.toString()}]:[]}catch{return[]}}))});
    supabase.from('digital_cards').select('slug').eq('place_id',placeId).eq('is_published',true).limit(1).maybeSingle().then(({data})=>{if(active)setEcardSlug(data?.slug||null)});
    return()=>{active=false};
  },[canonicalPlaceId]);

  // Review Report Modal state (Apple compliance)

  // Dark mode support
  const {theme,isDark}=useThemeContext();
  const styles=makeStyles(theme,isDark);
  const {user}=useAuth();
  const {data:canonicalSaved}=useIsFavorite(canonicalPlaceId||'');
  const externalSaveId=/^fsq:[0-9a-f]{24}$/i.test(placeId)?placeId.toLowerCase():null;
  const [externalSaved,setExternalSaved]=useState(false);
  useEffect(()=>{if(!user||!externalSaveId){setExternalSaved(false);return;}let active=true;supabase.from('saved_external_places').select('id').eq('user_id',user.id).eq('external_id',externalSaveId).limit(1).maybeSingle().then(({data})=>{if(active)setExternalSaved(!!data)});return()=>{active=false};},[user?.id,externalSaveId]);
  const saved=!!canonicalSaved||externalSaved;
  const addFavorite=useAddFavorite();
  const removeFavorite=useRemoveAllFavoritesForPlace();
  const savePlace=async()=>{if(!user){navigation.navigate('Login',{returnTo:'PlaceDetails',returnParams:{placeId}});return;}try{if(externalSaveId&&!canonicalPlaceId){if(externalSaved){const {error}=await supabase.from('saved_external_places').delete().eq('user_id',user.id).eq('external_id',externalSaveId);if(error)throw error;setExternalSaved(false);}else{const {error}=await supabase.from('saved_external_places').insert({user_id:user.id,external_id:externalSaveId,place_name:String(place?.name||'Place').slice(0,200),category:String(place?.primaryCategory||'Place').slice(0,120),city:place?.city||null,region:place?.state||null});if(error&&error.code!=='23505')throw error;setExternalSaved(true);}return;}const resolved=canonicalPlaceId||await resolvePhotoPlace(placeId);if(saved){await removeFavorite.mutateAsync(resolved);if(externalSaveId){const {error}=await supabase.from('saved_external_places').delete().eq('user_id',user.id).eq('external_id',externalSaveId);if(error)throw error;setExternalSaved(false);}}else await addFavorite.mutateAsync({placeId:resolved});if(resolved!==placeId)setPlace(current=>current?{...current,id:resolved}:current);}catch{Alert.alert('Could not save place','Please try again.')}};
  const goBackFromPlace=()=>{if(navigation.canGoBack())navigation.goBack();else navigation.getParent()?.navigate('Home');};

  // Creating a canonical provider record is reserved for an explicit signed-in action.
  const openCanonicalPlaceAction = async (screen: 'StoryUpload' | 'ClaimBusiness') => {
    if (!place || place.cruiseVenue) return;
    if (!user) { navigation.navigate('Login', { returnTo: 'PlaceDetails', returnParams: { placeId } }); return; }
    try {
      const resolved = canonicalPlaceId || await resolvePhotoPlace(placeId);
      if (resolved !== placeId) setPlace(current => current ? { ...current, id: resolved } : current);
      navigation.navigate(screen, { placeId: resolved, placeName: place.name });
    } catch { Alert.alert('Could not open this place', 'Please try again.'); }
  };

  // Determine business type from place data
  const businessType = place ? mapGoogleCategoryToBusinessType(place.primaryCategory || 'default') : 'default';

  // NEW: Compute quick info pills based on category
  const quickInfoPills: QuickInfoPill[] = place ? getQuickInfoPills(place, place.primaryCategory || 'default') : [];

  // NEW: Determine if entrances tab should be shown based on category
  const showEntrancesTabForCategory = place ? shouldShowEntrancesTab(place.primaryCategory || 'default') : false;

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
  const { hasTapped, userSignals } = useHasUserTapped(canonicalPlaceId || '');
  const { quickTap } = useTap();

  // Onboard places have no fixed geography and do not require device location.
  const locationRequested = useRef(false);
  useEffect(() => {
    if (!place || place.cruiseVenue || locationRequested.current) return;
    locationRequested.current = true;
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('[PlaceDetails] Location permission denied');
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('[PlaceDetails] Error getting location:', error);
      }
    };
    getUserLocation();
  }, [place?.id, place?.sourceType]);

  // Resolve canonical and provider IDs without creating records or fabricating data.
  useEffect(() => {
    let active = true;
    setPlace(null); setError(null); setLoading(true); setPhotos([]); setFailedHeroPhotos([]);
    setSignals({ best_for: [], vibe: [], heads_up: [], medals: [] });
    setRecentReviews([]); setEvidence(null); setStories([]); setReviewsUnavailable(false);
    const fetchPlaceData = async () => {
      try {
        const placeData = await lookupPlaceDetails(requestedPlaceId, supabase, getPlaceById);
        if (!active) return;
        if (!placeData) { setError('Place not found.'); setLoading(false); return; }
          // Map database fields to Place interface
        const mappedPlace: Place = {
          id: placeData.id,
          sourceType: placeData.source_type,
          cruiseVenue: placeData.cruiseVenue,
          name: placeData.name,
          latitude: placeData.latitude,
          longitude: placeData.longitude,
          priceLevel: placeData.price_level || '',
          primaryCategory: placeData.tavvy_category || placeData.primary_category || 'Place',
          subcategory: placeData.tavvy_subcategory || placeData.subcategory || undefined,
          features: placeData.features || [],
          openYearRound: placeData.open_year_round ?? false,
          coverImageUrl: placeData.cover_image_url,
          currentStatus: placeData.current_status || '',
          is24_7: placeData.is_24_7 ?? false,
          addressLine1: placeData.address_line_1,
          city: placeData.city,
          state: placeData.state,
          zipCode: placeData.zip_code,
          phone: placeData.phone,
          website: placeData.website,
          instagramUrl: placeData.instagram_url,
          facebookUrl: placeData.facebook_url,
          distance: userLocation && placeData.latitude && placeData.longitude
            ? calculateDistanceMeters(
                userLocation.latitude,
                userLocation.longitude,
                placeData.latitude,
                placeData.longitude
              ) / 1609.34 // Convert meters to miles
            : 0,
          avgMealCost: placeData.avg_meal_cost,
          totalSites: placeData.total_sites,
          starRating: placeData.star_rating,
          closingTime: placeData.closing_time,
          opening_hours: placeData.hours || placeData.opening_hours,
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
          slug: placeData.slug,
        };

        setPlace(mappedPlace);

        if (!isCanonicalPlaceId(placeData.id)) setEvidence(buildPlaceEvidence([], { category: mappedPlace.primaryCategory, subcategory: mappedPlace.subcategory }));
        if (isCanonicalPlaceId(placeData.id)) {
          const resolvedId = placeData.id;
          const { data: media, error: mediaError } = await supabase.rpc('get_place_photo_safety_v1',{p_place_id:resolvedId});
          if (!active) return;
          setPhotos(!mediaError && Array.isArray(media?.photos) ? media.photos : []);
          setPhotosUnavailable(!!mediaError || !Array.isArray(media?.photos));
          setPlace(current=>current?{...current,coverImageUrl:!mediaError ? media?.cover || null : null}:current);
          const signalData = await fetchPlaceSignals(resolvedId);
          if (!active) return;
          setSignals(signalData);
          try {
            const recent = await fetchRecentReviews(resolvedId, 10);
            if (!active) return;
            setRecentReviews(recent); setReviewsUnavailable(false);
          } catch { if (active) { setRecentReviews([]); setReviewsUnavailable(true); } }
        }
        if (active) setLoading(false);
      } catch (err: any) {
        if (!active) return;
        setError(err instanceof CruiseVenueReadError ? err.message : 'Place information could not be loaded. Please try again.');
        setLoading(false);
      }
    };

    fetchPlaceData();
    return () => { active = false; };
  }, [requestedPlaceId, userLocation, safetyVersion, user?.id, placeRetry]);

  useEffect(() => {
    if (!canonicalPlaceId || !place?.primaryCategory) return;
    let active = true;
    fetchPlaceEvidence(canonicalPlaceId, { category: place.primaryCategory, subcategory: place.subcategory })
      .then(value => { if (active) setEvidence(value); })
      .catch(() => { if (active) setEvidence(null); });
    return () => { active = false; };
  }, [canonicalPlaceId, place?.primaryCategory, place?.subcategory]);

  useEffect(() => {
    if (!historyOpen || !canonicalPlaceId) return;
    let active = true;
    setHistoryError('');setHistoryRows([]);setHistoryLoading(true);
    fetchReviewHistory(canonicalPlaceId, historyPage).then(result => {
      if (active) { setHistoryRows(result.reviews); setHistoryTotal(result.total); }
    }).catch(() => { if (active) setHistoryError('Could not load reviews.'); }).finally(()=>{if(active)setHistoryLoading(false)});
    return () => { active = false; };
  }, [historyOpen, historyPage, canonicalPlaceId, safetyVersion, user?.id]);

  // UUID-backed content exists only once a provider place has a canonical record.
  useEffect(() => {
    let active = true;
    setStories([]); setStoryRingState('none');
    if (!canonicalPlaceId) return;
    Promise.all([getPlaceStories(canonicalPlaceId), getStoryRingState(canonicalPlaceId)])
      .then(([rows, ring]) => { if (active) { setStories(rows); setStoryRingState(ring); } })
      .catch(() => { /* Keep the empty public state on unavailable optional media. */ });
    return () => { active = false; };
  }, [canonicalPlaceId, safetyVersion, user?.id]);

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
        color = '#8A05BE'; // Purple
        break;
      case 'comeback_king':
        icon = 'shield-checkmark';
        label = 'Comeback King';
        color = '#00C2CB'; // Teal
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
  const toggleSection = (section: 'best_for' | 'vibe' | 'heads_up') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Handle navigation to entrance
  const handleNavigate = (lat: number, lng: number, name: string) => {
    if (place?.cruiseVenue || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setNavDestination({ lat, lng, name });
    setShowNavModal(true);
  };

  const openMapsApp = (app: 'apple' | 'google' | 'waze') => {
    if (!navDestination || place?.cruiseVenue) return;
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
      const shareUrl = placeShareUrl(place.id);
      const shareText = `${place.name} on Tavvy — see what people are really saying`;
      await Share.share({
        message: `${shareText}\n${shareUrl}`,
        title: place.name,
        url: shareUrl,
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

    const isExpanded = expandedSection === type;
    const hasMore = signalsList.length > 1;

    // Use PRIMARY color for solid bar background
    const bgColor = colors.primary;

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
            <Text style={{ fontSize: 18, marginRight: 10 }}>{signal.icon}</Text>
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
              ×{signal.tap_total}
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

    return (
      <View style={{
        backgroundColor: theme.background,
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}>
        {/* Section Title */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '700', 
          color: theme.text,
          marginBottom: 12,
        }}>
          {categoryTitle}
        </Text>
        
        {/* Top Signal (Always Visible) */}
        {renderSolidSignalBar(signalsList[0], 0)}
        
        {/* Expanded Signals List - All stacked vertically */}
        {isExpanded && signalsList.length > 1 && (
          <View>
            {signalsList.slice(1).map((signal, idx) => 
              renderSolidSignalBar(signal, idx + 1)
            )}
          </View>
        )}
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
              <Ionicons name="warning" size={12} color="#00C2CB" />
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
        <Text style={styles.errorText}>{copy(error || 'Place not found.')}</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.errorButton} onPress={()=>setPlaceRetry(value=>value+1)}><Text style={styles.errorButtonText}>{copy('Try again')}</Text></TouchableOpacity>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={goBackFromPlace}
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
  const reviewSubject = { category: place.primaryCategory, subcategory: place.subcategory };
  const reviewSummary = buildPlaceReviewSummary(evidence, reviewSubject);
  const reviewIcons = { main: /hotel/i.test(place.primaryCategory) ? '🛏️' : /restaurant|cafe|bar/i.test(place.primaryCategory) ? '🍽️' : '⭐', good: '✨', vibe: '🕯️', headsup: '⚠️' };
  const otherGood = evidence ? secondaryGoodSignals(evidence, reviewSubject) : [];
  const currentWarnings = evidence?.warnings.filter(w => w.status === 'current' || w.status === 'unconfirmed') || [];
  const supportLabels=new Set(selectedTopic ? [selectedTopic] : (selectedSummary==='main'?[...(evidence?.coreSignals||[]),...(evidence?.coreConcerns||[])]:selectedSummary==='good'?otherGood:selectedSummary==='vibe'?evidence?.vibeSignals||[]:currentWarnings).map(s=>s.label));
  const supportingReviews=recentReviews.filter(r=>r.signals.some(sig=>supportLabels.has(sig.label))).slice(0,2);
  const priceDisplay = getPriceDisplay(place);
  const heroPlace = { id: place.id, category: place.primaryCategory, subcategory: place.subcategory, cover_image_url: place.coverImageUrl, photos };
  const realHeroPhoto = realPlacePhotos(heroPlace).find(url => !failedHeroPhotos.includes(url));
  const heroPhoto = realHeroPhoto || 'https://tavvy.com' + categoryImageForPlace(heroPlace);
  const driveTime = getDriveTime(place.distance);
  const categoryEmoji = getCategoryEmoji(place.primaryCategory);

  const hasMenuTab = hasActiveMenu;
  const cruiseVenue = place.cruiseVenue;
  const reviewDisabled = !!cruiseVenue && !cruiseVenue.accepts_reviews;
  const openParentShip = () => {
    if (!cruiseVenue) return;
    const state = navigation.getState();
    const previous = state.routes[state.index - 1];
    if (previous?.name === 'UniverseDetail' && previous.params?.universeId === cruiseVenue.universe_id) navigation.goBack();
    else navigation.navigate('UniverseDetail', {universeId:cruiseVenue.universe_id});
  };
  // Every place shares these tabs; only the menu tab depends on the category/data.
  const placeTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'reviews', label: copy('Reviews') },
    { key: 'media', label: 'Photos & Stories' },
    ...(hasMenuTab ? [{ key: 'menu', label: place.primaryCategory === 'Hotel' ? 'Rooms' : 'Tavvy Menu' }] : []),
  ] as { key: 'overview' | 'reviews' | 'media' | 'menu'; label: string }[];
  const heroPhotos = realHeroPhoto ? [realHeroPhoto, ...realPlacePhotos(heroPlace).filter(url => url !== realHeroPhoto && !failedHeroPhotos.includes(url))].slice(0, 6) : [heroPhoto];
  const heroCurrent = Math.min(heroIndex, heroPhotos.length - 1);
  const stepHero = (direction: number) => { const next = Math.max(0, Math.min(heroPhotos.length - 1, heroCurrent + direction)); heroScrollRef.current?.scrollTo({ x: next * heroWidth, animated: true }); setHeroIndex(next); };
  const subcategoryRaw = (place.subcategory || '').replace(/_/g, ' ').trim();
  const subcategoryLabel = subcategoryRaw && subcategoryRaw.toLowerCase() !== (place.primaryCategory || '').toLowerCase() ? subcategoryRaw : '';
  const openReviews = (topic?: string | null, section?: 'main' | 'good' | 'vibe' | 'headsup' | null) => { setActivePlaceTab('reviews'); setSelectedSummary(section ?? null); setSelectedTopic(topic ?? null); };
  const paymentFacts = (reviewSummary.practical || []).filter(item => /cash|card|pay/i.test(item.label));
  // Reviews tab filters: a selected word, the evidence period, comments only, and order.
  const hasReviewDates = recentReviews.some(review => !!review.createdAt);
  const reviewCutoff = Date.now() - 180 * 86400000;
  const filteredReviews = recentReviews
    .filter(review => !selectedTopic || review.signals.some(sig => sig.label === selectedTopic))
    .filter(review => !withNotes || !!review.text)
    .filter(review => reviewPeriod === 'all' || !review.createdAt || Date.parse(review.createdAt) >= reviewCutoff)
    .sort((a, b) => !a.createdAt || !b.createdAt ? 0 : (sortOldest ? 1 : -1) * (Date.parse(a.createdAt) - Date.parse(b.createdAt)));
  const filterChip = (label: string, on: boolean, onPress: () => void) => <TouchableOpacity key={label} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={{ minHeight: 40, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: on ? 'rgba(0,194,203,.45)' : theme.border, backgroundColor: on ? 'rgba(0,194,203,.14)' : theme.surface }}><Text style={{ color: on ? (isDark ? '#58D9DE' : '#067A80') : theme.text, fontSize: 13, fontWeight: '600' }}>{label}</Text></TouchableOpacity>;
  const quickAction=(key:string,label:string,icon:React.ComponentProps<typeof Ionicons>['name'],onPress:()=>void,selected=false)=><TouchableOpacity key={key} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress} style={{width:68,alignItems:'center',gap:7}}><View style={{width:50,height:50,borderRadius:25,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border,alignItems:'center',justifyContent:'center'}}><Ionicons name={icon} size={23} color={selected?'#E24A72':theme.text}/></View><Text style={{color:theme.textSecondary,fontSize:11,fontWeight:'600',textAlign:'center'}}>{label}</Text></TouchableOpacity>;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ===== 1. HERO (40% screen) ===== */}
        <View style={styles.heroContainer} onLayout={event => setHeroWidth(Math.round(event.nativeEvent.layout.width) || heroWidth)}>
          <ScrollView ref={heroScrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={StyleSheet.absoluteFill} onMomentumScrollEnd={event => setHeroIndex(Math.min(heroPhotos.length - 1, Math.max(0, Math.round(event.nativeEvent.contentOffset.x / heroWidth))))} accessibilityLabel={realHeroPhoto ? copy('Photos') : copy('Category illustration')}>
            {heroPhotos.map((uri, i) => <Image key={uri + i} source={{uri}} style={[styles.carouselImage, { width: heroWidth }]} resizeMode="cover" accessibilityLabel={realHeroPhoto ? `${place.name} · ${i + 1} / ${heroPhotos.length}` : copy('Category illustration')} onError={()=>{if(realHeroPhoto)setFailedHeroPhotos(previous=>[...previous,uri]);}}/>)}
          </ScrollView>

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.9)']}
            locations={[0.4, 0.6, 1]}
            style={styles.heroGradientOverlay}
          />

          {!realHeroPhoto && <Text style={{position:'absolute',top:60,right:16,maxWidth:'65%',paddingHorizontal:8,paddingVertical:5,borderRadius:7,backgroundColor:'rgba(0,0,0,.65)',color:'#fff',fontSize:11}}>{copy('Category illustration')}</Text>}

          {/* Back Button (top-left) */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBackFromPlace}
          >
            <Ionicons name="chevron-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>

          {/* Hero Text at bottom */}
          {heroPhotos.length > 1 && <View style={{ position: 'absolute', right: 14, bottom: 96, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,.55)', borderRadius: 20, padding: 2 }}>
            <TouchableOpacity disabled={heroCurrent === 0} onPress={() => stepHero(-1)} accessibilityRole="button" accessibilityLabel="Previous photo" style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', opacity: heroCurrent === 0 ? 0.35 : 1 }}><Ionicons name="chevron-back" size={16} color="#fff" /></TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', paddingHorizontal: 4, fontVariant: ['tabular-nums'] }} accessibilityLiveRegion="polite">{heroCurrent + 1} / {heroPhotos.length}</Text>
            <TouchableOpacity disabled={heroCurrent === heroPhotos.length - 1} onPress={() => stepHero(1)} accessibilityRole="button" accessibilityLabel="Next photo" style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', opacity: heroCurrent === heroPhotos.length - 1 ? 0.35 : 1 }}><Ionicons name="chevron-forward" size={16} color="#fff" /></TouchableOpacity>
          </View>}
          {(photos.length > 0 || stories.length > 0) && <TouchableOpacity onPress={() => setActivePlaceTab('media')} accessibilityRole="button" style={{ position: 'absolute', left: 20, bottom: 100, backgroundColor: 'rgba(0,0,0,.55)', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 }}><Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{copy('View all photos')} →</Text></TouchableOpacity>}
          <View style={styles.heroTextContainer}>
            <Text style={styles.placeName}>{place.name}</Text>
            <Text style={styles.heroSubtitleText}>
              {categoryEmoji} {place.primaryCategory}{subcategoryLabel ? ` · ${subcategoryLabel}` : ''}
            </Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0,marginTop:16}} contentContainerStyle={{paddingHorizontal:20,paddingBottom:16,gap:12,borderBottomWidth:1,borderBottomColor:theme.border}} accessibilityLabel="Place actions">
          {place.phone&&quickAction('phone','Phone','call-outline',()=>handleCall(place.phone!))}
          {!cruiseVenue&&!!fullAddress&&quickAction('address','Address','location-outline',()=>setShowAddressModal(true))}
          {place.website&&quickAction('website','Website','globe-outline',()=>handleWebsite(place.website!))}
          {/* Stories next to Website; the rotating ring in the logo colours says a story is waiting. */}
          {stories.length>0&&<TouchableOpacity key="stories" accessibilityRole="button" accessibilityLabel="Stories" onPress={()=>setShowStoryViewer(true)} style={{width:68,alignItems:'center',gap:7}}><StoryActionRing background={theme.background}><View style={{width:50,height:50,borderRadius:25,backgroundColor:theme.surface,borderWidth:1,borderColor:theme.border,alignItems:'center',justifyContent:'center'}}><Ionicons name="albums-outline" size={23} color={theme.text}/></View></StoryActionRing><Text style={{color:theme.textSecondary,fontSize:11,fontWeight:'600',textAlign:'center'}}>Stories</Text></TouchableOpacity>}
          {!cruiseVenue&&!!(fullAddress||(Number.isFinite(place.latitude)&&Number.isFinite(place.longitude)))&&quickAction('directions','Directions','navigate-outline',()=>{if(Number.isFinite(place.latitude)&&Number.isFinite(place.longitude))handleNavigate(place.latitude,place.longitude,place.name);else void Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`);})}
          {hasMenuTab&&quickAction('menu','Menu','restaurant-outline',()=>navigation.navigate('MenuGallery',{placeId:place.id,placeName:place.name}))}
          {ecardSlug&&quickAction('ecard','eCard','card-outline',()=>void Linking.openURL(`https://tavvy.com/${encodeURIComponent(ecardSlug)}`))}
          {quickAction('share','Share','share-outline',()=>void handleShare())}
          {quickAction('save',saved?'Saved':'Save',saved?'heart':'heart-outline',()=>void savePlace(),saved)}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginTop: 2, borderBottomWidth: 1, borderBottomColor: theme.border }} contentContainerStyle={{ paddingHorizontal: 20, gap: 18 }} accessibilityRole="tablist">
          {placeTabs.map(tab => <TouchableOpacity key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: activePlaceTab === tab.key }} onPress={() => tab.key === 'menu' ? navigation.navigate('MenuGallery',{placeId:place.id,placeName:place.name}) : setActivePlaceTab(tab.key)} style={{ paddingVertical: 13, borderBottomWidth: 3, borderBottomColor: activePlaceTab === tab.key ? '#8A05BE' : 'transparent' }}><Text style={{ fontSize: 14, fontWeight: '700', color: activePlaceTab === tab.key ? theme.text : theme.textSecondary }}>{tab.label}</Text></TouchableOpacity>)}
        </ScrollView>

        {activePlaceTab === 'overview' && <View style={{ marginHorizontal: 20, marginTop: 16 }}>
          {/* The grid's own "Reviews · N people" line is the heading here; no second title above it. */}
          <PlaceReviewGrid mode="compact" summary={reviewSummary} onOpen={(section, topic) => openReviews(topic.label, section)} action={<TouchableOpacity accessibilityRole="button" onPress={() => openReviews()} style={{ minHeight: 32, justifyContent: 'center' }}><Text style={{ color: isDark ? '#58D9DE' : '#067A80', fontSize: 13, fontWeight: '700' }}>{copy('See experiences')} →</Text></TouchableOpacity>} />
          {paymentFacts.length > 0 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12 }}><Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>{copy('Good to know')}</Text>{paymentFacts.map(item => <View key={item.label} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}><Text style={{ color: theme.text, fontSize: 13, fontWeight: '600' }}>{item.label} · {item.count}</Text></View>)}</View>}
        </View>}

        {activePlaceTab === 'reviews' && <View style={{ marginHorizontal: 20, marginTop: 18 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800', marginBottom: 11 }}>{copy('Reviews')}</Text>
          <PlaceReviewGrid mode="full" summary={reviewSummary} selectedTopic={selectedTopic} onSelect={(section, topic) => { setSelectedSummary(section); setSelectedTopic(selectedTopic === topic.label ? null : topic.label); }} />
          {selectedSummary && evidence && evidence.dataStatus!=='unavailable' && <View style={{ marginTop: 10, padding: 15, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, borderRadius: 14 }}>
            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12}}><Text style={{color:theme.text,fontWeight:'700',flex:1}}>{selectedTopic}</Text><TouchableOpacity accessibilityRole="button" onPress={()=>{setSelectedSummary(null);setSelectedTopic(null);}} style={{minHeight:44,justifyContent:'center'}}><Text style={{color:isDark?'#D9B6FF':theme.primary}}>{copy('All experiences')}</Text></TouchableOpacity></View>
            {!supportingReviews.length && <Text style={{color:theme.textSecondary,lineHeight:20}}>{copy('No matching experiences in the recent preview. Open all reviews to explore the history.')}</Text>}
            {supportingReviews.map(review=><View key={review.reviewId} style={{marginTop:14,paddingTop:12,borderTopWidth:1,borderTopColor:theme.border}}><Text style={{color:theme.text,fontWeight:'700'}}>{review.name} · {reviewDateLabel(review.createdAt,review.dateSource)}</Text><ContentSafetyActions kind="place_review" contentId={review.reviewId} />
                  {review.text&&<Text style={{color:theme.text,lineHeight:22,marginTop:5}}>{review.text}</Text>}<Text style={{color:theme.textSecondary,marginTop:5}}>{review.signals.filter(sig=>supportLabels.has(sig.label)).map(sig=>sig.label).join(' · ')}</Text></View>)}
          </View>}
        </View>}

        {activePlaceTab === 'overview' && cruiseVenue && <View style={{marginHorizontal:20}}><CruiseVenueInfo context={cruiseVenue} onShip={openParentShip}/></View>}
        {activePlaceTab === 'overview' && !cruiseVenue && canonicalPlaceId && showMobileStatus && <View style={{ marginHorizontal: 20 }}><OnTheGoStatus canonicalPlaceId={canonicalPlaceId} /></View>}


        {activePlaceTab === 'media' && <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800', marginBottom: 10 }}>Stories</Text>{stories.length===0&&<Text style={{color:theme.textSecondary}}>{cruiseVenue?copy('No stories from this place yet.'):'No stories yet. Share a look at the food or atmosphere.'}</Text>}{cruiseVenue?<Text style={{color:theme.textSecondary,lineHeight:22,marginVertical:12}}>{copy(CRUISE_VENUE_STORY_NOTICE)}</Text>:<TouchableOpacity accessibilityRole="button" onPress={()=>void openCanonicalPlaceAction('StoryUpload')} style={{paddingVertical:14}}><Text style={{color:theme.primary,fontWeight:'700'}}>{stories.length?'Add a story':'Add the first story'}</Text></TouchableOpacity>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {stories.slice(0, 8).map((story, i) => <TouchableOpacity key={story.id || i} onPress={() => setShowStoryViewer(true)} style={{ marginRight: 10, width: 138 }}>
              <Image source={{ uri: story.thumbnail_url || story.media_url }} style={{ width: 138, height: 112, borderRadius: 12 }} />
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 5 }}>{story.story_kind==='owner_highlight'?'From the restaurant':'Guest story'} · {reviewDateLabel(story.created_at)}</Text>
            </TouchableOpacity>)}
          </ScrollView>
        </View>}

        {/* ===== RECENT REVIEWS (parity with web place page) ===== */}
        {activePlaceTab === 'reviews' && recentReviews.length > 0 && (
          <View style={styles.sectionPadding}>
            <Text style={styles.recentReviewsTitle}>Recent Reviews</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }} accessibilityLabel={copy('Filters')}>
              {selectedTopic ? filterChip(`${selectedTopic} ✕`, true, () => { setSelectedSummary(null); setSelectedTopic(null); }) : null}
              {hasReviewDates && filterChip(copy('Last 6 months'), reviewPeriod === 'recent', () => setReviewPeriod('recent'))}
              {hasReviewDates && filterChip(copy('All time'), reviewPeriod === 'all', () => setReviewPeriod('all'))}
              {filterChip(copy('With comments'), withNotes, () => setWithNotes(value => !value))}
              {hasReviewDates && filterChip(`${copy(sortOldest ? 'Oldest first' : 'Newest first')} ⇅`, false, () => setSortOldest(value => !value))}
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 11, lineHeight: 17, marginBottom: 6 }} accessibilityLiveRegion="polite">{copy('{{shown}} of {{total}} reviews').replace('{{shown}}', String(Math.min(reviewsShown, filteredReviews.length))).replace('{{total}}', String(filteredReviews.length))}</Text>
            {filteredReviews.length === 0 && <Text style={{ color: theme.textSecondary, lineHeight: 20, marginBottom: 8 }}>{copy('No matching experiences in the recent preview. Open all reviews to explore the history.')}</Text>}
            {filteredReviews.slice(0, reviewsShown).map((review) => (
              <View key={review.reviewId} style={styles.recentReviewRow}>
                <View style={styles.recentReviewAvatar}>
                  <Text style={styles.recentReviewInitial}>{review.initial}</Text>
                </View>
                <View style={styles.recentReviewBody}>
                  <View style={styles.recentReviewHeader}>
                    <Text style={styles.recentReviewName} numberOfLines={1}>{review.name}</Text>
                    <Text style={styles.recentReviewWhen}>{reviewDateLabel(review.createdAt,review.dateSource)}</Text>
                  </View>
                  <ContentSafetyActions kind="place_review" contentId={review.reviewId} />
                  {review.text&&<Text style={{color:theme.text,lineHeight:22,marginTop:7}}>{review.text}</Text>}
                  <View style={styles.recentReviewSignals}>
                    {review.signals.slice(0, 6).map((sig, i) => (
                      <View
                        key={i}
                        style={[
                          styles.recentReviewChip,
                          sig.category === 'heads_up'
                            ? styles.recentReviewChipHeadsUp
                            : sig.category === 'vibe'
                              ? styles.recentReviewChipVibe
                              : styles.recentReviewChipGood,
                        ]}
                      >
                        <Text
                          style={[
                            styles.recentReviewChipText,
                            sig.category === 'heads_up'
                              ? styles.recentReviewChipTextHeadsUp
                              : sig.category === 'vibe'
                                ? styles.recentReviewChipTextVibe
                                : styles.recentReviewChipTextGood,
                          ]}
                          numberOfLines={1}
                        >
                          {sig.category === 'heads_up' ? '! ' : ''}{sig.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
        {activePlaceTab === 'reviews' && filteredReviews.length > reviewsShown && <TouchableOpacity accessibilityRole="button" onPress={() => setReviewsShown(value => value + 10)} style={{ marginHorizontal: 20, marginBottom: 8, padding: 13, borderRadius: 12, backgroundColor: theme.surface }}><Text style={{ color: theme.text, textAlign: 'center', fontWeight: '700' }}>{copy('Show more reviews')}</Text></TouchableOpacity>}
        {activePlaceTab === 'reviews' && recentReviews.length === 0 && <Text style={{ marginHorizontal: 20, marginTop: 16, color: theme.textSecondary }}>{reviewsUnavailable?'Reviews could not be loaded. Please try again later.':'No reviews yet. Be the first to share what you experienced.'}</Text>}
        {activePlaceTab === 'reviews' && <TouchableOpacity onPress={() => { setHistoryPage(0); setHistoryOpen(true); }} style={{ marginHorizontal: 20, marginBottom: 12, padding: 13, borderRadius: 12, backgroundColor: theme.surface }}>
          <Text style={{ color: '#067A80', textAlign: 'center', fontWeight: '700' }}>See all reviews →</Text>
        </TouchableOpacity>}

        {/* ===== 6. PHOTOS GRID (2x2 with +X more) ===== */}
        {activePlaceTab === 'media' && <View style={styles.sectionPadding}>
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>Photos</Text>
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
              <Text style={styles.noPhotosText}>{photosUnavailable ? 'Photos could not be loaded. Please try again later.' : 'No photos to show'}</Text>
            )}
            <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
              <Ionicons name="camera-outline" size={20} color="#8A05BE" />
              <Text style={[styles.addPhotoText, { color: '#8A05BE' }]}>Add a Photo</Text>
            </TouchableOpacity>
          </View>
        </View>}

        {/* ===== 7. INFO SECTION (collapsed/expandable) ===== */}
        {activePlaceTab === 'overview' && <View style={styles.sectionPadding}>
          <View style={styles.cardContainer}>
            <Text style={styles.cardTitle}>{cruiseVenue ? copy('Onboard place information') : 'Location & hours'}</Text>
            {!!cruiseVenue?.description && <Text style={{color:theme.text,lineHeight:22,marginVertical:10}}>{cruiseVenue.description}</Text>}
              <View style={styles.infoContent}>
                {!cruiseVenue && fullAddress ? (
                  <TouchableOpacity
                    style={styles.contactItem}
                    onPress={() => setShowAddressModal(true)}
                  >
                    <Text style={styles.infoIcon}>📍</Text>
                    <Text style={styles.infoLink}>{fullAddress}</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Phone, website, directions and eCard are already the icon row above; only the address, links and hours live here. */}
                {confirmedLinks.map(link=><TouchableOpacity key={link.label} accessibilityRole="link" style={styles.contactItem} onPress={()=>Linking.openURL(link.url)}><Text style={styles.infoLink}>{link.label} ↗</Text></TouchableOpacity>)}
                {(!cruiseVenue || place.opening_hours) && <><Text style={[styles.cardTitle,{marginTop:20}]}>Hours</Text>
                {parseHours(place.opening_hours).hoursList.map(row=><View key={row.day} style={{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:7}}><Text style={{color:theme.text}}>{row.day}</Text><Text style={{color:theme.textSecondary,flexShrink:1}}>{row.range}</Text></View>)}</>}

                {!cruiseVenue && <><View style={styles.claimDivider} />
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => void openCanonicalPlaceAction('ClaimBusiness')}
                >
                  <Text style={styles.claimText}>Manage or claim this place</Text>
                </TouchableOpacity></>}

              </View>
          </View>
        </View>}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={{flexDirection:'row',gap:12,padding:14,borderTopWidth:1,borderColor:theme.border,backgroundColor:theme.background}}>{hasMenuTab&&<TouchableOpacity accessibilityRole="button" onPress={()=>navigation.navigate('MenuGallery',{placeId:place.id,placeName:place.name})} style={{flex:1,padding:14,borderRadius:14,borderWidth:1,borderColor:theme.border,alignItems:'center'}}><Text style={{color:theme.text,fontWeight:'700'}}>Tavvy Menu</Text></TouchableOpacity>}<TouchableOpacity accessibilityRole="button" disabled={reviewDisabled} accessibilityState={{disabled:reviewDisabled}} onPress={()=>{if(!reviewDisabled)navigation.navigate('AddReview',{placeId:place.id,placeName:place.name,primaryCategory:place.primaryCategory,subcategory:place.subcategory})}} style={{flex:1,padding:14,borderRadius:14,backgroundColor:reviewDisabled?theme.surface:theme.primary,alignItems:'center'}}><Text style={{color:reviewDisabled?theme.textSecondary:'#FFFFFF',fontWeight:'700'}}>Add a review</Text>{reviewDisabled&&<Text style={{color:theme.textSecondary,marginTop:5,textAlign:'center',fontSize:12}}>{copy(CRUISE_VENUE_REVIEW_NOTICE)}</Text>}</TouchableOpacity></View>
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
              backgroundColor: theme.background, 
              padding: 20, 
              borderBottomWidth: 1, 
              borderBottomColor: theme.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ionicons name="time-outline" size={24} color="#333" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 20, fontWeight: '700', color: theme.text }}>Business Hours</Text>
            </View>

            {/* Content */}
            <View style={{ padding: 24 }}>
              {parseHours(place.opening_hours).hoursList.map(row=><View key={row.day} style={styles.hoursBlock}><Text style={styles.dayText}>{row.day}</Text><Text style={styles.timeText}>{row.range}</Text></View>)}
            </View>

            {/* Footer */}
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: theme.border }}>
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
        visible={showNavModal && !cruiseVenue}
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

      {/* Address Map Popup Modal — onboard places have no fixed map position. */}
      {!cruiseVenue && <Modal
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
                {React.createElement(MapLibreGL.MapView as any, {
                  style: styles.popupMap,
                  styleURL: "https://tiles.openfreemap.org/styles/liberty",
                  logoEnabled: false,
                  attributionEnabled: false,
                }, [
                  React.createElement(MapLibreGL.Camera as any, {
                    key: 'camera',
                    zoomLevel: 15,
                    centerCoordinate: [place.longitude, place.latitude],
                    animationMode: "flyTo",
                  }),
                  React.createElement(MapLibreGL.PointAnnotation as any, {
                    key: 'marker',
                    id: "popup-marker",
                    coordinate: [place.longitude, place.latitude],
                  }, 
                    <View style={styles.markerContainer}>
                      <View style={[styles.marker, { backgroundColor: Colors.primary }]}>
                        <Ionicons name="location" size={24} color="#fff" />
                      </View>
                    </View>
                  )
                ])}
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
      </Modal>}

      {/* Review Report Modal (Apple Compliance) */}
      <Modal visible={historyOpen} animationType="slide" onRequestClose={() => setHistoryOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
          <TouchableOpacity onPress={() => setHistoryOpen(false)} style={{ padding: 20 }}><Text style={{ color: theme.primary, fontSize: 16 }}>← Back to place</Text></TouchableOpacity>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={{ color: theme.text, fontSize: 25, fontWeight: '800' }}>Review history</Text>
            <Text style={{ color: theme.textSecondary, marginTop: 8, marginBottom: 16 }}>Older experiences stay dated here. Edits are labeled and do not count as additional guests.</Text>
            {historyError ? <Text style={{ color: '#F5A623' }}>{historyError}</Text> : null}
            {historyLoading&&<Text style={{color:theme.textSecondary}}>Loading reviews…</Text>}{!historyLoading&&!historyError&&historyRows.length===0&&<Text style={{color:theme.textSecondary}}>No reviews yet.</Text>}
            {historyRows.map(review => <View key={review.historyEntryId||review.reviewId} style={{ paddingVertical: 16, borderTopWidth: 1, borderTopColor: theme.border }}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>{review.name} · {reviewDateLabel(review.createdAt,review.dateSource)}</Text>
              <ContentSafetyActions kind="place_review" contentId={review.reviewId} onSignIn={()=>{setHistoryOpen(false);navigation.navigate('Login' as never)}}/>
              {review.note ? <Text style={{ color: theme.text, marginTop: 7 }}>{review.note}</Text> : null}
              <Text style={{ color: theme.textSecondary, marginTop: 7 }}>{review.signals.map(s => s.label).join(' · ')}</Text>
            </View>)}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <TouchableOpacity disabled={historyPage === 0} onPress={() => setHistoryPage(historyPage - 1)}><Text style={{ color: historyPage === 0 ? '#666' : '#00C2CB' }}>Previous</Text></TouchableOpacity>
              <Text style={{ color: theme.text }}>{historyPage + 1} · {historyTotal} entries</Text>
              <TouchableOpacity disabled={(historyPage + 1) * 20 >= historyTotal} onPress={() => setHistoryPage(historyPage + 1)}><Text style={{ color: (historyPage + 1) * 20 >= historyTotal ? '#666' : '#00C2CB' }}>Next</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>


      {/* Story Viewer Modal */}
      <StoryViewer
        visible={showStoryViewer}
        stories={stories}
        placeName={place?.name}
        placeImage={place?.logo_url || place?.coverImageUrl}
        onClose={() => setShowStoryViewer(false)}
        onStoryViewed={(storyId) => {
          // Update story ring state after viewing
          setStoryRingState('seen');
        }}
      />
    </View>
  );
}

const makeStyles = (theme: ReturnType<typeof useThemeContext>['theme'],isDark:boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.textSecondary,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: theme.text,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 20,
    backgroundColor: '#8A05BE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // ===== 1. HERO (40% screen) =====
  heroContainer: {
    position: 'relative',
    height: 320,
    backgroundColor: '#000',
  },
  carouselImage: {
    width: width,
    height: 320,
  },
  heroGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  backButton: {
    position: 'absolute',
    top: 54,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  topRightButtons: {
    position: 'absolute',
    top: 54,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  placeName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroSubtitleText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ===== 2. ACTION BAR (sticky) =====
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBarPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#8A05BE',
    shadowColor: '#8A05BE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBarPrimaryIcon: {
    fontSize: 18,
  },
  actionBarPrimaryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  actionBarBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBarIcon: {
    fontSize: 20,
  },

  // ===== 3. SIGNAL SUMMARY =====
  signalSummarySection: {
    padding: 24,
    paddingHorizontal: 20,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  medalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  medalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  medalText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  signalPillGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  // Good pills (teal)
  pillGood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 194, 203, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 203, 0.25)',
  },
  pillLabelGood: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00A5AD',
  },
  pillCountGood: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00A5AD',
    opacity: 0.7,
    marginLeft: 2,
  },
  // Vibe pills (purple)
  pillVibe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(138, 5, 190, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(138, 5, 190, 0.2)',
  },
  pillLabelVibe: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8A05BE',
  },
  pillCountVibe: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A05BE',
    opacity: 0.7,
    marginLeft: 2,
  },
  // Heads Up pills (amber)
  pillHeadsUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.2)',
  },
  pillLabelHeadsUp: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D4850A',
  },
  pillCountHeadsUp: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D4850A',
    opacity: 0.7,
    marginLeft: 2,
  },
  pillEmoji: {
    fontSize: 16,
  },
  seeAllSignalsLink: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#8A05BE',
  },
  noSignalsContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  noSignalsText: {
    fontSize: 15,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  addSignalBtn: {
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#8A05BE',
    borderRadius: 12,
    alignItems: 'center',
  },
  addSignalBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8A05BE',
  },

  // ===== 4. MENU PREVIEW CARD =====
  sectionPadding: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  recentReviewsTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.text,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  recentReviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recentReviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#8A05BE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentReviewInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  recentReviewBody: {
    flex: 1,
  },
  recentReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  recentReviewName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
    marginRight: 8,
  },
  recentReviewWhen: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '600',
  },
  recentReviewSignals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recentReviewChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  recentReviewChipGood: {
    backgroundColor: 'rgba(0,194,203,0.1)',
    borderColor: 'rgba(0,194,203,0.2)',
  },
  recentReviewChipVibe: {
    backgroundColor: 'rgba(138,5,190,0.08)',
    borderColor: 'rgba(138,5,190,0.2)',
  },
  recentReviewChipHeadsUp: {
    backgroundColor: 'rgba(245,166,35,0.1)',
    borderColor: 'rgba(245,166,35,0.2)',
  },
  recentReviewChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recentReviewChipTextGood: {
    color: '#0A8A8F',
  },
  recentReviewChipTextVibe: {
    color: '#6B04A0',
  },
  recentReviewChipTextHeadsUp: {
    color: '#9A6600',
  },
  menuCard: {
    backgroundColor: theme.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  menuCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  menuCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  menuCardCount: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  menuThumbnailScroll: {
    marginBottom: 16,
  },
  menuThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  menuThumbImg: {
    width: '100%',
    height: '100%',
  },
  menuCTA: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8A05BE',
    alignItems: 'center',
  },
  menuCTAText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // ===== 5. FULL SIGNAL BREAKDOWN =====
  breakdownCard: {
    backgroundColor: theme.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  breakdownGroup: {
    marginBottom: 8,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.text,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 16,
  },
  emptySignalText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.5,
    color: theme.textSecondary,
    paddingLeft: 16,
    marginBottom: 14,
  },
  expandBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.background,
    alignItems: 'center',
  },
  expandBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },

  // ===== 6. PHOTOS GRID =====
  cardContainer: {
    backgroundColor: theme.background,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoGridItem: {
    width: (width - 40 - 20 - 8) / 2,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  photoGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGridOverlayText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  noPhotosText: {
    fontSize: 15,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#8A05BE',
    borderRadius: 12,
  },
  addPhotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8A05BE',
  },

  // ===== 7. INFO SECTION =====
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoContent: {
    marginTop: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoLink: {
    fontSize: 15,
    color: '#8A05BE',
    flex: 1,
    lineHeight: 20,
  },
  directionsBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    marginTop: 8,
  },
  directionsBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  claimDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  claimButton: {
    alignItems: 'center',
  },
  claimText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },

  // ===== SIGNALS & MEDALS (renderSignalBar helper) =====
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
    color: theme.text,
  },
  ghostText: {
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  signalScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  ghostNote: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },

  // ===== ENTRANCES =====
  entrancesList: {
    gap: 12,
  },
  entranceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.background,
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
    color: theme.text,
    marginBottom: 4,
  },
  entranceNamePrimary: {
    color: '#8A05BE',
  },
  entranceDetail: {
    fontSize: 13,
    color: theme.textSecondary,
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
    color: '#00C2CB',
  },
  navigateButton: {
    backgroundColor: '#8A05BE',
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
    backgroundColor: '#8A05BE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  defaultNavigateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // ===== MODALS =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: theme.background,
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
    color: theme.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#8A05BE',
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
    color: theme.text,
    marginLeft: 16,
    fontWeight: '500',
  },
  fullScreenModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  fullScreenModalContent: {
    backgroundColor: theme.background,
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
    backgroundColor: theme.background,
  },
  addressPopupText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  navigateLabel: {
    fontSize: 14,
    color: theme.textSecondary,
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
    color: theme.text,
    fontWeight: '500',
  },

  // ===== MISC =====
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
  // Legacy styles kept for helpers
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
});

export default withScreenErrorBoundary(PlaceDetailScreen, 'PlaceDetailScreen');
