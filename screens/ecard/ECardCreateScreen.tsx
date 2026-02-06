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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { TEMPLATES, Template, ColorScheme } from '../../config/eCardTemplates';

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
  // If background is light (luminance > 0.45), use dark text; otherwise white
  if (avgLum > 0.45) {
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

  // ── Modals ──
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showPhotoSizeModal, setShowPhotoSizeModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const currentPhotoSize = PHOTO_SIZE_OPTIONS[photoSizeIndex];
  const isCover = currentPhotoSize.id === 'cover';

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
          if (draft.address) setAddress(draft.address);
          if (typeof draft.templateIndex === 'number') setTemplateIndex(draft.templateIndex);
          if (typeof draft.colorIndex === 'number') setColorIndex(draft.colorIndex);
          if (typeof draft.photoSizeIndex === 'number') setPhotoSizeIndex(draft.photoSizeIndex);
          if (Array.isArray(draft.featuredIcons)) setFeaturedIcons(draft.featuredIcons);
          if (Array.isArray(draft.links)) setLinks(draft.links);
          if (Array.isArray(draft.videos)) setVideos(draft.videos);
          if (draft.profileImage) setProfileImage(draft.profileImage);
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
          name, titleRole, bio, email, phone, website, address,
          templateIndex, colorIndex, photoSizeIndex,
          featuredIcons, links, videos: videos.map(v => ({ type: v.type, url: v.url })),
          profileImage,
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
        city: address || null,
        profile_photo_url: photoUrl,
        profile_photo_size: currentPhotoSize.id,
        gradient_color_1: gradientColors[0],
        gradient_color_2: gradientColors[1],
        template_id: template.id,
        color_scheme_id: color?.id || null,
        theme: template.id,
        button_style: template.layout.buttonStyle,
        font_style: template.layout.fontFamily,
        is_published: false,
        is_active: true,
        gallery_images: uploadedGallery.length > 0 ? uploadedGallery : null,
        featured_socials: featuredIcons.length > 0 ? featuredIcons.map(fi => ({ platform: fi.platform, url: fi.url })) : null,
        videos: videos.length > 0 ? videos.map(v => ({ type: v.type, url: v.url })) : null,
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

            <LinearGradient key={`${templateIndex}_${colorIndex}`} colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.liveCard}>
              {/* Profile Photo */}
              {isCover ? (
                <TouchableOpacity style={styles.coverPhotoContainer} onPress={() => pickImage(false)} activeOpacity={0.8}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.coverPhoto} />
                  ) : (
                    <View style={styles.coverPlaceholder}>
                      <Ionicons name="camera" size={36} color={isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} />
                      <Text style={[styles.coverPlaceholderText, { color: isLightCard ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)' }]}>Tap to add cover photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.profilePhotoSection}>
                  <TouchableOpacity onPress={() => pickImage(false)} activeOpacity={0.8}>
                    <View style={{ width: currentPhotoSize.size, height: currentPhotoSize.size }}>
                      {profileImage ? (
                        <Image source={{ uri: profileImage }} style={{ width: currentPhotoSize.size, height: currentPhotoSize.size, borderRadius: currentPhotoSize.size / 2, borderWidth: 3, borderColor: isLightCard ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)' }} />
                      ) : (
                        <View style={{ width: currentPhotoSize.size, height: currentPhotoSize.size, borderRadius: currentPhotoSize.size / 2, borderWidth: 2, borderStyle: 'dashed', borderColor: isLightCard ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="camera" size={currentPhotoSize.size > 100 ? 32 : 24} color={isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Size hint - ALWAYS visible for all photo sizes */}
              <TouchableOpacity style={styles.photoSizeHint} onPress={() => setShowPhotoSizeModal(true)}>
                <Ionicons name="expand" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.photoSizeHintText}>{currentPhotoSize.label} · Tap to change size</Text>
              </TouchableOpacity>

              {/* ===== FEATURED SOCIAL ICONS (independent, up to 4, with URLs) ===== */}
              <View style={styles.featuredIconsSection}>
                <View style={styles.featuredIconsRow}>
                  {featuredIcons.map(fi => {
                    const platform = FEATURED_ICON_PLATFORMS.find(p => p.id === fi.platform);
                    if (!platform) return null;
                    return (
                      <View key={fi.platform} style={[styles.featuredIconSlot, { backgroundColor: platform.color }]}>
                        <Ionicons name={platform.icon as any} size={18} color="#fff" />
                        <TouchableOpacity
                          style={styles.featuredIconRemove}
                          onPress={() => removeFeaturedIcon(fi.platform)}
                        >
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
                {/* URL input for each featured icon */}
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
                        placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)'}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                      />
                    </View>
                  );
                })}
              </View>

              {/* ── Editable Fields ── */}
              <View style={styles.cardFields}>
                <TextInput
                  style={[styles.nameField, { color: textColor }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Name"
                  placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'}
                  textAlign="center"
                />
                <TextInput
                  style={[styles.titleField, { color: textSecondary }]}
                  value={titleRole}
                  onChangeText={setTitleRole}
                  placeholder="Title / Role"
                  placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)'}
                  textAlign="center"
                />
                <TextInput
                  style={[styles.bioField, { color: textSecondary }]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Short bio about yourself..."
                  placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}
                  textAlign="center"
                  multiline
                  numberOfLines={2}
                  maxLength={300}
                />

                {/* Contact Fields */}
                <View style={styles.contactFields}>
                  {[
                    { icon: 'mail' as const, value: email, set: setEmail, placeholder: 'Email address', kb: 'email-address' as const },
                    { icon: 'call' as const, value: phone, set: setPhone, placeholder: 'Phone number', kb: 'phone-pad' as const },
                    { icon: 'globe' as const, value: website, set: setWebsite, placeholder: 'Website URL', kb: 'url' as const },
                    { icon: 'location-outline' as const, value: address, set: setAddress, placeholder: 'City, State', kb: 'default' as const },
                  ].map((f, i) => (
                    <View key={i} style={[styles.contactRow, { borderBottomColor: isLightCard ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' }]}>
                      <Ionicons name={f.icon} size={16} color={textSecondary} />
                      <TextInput
                        style={[styles.contactInput, { color: textColor }]}
                        value={f.value}
                        onChangeText={f.set}
                        placeholder={f.placeholder}
                        placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)'}
                        keyboardType={f.kb}
                        autoCapitalize="none"
                      />
                    </View>
                  ))}
                </View>
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
                        placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)'}
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
                        placeholderTextColor={isLightCard ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.35)'}
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
            </LinearGradient>
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
});
