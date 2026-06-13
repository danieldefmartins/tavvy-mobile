/**
 * StudioBottomSheet — @gorhom/bottom-sheet inspector for Card Studio.
 *
 * Contains all 5 tab panels (Profile, Contact, Style, Media, More).
 * Each panel reuses the existing section components but strips the
 * EditorSection accordion wrapper — content is shown flat inside the sheet.
 *
 * The sheet has 3 snap points: closed (0), half (~45%), full (~90%).
 * A drag handle and close button are at the top.
 */
import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import type { StudioTabId } from './StudioTabBar';

// ── Tab panel imports ────────────────────────────────────────────────────────
import StudioProfilePanel from './panels/StudioProfilePanel';
import StudioContactPanel from './panels/StudioContactPanel';
import StudioStylePanel from './panels/StudioStylePanel';
import StudioMediaPanel from './panels/StudioMediaPanel';
import StudioMorePanel from './panels/StudioMorePanel';

// ── Constants ────────────────────────────────────────────────────────────────
const AMBER = '#FF9F0A';
const SHEET_BG = 'rgba(44,44,46,0.98)';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Props ────────────────────────────────────────────────────────────────────
interface StudioBottomSheetProps {
  activeTab: StudioTabId | null;
  onClose: () => void;
  isPro: boolean;
  isDark: boolean;
}

// ── Tab title map ────────────────────────────────────────────────────────────
const TAB_TITLES: Record<StudioTabId, string> = {
  profile: 'Profile',
  contact: 'Contact',
  style: 'Style',
  media: 'Media',
  settings: 'More Options',
};

// ── Component ────────────────────────────────────────────────────────────────
export default function StudioBottomSheet({
  activeTab,
  onClose,
  isPro,
  isDark,
}: StudioBottomSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);

  // Snap points: half and full
  const snapPoints = useMemo(() => ['45%', '90%'], []);

  // Open/close sheet when activeTab changes
  useEffect(() => {
    if (activeTab) {
      sheetRef.current?.snapToIndex(0); // half
    } else {
      sheetRef.current?.close();
    }
  }, [activeTab]);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) {
        // Sheet fully closed
        onClose();
      }
    },
    [onClose],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    [],
  );

  // ── Render panel content ───────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <StudioProfilePanel isDark={true} isPro={isPro} />;
      case 'contact':
        return <StudioContactPanel isDark={true} isPro={isPro} />;
      case 'style':
        return <StudioStylePanel isDark={true} isPro={isPro} />;
      case 'media':
        return <StudioMediaPanel isDark={true} isPro={isPro} />;
      case 'settings':
        return <StudioMorePanel isDark={true} isPro={isPro} />;
      default:
        return null;
    }
  };

  if (!activeTab) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChange}
      enablePanDownToClose
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      backdropComponent={renderBackdrop}
      style={styles.sheet}
    >
      {/* Sheet header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {TAB_TITLES[activeTab]}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>

      {/* Sheet content */}
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  sheet: {
    zIndex: 15,
  },
  sheetBg: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'capitalize',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
});
