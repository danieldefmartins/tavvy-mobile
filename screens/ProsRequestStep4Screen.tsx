/**
 * Pros Request Step 4 Screen
 * Install path: screens/ProsRequestStep4Screen.tsx
 * 
 * Step 4 of 4: How many pros should we contact? + Submit
 * Final step with summary and submission.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';

import { ProsColors } from '../constants/ProsConfig';
import { useProsLeads } from '../hooks/usePros';

type RouteParams = {
  ProsRequestStep4Screen: {
    proId?: number;
    proName?: string;
    categoryId?: number;
    categoryName?: string;
    projectTitle: string;
    timeline: string;
    budget: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

const PRO_COUNT_OPTIONS = [1, 3, 5];

// Helper to convert timeline ID to display text
const getTimelineLabel = (timeline: string): string => {
  switch (timeline) {
    case 'asap': return 'ASAP';
    case 'within_week': return 'Within 1 week';
    case 'flexible': return 'Flexible';
    default: return timeline;
  }
};

// Helper to convert budget ID to display text
const getBudgetLabel = (budget: string): string => {
  switch (budget) {
    case 'under_500': return 'Under $500';
    case '500_1000': return '$500 - $1,000';
    case '1000_2500': return '$1,000 - $2,500';
    case '2500_plus': return '$2,500+';
    case 'not_sure': return 'Not sure yet';
    default: return budget;
  }
};

// Progress Circle Component with Checkmark
const ProgressCircleComplete = () => {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  return (
    <View style={styles.progressContainer}>
      <Svg width={size} height={size}>
        {/* Full circle */}
        <Circle
          stroke={ProsColors.primary}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
      </Svg>
      <View style={styles.progressTextContainer}>
        <Ionicons name="checkmark" size={32} color={ProsColors.primary} />
      </View>
    </View>
  );
};

export default function ProsRequestStep4Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsRequestStep4Screen'>>();
  const { proId, proName, categoryId, categoryName, projectTitle, timeline, budget } = route.params;

  const { createLead, loading } = useProsLeads();
  const [selectedProCount, setSelectedProCount] = useState<number>(3);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.navigate('ProsHomeScreen');
  };

  const handleSubmit = async () => {
    try {
      await createLead({
        providerId: proId || 0,
        categoryId: categoryId || undefined,
        title: projectTitle,
        description: `Timeline: ${getTimelineLabel(timeline)}, Budget: ${getBudgetLabel(budget)}, Pros requested: ${selectedProCount}`,
        budget: getBudgetLabel(budget),
      });

      Alert.alert(
        '🎉 Request Submitted!',
        `We're finding ${selectedProCount} pros for your project. You'll be notified when they respond.`,
        [
          {
            text: 'View My Project',
            onPress: () => navigation.navigate('ProsProjectStatusScreen', { projectTitle }),
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('ProsHomeScreen'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit your request. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={ProsColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TavvY <Text style={styles.headerTitleAccent}>Pros</Text></Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={ProsColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Progress Indicator - Complete */}
        <ProgressCircleComplete />
        <Text style={styles.stepText}>Step 4 of 4</Text>

        {/* Question */}
        <Text style={styles.questionText}>
          How many pros should{'\n'}we contact?
        </Text>

        {/* Pro Count Selector */}
        <View style={styles.proCountContainer}>
          {PRO_COUNT_OPTIONS.map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.proCountButton,
                selectedProCount === count && styles.proCountButtonSelected,
              ]}
              onPress={() => setSelectedProCount(count)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.proCountText,
                selectedProCount === count && styles.proCountTextSelected,
              ]}>
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Helper text */}
        <Text style={styles.helperText}>
          We'll keep inviting pros until this many respond to you
        </Text>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Request Summary</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryDot} />
            <Text style={styles.summaryLabel}>Project Name</Text>
            <Text style={styles.summaryValue}>{projectTitle}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryDot} />
            <Text style={styles.summaryLabel}>Timeline</Text>
            <Text style={styles.summaryValue}>{getTimelineLabel(timeline)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryDot} />
            <Text style={styles.summaryLabel}>Budget</Text>
            <Text style={styles.summaryValue}>{getBudgetLabel(budget)}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Request</Text>
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </>
          )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  headerTitleAccent: {
    color: ProsColors.primary,
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
    marginBottom: 8,
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
  stepText: {
    fontSize: 14,
    color: ProsColors.primary,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  questionText: {
    fontSize: 26,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    lineHeight: 34,
    marginBottom: 24,
    textAlign: 'center',
  },
  proCountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  proCountButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: ProsColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  proCountButtonSelected: {
    backgroundColor: ProsColors.primary,
  },
  proCountText: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.primary,
  },
  proCountTextSelected: {
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: ProsColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ProsColors.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ProsColors.primary,
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    width: 100,
  },
  summaryValue: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: ProsColors.border,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
