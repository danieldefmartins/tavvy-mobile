/**
 * Pros Request Step 3 Screen (FIXED - No react-native-svg dependency)
 * Install path: screens/ProsRequestStep3Screen.tsx
 * 
 * Step 3 of the multi-step service request form.
 * Asks: "What's your budget?"
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors } from '../constants/ProsConfig';

const { width } = Dimensions.get('window');

type RouteParams = {
  ProsRequestStep3Screen: {
    categoryId: string;
    categoryName: string;
    projectDescription?: string;
    timeline: string;
    timelineName: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

// Progress indicator component using basic React Native views
const ProgressIndicator = ({ progress, step, totalSteps }: { progress: number; step: number; totalSteps: number }) => {
  const size = 80;
  const strokeWidth = 6;
  
  return (
    <View style={progressStyles.container}>
      {/* Background circle */}
      <View style={[progressStyles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        {/* Progress arc - simulated with a border */}
        <View style={[
          progressStyles.progressCircle, 
          { 
            width: size - 4, 
            height: size - 4, 
            borderRadius: (size - 4) / 2,
            borderWidth: strokeWidth,
            borderColor: ProsColors.primary,
            borderTopColor: progress >= 25 ? ProsColors.primary : ProsColors.border,
            borderRightColor: progress >= 50 ? ProsColors.primary : ProsColors.border,
            borderBottomColor: progress >= 75 ? ProsColors.primary : ProsColors.border,
            borderLeftColor: progress >= 100 ? ProsColors.primary : ProsColors.border,
          }
        ]} />
        {/* Center content */}
        <View style={progressStyles.centerContent}>
          <Text style={progressStyles.percentText}>{progress}%</Text>
        </View>
      </View>
      <Text style={progressStyles.stepText}>Step {step} of {totalSteps}</Text>
    </View>
  );
};

const progressStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
  },
  progressCircle: {
    position: 'absolute',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 18,
    fontWeight: '700',
    color: ProsColors.primary,
  },
  stepText: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginTop: 8,
  },
});

// Budget options
const BUDGET_OPTIONS = [
  {
    id: 'under_500',
    title: 'Under $500',
    subtitle: 'Small projects',
  },
  {
    id: '500_1000',
    title: '$500 - $1,000',
    subtitle: 'Medium projects',
  },
  {
    id: '1000_2500',
    title: '$1,000 - $2,500',
    subtitle: 'Larger projects',
  },
  {
    id: '2500_5000',
    title: '$2,500 - $5,000',
    subtitle: 'Major projects',
  },
  {
    id: 'over_5000',
    title: 'Over $5,000',
    subtitle: 'Large-scale work',
  },
  {
    id: 'not_sure',
    title: 'Not sure yet',
    subtitle: 'Need quotes to decide',
  },
];

export default function ProsRequestStep3Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsRequestStep3Screen'>>();
  const { categoryId, categoryName, projectDescription, timeline, timelineName } = route.params;

  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  const progress = 75; // Step 3 of 4 = 75%

  const handleBudgetSelect = (budgetId: string) => {
    setSelectedBudget(budgetId);
  };

  const handleContinue = () => {
    if (!selectedBudget) return;

    const budgetName = BUDGET_OPTIONS.find(b => b.id === selectedBudget)?.title;

    navigation.navigate('ProsRequestStep4Screen', {
      categoryId,
      categoryName,
      projectDescription,
      timeline,
      timelineName,
      budget: selectedBudget,
      budgetName,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isValid = selectedBudget !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <ProgressIndicator progress={progress} step={3} totalSteps={4} />

        {/* Summary Badges */}
        <View style={styles.summaryBadges}>
          <View style={styles.summaryBadge}>
            <Ionicons name="construct" size={12} color={ProsColors.primary} />
            <Text style={styles.summaryBadgeText}>{categoryName}</Text>
          </View>
          <View style={styles.summaryBadge}>
            <Ionicons name="time" size={12} color={ProsColors.primary} />
            <Text style={styles.summaryBadgeText}>{timelineName}</Text>
          </View>
        </View>

        {/* Question */}
        <Text style={styles.questionTitle}>What's your budget?</Text>
        <Text style={styles.questionSubtitle}>
          This helps pros give you accurate quotes.
        </Text>

        {/* Budget Options Grid */}
        <View style={styles.budgetGrid}>
          {BUDGET_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.budgetCard,
                selectedBudget === option.id && styles.budgetCardSelected,
              ]}
              onPress={() => handleBudgetSelect(option.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.budgetTitle,
                selectedBudget === option.id && styles.budgetTitleSelected,
              ]}>
                {option.title}
              </Text>
              <Text style={styles.budgetSubtitle}>{option.subtitle}</Text>
              
              {/* Selection indicator */}
              {selectedBudget === option.id && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  summaryBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ProsColors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: ProsColors.primary,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 15,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  budgetCard: {
    width: (width - 52) / 2,
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  budgetCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: `${ProsColors.primary}10`,
  },
  budgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  budgetTitleSelected: {
    color: ProsColors.primary,
  },
  budgetSubtitle: {
    fontSize: 13,
    color: ProsColors.textSecondary,
  },
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ProsColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: ProsColors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: ProsColors.border,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
