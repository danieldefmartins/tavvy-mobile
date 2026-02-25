/**
 * ECardNewScreen -- 3-step creation wizard: Type -> Template -> Quick Setup -> Create
 *
 * Ported from web: pages/app/ecard/new.tsx
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideInLeft,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import TypePicker from '../../components/ecard/wizard/TypePicker';
import TemplateGallery from '../../components/ecard/wizard/TemplateGallery';
import QuickSetup from '../../components/ecard/wizard/QuickSetup';

const ACCENT = '#00C853';

type WizardStep = 'type' | 'template' | 'setup';

export default function ECardNewScreen() {
  const navigation = useNavigation<any>();
  const { user, isPro } = useAuth();
  const { isDark } = useThemeContext();

  // ── Wizard state ──────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>('type');
  const [cardType, setCardType] = useState('');
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [countryTemplate, setCountryTemplate] = useState<string | undefined>();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedColorSchemeId, setSelectedColorSchemeId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Track navigation direction for animation
  const directionRef = useRef<'forward' | 'back'>('forward');

  // ── Theme colors ──────────────────────────────────────────
  const bg = isDark ? '#000000' : '#FAFAFA';
  const headerBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // ── Step tracking for indicator ───────────────────────────
  const stepIndex = step === 'type' ? 0 : step === 'template' ? 1 : 2;

  // ── Step 1: Type selection ────────────────────────────────
  const handleTypeSelect = (type: string, country?: string, template?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCardType(type);
    setCountryCode(country);
    setCountryTemplate(template);
    if (template) {
      setSelectedTemplateId(template);
    }
    directionRef.current = 'forward';
    setStep('template');
  };

  // ── Step 2: Template selection ────────────────────────────
  const handleTemplateSelect = (templateId: string, colorSchemeId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedColorSchemeId(colorSchemeId);
  };

  const handleContinueToSetup = () => {
    if (selectedTemplateId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      directionRef.current = 'forward';
      setStep('setup');
    }
  };

  // ── Step 3: Create card ───────────────────────────────────
  const handleCreate = async (data: {
    name: string;
    title: string;
    photoUri?: string;
    primaryColor?: string;
  }) => {
    if (!user || creating) return;
    setCreating(true);

    try {
      // Upload profile photo if provided
      let photoUrl: string | undefined;
      if (data.photoUri) {
        photoUrl = await uploadProfilePhoto(user.id, data.photoUri);
      }

      // Generate slug from name
      const slug = generateSlug(data.name);

      // Build insert payload — only include defined values
      const insertPayload: Record<string, any> = {
        user_id: user.id,
        full_name: data.name.trim(),
        slug,
        template_id: selectedTemplateId || 'basic',
        gradient_color_1: data.primaryColor || '#3B82F6',
        gradient_color_2: data.primaryColor || '#3B82F6',
        card_type: cardType || 'business',
        is_published: false,
        is_active: true,
      };
      if (data.title) insertPayload.title = data.title.trim();
      if (selectedColorSchemeId) insertPayload.color_scheme_id = selectedColorSchemeId;
      if (photoUrl) insertPayload.profile_photo_url = photoUrl;
      if (countryCode) insertPayload.country_code = countryCode;

      // Insert card into digital_cards
      const { data: newCard, error } = await supabase
        .from('digital_cards')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        Alert.alert('Error', `Could not create card: ${error.message}`);
        return;
      }

      if (!newCard) {
        Alert.alert('Error', 'Card was not returned after creation. Please try again.');
        return;
      }

      // Navigate to the card editor
      navigation.navigate('ECardEdit', { cardId: newCard.id });
    } catch (err: any) {
      console.error('Error creating card:', err);
      Alert.alert('Error', err?.message || 'Failed to create card. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // ── Back navigation logic ─────────────────────────────────
  const handleBack = () => {
    if (step === 'type') {
      navigation.goBack();
    } else if (step === 'template') {
      directionRef.current = 'back';
      setStep('type');
    } else {
      directionRef.current = 'back';
      setStep('template');
    }
  };

  // ── Close (exit wizard) ───────────────────────────────────
  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={textPrimary} />
        </TouchableOpacity>

        {/* Step indicator dots */}
        <View style={styles.stepIndicator}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                {
                  width: i === stepIndex ? 24 : 8,
                  backgroundColor:
                    i <= stepIndex
                      ? ACCENT
                      : isDark
                        ? 'rgba(255,255,255,0.15)'
                        : '#D1D5DB',
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleClose}
          style={styles.headerButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={22} color={textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {step === 'type' && (
          <Animated.View
            key="type"
            entering={directionRef.current === 'back' ? SlideInLeft.duration(300) : FadeIn.duration(200)}
            exiting={SlideOutLeft.duration(250)}
            style={styles.typeContainer}
          >
            <TypePicker onSelect={handleTypeSelect} isDark={isDark} />
          </Animated.View>
        )}

        {step === 'template' && (
          <Animated.View
            key="template"
            entering={directionRef.current === 'forward' ? SlideInRight.duration(300) : SlideInLeft.duration(300)}
            exiting={directionRef.current === 'forward' ? SlideOutLeft.duration(250) : SlideOutRight.duration(250)}
            style={styles.templateContainer}
          >
            <TemplateGallery
              cardType={cardType}
              countryTemplate={countryTemplate}
              selectedTemplateId={selectedTemplateId}
              selectedColorSchemeId={selectedColorSchemeId}
              onSelect={handleTemplateSelect}
              onBack={() => { directionRef.current = 'back'; setStep('type'); }}
              isPro={isPro}
              isDark={isDark}
            />

            {/* Continue button (floating at bottom) */}
            {selectedTemplateId && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={[
                  styles.continueContainer,
                  {
                    backgroundColor: isDark
                      ? 'rgba(0,0,0,0.9)'
                      : 'rgba(255,255,255,0.95)',
                    borderTopColor: border,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={handleContinueToSetup}
                  activeOpacity={0.8}
                  style={styles.continueButton}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </Animated.View>
        )}

        {step === 'setup' && selectedTemplateId && (
          <Animated.View
            key="setup"
            entering={directionRef.current === 'forward' ? SlideInRight.duration(300) : SlideInLeft.duration(300)}
            exiting={SlideOutRight.duration(250)}
            style={styles.setupContainer}
          >
            <QuickSetup
              templateId={selectedTemplateId}
              colorSchemeId={selectedColorSchemeId}
              onBack={() => { directionRef.current = 'back'; setStep('template'); }}
              onCreateCard={handleCreate}
              creating={creating}
              isDark={isDark}
            />
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Helper: Generate slug from name ─────────────────────────
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .substring(0, 24);

  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}${suffix}`.substring(0, 30);
}

// ── Helper: Upload profile photo to Supabase storage ────────
async function uploadProfilePhoto(
  userId: string,
  uri: string,
): Promise<string | undefined> {
  try {
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType =
      ext === 'png'
        ? 'image/png'
        : ext === 'gif'
          ? 'image/gif'
          : ext === 'webp'
            ? 'image/webp'
            : 'image/jpeg';

    const path = `${userId}/profile_${Date.now()}.${ext}`;

    // Fetch the image as blob for upload
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('ecard-assets')
      .upload(path, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('Profile photo upload failed:', error.message);
      return undefined;
    }

    const { data: urlData } = supabase.storage
      .from('ecard-assets')
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (err) {
    console.warn('Profile photo upload error:', err);
    return undefined;
  }
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },

  // Content
  content: {
    flex: 1,
  },

  // Type step
  typeContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Template step
  templateContainer: {
    flex: 1,
  },

  // Continue button overlay
  continueContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
  },
  continueButton: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Setup step
  setupContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
});
