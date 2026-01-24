/**
 * RealtorMatchQuestionScreen.tsx
 * Install path: components/RealtorMatchQuestionScreen.tsx
 * 
 * Reusable question screen component for the Smart Realtor Match flow.
 * Supports single choice, multi-choice, and text input question types.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const RealtorColors = {
  primary: '#1E3A5F',
  secondary: '#C9A227',
  background: '#F8F9FA',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  success: '#10B981',
};

interface Option {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string;
}

interface QuestionScreenProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  subtitle?: string;
  options?: Option[];
  selectedValue?: string | string[] | null;
  onSelect?: (value: string) => void;
  multiSelect?: boolean;
  maxSelections?: number;
  textInput?: boolean;
  textValue?: string;
  onTextChange?: (text: string) => void;
  textPlaceholder?: string;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  canProceed?: boolean;
  isOptional?: boolean;
}

export default function RealtorMatchQuestionScreen({
  questionNumber,
  totalQuestions,
  question,
  subtitle,
  options,
  selectedValue,
  onSelect,
  multiSelect = false,
  maxSelections,
  textInput = false,
  textValue = '',
  onTextChange,
  textPlaceholder,
  onNext,
  onBack,
  onClose,
  canProceed = true,
  isOptional = false,
}: QuestionScreenProps) {
  const progress = (questionNumber / totalQuestions) * 100;

  const isSelected = (optionId: string): boolean => {
    if (multiSelect && Array.isArray(selectedValue)) {
      return selectedValue.includes(optionId);
    }
    return selectedValue === optionId;
  };

  const handleOptionPress = (optionId: string) => {
    if (onSelect) {
      onSelect(optionId);
    }
  };

  const getSelectionCount = (): number => {
    if (Array.isArray(selectedValue)) {
      return selectedValue.length;
    }
    return 0;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color={RealtorColors.text} />
          </TouchableOpacity>
          <Text style={styles.stepText}>
            {questionNumber} of {totalQuestions}
          </Text>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={RealtorColors.text} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <KeyboardAvoidingView 
          style={styles.contentContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Question */}
            <Text style={styles.question}>{question}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

            {/* Multi-select hint */}
            {multiSelect && maxSelections && (
              <Text style={styles.selectionHint}>
                Select up to {maxSelections} ({getSelectionCount()}/{maxSelections} selected)
              </Text>
            )}

            {/* Options */}
            {options && options.length > 0 && (
              <View style={styles.optionsContainer}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionButton,
                      isSelected(option.id) && styles.optionButtonSelected,
                    ]}
                    onPress={() => handleOptionPress(option.id)}
                    activeOpacity={0.7}
                  >
                    {option.icon && (
                      <View style={[
                        styles.optionIcon,
                        isSelected(option.id) && styles.optionIconSelected,
                      ]}>
                        <Ionicons 
                          name={option.icon as any} 
                          size={24} 
                          color={isSelected(option.id) ? '#FFFFFF' : RealtorColors.primary} 
                        />
                      </View>
                    )}
                    <View style={styles.optionTextContainer}>
                      <Text style={[
                        styles.optionLabel,
                        isSelected(option.id) && styles.optionLabelSelected,
                      ]}>
                        {option.label}
                      </Text>
                      {option.sublabel && (
                        <Text style={styles.optionSublabel}>{option.sublabel}</Text>
                      )}
                    </View>
                    <View style={[
                      styles.checkCircle,
                      isSelected(option.id) && styles.checkCircleSelected,
                    ]}>
                      {isSelected(option.id) && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Text Input */}
            {textInput && (
              <View style={styles.textInputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={textValue}
                  onChangeText={onTextChange}
                  placeholder={textPlaceholder}
                  placeholderTextColor={RealtorColors.textMuted}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            )}
          </ScrollView>

          {/* Bottom Buttons */}
          <View style={styles.bottomContainer}>
            {isOptional && (
              <TouchableOpacity style={styles.skipButton} onPress={onNext}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextButton,
                !canProceed && styles.nextButtonDisabled,
              ]}
              onPress={onNext}
              disabled={!canProceed && !isOptional}
            >
              <Text style={[
                styles.nextButtonText,
                !canProceed && styles.nextButtonTextDisabled,
              ]}>
                {questionNumber === totalQuestions ? 'Finish' : 'Continue'}
              </Text>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={canProceed ? '#FFFFFF' : RealtorColors.textMuted} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RealtorColors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: RealtorColors.textLight,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  progressBackground: {
    height: 4,
    backgroundColor: RealtorColors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: RealtorColors.primary,
    borderRadius: 2,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  question: {
    fontSize: 26,
    fontWeight: '700',
    color: RealtorColors.text,
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: RealtorColors.textLight,
    marginBottom: 24,
    lineHeight: 22,
  },
  selectionHint: {
    fontSize: 13,
    color: RealtorColors.secondary,
    fontWeight: '500',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: RealtorColors.border,
  },
  optionButtonSelected: {
    borderColor: RealtorColors.primary,
    backgroundColor: '#F0F4FF',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIconSelected: {
    backgroundColor: RealtorColors.primary,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: RealtorColors.text,
  },
  optionLabelSelected: {
    color: RealtorColors.primary,
  },
  optionSublabel: {
    fontSize: 13,
    color: RealtorColors.textMuted,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: RealtorColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: RealtorColors.primary,
    borderColor: RealtorColors.primary,
  },
  textInputContainer: {
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: RealtorColors.text,
    minHeight: 120,
    borderWidth: 2,
    borderColor: RealtorColors.border,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: RealtorColors.textMuted,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RealtorColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: RealtorColors.border,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: RealtorColors.textMuted,
  },
});
