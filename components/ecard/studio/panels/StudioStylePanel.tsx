/**
 * StudioStylePanel — Style tab content for Card Studio bottom sheet.
 *
 * Contains: live template carousel, color scheme picker, typography controls
 * (button style, button color, icon color, social icon color, font, font color).
 * All controls use the amber accent on dark background.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import { FONTS } from '../../../../config/eCardFonts';
import StudioGroup from './shared/StudioGroup';
import StudioTemplateCarousel from '../StudioTemplateCarousel';

const AMBER = '#FF9F0A';
const AMBER_BG = 'rgba(255,159,10,0.12)';
const AMBER_BORDER = '#FF9F0A';

// ── Constants ────────────────────────────────────────────────────────────────
const BUTTON_STYLES = [
  { id: 'fill', name: 'Fill' },
  { id: 'outline', name: 'Outline' },
  { id: 'rounded', name: 'Rounded' },
  { id: 'shadow', name: 'Shadow' },
  { id: 'pill', name: 'Pill' },
  { id: 'minimal', name: 'Minimal' },
];

const COLOR_SWATCHES = [
  { id: 'auto', label: 'Auto', color: null },
  { id: '#000000', label: '', color: '#000000' },
  { id: '#FFFFFF', label: '', color: '#FFFFFF' },
  { id: '#1a2744', label: '', color: '#1a2744' },
  { id: '#00C853', label: '', color: '#00C853' },
  { id: '#FF9F0A', label: '', color: '#FF9F0A' },
  { id: '#ef4444', label: '', color: '#ef4444' },
  { id: '#8b5cf6', label: '', color: '#8b5cf6' },
  { id: '#3b82f6', label: '', color: '#3b82f6' },
  { id: '#ec4899', label: '', color: '#ec4899' },
  { id: '#14b8a6', label: '', color: '#14b8a6' },
  { id: '#f97316', label: '', color: '#f97316' },
];

const SOCIAL_ICON_OPTIONS = [
  { id: 'standard', label: 'Standard' },
  { id: 'white', label: 'White', swatch: '#FFFFFF' },
  { id: 'black', label: 'Black', swatch: '#000000' },
  { id: 'custom', label: 'Custom' },
];

const FONT_COLOR_OPTIONS = [
  { id: 'auto', label: 'Auto' },
  { id: 'black', label: 'Black', dot: '#000000' },
  { id: 'white', label: 'White', dot: '#FFFFFF' },
  { id: 'custom', label: 'Custom', dot: 'rainbow' },
];

// ── Props ────────────────────────────────────────────────────────────────────
interface StudioStylePanelProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StudioStylePanel({ isDark, isPro }: StudioStylePanelProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const [customButtonColor, setCustomButtonColor] = useState('');
  const [customIconColor, setCustomIconColor] = useState('');
  const [customSocialColor, setCustomSocialColor] = useState('');
  const [customFontColor, setCustomFontColor] = useState('');

  if (!card) return null;

  const set = (field: string, value: any) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value });
  };

  const buttonStyle = card.button_style || 'fill';
  const buttonColor = card.button_color || 'auto';
  const iconColor = card.icon_color || 'auto';
  const socialIconColor = card.social_icon_color || 'standard';
  const fontStyle = card.font_style || 'default';
  const fontColor = card.font_color || 'auto';

  // Determine card type category for template filtering
  const cardType = card.card_type || 'business';

  return (
    <View style={styles.container}>
      {/* Template Carousel */}
      <StudioGroup title="Template">
        <View style={styles.carouselWrap}>
          <StudioTemplateCarousel isPro={isPro} filterCategory={cardType} />
        </View>
      </StudioGroup>

      {/* Gradient Colors */}
      <StudioGroup title="Gradient Colors">
        <View style={styles.gradientRow}>
          <View style={styles.gradientField}>
            <Text style={styles.gradientLabel}>Color 1</Text>
            <View style={styles.gradientInputRow}>
              <View
                style={[
                  styles.gradientSwatch,
                  { backgroundColor: card.gradient_color_1 || '#667eea' },
                ]}
              />
              <TextInput
                style={styles.hexInput}
                value={card.gradient_color_1 || '#667eea'}
                onChangeText={(v) => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) set('gradient_color_1', v);
                }}
                placeholder="#667eea"
                placeholderTextColor="rgba(255,255,255,0.2)"
                maxLength={7}
                autoCapitalize="none"
              />
            </View>
          </View>
          <View style={styles.gradientField}>
            <Text style={styles.gradientLabel}>Color 2</Text>
            <View style={styles.gradientInputRow}>
              <View
                style={[
                  styles.gradientSwatch,
                  { backgroundColor: card.gradient_color_2 || '#764ba2' },
                ]}
              />
              <TextInput
                style={styles.hexInput}
                value={card.gradient_color_2 || '#764ba2'}
                onChangeText={(v) => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(v)) set('gradient_color_2', v);
                }}
                placeholder="#764ba2"
                placeholderTextColor="rgba(255,255,255,0.2)"
                maxLength={7}
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>
      </StudioGroup>

      {/* Button Style */}
      <StudioGroup title="Button Style">
        <View style={styles.chipGrid}>
          {BUTTON_STYLES.map((style) => {
            const isActive = buttonStyle === style.id;
            return (
              <TouchableOpacity
                key={style.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  set('button_style', style.id);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? AMBER : 'transparent',
                    borderColor: isActive ? AMBER : 'rgba(255,255,255,0.12)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: isActive ? '#000' : 'rgba(255,255,255,0.6)' },
                    isActive && { fontWeight: '700' },
                  ]}
                >
                  {style.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </StudioGroup>

      {/* Button Color */}
      <StudioGroup title="Button Color">
        <View style={styles.swatchGrid}>
          {COLOR_SWATCHES.map((swatch) => {
            const isActive = buttonColor === swatch.id;
            return (
              <TouchableOpacity
                key={swatch.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  set('button_color', swatch.id);
                }}
                style={[
                  styles.swatch,
                  {
                    borderColor: isActive ? AMBER_BORDER : 'rgba(255,255,255,0.1)',
                    borderWidth: isActive ? 2.5 : 1.5,
                  },
                ]}
              >
                {swatch.color ? (
                  <View
                    style={[
                      styles.swatchInner,
                      { backgroundColor: swatch.color },
                    ]}
                  />
                ) : (
                  <Text style={styles.swatchAutoText}>A</Text>
                )}
                {isActive && (
                  <View style={styles.swatchCheck}>
                    <Ionicons name="checkmark" size={10} color={swatch.color === '#FFFFFF' ? '#000' : '#fff'} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </StudioGroup>

      {/* Icon Color */}
      <StudioGroup title="Icon Color">
        <View style={styles.swatchGrid}>
          {COLOR_SWATCHES.map((swatch) => {
            const isActive = iconColor === swatch.id;
            return (
              <TouchableOpacity
                key={swatch.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  set('icon_color', swatch.id);
                }}
                style={[
                  styles.swatch,
                  {
                    borderColor: isActive ? AMBER_BORDER : 'rgba(255,255,255,0.1)',
                    borderWidth: isActive ? 2.5 : 1.5,
                  },
                ]}
              >
                {swatch.color ? (
                  <View
                    style={[
                      styles.swatchInner,
                      { backgroundColor: swatch.color },
                    ]}
                  />
                ) : (
                  <Text style={styles.swatchAutoText}>A</Text>
                )}
                {isActive && (
                  <View style={styles.swatchCheck}>
                    <Ionicons name="checkmark" size={10} color={swatch.color === '#FFFFFF' ? '#000' : '#fff'} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </StudioGroup>

      {/* Social Media Icon Color */}
      <StudioGroup title="Social Media Icon Color">
        <View style={styles.socialChipRow}>
          {SOCIAL_ICON_OPTIONS.map((opt) => {
            const isActive = socialIconColor === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  set('social_icon_color', opt.id);
                }}
                style={[
                  styles.socialChip,
                  {
                    borderColor: isActive ? AMBER_BORDER : 'rgba(255,255,255,0.12)',
                    backgroundColor: isActive ? AMBER_BG : 'transparent',
                  },
                ]}
              >
                {opt.swatch && (
                  <View
                    style={[
                      styles.miniSwatch,
                      {
                        backgroundColor: opt.swatch,
                        borderColor: opt.swatch === '#FFFFFF' ? '#ddd' : 'transparent',
                      },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.socialChipLabel,
                    { color: isActive ? AMBER : 'rgba(255,255,255,0.6)' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </StudioGroup>

      {/* Font */}
      <StudioGroup title="Font">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fontScroll}
        >
          {FONTS.slice(0, 12).map((font) => {
            const isActive = fontStyle === font.id;
            const isLocked = font.isPremium && !isPro;
            return (
              <TouchableOpacity
                key={font.id}
                onPress={() => {
                  if (isLocked) return;
                  Haptics.selectionAsync();
                  set('font_style', font.id);
                }}
                disabled={isLocked}
                style={[
                  styles.fontCard,
                  {
                    borderColor: isActive ? AMBER_BORDER : 'rgba(255,255,255,0.08)',
                    backgroundColor: isActive ? AMBER_BG : 'transparent',
                    opacity: isLocked ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.fontPreview,
                    font.style as any,
                    { color: isActive ? AMBER : 'rgba(255,255,255,0.7)' },
                  ]}
                >
                  Aa
                </Text>
                <Text
                  style={[
                    styles.fontName,
                    { color: isActive ? AMBER : 'rgba(255,255,255,0.35)' },
                  ]}
                  numberOfLines={1}
                >
                  {font.name}
                </Text>
                {isLocked && (
                  <Ionicons
                    name="lock-closed"
                    size={10}
                    color="rgba(255,255,255,0.3)"
                    style={styles.fontLock}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </StudioGroup>

      {/* Font Color */}
      <StudioGroup title="Font Color">
        <View style={styles.fontColorRow}>
          {FONT_COLOR_OPTIONS.map((opt) => {
            const isActive = fontColor === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  set('font_color', opt.id);
                }}
                style={[
                  styles.fontColorChip,
                  {
                    borderColor: isActive ? AMBER_BORDER : 'rgba(255,255,255,0.12)',
                    backgroundColor: isActive ? AMBER_BG : 'transparent',
                  },
                ]}
              >
                {opt.dot && (
                  <View
                    style={[
                      styles.fontColorDot,
                      {
                        backgroundColor:
                          opt.dot === 'rainbow' ? undefined : opt.dot,
                      },
                      opt.dot === 'rainbow' && styles.rainbowDot,
                      opt.dot === '#FFFFFF' && { borderWidth: 1, borderColor: '#ddd' },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.fontColorLabel,
                    { color: isActive ? AMBER : 'rgba(255,255,255,0.6)' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </StudioGroup>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {},
  carouselWrap: {
    marginHorizontal: -16,
    paddingVertical: 8,
  },
  // Gradient colors
  gradientRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  gradientField: {
    flex: 1,
  },
  gradientLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 6,
  },
  gradientInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradientSwatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hexInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontFamily: 'monospace',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  // Button style chips
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Color swatches
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchInner: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  swatchAutoText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
  },
  swatchCheck: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  // Social icon color
  socialChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  socialChipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  miniSwatch: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
  },
  // Font selector
  fontScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  fontCard: {
    width: 72,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    position: 'relative',
  },
  fontPreview: {
    fontSize: 22,
    marginBottom: 4,
    lineHeight: 28,
  },
  fontName: {
    fontSize: 9,
    textAlign: 'center',
  },
  fontLock: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  // Font color
  fontColorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 16,
  },
  fontColorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  fontColorLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  fontColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  rainbowDot: {
    backgroundColor: '#f97316',
    // Can't do CSS gradients in RN, use a solid orange as fallback
  },
});
