/**
 * StyleSection -- Template, color scheme, gradients, banner, logo,
 * photo size, button style, font, font color, and background type.
 *
 * React Native port of the web StyleSection.
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
import { useEditor } from '../../../../lib/ecard/EditorContext';
import { FONTS } from '../../../../config/eCardFonts';
import EditorSection from '../shared/EditorSection';
import ImageUploader from '../shared/ImageUploader';
import TemplatePicker from '../shared/TemplatePicker';
import ColorSchemePicker from '../shared/ColorSchemePicker';

const ACCENT = '#00C853';

// ── Constants ────────────────────────────────────────────────────────────────

const PHOTO_SIZES = [
  { id: 'small', name: 'Small' },
  { id: 'medium', name: 'Medium' },
  { id: 'large', name: 'Large' },
  { id: 'xl', name: 'XL' },
  { id: 'cover', name: 'Cover' },
];

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

const BACKGROUND_TYPES = [
  { id: 'gradient', label: 'Gradient', icon: 'color-palette' as const },
  { id: 'solid', label: 'Solid', icon: 'square' as const },
  { id: 'image', label: 'Image', icon: 'image' as const },
  { id: 'video', label: 'Video', icon: 'videocam' as const, proOnly: true },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface StyleSectionProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StyleSection({ isDark, isPro }: StyleSectionProps) {
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

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleTemplateSelect = (templateId: string) => {
    dispatch({ type: 'SET_TEMPLATE', templateId });
  };

  const handleColorSchemeSelect = (schemeId: string) => {
    dispatch({ type: 'SET_FIELD', field: 'color_scheme_id', value: schemeId });
  };

  const handleBannerSelect = (uri: string) => {
    dispatch({ type: 'SET_FIELD', field: 'banner_image_url', value: uri });
    dispatch({
      type: 'SET_PENDING_UPLOAD',
      key: 'banner_image',
      upload: { uri, type: 'image/jpeg' },
    });
  };

  const handleBannerRemove = () => {
    dispatch({ type: 'SET_FIELD', field: 'banner_image_url', value: null });
    dispatch({ type: 'CLEAR_PENDING_UPLOAD', key: 'banner_image' });
  };

  const handleLogoSelect = (uri: string) => {
    dispatch({ type: 'SET_FIELD', field: 'logo_url', value: uri });
    dispatch({
      type: 'SET_PENDING_UPLOAD',
      key: 'logo',
      upload: { uri, type: 'image/jpeg' },
    });
  };

  const handleLogoRemove = () => {
    dispatch({ type: 'SET_FIELD', field: 'logo_url', value: null });
    dispatch({ type: 'CLEAR_PENDING_UPLOAD', key: 'logo' });
  };

  const isCustomFontColor =
    card.font_color != null &&
    !FONT_COLOR_OPTIONS.some((opt) => opt.id === card.font_color);

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <EditorSection
      id="style"
      title="Style & Design"
      icon="brush"
      defaultOpen={false}
      isDark={isDark}
    >
      {/* ===== Template Picker ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Template</SectionLabel>
        <TemplatePicker
          selectedTemplateId={card.template_id || 'classic'}
          onSelect={handleTemplateSelect}
          isPro={isPro}
          isDark={isDark}
        />
      </View>

      {/* ===== Color Scheme ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Color Scheme</SectionLabel>
        <ColorSchemePicker
          templateId={card.template_id || 'classic'}
          selectedSchemeId={card.color_scheme_id ?? null}
          onSelect={handleColorSchemeSelect}
          isPro={isPro}
          isDark={isDark}
        />
      </View>

      {/* ===== Gradient Colors ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Gradient Colors</SectionLabel>
        <View style={styles.gradientRow}>
          <ColorInput
            label="Color 1"
            value={card.gradient_color_1 || '#667eea'}
            onChange={(v) =>
              dispatch({ type: 'SET_FIELD', field: 'gradient_color_1', value: v })
            }
            isDark={isDark}
          />
          <ColorInput
            label="Color 2"
            value={card.gradient_color_2 || '#764ba2'}
            onChange={(v) =>
              dispatch({ type: 'SET_FIELD', field: 'gradient_color_2', value: v })
            }
            isDark={isDark}
          />
        </View>
        {/* Gradient preview */}
        <LinearGradient
          colors={[
            card.gradient_color_1 || '#667eea',
            card.gradient_color_2 || '#764ba2',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientPreview, { borderColor }]}
        />
      </View>

      {/* ===== Banner Image ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Banner Image</SectionLabel>
        <ImageUploader
          imageUrl={card.banner_image_url}
          onImageSelected={handleBannerSelect}
          onRemove={handleBannerRemove}
          label="Upload Banner"
          shape="banner"
          isDark={isDark}
        />
      </View>

      {/* ===== Company Logo ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Company Logo</SectionLabel>
        <ImageUploader
          imageUrl={card.logo_url}
          onImageSelected={handleLogoSelect}
          onRemove={handleLogoRemove}
          label="Upload Logo"
          shape="square"
          width={60}
          isDark={isDark}
        />
      </View>

      {/* ===== Photo Size ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Profile Photo Size</SectionLabel>
        <View style={styles.buttonGroup}>
          {PHOTO_SIZES.map((size) => {
            const isSelected = (card.profile_photo_size || 'medium') === size.id;
            return (
              <TouchableOpacity
                key={size.id}
                onPress={() =>
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'profile_photo_size',
                    value: size.id,
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
                  {size.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ===== Button Style ===== */}
      <View style={styles.block}>
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

      {/* ===== Button Color ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Button Color</SectionLabel>
        <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 10 }}>
          Override the default button background. Auto uses theme colors.
        </Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            onPress={() => dispatch({ type: 'SET_FIELD', field: 'button_color', value: null })}
            activeOpacity={0.7}
            style={[
              styles.chipButton,
              {
                borderColor: !card.button_color ? ACCENT : borderColor,
                backgroundColor: !card.button_color
                  ? isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)'
                  : cardBg,
              },
            ]}
          >
            <Text style={[styles.chipLabel, { color: !card.button_color ? ACCENT : textPrimary, fontWeight: !card.button_color ? '600' : '400' }]}>
              Auto
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: card.button_color || '#f8f9fa', borderWidth: 1, borderColor }} />
            <TextInput
              value={card.button_color || ''}
              onChangeText={(v) => {
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                  dispatch({ type: 'SET_FIELD', field: 'button_color', value: v || null });
                }
              }}
              placeholder="#f8f9fa"
              placeholderTextColor={isDark ? '#475569' : '#BDBDBD'}
              maxLength={7}
              style={{
                width: 90,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor,
                borderRadius: 8,
                fontSize: 13,
                backgroundColor: isDark ? '#1E293B' : '#fff',
                color: isDark ? '#fff' : '#333',
                fontFamily: 'monospace',
              }}
            />
          </View>
        </View>
      </View>

      {/* ===== Icon Color ===== */}
      <View style={styles.block}>
        <SectionLabel isDark={isDark}>Icon Color</SectionLabel>
        <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 10 }}>
          Override the default icon accent color. Auto uses theme colors.
        </Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            onPress={() => dispatch({ type: 'SET_FIELD', field: 'icon_color', value: null })}
            activeOpacity={0.7}
            style={[
              styles.chipButton,
              {
                borderColor: !card.icon_color ? ACCENT : borderColor,
                backgroundColor: !card.icon_color
                  ? isDark ? 'rgba(0,200,83,0.1)' : 'rgba(0,200,83,0.05)'
                  : cardBg,
              },
            ]}
          >
            <Text style={[styles.chipLabel, { color: !card.icon_color ? ACCENT : textPrimary, fontWeight: !card.icon_color ? '600' : '400' }]}>
              Auto
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: card.icon_color || '#333333', borderWidth: 1, borderColor }} />
            <TextInput
              value={card.icon_color || ''}
              onChangeText={(v) => {
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                  dispatch({ type: 'SET_FIELD', field: 'icon_color', value: v || null });
                }
              }}
              placeholder="#333333"
              placeholderTextColor={isDark ? '#475569' : '#BDBDBD'}
              maxLength={7}
              style={{
                width: 90,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor,
                borderRadius: 8,
                fontSize: 13,
                backgroundColor: isDark ? '#1E293B' : '#fff',
                color: isDark ? '#fff' : '#333',
                fontFamily: 'monospace',
              }}
            />
          </View>
        </View>
      </View>

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

      {/* ===== Background Type ===== */}
      <View style={styles.lastBlock}>
        <SectionLabel isDark={isDark}>Background Type</SectionLabel>
        <View style={styles.buttonGroup}>
          {BACKGROUND_TYPES.map((bg) => {
            const isSelected = (card.background_type || 'gradient') === bg.id;
            const isLocked = bg.proOnly && !isPro;

            return (
              <TouchableOpacity
                key={bg.id}
                onPress={() => {
                  if (isLocked) return;
                  dispatch({
                    type: 'SET_FIELD',
                    field: 'background_type',
                    value: bg.id,
                  });
                }}
                activeOpacity={isLocked ? 0.5 : 0.7}
                style={[
                  styles.bgTypeButton,
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
                <Ionicons
                  name={bg.icon}
                  size={18}
                  color={isSelected ? ACCENT : textSecondary}
                />
                <Text
                  style={[
                    styles.bgTypeLabel,
                    {
                      color: isSelected ? ACCENT : textPrimary,
                      fontWeight: isSelected ? '600' : '400',
                    },
                  ]}
                >
                  {bg.label}
                </Text>
                {isLocked && (
                  <Ionicons
                    name="lock-closed"
                    size={10}
                    color={textSecondary}
                    style={styles.bgTypeLock}
                  />
                )}
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

function ColorInput({
  label,
  value,
  onChange,
  isDark,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  isDark: boolean;
}) {
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputColor = isDark ? '#FFFFFF' : '#333333';
  const labelColor = isDark ? '#94A3B8' : '#6B7280';

  return (
    <View style={styles.colorInputWrapper}>
      <Text style={[styles.colorInputLabel, { color: labelColor }]}>{label}</Text>
      <View style={styles.colorInputRow}>
        <View
          style={[
            styles.colorInputSwatch,
            { backgroundColor: value, borderColor },
          ]}
        />
        <TextInput
          value={value}
          onChangeText={(v) => {
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          maxLength={7}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={isDark ? '#475569' : '#BDBDBD'}
          style={[
            styles.colorInputText,
            {
              backgroundColor: inputBg,
              color: inputColor,
              borderColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

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

  // Gradient colors
  gradientRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gradientPreview: {
    marginTop: 10,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
  },

  // Button group (photo size, button style, font color)
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

  // Background type
  bgTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    position: 'relative',
  },
  bgTypeLabel: {
    fontSize: 13,
  },
  bgTypeLock: {
    marginLeft: 2,
  },

  // ColorInput helper
  colorInputWrapper: {
    flex: 1,
  },
  colorInputLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  colorInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorInputSwatch: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
  },
  colorInputText: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'monospace',
  },
});
