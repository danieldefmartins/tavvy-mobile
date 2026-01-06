/**
 * TavvY Category Selector Component
 * 
 * A comprehensive category selection component that supports:
 * - Content type selection (Place, Service Business, City, Universe)
 * - Primary category selection
 * - Subcategory selection
 * - Search/filter functionality
 * - "Other" category with custom input
 * 
 * Path: components/CategorySelector.tsx
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ContentType,
  CONTENT_TYPES,
  PRIMARY_CATEGORIES,
  PrimaryCategory,
  SubCategory,
  getCategoriesForContentType,
  searchCategories,
} from '../lib/categoryConfig';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface CategorySelectorProps {
  contentType: ContentType;
  onContentTypeChange: (type: ContentType) => void;
  primaryCategory: string | null;
  onPrimaryCategoryChange: (slug: string) => void;
  subcategory: string | null;
  onSubcategoryChange: (slug: string | null) => void;
  customCategory?: string;
  onCustomCategoryChange?: (value: string) => void;
  showContentTypeSelector?: boolean;
  disabled?: boolean;
}

interface CategoryItemProps {
  category: PrimaryCategory | SubCategory;
  isSelected: boolean;
  onSelect: () => void;
  isPrimary?: boolean;
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectorButtonSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
  },
  selectorButtonDisabled: {
    opacity: 0.5,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorIcon: {
    marginRight: 12,
  },
  selectorText: {
    fontSize: 16,
    color: '#374151',
  },
  selectorPlaceholder: {
    color: '#9CA3AF',
  },
  chevron: {
    marginLeft: 8,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  
  // Search styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  
  // Category list styles
  categoryList: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  categoryItemSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIconSelected: {
    backgroundColor: '#6366F1',
  },
  categoryName: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  categoryNameSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  checkmark: {
    marginLeft: 8,
  },
  
  // Content type selector
  contentTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  contentTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contentTypeButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  contentTypeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  contentTypeTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  
  // Subcategory section
  subcategorySection: {
    marginTop: 16,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subcategoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  
  // Custom category input
  customInput: {
    marginTop: 12,
  },
  customInputField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  customInputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  
  // Section header
  sectionHeader: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Back button in modal
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#6366F1',
    marginLeft: 4,
  },
});

// ============================================
// CATEGORY ITEM COMPONENT
// ============================================

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isSelected,
  onSelect,
  isPrimary = false,
}) => {
  const iconKey = 'iconKey' in category ? category.iconKey : 'ellipsis-horizontal';
  
  return (
    <TouchableOpacity
      style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIcon, isSelected && styles.categoryIconSelected]}>
        <Ionicons
          name={iconKey as any}
          size={20}
          color={isSelected ? '#FFFFFF' : '#6B7280'}
        />
      </View>
      <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>
        {category.name}
      </Text>
      {isSelected && (
        <Ionicons
          name="checkmark-circle"
          size={24}
          color="#6366F1"
          style={styles.checkmark}
        />
      )}
    </TouchableOpacity>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  contentType,
  onContentTypeChange,
  primaryCategory,
  onPrimaryCategoryChange,
  subcategory,
  onSubcategoryChange,
  customCategory = '',
  onCustomCategoryChange,
  showContentTypeSelector = true,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'primary' | 'subcategory'>('primary');
  const [searchQuery, setSearchQuery] = useState('');

  // Get available categories based on content type
  const availableCategories = useMemo(() => {
    return getCategoriesForContentType(contentType);
  }, [contentType]);

  // Get selected primary category object
  const selectedPrimary = useMemo(() => {
    return PRIMARY_CATEGORIES.find(cat => cat.slug === primaryCategory);
  }, [primaryCategory]);

  // Get selected subcategory object
  const selectedSubcategory = useMemo(() => {
    if (!selectedPrimary || !subcategory) return null;
    return selectedPrimary.subcategories.find(sub => sub.slug === subcategory);
  }, [selectedPrimary, subcategory]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return modalMode === 'primary' 
        ? availableCategories 
        : selectedPrimary?.subcategories || [];
    }

    if (modalMode === 'primary') {
      const results = searchCategories(searchQuery);
      // Filter to only show primary categories that match
      const primarySlugs = new Set(results.map(r => r.primary.slug));
      return availableCategories.filter(cat => primarySlugs.has(cat.slug));
    } else {
      const query = searchQuery.toLowerCase();
      return (selectedPrimary?.subcategories || []).filter(sub =>
        sub.name.toLowerCase().includes(query)
      );
    }
  }, [searchQuery, modalMode, availableCategories, selectedPrimary]);

  // Handle primary category selection
  const handlePrimarySelect = useCallback((slug: string) => {
    onPrimaryCategoryChange(slug);
    onSubcategoryChange(null);
    
    // Check if this category has subcategories
    const category = PRIMARY_CATEGORIES.find(cat => cat.slug === slug);
    if (category && category.subcategories.length > 1) {
      // Switch to subcategory selection
      setModalMode('subcategory');
      setSearchQuery('');
    } else if (category && category.subcategories.length === 1) {
      // Auto-select the only subcategory
      onSubcategoryChange(category.subcategories[0].slug);
      setModalVisible(false);
    } else {
      setModalVisible(false);
    }
  }, [onPrimaryCategoryChange, onSubcategoryChange]);

  // Handle subcategory selection
  const handleSubcategorySelect = useCallback((slug: string) => {
    onSubcategoryChange(slug);
    setModalVisible(false);
    setSearchQuery('');
    setModalMode('primary');
  }, [onSubcategoryChange]);

  // Open modal for category selection
  const openCategoryModal = useCallback((mode: 'primary' | 'subcategory') => {
    if (disabled) return;
    setModalMode(mode);
    setSearchQuery('');
    setModalVisible(true);
  }, [disabled]);

  // Close modal
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSearchQuery('');
    setModalMode('primary');
  }, []);

  // Go back to primary selection
  const goBackToPrimary = useCallback(() => {
    setModalMode('primary');
    setSearchQuery('');
  }, []);

  // Check if "Other" category is selected
  const isOtherSelected = primaryCategory === 'other' || subcategory === 'custom_category';

  return (
    <View style={styles.container}>
      {/* Content Type Selector */}
      {showContentTypeSelector && (
        <View>
          <Text style={styles.label}>What are you adding?</Text>
          <View style={styles.contentTypeContainer}>
            {CONTENT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.contentTypeButton,
                  contentType === type.id && styles.contentTypeButtonSelected,
                ]}
                onPress={() => {
                  onContentTypeChange(type.id);
                  // Reset category selections when content type changes
                  onPrimaryCategoryChange('');
                  onSubcategoryChange(null);
                }}
                disabled={disabled}
              >
                <Ionicons
                  name={type.icon}
                  size={16}
                  color={contentType === type.id ? '#4F46E5' : '#6B7280'}
                />
                <Text
                  style={[
                    styles.contentTypeText,
                    contentType === type.id && styles.contentTypeTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Primary Category Selector */}
      {contentType !== 'city' && (
        <View>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedPrimary && styles.selectorButtonSelected,
              disabled && styles.selectorButtonDisabled,
            ]}
            onPress={() => openCategoryModal('primary')}
            disabled={disabled}
          >
            <View style={styles.selectorContent}>
              {selectedPrimary ? (
                <>
                  <Ionicons
                    name={selectedPrimary.iconKey as any}
                    size={20}
                    color="#6366F1"
                    style={styles.selectorIcon}
                  />
                  <Text style={styles.selectorText}>{selectedPrimary.name}</Text>
                </>
              ) : (
                <Text style={[styles.selectorText, styles.selectorPlaceholder]}>
                  Select a category
                </Text>
              )}
            </View>
            <Ionicons
              name="chevron-down"
              size={20}
              color="#9CA3AF"
              style={styles.chevron}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Subcategory Selector */}
      {selectedPrimary && selectedPrimary.subcategories.length > 1 && (
        <View style={styles.subcategorySection}>
          <Text style={styles.label}>Subcategory</Text>
          <TouchableOpacity
            style={[
              styles.selectorButton,
              selectedSubcategory && styles.selectorButtonSelected,
              disabled && styles.selectorButtonDisabled,
            ]}
            onPress={() => openCategoryModal('subcategory')}
            disabled={disabled}
          >
            <View style={styles.selectorContent}>
              {selectedSubcategory ? (
                <>
                  <Ionicons
                    name={selectedSubcategory.iconKey as any}
                    size={20}
                    color="#6366F1"
                    style={styles.selectorIcon}
                  />
                  <Text style={styles.selectorText}>{selectedSubcategory.name}</Text>
                </>
              ) : (
                <Text style={[styles.selectorText, styles.selectorPlaceholder]}>
                  Select a subcategory
                </Text>
              )}
            </View>
            <Ionicons
              name="chevron-down"
              size={20}
              color="#9CA3AF"
              style={styles.chevron}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Custom Category Input (for "Other" selection) */}
      {isOtherSelected && onCustomCategoryChange && (
        <View style={styles.customInput}>
          <Text style={styles.label}>Custom Category Name</Text>
          <TextInput
            style={styles.customInputField}
            value={customCategory}
            onChangeText={onCustomCategoryChange}
            placeholder="Enter your category (e.g., Escape Room)"
            placeholderTextColor="#9CA3AF"
            editable={!disabled}
          />
          <Text style={styles.customInputHint}>
            Describe what type of business this is. We'll review and may add it as an official category.
          </Text>
        </View>
      )}

      {/* Category Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeModal}
          >
            <View style={styles.modalContent}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {modalMode === 'primary' ? 'Select Category' : 'Select Subcategory'}
                </Text>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Back Button (for subcategory mode) */}
              {modalMode === 'subcategory' && (
                <TouchableOpacity style={styles.backButton} onPress={goBackToPrimary}>
                  <Ionicons name="arrow-back" size={20} color="#6366F1" />
                  <Text style={styles.backButtonText}>Back to Categories</Text>
                </TouchableOpacity>
              )}

              {/* Search Input */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInput}>
                  <Ionicons name="search" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInputText}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={`Search ${modalMode === 'primary' ? 'categories' : 'subcategories'}...`}
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Category List */}
              <FlatList
                data={filteredCategories}
                keyExtractor={(item) => item.slug}
                style={styles.categoryList}
                renderItem={({ item }) => (
                  <CategoryItem
                    category={item}
                    isSelected={
                      modalMode === 'primary'
                        ? item.slug === primaryCategory
                        : item.slug === subcategory
                    }
                    onSelect={() =>
                      modalMode === 'primary'
                        ? handlePrimarySelect(item.slug)
                        : handleSubcategorySelect(item.slug)
                    }
                    isPrimary={modalMode === 'primary'}
                  />
                )}
                ListEmptyComponent={
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#6B7280' }}>No categories found</Text>
                  </View>
                }
              />
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default CategorySelector;