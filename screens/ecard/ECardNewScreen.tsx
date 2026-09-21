import FocusedStatusBar from '../../components/FocusedStatusBar';
/**
 * ECardNewScreen -- Design-first creation, with Quick setup and the complete type/country path
 *
 * Ported from web: pages/app/ecard/new.tsx
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  SlideInRight,
  SlideInLeft,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useECardEntitlement } from '../../hooks/useECardEntitlement';
import { TEMPLATES, getTemplateById } from '../../config/eCardTemplates';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../../lib/supabaseClient';
import TypePicker from '../../components/ecard/wizard/TypePicker';
import TemplateGallery from '../../components/ecard/wizard/TemplateGallery';
import TemplateBrowseFilters from '../../components/ecard/wizard/TemplateBrowseFilters';
import { canUseTemplate, readTemplateSelection, templateCardType, browseCategoryForTemplate, browseCategoryForCardType, firstBrowseSelection, BrowsePlan } from '../../lib/ecard/templateSelection';
import { applyDesignColor, createCardDraftPayload } from '../../lib/ecard/creationDraft';
import { useReleaseCopy } from '../../hooks/useReleaseCopy';
import QuickSetup, { QuickSetupValues } from '../../components/ecard/wizard/QuickSetup';

const ACCENT = '#6C2496';

type WizardStep = 'type' | 'template' | 'setup';

export default function ECardNewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const copy = useReleaseCopy();
  const preset = useRef(readTemplateSelection((route.params as any)?.template, (route.params as any)?.scheme) || readTemplateSelection(TEMPLATES[0].id, TEMPLATES[0].colorSchemes[0].id)).current!;
  const { user } = useAuth();
  const { isPro, loading: planLoading, error: planError, refresh: retryPlan } = useECardEntitlement();
  const { isDark } = useThemeContext();

  // ── Wizard state ──────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>('template');
  const [cardType, setCardType] = useState<string>(preset.cardType);
  const [galleryFilter, setGalleryFilter] = useState(browseCategoryForTemplate(preset.template.id));
  const [planFilter,setPlanFilter]=useState<BrowsePlan>('all');
  const [setupValues, setSetupValues] = useState<QuickSetupValues>({ name: '', title: '', primaryColor: preset.scheme.primary });
  const [countryCode, setCountryCode] = useState<string | undefined>();
  const [countryTemplate, setCountryTemplate] = useState<string | undefined>();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(preset.template.id);
  const [selectedColorSchemeId, setSelectedColorSchemeId] = useState<string | null>(preset.scheme.id);
  const creatingRef = useRef(false);
  const [creating, setCreating] = useState(false);
  const [templateAvailable, setTemplateAvailable] = useState(true);

  // Track navigation direction for animation
  const directionRef = useRef<'forward' | 'back'>('forward');

  // ── Theme colors ──────────────────────────────────────────
  const bg = isDark ? '#000000' : '#FAFAFA';
  const headerBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const selectedTemplate = getTemplateById(selectedTemplateId || '');
  const selectedAllowed = !!selectedTemplate && canUseTemplate(selectedTemplate, selectedColorSchemeId, isPro);

  const go = (next: WizardStep) => { directionRef.current = 'forward'; setStep(next); };
  const handleTypeSelect = (type: string, country?: string, preferred?: string) => {
    if (!['business', 'personal', 'politician'].includes(type)) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const category=browseCategoryForCardType(type),selection=firstBrowseSelection(category,isPro,preferred);
    setCardType(type);setGalleryFilter(category);setPlanFilter('all');setCountryCode(country);setCountryTemplate(preferred);setTemplateAvailable(false);
    const allowed=selection&&canUseTemplate(selection.template,selection.scheme.id,isPro);
    setSelectedTemplateId(allowed?selection.template.id:null);setSelectedColorSchemeId(allowed?selection.scheme.id:null);
    if(allowed)setSetupValues(value=>applyDesignColor(value,selection.scheme.primary));
    go('template');
  };
  const handleTemplateSelect = (templateId: string, schemeId: string) => {
    const selection = readTemplateSelection(templateId, schemeId);
    if (!selection) return;
    setSelectedTemplateId(selection.template.id); setSelectedColorSchemeId(selection.scheme.id);
    if (selectedTemplateId !== selection.template.id) {
      setCardType(selection.cardType);
      if (selection.cardType !== 'politician') { setCountryCode(undefined); setCountryTemplate(undefined); }
    }
    setSetupValues(value => applyDesignColor(value, selection.scheme.primary));
  };
  const selectBrowse=(category:string,nextPlan:BrowsePlan)=>{if(category===galleryFilter&&nextPlan===planFilter)return;
    setGalleryFilter(category);setPlanFilter(nextPlan);setTemplateAvailable(false);
    const selection=firstBrowseSelection(category,isPro,selectedTemplateId||undefined,nextPlan);
    if(selection&&canUseTemplate(selection.template,selection.scheme.id,isPro)){const scheme=nextPlan!=='free'&&selection.template.id===selectedTemplateId?selection.template.colorSchemes.find(item=>item.id===selectedColorSchemeId)||selection.scheme:selection.scheme;handleTemplateSelect(selection.template.id,scheme.id);}
    else{setSelectedTemplateId(null);setSelectedColorSchemeId(null);}
  };
  const quickStart = () => {
    const basic = getTemplateById('basic')!;
    const scheme = basic.colorSchemes.find(item => item.isFree) || basic.colorSchemes[0];
    setSelectedTemplateId(basic.id); setSelectedColorSchemeId(scheme.id);
    setCardType('business'); setGalleryFilter('personal-creators');setPlanFilter('all'); setCountryCode(undefined); setCountryTemplate(undefined);
    setSetupValues(value => applyDesignColor(value, scheme.primary)); go('setup');
  };
  const handleContinueToSetup = () => {
    if (!templateAvailable || !selectedAllowed || planLoading || planError) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); go('setup');
  };

  // ── Step 3: Create card ───────────────────────────────────
  const handleCreate = async (data: {
    name: string;
    title: string;
    photoUri?: string;
    primaryColor?: string;
  }) => {
    if (!user || creatingRef.current || planLoading || planError) return;
    if (!selectedAllowed) { Alert.alert(copy('Pro design'), copy('This design or color requires Pro. Choose an available option or review your plan.')); return; }
    creatingRef.current = true; setCreating(true);

    try {
      // Upload profile photo if provided
      let photoUrl: string | undefined;
      if (data.photoUri) {
        photoUrl = await uploadProfilePhoto(user.id, data.photoUri);
        if (!photoUrl) throw new Error(copy('Your photo could not upload. Your setup is still here; please try again.'));
      }

      // Generate slug from name
      const slug = generateSlug(data.name);

      const insertPayload = createCardDraftPayload({ userId: user.id, slug,
        templateId: selectedTemplateId!, schemeId: selectedColorSchemeId,
        cardType, countryCode, values: data, photoUrl, isPro });

      // Insert card into digital_cards
      const { data: newCard, error } = await supabase
        .from('digital_cards')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        Alert.alert(copy('Error'), `${copy('Could not create card')}: ${error.message}`);
        return;
      }

      if (!newCard) {
        Alert.alert(copy('Error'), copy('Card was not returned after creation. Please try again.'));
        return;
      }

      // Navigate to the card editor
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('ECardEdit', { cardId: newCard.id });
    } catch (err: any) {
      console.error('Error creating card:', err);
      Alert.alert(copy('Error'), err?.message || copy('Failed to create card. Please try again.'));
    } finally {
      creatingRef.current = false; setCreating(false);
    }
  };

  // ── Back navigation logic ─────────────────────────────────
  const handleBack = () => {
    if (creatingRef.current) return;
    if (step === 'template') navigation.goBack();
    else { directionRef.current = 'back'; setStep('template'); }
  };

  // ── Close (exit wizard) ───────────────────────────────────
  const handleClose = () => {
    if (!creatingRef.current) navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top', 'bottom', 'left', 'right']}>
      <FocusedStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={handleBack}
          accessibilityRole="button" accessibilityLabel={copy('Back')} disabled={creating}
          style={styles.headerButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color={textPrimary} />
        </TouchableOpacity>

        <Text accessibilityRole="header" style={{ color: textPrimary, fontWeight: '700', fontSize: 18 }}>
          {copy(step === 'template' ? 'Choose your look' : step === 'type' ? 'Choose a card type' : 'New eCard')}
        </Text>

        <TouchableOpacity
          onPress={handleClose}
          accessibilityRole="button" accessibilityLabel={copy('Close card creation')} disabled={creating}
          style={styles.headerButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={22} color={textPrimary} />
        </TouchableOpacity>
      </View>

      {planLoading && <Text style={{ padding: 12, color: textPrimary }}>{copy("Checking your plan\u2026")}</Text>}
      {!!planError && <View style={{ padding: 16 }}><Text style={{ color: textPrimary }}>{planError}</Text><TouchableOpacity style={{ paddingVertical: 14 }} onPress={() => void retryPlan()}><Text style={{ color: ACCENT, fontWeight: '600' }}>{copy("Retry plan check")}</Text></TouchableOpacity></View>}
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
            <View style={styles.creationPaths}>
              <TouchableOpacity accessibilityRole="button" style={styles.pathButton} onPress={quickStart}><Text style={{ color: textPrimary }}>{copy('Quick setup')}</Text></TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" style={styles.pathButton} onPress={() => go('type')}><Text style={{ color: textPrimary }}>{copy('Choose card type & template')}</Text></TouchableOpacity>
            </View>
            <TemplateBrowseFilters category={galleryFilter} plan={planFilter} onChange={selectBrowse} isDark={isDark}/>
            <TemplateGallery key={`${galleryFilter}:${planFilter}:${countryTemplate || ''}`}
              cardType={galleryFilter} planFilter={planFilter}
              countryTemplate={countryTemplate}
              selectedTemplateId={selectedTemplateId}
              selectedColorSchemeId={selectedColorSchemeId}
              onSelect={handleTemplateSelect}
              onAvailabilityChange={setTemplateAvailable}
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
                  disabled={!templateAvailable || !selectedAllowed || planLoading || !!planError}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  style={[styles.continueButton, (!templateAvailable || !selectedAllowed || planLoading || !!planError) && {opacity:0.45}]}
                >
                  <Text style={styles.continueButtonText}>{copy('Use this template')}</Text>
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
            <View style={styles.setupDesignRow}>
              <Text style={{ color: textPrimary, fontWeight: '600', flex: 1 }}>{selectedTemplate?.name}</Text>
              <TouchableOpacity accessibilityRole="button" disabled={creating} style={styles.pathButton} onPress={() => go('template')}><Text style={{ color: isDark ? '#BB86E0' : '#6C2496' }}>{copy('Change design or color')}</Text></TouchableOpacity>
            </View>
            <View style={styles.purposeRow}>
              {['business', 'personal'].map(purpose => <TouchableOpacity key={purpose} accessibilityRole="radio" accessibilityState={{ selected: cardType === purpose }} disabled={creating} style={[styles.purposeButton, { borderColor: cardType === purpose ? ACCENT : border }]} onPress={() => {
                if (cardType === 'politician') {
                  const basic = getTemplateById('basic')!, scheme = basic.colorSchemes.find(item => item.isFree) || basic.colorSchemes[0];
                  setSelectedTemplateId(basic.id); setSelectedColorSchemeId(scheme.id); setGalleryFilter('personal-creators');setPlanFilter('all');
                  setSetupValues(value => applyDesignColor(value, scheme.primary));
                }
                setCardType(purpose); setCountryCode(undefined); setCountryTemplate(undefined);
              }}><Text style={{ color: textPrimary }}>{copy(purpose === 'business' ? 'Business' : 'Personal')}</Text></TouchableOpacity>)}
              <TouchableOpacity accessibilityRole="button" style={styles.pathButton} disabled={creating} onPress={() => go('type')}><Text style={{ color: textPrimary }}>{copy(cardType === 'politician' ? 'Civic / Public Service' : 'Card type & country')}{countryCode ? ` · ${countryCode}` : ''}</Text></TouchableOpacity>
            </View>
            <QuickSetup
              value={setupValues}
              onChange={setSetupValues}
              templateId={selectedTemplateId}
              colorSchemeId={selectedColorSchemeId}
              onBack={handleBack}
              onCreateCard={handleCreate}
              creating={creating}
              disabled={planLoading || !!planError || !selectedAllowed}
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

    const bytes = decode(await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }));

    const { error } = await supabase.storage
      .from('ecard-assets')
      .upload(path, bytes, {
        contentType: mimeType,
        upsert: false,
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
    width: 44,
    height: 44,
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
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
    paddingTop: 8,
  },
  creationPaths: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, gap: 8 },
  pathButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  setupDesignRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  purposeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  purposeButton: { minHeight: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, justifyContent: 'center' },
});
