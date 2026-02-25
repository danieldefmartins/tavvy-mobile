/**
 * ProfileSection -- Profile photo, name, title/role, bio, and pronouns.
 * React Native port of the web ProfileSection.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import EditorField from '../shared/EditorField';
import ImageUploader from '../shared/ImageUploader';

interface ProfileSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function ProfileSection({ isDark, isPro }: ProfileSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;

  if (!card) return null;

  const labelColor = isDark ? '#94A3B8' : '#6B7280';

  const handleFieldChange = (field: string, value: string) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value });
  };

  const handlePhotoSelect = (uri: string) => {
    dispatch({ type: 'SET_FIELD', field: 'profile_photo_url', value: uri });
    dispatch({
      type: 'SET_PENDING_UPLOAD',
      key: 'profile_photo',
      upload: { uri, type: 'image/jpeg' },
    });
  };

  const handlePhotoRemove = () => {
    dispatch({ type: 'SET_FIELD', field: 'profile_photo_url', value: null });
    dispatch({ type: 'CLEAR_PENDING_UPLOAD', key: 'profile_photo' });
  };

  return (
    <EditorSection
      id="profile"
      title="Profile"
      icon="person-circle"
      defaultOpen={true}
      isDark={isDark}
    >
      {/* Profile Photo */}
      <View style={styles.photoContainer}>
        <Text style={[styles.label, { color: labelColor }]}>Profile Photo</Text>
        <ImageUploader
          imageUrl={card.profile_photo_url}
          onImageSelected={handlePhotoSelect}
          onRemove={handlePhotoRemove}
          label="Upload Photo"
          shape="circle"
          width={100}
          isDark={isDark}
        />
      </View>

      {/* Full Name */}
      <EditorField
        label="Full Name"
        value={card.full_name || ''}
        onChange={(v) => handleFieldChange('full_name', v)}
        placeholder="Your full name"
        required
        isDark={isDark}
        maxLength={100}
      />

      {/* Title / Role */}
      <EditorField
        label="Title / Role"
        value={card.title_role || card.title || ''}
        onChange={(v) => handleFieldChange('title_role', v)}
        placeholder="e.g. Marketing Director"
        isDark={isDark}
        maxLength={100}
      />

      {/* Bio */}
      <EditorField
        label="Bio"
        value={card.bio || ''}
        onChange={(v) => handleFieldChange('bio', v)}
        placeholder="A short description about yourself..."
        multiline
        rows={4}
        isDark={isDark}
        maxLength={500}
      />

      {/* Pronouns */}
      <EditorField
        label="Pronouns"
        value={card.pronouns || ''}
        onChange={(v) => handleFieldChange('pronouns', v)}
        placeholder="e.g. she/her, he/him, they/them"
        isDark={isDark}
        maxLength={30}
      />
    </EditorSection>
  );
}

const styles = StyleSheet.create({
  photoContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
});
