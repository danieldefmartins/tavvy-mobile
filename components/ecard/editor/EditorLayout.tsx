/**
 * EditorLayout -- main editor shell with sticky header, scrollable sections,
 * and floating dot navigator.
 *
 * React Native port of the web EditorLayout.tsx.
 * - SafeAreaView for proper insets
 * - ScrollView body with section components
 * - Sticky header: back, card name + save status, preview
 * - Conditional sections based on template_id
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { useAutoSave } from '../../../lib/ecard/useAutoSave';
import LivePreviewCard from './LivePreviewCard';
import SectionNavigator from './SectionNavigator';
import ProfileSection from './sections/ProfileSection';
import ContactSection from './sections/ContactSection';
import SocialSection from './sections/SocialSection';
import LinksSection from './sections/LinksSection';
import MediaSection from './sections/MediaSection';
import TemplateColorSection from './sections/TemplateColorSection';
import ImagesLayoutSection from './sections/ImagesLayoutSection';
import TypographySection from './sections/TypographySection';
import CivicSection from './sections/CivicSection';
import MobileBusinessSection from './sections/MobileBusinessSection';
import AdvancedSection from './sections/AdvancedSection';

const ACCENT = '#00C853';

// ── Types ────────────────────────────────────────────────────────────────────

interface EditorLayoutProps {
  isDark: boolean;
  isPro: boolean;
  userId?: string;
  onBack: () => void;
  onPreview: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EditorLayout({
  isDark,
  isPro,
  userId,
  onBack,
  onPreview,
}: EditorLayoutProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [showQR, setShowQR] = useState(false);
  const { state } = useEditor();
  const { isSaving, isDirty, lastSaved, saveNow } = useAutoSave({
    userId,
    isPro,
  });

  const card = state.card;
  const cardId = card?.id;
  const templateId = card?.template_id || 'basic';
  const cardUrl = `https://tavvy.com/${card?.slug || 'preview'}`;

  const handleShare = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Share.share({ url: cardUrl });
      } else {
        await Share.share({ message: cardUrl });
      }
    } catch {
      // User cancelled
    }
  };

  // Determine which conditional sections to show
  const isCivic =
    templateId.startsWith('civic-') || templateId === 'politician-generic';
  const isMobileBiz = templateId === 'mobile-business';
  const isProTemplate =
    templateId.startsWith('pro-') ||
    templateId === 'business-card' ||
    templateId === 'cover-card';

  // Build section list for SectionNavigator
  const sections = useMemo(() => {
    const base = [
      { id: 'profile', label: 'Profile' },
      { id: 'contact', label: 'Contact' },
      { id: 'social', label: 'Social' },
      { id: 'links', label: 'Links' },
      { id: 'media', label: 'Media' },
      { id: 'template-colors', label: 'Template' },
      { id: 'images-layout', label: 'Images' },
      { id: 'typography', label: 'Fonts' },
    ];
    if (isCivic) base.push({ id: 'civic', label: 'Civic' });
    if (isMobileBiz) base.push({ id: 'mobile-business', label: 'Menu' });
    if (isProTemplate) base.push({ id: 'advanced', label: 'Advanced' });
    return base;
  }, [isCivic, isMobileBiz, isProTemplate]);

  // ── Theme colors ─────────────────────────────────────────────────────────

  const bg = isDark ? '#000000' : '#FAFAFA';
  const headerBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.06)';

  // ── Save status ──────────────────────────────────────────────────────────

  const saveStatusText = isSaving
    ? 'Saving...'
    : isDirty
      ? 'Save'
      : lastSaved
        ? 'Saved'
        : 'Save';

  const saveButtonBg = isDirty
    ? ACCENT
    : isDark
      ? 'rgba(255,255,255,0.06)'
      : '#F3F4F6';

  const saveButtonTextColor = isDirty
    ? '#FFFFFF'
    : lastSaved
      ? ACCENT
      : textSecondary;

  // ── Save animation ───────────────────────────────────────────────────────
  const saveScale = useSharedValue(1);
  const saveFlashOpacity = useSharedValue(0);
  const prevLastSavedRef = useRef<Date | null>(null);

  useEffect(() => {
    if (lastSaved && lastSaved !== prevLastSavedRef.current) {
      // Animate checkmark scale-in
      saveScale.value = withSequence(
        withTiming(0.7, { duration: 50 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      // Brief green flash
      saveFlashOpacity.value = withSequence(
        withTiming(0.3, { duration: 100 }),
        withTiming(0, { duration: 400 })
      );
      prevLastSavedRef.current = lastSaved;
    }
  }, [lastSaved, saveScale, saveFlashOpacity]);

  const saveAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ACCENT,
    borderRadius: 8,
    opacity: saveFlashOpacity.value,
  }));

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: headerBg }]}>
      {/* ── Sticky Header ─────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: headerBg,
            borderBottomColor: borderColor,
          },
        ]}
      >
        {/* Back */}
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={textPrimary} />
        </TouchableOpacity>

        {/* Card name */}
        <View style={styles.headerCenter}>
          <Text
            style={[styles.headerTitle, { color: textPrimary }]}
            numberOfLines={1}
          >
            {card?.card_name || card?.full_name || 'Edit Card'}
          </Text>
        </View>

        {/* Save + Preview */}
        <View style={styles.headerRight}>
          {/* Save button */}
          <Animated.View style={saveAnimStyle}>
            <TouchableOpacity
              onPress={saveNow}
              disabled={isSaving || !isDirty}
              activeOpacity={isDirty ? 0.7 : 1}
              style={[
                styles.saveButton,
                { backgroundColor: saveButtonBg, overflow: 'hidden' },
              ]}
              accessibilityLabel={saveStatusText}
              accessibilityRole="button"
            >
              <Animated.View style={flashStyle} />
              {isSaving && (
                <ActivityIndicator
                  size="small"
                  color={saveButtonTextColor}
                  style={styles.saveSpinner}
                />
              )}
              {!isDirty && lastSaved && !isSaving && (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={ACCENT}
                  style={styles.saveIcon}
                />
              )}
              <Text
                style={[styles.saveText, { color: saveButtonTextColor }]}
              >
                {saveStatusText}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* QR Code */}
          {!!cardId && (
            <TouchableOpacity
              onPress={() => setShowQR(true)}
              style={styles.headerButton}
              accessibilityLabel="QR Code"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="qr-code-outline" size={20} color={textSecondary} />
            </TouchableOpacity>
          )}

          {/* Share */}
          {!!cardId && (
            <TouchableOpacity
              onPress={handleShare}
              style={styles.headerButton}
              accessibilityLabel="Share card"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="share-outline" size={20} color={textSecondary} />
            </TouchableOpacity>
          )}

          {/* Preview */}
          {!!cardId && (
            <TouchableOpacity
              onPress={onPreview}
              style={styles.headerButton}
              accessibilityLabel="Preview card"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="eye-outline" size={20} color={textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Scrollable sections ───────────────────────────────────────── */}
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollView, { backgroundColor: bg }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Live preview card — updates in real-time as user edits */}
        <LivePreviewCard isDark={isDark} onExpandPreview={onPreview} />

        <ProfileSection isDark={isDark} isPro={isPro} />
        <ContactSection isDark={isDark} isPro={isPro} />
        <SocialSection isDark={isDark} isPro={isPro} />
        <LinksSection isDark={isDark} isPro={isPro} />
        <MediaSection isDark={isDark} isPro={isPro} />
        <TemplateColorSection isDark={isDark} isPro={isPro} />
        <ImagesLayoutSection isDark={isDark} isPro={isPro} />
        <TypographySection isDark={isDark} isPro={isPro} />

        {isCivic && <CivicSection isDark={isDark} isPro={isPro} />}
        {isMobileBiz && <MobileBusinessSection isDark={isDark} isPro={isPro} />}
        {isProTemplate && <AdvancedSection isDark={isDark} isPro={isPro} />}
      </ScrollView>

      {/* ── Section navigator (floating dots) ─────────────────────────── */}
      <SectionNavigator
        sections={sections}
        scrollViewRef={scrollViewRef}
        isDark={isDark}
      />

      {/* ── QR Code Modal ────────────────────────────────────────────── */}
      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.qrOverlay}>
          <View
            style={[
              styles.qrModal,
              { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
            ]}
          >
            <TouchableOpacity
              style={styles.qrCloseBtn}
              onPress={() => setShowQR(false)}
            >
              <Ionicons
                name="close"
                size={22}
                color={isDark ? '#94A3B8' : '#666'}
              />
            </TouchableOpacity>

            <Text
              style={[styles.qrTitle, { color: textPrimary }]}
            >
              QR Code
            </Text>
            <Text
              style={[styles.qrSubtitle, { color: textSecondary }]}
            >
              Scan to view your card
            </Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={cardUrl}
                size={200}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            </View>

            <Text
              style={[styles.qrUrl, { color: textSecondary }]}
              numberOfLines={1}
            >
              {cardUrl}
            </Text>

            <View style={styles.qrActions}>
              <TouchableOpacity
                style={[styles.qrActionBtn, { backgroundColor: ACCENT }]}
                onPress={() => {
                  setShowQR(false);
                  handleShare();
                }}
              >
                <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                <Text style={styles.qrActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveSpinner: {
    marginRight: 4,
  },
  saveIcon: {
    marginRight: 4,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // QR Modal
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  qrCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    padding: 6,
    borderRadius: 8,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
  },
  qrUrl: {
    fontSize: 13,
    marginBottom: 20,
  },
  qrActions: {
    flexDirection: 'row',
    gap: 12,
  },
  qrActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  qrActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
