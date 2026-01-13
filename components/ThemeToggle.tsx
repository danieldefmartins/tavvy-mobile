// ============================================
// ThemeToggle.tsx
// Light/Dark mode toggle component
// Path: components/ThemeToggle.tsx
//
// FIXED (banner-friendly):
// - Looks like a modern rounded segmented toggle (like your reference)
// - Does NOT overflow / get huge
// - Harmonizes with dark header (semi-transparent pill)
// - Keeps same props (currentMode, onModeChange, compact)
// ============================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ThemeToggleProps {
  currentMode?: 'light' | 'dark' | 'system';
  onModeChange?: (mode: 'light' | 'dark' | 'system') => void;
  compact?: boolean;
}

export default function ThemeToggle({
  currentMode = 'system',
  onModeChange,
  compact = false,
}: ThemeToggleProps) {
  const systemColorScheme = useColorScheme();
  const activeMode = currentMode === 'system' ? systemColorScheme : currentMode;

  const handlePress = (mode: 'light' | 'dark') => {
    onModeChange?.(mode);
  };

  // Compact (icons only) if you ever use it somewhere else
  if (compact) {
    return (
      <View style={styles.compactPill}>
        <TouchableOpacity
          style={[
            styles.compactBtn,
            activeMode === 'light' && styles.compactBtnActiveLight,
          ]}
          onPress={() => handlePress('light')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="sunny"
            size={16}
            color={activeMode === 'light' ? '#F59E0B' : 'rgba(255,255,255,0.7)'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.compactBtn,
            activeMode === 'dark' && styles.compactBtnActiveDark,
          ]}
          onPress={() => handlePress('dark')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="moon"
            size={16}
            color={activeMode === 'dark' ? '#60A5FA' : 'rgba(255,255,255,0.7)'}
          />
        </TouchableOpacity>
      </View>
    );
  }

  const lightActive = activeMode === 'light';
  const darkActive = activeMode === 'dark';

  return (
    <View style={styles.pill}>
      <TouchableOpacity
        style={[styles.segment, lightActive && styles.segmentActiveLight]}
        onPress={() => handlePress('light')}
        activeOpacity={0.85}
      >
        <Ionicons
          name="sunny"
          size={14}
          color={lightActive ? '#F59E0B' : 'rgba(255,255,255,0.75)'}
          style={styles.icon}
        />
        <Text style={[styles.label, lightActive && styles.labelActiveLight]}>
          Light
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.segment, darkActive && styles.segmentActiveDark]}
        onPress={() => handlePress('dark')}
        activeOpacity={0.85}
      >
        <Ionicons
          name="moon"
          size={14}
          color={darkActive ? '#60A5FA' : 'rgba(255,255,255,0.75)'}
          style={styles.icon}
        />
        <Text style={[styles.label, darkActive && styles.labelActiveDark]}>
          Dark
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const shadowSoft: ViewStyle = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 6,
  elevation: 3,
};

const styles = StyleSheet.create({
  /**
   * ✅ This is the main pill.
   * It's semi-transparent so it blends with the dark banner.
   * Fixed height + minWidth prevents it from getting huge or weird.
   */
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    minWidth: 164,
    padding: 3,
    borderRadius: 18,

    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },

  segment: {
    flex: 1,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Active segment styles (creates that “real toggle” look)
  segmentActiveLight: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...shadowSoft,
  },
  segmentActiveDark: {
    backgroundColor: 'rgba(17,24,39,0.92)',
    ...shadowSoft,
  },

  icon: {
    marginRight: 6,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)', // inactive label blends with banner
  },
  labelActiveLight: {
    color: '#111827',
  },
  labelActiveDark: {
    color: '#FFFFFF',
  },

  // Compact (icons only)
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    padding: 3,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  compactBtn: {
    width: 34,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactBtnActiveLight: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...shadowSoft,
  },
  compactBtnActiveDark: {
    backgroundColor: 'rgba(17,24,39,0.92)',
    ...shadowSoft,
  },
});