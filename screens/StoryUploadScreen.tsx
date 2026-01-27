// =============================================
// STORY UPLOAD SCREEN
// =============================================
// Allows users to record/upload short videos (max 15 seconds)
// and add tags for discovery

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Video, ResizeMode } from 'expo-av';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { 
  createStory, 
  getQuickFindPresets, 
  QuickFindPreset,
  createStoryWithLocation,
  getCurrentLocation,
  isWithinRadius,
  canUserCreateStory,
  canUserCreateStoryForPlace,
  DEFAULT_RADIUS_METERS,
  STORY_EXPIRY_HOURS,
} from '../lib/storyService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_VIDEO_DURATION = 15; // seconds

// Suggested tags for quick selection
const SUGGESTED_TAGS = [
  'coffee', 'wifi', 'workspace', 'late night', 'family friendly',
  'romantic', 'pet friendly', 'live music', 'outdoor seating',
  'happy hour', 'brunch', 'vegan', 'gluten free', 'craft beer',
  'cocktails', 'views', 'cozy', 'trendy', 'hidden gem', 'local favorite'
];

interface RouteParams {
  placeId: string;
  placeName: string;
  placeLatitude?: number;
  placeLongitude?: number;
}

export default function StoryUploadScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId, placeName, placeLatitude, placeLongitude } = (route.params as RouteParams) || {};

  // Location gating state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isWithinRange, setIsWithinRange] = useState<boolean | null>(null);
  const [distanceToPlace, setDistanceToPlace] = useState<number | null>(null);
  const [canPost, setCanPost] = useState<boolean>(true);
  const [canPostError, setCanPostError] = useState<string | null>(null);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  // Camera state
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  // Media state
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);

  // Form state
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Screen mode
  const [mode, setMode] = useState<'camera' | 'preview' | 'details'>('camera');

  // Quick find presets for tag suggestions
  const [presets, setPresets] = useState<QuickFindPreset[]>([]);

  useEffect(() => {
    loadPresets();
    checkLocationAndPermissions();
  }, []);

  // Check location gating and user permissions
  const checkLocationAndPermissions = async () => {
    setCheckingPermissions(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCanPost(false);
        setCanPostError('You must be logged in to post stories');
        setCheckingPermissions(false);
        return;
      }

      // Check if user can create stories (not suspended, within limits)
      const canCreateResult = await canUserCreateStory(user.id);
      if (!canCreateResult.allowed) {
        setCanPost(false);
        setCanPostError(canCreateResult.reason || 'You cannot post stories at this time');
        setCheckingPermissions(false);
        return;
      }

      // Check place-specific rate limit
      if (placeId) {
        const canCreateForPlaceResult = await canUserCreateStoryForPlace(user.id, placeId);
        if (!canCreateForPlaceResult.allowed) {
          setCanPost(false);
          setCanPostError(canCreateForPlaceResult.reason || 'Rate limit reached for this place');
          setCheckingPermissions(false);
          return;
        }
      }

      // Get user's current location
      const location = await getCurrentLocation();
      if (!location) {
        setLocationError('Could not get your location. Please enable location services.');
        setCheckingPermissions(false);
        return;
      }
      setUserLocation(location);

      // Check if within range of place (if place coordinates provided)
      if (placeLatitude && placeLongitude) {
        const rangeCheck = isWithinRadius(
          location.latitude,
          location.longitude,
          placeLatitude,
          placeLongitude,
          DEFAULT_RADIUS_METERS
        );
        setIsWithinRange(rangeCheck.withinRadius);
        setDistanceToPlace(rangeCheck.distance);

        if (!rangeCheck.withinRadius) {
          setCanPost(false);
          setCanPostError(`You must be within ${DEFAULT_RADIUS_METERS}m of ${placeName} to post a story. You are ${rangeCheck.distance}m away.`);
        }
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setLocationError('Error checking your location');
    } finally {
      setCheckingPermissions(false);
    }
  };

  const loadPresets = async () => {
    const data = await getQuickFindPresets();
    setPresets(data);
  };

  // Request permissions on mount
  useEffect(() => {
    if (!cameraPermission?.granted) {
      requestCameraPermission();
    }
    if (!micPermission?.granted) {
      requestMicPermission();
    }
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= MAX_VIDEO_DURATION) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
      setRecordingDuration(0);
    }

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    if (!cameraRef.current) return;

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_VIDEO_DURATION,
      });
      
      if (video?.uri) {
        setMediaUri(video.uri);
        setMediaType('video');
        setMode('preview');
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    
    try {
      await cameraRef.current.stopRecording();
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
    setIsRecording(false);
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      if (photo?.uri) {
        setMediaUri(photo.uri);
        setMediaType('image');
        setMode('preview');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        videoMaxDuration: MAX_VIDEO_DURATION,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType(asset.type === 'video' ? 'video' : 'image');
        setMode('preview');
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to select media. Please try again.');
    }
  };

  const toggleCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const retakeMedia = () => {
    setMediaUri(null);
    setThumbnailUri(null);
    setMode('camera');
  };

  const proceedToDetails = () => {
    setMode('details');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const tag = customTag.trim().toLowerCase();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
      setCustomTag('');
    }
  };

  const uploadStory = async () => {
    if (!mediaUri || !placeId) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    // Check if user can post (location gating, suspension, rate limits)
    if (!canPost) {
      Alert.alert('Cannot Post', canPostError || 'You cannot post stories at this time');
      return;
    }

    // Verify location one more time before upload
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services to post stories');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to upload stories');
        setIsUploading(false);
        return;
      }

      // Upload media to Supabase Storage
      setUploadProgress(10);
      const fileName = `${user.id}/${placeId}/${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
      
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(mediaUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      setUploadProgress(30);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('place-stories')
        .upload(fileName, decode(base64), {
          contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('place-stories')
        .getPublicUrl(fileName);

      setUploadProgress(80);

      // Create story record with location validation
      let storyResult;
      
      // Use location-gated creation if place coordinates are available
      if (placeLatitude && placeLongitude && userLocation) {
        storyResult = await createStoryWithLocation({
          place_id: placeId,
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          thumbnail_url: mediaType === 'video' ? thumbnailUri || undefined : publicUrl,
          caption: caption.trim() || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          userLocation: userLocation,
          placeLocation: {
            latitude: placeLatitude,
            longitude: placeLongitude,
          },
        });
      } else {
        // Fallback to regular creation (for places without coordinates)
        const story = await createStory({
          place_id: placeId,
          user_id: user.id,
          media_url: publicUrl,
          media_type: mediaType,
          thumbnail_url: mediaType === 'video' ? thumbnailUri : publicUrl,
          caption: caption.trim() || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        });
        storyResult = story ? { success: true, story } : { success: false, error: 'Failed to create story' };
      }

      setUploadProgress(100);

      if (storyResult.success) {
        Alert.alert(
          'Success!',
          `Your story has been uploaded! It will be visible for ${STORY_EXPIRY_HOURS / 24} days.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error(storyResult.error || 'Failed to create story record');
      }
    } catch (error) {
      console.error('Error uploading story:', error);
      Alert.alert('Error', 'Failed to upload story. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper function to decode base64
  const decode = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Render camera view
  const renderCamera = () => {
    // Show loading while checking permissions
    if (checkingPermissions) {
      return (
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.permissionTitle}>Checking permissions...</Text>
          <Text style={styles.permissionText}>
            Verifying your location and account status.
          </Text>
        </View>
      );
    }

    // Show error if user cannot post (suspended, rate limited, or out of range)
    if (!canPost || locationError) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name="location-outline" size={64} color="#EF4444" />
          <Text style={styles.permissionTitle}>Cannot Post Story</Text>
          <Text style={styles.permissionText}>
            {canPostError || locationError || 'You cannot post stories at this time.'}
          </Text>
          {distanceToPlace && (
            <Text style={styles.distanceText}>
              You are {distanceToPlace}m away (max: {DEFAULT_RADIUS_METERS}m)
            </Text>
          )}
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: '#6B7280', marginTop: 12 }]}
            onPress={checkLocationAndPermissions}
          >
            <Text style={styles.permissionButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!cameraPermission?.granted || !micPermission?.granted) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#6B7280" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Please grant camera and microphone permissions to record stories.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => {
              requestCameraPermission();
              requestMicPermission();
            }}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="video"
        >
          {/* Top Controls */}
          <SafeAreaView style={styles.cameraTopControls}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.placeInfo}>
              <Text style={styles.placeLabel}>Posting to</Text>
              <Text style={styles.placeName} numberOfLines={1}>{placeName}</Text>
            </View>

            <TouchableOpacity style={styles.flipButton} onPress={toggleCamera}>
              <Ionicons name="camera-reverse" size={28} color="#fff" />
            </TouchableOpacity>
          </SafeAreaView>

          {/* Recording Indicator */}
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingTime}>
                {recordingDuration}s / {MAX_VIDEO_DURATION}s
              </Text>
            </View>
          )}

          {/* Bottom Controls */}
          <View style={styles.cameraBottomControls}>
            {/* Gallery Button */}
            <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
              <Ionicons name="images" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Record Button */}
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordButtonActive]}
              onPress={isRecording ? stopRecording : startRecording}
              onLongPress={startRecording}
            >
              {isRecording ? (
                <View style={styles.stopIcon} />
              ) : (
                <View style={styles.recordIcon} />
              )}
            </TouchableOpacity>

            {/* Photo Button */}
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Ionicons name="camera" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <Text style={styles.instructions}>
            {isRecording ? 'Tap to stop recording' : 'Hold to record video • Tap camera for photo'}
          </Text>
        </CameraView>
      </View>
    );
  };

  // Render preview
  const renderPreview = () => (
    <View style={styles.previewContainer}>
      {mediaType === 'video' ? (
        <Video
          source={{ uri: mediaUri! }}
          style={styles.previewMedia}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted={false}
        />
      ) : (
        <Image source={{ uri: mediaUri! }} style={styles.previewMedia} />
      )}

      {/* Top Controls */}
      <SafeAreaView style={styles.previewTopControls}>
        <TouchableOpacity style={styles.closeButton} onPress={retakeMedia}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.previewTitle}>Preview</Text>

        <TouchableOpacity style={styles.nextButton} onPress={proceedToDetails}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Retake Button */}
      <View style={styles.previewBottomControls}>
        <TouchableOpacity style={styles.retakeButton} onPress={retakeMedia}>
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render details form
  const renderDetails = () => (
    <SafeAreaView style={styles.detailsContainer}>
      {/* Header */}
      <View style={styles.detailsHeader}>
        <TouchableOpacity onPress={() => setMode('preview')}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.detailsTitle}>Add Details</Text>
        <TouchableOpacity
          style={[styles.postButton, isUploading && styles.postButtonDisabled]}
          onPress={uploadStory}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.detailsContent} showsVerticalScrollIndicator={false}>
        {/* Media Preview Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {mediaType === 'video' ? (
            <Video
              source={{ uri: mediaUri! }}
              style={styles.thumbnail}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
            />
          ) : (
            <Image source={{ uri: mediaUri! }} style={styles.thumbnail} />
          )}
          <View style={styles.thumbnailOverlay}>
            <Ionicons 
              name={mediaType === 'video' ? 'videocam' : 'image'} 
              size={24} 
              color="#fff" 
            />
          </View>
        </View>

        {/* Caption Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Caption (optional)</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor="#9CA3AF"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{caption.length}/200</Text>
        </View>

        {/* Tags Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Tags (help people discover your story)</Text>
          
          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <View style={styles.selectedTags}>
              {selectedTags.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={styles.selectedTag}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={styles.selectedTagText}>#{tag}</Text>
                  <Ionicons name="close-circle" size={16} color="#3B82F6" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Custom Tag Input */}
          <View style={styles.customTagContainer}>
            <TextInput
              style={styles.customTagInput}
              placeholder="Add custom tag..."
              placeholderTextColor="#9CA3AF"
              value={customTag}
              onChangeText={setCustomTag}
              onSubmitEditing={addCustomTag}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addTagButton} onPress={addCustomTag}>
              <Ionicons name="add" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* Quick Find Presets */}
          <Text style={styles.suggestedLabel}>Quick Finds</Text>
          <View style={styles.suggestedTags}>
            {presets.map(preset => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.suggestedTag,
                  preset.tags.some(t => selectedTags.includes(t)) && styles.suggestedTagSelected,
                ]}
                onPress={() => {
                  // Add all tags from this preset
                  preset.tags.forEach(tag => {
                    if (!selectedTags.includes(tag)) {
                      setSelectedTags(prev => [...prev, tag]);
                    }
                  });
                }}
              >
                <Text style={styles.presetIcon}>{preset.icon}</Text>
                <Text style={[
                  styles.suggestedTagText,
                  preset.tags.some(t => selectedTags.includes(t)) && styles.suggestedTagTextSelected,
                ]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Suggested Tags */}
          <Text style={styles.suggestedLabel}>Suggested Tags</Text>
          <View style={styles.suggestedTags}>
            {SUGGESTED_TAGS.filter(t => !selectedTags.includes(t)).slice(0, 12).map(tag => (
              <TouchableOpacity
                key={tag}
                style={styles.suggestedTag}
                onPress={() => toggleTag(tag)}
              >
                <Text style={styles.suggestedTagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.uploadProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>Uploading... {uploadProgress}%</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <View style={styles.container}>
      {mode === 'camera' && renderCamera()}
      {mode === 'preview' && renderPreview()}
      {mode === 'details' && renderDetails()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0F1233',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 12,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },

  // Camera styles
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  placeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginRight: 8,
  },
  recordingTime: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cameraBottomControls: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.3)',
    borderColor: '#EF4444',
  },
  recordIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
  },
  stopIcon: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  photoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },

  // Preview styles
  previewContainer: {
    flex: 1,
  },
  previewMedia: {
    flex: 1,
    width: '100%',
  },
  previewTopControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  previewBottomControls: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  retakeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Details styles
  detailsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  postButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsContent: {
    flex: 1,
    padding: 16,
  },
  thumbnailContainer: {
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 24,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  captionInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  selectedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  selectedTagText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  customTagInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  addTagButton: {
    padding: 8,
  },
  suggestedLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 8,
  },
  suggestedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  suggestedTagSelected: {
    backgroundColor: '#EFF6FF',
  },
  presetIcon: {
    fontSize: 14,
  },
  suggestedTagText: {
    fontSize: 13,
    color: '#6B7280',
  },
  suggestedTagTextSelected: {
    color: '#3B82F6',
  },
  uploadProgress: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
