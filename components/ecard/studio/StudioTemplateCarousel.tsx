/**
 * StudioTemplateCarousel — Horizontal scrollable mini-card previews
 * for the Style tab inside Card Studio.
 *
 * Shows each template rendered with the user's actual card data (not just
 * gradient squares). Selected template has an amber border + checkmark.
 * Below the carousel, shows color scheme swatches for the active template.
 */
import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useEditor } from '../../../lib/ecard/EditorContext';
import {
  TEMPLATES,
  Template,
  ColorScheme,
} from '../../../config/eCardTemplates';
import {
  renderTemplateLayout,
  CardData as LayoutCardData,
} from '../../../screens/ecard/TemplateLayouts';

// ── Constants ────────────────────────────────────────────────────────────────
const AMBER = '#FF9F0A';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MINI_CARD_WIDTH = 140;
const MINI_CARD_HEIGHT = 200;
const SWATCH_SIZE = 28;

// ── Template category mapping ────────────────────────────────────────────────
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

// ── Props ────────────────────────────────────────────────────────────────────
interface StudioTemplateCarouselProps {
  isPro: boolean;
  filterCategory?: string;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StudioTemplateCarousel({
  isPro,
  filterCategory,
}: StudioTemplateCarouselProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const flatListRef = useRef<FlatList>(null);

  const selectedTemplateId = card?.template_id;
  const selectedColorSchemeId = card?.color_scheme_id;

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (!filterCategory) return TEMPLATES;
    const ids = TEMPLATE_CATEGORIES[filterCategory];
    return ids ? TEMPLATES.filter((t) => ids.includes(t.id)) : TEMPLATES;
  }, [filterCategory]);

  // Build card data for mini previews
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

  // Current template for color scheme picker
  const currentTemplate = useMemo(
    () => filteredTemplates.find((t) => t.id === selectedTemplateId) || filteredTemplates[0],
    [filteredTemplates, selectedTemplateId],
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectTemplate = useCallback(
    (template: Template) => {
      if (template.isPremium && !isPro) return;
      Haptics.selectionAsync();
      const scheme = template.colorSchemes[0];
      dispatch({
        type: 'SET_TEMPLATE',
        templateId: template.id,
        colorSchemeId: scheme?.id,
      });
    },
    [isPro, dispatch],
  );

  const handleSelectColorScheme = useCallback(
    (scheme: ColorScheme) => {
      Haptics.selectionAsync();
      dispatch({
        type: 'SET_FIELDS',
        fields: {
          color_scheme_id: scheme.id,
          gradient_color_1: scheme.primary,
          gradient_color_2: scheme.secondary,
        },
      });
    },
    [dispatch],
  );

  // ── Render mini card ───────────────────────────────────────────────────────
  const renderMiniCard = useCallback(
    ({ item: template }: { item: Template }) => {
      const isSelected = selectedTemplateId === template.id;
      const isLocked = template.isPremium && !isPro;
      const scheme =
        isSelected && selectedColorSchemeId
          ? template.colorSchemes.find((cs) => cs.id === selectedColorSchemeId) ||
            template.colorSchemes[0]
          : template.colorSchemes[0];

      let preview: React.ReactNode;
      try {
        preview = renderTemplateLayout({
          layout: template.layout,
          color: scheme,
          data: layoutData,
          isEditable: false,
          textColor: scheme.text || '#fff',
          textSecondary: scheme.textSecondary || 'rgba(255,255,255,0.7)',
          isLightCard: scheme.text === '#2d2d2d',
        });
      } catch {
        preview = (
          <LinearGradient
            colors={[scheme.primary, scheme.secondary]}
            style={{ flex: 1 }}
          />
        );
      }

      return (
        <TouchableOpacity
          onPress={() => handleSelectTemplate(template)}
          activeOpacity={isLocked ? 0.6 : 0.85}
          disabled={isLocked}
          style={[
            styles.miniCard,
            {
              borderColor: isSelected ? AMBER : 'rgba(255,255,255,0.08)',
              borderWidth: isSelected ? 2.5 : 1.5,
              opacity: isLocked ? 0.5 : 1,
            },
          ]}
        >
          {/* Selected checkmark */}
          {isSelected && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={13} color="#000" />
            </View>
          )}
          {/* Lock badge */}
          {isLocked && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={12} color="#fff" />
            </View>
          )}
          {/* Mini preview (scaled down) */}
          <View style={styles.miniPreviewWrap} pointerEvents="none">
            <View style={styles.miniPreviewScale}>
              {preview}
            </View>
          </View>
          {/* Template name */}
          <View style={styles.miniFooter}>
            <Text style={styles.miniName} numberOfLines={1}>
              {template.name}
            </Text>
            <Text
              style={[
                styles.miniTier,
                template.isPremium && { color: AMBER },
              ]}
            >
              {template.isPremium ? 'Pro' : 'Free'}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedTemplateId, selectedColorSchemeId, isPro, layoutData, handleSelectTemplate],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Template carousel */}
      <FlatList
        ref={flatListRef}
        data={filteredTemplates}
        renderItem={renderMiniCard}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        snapToInterval={MINI_CARD_WIDTH + 12}
        decelerationRate="fast"
      />

      {/* Color scheme swatches */}
      {currentTemplate && currentTemplate.colorSchemes.length > 1 && (
        <View style={styles.swatchSection}>
          <Text style={styles.swatchLabel}>Color Scheme</Text>
          <View style={styles.swatchRow}>
            {currentTemplate.colorSchemes.map((scheme) => {
              const isActive = selectedColorSchemeId === scheme.id;
              return (
                <TouchableOpacity
                  key={scheme.id}
                  onPress={() => handleSelectColorScheme(scheme)}
                  activeOpacity={0.7}
                  style={[
                    styles.swatch,
                    {
                      borderColor: isActive ? AMBER : 'rgba(255,255,255,0.1)',
                      borderWidth: isActive ? 2.5 : 1.5,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[scheme.primary, scheme.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.swatchGradient}
                  />
                  {isActive && (
                    <View style={styles.swatchCheck}>
                      <Ionicons name="checkmark" size={10} color="#000" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 4,
  },
  miniCard: {
    width: MINI_CARD_WIDTH,
    height: MINI_CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPreviewWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  miniPreviewScale: {
    transform: [{ scale: 0.35 }],
    transformOrigin: 'top left',
    width: MINI_CARD_WIDTH / 0.35,
    height: (MINI_CARD_HEIGHT - 40) / 0.35,
  },
  miniFooter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  miniName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 14,
  },
  miniTier: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  // Color scheme swatches
  swatchSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  swatchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  swatchGradient: {
    flex: 1,
  },
  swatchCheck: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,159,10,0.3)',
  },
});
