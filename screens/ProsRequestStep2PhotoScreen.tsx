/**
 * ProsRequestStep2PhotoScreen - Photo Upload Step
 * Install path: screens/ProsRequestStep2PhotoScreen.tsx
 * 
 * Step 6 of 7: Users can upload photos of their project
 * Enhanced with contextual prompts based on service category and technical details.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ProsColors } from '../constants/ProsConfig';
import { useProsPendingRequests } from '../hooks/useProsPendingRequests';
import { supabase } from '../lib/supabaseClient';
import { decode } from 'base64-arraybuffer';
import { useTranslation } from 'react-i18next';

type RouteParams = {
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    privacyPreference: 'share' | 'app_only';
  };
  categoryId: string;
  categoryName: string;
  description: string;
  dynamicAnswers?: Record<string, any>;
  address?: string;
  city: string;
  state: string;
  zipCode: string;
  timeline: string;
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}%</Text>
  </View>
);

export default function ProsRequestStep2PhotoScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  
  const { 
    customerInfo, 
    categoryId, 
    categoryName, 
    description, 
    dynamicAnswers,
    address,
    city,
    state,
    zipCode,
    timeline
  } = route.params;
  
  const { saveProgress } = useProsPendingRequests();
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const MAX_PHOTOS = 5;

  // Contextual Photo Prompts based on Category and Answers
  const contextualPrompt = useMemo(() => {
    const branch = dynamicAnswers ? Object.values(dynamicAnswers)[0] : '';
    
    if (categoryName === 'Electrician') {
      if (branch === 'EV Charger Installation') return "Pro Tip: Take a photo of your electrical panel and the area where you want the charger installed.";
      if (branch === 'Panel Upgrade') return "Pro Tip: A clear photo of your current electrical panel (with the door open) is essential for an accurate bid.";
      return "Pro Tip: Photos of the specific outlet, fixture, or panel issue help electricians diagnose the problem remotely.";
    }
    
    if (categoryName === 'Plumber') {
      if (branch === 'Water Heater') return "Pro Tip: Take a photo of the manufacturer's label on your current water heater and the surrounding piping.";
      return "Pro Tip: Show the leak or the fixture that needs repair. Close-ups of the pipe connections are very helpful.";
    }
    
    if (categoryName === 'Pool Contractor') {
      return "Pro Tip: Take a wide shot of the pool and a photo of the equipment pad (pump/filter). Also show the backyard access path.";
    }
    
    if (categoryName === 'Roofing') {
      return "Pro Tip: Photos of the roof from the ground and any visible interior water damage help roofers assess the urgency.";
    }

    return "Photos help pros understand your project better and provide more accurate quotes (optional).";
  }, [categoryName, dynamicAnswers]);

  const requestPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload project photos.'
        );
        return false;
      }
    }
    return true;
  };

  const uploadToSupabase = async (uri: string) => {
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `project-photos/${fileName}`;

      // In a real app, you'd convert the URI to a blob or base64
      // For this implementation, we'll simulate the upload and return a mock URL
      // or use the actual Supabase upload logic if the environment supports it.
      
      // const response = await fetch(uri);
      // const blob = await response.blob();
      // const { data, error } = await supabase.storage.from('project-photos').upload(filePath, blob);
      
      // For now, we'll use the local URI and handle the actual upload during final submission
      // or return the public URL if uploaded successfully.
      return uri; 
    } catch (error) {
      console.error('Upload error:', error);
      return uri;
    }
  };

  const pickImage = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.7,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
    }
  };

  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your camera to take project photos.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled && result.assets) {
      setPhotos(prev => [...prev, result.assets[0].uri].slice(0, MAX_PHOTOS));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    setIsUploading(true);
    try {
      const formData = {
        customerInfo,
        categoryId,
        categoryName,
        description,
        dynamicAnswers,
        address,
        city,
        state,
        zipCode,
        timeline,
        photos,
      };

      // Auto-save progress
      await saveProgress(categoryId, 5, formData);

      navigation.navigate('ProsRequestStep5', formData);
    } catch (error) {
      Alert.alert('Error', 'Failed to save photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel? Your progress will not be saved.',
      [
        { text: 'Keep Going', onPress: () => {} },
        { text: 'Cancel', onPress: () => navigation.navigate('ProsHome'), style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Photos</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressWrapper}>
        <ProgressBar progress={86} />
        <Text style={styles.stepText}>Step 6 of 7: Visuals</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>Add photos of your project</Text>
        <View style={styles.contextBox}>
          <Ionicons name="bulb-outline" size={20} color={ProsColors.primary} />
          <Text style={styles.contextText}>{contextualPrompt}</Text>
        </View>

        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          
          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Ionicons name="add" size={32} color={ProsColors.primary} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photo Actions */}
        <View style={styles.photoActions}>
          <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
            <View style={styles.actionIcon}>
              <Ionicons name="images" size={24} color={ProsColors.primary} />
            </View>
            <Text style={styles.actionText}>Choose from Library</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
            <View style={styles.actionIcon}>
              <Ionicons name="camera" size={24} color={ProsColors.primary} />
            </View>
            <Text style={styles.actionText}>Take a Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Contractor Tips</Text>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.tipText}>Show the area that needs work</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.tipText}>Include close-ups of any damage or issues</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.tipText}>Take photos in good lighting</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, isUploading && styles.nextButtonDisabled]} 
          onPress={handleNext}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>
                {photos.length === 0 ? 'Skip for now' : `Continue with ${photos.length} photo${photos.length !== 1 ? 's' : ''}`}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  progressWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ProsColors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
    width: 40,
    textAlign: 'right',
  },
  stepText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  contextBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  contextText: {
    flex: 1,
    fontSize: 14,
    color: '#0369A1',
    lineHeight: 20,
    fontWeight: '500',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  photoContainer: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  addPhotoText: {
    fontSize: 12,
    color: ProsColors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  photoActions: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  tipsContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: ProsColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
