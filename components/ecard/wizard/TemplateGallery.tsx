/**
 * TemplateGallery -- Full-size horizontal carousel of template card previews.
 *
 * Replaces the old small-gradient-thumbnail grid with a paginated FlatList
 * that renders renderTemplateLayout() for each template using sample data,
 * wrapped in a phone-shaped card frame. Includes dot indicators and a
 * color-scheme picker row for the currently visible template.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ViewToken,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TEMPLATES, Template, ColorScheme } from '../../../config/eCardTemplates';
import { renderTemplateLayout } from '../../../screens/ecard/TemplateLayouts';

// ── Constants ──────────────────────────────────────────────
const ACCENT = '#00C853';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.85);
const GAP = 16;
const SNAP_INTERVAL = CARD_WIDTH + GAP;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

// ── Template category mapping (matches web) ────────────────
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

// ── Sample data for preview rendering ──────────────────────
const SAMPLE_DATA = {
  profileImage: null,
  name: 'Jane Smith',
  titleRole: 'Content Creator & Designer',
  bio: 'Helping brands tell their story through design.',
  email: 'jane@example.com',
  phone: '+1 (555) 123-4567',
  website: 'www.janesmith.com',
  websiteLabel: 'My Website',
  address: 'Los Angeles, CA',
};

// ── Props ──────────────────────────────────────────────────
interface TemplateGalleryProps {
  cardType: string;
  countryTemplate?: string;
  selectedTemplateId: string | null;
  selectedColorSchemeId: string | null;
  onSelect: (templateId: string, colorSchemeId: string) => void;
  onBack: () => void;
  isPro: boolean;
  isDark: boolean;
}

// ── Internal state per template (tracks chosen color scheme index) ──
interface TemplateItem {
  template: Template;
  colorIndex: number;
}

export default function TemplateGallery({
  cardType,
  countryTemplate,
  selectedTemplateId,
  selectedColorSchemeId,
  onSelect,
  onBack,
  isPro,
  isDark,
}: TemplateGalleryProps) {
  // ── Theme colors ──
  const bg = isDark ? '#0D0D0D' : '#F5F5F5';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const dotInactive = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';

  // ── Filter templates by cardType category ──
  const filteredTemplates = useMemo(() => {
    const categoryIds = TEMPLATE_CATEGORIES[cardType];
    if (!categoryIds) return TEMPLATES;
    return TEMPLATES.filter(t => categoryIds.includes(t.id));
  }, [cardType]);

  // ── Build items array with per-template color index ──
  const [colorIndices, setColorIndices] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    filteredTemplates.forEach(t => {
      // If there is a pre-selected color scheme for this template, use it
      if (selectedTemplateId === t.id && selectedColorSchemeId) {
        const idx = t.colorSchemes.findIndex(cs => cs.id === selectedColorSchemeId);
        map[t.id] = idx >= 0 ? idx : 0;
      } else {
        map[t.id] = 0;
      }
    });
    return map;
  });

  const items: TemplateItem[] = useMemo(
    () => filteredTemplates.map(t => ({ template: t, colorIndex: colorIndices[t.id] ?? 0 })),
    [filteredTemplates, colorIndices],
  );

  // ── Current visible index ──
  const [activeIndex, setActiveIndex] = useState(() => {
    if (selectedTemplateId) {
      const idx = filteredTemplates.findIndex(t => t.id === selectedTemplateId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const flatListRef = useRef<FlatList<TemplateItem>>(null);

  // ── Viewability tracking ──
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        const newIndex = viewableItems[0].index;
        setActiveIndex(newIndex);
      }
    },
  ).current;

  // ── Auto-select template when carousel settles ──
  const handleMomentumScrollEnd = useCallback(() => {
    const item = items[activeIndex];
    if (!item) return;
    const { template } = item;
    const ci = colorIndices[template.id] ?? 0;
    const scheme = template.colorSchemes[ci];
    if (scheme && !(template.isPremium && !isPro)) {
      onSelect(template.id, scheme.id);
    }
  }, [activeIndex, items, colorIndices, isPro, onSelect]);

  // ── Auto-select first template on mount (matches web behavior) ──
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (hasAutoSelected.current) return;
    if (items.length === 0) return;
    // If a template is already selected (e.g. politician flow), keep it
    if (selectedTemplateId) {
      hasAutoSelected.current = true;
      return;
    }
    const item = items[0];
    const { template } = item;
    if (template.isPremium && !isPro) return; // Skip locked
    const scheme = template.colorSchemes[0];
    if (scheme) {
      hasAutoSelected.current = true;
      onSelect(template.id, scheme.id);
    }
  }, [items, selectedTemplateId, isPro, onSelect]);

  // ── Color scheme selection ──
  const handleColorSelect = useCallback(
    (templateId: string, schemeIndex: number) => {
      setColorIndices(prev => ({ ...prev, [templateId]: schemeIndex }));
      const tmpl = filteredTemplates.find(t => t.id === templateId);
      if (tmpl) {
        const scheme = tmpl.colorSchemes[schemeIndex];
        if (scheme && !(tmpl.isPremium && !isPro)) {
          onSelect(templateId, scheme.id);
        }
      }
    },
    [filteredTemplates, isPro, onSelect],
  );

  // ── Current active template ──
  const activeTemplate = items[activeIndex]?.template;
  const activeColorIndex = activeTemplate ? (colorIndices[activeTemplate.id] ?? 0) : 0;

  // ── Safe template renderer (prevents silent FlatList crash) ──
  const safeRenderLayout = useCallback(
    (template: Template, scheme: ColorScheme) => {
      try {
        return renderTemplateLayout({
          layout: template.layout,
          color: scheme,
          data: SAMPLE_DATA,
          isEditable: false,
          textColor: scheme.text || '#fff',
          textSecondary: scheme.textSecondary || 'rgba(255,255,255,0.7)',
          isLightCard: scheme.text === '#2d2d2d',
        });
      } catch (err) {
        console.error(`[TemplateGallery] render failed for ${template.id}:`, err);
        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, minHeight: 300 }}>
            <Ionicons name="image-outline" size={40} color="rgba(0,0,0,0.2)" />
            <Text style={{ marginTop: 8, fontSize: 13, color: 'rgba(0,0,0,0.4)' }}>Preview unavailable</Text>
          </View>
        );
      }
    },
    [],
  );

  // ── Render a single carousel card ──
  const renderItem = useCallback(
    ({ item }: { item: TemplateItem }) => {
      const { template } = item;
      const ci = colorIndices[template.id] ?? 0;
      const scheme = template.colorSchemes[ci] || template.colorSchemes[0];
      const isLocked = template.isPremium && !isPro;
      const isSelected = selectedTemplateId === template.id;

      return (
        <View style={[styles.slideContainer, { width: CARD_WIDTH, marginRight: GAP }]}>
          {/* Phone-shaped card frame */}
          <TouchableOpacity
            activeOpacity={isLocked ? 0.6 : 0.9}
            onPress={() => {
              if (!isLocked) {
                onSelect(template.id, scheme.id);
              }
            }}
            style={[
              styles.cardFrame,
              {
                backgroundColor: scheme.cardBg || '#fff',
                borderColor: isSelected ? ACCENT : 'transparent',
                borderWidth: isSelected ? 2.5 : 0,
              },
            ]}
          >
            {/* Render actual template layout */}
            <View style={styles.layoutWrapper} pointerEvents="none">
              {safeRenderLayout(template, scheme)}
            </View>

            {/* Lock overlay for premium templates */}
            {isLocked && (
              <View style={styles.lockOverlay}>
                <View style={styles.lockIconContainer}>
                  <Ionicons name="lock-closed" size={28} color="#FFFFFF" />
                  <Text style={styles.lockText}>Pro</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Template name + badge */}
          <View style={styles.labelRow}>
            <Text style={[styles.templateName, { color: textPrimary }]} numberOfLines={1}>
              {template.name}
            </Text>
            {template.isPremium ? (
              <View style={styles.proBadge}>
                <Ionicons name="star" size={10} color="#FFFFFF" />
                <Text style={styles.proBadgeText}>Pro</Text>
              </View>
            ) : (
              <Text style={[styles.freeBadge, { color: textSecondary }]}>Free</Text>
            )}
          </View>
        </View>
      );
    },
    [colorIndices, isPro, selectedTemplateId, onSelect, textPrimary, textSecondary, safeRenderLayout],
  );

  const keyExtractor = useCallback((item: TemplateItem) => item.template.id, []);

  // ── Scroll to pre-selected template on mount ──
  useEffect(() => {
    if (activeIndex > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: SNAP_INTERVAL * activeIndex,
          animated: false,
        });
      }, 100);
    }
  }, []); // Run once on mount

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextBlock}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Choose your look</Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Swipe to browse templates
          </Text>
        </View>
      </View>

      {/* ── Carousel ── */}
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={{
          paddingLeft: SIDE_PADDING,
          paddingRight: SIDE_PADDING,
          flexGrow: items.length === 0 ? 1 : undefined,
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <Ionicons name="albums-outline" size={48} color={textSecondary} />
            <Text style={{ marginTop: 12, fontSize: 15, color: textSecondary, textAlign: 'center' }}>
              No templates available for this category
            </Text>
          </View>
        }
      />

      {/* ── Dot indicators ── */}
      <View style={styles.dotsRow}>
        {items.map((item, i) => (
          <View
            key={item.template.id}
            style={[
              styles.dot,
              {
                backgroundColor: i === activeIndex ? ACCENT : dotInactive,
                width: i === activeIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* ── Color scheme picker ── */}
      {activeTemplate && activeTemplate.colorSchemes.length > 1 && (
        <View style={styles.colorRow}>
          <Text style={[styles.colorLabel, { color: textSecondary }]}>Color</Text>
          <View style={styles.colorCircles}>
            {activeTemplate.colorSchemes.map((scheme, idx) => {
              const isActiveScheme = idx === activeColorIndex;
              return (
                <TouchableOpacity
                  key={scheme.id}
                  onPress={() => handleColorSelect(activeTemplate.id, idx)}
                  style={[
                    styles.colorCircleOuter,
                    isActiveScheme && styles.colorCircleSelected,
                  ]}
                >
                  <LinearGradient
                    colors={[scheme.primary, scheme.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.colorCircleInner}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },

  // Carousel item
  slideContainer: {
    alignItems: 'center',
  },
  cardFrame: {
    width: CARD_WIDTH,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  layoutWrapper: {
    width: '100%',
    minHeight: 400,
  },

  // Lock overlay
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Labels
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  freeBadge: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  // Color scheme picker
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 16,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  colorCircles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorCircleOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    padding: 2,
    borderWidth: 2.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderColor: ACCENT,
  },
  colorCircleInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
