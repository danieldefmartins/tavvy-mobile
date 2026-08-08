/**
 * StudioLivePreview — Full-size card preview rendered on a dark canvas.
 *
 * Uses renderTemplateLayout() to show the actual card as the user edits.
 * The card is rendered inside a phone-shaped frame with rounded corners.
 * Tapping different sections of the card opens the relevant tab.
 */
import React, { useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { TEMPLATES, Template, ColorScheme } from '../../../config/eCardTemplates';
import { renderTemplateLayout, CardData as LayoutCardData } from '../../../screens/ecard/TemplateLayouts';
import type { StudioTabId } from './StudioTabBar';

// ── Constants ────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.round(SCREEN_WIDTH - 48); // 24px padding each side
const CANVAS_BG = '#1C1C1E';

// ── Props ────────────────────────────────────────────────────────────────────
interface StudioLivePreviewProps {
  onTapSection?: (tab: StudioTabId) => void;
  maxHeight?: number;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StudioLivePreview({
  onTapSection,
  maxHeight,
}: StudioLivePreviewProps) {
  const { state } = useEditor();
  const card = state.card;

  // Resolve template + color scheme
  const { template, colorScheme } = useMemo(() => {
    if (!card) return { template: null, colorScheme: null };
    const tmpl = TEMPLATES.find((t) => t.id === card.template_id) || TEMPLATES[0];
    const scheme =
      tmpl.colorSchemes.find((cs) => cs.id === card.color_scheme_id) ||
      tmpl.colorSchemes[0];
    return { template: tmpl, colorScheme: scheme };
  }, [card?.template_id, card?.color_scheme_id]);

  // Build layout card data from editor state
  const layoutData: LayoutCardData = useMemo(() => {
    if (!card) {
      return {
        profileImage: null,
        name: 'Your Name',
        titleRole: 'Your Title',
        bio: '',
        email: '',
        phone: '',
        website: '',
        websiteLabel: 'Website',
        address: '',
      };
    }
    return {
      profileImage: card.profile_photo_url || null,
      name: card.full_name || 'Your Name',
      titleRole: card.title || 'Your Title',
      bio: card.bio || '',
      email: card.email || '',
      phone: card.phone || '',
      website: card.website || '',
      websiteLabel: card.website_label || 'Website',
      address: card.address || card.city || '',
    };
  }, [card]);

  if (!template || !colorScheme) {
    return <View style={[styles.canvas, { height: 300 }]} />;
  }

  const textColor = colorScheme.text || '#fff';
  const textSecondary = colorScheme.textSecondary || 'rgba(255,255,255,0.7)';
  const isLightCard = colorScheme.text === '#2d2d2d' || colorScheme.text === '#333333';

  return (
    <View style={[styles.canvas, maxHeight ? { maxHeight } : undefined]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => onTapSection?.('profile')}
          style={[
            styles.cardFrame,
            { backgroundColor: colorScheme.cardBg || '#fff' },
          ]}
        >
          {renderTemplateLayout({
            layout: template.layout,
            color: colorScheme,
            data: layoutData,
            isEditable: false,
            textColor,
            textSecondary,
            isLightCard,
          })}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: CANVAS_BG,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  cardFrame: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
});
