/**
 * TavvY Universal Add Screen V2
 * 
 * A comprehensive "Add" screen that integrates:
 * - Content type selection (Place, Service Business, City, Universe)
 * - Full category system with 22 primary categories and 300+ subcategories
 * - Dynamic form fields based on selected category
 * - Multi-entrance support for applicable categories
 * - Business card scanner integration
 * - "Other" category with custom input
 * 
 * Path: screens/UniversalAddScreenV2.tsx
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Import category components
import { CategorySelector } from '../components/CategorySelector';
import { DynamicFormFields } from '../components/DynamicFormFields';
import MultipleEntrancesComponent from '../components/MultipleEntrancesComponent';

// Import category configuration
import {
  ContentType,
  CONTENT_TYPES,
  shouldShowMultipleEntrances,
  getPrimaryCategory,
  getSubcategory,
} from '../lib/categoryConfig';

// Import entrance hook
import { useLocalEntrances, LocalEntrance } from '../hooks/useEntrances';

// Import business card scanner types
import { ScannedBusinessCard } from './BusinessCardScannerScreen';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface FormData {
  // Content type
  contentType: ContentType;
  
  // Category
  primaryCategory: string;
  subcategory: string | null;
  customCategory: string;
  
  // Basic info
  name: string;
  address_line1: string;
  city: string;
  state_region: string;
  postal_code: string;
  country: string;
  
  // Contact
  phone_e164: string;
  website_url: string;
  email: string;
  
  // Social media
  instagram_url: string;
  facebook_url: string;
  twitter_url: string;
  tiktok_url: string;
  
  // Business details
  description: string;
  established_date: string;
  
  // Dynamic fields based on category
  [key: string]: any;
}

// ============================================
// INITIAL STATE
// ============================================

const initialFormData: FormData = {
  contentType: 'place',
  primaryCategory: '',
  subcategory: null,
  customCategory: '',
  name: '',
  address_line1: '',
  city: '',
  state_region: '',
  postal_code: '',
  country: 'US',
  phone_e164: '',
  website_url: '',
  email: '',
  instagram_url: '',
  facebook_url: '',
  twitter_url: '',
  tiktok_url: '',
  description: '',
  established_date: '',
};

// ============================================
// STEP DEFINITIONS
// ============================================

type Step = 'content_type' | 'category' | 'basic_info' | 'details' | 'entrances' | 'photos';

const STEP_CONFIG: Record<Step, { title: string; description: string }> = {
  content_type: {
    title: 'What are you adding?',
    description: 'Select the type of entry you want to create.',
  },
  category: {
    title: 'Select a Category',
    description: 'Choose the category that best describes this place or business.',
  },
  basic_info: {
    title: 'Basic Information',
    description: 'Enter the essential details. Fields marked with * are required.',
  },
  details: {
    title: 'Additional Details',
    description: 'Add more information to help others discover this place.',
  },
  entrances: {
    title: 'Entrances',
    description: 'Add entrance locations for this place.',
  },
  photos: {
    title: 'Add Photos',
    description: 'Upload photos to showcase this place.',
  },
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerButton: {
    padding: 8,
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#6366F1',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Progress bar
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0A84FF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // Content
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  
  // Step section
  stepSection: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  
  // Content type cards
  contentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  contentTypeCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contentTypeCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  contentTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contentTypeIconSelected: {
    backgroundColor: '#6366F1',
  },
  contentTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  contentTypeLabelSelected: {
    color: '#4F46E5',
  },
  contentTypeDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  
  // Category info card
  categoryInfoCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryInfoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  categoryInfoContent: {
    flex: 1,
  },
  categoryInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  categoryInfoText: {
    fontSize: 14,
    color: '#15803D',
    lineHeight: 20,
  },
  
  // Navigation buttons
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    justifyContent: 'center',
  },
  navButtonBack: {
    backgroundColor: '#F3F4F6',
  },
  navButtonNext: {
    backgroundColor: '#6366F1',
  },
  navButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonTextBack: {
    color: '#374151',
    marginLeft: 4,
  },
  navButtonTextNext: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  
  // Scan option
  scanOptionContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scanContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  scanStepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A84FF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  scanTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  scanSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 32,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fffe',
    borderWidth: 2,
    borderColor: '#0A84FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  scanIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scanCardContent: {
    flex: 1,
  },
  scanCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  scanCardDescription: {
    fontSize: 14,
    color: '#666',
  },
  manualCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  manualIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  manualCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  tipsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  
  // Form field styles
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  
  // Entrance section
  entranceSection: {
    marginTop: 8,
  },
  entranceSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  entranceSectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
  },
});

// ============================================
// MAIN COMPONENT
// ============================================

export default function UniversalAddScreenV2() {
  const navigation = useNavigation();
  
  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step navigation
  const [currentStep, setCurrentStep] = useState<Step>('content_type');
  
  // Business card scanner state
  const [showScanOption, setShowScanOption] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedBusinessCard | null>(null);
  
  // Entrances hook
  const { entrances, addEntrance, updateEntrance, removeEntrance } = useLocalEntrances();
  
  // Determine steps based on content type
  const steps = useMemo((): Step[] => {
    const baseSteps: Step[] = ['content_type', 'category', 'basic_info', 'details'];
    
    // Cities and Universes don't need categories in the same way
    if (formData.contentType === 'city') {
      return ['content_type', 'basic_info', 'details', 'photos'];
    }
    
    // Check if multi-entrance is needed
    const multiEntranceReq = shouldShowMultipleEntrances(
      formData.contentType,
      formData.primaryCategory,
      formData.subcategory || undefined
    );
    
    if (multiEntranceReq !== 'never') {
      baseSteps.push('entrances');
    }
    
    baseSteps.push('photos');
    return baseSteps;
  }, [formData.contentType, formData.primaryCategory, formData.subcategory]);
  
  // Current step index
  const currentStepIndex = steps.indexOf(currentStep);
  
  // Progress percentage
  const progress = Math.round(((currentStepIndex + 1) / steps.length) * 100);
  
  // Multi-entrance requirement
  const multiEntranceRequirement = useMemo(() => {
    return shouldShowMultipleEntrances(
      formData.contentType,
      formData.primaryCategory,
      formData.subcategory || undefined
    );
  }, [formData.contentType, formData.primaryCategory, formData.subcategory]);
  
  // Get category display info
  const categoryInfo = useMemo(() => {
    if (!formData.primaryCategory) return null;
    
    const primary = getPrimaryCategory(formData.primaryCategory);
    if (!primary) return null;
    
    let subcategoryName = null;
    if (formData.subcategory) {
      const subInfo = getSubcategory(formData.subcategory);
      subcategoryName = subInfo?.subcategory.name;
    }
    
    return {
      primaryName: primary.name,
      subcategoryName,
      iconKey: primary.iconKey,
    };
  }, [formData.primaryCategory, formData.subcategory]);
  
  // Handle field change
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Handle content type change
  const handleContentTypeChange = useCallback((type: ContentType) => {
    setFormData(prev => ({
      ...prev,
      contentType: type,
      primaryCategory: '',
      subcategory: null,
      customCategory: '',
    }));
  }, []);
  
  // Handle primary category change
  const handlePrimaryCategoryChange = useCallback((slug: string) => {
    setFormData(prev => ({
      ...prev,
      primaryCategory: slug,
      subcategory: null,
      customCategory: '',
    }));
  }, []);
  
  // Handle subcategory change
  const handleSubcategoryChange = useCallback((slug: string | null) => {
    setFormData(prev => ({
      ...prev,
      subcategory: slug,
    }));
  }, []);
  
  // Handle custom category change
  const handleCustomCategoryChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      customCategory: value,
    }));
  }, []);
  
  // Validate current step
  const validateStep = useCallback((step: Step): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 'content_type':
        // Always valid - content type has a default
        break;
        
      case 'category':
        if (!formData.primaryCategory && formData.contentType !== 'city') {
          newErrors.primaryCategory = 'Please select a category';
        }
        if (formData.primaryCategory === 'other' && !formData.customCategory?.trim()) {
          newErrors.customCategory = 'Please describe your category';
        }
        break;
        
      case 'basic_info':
        if (!formData.name?.trim()) {
          newErrors.name = 'Name is required';
        }
        if (formData.contentType !== 'service_business' && !formData.address_line1?.trim()) {
          newErrors.address_line1 = 'Address is required';
        }
        if (formData.contentType !== 'service_business' && !formData.city?.trim()) {
          newErrors.city = 'City is required';
        }
        break;
        
      case 'entrances':
        if (multiEntranceRequirement === 'always' && entrances.length === 0) {
          newErrors.entrances = 'At least one entrance is required';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, multiEntranceRequirement, entrances]);
  
  // Navigate to next step
  const goToNextStep = useCallback(() => {
    if (!validateStep(currentStep)) {
      return;
    }
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      // Show scan option when moving from category to basic_info for Place or Service Business
      if (currentStep === 'category' && 
          (formData.contentType === 'place' || formData.contentType === 'service_business') &&
          !scannedData) {
        setShowScanOption(true);
        return;
      }
      
      setCurrentStep(steps[nextIndex]);
    } else {
      // Submit form
      handleSubmit();
    }
  }, [currentStep, currentStepIndex, steps, validateStep, formData.contentType, scannedData]);
  
  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    } else {
      // Cancel and go back
      handleCancel();
    }
  }, [currentStepIndex, steps]);
  
  // Handle business card scan
  const handleScanComplete = useCallback((data: ScannedBusinessCard) => {
    setScannedData(data);
    
    // Map scanned data to form fields
    setFormData(prev => ({
      ...prev,
      name: data.name || prev.name,
      address_line1: data.address || prev.address_line1,
      phone_e164: data.phone || prev.phone_e164,
      website_url: data.website || prev.website_url,
      email: data.email || prev.email,
    }));
    
    setShowScanOption(false);
    setCurrentStep('basic_info');
    
    Alert.alert(
      'Card Scanned!',
      'Form has been pre-filled with business card details. Review and edit as needed.',
      [{ text: 'OK' }]
    );
  }, []);
  
  // Start scanner
  const startScan = useCallback(() => {
    (navigation as any).navigate('BusinessCardScanner', {
      onScanComplete: handleScanComplete
    });
  }, [navigation, handleScanComplete]);
  
  // Skip scan and continue manually
  const skipScan = useCallback(() => {
    setShowScanOption(false);
    setCurrentStep('basic_info');
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    
    try {
      // Prepare submission data
      const submissionData = {
        ...formData,
        entrances: multiEntranceRequirement !== 'never' ? entrances : [],
      };
      
      console.log('Submitting:', submissionData);
      
      // TODO: Submit to Supabase
      // const { data, error } = await supabase.from('places').insert(submissionData);
      
      let message = 'Entry added successfully!';
      if (formData.contentType === 'universe') message = 'Universe request sent!';
      if (formData.contentType === 'city') message = 'City added to map!';
      
      Alert.alert('Success!', message, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error submitting:', error);
      Alert.alert('Error', 'Failed to add entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, entrances, multiEntranceRequirement, navigation]);
  
  // Handle cancel
  const handleCancel = useCallback(() => {
    if (formData.name || formData.address_line1) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [formData, navigation]);
  
  // Check if can proceed to next step
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'content_type':
        return true;
      case 'category':
        if (formData.contentType === 'city') return true;
        return !!formData.primaryCategory;
      case 'basic_info':
        return !!formData.name?.trim();
      default:
        return true;
    }
  }, [currentStep, formData]);
  
  // Render scan option screen
  if (showScanOption) {
    return (
      <SafeAreaView style={styles.scanOptionContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowScanOption(false)} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
        
        <View style={styles.scanContent}>
          <Text style={styles.scanStepLabel}>QUICK ADD</Text>
          <Text style={styles.scanTitle}>Have a business card?</Text>
          <Text style={styles.scanSubtitle}>
            Scan it to auto-fill the form with name, address, phone, and website.
          </Text>
          
          <TouchableOpacity style={styles.scanCard} onPress={startScan}>
            <View style={styles.scanIconContainer}>
              <Ionicons name="camera" size={32} color="#fff" />
            </View>
            <View style={styles.scanCardContent}>
              <Text style={styles.scanCardTitle}>Scan Business Card</Text>
              <Text style={styles.scanCardDescription}>
                Take a photo and we'll extract the details
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#0A84FF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.manualCard} onPress={skipScan}>
            <View style={styles.manualIconContainer}>
              <Ionicons name="create-outline" size={28} color="#666" />
            </View>
            <View style={styles.scanCardContent}>
              <Text style={styles.manualCardTitle}>Enter Manually</Text>
              <Text style={styles.scanCardDescription}>
                Type in the details yourself
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
          
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Tips for scanning:</Text>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#0A84FF" />
              <Text style={styles.tipText}>Good lighting helps accuracy</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#0A84FF" />
              <Text style={styles.tipText}>Hold the card flat and steady</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#0A84FF" />
              <Text style={styles.tipText}>Make sure text is readable</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }
  
  // Render step content
  const renderStepContent = () => {
    const stepConfig = STEP_CONFIG[currentStep];
    
    switch (currentStep) {
      case 'content_type':
        return (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>{stepConfig.title}</Text>
            <Text style={styles.stepDescription}>{stepConfig.description}</Text>
            
            <View style={styles.contentTypeGrid}>
              {CONTENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.contentTypeCard,
                    formData.contentType === type.id && styles.contentTypeCardSelected,
                  ]}
                  onPress={() => handleContentTypeChange(type.id)}
                >
                  <View style={[
                    styles.contentTypeIcon,
                    formData.contentType === type.id && styles.contentTypeIconSelected,
                  ]}>
                    <Ionicons
                      name={type.icon}
                      size={24}
                      color={formData.contentType === type.id ? '#FFFFFF' : '#6B7280'}
                    />
                  </View>
                  <Text style={[
                    styles.contentTypeLabel,
                    formData.contentType === type.id && styles.contentTypeLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                  <Text style={styles.contentTypeDescription}>
                    {type.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
        
      case 'category':
        return (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>{stepConfig.title}</Text>
            <Text style={styles.stepDescription}>{stepConfig.description}</Text>
            
            <CategorySelector
              contentType={formData.contentType}
              onContentTypeChange={handleContentTypeChange}
              primaryCategory={formData.primaryCategory}
              onPrimaryCategoryChange={handlePrimaryCategoryChange}
              subcategory={formData.subcategory}
              onSubcategoryChange={handleSubcategoryChange}
              customCategory={formData.customCategory}
              onCustomCategoryChange={handleCustomCategoryChange}
              showContentTypeSelector={false}
              disabled={isSubmitting}
            />
            
            {errors.primaryCategory && (
              <Text style={styles.errorText}>{errors.primaryCategory}</Text>
            )}
            {errors.customCategory && (
              <Text style={styles.errorText}>{errors.customCategory}</Text>
            )}
          </View>
        );
        
      case 'basic_info':
        return (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>{stepConfig.title}</Text>
            <Text style={styles.stepDescription}>{stepConfig.description}</Text>
            
            {categoryInfo && (
              <View style={styles.categoryInfoCard}>
                <Ionicons
                  name={categoryInfo.iconKey as any}
                  size={24}
                  color="#166534"
                  style={styles.categoryInfoIcon}
                />
                <View style={styles.categoryInfoContent}>
                  <Text style={styles.categoryInfoTitle}>
                    {categoryInfo.primaryName}
                    {categoryInfo.subcategoryName && ` › ${categoryInfo.subcategoryName}`}
                  </Text>
                  <Text style={styles.categoryInfoText}>
                    Form fields customized for this category.
                  </Text>
                </View>
              </View>
            )}
            
            <DynamicFormFields
              primaryCategory={formData.primaryCategory || 'other'}
              subcategory={formData.subcategory || undefined}
              values={formData}
              onChange={handleFieldChange}
              errors={errors}
              disabled={isSubmitting}
            />
          </View>
        );
        
      case 'details':
        return (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>{stepConfig.title}</Text>
            <Text style={styles.stepDescription}>{stepConfig.description}</Text>
            
            <DynamicFormFields
              primaryCategory={formData.primaryCategory || 'other'}
              subcategory={formData.subcategory || undefined}
              values={formData}
              onChange={handleFieldChange}
              errors={errors}
              disabled={isSubmitting}
              excludeUniversalFields={true}
            />
          </View>
        );
        
      case 'entrances':
        return (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>{stepConfig.title}</Text>
            <Text style={styles.stepDescription}>
              {multiEntranceRequirement === 'always'
                ? 'This type of place typically has multiple entrances. Please add at least one.'
                : 'Does this place have multiple entrances? Add them here (optional).'}
            </Text>
            
            {multiEntranceRequirement === 'always' && entrances.length === 0 && (
              <View style={styles.warningCard}>
                <Ionicons
                  name="warning"
                  size={24}
                  color="#92400E"
                  style={styles.warningIcon}
                />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Entrances Required</Text>
                  <Text style={styles.warningText}>
                    Places like {categoryInfo?.subcategoryName || categoryInfo?.primaryName} typically have multiple entrances.
                  </Text>
                </View>
              </View>
            )}
            
            <MultipleEntrancesComponent
              entrances={entrances}
              onAddEntrance={addEntrance}
              onUpdateEntrance={updateEntrance}
              onRemoveEntrance={removeEntrance}
            />
            
            {errors.entrances && (
              <Text style={styles.errorText}>{errors.entrances}</Text>
            )}
          </View>
        );
        
      case 'photos':
        return (
          <View style={styles.stepSection}>
            <Text style={styles.stepTitle}>{stepConfig.title}</Text>
            <Text style={styles.stepDescription}>{stepConfig.description}</Text>
            
            {/* Photo upload component would go here */}
            <View style={{ 
              height: 200, 
              backgroundColor: '#F3F4F6', 
              borderRadius: 12, 
              alignItems: 'center', 
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#E5E7EB',
              borderStyle: 'dashed',
            }}>
              <Ionicons name="camera" size={48} color="#9CA3AF" />
              <Text style={{ color: '#6B7280', marginTop: 8 }}>Tap to add photos</Text>
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New</Text>
        <View style={{ width: 60 }} />
      </View>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStepIndex + 1} of {steps.length}
        </Text>
      </View>
      
      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonBack]}
          onPress={goToPreviousStep}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
          <Text style={[styles.navButtonText, styles.navButtonTextBack]}>
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.navButtonNext,
            !canProceed && styles.navButtonDisabled,
          ]}
          onPress={goToNextStep}
          disabled={!canProceed || isSubmitting}
        >
          <Text style={[styles.navButtonText, styles.navButtonTextNext]}>
            {currentStepIndex === steps.length - 1 ? 'Submit' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}