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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import { supabase } from '../../../../lib/supabaseClient';
import EditorSection from '../shared/EditorSection';

// Lazy-load expo-video-thumbnails — crashes if native module isn't in dev client
let VideoThumbnails: typeof import('expo-video-thumbnails') | null = null;
try {
  VideoThumbnails = require('expo-video-thumbnails');
} catch {
  // Native module not available in this build — fall back to image picker
}

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
  const [uploading, setUploading] = useState(false);

  // Thumbnail picker state
  const [thumbnailModalOpen, setThumbnailModalOpen] = useState(false);
  const [thumbnailVideoIndex, setThumbnailVideoIndex] = useState<number>(-1);
  const [thumbnailFrames, setThumbnailFrames] = useState<string[]>([]);
  const [generatingThumbnails, setGeneratingThumbnails] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number>(-1);

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

  const handleVideoFileUpload = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library access to upload videos.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        Alert.alert('Error', 'Please sign in to upload videos.');
        return;
      }

      const filename = asset.uri.split('/').pop() || `video_${Date.now()}.mp4`;
      const storagePath = `${userId}/videos/${Date.now()}_${filename}`;
      const mimeType = asset.mimeType || 'video/mp4';

      const { data, error } = await supabase.storage
        .from('ecard-assets')
        .upload(storagePath, {
          uri: asset.uri,
          type: mimeType,
          name: filename,
        } as any, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.error('Video upload error:', error);
        Alert.alert('Upload Failed', 'Failed to upload video. Please try again.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('ecard-assets')
        .getPublicUrl(data.path);

      if (urlData?.publicUrl) {
        setVideoUrl(urlData.publicUrl);
      }
    } catch (err) {
      console.error('Video upload error:', err);
      Alert.alert('Upload Failed', 'Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  // -- Thumbnail Handlers -----------------------------------------------------

  /** Upload a local image URI as the video thumbnail to Supabase. */
  const uploadAndSetThumbnail = useCallback(async (
    imageUri: string,
    videoIndex: number,
    mimeType?: string,
  ) => {
    setUploadingThumbnail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        Alert.alert('Error', 'Please sign in to upload thumbnails.');
        return;
      }

      const filename = `thumb_${Date.now()}.jpg`;
      const storagePath = `${userId}/thumbnails/${filename}`;

      const { data, error } = await supabase.storage
        .from('ecard-assets')
        .upload(storagePath, {
          uri: imageUri,
          type: mimeType || 'image/jpeg',
          name: filename,
        } as any, {
          contentType: mimeType || 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Thumbnail upload error:', error);
        Alert.alert('Upload Failed', 'Failed to upload thumbnail.');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('ecard-assets')
        .getPublicUrl(data.path);

      if (urlData?.publicUrl) {
        dispatch({
          type: 'UPDATE_VIDEO_THUMBNAIL',
          index: videoIndex,
          thumbnail_url: urlData.publicUrl,
        });
      }

      setThumbnailModalOpen(false);
    } catch (err) {
      console.error('Thumbnail upload error:', err);
      Alert.alert('Upload Failed', 'Failed to upload thumbnail.');
    } finally {
      setUploadingThumbnail(false);
    }
  }, [dispatch]);

  /** Open thumbnail picker — generates video frames if native module is available,
   *  otherwise falls back to image picker from photo library. */
  const handleSetThumbnail = useCallback(async (videoIndex: number) => {
    const video = videos[videoIndex];
    if (!video?.url) return;

    // If expo-video-thumbnails is available, generate frames
    if (VideoThumbnails) {
      setThumbnailVideoIndex(videoIndex);
      setThumbnailFrames([]);
      setSelectedFrameIndex(-1);
      setThumbnailModalOpen(true);
      setGeneratingThumbnails(true);

      try {
        // Generate 8 frames spread across the first 15 seconds
        const times = [0, 500, 1500, 3000, 5000, 8000, 11000, 15000];
        const frames: string[] = [];

        for (const time of times) {
          try {
            const { uri } = await VideoThumbnails.getThumbnailAsync(video.url, {
              time,
              quality: 0.8,
            });
            frames.push(uri);
          } catch {
            // Timestamp past video end — skip
          }
        }

        if (frames.length === 0) {
          Alert.alert('Error', 'Could not generate frames from this video.');
          setThumbnailModalOpen(false);
        } else {
          setThumbnailFrames(frames);
          setSelectedFrameIndex(0);
        }
      } catch (err) {
        console.error('Thumbnail generation error:', err);
        Alert.alert('Error', 'Failed to generate video frames.');
        setThumbnailModalOpen(false);
      } finally {
        setGeneratingThumbnails(false);
      }
      return;
    }

    // Fallback: pick image from photo library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;
    uploadAndSetThumbnail(result.assets[0].uri, videoIndex, result.assets[0].mimeType);
  }, [videos, uploadAndSetThumbnail]);

  /** Pick a custom image from library (available from within frame picker modal too). */
  const handleCustomThumbnail = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) return;
    uploadAndSetThumbnail(result.assets[0].uri, thumbnailVideoIndex, result.assets[0].mimeType);
  }, [thumbnailVideoIndex, uploadAndSetThumbnail]);

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
            {videos.map((video: { type: string; url: string; thumbnail_url?: string }, index: number) => {
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
                  {/* Thumbnail or type icon */}
                  {video.thumbnail_url ? (
                    <TouchableOpacity
                      onPress={() => video.type === 'tavvy_short' ? handleSetThumbnail(index) : undefined}
                      activeOpacity={video.type === 'tavvy_short' ? 0.7 : 1}
                    >
                      <Image
                        source={{ uri: video.thumbnail_url }}
                        style={styles.videoThumbnail}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.videoIconBox, { backgroundColor: iconBg }]}>
                      <Ionicons
                        name={typeInfo.icon as any}
                        size={18}
                        color={textSecondary}
                      />
                    </View>
                  )}

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
                    {/* Set Thumbnail button for Tavvy Shorts */}
                    {video.type === 'tavvy_short' && (
                      <TouchableOpacity
                        style={styles.thumbnailButton}
                        onPress={() => handleSetThumbnail(index)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="image" size={12} color="#00C853" />
                        <Text style={styles.thumbnailButtonText}>
                          {video.thumbnail_url ? 'Change Thumbnail' : 'Set Thumbnail'}
                        </Text>
                      </TouchableOpacity>
                    )}
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

            {/* Upload / URL input */}
            <View style={styles.urlSection}>
              {videoType === 'tavvy_short' && (
                <>
                  <Text style={[styles.typeLabel, { color: textSecondary }]}>
                    Upload Video
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      {
                        borderColor: uploading ? '#00C853' : borderColor,
                        backgroundColor: uploading
                          ? isDark ? 'rgba(0,200,83,0.08)' : 'rgba(0,200,83,0.04)'
                          : 'transparent',
                      },
                    ]}
                    onPress={handleVideoFileUpload}
                    disabled={uploading}
                    activeOpacity={0.7}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color="#00C853" />
                    ) : (
                      <Ionicons name="cloud-upload" size={20} color={textSecondary} />
                    )}
                    <Text style={[styles.uploadButtonText, { color: uploading ? '#00C853' : textSecondary }]}>
                      {uploading ? 'Uploading...' : 'Choose Video from Device'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                    <Text style={[styles.dividerText, { color: textSecondary }]}>or paste URL</Text>
                    <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
                  </View>
                </>
              )}

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
      {/* ===== Frame Picker Modal (for Tavvy Short thumbnails) ===== */}
      <Modal
        visible={thumbnailModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !uploadingThumbnail && setThumbnailModalOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => !uploadingThumbnail && setThumbnailModalOpen(false)}
        >
          <View />
        </TouchableOpacity>

        <View style={styles.modalCenterWrapper}>
          <View style={[styles.modalContainer, { backgroundColor: modalBg }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                Choose Cover Frame
              </Text>
              <TouchableOpacity
                onPress={() => !uploadingThumbnail && setThumbnailModalOpen(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={textSecondary} />
              </TouchableOpacity>
            </View>

            {generatingThumbnails ? (
              <View style={styles.thumbLoading}>
                <ActivityIndicator size="large" color="#00C853" />
                <Text style={[styles.thumbLoadingText, { color: textSecondary }]}>
                  Generating frames from video...
                </Text>
              </View>
            ) : (
              <>
                {/* Large selected frame preview */}
                {selectedFrameIndex >= 0 && thumbnailFrames[selectedFrameIndex] && (
                  <View style={styles.thumbPreviewContainer}>
                    <Image
                      source={{ uri: thumbnailFrames[selectedFrameIndex] }}
                      style={styles.thumbPreviewImage}
                      resizeMode="cover"
                    />
                  </View>
                )}

                {/* Frame strip — tap to select */}
                <Text style={[styles.thumbHint, { color: textSecondary }]}>
                  Tap a frame to use as your video cover
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbStrip}>
                  {thumbnailFrames.map((frame, i) => (
                    <TouchableOpacity
                      key={`frame_${i}`}
                      style={[
                        styles.thumbStripItem,
                        {
                          borderColor: i === selectedFrameIndex ? '#00C853' : borderColor,
                          borderWidth: i === selectedFrameIndex ? 2 : 1,
                        },
                      ]}
                      onPress={() => setSelectedFrameIndex(i)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: frame }}
                        style={styles.thumbStripImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Actions */}
                <View style={styles.thumbActions}>
                  <TouchableOpacity
                    style={[styles.thumbUploadBtn, { borderColor }]}
                    onPress={handleCustomThumbnail}
                    disabled={uploadingThumbnail}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="images-outline" size={16} color={textSecondary} />
                    <Text style={[styles.thumbUploadText, { color: textSecondary }]}>
                      Upload Image
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.thumbConfirmBtn,
                      {
                        backgroundColor: selectedFrameIndex >= 0 ? '#00C853' : (isDark ? '#334155' : '#E5E7EB'),
                      },
                    ]}
                    onPress={() => {
                      if (selectedFrameIndex >= 0 && thumbnailFrames[selectedFrameIndex]) {
                        uploadAndSetThumbnail(thumbnailFrames[selectedFrameIndex], thumbnailVideoIndex);
                      }
                    }}
                    disabled={selectedFrameIndex < 0 || uploadingThumbnail}
                    activeOpacity={0.7}
                  >
                    {uploadingThumbnail ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color={selectedFrameIndex >= 0 ? '#FFFFFF' : textSecondary} />
                        <Text style={[styles.thumbConfirmText, { color: selectedFrameIndex >= 0 ? '#FFFFFF' : textSecondary }]}>
                          Set as Cover
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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

  // -- Upload button --
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
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

  // -- Video thumbnail --
  videoThumbnail: {
    width: 48,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#1a1a2e',
    flexShrink: 0,
  },
  thumbnailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  thumbnailButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#00C853',
  },

  // -- Frame picker modal --
  thumbLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 14,
  },
  thumbLoadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  thumbPreviewContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#1a1a2e',
  },
  thumbPreviewImage: {
    width: '100%',
    height: '100%',
  },
  thumbHint: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  thumbStrip: {
    flexGrow: 0,
    marginBottom: 16,
  },
  thumbStripItem: {
    width: 80,
    height: 45,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
  },
  thumbStripImage: {
    width: '100%',
    height: '100%',
  },
  thumbActions: {
    flexDirection: 'row',
    gap: 10,
  },
  thumbUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  thumbUploadText: {
    fontSize: 13,
    fontWeight: '500',
  },
  thumbConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  thumbConfirmText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
