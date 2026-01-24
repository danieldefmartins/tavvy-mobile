/**
 * Tavvy Category Selector Component
 * 
 * A comprehensive category selection component that supports:
 * - Content type selection (Place, Service Business, City, Universe)
 * - Primary category selection
 * - Subcategory selection
 * - Search/filter functionality (searches BOTH categories and subcategories)
 * - "Other" category with custom input
 * 
 * Path: components/CategorySelector.tsx
 * 
 * UPDATED: Search now shows subcategory matches with parent category context
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
  parentCategoryName?: string; // For showing parent context on subcategory search results
}

// Search result type for unified display
interface SearchResultItem {
  type: 'primary' | 'subcategory';
  primary: PrimaryCategory;
  subcategory?: SubCategory;
  displayName: string;
  parentName?: string;
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
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    color: '#374151',
  },
  categoryNameSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  parentCategoryName: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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

  // Search result type badge
  searchResultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  subcategoryBadge: {
    backgroundColor: '#DBEAFE',
  },
  subcategoryBadgeText: {
    fontSize: 10,
    color: '#1D4ED8',
    fontWeight: '600',
  },
});

// ============================================
// SEARCH RESULT ITEM COMPONENT
// ============================================

interface SearchResultItemProps {
  item: SearchResultItem;
  isSelected: boolean;
  onSelect: () => void;
}

const SearchResultItemComponent: React.FC<SearchResultItemProps> = ({
  item,
  isSelected,
  onSelect,
}) => {
  const iconKey = item.type === 'subcategory' && item.subcategory 
    ? item.subcategory.iconKey 
    : item.primary.iconKey;
  
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
      <View style={styles.categoryTextContainer}>
        <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]}>
          {item.displayName}
        </Text>
        {item.parentName && (
          <Text style={styles.parentCategoryName}>
            in {item.parentName}
          </Text>
        )}
      </View>
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
// CATEGORY ITEM COMPONENT (for non-search mode)
// ============================================

interface CategoryItemProps {
  category: PrimaryCategory | SubCategory;
  isSelected: boolean;
  onSelect: () => void;
  isPrimary?: boolean;
}

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

  // Check if we're in search mode
  const isSearching = searchQuery.trim().length > 0;

  // Build search results that include both primary categories and subcategories
  const searchResults = useMemo((): SearchResultItem[] => {
    if (!isSearching) return [];

    const results = searchCategories(searchQuery);
    const items: SearchResultItem[] = [];

    // Track which primary categories we've already added (to avoid duplicates)
    const addedPrimarySlugs = new Set<string>();

    for (const result of results) {
      if (result.subcategory) {
        // This is a subcategory match - show it with parent context
        items.push({
          type: 'subcategory',
          primary: result.primary,
          subcategory: result.subcategory,
          displayName: result.subcategory.name,
          parentName: result.primary.name,
        });
      } else {
        // This is a primary category match
        if (!addedPrimarySlugs.has(result.primary.slug)) {
          items.push({
            type: 'primary',
            primary: result.primary,
            displayName: result.primary.name,
          });
          addedPrimarySlugs.add(result.primary.slug);
        }
      }
    }

    return items;
  }, [searchQuery, isSearching]);

  // Filter categories based on search (for non-search mode)
  const filteredCategories = useMemo(() => {
    if (isSearching) {
      // In search mode, we use searchResults instead
      return [];
    }

    return modalMode === 'primary' 
      ? availableCategories 
      : selectedPrimary?.subcategories || [];
  }, [isSearching, modalMode, availableCategories, selectedPrimary]);

  // Handle search result selection - this is the key function!
  const handleSearchResultSelect = useCallback((item: SearchResultItem) => {
    if (item.type === 'subcategory' && item.subcategory) {
      // User selected a subcategory from search
      // Set BOTH the primary category AND the subcategory
      onPrimaryCategoryChange(item.primary.slug);
      onSubcategoryChange(item.subcategory.slug);
      setModalVisible(false);
      setSearchQuery('');
      setModalMode('primary');
    } else {
      // User selected a primary category from search
      onPrimaryCategoryChange(item.primary.slug);
      onSubcategoryChange(null);
      
      // Check if this category has subcategories
      if (item.primary.subcategories.length > 1) {
        // Switch to subcategory selection
        setModalMode('subcategory');
        setSearchQuery('');
      } else if (item.primary.subcategories.length === 1) {
        // Auto-select the only subcategory
        onSubcategoryChange(item.primary.subcategories[0].slug);
        setModalVisible(false);
        setSearchQuery('');
      } else {
        setModalVisible(false);
        setSearchQuery('');
      }
    }
  }, [onPrimaryCategoryChange, onSubcategoryChange]);

  // Handle primary category selection (non-search mode)
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

  // Handle subcategory selection (non-search mode)
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

  // Check if a search result is selected
  const isSearchResultSelected = useCallback((item: SearchResultItem): boolean => {
    if (item.type === 'subcategory' && item.subcategory) {
      return item.primary.slug === primaryCategory && item.subcategory.slug === subcategory;
    }
    return item.primary.slug === primaryCategory && !subcategory;
  }, [primaryCategory, subcategory]);

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

              {/* Back Button (for subcategory mode when not searching) */}
              {modalMode === 'subcategory' && !isSearching && (
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
                    placeholder="Search categories or subcategories..."
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

              {/* Category List - Show search results or regular list */}
              {isSearching ? (
                // Search mode - show unified search results
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => 
                    item.type === 'subcategory' && item.subcategory 
                      ? `${item.primary.slug}-${item.subcategory.slug}`
                      : item.primary.slug
                  }
                  style={styles.categoryList}
                  renderItem={({ item }) => (
                    <SearchResultItemComponent
                      item={item}
                      isSelected={isSearchResultSelected(item)}
                      onSelect={() => handleSearchResultSelect(item)}
                    />
                  )}
                  ListEmptyComponent={
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: '#6B7280' }}>No categories found</Text>
                    </View>
                  }
                />
              ) : (
                // Regular mode - show categories or subcategories
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
              )}
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default CategorySelector;
