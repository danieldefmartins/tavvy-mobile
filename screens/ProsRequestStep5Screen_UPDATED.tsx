/**
 * ProsRequestStep5Screen - Review & Submit (UPDATED)
 * Install path: screens/ProsRequestStep5Screen.tsx
 * 
 * Final Step: Users review all collected information and submit the request
 * NEW: Anonymous submission allowed, post-submission signup modal
 * 
 * CHANGES:
 * - Allows submission without authentication
 * - Shows post-submission signup modal
 * - Email/phone NOT shared with pros until user approves
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
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
  description: string;
  dynamicAnswers?: Record<string, any>;
  address?: string;
  city: string;
  state: string;
  zipCode: string;
  timeline: string;
  photos?: string[];
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}%</Text>
  </View>
);

export default function ProsRequestStep5Screen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  
  const { 
    customerInfo, 
    categoryId, 
    categoryName, 
    description, 
    dynamicAnswers,
    address,
    city,
    state,
    zipCode,
    timeline,
    photos = []
  } = route.params;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [submittedProjectId, setSubmittedProjectId] = useState<string | null>(null);
  
  const { createRequest, deleteProgress } = useProsPendingRequests();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Prepare the data for direct database insertion
      // Email/phone are stored but NOT shared with pros yet
      const leadData = {
        categoryId: categoryId,
        title: `${categoryName} Request`,
        description: description,
        customerName: customerInfo.fullName,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        privacyPreference: customerInfo.privacyPreference,
        address: address,
        city: city,
        state: state,
        zipCode: zipCode,
        timeline: timeline,
        dynamicAnswers: dynamicAnswers,
        photoCount: photos.length,
        // NEW: Mark as anonymous submission (not yet approved to share contact)
        isAnonymousSubmission: true,
        contactInfoApproved: false,
      };

      // Call the direct database insertion function
      const lead = await createRequest(leadData as any);

      // Delete pending progress on success
      await deleteProgress(categoryId);

      // Store project ID and show signup modal
      setSubmittedProjectId(lead.id);
      setShowSignupModal(true);

    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Submission Failed', error instanceof Error ? error.message : 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupNow = () => {
    setShowSignupModal(false);
    // Navigate to signup screen
    navigation.navigate('SignUp', {
      email: customerInfo.email,
      projectId: submittedProjectId,
    });
  };

  const handleSkipSignup = () => {
    setShowSignupModal(false);
    // Navigate to project status screen
    navigation.reset({
      index: 0,
      routes: [
        { name: 'ProsHome' },
        { 
          name: 'ProsProjectStatus', 
          params: { 
            projectId: submittedProjectId,
            categoryName,
            timeline,
            city,
            isAnonymous: true,
          } 
        },
      ],
    });
  };

  const handleBack = () => {
    navigation.goBack();
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Submit</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressWrapper}>
        <ProgressBar progress={100} />
        <Text style={styles.stepText}>Final Step: Review</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.question}>Ready to send your request?</Text>
        <Text style={styles.subtext}>Review your details below before submitting to pros.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summarySection}>
            <Text style={styles.sectionLabel}>SERVICE</Text>
            <Text style={styles.sectionValue}>{categoryName}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summarySection}>
            <Text style={styles.sectionLabel}>CUSTOMER INFO</Text>
            <Text style={styles.sectionValue}>{customerInfo.fullName}</Text>
            <Text style={styles.sectionSubValue}>{customerInfo.email}</Text>
            <Text style={styles.sectionSubValue}>{customerInfo.phone}</Text>
            <View style={styles.privacyBadge}>
              <Ionicons 
                name={customerInfo.privacyPreference === 'share' ? 'eye-outline' : 'eye-off-outline'} 
                size={14} 
                color="#6B7280" 
              />
              <Text style={styles.privacyText}>
                {customerInfo.privacyPreference === 'share' ? 'Sharing contact info' : 'Messaging via app only'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.summarySection}>
            <Text style={styles.sectionLabel}>LOCATION & TIMING</Text>
            <Text style={styles.sectionValue}>{city}, {state} {zipCode}</Text>
            <Text style={styles.sectionSubValue}>Timeline: {timeline.replace('_', ' ')}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summarySection}>
            <Text style={styles.sectionLabel}>PROJECT DESCRIPTION</Text>
            <Text style={styles.sectionValue} numberOfLines={4}>{description}</Text>
          </View>

          {dynamicAnswers && Object.keys(dynamicAnswers).length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.summarySection}>
                <Text style={styles.sectionLabel}>SPECIFIC DETAILS</Text>
                {Object.entries(dynamicAnswers).map(([key, value], index) => (
                  <View key={index} style={styles.dynamicAnswerRow}>
                    <Text style={styles.dynamicValue}>• {Array.isArray(value) ? value.join(', ') : value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {photos.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.summarySection}>
                <Text style={styles.sectionLabel}>PHOTOS ({photos.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                  {photos.map((photo, index) => (
                    <Image key={index} source={{ uri: photo }} style={styles.summaryPhoto} />
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color={ProsColors.primary} />
          <Text style={styles.infoBoxText}>
            Your request will be sent to verified pros in your area. They will review your details and send bids directly to you.
          </Text>
        </View>

        <View style={styles.warningBox}>
          <Ionicons name="information-circle" size={20} color="#F59E0B" />
          <Text style={styles.warningBoxText}>
            Your email and phone number will remain private until you approve sharing them with pros.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit Request</Text>
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          By submitting, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>

      {/* Post-Submission Signup Modal */}
      <Modal
        visible={showSignupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSignupModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
              {/* Close Button */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleSkipSignup}>
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Success Icon */}
              <View style={styles.successIconContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.modalTitle}>Request Submitted!</Text>
              <Text style={styles.modalSubtitle}>
                Your request has been sent to verified pros in your area.
              </Text>

              {/* Benefits Section */}
              <View style={styles.benefitsSection}>
                <Text style={styles.benefitsTitle}>Sign up to unlock:</Text>
                
                <View style={styles.benefitItem}>
                  <View style={styles.benefitCheckmark}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitLabel}>Real-time notifications</Text>
                    <Text style={styles.benefitDescription}>Get instant alerts when pros bid on your project</Text>
                  </View>
                </View>

                <View style={styles.benefitItem}>
                  <View style={styles.benefitCheckmark}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitLabel}>Direct communication</Text>
                    <Text style={styles.benefitDescription}>Chat with pros and share your contact info securely</Text>
                  </View>
                </View>

                <View style={styles.benefitItem}>
                  <View style={styles.benefitCheckmark}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitLabel}>Project tracking</Text>
                    <Text style={styles.benefitDescription}>Monitor all your projects in one place</Text>
                  </View>
                </View>

                <View style={styles.benefitItem}>
                  <View style={styles.benefitCheckmark}>
                    <Ionicons name="checkmark" size={16} color="#10B981" />
                  </View>
                  <View style={styles.benefitContent}>
                    <Text style={styles.benefitLabel}>Secure reviews</Text>
                    <Text style={styles.benefitDescription}>Leave verified reviews after work is complete</Text>
                  </View>
                </View>
              </View>

              {/* Privacy Notice */}
              <View style={styles.privacyNotice}>
                <Ionicons name="shield-checkmark" size={16} color={ProsColors.primary} />
                <Text style={styles.privacyNoticeText}>
                  Your contact info stays private until you approve sharing with pros
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.signupButton}
                onPress={handleSignupNow}
              >
                <Text style={styles.signupButtonText}>Sign Up Now</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.skipButton}
                onPress={handleSkipSignup}
              >
                <Text style={styles.skipButtonText}>Skip for Now</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
    padding: 4,
  },
  closeButton: {
    padding: 4,
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
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
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
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  summarySection: {
    marginVertical: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubValue: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  privacyText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dynamicAnswerRow: {
    marginTop: 4,
  },
  dynamicValue: {
    fontSize: 14,
    color: '#374151',
  },
  photoScroll: {
    marginTop: 8,
  },
  summaryPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${ProsColors.primary}10`,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 16,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C710',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  warningBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  benefitCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
  },
  benefitLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  privacyNotice: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  privacyNoticeText: {
    flex: 1,
    fontSize: 12,
    color: '#0C4A6E',
    lineHeight: 16,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  signupButton: {
    backgroundColor: ProsColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});
