/**
 * ColorSchemePicker -- color scheme swatches for the selected template.
 * Shows gradient circles for each color scheme with selection and lock states.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getTemplateById, ColorScheme } from '../../../../config/eCardTemplates';

const ACCENT = '#00C853';

interface ColorSchemePickerProps {
  templateId: string;
  selectedSchemeId: string | null;
  onSelect: (schemeId: string) => void;
  isPro: boolean;
  isDark: boolean;
}

export default function ColorSchemePicker({
  templateId,
  selectedSchemeId,
  onSelect,
  isPro,
  isDark,
}: ColorSchemePickerProps) {
  const template = getTemplateById(templateId);
  if (!template) return null;

  const textSecondary = isDark ? '#94A3B8' : '#6B7280';

  return (
    <View style={styles.container}>
      {template.colorSchemes.map((scheme) => {
        const isSelected = selectedSchemeId === scheme.id;
        const isLocked = !scheme.isFree && !isPro;

        return (
          <TouchableOpacity
            key={scheme.id}
            onPress={() => !isLocked && onSelect(scheme.id)}
            activeOpacity={isLocked ? 0.5 : 0.7}
            disabled={isLocked}
            accessibilityLabel={`${scheme.name} color scheme${isSelected ? ', selected' : ''}${isLocked ? ', locked' : ''}`}
            style={[
              styles.swatch,
              {
                borderColor: isSelected ? ACCENT : 'transparent',
                opacity: isLocked ? 0.5 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={[
                scheme.primary,
                scheme.secondary || scheme.primary,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              {/* Lock overlay */}
              {isLocked && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
                </View>
              )}

              {/* Selected checkmark */}
              {isSelected && !isLocked && (
                <View style={styles.checkOverlay}>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
