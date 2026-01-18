'''import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { placeName } = route?.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
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
        Alert.alert(t('common.error'), t('errors.somethingWentWrong'));
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
    Alert.alert(t('success.success'), t('success.requestSubmitted'), [
      { text: t('common.done'), onPress: () => navigation.goBack() }
    ]);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#2DD4BF" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{t('errors.cameraPermission')}</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.backButtonLarge}>
          <Text style={styles.backButtonText}>{t('common.grantPermission')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonLarge, { marginTop: 12, backgroundColor: '#666' }]}>
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {capturedImage ? (
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
                <Text style={styles.secondaryButtonText}>{t('common.retake')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{t('places.usePhoto')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
              <Text style={styles.cameraTitle}>{placeName || t('places.addPhoto')}</Text>
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
    backgroundColor: '#2DD4BF',
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
'''
