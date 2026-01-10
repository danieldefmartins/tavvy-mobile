/**
 * Pros Bid Screen (UPDATED to match mockup)
 * Install path: screens/ProsBidScreen.tsx
 * 
 * Screen for pros to respond to leads with pricing and pitch.
 * DESIGN MATCHES: pro_bid_screen.png mockup
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors } from '../constants/ProsConfig';

type RouteParams = {
  ProsBidScreen: {
    leadId: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

// Sample lead data
const SAMPLE_LEAD = {
  id: '1',
  customerName: 'Sarah T.',
  projectTitle: 'Kitchen Lighting Installation',
  location: 'Seattle, WA',
  budgetMin: 1500,
  budgetMax: 2500,
  timeline: 'Within a week',
  description: 'Looking to install recessed lighting in my kitchen. Currently have 2 existing fixtures that need to be removed. Kitchen is approximately 200 sq ft.',
};

export default function ProsBidScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsBidScreen'>>();
  const { leadId } = route.params;

  const [lowEstimate, setLowEstimate] = useState('');
  const [highEstimate, setHighEstimate] = useState('');
  const [pitch, setPitch] = useState('');
  const [availableDate, setAvailableDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lead = SAMPLE_LEAD;
  const MAX_PITCH_LENGTH = 500;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
    if (!lowEstimate || !highEstimate) {
      Alert.alert('Missing Information', 'Please provide a price range estimate.');
      return;
    }

    if (!pitch.trim()) {
      Alert.alert('Missing Information', 'Please write a pitch to introduce yourself.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    Alert.alert(
      'Response Sent!',
      'Your response has been sent to the customer. They will be notified and can view your profile.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Respond to Lead</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Lead Info Card - Dark background matching mockup */}
          <View style={styles.leadCard}>
            <View style={styles.customerRow}>
              <View style={styles.customerAvatar}>
                <Ionicons name="person-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.customerName}>{lead.customerName}</Text>
            </View>
            <Text style={styles.projectTitle}>{lead.projectTitle}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>{lead.location}</Text>
            </View>
            <Text style={styles.budgetText}>
              ${lead.budgetMin.toLocaleString()} - ${lead.budgetMax.toLocaleString()}
            </Text>
            <Text style={styles.timelineText}>{lead.timeline}</Text>
          </View>

          {/* Your Response Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Response</Text>

            {/* Ballpark Price Range */}
            <Text style={styles.fieldLabel}>Ballpark Price Range</Text>
            <View style={styles.priceInputRow}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.dollarSign}>$</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>Low estimate</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="1700"
                    placeholderTextColor={ProsColors.textMuted}
                    keyboardType="numeric"
                    value={lowEstimate}
                    onChangeText={setLowEstimate}
                  />
                </View>
              </View>
              <View style={styles.priceInputContainer}>
                <Text style={styles.dollarSign}>$</Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.priceInputLabel}>High estimate</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="2200"
                    placeholderTextColor={ProsColors.textMuted}
                    keyboardType="numeric"
                    value={highEstimate}
                    onChangeText={setHighEstimate}
                  />
                </View>
              </View>
            </View>
            <Text style={styles.priceHint}>
              Give an honest range based on the description. Final quote can differ after inspection.
            </Text>

            {/* Your Pitch */}
            <Text style={styles.fieldLabel}>Your Pitch</Text>
            <View style={styles.pitchInputContainer}>
              <TextInput
                style={styles.pitchInput}
                placeholder="Introduce yourself and explain why you're a good fit for this project..."
                placeholderTextColor={ProsColors.textMuted}
                multiline
                textAlignVertical="top"
                maxLength={MAX_PITCH_LENGTH}
                value={pitch}
                onChangeText={setPitch}
              />
            </View>
            <Text style={styles.characterCount}>
              {pitch.length}/{MAX_PITCH_LENGTH}
            </Text>

            {/* Availability */}
            <Text style={styles.fieldLabel}>Availability</Text>
            <TouchableOpacity style={styles.dateInputContainer}>
              <Ionicons name="calendar-outline" size={20} color={ProsColors.textMuted} />
              <View style={styles.dateInputWrapper}>
                <Text style={styles.dateInputLabel}>Earliest available date</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="Oct 26, 2024"
                  placeholderTextColor={ProsColors.textMuted}
                  value={availableDate}
                  onChangeText={setAvailableDate}
                />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomCTA}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </Text>
          </TouchableOpacity>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={16} color={ProsColors.textSecondary} />
            <Text style={styles.infoText}>
              The customer will see your profile, rating, and this response.
            </Text>
          </View>
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
  keyboardAvoid: {
    flex: 1,
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
    paddingBottom: 20,
  },

  // Lead Card - Dark background matching mockup
  leadCard: {
    backgroundColor: '#374151',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  budgetText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timelineText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 10,
    marginTop: 16,
  },

  // Price Inputs - matching mockup
  priceInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
    borderRadius: 10,
    paddingLeft: 14,
  },
  dollarSign: {
    fontSize: 16,
    color: ProsColors.textSecondary,
    marginRight: 8,
  },
  priceInputWrapper: {
    flex: 1,
    paddingVertical: 10,
  },
  priceInputLabel: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginBottom: 2,
  },
  priceInput: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    padding: 0,
  },
  priceHint: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },

  // Pitch Input - matching mockup
  pitchInputContainer: {
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
    borderRadius: 10,
    padding: 14,
    minHeight: 120,
  },
  pitchInput: {
    fontSize: 15,
    color: ProsColors.textPrimary,
    lineHeight: 22,
    minHeight: 90,
  },
  characterCount: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },

  // Date Input - matching mockup
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateInputWrapper: {
    flex: 1,
    marginLeft: 10,
  },
  dateInputLabel: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginBottom: 2,
  },
  dateInput: {
    fontSize: 15,
    fontWeight: '500',
    color: ProsColors.textPrimary,
    padding: 0,
  },

  // Bottom CTA - matching mockup
  bottomCTA: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: ProsColors.borderLight,
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: ProsColors.textSecondary,
  },
});
