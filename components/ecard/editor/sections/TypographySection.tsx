/**
 * TypographySection -- Font selector, font color, and button style.
 *
 * Split from the monolithic StyleSection.
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
import { useEditor } from '../../../../lib/ecard/EditorContext';
import { FONTS } from '../../../../config/eCardFonts';
import EditorSection from '../shared/EditorSection';

const ACCENT = '#00C853';

// ── Constants ────────────────────────────────────────────────────────────────

const BUTTON_STYLES = [
  { id: 'fill', name: 'Fill' },
  { id: 'outline', name: 'Outline' },
  { id: 'rounded', name: 'Rounded' },
  { id: 'shadow', name: 'Shadow' },
  { id: 'pill', name: 'Pill' },
  { id: 'minimal', name: 'Minimal' },
];

const FONT_COLOR_OPTIONS: { id: string | null; label: string; color: string | null }[] = [
  { id: null, label: 'Auto', color: null },
  { id: '#000000', label: 'Black', color: '#000000' },
  { id: '#FFFFFF', label: 'White', color: '#FFFFFF' },
  { id: '#333333', label: 'Dark Gray', color: '#333333' },
  { id: '#D4AF37', label: 'Gold', color: '#D4AF37' },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface TypographySectionProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TypographySection({ isDark, isPro }: TypographySectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const [customFontColor, setCustomFontColor] = useState(
    card?.font_color && !['#000000', '#FFFFFF', '#333333', '#D4AF37'].includes(card.font_color)
      ? card.font_color
      : '#555555'
  );

  if (!card) return null;

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputColor = isDark ? '#FFFFFF' : '#333333';

  const isCustomFontColor =
    card.font_color != null &&
    !FONT_COLOR_OPTIONS.some((opt) => opt.id === card.font_color);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <EditorSection
      id="typography"
      title="Typography & Buttons"
      icon="text"
      defaultOpen={false}
      isDark={isDark}
    >
      {/* ===== Font Selector ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Font</SectionLabel>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fontScroll}
        >
          {FONTS.map((font) => {
            const isSelected = (card.font_style || 'default') === font.id;
            const isLocked = font.isPremium && !isPro;

            return (
              <TouchableOpacity
                key={font.id}
                onPress={() => {
                  if (isLocked) return;
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'font_style',
                    value: font.id,
                  });
                }}
                activeOpacity={isLocked ? 0.5 : 0.7}
                style={[
                  styles.fontCard,
                  {
                    borderColor: isSelected ? ACCENT : borderColor,
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(0,200,83,0.1)'
                        : 'rgba(0,200,83,0.05)'
                      : cardBg,
                    opacity: isLocked ? 0.5 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.fontPreview,
                    {
                      color: textPrimary,
                      fontWeight: font.style.fontWeight || '400',
                      fontStyle: font.style.fontStyle || 'normal',
                      letterSpacing: font.style.letterSpacing,
                    },
                  ]}
                >
                  {font.preview}
                </Text>
                <Text
                  style={[styles.fontName, { color: textSecondary }]}
                  numberOfLines={1}
                >
                  {font.name}
                </Text>
                {isLocked && (
                  <View style={styles.fontLock}>
                    <Ionicons name="lock-closed" size={10} color={textSecondary} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ===== Font Color ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Font Color</SectionLabel>
        <View style={styles.buttonGroup}>
          {FONT_COLOR_OPTIONS.map((opt) => {
            const isSelected = card.font_color === opt.id;
            return (
              <TouchableOpacity
                key={opt.label}
                onPress={() =>
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'font_color',
                    value: opt.id,
                  })
                }
                activeOpacity={0.7}
                style={[
                  styles.fontColorChip,
                  {
                    borderColor: isSelected ? ACCENT : borderColor,
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(0,200,83,0.1)'
                        : 'rgba(0,200,83,0.05)'
                      : cardBg,
                  },
                ]}
              >
                {opt.color ? (
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: opt.color, borderColor },
                    ]}
                  />
                ) : null}
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: isSelected ? ACCENT : textPrimary,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Custom color option */}
          <TouchableOpacity
            onPress={() =>
              dispatch({
                type: 'SET_FIELD',
                field: 'font_color',
                value: customFontColor,
              })
            }
            activeOpacity={0.7}
            style={[
              styles.fontColorChip,
              {
                borderColor: isCustomFontColor ? ACCENT : borderColor,
                backgroundColor: isCustomFontColor
                  ? isDark
                    ? 'rgba(0,200,83,0.1)'
                    : 'rgba(0,200,83,0.05)'
                  : cardBg,
              },
            ]}
          >
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: customFontColor, borderColor },
              ]}
            />
            <Text
              style={[
                styles.chipLabel,
                {
                  color: isCustomFontColor ? ACCENT : textPrimary,
                  fontWeight: isCustomFontColor ? '600' : '400',
                },
              ]}
            >
              Custom
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom color hex input */}
        {isCustomFontColor && (
          <View style={styles.customColorRow}>
            <View
              style={[
                styles.customColorPreview,
                {
                  backgroundColor: card.font_color || customFontColor,
                  borderColor,
                },
              ]}
            />
            <TextInput
              value={card.font_color || customFontColor}
              onChangeText={(val) => {
                setCustomFontColor(val);
                if (/^#[0-9a-fA-F]{6}$/.test(val)) {
                  dispatch({ type: 'SET_FIELD', field: 'font_color', value: val });
                }
              }}
              placeholder="#555555"
              placeholderTextColor={isDark ? '#475569' : '#BDBDBD'}
              maxLength={7}
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.hexInput,
                {
                  backgroundColor: inputBg,
                  color: inputColor,
                  borderColor,
                },
              ]}
            />
          </View>
        )}
      </View>

      {/* ===== Button Color ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Button Color</SectionLabel>
        <ColorSwatchPicker
          value={card.button_color || null}
          onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'button_color', value: v })}
          isDark={isDark}
        />
      </View>

      {/* ===== Icon Color ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Icon Color</SectionLabel>
        <ColorSwatchPicker
          value={card.icon_color || null}
          onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'icon_color', value: v })}
          isDark={isDark}
        />
      </View>

      {/* ===== Social Media Icon Color ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Social Media Icon Color</SectionLabel>
        <SocialIconColorPicker
          value={card.social_icon_color || null}
          onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'social_icon_color', value: v })}
          isDark={isDark}
        />
      </View>

      {/* ===== Button Style ===== */}
      <View style={styles.lastBlock}>
        <SectionLabel isDark={isDark}>Button Style</SectionLabel>
        <View style={styles.buttonGroup}>
          {BUTTON_STYLES.map((style) => {
            const isSelected = (card.button_style || 'fill') === style.id;
            return (
              <TouchableOpacity
                key={style.id}
                onPress={() =>
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'button_style',
                    value: style.id,
                  })
                }
                activeOpacity={0.7}
                style={[
                  styles.chipButton,
                  {
                    borderColor: isSelected ? ACCENT : borderColor,
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(0,200,83,0.1)'
                        : 'rgba(0,200,83,0.05)'
                      : cardBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: isSelected ? ACCENT : textPrimary,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {style.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </EditorSection>
  );
}

// ── Helper Components ────────────────────────────────────────────────────────

function SectionLabel({
  children,
  isDark,
}: {
  children: React.ReactNode;
  isDark: boolean;
}) {
  const color = isDark ? '#94A3B8' : '#6B7280';
  return (
    <Text
      style={[
        styles.sectionLabel,
        { color },
      ]}
    >
      {children}
    </Text>
  );
}

// ── Color Pickers ─────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  { color: '#1e293b', name: 'Navy' },
  { color: '#c9a84c', name: 'Gold' },
  { color: '#ef4444', name: 'Red' },
  { color: '#10b981', name: 'Green' },
  { color: '#3b82f6', name: 'Blue' },
  { color: '#8b5cf6', name: 'Purple' },
  { color: '#f97316', name: 'Orange' },
  { color: '#111111', name: 'Black' },
  { color: '#f8f9fa', name: 'White' },
  { color: '#7A5330', name: 'Bronze' },
];

function ColorSwatchPicker({
  value,
  onChange,
  isDark,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  isDark: boolean;
}) {
  const [showCustom, setShowCustom] = React.useState(false);
  const [customHex, setCustomHex] = React.useState(value || '#333333');
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputColor = isDark ? '#FFFFFF' : '#333333';

  const isPreset = value && COLOR_PRESETS.some(p => p.color === value);
  const isCustom = value != null && !isPreset;

  return (
    <View>
      <View style={swatchStyles.row}>
        {/* Auto */}
        <TouchableOpacity
          onPress={() => { onChange(null); setShowCustom(false); }}
          style={[swatchStyles.swatch, {
            borderColor: !value ? ACCENT : borderColor,
            backgroundColor: cardBg,
          }]}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: !value ? ACCENT : (isDark ? '#94A3B8' : '#6B7280') }}>A</Text>
        </TouchableOpacity>

        {/* Presets */}
        {COLOR_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.color}
            onPress={() => { onChange(preset.color); setShowCustom(false); }}
            style={[swatchStyles.swatch, {
              borderColor: value === preset.color ? ACCENT : borderColor,
              backgroundColor: preset.color,
            }]}
          />
        ))}

        {/* Custom */}
        <TouchableOpacity
          onPress={() => setShowCustom(!showCustom)}
          style={[swatchStyles.swatch, {
            borderColor: isCustom ? ACCENT : borderColor,
            backgroundColor: isCustom ? value : '#888',
          }]}
        >
          <Ionicons name="color-palette" size={14} color="#fff" />
        </TouchableOpacity>
      </View>

      {showCustom && (
        <View style={swatchStyles.customRow}>
          <View style={[swatchStyles.customPreview, { backgroundColor: value || customHex, borderColor }]} />
          <TextInput
            value={value || customHex}
            onChangeText={(val) => {
              setCustomHex(val);
              if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange(val);
            }}
            placeholder="#333333"
            placeholderTextColor={isDark ? '#475569' : '#BDBDBD'}
            maxLength={7}
            autoCapitalize="none"
            autoCorrect={false}
            style={[swatchStyles.hexInput, { backgroundColor: inputBg, color: inputColor, borderColor }]}
          />
        </View>
      )}
    </View>
  );
}

