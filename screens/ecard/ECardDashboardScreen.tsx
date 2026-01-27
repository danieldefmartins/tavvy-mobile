import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabaseClient';
import { FONTS, PREMIUM_FONT_COUNT } from '../../config/eCardFonts';
import { useAuth } from '../../contexts/AuthContext';
import FeaturedSocialsSelector from '../../components/ecard/FeaturedSocialsSelector';
import { getTemplateById, getColorSchemeById } from '../../config/eCardTemplates';

const { width, height } = Dimensions.get('window');
const PREVIEW_HEIGHT = height * 0.32;

// Profile photo size options
const PHOTO_SIZES = [
  { id: 'small', name: 'Small', size: 80 },
  { id: 'medium', name: 'Medium', size: 110 },
  { id: 'large', name: 'Large', size: 150 },
  { id: 'xl', name: 'Extra\nLarge', size: 200 },
  { id: 'cover', name: 'Cover', size: -1 }, // Full width banner photo
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
  // User toggle states (what user wants to show)
  isLicensed: boolean;
  licenseNumber?: string;
  isInsured: boolean;
  isBonded: boolean;
  isTavvyVerified: boolean;
  yearsInBusiness?: number;
  serviceArea?: string;
}

interface VerificationStatus {
  // Admin verification states (what admin has verified)
  is_licensed_verified: boolean;
  is_insured_verified: boolean;
  is_bonded_verified: boolean;
  is_tavvy_verified: boolean;
  verification_status: 'pending' | 'approved' | 'rejected' | 'needs_more_info' | null;
  // Document URLs
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
  profile_photo_url?: string;
  profile_photo_size?: string;
  bio?: string;
  view_count?: number;
  tap_count?: number;
  form_block?: any;
  gallery_images?: GalleryImage[];
  pro_credentials?: ProCredentials;
  review_count?: number;
  review_rating?: number;
  is_published?: boolean;
  industry_icons?: IndustryIcon[];
}

// Industry icons for Pro templates
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

