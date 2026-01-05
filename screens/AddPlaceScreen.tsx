import React, { useState } from 'react';
import { Alert, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
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

  const handleComplete = (data: any) => {
    console.log('Place Data:', data);
    Alert.alert("Success!", "Place added successfully.", [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  const handleScanComplete = (data: ScannedBusinessCard) => {
    // Map scanned data to form fields
    const mappedData = {
      name: data.name,
      location: data.address, 
      description: `Phone: ${data.phone}\nWebsite: ${data.website || ''}`,
    };
    
    setInitialData(mappedData);
    Alert.alert("Card Scanned!", "Form has been pre-filled with business card details.");
  };

  const startScan = () => {
    navigation.navigate('BusinessCardScanner' as never, {
      onScanComplete: handleScanComplete
    } as never);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Scan Button Overlay - Only visible on 'name' step and if no data yet */}
      {currentStepId === 'name' && !initialData && (
        <View style={styles.scanHeader}>
          <TouchableOpacity style={styles.scanButton} onPress={startScan}>
            <Ionicons name="scan-outline" size={20} color="#fff" />
            <Text style={styles.scanButtonText}>Scan Business Card</Text>
          </TouchableOpacity>
        </View>
      )}

      <QuickFormEngine
        formId="draft_add_place"
        title="New Place"
        steps={ADD_PLACE_STEPS}
        initialData={initialData}
        onComplete={handleComplete}
        onCancel={() => navigation.goBack()}
        onStepChange={setCurrentStepId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scanHeader: {
    position: 'absolute',
    top: 60, // Adjust based on safe area
    right: 20,
    zIndex: 100,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2DD4BF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 6,
  },
});