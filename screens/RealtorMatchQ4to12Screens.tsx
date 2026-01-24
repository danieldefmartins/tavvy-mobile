/**
 * RealtorMatchQ4to12Screens.tsx
 * Install path: screens/RealtorMatchQ4to12Screens.tsx
 * 
 * Questions 4-12 for the Smart Realtor Match flow.
 * Export each screen component separately.
 */
import React, { useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RealtorMatchQuestionScreen from '../components/RealtorMatchQuestionScreen';

type RouteParams = {
  params: Record<string, any>;
};

// Q4: What's your timeline?
export function RealtorMatchQ4Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [selected, setSelected] = useState<string | null>(null);

  const OPTIONS = [
    { id: 'asap', label: 'ASAP', icon: 'flash-outline', sublabel: 'Ready to move now' },
    { id: '1-3months', label: '1-3 months', icon: 'calendar-outline', sublabel: 'Soon, but not urgent' },
    { id: '3-6months', label: '3-6 months', icon: 'time-outline', sublabel: 'Planning ahead' },
    { id: '6-12months', label: '6-12 months', icon: 'hourglass-outline', sublabel: 'Long-term planning' },
    { id: 'exploring', label: 'Just exploring', icon: 'compass-outline', sublabel: 'No timeline yet' },
  ];

  const handleNext = () => {
    if (selected) {
      navigation.navigate('RealtorMatchQ5', { ...route.params, timeline: selected });
    }
  };

  return (
    <RealtorMatchQuestionScreen
      questionNumber={4}
      totalQuestions={12}
      question="What's your timeline?"
      subtitle="When are you looking to make a move?"
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.navigate('RealtorsBrowse')}
      canProceed={!!selected}
    />
  );
}

// Q5: What price range?
export function RealtorMatchQ5Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [selected, setSelected] = useState<string | null>(null);

  const isBuying = route.params?.lookingTo === 'buy' || route.params?.lookingTo === 'invest';
  
  const BUY_OPTIONS = [
    { id: 'under-250k', label: 'Under $250,000', icon: 'cash-outline' },
    { id: '250k-500k', label: '$250,000 - $500,000', icon: 'cash-outline' },
    { id: '500k-750k', label: '$500,000 - $750,000', icon: 'cash-outline' },
    { id: '750k-1m', label: '$750,000 - $1,000,000', icon: 'cash-outline' },
    { id: '1m-2m', label: '$1,000,000 - $2,000,000', icon: 'cash-outline' },
    { id: 'over-2m', label: 'Over $2,000,000', icon: 'diamond-outline' },
  ];

  const RENT_OPTIONS = [
    { id: 'under-1500', label: 'Under $1,500/month', icon: 'cash-outline' },
    { id: '1500-2500', label: '$1,500 - $2,500/month', icon: 'cash-outline' },
    { id: '2500-4000', label: '$2,500 - $4,000/month', icon: 'cash-outline' },
    { id: '4000-6000', label: '$4,000 - $6,000/month', icon: 'cash-outline' },
    { id: 'over-6000', label: 'Over $6,000/month', icon: 'diamond-outline' },
  ];

  const OPTIONS = isBuying ? BUY_OPTIONS : RENT_OPTIONS;

  const handleNext = () => {
    if (selected) {
      navigation.navigate('RealtorMatchQ6', { ...route.params, priceRange: selected });
    }
  };

  return (
    <RealtorMatchQuestionScreen
      questionNumber={5}
      totalQuestions={12}
      question="What price range are you considering?"
      subtitle={isBuying ? "Select your budget for purchasing." : "Select your monthly budget."}
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.navigate('RealtorsBrowse')}
      canProceed={!!selected}
    />
  );
}

// Q6: What's the main goal?
export function RealtorMatchQ6Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [selected, setSelected] = useState<string | null>(null);

  const OPTIONS = [
    { id: 'primary', label: 'Primary residence', icon: 'home-outline', sublabel: 'A place to call home' },
    { id: 'investment', label: 'Investment property', icon: 'trending-up-outline', sublabel: 'Generate income or appreciation' },
    { id: 'vacation', label: 'Vacation home', icon: 'sunny-outline', sublabel: 'A getaway property' },
    { id: 'business', label: 'Business use', icon: 'briefcase-outline', sublabel: 'Commercial or office space' },
    { id: 'relocation', label: 'Relocation', icon: 'airplane-outline', sublabel: 'Moving to a new area' },
  ];

  const handleNext = () => {
    if (selected) {
      navigation.navigate('RealtorMatchQ7', { ...route.params, mainGoal: selected });
    }
  };

  return (
    <RealtorMatchQuestionScreen
      questionNumber={6}
      totalQuestions={12}
      question="What's the main goal for this property?"
      subtitle="This helps us understand your priorities."
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.navigate('RealtorsBrowse')}
      canProceed={!!selected}
    />
  );
}

// Q7: What personality in your realtor? (multi-select, max 3)
export function RealtorMatchQ7Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [selected, setSelected] = useState<string[]>([]);

  const OPTIONS = [
    { id: 'aggressive', label: 'Aggressive negotiator', icon: 'shield-outline' },
    { id: 'patient', label: 'Patient & thorough', icon: 'time-outline' },
    { id: 'tech-savvy', label: 'Tech-savvy', icon: 'phone-portrait-outline' },
    { id: 'local-expert', label: 'Local expert', icon: 'map-outline' },
    { id: 'first-time', label: 'Great with first-timers', icon: 'school-outline' },
    { id: 'luxury', label: 'Luxury specialist', icon: 'diamond-outline' },
    { id: 'responsive', label: 'Highly responsive', icon: 'flash-outline' },
    { id: 'analytical', label: 'Data-driven', icon: 'analytics-outline' },
  ];

  const handleSelect = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length < 3) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const handleNext = () => {
    navigation.navigate('RealtorMatchQ8', { ...route.params, realtorPersonality: selected });
  };

  return (
    <RealtorMatchQuestionScreen
      questionNumber={7}
      totalQuestions={12}
      question="What personality do you want in your realtor?"
      subtitle="Select the traits that matter most to you."
      options={OPTIONS}
      selectedValue={selected}
      onSelect={handleSelect}
      multiSelect
      maxSelections={3}
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.navigate('RealtorsBrowse')}
      canProceed={selected.length > 0}
    />
  );
}

