/**
 * StudioProfilePanel — Profile tab content for Card Studio bottom sheet.
 *
 * Apple-style grouped settings: profile photo, name, title, bio, pronouns,
 * location fields. Uses the dark inspector theme (always dark).
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import ImageUploader from '../../editor/shared/ImageUploader';
import StudioField from './shared/StudioField';
import StudioGroup from './shared/StudioGroup';

// ── Props ────────────────────────────────────────────────────────────────────
interface StudioProfilePanelProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StudioProfilePanel({ isDark, isPro }: StudioProfilePanelProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  if (!card) return null;

  const set = (field: string, value: any) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value });
  };

  const handlePhotoSelect = (uri: string) => {
    set('profile_photo_url', uri);
    dispatch({
      type: 'SET_PENDING_UPLOAD',
      key: 'profile_photo',
      upload: { uri, type: 'image/jpeg' },
    });
  };

  const handlePhotoRemove = () => {
    set('profile_photo_url', null);
    dispatch({ type: 'CLEAR_PENDING_UPLOAD', key: 'profile_photo' });
  };

  return (
    <View style={styles.container}>
      {/* Profile Photo */}
      <StudioGroup title="Profile Photo">
        <View style={styles.photoRow}>
          <ImageUploader
            imageUrl={card.profile_photo_url}
            onImageSelected={handlePhotoSelect}
            onRemove={handlePhotoRemove}
            label="Upload Photo"
            shape="circle"
            width={72}
            isDark={true}
          />
        </View>
      </StudioGroup>

      {/* Basic Info */}
      <StudioGroup title="Basic Info">
        <StudioField
          label="Full Name / Business Name"
          value={card.full_name || ''}
          onChange={(v) => set('full_name', v)}
          placeholder="Enter name..."
        />
        <StudioField
          label="Title / Tagline"
          value={card.title || ''}
          onChange={(v) => set('title', v)}
          placeholder="Enter title..."
        />
        <StudioField
          label="Bio"
          value={card.bio || ''}
          onChange={(v) => set('bio', v)}
          placeholder="Tell your story..."
          multiline
        />
        <StudioField
          label="Pronouns"
          value={card.pronouns || ''}
          onChange={(v) => set('pronouns', v)}
          placeholder="e.g. she/her"
          isLast
        />
      </StudioGroup>

      {/* Location */}
      <StudioGroup title="Location">
        <StudioField
          label="City / Region"
          value={card.city || ''}
          onChange={(v) => set('city', v)}
          placeholder="e.g. Boston, MA"
        />
        <StudioField
          label="Full Address"
          value={card.address || ''}
          onChange={(v) => set('address', v)}
          placeholder="Street address..."
          isLast
        />
      </StudioGroup>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  photoRow: {
    padding: 16,
    alignItems: 'center',
  },
});
