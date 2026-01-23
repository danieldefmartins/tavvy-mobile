/**
 * Gallery Block Editor Component
 * Allows users to add multiple images to their eCard
 * 
 * Features:
 * - Multi-image upload (up to 10 images)
 * - Image reordering via drag
 * - Optional captions for each image
 * - Grid preview
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface GalleryImage {
  id: string;
  uri: string;
  caption?: string;
}

interface GalleryBlockEditorProps {
  images: GalleryImage[];
  title?: string;
  onUpdate: (images: GalleryImage[], title?: string) => void;
  maxImages?: number;
}

const GalleryBlockEditor: React.FC<GalleryBlockEditorProps> = ({
  images = [],
  title = '',
  onUpdate,
  maxImages = 10,
}) => {
  const [galleryTitle, setGalleryTitle] = useState(title);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(images);
  const [uploading, setUploading] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);

  const generateId = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const pickImages = async () => {
    if (galleryImages.length >= maxImages) {
      Alert.alert('Limit Reached', `You can add up to ${maxImages} images.`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxImages - galleryImages.length,
      });

      if (!result.canceled && result.assets) {
        setUploading(true);
        
        const newImages: GalleryImage[] = result.assets.map((asset) => ({
          id: generateId(),
          uri: asset.uri,
          caption: '',
        }));

        const updatedImages = [...galleryImages, ...newImages].slice(0, maxImages);
        setGalleryImages(updatedImages);
        onUpdate(updatedImages, galleryTitle);
        
        setUploading(false);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
      setUploading(false);
    }
  };

  const removeImage = (imageId: string) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedImages = galleryImages.filter((img) => img.id !== imageId);
            setGalleryImages(updatedImages);
            onUpdate(updatedImages, galleryTitle);
          },
        },
      ]
    );
  };

  const updateCaption = (imageId: string, caption: string) => {
    const updatedImages = galleryImages.map((img) =>
      img.id === imageId ? { ...img, caption } : img
    );
    setGalleryImages(updatedImages);
    onUpdate(updatedImages, galleryTitle);
  };

  const updateTitle = (newTitle: string) => {
    setGalleryTitle(newTitle);
    onUpdate(galleryImages, newTitle);
  };

  const moveImage = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= galleryImages.length) return;

    const newImages = [...galleryImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    setGalleryImages(newImages);
    onUpdate(newImages, galleryTitle);
  };

  return (
    <View style={styles.container}>
      {/* Gallery Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gallery Title (Optional)</Text>
        <TextInput
          style={styles.input}
          value={galleryTitle}
          onChangeText={updateTitle}
          placeholder="e.g., Our Work, Portfolio, Before & After"
          placeholderTextColor="#999"
        />
      </View>

      {/* Image Count */}
      <View style={styles.countContainer}>
        <Ionicons name="images-outline" size={18} color="#666" />
        <Text style={styles.countText}>
          {galleryImages.length} / {maxImages} images
        </Text>
      </View>

      {/* Add Images Button */}
      {galleryImages.length < maxImages && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={pickImages}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <Text style={styles.addButtonText}>Add Images</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Images Grid */}
      {galleryImages.length > 0 && (
        <ScrollView style={styles.imagesContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.imagesGrid}>
            {galleryImages.map((image, index) => (
              <View key={image.id} style={styles.imageItem}>
                {/* Image */}
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  
                  {/* Image Number Badge */}
                  <View style={styles.imageBadge}>
                    <Text style={styles.imageBadgeText}>{index + 1}</Text>
                  </View>

                  {/* Remove Button */}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeImage(image.id)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF4444" />
                  </TouchableOpacity>

                  {/* Reorder Buttons */}
                  <View style={styles.reorderButtons}>
                    {index > 0 && (
                      <TouchableOpacity
                        style={styles.reorderButton}
                        onPress={() => moveImage(index, 'up')}
                      >
                        <Ionicons name="chevron-up" size={16} color="white" />
                      </TouchableOpacity>
                    )}
                    {index < galleryImages.length - 1 && (
                      <TouchableOpacity
                        style={styles.reorderButton}
                        onPress={() => moveImage(index, 'down')}
                      >
                        <Ionicons name="chevron-down" size={16} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Caption Input */}
                <TouchableOpacity
                  style={styles.captionContainer}
                  onPress={() => setEditingCaption(image.id)}
                >
                  {editingCaption === image.id ? (
                    <TextInput
                      style={styles.captionInput}
                      value={image.caption}
                      onChangeText={(text) => updateCaption(image.id, text)}
                      placeholder="Add caption..."
                      placeholderTextColor="#999"
                      autoFocus
                      onBlur={() => setEditingCaption(null)}
                      maxLength={100}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.captionText,
                        !image.caption && styles.captionPlaceholder,
                      ]}
                      numberOfLines={1}
                    >
                      {image.caption || 'Add caption...'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Empty State */}
      {galleryImages.length === 0 && !uploading && (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No images yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Add up to {maxImages} images to showcase your work
          </Text>
        </View>
      )}

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips</Text>
        <Text style={styles.tipText}>• Use high-quality images for best results</Text>
        <Text style={styles.tipText}>• Add captions to describe each image</Text>
        <Text style={styles.tipText}>• Reorder images using the arrows</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  countText: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#667eea',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imagesContainer: {
    maxHeight: 400,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
    width: '47%',
    marginBottom: 8,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
  },
  imageBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  imageBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  reorderButtons: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'column',
    gap: 4,
  },
  reorderButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 6,
  },
  captionContainer: {
    marginTop: 6,
  },
  captionInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
    color: '#333',
  },
  captionText: {
    fontSize: 13,
    color: '#333',
    paddingVertical: 4,
  },
  captionPlaceholder: {
    color: '#999',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
});

export default GalleryBlockEditor;
