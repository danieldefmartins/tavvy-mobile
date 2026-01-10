/**
 * Pros Request Step 1 Screen
 * Install path: screens/ProsRequestStep1Screen.tsx
 * 
 * Step 1 of 4: What do you need help with?
 * Simple, one-question-per-screen approach with progress indicator.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';

import { ProsColors } from '../constants/ProsConfig';

type RouteParams = {
  ProsRequestStep1Screen: {
    proId?: number;
    proName?: string;
    categoryId?: number;
    categoryName?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

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

export default function ProsRequestStep1Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsRequestStep1Screen'>>();
  const { proId, proName, categoryId, categoryName } = route.params || {};

  const [projectTitle, setProjectTitle] = useState('');

  const isValid = projectTitle.trim().length > 0;

  const handleNext = () => {
    navigation.navigate('ProsRequestStep2Screen', {
      proId,
      proName,
      categoryId,
      categoryName,
      projectTitle: projectTitle.trim(),
    });
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={ProsColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Progress Indicator */}
          <ProgressCircle percentage={25} />
          <Text style={styles.stepText}>Step 1 of 4</Text>

          {/* Question */}
          <Text style={styles.questionText}>
            What do you need{'\n'}help with?
          </Text>

          {/* Input */}
          <TextInput
            style={styles.input}
            placeholder="e.g., Install ceiling fan"
            placeholderTextColor={ProsColors.textMuted}
            value={projectTitle}
            onChangeText={setProjectTitle}
            autoFocus
            returnKeyType="next"
            onSubmitEditing={isValid ? handleNext : undefined}
          />

          {/* Category hint if provided */}
          {categoryName && (
            <View style={styles.categoryHint}>
              <Ionicons name="pricetag-outline" size={16} color={ProsColors.primary} />
              <Text style={styles.categoryHintText}>Category: {categoryName}</Text>
            </View>
          )}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    alignSelf: 'flex-start',
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
  },
  questionText: {
    fontSize: 28,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    lineHeight: 36,
    marginBottom: 32,
  },
  input: {
    fontSize: 16,
    color: ProsColors.textPrimary,
    borderWidth: 1,
    borderColor: ProsColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  categoryHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${ProsColors.primary}10`,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  categoryHintText: {
    fontSize: 14,
    color: ProsColors.primary,
    marginLeft: 6,
    fontWeight: '500',
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
