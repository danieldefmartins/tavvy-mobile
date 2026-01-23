/**
 * CreateDigitalCardScreen.tsx
 * Universal digital card creation with templates and step-by-step wizard
 * Path: screens/CreateDigitalCardScreen.tsx
 *
 * FEATURES:
 * - Template selection for quick start
 * - Step-by-step wizard flow (not confusing tabs)
 * - Live card preview
 * - Custom links (Linktree-style)
 * - Social links
 * - Gradient customization
 * - "Powered by Tavvy" branding
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Image,
  KeyboardAvoidingView,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { decode } from 'base64-arraybuffer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MY_CARD_STORAGE_KEY = '@tavvy_my_digital_card';

// Card Templates
const CARD_TEMPLATES = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean business card',
    icon: 'briefcase-outline',
    gradient: ['#1E293B', '#334155'],
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Social media focused',
    icon: 'sparkles-outline',
    gradient: ['#8B5CF6', '#EC4899'],
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    description: 'Business + social',
    icon: 'rocket-outline',
    gradient: ['#3B82F6', '#06B6D4'],
  },
  {
    id: 'personal',
    name: 'Personal',
    description: 'Simple & friendly',
    icon: 'person-outline',
    gradient: ['#22C55E', '#14B8A6'],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Start from scratch',
    icon: 'create-outline',
    gradient: ['#8B5CF6', '#4F46E5'],
  },
];

// Gradient presets
const GRADIENT_PRESETS = [
  { id: 'purple-indigo', colors: ['#8B5CF6', '#4F46E5'], name: 'Purple' },
  { id: 'blue-cyan', colors: ['#3B82F6', '#06B6D4'], name: 'Ocean' },
  { id: 'orange-red', colors: ['#F97316', '#EF4444'], name: 'Sunset' },
  { id: 'green-teal', colors: ['#22C55E', '#14B8A6'], name: 'Forest' },
  { id: 'pink-rose', colors: ['#EC4899', '#F43F5E'], name: 'Rose' },
  { id: 'slate-dark', colors: ['#1E293B', '#334155'], name: 'Dark' },
  { id: 'indigo-purple', colors: ['#6366F1', '#A855F7'], name: 'Violet' },
  { id: 'teal-green', colors: ['#14B8A6', '#22C55E'], name: 'Mint' },
];

// Link icons
const LINK_ICONS = [
  { id: 'globe', name: 'Website', icon: 'globe-outline' },
  { id: 'cart', name: 'Shop', icon: 'cart-outline' },
  { id: 'calendar', name: 'Booking', icon: 'calendar-outline' },
  { id: 'document', name: 'Portfolio', icon: 'document-text-outline' },
  { id: 'play', name: 'Video', icon: 'play-circle-outline' },
  { id: 'music', name: 'Music', icon: 'musical-notes-outline' },
  { id: 'gift', name: 'Merch', icon: 'gift-outline' },
  { id: 'link', name: 'Other', icon: 'link-outline' },
];

interface CardLink {
  id?: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface CardData {
  id?: string;
  slug?: string;
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  state: string;
  gradientColors: [string, string];
  profilePhotoUri: string | null;
  socialInstagram: string;
  socialFacebook: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialTiktok: string;
  links: CardLink[];
}

const initialCardData: CardData = {
  fullName: '',
  title: '',
  company: '',
  phone: '',
  email: '',
  website: '',
  city: '',
  state: '',
  gradientColors: ['#8B5CF6', '#4F46E5'],
  profilePhotoUri: null,
  socialInstagram: '',
  socialFacebook: '',
  socialLinkedin: '',
  socialTwitter: '',
  socialTiktok: '',
  links: [],
};

type Step = 'template' | 'info' | 'social' | 'links' | 'style' | 'preview';

export default function CreateDigitalCardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  
  // State
  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [cardData, setCardData] = useState<CardData>(initialCardData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkIcon, setLinkIcon] = useState('link');

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load existing card if editing
  useEffect(() => {
    if (route.params?.cardData) {
      setCardData(route.params.cardData);
      setIsEditing(true);
      setCurrentStep('info');
    } else {
      loadExistingCard();
    }
  }, []);

  const loadExistingCard = async () => {
    setIsLoading(true);
    try {
      if (user) {
        const { data, error } = await supabase
          .from('digital_cards')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          // Load links
          const { data: linksData } = await supabase
            .from('card_links')
            .select('*')
            .eq('card_id', data.id)
            .order('sort_order', { ascending: true });

          const loadedCard: CardData = {
            id: data.id,
            slug: data.slug,
            fullName: data.full_name || '',
            title: data.title || '',
            company: data.company || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            city: data.city || '',
            state: data.state || '',
            gradientColors: [data.gradient_color_1 || '#8B5CF6', data.gradient_color_2 || '#4F46E5'],
            profilePhotoUri: data.profile_photo_url || null,
            socialInstagram: data.social_instagram || '',
            socialFacebook: data.social_facebook || '',
            socialLinkedin: data.social_linkedin || '',
            socialTwitter: data.social_twitter || '',
            socialTiktok: data.social_tiktok || '',
            links: linksData?.map(l => ({
              id: l.id,
              title: l.title,
              url: l.url,
              icon: l.icon || 'link',
              sort_order: l.sort_order,
              is_active: l.is_active,
            })) || [],
          };
          setCardData(loadedCard);
          setIsEditing(true);
          setCurrentStep('info');
        }
      }
    } catch (error) {
      console.error('Error loading card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(callback, 150);
  };

  const selectTemplate = (templateId: string) => {
    const template = CARD_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setCardData(prev => ({
        ...prev,
        gradientColors: template.gradient as [string, string],
      }));
      animateTransition(() => setCurrentStep('info'));
    }
  };

  const goToStep = (step: Step) => {
    animateTransition(() => setCurrentStep(step));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCardData(prev => ({ ...prev, profilePhotoUri: result.assets[0].uri }));
    }
  };

  const addOrUpdateLink = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) {
      Alert.alert('Error', 'Please enter both title and URL');
      return;
    }

    let url = linkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const newLink: CardLink = {
      title: linkTitle.trim(),
      url: url,
      icon: linkIcon,
      sort_order: editingLinkIndex !== null ? cardData.links[editingLinkIndex].sort_order : cardData.links.length,
      is_active: true,
    };

    if (editingLinkIndex !== null) {
      const updatedLinks = [...cardData.links];
      updatedLinks[editingLinkIndex] = { ...updatedLinks[editingLinkIndex], ...newLink };
      setCardData(prev => ({ ...prev, links: updatedLinks }));
    } else {
      setCardData(prev => ({ ...prev, links: [...prev.links, newLink] }));
    }

    closeLinkModal();
  };

  const openLinkModal = (index?: number) => {
    if (index !== undefined) {
      const link = cardData.links[index];
      setLinkTitle(link.title);
      setLinkUrl(link.url);
      setLinkIcon(link.icon);
      setEditingLinkIndex(index);
    } else {
      setLinkTitle('');
      setLinkUrl('');
      setLinkIcon('link');
      setEditingLinkIndex(null);
    }
    setShowLinkModal(true);
  };

  const closeLinkModal = () => {
    setShowLinkModal(false);
    setLinkTitle('');
    setLinkUrl('');
    setLinkIcon('link');
    setEditingLinkIndex(null);
  };

  const deleteLink = (index: number) => {
    Alert.alert('Delete Link', 'Are you sure you want to delete this link?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedLinks = cardData.links.filter((_, i) => i !== index);
          setCardData(prev => ({ ...prev, links: updatedLinks }));
        },
      },
    ]);
  };

  const generateSlug = (name: string): string => {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const random = Math.random().toString(36).substring(2, 8);
    return `${base}-${random}`;
  };

  const uploadProfilePhoto = async (uri: string): Promise<string | null> => {
    try {
      if (!user) return uri; // Return local URI if no user

      console.log('[Upload] Starting photo upload from:', uri);

      // Get file info first
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('[Upload] File info:', fileInfo);

      if (!fileInfo.exists) {
        console.error('[Upload] File does not exist at:', uri);
        return uri;
      }

      // Read the file as base64 using expo-file-system
      const base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('[Upload] Read file, base64 length:', base64Data.length);

      if (!base64Data || base64Data.length === 0) {
        console.error('[Upload] Base64 data is empty!');
        return uri;
      }

      // Convert base64 to ArrayBuffer using decode
      const arrayBuffer = decode(base64Data);

      console.log('[Upload] Converted to ArrayBuffer, size:', arrayBuffer.byteLength);

      if (arrayBuffer.byteLength === 0) {
        console.error('[Upload] ArrayBuffer is empty! Trying alternative method...');
        
        // Alternative: Upload using base64 string directly
        const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${user.id}/card-photo-${Date.now()}.${fileExt}`;
        const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
        
        // Create a Blob from base64
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        console.log('[Upload] Created Uint8Array, size:', byteArray.length);
        
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, byteArray.buffer, {
            contentType,
            upsert: true,
          });

        if (error) {
          console.error('[Upload] Alternative upload error:', error);
          return uri;
        }

        console.log('[Upload] Alternative upload successful:', data);

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        return urlData.publicUrl;
      }

      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/card-photo-${Date.now()}.${fileExt}`;

      // Upload using ArrayBuffer
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true,
        });

      if (error) {
        console.error('[Upload] Upload error:', error);
        return uri;
      }

      console.log('[Upload] Upload successful:', data);

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('[Upload] Public URL:', urlData.publicUrl);

      return urlData.publicUrl;
    } catch (error) {
      console.error('[Upload] Error uploading photo:', error);
      return uri;
    }
  };

  const saveCard = async () => {
    if (!cardData.fullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsSaving(true);
    try {
      const slug = cardData.slug || generateSlug(cardData.fullName);
      
      // Upload profile photo if it's a local file
      let profilePhotoUrl = cardData.profilePhotoUri;
      if (profilePhotoUrl && profilePhotoUrl.startsWith('file://')) {
        profilePhotoUrl = await uploadProfilePhoto(profilePhotoUrl);
      }

      // Prepare card data for database
      const dbCardData = {
        user_id: user?.id || null,
        slug: slug,
        full_name: cardData.fullName,
        title: cardData.title,
        company: cardData.company,
        phone: cardData.phone,
        email: cardData.email,
        website: cardData.website,
        city: cardData.city,
        state: cardData.state,
        gradient_color_1: cardData.gradientColors[0],
        gradient_color_2: cardData.gradientColors[1],
        profile_photo_url: profilePhotoUrl,
        social_instagram: cardData.socialInstagram,
        social_facebook: cardData.socialFacebook,
        social_linkedin: cardData.socialLinkedin,
        social_twitter: cardData.socialTwitter,
        social_tiktok: cardData.socialTiktok,
        is_active: true,
      };

      let cardId = cardData.id;

      if (cardId) {
        // Update existing card
        const { error } = await supabase
          .from('digital_cards')
          .update(dbCardData)
          .eq('id', cardId);
        if (error) throw error;
      } else {
        // Create new card
        const { data, error } = await supabase
          .from('digital_cards')
          .insert(dbCardData)
          .select()
          .single();
        if (error) throw error;
        cardId = data.id;
      }

      // Save links
      if (cardId) {
        // Delete existing links
        await supabase.from('card_links').delete().eq('card_id', cardId);
        
        // Insert new links if any
        if (cardData.links.length > 0) {
          const linksToInsert = cardData.links.map((link, index) => ({
            card_id: cardId,
            title: link.title,
            url: link.url,
            icon: link.icon,
            sort_order: index,
            is_active: true,
          }));
          
          const { error: linksError } = await supabase.from('card_links').insert(linksToInsert);
          if (linksError) console.error('Error saving links:', linksError);
        }
      }

      // Save to local storage
      const savedCard = { ...cardData, id: cardId, slug, profilePhotoUri: profilePhotoUrl };
      await AsyncStorage.setItem(MY_CARD_STORAGE_KEY, JSON.stringify(savedCard));

      Alert.alert('Success', 'Your card has been saved!', [
        {
          text: 'View Card',
          onPress: () => navigation.navigate('MyDigitalCard', { cardData: savedCard }),
        },
      ]);
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Failed to save card. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps: { key: Step; label: string }[] = [
      { key: 'info', label: 'Info' },
      { key: 'social', label: 'Social' },
      { key: 'links', label: 'Links' },
      { key: 'style', label: 'Style' },
      { key: 'preview', label: 'Preview' },
    ];

    if (currentStep === 'template') return null;

    return (
      <View style={styles.stepIndicator}>
        {steps.map((step, index) => {
          const isActive = step.key === currentStep;
          const stepIndex = steps.findIndex(s => s.key === currentStep);
          const isPast = index < stepIndex;
          
          return (
            <TouchableOpacity
              key={step.key}
              style={styles.stepItem}
              onPress={() => goToStep(step.key)}
            >
              <View style={[
                styles.stepDot,
                isActive && styles.stepDotActive,
                isPast && styles.stepDotPast,
              ]}>
                {isPast ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Text style={[styles.stepNumber, (isActive || isPast) && styles.stepNumberActive]}>
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                {step.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render mini card preview
  const renderMiniPreview = () => {
    if (currentStep === 'template' || currentStep === 'preview') return null;

    return (
      <TouchableOpacity 
        style={styles.miniPreviewContainer}
        onPress={() => goToStep('preview')}
      >
        <LinearGradient
          colors={cardData.gradientColors}
          style={styles.miniPreview}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {cardData.profilePhotoUri ? (
            <Image source={{ uri: cardData.profilePhotoUri }} style={styles.miniAvatar} />
          ) : (
            <View style={styles.miniAvatarPlaceholder}>
              <Ionicons name="person" size={16} color="rgba(255,255,255,0.5)" />
            </View>
          )}
          <Text style={styles.miniName} numberOfLines={1}>
            {cardData.fullName || 'Your Name'}
          </Text>
        </LinearGradient>
        <Text style={styles.miniPreviewHint}>Tap to preview</Text>
      </TouchableOpacity>
    );
  };

  // Render template selection
  const renderTemplateStep = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Choose a Template</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Pick a style that fits you best
      </Text>

      <View style={styles.templateGrid}>
        {CARD_TEMPLATES.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => selectTemplate(template.id)}
          >
            <LinearGradient
              colors={template.gradient}
              style={styles.templateGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={template.icon as any} size={32} color="#fff" />
            </LinearGradient>
            <Text style={[styles.templateName, { color: theme.text }]}>{template.name}</Text>
            <Text style={[styles.templateDesc, { color: theme.textSecondary }]}>{template.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render info step
  const renderInfoStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Basic Information</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Tell people who you are
      </Text>

      {/* Profile Photo */}
      <TouchableOpacity style={styles.photoSection} onPress={pickImage}>
        {cardData.profilePhotoUri ? (
          <Image source={{ uri: cardData.profilePhotoUri }} style={styles.profilePhoto} />
        ) : (
          <LinearGradient
            colors={cardData.gradientColors}
            style={styles.photoPlaceholder}
          >
            <Ionicons name="camera" size={32} color="#fff" />
            <Text style={styles.photoPlaceholderText}>Add Photo</Text>
          </LinearGradient>
        )}
      </TouchableOpacity>

      {/* Input Fields */}
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="John Doe"
          placeholderTextColor={theme.textSecondary}
          value={cardData.fullName}
          onChangeText={(text) => setCardData(prev => ({ ...prev, fullName: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>Title / Role</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Software Engineer"
          placeholderTextColor={theme.textSecondary}
          value={cardData.title}
          onChangeText={(text) => setCardData(prev => ({ ...prev, title: text }))}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>Company</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="Acme Inc."
          placeholderTextColor={theme.textSecondary}
          value={cardData.company}
          onChangeText={(text) => setCardData(prev => ({ ...prev, company: text }))}
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Phone</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="+1 234 567 8900"
            placeholderTextColor={theme.textSecondary}
            value={cardData.phone}
            onChangeText={(text) => setCardData(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="john@example.com"
            placeholderTextColor={theme.textSecondary}
            value={cardData.email}
            onChangeText={(text) => setCardData(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.text }]}>Website</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          placeholder="www.yourwebsite.com"
          placeholderTextColor={theme.textSecondary}
          value={cardData.website}
          onChangeText={(text) => setCardData(prev => ({ ...prev, website: text }))}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>City</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="Miami"
            placeholderTextColor={theme.textSecondary}
            value={cardData.city}
            onChangeText={(text) => setCardData(prev => ({ ...prev, city: text }))}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.inputLabel, { color: theme.text }]}>State</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            placeholder="FL"
            placeholderTextColor={theme.textSecondary}
            value={cardData.state}
            onChangeText={(text) => setCardData(prev => ({ ...prev, state: text }))}
          />
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // Render social step
  const renderSocialStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Social Media</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Connect your social profiles
      </Text>

      {[
        { key: 'socialInstagram', label: 'Instagram', icon: 'logo-instagram', placeholder: '@username', color: '#E4405F' },
        { key: 'socialTiktok', label: 'TikTok', icon: 'logo-tiktok', placeholder: '@username', color: '#000000' },
        { key: 'socialTwitter', label: 'X (Twitter)', icon: 'logo-twitter', placeholder: '@username', color: '#1DA1F2' },
        { key: 'socialLinkedin', label: 'LinkedIn', icon: 'logo-linkedin', placeholder: 'linkedin.com/in/username', color: '#0A66C2' },
        { key: 'socialFacebook', label: 'Facebook', icon: 'logo-facebook', placeholder: 'facebook.com/username', color: '#1877F2' },
      ].map((social) => (
        <View key={social.key} style={styles.socialInputGroup}>
          <View style={[styles.socialIconContainer, { backgroundColor: social.color + '15' }]}>
            <Ionicons name={social.icon as any} size={24} color={social.color} />
          </View>
          <View style={styles.socialInputWrapper}>
            <Text style={[styles.socialLabel, { color: theme.text }]}>{social.label}</Text>
            <TextInput
              style={[styles.socialInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
              placeholder={social.placeholder}
              placeholderTextColor={theme.textSecondary}
              value={cardData[social.key as keyof CardData] as string}
              onChangeText={(text) => setCardData(prev => ({ ...prev, [social.key]: text }))}
              autoCapitalize="none"
            />
          </View>
        </View>
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // Render links step
  const renderLinksStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Custom Links</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Add links to your portfolio, shop, booking, etc.
      </Text>

      {/* Existing Links */}
      {cardData.links.map((link, index) => (
        <View key={index} style={[styles.linkItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.linkIconContainer, { backgroundColor: cardData.gradientColors[0] + '20' }]}>
            <Ionicons 
              name={LINK_ICONS.find(i => i.id === link.icon)?.icon as any || 'link-outline'} 
              size={20} 
              color={cardData.gradientColors[0]} 
            />
          </View>
          <View style={styles.linkContent}>
            <Text style={[styles.linkTitle, { color: theme.text }]}>{link.title}</Text>
            <Text style={[styles.linkUrl, { color: theme.textSecondary }]} numberOfLines={1}>{link.url}</Text>
          </View>
          <TouchableOpacity onPress={() => openLinkModal(index)} style={styles.linkAction}>
            <Ionicons name="pencil" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteLink(index)} style={styles.linkAction}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Link Button */}
      <TouchableOpacity 
        style={[styles.addLinkButton, { borderColor: cardData.gradientColors[0] }]}
        onPress={() => openLinkModal()}
      >
        <Ionicons name="add-circle-outline" size={24} color={cardData.gradientColors[0]} />
        <Text style={[styles.addLinkText, { color: cardData.gradientColors[0] }]}>Add Link</Text>
      </TouchableOpacity>

      {/* Info box */}
      <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="information-circle-outline" size={20} color={theme.textSecondary} />
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Links will appear as buttons on your card. Add your portfolio, shop, booking page, or any other important links.
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // Render style step
  const renderStyleStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Card Style</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        Choose your card's color theme
      </Text>

      <View style={styles.gradientGrid}>
        {GRADIENT_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.gradientOption,
              cardData.gradientColors[0] === preset.colors[0] && styles.gradientOptionSelected,
            ]}
            onPress={() => setCardData(prev => ({ ...prev, gradientColors: preset.colors as [string, string] }))}
          >
            <LinearGradient
              colors={preset.colors}
              style={styles.gradientPreview}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={[styles.gradientName, { color: theme.text }]}>{preset.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // Render preview step
  const renderPreviewStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false} contentContainerStyle={styles.previewContainer}>
      <Text style={[styles.stepTitle, { color: theme.text }]}>Preview Your Card</Text>
      <Text style={[styles.stepSubtitle, { color: theme.textSecondary }]}>
        This is how your card will look
      </Text>

      {/* Full Card Preview */}
      <View style={styles.fullPreviewWrapper}>
        <LinearGradient
          colors={cardData.gradientColors}
          style={styles.fullPreview}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Avatar */}
          {cardData.profilePhotoUri ? (
            <Image source={{ uri: cardData.profilePhotoUri }} style={styles.previewAvatar} />
          ) : (
            <View style={styles.previewAvatarPlaceholder}>
              <Ionicons name="person" size={40} color="rgba(255,255,255,0.5)" />
            </View>
          )}

          {/* Name & Title */}
          <Text style={styles.previewName}>{cardData.fullName || 'Your Name'}</Text>
          {cardData.title && <Text style={styles.previewTitle}>{cardData.title}</Text>}
          {cardData.company && <Text style={styles.previewCompany}>{cardData.company}</Text>}

          {/* Location */}
          {(cardData.city || cardData.state) && (
            <View style={styles.previewLocation}>
              <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.previewLocationText}>
                {[cardData.city, cardData.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {/* Contact Buttons */}
          <View style={styles.previewActions}>
            {cardData.phone && (
              <View style={styles.previewActionButton}>
                <Ionicons name="call" size={18} color="#fff" />
                <Text style={styles.previewActionText}>Call</Text>
              </View>
            )}
            {cardData.email && (
              <View style={styles.previewActionButton}>
                <Ionicons name="mail" size={18} color="#fff" />
                <Text style={styles.previewActionText}>Email</Text>
              </View>
            )}
            {cardData.website && (
              <View style={styles.previewActionButton}>
                <Ionicons name="globe" size={18} color="#fff" />
                <Text style={styles.previewActionText}>Website</Text>
              </View>
            )}
          </View>

          {/* Social Icons */}
          {(cardData.socialInstagram || cardData.socialTiktok || cardData.socialTwitter || cardData.socialLinkedin || cardData.socialFacebook) && (
            <View style={styles.previewSocials}>
              {cardData.socialInstagram && <Ionicons name="logo-instagram" size={20} color="#fff" style={styles.previewSocialIcon} />}
              {cardData.socialTiktok && <Ionicons name="logo-tiktok" size={20} color="#fff" style={styles.previewSocialIcon} />}
              {cardData.socialTwitter && <Ionicons name="logo-twitter" size={20} color="#fff" style={styles.previewSocialIcon} />}
              {cardData.socialLinkedin && <Ionicons name="logo-linkedin" size={20} color="#fff" style={styles.previewSocialIcon} />}
              {cardData.socialFacebook && <Ionicons name="logo-facebook" size={20} color="#fff" style={styles.previewSocialIcon} />}
            </View>
          )}

          {/* Links */}
          {cardData.links.length > 0 && (
            <View style={styles.previewLinks}>
              {cardData.links.slice(0, 3).map((link, index) => (
                <View key={index} style={styles.previewLinkButton}>
                  <Ionicons 
                    name={LINK_ICONS.find(i => i.id === link.icon)?.icon as any || 'link-outline'} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={styles.previewLinkText}>{link.title}</Text>
                </View>
              ))}
              {cardData.links.length > 3 && (
                <Text style={styles.previewMoreLinks}>+{cardData.links.length - 3} more</Text>
              )}
            </View>
          )}

          {/* Powered by Tavvy */}
          <Text style={styles.previewPoweredBy}>Powered by Tavvy</Text>
        </LinearGradient>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );

  // Render link modal
  const renderLinkModal = () => (
    <Modal visible={showLinkModal} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={closeLinkModal}
        />
        <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingLinkIndex !== null ? 'Edit Link' : 'Add Link'}
            </Text>
            <TouchableOpacity onPress={closeLinkModal}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Link Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="My Portfolio"
                placeholderTextColor={theme.textSecondary}
                value={linkTitle}
                onChangeText={setLinkTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>URL</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="https://example.com"
                placeholderTextColor={theme.textSecondary}
                value={linkUrl}
                onChangeText={setLinkUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconPicker}>
                {LINK_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon.id}
                    style={[
                      styles.iconOption,
                      { backgroundColor: theme.card, borderColor: theme.border },
                      linkIcon === icon.id && { borderColor: cardData.gradientColors[0], backgroundColor: cardData.gradientColors[0] + '20' },
                    ]}
                    onPress={() => setLinkIcon(icon.id)}
                  >
                    <Ionicons name={icon.icon as any} size={24} color={linkIcon === icon.id ? cardData.gradientColors[0] : theme.text} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity style={[styles.modalButton, { backgroundColor: cardData.gradientColors[0] }]} onPress={addOrUpdateLink}>
              <Text style={styles.modalButtonText}>
                {editingLinkIndex !== null ? 'Update Link' : 'Add Link'}
              </Text>
            </TouchableOpacity>
            
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  // Render navigation buttons
  const renderNavButtons = () => {
    if (currentStep === 'template') return null;

    const steps: Step[] = ['info', 'social', 'links', 'style', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === steps.length - 1;

    return (
      <View style={[styles.navButtons, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        {!isFirst && (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonSecondary, { borderColor: theme.border }]}
            onPress={() => goToStep(steps[currentIndex - 1])}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
            <Text style={[styles.navButtonText, { color: theme.text }]}>Back</Text>
          </TouchableOpacity>
        )}
        
        {isLast ? (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary, { backgroundColor: cardData.gradientColors[0] }]}
            onPress={saveCard}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={[styles.navButtonText, { color: '#fff' }]}>Save Card</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonPrimary, { backgroundColor: cardData.gradientColors[0] }]}
            onPress={() => goToStep(steps[currentIndex + 1])}
          >
            <Text style={[styles.navButtonText, { color: '#fff' }]}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={cardData.gradientColors[0]} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading your card...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {isEditing ? 'Edit Card' : 'Create Card'}
        </Text>
        {renderMiniPreview()}
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={100}
      >
        <Animated.View style={[styles.animatedContent, { opacity: fadeAnim }]}>
          {currentStep === 'template' && renderTemplateStep()}
          {currentStep === 'info' && renderInfoStep()}
          {currentStep === 'social' && renderSocialStep()}
          {currentStep === 'links' && renderLinksStep()}
          {currentStep === 'style' && renderStyleStep()}
          {currentStep === 'preview' && renderPreviewStep()}
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Navigation Buttons */}
      {renderNavButtons()}

      {/* Link Modal */}
      {renderLinkModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  miniPreviewContainer: {
    marginLeft: 'auto',
    alignItems: 'center',
  },
  miniPreview: {
    width: 60,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 6,
  },
  miniAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
  },
  miniAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  miniName: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '600',
    maxWidth: 30,
  },
  miniPreviewHint: {
    fontSize: 9,
    color: '#8B5CF6',
    marginTop: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepDotActive: {
    backgroundColor: '#8B5CF6',
  },
  stepDotPast: {
    backgroundColor: '#22C55E',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  stepLabelActive: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  animatedContent: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  // Template styles
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  templateCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    marginBottom: 16,
    alignItems: 'center',
  },
  templateGradient: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
  },
  templateDesc: {
    fontSize: 12,
  },
  // Photo styles
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  // Input styles
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
  },
  // Social styles
  socialInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  socialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  socialInputWrapper: {
    flex: 1,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  socialInput: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  // Links styles
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  linkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkUrl: {
    fontSize: 12,
    marginTop: 2,
  },
  linkAction: {
    padding: 8,
  },
  addLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addLinkText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 8,
    lineHeight: 18,
  },
  // Gradient styles
  gradientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gradientOption: {
    width: (SCREEN_WIDTH - 60) / 4,
    alignItems: 'center',
    marginBottom: 16,
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradientOptionSelected: {
    borderColor: '#8B5CF6',
  },
  gradientPreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
  gradientName: {
    fontSize: 10,
    textAlign: 'center',
  },
  // Preview styles
  previewContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  fullPreviewWrapper: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  fullPreview: {
    padding: 24,
    alignItems: 'center',
    minHeight: 400,
  },
  previewAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  previewAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  previewTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  previewCompany: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  previewLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  previewLocationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
  previewActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  previewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  previewActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  previewSocials: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  previewSocialIcon: {
    opacity: 0.9,
  },
  previewLinks: {
    width: '100%',
    marginTop: 20,
  },
  previewLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  previewLinkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  previewMoreLinks: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  previewPoweredBy: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  iconPicker: {
    flexDirection: 'row',
    marginTop: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
  },
  modalButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Navigation buttons
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
  },
  navButtonPrimary: {
    marginLeft: 'auto',
  },
  navButtonSecondary: {
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 6,
  },
});
