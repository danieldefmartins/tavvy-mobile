import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPhotoCategories, getCategoryName, getCategoryIcon } from '../lib/photoCategoryUtils';
import { BusinessType } from '../lib/businessTypeConfig';
import { getPhotoCategories, getCategoryName, getCategoryIcon, BusinessType } from '../lib/photoCategoryUtils';

const { width, height } = Dimensions.get('window');

// Photo category types now handled by photoCategoryUtils

export interface PlacePhoto {
  id: string;
  url: string;
  category: string; // Category ID (e.g., 'exterior', 'food', 'sites')
  created_at: string;
  user_name: string;
  is_trusted: boolean;
  user_id: string;
}

interface PhotoGalleryProps {
  placeId: string;
  businessType: BusinessType; // NEW: Business type for dynamic categories
  photos: PlacePhoto[];
  isLoading: boolean;
  onAddPhoto: () => void;
  onDeletePhoto: (photoId: string, url: string) => Promise<void>;
  onReportPhoto: (photoId: string) => Promise<void>;
  currentUserId?: string;
}

// Photo categories now loaded dynamically based on business type

export default function PhotoGallery({
  placeId,
  businessType,
  photos,
  isLoading,
  onAddPhoto,
  onDeletePhoto,
  onReportPhoto,
  currentUserId,
}: PhotoGalleryProps) {
  // Get categories based on business type
  const photoCategories = getPhotoCategories(businessType);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const filteredPhotos = selectedCategory === 'all' 
    ? photos 
    : photos.filter(p => p.category === selectedCategory);

  const getCategoryLabel = (category: string) => {
    return getCategoryName(category, businessType);
  };

  const handlePrevPhoto = () => {
    if (selectedPhotoIndex !== null && filteredPhotos.length > 0) {
      setSelectedPhotoIndex(
        selectedPhotoIndex === 0 ? filteredPhotos.length - 1 : selectedPhotoIndex - 1
      );
    }
  };

  const handleNextPhoto = () => {
    if (selectedPhotoIndex !== null && filteredPhotos.length > 0) {
      setSelectedPhotoIndex(
        selectedPhotoIndex === filteredPhotos.length - 1 ? 0 : selectedPhotoIndex + 1
      );
    }
  };

  const handleDeletePhoto = async () => {
    if (selectedPhotoIndex === null) return;
    const photo = filteredPhotos[selectedPhotoIndex];
    try {
      await onDeletePhoto(photo.id, photo.url);
      setSelectedPhotoIndex(null);
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const handleReportPhoto = async () => {
    if (selectedPhotoIndex === null) return;
    const photo = filteredPhotos[selectedPhotoIndex];
    try {
      await onReportPhoto(photo.id);
      setShowReportDialog(false);
      setSelectedPhotoIndex(null);
    } catch (error) {
      console.error('Failed to report photo:', error);
    }
  };

  const selectedPhoto = selectedPhotoIndex !== null ? filteredPhotos[selectedPhotoIndex] : null;
  const canDelete = selectedPhoto && currentUserId && selectedPhoto.user_id === currentUserId;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === 'all' && styles.categoryChipTextActive
          ]}>
            All ({photos.length})
          </Text>
        </TouchableOpacity>
        {photoCategories.map((category) => {
          const count = photos.filter(p => p.category === category.id).length;
          if (count === 0) return null;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons
                name={category.icon as any}
                size={14}
                color={selectedCategory === category.id ? '#fff' : '#666'}
                style={{ marginRight: 6 }}
              />
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextActive
              ]}>
                {category.name} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Photo Grid */}
      {filteredPhotos.length > 0 ? (
        <View style={styles.photoGrid}>
          {filteredPhotos.map((photo, index) => (
            <TouchableOpacity
              key={photo.id}
              style={styles.photoItem}
              onPress={() => setSelectedPhotoIndex(index)}
            >
              <Image source={{ uri: photo.url }} style={styles.photoThumbnail} />
              <View style={styles.photoCategoryBadge}>
                <Text style={styles.photoCategoryText}>
                  {getCategoryLabel(photo.category)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          {/* Add Photo Button */}
          <TouchableOpacity style={styles.addPhotoItem} onPress={onAddPhoto}>
            <Ionicons name="camera" size={32} color="#666" />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={48} color="#999" />
          <Text style={styles.emptyStateText}>No photos yet</Text>
          <Text style={styles.emptyStateSubtext}>Be the first to add a photo!</Text>
          <TouchableOpacity style={styles.addPhotoButton} onPress={onAddPhoto}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.addPhotoButtonText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Full-Screen Photo Viewer Modal */}
      {selectedPhoto && (
        <Modal
          visible={selectedPhotoIndex !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPhotoIndex(null)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setSelectedPhotoIndex(null)}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalPhotoCategory}>
                  {getCategoryLabel(selectedPhoto.category)}
                </Text>
                <Text style={styles.modalPhotoUser}>
                  by {selectedPhoto.user_name}
                  {selectedPhoto.is_trusted && (
                    <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                  )}
                </Text>
              </View>
              <View style={styles.modalActions}>
                {canDelete && (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleDeletePhoto}
                  >
                    <Ionicons name="trash" size={24} color="#ef4444" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowReportDialog(true)}
                >
                  <Ionicons name="flag" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalImageContainer}>
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            </View>

            {/* Navigation Arrows */}
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonLeft]}
              onPress={handlePrevPhoto}
            >
              <Ionicons name="chevron-back" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonRight]}
              onPress={handleNextPhoto}
            >
              <Ionicons name="chevron-forward" size={32} color="#fff" />
            </TouchableOpacity>

            {/* Photo Counter */}
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {(selectedPhotoIndex || 0) + 1} / {filteredPhotos.length}
              </Text>
            </View>
          </View>

          {/* Report Dialog */}
          {showReportDialog && (
            <View style={styles.reportDialog}>
              <View style={styles.reportDialogContent}>
                <Text style={styles.reportDialogTitle}>Report Photo?</Text>
                <Text style={styles.reportDialogText}>
                  This photo will be flagged for review by moderators.
                </Text>
                <View style={styles.reportDialogButtons}>
                  <TouchableOpacity
                    style={[styles.reportDialogButton, styles.reportDialogButtonCancel]}
                    onPress={() => setShowReportDialog(false)}
                  >
                    <Text style={styles.reportDialogButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reportDialogButton, styles.reportDialogButtonConfirm]}
                    onPress={handleReportPhoto}
                  >
                    <Text style={styles.reportDialogButtonTextConfirm}>Report</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  categoryFilter: {
    marginBottom: 16,
  },
  categoryFilterContent: {
    paddingRight: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  photoItem: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoCategoryBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoCategoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  addPhotoItem: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    marginBottom: 20,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addPhotoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderInfo: {
    flex: 1,
    alignItems: 'center',
  },
  modalPhotoCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  modalPhotoUser: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: width,
    height: height - 200,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonLeft: {
    left: 16,
  },
  navButtonRight: {
    right: 16,
  },
  photoCounter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  photoCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  reportDialog: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportDialogContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: width - 80,
  },
  reportDialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  reportDialogText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  reportDialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reportDialogButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reportDialogButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  reportDialogButtonConfirm: {
    backgroundColor: '#ef4444',
  },
  reportDialogButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reportDialogButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});