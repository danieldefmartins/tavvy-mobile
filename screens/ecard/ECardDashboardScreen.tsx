import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Share,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

import { supabase } from '../../lib/supabaseClient';
import { FONTS, PREMIUM_FONT_COUNT } from '../../config/eCardFonts';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import FeaturedSocialsSelector from '../../components/ecard/FeaturedSocialsSelector';
import { TEMPLATES, getTemplateById, getColorSchemeById, resolveTemplateId } from '../../config/eCardTemplates';
import { renderTemplateLayout } from './TemplateLayouts';

const { width, height } = Dimensions.get('window');
const PREVIEW_HEIGHT = height * 0.32;

// Profile photo size options
const PHOTO_SIZES = [
  { id: 'small', name: 'Small', size: 80 },
  { id: 'medium', name: 'Medium', size: 110 },
  { id: 'large', name: 'Large', size: 150 },
  { id: 'xl', name: 'Extra\nLarge', size: 200 },
  { id: 'cover', name: 'Cover', size: -1 },
];

// Platform icons mapping
const PLATFORM_ICONS: Record<string, { icon: string; color: string; bgColor: string }> = {
  instagram: { icon: 'logo-instagram', color: '#fff', bgColor: '#E4405F' },
  tiktok: { icon: 'logo-tiktok', color: '#fff', bgColor: '#000000' },
  youtube: { icon: 'logo-youtube', color: '#fff', bgColor: '#FF0000' },
  twitter: { icon: 'logo-twitter', color: '#fff', bgColor: '#1DA1F2' },
  linkedin: { icon: 'logo-linkedin', color: '#fff', bgColor: '#0A66C2' },
  facebook: { icon: 'logo-facebook', color: '#fff', bgColor: '#1877F2' },
  snapchat: { icon: 'logo-snapchat', color: '#000', bgColor: '#FFFC00' },
  whatsapp: { icon: 'logo-whatsapp', color: '#fff', bgColor: '#25D366' },
  email: { icon: 'mail', color: '#fff', bgColor: '#EA4335' },
  website: { icon: 'globe', color: '#fff', bgColor: '#4A90D9' },
  phone: { icon: 'call', color: '#fff', bgColor: '#34C759' },
  other: { icon: 'link', color: '#fff', bgColor: '#8E8E93' },
};

// Theme configurations
const THEMES = [
  { id: 'classic', name: 'Classic', colors: ['#667eea', '#764ba2'], textColor: '#fff', isPremium: false },
  { id: 'modern', name: 'Modern', colors: ['#00C853', '#00E676'], textColor: '#fff', isPremium: false },
  { id: 'minimal', name: 'Minimal', colors: ['#FAFAFA', '#F5F5F5'], textColor: '#1A1A1A', hasBorder: true, isPremium: false },
  { id: 'bold', name: 'Bold', colors: ['#FF6B6B', '#FF8E53'], textColor: '#fff', isPremium: false },
  { id: 'elegant', name: 'Elegant', colors: ['#1A1A1A', '#333333'], textColor: '#fff', isPremium: true },
  { id: 'ocean', name: 'Ocean', colors: ['#0077B6', '#00B4D8'], textColor: '#fff', isPremium: true },
  { id: 'sunset', name: 'Sunset', colors: ['#F97316', '#FACC15'], textColor: '#fff', isPremium: true },
  { id: 'forest', name: 'Forest', colors: ['#059669', '#34D399'], textColor: '#fff', isPremium: true },
];

// Preset gradient colors
const PRESET_GRADIENTS = [
  { id: 'purple', name: 'Purple', colors: ['#667eea', '#764ba2'] },
  { id: 'ocean', name: 'Ocean', colors: ['#0077B6', '#00B4D8'] },
  { id: 'sunset', name: 'Sunset', colors: ['#F97316', '#EC4899'] },
  { id: 'forest', name: 'Forest', colors: ['#059669', '#34D399'] },
  { id: 'fire', name: 'Fire', colors: ['#EF4444', '#F97316'] },
  { id: 'pink', name: 'Pink', colors: ['#EC4899', '#F472B6'] },
  { id: 'teal', name: 'Teal', colors: ['#14B8A6', '#06B6D4'] },
  { id: 'gold', name: 'Gold', colors: ['#D4AF37', '#F59E0B'] },
  { id: 'midnight', name: 'Midnight', colors: ['#1E1B4B', '#312E81'] },
  { id: 'coral', name: 'Coral', colors: ['#FB7185', '#F43F5E'] },
  { id: 'lavender', name: 'Lavender', colors: ['#A78BFA', '#8B5CF6'] },
  { id: 'mint', name: 'Mint', colors: ['#6EE7B7', '#34D399'] },
];

// Solid color presets
const PRESET_COLORS = [
  '#667eea', '#764ba2', '#00C853', '#00E676', '#FF6B6B', '#FF8E53',
  '#1A1A1A', '#333333', '#0077B6', '#00B4D8', '#F97316', '#FACC15',
  '#059669', '#34D399', '#EC4899', '#F472B6', '#14B8A6', '#06B6D4',
  '#EF4444', '#D4AF37', '#8B5CF6', '#A78BFA', '#FFFFFF', '#F5F5F5',
];

// Button style configurations
const BUTTON_STYLES = [
  { id: 'fill', name: 'Fill' },
  { id: 'outline', name: 'Outline' },
  { id: 'rounded', name: 'Rounded' },
  { id: 'shadow', name: 'Shadow' },
  { id: 'pill', name: 'Pill' },
  { id: 'minimal', name: 'Minimal' },
];

// Social platforms for featured icons
const FEATURED_PLATFORMS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'twitter', name: 'Twitter/X' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'website', name: 'Website' },
  { id: 'email', name: 'Email' },
  { id: 'phone', name: 'Phone' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'snapchat', name: 'Snapchat' },
  { id: 'spotify', name: 'Spotify' },
  { id: 'github', name: 'GitHub' },
  { id: 'discord', name: 'Discord' },
];

interface LinkItem {
  id: string;
  platform: string;
  value: string;
  title?: string;
  clicks?: number;
}

interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
}

interface ProCredentials {
  isLicensed: boolean;
  licenseNumber?: string;
  isInsured: boolean;
  isBonded: boolean;
  isTavvyVerified: boolean;
  yearsInBusiness?: number;
  serviceArea?: string;
}

interface VerificationStatus {
  is_licensed_verified: boolean;
  is_insured_verified: boolean;
  is_bonded_verified: boolean;
  is_tavvy_verified: boolean;
  verification_status: 'pending' | 'approved' | 'rejected' | 'needs_more_info' | null;
  license_document_url?: string;
  insurance_document_url?: string;
  bonding_document_url?: string;
}

interface CardData {
  id: string;
  slug: string;
  theme: string;
  background_type: string;
  background_image_url?: string;
  background_video_url?: string;
  button_style: string;
  font_style: string;
  gradient_color_1: string;
  gradient_color_2: string;
  full_name: string;
  title: string;
  company: string;
  bio?: string;
  email?: string;
  phone?: string;
  website?: string;
  city?: string;
  state?: string;
  profile_photo_url?: string;
  profile_photo_size?: string;
  view_count?: number;
  tap_count?: number;
  form_block?: any;
  gallery_images?: GalleryImage[];
  pro_credentials?: ProCredentials;
  review_count?: number;
  review_rating?: number;
  is_published?: boolean;
  industry_icons?: IndustryIcon[];
  featured_socials?: any[];
  videos?: any[];
}

interface IndustryIcon {
  id: string;
  icon: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right';
  size: 'small' | 'medium' | 'large';
  opacity: number;
}

interface Props {
  navigation: any;
  route: any;
}

const ACCENT_GREEN = '#00C853';

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

type Tab = 'content' | 'links' | 'style' | 'stats';

