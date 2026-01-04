import React from 'react';
import { Alert } from 'react-native';
import QuickFormEngine, { FormStep } from '../components/QuickFormEngine';
import { useNavigation } from '@react-navigation/native';

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

  const handleComplete = (data: any) => {
    console.log('Universal Add Data:', data);
    
    let message = "Entry added successfully!";
    if (data.type === 'Universe') message = "Universe request sent!";
    if (data.type === 'City') message = "City added to map!";

    Alert.alert("Success!", message, [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <QuickFormEngine
      formId="draft_universal_add"
      title="Create New"
      steps={UNIVERSAL_STEPS}
      onComplete={handleComplete}
      onCancel={() => navigation.goBack()}
    />
  );
}