// Q8: What language? (multi-select)
export function RealtorMatchQ8Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [selected, setSelected] = useState<string[]>(['english']);

  const OPTIONS = [
    { id: 'english', label: 'English', icon: 'chatbubble-outline' },
    { id: 'spanish', label: 'Spanish', icon: 'chatbubble-outline' },
    { id: 'portuguese', label: 'Portuguese', icon: 'chatbubble-outline' },
    { id: 'mandarin', label: 'Mandarin', icon: 'chatbubble-outline' },
    { id: 'french', label: 'French', icon: 'chatbubble-outline' },
    { id: 'other', label: 'Other', icon: 'globe-outline' },
  ];

  const handleSelect = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleNext = () => {
    navigation.navigate('RealtorMatchQ9', { ...route.params, languages: selected });
  };

  return (
    <RealtorMatchQuestionScreen
      questionNumber={8}
      totalQuestions={12}
      question="What language do you prefer?"
      subtitle="Select all languages you're comfortable with."
      options={OPTIONS}
      selectedValue={selected}
      onSelect={handleSelect}
      multiSelect
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.navigate('RealtorsBrowse')}
      canProceed={selected.length > 0}
    />
  );
}

// Q9: How do you prefer to communicate? (multi-select)
export function RealtorMatchQ9Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [selected, setSelected] = useState<string[]>([]);

  const OPTIONS = [
    { id: 'text', label: 'Text / SMS', icon: 'chatbubble-outline' },
    { id: 'phone', label: 'Phone calls', icon: 'call-outline' },
    { id: 'email', label: 'Email', icon: 'mail-outline' },
    { id: 'video', label: 'Video calls', icon: 'videocam-outline' },
    { id: 'in-person', label: 'In-person meetings', icon: 'people-outline' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
  ];

  const handleSelect = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      return [...prev, id];
    });
  };

  const handleNext = () => {
    navigation.navigate('RealtorMatchQ10', { ...route.params, communicationPrefs: selected });
  };

  return (
    <RealtorMatchQuestionScreen
      questionNumber={9}
      totalQuestions={12}
      question="How do you prefer to communicate?"
      subtitle="Select all that apply."
      options={OPTIONS}
      selectedValue={selected}
      onSelect={handleSelect}
      multiSelect
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.navigate('RealtorsBrowse')}
      canProceed={selected.length > 0}
    />
  );
}

// Q10: How many realtors to connect with?
export function RealtorMatchQ10Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [selected, setSelected] = useState<string | null>(null);

  const OPTIONS = [
    { id: '1', label: 'Just 1', icon: 'person-outline', sublabel: 'I want to focus on one realtor' },
    { id: '2-3', label: '2-3 realtors', icon: 'people-outline', sublabel: 'Compare a few options' },
    { id: 'up-to-5', label: 'Up to 5', icon: 'people-circle-outline', sublabel: 'Maximum options' },
  ];

  const handleNext = () => {
    if (selected) {
      navigation.navigate('RealtorMatchQ11', { ...route.params, realtorCount: selected });
    }
  };

  return (
    <RealtorMatchQuestionScreen
      questionNumber={10}
      totalQuestions={12}
      question="How many realtors would you like to connect with?"
      subtitle="We'll match you with the best options."
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.navigate('RealtorsBrowse')}
      canProceed={!!selected}
    />
  );
}

// Q11: Share contact info?
export function RealtorMatchQ11Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [selected, setSelected] = useState<string | null>(null);

  const OPTIONS = [
    { id: 'yes', label: 'Yes, share my info', icon: 'checkmark-circle-outline', sublabel: 'Realtors can contact me directly' },
    { id: 'no', label: 'No, I\'ll reach out first', icon: 'shield-checkmark-outline', sublabel: 'I\'ll initiate contact when ready' },
  ];

  const handleNext = () => {
    if (selected) {
      navigation.navigate('RealtorMatchQ12', { ...route.params, shareContactInfo: selected === 'yes' });
    }
  };

  return (
    <RealtorMatchQuestionScreen
      questionNumber={11}
      totalQuestions={12}
      question="Would you like to share your contact info with matched realtors?"
      subtitle="This allows realtors to reach out to you directly."
      options={OPTIONS}
      selectedValue={selected}
      onSelect={setSelected}
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.navigate('RealtorsBrowse')}
      canProceed={!!selected}
    />
  );
}

// Q12: Additional notes (optional)
export function RealtorMatchQ12Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [notes, setNotes] = useState('');

  const handleNext = () => {
    navigation.navigate('RealtorMatchContact', { ...route.params, additionalNotes: notes });
  };

  return (
    <RealtorMatchQuestionScreen
      questionNumber={12}
      totalQuestions={12}
      question="Anything else important to tell your realtor?"
      subtitle="Share any specific needs, preferences, or questions you have. (Optional)"
      textInput
      textValue={notes}
      onTextChange={setNotes}
      textPlaceholder="e.g., I need a home office, pet-friendly building, specific school district..."
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      onClose={() => navigation.navigate('RealtorsBrowse')}
      isOptional
      canProceed={true}
    />
  );
}
