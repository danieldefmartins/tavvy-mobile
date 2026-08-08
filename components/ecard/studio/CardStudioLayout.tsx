/**
 * CardStudioLayout — Apple-style Card Studio editor layout.
 *
 * Replaces the old accordion-based EditorLayout with a modern
 * bottom-sheet tab-based interface:
 *
 *   ┌─────────────────────────────┐
 *   │  Top bar (Back / Save)      │
 *   ├─────────────────────────────┤
 *   │                             │
 *   │   Live Card Preview         │
 *   │   (dark canvas)             │
 *   │                             │
 *   ├─────────────────────────────┤
 *   │  Bottom Sheet (inspector)   │
 *   │  ─ tab content panels ─     │
 *   ├─────────────────────────────┤
 *   │  Tab Bar (5 tabs)           │
 *   └─────────────────────────────┘
 *
 * The sheet slides up from the bottom when a tab is tapped.
 * Tapping the active tab closes the sheet.
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useEditor } from '../../../lib/ecard/EditorContext';
import StudioTabBar, { StudioTabId } from './StudioTabBar';
import StudioBottomSheet from './StudioBottomSheet';
import StudioLivePreview from './StudioLivePreview';

// ── Constants ────────────────────────────────────────────────────────────────
const AMBER = '#FF9F0A';
const CANVAS_BG = '#1C1C1E';
const TOP_BAR_BG = 'rgba(28,28,30,0.98)';

// ── Props ────────────────────────────────────────────────────────────────────
interface CardStudioLayoutProps {
  /** Navigate back */
  onBack: () => void;
  /** Save/publish handler */
  onSave: () => void;
  /** Is save in progress */
  isSaving?: boolean;
  /** Is the user a Pro subscriber */
  isPro?: boolean;
  /** Card title for the header */
  cardTitle?: string;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CardStudioLayout({
  onBack,
  onSave,
  isSaving = false,
  isPro = false,
  cardTitle = 'Edit Card',
}: CardStudioLayoutProps) {
  const insets = useSafeAreaInsets();
  const { state } = useEditor();
  const [activeTab, setActiveTab] = useState<StudioTabId | null>(null);

  // ── Tab press handler ──────────────────────────────────────────────────────
  const handleTabPress = useCallback(
    (tabId: StudioTabId) => {
      if (activeTab === tabId) {
        // Toggle off — close sheet
        setActiveTab(null);
      } else {
        setActiveTab(tabId);
      }
    },
    [activeTab],
  );

  const handleSheetClose = useCallback(() => {
    setActiveTab(null);
  }, []);

  // ── Tap on preview opens profile tab ───────────────────────────────────────
  const handlePreviewTap = useCallback((tab: StudioTabId) => {
    setActiveTab(tab);
  }, []);

  // ── Dirty indicator ────────────────────────────────────────────────────────
  const isDirty = state.isDirty;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.topBarBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.topBarCenter}>
            <Text style={styles.topBarTitle} numberOfLines={1}>
              {cardTitle}
            </Text>
            {isDirty && (
              <View style={styles.unsavedDot} />
            )}
          </View>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onSave();
            }}
            disabled={isSaving}
            style={[
              styles.saveBtn,
              isSaving && { opacity: 0.5 },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Live Preview Canvas ─────────────────────────────────────────── */}
        <View style={styles.previewArea}>
          <StudioLivePreview onTapSection={handlePreviewTap} />
        </View>

        {/* ── Bottom Sheet (inspector) ────────────────────────────────────── */}
        <StudioBottomSheet
          activeTab={activeTab}
          onClose={handleSheetClose}
          isPro={isPro}
          isDark={true}
        />

        {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
        <StudioTabBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
      </View>
    </GestureHandlerRootView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CANVAS_BG,
  },
  container: {
    flex: 1,
    backgroundColor: CANVAS_BG,
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: TOP_BAR_BG,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topBarBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 12,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  unsavedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AMBER,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: AMBER,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  // Preview area
  previewArea: {
    flex: 1,
    backgroundColor: CANVAS_BG,
  },
});
