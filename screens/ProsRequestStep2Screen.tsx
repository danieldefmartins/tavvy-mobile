/**
 * ProsRequestStep2Screen - Dynamic Category-Specific Questions
 * Install path: screens/ProsRequestStep2Screen.tsx
 * 
 * Step 4 of 7: Users answer specific questions tailored to their selected category
 * Fetches questions from Supabase service_category_questions table
 * Implements two-tier logic: Tier 1 (Service Branch) -> Tier 2 (Technical Details)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
import { useProsServiceQuestions, ServiceQuestion } from '../hooks/useProsServiceQuestions';
import { useProsPendingRequests } from '../hooks/useProsPendingRequests';
import { useTranslation } from 'react-i18next';

type RouteParams = {
  customerInfo: {
    fullName: string;
    email: string;
    phone: string;
    privacyPreference: 'share' | 'app_only';
  };
  categoryId: string;
  categoryName: string;
  description?: string;
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}%</Text>
  </View>
);

export default function ProsRequestStep2Screen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  
  const { customerInfo, categoryId, categoryName, description } = route.params;
  
  // Fetch all dynamic questions for this category
  const { data: allQuestions = [], isLoading, error } = useProsServiceQuestions(categoryId);
  const { saveProgress } = useProsPendingRequests();
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Filter questions based on two-tier logic
  const visibleQuestions = useMemo(() => {
    if (allQuestions.length === 0) return [];

    // Tier 1: Questions with no parent
    const tier1Questions = allQuestions.filter(q => !q.parent_question_id);
    
    // Tier 2: Questions whose parent has been answered
    // For simplicity in this implementation, we assume Tier 1 is a single_choice question
    // and Tier 2 questions are linked to that Tier 1 question.
    // In a more complex system, we'd check the specific answer value.
    const tier2Questions = allQuestions.filter(q => {
      if (!q.parent_question_id) return false;
      // Show Tier 2 if its parent has an answer
      return !!answers[q.parent_question_id];
    });

    return [...tier1Questions, ...tier2Questions];
  }, [allQuestions, answers]);

  // If no questions are found for this category, skip to the next step
  useEffect(() => {
    if (!isLoading && allQuestions.length === 0 && !error) {
      handleSkip();
    }
  }, [isLoading, allQuestions, error]);

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = async () => {
    const currentQuestion = visibleQuestions[currentQuestionIndex];
    if (currentQuestion.is_required && !answers[currentQuestion.id]) {
      Alert.alert('Required', 'Please answer this question to continue.');
      return;
    }

    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      await handleFinalNext();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSkip = () => {
    navigation.navigate('ProsRequestStep3', {
      customerInfo,
      categoryId,
      categoryName,
      description,
      dynamicAnswers: answers,
    });
  };

  const handleFinalNext = async () => {
    const formData = {
      customerInfo,
      categoryId,
      categoryName,
      description,
      dynamicAnswers: answers,
    };

    // Auto-save progress
    await saveProgress(categoryId, 2, formData);

    navigation.navigate('ProsRequestStep3', formData);
  };

  const handleClose = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel? Your progress will not be saved.',
      [
        { text: 'Keep Going', onPress: () => {} },
        { text: 'Cancel', onPress: () => navigation.navigate('ProsHome'), style: 'destructive' },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ProsColors.primary} />
          <Text style={styles.loadingText}>Tailoring questions for {categoryName}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (visibleQuestions.length === 0) {
    return null; // Will be handled by useEffect redirect
  }

  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const progress = 57 + Math.round(((currentQuestionIndex + 1) / visibleQuestions.length) * 14);

  const renderQuestionInput = () => {
    switch (currentQuestion.question_type) {
      case 'single_choice':
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionCard,
                  answers[currentQuestion.id] === option && styles.optionCardSelected
                ]}
                onPress={() => handleAnswer(currentQuestion.id, option)}
              >
                <View style={[
                  styles.radioButton,
                  answers[currentQuestion.id] === option && styles.radioButtonSelected
                ]}>
                  {answers[currentQuestion.id] === option && <View style={styles.radioButtonInner} />}
                </View>
                <Text style={[
                  styles.optionText,
                  answers[currentQuestion.id] === option && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 'multiple_choice':
        const currentAnswers = answers[currentQuestion.id] || [];
        return (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option, index) => {
              const isSelected = currentAnswers.includes(option);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected
                  ]}
                  onPress={() => {
                    const newAnswers = isSelected
                      ? currentAnswers.filter((a: string) => a !== option)
                      : [...currentAnswers, option];
                    handleAnswer(currentQuestion.id, newAnswers);
                  }}
                >
                  <View style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            placeholder="Type your answer here..."
            placeholderTextColor="#9CA3AF"
            multiline
            value={answers[currentQuestion.id] || ''}
            onChangeText={(text) => handleAnswer(currentQuestion.id, text)}
          />
        );

      case 'number':
        return (
          <TextInput
            style={styles.textInput}
            placeholder="Enter a number..."
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={answers[currentQuestion.id] || ''}
            onChangeText={(text) => handleAnswer(currentQuestion.id, text)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handlePrevQuestion} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressWrapper}>
          <ProgressBar progress={progress} />
          <Text style={styles.stepText}>Step 4 of 7: Specifics</Text>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.questionText}>{currentQuestion.question_text}</Text>
          {currentQuestion.is_required && <Text style={styles.requiredBadge}>Required</Text>}
          
          <View style={styles.inputWrapper}>
            {renderQuestionInput()}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              currentQuestion.is_required && !answers[currentQuestion.id] && styles.nextButtonDisabled
            ]}
            onPress={handleNextQuestion}
            disabled={currentQuestion.is_required && !answers[currentQuestion.id]}
          >
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex === visibleQuestions.length - 1 ? 'Continue' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          {!currentQuestion.is_required && (
            <TouchableOpacity style={styles.skipButton} onPress={handleNextQuestion}>
              <Text style={styles.skipButtonText}>Skip this question</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  progressWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 12,
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
  },
  stepText: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  requiredBadge: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 24,
  },
  inputWrapper: {
    marginTop: 8,
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  optionCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: '#ECFDF5',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: ProsColors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ProsColors.primary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: ProsColors.primary,
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: ProsColors.primary,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
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
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
