/**
 * ImageUploader -- image upload component with preview for the card editor.
 * Uses expo-image-picker for photo selection. Supports circle, square, and banner shapes.
 */

import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const ACCENT = '#00C853';

interface ImageUploaderProps {
  imageUrl?: string | null;
  onImageSelected: (uri: string) => void;
  onRemove?: () => void;
  label: string;
  shape?: 'circle' | 'square' | 'banner';
  width?: number;
  height?: number;
  isDark: boolean;
}

export default function ImageUploader({
  imageUrl,
  onImageSelected,
  onRemove,
  label,
  shape = 'circle',
  width = 100,
  height,
  isDark,
}: ImageUploaderProps) {
  const h = height || (shape === 'banner' ? 120 : width);
  const w = shape === 'banner' ? '100%' as const : width;

  const borderRadius = shape === 'circle' ? width / 2 : 12;
  const placeholderBg = isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6';
  const dashedBorderColor = isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB';
  const iconColor = isDark ? '#64748B' : '#9CA3AF';
  const buttonBg = isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6';
  const buttonText = isDark ? '#E2E8F0' : '#374151';

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Image preview or placeholder */}
      <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
        {imageUrl ? (
          <View style={[
            styles.imageWrapper,
            {
              width: w,
              height: h,
              borderRadius: borderRadius,
            },
          ]}>
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.image,
                { borderRadius: borderRadius },
              ]}
              resizeMode="cover"
            />
            {/* Remove overlay button */}
            {onRemove && (
              <TouchableOpacity
                style={styles.removeOverlay}
                onPress={onRemove}
                activeOpacity={0.8}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="trash" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                width: w,
                height: h,
                borderRadius: borderRadius,
                backgroundColor: placeholderBg,
                borderColor: dashedBorderColor,
              },
            ]}
          >
            <Ionicons name="camera" size={28} color={iconColor} />
            <Text style={[styles.placeholderText, { color: iconColor }]}>
              {label}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: buttonBg }]}
          onPress={pickImage}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionButtonText, { color: buttonText }]}>
            {imageUrl ? 'Change' : label}
          </Text>
        </TouchableOpacity>

        {imageUrl && onRemove && (
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={onRemove}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={12} color="#EF4444" />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  imageWrapper: {
    overflow: 'hidden',
    position: 'relative',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  placeholderText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'column',
    gap: 8,
    flexShrink: 1,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF4444',
  },
});
