/**
 * Pros Request Step 2 Screen
 * Install path: screens/ProsRequestStep2Screen.tsx
 * 
 * Step 2 of 4: When do you need this done?
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
  ProsRequestStep2Screen: {
    proId?: number;
    proName?: string;
    categoryId?: number;
    categoryName?: string;
    projectTitle: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

type TimelineOption = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const TIMELINE_OPTIONS: TimelineOption[] = [
  {
    id: 'asap',
    label: 'ASAP',
    description: 'Get it done as soon as possible',
    icon: 'flash',
  },
  {
    id: 'within_week',
    label: 'Within a week',
    description: 'Schedule it within the next 7 days',
    icon: 'calendar',
  },
  {
    id: 'flexible',
    label: "I'm flexible",
    description: 'No rush, I can wait',
    icon: 'time-outline',
  },
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

export default function ProsRequestStep2Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsRequestStep2Screen'>>();
  const { proId, proName, categoryId, categoryName, projectTitle } = route.params;

  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);

  const isValid = selectedTimeline !== null;

  const handleNext = () => {
    navigation.navigate('ProsRequestStep3Screen', {
      proId,
      proName,
      categoryId,
      categoryName,
      projectTitle,
      timeline: selectedTimeline,
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
        <ProgressCircle percentage={50} />
        <Text style={styles.stepText}>Step 2 of 4</Text>

        {/* Question */}
        <Text style={styles.questionText}>
          When do you need{'\n'}this done?
        </Text>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {TIMELINE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedTimeline === option.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedTimeline(option.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.optionIconContainer,
                selectedTimeline === option.id && styles.optionIconContainerSelected,
              ]}>
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={selectedTimeline === option.id ? ProsColors.primary : ProsColors.textSecondary}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[
                  styles.optionLabel,
                  selectedTimeline === option.id && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              {selectedTimeline === option.id && (
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={ProsColors.primary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
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
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ProsColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: `${ProsColors.primary}05`,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconContainerSelected: {
    backgroundColor: `${ProsColors.primary}15`,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: ProsColors.primary,
  },
  optionDescription: {
    fontSize: 13,
    color: ProsColors.textSecondary,
  },
  checkmarkContainer: {
    marginLeft: 8,
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
