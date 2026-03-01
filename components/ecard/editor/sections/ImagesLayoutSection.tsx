/**
 * ImagesLayoutSection -- Banner image, company logo, profile photo size,
 * and background type.
 *
 * Split from the monolithic StyleSection.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import ImageUploader from '../shared/ImageUploader';

const ACCENT = '#00C853';

// ── Constants ────────────────────────────────────────────────────────────────

const PHOTO_SIZES = [
  { id: 'small', name: 'Small' },
  { id: 'medium', name: 'Medium' },
  { id: 'large', name: 'Large' },
  { id: 'xl', name: 'XL' },
  { id: 'cover', name: 'Cover' },
];

const BACKGROUND_TYPES = [
  { id: 'gradient', label: 'Gradient', icon: 'color-palette' as const },
  { id: 'solid', label: 'Solid', icon: 'square' as const },
  { id: 'image', label: 'Image', icon: 'image' as const },
  { id: 'video', label: 'Video', icon: 'videocam' as const, proOnly: true },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface ImagesLayoutSectionProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ImagesLayoutSection({ isDark, isPro }: ImagesLayoutSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;

  if (!card) return null;

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';

  // ── Handlers ────────────────────────────────────────────────────────────

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
    dispatch({ type: 'SET_FIELD', field: 'company_logo_url', value: uri });
    dispatch({
      type: 'SET_PENDING_UPLOAD',
      key: 'logo',
      upload: { uri, type: 'image/jpeg' },
    });
  };

  const handleLogoRemove = () => {
    dispatch({ type: 'SET_FIELD', field: 'company_logo_url', value: null });
    dispatch({ type: 'CLEAR_PENDING_UPLOAD', key: 'logo' });
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <EditorSection
      id="images-layout"
      title="Images & Layout"
      icon="images"
      defaultOpen={false}
      isDark={isDark}
    >
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
          imageUrl={card.company_logo_url}
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

  // Button group (photo size, background type)
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
});
