/**
 * ECardCreateScreen.tsx
 * Unified real-time card builder — ONE card fills the screen.
 *
 * UX:
 *  - Swipe left/right to change template
 *  - Tap any field to edit in-place
 *  - Tap profile photo to upload, tap "change size" to cycle sizes
 *  - Featured social icons around photo (max 4)
 *  - Photo gallery with lightbox
 *  - Bottom bar: ◀ [color dots] ▶  (template arrows + color picker)
 *  - "Continue" button saves card
 *
 * Navigation params (optional, from color picker flow):
 *   templateId, colorSchemeId
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
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
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { TEMPLATES, Template, ColorScheme } from '../../config/eCardTemplates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACCENT_GREEN = '#00C853';

// Photo size options
const PHOTO_SIZE_OPTIONS = [
  { id: 'small', label: 'Small', size: 80 },
  { id: 'medium', label: 'Medium', size: 110 },
  { id: 'large', label: 'Large', size: 150 },
  { id: 'xl', label: 'Extra Large', size: 200 },
  { id: 'cover', label: 'Cover', size: -1 },
];

// Social media platforms
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
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00', placeholder: 'Username' },
  { id: 'spotify', name: 'Spotify', icon: 'musical-notes', color: '#1DB954', placeholder: 'Profile link' },
  { id: 'github', name: 'GitHub', icon: 'logo-github', color: '#181717', placeholder: 'Username' },
  { id: 'other', name: 'Custom Link', icon: 'link', color: '#8E8E93', placeholder: 'https://...' },
];

const FEATURED_SOCIAL_IDS = ['instagram', 'tiktok', 'youtube', 'twitter', 'linkedin', 'facebook'];

interface LinkData {
  id: string;
  platform: string;
  value: string;
  isFeatured: boolean;
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
  const [isPremiumUser] = useState(false);

  const template = TEMPLATES[templateIndex];
  const colorSchemes = template?.colorSchemes || [];
  const color = colorSchemes[colorIndex] || colorSchemes[0];
  const isLocked = template?.isPremium && !isPremiumUser;

  const gradientColors: [string, string] = [color?.primary || '#667eea', color?.secondary || '#764ba2'];
  const textColor = color?.text || '#FFFFFF';
  const textSecondary = color?.textSecondary || 'rgba(255,255,255,0.7)';
  const accentColor = color?.accent || 'rgba(255,255,255,0.2)';
  const isLightCard = textColor === '#1A1A1A' || textColor === '#1f2937' || textColor === '#333333';

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
  const [links, setLinks] = useState<LinkData[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // ── Modals ──
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [showPhotoSizeModal, setShowPhotoSizeModal] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const currentPhotoSize = PHOTO_SIZE_OPTIONS[photoSizeIndex];
  const isCover = currentPhotoSize.id === 'cover';
  const featuredSocials = links.filter(l => l.isFeatured && FEATURED_SOCIAL_IDS.includes(l.platform)).slice(0, 4);

  // ── Swipe gesture for template switching ──
  const swipeX = useRef(0);
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20 && Math.abs(gs.dy) < 40,
    onPanResponderGrant: (_, gs) => { swipeX.current = 0; },
    onPanResponderMove: (_, gs) => { swipeX.current = gs.dx; },
    onPanResponderRelease: (_, gs) => {
      if (gs.dx < -60 && templateIndex < TEMPLATES.length - 1) {
        setTemplateIndex(prev => prev + 1);
        setColorIndex(0);
      } else if (gs.dx > 60 && templateIndex > 0) {
        setTemplateIndex(prev => prev - 1);
        setColorIndex(0);
      }
    },
  }), [templateIndex]);

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
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: !forGallery, aspect: forGallery ? undefined : [1, 1], quality: 0.8, allowsMultipleSelection: forGallery });
            if (!result.canceled && result.assets) {
              if (forGallery) { result.assets.forEach(a => addGalleryImage(a.uri)); }
              else { setProfileImage(result.assets[0].uri); }
            }
          }
        }
      );
    } else {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: !forGallery, aspect: forGallery ? undefined : [1, 1], quality: 0.8, allowsMultipleSelection: forGallery });
      if (!result.canceled && result.assets) {
        if (forGallery) { result.assets.forEach(a => addGalleryImage(a.uri)); }
        else { setProfileImage(result.assets[0].uri); }
      }
    }
  };

  const addGalleryImage = (uri: string) => {
    setGalleryImages(prev => [...prev, { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), uri }]);
  };

  // ── Links ──
  const addLink = (platformId: string) => {
    const isFeatured = FEATURED_SOCIAL_IDS.includes(platformId) && featuredSocials.length < 4;
    setLinks(prev => [...prev, { id: Date.now().toString(), platform: platformId, value: '', isFeatured }]);
    setShowAddLinkModal(false);
  };

  const updateLink = (id: string, value: string) => { setLinks(prev => prev.map(l => l.id === id ? { ...l, value } : l)); };
  const removeLink = (id: string) => { setLinks(prev => prev.filter(l => l.id !== id)); };
  const toggleFeatured = (id: string) => {
    setLinks(prev => prev.map(l => {
      if (l.id === id) {
        if (!l.isFeatured && prev.filter(x => x.isFeatured).length >= 4) return l;
        return { ...l, isFeatured: !l.isFeatured };
      }
      return l;
    }));
  };

  // ── Upload helper ──
  const uploadImage = async (uri: string, path: string): Promise<string | null> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const { data, error } = await supabase.storage.from('ecard-assets').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('ecard-assets').getPublicUrl(path);
      return urlData.publicUrl;
    } catch (err) { console.error('Upload error:', err); return null; }
  };

  // ── Save card ──
  const handleCreate = async () => {
    if (!user) { Alert.alert('Login Required', 'Please log in to create a card.'); return; }
    if (!name.trim()) { Alert.alert('Name Required', 'Please enter your name.'); return; }
    setIsCreating(true);
    try {
      let photoUrl: string | null = null;
      if (profileImage) { photoUrl = await uploadImage(profileImage, `${user.id}/profile_${Date.now()}.jpg`); }

      const uploadedGallery: { id: string; url: string; caption: string }[] = [];
      for (const img of galleryImages) {
        const url = await uploadImage(img.uri, `${user.id}/gallery_${img.id}.jpg`);
        if (url) uploadedGallery.push({ id: img.id, url, caption: '' });
      }

      const tempSlug = `draft_${user.id.substring(0, 8)}_${Date.now().toString(36)}`;

      const { data: newCard, error } = await supabase
        .from('digital_cards')
        .insert({
          user_id: user.id,
          slug: tempSlug,
          full_name: name,
          title: titleRole,
          bio,
          email: email || null,
          phone: phone || null,
          website: website || null,
          city: address || null,
          profile_photo_url: photoUrl,
          profile_photo_size: currentPhotoSize.id,
          gradient_color_1: gradientColors[0],
          gradient_color_2: gradientColors[1],
          theme: template.id,
          button_style: template.layout.buttonStyle,
          font_style: template.layout.fontFamily,
          is_published: false,
          gallery_images: uploadedGallery,
        })
        .select()
        .single();

      if (error) throw error;

      if (links.length > 0 && newCard) {
        const cardLinks = links.map((link, index) => ({
          card_id: newCard.id,
          platform: link.platform,
          title: SOCIAL_PLATFORMS.find(p => p.id === link.platform)?.name || link.platform,
          url: link.value,
          value: link.value,
          icon: link.platform,
          sort_order: index,
          is_active: true,
        }));
        await supabase.from('digital_card_links').insert(cardLinks);
      }

      navigation.navigate('ECardPremiumUpsell', { cardId: newCard.id });
    } catch (error: any) {
      console.error('Error creating card:', error);
      Alert.alert('Error', error.message || 'Failed to create card. Please try again.');
    } finally { setIsCreating(false); }
  };

  // ── Featured social icon around photo ──
  const renderFeaturedSocialIcon = (social: LinkData, index: number, photoSz: number) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === social.platform);
    if (!platform) return null;
    const totalIcons = featuredSocials.length;
    const angle = -90 + (index * (360 / Math.max(totalIcons, 1)));
    const radius = (photoSz / 2) + 10;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return (
      <View key={social.id} style={[styles.featuredSocialIcon, { backgroundColor: platform.color, left: (photoSz / 2) + x - 14, top: (photoSz / 2) + y - 14 }]}>
        <Ionicons name={platform.icon as any} size={14} color="#fff" />
      </View>
    );
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
            <Text style={styles.headerTitle}>{template?.name || 'Card'}</Text>
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

        {/* Swipe hint */}
        <View style={styles.swipeHint}>
          <Ionicons name="chevron-back" size={12} color="rgba(255,255,255,0.3)" />
          <Text style={styles.swipeHintText}>Swipe to change style</Text>
          <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.3)" />
        </View>

        {/* ── THE CARD ── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...panResponder.panHandlers}
        >
          <View style={styles.cardContainer}>
            {/* Locked overlay */}
            {isLocked && (
              <View style={styles.lockedOverlay}>
                <Ionicons name="lock-closed" size={36} color="#fff" />
                <Text style={styles.lockedText}>Premium Template</Text>
                <TouchableOpacity style={styles.unlockBtn} onPress={() => navigation.navigate('ECardPremiumUpsell', {})}>
                  <Text style={styles.unlockBtnText}>Unlock Premium</Text>
                </TouchableOpacity>
              </View>
            )}

            <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.liveCard}>
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
                    <View style={{ width: currentPhotoSize.size, height: currentPhotoSize.size, position: 'relative' }}>
                      {profileImage ? (
                        <Image source={{ uri: profileImage }} style={{ width: currentPhotoSize.size, height: currentPhotoSize.size, borderRadius: currentPhotoSize.size / 2, borderWidth: 3, borderColor: isLightCard ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.3)' }} />
                      ) : (
                        <View style={{ width: currentPhotoSize.size, height: currentPhotoSize.size, borderRadius: currentPhotoSize.size / 2, borderWidth: 2, borderStyle: 'dashed', borderColor: isLightCard ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="camera" size={currentPhotoSize.size > 100 ? 32 : 24} color={isLightCard ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} />
                        </View>
                      )}
                      {featuredSocials.map((s, i) => renderFeaturedSocialIcon(s, i, currentPhotoSize.size))}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.photoSizeHint} onPress={() => setShowPhotoSizeModal(true)}>
                    <Ionicons name="expand" size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.photoSizeHintText}>{currentPhotoSize.label} · Tap to change size</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Change Photo (if already has one) */}
              {profileImage && (
                <TouchableOpacity style={styles.changePhotoBtn} onPress={() => pickImage(false)}>
                  <Ionicons name="camera" size={14} color="#fff" />
                  <Text style={styles.changePhotoBtnText}>Change Photo</Text>
                </TouchableOpacity>
              )}

              {/* Cover size hint */}
              {isCover && (
                <TouchableOpacity style={[styles.photoSizeHint, { alignSelf: 'center', marginTop: 8 }]} onPress={() => setShowPhotoSizeModal(true)}>
                  <Ionicons name="expand" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.photoSizeHintText}>Cover · Tap to change size</Text>
                </TouchableOpacity>
              )}

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
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Social Links</Text>
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
                      <View style={styles.linkActions}>
                        {FEATURED_SOCIAL_IDS.includes(link.platform) && (
                          <TouchableOpacity onPress={() => toggleFeatured(link.id)}>
                            <Text style={{ fontSize: 18, color: link.isFeatured ? '#FFD700' : 'rgba(255,255,255,0.3)' }}>★</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => removeLink(link.id)}>
                          <Ionicons name="trash" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {links.length === 0 && (
                  <TouchableOpacity style={[styles.addLinkEmptyBtn, { borderColor: isLightCard ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }]} onPress={() => setShowAddLinkModal(true)}>
                    <Ionicons name="add" size={20} color={isLightCard ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'} />
                    <Text style={{ color: isLightCard ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)', fontSize: 14 }}>Add social media links</Text>
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
            </LinearGradient>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Bottom Bar: ◀ [color dots] ▶ ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.navArrow, templateIndex === 0 && { opacity: 0.3 }]}
            onPress={() => { if (templateIndex > 0) { setTemplateIndex(templateIndex - 1); setColorIndex(0); } }}
            disabled={templateIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorDotsContainer}>
            {colorSchemes.map((cs, i) => {
              const isFree = cs.isFree;
              const locked = !isFree && !isPremiumUser;
              const isActive = i === colorIndex;
              return (
                <TouchableOpacity
                  key={cs.id}
                  style={[styles.colorDot, isActive && styles.colorDotActive, locked && { opacity: 0.5 }]}
                  onPress={() => { locked ? navigation.navigate('ECardPremiumUpsell', {}) : setColorIndex(i); }}
                >
                  <LinearGradient colors={[cs.primary, cs.secondary]} style={styles.colorDotGradient} />
                  {locked && <Ionicons name="lock-closed" size={8} color="#fff" style={styles.colorDotLock} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.navArrow, templateIndex === TEMPLATES.length - 1 && { opacity: 0.3 }]}
            onPress={() => { if (templateIndex < TEMPLATES.length - 1) { setTemplateIndex(templateIndex + 1); setColorIndex(0); } }}
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
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  continueBtn: { backgroundColor: ACCENT_GREEN, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 20 },
  continueBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Swipe hint
  swipeHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingBottom: 6 },
  swipeHintText: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },

  // Card
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  cardContainer: { borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, position: 'relative' },
  liveCard: { paddingBottom: 24 },

  // Locked
  lockedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 20, gap: 12 },
  lockedText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  unlockBtn: { backgroundColor: ACCENT_GREEN, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  unlockBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Cover photo
  coverPhotoContainer: { width: '100%', height: 220, position: 'relative' },
  coverPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  coverPlaceholderText: { fontSize: 14, marginTop: 8 },

  // Profile photo
  profilePhotoSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 4 },
  photoSizeHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  photoSizeHintText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginTop: 4 },
  changePhotoBtnText: { fontSize: 12, color: '#fff', fontWeight: '500' },

  // Featured social icons
  featuredSocialIcon: { position: 'absolute', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },

  // Card fields
  cardFields: { paddingHorizontal: 20 },
  nameField: { fontSize: 22, fontWeight: '700', textAlign: 'center', paddingVertical: 4 },
  titleField: { fontSize: 14, fontWeight: '500', textAlign: 'center', paddingVertical: 2 },
  bioField: { fontSize: 13, textAlign: 'center', paddingVertical: 4, minHeight: 40 },
  contactFields: { marginTop: 12, gap: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1 },
  contactInput: { flex: 1, fontSize: 13, paddingVertical: 4 },

  // Links
  cardSection: { paddingHorizontal: 20, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 10, backgroundColor: 'rgba(128,128,128,0.1)' },
  linkIconWrapper: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  linkInput: { flex: 1, fontSize: 13 },
  linkActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  colorDotLock: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, textAlign: 'center', textAlignVertical: 'center' },

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
