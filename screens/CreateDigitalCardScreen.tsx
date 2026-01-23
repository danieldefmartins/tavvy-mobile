/**
 * CreateDigitalCardScreen.tsx
 * Universal digital card creation for all users
 * Path: screens/CreateDigitalCardScreen.tsx
 *
 * FEATURES:
 * - Anyone can create a digital business card
 * - Gradient color customization
 * - Profile photo upload
 * - Social links
 * - All sharing methods (NFC, QR, SMS, WhatsApp, Email, AirDrop, etc.)
 * - "Powered by Tavvy" branding
 */

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MY_CARD_STORAGE_KEY = '@tavvy_my_digital_card';

// Gradient presets
const GRADIENT_PRESETS = [
  { id: 'purple-indigo', colors: ['#8B5CF6', '#4F46E5'], name: 'Purple Indigo' },
  { id: 'blue-cyan', colors: ['#3B82F6', '#06B6D4'], name: 'Blue Cyan' },
  { id: 'orange-red', colors: ['#F97316', '#EF4444'], name: 'Orange Red' },
  { id: 'green-teal', colors: ['#22C55E', '#14B8A6'], name: 'Green Teal' },
  { id: 'pink-rose', colors: ['#EC4899', '#F43F5E'], name: 'Pink Rose' },
  { id: 'indigo-purple', colors: ['#6366F1', '#A855F7'], name: 'Indigo Purple' },
  { id: 'teal-green', colors: ['#14B8A6', '#22C55E'], name: 'Teal Green' },
  { id: 'slate-gray', colors: ['#475569', '#1E293B'], name: 'Slate Gray' },
];

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
};

