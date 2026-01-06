import React, { useState } from 'react';
import { Alert, View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuickFormEngine, { FormStep } from '../components/QuickFormEngine';
import { useNavigation } from '@react-navigation/native';
import { ScannedBusinessCard } from './BusinessCardScannerScreen';

// Define all possible steps in a flat array, but linked logically
const UNIVERSAL_STEPS: FormStep[] = [
  // STEP 0: ROOT QUESTION
  {
    id: 'type',
    title: "New Entry",
    question: "What are you adding?",
    type: 'select',
    options: ['Place', 'Service Business', 'City', 'Universe'],
    required: true,
    nextStep: (answer) => {
      if (answer === 'Place') return 'place_category';
      if (answer === 'Service Business') return 'service_category';
      if (answer === 'City') return 'city_name';
      if (answer === 'Universe') return 'universe_name';
      return null;
    }
  },

  // --- BRANCH: PLACE ---
  {
    id: 'place_category',
    title: "Place Category",
    question: "What kind of place is it?",
    type: 'select',
    options: ['Restaurant', 'Cafe', 'Park', 'Hotel', 'Shop', 'Other'],
    required: true,
    nextStep: () => 'place_name'
  },
  {
    id: 'place_name',
    title: "Place Name",
    question: "What is the name of this place?",
    type: 'text',
    placeholder: "e.g. Joe's Coffee",
    required: true,
    nextStep: () => 'place_address'
  },
  {
    id: 'place_address',
    title: "Address",
    question: "What is the full address?",
    type: 'address',
    placeholder: "123 Main St, City, State, Zip",
    required: true,
    nextStep: () => 'place_location'
  },
  {
    id: 'place_location',
    title: "Pin Location",
    question: "Confirm the exact location on the map.",
    type: 'location',
    nextStep: () => 'place_phone'
  },
  {
    id: 'place_phone',
    title: "Phone Number",
    question: "What is the phone number?",
    type: 'phone',
    placeholder: "(555) 123-4567",
    nextStep: () => 'place_website'
  },
  {
    id: 'place_website',
    title: "Website",
    question: "Do they have a website?",
    type: 'url',
    placeholder: "https://example.com",
    nextStep: () => 'place_hours'
  },
  {
    id: 'place_hours',
    title: "Hours",
    question: "When are they open?",
    type: 'hours',
    nextStep: () => 'place_amenities'
  },
  {
    id: 'place_amenities',
    title: "Amenities",
    question: "What amenities are available?",
    type: 'tags',
    options: ['WiFi', 'Outdoor Seating', 'Parking', 'Wheelchair Accessible', 'Pet Friendly', 'Restrooms'],
    nextStep: () => 'place_desc'
  },
  {
    id: 'place_desc',
    title: "Description",
    question: "Tell us a bit more about it (optional).",
    type: 'text',
    placeholder: "Great vibes, good wifi...",
    nextStep: () => 'place_established'
  },
  {
    id: 'place_established',
    title: "Established Date",
    question: "When did this place open?",
    type: 'date',
    nextStep: () => 'place_socials'
  },
  {
    id: 'place_socials',
    title: "Social Media",
    question: "Add their social profiles.",
    type: 'socials',
    nextStep: () => 'branding_logo'
  },

  // --- BRANCH: SERVICE BUSINESS ---
  {
    id: 'service_category',
    title: "Service Type",
    question: "What service do they offer?",
    type: 'select',
    options: ['Construction', 'Cleaning', 'Landscaping', 'Plumbing', 'Electrician', 'Other'],
    required: true,
    nextStep: () => 'service_name'
  },
  {
    id: 'service_name',
    title: "Business Name",
    question: "What is the business name?",
    type: 'text',
    placeholder: "e.g. Mike's Plumbing",
    required: true,
    nextStep: () => 'service_phone'
  },
  {
    id: 'service_phone',
    title: "Phone Number",
    question: "What is the business phone number?",
    type: 'phone',
    required: true,
    nextStep: () => 'service_website'
  },
  {
    id: 'service_website',
    title: "Website",
    question: "Do they have a website?",
    type: 'url',
    nextStep: () => 'service_area'
  },
  {
    id: 'service_area',
    title: "Service Area",
    question: "Which cities or areas do they serve?",
    type: 'multi-location',
    placeholder: "Add city, county, or zip...",
    nextStep: () => 'service_insurance'
  },
  {
    id: 'service_insurance',
    title: "Insurance",
    question: "Do they have liability insurance?",
    type: 'toggle',
    placeholder: "Yes, Insured",
    nextStep: (insured) => insured ? 'service_insurance_provider' : 'service_license'
  },
  {
    id: 'service_insurance_provider',
    title: "Insurance Provider",
    question: "Who is the insurance provider?",
    type: 'text',
    placeholder: "e.g. State Farm",
    nextStep: () => 'service_license'
  },
  {
    id: 'service_license',
    title: "Trade License",
    question: "Do they have a trade license?",
    type: 'toggle',
    placeholder: "Yes, Licensed",
    nextStep: (licensed) => licensed ? 'service_license_number' : 'service_established'
  },
  {
    id: 'service_license_number',
    title: "License Details",
    question: "Enter the license number & state.",
    type: 'text',
    placeholder: "e.g. LIC-12345 (FL)",
    nextStep: () => 'service_established'
  },
  {
    id: 'service_established',
    title: "Established Date",
    question: "When was the business established?",
    type: 'date',
    nextStep: () => 'service_socials'
  },
  {
    id: 'service_socials',
    title: "Social Media",
    question: "Add social profiles & WhatsApp.",
    type: 'socials',
    nextStep: () => 'branding_logo'
  },

  // --- BRANCH: CITY ---
  {
    id: 'city_name',
    title: "City Name",
    question: "Which city are you adding?",
    type: 'text',
    placeholder: "e.g. Austin, TX",
    required: true,
    nextStep: () => 'city_location'
  },
  {
    id: 'city_location',
    title: "Location",
    question: "Pin the city center.",
    type: 'location',
    nextStep: () => 'city_desc'
  },
  {
    id: 'city_desc',
    title: "Description",
    question: "What makes this city special?",
    type: 'text',
    nextStep: () => 'photos'
  },

  // --- BRANCH: UNIVERSE ---
  {
    id: 'universe_name',
    title: "Universe Name",
    question: "Name your new Universe (Community).",
    type: 'text',
    placeholder: "e.g. Van Life, Digital Nomads",
    required: true,
    nextStep: () => 'universe_desc'
  },
  {
    id: 'universe_desc',
    title: "Description",
    question: "Who is this universe for?",
    type: 'text',
    placeholder: "A community for...",
    nextStep: () => 'universe_rules'
  },
  {
    id: 'universe_rules',
    title: "Rules",
    question: "Any specific rules for joining?",
    type: 'text',
    nextStep: () => 'photos'
  },

  // --- BRANDING & PHOTOS ---
  {
    id: 'branding_logo',
    title: "Logo",
    question: "Upload the business logo.",
    type: 'photo',
    nextStep: () => 'branding_profile'
  },
  {
    id: 'branding_profile',
    title: "Profile Picture",
    question: "Add a profile picture (Owner or Cover).",
    type: 'photo',
    nextStep: () => 'photos'
  },
  {
    id: 'photos',
    title: "Gallery",
    question: "Add photos of the work or place.",
    type: 'photo',
    nextStep: () => null // End
  },
];

export default function UniversalAddScreen() {
  const navigation = useNavigation();
  
  // State for business card scanner integration
  const [initialData, setInitialData] = useState<any>(null);
  const [currentStepId, setCurrentStepId] = useState<string>('type');
  const [previousStepId, setPreviousStepId] = useState<string | null>(null);
  const [showScanOption, setShowScanOption] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleComplete = (data: any) => {
    console.log('Universal Add Data:', data);
    
    let message = "Entry added successfully!";
    if (data.type === 'Universe') message = "Universe request sent!";
    if (data.type === 'City') message = "City added to map!";

    Alert.alert("Success!", message, [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  const handleScanComplete = (data: ScannedBusinessCard) => {
    // Map scanned data to form fields based on type
    const mappedData: any = {
      type: selectedType,
    };
    
    if (selectedType === 'Place') {
      mappedData.place_category = selectedCategory;
      mappedData.place_name = data.name;
      mappedData.place_address = data.address;
      mappedData.place_phone = data.phone;
      mappedData.place_website = data.website;
    } else if (selectedType === 'Service Business') {
      mappedData.service_category = selectedCategory;
      mappedData.service_name = data.name;
      mappedData.service_phone = data.phone;
      mappedData.service_website = data.website;
    }
    
    setInitialData(mappedData);
    setShowScanOption(false);
    Alert.alert(
      "Card Scanned!", 
      "Form has been pre-filled with business card details. Review and edit as needed.",
      [{ text: "OK" }]
    );
  };

  const startScan = () => {
    navigation.navigate('BusinessCardScanner' as never, {
      onScanComplete: handleScanComplete
    } as never);
  };

  const handleStepChange = (stepId: string) => {
    // Track the selected type and category for later use
    if (stepId === 'place_category' || stepId === 'service_category') {
      // User just selected Place or Service Business
      setSelectedType(previousStepId === 'type' ? 
        (stepId === 'place_category' ? 'Place' : 'Service Business') : selectedType);
    }
    
    // Show scan option ONLY when transitioning FROM category TO name step
    // Works for both Place and Service Business flows
    const isPlaceFlow = previousStepId === 'place_category' && stepId === 'place_name';
    const isServiceFlow = previousStepId === 'service_category' && stepId === 'service_name';
    
    if ((isPlaceFlow || isServiceFlow) && !initialData) {
      // Store the category before showing scan option
      setSelectedCategory(previousStepId === 'place_category' ? 'place' : 'service');
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
          <Text style={styles.headerTitle}>Add New</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '25%' }]} />
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
                Type in the details yourself
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
    <QuickFormEngine
      formId="draft_universal_add"
      title="Create New"
      steps={UNIVERSAL_STEPS}
      initialData={initialData}
      onComplete={handleComplete}
      onCancel={() => navigation.goBack()}
      onStepChange={handleStepChange}
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