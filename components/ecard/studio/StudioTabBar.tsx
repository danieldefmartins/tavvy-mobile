/**
 * StudioTabBar — Bottom tab bar for Card Studio editor.
 *
 * 5 tabs: Profile, Contact, Style, Media, More
 * Apple-style design: dark background, amber (#FF9F0A) accent for active tab.
 * Tapping an active tab closes the sheet; tapping inactive opens it.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

// ── Types ────────────────────────────────────────────────────────────────────
export type StudioTabId = 'profile' | 'contact' | 'style' | 'media' | 'settings';

interface TabDef {
  id: StudioTabId;
  icon: string;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'profile', icon: 'person', label: 'Profile' },
  { id: 'contact', icon: 'call', label: 'Contact' },
  { id: 'style', icon: 'color-palette', label: 'Style' },
  { id: 'media', icon: 'image', label: 'Media' },
  { id: 'settings', icon: 'settings', label: 'More' },
];

const AMBER = '#FF9F0A';
const AMBER_BG = 'rgba(255,159,10,0.15)';
const INACTIVE = 'rgba(255,255,255,0.4)';
const BAR_BG = 'rgba(28,28,30,0.98)';

// ── Props ────────────────────────────────────────────────────────────────────
interface StudioTabBarProps {
  activeTab: StudioTabId | null;
  onTabPress: (tabId: StudioTabId) => void;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StudioTabBar({ activeTab, onTabPress }: StudioTabBarProps) {
  const insets = useSafeAreaInsets();

  const handlePress = (tabId: StudioTabId) => {
    Haptics.selectionAsync();
    onTabPress(tabId);
  };

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 8) },
      ]}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handlePress(tab.id)}
            activeOpacity={0.7}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <View
              style={[
                styles.iconWrap,
                isActive && styles.iconWrapActive,
              ]}
            >
              <Ionicons
                name={(isActive ? tab.icon : `${tab.icon}-outline`) as any}
                size={20}
                color={isActive ? AMBER : INACTIVE}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: isActive ? AMBER : INACTIVE },
                isActive && styles.labelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    backgroundColor: BAR_BG,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tab: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: AMBER_BG,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: '600',
  },
});
