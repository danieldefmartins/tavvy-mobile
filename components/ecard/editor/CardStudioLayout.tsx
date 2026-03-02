/**
 * CardStudioLayout -- Apple-style eCard editor with dark canvas,
 * scaled live preview, bottom-sheet inspector, and 5-tab bottom bar.
 *
 * Replaces the old EditorLayout (scroll + accordion + dot navigator).
 * Matches the web CardStudio redesign.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  Share,
  Dimensions,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { saveQRCodeToCameraRoll } from '../../../lib/ecard/saveQRCode';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { useAutoSave } from '../../../lib/ecard/useAutoSave';
import LivePreviewCard from './LivePreviewCard';
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

// ── Colors ──────────────────────────────────────────────────────────────────

const AMBER = '#FF9F0A';
const CANVAS_BG = '#1C1C1E';
const SHEET_BG = 'rgba(44,44,46,0.98)';
const TAB_BAR_BG = 'rgba(28,28,30,0.98)';
const ACCENT = '#00C853';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = '#98989F';
const BORDER_COLOR = 'rgba(255,255,255,0.08)';

// ── Tab definitions ─────────────────────────────────────────────────────────

type TabId = 'profile' | 'contact' | 'style' | 'media' | 'more';

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'profile', label: 'Profile', icon: 'person-circle' },
  { id: 'contact', label: 'Contact', icon: 'call' },
  { id: 'style', label: 'Style', icon: 'color-palette' },
  { id: 'media', label: 'Media', icon: 'images' },
  { id: 'more', label: 'More', icon: 'settings-outline' },
];

const TAB_BAR_HEIGHT = 56;

// ── Types ───────────────────────────────────────────────────────────────────

interface CardStudioLayoutProps {
  isDark: boolean;
  isPro: boolean;
  userId?: string;
  onBack: () => void;
  onPreview: () => void;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function CardStudioLayout({
  isDark: _isDark,
  isPro,
  userId,
  onBack,
  onPreview,
}: CardStudioLayoutProps) {
  // Always dark in CardStudio
  const isDark = true;
  const insets = useSafeAreaInsets();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [activeTab, setActiveTab] = useState<TabId | null>(null);
  const [showQR, setShowQR] = useState(false);
  const qrRef = useRef<any>(null);

  const { state } = useEditor();
  const { isSaving, isDirty, lastSaved, saveNow } = useAutoSave({ userId, isPro });

  const card = state.card;
  const cardId = card?.id;
  const templateId = card?.template_id || 'basic';
  const cardUrl = `https://tavvy.com/${card?.slug || 'preview'}`;

  // Conditional sections
  const isCivic = templateId.startsWith('civic-') || templateId === 'politician-generic';
  const isMobileBiz = templateId === 'mobile-business';
  const isProTemplate =
    templateId.startsWith('pro-') ||
    templateId === 'business-card' ||
    templateId === 'cover-card';

  // ── Bottom sheet snap points ────────────────────────────────────────────

  const snapPoints = useMemo(() => ['45%', '85%'], []);

  // Animated position for preview scaling
  const sheetPosition = useSharedValue(0); // 0 = closed, 1 = 45%, 2 = 85%

  const previewScale = useAnimatedStyle(() => {
    const scale = interpolate(sheetPosition.value, [0, 1], [1, 0.85], 'clamp');
    return {
      transform: [{ scale }],
    };
  });

  // ── Tab press handler ─────────────────────────────────────────────────

  const handleTabPress = useCallback(
    (tabId: TabId) => {
      if (activeTab === tabId) {
        // Close sheet
        bottomSheetRef.current?.close();
        setActiveTab(null);
      } else {
        setActiveTab(tabId);
        if (activeTab === null) {
          // Sheet was closed, open to first snap point
          bottomSheetRef.current?.snapToIndex(0);
        }
        // If sheet already open, just switch content (activeTab change re-renders)
      }
    },
    [activeTab],
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        // Sheet fully closed
        setActiveTab(null);
        sheetPosition.value = withTiming(0, { duration: 250 });
      } else {
        sheetPosition.value = withTiming(index + 1, { duration: 250 });
      }
    },
    [sheetPosition],
  );

  // ── Share handler ─────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        await Share.share({ url: cardUrl });
      } else {
        await Share.share({ message: cardUrl });
      }
    } catch {
      // User cancelled
    }
  }, [cardUrl]);

  // ── Save animation ────────────────────────────────────────────────────

  const saveScale = useSharedValue(1);
  const saveFlashOpacity = useSharedValue(0);
  const prevLastSavedRef = useRef<Date | null>(null);

  useEffect(() => {
    if (lastSaved && lastSaved !== prevLastSavedRef.current) {
      saveScale.value = withSequence(
        withTiming(0.7, { duration: 50 }),
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
      saveFlashOpacity.value = withSequence(
        withTiming(0.3, { duration: 100 }),
        withTiming(0, { duration: 400 }),
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

  // ── Save status text/colors ───────────────────────────────────────────

  const saveStatusText = isSaving
    ? 'Saving...'
    : isDirty
      ? 'Save'
      : lastSaved
        ? 'Saved'
        : 'Save';

  const saveButtonBg = isDirty ? AMBER : 'rgba(255,255,255,0.06)';
  const saveButtonTextColor = isDirty ? '#FFFFFF' : lastSaved ? ACCENT : TEXT_SECONDARY;

  // ── Tab content renderer ──────────────────────────────────────────────

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection isDark={isDark} isPro={isPro} />;
      case 'contact':
        return (
          <>
            <ContactSection isDark={isDark} isPro={isPro} />
            <SocialSection isDark={isDark} isPro={isPro} />
            <LinksSection isDark={isDark} isPro={isPro} />
          </>
        );
      case 'style':
        return (
          <>
            <TemplateColorSection isDark={isDark} isPro={isPro} />
            <TypographySection isDark={isDark} isPro={isPro} />
          </>
        );
      case 'media':
        return (
          <>
            <MediaSection isDark={isDark} isPro={isPro} />
            <ImagesLayoutSection isDark={isDark} isPro={isPro} />
          </>
        );
      case 'more':
        return (
          <>
            {isCivic && <CivicSection isDark={isDark} isPro={isPro} />}
            {isMobileBiz && <MobileBusinessSection isDark={isDark} isPro={isPro} />}
            {isProTemplate && <AdvancedSection isDark={isDark} isPro={isPro} />}
            {/* Publish / Save button */}
            <View style={styles.publishContainer}>
              <TouchableOpacity
                onPress={saveNow}
                disabled={isSaving || !isDirty}
                activeOpacity={0.7}
                style={[
                  styles.publishButton,
                  {
                    backgroundColor: isDirty ? ACCENT : 'rgba(255,255,255,0.08)',
                    opacity: isSaving || !isDirty ? 0.6 : 1,
                  },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.publishText}>
                  {isSaving ? 'Publishing...' : isDirty ? 'Publish Changes' : 'Up to Date'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        );
      default:
        return null;
    }
  }, [activeTab, isDark, isPro, isCivic, isMobileBiz, isProTemplate, isSaving, isDirty, saveNow]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={styles.header}>
        {/* Back */}
        <TouchableOpacity
          onPress={onBack}
          style={styles.headerButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={TEXT_PRIMARY} />
        </TouchableOpacity>

        {/* Card name + unsaved dot */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {card?.card_name || card?.full_name || 'Edit Card'}
          </Text>
          {isDirty && <View style={styles.unsavedDot} />}
        </View>

        {/* Action buttons */}
        <View style={styles.headerRight}>
          {/* Save */}
          <Animated.View style={saveAnimStyle}>
            <TouchableOpacity
              onPress={saveNow}
              disabled={isSaving || !isDirty}
              activeOpacity={isDirty ? 0.7 : 1}
              style={[styles.saveButton, { backgroundColor: saveButtonBg, overflow: 'hidden' }]}
              accessibilityLabel={saveStatusText}
              accessibilityRole="button"
            >
              <Animated.View style={flashStyle} />
              {isSaving && (
                <ActivityIndicator
                  size="small"
                  color={saveButtonTextColor}
                  style={{ marginRight: 4 }}
                />
              )}
              {!isDirty && lastSaved && !isSaving && (
                <Ionicons name="checkmark" size={14} color={ACCENT} style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.saveText, { color: saveButtonTextColor }]}>
                {saveStatusText}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* QR */}
          {!!cardId && (
            <TouchableOpacity
              onPress={() => setShowQR(true)}
              style={styles.headerButton}
              accessibilityLabel="QR Code"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="qr-code-outline" size={20} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          )}

          {/* Share */}
          {!!cardId && (
            <TouchableOpacity
              onPress={handleShare}
              style={styles.headerButton}
              accessibilityLabel="Share card"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="share-outline" size={20} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          )}

          {/* Preview */}
          {!!cardId && (
            <TouchableOpacity
              onPress={onPreview}
              style={styles.headerButton}
              accessibilityLabel="Preview card"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="eye-outline" size={20} color={TEXT_SECONDARY} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Canvas with live preview ─────────────────────────────────── */}
      <View style={styles.canvas}>
        <ScrollView
          contentContainerStyle={styles.canvasScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.previewWrapper, previewScale]}>
            <LivePreviewCard isDark={isDark} onExpandPreview={onPreview} />
          </Animated.View>
        </ScrollView>
      </View>

      {/* ── Bottom Sheet ─────────────────────────────────────────────── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        style={styles.sheet}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        {/* Tab label inside sheet */}
        {activeTab && (
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {TABS.find((t) => t.id === activeTab)?.label}
            </Text>
          </View>
        )}
        <BottomSheetScrollView
          contentContainerStyle={[styles.sheetContent, { paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={styles.tabButton}
              activeOpacity={0.7}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={tab.icon as any}
                size={22}
                color={isActive ? AMBER : TEXT_SECONDARY}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── QR Code Modal ────────────────────────────────────────────── */}
      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.qrOverlay}>
          <View style={styles.qrModal}>
            <TouchableOpacity
              style={styles.qrCloseBtn}
              onPress={() => setShowQR(false)}
            >
              <Ionicons name="close" size={22} color={TEXT_SECONDARY} />
            </TouchableOpacity>

            <Text style={styles.qrTitle}>QR Code</Text>
            <Text style={styles.qrSubtitle}>Scan to view your card</Text>

            <View style={styles.qrContainer}>
              <QRCode
                value={cardUrl}
                size={200}
                backgroundColor="#FFFFFF"
                color="#000000"
                getRef={(ref: any) => (qrRef.current = ref)}
              />
            </View>

            <Text style={styles.qrUrl} numberOfLines={1}>
              {cardUrl}
            </Text>

            <View style={styles.qrActions}>
              <TouchableOpacity
                style={[styles.qrActionBtn, { backgroundColor: '#3A3A3C' }]}
                onPress={() => saveQRCodeToCameraRoll(qrRef.current)}
              >
                <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                <Text style={styles.qrActionText}>Save PNG</Text>
              </TouchableOpacity>
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
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CANVAS_BG,
  },

  // ── Header ──────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
    backgroundColor: CANVAS_BG,
    zIndex: 10,
  },
  headerButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  unsavedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: AMBER,
    marginLeft: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  saveText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Canvas ──────────────────────────────────────────────────────────
  canvas: {
    flex: 1,
    zIndex: 0,
  },
  canvasScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  previewWrapper: {
    width: '100%',
    maxWidth: 380,
  },

  // ── Bottom sheet ────────────────────────────────────────────────────
  sheet: {
    zIndex: 5,
  },
  sheetBackground: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHandle: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 36,
    height: 5,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER_COLOR,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  sheetContent: {
    padding: 16,
  },

  // ── Tab bar ─────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: TAB_BAR_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BORDER_COLOR,
    paddingTop: 6,
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  tabLabelActive: {
    color: AMBER,
  },

  // ── Publish button ──────────────────────────────────────────────────
  publishContainer: {
    marginTop: 24,
    paddingHorizontal: 4,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  publishText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // ── QR Modal ────────────────────────────────────────────────────────
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    backgroundColor: '#2C2C2E',
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
    color: TEXT_PRIMARY,
  },
  qrSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    color: TEXT_SECONDARY,
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
    color: TEXT_SECONDARY,
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
