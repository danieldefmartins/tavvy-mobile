/**
 * RealtorMatchContext.tsx
 * Install path: contexts/RealtorMatchContext.tsx
 * 
 * Context for managing the Smart Realtor Match questionnaire flow state.
 */
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Question answer types
export interface RealtorMatchAnswers {
  // Q1: What are you looking to do?
  lookingTo: 'buy' | 'sell' | 'rent' | 'lease' | 'invest' | 'exploring' | null;
  
  // Q2: What type of property?
  propertyType: string | null;
  
  // Q3: Where is the property located?
  location: string | null;
  locationDetails?: {
    city?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  };
  
  // Q4: What's your timeline?
  timeline: 'asap' | '1-3months' | '3-6months' | '6-12months' | 'exploring' | null;
  
  // Q5: What price range?
  priceRange: string | null;
  
  // Q6: What's the main goal?
  mainGoal: 'primary' | 'investment' | 'vacation' | 'business' | 'relocation' | null;
  
  // Q7: What personality in your realtor? (multi-select, max 3)
  realtorPersonality: string[];
  
  // Q8: What language? (multi-select)
  languages: string[];
  
  // Q9: How do you prefer to communicate? (multi-select)
  communicationPrefs: string[];
  
  // Q10: How many realtors to connect with?
  realtorCount: '1' | '2-3' | 'up-to-5' | null;
  
  // Q11: Share contact info?
  shareContactInfo: boolean | null;
  
  // Q12: Additional notes
  additionalNotes: string;
  
  // Contact info (collected at end for guests)
  contactInfo: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
}

interface RealtorMatchContextType {
  answers: RealtorMatchAnswers;
  currentStep: number;
  totalSteps: number;
  updateAnswer: <K extends keyof RealtorMatchAnswers>(key: K, value: RealtorMatchAnswers[K]) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetFlow: () => void;
  getProgress: () => number;
}

const initialAnswers: RealtorMatchAnswers = {
  lookingTo: null,
  propertyType: null,
  location: null,
  timeline: null,
  priceRange: null,
  mainGoal: null,
  realtorPersonality: [],
  languages: [],
  communicationPrefs: [],
  realtorCount: null,
  shareContactInfo: null,
  additionalNotes: '',
  contactInfo: {
    name: '',
    phone: '',
    email: '',
    address: '',
  },
};

const RealtorMatchContext = createContext<RealtorMatchContextType | undefined>(undefined);

export function RealtorMatchProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<RealtorMatchAnswers>(initialAnswers);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 12;

  const updateAnswer = <K extends keyof RealtorMatchAnswers>(
    key: K,
    value: RealtorMatchAnswers[K]
  ) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const resetFlow = () => {
    setAnswers(initialAnswers);
    setCurrentStep(1);
  };

  const getProgress = () => {
    return (currentStep / totalSteps) * 100;
  };

  return (
    <RealtorMatchContext.Provider
      value={{
        answers,
        currentStep,
        totalSteps,
        updateAnswer,
        nextStep,
        prevStep,
        goToStep,
        resetFlow,
        getProgress,
      }}
    >
      {children}
    </RealtorMatchContext.Provider>
  );
}

export function useRealtorMatch() {
  const context = useContext(RealtorMatchContext);
  if (context === undefined) {
    throw new Error('useRealtorMatch must be used within a RealtorMatchProvider');
  }
  return context;
}
