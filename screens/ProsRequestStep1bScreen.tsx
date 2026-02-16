/**
 * ProsRequestStep1bScreen - Sub-Category Selection
 * Install path: screens/ProsRequestStep1bScreen.tsx
 * 
 * Step 3 of 7: Users select a specific service within the chosen parent category
 * Shows sub-categories in a 2-column grid with emoji icons
 * Receives parent category info from Step 1
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
import { useProsSubCategories, ServiceCategory } from '../hooks/useProsServiceCategories';
import { useProsPendingRequests } from '../hooks/useProsPendingRequests';
import { useTranslation } from 'react-i18next';

type RouteParams = {
  customerInfo?: {
    fullName: string;
    email: string;
    phone: string;
    privacyPreference: 'share' | 'app_only';
  };
  parentCategoryId: string;
  parentCategoryName: string;
};

// Emoji mapping for sub-category icons (Ionicons name → emoji)
const ICON_EMOJI_MAP: Record<string, string> = {
  'settings': '⚙️',
  'sparkles': '✨',
  'flash': '⚡',
  'hammer': '🔨',
  'home': '🏠',
  'car': '🚗',
  'thermometer': '🌡️',
  'grid': '🏗️',
  'water': '💧',
  'leaf': '🌿',
  'brush': '🖌️',
  'bug': '🐛',
  'car-sport-outline': '🚗',
  'business': '💼',
  'build': '🔧',
  'construct': '🏗️',
};

// Fallback emoji by sub-category name keywords
const NAME_EMOJI_MAP: Record<string, string> = {
  'pool': '🏊',
  'fiberglass': '🏊',
  'house clean': '🏠',
  'car wash': '🚗',
  'car detailing': '🚗',
  'boat': '⛵',
  'plane': '✈️',
  'rv': '🚐',
  'pressure wash': '💦',
  'carpet': '🧹',
  'window': '🪟',
  'car mechanic': '🚗',
  'motorcycle': '🏍️',
  'small engine': '⚙️',
  'appliance': '⚙️',
  'hvac': '🌡️',
  'garage door': '🏠',
  'roof': '🏠',
  'general repair': '🔧',
  'furniture': '🪑',
  'drywall': '🧱',
  'plumber': '💧',
  'drain': '💧',
  'water heater': '💧',
  'sewer': '💧',
  'fixture': '💧',
  'electrician': '⚡',
  'lighting': '💡',
  'solar': '☀️',
  'generator': '⚡',
  'ev charger': '🔌',
  'interior paint': '🖌️',
  'exterior paint': '🖌️',
  'cabinet': '🖌️',
  'staining': '🖌️',
  'termite': '🐛',
  'wildlife': '🦝',
  'mosquito': '🦟',
  'local moving': '📦',
  'long distance': '🚚',
  'packing': '📦',
  'junk': '🗑️',
  'storage': '📦',
  'lawn': '🌱',
  'tree': '🌳',
  'garden': '🌺',
  'irrigation': '💧',
  'hardscaping': '🧱',
  'buyer': '🏠',
  'seller': '🏠',
  'rental': '🏢',
  'commercial': '🏢',
  'property': '🏠',
  'handyman': '🛠️',
  'mount': '🔩',
  'assembly': '🔩',
  'caulking': '🔧',
  'minor': '🔧',
  'flooring': '🏗️',
  'hardwood': '🪵',
  'laminate': '🏗️',
  'tile': '🏗️',
  'vinyl': '🏗️',
  'concrete': '🧱',
  'general construction': '🏗️',
  'renovation': '🏗️',
  'maintenance': '🔧',
  'cleaning': '✨',
  'installation': '🔧',
  'repair': '🔧',
  'builder': '🏗️',
};

function getCategoryEmoji(category: ServiceCategory): string {
  // Try icon mapping first
  if (category.icon && ICON_EMOJI_MAP[category.icon]) {
    return ICON_EMOJI_MAP[category.icon];
  }
  // Try name-based mapping (check keywords)
  const nameLower = category.name.toLowerCase();
  for (const [keyword, emoji] of Object.entries(NAME_EMOJI_MAP)) {
    if (nameLower.includes(keyword)) {
      return emoji;
    }
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

export default function ProsRequestStep1bScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { saveProgress } = useProsPendingRequests();
  
  const { customerInfo, parentCategoryId, parentCategoryName } = route.params || {};
  
  // Fetch sub-categories for this parent
  const { data: subCategories = [], isLoading, error } = useProsSubCategories(parentCategoryId);
  
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Build services list from fetched sub-categories + Other option
  const allServices = useMemo(() => {
    const services: ServiceCategory[] = [...subCategories];
    
    // Add "Other" option at the end
    services.push({
      id: 'other',
      slug: 'other',
      name: 'Other',
      icon: 'ellipsis-horizontal',
    } as ServiceCategory);
    
    return services;
  }, [subCategories]);

  // Filter services based on search query
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) {
      return allServices;
    }
    const query = searchQuery.toLowerCase().trim();
    return allServices.filter(service => 
      service.name.toLowerCase().includes(query)
    );
  }, [allServices, searchQuery]);

  const handleNext = async () => {
    if (!selectedService) {
      Alert.alert('Please Select', 'Please select a specific service to continue.');
      return;
    }

    if (!customerInfo) {
      Alert.alert('Error', 'Customer information is missing. Please start over.');
      return;
    }
    
    const selectedCategory = allServices.find(s => s.id === selectedService);
    
    const formData = {
      customerInfo,
      categoryId: selectedService,
      categoryName: selectedCategory?.name || 'Service',
      parentCategoryId,
      parentCategoryName,
      description,
    };

    // Auto-save progress
    if (selectedService !== 'other') {
      await saveProgress(selectedService, 1, formData);
    }
    
    navigation.navigate('ProsRequestStep2', formData);
  };

  const handleClose = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel? Your progress will not be saved.',
      [
        { text: 'Keep Going', onPress: () => {} },
        { text: 'Cancel', onPress: () => navigation.popToTop(), style: 'destructive' },
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
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
          <ProgressBar progress={43} />
          <Text style={styles.stepText}>Step 3 of 7</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.question}>What do you need?</Text>
          <Text style={styles.subtext}>Select a service under {parentCategoryName}</Text>

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
            <View style={styles.serviceGrid}>
              {filteredServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[
                    styles.serviceCard,
                    selectedService === service.id && styles.serviceCardSelected,
                  ]}
                  onPress={() => setSelectedService(service.id)}
                >
                  {selectedService === service.id && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark-circle" size={20} color={ProsColors.primary} />
                    </View>
                  )}
                  <Text style={styles.serviceEmoji}>
                    {service.id === 'other' ? '➕' : getCategoryEmoji(service)}
                  </Text>
                  <Text
                    style={[
                      styles.serviceName,
                      selectedService === service.id && styles.serviceNameSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {service.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredServices.length === 0 && (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                <Text style={styles.noResultsText}>No services found</Text>
                <Text style={styles.noResultsSubtext}>Try a different search term</Text>
              </View>
            )}

            <Text style={styles.descriptionLabel}>Describe your project (optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="E.g., I need to fix a leaky faucet in my kitchen..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
            
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !selectedService && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!selectedService}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
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
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  serviceCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    paddingVertical: 20,
    paddingHorizontal: 8,
    position: 'relative',
  },
  serviceCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: '#EFF6FF',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  serviceEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 17,
  },
  serviceNameSelected: {
    color: ProsColors.primary,
    fontWeight: '600',
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
  descriptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  descriptionInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: ProsColors.primary,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
