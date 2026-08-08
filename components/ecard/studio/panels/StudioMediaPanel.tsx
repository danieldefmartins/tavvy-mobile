/**
 * StudioMediaPanel — Media tab content for Card Studio bottom sheet.
 *
 * Contains: profile photo, banner/cover image, company logo,
 * photo size selector, gallery images, and videos.
 * Reuses ImageUploader from the existing editor.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import { supabase } from '../../../../lib/supabaseClient';
import ImageUploader from '../../editor/shared/ImageUploader';
import StudioGroup from './shared/StudioGroup';

const AMBER = '#FF9F0A';
const AMBER_BG = 'rgba(255,159,10,0.12)';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_COLUMNS = 3;
const GRID_GAP = 8;
const IMAGE_SIZE = (SCREEN_WIDTH - 64 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

const PHOTO_SIZES = [
  { id: 'small', name: 'Small' },
  { id: 'medium', name: 'Medium' },
  { id: 'large', name: 'Large' },
  { id: 'xl', name: 'XL' },
  { id: 'cover', name: 'Cover' },
];

// ── Props ────────────────────────────────────────────────────────────────────
interface StudioMediaPanelProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StudioMediaPanel({ isDark, isPro }: StudioMediaPanelProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const [uploading, setUploading] = useState(false);

  if (!card) return null;

  const set = (field: string, value: any) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value });
  };

  const galleryImages = card.gallery_images || [];
  const photoSize = card.profile_photo_size || 'medium';

  // ── Photo handlers ─────────────────────────────────────────────────────────
  const handleProfileSelect = (uri: string) => {
    set('profile_photo_url', uri);
    dispatch({
      type: 'SET_PENDING_UPLOAD',
      key: 'profile_photo',
      upload: { uri, type: 'image/jpeg' },
    });
  };

  const handleBannerSelect = (uri: string) => {
    set('banner_image_url', uri);
    dispatch({
      type: 'SET_PENDING_UPLOAD',
      key: 'banner_image',
      upload: { uri, type: 'image/jpeg' },
    });
  };

  const handleLogoSelect = (uri: string) => {
    set('logo_url', uri);
    dispatch({
      type: 'SET_PENDING_UPLOAD',
      key: 'logo',
      upload: { uri, type: 'image/jpeg' },
    });
  };

  // ── Gallery handlers ───────────────────────────────────────────────────────
  const handleAddGalleryImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const id = `gallery_${Date.now()}`;
        dispatch({
          type: 'ADD_GALLERY_IMAGE',
          image: { id, url: uri, uri, type: 'image/jpeg' },
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveGalleryImage = (id: string) => {
    Haptics.selectionAsync();
    dispatch({ type: 'REMOVE_GALLERY_IMAGE', id });
  };

  return (
    <View style={styles.container}>
      {/* Profile Photo */}
      <StudioGroup title="Profile Photo">
        <View style={styles.imageRow}>
          <ImageUploader
            imageUrl={card.profile_photo_url}
            onImageSelected={handleProfileSelect}
            onRemove={() => {
              set('profile_photo_url', null);
              dispatch({ type: 'CLEAR_PENDING_UPLOAD', key: 'profile_photo' });
            }}
            label="Upload Photo"
            shape="circle"
            width={72}
            isDark={true}
          />
          <View style={styles.imageInfo}>
            <Text style={styles.imageInfoTitle}>Profile Photo</Text>
            <Text style={styles.imageInfoSub}>Square image recommended</Text>
          </View>
        </View>
      </StudioGroup>

      {/* Banner / Cover Image */}
      <StudioGroup title="Banner / Cover Image">
        <View style={styles.bannerRow}>
          <ImageUploader
            imageUrl={card.banner_image_url}
            onImageSelected={handleBannerSelect}
            onRemove={() => {
              set('banner_image_url', null);
              dispatch({ type: 'CLEAR_PENDING_UPLOAD', key: 'banner_image' });
            }}
            label="Upload Banner"
            shape="banner"
            isDark={true}
          />
        </View>
      </StudioGroup>

      {/* Company Logo */}
      <StudioGroup title="Company Logo">
        <View style={styles.imageRow}>
          <ImageUploader
            imageUrl={card.logo_url}
            onImageSelected={handleLogoSelect}
            onRemove={() => {
              set('logo_url', null);
              dispatch({ type: 'CLEAR_PENDING_UPLOAD', key: 'logo' });
            }}
            label="Upload Logo"
            shape="square"
            width={56}
            isDark={true}
          />
          <View style={styles.imageInfo}>
            <Text style={styles.imageInfoTitle}>Company Logo</Text>
            <Text style={styles.imageInfoSub}>PNG with transparency works best</Text>
          </View>
        </View>
      </StudioGroup>

      {/* Photo Size */}
      <StudioGroup title="Profile Photo Size">
        <View style={styles.chipGrid}>
          {PHOTO_SIZES.map((size) => {
            const isActive = photoSize === size.id;
            return (
              <TouchableOpacity
                key={size.id}
                onPress={() => {
                  Haptics.selectionAsync();
                  set('profile_photo_size', size.id);
                }}
                style={[
                  styles.chip,
                  {
                    borderColor: isActive ? AMBER : 'rgba(255,255,255,0.12)',
                    backgroundColor: isActive ? AMBER_BG : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: isActive ? AMBER : 'rgba(255,255,255,0.6)' },
                  ]}
                >
                  {size.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </StudioGroup>

      {/* Gallery */}
      <StudioGroup title="Gallery">
        <View style={styles.gallery}>
          {galleryImages.map((img: any) => (
            <View key={img.id} style={styles.galleryItem}>
              <Image source={{ uri: img.url }} style={styles.galleryImage} />
              <TouchableOpacity
                onPress={() => handleRemoveGalleryImage(img.id)}
                style={styles.galleryRemove}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={handleAddGalleryImage}
            style={styles.galleryAdd}
          >
            <Ionicons name="add" size={24} color={AMBER} />
          </TouchableOpacity>
        </View>
      </StudioGroup>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {},
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
  },
  imageInfo: {
    flex: 1,
  },
  imageInfoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  imageInfoSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  bannerRow: {
    padding: 16,
  },
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
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    padding: 16,
  },
  galleryItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  galleryAdd: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});
