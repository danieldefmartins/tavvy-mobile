/**
 * TemplatePicker -- horizontal carousel of realistic mini card previews.
 * Renders each template at ~0.3 scale using renderTemplateLayout().
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TEMPLATES, Template } from '../../../../config/eCardTemplates';
import { renderTemplateLayout, CardData, isColorLight } from '../../../../screens/ecard/TemplateLayouts';

const ACCENT = '#00C853';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PREVIEW_SCALE = 0.3;
const PREVIEW_WIDTH = Math.round(SCREEN_WIDTH * PREVIEW_SCALE);
const PREVIEW_HEIGHT = Math.round(PREVIEW_WIDTH * 1.55);

// Sample data for thumbnail previews
const SAMPLE_DATA: CardData = {
  profileImage: null,
  name: 'Jane Smith',
  titleRole: 'Content Creator',
  bio: 'Helping brands tell their story.',
  email: 'jane@studio.com',
  phone: '+1 (555) 123-4567',
  website: 'www.janesmith.com',
  websiteLabel: 'Website',
  address: 'Los Angeles, CA',
};

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
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';

  const filtered = filterCategory
    ? TEMPLATES.filter(t => TEMPLATE_CATEGORIES[filterCategory]?.includes(t.id))
    : TEMPLATES;

  const handleSelect = (template: Template) => {
    if (template.isPremium && !isPro) return;
    onSelect(template.id);
  };

  const renderItem = ({ item: template }: { item: Template }) => {
    const isSelected = selectedTemplateId === template.id;
    const isLocked = template.isPremium && !isPro;
    const firstScheme = template.colorSchemes[0];

    const textColor = firstScheme?.text || '#ffffff';
    const textSec = firstScheme?.textSecondary || 'rgba(255,255,255,0.7)';
    const lightCard = isColorLight(firstScheme?.cardBg || firstScheme?.primary || '#333');

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: isSelected ? ACCENT : borderColor,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleSelect(template)}
        activeOpacity={isLocked ? 0.6 : 0.8}
        disabled={isLocked}
      >
        {/* Scaled card preview */}
        <View style={[styles.previewContainer, { backgroundColor: firstScheme?.cardBg || firstScheme?.primary || '#333' }]}>
          <View style={styles.previewInner}>
            {renderTemplateLayout({
              layout: template.layout,
              color: firstScheme || template.colorSchemes[0],
              data: SAMPLE_DATA,
              isEditable: false,
              textColor,
              textSecondary: textSec,
              isLightCard: lightCard,
            })}
          </View>

          {/* Lock overlay */}
          {isLocked && (
            <View style={styles.lockOverlay}>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
              </View>
            </View>
          )}

          {/* Selected checkmark */}
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Template name + badge */}
        <Text style={[styles.name, { color: textPrimary }]} numberOfLines={1}>
          {template.name}
        </Text>
        <Text style={[styles.badge, { color: textSecondary }]}>
          {template.isPremium ? 'Pro' : 'Free'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={filtered}
      renderItem={renderItem}
      keyExtractor={(t) => t.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  card: {
    width: PREVIEW_WIDTH + 16,
    borderRadius: 14,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 10,
    alignItems: 'center',
  },
  previewContainer: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  previewInner: {
    width: SCREEN_WIDTH,
    transformOrigin: 'top left',
    transform: [{ scale: PREVIEW_SCALE }],
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  badge: {
    fontSize: 10,
    lineHeight: 14,
  },
});
