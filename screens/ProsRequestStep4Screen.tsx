/**
 * Pros Request Step 4 Screen (FIXED - No react-native-svg dependency)
 * Install path: screens/ProsRequestStep4Screen.tsx
 * 
 * Step 4 of the multi-step service request form.
 * Final step: Select number of pros and submit.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors } from '../constants/ProsConfig';

const { width } = Dimensions.get('window');

type RouteParams = {
  ProsRequestStep4Screen: {
    categoryId: string;
    categoryName: string;
    projectDescription?: string;
    timeline: string;
    timelineName: string;
    budget: string;
    budgetName: string;
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

// Number of pros options
const PROS_COUNT_OPTIONS = [1, 2, 3, 4, 5];

export default function ProsRequestStep4Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsRequestStep4Screen'>>();
  const { 
    categoryId, 
    categoryName, 
    projectDescription, 
    timeline, 
    timelineName, 
    budget, 
    budgetName 
  } = route.params;

  const [selectedProsCount, setSelectedProsCount] = useState<number>(3);
  const [loading, setLoading] = useState(false);

  const progress = 100; // Step 4 of 4 = 100%

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      // await submitServiceRequest({
      //   categoryId,
      //   categoryName,
      //   projectDescription,
      //   timeline,
      //   budget,
      //   prosCount: selectedProsCount,
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Request Submitted!',
        `We're reaching out to ${selectedProsCount} pros in your area. You'll receive responses soon!`,
        [
          {
            text: 'Track My Request',
            onPress: () => navigation.navigate('ProsProjectStatusScreen', {
              projectId: Date.now(),
              projectTitle: `${categoryName} Project`,
            }),
          },
          {
            text: 'Done',
            onPress: () => navigation.navigate('ProsHomeScreen'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

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
        <ProgressIndicator progress={progress} step={4} totalSteps={4} />

        {/* Question */}
        <Text style={styles.questionTitle}>Almost done!</Text>
        <Text style={styles.questionSubtitle}>
          How many pros would you like to hear from?
        </Text>

        {/* Pros Count Selector */}
        <View style={styles.prosCountContainer}>
          {PROS_COUNT_OPTIONS.map((count) => (
            <TouchableOpacity
              key={count}
              style={[
                styles.prosCountButton,
                selectedProsCount === count && styles.prosCountButtonSelected,
              ]}
              onPress={() => setSelectedProsCount(count)}
            >
              <Text style={[
                styles.prosCountText,
                selectedProsCount === count && styles.prosCountTextSelected,
              ]}>
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.prosCountHint}>
          We recommend 3 pros for the best comparison.
        </Text>

        {/* Request Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Request Summary</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="construct" size={18} color={ProsColors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>{categoryName}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="time" size={18} color={ProsColors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Timeline</Text>
              <Text style={styles.summaryValue}>{timelineName}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryIcon}>
              <Ionicons name="cash" size={18} color={ProsColors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Budget</Text>
              <Text style={styles.summaryValue}>{budgetName}</Text>
            </View>
          </View>

          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <View style={styles.summaryIcon}>
              <Ionicons name="people" size={18} color={ProsColors.primary} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Pros to contact</Text>
              <Text style={styles.summaryValue}>{selectedProsCount} pros</Text>
            </View>
          </View>

          {projectDescription && (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionLabel}>Project Details</Text>
              <Text style={styles.descriptionText}>{projectDescription}</Text>
            </View>
          )}
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="shield-checkmark" size={18} color={ProsColors.primary} />
          <Text style={styles.infoNoteText}>
            Your contact info is only shared with pros you choose to connect with.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

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
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
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
  prosCountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  prosCountButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  prosCountButtonSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: ProsColors.primary,
  },
  prosCountText: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  prosCountTextSelected: {
    color: '#FFFFFF',
  },
  prosCountHint: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${ProsColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  descriptionBox: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: ProsColors.borderLight,
  },
  descriptionLabel: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: ProsColors.textPrimary,
    lineHeight: 20,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${ProsColors.primary}10`,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: ProsColors.textPrimary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: ProsColors.borderLight,
    backgroundColor: '#FFFFFF',
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
