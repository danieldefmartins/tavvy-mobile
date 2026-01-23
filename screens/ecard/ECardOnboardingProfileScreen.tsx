import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

interface Props {
  navigation: any;
  route: any;
}

export default function ECardOnboardingProfileScreen({ navigation, route }: Props) {
  const { templateId, colorSchemeId, selectedPlatforms } = route.params || {};
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleContinue = () => {
    navigation.navigate('ECardOnboardingLinks', {
      templateId,
      colorSchemeId,
      selectedPlatforms,
      profile: {
        image: profileImage,
        name,
        title,
        bio,
      },
    });
  };

  const isValid = name.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '66%' }]} />
            </View>
            <Text style={styles.stepText}>Step 2 of 3</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Add your profile</Text>
            <Text style={styles.subtitle}>
              Tell people who you are. This is what they'll see first.
            </Text>
          </View>

          {/* Profile Photo */}
          <TouchableOpacity 
            style={styles.photoContainer}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={32} color="#9E9E9E" />
                <Text style={styles.photoPlaceholderText}>Add photo</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor="#BDBDBD"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Title/Role */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title / Role</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Photographer, CEO, Artist"
                placeholderTextColor="#BDBDBD"
                value={title}
                onChangeText={setTitle}
                autoCapitalize="words"
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Tell people a bit about yourself..."
                placeholderTextColor="#BDBDBD"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={150}
              />
              <Text style={styles.charCount}>{bio.length}/150</Text>
            </View>
          </View>

          {/* Preview Card */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.previewCard}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewGradient}
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewImagePlaceholder}>
                    <Ionicons name="person" size={24} color="#fff" />
                  </View>
                )}
                <Text style={styles.previewName}>{name || 'Your Name'}</Text>
                {title ? <Text style={styles.previewTitle}>{title}</Text> : null}
                {bio ? <Text style={styles.previewBio} numberOfLines={2}>{bio}</Text> : null}
              </LinearGradient>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !isValid && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isValid ? ['#00C853', '#00E676'] : ['#E0E0E0', '#BDBDBD']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={[
                styles.continueButtonText,
                !isValid && styles.continueButtonTextDisabled
              ]}>
                Continue
              </Text>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={isValid ? '#fff' : '#9E9E9E'} 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00C853',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 4,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FAFAFA',
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bioInput: {
    height: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'right',
    marginTop: 4,
  },
  previewContainer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  previewCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  previewGradient: {
    padding: 24,
    alignItems: 'center',
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  previewImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  previewTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  previewBio: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  continueButtonTextDisabled: {
    color: '#9E9E9E',
  },
});
