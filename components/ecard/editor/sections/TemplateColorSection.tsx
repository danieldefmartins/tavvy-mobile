/**
 * TemplateColorSection -- Template picker, color scheme, and gradient colors.
 *
 * Split from the monolithic StyleSection.
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import TemplatePicker from '../shared/TemplatePicker';
import ColorSchemePicker from '../shared/ColorSchemePicker';

// ── Props ────────────────────────────────────────────────────────────────────

interface TemplateColorSectionProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TemplateColorSection({ isDark, isPro }: TemplateColorSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;

  if (!card) return null;

  const borderColor = isDark ? '#334155' : '#E5E7EB';

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleTemplateSelect = (templateId: string) => {
    dispatch({ type: 'SET_TEMPLATE', templateId });
  };

  const handleColorSchemeSelect = (schemeId: string) => {
    dispatch({ type: 'SET_FIELD', field: 'color_scheme_id', value: schemeId });
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <EditorSection
      id="template-colors"
      title="Template & Colors"
      icon="color-palette"
      defaultOpen={true}
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
      <View style={styles.lastBlock}>
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
