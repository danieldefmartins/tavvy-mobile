/**
 * QuickSetup -- Step 3 of creation wizard: name, photo, primary color, create.
 *
 * Ported from web: components/ecard/wizard/QuickSetup.tsx
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform,
  ActionSheetIOS,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

const ACCENT = '#00C853';

// ── Color options (matches web) ─────────────────────────────
const QUICK_COLORS = [
  '#3B82F6', '#8B5CF6', '#00C853', '#EF4444', '#F59E0B',
  '#EC4899', '#14B8A6', '#1E293B', '#D4AF37', '#0EA5E9',
];

// ── Props ───────────────────────────────────────────────────
interface QuickSetupProps {
  templateId: string;
  colorSchemeId?: string | null;
  onBack: () => void;
  onCreateCard: (data: {
    name: string;
    title: string;
    photoUri?: string;
    primaryColor?: string;
  }) => void;
  creating: boolean;
  isDark: boolean;
}

export default function QuickSetup({
  templateId,
  colorSchemeId,
  onBack,
  onCreateCard,
  creating,
  isDark,
}: QuickSetupProps) {
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState(QUICK_COLORS[0]);

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputColor = isDark ? '#FFFFFF' : '#333333';
  const borderColor = isDark ? '#334155' : '#E5E7EB';

  const canCreate = fullName.trim().length >= 2;

  // ── Image picker ──────────────────────────────────────────
  const pickPhoto = async () => {
    const pick = async (useCamera: boolean) => {
      try {
        if (useCamera) {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required to take a photo.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
          }
        } else {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'] as ImagePicker.MediaType[],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to pick image. Please try again.');
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pick(true);
          else if (buttonIndex === 2) pick(false);
        },
      );
    } else {
      pick(false);
    }
  };

  // ── Submit handler ────────────────────────────────────────
  const handleCreate = () => {
    if (!canCreate || creating) return;
    onCreateCard({
      name: fullName.trim(),
      title: title.trim(),
      photoUri: photoUri || undefined,
      primaryColor,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color={textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>Quick Setup</Text>
            <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
              You can edit everything later
            </Text>
          </View>
        </View>

        {/* Profile photo */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={pickPhoto} activeOpacity={0.8}>
            <View
              style={[
                styles.photoCircle,
                {
                  backgroundColor: photoUri
                    ? 'transparent'
                    : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : '#F3F4F6',
                  borderColor: photoUri
                    ? 'transparent'
                    : isDark
                      ? 'rgba(255,255,255,0.1)'
                      : '#D1D5DB',
                },
              ]}
            >
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.photoImage}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons
                    name="camera"
                    size={28}
                    color={isDark ? '#64748B' : '#9CA3AF'}
                  />
                  <Text
                    style={[
                      styles.photoLabel,
                      { color: textSecondary },
                    ]}
                  >
                    Photo
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Full Name */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: textSecondary }]}>Full Name *</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: inputBg,
                color: inputColor,
                borderColor,
              },
            ]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            autoFocus
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* Title / Role */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: textSecondary }]}>Title / Role</Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: inputBg,
                color: inputColor,
                borderColor,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. CEO, Designer, Agent"
            placeholderTextColor={isDark ? '#64748B' : '#9CA3AF'}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* Primary Color */}
        <View style={styles.colorSection}>
          <Text style={[styles.fieldLabel, { color: textSecondary }]}>Primary Color</Text>
          <View style={styles.colorGrid}>
            {QUICK_COLORS.map((color) => {
              const isSelected = primaryColor === color;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => setPrimaryColor(color)}
                  activeOpacity={0.7}
                  style={[
                    styles.colorCircleOuter,
                    isSelected && { borderColor: '#FFFFFF', shadowColor: color, shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
                  ]}
                >
                  <View
                    style={[
                      styles.colorCircleInner,
                      { backgroundColor: color },
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Create button */}
        <TouchableOpacity
          onPress={handleCreate}
          disabled={!canCreate || creating}
          activeOpacity={0.8}
          style={{ marginTop: 28 }}
        >
          <LinearGradient
            colors={
              canCreate
                ? [ACCENT, '#00A843'] as [string, string]
                : isDark
                  ? ['#334155', '#334155'] as [string, string]
                  : ['#D1D5DB', '#D1D5DB'] as [string, string]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.createButton,
              { opacity: creating ? 0.6 : 1 },
            ]}
          >
            {creating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text
                style={[
                  styles.createButtonText,
                  { color: canCreate ? '#FFFFFF' : textSecondary },
                ]}
              >
                Create Card
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },

  // Photo
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    fontSize: 10,
    marginTop: 2,
  },

  // Fields
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 16,
  },

  // Color picker
  colorSection: {
    marginBottom: 8,
    marginTop: 6,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  colorCircleOuter: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  colorCircleInner: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },

  // Create button
  createButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
