import FocusedStatusBar, { useRestoreFocusedStatusBar } from '../../FocusedStatusBar';
/** Catalog chooser using the actual public renderer; example content is display-only. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Modal, Platform, useWindowDimensions, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { TEMPLATES, Template } from '../../../config/eCardTemplates';
import { StudioPreviewFrame } from '../editor/StudioPreview';
import { templatePreviewData } from '../../../lib/ecard/templatePreviewData';
import { TEMPLATE_CATEGORIES, canUseTemplate } from '../../../lib/ecard/templateSelection';
import { useReleaseCopy } from '../../../hooks/useReleaseCopy';

const ACCENT = '#6C2496', GAP = 16;
interface TemplateGalleryProps {
  /** A gallery filter, never the persisted card_type. */
  cardType: string;
  countryTemplate?: string;
  selectedTemplateId: string | null;
  selectedColorSchemeId: string | null;
  onSelect: (templateId: string, colorSchemeId: string) => void;
  isPro: boolean;
  isDark: boolean;
  onAvailabilityChange?: (available: boolean) => void;
}
export default function TemplateGallery({ cardType, countryTemplate, selectedTemplateId, selectedColorSchemeId, onSelect, isPro, isDark, onAvailabilityChange }: TemplateGalleryProps) {
  const copy = useReleaseCopy();
  const restoreStatusBar = useRestoreFocusedStatusBar(isDark ? 'light-content' : 'dark-content');
  const { width } = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = useState(width), [availableHeight, setAvailableHeight] = useState(500);
  const cardWidth = Math.min(420, Math.max(1, availableWidth - 40));
  const interval = cardWidth + GAP, sidePadding = (availableWidth - cardWidth) / 2;
  const [inlinePreviewActive, setInlinePreviewActive] = useState(true);
  const [stageHeight, setStageHeight] = useState(350), [fullPreview, setFullPreview] = useState(false);
  const filtered = useMemo(() => {
    const ids = TEMPLATE_CATEGORIES[cardType];
    const result = ids ? TEMPLATES.filter(item => ids.includes(item.id)) : TEMPLATES;
    return countryTemplate ? [...result.filter(item => item.id === countryTemplate), ...result.filter(item => item.id !== countryTemplate)] : result;
  }, [cardType, countryTemplate]);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, filtered.findIndex(item => item.id === selectedTemplateId)));
  const [colors, setColors] = useState<Record<string, string>>(() => selectedTemplateId && selectedColorSchemeId ? { [selectedTemplateId]: selectedColorSchemeId } : {});
  const list = useRef<FlatList<Template>>(null);
  const active = filtered[activeIndex];
  const schemeFor = useCallback((template: Template) => template.colorSchemes.find(item => item.id === colors[template.id]) || template.colorSchemes[0], [colors]);
  const activeScheme = active ? schemeFor(active) : undefined;
  const activeAllowed = !!active && !!activeScheme && canUseTemplate(active, activeScheme.id, isPro);
  const primary = isDark ? '#F8FAFC' : '#202124', secondary = isDark ? '#CBD5E1' : '#596170';
  const background = isDark ? '#111018' : '#F7F7FA';

  useEffect(() => {
    if (selectedTemplateId && selectedColorSchemeId) setColors(previous => previous[selectedTemplateId] === selectedColorSchemeId ? previous : { ...previous, [selectedTemplateId]: selectedColorSchemeId });
  }, [selectedTemplateId, selectedColorSchemeId]);
  useEffect(() => {
    onAvailabilityChange?.(activeAllowed && active?.id === selectedTemplateId && activeScheme?.id === selectedColorSchemeId);
  }, [activeAllowed, active?.id, activeScheme?.id, selectedTemplateId, selectedColorSchemeId, onAvailabilityChange]);
  useEffect(() => {
    const timer = setTimeout(() => list.current?.scrollToOffset({ offset: activeIndex * interval, animated: false }), 0);
    return () => clearTimeout(timer);
    // Preserve the currently viewed design when the device rotates, without choosing another design.
  }, [interval]);

  const selectAt = (index: number) => {
    const template = filtered[index]; if (!template) return;
    setActiveIndex(index);
    const scheme = schemeFor(template);
    if (canUseTemplate(template, scheme.id, isPro)) onSelect(template.id, scheme.id);
  };
  const moveTo = (index: number) => {
    if (index < 0 || index >= filtered.length) return;
    selectAt(index); list.current?.scrollToOffset({ offset: interval * index, animated: true });
    void Haptics.selectionAsync();
  };
  const settle = (event: NativeSyntheticEvent<NativeScrollEvent>) => selectAt(Math.max(0, Math.min(filtered.length - 1, Math.round(event.nativeEvent.contentOffset.x / interval))));
  const chooseColor = (schemeId: string) => {
    if (!active || !canUseTemplate(active, schemeId, isPro)) return;
    setColors(previous => ({ ...previous, [active.id]: schemeId })); onSelect(active.id, schemeId); void Haptics.selectionAsync();
  };
  // Keep one active native WebView. iOS can leave a covered WebView blank after a modal.
  const openFullPreview = () => { setInlinePreviewActive(false); setFullPreview(true); };
  const closeFullPreview = () => {
    setFullPreview(false);
    if (Platform.OS !== 'ios') setInlinePreviewActive(true);
  };
  const dismissFullPreview = () => { setInlinePreviewActive(true); restoreStatusBar(); };
  const currentExample = useMemo(() => active ? templatePreviewData(active, activeScheme?.id) : null, [active, activeScheme?.id]);

  return <View style={[styles.root, { backgroundColor: background }]} onLayout={event => { setAvailableWidth(event.nativeEvent.layout.width); setAvailableHeight(event.nativeEvent.layout.height); }}>
    <ScrollView nestedScrollEnabled contentContainerStyle={{ height: Math.max(460, availableHeight) }}>
      <View style={styles.navigation}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('Previous template')} accessibilityState={{ disabled: activeIndex === 0 }} disabled={activeIndex === 0} onPress={() => moveTo(activeIndex - 1)} style={styles.control}><Ionicons name="chevron-back" size={24} color={activeIndex === 0 ? secondary : primary} /></TouchableOpacity>
        <View style={styles.heading}><Text style={[styles.hint, { color: secondary }]}>{copy('Swipe to browse templates')}</Text><Text accessibilityLiveRegion="polite" style={{ color: primary, fontWeight: '600' }}>{filtered.length ? activeIndex + 1 : 0} / {filtered.length}</Text></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('Next template')} accessibilityState={{ disabled: activeIndex >= filtered.length - 1 }} disabled={activeIndex >= filtered.length - 1} onPress={() => moveTo(activeIndex + 1)} style={styles.control}><Ionicons name="chevron-forward" size={24} color={primary} /></TouchableOpacity>
      </View>
      <FlatList ref={list} horizontal style={styles.carousel} data={filtered} keyExtractor={item => item.id}
        onLayout={event => setStageHeight(event.nativeEvent.layout.height)}
        showsHorizontalScrollIndicator={false} snapToInterval={interval} snapToAlignment="start" decelerationRate="fast"
        onMomentumScrollEnd={settle} onScrollEndDrag={settle} onScrollBeginDrag={() => onAvailabilityChange?.(false)}
        contentContainerStyle={{ paddingLeft: sidePadding, paddingRight: Math.max(0, sidePadding - GAP) }}
        getItemLayout={(_, index) => ({ length: interval, offset: interval * index, index })}
        initialScrollIndex={activeIndex} extraData={`${activeIndex}:${JSON.stringify(colors)}:${isPro}:${isDark}:${stageHeight}:${inlinePreviewActive}`}
        renderItem={({ item, index }) => {
          const scheme = schemeFor(item), example = templatePreviewData(item, scheme.id);
          return <View style={{ width: cardWidth, marginRight: GAP, height: stageHeight }}>
            {index === activeIndex && inlinePreviewActive && <StudioPreviewFrame isDark={isDark} card={example.card} links={example.links} showCaption={false} />}
          </View>;
        }} />
      {active && <>
        <View style={styles.designLabel}>
          <View style={{ flex: 1 }}><Text style={{ color: primary, fontWeight: '700', fontSize: 15 }}>{active.name}</Text><Text style={{ color: secondary, fontSize: 12 }}>{copy(activeAllowed ? (active.isPremium || !activeScheme?.isFree ? 'Pro' : 'Free') : 'Pro design or color')}</Text></View>
          <TouchableOpacity accessibilityRole="button" style={styles.fullButton} onPress={openFullPreview}><Ionicons name="expand-outline" size={18} color={primary} /><Text style={{ color: primary, fontSize: 12 }}>{copy('Open full preview')}</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal style={{ flexGrow: 0, height: 56 }} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatches}>
          {active.colorSchemes.map(scheme => {
            const locked = !canUseTemplate(active, scheme.id, isPro), chosen = activeScheme?.id === scheme.id;
            return <TouchableOpacity key={scheme.id} accessibilityRole="button" accessibilityLabel={`${scheme.name}${locked ? ' · Pro' : ''}`} accessibilityState={{ selected: chosen, disabled: locked }} disabled={locked} onPress={() => chooseColor(scheme.id)} style={[styles.swatch, { borderColor: chosen ? (isDark ? '#BB86E0' : ACCENT) : 'transparent' }]}>
              <LinearGradient colors={[scheme.primary, scheme.secondary]} style={styles.swatchFill} />
              {locked && <View style={styles.lock}><Ionicons name="lock-closed" color="#FFFFFF" size={10} /></View>}
            </TouchableOpacity>;
          })}
        </ScrollView>
      </>}
      {!active && <Text style={{ color: secondary, padding: 20 }}>{copy('No templates available for this category')}</Text>}
    </ScrollView>
    <Modal visible={fullPreview} animationType="slide" onRequestClose={closeFullPreview} presentationStyle="fullScreen" onShow={restoreStatusBar} onDismiss={dismissFullPreview}>
      <SafeAreaProvider>
      <FocusedStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}><Text accessibilityRole="header" style={{ color: primary, flex: 1, fontWeight: '700' }}>{active?.name}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('Close preview')} onPress={closeFullPreview} style={styles.control}><Ionicons name="close" size={24} color={primary} /></TouchableOpacity></View>
        {currentExample && <StudioPreviewFrame isDark={isDark} card={currentExample.card} links={currentExample.links} />}
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 }, navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  control: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }, heading: { alignItems: 'center', gap: 2 }, hint: { fontSize: 12 },
  carousel: { flex: 1 }, designLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, minHeight: 46 },
  fullButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  swatches: { paddingHorizontal: 20, paddingVertical: 6, gap: 6 }, swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  swatchFill: { width: 32, height: 32, borderRadius: 16 }, lock: { position: 'absolute', bottom: 3, right: 1, backgroundColor: '#334155', borderRadius: 8, padding: 3 },
  modalHeader: { minHeight: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
});