export default function ECardDashboardScreen({ navigation, route }: Props) {
  const { user, isPro } = useAuth();
  const { theme, isDark } = useThemeContext();
  const { templateId, colorSchemeId, profile, links: initialLinks, isNewCard, openAppearance, cardId } = route.params || {};
  
  const [links, setLinks] = useState<LinkItem[]>(initialLinks || []);
  const [featuredSocials, setFeaturedSocials] = useState<{platformId: string; url: string}[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(openAppearance ? 'style' : 'content');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  
  // Content editing state
  const [fullName, setFullName] = useState('');
  const [titleRole, setTitleRole] = useState('');
  const [bio, setBio] = useState('');
  const [emailField, setEmailField] = useState('');
  const [phoneField, setPhoneField] = useState('');
  const [websiteField, setWebsiteField] = useState('');
  const [locationField, setLocationField] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [showSocialIcons, setShowSocialIcons] = useState(true);
  
  // Appearance state
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [selectedBackground, setSelectedBackground] = useState('gradient');
  const [selectedButtonStyle, setSelectedButtonStyle] = useState('fill');
  const [selectedFont, setSelectedFont] = useState('default');
  const [gradientColors, setGradientColors] = useState<[string, string]>(['#667eea', '#764ba2']);
  const [profilePhotoSize, setProfilePhotoSize] = useState('medium');
  const [fontColor, setFontColor] = useState<string | null>(null);
  
  // Template state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('basic');
  
  // Banner image state
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<string | null>(null); // local URI for upload
  
  // Background image/video state
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string | null>(null);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  
  // Industry Icons state
  const [industryIcons, setIndustryIcons] = useState<IndustryIcon[]>([]);
  const [showIconsModal, setShowIconsModal] = useState(false);
  
  // Gallery state
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  
  // Video state
  const [videos, setVideos] = useState<any[]>([]);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoType, setVideoType] = useState<'youtube' | 'tavvy_short' | 'url'>('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  
  // YouTube Video state (legacy)
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState<string>('');
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [tempYoutubeUrl, setTempYoutubeUrl] = useState<string>('');
  
  // Professional Category & External Reviews (matching web app)
  const [professionalCategory, setProfessionalCategory] = useState('universal');
  const [reviewGoogleUrl, setReviewGoogleUrl] = useState('');
  const [reviewYelpUrl, setReviewYelpUrl] = useState('');
  const [reviewTripadvisorUrl, setReviewTripadvisorUrl] = useState('');
  const [reviewFacebookUrl, setReviewFacebookUrl] = useState('');
  const [reviewBbbUrl, setReviewBbbUrl] = useState('');
  const [showDashCategoryPicker, setShowDashCategoryPicker] = useState(false);
  
  // Pro Credentials state
  const [proCredentials, setProCredentials] = useState<ProCredentials>({
    isLicensed: false,
    isInsured: false,
    isBonded: false,
    isTavvyVerified: false,
  });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  
  // Verification status
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    is_licensed_verified: false,
    is_insured_verified: false,
    is_bonded_verified: false,
    is_tavvy_verified: false,
    verification_status: null,
  });
  
  // Premium features tracking
  const [selectedPremiumFeatures, setSelectedPremiumFeatures] = useState<string[]>([]);
  
  // QR Code state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrDotColor, setQrDotColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF');
  const [qrStylePreset, setQrStylePreset] = useState('classic');
  
  // Card URL
  const [cardUrl, setCardUrl] = useState('tavvy.com/yourname');
  
  // Slug editing
  const [showSlugModal, setShowSlugModal] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  
  // Publish slug modal
  const [showPublishSlugModal, setShowPublishSlugModal] = useState(false);
  const [pendingSlug, setPendingSlug] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Color picker modal
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState<0 | 1>(0);
  const [tempColor, setTempColor] = useState('#667eea');
  
  // Industry icons modal
  const [iconSelectedCategory, setIconSelectedCategory] = useState('Real Estate');
  const [iconSelectedIcon, setIconSelectedIcon] = useState<string | null>(null);
  const [iconSelectedPosition, setIconSelectedPosition] = useState<IndustryIcon['position']>('top-right');
  
  // Featured icons picker
  const [showFeaturedPicker, setShowFeaturedPicker] = useState(false);

  // Link limit for free users
  const FREE_LINK_LIMIT = 5;
  const canAddMoreLinks = isPro || links.length < FREE_LINK_LIMIT;

  // ── Dynamic colors based on theme ──
  const colors = {
    bg: isDark ? '#000000' : '#FAFAFA',
    surface: isDark ? '#1A1A1A' : '#FFFFFF',
    surfaceElevated: isDark ? '#2A2A2A' : '#F3F4F6',
    text: isDark ? '#FFFFFF' : '#1A1A1A',
    textSecondary: isDark ? '#9CA3AF' : '#6B7280',
    textMuted: isDark ? '#6B7280' : '#9CA3AF',
    border: isDark ? '#333333' : '#F0F0F0',
    inputBg: isDark ? '#2A2A2A' : '#F3F4F6',
    inputBorder: isDark ? '#333333' : '#E5E7EB',
    cardBg: isDark ? '#1A1A1A' : '#FFFFFF',
    modalBg: isDark ? '#1A1A1A' : '#FFFFFF',
    statusBar: isDark ? 'light-content' : 'dark-content' as 'light-content' | 'dark-content',
  };

  // Check if user has selected premium features
  const hasPremiumFeatures = () => {
    if (selectedPremiumFeatures.length > 0) return true;
    const t = THEMES.find(t => t.id === selectedTheme);
    if (t?.isPremium) return true;
    const font = FONTS.find(f => f.id === selectedFont);
    if (font?.isPremium) return true;
    if (selectedBackground === 'video') return true;
    if (links.length > FREE_LINK_LIMIT) return true;
    if (galleryImages.length > 0) return true;
    return false;
  };

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '').substring(0, 30);
  };

  // Check slug availability
  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    if (!slug || slug.length < 3) return false;
    if (cardData?.slug === slug && cardData?.is_published) return true;
    try {
      const { data, error } = await supabase
        .from('digital_cards')
        .select('id, is_published')
        .eq('slug', slug)
        .eq('is_published', true)
        .limit(1);
      if (error) {
        Alert.alert('Connection Issue', 'Could not verify URL availability.');
        return false;
      }
      if (!data || data.length === 0) return true;
      if (cardData?.id && data[0]?.id === cardData.id) return true;
      return false;
    } catch (error) {
      Alert.alert('Error', 'Failed to check URL availability.');
      return false;
    }
  };

  // Create a new card from onboarding data
  const createNewCard = async () => {
    if (!user || !profile) return;
    const tempSlug = `draft_${user.id.substring(0, 8)}_${Date.now().toString(36)}`;
    const suggestedSlug = generateSlug(profile.name || 'user');
    const selectedTemplate = templateId ? getTemplateById(templateId) : null;
    const selectedColorScheme = templateId && colorSchemeId ? getColorSchemeById(templateId, colorSchemeId) : null;
    const gradientColor1 = selectedColorScheme?.primary || '#667eea';
    const gradientColor2 = selectedColorScheme?.secondary || '#764ba2';
    const buttonStyle = selectedTemplate?.layout?.buttonStyle || 'fill';
    
    let insertedCard = null;
    try {
      const newCardData = {
        user_id: user.id,
        slug: tempSlug,
        full_name: profile.name || '',
        title: profile.title || '',
        company: '',
        phone: '',
        email: '',
        website: '',
        city: profile.address?.city || '',
        state: profile.address?.state || '',
        gradient_color_1: gradientColor1,
        gradient_color_2: gradientColor2,
        profile_photo_url: profile.image || null,
        profile_photo_size: selectedTemplate?.layout?.photoSize || 'medium',
        theme: templateId || 'classic',
        background_type: 'gradient',
        button_style: buttonStyle,
        font_style: 'default',
        is_active: true,
        is_published: false,
      };
      
      const { data, error: insertError } = await supabase
        .from('digital_cards')
        .insert(newCardData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      insertedCard = data;
      setPendingSlug(suggestedSlug);
    } catch (error: any) {
      console.error('Failed to create card:', error);
      Alert.alert('Error', 'Failed to create your card. Please try again.');
      return;
    }
    
    try {
      if (initialLinks && initialLinks.length > 0) {
        const linksToInsert = initialLinks
          .filter((link: any) => link.value && link.value.trim())
          .map((link: any, index: number) => {
            const platform = link.platform || 'other';
            let url = link.value;
            if (platform === 'instagram') url = `https://instagram.com/${link.value}`;
            else if (platform === 'tiktok') url = `https://tiktok.com/@${link.value}`;
            else if (platform === 'youtube') url = `https://youtube.com/@${link.value}`;
            else if (platform === 'twitter') url = `https://x.com/${link.value}`;
            else if (platform === 'linkedin') url = `https://linkedin.com/in/${link.value}`;
            else if (platform === 'facebook') url = `https://facebook.com/${link.value}`;
            else if (platform === 'email') url = `mailto:${link.value}`;
            else if (platform === 'phone') url = `tel:${link.value}`;
            else if (platform === 'whatsapp') url = `https://wa.me/${link.value.replace(/\D/g, '')}`;
            else if (!url.startsWith('http')) url = `https://${url}`;
            return {
              card_id: insertedCard.id,
              platform,
              url,
              title: link.title || platform.charAt(0).toUpperCase() + platform.slice(1),
              sort_order: index,
              is_active: true,
            };
          });
        if (linksToInsert.length > 0) {
          await supabase.from('card_links').insert(linksToInsert);
        }
      }
      
      setCardData(insertedCard);
      setFullName(insertedCard.full_name || '');
      setTitleRole(insertedCard.title || '');
      setBio(insertedCard.bio || '');
      setEmailField(insertedCard.email || '');
      setPhoneField(insertedCard.phone || '');
      setWebsiteField(insertedCard.website || '');
      setLocationField([insertedCard.city, insertedCard.state].filter(Boolean).join(', '));
      setProfilePhotoUrl(insertedCard.profile_photo_url || null);
      setCardUrl(`tavvy.com/${suggestedSlug}`);
      setGradientColors([insertedCard.gradient_color_1, insertedCard.gradient_color_2]);
      setSelectedTheme(insertedCard.theme || 'classic');
      setSelectedBackground(insertedCard.background_type || 'gradient');
      setSelectedButtonStyle(insertedCard.button_style || 'fill');
      setSelectedFont(insertedCard.font_style || 'default');
      setProfilePhotoSize(insertedCard.profile_photo_size || 'medium');
      setFontColor(insertedCard.font_color || null);
      if (insertedCard.professional_category) setProfessionalCategory(insertedCard.professional_category);
      if (insertedCard.review_google_url) setReviewGoogleUrl(insertedCard.review_google_url);
      if (insertedCard.review_yelp_url) setReviewYelpUrl(insertedCard.review_yelp_url);
      if (insertedCard.review_tripadvisor_url) setReviewTripadvisorUrl(insertedCard.review_tripadvisor_url);
      if (insertedCard.review_facebook_url) setReviewFacebookUrl(insertedCard.review_facebook_url);
      if (insertedCard.review_bbb_url) setReviewBbbUrl(insertedCard.review_bbb_url);
    } catch (error: any) {
      console.error('Error inserting links:', error);
    }
  };

  // Load existing card data
  useEffect(() => {
    const loadCardData = async () => {
      if (!user) { setIsLoading(false); return; }
      try {
        if (isNewCard && profile) {
          await createNewCard();
        } else {
          let query = supabase.from('digital_cards').select('*').eq('user_id', user.id);
          if (cardId) query = query.eq('id', cardId);
          const { data: cards, error } = await query.order('created_at', { ascending: false }).limit(1);
          if (error) throw error;
          if (cards && cards.length > 0) {
            const card = cards[0];
            setCardData(card);
            setFullName(card.full_name || '');
            setTitleRole(card.title || '');
            setBio(card.bio || '');
            setEmailField(card.email || '');
            setPhoneField(card.phone || '');
            setWebsiteField(card.website || '');
            setLocationField([card.city, card.state].filter(Boolean).join(', '));
            setProfilePhotoUrl(card.profile_photo_url || null);
            setCardUrl(`tavvy.com/${card.slug}`);
            setGradientColors([card.gradient_color_1 || '#667eea', card.gradient_color_2 || '#764ba2']);
            setSelectedTheme(card.theme || 'classic');
            setSelectedBackground(card.background_type || 'gradient');
            setSelectedButtonStyle(card.button_style || 'fill');
            setSelectedFont(card.font_style || 'default');
            setProfilePhotoSize(card.profile_photo_size || 'medium');
            setFontColor(card.font_color || null);
            setGalleryImages(card.gallery_images || []);
            setVideos(card.videos || []);
            // Template and banner
            setSelectedTemplateId(resolveTemplateId(card.template_id || 'classic'));
            setBannerImageUrl(card.banner_image_url || null);
            // Visibility toggles
            setShowContactInfo(card.show_contact_info !== false);
            setShowSocialIcons(card.show_social_icons !== false);
            // Normalize featured_socials
            const rawSocials = card.featured_socials || [];
            setFeaturedSocials(rawSocials.map((item: any) => {
              if (typeof item === 'string') return { platformId: item, url: '' };
              if (item.platform && !item.platformId) return { platformId: item.platform, url: item.url || '' };
              return item;
            }));
            // Professional Category & External Reviews
            if (card.professional_category) setProfessionalCategory(card.professional_category);
            if (card.review_google_url) setReviewGoogleUrl(card.review_google_url);
            if (card.review_yelp_url) setReviewYelpUrl(card.review_yelp_url);
            if (card.review_tripadvisor_url) setReviewTripadvisorUrl(card.review_tripadvisor_url);
            if (card.review_facebook_url) setReviewFacebookUrl(card.review_facebook_url);
            if (card.review_bbb_url) setReviewBbbUrl(card.review_bbb_url);
            
            setProCredentials({
              isLicensed: card.show_licensed_badge || false,
              isInsured: card.show_insured_badge || false,
              isBonded: card.show_bonded_badge || false,
              isTavvyVerified: card.show_tavvy_verified_badge || false,
              yearsInBusiness: card.pro_credentials?.yearsInBusiness,
              serviceArea: card.pro_credentials?.serviceArea,
              licenseNumber: card.pro_credentials?.licenseNumber,
            });

            const { data: cardLinks, error: linksError } = await supabase
              .from('card_links')
              .select('*')
              .eq('card_id', card.id)
              .order('sort_order', { ascending: true });
            if (!linksError && cardLinks) {
              setLinks(cardLinks.map(link => ({
                id: link.id,
                platform: link.platform,
                value: link.url,
                title: link.title,
                clicks: link.click_count || 0,
              })));
            }
          }
        }
        
        // Load verification status
        const { data: verification, error: verificationError } = await supabase
          .from('user_verifications')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (!verificationError && verification) {
          setVerificationStatus({
            is_licensed_verified: verification.is_licensed_verified || false,
            is_insured_verified: verification.is_insured_verified || false,
            is_bonded_verified: verification.is_bonded_verified || false,
            is_tavvy_verified: verification.is_tavvy_verified || false,
            verification_status: verification.verification_status,
            license_document_url: verification.license_document_url,
            insurance_document_url: verification.insurance_document_url,
            bonding_document_url: verification.bonding_document_url,
          });
        }
      } catch (error) {
        console.error('Error loading card:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCardData();
  }, [user, isNewCard, cardId]);

  // Columns that may not exist in database yet
  const PENDING_COLUMNS = ['industry_icons', 'background_video_url'];

  // Save appearance settings
  const saveAppearanceSettings = async (settings: Partial<CardData>) => {
    if (!cardData?.id) return;
    setIsSaving(true);
    try {
      const dbSettings: Record<string, any> = {};
      const localSettings: Record<string, any> = {};
      for (const [key, value] of Object.entries(settings)) {
        if (PENDING_COLUMNS.includes(key)) {
          localSettings[key] = value;
        } else {
          dbSettings[key] = value;
        }
      }
      if (Object.keys(dbSettings).length > 0) {
        const { error } = await supabase.from('digital_cards').update(dbSettings).eq('id', cardData.id);
        if (error) throw error;
      }
      setCardData(prev => prev ? { ...prev, ...settings } : null);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save content fields
  const handleSaveContent = async () => {
    if (!cardData?.id || !user) {
      Alert.alert('Error', 'Card not found or not logged in. Please go back and try again.');
      return;
    }
    setIsSaving(true);
    try {
      const locationParts = locationField.split(',').map(s => s.trim());
      const city = locationParts[0] || '';
      const state = locationParts[1] || '';

      // Upload profile photo if it's a local file
      let photoUrl = profilePhotoUrl;
      if (profilePhotoUrl && (profilePhotoUrl.startsWith('file://') || profilePhotoUrl.startsWith('/'))) {
        const uploaded = await uploadImage(profilePhotoUrl, `${user.id}/profile_${Date.now()}.jpg`);
        if (uploaded) {
          photoUrl = uploaded;
          setProfilePhotoUrl(uploaded);
        }
      }

      // Upload gallery images that are local files
      const uploadedGallery: GalleryImage[] = [];
      for (const img of galleryImages) {
        if (img.url.startsWith('file://') || img.url.startsWith('/')) {
          // Local file — needs upload
          const uploaded = await uploadImage(img.url, `${user.id}/gallery_${img.id}_${Date.now()}.jpg`);
          if (uploaded) {
            uploadedGallery.push({ id: img.id, url: uploaded });
          }
        } else {
          // Already a remote URL — keep as is
          uploadedGallery.push(img);
        }
      }

      // Upload banner image if it's a local file
      let bannerUrl = bannerImageUrl;
      if (bannerImageFile && (bannerImageFile.startsWith('file://') || bannerImageFile.startsWith('/'))) {
        const uploaded = await uploadImage(bannerImageFile, `${user.id}/banner_${Date.now()}.jpg`);
        if (uploaded) {
          bannerUrl = uploaded;
          setBannerImageUrl(uploaded);
          setBannerImageFile(null);
        }
      }

      const updates: Record<string, any> = {
        full_name: fullName,
        title: titleRole,
        bio,
        email: emailField,
        phone: phoneField,
        website: websiteField,
        city,
        state,
        gallery_images: uploadedGallery,
        videos,
        featured_socials: featuredSocials,
        profile_photo_url: photoUrl,
        show_contact_info: showContactInfo,
        show_social_icons: showSocialIcons,
        font_color: fontColor || null,
        template_id: selectedTemplateId,
        banner_image_url: bannerUrl || null,
        professional_category: professionalCategory || null,
        review_google_url: reviewGoogleUrl || null,
        review_yelp_url: reviewYelpUrl || null,
        review_tripadvisor_url: reviewTripadvisorUrl || null,
        review_facebook_url: reviewFacebookUrl || null,
        review_bbb_url: reviewBbbUrl || null,
      };
      
      const { error } = await supabase.from('digital_cards').update(updates).eq('id', cardData.id);
      if (error) throw error;
      
      // Update local state with uploaded URLs
      setGalleryImages(uploadedGallery);
      setCardData(prev => prev ? { ...prev, ...updates } : null);
      Alert.alert('Saved!', 'Your card has been updated.');
    } catch (error) {
      console.error('Error saving content:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset card — clears all content fields
  const handleResetCard = () => {
    Alert.alert(
      'Reset Card',
      'Are you sure you want to reset this card? This will clear all content (name, title, bio, photo, banner, links, gallery, videos). This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Clear content fields
            setFullName('');
            setTitleRole('');
            setBio('');
            setEmailField('');
            setPhoneField('');
            setWebsiteField('');
            setLocationField('');
            // Clear media
            setProfilePhotoUrl(null);
            setBannerImageUrl(null);
            setBannerImageFile(null);
            setGalleryImages([]);
            setVideos([]);
            setYoutubeVideoUrl('');
            // Clear links & socials
            setLinks([]);
            setFeaturedSocials([]);
            // Reset toggles to defaults
            setShowContactInfo(true);
            setShowSocialIcons(true);
            // Clear review URLs
            setReviewGoogleUrl('');
            setReviewYelpUrl('');
            setReviewTripadvisorUrl('');
            setReviewFacebookUrl('');
            setReviewBbbUrl('');
            // Clear industry icons
            setIndustryIcons([]);
          },
        },
      ],
    );
  };

  // Upload image to Supabase Storage
  const uploadImage = async (uri: string, path: string): Promise<string | null> => {
    try {
      const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
      // Determine MIME type based on extension — support both images and videos
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
        mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mpeg: 'video/mpeg', '3gp': 'video/3gpp', avi: 'video/x-msvideo',
      };
      const mimeType = mimeMap[ext] || (ext.startsWith('mp') || ext === 'mov' || ext === 'avi' || ext === 'webm' ? 'video/mp4' : 'image/jpeg');

      // Primary approach: read file as base64 and convert to ArrayBuffer (most reliable on React Native)
      let uploadSuccess = false;
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        // Convert base64 to Uint8Array
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const { data, error } = await supabase.storage
          .from('ecard-assets')
          .upload(path, bytes.buffer, { contentType: mimeType, upsert: true });
        if (error) {
          console.warn('Base64 upload failed:', error.message);
        } else {
          uploadSuccess = true;
        }
      } catch (base64Err) {
        console.warn('Base64 read failed, trying fetch approach:', base64Err);
      }

      // Fallback: try with fetch + blob
      if (!uploadSuccess) {
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          const { data: data2, error: error2 } = await supabase.storage
            .from('ecard-assets')
            .upload(path, blob, { contentType: mimeType, upsert: true });
          if (error2) {
            console.warn('Blob upload also failed:', error2.message);
            return null;
          }
          uploadSuccess = true;
        } catch (fetchErr) {
          console.warn('Fetch+blob upload failed:', fetchErr);
          return null;
        }
      }

      const { data: urlData } = supabase.storage.from('ecard-assets').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) {
      console.warn('Upload error:', err);
      return null;
    }
  };

  // Delete image from Supabase Storage
  const deleteFromStorage = async (url: string) => {
    try {
      // Extract path from public URL: https://xxx.supabase.co/storage/v1/object/public/ecard-assets/userId/gallery_xxx.jpg
      const match = url.match(/ecard-assets\/(.+)$/);
      if (match) {
        const { error } = await supabase.storage.from('ecard-assets').remove([match[1]]);
        if (error) console.warn('Failed to delete from storage:', error.message);
      }
    } catch (err) {
      console.warn('Storage delete error:', err);
    }
  };

  // Pick profile photo
  const pickProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProfilePhotoUrl(result.assets[0].uri);
    }
  };

  // Theme selection handler
  const handleThemeSelect = (themeId: string) => {
    const t = THEMES.find(t => t.id === themeId);
    if (t) {
      setSelectedTheme(themeId);
      setGradientColors(t.colors as [string, string]);
      if (t.isPremium && !isPro) {
        if (!selectedPremiumFeatures.includes('premium_theme')) {
          setSelectedPremiumFeatures(prev => [...prev, 'premium_theme']);
        }
      } else {
        setSelectedPremiumFeatures(prev => prev.filter(f => f !== 'premium_theme'));
      }
      saveAppearanceSettings({ theme: themeId, gradient_color_1: t.colors[0], gradient_color_2: t.colors[1] });
    }
  };

  // Background selection handler
  const handleBackgroundSelect = async (bgType: string) => {
    if (bgType === 'image') { await pickBackgroundImage(); return; }
    if (bgType === 'video') { await pickBackgroundVideo(); return; }
    setSelectedBackground(bgType);
    saveAppearanceSettings({ background_type: bgType });
  };
  
  const pickBackgroundImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setIsUploadingBackground(true);
        const imageUri = result.assets[0].uri;
        setBackgroundImageUrl(imageUri);
        setSelectedBackground('image');
        if (!isPro && !selectedPremiumFeatures.includes('image_background')) {
          setSelectedPremiumFeatures(prev => [...prev, 'image_background']);
        }
        saveAppearanceSettings({ background_type: 'image', background_image_url: imageUri });
        setIsUploadingBackground(false);
      }
    } catch (error) {
      console.error('Error picking background image:', error);
      Alert.alert('Error', 'Failed to select background image.');
      setIsUploadingBackground(false);
    }
  };

  const pickBackgroundVideo = async () => {
    if (!isPro && !selectedPremiumFeatures.includes('video_background')) {
      setSelectedPremiumFeatures(prev => [...prev, 'video_background']);
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 15,
      });
      if (!result.canceled && result.assets[0]) {
        setIsUploadingBackground(true);
        const videoUri = result.assets[0].uri;
        setBackgroundVideoUrl(videoUri);
        setSelectedBackground('video');
        saveAppearanceSettings({ background_type: 'video', background_video_url: videoUri });
        setIsUploadingBackground(false);
      }
    } catch (error) {
      console.error('Error picking background video:', error);
      Alert.alert('Error', 'Failed to select background video.');
      setIsUploadingBackground(false);
    }
  };

  const handlePresetGradientSelect = (gradient: { id: string; name: string; colors: string[] }) => {
    setGradientColors(gradient.colors as [string, string]);
    saveAppearanceSettings({ gradient_color_1: gradient.colors[0], gradient_color_2: gradient.colors[1] });
  };

  const handleSolidColorSelect = (color: string) => {
    setGradientColors([color, color]);
    saveAppearanceSettings({ gradient_color_1: color, gradient_color_2: color });
  };

  const openColorPicker = (index: 0 | 1) => {
    setEditingColorIndex(index);
    setTempColor(gradientColors[index]);
    setShowColorPicker(true);
  };

  const applyCustomColor = () => {
    const newColors: [string, string] = [...gradientColors];
    newColors[editingColorIndex] = tempColor;
    setGradientColors(newColors);
    saveAppearanceSettings({ gradient_color_1: newColors[0], gradient_color_2: newColors[1] });
    setShowColorPicker(false);
  };

  const handleButtonStyleSelect = (styleId: string) => {
    setSelectedButtonStyle(styleId);
    saveAppearanceSettings({ button_style: styleId });
  };

  const handleFontSelect = (fontId: string) => {
    const font = FONTS.find(f => f.id === fontId);
    setSelectedFont(fontId);
    if (font?.isPremium && !isPro) {
      if (!selectedPremiumFeatures.includes('premium_font')) {
        setSelectedPremiumFeatures(prev => [...prev, 'premium_font']);
      }
    } else {
      setSelectedPremiumFeatures(prev => prev.filter(f => f !== 'premium_font'));
    }
    saveAppearanceSettings({ font_style: fontId });
  };

  const handlePhotoSizeSelect = (sizeId: string) => {
    setProfilePhotoSize(sizeId);
    saveAppearanceSettings({ profile_photo_size: sizeId });
  };

  // Gallery handlers
  const handleAddGalleryImage = async () => {
    if (galleryImages.length >= 10) {
      Alert.alert('Limit Reached', 'You can add up to 10 images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const newImage: GalleryImage = { id: Date.now().toString(), url: result.assets[0].uri };
      const updated = [...galleryImages, newImage];
      setGalleryImages(updated);
      if (!isPro && !selectedPremiumFeatures.includes('gallery')) {
        setSelectedPremiumFeatures(prev => [...prev, 'gallery']);
      }
    }
  };

  const handleRemoveGalleryImage = async (imageId: string) => {
    const imageToRemove = galleryImages.find(img => img.id === imageId);
    const updated = galleryImages.filter(img => img.id !== imageId);
    setGalleryImages(updated);
    if (updated.length === 0) {
      setSelectedPremiumFeatures(prev => prev.filter(f => f !== 'gallery'));
    }
    // Delete from Supabase Storage if it's a remote URL
    if (imageToRemove && imageToRemove.url && !imageToRemove.url.startsWith('file://') && !imageToRemove.url.startsWith('/')) {
      await deleteFromStorage(imageToRemove.url);
    }
    // Also update the database immediately to remove the image
    if (cardData?.id) {
      const uploadedOnly = updated.filter(img => !img.url.startsWith('file://') && !img.url.startsWith('/'));
      await supabase.from('digital_cards').update({ gallery_images: uploadedOnly }).eq('id', cardData.id).catch(() => {});
    }
  };

  // Featured icon handlers
  const addFeaturedIcon = (platformId: string) => {
    if (featuredSocials.length >= 4) return;
    setFeaturedSocials(prev => [...prev, { platformId, url: '' }]);
    setShowFeaturedPicker(false);
  };

  const removeFeaturedIcon = (platformId: string) => {
    setFeaturedSocials(prev => prev.filter(fi => fi.platformId !== platformId));
  };

  const updateFeaturedIconUrl = (platformId: string, url: string) => {
    setFeaturedSocials(prev => prev.map(fi => fi.platformId === platformId ? { ...fi, url } : fi));
  };

  // Video handlers
  const addVideo = () => {
    if (!videoUrl.trim()) return;
    const newVideo = { type: videoType, url: videoUrl.trim() };
    setVideos(prev => [...prev, newVideo]);
    setVideoUrl('');
    setShowVideoModal(false);
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  // Industry icon handlers
  const handleAddIndustryIcon = (iconName: string, position: IndustryIcon['position']) => {
    const newIcon: IndustryIcon = { id: Date.now().toString(), icon: iconName, position, size: 'medium', opacity: 0.15 };
    const updated = [...industryIcons, newIcon];
    setIndustryIcons(updated);
    if (!isPro && !selectedPremiumFeatures.includes('industry_icons')) {
      setSelectedPremiumFeatures(prev => [...prev, 'industry_icons']);
    }
    saveAppearanceSettings({ industry_icons: updated });
  };
  
  const handleRemoveIndustryIcon = (iconId: string) => {
    const updated = industryIcons.filter(icon => icon.id !== iconId);
    setIndustryIcons(updated);
    if (updated.length === 0) {
      setSelectedPremiumFeatures(prev => prev.filter(f => f !== 'industry_icons'));
    }
    saveAppearanceSettings({ industry_icons: updated });
  };

  // Pro Credentials save
  const handleSaveCredentials = async () => {
    if (!cardData?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('digital_cards')
        .update({
          show_licensed_badge: proCredentials.isLicensed,
          show_insured_badge: proCredentials.isInsured,
          show_bonded_badge: proCredentials.isBonded,
          show_tavvy_verified_badge: proCredentials.isTavvyVerified,
        })
        .eq('id', cardData.id);
      setCardData(prev => prev ? {
        ...prev,
        pro_credentials: {
          yearsInBusiness: proCredentials.yearsInBusiness,
          serviceArea: proCredentials.serviceArea,
          licenseNumber: proCredentials.licenseNumber,
        }
      } : null);
      if (error) throw error;
      setShowCredentialsModal(false);
      Alert.alert('Saved', 'Your credentials have been updated.');
    } catch (error) {
      console.error('Error saving credentials:', error);
      Alert.alert('Error', 'Failed to save credentials.');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish & Share
  const handlePublishShare = () => {
    if (!isPro && hasPremiumFeatures()) {
      Alert.alert('Premium Features Detected', 'Your card includes premium features.', [
        { text: 'Save for Later', style: 'cancel', onPress: () => Alert.alert('Card Saved!', 'Your card has been saved as a draft.') },
        { text: 'Use Free Version', style: 'destructive', onPress: removePremiumFeatures },
        { text: 'Upgrade to Pro', onPress: () => navigation.navigate('ECardPremiumUpsell') },
      ]);
      return;
    }
    if (!cardData?.is_published) {
      const suggestedSlug = pendingSlug || generateSlug(cardData?.full_name || 'user');
      setSlugInput(suggestedSlug);
      setSlugAvailable(null);
      setShowPublishSlugModal(true);
      return;
    }
    handleShare();
  };
  
  const handleConfirmPublish = async () => {
    if (!slugAvailable || !cardData?.id) {
      Alert.alert('Check Availability', 'Please check if your URL is available.');
      return;
    }
    setIsPublishing(true);
    try {
      const { error } = await supabase.from('digital_cards').update({ slug: slugInput, is_published: true }).eq('id', cardData.id);
      if (error) {
        if (error.code === '23505') {
          Alert.alert('URL Taken', 'Please choose a different one.');
          setSlugAvailable(false);
          return;
        }
        throw error;
      }
      setCardData(prev => prev ? { ...prev, slug: slugInput, is_published: true } : null);
      setCardUrl(`tavvy.com/${slugInput}`);
      setPendingSlug(slugInput);
      setShowPublishSlugModal(false);
      Alert.alert('Card Published!', `Your card is now live at:\ntavvy.com/${slugInput}`, [
        { text: 'Share Now', onPress: handleShare },
        { text: 'Done', style: 'cancel' },
      ]);
    } catch (error) {
      console.error('Error publishing card:', error);
      Alert.alert('Error', 'Failed to publish your card.');
    } finally {
      setIsPublishing(false);
    }
  };

  const removePremiumFeatures = () => {
    const freeTheme = THEMES.find(t => !t.isPremium);
    if (freeTheme) { setSelectedTheme(freeTheme.id); setGradientColors(freeTheme.colors as [string, string]); }
    const freeFont = FONTS.find(f => !f.isPremium);
    if (freeFont) setSelectedFont(freeFont.id);
    if (selectedBackground === 'video') setSelectedBackground('gradient');
    setGalleryImages([]);
    if (links.length > FREE_LINK_LIMIT) setLinks(links.slice(0, FREE_LINK_LIMIT));
    setSelectedPremiumFeatures([]);
    Alert.alert('Done', 'Premium features have been removed.');
  };

  const handleDeleteCard = () => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card? All links, photos, and uploaded files will be permanently removed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              if (cardData?.id) {
                // 1. Collect every ecard-assets URL referenced by this card
                const urlsToDelete: string[] = [];
                if (profilePhotoUrl) urlsToDelete.push(profilePhotoUrl);
                if (bannerImageUrl) urlsToDelete.push(bannerImageUrl);
                if (cardData.background_image_url) urlsToDelete.push(cardData.background_image_url);
                if (Array.isArray(galleryImages)) {
                  for (const img of galleryImages) {
                    if (img?.url) urlsToDelete.push(img.url);
                  }
                }
                if (Array.isArray(videos)) {
                  for (const vid of videos) {
                    if (vid?.url) urlsToDelete.push(vid.url);
                  }
                }

                // 2. Convert public URLs to storage paths and batch-delete
                const storagePaths: string[] = [];
                for (const url of urlsToDelete) {
                  if (!url) continue;
                  const match = url.match(/ecard-assets\/(.+)$/);
                  if (match) storagePaths.push(match[1]);
                }
                if (storagePaths.length > 0) {
                  const { error: storageErr } = await supabase.storage
                    .from('ecard-assets')
                    .remove(storagePaths);
                  if (storageErr) {
                    console.warn('Failed to remove some storage files:', storageErr);
                  }
                }

                // 3. Delete the card row (cascades to all child tables via FK constraints)
                const { error } = await supabase.from('digital_cards').delete().eq('id', cardData.id);
                if (error) throw error;
                Alert.alert('Success', 'Your card has been deleted.', [
                  { text: 'OK', onPress: () => navigation.navigate('MyCards') }
                ]);
              }
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete card.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try { await Share.share({ url: `https://${cardUrl}` }); } catch (error) { console.error(error); }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(`https://${cardUrl}`);
    Alert.alert('Copied!', `https://${cardUrl}`);
  };

  const handleSaveToWallet = () => {
    const walletUrl = `tavvy://wallet/save?card=${cardData?.slug}`;
    Alert.alert('Save to Tavvy Wallet', 'Share this link with others:', [
      { text: 'Copy Link', onPress: () => Clipboard.setStringAsync(walletUrl) },
      { text: 'Share', onPress: () => Share.share({ url: walletUrl }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const QR_PRESETS = [
    { id: 'classic', name: 'Classic', dotColor: '#000000', bgColor: '#FFFFFF' },
    { id: 'green', name: 'Tavvy Green', dotColor: '#00C853', bgColor: '#FFFFFF' },
    { id: 'purple', name: 'Purple', dotColor: '#8B5CF6', bgColor: '#FFFFFF' },
    { id: 'dark', name: 'Dark', dotColor: '#FFFFFF', bgColor: '#1f2937' },
    { id: 'gold', name: 'Gold', dotColor: '#d4af37', bgColor: '#1f2937' },
    { id: 'blue', name: 'Blue', dotColor: '#3B82F6', bgColor: '#FFFFFF' },
    { id: 'red', name: 'Red', dotColor: '#EF4444', bgColor: '#FFFFFF' },
    { id: 'ocean', name: 'Ocean', dotColor: '#0077B6', bgColor: '#E0F7FA' },
  ];

  const generateQRCode = (dotColor?: string, bgColor?: string) => {
    const dc = (dotColor || qrDotColor).replace('#', '');
    const bc = (bgColor || qrBgColor).replace('#', '');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://${cardUrl}&color=${dc}&bgcolor=${bc}`;
    setQrCodeUrl(qrUrl);
    setShowQRModal(true);
  };

  const handleAddLink = () => {
    if (!canAddMoreLinks && !selectedPremiumFeatures.includes('unlimited_links')) {
      setSelectedPremiumFeatures(prev => [...prev, 'unlimited_links']);
    }
    navigation.navigate('ECardAddLink', {
      onAdd: (newLink: LinkItem) => { setLinks(prev => [...prev, newLink]); },
    });
  };

  const handleEditLink = (link: LinkItem) => {
    navigation.navigate('ECardEditLink', {
      link,
      onSave: (updatedLink: LinkItem) => { setLinks(prev => prev.map(l => l.id === updatedLink.id ? updatedLink : l)); },
      onDelete: () => { setLinks(prev => prev.filter(l => l.id !== link.id)); },
    });
  };

  const getCurrentTheme = () => THEMES.find(t => t.id === selectedTheme) || THEMES[0];
  const getTextColor = () => getCurrentTheme().textColor || '#fff';
  const getCurrentPhotoSize = () => PHOTO_SIZES.find(s => s.id === profilePhotoSize) || PHOTO_SIZES[1];

  const renderCrownBadge = () => {
    const reviewCount = cardData?.review_count || 0;
    if (reviewCount === 0) return null;
    // Detect if the badge area is light or dark using gradient colors
    const badgeBgIsLight = (() => {
      const hexToLum = (hex: string) => {
        const clean = hex.replace('#', '');
        if (clean.length < 6) return 0;
        const r = parseInt(clean.substring(0, 2), 16) / 255;
        const g = parseInt(clean.substring(2, 4), 16) / 255;
        const b = parseInt(clean.substring(4, 6), 16) / 255;
        const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
      };
      const lum1 = hexToLum(gradientColors?.[0] || '#000000');
      const lum2 = hexToLum(gradientColors?.[1] || '#000000');
      return (lum1 + lum2) / 2 > 0.35;
    })();
    // Light bg → white frosted pill with dark text; Dark bg → dark frosted pill with white text
    return (
      <View style={[
        s.crownBadge,
        badgeBgIsLight ? s.crownBadgeLight : s.crownBadgeDark,
      ]}>
        <Text style={[s.crownIcon, { color: badgeBgIsLight ? '#d97706' : '#facc15' }]}>★</Text>
        <Text style={[s.crownText, { color: badgeBgIsLight ? '#1a1a1a' : '#ffffff', textShadowColor: badgeBgIsLight ? 'transparent' : 'rgba(0,0,0,0.3)' }]}>{reviewCount}</Text>
        <Text style={[s.crownChevron, { color: badgeBgIsLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' }]}>˅</Text>
      </View>
    );
  };

  // ── RENDER: Live Card Preview ──
  const renderLivePreview = () => {
    // Find the current template and its first color scheme to pass to the layout renderer
    const currentTemplate = getTemplateById(selectedTemplateId);
    const templateLayout = currentTemplate?.layout || 'basic';
    // Build a ColorScheme object from the current gradientColors
    // ALWAYS compute luminance to validate text readability
    const hexToLum = (hex: string) => {
      const c = hex.replace('#', '');
      const r = parseInt(c.substring(0, 2), 16) / 255;
      const g = parseInt(c.substring(2, 4), 16) / 255;
      const b = parseInt(c.substring(4, 6), 16) / 255;
      const toL = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      return 0.2126 * toL(r) + 0.7152 * toL(g) + 0.0722 * toL(b);
    };
    const avgBgLum = (hexToLum(gradientColors[0]) + hexToLum(gradientColors[1])) / 2;
    const bgIsActuallyLight = avgBgLum > 0.35;

    const colorScheme = (() => {
      if (currentTemplate) {
        const match = currentTemplate.colorSchemes.find(cs => cs.primary === gradientColors[0] && cs.secondary === gradientColors[1]);
        if (match) {
          // Validate the scheme's text color against actual background
          const schemeTextLum = hexToLum(match.text?.replace(/[^#0-9a-fA-F]/g, '') || '#FFFFFF');
          const textIsLight = schemeTextLum > 0.5;
          // If both bg and text are light, or both are dark, override text color
          if (bgIsActuallyLight && textIsLight) {
            return { ...match, text: '#1A1A1A', textSecondary: 'rgba(0,0,0,0.55)' };
          }
          if (!bgIsActuallyLight && !textIsLight) {
            return { ...match, text: '#FFFFFF', textSecondary: 'rgba(255,255,255,0.7)' };
          }
          return match;
        }
      }
      return {
        id: 'custom', name: 'Custom',
        primary: gradientColors[0], secondary: gradientColors[1],
        accent: bgIsActuallyLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
        text: bgIsActuallyLight ? '#1A1A1A' : '#FFFFFF',
        textSecondary: bgIsActuallyLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)',
        background: gradientColors[0], cardBg: bgIsActuallyLight ? '#fff' : gradientColors[0],
      };
    })();
    const textColor = colorScheme.text;
    const textSec = colorScheme.textSecondary;
    const isLight = bgIsActuallyLight;

    return (
      <View style={[s.previewContainer, { backgroundColor: colors.surface }]}>
        <View style={{ transform: [{ scale: 0.55 }], transformOrigin: 'top center', width: width - 48, marginBottom: -120 }}>
          {renderTemplateLayout({
            layout: templateLayout,
            color: colorScheme,
            data: {
              profileImage: profilePhotoUrl,
              name: fullName || '',
              titleRole: titleRole || '',
              bio: bio || '',
              email: emailField || '',
              phone: phoneField || '',
              website: websiteField || '',
              address: locationField || '',
            },
            isEditable: false,
            textColor,
            textSecondary: textSec,
            isLightCard: isLight,
          })}
        </View>
        {renderCrownBadge()}
        {!isPro && hasPremiumFeatures() && (
          <View style={s.premiumIndicator}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={s.premiumIndicatorText}>Premium features selected</Text>
          </View>
        )}
      </View>
    );
  };


  // ── RENDER: Content Tab ──
  const renderContentTab = () => (
    <View style={{ paddingBottom: 40 }}>
      {/* Profile Photo */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Profile Photo</Text>
        <View style={s.photoEditRow}>
          <TouchableOpacity onPress={pickProfilePhoto}>
            {profilePhotoUrl ? (
              <Image source={{ uri: profilePhotoUrl }} style={s.editPhoto} />
            ) : (
              <View style={[s.editPhotoPlaceholder, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="camera" size={28} color={colors.textMuted} />
              </View>
            )}
          </TouchableOpacity>
          <View style={s.photoActions}>
            <TouchableOpacity style={[s.photoActionBtn, { backgroundColor: colors.inputBg }]} onPress={pickProfilePhoto}>
              <Text style={[s.photoActionBtnText, { color: colors.text }]}>{profilePhotoUrl ? 'Change Photo' : 'Upload Photo'}</Text>
            </TouchableOpacity>
            {profilePhotoUrl && (
              <TouchableOpacity style={[s.photoActionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => setProfilePhotoUrl(null)}>
                <Text style={[s.photoActionBtnText, { color: '#EF4444' }]}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Basic Info */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Basic Info</Text>
        <View style={s.fieldGroup}>
          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Full Name *</Text>
          <TextInput
            style={[s.fieldInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={s.fieldGroup}>
          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Title / Role</Text>
          <TextInput
            style={[s.fieldInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
            value={titleRole}
            onChangeText={setTitleRole}
            placeholder="e.g. CEO, Designer, Realtor"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={s.fieldGroup}>
          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Bio</Text>
          <TextInput
            style={[s.fieldInput, s.fieldTextarea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
            value={bio}
            onChangeText={setBio}
            placeholder="A short bio about yourself"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Contact Info */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <View style={s.sectionHeaderToggle}>
          <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 0 }]}>Contact Info</Text>
          <View style={s.toggleRow}>
            <Text style={[s.toggleLabel, { color: colors.textMuted }]}>{showContactInfo ? 'Visible' : 'Hidden'}</Text>
            <TouchableOpacity
              style={[s.toggleTrack, showContactInfo && s.toggleTrackActive]}
              onPress={() => setShowContactInfo(!showContactInfo)}
              activeOpacity={0.7}
            >
              <View style={[s.toggleThumb, showContactInfo && s.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.fieldGroup}>
          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            style={[s.fieldInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
            value={emailField}
            onChangeText={setEmailField}
            placeholder="your@email.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={s.fieldGroup}>
          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Phone</Text>
          <TextInput
            style={[s.fieldInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
            value={phoneField}
            onChangeText={setPhoneField}
            placeholder="+1 (555) 123-4567"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </View>
        <View style={s.fieldGroup}>
          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Website</Text>
          <TextInput
            style={[s.fieldInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
            value={websiteField}
            onChangeText={setWebsiteField}
            placeholder="https://yourwebsite.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>
        <View style={s.fieldGroup}>
          <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>Location</Text>
          <TextInput
            style={[s.fieldInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
            value={locationField}
            onChangeText={setLocationField}
            placeholder="City, State"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      {/* Professional Category */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Professional Category</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>Determines which endorsement signals appear on your card</Text>
        <TouchableOpacity
          style={[s.fieldInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }]}
          onPress={() => setShowDashCategoryPicker(true)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name={(PROFESSIONAL_CATEGORIES.find(c => c.id === professionalCategory)?.icon || 'briefcase') as any} size={18} color={colors.text} />
            <Text style={{ fontSize: 15, color: colors.text }}>
              {PROFESSIONAL_CATEGORIES.find(c => c.id === professionalCategory)?.label || 'Select Category'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* External Reviews */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>External Reviews</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>Link your review profiles — badges appear on your public card</Text>
        {EXTERNAL_REVIEW_PLATFORMS.map(platform => {
          const reviewMap: Record<string, { value: string; set: (v: string) => void }> = {
            reviewGoogleUrl: { value: reviewGoogleUrl, set: setReviewGoogleUrl },
            reviewYelpUrl: { value: reviewYelpUrl, set: setReviewYelpUrl },
            reviewTripadvisorUrl: { value: reviewTripadvisorUrl, set: setReviewTripadvisorUrl },
            reviewFacebookUrl: { value: reviewFacebookUrl, set: setReviewFacebookUrl },
            reviewBbbUrl: { value: reviewBbbUrl, set: setReviewBbbUrl },
          };
          const { value, set } = reviewMap[platform.field];
          return (
            <View key={platform.id} style={[s.fieldGroup, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: platform.color, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={platform.icon as any} size={16} color="#fff" />
              </View>
              <TextInput
                style={[s.fieldInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder, flex: 1 }]}
                value={value}
                onChangeText={set}
                placeholder={`${platform.label} URL`}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>
          );
        })}
      </View>

      {/* Featured Social Icons */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <View style={s.sectionHeaderToggle}>
          <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
            Featured Social Icons <Text style={{ color: colors.textMuted, fontSize: 13 }}>(up to 4)</Text>
          </Text>
          <View style={s.toggleRow}>
            <Text style={[s.toggleLabel, { color: colors.textMuted }]}>{showSocialIcons ? 'Visible' : 'Hidden'}</Text>
            <TouchableOpacity
              style={[s.toggleTrack, showSocialIcons && s.toggleTrackActive]}
              onPress={() => setShowSocialIcons(!showSocialIcons)}
              activeOpacity={0.7}
            >
              <View style={[s.toggleThumb, showSocialIcons && s.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
        {featuredSocials.map((fi) => {
          const pi = PLATFORM_ICONS[fi.platformId];
          const pName = FEATURED_PLATFORMS.find(p => p.id === fi.platformId)?.name || fi.platformId;
          return (
            <View key={fi.platformId} style={[s.featuredIconItem, { backgroundColor: colors.surfaceElevated }]}>
              <View style={s.fiHeader}>
                <View style={s.fiLeft}>
                  <View style={[s.fiDot, { backgroundColor: pi?.bgColor || '#888' }]} />
                  <Text style={[s.fiName, { color: colors.text }]}>{pName}</Text>
                </View>
                <TouchableOpacity onPress={() => removeFeaturedIcon(fi.platformId)}>
                  <Ionicons name="trash" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[s.fiUrlInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder }]}
                value={fi.url}
                onChangeText={(text) => updateFeaturedIconUrl(fi.platformId, text)}
                placeholder={`Enter your ${pName} URL or @username`}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </View>
          );
        })}
        {featuredSocials.length < 4 && (
          <TouchableOpacity
            style={[s.addBtn, { borderColor: colors.inputBorder }]}
            onPress={() => setShowFeaturedPicker(true)}
          >
            <Ionicons name="add" size={20} color={ACCENT_GREEN} />
            <Text style={[s.addBtnText, { color: colors.text }]}>Add Social Icon</Text>
          </TouchableOpacity>
        )}
        {showFeaturedPicker && (
          <View style={[s.platformPicker, { backgroundColor: colors.surfaceElevated }]}>
            <View style={s.pickerHeader}>
              <Text style={[s.pickerTitle, { color: colors.text }]}>Choose Platform</Text>
              <TouchableOpacity onPress={() => setShowFeaturedPicker(false)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={s.platformGrid}>
              {FEATURED_PLATFORMS.filter(p => !featuredSocials.some(fi => fi.platformId === p.id)).map((platform) => (
                <TouchableOpacity
                  key={platform.id}
                  style={[s.platformOption, { backgroundColor: colors.inputBg }]}
                  onPress={() => addFeaturedIcon(platform.id)}
                >
                  <View style={[s.fiDot, { backgroundColor: PLATFORM_ICONS[platform.id]?.bgColor || '#888', width: 10, height: 10, borderRadius: 5 }]} />
                  <Text style={[s.platformOptionText, { color: colors.text }]}>{platform.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Photo Gallery */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Photo Gallery</Text>
        <View style={s.galleryGrid}>
          {galleryImages.map((img) => (
            <View key={img.id} style={s.galleryThumb}>
              <Image source={{ uri: img.url }} style={s.galleryThumbImage} />
              <TouchableOpacity style={s.galleryRemoveBtn} onPress={() => handleRemoveGalleryImage(img.id)}>
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={[s.galleryAddBtn, { backgroundColor: colors.inputBg }]} onPress={handleAddGalleryImage}>
            <Ionicons name="add" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Videos */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Videos</Text>
        {videos.map((vid, i) => (
          <View key={i} style={[s.videoItem, { backgroundColor: colors.surfaceElevated }]}>
            <View style={s.videoInfo}>
              <Text style={[s.videoType, { color: colors.text }]}>
                {vid.type === 'youtube' ? 'YouTube' : vid.type === 'tavvy_short' ? 'Tavvy Short' : 'Video URL'}
              </Text>
              <Text style={[s.videoUrl, { color: colors.textSecondary }]} numberOfLines={1}>{vid.url}</Text>
            </View>
            <TouchableOpacity onPress={() => removeVideo(i)}>
              <Ionicons name="trash" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          style={[s.addBtn, { borderColor: colors.inputBorder }]}
          onPress={() => setShowVideoModal(true)}
        >
          <Ionicons name="add" size={20} color={ACCENT_GREEN} />
          <Text style={[s.addBtnText, { color: colors.text }]}>Add Video</Text>
        </TouchableOpacity>
      </View>

      {/* Save Content Button */}
      <TouchableOpacity style={s.saveContentBtn} onPress={handleSaveContent} activeOpacity={0.8}>
        <LinearGradient colors={[ACCENT_GREEN, '#00E676']} style={s.saveContentGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={s.saveContentText}>Save Changes</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ── RENDER: Links Tab ──
  const renderLinksTab = () => (
    <View style={{ paddingBottom: 40 }}>
      {links.map((link) => {
        const pc = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
        const platformName = FEATURED_PLATFORMS.find(p => p.id === link.platform)?.name || link.platform;
        return (
          <TouchableOpacity
            key={link.id}
            style={[s.linkItem, { backgroundColor: colors.surface }]}
            onPress={() => handleEditLink(link)}
            activeOpacity={0.7}
          >
            <View style={s.linkDrag}>
              <Ionicons name="reorder-two" size={20} color={colors.textMuted} />
            </View>
            <View style={[s.linkIconCircle, { backgroundColor: pc.bgColor }]}>
              <Ionicons name={pc.icon as any} size={16} color={pc.color} />
            </View>
            <View style={s.linkContent}>
              <Text style={[s.linkPlatform, { color: colors.text }]}>{link.title || platformName}</Text>
              <Text style={[s.linkValue, { color: colors.textSecondary }]} numberOfLines={1}>{link.value || 'Not set'}</Text>
            </View>
            <View style={s.linkStats}>
              <Text style={[s.linkClicks, { color: colors.textMuted }]}>{link.clicks || 0} taps</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[s.addBtn, { borderColor: colors.inputBorder, marginHorizontal: 16, marginTop: 12 }]}
        onPress={handleAddLink}
      >
        <Ionicons name="add" size={20} color={ACCENT_GREEN} />
        <Text style={[s.addBtnText, { color: colors.text }]}>Add Link</Text>
        {!canAddMoreLinks && <Ionicons name="lock-closed" size={16} color="#F59E0B" />}
      </TouchableOpacity>

      {!isPro && (
        <Text style={[s.linkLimit, { color: colors.textSecondary }]}>
          {links.length}/{FREE_LINK_LIMIT} links used
        </Text>
      )}
    </View>
  );

  // ── RENDER: Style Tab ──
  const handleBannerPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setBannerImageFile(result.assets[0].uri);
      setBannerImageUrl(result.assets[0].uri);
    }
  };

  const renderStyleTab = () => (
    <View style={{ paddingBottom: 40 }}>
      {/* Card Layout (Template Selector) */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Card Layout</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
          Choose how your card looks. Each template has a unique layout.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TEMPLATES.map((template) => {
            const isSelected = selectedTemplateId === template.id;
            const isLocked = (template.isPremium && !isPro) || (template.isProOnly === true && !isPro);
            return (
              <TouchableOpacity
                key={template.id}
                style={{
                  width: (width - 64) / 3 - 6,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? ACCENT_GREEN : (isDark ? '#334155' : '#E5E7EB'),
                  padding: 4,
                  alignItems: 'center',
                  opacity: isLocked ? 0.5 : 1,
                  backgroundColor: isDark ? '#1E293B' : '#fff',
                }}
                onPress={() => {
                  if (isLocked) {
                    navigation.navigate('ECardPremium' as never);
                    return;
                  }
                  setSelectedTemplateId(template.id);
                  const defaultScheme = template.colorSchemes[0];
                  if (defaultScheme) {
                    setGradientColors([defaultScheme.primary, defaultScheme.secondary]);
                    saveAppearanceSettings({
                      template_id: template.id,
                      gradient_color_1: defaultScheme.primary,
                      gradient_color_2: defaultScheme.secondary,
                    });
                  }
                }}
              >
                <LinearGradient
                  colors={[template.colorSchemes[0]?.primary || '#667eea', template.colorSchemes[0]?.secondary || '#764ba2']}
                  style={{ width: '100%', height: 70, borderRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  {/* basic — centered circle + name lines */}
                  {template.layout === 'basic' && (
                    <View style={{ alignItems: 'center' }}>
                      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.3)', marginBottom: 3 }} />
                      <View style={{ width: 30, height: 3, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, marginBottom: 2 }} />
                      <View style={{ width: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                    </View>
                  )}
                  {/* blogger — white card cutout with photo overlapping */}
                  {template.layout === 'blogger' && (
                    <View style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 4 }}>
                      <View style={{ backgroundColor: '#fff', borderRadius: 6, width: '80%', paddingTop: 12, paddingBottom: 6, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
                        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#E5E7EB', marginTop: -16, marginBottom: 3, borderWidth: 1.5, borderColor: '#fff' }} />
                        <View style={{ width: '50%', height: 2, backgroundColor: '#D1D5DB', borderRadius: 2, marginBottom: 2 }} />
                        <View style={{ width: '35%', height: 1.5, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
                      </View>
                    </View>
                  )}
                  {/* business-card — dark top + light bottom split */}
                  {template.layout === 'business-card' && (
                    <View style={{ flex: 1, width: '100%' }}>
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 2 }} />
                        <View style={{ width: 28, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
                      </View>
                      <View style={{ height: '35%', backgroundColor: '#f8f9fa', alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          {[0,1,2,3].map(i => <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: template.colorSchemes[0]?.accent || '#d4af37' }} />)}
                        </View>
                      </View>
                    </View>
                  )}
                  {/* full-width — hero photo with gradient overlay */}
                  {template.layout === 'full-width' && (
                    <View style={{ flex: 1, width: '100%', justifyContent: 'flex-end', padding: 6 }}>
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
                      <View style={{ width: '55%', height: 3, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 2, marginBottom: 2 }} />
                      <View style={{ width: '35%', height: 2, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
                    </View>
                  )}
                  {/* pro-realtor — arch photo with banner */}
                  {template.layout === 'pro-realtor' && (
                    <View style={{ flex: 1, width: '100%' }}>
                      <View style={{ height: '40%', backgroundColor: 'rgba(255,255,255,0.15)' }} />
                      <View style={{ alignSelf: 'center', marginTop: -10, width: 20, height: 24, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' }} />
                      <View style={{ alignItems: 'center', marginTop: 3 }}>
                        <View style={{ width: 28, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, marginBottom: 2 }} />
                        <View style={{ width: 18, height: 1.5, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                      </View>
                    </View>
                  )}
                  {/* pro-creative — colored top + white bottom */}
                  {template.layout === 'pro-creative' && (
                    <View style={{ flex: 1, width: '100%' }}>
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                      </View>
                      <View style={{ height: '40%', backgroundColor: '#fff', paddingHorizontal: 6, justifyContent: 'center' }}>
                        <View style={{ width: '60%', height: 2.5, backgroundColor: '#333', borderRadius: 2, marginBottom: 2 }} />
                        <View style={{ width: '40%', height: 2, backgroundColor: '#999', borderRadius: 2 }} />
                      </View>
                    </View>
                  )}
                  {/* pro-corporate — decorative circles + centered photo */}
                  {template.layout === 'pro-corporate' && (
                    <View style={{ alignItems: 'center', position: 'relative' }}>
                      <View style={{ position: 'absolute', top: -8, left: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                      <View style={{ position: 'absolute', top: 2, right: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 3, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' }} />
                      <View style={{ width: 28, height: 2.5, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, marginBottom: 2 }} />
                      <View style={{ width: 18, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                    </View>
                  )}
                  {/* pro-card — split layout with name left + photo right */}
                  {template.layout === 'pro-card' && (
                    <View style={{ flex: 1, width: '100%' }}>
                      <View style={{ flex: 1, flexDirection: 'row', padding: 6, alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ width: '70%', height: 3, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, marginBottom: 3 }} />
                          <View style={{ width: '50%', height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                        </View>
                        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }} />
                      </View>
                      <View style={{ height: '30%', backgroundColor: '#fff' }} />
                    </View>
                  )}
                </LinearGradient>
                <Text style={{ fontSize: 10, fontWeight: '600', color: colors.text, marginTop: 4, textAlign: 'center' }}>{template.name}</Text>
                {isLocked && (
                  <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Ionicons name="lock-closed" size={8} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 8 }}>{template.isProOnly ? 'Pro' : 'Premium'}</Text>
                  </View>
                )}
                {isSelected && (
                  <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: ACCENT_GREEN, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Banner Image Upload */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Banner Image</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12 }}>
          Add a cover photo. Works with Banner, Bold, Modern, and other templates.
        </Text>
        {bannerImageUrl ? (
          <View style={{ borderRadius: 12, overflow: 'hidden' }}>
            <Image source={{ uri: bannerImageUrl }} style={{ width: '100%', height: 140, borderRadius: 12 }} resizeMode="cover" />
            <View style={{ position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                onPress={handleBannerPick}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.6)' }}
              >
                <Ionicons name="camera" size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12 }}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setBannerImageUrl(null); setBannerImageFile(null); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.8)' }}
              >
                <Ionicons name="close" size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12 }}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handleBannerPick}
            style={{
              width: '100%', height: 100, borderWidth: 2, borderStyle: 'dashed',
              borderColor: isDark ? '#334155' : '#D1D5DB', borderRadius: 12,
              alignItems: 'center', justifyContent: 'center', gap: 4,
            }}
          >
            <Ionicons name="image" size={24} color={isDark ? '#64748B' : '#9CA3AF'} />
            <Text style={{ color: isDark ? '#64748B' : '#9CA3AF', fontSize: 14 }}>Upload Banner Image</Text>
            <Text style={{ color: isDark ? '#475569' : '#D1D5DB', fontSize: 11 }}>Recommended: 1200 x 400px</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Color Scheme */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Color</Text>
        {(() => {
          const currentTemplate = getTemplateById(selectedTemplateId);
          if (!currentTemplate) return null;
          return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {currentTemplate.colorSchemes.map((scheme) => (
                  <TouchableOpacity
                    key={scheme.id}
                    style={{
                      alignItems: 'center', gap: 4, padding: 4,
                      borderWidth: 2, borderRadius: 10,
                      borderColor: gradientColors[0] === scheme.primary && gradientColors[1] === scheme.secondary ? ACCENT_GREEN : 'transparent',
                    }}
                    onPress={() => {
                      setGradientColors([scheme.primary, scheme.secondary]);
                      saveAppearanceSettings({ gradient_color_1: scheme.primary, gradient_color_2: scheme.secondary });
                    }}
                  >
                    <LinearGradient
                      colors={[scheme.primary, scheme.secondary]}
                      style={{ width: 44, height: 44, borderRadius: 22 }}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{scheme.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          );
        })()}
        <View style={[s.customColorRow, { marginTop: 10 }]}>
          <TouchableOpacity style={[s.customColorBtn, { borderColor: colors.inputBorder }]} onPress={() => openColorPicker(0)}>
            <View style={[s.customColorSwatch, { backgroundColor: gradientColors[0] }]} />
            <Text style={[s.customColorLabel, { color: colors.textSecondary }]}>Custom 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.customColorBtn, { borderColor: colors.inputBorder }]} onPress={() => openColorPicker(1)}>
            <View style={[s.customColorSwatch, { backgroundColor: gradientColors[1] }]} />
            <Text style={[s.customColorLabel, { color: colors.textSecondary }]}>Custom 2</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Background Color - kept for backward compat but simplified */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>More Colors</Text>
        <View style={s.gradientPresets}>
          {PRESET_GRADIENTS.map((gradient) => (
            <TouchableOpacity
              key={gradient.id}
              style={[
                s.gradientBtn,
                gradientColors[0] === gradient.colors[0] && gradientColors[1] === gradient.colors[1] && s.gradientBtnSelected,
              ]}
              onPress={() => handlePresetGradientSelect(gradient)}
            >
              <LinearGradient colors={gradient.colors as [string, string]} style={s.gradientBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.customColorRow}>
          <TouchableOpacity style={[s.customColorBtn, { borderColor: colors.inputBorder }]} onPress={() => openColorPicker(0)}>
            <View style={[s.customColorSwatch, { backgroundColor: gradientColors[0] }]} />
            <Text style={[s.customColorLabel, { color: colors.textSecondary }]}>Color 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.customColorBtn, { borderColor: colors.inputBorder }]} onPress={() => openColorPicker(1)}>
            <View style={[s.customColorSwatch, { backgroundColor: gradientColors[1] }]} />
            <Text style={[s.customColorLabel, { color: colors.textSecondary }]}>Color 2</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Photo Size */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Photo Size</Text>
        <View style={s.sizeOptions}>
          {PHOTO_SIZES.map((size) => (
            <TouchableOpacity
              key={size.id}
              style={[s.sizeOption, profilePhotoSize === size.id && s.sizeOptionSelected, { borderColor: colors.inputBorder }]}
              onPress={() => handlePhotoSizeSelect(size.id)}
            >
              <Text style={[s.sizeOptionText, { color: profilePhotoSize === size.id ? ACCENT_GREEN : colors.text }]}>{size.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Button Style */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Button Style</Text>
        <View style={s.buttonStyles}>
          {BUTTON_STYLES.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[s.buttonStyleOption, selectedButtonStyle === style.id && s.buttonStyleSelected, { borderColor: colors.inputBorder }]}
              onPress={() => handleButtonStyleSelect(style.id)}
            >
              <Text style={[s.buttonStyleText, { color: selectedButtonStyle === style.id ? ACCENT_GREEN : colors.text }]}>{style.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Font */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Font</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.fontScroll}>
          {FONTS.map((font, index) => (
            <TouchableOpacity
              key={font.id}
              style={[s.fontOption, selectedFont === font.id && s.fontOptionSelected, { borderColor: colors.inputBorder }]}
              onPress={() => handleFontSelect(font.id)}
            >
              <Text style={[s.fontOptionText, { color: selectedFont === font.id ? ACCENT_GREEN : colors.text, fontFamily: font.family || undefined }]}>{font.name}</Text>
              {font.isPremium && !isPro && <Ionicons name="lock-closed" size={10} color="#F59E0B" />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Font Color */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Font Color</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>
          Choose a text color for your card. "Auto" picks the best contrast.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[s.fontColorBtn, !fontColor && s.fontColorBtnSelected]}
              onPress={() => { setFontColor(null); saveAppearanceSettings({ font_color: null }); }}
            >
              <Text style={{ color: !fontColor ? '#fff' : colors.text, fontSize: 13 }}>Auto</Text>
            </TouchableOpacity>
            {[
              { id: '#FFFFFF', name: 'White' },
              { id: '#000000', name: 'Black' },
              { id: '#1f2937', name: 'Dark Gray' },
              { id: '#d4af37', name: 'Gold' },
              { id: '#E5E7EB', name: 'Light Gray' },
              { id: '#3B82F6', name: 'Blue' },
              { id: '#EF4444', name: 'Red' },
            ].map((color) => (
              <TouchableOpacity
                key={color.id}
                style={[s.fontColorBtn, fontColor === color.id && s.fontColorBtnSelected]}
                onPress={() => { setFontColor(color.id); saveAppearanceSettings({ font_color: color.id }); }}
              >
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: color.id, borderWidth: 1, borderColor: 'rgba(128,128,128,0.3)', marginRight: 6 }} />
                <Text style={{ color: fontColor === color.id ? '#fff' : colors.text, fontSize: 13 }}>{color.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Background Type */}
      <View style={[s.section, { backgroundColor: colors.surface }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Background</Text>
        <View style={s.bgTypeRow}>
          {['gradient', 'solid', 'image', 'video'].map((bgType) => (
            <TouchableOpacity
              key={bgType}
              style={[s.bgTypeBtn, selectedBackground === bgType && s.bgTypeBtnSelected, { borderColor: colors.inputBorder }]}
              onPress={() => handleBackgroundSelect(bgType)}
            >
              <Text style={[s.bgTypeText, { color: selectedBackground === bgType ? ACCENT_GREEN : colors.text }]}>
                {bgType.charAt(0).toUpperCase() + bgType.slice(1)}
              </Text>
              {(bgType === 'video') && !isPro && <Ionicons name="lock-closed" size={10} color="#F59E0B" />}
            </TouchableOpacity>
          ))}
        </View>
        {selectedBackground === 'solid' && (
          <View style={s.solidColorGrid}>
            {PRESET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[s.solidColorBtn, gradientColors[0] === color && s.solidColorBtnSelected]}
                onPress={() => handleSolidColorSelect(color)}
              >
                <View style={[s.solidColorSwatch, { backgroundColor: color }]} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Pro Credentials */}
      {isPro && (
        <View style={[s.section, { backgroundColor: colors.surface }]}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Pro Credentials</Text>
          <TouchableOpacity
            style={[s.addBtn, { borderColor: colors.inputBorder }]}
            onPress={() => setShowCredentialsModal(true)}
          >
            <Ionicons name="shield-checkmark" size={20} color={ACCENT_GREEN} />
            <Text style={[s.addBtnText, { color: colors.text }]}>Manage Credentials</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Card */}
      <TouchableOpacity style={s.deleteCardBtn} onPress={handleDeleteCard}>
        <Ionicons name="trash" size={18} color="#EF4444" />
        <Text style={s.deleteCardText}>Delete Card</Text>
      </TouchableOpacity>
    </View>
  );

  // ── RENDER: Stats Tab ──
  const renderStatsTab = () => (
    <View style={{ paddingBottom: 40 }}>
      <View style={[s.statsGrid]}>
        <View style={[s.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.statNumber, { color: colors.text }]}>{cardData?.view_count || 0}</Text>
          <Text style={[s.statLabel, { color: colors.textSecondary }]}>Views</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.statNumber, { color: colors.text }]}>{cardData?.tap_count || 0}</Text>
          <Text style={[s.statLabel, { color: colors.textSecondary }]}>Taps</Text>
        </View>
      </View>
      <View style={[s.statsGrid, { marginTop: 12 }]}>
        <View style={[s.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.statNumber, { color: colors.text }]}>{links.length}</Text>
          <Text style={[s.statLabel, { color: colors.textSecondary }]}>Links</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.statNumber, { color: colors.text }]}>{cardData?.review_count || 0}</Text>
          <Text style={[s.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
        </View>
      </View>

      {/* Link Performance */}
      <View style={[s.section, { backgroundColor: colors.surface, marginTop: 16 }]}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Link Performance</Text>
        {links.length === 0 ? (
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>No links yet. Add links to see performance.</Text>
        ) : (
          links.sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).map((link) => {
            const pc = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
            const platformName = FEATURED_PLATFORMS.find(p => p.id === link.platform)?.name || link.platform;
            return (
              <View key={link.id} style={[s.linkPerformanceItem, { borderBottomColor: colors.border }]}>
                <View style={[s.linkIconCircle, { backgroundColor: pc.bgColor, width: 28, height: 28, borderRadius: 14 }]}>
                  <Ionicons name={pc.icon as any} size={14} color={pc.color} />
                </View>
                <Text style={[s.linkPerformanceName, { color: colors.text }]}>{platformName}</Text>
                <Text style={[s.linkPerformanceClicks, { color: colors.textSecondary }]}>{link.clicks || 0} taps</Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );


  // ── RENDER: Modals ──
  const renderQRModal = () => (
    <Modal visible={showQRModal} transparent animationType="fade" onRequestClose={() => setShowQRModal(false)}>
      <View style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: colors.modalBg, maxHeight: '85%' }]}>
          <Text style={[s.modalTitle, { color: colors.text }]}>QR Code</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
            Customize your QR code style
          </Text>
          
          {/* QR Code Preview */}
          {qrCodeUrl ? (
            <View style={{ alignItems: 'center', marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: qrBgColor }}>
              <Image source={{ uri: qrCodeUrl }} style={s.qrImage} />
            </View>
          ) : null}

          {/* Style Presets */}
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {QR_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => {
                    setQrStylePreset(preset.id);
                    setQrDotColor(preset.dotColor);
                    setQrBgColor(preset.bgColor);
                    // Regenerate QR with new colors
                    const dc = preset.dotColor.replace('#', '');
                    const bc = preset.bgColor.replace('#', '');
                    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://${cardUrl}&color=${dc}&bgcolor=${bc}`);
                  }}
                  style={{
                    alignItems: 'center', gap: 4, padding: 8,
                    borderWidth: 2, borderRadius: 12, minWidth: 64,
                    borderColor: qrStylePreset === preset.id ? ACCENT_GREEN : (isDark ? '#334155' : '#E5E7EB'),
                    backgroundColor: isDark ? '#0F172A' : '#F9FAFB',
                  }}
                >
                  <View style={{
                    width: 28, height: 28, borderRadius: 6,
                    backgroundColor: preset.bgColor,
                    borderWidth: 2, borderColor: preset.dotColor,
                  }} />
                  <Text style={{ color: colors.text, fontSize: 10, fontWeight: '600' }}>{preset.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Card URL */}
          <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
            https://{cardUrl}
          </Text>

          <TouchableOpacity style={s.modalCloseBtn} onPress={() => setShowQRModal(false)}>
            <Text style={s.modalCloseBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSlugModal = () => (
    <Modal visible={showSlugModal} transparent animationType="fade" onRequestClose={() => setShowSlugModal(false)}>
      <View style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: colors.modalBg }]}>
          <Text style={[s.modalTitle, { color: colors.text }]}>Edit Card URL</Text>
          <View style={s.slugInputRow}>
            <Text style={[s.slugPrefix, { color: colors.textSecondary }]}>tavvy.com/</Text>
            <TextInput
              style={[s.slugInput, { color: colors.text, borderColor: colors.inputBorder }]}
              value={slugInput}
              onChangeText={(text) => { setSlugInput(text.toLowerCase().replace(/[^a-z0-9]/g, '')); setSlugAvailable(null); }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={s.checkSlugBtn}
            onPress={async () => {
              setIsCheckingSlug(true);
              const available = await checkSlugAvailability(slugInput);
              setSlugAvailable(available);
              setIsCheckingSlug(false);
            }}
          >
            {isCheckingSlug ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.checkSlugBtnText}>Check Availability</Text>}
          </TouchableOpacity>
          {slugAvailable !== null && (
            <Text style={{ color: slugAvailable ? ACCENT_GREEN : '#EF4444', marginTop: 8 }}>
              {slugAvailable ? 'Available!' : 'Already taken'}
            </Text>
          )}
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowSlugModal(false)}>
              <Text style={[s.modalCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalSaveBtn, !slugAvailable && { opacity: 0.5 }]}
              disabled={!slugAvailable}
              onPress={async () => {
                if (!cardData?.id) return;
                const { error } = await supabase.from('digital_cards').update({ slug: slugInput }).eq('id', cardData.id);
                if (!error) {
                  setCardData(prev => prev ? { ...prev, slug: slugInput } : null);
                  setCardUrl(`tavvy.com/${slugInput}`);
                  setShowSlugModal(false);
                } else {
                  Alert.alert('Error', 'Failed to update URL.');
                }
              }}
            >
              <Text style={s.modalSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPublishSlugModal = () => (
    <Modal visible={showPublishSlugModal} transparent animationType="fade" onRequestClose={() => setShowPublishSlugModal(false)}>
      <View style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: colors.modalBg }]}>
          <Text style={[s.modalTitle, { color: colors.text }]}>Choose Your Card URL</Text>
          <Text style={[s.modalSubtitle, { color: colors.textSecondary }]}>This will be your permanent card link</Text>
          <View style={s.slugInputRow}>
            <Text style={[s.slugPrefix, { color: colors.textSecondary }]}>tavvy.com/</Text>
            <TextInput
              style={[s.slugInput, { color: colors.text, borderColor: colors.inputBorder }]}
              value={slugInput}
              onChangeText={(text) => { setSlugInput(text.toLowerCase().replace(/[^a-z0-9]/g, '')); setSlugAvailable(null); }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={s.checkSlugBtn}
            onPress={async () => {
              setIsCheckingSlug(true);
              const available = await checkSlugAvailability(slugInput);
              setSlugAvailable(available);
              setIsCheckingSlug(false);
            }}
          >
            {isCheckingSlug ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.checkSlugBtnText}>Check Availability</Text>}
          </TouchableOpacity>
          {slugAvailable !== null && (
            <Text style={{ color: slugAvailable ? ACCENT_GREEN : '#EF4444', marginTop: 8 }}>
              {slugAvailable ? 'Available!' : 'Already taken'}
            </Text>
          )}
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowPublishSlugModal(false)}>
              <Text style={[s.modalCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalSaveBtn, !slugAvailable && { opacity: 0.5 }]}
              disabled={!slugAvailable || isPublishing}
              onPress={handleConfirmPublish}
            >
              {isPublishing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.modalSaveBtnText}>Publish</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderColorPickerModal = () => (
    <Modal visible={showColorPicker} transparent animationType="fade" onRequestClose={() => setShowColorPicker(false)}>
      <View style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: colors.modalBg }]}>
          <Text style={[s.modalTitle, { color: colors.text }]}>Custom Color</Text>
          <View style={s.colorPickerGrid}>
            {PRESET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[s.colorPickerSwatch, tempColor === color && s.colorPickerSwatchSelected]}
                onPress={() => setTempColor(color)}
              >
                <View style={[s.colorPickerSwatchInner, { backgroundColor: color }]} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.hexInputRow}>
            <Text style={[s.hexLabel, { color: colors.textSecondary }]}>Hex:</Text>
            <TextInput
              style={[s.hexInput, { color: colors.text, borderColor: colors.inputBorder }]}
              value={tempColor}
              onChangeText={setTempColor}
              autoCapitalize="none"
            />
            <View style={[s.hexPreview, { backgroundColor: tempColor }]} />
          </View>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowColorPicker(false)}>
              <Text style={[s.modalCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalSaveBtn} onPress={applyCustomColor}>
              <Text style={s.modalSaveBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderVideoModal = () => (
    <Modal visible={showVideoModal} transparent animationType="fade" onRequestClose={() => setShowVideoModal(false)}>
      <View style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: colors.modalBg }]}>
          <Text style={[s.modalTitle, { color: colors.text }]}>Add Video</Text>
          <View style={s.videoTypeRow}>
            {(['youtube', 'tavvy_short', 'url'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[s.videoTypeBtn, videoType === type && s.videoTypeBtnSelected, { borderColor: colors.inputBorder }]}
                onPress={() => setVideoType(type)}
              >
                <Text style={[s.videoTypeText, { color: videoType === type ? ACCENT_GREEN : colors.text }]}>
                  {type === 'youtube' ? 'YouTube' : type === 'tavvy_short' ? 'Tavvy Short' : 'URL'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {videoType === 'tavvy_short' ? (
            isUploadingVideo ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <ActivityIndicator size="large" color={ACCENT_GREEN} />
                <Text style={[s.addBtnText, { color: colors.textSecondary, marginTop: 8 }]}>Uploading video...</Text>
              </View>
            ) : (
            <TouchableOpacity
              style={[s.addBtn, { borderColor: colors.inputBorder, marginTop: 12 }]}
              onPress={() => {
                // Helper: check video duration and upload
                const processAndUploadVideo = async (videoUri: string) => {
                  if (!user?.id) { Alert.alert('Error', 'Please log in to upload videos.'); return; }
                  setIsUploadingVideo(true);
                  try {
                    // Check video duration using expo-av
                    const { sound } = await Audio.Sound.createAsync({ uri: videoUri });
                    const status = await sound.getStatusAsync();
                    await sound.unloadAsync();
                    if (status.isLoaded && status.durationMillis && status.durationMillis > 16000) {
                      Alert.alert('Video Too Long', `Your video is ${Math.round(status.durationMillis / 1000)} seconds. Tavvy Short videos must be 15 seconds or less. Please trim your video and try again.`);
                      setIsUploadingVideo(false);
                      return;
                    }
                    // Upload to Supabase Storage
                    const ext = videoUri.split('.').pop()?.toLowerCase() || 'mp4';
                    const uploadedUrl = await uploadImage(videoUri, `${user.id}/video_${Date.now()}.${ext}`);
                    if (uploadedUrl) {
                      setVideos(prev => [...prev, { type: 'tavvy_short', url: uploadedUrl }]);
                      setShowVideoModal(false);
                    } else {
                      Alert.alert('Upload Failed', 'Could not upload the video. Please try again.');
                    }
                  } catch (err) {
                    console.warn('Video processing error:', err);
                    Alert.alert('Error', 'Something went wrong processing the video.');
                  } finally {
                    setIsUploadingVideo(false);
                  }
                };

                const pickFromLibrary = async () => {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                    allowsEditing: true,
                    quality: 0.8,
                    videoMaxDuration: 15,
                  });
                  if (!result.canceled && result.assets[0]) {
                    await processAndUploadVideo(result.assets[0].uri);
                  }
                };
                const recordVideo = async () => {
                  const { status } = await ImagePicker.requestCameraPermissionsAsync();
                  if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access is required to record video.'); return; }
                  const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                    allowsEditing: true,
                    quality: 0.8,
                    videoMaxDuration: 15,
                  });
                  if (!result.canceled && result.assets[0]) {
                    await processAndUploadVideo(result.assets[0].uri);
                  }
                };
                const pickFromFiles = async () => {
                  try {
                    const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
                    if (!result.canceled && result.assets?.[0]) {
                      await processAndUploadVideo(result.assets[0].uri);
                    }
                  } catch (e) { console.warn('File picker error:', e); }
                };

                if (Platform.OS === 'ios') {
                  ActionSheetIOS.showActionSheetWithOptions(
                    { options: ['Cancel', 'Record Video', 'Choose from Library', 'Choose from Files'], cancelButtonIndex: 0 },
                    (buttonIndex) => {
                      if (buttonIndex === 1) recordVideo();
                      else if (buttonIndex === 2) pickFromLibrary();
                      else if (buttonIndex === 3) pickFromFiles();
                    }
                  );
                } else {
                  Alert.alert('Select Video', 'Choose a source', [
                    { text: 'Record Video', onPress: recordVideo },
                    { text: 'Choose from Library', onPress: pickFromLibrary },
                    { text: 'Choose from Files', onPress: pickFromFiles },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }
              }}
            >
              <Ionicons name="videocam" size={20} color={ACCENT_GREEN} />
              <Text style={[s.addBtnText, { color: colors.text }]}>Select Video (15s max)</Text>
            </TouchableOpacity>
            )
          ) : (
            <>
              <TextInput
                style={[s.fieldInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder, marginTop: 12 }]}
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder={videoType === 'youtube' ? 'YouTube URL' : 'Video URL'}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
            </>
          )}
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => { setShowVideoModal(false); setVideoUrl(''); }}>
              <Text style={[s.modalCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            {videoType !== 'tavvy_short' && (
              <TouchableOpacity style={[s.modalSaveBtn, !videoUrl.trim() && { opacity: 0.5 }]} disabled={!videoUrl.trim()} onPress={addVideo}>
                <Text style={s.modalSaveBtnText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCredentialsModal = () => (
    <Modal visible={showCredentialsModal} transparent animationType="fade" onRequestClose={() => setShowCredentialsModal(false)}>
      <View style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: colors.modalBg }]}>
          <Text style={[s.modalTitle, { color: colors.text }]}>Pro Credentials</Text>
          <View style={s.credentialRow}>
            <Text style={[s.credentialLabel, { color: colors.text }]}>Licensed</Text>
            <Switch value={proCredentials.isLicensed} onValueChange={(v) => setProCredentials(prev => ({ ...prev, isLicensed: v }))} trackColor={{ true: ACCENT_GREEN }} />
          </View>
          {proCredentials.isLicensed && (
            <TextInput
              style={[s.fieldInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.inputBorder, marginBottom: 12 }]}
              value={proCredentials.licenseNumber || ''}
              onChangeText={(text) => setProCredentials(prev => ({ ...prev, licenseNumber: text }))}
              placeholder="License Number"
              placeholderTextColor={colors.textMuted}
            />
          )}
          <View style={s.credentialRow}>
            <Text style={[s.credentialLabel, { color: colors.text }]}>Insured</Text>
            <Switch value={proCredentials.isInsured} onValueChange={(v) => setProCredentials(prev => ({ ...prev, isInsured: v }))} trackColor={{ true: ACCENT_GREEN }} />
          </View>
          <View style={s.credentialRow}>
            <Text style={[s.credentialLabel, { color: colors.text }]}>Bonded</Text>
            <Switch value={proCredentials.isBonded} onValueChange={(v) => setProCredentials(prev => ({ ...prev, isBonded: v }))} trackColor={{ true: ACCENT_GREEN }} />
          </View>
          <View style={s.modalActions}>
            <TouchableOpacity style={s.modalCancelBtn} onPress={() => setShowCredentialsModal(false)}>
              <Text style={[s.modalCancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalSaveBtn} onPress={handleSaveCredentials}>
              <Text style={s.modalSaveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ── Category Picker Modal ──
  const renderCategoryPickerModal = () => (
    <Modal visible={showDashCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowDashCategoryPicker(false)}>
      <View style={s.modalOverlay}>
        <View style={[s.modalContent, { backgroundColor: colors.modalBg, maxHeight: '70%' }]}>
          <Text style={[s.modalTitle, { color: colors.text }]}>Professional Category</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12 }}>Choose the category that best describes your profession</Text>
          <ScrollView>
            {PROFESSIONAL_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[s.credentialRow, { paddingVertical: 14, borderRadius: 10, marginBottom: 2, backgroundColor: professionalCategory === cat.id ? 'rgba(0,200,83,0.1)' : 'transparent' }]}
                onPress={() => { setProfessionalCategory(cat.id); setShowDashCategoryPicker(false); }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Ionicons name={cat.icon as any} size={20} color={professionalCategory === cat.id ? ACCENT_GREEN : colors.textMuted} />
                  <Text style={{ fontSize: 15, color: professionalCategory === cat.id ? colors.text : colors.textSecondary, fontWeight: professionalCategory === cat.id ? '600' : '400' }}>{cat.label}</Text>
                </View>
                {professionalCategory === cat.id && <Ionicons name="checkmark-circle" size={22} color={ACCENT_GREEN} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ── Loading State ──
  if (isLoading) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={colors.statusBar} />
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT_GREEN} />
          <Text style={[s.loadingText, { color: colors.textSecondary }]}>Loading your card...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main Return ──
  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBar} />
      
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>My Card</Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={handleResetCard} style={s.headerActionBtn}>
            <Ionicons name="refresh-outline" size={22} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate('ECardPreview', { cardData, gradientColors, links, featuredSocials })}
            style={s.headerActionBtn}
          >
            <Ionicons name="eye-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Card Preview */}
      {renderLivePreview()}

      {/* Card URL & Actions - Only show for published cards */}
      {cardData?.is_published && (
        <View style={[s.cardUrlSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={[s.cardUrlBox, { backgroundColor: colors.inputBg }]}
            onPress={() => {
              setSlugInput(cardData?.slug || '');
              setSlugAvailable(null);
              setShowSlugModal(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="link" size={16} color={colors.textSecondary} />
            <Text style={[s.cardUrlText, { color: colors.text }]} numberOfLines={1}>{cardUrl}</Text>
            <Ionicons name="pencil" size={12} color={ACCENT_GREEN} />
          </TouchableOpacity>
          <View style={s.cardActions}>
            <TouchableOpacity style={s.actionButton} onPress={handleCopyLink}>
              <Ionicons name="copy-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.actionButton} onPress={generateQRCode}>
              <Ionicons name="qr-code-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={s.actionButton} 
              onPress={() => navigation.navigate('ECardNFCWrite', { cardSlug: cardData?.slug, cardName: cardData?.full_name })}
            >
              <Ionicons name="wifi" size={18} color={colors.textSecondary} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tabs - matching web: Content, Links, Style, Stats */}
      <View style={[s.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {([
          { id: 'content' as Tab, label: 'Content', icon: 'create-outline' },
          { id: 'links' as Tab, label: 'Links', icon: 'link' },
          { id: 'style' as Tab, label: 'Style', icon: 'color-palette' },
          { id: 'stats' as Tab, label: 'Stats', icon: 'bar-chart' },
        ]).map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[s.tab, activeTab === tab.id && s.activeTab]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.id ? ACCENT_GREEN : colors.textMuted} />
            <Text style={[s.tabText, activeTab === tab.id && s.activeTabText, { color: activeTab === tab.id ? ACCENT_GREEN : colors.textMuted }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={s.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'links' && renderLinksTab()}
        {activeTab === 'style' && renderStyleTab()}
        {activeTab === 'stats' && renderStatsTab()}
      </ScrollView>

      {/* Publish Button - Fixed at bottom */}
      <View style={[s.publishContainer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        <TouchableOpacity style={s.publishButton} onPress={handlePublishShare} activeOpacity={0.8}>
          <LinearGradient colors={[ACCENT_GREEN, '#00E676']} style={s.publishGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="rocket" size={20} color="#fff" />
            <Text style={s.publishText}>{cardData?.is_published ? 'Share Card' : 'Publish & Share'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderQRModal()}
      {renderSlugModal()}
      {renderPublishSlugModal()}
      {renderColorPickerModal()}
      {renderVideoModal()}
      {renderCredentialsModal()}
      {renderCategoryPickerModal()}
      
      {/* Saving Indicator */}
      {isSaving && (
        <View style={s.savingIndicator}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={s.savingText}>Saving...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── STYLES ──
const s = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },
  
  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  previewButton: { padding: 4 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActionBtn: { padding: 4 },
  
  // Live Preview
  previewContainer: { paddingHorizontal: 24, paddingVertical: 16, alignItems: 'center' },
  previewContainerCover: {},
  previewCard: { width: width - 80, height: PREVIEW_HEIGHT, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center' },
  previewCardBorder: { borderWidth: 1, borderColor: '#E0E0E0' },
  previewPhotoContainer: { backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  previewPhotoBorderDark: { borderColor: '#E0E0E0', backgroundColor: '#F5F5F5' },
  coverBannerContainer: { width, height: height * 0.25, position: 'relative' },
  coverBannerPhoto: { width: '100%', height: '100%' },
  coverBannerPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  coverBannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  coverBannerTextContainer: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  coverBannerName: { fontSize: 22, fontWeight: '700', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  coverBannerTitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 2, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  coverLinksContainer: { paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  previewName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  previewTitle: { fontSize: 13, marginBottom: 12 },
  previewLinksRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewLinkIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  previewMoreLinks: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  previewMoreText: { fontSize: 11, fontWeight: '600' },
  crownBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, gap: 4 },
  crownBadgeLight: { backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  crownBadgeDark: { backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  crownIcon: { fontSize: 15 },
  crownText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  crownChevron: { fontSize: 10, marginLeft: 1 },
  premiumIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  premiumIndicatorText: { fontSize: 12, color: '#F59E0B', fontWeight: '500' },
  
  // Card URL Section
  cardUrlSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  cardUrlBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, gap: 6 },
  cardUrlText: { flex: 1, fontSize: 13 },
  cardActions: { flexDirection: 'row', gap: 4 },
  actionButton: { padding: 8 },
  
  // Tabs
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: ACCENT_GREEN },
  tabText: { fontSize: 13, fontWeight: '500' },
  activeTabText: { fontWeight: '600' },
  
  scrollView: { flex: 1 },
  
  // Sections
  section: { marginHorizontal: 16, marginTop: 16, borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  sectionHeaderToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontSize: 12, fontWeight: '500' },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#374151', justifyContent: 'center', paddingHorizontal: 2 },
  toggleTrackActive: { backgroundColor: '#22C55E' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbActive: { alignSelf: 'flex-end' },
  
  // Photo editing
  photoEditRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  editPhoto: { width: 80, height: 80, borderRadius: 40 },
  editPhotoPlaceholder: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  photoActions: { flex: 1, gap: 8 },
  photoActionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  photoActionBtnText: { fontSize: 14, fontWeight: '500' },
  
  // Form fields
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  fieldTextarea: { minHeight: 80, textAlignVertical: 'top' },
  
  // Featured icons
  featuredIconItem: { borderRadius: 10, padding: 12, marginBottom: 8 },
  fiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  fiLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fiDot: { width: 12, height: 12, borderRadius: 6 },
  fiName: { fontSize: 14, fontWeight: '600' },
  fiUrlInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  
  // Add button
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12, gap: 8, marginTop: 8 },
  addBtnText: { fontSize: 14, fontWeight: '500' },
  
  // Platform picker
  platformPicker: { borderRadius: 10, padding: 12, marginTop: 8 },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pickerTitle: { fontSize: 15, fontWeight: '600' },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  platformOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  platformOptionText: { fontSize: 13, fontWeight: '500' },
  
  // Gallery
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryThumb: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  galleryThumbImage: { width: '100%', height: '100%' },
  galleryRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  galleryAddBtn: { width: 80, height: 80, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  
  // Videos
  videoItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, marginBottom: 8 },
  videoInfo: { flex: 1 },
  videoType: { fontSize: 14, fontWeight: '600' },
  videoUrl: { fontSize: 12, marginTop: 2 },
  
  // Save content button
  saveContentBtn: { marginHorizontal: 16, marginTop: 20, borderRadius: 12, overflow: 'hidden' },
  saveContentGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  saveContentText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  
  // Links tab
  linkItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 12 },
  linkDrag: { marginRight: 8 },
  linkIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  linkContent: { flex: 1 },
  linkPlatform: { fontSize: 14, fontWeight: '600' },
  linkValue: { fontSize: 12, marginTop: 2 },
  linkStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkClicks: { fontSize: 12 },
  linkLimit: { textAlign: 'center', fontSize: 12, marginTop: 12 },
  
  // Style tab
  gradientPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gradientBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  gradientBtnSelected: { borderColor: ACCENT_GREEN },
  gradientBtnInner: { flex: 1, borderRadius: 20 },
  customColorRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  customColorBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 8, gap: 8 },
  customColorSwatch: { width: 24, height: 24, borderRadius: 12 },
  customColorLabel: { fontSize: 13 },
  sizeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  sizeOptionSelected: { borderColor: ACCENT_GREEN, backgroundColor: 'rgba(0,200,83,0.1)' },
  sizeOptionText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
  buttonStyles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  buttonStyleOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  buttonStyleSelected: { borderColor: ACCENT_GREEN, backgroundColor: 'rgba(0,200,83,0.1)' },
  buttonStyleText: { fontSize: 13, fontWeight: '500' },
  fontScroll: { marginBottom: 4 },
  fontOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  fontOptionSelected: { borderColor: ACCENT_GREEN, backgroundColor: 'rgba(0,200,83,0.1)' },
  fontColorBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(128,128,128,0.3)', flexDirection: 'row', alignItems: 'center' },
  fontColorBtnSelected: { borderColor: ACCENT_GREEN, backgroundColor: ACCENT_GREEN },
  fontOptionText: { fontSize: 13, fontWeight: '500' },
  bgTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bgTypeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  bgTypeBtnSelected: { borderColor: ACCENT_GREEN, backgroundColor: 'rgba(0,200,83,0.1)' },
  bgTypeText: { fontSize: 13, fontWeight: '500' },
  solidColorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  solidColorBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  solidColorBtnSelected: { borderColor: ACCENT_GREEN },
  solidColorSwatch: { flex: 1, borderRadius: 16 },
  deleteCardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 24, paddingVertical: 14, gap: 8 },
  deleteCardText: { fontSize: 15, fontWeight: '500', color: '#EF4444' },
  
  // Stats tab
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 13, marginTop: 4 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  linkPerformanceItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  linkPerformanceName: { flex: 1, fontSize: 14, fontWeight: '500' },
  linkPerformanceClicks: { fontSize: 13 },
  
  // Publish
  publishContainer: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  publishButton: { borderRadius: 12, overflow: 'hidden' },
  publishGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  publishText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, marginBottom: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  modalCancelBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  modalCancelBtnText: { fontSize: 15, fontWeight: '500' },
  modalSaveBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: ACCENT_GREEN, borderRadius: 8 },
  modalSaveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalCloseBtn: { alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10, backgroundColor: ACCENT_GREEN, borderRadius: 8, marginTop: 16 },
  modalCloseBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  qrImage: { width: 200, height: 200, alignSelf: 'center', marginVertical: 16 },
  slugInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  slugPrefix: { fontSize: 15, fontWeight: '500' },
  slugInput: { flex: 1, borderBottomWidth: 1, fontSize: 15, paddingVertical: 6, marginLeft: 4 },
  checkSlugBtn: { alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 8, backgroundColor: ACCENT_GREEN, borderRadius: 8, marginTop: 12 },
  checkSlugBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  colorPickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  colorPickerSwatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  colorPickerSwatchSelected: { borderColor: ACCENT_GREEN },
  colorPickerSwatchInner: { flex: 1, borderRadius: 16 },
  hexInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  hexLabel: { fontSize: 14 },
  hexInput: { flex: 1, borderBottomWidth: 1, fontSize: 14, paddingVertical: 4 },
  hexPreview: { width: 28, height: 28, borderRadius: 14 },
  videoTypeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  videoTypeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  videoTypeBtnSelected: { borderColor: ACCENT_GREEN, backgroundColor: 'rgba(0,200,83,0.1)' },
  videoTypeText: { fontSize: 13, fontWeight: '500' },
  credentialRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  credentialLabel: { fontSize: 15, fontWeight: '500' },
  
  // Saving indicator
  savingIndicator: { position: 'absolute', bottom: 80, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
  savingText: { color: '#fff', fontSize: 13, fontWeight: '500' },
});
