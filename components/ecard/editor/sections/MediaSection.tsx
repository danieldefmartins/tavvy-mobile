/**
 * MediaSection -- Gallery images and video management.
 * Mobile port of the web MediaSection using React Native primitives and expo-image-picker.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';

// ── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 8;
const GRID_COLUMNS = 3;
const IMAGE_SIZE =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;

type VideoType = 'youtube' | 'tavvy_short' | 'external';

interface VideoTypeOption {
  id: VideoType;
  name: string;
  icon: string;
  placeholder: string;
}

const VIDEO_TYPES: VideoTypeOption[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'logo-youtube',
    placeholder: 'https://youtube.com/watch?v=...',
  },
  {
    id: 'tavvy_short',
    name: 'Tavvy Short',
    icon: 'film',
    placeholder: 'https://tavvy.com/short/...',
  },
  {
    id: 'external',
    name: 'External URL',
    icon: 'globe',
    placeholder: 'https://example.com/video.mp4',
  },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface MediaSectionProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MediaSection({ isDark, isPro }: MediaSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const galleryImages = card?.gallery_images || [];
  const videos = card?.videos || [];

  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoType, setVideoType] = useState<VideoType>('youtube');
  const [videoUrl, setVideoUrl] = useState('');

  // Theme colors
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputColor = isDark ? '#FFFFFF' : '#333333';
  const placeholderColor = isDark ? '#475569' : '#BDBDBD';
  const modalBg = isDark ? '#1E293B' : '#FFFFFF';
  const iconBg = isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6';

  // -- Gallery Handlers -------------------------------------------------------

  const handleGalleryAdd = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to add gallery images.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets) return;

    result.assets.forEach((asset) => {
      const id = `gallery_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      dispatch({
        type: 'ADD_GALLERY_IMAGE',
        image: {
          id,
          url: asset.uri,
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
        },
      });
    });
  }, [dispatch]);

  const handleGalleryRemove = useCallback(
    (id: string) => {
      Alert.alert(
        'Remove Image',
        'Are you sure you want to remove this image?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => dispatch({ type: 'REMOVE_GALLERY_IMAGE', id }),
          },
        ],
      );
    },
    [dispatch],
  );

  // -- Video Handlers ---------------------------------------------------------

  const handleAddVideo = useCallback(() => {
    const trimmed = videoUrl.trim();
    if (!trimmed) return;

    dispatch({ type: 'ADD_VIDEO', video: { type: videoType, url: trimmed } });
    setVideoUrl('');
    setVideoType('youtube');
    setVideoModalOpen(false);
  }, [videoUrl, videoType, dispatch]);

  const handleRemoveVideo = useCallback(
    (index: number) => {
      Alert.alert(
        'Remove Video',
        'Are you sure you want to remove this video?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => dispatch({ type: 'REMOVE_VIDEO', index }),
          },
        ],
      );
    },
    [dispatch],
  );

  // -- Render -----------------------------------------------------------------

  return (
    <EditorSection
      id="media"
      title="Media"
      icon="images"
      defaultOpen={false}
      isDark={isDark}
    >
      {/* ===== Gallery Subsection ===== */}
      <View style={styles.subsection}>
        <View style={styles.subsectionHeader}>
          <Text style={[styles.subsectionTitle, { color: textPrimary }]}>
            Gallery
          </Text>
          <Text style={[styles.subsectionCount, { color: textSecondary }]}>
            {galleryImages.length} image{galleryImages.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Gallery grid */}
        {galleryImages.length > 0 && (
          <View style={styles.galleryGrid}>
            {galleryImages.map((img) => (
              <View key={img.id} style={styles.galleryItemWrapper}>
                <Image
                  source={{ uri: img.url }}
                  style={[styles.galleryImage, { backgroundColor: cardBg }]}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.galleryDeleteButton}
                  onPress={() => handleGalleryRemove(img.id)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
                >
                  <Ionicons name="trash" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Add images button */}
        <TouchableOpacity
          style={[styles.addButton, { borderColor }]}
          onPress={handleGalleryAdd}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color="#00C853" />
          <Text style={styles.addButtonText}>Add Images</Text>
        </TouchableOpacity>
      </View>

      {/* ===== Videos Subsection ===== */}
      <View>
        <View style={styles.subsectionHeader}>
          <Text style={[styles.subsectionTitle, { color: textPrimary }]}>
            Videos
          </Text>
          <Text style={[styles.subsectionCount, { color: textSecondary }]}>
            {videos.length} video{videos.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Video list */}
        {videos.length > 0 && (
          <View style={styles.videoList}>
            {videos.map((video: { type: string; url: string }, index: number) => {
              const typeInfo =
                VIDEO_TYPES.find((t) => t.id === video.type) || VIDEO_TYPES[2];
              return (
                <View
                  key={`video_${index}`}
                  style={[
                    styles.videoItem,
                    { backgroundColor: cardBg, borderColor },
                  ]}
                >
                  {/* Type icon */}
                  <View style={[styles.videoIconBox, { backgroundColor: iconBg }]}>
                    <Ionicons
                      name={typeInfo.icon as any}
                      size={18}
                      color={textSecondary}
                    />
                  </View>

                  {/* Info */}
                  <View style={styles.videoInfo}>
                    <Text
                      style={[styles.videoTypeName, { color: textSecondary }]}
                    >
                      {typeInfo.name}
                    </Text>
                    <Text
                      style={[styles.videoUrl, { color: textSecondary }]}
                      numberOfLines={1}
                    >
                      {video.url}
                    </Text>
                  </View>

                  {/* Remove */}
                  <TouchableOpacity
                    style={styles.videoRemoveButton}
                    onPress={() => handleRemoveVideo(index)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Add video button */}
        <TouchableOpacity
          style={[styles.addButton, { borderColor }]}
          onPress={() => setVideoModalOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="videocam" size={18} color="#00C853" />
          <Text style={styles.addButtonText}>Add Video</Text>
        </TouchableOpacity>
      </View>

      {/* ===== Add Video Modal ===== */}
      <Modal
        visible={videoModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setVideoModalOpen(false)}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setVideoModalOpen(false)}
        >
          <View />
        </TouchableOpacity>

        {/* Modal content */}
        <View style={styles.modalCenterWrapper}>
          <View style={[styles.modalContainer, { backgroundColor: modalBg }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                Add Video
              </Text>
              <TouchableOpacity
                onPress={() => setVideoModalOpen(false)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Video type selector */}
            <View style={styles.typeSection}>
              <Text style={[styles.typeLabel, { color: textSecondary }]}>
                Video Type
              </Text>
              <View style={styles.typeRow}>
                {VIDEO_TYPES.map((type) => {
                  const isSelected = videoType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeOption,
                        {
                          borderColor: isSelected ? '#00C853' : borderColor,
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(0,200,83,0.1)'
                              : 'rgba(0,200,83,0.05)'
                            : 'transparent',
                        },
                      ]}
                      onPress={() => setVideoType(type.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={18}
                        color={isSelected ? '#00C853' : textSecondary}
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          { color: isSelected ? '#00C853' : textSecondary },
                        ]}
                      >
                        {type.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* URL input */}
            <View style={styles.urlSection}>
              <Text style={[styles.typeLabel, { color: textSecondary }]}>
                Video URL
              </Text>
              <TextInput
                style={[
                  styles.urlInput,
                  {
                    backgroundColor: inputBg,
                    color: inputColor,
                    borderColor,
                  },
                ]}
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder={
                  VIDEO_TYPES.find((t) => t.id === videoType)?.placeholder
                }
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor }]}
                onPress={() => setVideoModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: videoUrl.trim()
                      ? '#00C853'
                      : isDark
                        ? '#334155'
                        : '#E5E7EB',
                  },
                ]}
                onPress={handleAddVideo}
                activeOpacity={videoUrl.trim() ? 0.7 : 1}
                disabled={!videoUrl.trim()}
              >
                <Text
                  style={[
                    styles.confirmButtonText,
                    {
                      color: videoUrl.trim() ? '#FFFFFF' : textSecondary,
                    },
                  ]}
                >
                  Add Video
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </EditorSection>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // -- Subsection layout --
  subsection: {
    marginBottom: 28,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  subsectionCount: {
    fontSize: 12,
  },

  // -- Gallery grid --
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    marginBottom: 12,
  },
  galleryItemWrapper: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryDeleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // -- Video list --
  videoList: {
    gap: 8,
    marginBottom: 12,
  },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  videoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  videoInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  videoTypeName: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  videoUrl: {
    fontSize: 12,
    marginTop: 2,
  },
  videoRemoveButton: {
    padding: 6,
    flexShrink: 0,
  },

  // -- Add button (shared) --
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#00C853',
  },

  // -- Modal --
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCenterWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 420,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  // -- Video type selector --
  typeSection: {
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
  },
  typeOptionText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // -- URL input --
  urlSection: {
    marginBottom: 20,
  },
  urlInput: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 14,
  },

  // -- Modal actions --
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
