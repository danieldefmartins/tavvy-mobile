/**
 * RealtorMatchQ1Screen.tsx
 * Install path: screens/RealtorMatchQ1Screen.tsx
 * 
 * Question 1: What are you looking to do?
 */
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RealtorMatchQuestionScreen from '../components/RealtorMatchQuestionScreen';

const OPTIONS = [
  { id: 'buy', label: 'Buy', icon: 'home-outline', sublabel: 'Looking to purchase a property' },
  { id: 'sell', label: 'Sell', icon: 'pricetag-outline', sublabel: 'Ready to list my property' },
  { id: 'rent', label: 'Rent', icon: 'key-outline', sublabel: 'Looking for a rental' },
  { id: 'lease', label: 'Lease', icon: 'document-text-outline', sublabel: 'Commercial or long-term lease' },
  { id: 'invest', label: 'Invest', icon: 'trending-up-outline', sublabel: 'Investment property opportunities' },
  { id: 'exploring', label: 'Just exploring', icon: 'compass-outline', sublabel: 'Not ready to commit yet' },
];

export default function RealtorMatchQ1Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    if (selected) {
      navigation.navigate('RealtorMatchQ2', { lookingTo: selected });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.navigate('RealtorsBrowse');
  };

  return (
    <RealtorMatchQuestionScreen
      questionNumber={1}
      totalQuestions={12}
      question="What are you looking to do?"
      subtitle="This helps us match you with realtors who specialize in your needs."
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onNext={handleNext}
      onBack={handleBack}
      onClose={handleClose}
      canProceed={!!selected}
    />
  );
}
