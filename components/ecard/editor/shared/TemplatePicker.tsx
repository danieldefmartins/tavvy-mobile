/**
 * TemplatePicker -- 2-column grid of template cards with lock icons for premium.
 * Ports the web TemplatePicker to React Native using LinearGradient for previews.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TEMPLATES, Template } from '../../../../config/eCardTemplates';

const ACCENT = '#00C853';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2; // 16px padding on each side

// Group templates for filtering
const TEMPLATE_CATEGORIES: Record<string, string[]> = {
  business: [
    'biz-traditional', 'biz-modern', 'biz-minimalist', 'business-card',
    'pro-card', 'pro-corporate', 'pro-creative', 'cover-card', 'mobile-business',
  ],
  personal: [
    'basic', 'blogger', 'full-width', 'premium-static', 'pro-realtor',
  ],
  politician: [
    'civic-card', 'civic-card-flag', 'civic-card-bold',
    'civic-card-clean', 'civic-card-rally', 'politician-generic',
  ],
};

interface TemplatePickerProps {
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
  isPro: boolean;
  isDark: boolean;
  filterCategory?: string;
}

export default function TemplatePicker({
  selectedTemplateId,
  onSelect,
  isPro,
  isDark,
  filterCategory,
}: TemplatePickerProps) {
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';

  const filtered = filterCategory
    ? TEMPLATES.filter(t => TEMPLATE_CATEGORIES[filterCategory]?.includes(t.id))
    : TEMPLATES;

  const handleSelect = (template: Template) => {
    if (template.isPremium && !isPro) return;
    onSelect(template.id);
  };

  return (
    <View style={styles.grid}>
      {filtered.map((template) => {
        const isSelected = selectedTemplateId === template.id;
        const isLocked = template.isPremium && !isPro;
        const firstScheme = template.colorSchemes[0];

        return (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: isSelected ? ACCENT : borderColor,
                borderWidth: isSelected ? 2 : 1,
                opacity: isLocked ? 0.6 : 1,
              },
            ]}
            onPress={() => handleSelect(template)}
            activeOpacity={isLocked ? 0.6 : 0.8}
            disabled={isLocked}
          >
            {/* Gradient preview swatch */}
            <LinearGradient
              colors={[
                firstScheme?.primary || '#667eea',
                firstScheme?.secondary || '#764ba2',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.preview}
            >
              {/* Lock icon for premium */}
              {isLocked && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
                </View>
              )}
            </LinearGradient>

            {/* Template name */}
            <Text
              style={[styles.name, { color: textPrimary }]}
              numberOfLines={1}
            >
              {template.name}
            </Text>

            {/* Free/Pro badge */}
            <Text style={[styles.badge, { color: textSecondary }]}>
              {template.isPremium ? 'Pro' : 'Free'}
            </Text>

            {/* Selected checkmark */}
            {isSelected && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: 80,
    borderRadius: 10,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  lockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  badge: {
    fontSize: 11,
    lineHeight: 15,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8 + 12, // padding + offset
    left: 8 + 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
