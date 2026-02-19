import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface AddPhotoScreenProps {
  route: {
    params: {
      placeId: string;
      placeName: string;
    };
  };
  navigation: any;
}

/**
 * Resolve a placeId to a UUID in the places table.
 * Handles UUIDs, FSQ IDs (fsq:xxx), and Google Place IDs.
 */
async function resolvePlaceUUID(placeId: string): Promise<string | null> {
  if (!placeId) return null;

  // Strip fsq: prefix if present
  const cleanId = placeId.startsWith('fsq:') ? placeId.slice(4) : placeId;

  // Check if it's already a UUID (36 chars with dashes)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

  if (isUUID) {
    // Verify it exists in places table
    const { data } = await supabase
      .from('places')
      .select('id')
      .eq('id', cleanId)
      .maybeSingle();
    if (data) return data.id;
  }

  // Try source_id lookup (FSQ IDs stored in places)
  const { data: bySource } = await supabase
    .from('places')
    .select('id')
    .eq('source_id', cleanId)
    .maybeSingle();
  if (bySource) return bySource.id;

  // Try google_place_id lookup
  const { data: byGoogle } = await supabase
    .from('places')
    .select('id')
    .eq('google_place_id', cleanId)
    .maybeSingle();
  if (byGoogle) return byGoogle.id;

  // Try FSQ raw table and auto-promote
  const { data: fsqPlace } = await supabase
    .from('fsq_places_raw')
    .select('*')
    .eq('fsq_place_id', cleanId)
    .maybeSingle();

  if (fsqPlace) {
    const { data: newPlace, error } = await supabase
      .from('places')
      .insert({
        name: fsqPlace.name,
        source_type: 'fsq',
        source_id: fsqPlace.fsq_place_id,
        latitude: fsqPlace.latitude,
        longitude: fsqPlace.longitude,
        city: fsqPlace.locality,
        region: fsqPlace.region,
        country: fsqPlace.country,
        postcode: fsqPlace.postcode,
        phone: fsqPlace.tel,
        website: fsqPlace.website,
        email: fsqPlace.email,
        status: 'active',
      })
      .select('id')
      .single();

    if (newPlace) return newPlace.id;
    if (error) console.error('Error promoting FSQ place:', error);
  }

  return null;
}

export default function AddPhotoScreen({ route, navigation }: AddPhotoScreenProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { placeId, placeName } = route?.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        if (photo) {
          setCapturedImage(photo.uri);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!capturedImage || !placeId) return;

    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to add photos.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Resolve the place UUID
      const resolvedPlaceId = await resolvePlaceUUID(placeId);
      if (!resolvedPlaceId) {
        Alert.alert('Error', 'Could not resolve place. Please try again.');
        setIsUploading(false);
        return;
      }

      // 2. Upload image to Supabase Storage
      const timestamp = Date.now();
      const fileName = `${resolvedPlaceId}/${user.id}_${timestamp}.jpg`;

      // Convert image URI to array buffer (React Native compatible)
      const response = await fetch(capturedImage);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('place-photos')
        .upload(fileName, uint8Array, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload Failed', uploadError.message || 'Failed to upload photo. Please try again.');
        setIsUploading(false);
        return;
      }

      // 3. Get the public URL
      const { data: urlData } = supabase.storage
        .from('place-photos')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // 4. Insert record into place_photos table
      const { error: insertError } = await supabase
        .from('place_photos')
        .insert({
          place_id: resolvedPlaceId,
          uploaded_by: user.id,
          user_id: user.id,
          url: publicUrl,
          caption: caption.trim() || null,
          is_owner_photo: false,
          status: 'live',
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        // Photo is uploaded but DB insert failed - still show success
        // since the photo is in storage
        Alert.alert('Photo Uploaded', 'Photo was uploaded but there was an issue saving details. It may appear shortly.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        setIsUploading(false);
        return;
      }

      // 5. Success!
      Alert.alert('Photo Added!', `Your photo of ${placeName || 'this place'} has been added.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);

    } catch (error: any) {
      console.error('Photo upload error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCaption('');
  };

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#2DD4BF" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.backButtonLarge}>
          <Text style={styles.backButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonLarge, { marginTop: 12, backgroundColor: '#666' }]}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {capturedImage ? (
        <KeyboardAvoidingView 
          style={styles.previewContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <View style={styles.previewHeader}>
              <TouchableOpacity onPress={handleRetake} style={styles.iconButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.previewBottom}>
              {/* Caption input */}
              <View style={styles.captionContainer}>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Add a caption (optional)"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={caption}
                  onChangeText={setCaption}
                  maxLength={200}
                  multiline={false}
                  returnKeyType="done"
                />
              </View>
              <View style={styles.previewFooter}>
                <TouchableOpacity onPress={handleRetake} style={styles.secondaryButton} disabled={isUploading}>
                  <Text style={styles.secondaryButtonText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleSave} 
                  style={[styles.primaryButton, isUploading && styles.primaryButtonDisabled]} 
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <View style={styles.uploadingRow}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={[styles.primaryButtonText, { marginLeft: 8 }]}>Uploading...</Text>
                    </View>
                  ) : (
                    <Text style={styles.primaryButtonText}>Use Photo</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <CameraView 
          style={styles.camera} 
          facing={facing}
          ref={cameraRef}
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>{placeName || 'Add Photo'}</Text>
              <TouchableOpacity 
                onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} 
                style={styles.iconButton}
              >
                <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.cameraFooter}>
              <TouchableOpacity onPress={pickImage} style={styles.galleryButton}>
                <Ionicons name="images-outline" size={24} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
              
              <View style={styles.placeholderButton} /> 
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  placeholderButton: {
    width: 50,
    height: 50,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    width: '100%',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  previewHeader: {
    alignItems: 'flex-start',
  },
  previewBottom: {
    gap: 12,
  },
  captionContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  captionInput: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    backgroundColor: '#2DD4BF',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonLarge: {
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
