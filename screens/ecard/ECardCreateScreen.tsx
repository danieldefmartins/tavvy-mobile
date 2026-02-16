/**
 * ECardCreateScreen.tsx
 * Unified real-time card builder — ONE card fills the screen.
 *
 * UX:
 *  - Swipe left/right to change template
 *  - Tap any field to edit in-place
 *  - Tap profile photo to upload
 *  - "Tap to change size" always visible (works for all sizes including cover)
 *  - 4 independent featured social icon slots (centered row, tap + to pick)
 *  - Links section separate from featured icons
 *  - Photo gallery with lightbox
 *  - Bottom bar: ◀ [color dots] ▶
 *  - "Continue" button saves card
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
  Alert,
  Dimensions,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { TEMPLATES, Template, ColorScheme } from '../../config/eCardTemplates';
import { renderTemplateLayout, CardData } from './TemplateLayouts';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACCENT_GREEN = '#00C853';

// Compute relative luminance of a hex color to determine contrast
function hexToLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const toLinear = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastTextColor(bgColor1: string, bgColor2: string): { text: string; secondary: string } {
  // Average luminance of the two gradient colors
  const l1 = hexToLuminance(bgColor1.startsWith('#') ? bgColor1 : '#667eea');
  const l2 = hexToLuminance(bgColor2.startsWith('#') ? bgColor2 : '#764ba2');
  const avgLum = (l1 + l2) / 2;
  // If background is light (luminance > 0.35), use dark text; otherwise white
  // Lowered from 0.45 to 0.35 to catch more light backgrounds and prevent unreadable text
  if (avgLum > 0.35) {
    return { text: '#1A1A1A', secondary: 'rgba(0,0,0,0.55)' };
  }
  return { text: '#FFFFFF', secondary: 'rgba(255,255,255,0.7)' };
}

// Photo size options
const PHOTO_SIZE_OPTIONS = [
  { id: 'small', label: 'Small', size: 80 },
  { id: 'medium', label: 'Medium', size: 110 },
  { id: 'large', label: 'Large', size: 150 },
  { id: 'xl', label: 'Extra Large', size: 200 },
  { id: 'cover', label: 'Cover', size: -1 },
];

// Platforms available for the 4 independent featured icon slots
const FEATURED_ICON_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { id: 'twitter', name: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00' },
  { id: 'spotify', name: 'Spotify', icon: 'musical-notes', color: '#1DB954' },
  { id: 'github', name: 'GitHub', icon: 'logo-github', color: '#181717' },
  { id: 'pinterest', name: 'Pinterest', icon: 'heart', color: '#E60023' },
  { id: 'twitch', name: 'Twitch', icon: 'logo-twitch', color: '#9146FF' },
  { id: 'discord', name: 'Discord', icon: 'logo-discord', color: '#5865F2' },
];

// Social media platforms for links
const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F', placeholder: '@username' },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000', placeholder: '@username' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', placeholder: 'Channel URL' },
  { id: 'twitter', name: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2', placeholder: '@username' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2', placeholder: 'Profile URL' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', placeholder: 'Profile URL' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', placeholder: 'Phone number' },
  { id: 'website', name: 'Website', icon: 'globe', color: '#4A90D9', placeholder: 'https://...' },
  { id: 'email', name: 'Email', icon: 'mail', color: '#EA4335', placeholder: 'email@example.com' },
  { id: 'phone', name: 'Phone', icon: 'call', color: '#34C759', placeholder: '+1 (555) 123-4567' },
  { id: 'other', name: 'Custom Link', icon: 'link', color: '#8E8E93', placeholder: 'https://...' },
];

// Professional categories matching web app endorsement system
const PROFESSIONAL_CATEGORIES = [
  { id: 'universal', label: 'General', icon: 'briefcase' },
  { id: 'sales', label: 'Sales', icon: 'trending-up' },
  { id: 'real_estate', label: 'Real Estate', icon: 'home' },
  { id: 'food_dining', label: 'Food & Dining', icon: 'restaurant' },
  { id: 'health_wellness', label: 'Health & Wellness', icon: 'fitness' },
  { id: 'beauty', label: 'Beauty & Personal Care', icon: 'color-palette' },
  { id: 'home_services', label: 'Home Services', icon: 'construct' },
  { id: 'legal_finance', label: 'Legal & Finance', icon: 'shield-checkmark' },
  { id: 'creative_marketing', label: 'Creative & Marketing', icon: 'brush' },
  { id: 'education_coaching', label: 'Education & Coaching', icon: 'school' },
  { id: 'tech_it', label: 'Tech & IT', icon: 'code-slash' },
  { id: 'automotive', label: 'Automotive', icon: 'car' },
  { id: 'events_entertainment', label: 'Events & Entertainment', icon: 'musical-notes' },
  { id: 'pets', label: 'Pets', icon: 'paw' },
];

// External review platforms matching web app
const EXTERNAL_REVIEW_PLATFORMS = [
  { id: 'google', label: 'Google Reviews', field: 'reviewGoogleUrl', color: '#4285F4', icon: 'search' },
  { id: 'yelp', label: 'Yelp', field: 'reviewYelpUrl', color: '#D32323', icon: 'star' },
  { id: 'tripadvisor', label: 'TripAdvisor', field: 'reviewTripadvisorUrl', color: '#00AF87', icon: 'navigate' },
  { id: 'facebook', label: 'Facebook Reviews', field: 'reviewFacebookUrl', color: '#1877F2', icon: 'thumbs-up' },
  { id: 'bbb', label: 'BBB', field: 'reviewBbbUrl', color: '#005A8C', icon: 'shield' },
];

interface FeaturedIcon {
  platform: string;
  url: string;
}

interface VideoItem {
  type: 'youtube' | 'tavvy_short' | 'external';
  url: string;
}

interface LinkData {
  id: string;
  platform: string;
  value: string;
}

interface GalleryImage {
  id: string;
  uri: string;
}

interface Props {
  navigation: any;
  route: any;
}

export default function ECardCreateScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { templateId: initialTemplateId, colorSchemeId: initialColorId } = route.params || {};
  const { user } = useAuth();

  // ── Template & color state ──
  const initialTplIdx = useMemo(() => {
    if (!initialTemplateId) return 0;
    const idx = TEMPLATES.findIndex(t => t.id === initialTemplateId);
    return idx >= 0 ? idx : 0;
  }, [initialTemplateId]);

  const [templateIndex, setTemplateIndex] = useState(initialTplIdx);

  const initialClrIdx = useMemo(() => {
    if (!initialColorId || !TEMPLATES[initialTplIdx]) return 0;
    const idx = TEMPLATES[initialTplIdx].colorSchemes.findIndex(c => c.id === initialColorId);
    return idx >= 0 ? idx : 0;
  }, [initialColorId, initialTplIdx]);

  const [colorIndex, setColorIndex] = useState(initialClrIdx);

  const template = TEMPLATES[templateIndex];
  const colorSchemes = template?.colorSchemes || [];
  const color = colorSchemes[colorIndex] || colorSchemes[0];
  // Premium check deferred to upsell screen — let users design freely
  const usesPremiumTemplate = template?.isPremium || false;

  const gradientColors: [string, string] = [color?.primary || '#667eea', color?.secondary || '#764ba2'];
  // Auto-compute contrast text color based on background luminance
  const computedContrast = getContrastTextColor(gradientColors[0], gradientColors[1]);
  const textColor = computedContrast.text;
  const textSecondary = computedContrast.secondary;
  const accentColor = color?.accent || 'rgba(255,255,255,0.2)';
  const isLightCard = textColor === '#1A1A1A';

  // ── Card data ──
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [titleRole, setTitleRole] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [websiteLabel, setWebsiteLabel] = useState('');
  const [address, setAddress] = useState('');
  const [photoSizeIndex, setPhotoSizeIndex] = useState(1);

  // Featured social icons (independent, up to 4, each with URL)
  const [featuredIcons, setFeaturedIcons] = useState<FeaturedIcon[]>([]);
  const [showFeaturedIconPicker, setShowFeaturedIconPicker] = useState(false);

  // Videos
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [showVideoTypePicker, setShowVideoTypePicker] = useState(false);

  // Links (separate from featured icons)
  const [links, setLinks] = useState<LinkData[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // ── Professional Category & External Reviews (matching web app) ──
  const [professionalCategory, setProfessionalCategory] = useState('universal');
  const [reviewGoogleUrl, setReviewGoogleUrl] = useState('');
  const [reviewYelpUrl, setReviewYelpUrl] = useState('');
  const [reviewTripadvisorUrl, setReviewTripadvisorUrl] = useState('');
  const [reviewFacebookUrl, setReviewFacebookUrl] = useState('');
  const [reviewBbbUrl, setReviewBbbUrl] = useState('');

  // ── Civic card fields ──
  const [ballotNumber, setBallotNumber] = useState('');
  const [partyName, setPartyName] = useState('');
  const [officeRunningFor, setOfficeRunningFor] = useState('');
  const [electionYear, setElectionYear] = useState('');
  const [campaignSlogan, setCampaignSlogan] = useState('');
  const [civicRegion, setCivicRegion] = useState('');
  const [showVoteCounts, setShowVoteCounts] = useState(true);

  // ── Auto-fill from previous card ──
  const [showAutoFillBanner, setShowAutoFillBanner] = useState(false);
  const [previousCard, setPreviousCard] = useState<any>(null);

  // ── Modals ──
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showPhotoSizeModal, setShowPhotoSizeModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const currentPhotoSize = PHOTO_SIZE_OPTIONS[photoSizeIndex];
  const isCover = currentPhotoSize.id === 'cover';

  // ── Review URL map for easy access ──
  const reviewUrlMap: Record<string, { value: string; set: (v: string) => void }> = {
    reviewGoogleUrl: { value: reviewGoogleUrl, set: setReviewGoogleUrl },
    reviewYelpUrl: { value: reviewYelpUrl, set: setReviewYelpUrl },
    reviewTripadvisorUrl: { value: reviewTripadvisorUrl, set: setReviewTripadvisorUrl },
    reviewFacebookUrl: { value: reviewFacebookUrl, set: setReviewFacebookUrl },
    reviewBbbUrl: { value: reviewBbbUrl, set: setReviewBbbUrl },
  };

  // ── Auto-fill: apply previous card data ──
  const applyAutoFill = (card: any) => {
    if (card.full_name) setName(card.full_name);
    if (card.title) setTitleRole(card.title);
    if (card.bio) setBio(card.bio);
    if (card.email) setEmail(card.email);
    if (card.phone) setPhone(card.phone);
    if (card.website) setWebsite(card.website);
    if (card.website_label) setWebsiteLabel(card.website_label);
    if (card.city) setAddress(card.city);
    if (card.profile_photo_url) setProfileImage(card.profile_photo_url);
    if (card.professional_category) setProfessionalCategory(card.professional_category);
    if (card.review_google_url) setReviewGoogleUrl(card.review_google_url);
    if (card.review_yelp_url) setReviewYelpUrl(card.review_yelp_url);
    if (card.review_tripadvisor_url) setReviewTripadvisorUrl(card.review_tripadvisor_url);
    if (card.review_facebook_url) setReviewFacebookUrl(card.review_facebook_url);
    if (card.review_bbb_url) setReviewBbbUrl(card.review_bbb_url);
    if (card.featured_socials && Array.isArray(card.featured_socials)) {
      setFeaturedIcons(card.featured_socials.map((item: any) =>
        typeof item === 'string' ? { platform: item, url: '' } : item
      ));
    }
    setShowAutoFillBanner(false);
  };

  // ── Check for existing cards on mount (auto-fill) ──
  useEffect(() => {
    const checkExistingCards = async () => {
      if (!user?.id) return;
      try {
        const { data: cards, error } = await supabase
          .from('digital_cards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        if (!error && cards && cards.length > 0) {
          setPreviousCard(cards[0]);
          setShowAutoFillBanner(true);
        }
      } catch (e) {
        console.warn('Could not fetch existing cards:', e);
      }
    };
    checkExistingCards();
  }, [user?.id]);

  // ── Restore saved draft after login redirect ──
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('ecard_draft');
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft.name) setName(draft.name);
          if (draft.titleRole) setTitleRole(draft.titleRole);
          if (draft.bio) setBio(draft.bio);
          if (draft.email) setEmail(draft.email);
          if (draft.phone) setPhone(draft.phone);
          if (draft.website) setWebsite(draft.website);
          if (draft.websiteLabel) setWebsiteLabel(draft.websiteLabel);
          if (draft.address) setAddress(draft.address);
          if (typeof draft.templateIndex === 'number') setTemplateIndex(draft.templateIndex);
          if (typeof draft.colorIndex === 'number') setColorIndex(draft.colorIndex);
          if (typeof draft.photoSizeIndex === 'number') setPhotoSizeIndex(draft.photoSizeIndex);
          if (Array.isArray(draft.featuredIcons)) {
            // Normalize: handle both flat strings and objects
            setFeaturedIcons(draft.featuredIcons.map((item: any) =>
              typeof item === 'string' ? { platform: item, url: '' } : item
            ));
          }
          if (Array.isArray(draft.links)) setLinks(draft.links);
          if (Array.isArray(draft.videos)) setVideos(draft.videos);
          if (draft.profileImage) setProfileImage(draft.profileImage);
          if (draft.professionalCategory) setProfessionalCategory(draft.professionalCategory);
          if (draft.reviewGoogleUrl) setReviewGoogleUrl(draft.reviewGoogleUrl);
          if (draft.reviewYelpUrl) setReviewYelpUrl(draft.reviewYelpUrl);
          if (draft.reviewTripadvisorUrl) setReviewTripadvisorUrl(draft.reviewTripadvisorUrl);
          if (draft.reviewFacebookUrl) setReviewFacebookUrl(draft.reviewFacebookUrl);
          if (draft.reviewBbbUrl) setReviewBbbUrl(draft.reviewBbbUrl);
          // Clear draft after restoring
          await AsyncStorage.removeItem('ecard_draft');
        }
      } catch (e) {
        console.warn('Could not restore eCard draft:', e);
      }
    })();
  }, []);

  // ── Template navigation helpers ──
  const goToPrevTemplate = () => {
    if (templateIndex > 0) { setTemplateIndex(templateIndex - 1); setColorIndex(0); }
  };
  const goToNextTemplate = () => {
    if (templateIndex < TEMPLATES.length - 1) { setTemplateIndex(templateIndex + 1); setColorIndex(0); }
  };

  // ── Image picker ──
  const pickImage = async (forGallery: boolean = false) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission is required.'); return; }
            const result = await ImagePicker.launchCameraAsync({ allowsEditing: !forGallery, aspect: forGallery ? undefined : [1, 1], quality: 0.8 });
            if (!result.canceled && result.assets[0]) {
              forGallery ? addGalleryImage(result.assets[0].uri) : setProfileImage(result.assets[0].uri);
            }
          } else if (buttonIndex === 2) {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as ImagePicker.MediaType[], allowsEditing: !forGallery, aspect: forGallery ? undefined : [1, 1], quality: 0.8, allowsMultipleSelection: forGallery });
            if (!result.canceled && result.assets) {
              if (forGallery) { result.assets.forEach(a => addGalleryImage(a.uri)); }
              else { setProfileImage(result.assets[0].uri); }
            }
          }
        }
      );
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as ImagePicker.MediaType[], allowsEditing: !forGallery, aspect: forGallery ? undefined : [1, 1], quality: 0.8, allowsMultipleSelection: forGallery });
      if (!result.canceled && result.assets) {
        if (forGallery) { result.assets.forEach(a => addGalleryImage(a.uri)); }
        else { setProfileImage(result.assets[0].uri); }
      }
    }
  };

  const addGalleryImage = (uri: string) => {
    setGalleryImages(prev => [...prev, { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), uri }]);
  };

  // ── Featured icons (independent, with URLs) ──
  const addFeaturedIcon = (platformId: string) => {
    if (featuredIcons.length < 4 && !featuredIcons.some(fi => fi.platform === platformId)) {
      setFeaturedIcons(prev => [...prev, { platform: platformId, url: '' }]);
    }
    setShowFeaturedIconPicker(false);
  };

  const removeFeaturedIcon = (platformId: string) => {
    setFeaturedIcons(prev => prev.filter(fi => fi.platform !== platformId));
  };

  const updateFeaturedIconUrl = (platformId: string, url: string) => {
    setFeaturedIcons(prev => prev.map(fi => fi.platform === platformId ? { ...fi, url } : fi));
  };

  // ── Videos ──
  const addVideo = (type: 'youtube' | 'tavvy_short' | 'external') => {
    if (type === 'tavvy_short') {
      pickVideo();
    } else {
      setVideos(prev => [...prev, { type, url: '' }]);
    }
    setShowVideoTypePicker(false);
  };

  const updateVideoUrl = (index: number, url: string) => {
    setVideos(prev => prev.map((v, i) => i === index ? { ...v, url } : v));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const pickVideo = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Record Video', 'Choose from Library', 'Choose from Files'], cancelButtonIndex: 0 },
        async (buttonIndex) => {
          try {
            if (buttonIndex === 1) {
              // Record video with camera
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission is required to record video.'); return; }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['videos'] as ImagePicker.MediaType[],
                allowsEditing: true,
                videoMaxDuration: 15,
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setVideos(prev => [...prev, { type: 'tavvy_short', url: result.assets[0].uri }]);
              }
            } else if (buttonIndex === 2) {
              // Choose from photo library
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'] as ImagePicker.MediaType[],
                allowsEditing: true,
                videoMaxDuration: 15,
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setVideos(prev => [...prev, { type: 'tavvy_short', url: result.assets[0].uri }]);
              }
            } else if (buttonIndex === 3) {
              // Choose from Files app
              const result = await DocumentPicker.getDocumentAsync({
                type: 'video/*',
                copyToCacheDirectory: true,
              });
              if (!result.canceled && result.assets && result.assets[0]) {
                setVideos(prev => [...prev, { type: 'tavvy_short', url: result.assets[0].uri }]);
              }
            }
          } catch (err) {
            console.warn('Video picker error:', err);
          }
        }
      );
    } else {
      // Android: use library picker
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['videos'] as ImagePicker.MediaType[],
          allowsEditing: true,
          videoMaxDuration: 15,
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          setVideos(prev => [...prev, { type: 'tavvy_short', url: result.assets[0].uri }]);
        }
      } catch (err) {
        console.warn('Video picker error:', err);
      }
    }
  };

  // ── Links (separate from featured icons) ──
  const addLink = (platformId: string) => {
    setLinks(prev => [...prev, { id: Date.now().toString(), platform: platformId, value: '' }]);
    setShowAddLinkModal(false);
  };

  const updateLink = (id: string, value: string) => { setLinks(prev => prev.map(l => l.id === id ? { ...l, value } : l)); };
  const removeLink = (id: string) => { setLinks(prev => prev.filter(l => l.id !== id)); };

  // ── Upload helper ──
  const uploadImage = async (uri: string, path: string): Promise<string | null> => {
    try {
      // React Native: use FormData for reliable file uploads to Supabase Storage
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: path.split('/').pop() || `upload.${ext}`,
        type: mimeType,
      } as any);

      const { data, error } = await supabase.storage
        .from('ecard-assets')
        .upload(path, formData.get('file') as any, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        // Fallback: try with fetch + arraybuffer
        console.warn('FormData upload failed, trying arraybuffer:', error.message);
        const response = await fetch(uri);
        const blob = await response.blob();
        const { data: data2, error: error2 } = await supabase.storage
          .from('ecard-assets')
          .upload(path, blob, { contentType: mimeType, upsert: true });
        if (error2) {
          console.warn('Upload fully failed:', error2.message);
          return null;
        }
      }

      const { data: urlData } = supabase.storage.from('ecard-assets').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) { console.warn('Upload error, continuing:', err); return null; }
  };

  // ── Save card ──
  const handleCreate = async () => {
    if (!user) {
      // Save draft to AsyncStorage so it can be restored after login
      try {
        const draft = {
          name, titleRole, bio, email, phone, website, websiteLabel, address,
          templateIndex, colorIndex, photoSizeIndex,
          featuredIcons, links, videos: videos.map(v => ({ type: v.type, url: v.url })),
          profileImage, professionalCategory,
          reviewGoogleUrl, reviewYelpUrl, reviewTripadvisorUrl, reviewFacebookUrl, reviewBbbUrl,
        };
        await AsyncStorage.setItem('ecard_draft', JSON.stringify(draft));
      } catch (e) { console.warn('Could not save draft:', e); }
      Alert.alert(
        'Login Required',
        'Please log in to save your card. Your design will be restored after login.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => navigation.navigate('Login' as any) },
        ]
      );
      return;
    }
    if (!name.trim()) { Alert.alert('Name Required', 'Please enter your name.'); return; }
    setIsCreating(true);
    try {
      // Upload profile photo (non-blocking — card saves even if upload fails)
      let photoUrl: string | null = null;
      if (profileImage) {
        photoUrl = await uploadImage(profileImage, `${user.id}/profile_${Date.now()}.jpg`);
      }

      // Upload gallery images (non-blocking)
      const uploadedGallery: { id: string; url: string; caption: string }[] = [];
      for (const img of galleryImages) {
        const url = await uploadImage(img.uri, `${user.id}/gallery_${img.id}.jpg`);
        if (url) uploadedGallery.push({ id: img.id, url, caption: '' });
      }

      // Generate a unique slug
      const uniqueId = `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      const tempSlug = `draft_${user.id.substring(0, 8)}_${uniqueId}`;

      const insertPayload = {
        user_id: user.id,
        slug: tempSlug,
        full_name: name.trim(),
        title: titleRole || null,
        bio: bio || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        website_label: websiteLabel || null,
        city: address || null,
        profile_photo_url: photoUrl,
        profile_photo_size: currentPhotoSize.id,
        gradient_color_1: gradientColors[0],
        gradient_color_2: gradientColors[1],
        template_id: template.id,
        color_scheme_id: color?.id || null,
        theme: template.id,
        button_style: template.layoutConfig?.buttonStyle || 'rounded',
        font_style: template.layoutConfig?.fontFamily || 'modern',
        is_published: false,
        is_active: true,
        gallery_images: uploadedGallery.length > 0 ? uploadedGallery : null,
        featured_socials: featuredIcons.length > 0 ? featuredIcons.map(fi => ({ platform: fi.platform, url: fi.url })) : null,
        videos: videos.length > 0 ? videos.map(v => ({ type: v.type, url: v.url })) : null,
        professional_category: professionalCategory || null,
        review_google_url: reviewGoogleUrl || null,
        review_yelp_url: reviewYelpUrl || null,
        review_tripadvisor_url: reviewTripadvisorUrl || null,
        review_facebook_url: reviewFacebookUrl || null,
        review_bbb_url: reviewBbbUrl || null,
        // Civic card fields
        ...(template.layout.startsWith('civic-card') ? {
          ballot_number: ballotNumber || null,
          party_name: partyName || null,
          office_running_for: officeRunningFor || null,
          election_year: electionYear || null,
          campaign_slogan: campaignSlogan || null,
          region: civicRegion || null,
          show_vote_counts: showVoteCounts,
        } : {}),
      };

      const { data: newCard, error } = await supabase
        .from('digital_cards')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        Alert.alert('Save Error', `Could not save card: ${error.message}`);
        setIsCreating(false);
        return;
      }

      if (!newCard) {
        Alert.alert('Save Error', 'Card was not returned after save. Please try again.');
        setIsCreating(false);
        return;
      }

      // Insert links (non-blocking — card already saved)
      if (links.length > 0) {
        try {
          const cardLinks = links.filter(l => l.value.trim()).map((link, index) => ({
            card_id: newCard.id,
            platform: link.platform,
            title: SOCIAL_PLATFORMS.find(p => p.id === link.platform)?.name || link.platform,
            url: link.value,
            value: link.value,
            icon: link.platform,
            sort_order: index,
            is_active: true,
          }));
          if (cardLinks.length > 0) {
            const { error: linkError } = await supabase.from('digital_card_links').insert(cardLinks);
            if (linkError) console.warn('Links insert warning:', linkError.message);
          }
        } catch (linkErr) { console.warn('Links insert failed, card still saved:', linkErr); }
      }

      // Navigate to upsell screen
      const usesPremiumColor = !(color?.isFree);
      navigation.navigate('ECardPremiumUpsell', {
        cardId: newCard.id,
        isPremiumTemplate: usesPremiumTemplate,
        isPremiumColor: usesPremiumColor,
      });
    } catch (error: any) {
      console.error('Error creating card:', error);
      Alert.alert('Error', `${error?.message || 'Unknown error'}\n\nPlease try again.`);
    } finally { setIsCreating(false); }
  };

  // ═══════════════════════════════════════════════
  //                    RENDER
  // ═══════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>{template?.name || 'Card'}</Text>
              {usesPremiumTemplate && (
                <View style={styles.proBadge}>
                  <Ionicons name="lock-closed" size={9} color="#fff" />
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerSubtitle}>{templateIndex + 1} / {TEMPLATES.length}</Text>
          </View>
          <TouchableOpacity
            style={[styles.continueBtn, (!name.trim() || isCreating) && { opacity: 0.5 }]}
            onPress={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.continueBtnText}>Continue</Text>}
          </TouchableOpacity>
        </View>

        {/* ── THE CARD ── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Auto-fill banner ── */}
          {showAutoFillBanner && previousCard && (
            <View style={styles.autoFillBanner}>
              <View style={styles.autoFillTextSection}>
                <Text style={styles.autoFillTitle}>Use info from your previous card?</Text>
                <Text style={styles.autoFillSubtitle}>{previousCard.full_name || 'Your last card'}</Text>
              </View>
              <View style={styles.autoFillActions}>
                <TouchableOpacity style={styles.autoFillYes} onPress={() => applyAutoFill(previousCard)}>
                  <Text style={styles.autoFillYesText}>Yes, use it</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.autoFillNo} onPress={() => setShowAutoFillBanner(false)}>
                  <Text style={styles.autoFillNoText}>No thanks</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.cardContainer}>
            {/* ── Big overlay arrows for template switching ── */}
            {templateIndex > 0 && (
              <TouchableOpacity
                style={styles.overlayArrowLeft}
                onPress={goToPrevTemplate}
                activeOpacity={0.7}
              >
                <View style={styles.overlayArrowCircle}>
                  <Ionicons name="chevron-back" size={28} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
            {templateIndex < TEMPLATES.length - 1 && (
              <TouchableOpacity
                style={styles.overlayArrowRight}
                onPress={goToNextTemplate}
                activeOpacity={0.7}
              >
                <View style={styles.overlayArrowCircle}>
                  <Ionicons name="chevron-forward" size={28} color="#fff" />
                </View>
              </TouchableOpacity>
            )}

            {/* ── Template-specific card layout ── */}
            <View key={`${templateIndex}_${colorIndex}`}>
              {renderTemplateLayout({
                layout: template?.layout || 'basic',
                color: color || { id: 'default', name: 'Default', primary: '#667eea', secondary: '#764ba2', accent: '#fff', text: '#fff', textSecondary: 'rgba(255,255,255,0.7)', background: '#667eea', cardBg: '#667eea' },
                data: { profileImage, name, titleRole, bio, email, phone, website, websiteLabel, address },
                isEditable: true,
                onChangeName: setName,
                onChangeTitle: setTitleRole,
                onChangeBio: setBio,
                onChangeEmail: setEmail,
                onChangePhone: setPhone,
                onChangeWebsite: setWebsite,
                onChangeWebsiteLabel: setWebsiteLabel,
                onChangeAddress: setAddress,
                onPickPhoto: () => pickImage(false),
                textColor,
                textSecondary,
                isLightCard,
                children: (
                  <>
                    {/* ===== FEATURED SOCIAL ICONS ===== */}
                    <View style={styles.featuredIconsSection}>
                      <View style={styles.featuredIconsRow}>
                        {featuredIcons.map(fi => {
                          const platform = FEATURED_ICON_PLATFORMS.find(p => p.id === fi.platform);
                          if (!platform) return null;
                          return (
                            <View key={fi.platform} style={[styles.featuredIconSlot, { backgroundColor: platform.color }]}>
                              <Ionicons name={platform.icon as any} size={18} color="#fff" />
                              <TouchableOpacity style={styles.featuredIconRemove} onPress={() => removeFeaturedIcon(fi.platform)}>
                                <Ionicons name="close" size={10} color="#fff" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                        {featuredIcons.length < 4 && (
                          <TouchableOpacity
                            style={[styles.featuredIconAdd, { borderColor: isLightCard ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }]}
                            onPress={() => setShowFeaturedIconPicker(true)}
                          >
                            <Ionicons name="add" size={18} color={isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {featuredIcons.map(fi => {
                        const platform = FEATURED_ICON_PLATFORMS.find(p => p.id === fi.platform);
                        if (!platform) return null;
                        const placeholder = fi.platform === 'whatsapp' ? 'Phone number' : fi.platform === 'email' ? 'email@example.com' : `${platform.name} URL or @username`;
                        return (
                          <View key={`url_${fi.platform}`} style={styles.featuredIconUrlRow}>
                            <View style={[styles.featuredIconUrlDot, { backgroundColor: platform.color }]}>
                              <Ionicons name={platform.icon as any} size={10} color="#fff" />
                            </View>
                            <TextInput
                              style={[styles.featuredIconUrlInput, { color: textColor }]}
                              value={fi.url}
                              onChangeText={(val) => updateFeaturedIconUrl(fi.platform, val)}
                              placeholder={placeholder}
                              placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)'}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="url"
                            />
                          </View>
                        );
                      })}
                    </View>

                    {/* ── Civic Card Fields (only for civic-card template) ── */}
                    {template.layout.startsWith('civic-card') && (
                      <View style={styles.cardSection}>
                        <View style={styles.sectionHeader}>
                          <Text style={[styles.sectionTitle, { color: textColor }]}>🇧🇷 Civic Card Details</Text>
                        </View>
                        {[
                          { label: 'Ballot Number', value: ballotNumber, set: setBallotNumber, placeholder: 'e.g. 12345', keyboard: 'numeric' as const },
                          { label: 'Party Name', value: partyName, set: setPartyName, placeholder: 'e.g. PT, PSDB, MDB', keyboard: 'default' as const },
                          { label: 'Office Running For', value: officeRunningFor, set: setOfficeRunningFor, placeholder: 'e.g. Vereador, Prefeito', keyboard: 'default' as const },
                          { label: 'Election Year', value: electionYear, set: setElectionYear, placeholder: 'e.g. 2026', keyboard: 'numeric' as const },
                          { label: 'Campaign Slogan', value: campaignSlogan, set: setCampaignSlogan, placeholder: 'Your campaign slogan', keyboard: 'default' as const },
                          { label: 'Region', value: civicRegion, set: setCivicRegion, placeholder: 'e.g. S\u00e3o Paulo, Belo Horizonte', keyboard: 'default' as const },
                        ].map((field) => (
                          <View key={field.label} style={[styles.reviewRow, { borderBottomColor: isLightCard ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: textSecondary, width: 90 }}>{field.label}</Text>
                            <TextInput
                              style={[styles.reviewInput, { color: textColor, flex: 1 }]}
                              value={field.value}
                              onChangeText={field.set}
                              placeholder={field.placeholder}
                              placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)'}
                              keyboardType={field.keyboard}
                              autoCapitalize="none"
                            />
                          </View>
                        ))}
                        <Text style={[styles.categoryHint, { color: isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.35)' }]}>These fields appear on your santinho-style civic card</Text>
                        
                        {/* Show/Hide Vote Counts Toggle */}
                        <View style={[styles.reviewRow, { borderBottomColor: isLightCard ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)', alignItems: 'center' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: textColor }}>Show Vote Counts</Text>
                            <Text style={{ fontSize: 11, color: textSecondary, marginTop: 2 }}>Display proposal vote counts publicly</Text>
                          </View>
                          <Switch
                            value={showVoteCounts}
                            onValueChange={setShowVoteCounts}
                            trackColor={{ false: '#ccc', true: accentColor || '#4CAF50' }}
                            thumbColor={showVoteCounts ? '#fff' : '#f4f3f4'}
                          />
                        </View>
                      </View>
                    )}
                    {/* ── Professional Category ── */}
                    <View style={styles.cardSection}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Professional Category</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.categorySelectBtn, { borderColor: isLightCard ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)' }]}
                        onPress={() => setShowCategoryPicker(true)}
                      >
                        <Ionicons name={(PROFESSIONAL_CATEGORIES.find(c => c.id === professionalCategory)?.icon || 'briefcase') as any} size={16} color={textColor} />
                        <Text style={[styles.categorySelectText, { color: textColor }]}>
                          {PROFESSIONAL_CATEGORIES.find(c => c.id === professionalCategory)?.label || 'Select Category'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={textSecondary} />
                      </TouchableOpacity>
                      <Text style={[styles.categoryHint, { color: isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.35)' }]}>Determines which endorsement signals appear on your card</Text>
                    </View>

                    {/* ── External Reviews ── */}
                    <View style={styles.cardSection}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>External Reviews</Text>
                      </View>
                      {EXTERNAL_REVIEW_PLATFORMS.map(platform => {
                        const { value, set } = reviewUrlMap[platform.field];
                        return (
                          <View key={platform.id} style={[styles.reviewRow, { borderBottomColor: isLightCard ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]}>
                            <View style={[styles.reviewBadge, { backgroundColor: platform.color }]}>
                              <Ionicons name={platform.icon as any} size={14} color="#fff" />
                            </View>
                            <TextInput
                              style={[styles.reviewInput, { color: textColor }]}
                              value={value}
                              onChangeText={set}
                              placeholder={`${platform.label} URL`}
                              placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)'}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="url"
                            />
                            {value ? (
                              <TouchableOpacity onPress={() => set('')}>
                                <Ionicons name="close-circle" size={18} color={isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        );
                      })}
                      <Text style={[styles.categoryHint, { color: isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.35)' }]}>Link your review profiles — badges appear on your public card</Text>
                    </View>

                    {/* ── Social Links ── */}
                    <View style={styles.cardSection}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Links</Text>
                        <TouchableOpacity onPress={() => setShowAddLinkModal(true)}>
                          <Ionicons name="add-circle" size={24} color={ACCENT_GREEN} />
                        </TouchableOpacity>
                      </View>
                      {links.map((link) => {
                        const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
                        return (
                          <View key={link.id} style={styles.linkRow}>
                            <View style={[styles.linkIconWrapper, { backgroundColor: platform?.color || '#333' }]}>
                              <Ionicons name={(platform?.icon || 'globe') as any} size={16} color="#fff" />
                            </View>
                            <TextInput
                              style={[styles.linkInput, { color: textColor }]}
                              value={link.value}
                              onChangeText={(val) => updateLink(link.id, val)}
                              placeholder={platform?.placeholder || 'Enter URL'}
                              placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)'}
                              autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => removeLink(link.id)}>
                              <Ionicons name="trash" size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                      {links.length === 0 && (
                        <TouchableOpacity style={[styles.addLinkEmptyBtn, { borderColor: isLightCard ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }]} onPress={() => setShowAddLinkModal(true)}>
                          <Ionicons name="add" size={20} color={isLightCard ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'} />
                          <Text style={{ color: isLightCard ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)', fontSize: 14 }}>Add links</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* ── Photo Gallery ── */}
                    <View style={styles.cardSection}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Photo Gallery</Text>
                        <TouchableOpacity onPress={() => pickImage(true)}>
                          <Ionicons name="add-circle" size={24} color={ACCENT_GREEN} />
                        </TouchableOpacity>
                      </View>
                      {galleryImages.length > 0 ? (
                        <View style={styles.galleryGrid}>
                          {galleryImages.map((img) => (
                            <TouchableOpacity key={img.id} style={styles.galleryThumb} onPress={() => setLightboxImage(img.uri)} activeOpacity={0.8}>
                              <Image source={{ uri: img.uri }} style={styles.galleryThumbImage} />
                              <TouchableOpacity style={styles.galleryRemoveBtn} onPress={() => setGalleryImages(prev => prev.filter(g => g.id !== img.id))}>
                                <Ionicons name="close" size={12} color="#fff" />
                              </TouchableOpacity>
                            </TouchableOpacity>
                          ))}
                          <TouchableOpacity style={[styles.galleryAddBtn, { borderColor: isLightCard ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }]} onPress={() => pickImage(true)}>
                            <Ionicons name="add" size={24} color={isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity style={[styles.galleryEmptyBtn, { borderColor: isLightCard ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }]} onPress={() => pickImage(true)}>
                          <Ionicons name="images" size={24} color={isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'} />
                          <Text style={{ color: isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)', fontSize: 14 }}>Add photos to gallery</Text>
                        </TouchableOpacity>
                      )}
                      <Text style={[styles.galleryHint, { color: isLightCard ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' }]}>Tap to view full size</Text>
                    </View>

                    {/* ── Videos ── */}
                    <View style={styles.cardSection}>
                      <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Videos</Text>
                        <TouchableOpacity onPress={() => setShowVideoTypePicker(true)}>
                          <Ionicons name="add-circle" size={24} color={ACCENT_GREEN} />
                        </TouchableOpacity>
                      </View>
                      {videos.map((video, idx) => (
                        <View key={idx} style={[styles.videoItem, { borderBottomColor: isLightCard ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]}>
                          <View style={[styles.videoTypeIcon, { backgroundColor: video.type === 'youtube' ? '#FF0000' : video.type === 'tavvy_short' ? ACCENT_GREEN : '#6366F1' }]}>
                            <Ionicons name={video.type === 'youtube' ? 'logo-youtube' : video.type === 'tavvy_short' ? 'film' : 'play'} size={14} color="#fff" />
                          </View>
                          {video.type === 'tavvy_short' && video.url ? (
                            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{ fontSize: 12, color: textColor }}>15s video ready</Text>
                            </View>
                          ) : (
                            <TextInput
                              style={[styles.videoUrlInput, { color: textColor }]}
                              value={video.url}
                              onChangeText={(val) => updateVideoUrl(idx, val)}
                              placeholder={video.type === 'youtube' ? 'YouTube URL' : 'Video URL'}
                              placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.5)'}
                              autoCapitalize="none"
                              autoCorrect={false}
                              keyboardType="url"
                            />
                          )}
                          <TouchableOpacity onPress={() => removeVideo(idx)}>
                            <Ionicons name="trash" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      {videos.length === 0 && (
                        <TouchableOpacity style={[styles.addLinkEmptyBtn, { borderColor: isLightCard ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }]} onPress={() => setShowVideoTypePicker(true)}>
                          <Ionicons name="videocam" size={20} color={isLightCard ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'} />
                          <Text style={{ color: isLightCard ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)', fontSize: 14 }}>Add videos</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                ),
              })}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Bottom Bar: ◀ [color dots] ▶ ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.navArrow, templateIndex === 0 && { opacity: 0.3 }]}
            onPress={goToPrevTemplate}
            disabled={templateIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorDotsContainer}>
            {colorSchemes.map((cs, i) => {
              const isActive = i === colorIndex;
              return (
                <TouchableOpacity
                  key={cs.id}
                  style={[styles.colorDot, isActive && styles.colorDotActive]}
                  onPress={() => setColorIndex(i)}
                >
                  <LinearGradient colors={[cs.primary, cs.secondary]} style={styles.colorDotGradient} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.navArrow, templateIndex === TEMPLATES.length - 1 && { opacity: 0.3 }]}
            onPress={goToNextTemplate}
            disabled={templateIndex === TEMPLATES.length - 1}
          >
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Photo Size Modal ── */}
      <Modal visible={showPhotoSizeModal} animationType="slide" transparent onRequestClose={() => setShowPhotoSizeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Photo Size</Text>
              <TouchableOpacity onPress={() => setShowPhotoSizeModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            {PHOTO_SIZE_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.sizeOption, i === photoSizeIndex && styles.sizeOptionActive]}
                onPress={() => { setPhotoSizeIndex(i); setShowPhotoSizeModal(false); }}
              >
                <View style={[styles.sizePreview, { width: opt.size > 0 ? Math.min(opt.size * 0.3, 40) : 40, height: opt.size > 0 ? Math.min(opt.size * 0.3, 40) : 24, borderRadius: opt.id === 'cover' ? 4 : 20 }]} />
                <Text style={styles.sizeLabel}>{opt.label}</Text>
                {i === photoSizeIndex && <Text style={styles.sizeCheck}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── Featured Icon Picker Modal ── */}
      <Modal visible={showFeaturedIconPicker} animationType="slide" transparent onRequestClose={() => setShowFeaturedIconPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Featured Icon</Text>
              <TouchableOpacity onPress={() => setShowFeaturedIconPicker(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{featuredIcons.length}/4 icons used</Text>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalPlatforms}>
                {FEATURED_ICON_PLATFORMS.filter(p => !featuredIcons.some(fi => fi.platform === p.id)).map((platform) => (
                  <TouchableOpacity key={platform.id} style={styles.modalPlatformBtn} onPress={() => addFeaturedIcon(platform.id)} activeOpacity={0.7}>
                    <View style={[styles.modalPlatformIcon, { backgroundColor: platform.color }]}>
                      <Ionicons name={platform.icon as any} size={18} color="#fff" />
                    </View>
                    <Text style={styles.modalPlatformName}>{platform.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Add Link Modal ── */}
      <Modal visible={showAddLinkModal} animationType="slide" transparent onRequestClose={() => setShowAddLinkModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Link</Text>
              <TouchableOpacity onPress={() => setShowAddLinkModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalPlatforms}>
                {SOCIAL_PLATFORMS.filter(p => !links.some(l => l.platform === p.id)).map((platform) => (
                  <TouchableOpacity key={platform.id} style={styles.modalPlatformBtn} onPress={() => addLink(platform.id)} activeOpacity={0.7}>
                    <View style={[styles.modalPlatformIcon, { backgroundColor: platform.color }]}>
                      <Ionicons name={platform.icon as any} size={18} color="#fff" />
                    </View>
                    <Text style={styles.modalPlatformName}>{platform.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Video Type Picker Modal ── */}
      <Modal visible={showVideoTypePicker} animationType="slide" transparent onRequestClose={() => setShowVideoTypePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Video</Text>
              <TouchableOpacity onPress={() => setShowVideoTypePicker(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Choose a video type</Text>
            <View style={{ padding: 16 }}>
              <View style={styles.modalPlatforms}>
                <TouchableOpacity style={styles.modalPlatformBtn} onPress={() => addVideo('youtube')} activeOpacity={0.7}>
                  <View style={[styles.modalPlatformIcon, { backgroundColor: '#FF0000' }]}>
                    <Ionicons name="logo-youtube" size={18} color="#fff" />
                  </View>
                  <Text style={styles.modalPlatformName}>YouTube</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalPlatformBtn} onPress={() => addVideo('tavvy_short')} activeOpacity={0.7}>
                  <View style={[styles.modalPlatformIcon, { backgroundColor: ACCENT_GREEN }]}>
                    <Ionicons name="film" size={18} color="#fff" />
                  </View>
                  <Text style={styles.modalPlatformName}>Tavvy Short (15s)</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalPlatformBtn} onPress={() => addVideo('external')} activeOpacity={0.7}>
                  <View style={[styles.modalPlatformIcon, { backgroundColor: '#6366F1' }]}>
                    <Ionicons name="play" size={18} color="#fff" />
                  </View>
                  <Text style={styles.modalPlatformName}>Video URL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Category Picker Modal ── */}
      <Modal visible={showCategoryPicker} animationType="slide" transparent onRequestClose={() => setShowCategoryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Professional Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Choose the category that best describes your profession</Text>
            <ScrollView style={styles.modalScroll}>
              {PROFESSIONAL_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryOption, professionalCategory === cat.id && styles.categoryOptionActive]}
                  onPress={() => { setProfessionalCategory(cat.id); setShowCategoryPicker(false); }}
                >
                  <View style={styles.categoryOptionLeft}>
                    <Ionicons name={cat.icon as any} size={20} color={professionalCategory === cat.id ? ACCENT_GREEN : '#94A3B8'} />
                    <Text style={[styles.categoryOptionLabel, professionalCategory === cat.id && { color: '#fff', fontWeight: '600' }]}>{cat.label}</Text>
                  </View>
                  {professionalCategory === cat.id && (
                    <Ionicons name="checkmark-circle" size={22} color={ACCENT_GREEN} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Lightbox ── */}
      <Modal visible={!!lightboxImage} animationType="fade" transparent onRequestClose={() => setLightboxImage(null)}>
        <TouchableOpacity style={styles.lightboxOverlay} activeOpacity={1} onPress={() => setLightboxImage(null)}>
          <TouchableOpacity style={styles.lightboxClose} onPress={() => setLightboxImage(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {lightboxImage && <Image source={{ uri: lightboxImage }} style={styles.lightboxImage} resizeMode="contain" />}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F59E0B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  proBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  continueBtn: { backgroundColor: ACCENT_GREEN, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  continueBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Card
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  cardContainer: { borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, position: 'relative' },
  liveCard: { paddingBottom: 24, alignItems: 'center' },

  // Big overlay arrows on card
  overlayArrowLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 52, zIndex: 20, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 4 },
  overlayArrowRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 52, zIndex: 20, justifyContent: 'center', alignItems: 'flex-end', paddingRight: 4 },
  overlayArrowCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 5 },


  // Cover photo
  coverPhotoContainer: { width: '100%', height: 220, position: 'relative' },
  coverPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  coverPlaceholderText: { fontSize: 14, marginTop: 8 },

  // Profile photo
  profilePhotoSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 4 },

  // Size hint - always visible
  photoSizeHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'center' },
  photoSizeHintText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },

  // Featured social icons section (independent, with URLs)
  featuredIconsSection: { width: '100%', paddingHorizontal: 16 },
  featuredIconsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 8 },
  featuredIconSlot: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  featuredIconRemove: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(239,68,68,0.9)', borderWidth: 2, borderColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center' },
  featuredIconAdd: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  featuredIconUrlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingHorizontal: 4 },
  featuredIconUrlDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featuredIconUrlInput: { flex: 1, fontSize: 12, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.2)' },

  // Video items
  videoItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1 },
  videoTypeIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  videoUrlInput: { flex: 1, fontSize: 13, paddingVertical: 4 },

  // Card fields
  cardFields: { paddingHorizontal: 20, width: '100%' },
  nameField: { fontSize: 22, fontWeight: '700', textAlign: 'center', paddingVertical: 4 },
  titleField: { fontSize: 14, fontWeight: '500', textAlign: 'center', paddingVertical: 2 },
  bioField: { fontSize: 13, textAlign: 'center', paddingVertical: 4, minHeight: 40 },
  contactFields: { marginTop: 12, gap: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1 },
  contactInput: { flex: 1, fontSize: 13, paddingVertical: 4 },

  // Links
  cardSection: { paddingHorizontal: 20, marginTop: 16, width: '100%' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10, backgroundColor: 'rgba(128,128,128,0.1)' },
  linkIconWrapper: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  linkInput: { flex: 1, fontSize: 13 },
  addLinkEmptyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10 },

  // Gallery
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryThumb: { width: (SCREEN_WIDTH - 32 - 40 - 16) / 3, aspectRatio: 1, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  galleryThumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  galleryRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(239,68,68,0.9)', alignItems: 'center', justifyContent: 'center' },
  galleryAddBtn: { width: (SCREEN_WIDTH - 32 - 40 - 16) / 3, aspectRatio: 1, borderRadius: 10, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  galleryEmptyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10 },
  galleryHint: { fontSize: 11, textAlign: 'center', marginTop: 8 },

  // ── Bottom Bar ──
  bottomBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, paddingBottom: 24, backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  navArrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  colorDotsContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  colorDot: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', position: 'relative' },
  colorDotActive: { borderColor: ACCENT_GREEN, transform: [{ scale: 1.15 }] },
  colorDotGradient: { flex: 1, borderRadius: 14 },

  // ── Photo Size Modal ──
  sizeOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10 },
  sizeOptionActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  sizePreview: { backgroundColor: 'rgba(255,255,255,0.15)' },
  sizeLabel: { fontSize: 15, color: '#fff', flex: 1 },
  sizeCheck: { color: ACCENT_GREEN, fontWeight: '700', fontSize: 16 },

  // ── Modals ──
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E293B', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', paddingHorizontal: 20, marginTop: -8, marginBottom: 8 },
  modalScroll: { padding: 16 },
  modalPlatforms: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modalPlatformBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0F172A', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, width: '48%' },
  modalPlatformIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modalPlatformName: { fontSize: 14, fontWeight: '500', color: '#fff' },

  // ── Lightbox ──
  lightboxOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  lightboxClose: { position: 'absolute', top: 60, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  lightboxImage: { width: SCREEN_WIDTH * 0.9, height: SCREEN_WIDTH * 0.9 * 1.2 },

  // ── Category Picker ──
  categorySelectBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderRadius: 12, marginTop: 4 },
  categorySelectText: { flex: 1, fontSize: 14, fontWeight: '500' },
  categoryHint: { fontSize: 11, marginTop: 6, textAlign: 'center' },
  categoryOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, marginBottom: 4 },
  categoryOptionActive: { backgroundColor: 'rgba(0,200,83,0.1)' },
  categoryOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryOptionLabel: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },

  // ── External Reviews ──
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  reviewBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  reviewInput: { flex: 1, fontSize: 13, paddingVertical: 4 },

  // ── Auto-fill Banner ──
  autoFillBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,200,83,0.12)', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,200,83,0.25)' },
  autoFillTextSection: { flex: 1, marginRight: 12 },
  autoFillTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  autoFillSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  autoFillActions: { flexDirection: 'row', gap: 8 },
  autoFillYes: { backgroundColor: ACCENT_GREEN, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  autoFillYesText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  autoFillNo: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  autoFillNoText: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
});
