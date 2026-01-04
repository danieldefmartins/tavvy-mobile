import React from 'react';
import { Alert } from 'react-native';
import QuickFormEngine, { FormStep } from '../components/QuickFormEngine';
import { useNavigation } from '@react-navigation/native';

const ADD_PLACE_STEPS: FormStep[] = [
  {
    id: 'name',
    title: "Let's start",
    question: "What is the name of this place?",
    type: 'text',
    placeholder: "e.g. Joe's Coffee",
    required: true,
  },
  {
    id: 'category',
    title: "Category",
    question: "What kind of place is it?",
    type: 'select',
    options: ['Restaurant', 'Cafe', 'Park', 'Hotel', 'Shop', 'Other'],
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

  const handleComplete = (data: any) => {
    console.log('Place Data:', data);
    Alert.alert("Success!", "Place added successfully.", [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <QuickFormEngine
      formId="draft_add_place"
      title="New Place"
      steps={ADD_PLACE_STEPS}
      onComplete={handleComplete}
      onCancel={() => navigation.goBack()}
    />
  );
}