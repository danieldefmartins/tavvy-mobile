import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface AddPhotoScreenProps {
  route: {
    params: {
      placeId: string;
      placeName: string;
    };
  };
  navigation: any;
}

export default function AddPhotoScreen({ route, navigation }: AddPhotoScreenProps) {
  const { placeName } = route?.params || {};
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<Camera>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true, // Faster capture
        });
        setCapturedImage(photo.uri);
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

  const handleSave = () => {
    // Here you would typically upload the image to your backend/storage
    Alert.alert('Success', 'Photo added successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  if (hasPermission === null) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#2DD4BF" /></View>;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No access to camera</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonLarge}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {capturedImage ? (
        // Preview Mode
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <View style={styles.previewHeader}>
              <TouchableOpacity onPress={handleRetake} style={styles.iconButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.previewFooter}>
              <TouchableOpacity onPress={handleRetake} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Use Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        // Camera Mode
        <Camera 
          style={styles.camera} 
          type={type}
          ref={cameraRef}
          onCameraReady={() => setIsCameraReady(true)}
        >
          <View style={styles.cameraOverlay}>
            {/* Header */}
            <View style={styles.cameraHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.cameraTitle}>{placeName || 'Add Photo'}</Text>
              <TouchableOpacity 
                onPress={() => {
                  setType(type === CameraType.back ? CameraType.front : CameraType.back);
                }} 
                style={styles.iconButton}
              >
                <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Footer Controls */}
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
        </Camera>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
  },
  camera: {
    flex: 1,
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
  
  // Preview Styles
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
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
    backgroundColor: '#2DD4BF', // Brand Teal
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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