export default function ECardDashboardScreen({ navigation, route }: Props) {
  const { user, isPro } = useAuth();
  const { templateId, colorSchemeId, profile, links: initialLinks, isNewCard, openAppearance, cardId } = route.params || {};
  
  const [links, setLinks] = useState<LinkItem[]>(initialLinks || []);
  const [featuredSocials, setFeaturedSocials] = useState<{platformId: string; url: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'analytics'>(openAppearance ? 'appearance' : 'links');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  
  // Appearance state
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [selectedBackground, setSelectedBackground] = useState('gradient');
  const [selectedButtonStyle, setSelectedButtonStyle] = useState('fill');
  const [selectedFont, setSelectedFont] = useState('default');
  const [gradientColors, setGradientColors] = useState<[string, string]>(['#667eea', '#764ba2']);
  const [profilePhotoSize, setProfilePhotoSize] = useState('medium');
  
  // Background image/video state
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [backgroundVideoUrl, setBackgroundVideoUrl] = useState<string | null>(null);
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  
  // Industry Icons state (Pro feature)
  const [industryIcons, setIndustryIcons] = useState<IndustryIcon[]>([]);
  const [showIconsModal, setShowIconsModal] = useState(false);
  
  // Gallery state
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  
  // YouTube Video state
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState<string>('');
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [tempYoutubeUrl, setTempYoutubeUrl] = useState<string>('');
  
  // Pro Credentials state
  const [proCredentials, setProCredentials] = useState<ProCredentials>({
    isLicensed: false,
    isInsured: false,
    isBonded: false,
    isTavvyVerified: false,
  });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  
  // Verification status (from admin approval)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    is_licensed_verified: false,
    is_insured_verified: false,
    is_bonded_verified: false,
    is_tavvy_verified: false,
    verification_status: null,
  });
  
  // Premium features tracking - allow selection, prompt on publish
  const [selectedPremiumFeatures, setSelectedPremiumFeatures] = useState<string[]>([]);
  
  // QR Code state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Card URL
  const [cardUrl, setCardUrl] = useState('tavvy.com/yourname');
  
  // Slug editing modal state
  const [showSlugModal, setShowSlugModal] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  
  // Publish slug modal state - shown before publishing
  const [showPublishSlugModal, setShowPublishSlugModal] = useState(false);
  const [pendingSlug, setPendingSlug] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Color picker modal state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState<0 | 1>(0);
  const [tempColor, setTempColor] = useState('#667eea');
  
  // Industry icons modal state
  const [iconSelectedCategory, setIconSelectedCategory] = useState('Real Estate');
  const [iconSelectedIcon, setIconSelectedIcon] = useState<string | null>(null);
  const [iconSelectedPosition, setIconSelectedPosition] = useState<IndustryIcon['position']>('top-right');

  // Link limit for free users
  const FREE_LINK_LIMIT = 5;
  const canAddMoreLinks = isPro || links.length < FREE_LINK_LIMIT;

  // Check if user has selected premium features
  const hasPremiumFeatures = () => {
    if (selectedPremiumFeatures.length > 0) return true;
    
    // Check theme
    const theme = THEMES.find(t => t.id === selectedTheme);
    if (theme?.isPremium) return true;
    
    // Check font
    const font = FONTS.find(f => f.id === selectedFont);
    if (font?.isPremium) return true;
    
    // Check video background
    if (selectedBackground === 'video') return true;
    
    // Check link limit exceeded
    if (links.length > FREE_LINK_LIMIT) return true;
    
    // Check gallery (premium feature)
    if (galleryImages.length > 0) return true;
    
    return false;
  };

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 30);
  };

  // Check if slug is available (only checks against PUBLISHED cards)
  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    console.log('Checking slug availability:', slug);
    
    if (!slug || slug.length < 3) {
      console.log('Slug too short');
      return false;
    }
    
    // If the slug is the same as current card's slug and it's published, it's available (user owns it)
    if (cardData?.slug === slug && cardData?.is_published) {
      console.log('User owns this slug');
      return true;
    }
    
    try {
      // Only check against published cards to avoid blocking slugs from abandoned drafts
      const { data, error } = await supabase
        .from('digital_cards')
        .select('id, is_published')
        .eq('slug', slug)
        .eq('is_published', true)
        .limit(1);
      
      console.log('Slug check result:', { data, error });
      
      if (error) {
        console.error('Slug check error:', error);
        // On error, assume available to not block the user
        Alert.alert('Connection Issue', 'Could not verify URL availability. Please try again.');
        return false;
      }
      
      // If no published card found with this slug, it's available
      if (!data || data.length === 0) {
        console.log('Slug is available!');
        return true;
      }
      
      // If the found card is the current user's card, it's available
      if (cardData?.id && data[0]?.id === cardData.id) {
        console.log('Found card is current user card');
        return true;
      }
      
      console.log('Slug is taken');
      return false;
    } catch (error) {
      console.error('Error checking slug:', error);
      Alert.alert('Error', 'Failed to check URL availability. Please try again.');
      return false;
    }
  };

  // Create a new card from onboarding data
  const createNewCard = async () => {
    if (!user || !profile) return;
    
    // Generate a temporary unique slug for draft cards
    // The real slug will be chosen when publishing
    const tempSlug = `draft_${user.id.substring(0, 8)}_${Date.now().toString(36)}`;
    const suggestedSlug = generateSlug(profile.name || 'user');
    
    // Get the selected template and color scheme from route params
    const selectedTemplate = templateId ? getTemplateById(templateId) : null;
    const selectedColorScheme = templateId && colorSchemeId 
      ? getColorSchemeById(templateId, colorSchemeId) 
      : null;
    
    // Use template colors if available, otherwise fall back to defaults
    const gradientColor1 = selectedColorScheme?.primary || '#667eea';
    const gradientColor2 = selectedColorScheme?.secondary || '#764ba2';
    const buttonStyle = selectedTemplate?.layout?.buttonStyle || 'fill';
    
    let insertedCard = null;
    let lastError = null;
    
    try {
      const newCardData = {
        user_id: user.id,
        slug: tempSlug, // Temporary slug for draft
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
        is_published: false, // Draft until published
      };
      
      const { data, error: insertError } = await supabase
        .from('digital_cards')
        .insert(newCardData)
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      insertedCard = data;
      
      // Set the suggested slug as pending (user will confirm when publishing)
      setPendingSlug(suggestedSlug);
      
    } catch (error: any) {
      lastError = error;
      console.error('Failed to create card:', lastError);
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
              platform: platform,
              url: url,
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
      // For draft cards, show the suggested slug (not the temp slug)
      setCardUrl(`tavvy.com/${suggestedSlug}`);
      setGradientColors([insertedCard.gradient_color_1, insertedCard.gradient_color_2]);
      setSelectedTheme(insertedCard.theme || 'classic');
      setSelectedBackground(insertedCard.background_type || 'gradient');
      setSelectedButtonStyle(insertedCard.button_style || 'fill');
      setSelectedFont(insertedCard.font_style || 'default');
      setProfilePhotoSize(insertedCard.profile_photo_size || 'medium');
      
    } catch (error: any) {
      console.error('Error inserting links:', error);
    }
  };

  // Load existing card data
  useEffect(() => {
    const loadCardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        if (isNewCard && profile) {
          await createNewCard();
        } else {
          let query = supabase
            .from('digital_cards')
            .select('*')
            .eq('user_id', user.id);
          
          if (cardId) {
            query = query.eq('id', cardId);
          }
          
          const { data: cards, error } = await query.order('created_at', { ascending: false }).limit(1);

          if (error) throw error;

          if (cards && cards.length > 0) {
            const card = cards[0];
            setCardData(card);
            setCardUrl(`tavvy.com/${card.slug}`);
            setGradientColors([card.gradient_color_1 || '#667eea', card.gradient_color_2 || '#764ba2']);
            setSelectedTheme(card.theme || 'classic');
            setSelectedBackground(card.background_type || 'gradient');
            setSelectedButtonStyle(card.button_style || 'fill');
            setSelectedFont(card.font_style || 'default');
            setProfilePhotoSize(card.profile_photo_size || 'medium');
            setGalleryImages(card.gallery_images || []);
            setProCredentials(card.pro_credentials || {
              isLicensed: false,
              isInsured: false,
              isBonded: false,
              isTavvyVerified: false,
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
            
            // Load badge display settings from card
            setProCredentials({
              isLicensed: card.show_licensed_badge || false,
              isInsured: card.show_insured_badge || false,
              isBonded: card.show_bonded_badge || false,
              isTavvyVerified: card.show_tavvy_verified_badge || false,
              yearsInBusiness: card.pro_credentials?.yearsInBusiness,
              serviceArea: card.pro_credentials?.serviceArea,
              licenseNumber: card.pro_credentials?.licenseNumber,
            });
          }
        }
        
        // Load verification status from user_verifications table
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

  // Columns that may not exist in database yet - save locally but don't send to DB
  // These will be added via SQL migration: industry_icons, background_video_url, gallery_images, pro_credentials
  const PENDING_COLUMNS = ['industry_icons', 'background_video_url', 'gallery_images', 'pro_credentials'];

  // Save appearance settings
  const saveAppearanceSettings = async (settings: Partial<CardData>) => {
    if (!cardData?.id) return;
    
    setIsSaving(true);
    try {
      // Filter out columns that may not exist in the database yet
      const dbSettings: Record<string, any> = {};
      const localSettings: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(settings)) {
        if (PENDING_COLUMNS.includes(key)) {
          localSettings[key] = value;
        } else {
          dbSettings[key] = value;
        }
      }
      
      // Only update DB if there are valid columns
      if (Object.keys(dbSettings).length > 0) {
        const { error } = await supabase
          .from('digital_cards')
          .update(dbSettings)
          .eq('id', cardData.id);
        
        if (error) throw error;
      }
      
      // Update local state with all settings (including pending columns)
      setCardData(prev => prev ? { ...prev, ...settings } : null);
      
      // Log pending columns for debugging
      if (Object.keys(localSettings).length > 0) {
        console.log('Saved locally (pending DB migration):', Object.keys(localSettings));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Theme selection handler - allow premium selection, track it
  const handleThemeSelect = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      // Allow selection even for premium themes
      setSelectedTheme(themeId);
      setGradientColors(theme.colors as [string, string]);
      
      // Track if premium feature selected
      if (theme.isPremium && !isPro) {
        if (!selectedPremiumFeatures.includes('premium_theme')) {
          setSelectedPremiumFeatures(prev => [...prev, 'premium_theme']);
        }
      } else {
        setSelectedPremiumFeatures(prev => prev.filter(f => f !== 'premium_theme'));
      }
      
      saveAppearanceSettings({
        theme: themeId,
        gradient_color_1: theme.colors[0],
        gradient_color_2: theme.colors[1],
      });
    }
  };

  // Background selection handler - allow premium selection
  const handleBackgroundSelect = async (bgType: string) => {
    // For image/video, open picker first
    if (bgType === 'image') {
      await pickBackgroundImage();
      return;
    }
    
    if (bgType === 'video') {
      await pickBackgroundVideo();
      return;
    }
    
    setSelectedBackground(bgType);
    saveAppearanceSettings({ background_type: bgType });
  };
  
  // Pick background image
  const pickBackgroundImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [9, 16], // Vertical card aspect ratio
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        setIsUploadingBackground(true);
        
        // For now, store the local URI - in production, upload to Supabase Storage
        const imageUri = result.assets[0].uri;
        setBackgroundImageUrl(imageUri);
        setSelectedBackground('image');
        
        // Track as premium feature if not Pro
        if (!isPro && !selectedPremiumFeatures.includes('image_background')) {
          setSelectedPremiumFeatures(prev => [...prev, 'image_background']);
        }
        
        saveAppearanceSettings({ 
          background_type: 'image',
          background_image_url: imageUri,
        });
        
        setIsUploadingBackground(false);
      }
    } catch (error) {
      console.error('Error picking background image:', error);
      Alert.alert('Error', 'Failed to select background image. Please try again.');
      setIsUploadingBackground(false);
    }
  };
  
  // Pick background video
  const pickBackgroundVideo = async () => {
    // Track video as premium
    if (!isPro) {
      if (!selectedPremiumFeatures.includes('video_background')) {
        setSelectedPremiumFeatures(prev => [...prev, 'video_background']);
      }
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 15, // 15 second max for background videos
      });
      
      if (!result.canceled && result.assets[0]) {
        setIsUploadingBackground(true);
        
        // For now, store the local URI - in production, upload to Supabase Storage
        const videoUri = result.assets[0].uri;
        setBackgroundVideoUrl(videoUri);
        setSelectedBackground('video');
        
        saveAppearanceSettings({ 
          background_type: 'video',
          background_video_url: videoUri,
        });
        
        setIsUploadingBackground(false);
      }
    } catch (error) {
      console.error('Error picking background video:', error);
      Alert.alert('Error', 'Failed to select background video. Please try again.');
      setIsUploadingBackground(false);
    }
  };

  // Preset gradient selection
  const handlePresetGradientSelect = (gradient: { id: string; name: string; colors: string[] }) => {
    setGradientColors(gradient.colors as [string, string]);
    saveAppearanceSettings({
      gradient_color_1: gradient.colors[0],
      gradient_color_2: gradient.colors[1],
    });
  };

  // Solid color selection
  const handleSolidColorSelect = (color: string) => {
    setGradientColors([color, color]);
    saveAppearanceSettings({
      gradient_color_1: color,
      gradient_color_2: color,
    });
  };

  // Open color picker
  const openColorPicker = (index: 0 | 1) => {
    setEditingColorIndex(index);
    setTempColor(gradientColors[index]);
    setShowColorPicker(true);
  };

  // Apply custom color
  const applyCustomColor = () => {
    const newColors: [string, string] = [...gradientColors];
    newColors[editingColorIndex] = tempColor;
    setGradientColors(newColors);
    saveAppearanceSettings({
      gradient_color_1: newColors[0],
      gradient_color_2: newColors[1],
    });
    setShowColorPicker(false);
  };

  // Button style selection
  const handleButtonStyleSelect = (styleId: string) => {
    setSelectedButtonStyle(styleId);
    saveAppearanceSettings({ button_style: styleId });
  };

  // Font selection - allow premium selection
  const handleFontSelect = (fontId: string) => {
    const font = FONTS.find(f => f.id === fontId);
    setSelectedFont(fontId);
    
    // Track premium font
    if (font?.isPremium && !isPro) {
      if (!selectedPremiumFeatures.includes('premium_font')) {
        setSelectedPremiumFeatures(prev => [...prev, 'premium_font']);
      }
    } else {
      setSelectedPremiumFeatures(prev => prev.filter(f => f !== 'premium_font'));
    }
    
    saveAppearanceSettings({ font_style: fontId });
  };

  // Profile photo size selection
  const handlePhotoSizeSelect = (sizeId: string) => {
    setProfilePhotoSize(sizeId);
    saveAppearanceSettings({ profile_photo_size: sizeId });
  };

  // Gallery image picker
  const handleAddGalleryImage = async () => {
    if (galleryImages.length >= 10) {
      Alert.alert('Limit Reached', 'You can add up to 10 images to your gallery.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      const newImage: GalleryImage = {
        id: Date.now().toString(),
        url: result.assets[0].uri,
      };
      
      const updatedGallery = [...galleryImages, newImage];
      setGalleryImages(updatedGallery);
      
      // Track as premium feature
      if (!isPro && !selectedPremiumFeatures.includes('gallery')) {
        setSelectedPremiumFeatures(prev => [...prev, 'gallery']);
      }
      
      saveAppearanceSettings({ gallery_images: updatedGallery });
    }
  };

  // Remove gallery image
  const handleRemoveGalleryImage = (imageId: string) => {
    const updatedGallery = galleryImages.filter(img => img.id !== imageId);
    setGalleryImages(updatedGallery);
    
    if (updatedGallery.length === 0) {
      setSelectedPremiumFeatures(prev => prev.filter(f => f !== 'gallery'));
    }
    
    saveAppearanceSettings({ gallery_images: updatedGallery });
  };

  // Add industry icon
  const handleAddIndustryIcon = (iconName: string, position: IndustryIcon['position']) => {
    const newIcon: IndustryIcon = {
      id: Date.now().toString(),
      icon: iconName,
      position,
      size: 'medium',
      opacity: 0.15,
    };
    
    const updatedIcons = [...industryIcons, newIcon];
    setIndustryIcons(updatedIcons);
    
    // Track as premium feature
    if (!isPro && !selectedPremiumFeatures.includes('industry_icons')) {
      setSelectedPremiumFeatures(prev => [...prev, 'industry_icons']);
    }
    
    saveAppearanceSettings({ industry_icons: updatedIcons });
  };
  
  // Remove industry icon
  const handleRemoveIndustryIcon = (iconId: string) => {
    const updatedIcons = industryIcons.filter(icon => icon.id !== iconId);
    setIndustryIcons(updatedIcons);
    
    if (updatedIcons.length === 0) {
      setSelectedPremiumFeatures(prev => prev.filter(f => f !== 'industry_icons'));
    }
    
    saveAppearanceSettings({ industry_icons: updatedIcons });
  };

  // Save Pro Credentials
  const handleSaveCredentials = async () => {
    if (!cardData?.id) return;
    
    setIsSaving(true);
    try {
      // Save badge display toggles to digital_cards table
      // Note: pro_credentials column may not exist yet - only save badge toggles for now
      const { error } = await supabase
        .from('digital_cards')
        .update({
          show_licensed_badge: proCredentials.isLicensed,
          show_insured_badge: proCredentials.isInsured,
          show_bonded_badge: proCredentials.isBonded,
          show_tavvy_verified_badge: proCredentials.isTavvyVerified,
          // pro_credentials column pending DB migration - save locally only
        })
        .eq('id', cardData.id);
      
      // Store pro_credentials locally for now
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
      
      // Show appropriate message based on verification status
      const unverifiedBadges = [];
      if (proCredentials.isLicensed && !verificationStatus.is_licensed_verified) unverifiedBadges.push('Licensed');
      if (proCredentials.isInsured && !verificationStatus.is_insured_verified) unverifiedBadges.push('Insured');
      if (proCredentials.isBonded && !verificationStatus.is_bonded_verified) unverifiedBadges.push('Bonded');
      if (proCredentials.isTavvyVerified && !verificationStatus.is_tavvy_verified) unverifiedBadges.push('Tavvy Verified');
      
      if (unverifiedBadges.length > 0) {
        Alert.alert(
          'Settings Saved',
          `Your preferences have been saved. Note: ${unverifiedBadges.join(', ')} badge(s) will only appear on your public card after verification. Go to Profile > Get Verified to submit your documents.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Saved', 'Your credentials have been updated.');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      Alert.alert('Error', 'Failed to save credentials. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish & Share handler - check for premium features and show slug selection
  const handlePublishShare = () => {
    // Check for premium features first
    if (!isPro && hasPremiumFeatures()) {
      Alert.alert(
        'Premium Features Detected',
        'Your card includes premium features. To share this card, you need to upgrade to Tavvy Pro.\n\nYou can also save your card and come back later.',
        [
          { 
            text: 'Save for Later', 
            style: 'cancel',
            onPress: () => {
              // Card is already saved as draft, just confirm
              Alert.alert(
                'Card Saved!',
                'Your card has been saved as a draft. You can access it anytime from the Apps tab.',
                [{ text: 'OK' }]
              );
            }
          },
          { text: 'Use Free Version', style: 'destructive', onPress: removePremiumFeatures },
          { text: 'Upgrade to Pro', onPress: () => navigation.navigate('ECardPremiumUpsell') },
        ]
      );
      return;
    }
    
    // If card is not published yet, show slug selection modal
    if (!cardData?.is_published) {
      // Initialize with pending slug or generate from name
      const suggestedSlug = pendingSlug || generateSlug(cardData?.full_name || 'user');
      setSlugInput(suggestedSlug);
      setSlugAvailable(null);
      setShowPublishSlugModal(true);
      return;
    }
    
    // Card is already published, just share
    handleShare();
  };
  
  // Actually publish the card with the chosen slug
  const handleConfirmPublish = async () => {
    if (!slugAvailable || !cardData?.id) {
      Alert.alert('Check Availability', 'Please check if your URL is available before publishing.');
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // Update the card with the final slug and mark as published
      const { error } = await supabase
        .from('digital_cards')
        .update({ 
          slug: slugInput,
          is_published: true 
        })
        .eq('id', cardData.id);
      
      if (error) {
        if (error.code === '23505') {
          Alert.alert('URL Taken', 'This URL was just taken by someone else. Please choose a different one.');
          setSlugAvailable(false);
          return;
        }
        throw error;
      }
      
      // Update local state
      setCardData(prev => prev ? { ...prev, slug: slugInput, is_published: true } : null);
      setCardUrl(`tavvy.com/${slugInput}`);
      setPendingSlug(slugInput);
      setShowPublishSlugModal(false);
      
      // Show success and share
      Alert.alert(
        '🎉 Card Published!',
        `Your card is now live at:\ntavvy.com/${slugInput}`,
        [
          { text: 'Share Now', onPress: handleShare },
          { text: 'Done', style: 'cancel' },
        ]
      );
      
    } catch (error) {
      console.error('Error publishing card:', error);
      Alert.alert('Error', 'Failed to publish your card. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Remove premium features
  const removePremiumFeatures = () => {
    // Reset to free theme
    const freeTheme = THEMES.find(t => !t.isPremium);
    if (freeTheme) {
      setSelectedTheme(freeTheme.id);
      setGradientColors(freeTheme.colors as [string, string]);
    }
    
    // Reset to free font
    const freeFont = FONTS.find(f => !f.isPremium);
    if (freeFont) {
      setSelectedFont(freeFont.id);
    }
    
    // Reset background
    if (selectedBackground === 'video') {
      setSelectedBackground('gradient');
    }
    
    // Clear gallery
    setGalleryImages([]);
    
    // Trim links
    if (links.length > FREE_LINK_LIMIT) {
      setLinks(links.slice(0, FREE_LINK_LIMIT));
    }
    
    setSelectedPremiumFeatures([]);
    
    Alert.alert('Done', 'Premium features have been removed. You can now publish your card.');
  };

  // Delete card function
  const handleDeleteCard = () => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card? This will permanently delete your card, all links, and free up your URL slug. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              
              if (cardData?.id) {
                await supabase
                  .from('card_links')
                  .delete()
                  .eq('card_id', cardData.id);
                
                const { error } = await supabase
                  .from('digital_cards')
                  .delete()
                  .eq('id', cardData.id);
                
                if (error) throw error;
                
                Alert.alert('Success', 'Your card has been deleted.', [
                  { text: 'OK', onPress: () => navigation.navigate('MyCards') }
                ]);
              }
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete card. Please try again.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  // Share functions
  const handleShare = async () => {
    try {
      await Share.share({ url: `https://${cardUrl}` });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(`https://${cardUrl}`);
    Alert.alert('Copied!', `https://${cardUrl}`);
  };

  // Save to Wallet deep link
  const handleSaveToWallet = () => {
    const walletUrl = `tavvy://wallet/save?card=${cardData?.slug}`;
    Alert.alert(
      'Save to Tavvy Wallet',
      'Share this link with others so they can save your card to their Tavvy Wallet:',
      [
        { text: 'Copy Link', onPress: () => Clipboard.setStringAsync(walletUrl) },
        { text: 'Share', onPress: () => Share.share({ url: walletUrl }) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // QR Code generation
  const generateQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://${cardUrl}`;
    setQrCodeUrl(qrUrl);
    setShowQRModal(true);
  };

  // Add link handler
  const handleAddLink = () => {
    if (!canAddMoreLinks) {
      // Allow adding but track as premium
      if (!selectedPremiumFeatures.includes('unlimited_links')) {
        setSelectedPremiumFeatures(prev => [...prev, 'unlimited_links']);
      }
    }
    
    navigation.navigate('ECardAddLink', {
      onAdd: (newLink: LinkItem) => {
        setLinks(prev => [...prev, newLink]);
      },
    });
  };

  // Edit link handler
  const handleEditLink = (link: LinkItem) => {
    navigation.navigate('ECardEditLink', {
      link,
      onSave: (updatedLink: LinkItem) => {
        setLinks(prev => prev.map(l => l.id === updatedLink.id ? updatedLink : l));
      },
      onDelete: () => {
        setLinks(prev => prev.filter(l => l.id !== link.id));
      },
    });
  };

  // Get current theme config
  const getCurrentTheme = () => {
    return THEMES.find(t => t.id === selectedTheme) || THEMES[0];
  };

  // Get text color based on background
  const getTextColor = () => {
    const theme = getCurrentTheme();
    return theme.textColor || '#fff';
  };

  // Get current photo size
  const getCurrentPhotoSize = () => {
    return PHOTO_SIZES.find(s => s.id === profilePhotoSize) || PHOTO_SIZES[1];
  };

  // Render Crown Badge for Tavvy Reviews
  const renderCrownBadge = () => {
    const reviewCount = cardData?.review_count || 0;
    if (reviewCount === 0) return null;
    
    return (
      <View style={styles.crownBadge}>
        <Text style={styles.crownIcon}>👑</Text>
        <Text style={styles.crownText}>x {reviewCount}</Text>
      </View>
    );
  };

  // Render Live Card Preview
  const renderLivePreview = () => {
    const theme = getCurrentTheme();
    const textColor = getTextColor();
    const hasLightBg = theme.id === 'minimal';
    const photoSize = getCurrentPhotoSize();
    const isCoverPhoto = photoSize.id === 'cover';
    const previewPhotoSize = isCoverPhoto ? width - 48 : Math.min(photoSize.size * 0.5, 70);
    
    // Cover photo mode - completely different layout
    if (isCoverPhoto) {
      return (
        <View style={styles.previewContainerCover}>
          {/* Full-bleed banner photo */}
          <View style={styles.coverBannerContainer}>
            {cardData?.profile_photo_url ? (
              <Image 
                source={{ uri: cardData.profile_photo_url }} 
                style={styles.coverBannerPhoto}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={gradientColors}
                style={styles.coverBannerPlaceholder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="image" size={40} color="rgba(255,255,255,0.5)" />
                <Text style={styles.coverBannerPlaceholderText}>Add Cover Photo</Text>
              </LinearGradient>
            )}
            {/* Gradient overlay for text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.coverBannerOverlay}
            />
            {/* Name & Title overlay on banner */}
            <View style={styles.coverBannerTextContainer}>
              <Text style={styles.coverBannerName} numberOfLines={1}>
                {cardData?.full_name || 'Your Name'}
              </Text>
              <Text style={styles.coverBannerTitle} numberOfLines={1}>
                {cardData?.title || 'Your Title'}
              </Text>
            </View>
          </View>
          
          {/* Links below banner */}
          <LinearGradient
            colors={gradientColors}
            style={styles.coverLinksContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.previewLinksRow}>
              {links.slice(0, 4).map((link, index) => {
                const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
                return (
                  <View 
                    key={link.id || index} 
                    style={[
                      styles.previewLinkIcon,
                      selectedButtonStyle === 'outline' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: textColor },
                      selectedButtonStyle === 'rounded' && { borderRadius: 8 },
                      selectedButtonStyle === 'pill' && { borderRadius: 20 },
                      selectedButtonStyle === 'minimal' && { backgroundColor: 'transparent' },
                    ]}
                  >
                    <Ionicons 
                      name={platformConfig.icon as any} 
                      size={16} 
                      color={selectedButtonStyle === 'outline' || selectedButtonStyle === 'minimal' ? textColor : platformConfig.color} 
                    />
                  </View>
                );
              })}
              {links.length > 4 && (
                <View style={styles.previewMoreLinks}>
                  <Text style={[styles.previewMoreText, { color: textColor }]}>+{links.length - 4}</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      );
    }
    
    // Regular layout (non-cover)
    return (
      <View style={styles.previewContainer}>
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.previewCard,
            hasLightBg && styles.previewCardBorder
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Crown Badge */}
          {renderCrownBadge()}
          
          {/* Pro Badges - Only show if BOTH user toggled ON AND admin verified */}
          {((proCredentials.isLicensed && verificationStatus.is_licensed_verified) || 
            (proCredentials.isInsured && verificationStatus.is_insured_verified) || 
            (proCredentials.isBonded && verificationStatus.is_bonded_verified) || 
            (proCredentials.isTavvyVerified && verificationStatus.is_tavvy_verified)) && (
            <View style={styles.proBadgesRow}>
              {proCredentials.isLicensed && verificationStatus.is_licensed_verified && <Text style={styles.proBadgeIcon}>✅</Text>}
              {proCredentials.isInsured && verificationStatus.is_insured_verified && <Text style={styles.proBadgeIcon}>✅</Text>}
              {proCredentials.isBonded && verificationStatus.is_bonded_verified && <Text style={styles.proBadgeIcon}>🛡️</Text>}
              {proCredentials.isTavvyVerified && verificationStatus.is_tavvy_verified && <Text style={styles.proBadgeIcon}>🟢</Text>}
            </View>
          )}
          
          {/* Regular circular photo */}
          <View style={[
            styles.previewPhotoContainer, 
            hasLightBg && styles.previewPhotoBorderDark,
            { width: previewPhotoSize, height: previewPhotoSize, borderRadius: previewPhotoSize / 2 }
          ]}>
            {cardData?.profile_photo_url ? (
              <Image 
                source={{ uri: cardData.profile_photo_url }} 
                style={[styles.previewPhoto, { width: previewPhotoSize - 4, height: previewPhotoSize - 4, borderRadius: (previewPhotoSize - 4) / 2 }]} 
              />
            ) : (
              <Ionicons name="person" size={previewPhotoSize * 0.5} color={hasLightBg ? '#666' : 'rgba(255,255,255,0.5)'} />
            )}
          </View>
          
          {/* Name & Title */}
          <Text style={[styles.previewName, { color: textColor }]} numberOfLines={1}>
            {cardData?.full_name || 'Your Name'}
          </Text>
          <Text style={[styles.previewTitle, { color: hasLightBg ? '#666' : 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>
            {cardData?.title || 'Your Title'}
          </Text>
          
          {/* Links Preview */}
          <View style={styles.previewLinksRow}>
            {links.slice(0, 4).map((link, index) => {
              const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
              return (
                <View 
                  key={link.id || index} 
                  style={[
                    styles.previewLinkIcon,
                    selectedButtonStyle === 'outline' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: textColor },
                    selectedButtonStyle === 'rounded' && { borderRadius: 8 },
                    selectedButtonStyle === 'pill' && { borderRadius: 20 },
                    selectedButtonStyle === 'minimal' && { backgroundColor: 'transparent' },
                  ]}
                >
                  <Ionicons 
                    name={platformConfig.icon as any} 
                    size={16} 
                    color={selectedButtonStyle === 'outline' || selectedButtonStyle === 'minimal' ? textColor : platformConfig.color} 
                  />
                </View>
              );
            })}
            {links.length > 4 && (
              <View style={styles.previewMoreLinks}>
                <Text style={[styles.previewMoreText, { color: textColor }]}>+{links.length - 4}</Text>
              </View>
            )}
          </View>
          
          {/* Gallery indicator */}
          {galleryImages.length > 0 && (
            <View style={styles.galleryIndicator}>
              <Ionicons name="images" size={12} color={textColor} />
              <Text style={[styles.galleryIndicatorText, { color: textColor }]}>{galleryImages.length}</Text>
            </View>
          )}
        </LinearGradient>
        
        {/* Premium Features Indicator */}
        {!isPro && hasPremiumFeatures() && (
          <View style={styles.premiumIndicator}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.premiumIndicatorText}>Premium features selected</Text>
          </View>
        )}
      </View>
    );
  };

  // Render Links Tab
  const renderLinksTab = () => (
    <View style={styles.tabContent}>
      {/* Link Limit Info for Free Users */}
      {!isPro && (
        <View style={styles.linkLimitBanner}>
          <Ionicons name="information-circle" size={18} color="#F97316" />
          <Text style={styles.linkLimitText}>
            {links.length}/{FREE_LINK_LIMIT} links used
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('ECardPremiumUpsell')}>
            <Text style={styles.upgradeText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Featured Socials Selector */}
      {links.length > 0 && (
        <View style={styles.featuredSocialsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Icons</Text>
            <Text style={styles.sectionSubtitle}>Choose up to 6 links to show as icons</Text>
          </View>
          <FeaturedSocialsSelector
            featuredSocials={featuredSocials}
            allLinks={links.filter(l => l.platform).map(l => ({ platformId: l.platform, url: l.value }))}
            onChange={setFeaturedSocials}
            maxFeatured={6}
          />
        </View>
      )}

      {/* Add New Link Button */}
      <TouchableOpacity 
        style={styles.addLinkButton}
        onPress={handleAddLink}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#00C853', '#00E676']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addLinkGradient}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addLinkText}>Add New Link</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Form Block Button */}
      <TouchableOpacity 
        style={styles.addFormButton}
        onPress={() => navigation.navigate('ECardFormBlock', { cardId: cardData?.id, existingConfig: cardData?.form_block })}
        activeOpacity={0.8}
      >
        <View style={styles.addFormContent}>
          <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
          <Text style={styles.addFormText}>
            {cardData?.form_block ? 'Edit Form Block' : 'Add Form Block'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#9E9E9E" />
        </View>
      </TouchableOpacity>

      {/* Add Gallery Block Button */}
      <TouchableOpacity 
        style={styles.addGalleryButton}
        onPress={() => setShowGalleryModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.addGalleryContent}>
          <Ionicons name="images-outline" size={20} color="#8B5CF6" />
          <Text style={styles.addGalleryText}>
            {galleryImages.length > 0 ? `Gallery (${galleryImages.length} images)` : 'Add Photo Gallery'}
          </Text>
          {!isPro && <View style={styles.proBadgeSmall}><Text style={styles.proBadgeSmallText}>PRO</Text></View>}
          <Ionicons name="chevron-forward" size={18} color="#9E9E9E" />
        </View>
      </TouchableOpacity>

      {/* Add YouTube Video Block Button */}
      <TouchableOpacity 
        style={styles.addYoutubeButton}
        onPress={() => {
          setTempYoutubeUrl(youtubeVideoUrl);
          setShowYoutubeModal(true);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.addYoutubeContent}>
          <Ionicons name="logo-youtube" size={20} color="#FF0000" />
          <Text style={styles.addYoutubeText}>
            {youtubeVideoUrl ? 'Edit YouTube Video' : 'Add YouTube Video'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color="#9E9E9E" />
        </View>
      </TouchableOpacity>

      {/* Pro Credentials Button */}
      <TouchableOpacity 
        style={styles.addCredentialsButton}
        onPress={() => setShowCredentialsModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.addCredentialsContent}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
          <Text style={styles.addCredentialsText}>Pro Credentials & Badges</Text>
          <Ionicons name="chevron-forward" size={18} color="#9E9E9E" />
        </View>
      </TouchableOpacity>

      {/* Save to Wallet Button - Only show for published cards */}
      {cardData?.is_published && (
        <TouchableOpacity 
          style={styles.walletButton}
          onPress={handleSaveToWallet}
          activeOpacity={0.8}
        >
          <View style={styles.walletContent}>
            <Ionicons name="wallet-outline" size={20} color="#F59E0B" />
            <Text style={styles.walletText}>Get Wallet Save Link</Text>
            <Ionicons name="chevron-forward" size={18} color="#9E9E9E" />
          </View>
        </TouchableOpacity>
      )}

      {/* Links List */}
      {links.length > 0 ? (
        <View style={styles.linksList}>
          {links.map((link, index) => {
            const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
            return (
              <TouchableOpacity
                key={link.id || index}
                style={styles.linkItem}
                onPress={() => handleEditLink(link)}
                activeOpacity={0.7}
              >
                <View style={styles.linkDragHandle}>
                  <Ionicons name="menu" size={20} color="#BDBDBD" />
                </View>
                <View style={[styles.linkIconContainer, { backgroundColor: platformConfig.bgColor }]}>
                  <Ionicons name={platformConfig.icon as any} size={20} color={platformConfig.color} />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle}>{link.title || link.platform}</Text>
                  <Text style={styles.linkValue} numberOfLines={1}>{link.value}</Text>
                </View>
                <View style={styles.linkStats}>
                  <Ionicons name="eye-outline" size={14} color="#9E9E9E" />
                  <Text style={styles.linkClicks}>{link.clicks || 0}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyLinks}>
          <Ionicons name="link-outline" size={48} color="#E0E0E0" />
          <Text style={styles.emptyLinksText}>No links added yet</Text>
          <Text style={styles.emptyLinksSubtext}>Tap the button above to add your first link</Text>
        </View>
      )}
    </View>
  );

  // Render Appearance Tab
  const renderAppearanceTab = () => (
    <View style={styles.tabContent}>
      {/* Profile Photo Size Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Photo Size</Text>
        </View>
        <View style={styles.photoSizeOptions}>
          {PHOTO_SIZES.map((size) => (
            <TouchableOpacity
              key={size.id}
              style={[styles.photoSizeOption, profilePhotoSize === size.id && styles.selectedPhotoSize]}
              onPress={() => handlePhotoSizeSelect(size.id)}
            >
              {size.id === 'cover' ? (
                // Cover photo preview - rectangular
                <View style={[styles.photoSizePreview, { width: 50, height: 30, borderRadius: 6 }]}>
                  <Ionicons name="image" size={16} color="#9E9E9E" />
                </View>
              ) : (
                // Regular circular preview
                <View style={[styles.photoSizePreview, { width: size.size * 0.3, height: size.size * 0.3, borderRadius: size.size * 0.15 }]}>
                  <Ionicons name="person" size={size.size * 0.15} color="#9E9E9E" />
                </View>
              )}
              <Text style={styles.photoSizeName}>{size.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {profilePhotoSize === 'cover' && (
          <Text style={styles.coverPhotoHint}>Cover photo displays full-width at the top of your card - perfect for realtors and influencers!</Text>
        )}
      </View>

      {/* Themes Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Themes</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themesScroll}>
          {THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              style={[styles.themeOption, selectedTheme === theme.id && styles.selectedTheme]}
              onPress={() => handleThemeSelect(theme.id)}
              activeOpacity={0.7}
            >
              {theme.isPremium && (
                <View style={styles.themePremiumBadge}>
                  <Text style={styles.themePremiumText}>PRO</Text>
                </View>
              )}
              <LinearGradient
                colors={theme.colors}
                style={[styles.themePreview, theme.hasBorder && styles.themePreviewBorder]}
              >
                <View style={[styles.themePhotoPlaceholder, theme.hasBorder && { borderColor: '#E0E0E0' }]} />
                <View style={[styles.themeLine, { backgroundColor: theme.textColor }]} />
                <View style={[styles.themeLine, styles.themeLineShort, { backgroundColor: theme.textColor }]} />
              </LinearGradient>
              <Text style={styles.themeName}>{theme.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Colors Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Colors</Text>
        </View>
        
        {/* Current Colors */}
        <View style={styles.currentColorsRow}>
          <TouchableOpacity style={styles.currentColorBox} onPress={() => openColorPicker(0)}>
            <View style={[styles.colorSwatch, { backgroundColor: gradientColors[0] }]} />
            <Text style={styles.colorLabel}>Color 1</Text>
          </TouchableOpacity>
          <Ionicons name="arrow-forward" size={16} color="#9E9E9E" />
          <TouchableOpacity style={styles.currentColorBox} onPress={() => openColorPicker(1)}>
            <View style={[styles.colorSwatch, { backgroundColor: gradientColors[1] }]} />
            <Text style={styles.colorLabel}>Color 2</Text>
          </TouchableOpacity>
        </View>

        {/* Preset Gradients */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
          {PRESET_GRADIENTS.map((gradient) => (
            <TouchableOpacity
              key={gradient.id}
              style={[
                styles.presetItem,
                gradientColors[0] === gradient.colors[0] && gradientColors[1] === gradient.colors[1] && styles.selectedPreset
              ]}
              onPress={() => handlePresetGradientSelect(gradient)}
            >
              <LinearGradient colors={gradient.colors} style={styles.presetGradient} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Backgrounds Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Backgrounds</Text>
          {isUploadingBackground && <ActivityIndicator size="small" color="#00C853" />}
        </View>
        <View style={styles.backgroundOptions}>
          {['solid', 'gradient', 'image', 'video'].map((bgType) => (
            <TouchableOpacity
              key={bgType}
              style={[styles.backgroundOption, selectedBackground === bgType && styles.selectedBackground]}
              onPress={() => handleBackgroundSelect(bgType)}
              disabled={isUploadingBackground}
            >
              {bgType === 'solid' && <View style={[styles.bgPreview, { backgroundColor: gradientColors[0] }]} />}
              {bgType === 'gradient' && <LinearGradient colors={gradientColors} style={styles.bgPreview} />}
              {bgType === 'image' && (
                backgroundImageUrl && selectedBackground === 'image' ? (
                  <Image source={{ uri: backgroundImageUrl }} style={styles.bgPreview} resizeMode="cover" />
                ) : (
                  <View style={[styles.bgPreview, styles.bgPreviewIcon]}>
                    <Ionicons name="image" size={20} color="#9E9E9E" />
                  </View>
                )
              )}
              {bgType === 'video' && (
                <View style={[styles.bgPreview, styles.bgPreviewDark]}>
                  <Ionicons name="videocam" size={20} color="#fff" />
                  {!isPro && <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>}
                </View>
              )}
              <Text style={styles.bgName}>{bgType.charAt(0).toUpperCase() + bgType.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Show change button when image/video is selected */}
        {(selectedBackground === 'image' || selectedBackground === 'video') && (
          <TouchableOpacity 
            style={styles.changeBackgroundButton}
            onPress={() => selectedBackground === 'image' ? pickBackgroundImage() : pickBackgroundVideo()}
          >
            <Ionicons name="refresh" size={16} color="#00C853" />
            <Text style={styles.changeBackgroundText}>Change {selectedBackground}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Button Styles Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Buttons</Text>
        </View>
        <View style={styles.buttonOptions}>
          {BUTTON_STYLES.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[styles.buttonOption, selectedButtonStyle === style.id && styles.selectedButtonOption]}
              onPress={() => handleButtonStyleSelect(style.id)}
            >
              <View style={[
                styles.buttonPreview,
                style.id === 'fill' && { backgroundColor: '#1A1A1A' },
                style.id === 'outline' && { borderWidth: 2, borderColor: '#1A1A1A', backgroundColor: 'transparent' },
                style.id === 'rounded' && { backgroundColor: '#1A1A1A', borderRadius: 8 },
                style.id === 'shadow' && { backgroundColor: '#1A1A1A', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
                style.id === 'pill' && { backgroundColor: '#1A1A1A', borderRadius: 20 },
                style.id === 'minimal' && { backgroundColor: 'transparent', borderBottomWidth: 2, borderBottomColor: '#1A1A1A' },
              ]}>
                <Text style={[styles.buttonPreviewText, (style.id === 'outline' || style.id === 'minimal') && { color: '#1A1A1A' }]}>
                  {style.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Fonts Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fonts</Text>
          <Text style={styles.sectionSubtitle}>{FONTS.length} fonts ({PREMIUM_FONT_COUNT} premium)</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontsScroll}>
          {FONTS.map((font) => (
            <TouchableOpacity
              key={font.id}
              style={[styles.fontOption, selectedFont === font.id && styles.selectedFont]}
              onPress={() => handleFontSelect(font.id)}
            >
              {font.isPremium && (
                <View style={styles.fontProBadge}>
                  <Text style={styles.fontProBadgeText}>PRO</Text>
                </View>
              )}
              <Text style={[styles.fontPreview, font.style]}>{font.preview}</Text>
              <Text style={styles.fontName}>{font.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Industry Icons Section - Pro Feature */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Industry Icons</Text>
          <View style={styles.proBadgeSmall}>
            <Text style={styles.proBadgeSmallText}>PRO</Text>
          </View>
        </View>
        <Text style={styles.sectionDescription}>
          Add professional icons to personalize your card for your industry
        </Text>
        
        <TouchableOpacity 
          style={styles.addIconsButton}
          onPress={() => setShowIconsModal(true)}
        >
          <Ionicons name="add-circle" size={20} color="#00C853" />
          <Text style={styles.addIconsText}>
            {industryIcons.length > 0 
              ? `Edit Icons (${industryIcons.length} selected)` 
              : 'Add Industry Icons'}
          </Text>
        </TouchableOpacity>
        
        {/* Preview selected icons */}
        {industryIcons.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedIconsScroll}>
            {industryIcons.map((icon) => (
              <View key={icon.id} style={styles.selectedIconPreview}>
                <Ionicons name={icon.icon as any} size={24} color="#1A1A1A" />
                <TouchableOpacity 
                  style={styles.removeIconButton}
                  onPress={() => handleRemoveIndustryIcon(icon.id)}
                >
                  <Ionicons name="close-circle" size={16} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Premium upsell removed - only prompt on publish */}
    </View>
  );

  // Render Analytics Tab
  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <Ionicons name="bar-chart" size={24} color="#00C853" />
          <Text style={styles.analyticsTitle}>Card Performance</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{cardData?.view_count || 0}</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{links.reduce((sum, link) => sum + (link.clicks || 0), 0)}</Text>
            <Text style={styles.statLabel}>Link Clicks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {cardData?.view_count && cardData.view_count > 0 
                ? Math.round((links.reduce((sum, link) => sum + (link.clicks || 0), 0) / cardData.view_count) * 100) 
                : 0}%
            </Text>
            <Text style={styles.statLabel}>Click Rate</Text>
          </View>
        </View>
      </View>

      {/* Tavvy Reviews Section */}
      <View style={styles.reviewsCard}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.crownLarge}>👑</Text>
          <Text style={styles.reviewsTitle}>Tavvy Reviews</Text>
        </View>
        <View style={styles.reviewsStats}>
          <Text style={styles.reviewsCount}>x {cardData?.review_count || 0}</Text>
          <Text style={styles.reviewsLabel}>Good Taps</Text>
        </View>
        <Text style={styles.reviewsHint}>
          Reviews from the Tavvy community appear here
        </Text>
      </View>

      {!isPro && (
        <TouchableOpacity 
          style={styles.upgradeCard}
          onPress={() => navigation.navigate('ECardPremiumUpsell')}
        >
          <LinearGradient
            colors={['#F97316', '#FACC15']}
            style={styles.upgradeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="star" size={24} color="#fff" />
            <View style={styles.upgradeTextContainer}>
              <Text style={styles.upgradeTitle}>Unlock Advanced Analytics</Text>
              <Text style={styles.upgradeSubtitle}>Track views, clicks, and engagement</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={styles.linkAnalytics}>
        <Text style={styles.linkAnalyticsTitle}>Link Performance</Text>
        {links.length > 0 ? (
          links.map((link, index) => {
            const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
            return (
              <View key={link.id || index} style={styles.linkAnalyticsItem}>
                <View style={[styles.linkAnalyticsIcon, { backgroundColor: platformConfig.bgColor }]}>
                  <Ionicons name={platformConfig.icon as any} size={16} color={platformConfig.color} />
                </View>
                <Text style={styles.linkAnalyticsName}>{link.title || link.platform}</Text>
                <Text style={styles.linkAnalyticsClicks}>{link.clicks || 0} clicks</Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.noLinksText}>Add links to see their performance</Text>
        )}
      </View>

      {/* Delete Card Section */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.deleteCardButton} onPress={handleDeleteCard}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.deleteCardText}>Delete This Card</Text>
        </TouchableOpacity>
        <Text style={styles.deleteCardHint}>This will permanently delete your card, all links, and free up your URL slug.</Text>
      </View>
    </View>
  );

  // Render Gallery Modal
  const renderGalleryModal = () => (
    <Modal
      visible={showGalleryModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowGalleryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.galleryModalContent}>
          <View style={styles.galleryModalHeader}>
            <Text style={styles.galleryModalTitle}>Photo Gallery</Text>
            <TouchableOpacity onPress={() => setShowGalleryModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {!isPro && (
            <View style={styles.galleryProBanner}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.galleryProText}>Gallery is a Pro feature. You can add images, but upgrade to publish.</Text>
            </View>
          )}
          
          <ScrollView style={styles.galleryGrid}>
            <View style={styles.galleryImagesRow}>
              {galleryImages.map((image) => (
                <View key={image.id} style={styles.galleryImageContainer}>
                  <Image source={{ uri: image.url }} style={styles.galleryImage} />
                  <TouchableOpacity 
                    style={styles.galleryRemoveButton}
                    onPress={() => handleRemoveGalleryImage(image.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {galleryImages.length < 10 && (
                <TouchableOpacity style={styles.galleryAddButton} onPress={handleAddGalleryImage}>
                  <Ionicons name="add" size={32} color="#9E9E9E" />
                  <Text style={styles.galleryAddText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
          
          <Text style={styles.galleryHint}>{galleryImages.length}/10 images</Text>
          
          <TouchableOpacity 
            style={styles.galleryDoneButton}
            onPress={() => setShowGalleryModal(false)}
          >
            <Text style={styles.galleryDoneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Helper function to extract YouTube video ID
  const extractYoutubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Render YouTube Modal
  const renderYoutubeModal = () => {
    const videoId = extractYoutubeVideoId(tempYoutubeUrl);
    
    return (
      <Modal
        visible={showYoutubeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowYoutubeModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalOverlayTouchable} 
            activeOpacity={1} 
            onPress={() => Keyboard.dismiss()}
          >
            <View style={styles.youtubeModalContent}>
              <View style={styles.youtubeModalHeader}>
                <Text style={styles.youtubeModalTitle}>YouTube Video</Text>
                <TouchableOpacity onPress={() => setShowYoutubeModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.youtubeModalSubtitle}>
                Add a YouTube video to display on your card
              </Text>
              
              <View style={styles.youtubeInputContainer}>
                <Ionicons name="logo-youtube" size={20} color="#FF0000" style={styles.youtubeInputIcon} />
                <TextInput
                  style={styles.youtubeInput}
                  placeholder="Paste YouTube URL here..."
                  placeholderTextColor="#9E9E9E"
                  value={tempYoutubeUrl}
                  onChangeText={setTempYoutubeUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {tempYoutubeUrl.length > 0 && (
                  <TouchableOpacity onPress={() => setTempYoutubeUrl('')}>
                    <Ionicons name="close-circle" size={20} color="#9E9E9E" />
                  </TouchableOpacity>
                )}
              </View>
              
              {videoId && (
                <View style={styles.youtubePreviewContainer}>
                  <Text style={styles.youtubePreviewLabel}>Preview:</Text>
                  <View style={styles.youtubePreview}>
                    <Image 
                      source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
                      style={styles.youtubeThumbnail}
                      resizeMode="cover"
                    />
                    <View style={styles.youtubePlayButton}>
                      <Ionicons name="play" size={32} color="#fff" />
                    </View>
                  </View>
                </View>
              )}
              
              {tempYoutubeUrl.length > 0 && !videoId && (
                <View style={styles.youtubeErrorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={styles.youtubeErrorText}>Invalid YouTube URL. Please paste a valid YouTube link.</Text>
                </View>
              )}
              
              <View style={styles.youtubeModalButtons}>
                {youtubeVideoUrl && (
                  <TouchableOpacity 
                    style={styles.youtubeRemoveButton}
                    onPress={() => {
                      setYoutubeVideoUrl('');
                      setTempYoutubeUrl('');
                      setShowYoutubeModal(false);
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={styles.youtubeRemoveText}>Remove</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity 
                  style={[styles.youtubeSaveButton, !videoId && styles.youtubeSaveButtonDisabled]}
                  onPress={() => {
                    if (videoId) {
                      setYoutubeVideoUrl(tempYoutubeUrl);
                      setShowYoutubeModal(false);
                      Keyboard.dismiss();
                    }
                  }}
                  disabled={!videoId}
                >
                  <Text style={styles.youtubeSaveText}>Save Video</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Helper to render verification status badge
  const renderVerificationBadge = (isVerified: boolean) => {
    if (isVerified) {
      return (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#059669" />
          <Text style={styles.verifiedBadgeText}>Verified</Text>
        </View>
      );
    }
    return (
      <View style={styles.unverifiedBadge}>
        <Ionicons name="time-outline" size={14} color="#F59E0B" />
        <Text style={styles.unverifiedBadgeText}>Not Verified</Text>
      </View>
    );
  };

  // Render Credentials Modal
  const renderCredentialsModal = () => (
    <Modal
      visible={showCredentialsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCredentialsModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity 
          style={styles.modalOverlayTouchable} 
          activeOpacity={1} 
          onPress={() => Keyboard.dismiss()}
        >
          <View style={styles.credentialsModalContent}>
            <View style={styles.credentialsModalHeader}>
              <Text style={styles.credentialsModalTitle}>Pro Credentials</Text>
              <TouchableOpacity onPress={() => setShowCredentialsModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Verification Status Banner */}
            {!verificationStatus.is_licensed_verified && !verificationStatus.is_insured_verified && !verificationStatus.is_bonded_verified && !verificationStatus.is_tavvy_verified && (
              <TouchableOpacity 
                style={styles.verificationBanner}
                onPress={() => {
                  setShowCredentialsModal(false);
                  navigation.navigate('VerificationUpload');
                }}
              >
                <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
                <View style={styles.verificationBannerText}>
                  <Text style={styles.verificationBannerTitle}>Get Verified</Text>
                  <Text style={styles.verificationBannerSubtitle}>Upload documents to display badges</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </TouchableOpacity>
            )}
            
            <ScrollView 
              style={styles.credentialsList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {/* Licensed */}
              <View style={styles.credentialItem}>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialEmoji}>✅</Text>
                  <View style={styles.credentialLabelContainer}>
                    <Text style={styles.credentialLabel}>Licensed</Text>
                    {renderVerificationBadge(verificationStatus.is_licensed_verified)}
                  </View>
                  <Switch
                    value={proCredentials.isLicensed}
                    onValueChange={(value) => setProCredentials(prev => ({ ...prev, isLicensed: value }))}
                    trackColor={{ false: '#E0E0E0', true: verificationStatus.is_licensed_verified ? '#34D399' : '#FCD34D' }}
                  />
                </View>
                {proCredentials.isLicensed && !verificationStatus.is_licensed_verified && (
                  <Text style={styles.credentialWarning}>Badge will show after verification</Text>
                )}
                {proCredentials.isLicensed && (
                  <TextInput
                    style={styles.credentialInput}
                    placeholder="License Number (optional)"
                    value={proCredentials.licenseNumber || ''}
                    onChangeText={(text) => setProCredentials(prev => ({ ...prev, licenseNumber: text }))}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                )}
              </View>
              
              {/* Insured */}
              <View style={styles.credentialItem}>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialEmoji}>✅</Text>
                  <View style={styles.credentialLabelContainer}>
                    <Text style={styles.credentialLabel}>Insured</Text>
                    {renderVerificationBadge(verificationStatus.is_insured_verified)}
                  </View>
                  <Switch
                    value={proCredentials.isInsured}
                    onValueChange={(value) => setProCredentials(prev => ({ ...prev, isInsured: value }))}
                    trackColor={{ false: '#E0E0E0', true: verificationStatus.is_insured_verified ? '#34D399' : '#FCD34D' }}
                  />
                </View>
                {proCredentials.isInsured && !verificationStatus.is_insured_verified && (
                  <Text style={styles.credentialWarning}>Badge will show after verification</Text>
                )}
              </View>
              
              {/* Bonded */}
              <View style={styles.credentialItem}>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialEmoji}>🛡️</Text>
                  <View style={styles.credentialLabelContainer}>
                    <Text style={styles.credentialLabel}>Bonded</Text>
                    {renderVerificationBadge(verificationStatus.is_bonded_verified)}
                  </View>
                  <Switch
                    value={proCredentials.isBonded}
                    onValueChange={(value) => setProCredentials(prev => ({ ...prev, isBonded: value }))}
                    trackColor={{ false: '#E0E0E0', true: verificationStatus.is_bonded_verified ? '#34D399' : '#FCD34D' }}
                  />
                </View>
                {proCredentials.isBonded && !verificationStatus.is_bonded_verified && (
                  <Text style={styles.credentialWarning}>Badge will show after verification</Text>
                )}
              </View>
              
              {/* Tavvy Verified */}
              <View style={styles.credentialItem}>
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialEmoji}>🟢</Text>
                  <View style={styles.credentialLabelContainer}>
                    <Text style={styles.credentialLabel}>Tavvy Verified</Text>
                    {renderVerificationBadge(verificationStatus.is_tavvy_verified)}
                  </View>
                  <Switch
                    value={proCredentials.isTavvyVerified}
                    onValueChange={(value) => setProCredentials(prev => ({ ...prev, isTavvyVerified: value }))}
                    trackColor={{ false: '#E0E0E0', true: verificationStatus.is_tavvy_verified ? '#34D399' : '#FCD34D' }}
                  />
                </View>
                {!verificationStatus.is_tavvy_verified && (
                  <Text style={styles.credentialHint}>Complete verification to earn this badge</Text>
                )}
              </View>
              
              {/* Years in Business */}
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Years in Business</Text>
                <TextInput
                  style={styles.credentialInput}
                  placeholder="e.g., 10"
                  keyboardType="numeric"
                  value={proCredentials.yearsInBusiness?.toString() || ''}
                  onChangeText={(text) => setProCredentials(prev => ({ ...prev, yearsInBusiness: parseInt(text) || undefined }))}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
              
              {/* Service Area */}
              <View style={styles.credentialItem}>
                <Text style={styles.credentialLabel}>Service Area</Text>
                <TextInput
                  style={styles.credentialInput}
                  placeholder="e.g., Miami-Dade County, FL"
                  value={proCredentials.serviceArea || ''}
                  onChangeText={(text) => setProCredentials(prev => ({ ...prev, serviceArea: text }))}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
              
              {/* Add padding at bottom for keyboard */}
              <View style={{ height: 20 }} />
            </ScrollView>
            
            <TouchableOpacity 
              style={styles.credentialsSaveButton}
              onPress={() => {
                Keyboard.dismiss();
                handleSaveCredentials();
              }}
            >
              <LinearGradient colors={['#00C853', '#00E676']} style={styles.credentialsSaveGradient}>
                <Text style={styles.credentialsSaveText}>Save Credentials</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Render QR Modal
  const renderQRModal = () => (
    <Modal
      visible={showQRModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowQRModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.qrModalContent}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowQRModal(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.qrModalTitle}>Your QR Code</Text>
          {qrCodeUrl && (
            <Image source={{ uri: qrCodeUrl }} style={styles.qrCodeImage} />
          )}
          <Text style={styles.qrModalUrl}>{cardUrl}</Text>
          <View style={styles.qrModalActions}>
            <TouchableOpacity style={styles.qrActionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#00C853" />
              <Text style={styles.qrActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render Slug Modal (for editing URL of published cards)
  const renderSlugModal = () => (
    <Modal
      visible={showSlugModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSlugModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.slugModalContent}>
          <View style={styles.slugModalHeader}>
            <Text style={styles.slugModalTitle}>Edit Card URL</Text>
            <TouchableOpacity onPress={() => setShowSlugModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.slugInputContainer}>
            <Text style={styles.slugPrefix}>tavvy.com/</Text>
            <TextInput
              style={styles.slugInput}
              value={slugInput}
              onChangeText={(text) => {
                const formatted = text.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
                setSlugInput(formatted);
                setSlugAvailable(null);
              }}
              placeholder="yourname"
              placeholderTextColor="#BDBDBD"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          {slugAvailable === true && (
            <View style={styles.slugStatusRow}>
              <Ionicons name="checkmark-circle" size={18} color="#00C853" />
              <Text style={styles.slugAvailableText}>Available!</Text>
            </View>
          )}
          
          {slugAvailable === false && (
            <View style={styles.slugStatusRow}>
              <Ionicons name="close-circle" size={18} color="#F44336" />
              <Text style={styles.slugUnavailableText}>Already taken</Text>
            </View>
          )}
          
          <View style={styles.slugModalActions}>
            <TouchableOpacity
              style={styles.checkButton}
              onPress={async () => {
                if (slugInput.length < 3) return;
                setIsCheckingSlug(true);
                const available = await checkSlugAvailability(slugInput);
                setSlugAvailable(available);
                setIsCheckingSlug(false);
              }}
              disabled={isCheckingSlug || slugInput.length < 3}
            >
              {isCheckingSlug ? (
                <ActivityIndicator size="small" color="#00C853" />
              ) : (
                <Text style={styles.checkButtonText}>Check</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveSlugButton, !slugAvailable && styles.saveSlugButtonDisabled]}
              onPress={async () => {
                if (!slugAvailable || !cardData?.id) return;
                try {
                  await supabase.from('digital_cards').update({ slug: slugInput }).eq('id', cardData.id);
                  setCardData(prev => prev ? { ...prev, slug: slugInput } : null);
                  setCardUrl(`tavvy.com/${slugInput}`);
                  setShowSlugModal(false);
                  Alert.alert('Success', 'URL updated!');
                } catch (error) {
                  Alert.alert('Error', 'Failed to update URL');
                }
              }}
              disabled={!slugAvailable}
            >
              <LinearGradient
                colors={slugAvailable ? ['#00C853', '#00E676'] : ['#E0E0E0', '#BDBDBD']}
                style={styles.saveSlugGradient}
              >
                <Text style={[styles.saveSlugText, !slugAvailable && { color: '#9E9E9E' }]}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  // Render Publish Slug Modal (shown before first publish)
  const renderPublishSlugModal = () => (
    <Modal
      visible={showPublishSlugModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPublishSlugModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.slugModalContent}>
          <View style={styles.slugModalHeader}>
            <Text style={styles.slugModalTitle}>🎉 Choose Your Card URL</Text>
            <TouchableOpacity onPress={() => setShowPublishSlugModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.publishSlugDescription}>
            This will be your permanent card link. Choose something memorable!
          </Text>
          
          <View style={styles.slugInputContainer}>
            <Text style={styles.slugPrefix}>tavvy.com/</Text>
            <TextInput
              style={styles.slugInput}
              value={slugInput}
              onChangeText={(text) => {
                const formatted = text.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
                setSlugInput(formatted);
                setSlugAvailable(null);
              }}
              placeholder="yourname"
              placeholderTextColor="#BDBDBD"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          {slugInput.length > 0 && slugInput.length < 3 && (
            <View style={styles.slugStatusRow}>
              <Ionicons name="information-circle" size={18} color="#F59E0B" />
              <Text style={styles.slugWarningText}>URL must be at least 3 characters</Text>
            </View>
          )}
          
          {slugAvailable === true && (
            <View style={styles.slugStatusRow}>
              <Ionicons name="checkmark-circle" size={18} color="#00C853" />
              <Text style={styles.slugAvailableText}>Available! This URL is yours.</Text>
            </View>
          )}
          
          {slugAvailable === false && (
            <View style={styles.slugStatusRow}>
              <Ionicons name="close-circle" size={18} color="#F44336" />
              <Text style={styles.slugUnavailableText}>Already taken - try another</Text>
            </View>
          )}
          
          <View style={styles.slugModalActions}>
            <TouchableOpacity
              style={styles.checkButton}
              onPress={async () => {
                if (slugInput.length < 3) {
                  Alert.alert('Too Short', 'Your URL must be at least 3 characters.');
                  return;
                }
                setIsCheckingSlug(true);
                const available = await checkSlugAvailability(slugInput);
                setSlugAvailable(available);
                setIsCheckingSlug(false);
              }}
              disabled={isCheckingSlug || slugInput.length < 3}
            >
              {isCheckingSlug ? (
                <ActivityIndicator size="small" color="#00C853" />
              ) : (
                <Text style={styles.checkButtonText}>Check</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveSlugButton, (!slugAvailable || isPublishing) && styles.saveSlugButtonDisabled]}
              onPress={handleConfirmPublish}
              disabled={!slugAvailable || isPublishing}
            >
              <LinearGradient
                colors={slugAvailable ? ['#00C853', '#00E676'] : ['#E0E0E0', '#BDBDBD']}
                style={styles.saveSlugGradient}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.saveSlugText, !slugAvailable && { color: '#9E9E9E' }]}>
                    Publish
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.publishSlugHint}>
            💡 Tip: Use your name, business name, or something easy to remember
          </Text>
        </View>
      </View>
    </Modal>
  );

  // Render Color Picker Modal
  const renderColorPickerModal = () => (
    <Modal
      visible={showColorPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowColorPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.colorPickerContent}>
          <View style={styles.colorPickerHeader}>
            <Text style={styles.colorPickerTitle}>
              {editingColorIndex === 0 ? 'Color 1' : 'Color 2'}
            </Text>
            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.colorPreviewLarge, { backgroundColor: tempColor }]} />
          
          <View style={styles.hexInputRow}>
            <Text style={styles.hexLabel}>Hex:</Text>
            <TextInput
              style={styles.hexInput}
              value={tempColor}
              onChangeText={(text) => {
                let formatted = text.toUpperCase();
                if (!formatted.startsWith('#')) formatted = '#' + formatted;
                if (formatted.length <= 7) setTempColor(formatted);
              }}
              placeholder="#667EEA"
              maxLength={7}
            />
          </View>
          
          <View style={styles.quickColors}>
            {PRESET_COLORS.slice(0, 12).map((color, index) => (
              <TouchableOpacity
                key={`${color}-${index}`}
                style={[styles.quickColorItem, tempColor === color && styles.quickColorSelected]}
                onPress={() => setTempColor(color)}
              >
                <View style={[styles.quickColorSwatch, { backgroundColor: color }]} />
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.applyColorButton} onPress={applyCustomColor}>
            <LinearGradient colors={['#00C853', '#00E676']} style={styles.applyColorGradient}>
              <Text style={styles.applyColorText}>Apply Color</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Industry Icons Modal
  const renderIndustryIconsModal = () => {
    // Industry-specific icon categories
    const INDUSTRY_ICONS = {
      'Real Estate': [
        { icon: 'home', name: 'House' },
        { icon: 'key', name: 'Keys' },
        { icon: 'business', name: 'Building' },
        { icon: 'location', name: 'Location' },
        { icon: 'ribbon', name: 'Sold' },
        { icon: 'trending-up', name: 'Growth' },
      ],
      'Construction': [
        { icon: 'construct', name: 'Tools' },
        { icon: 'hammer', name: 'Hammer' },
        { icon: 'build', name: 'Build' },
        { icon: 'cube', name: 'Materials' },
        { icon: 'layers', name: 'Layers' },
        { icon: 'shield-checkmark', name: 'Safety' },
      ],
      'Beauty & Wellness': [
        { icon: 'sparkles', name: 'Sparkle' },
        { icon: 'heart', name: 'Heart' },
        { icon: 'flower', name: 'Flower' },
        { icon: 'star', name: 'Star' },
        { icon: 'leaf', name: 'Natural' },
        { icon: 'water', name: 'Water' },
      ],
      'Food & Beverage': [
        { icon: 'restaurant', name: 'Dining' },
        { icon: 'cafe', name: 'Coffee' },
        { icon: 'wine', name: 'Wine' },
        { icon: 'pizza', name: 'Pizza' },
        { icon: 'nutrition', name: 'Nutrition' },
        { icon: 'ice-cream', name: 'Dessert' },
      ],
      'Technology': [
        { icon: 'code-slash', name: 'Code' },
        { icon: 'laptop', name: 'Laptop' },
        { icon: 'phone-portrait', name: 'Mobile' },
        { icon: 'cloud', name: 'Cloud' },
        { icon: 'analytics', name: 'Analytics' },
        { icon: 'settings', name: 'Settings' },
      ],
      'Finance': [
        { icon: 'cash', name: 'Cash' },
        { icon: 'card', name: 'Card' },
        { icon: 'wallet', name: 'Wallet' },
        { icon: 'trending-up', name: 'Growth' },
        { icon: 'pie-chart', name: 'Chart' },
        { icon: 'calculator', name: 'Calculator' },
      ],
      'Healthcare': [
        { icon: 'medkit', name: 'Medical' },
        { icon: 'heart', name: 'Heart' },
        { icon: 'fitness', name: 'Fitness' },
        { icon: 'pulse', name: 'Pulse' },
        { icon: 'bandage', name: 'Care' },
        { icon: 'shield-checkmark', name: 'Protection' },
      ],
      'General': [
        { icon: 'briefcase', name: 'Business' },
        { icon: 'people', name: 'Team' },
        { icon: 'trophy', name: 'Award' },
        { icon: 'ribbon', name: 'Badge' },
        { icon: 'checkmark-circle', name: 'Verified' },
        { icon: 'flash', name: 'Fast' },
      ],
    };
    
    const ICON_POSITIONS: { id: IndustryIcon['position']; name: string }[] = [
      { id: 'top-left', name: 'Top Left' },
      { id: 'top-right', name: 'Top Right' },
      { id: 'center-left', name: 'Center Left' },
      { id: 'center-right', name: 'Center Right' },
      { id: 'bottom-left', name: 'Bottom Left' },
      { id: 'bottom-right', name: 'Bottom Right' },
    ];
    
    return (
      <Modal
        visible={showIconsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowIconsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: height * 0.85 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Industry Icons</Text>
              <TouchableOpacity onPress={() => setShowIconsModal(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.iconModalDescription}>
              Add watermark icons that represent your industry. These appear subtly on your card background.
            </Text>
            
            {/* Category Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryTabs}>
              {Object.keys(INDUSTRY_ICONS).map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryTab,
                    iconSelectedCategory === category && styles.categoryTabActive
                  ]}
                  onPress={() => setIconSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryTabText,
                    iconSelectedCategory === category && styles.categoryTabTextActive
                  ]}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Icons Grid */}
            <View style={styles.iconsGrid}>
              {INDUSTRY_ICONS[iconSelectedCategory as keyof typeof INDUSTRY_ICONS].map((item) => (
                <TouchableOpacity
                  key={item.icon}
                  style={[
                    styles.iconItem,
                    iconSelectedIcon === item.icon && styles.iconItemSelected
                  ]}
                  onPress={() => setIconSelectedIcon(item.icon)}
                >
                  <Ionicons name={item.icon as any} size={28} color={iconSelectedIcon === item.icon ? '#00C853' : '#666'} />
                  <Text style={styles.iconItemName}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Position Selection */}
            {iconSelectedIcon && (
              <View style={styles.positionSection}>
                <Text style={styles.positionTitle}>Select Position</Text>
                <View style={styles.positionGrid}>
                  {ICON_POSITIONS.map((pos) => (
                    <TouchableOpacity
                      key={pos.id}
                      style={[
                        styles.positionItem,
                        iconSelectedPosition === pos.id && styles.positionItemSelected
                      ]}
                      onPress={() => setIconSelectedPosition(pos.id)}
                    >
                      <Text style={[
                        styles.positionItemText,
                        iconSelectedPosition === pos.id && styles.positionItemTextSelected
                      ]}>{pos.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Add Button */}
            <TouchableOpacity
              style={[
                styles.addIconButton,
                !iconSelectedIcon && styles.addIconButtonDisabled
              ]}
              onPress={() => {
                if (iconSelectedIcon) {
                  handleAddIndustryIcon(iconSelectedIcon, iconSelectedPosition);
                  setIconSelectedIcon(null);
                  setShowIconsModal(false);
                }
              }}
              disabled={!iconSelectedIcon}
            >
              <LinearGradient
                colors={iconSelectedIcon ? ['#00C853', '#00E676'] : ['#E0E0E0', '#BDBDBD']}
                style={styles.addIconGradient}
              >
                <Ionicons name="add" size={20} color={iconSelectedIcon ? '#fff' : '#9E9E9E'} />
                <Text style={[styles.addIconButtonText, !iconSelectedIcon && { color: '#9E9E9E' }]}>
                  Add Icon to Card
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C853" />
          <Text style={styles.loadingText}>Loading your card...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Card</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ECardPreview', { cardData, gradientColors, links, featuredSocials })}
          style={styles.previewButton}
        >
          <Ionicons name="eye-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Live Card Preview */}
      {renderLivePreview()}

      {/* Card URL & Actions - Only show for published cards */}
      {cardData?.is_published && (
        <View style={styles.cardUrlSection}>
          <TouchableOpacity 
            style={styles.cardUrlBox}
            onPress={() => {
              setSlugInput(cardData?.slug || '');
              setSlugAvailable(null);
              setShowSlugModal(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="link" size={16} color="#666" />
            <Text style={styles.cardUrlText} numberOfLines={1}>{cardUrl}</Text>
            <Ionicons name="pencil" size={12} color="#00C853" />
          </TouchableOpacity>
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
              <Ionicons name="copy-outline" size={18} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={generateQRCode}>
              <Ionicons name="qr-code-outline" size={18} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('ECardNFCWrite', { cardSlug: cardData?.slug, cardName: cardData?.full_name })}
            >
              <Ionicons name="wifi" size={18} color="#666" style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'links' && styles.activeTab]}
          onPress={() => setActiveTab('links')}
        >
          <Ionicons name="link" size={16} color={activeTab === 'links' ? '#00C853' : '#9E9E9E'} />
          <Text style={[styles.tabText, activeTab === 'links' && styles.activeTabText]}>Links</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appearance' && styles.activeTab]}
          onPress={() => setActiveTab('appearance')}
        >
          <Ionicons name="color-palette" size={16} color={activeTab === 'appearance' ? '#00C853' : '#9E9E9E'} />
          <Text style={[styles.tabText, activeTab === 'appearance' && styles.activeTabText]}>Appearance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Ionicons name="bar-chart" size={16} color={activeTab === 'analytics' ? '#00C853' : '#9E9E9E'} />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'links' && renderLinksTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>

      {/* Publish Button - Fixed at bottom */}
      <View style={styles.publishContainer}>
        <TouchableOpacity 
          style={styles.publishButton}
          onPress={handlePublishShare}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#00C853', '#00E676']}
            style={styles.publishGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="rocket" size={20} color="#fff" />
            <Text style={styles.publishText}>Publish & Share</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderQRModal()}
      {renderSlugModal()}
      {renderPublishSlugModal()}
      {renderColorPickerModal()}
      {renderGalleryModal()}
      {renderYoutubeModal()}
      {renderCredentialsModal()}
      {renderIndustryIconsModal()}
      
      {/* Saving Indicator */}
      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  previewButton: {
    padding: 4,
  },
  
  // Live Preview
  previewContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  previewCard: {
    width: width - 80,
    height: PREVIEW_HEIGHT,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCardBorder: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewPhotoContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  previewPhotoBorderDark: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  previewPhoto: {
    // Dynamic size set inline
  },
  coverPhotoContainer: {
    width: '100%',
    height: 120,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // New Cover Banner Styles (full-bleed)
  previewContainerCover: {
    backgroundColor: '#fff',
  },
  coverBannerContainer: {
    width: width,
    height: height * 0.25,
    position: 'relative',
  },
  coverBannerPhoto: {
    width: '100%',
    height: '100%',
  },
  coverBannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverBannerPlaceholderText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 8,
  },
  coverBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  coverBannerTextContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  coverBannerName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  coverBannerTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  coverLinksContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewTitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  previewLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewLinkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewMoreLinks: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewMoreText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Crown Badge
  crownBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  crownIcon: {
    fontSize: 14,
  },
  crownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  // Pro Badges Row
  proBadgesRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 4,
  },
  proBadgeIcon: {
    fontSize: 12,
  },
  
  // Gallery Indicator
  galleryIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  galleryIndicatorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Premium Indicator
  premiumIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  premiumIndicatorText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  
  // Card URL Section
  cardUrlSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardUrlBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    gap: 6,
  },
  cardUrlText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00C853',
  },
  tabText: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#00C853',
    fontWeight: '600',
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 100,
  },
  
  // Link Limit Banner
  linkLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  linkLimitText: {
    flex: 1,
    fontSize: 13,
    color: '#9A3412',
  },
  upgradeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F97316',
  },
  
  // Add Link Button
  addLinkButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  addLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Form Block Button
  addFormButton: {
    marginBottom: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  addFormContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  addFormText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  
  // Gallery Block Button
  addGalleryButton: {
    marginBottom: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
  },
  addGalleryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  addGalleryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  
  // Credentials Button
  addCredentialsButton: {
    marginBottom: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderStyle: 'dashed',
  },
  addCredentialsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  addCredentialsText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  
  // Wallet Button
  walletButton: {
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderStyle: 'dashed',
  },
  walletContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  walletText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#F59E0B',
  },
  
  // Pro Badge Small
  proBadgeSmall: {
    backgroundColor: '#FACC15',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeSmallText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  // Links List
  linksList: {
    gap: 8,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  linkDragHandle: {
    marginRight: 8,
  },
  linkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  linkValue: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 2,
  },
  linkStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 4,
  },
  linkClicks: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  
  // Empty Links
  emptyLinks: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLinksText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: 12,
  },
  emptyLinksSubtext: {
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 4,
  },
  
  // Photo Size Options
  photoSizeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  photoSizeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
  },
  selectedPhotoSize: {
    borderColor: '#00C853',
  },
  photoSizePreview: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoSizeName: {
    fontSize: 11,
    color: '#666',
  },
  coverPhotoHint: {
    fontSize: 12,
    color: '#00C853',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  
  // Appearance Section
  appearanceSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  
  // Featured Socials Section
  featuredSocialsSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  
  // Themes
  themesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  themeOption: {
    marginRight: 12,
    alignItems: 'center',
  },
  selectedTheme: {
    transform: [{ scale: 1.05 }],
  },
  themePreview: {
    width: 70,
    height: 90,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themePreviewBorder: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  themePhotoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  themeLine: {
    width: 30,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
    opacity: 0.7,
  },
  themeLineShort: {
    width: 20,
  },
  themeName: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  themePremiumBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FACC15',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    zIndex: 1,
  },
  themePremiumText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  // Colors
  currentColorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  currentColorBox: {
    alignItems: 'center',
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  colorLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  presetsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  presetItem: {
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPreset: {
    borderColor: '#00C853',
  },
  presetGradient: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  
  // Backgrounds
  backgroundOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  backgroundOption: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
  },
  selectedBackground: {
    borderColor: '#00C853',
  },
  bgPreview: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    marginBottom: 6,
  },
  bgPreviewIcon: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgPreviewDark: {
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FACC15',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bgName: {
    fontSize: 12,
    color: '#666',
  },
  changeBackgroundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    gap: 6,
  },
  changeBackgroundText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
    textTransform: 'capitalize',
  },
  
  // Button Styles
  buttonOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonOption: {
    width: (width - 48) / 3 - 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
  },
  selectedButtonOption: {
    borderColor: '#00C853',
  },
  buttonPreview: {
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPreviewText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Fonts
  fontsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  fontOption: {
    marginRight: 12,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
    minWidth: 70,
  },
  selectedFont: {
    borderColor: '#00C853',
  },
  fontPreview: {
    fontSize: 24,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  fontName: {
    fontSize: 11,
    color: '#666',
  },
  fontProBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FACC15',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fontProBadgeText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  // Analytics
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  
  // Reviews Card
  reviewsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  crownLarge: {
    fontSize: 24,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  reviewsStats: {
    alignItems: 'center',
  },
  reviewsCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F59E0B',
  },
  reviewsLabel: {
    fontSize: 14,
    color: '#92400E',
  },
  reviewsHint: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 12,
    textAlign: 'center',
  },
  
  // Upgrade Card
  upgradeCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  upgradeTextContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  upgradeSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  
  // Link Analytics
  linkAnalytics: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  linkAnalyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  linkAnalyticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  linkAnalyticsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkAnalyticsName: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  linkAnalyticsClicks: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  noLinksText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  // Publish Button Container
  publishContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  publishButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  publishGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  publishText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 32,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  qrModalUrl: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  qrModalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  qrActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  qrActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
  },
  
  // Slug Modal
  slugModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
  },
  slugModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  slugModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  slugInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  slugPrefix: {
    fontSize: 15,
    color: '#9E9E9E',
  },
  slugInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 14,
  },
  slugStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  slugAvailableText: {
    fontSize: 14,
    color: '#00C853',
  },
  slugUnavailableText: {
    fontSize: 14,
    color: '#F44336',
  },
  slugModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  checkButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  saveSlugButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveSlugButtonDisabled: {
    opacity: 0.5,
  },
  saveSlugGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveSlugText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Publish Slug Modal
  publishSlugDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  slugWarningText: {
    fontSize: 13,
    color: '#F59E0B',
    marginLeft: 6,
  },
  publishSlugHint: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Color Picker Modal
  colorPickerContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  colorPreviewLarge: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    marginBottom: 16,
  },
  hexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  hexLabel: {
    fontSize: 14,
    color: '#666',
  },
  hexInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  quickColors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickColorItem: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickColorSelected: {
    borderColor: '#00C853',
  },
  quickColorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  applyColorButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyColorGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyColorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Gallery Modal
  galleryModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 32,
    maxHeight: height * 0.8,
  },
  galleryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  galleryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  galleryProBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  galleryProText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
  },
  galleryGrid: {
    maxHeight: 300,
  },
  galleryImagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  galleryImageContainer: {
    position: 'relative',
  },
  galleryImage: {
    width: (width - 80) / 3 - 8,
    height: (width - 80) / 3 - 8,
    borderRadius: 8,
  },
  galleryRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  galleryAddButton: {
    width: (width - 80) / 3 - 8,
    height: (width - 80) / 3 - 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryAddText: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 4,
  },
  galleryHint: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 12,
  },
  galleryDoneButton: {
    backgroundColor: '#00C853',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  galleryDoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // YouTube Modal
  youtubeModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 32,
  },
  youtubeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  youtubeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  youtubeModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  youtubeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  youtubeInputIcon: {
    marginRight: 10,
  },
  youtubeInput: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  youtubePreviewContainer: {
    marginBottom: 16,
  },
  youtubePreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  youtubePreview: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  youtubeThumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#1A1A1A',
  },
  youtubePlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -28 }, { translateY: -28 }],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubeErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  youtubeErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
  },
  youtubeModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  youtubeRemoveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 6,
  },
  youtubeRemoveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  youtubeSaveButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  youtubeSaveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  youtubeSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  addYoutubeButton: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderStyle: 'dashed',
  },
  addYoutubeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  addYoutubeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
  },
  
  // Credentials Modal
  credentialsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 32,
    maxHeight: height * 0.8,
  },
  credentialsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  credentialsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  credentialsList: {
    maxHeight: 400,
  },
  credentialItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  credentialEmoji: {
    fontSize: 20,
  },
  credentialLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  credentialInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A1A1A',
    marginTop: 8,
  },
  credentialHint: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  credentialWarning: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  credentialLabelContainer: {
    flex: 1,
    marginLeft: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  verifiedBadgeText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 4,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  unverifiedBadgeText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
    marginLeft: 4,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verificationBannerText: {
    flex: 1,
    marginLeft: 12,
  },
  verificationBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  verificationBannerSubtitle: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  credentialsSaveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  credentialsSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  credentialsSaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Saving Indicator
  savingIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  savingText: {
    fontSize: 14,
    color: '#fff',
  },
  
  // Danger Zone / Delete Card
  dangerZone: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 12,
  },
  deleteCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  deleteCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteCardHint: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Industry Icons Section
  sectionDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  addIconsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  addIconsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00C853',
  },
  selectedIconsScroll: {
    marginTop: 12,
  },
  selectedIconPreview: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    position: 'relative',
  },
  removeIconButton: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  
  // Industry Icons Modal
  iconModalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  categoryTabs: {
    marginBottom: 16,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  categoryTabActive: {
    backgroundColor: '#00C853',
  },
  categoryTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  categoryTabTextActive: {
    color: '#fff',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  iconItem: {
    width: (width - 96) / 3 - 8,
    aspectRatio: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconItemSelected: {
    borderColor: '#00C853',
    backgroundColor: '#E8F5E9',
  },
  iconItemName: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  positionSection: {
    marginBottom: 20,
  },
  positionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  positionItemSelected: {
    borderColor: '#00C853',
    backgroundColor: '#E8F5E9',
  },
  positionItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  positionItemTextSelected: {
    color: '#00C853',
  },
  addIconButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addIconButtonDisabled: {
    opacity: 0.7,
  },
  addIconGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addIconButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
