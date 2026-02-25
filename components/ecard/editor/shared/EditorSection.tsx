/**
 * EditorSection -- collapsible section wrapper for the card editor.
 * Each section has a title, Ionicons icon, and collapse/expand toggle.
 * Uses LayoutAnimation for smooth expand/collapse.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ACCENT = '#00C853';

interface EditorSectionProps {
  id: string;
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  isDark: boolean;
}

export default function EditorSection({
  id,
  title,
  icon,
  defaultOpen = true,
  children,
  isDark,
}: EditorSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
    setIsOpen((prev) => !prev);
  }, []);

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const containerBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const chevronColor = isDark ? '#64748B' : '#9CA3AF';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: containerBg,
          borderColor: borderColor,
        },
      ]}
    >
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.7}
        style={styles.header}
        accessibilityRole="button"
        accessibilityLabel={`${title} section, ${isOpen ? 'expanded' : 'collapsed'}`}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={20} color={ACCENT} />
        </View>
        <Text style={[styles.title, { color: textPrimary }]}>{title}</Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={chevronColor}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 10,
  },
  iconContainer: {
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
