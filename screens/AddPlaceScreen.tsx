'''
import React, { useState, useEffect } from 'react';
import { Alert, View, TouchableOpacity, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuickFormEngine, { FormStep } from '../components/QuickFormEngine';
import { useNavigation } from '@react-navigation/native';
import { ScannedBusinessCard } from './BusinessCardScannerScreen';
import { supabase } from '../lib/supabaseClient';
import { PRIMARY_CATEGORIES, PrimaryCategory, SubCategory } from '../lib/categoryConfig';
import { useTranslation } from 'react-i18next';

// Build category options from categoryConfig.ts
const buildCategoryOptions = (): { primary: string[]; subcategories: { [key: string]: string[] } } => {
  const primary: string[] = [];
  const subcategories: { [key: string]: string[] } = {};
  
  PRIMARY_CATEGORIES.forEach((cat: PrimaryCategory) => {
    primary.push(cat.name);
    subcategories[cat.name] = cat.subcategories.map((sub: SubCategory) => sub.name);
  });
  
  return { primary, subcategories };
};

const categoryOptions = buildCategoryOptions();

// Dynamic form steps - subcategory step is added based on primary category selection
const getFormSteps = (selectedCategory: string | null, t: any): FormStep[] => {
  const steps: FormStep[] = [
    {
      id: 'category',
      title: t('add.category'),
      question: "What kind of place is it?",
      type: 'select',
      options: categoryOptions.primary,
      required: true,
    },
  ];
  
  // Add subcategory step if a primary category is selected and has subcategories
  if (selectedCategory && categoryOptions.subcategories[selectedCategory]?.length > 0) {
    steps.push({
      id: 'subcategory',
      title: "Subcategory",
      question: `What type of ${selectedCategory.toLowerCase()}?`,
      type: 'select',
      options: categoryOptions.subcategories[selectedCategory],
      required: false,
    });
  }
  
  // Add remaining steps
  steps.push(
    {
      id: 'name',
      title: "Let's start",
      question: "What is the name of this place?",
      type: 'text',
      placeholder: "e.g. Joe's Coffee",
      required: true,
    },
    {
      id: 'location',
      title: "Location",
      question: "Where is it located?",
      type: 'location',
      required: true,
    },
    {
      id: 'contact',
      title: "Contact",
      question: "How can people reach this place? (optional)",
      type: 'text' as any, // Custom type for phone, website, email
    },
    {
      id: 'description',
      title: "Details",
      question: "Tell us a bit more about it (optional).",
      type: 'text',
      placeholder: "Great vibes, good wifi...",
    },
    {
      id: 'photos',
      title: t('places.photos'),
      question: "Add a photo to show the vibe.",
      type: 'photo',
    }
  );
  
  return steps;
};

// Helper to get category slug from name
const getCategorySlug = (categoryName: string): string => {
  const category = PRIMARY_CATEGORIES.find(cat => cat.name === categoryName);
  return category?.slug || 'other';
};

const getSubcategorySlug = (categoryName: string, subcategoryName: string): string | null => {
  const category = PRIMARY_CATEGORIES.find(cat => cat.name === categoryName);
  if (!category) return null;
  const subcategory = category.subcategories.find(sub => sub.name === subcategoryName);
  return subcategory?.slug || null;
};

export default function AddPlaceScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [initialData, setInitialData] = useState<any>(null);
  const [currentStepId, setCurrentStepId] = useState<string>('category');
  const [previousStepId, setPreviousStepId] = useState<string | null>(null);
  const [showScanOption, setShowScanOption] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formSteps, setFormSteps] = useState<FormStep[]>(getFormSteps(null, t));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form steps when category changes
  useEffect(() => {
    setFormSteps(getFormSteps(selectedCategory, t));
  }, [selectedCategory, t]);

  const handleComplete = async (data: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert(t('common.error'), "You must be logged in to add a place.");
        setIsSubmitting(false);
        return;
      }
      
      // Parse location data
      let latitude = null;
      let longitude = null;
      let address = null;
      let city = null;
      let region = null;
      let country = null;
      let postcode = null;
      
      if (data.location) {
        // Location could be a string or an object with coordinates
        if (typeof data.location === 'object') {
          latitude = data.location.latitude;
          longitude = data.location.longitude;
          address = data.location.address;
          city = data.location.city;
          region = data.location.region;
          country = data.location.country;
          postcode = data.location.postcode;
        } else {
          address = data.location;
        }
      }
      
      // Parse contact data
      let phone = null;
      let email = null;
      let website = null;
      
      if (data.contact) {
        if (typeof data.contact === 'object') {
          phone = data.contact.phone;
          email = data.contact.email;
          website = data.contact.website;
        }
      }
      
      // Parse photos
      let photos: string[] = [];
      let coverImage = null;
      
      if (data.photos) {
        if (Array.isArray(data.photos)) {
          photos = data.photos;
          coverImage = photos[0];
        } else if (typeof data.photos === 'string') {
          photos = [data.photos];
          coverImage = data.photos;
        }
      }
      
      // Prepare the place data for tavvy_places table
      const placeData = {
        name: data.name,
        description: data.description || null,
        tavvy_category: getCategorySlug(data.category),
        tavvy_subcategory: data.subcategory ? getSubcategorySlug(data.category, data.subcategory) : null,
        latitude,
        longitude,
        address,
        city,
        region,
        country,
        postcode,
        phone,
        email,
        website,
        photos,
        cover_image_url: coverImage,
        source: 'user',
        created_by: user.id,
      };
      
      console.log('Saving place to tavvy_places:', placeData);
      
      // Insert into tavvy_places table
      const { data: insertedPlace, error: insertError } = await supabase
        .from('tavvy_places')
        .insert(placeData)
        .select()
        .single();
      
      if (insertError) {
        console.error('Error inserting place:', insertError);
        Alert.alert(t('common.error'), t('errors.somethingWentWrong', { message: insertError.message }));
        setIsSubmitting(false);
        return;
      }
      
      console.log('Place added successfully:', insertedPlace);
      
      Alert.alert(
        t('success.success'), 
        "Place added successfully. Thank you for contributing!",
        [{ text: t('common.done'), onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error('Error adding place:', error);
      Alert.alert(t('common.error'), t('errors.somethingWentWrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanComplete = (data: ScannedBusinessCard) => {
    // Map scanned data to form fields
    const mappedData = {
      category: selectedCategory,
      name: data.name,
      location: data.address,
      contact: {
        phone: data.phone,
        website: data.website,
        email: data.email,
      },
      description: '',
    };
    
    setInitialData(mappedData);
    setShowScanOption(false);
    Alert.alert(
      "Card Scanned!", 
      "Form has been pre-filled with business card details. Review and edit as needed.",
      [{ text: t('common.done') }]
    );
  };

  const startScan = () => {
    (navigation as any).navigate('BusinessCardScanner', {
      onScanComplete: handleScanComplete
    });
  };

  const handleStepChange = (stepId: string, formData?: any) => {
    // Track category selection
    if (formData?.category && formData.category !== selectedCategory) {
      setSelectedCategory(formData.category);
    }
    
    // Show scan option ONLY when transitioning FROM 'category' or 'subcategory' TO 'name'
    // and no data has been scanned yet
    const isTransitionToName = stepId === 'name' && 
      (previousStepId === 'category' || previousStepId === 'subcategory') && 
      !initialData;
    
    if (isTransitionToName) {
      setShowScanOption(true);
    }
    
    // Update step tracking
    setPreviousStepId(currentStepId);
    setCurrentStepId(stepId);
  };

  const skipScan = () => {
    setShowScanOption(false);
  };

  // Show the scan option screen between category and name
  if (showScanOption) {
    return (
      <SafeAreaView style={styles.scanOptionContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('places.addPlace')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '20%' }]} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.stepLabel}>QUICK ADD</Text>
          <Text style={styles.title}>Have a business card?</Text>
          <Text style={styles.subtitle}>
            Scan it to auto-fill the form with name, address, phone, and website.
          </Text>

          <TouchableOpacity style={styles.scanButton} onPress={startScan}>
            <Ionicons name="camera-outline" size={24} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Business Card</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={skipScan}>
            <Text style={styles.skipButtonText}>Skip & Enter Manually</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <QuickFormEngine
      steps={formSteps}
      onComplete={handleComplete}
      onStepChange={handleStepChange}
      initialData={initialData}
      isSubmitting={isSubmitting}
      headerRightAction={showScanOption ? undefined : () => {}}
      headerRightIcon={showScanOption ? undefined : 'camera-outline'}
      headerRightText={showScanOption ? undefined : 'Scan'}
      onHeaderRightPress={showScanOption ? undefined : startScan}
      headerTitle={t('places.addPlace')}
      finalButtonText={t('places.addPlace')}
      renderCustomStep={(step, data, onDataChange) => {
        if (step.id === 'contact') {
          return (
            <View>
              <Text style={styles.question}>{step.question}</Text>
              {/* Custom fields for phone, website, email */}
            </View>
          );
        }
        if (step.id === 'name') {
          return (
            <View>
              <Text style={styles.question}>{step.question}</Text>
              {/* Your custom name input component */}
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Tips for a great entry:</Text>
                <View style={styles.tipRow}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#4CAF50" />
                  <Text style={styles.tipText}>Use the official business name.</Text>
                </View>
                <View style={styles.tipRow}>
                  <Ionicons name="close-circle-outline" size={18} color="#F44336" />
                  <Text style={styles.tipText}>Avoid adding extra details or keywords.</Text>
                </View>
              </View>
            </View>
          );
        }
        return null;
      }}
    />
  );
}

const styles = StyleSheet.create({
  scanOptionContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 16,
    width: '100%',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
  skipButton: {
    padding: 12,
  },
  skipButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  tipsContainer: {
    marginTop: 24,
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
});
'''
