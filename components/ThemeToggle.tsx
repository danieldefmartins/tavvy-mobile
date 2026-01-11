// ============================================
// ThemeToggle.tsx
// Light/Dark mode toggle component
// Path: components/ThemeToggle.tsx
// ============================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ThemeToggleProps {
  // Current theme mode
  currentMode?: 'light' | 'dark' | 'system';
  // Callback when mode changes
  onModeChange?: (mode: 'light' | 'dark' | 'system') => void;
  // Compact version (just icons)
  compact?: boolean;
}

export default function ThemeToggle({
  currentMode = 'system',
  onModeChange,
  compact = false,
}: ThemeToggleProps) {
  const systemColorScheme = useColorScheme();
  
  // Determine active mode for display
  const activeMode = currentMode === 'system' ? systemColorScheme : currentMode;

  const handlePress = (mode: 'light' | 'dark') => {
    onModeChange?.(mode);
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <TouchableOpacity
          style={[
            styles.compactButton,
            activeMode === 'light' && styles.compactButtonActive,
          ]}
          onPress={() => handlePress('light')}
        >
          <Ionicons
            name="sunny"
            size={18}
            color={activeMode === 'light' ? '#F59E0B' : '#9CA3AF'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.compactButton,
            activeMode === 'dark' && styles.compactButtonActiveDark,
          ]}
          onPress={() => handlePress('dark')}
        >
          <Ionicons
            name="moon"
            size={18}
            color={activeMode === 'dark' ? '#3B82F6' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          activeMode === 'light' && styles.buttonActiveLight,
        ]}
        onPress={() => handlePress('light')}
      >
        <Ionicons
          name="sunny"
          size={16}
          color={activeMode === 'light' ? '#F59E0B' : '#6B7280'}
        />
        <Text
          style={[
            styles.buttonText,
            activeMode === 'light' && styles.buttonTextActiveLight,
          ]}
        >
          Light
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          activeMode === 'dark' && styles.buttonActiveDark,
        ]}
        onPress={() => handlePress('dark')}
      >
        <Ionicons
          name="moon"
          size={16}
          color={activeMode === 'dark' ? '#3B82F6' : '#6B7280'}
        />
        <Text
          style={[
            styles.buttonText,
            activeMode === 'dark' && styles.buttonTextActiveDark,
          ]}
        >
          Dark
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  buttonActiveLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonActiveDark: {
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  buttonTextActiveLight: {
    color: '#111827',
  },
  buttonTextActiveDark: {
    color: '#FFFFFF',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  compactButton: {
    padding: 8,
    borderRadius: 6,
  },
  compactButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  compactButtonActiveDark: {
    backgroundColor: '#1F2937',
  },
});
