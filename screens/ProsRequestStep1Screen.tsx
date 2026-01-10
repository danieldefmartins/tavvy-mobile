/**
 * Pros Request Step 1 Screen (FIXED - No react-native-svg dependency)
 * Install path: screens/ProsRequestStep1Screen.tsx
 * 
 * Step 1 of the multi-step service request form.
 * Asks: "What do you need help with?"
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
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
  ProsRequestStep1Screen: {
    categoryId?: string;
    categoryName?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

// Progress indicator component using basic React Native views
const ProgressIndicator = ({ progress, step, totalSteps }: { progress: number; step: number; totalSteps: number }) => {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
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

// Common service categories
const SERVICE_CATEGORIES = [
  { id: 'electrical', name: 'Electrical', icon: 'flash' },
  { id: 'plumbing', name: 'Plumbing', icon: 'water' },
  { id: 'hvac', name: 'HVAC', icon: 'thermometer' },
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles' },
  { id: 'landscaping', name: 'Landscaping', icon: 'leaf' },
  { id: 'painting', name: 'Painting', icon: 'color-palette' },
  { id: 'roofing', name: 'Roofing', icon: 'home' },
  { id: 'flooring', name: 'Flooring', icon: 'layers' },
  { id: 'remodeling', name: 'Remodeling', icon: 'construct' },
  { id: 'moving', name: 'Moving', icon: 'cube' },
  { id: 'pest_control', name: 'Pest Control', icon: 'bug' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
];

export default function ProsRequestStep1Screen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsRequestStep1Screen'>>();
  const { categoryId: preselectedCategory, categoryName: preselectedCategoryName } = route.params || {};

  const [selectedCategory, setSelectedCategory] = useState<string | null>(preselectedCategory || null);
  const [projectDescription, setProjectDescription] = useState('');

  const progress = 25; // Step 1 of 4 = 25%

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleContinue = () => {
    if (!selectedCategory) return;

    const categoryName = SERVICE_CATEGORIES.find(c => c.id === selectedCategory)?.name || preselectedCategoryName;

    navigation.navigate('ProsRequestStep2Screen', {
      categoryId: selectedCategory,
      categoryName,
      projectDescription,
    });
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const isValid = selectedCategory !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={ProsColors.textPrimary} />
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
        <ProgressIndicator progress={progress} step={1} totalSteps={4} />

        {/* Question */}
        <Text style={styles.questionTitle}>What do you need help with?</Text>
        <Text style={styles.questionSubtitle}>
          Select a category that best describes your project.
        </Text>

        {/* Category Grid */}
        <View style={styles.categoryGrid}>
          {SERVICE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.categoryCardSelected,
              ]}
              onPress={() => handleCategorySelect(category.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.categoryIcon,
                selectedCategory === category.id && styles.categoryIconSelected,
              ]}>
                <Ionicons
                  name={category.icon as any}
                  size={24}
                  color={selectedCategory === category.id ? '#FFFFFF' : ProsColors.textSecondary}
                />
              </View>
              <Text style={[
                styles.categoryName,
                selectedCategory === category.id && styles.categoryNameSelected,
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Project Description (Optional) */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionLabel}>
            Briefly describe your project <Text style={styles.optionalText}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="e.g., Need to install 3 ceiling fans in bedrooms..."
            placeholderTextColor={ProsColors.textMuted}
            value={projectDescription}
            onChangeText={setProjectDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
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
  closeButton: {
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCard: {
    width: (width - 52) / 3,
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: `${ProsColors.primary}10`,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconSelected: {
    backgroundColor: ProsColors.primary,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: ProsColors.textSecondary,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: ProsColors.primary,
    fontWeight: '600',
  },
  descriptionSection: {
    marginTop: 24,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  optionalText: {
    fontWeight: '400',
    color: ProsColors.textMuted,
  },
  descriptionInput: {
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: ProsColors.textPrimary,
    minHeight: 80,
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
