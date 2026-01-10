/**
 * Pros Request Step 2 Screen (FIXED - No react-native-svg dependency)
 * Install path: screens/ProsRequestStep2Screen.tsx
 * 
 * Step 2 of the multi-step service request form.
 * Asks: "When do you need this done?"
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
  ProsRequestStep2Screen: {
    categoryId: string;
    categoryName: string;
    projectDescription?: string;
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

// Timeline options
const TIMELINE_OPTIONS = [
  {
    id: 'emergency',
    title: 'Emergency',
    subtitle: 'I need help ASAP',
    icon: 'alert-circle',
    iconColor: '#EF4444',
  },
  {
    id: 'within_days',
    title: 'Within a few days',
    subtitle: 'Flexible but soon',
    icon: 'time',
    iconColor: '#F59E0B',
  },
  {
    id: 'within_week',
    title: 'Within 1 week',
    subtitle: 'No rush, but this week',
    icon: 'calendar',
    iconColor: ProsColors.primary,
  },
  {
    id: 'within_month',
    title: 'Within 1 month',
    subtitle: 'Planning ahead',
    icon: 'calendar-outline',
    iconColor: '#10B981',
  },
  {
    id: 'flexible',
    title: 'I\'m flexible',
    subtitle: 'Whenever works best',
    icon: 'infinite',
    iconColor: '#6B7280',
  },
];

export default function ProsRequestStep2Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsRequestStep2Screen'>>();
  const { categoryId, categoryName, projectDescription } = route.params;

  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);

  const progress = 50; // Step 2 of 4 = 50%

  const handleTimelineSelect = (timelineId: string) => {
    setSelectedTimeline(timelineId);
  };

  const handleContinue = () => {
    if (!selectedTimeline) return;

    const timelineName = TIMELINE_OPTIONS.find(t => t.id === selectedTimeline)?.title;

    navigation.navigate('ProsRequestStep3Screen', {
      categoryId,
      categoryName,
      projectDescription,
      timeline: selectedTimeline,
      timelineName,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const isValid = selectedTimeline !== null;

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
        <ProgressIndicator progress={progress} step={2} totalSteps={4} />

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <Ionicons name="construct" size={14} color={ProsColors.primary} />
          <Text style={styles.categoryBadgeText}>{categoryName}</Text>
        </View>

        {/* Question */}
        <Text style={styles.questionTitle}>When do you need this done?</Text>
        <Text style={styles.questionSubtitle}>
          This helps pros understand your urgency.
        </Text>

        {/* Timeline Options */}
        <View style={styles.optionsContainer}>
          {TIMELINE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedTimeline === option.id && styles.optionCardSelected,
              ]}
              onPress={() => handleTimelineSelect(option.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${option.iconColor}15` }]}>
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={option.iconColor}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionTitle,
                  selectedTimeline === option.id && styles.optionTitleSelected,
                ]}>
                  {option.title}
                </Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              <View style={[
                styles.radioButton,
                selectedTimeline === option.id && styles.radioButtonSelected,
              ]}>
                {selectedTimeline === option.id && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
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
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: `${ProsColors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 16,
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
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
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: `${ProsColors.primary}05`,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 2,
  },
  optionTitleSelected: {
    color: ProsColors.primary,
  },
  optionSubtitle: {
    fontSize: 13,
    color: ProsColors.textSecondary,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: ProsColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: ProsColors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ProsColors.primary,
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
