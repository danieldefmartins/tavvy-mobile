/**
 * ProsRequestStep4Screen - Budget Selection (was Step 3)
 * Install path: screens/ProsRequestStep4Screen.tsx
 * 
 * Step 4 of 5: Users select their budget range
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';

type RouteParams = {
  categoryId: string;
  categoryName: string;
  description?: string;
  photos?: string[];
  timeline: string;
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}%</Text>
  </View>
);

export default function ProsRequestStep4Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  
  const { categoryId, categoryName, description, photos, timeline } = route.params;
  
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  const budgets = [
    { id: 'under-500', label: 'Under $500', icon: 'cash-outline' },
    { id: '500-1000', label: '$500 - $1,000', icon: 'cash-outline' },
    { id: '1000-5000', label: '$1,000 - $5,000', icon: 'wallet-outline' },
    { id: '5000-10000', label: '$5,000 - $10,000', icon: 'wallet-outline' },
    { id: 'over-10000', label: 'Over $10,000', icon: 'card-outline' },
    { id: 'not-sure', label: 'Not sure yet', icon: 'help-circle-outline' },
  ];

  const handleNext = () => {
    if (!selectedBudget) return;
    
    navigation.navigate('ProsRequestStep5', {
      categoryId,
      categoryName,
      description,
      photos,
      timeline,
      budget: selectedBudget,
    });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.progressWrapper}>
        <ProgressBar progress={80} />
        <Text style={styles.stepText}>Step 4 of 5</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>What's your budget?</Text>
        <Text style={styles.subtext}>This helps pros give you accurate quotes</Text>

        <View style={styles.budgetGrid}>
          {budgets.map((budget) => (
            <TouchableOpacity
              key={budget.id}
              style={[
                styles.budgetCard,
                selectedBudget === budget.id && styles.budgetCardSelected,
              ]}
              onPress={() => setSelectedBudget(budget.id)}
            >
              <Ionicons
                name={budget.icon as any}
                size={24}
                color={selectedBudget === budget.id ? ProsColors.primary : '#6B7280'}
              />
              <Text
                style={[
                  styles.budgetLabel,
                  selectedBudget === budget.id && styles.budgetLabelSelected,
                ]}
              >
                {budget.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedBudget && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedBudget}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
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
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  progressWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ProsColors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
    width: 40,
    textAlign: 'right',
  },
  stepText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  budgetCard: {
    width: '47%',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  budgetCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: '#EFF6FF',
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  budgetLabelSelected: {
    color: ProsColors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: ProsColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
