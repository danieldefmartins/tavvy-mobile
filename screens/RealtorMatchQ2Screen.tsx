/**
 * RealtorMatchQ2Screen.tsx
 * Install path: screens/RealtorMatchQ2Screen.tsx
 * 
 * Question 2: What type of property is this?
 */
import React, { useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RealtorMatchQuestionScreen from '../components/RealtorMatchQuestionScreen';

type RouteParams = {
  params: {
    lookingTo: string;
  };
};

const RESIDENTIAL_OPTIONS = [
  { id: 'single-family', label: 'Single-family home', icon: 'home-outline' },
  { id: 'condo', label: 'Condo / Apartment', icon: 'business-outline' },
  { id: 'townhouse', label: 'Townhouse', icon: 'grid-outline' },
  { id: 'multi-family', label: 'Multi-family', icon: 'people-outline' },
];

const COMMERCIAL_OPTIONS = [
  { id: 'office', label: 'Office', icon: 'briefcase-outline' },
  { id: 'retail', label: 'Retail', icon: 'storefront-outline' },
  { id: 'industrial', label: 'Industrial', icon: 'construct-outline' },
  { id: 'land', label: 'Land', icon: 'map-outline' },
];

const OTHER_OPTIONS = [
  { id: 'vacation', label: 'Vacation / Second home', icon: 'sunny-outline' },
  { id: 'investment', label: 'Investment property', icon: 'cash-outline' },
];

const ALL_OPTIONS = [
  { id: 'header-residential', label: 'Residential', sublabel: '', icon: '' },
  ...RESIDENTIAL_OPTIONS,
  { id: 'header-commercial', label: 'Commercial', sublabel: '', icon: '' },
  ...COMMERCIAL_OPTIONS,
  { id: 'header-other', label: 'Other', sublabel: '', icon: '' },
  ...OTHER_OPTIONS,
].filter(opt => !opt.id.startsWith('header-'));

export default function RealtorMatchQ2Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    if (selected) {
      navigation.navigate('RealtorMatchQ3', { 
        ...route.params,
        propertyType: selected 
      });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.navigate('RealtorsBrowse');
  };

  // Combine all options for display
  const options = [
    ...RESIDENTIAL_OPTIONS,
    ...COMMERCIAL_OPTIONS,
    ...OTHER_OPTIONS,
  ];

  return (
    <RealtorMatchQuestionScreen
      questionNumber={2}
      totalQuestions={12}
      question="What type of property is this?"
      subtitle="Select the property type that best matches your search."
      options={options}
      selectedValue={selected}
      onSelect={setSelected}
      onNext={handleNext}
      onBack={handleBack}
      onClose={handleClose}
      canProceed={!!selected}
    />
  );
}
