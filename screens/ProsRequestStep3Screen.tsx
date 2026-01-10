/**
 * Pros Request Step 3 Screen
 * Install path: screens/ProsRequestStep3Screen.tsx
 * 
 * Step 3 of 4: What's your budget?
 * Simple, one-question-per-screen approach with progress indicator.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';

import { ProsColors } from '../constants/ProsConfig';

type RouteParams = {
  ProsRequestStep3Screen: {
    proId?: number;
    proName?: string;
    categoryId?: number;
    categoryName?: string;
    projectTitle: string;
    timeline: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

type BudgetOption = {
  id: string;
  label: string;
};

const BUDGET_OPTIONS: BudgetOption[] = [
  { id: 'under_500', label: 'Under $500' },
  { id: '500_1000', label: '$500 - $1,000' },
  { id: '1000_2500', label: '$1,000 - $2,500' },
  { id: '2500_plus', label: '$2,500+' },
  { id: 'not_sure', label: 'Not sure yet' },
];

// Progress Circle Component
const ProgressCircle = ({ percentage }: { percentage: number }) => {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.progressContainer}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          stroke={ProsColors.borderLight}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <Circle
          stroke={ProsColors.primary}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressText}>{percentage}%</Text>
      </View>
    </View>
  );
};

export default function ProsRequestStep3Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsRequestStep3Screen'>>();
  const { proId, proName, categoryId, categoryName, projectTitle, timeline } = route.params;

  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  const isValid = selectedBudget !== null;

  const handleNext = () => {
    navigation.navigate('ProsRequestStep4Screen', {
      proId,
      proName,
      categoryId,
      categoryName,
      projectTitle,
      timeline,
      budget: selectedBudget,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    // Go back to the beginning
    navigation.navigate('ProsHomeScreen');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={ProsColors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={ProsColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Progress Indicator */}
        <ProgressCircle percentage={75} />
        <Text style={styles.stepText}>Step 3 of 4</Text>

        {/* Question */}
        <Text style={styles.questionText}>
          What's your{'\n'}budget?
        </Text>

        {/* Budget Pills */}
        <View style={styles.pillsContainer}>
          {BUDGET_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.budgetPill,
                selectedBudget === option.id && styles.budgetPillSelected,
              ]}
              onPress={() => setSelectedBudget(option.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.budgetPillText,
                selectedBudget === option.id && styles.budgetPillTextSelected,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Helper text */}
        <Text style={styles.helperText}>
          This helps pros give you accurate estimates
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  progressContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.primary,
  },
  stepText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 28,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    lineHeight: 36,
    marginBottom: 32,
    textAlign: 'left',
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  budgetPill: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: ProsColors.primary,
    backgroundColor: '#FFFFFF',
  },
  budgetPillSelected: {
    backgroundColor: ProsColors.primary,
  },
  budgetPillText: {
    fontSize: 15,
    fontWeight: '600',
    color: ProsColors.primary,
  },
  budgetPillTextSelected: {
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginTop: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: ProsColors.border,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
