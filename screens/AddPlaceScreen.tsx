import React, { useState } from 'react';
import { Alert, View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QuickFormEngine, { FormStep } from '../components/QuickFormEngine';
import { useNavigation } from '@react-navigation/native';
import { ScannedBusinessCard } from './BusinessCardScannerScreen';

// Reordered Steps: Category First -> Name Second
const ADD_PLACE_STEPS: FormStep[] = [
  {
    id: 'category',
    title: "Category",
    question: "What kind of place is it?",
    type: 'select',
    options: ['Restaurant', 'Cafe', 'Park', 'Hotel', 'Shop', 'Other'],
    required: true,
  },
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
  },
];

export default function AddPlaceScreen() {
  const navigation = useNavigation();
  const [initialData, setInitialData] = useState<any>(null);
  const [currentStepId, setCurrentStepId] = useState<string>('category');
  const [showScanOption, setShowScanOption] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleComplete = (data: any) => {
    console.log('Place Data:', data);
    Alert.alert("Success!", "Place added successfully.", [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  const handleScanComplete = (data: ScannedBusinessCard) => {
    // Map scanned data to form fields
    const mappedData = {
      category: selectedCategory, // Keep the selected category
      name: data.name,
      location: data.address, 
      description: `Phone: ${data.phone}${data.website ? `\nWebsite: ${data.website}` : ''}`,
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
    navigation.navigate('BusinessCardScanner' as never, {
      onScanComplete: handleScanComplete
    } as never);
  };

  const handleStepChange = (stepId: string) => {
    setCurrentStepId(stepId);
    
    // Show scan option when moving from category to name step
    // and no data has been scanned yet
    if (stepId === 'name' && !initialData) {
      setShowScanOption(true);
    } else {
      setShowScanOption(false);
    }
  };

  // Track category when step changes - the form will have the category value
  // before moving to the name step

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
        steps={ADD_PLACE_STEPS}
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