const SOCIAL_ICON_OPTIONS: { id: string | null; label: string; swatch: string | null }[] = [
  { id: null, label: 'Standard', swatch: null },
  { id: '#FFFFFF', label: 'White', swatch: '#FFFFFF' },
  { id: '#000000', label: 'Black', swatch: '#000000' },
];

function SocialIconColorPicker({
  value,
  onChange,
  isDark,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  isDark: boolean;
}) {
  const [showCustom, setShowCustom] = React.useState(false);
  const [customHex, setCustomHex] = React.useState(value || '#333333');
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputColor = isDark ? '#FFFFFF' : '#333333';

  const isPreset = value && SOCIAL_ICON_OPTIONS.some(o => o.id === value);
  const isCustom = value != null && !isPreset;

  return (
    <View>
      <View style={swatchStyles.row}>
        {SOCIAL_ICON_OPTIONS.map((opt) => {
          const sel = value === opt.id;
          return (
            <TouchableOpacity
              key={opt.label}
              onPress={() => { onChange(opt.id); setShowCustom(false); }}
              style={[swatchStyles.socialChip, {
                borderColor: sel ? ACCENT : borderColor,
                backgroundColor: sel
                  ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
                  : cardBg,
              }]}
            >
              {opt.swatch && (
                <View style={[swatchStyles.miniSwatch, {
                  backgroundColor: opt.swatch,
                  borderColor: opt.swatch === '#FFFFFF' ? '#ddd' : 'transparent',
                }]} />
              )}
              <Text style={{
                fontSize: 13,
                fontWeight: sel ? '600' : '500',
                color: sel ? ACCENT : (isDark ? '#94A3B8' : '#6B7280'),
              }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Custom */}
        <TouchableOpacity
          onPress={() => setShowCustom(!showCustom)}
          style={[swatchStyles.socialChip, {
            borderColor: isCustom ? ACCENT : borderColor,
            backgroundColor: isCustom
              ? (isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)')
              : cardBg,
          }]}
        >
          <View style={[swatchStyles.miniSwatch, {
            backgroundColor: isCustom ? value : '#888',
          }]} />
          <Text style={{
            fontSize: 13,
            fontWeight: isCustom ? '600' : '500',
            color: isCustom ? ACCENT : (isDark ? '#94A3B8' : '#6B7280'),
          }}>
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {showCustom && (
        <View style={swatchStyles.customRow}>
          <View style={[swatchStyles.customPreview, { backgroundColor: value || customHex, borderColor }]} />
          <TextInput
            value={value || customHex}
            onChangeText={(val) => {
              setCustomHex(val);
              if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange(val);
            }}
            placeholder="#333333"
            placeholderTextColor={isDark ? '#475569' : '#BDBDBD'}
            maxLength={7}
            autoCapitalize="none"
            autoCorrect={false}
            style={[swatchStyles.hexInput, { backgroundColor: inputBg, color: inputColor, borderColor }]}
          />
        </View>
      )}
    </View>
  );
}

const swatchStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
  },
  miniSwatch: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  customPreview: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
  },
  hexInput: {
    width: 100,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'monospace',
  },
});

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  block: {
    marginBottom: 24,
  },
  lastBlock: {
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Button group (button style, font color)
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
  },
  chipLabel: {
    fontSize: 13,
  },

  // Font selector
  fontScroll: {
    paddingRight: 16,
    gap: 8,
  },
  fontCard: {
    width: 72,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 2,
    position: 'relative',
  },
  fontPreview: {
    fontSize: 18,
    marginBottom: 4,
  },
  fontName: {
    fontSize: 10,
    textAlign: 'center',
  },
  fontLock: {
    position: 'absolute',
    top: 4,
    right: 4,
  },

  // Font color
  fontColorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
  },
  customColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  customColorPreview: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
  },
  hexInput: {
    width: 100,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'monospace',
  },
});
