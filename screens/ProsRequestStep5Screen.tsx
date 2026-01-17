/**
 * ProsRequestStep5Screen - Review & Submit
 * Install path: screens/ProsRequestStep5Screen.tsx
 * 
 * Final Step: Users review all collected information and submit the request
 * FIX: Uses useProsPendingRequests for direct DB submission to avoid Edge Function error.
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
// import { useProsLeads } from '../hooks/usePros'; // REMOVED: Was causing Edge Function error
import { useProsPendingRequests } from '../hooks/useProsPendingRequests';

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
  // Use the correct hook for submission
  const { createRequest, deleteProgress } = useProsPendingRequests();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Prepare the data for direct database insertion
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
      };

      // Call the direct database insertion function
      const lead = await createRequest(leadData as any);

      // Delete pending progress on success
      await deleteProgress(categoryId);

      Alert.alert('Success', 'Your request has been submitted successfully! Pros will review it and send you bids shortly.');
      
      navigation.reset({
        index: 0,
        routes: [
          { name: 'ProsHome' },
          { 
            name: 'ProsProjectStatus', 
            params: { 
              projectId: lead.id,
              categoryName,
              timeline,
              city,
            } 
          },
        ],
      });
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Submission Failed', error instanceof Error ? error.message : 'Failed to submit request. Please try again. (Check useProsPendingRequests hook)');
    } finally {
      setIsSubmitting(false);
    }
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
    // fontWeight: '500',
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
    marginBottom: 32,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
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
});
