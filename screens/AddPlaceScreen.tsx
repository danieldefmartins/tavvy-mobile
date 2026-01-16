import React, { useState, useEffect } from 'react';
import { Alert, View, TouchableOpacity, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuickFormEngine, { FormStep } from '../components/QuickFormEngine';
import { useNavigation } from '@react-navigation/native';
import { ScannedBusinessCard } from './BusinessCardScannerScreen';
import { supabase } from '../lib/supabaseClient';
import { PRIMARY_CATEGORIES, PrimaryCategory, SubCategory } from '../lib/categoryConfig';

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
const getFormSteps = (selectedCategory: string | null): FormStep[] => {
  const steps: FormStep[] = [
    {
      id: 'category',
      title: "Category",
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
      title: "Photos",
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
  const navigation = useNavigation();
  const [initialData, setInitialData] = useState<any>(null);
  const [currentStepId, setCurrentStepId] = useState<string>('category');
  const [previousStepId, setPreviousStepId] = useState<string | null>(null);
  const [showScanOption, setShowScanOption] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formSteps, setFormSteps] = useState<FormStep[]>(getFormSteps(null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form steps when category changes
  useEffect(() => {
    setFormSteps(getFormSteps(selectedCategory));
  }, [selectedCategory]);

  const handleComplete = async (data: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert("Error", "You must be logged in to add a place.");
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
        Alert.alert("Error", `Failed to add place: ${insertError.message}`);
        setIsSubmitting(false);
        return;
      }
      
      console.log('Place added successfully:', insertedPlace);
      
      Alert.alert(
        "Success!", 
        "Place added successfully. Thank you for contributing!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      console.error('Error adding place:', error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
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
      [{ text: "OK" }]
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
          <Text style={styles.headerTitle}>Add Place</Text>
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

          {/* Scan Card Option */}
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
            <Ionicons name="chevron-forward" size={24} color="#2DD4BF" />
          </TouchableOpacity>

          {/* Manual Entry Option */}
          <TouchableOpacity style={styles.manualCard} onPress={skipScan}>
            <View style={styles.manualIconContainer}>
              <Ionicons name="create-outline" size={28} color="#666" />
            </View>
            <View style={styles.scanCardContent}>
              <Text style={styles.manualCardTitle}>Enter Manually</Text>
              <Text style={styles.scanCardDescription}>
                Type in the place details yourself
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Tips for scanning:</Text>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#2DD4BF" />
              <Text style={styles.tipText}>Good lighting helps accuracy</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#2DD4BF" />
              <Text style={styles.tipText}>Hold the card flat and steady</Text>
            </View>
            <View style={styles.tipRow}>
              <Ionicons name="checkmark-circle" size={16} color="#2DD4BF" />
              <Text style={styles.tipText}>Make sure text is readable</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <QuickFormEngine
        formId="draft_add_place"
        title="New Place"
        steps={formSteps}
        initialData={initialData}
        onComplete={handleComplete}
        onCancel={() => navigation.goBack()}
        onStepChange={handleStepChange}
      />
    </View>
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
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2DD4BF',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2DD4BF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
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
    borderColor: '#2DD4BF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  scanIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#2DD4BF',
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
});
