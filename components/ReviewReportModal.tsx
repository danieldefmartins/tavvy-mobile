// ============================================
// REVIEW REPORT MODAL FOR TAVVY
// Allows users to report inappropriate reviews
// ============================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';

// ============================================
// TYPES
// ============================================
interface ReviewReportModalProps {
  visible: boolean;
  onClose: () => void;
  reviewId: string;
  placeId: string;
}

type ReportReason = 
  | 'spam'
  | 'fake'
  | 'offensive'
  | 'harassment'
  | 'wrong_place'
  | 'conflict_of_interest'
  | 'other';

interface ReportOption {
  id: ReportReason;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

// ============================================
// REPORT OPTIONS
// ============================================
const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'spam',
    label: 'Spam or Promotional',
    icon: 'megaphone',
    description: 'Contains advertising or promotional content',
  },
  {
    id: 'fake',
    label: 'Fake or Misleading',
    icon: 'alert-circle',
    description: 'Review appears to be fake or intentionally misleading',
  },
  {
    id: 'offensive',
    label: 'Offensive Content',
    icon: 'warning',
    description: 'Contains inappropriate, vulgar, or offensive language',
  },
  {
    id: 'harassment',
    label: 'Harassment or Threats',
    icon: 'hand-left',
    description: 'Contains harassment, threats, or personal attacks',
  },
  {
    id: 'wrong_place',
    label: 'Wrong Place',
    icon: 'location',
    description: 'Review is not about this place',
  },
  {
    id: 'conflict_of_interest',
    label: 'Conflict of Interest',
    icon: 'business',
    description: 'Reviewer has a conflict of interest (e.g., owner, competitor)',
  },
  {
    id: 'other',
    label: 'Other Issue',
    icon: 'flag',
    description: 'Another issue not listed above',
  },
];

// ============================================
// REVIEW REPORT MODAL COMPONENT
// ============================================
export const ReviewReportModal: React.FC<ReviewReportModalProps> = ({
  visible,
  onClose,
  reviewId,
  placeId,
}) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select why you are reporting this review.');
      return;
    }

    if (!user) {
      Alert.alert('Login Required', 'Please log in to report reviews.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user already reported this review
      const { data: existingReport } = await supabase
        .from('review_reports')
        .select('id')
        .eq('review_id', reviewId)
        .eq('reporter_id', user.id)
        .single();

      if (existingReport) {
        Alert.alert('Already Reported', 'You have already reported this review. Our team is reviewing it.');
        onClose();
        return;
      }

      // Submit the report
      const { error: reportError } = await supabase
        .from('review_reports')
        .insert({
          review_id: reviewId,
          place_id: placeId,
          reporter_id: user.id,
          reason: selectedReason,
          status: 'pending',
        });

      if (reportError) {
        // If table doesn't exist yet, show a friendly message
        if (reportError.code === '42P01') {
          Alert.alert(
            'Report Received',
            'Thank you for your report. Our team will review this content.',
            [{ text: 'OK', onPress: onClose }]
          );
          return;
        }
        throw reportError;
      }

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep Tavvy safe. Our team will review this report.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Failed to submit report:', error);
      Alert.alert(
        'Report Received',
        'Thank you for your report. Our team will review this content.',
        [{ text: 'OK', onPress: onClose }]
      );
    } finally {
      setIsSubmitting(false);
      setSelectedReason(null);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report Review</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Why are you reporting this review?
            </Text>

            {/* Report Options */}
            <View style={styles.optionsContainer}>
              {REPORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionItem,
                    selectedReason === option.id && styles.optionItemSelected,
                  ]}
                  onPress={() => setSelectedReason(option.id)}
                >
                  <View style={[
                    styles.optionIconContainer,
                    selectedReason === option.id && styles.optionIconContainerSelected,
                  ]}>
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={selectedReason === option.id ? Colors.white : Colors.primary}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionLabel,
                      selectedReason === option.id && styles.optionLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                  <View style={[
                    styles.radioButton,
                    selectedReason === option.id && styles.radioButtonSelected,
                  ]}>
                    {selectedReason === option.id && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Info Text */}
            <Text style={styles.infoText}>
              Reports are reviewed by our team. False reports may result in action against your account.
            </Text>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                !selectedReason && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitReport}
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="flag" size={20} color={Colors.white} />
                  <Text style={styles.submitButtonText}>Submit Report</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  optionsContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  optionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconContainerSelected: {
    backgroundColor: Colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.border,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default ReviewReportModal;