export default function CreateDigitalCardScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const [cardData, setCardData] = useState<CardData>(initialCardData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showGradientPicker, setShowGradientPicker] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'social' | 'preview'>('basic');

  // Load existing card data
  useEffect(() => {
    loadExistingCard();
  }, []);

  const loadExistingCard = async () => {
    setIsLoading(true);
    try {
      // First check local storage
      const localCard = await AsyncStorage.getItem(MY_CARD_STORAGE_KEY);
      if (localCard) {
        setCardData(JSON.parse(localCard));
      }

      // If user is logged in, sync with database
      if (user) {
        const { data, error } = await supabase
          .from('digital_cards')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          const dbCardData: CardData = {
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
          };
          setCardData(dbCardData);
          // Update local storage
          await AsyncStorage.setItem(MY_CARD_STORAGE_KEY, JSON.stringify(dbCardData));
        }
      }
    } catch (error) {
      console.error('Error loading card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile photo.');
      return;
    }

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

  const generateSlug = (name: string, company: string): string => {
    const base = company || name;
    return base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50) + '-' + Math.random().toString(36).substring(2, 8);
  };

  const handleSaveCard = async () => {
    if (!cardData.fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your name.');
      return;
    }

    setIsSaving(true);
    try {
      // Generate slug if new card
      const slug = cardData.slug || generateSlug(cardData.fullName, cardData.company);

      // Save to local storage first
      const cardToSave = { ...cardData, slug };
      await AsyncStorage.setItem(MY_CARD_STORAGE_KEY, JSON.stringify(cardToSave));

      // If user is logged in, save to database
      if (user) {
        const dbData = {
          user_id: user.id,
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
          profile_photo_url: cardData.profilePhotoUri,
          social_instagram: cardData.socialInstagram,
          social_facebook: cardData.socialFacebook,
          social_linkedin: cardData.socialLinkedin,
          social_twitter: cardData.socialTwitter,
          social_tiktok: cardData.socialTiktok,
          is_active: true,
        };

        if (cardData.id) {
          // Update existing
          await supabase
            .from('digital_cards')
            .update(dbData)
            .eq('id', cardData.id);
        } else {
          // Insert new
          const { data, error } = await supabase
            .from('digital_cards')
            .insert(dbData)
            .select()
            .single();

          if (data) {
            setCardData(prev => ({ ...prev, id: data.id, slug: data.slug }));
          }
        }
      }

      setCardData(prev => ({ ...prev, slug }));
      Alert.alert('Success!', 'Your digital card has been saved.', [
        { text: 'View & Share', onPress: () => navigation.navigate('MyDigitalCard', { cardData: cardToSave }) },
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Failed to save your card. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof CardData, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading your card...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {cardData.id ? 'Edit Card' : 'Create Digital Card'}
        </Text>
        <TouchableOpacity 
          onPress={handleSaveCard} 
          style={styles.saveButton}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Section Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme.card }]}>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'basic' && styles.tabActive]}
          onPress={() => setActiveSection('basic')}
        >
          <Text style={[styles.tabText, activeSection === 'basic' && styles.tabTextActive]}>Basic Info</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'social' && styles.tabActive]}
          onPress={() => setActiveSection('social')}
        >
          <Text style={[styles.tabText, activeSection === 'social' && styles.tabTextActive]}>Social</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeSection === 'preview' && styles.tabActive]}
          onPress={() => setActiveSection('preview')}
        >
          <Text style={[styles.tabText, activeSection === 'preview' && styles.tabTextActive]}>Preview</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeSection === 'basic' && (
            <View style={styles.section}>
              {/* Profile Photo */}
              <View style={styles.photoSection}>
                <TouchableOpacity onPress={handlePickImage} style={styles.photoButton}>
                  {cardData.profilePhotoUri ? (
                    <Image source={{ uri: cardData.profilePhotoUri }} style={styles.profilePhoto} />
                  ) : (
                    <LinearGradient
                      colors={cardData.gradientColors}
                      style={styles.photoPlaceholder}
                    >
                      <Ionicons name="camera" size={32} color="#fff" />
                    </LinearGradient>
                  )}
                  <View style={styles.photoEditBadge}>
                    <Ionicons name="pencil" size={12} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={[styles.photoHint, { color: theme.textSecondary }]}>Tap to add photo</Text>
              </View>

              {/* Gradient Picker */}
              <Text style={[styles.inputLabel, { color: theme.text }]}>Card Color</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradientScroll}>
                {GRADIENT_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    onPress={() => setCardData(prev => ({ ...prev, gradientColors: preset.colors as [string, string] }))}
                    style={[
                      styles.gradientOption,
                      cardData.gradientColors[0] === preset.colors[0] && styles.gradientOptionSelected,
                    ]}
                  >
                    <LinearGradient colors={preset.colors} style={styles.gradientPreview} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Basic Fields */}
              <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                value={cardData.fullName}
                onChangeText={(v) => updateField('fullName', v)}
                placeholder="John Smith"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Title / Role</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                value={cardData.title}
                onChangeText={(v) => updateField('title', v)}
                placeholder="Software Engineer"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Company / Business</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                value={cardData.company}
                onChangeText={(v) => updateField('company', v)}
                placeholder="Acme Inc."
                placeholderTextColor={theme.textSecondary}
              />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>City</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                    value={cardData.city}
                    onChangeText={(v) => updateField('city', v)}
                    placeholder="Orlando"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>State</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                    value={cardData.state}
                    onChangeText={(v) => updateField('state', v)}
                    placeholder="FL"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: theme.text }]}>Phone</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                value={cardData.phone}
                onChangeText={(v) => updateField('phone', v)}
                placeholder="(555) 123-4567"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                value={cardData.email}
                onChangeText={(v) => updateField('email', v)}
                placeholder="john@example.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Website</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                value={cardData.website}
                onChangeText={(v) => updateField('website', v)}
                placeholder="www.example.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
              />
            </View>
          )}

          {activeSection === 'social' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Social Media Links</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Add your social media profiles (optional)
              </Text>

              <View style={styles.socialInput}>
                <Ionicons name="logo-instagram" size={24} color="#E4405F" style={styles.socialIcon} />
                <TextInput
                  style={[styles.socialField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  value={cardData.socialInstagram}
                  onChangeText={(v) => updateField('socialInstagram', v)}
                  placeholder="Instagram username"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.socialInput}>
                <Ionicons name="logo-facebook" size={24} color="#1877F2" style={styles.socialIcon} />
                <TextInput
                  style={[styles.socialField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  value={cardData.socialFacebook}
                  onChangeText={(v) => updateField('socialFacebook', v)}
                  placeholder="Facebook profile URL"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.socialInput}>
                <Ionicons name="logo-linkedin" size={24} color="#0A66C2" style={styles.socialIcon} />
                <TextInput
                  style={[styles.socialField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  value={cardData.socialLinkedin}
                  onChangeText={(v) => updateField('socialLinkedin', v)}
                  placeholder="LinkedIn profile URL"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.socialInput}>
                <Ionicons name="logo-twitter" size={24} color="#1DA1F2" style={styles.socialIcon} />
                <TextInput
                  style={[styles.socialField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  value={cardData.socialTwitter}
                  onChangeText={(v) => updateField('socialTwitter', v)}
                  placeholder="Twitter/X username"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.socialInput}>
                <Ionicons name="logo-tiktok" size={24} color="#000" style={styles.socialIcon} />
                <TextInput
                  style={[styles.socialField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  value={cardData.socialTiktok}
                  onChangeText={(v) => updateField('socialTiktok', v)}
                  placeholder="TikTok username"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {activeSection === 'preview' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Card Preview</Text>
              
              {/* Card Preview */}
              <View style={styles.previewContainer}>
                <LinearGradient
                  colors={cardData.gradientColors}
                  style={styles.previewCard}
                >
                  {/* Profile Photo */}
                  <View style={styles.previewPhotoContainer}>
                    {cardData.profilePhotoUri ? (
                      <Image source={{ uri: cardData.profilePhotoUri }} style={styles.previewPhoto} />
                    ) : (
                      <View style={styles.previewPhotoPlaceholder}>
                        <Ionicons name="person" size={40} color="#fff" />
                      </View>
                    )}
                  </View>

                  {/* Name & Title */}
                  <Text style={styles.previewName}>{cardData.fullName || 'Your Name'}</Text>
                  {cardData.title && <Text style={styles.previewTitle}>{cardData.title}</Text>}
                  {cardData.company && <Text style={styles.previewCompany}>{cardData.company}</Text>}
                  
                  {/* Location */}
                  {(cardData.city || cardData.state) && (
                    <View style={styles.previewLocation}>
                      <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.previewLocationText}>
                        {[cardData.city, cardData.state].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  )}

                  {/* Contact Buttons */}
                  <View style={styles.previewButtons}>
                    {cardData.phone && (
                      <View style={styles.previewButton}>
                        <Ionicons name="call" size={16} color="#fff" />
                        <Text style={styles.previewButtonText}>Call</Text>
                      </View>
                    )}
                    {cardData.email && (
                      <View style={styles.previewButton}>
                        <Ionicons name="mail" size={16} color="#fff" />
                        <Text style={styles.previewButtonText}>Email</Text>
                      </View>
                    )}
                    {cardData.website && (
                      <View style={styles.previewButton}>
                        <Ionicons name="globe" size={16} color="#fff" />
                        <Text style={styles.previewButtonText}>Website</Text>
                      </View>
                    )}
                  </View>

                  {/* Powered by Tavvy */}
                  <View style={styles.poweredBy}>
                    <Text style={styles.poweredByText}>Powered by Tavvy</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleSaveCard}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1']}
                  style={styles.primaryButtonGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="save" size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Save & Share</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {cardData.slug && (
                <TouchableOpacity 
                  style={[styles.secondaryButton, { borderColor: theme.border }]}
                  onPress={() => navigation.navigate('MyDigitalCard', { cardData })}
                >
                  <Ionicons name="share" size={20} color="#8B5CF6" />
                  <Text style={[styles.secondaryButtonText, { color: '#8B5CF6' }]}>View & Share Card</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoButton: {
    position: 'relative',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8B5CF6',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoHint: {
    marginTop: 8,
    fontSize: 14,
  },
  gradientScroll: {
    marginBottom: 20,
  },
  gradientOption: {
    marginRight: 12,
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gradientOptionSelected: {
    borderColor: '#8B5CF6',
  },
  gradientPreview: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  socialInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  socialIcon: {
    marginRight: 12,
  },
  socialField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  previewCard: {
    width: SCREEN_WIDTH - 56,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  previewPhotoContainer: {
    marginBottom: 20,
  },
  previewPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  previewPhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  previewName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginTop: 6,
    textAlign: 'center',
  },
  previewCompany: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textAlign: 'center',
  },
  previewLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  previewLocationText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 6,
  },
  previewButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 14,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  previewButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  poweredBy: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    width: '100%',
    alignItems: 'center',
  },
  poweredByText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
