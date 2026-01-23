/**
 * Testimonials Block Editor Component
 * Allows users to add customer reviews/testimonials to their eCard
 * 
 * Features:
 * - Add multiple testimonials (up to 10)
 * - Customer name, review text, rating (1-5 stars)
 * - Optional customer photo
 * - Optional date
 * - Reorder testimonials
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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface Testimonial {
  id: string;
  customerName: string;
  reviewText: string;
  rating: number; // 1-5 stars
  customerPhoto?: string;
  date?: string;
  source?: string; // e.g., "Google", "Yelp", "Tavvy"
}

interface TestimonialsBlockEditorProps {
  testimonials: Testimonial[];
  title?: string;
  onUpdate: (testimonials: Testimonial[], title?: string) => void;
  maxTestimonials?: number;
}

const TestimonialsBlockEditor: React.FC<TestimonialsBlockEditorProps> = ({
  testimonials = [],
  title = '',
  onUpdate,
  maxTestimonials = 10,
}) => {
  const [blockTitle, setBlockTitle] = useState(title);
  const [testimonialsList, setTestimonialsList] = useState<Testimonial[]>(testimonials);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);

  const generateId = () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createEmptyTestimonial = (): Testimonial => ({
    id: generateId(),
    customerName: '',
    reviewText: '',
    rating: 5,
    customerPhoto: undefined,
    date: new Date().toISOString().split('T')[0],
    source: 'Tavvy',
  });

  const openAddModal = () => {
    if (testimonialsList.length >= maxTestimonials) {
      Alert.alert('Limit Reached', `You can add up to ${maxTestimonials} testimonials.`);
      return;
    }
    setEditingTestimonial(createEmptyTestimonial());
    setEditingIndex(-1);
    setEditModalVisible(true);
  };

  const openEditModal = (testimonial: Testimonial, index: number) => {
    setEditingTestimonial({ ...testimonial });
    setEditingIndex(index);
    setEditModalVisible(true);
  };

  const saveTestimonial = () => {
    if (!editingTestimonial) return;

    if (!editingTestimonial.customerName.trim()) {
      Alert.alert('Required', 'Please enter the customer name.');
      return;
    }
    if (!editingTestimonial.reviewText.trim()) {
      Alert.alert('Required', 'Please enter the review text.');
      return;
    }

    let updatedList: Testimonial[];
    if (editingIndex === -1) {
      // Adding new
      updatedList = [...testimonialsList, editingTestimonial];
    } else {
      // Editing existing
      updatedList = testimonialsList.map((t, i) => 
        i === editingIndex ? editingTestimonial : t
      );
    }

    setTestimonialsList(updatedList);
    onUpdate(updatedList, blockTitle);
    setEditModalVisible(false);
    setEditingTestimonial(null);
  };

  const deleteTestimonial = (index: number) => {
    Alert.alert(
      'Delete Testimonial',
      'Are you sure you want to delete this testimonial?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedList = testimonialsList.filter((_, i) => i !== index);
            setTestimonialsList(updatedList);
            onUpdate(updatedList, blockTitle);
          },
        },
      ]
    );
  };

  const moveTestimonial = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= testimonialsList.length) return;

    const newList = [...testimonialsList];
    const [movedItem] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, movedItem);
    
    setTestimonialsList(newList);
    onUpdate(newList, blockTitle);
  };

  const pickCustomerPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0] && editingTestimonial) {
        setEditingTestimonial({
          ...editingTestimonial,
          customerPhoto: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error('Error picking photo:', error);
    }
  };

  const updateTitle = (newTitle: string) => {
    setBlockTitle(newTitle);
    onUpdate(testimonialsList, newTitle);
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            disabled={!interactive}
            onPress={() => {
              if (interactive && editingTestimonial) {
                setEditingTestimonial({ ...editingTestimonial, rating: star });
              }
            }}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={interactive ? 28 : 16}
              color={star <= rating ? '#FFD700' : '#ccc'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const sourceOptions = ['Tavvy', 'Google', 'Yelp', 'Facebook', 'Other'];

  return (
    <View style={styles.container}>
      {/* Block Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Section Title (Optional)</Text>
        <TextInput
          style={styles.input}
          value={blockTitle}
          onChangeText={updateTitle}
          placeholder="e.g., What Our Customers Say, Reviews"
          placeholderTextColor="#999"
        />
      </View>

      {/* Testimonial Count */}
      <View style={styles.countContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#666" />
        <Text style={styles.countText}>
          {testimonialsList.length} / {maxTestimonials} testimonials
        </Text>
      </View>

      {/* Add Testimonial Button */}
      {testimonialsList.length < maxTestimonials && (
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Testimonial</Text>
        </TouchableOpacity>
      )}

      {/* Testimonials List */}
      {testimonialsList.length > 0 && (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {testimonialsList.map((testimonial, index) => (
            <View key={testimonial.id} style={styles.testimonialCard}>
              <View style={styles.cardHeader}>
                {/* Customer Photo */}
                {testimonial.customerPhoto ? (
                  <Image
                    source={{ uri: testimonial.customerPhoto }}
                    style={styles.customerPhoto}
                  />
                ) : (
                  <View style={styles.customerPhotoPlaceholder}>
                    <Ionicons name="person" size={20} color="#999" />
                  </View>
                )}
                
                {/* Customer Info */}
                <View style={styles.customerInfo}>
                  <Text style={styles.customerName}>{testimonial.customerName}</Text>
                  {renderStars(testimonial.rating)}
                  {testimonial.source && (
                    <Text style={styles.sourceText}>via {testimonial.source}</Text>
                  )}
                </View>

                {/* Reorder Buttons */}
                <View style={styles.reorderButtons}>
                  {index > 0 && (
                    <TouchableOpacity
                      style={styles.reorderButton}
                      onPress={() => moveTestimonial(index, 'up')}
                    >
                      <Ionicons name="chevron-up" size={18} color="#666" />
                    </TouchableOpacity>
                  )}
                  {index < testimonialsList.length - 1 && (
                    <TouchableOpacity
                      style={styles.reorderButton}
                      onPress={() => moveTestimonial(index, 'down')}
                    >
                      <Ionicons name="chevron-down" size={18} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Review Text */}
              <Text style={styles.reviewText} numberOfLines={3}>
                "{testimonial.reviewText}"
              </Text>

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(testimonial, index)}
                >
                  <Ionicons name="pencil" size={16} color="#667eea" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteTestimonial(index)}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Empty State */}
      {testimonialsList.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
          <Text style={styles.emptyStateText}>No testimonials yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Add customer reviews to build trust
          </Text>
        </View>
      )}

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingIndex === -1 ? 'Add Testimonial' : 'Edit Testimonial'}
            </Text>
            <TouchableOpacity onPress={saveTestimonial}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Customer Photo */}
            <View style={styles.photoSection}>
              <TouchableOpacity style={styles.photoUpload} onPress={pickCustomerPhoto}>
                {editingTestimonial?.customerPhoto ? (
                  <Image
                    source={{ uri: editingTestimonial.customerPhoto }}
                    style={styles.uploadedPhoto}
                  />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={32} color="#999" />
                    <Text style={styles.photoUploadText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
              <Text style={styles.photoHint}>Optional customer photo</Text>
            </View>

            {/* Customer Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Name *</Text>
              <TextInput
                style={styles.input}
                value={editingTestimonial?.customerName || ''}
                onChangeText={(text) =>
                  setEditingTestimonial(prev => prev ? { ...prev, customerName: text } : null)
                }
                placeholder="e.g., John Smith"
                placeholderTextColor="#999"
              />
            </View>

            {/* Rating */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rating *</Text>
              {renderStars(editingTestimonial?.rating || 5, true)}
            </View>

            {/* Review Text */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Review Text *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingTestimonial?.reviewText || ''}
                onChangeText={(text) =>
                  setEditingTestimonial(prev => prev ? { ...prev, reviewText: text } : null)
                }
                placeholder="What did the customer say?"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {editingTestimonial?.reviewText?.length || 0}/500
              </Text>
            </View>

            {/* Source */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Review Source</Text>
              <View style={styles.sourceOptions}>
                {sourceOptions.map((source) => (
                  <TouchableOpacity
                    key={source}
                    style={[
                      styles.sourceOption,
                      editingTestimonial?.source === source && styles.sourceOptionActive,
                    ]}
                    onPress={() =>
                      setEditingTestimonial(prev => prev ? { ...prev, source } : null)
                    }
                  >
                    <Text
                      style={[
                        styles.sourceOptionText,
                        editingTestimonial?.source === source && styles.sourceOptionTextActive,
                      ]}
                    >
                      {source}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date (Optional)</Text>
              <TextInput
                style={styles.input}
                value={editingTestimonial?.date || ''}
                onChangeText={(text) =>
                  setEditingTestimonial(prev => prev ? { ...prev, date: text } : null)
                }
                placeholder="e.g., 2024-01-15"
                placeholderTextColor="#999"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips</Text>
        <Text style={styles.tipText}>• Use real customer reviews for authenticity</Text>
        <Text style={styles.tipText}>• Include the customer's name and photo if possible</Text>
        <Text style={styles.tipText}>• Highlight specific benefits or results</Text>
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
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
  listContainer: {
    maxHeight: 400,
  },
  testimonialCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  customerPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  sourceText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  reorderButtons: {
    flexDirection: 'column',
    gap: 4,
  },
  reorderButton: {
    padding: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
  },
  reviewText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '500',
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalSave: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoUpload: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  uploadedPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoUploadText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  photoHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  sourceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sourceOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sourceOptionActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  sourceOptionText: {
    fontSize: 14,
    color: '#666',
  },
  sourceOptionTextActive: {
    color: 'white',
    fontWeight: '600',
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

export default TestimonialsBlockEditor;
