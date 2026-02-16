/**
 * ProsRequestStep1Screen - Parent Category Selection
 * Install path: screens/ProsRequestStep1Screen.tsx
 * 
 * Step 2 of 7: Users select a broad service type (parent category)
 * Tapping a category auto-navigates to Step 1b (sub-category selection)
 * Receives customer information from Step 0
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
import { useProsParentCategories, ServiceCategory } from '../hooks/useProsServiceCategories';
import { useTranslation } from 'react-i18next';

type RouteParams = {
  customerInfo?: {
    fullName: string;
    email: string;
    phone: string;
    privacyPreference: 'share' | 'app_only';
  };
};

// Emoji mapping for parent category icons (Ionicons name → emoji)
const ICON_EMOJI_MAP: Record<string, string> = {
  'construct': '🏗️',
  'sparkles': '✨',
  'build': '🔧',
  'car': '🔩',
  'hammer': '🛠️',
  'home': '🏠',
  'leaf': '🌿',
  'flash': '⚡',
  'water': '💧',
  'brush': '🖌️',
  'bug': '🐛',
  'car-sport-outline': '🚗',
  'business': '💼',
  'settings': '⚙️',
  'thermometer': '🌡️',
  'grid': '🏗️',
};

// Fallback emoji by category name
const NAME_EMOJI_MAP: Record<string, string> = {
  'construction': '🏗️',
  'cleaning': '✨',
  'repair': '🔧',
  'mechanic': '🔩',
  'handyman': '🛠️',
  'realtor': '🏠',
  'landscaping': '🌿',
  'electrical': '⚡',
  'plumbing': '💧',
  'painting': '🖌️',
  'pest control': '🐛',
  'moving': '🚚',
  'hvac': '🌡️',
  'pool services': '🏊',
  'roofing': '🏠',
  'flooring': '🏗️',
  'real estate': '🏠',
};

function getCategoryEmoji(category: ServiceCategory): string {
  // Try icon mapping first
  if (category.icon && ICON_EMOJI_MAP[category.icon]) {
    return ICON_EMOJI_MAP[category.icon];
  }
  // Try name-based mapping
  const nameLower = category.name.toLowerCase();
  if (NAME_EMOJI_MAP[nameLower]) {
    return NAME_EMOJI_MAP[nameLower];
  }
  // Default
  return '🔧';
}

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}%</Text>
  </View>
);

export default function ProsRequestStep1Screen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  
  const { customerInfo } = route.params || {};
  
  // Fetch parent categories from Supabase
  const { data: parentCategories = [], isLoading, error } = useProsParentCategories();
  
  const [searchQuery, setSearchQuery] = useState('');

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return parentCategories;
    }
    const query = searchQuery.toLowerCase().trim();
    return parentCategories.filter(cat => 
      cat.name.toLowerCase().includes(query)
    );
  }, [parentCategories, searchQuery]);

  const handleCategorySelect = (category: ServiceCategory) => {
    // Navigate to sub-category selection (Step 1b)
    navigation.navigate('ProsRequestStep1b', {
      customerInfo,
      parentCategoryId: category.id,
      parentCategoryName: category.name,
    });
  };

  const handleClose = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel? Your progress will not be saved.',
      [
        { text: 'Keep Going', onPress: () => {} },
        { text: 'Cancel', onPress: () => navigation.goBack(), style: 'destructive' },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ProsColors.primary} />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load services</Text>
          <Text style={styles.errorSubtext}>Please try again later</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Start a Project</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressWrapper}>
        <ProgressBar progress={29} />
        <Text style={styles.stepText}>Step 2 of 7</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.question}>What type of service?</Text>
        <Text style={styles.subtext}>Select a service category</Text>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryRow}
              onPress={() => handleCategorySelect(category)}
              activeOpacity={0.6}
            >
              <Text style={styles.categoryEmoji}>{getCategoryEmoji(category)}</Text>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}

          {filteredCategories.length === 0 && (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.noResultsText}>No services found</Text>
              <Text style={styles.noResultsSubtext}>Try a different search term</Text>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: ProsColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  subtext: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
