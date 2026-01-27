/**
 * RealtorMatchContactScreen.tsx
 * Install path: screens/RealtorMatchContactScreen.tsx
 * 
 * Collects contact info from guest users and prompts account creation.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

type RouteParams = {
  params: Record<string, any>;
};

const RealtorColors = {
  primary: '#1E3A5F',
  secondary: '#C9A227',
  background: '#F8F9FA',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
};

export default function RealtorMatchContactScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = name.trim() && phone.trim() && email.trim() && email.includes('@');

  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      // Map camelCase params to snake_case database columns
      const params = route.params || {};
      const matchData = {
        looking_to: params.lookingTo || null,
        property_type: params.propertyType || null,
        location: params.location || null,
        timeline: params.timeline || null,
        price_range: params.priceRange || null,
        main_goal: params.mainGoal || null,
        realtor_personality: params.realtorPersonality || [],
        languages: params.languages || [],
        communication_prefs: params.communicationPrefs || [],
        realtor_count: params.realtorCount || null,
        share_contact_info: params.shareContactInfo || false,
        additional_notes: params.additionalNotes || null,
        contact_name: name.trim(),
        contact_phone: phone.trim(),
        contact_email: email.trim(),
        contact_address: address.trim(),
        user_id: user?.id || null,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('realtor_match_requests')
        .insert([matchData]);

      if (error) {
        console.error('Error submitting match request:', error);
        // Continue anyway - we'll prompt for account creation
      }

      // Navigate to account creation prompt
      navigation.navigate('RealtorMatchComplete', {
        email: email.trim(),
        name: name.trim(),
      });
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipToResults = () => {
    // If user is logged in, skip contact collection
    navigation.navigate('RealtorMatchComplete', {});
  };

  // If user is already logged in, show simplified view
  if (user) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={RealtorColors.text} />
            </TouchableOpacity>
            <Text style={styles.stepText}>Almost done!</Text>
            <View style={styles.headerButton} />
          </View>

          <View style={styles.loggedInContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={RealtorColors.primary} />
            </View>
            <Text style={styles.loggedInTitle}>You're all set!</Text>
            <Text style={styles.loggedInSubtitle}>
              We'll use your account information to connect you with matched realtors.
            </Text>
            <TouchableOpacity style={styles.submitButton} onPress={handleSkipToResults}>
              <Text style={styles.submitButtonText}>Find My Matches</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={RealtorColors.text} />
          </TouchableOpacity>
          <Text style={styles.stepText}>Contact Info</Text>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('RealtorsBrowse')}>
            <Ionicons name="close" size={24} color={RealtorColors.text} />
          </TouchableOpacity>
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
            <Text style={styles.title}>How can realtors reach you?</Text>
            <Text style={styles.subtitle}>
              Share your contact details so matched realtors can connect with you.
            </Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="John Smith"
                  placeholderTextColor={RealtorColors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number *</Text>
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={RealtorColors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="john@example.com"
                  placeholderTextColor={RealtorColors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Address (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="123 Main St, City, State"
                  placeholderTextColor={RealtorColors.textMuted}
                />
              </View>
            </View>

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark-outline" size={20} color={RealtorColors.textLight} />
              <Text style={styles.privacyText}>
                Your information is only shared with your matched realtors and is protected by our privacy policy.
              </Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isValid || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              <Text style={[
                styles.submitButtonText,
                (!isValid || isSubmitting) && styles.submitButtonTextDisabled,
              ]}>
                {isSubmitting ? 'Submitting...' : 'Submit & Find Matches'}
              </Text>
              {!isSubmitting && (
                <Ionicons 
                  name="arrow-forward" 
                  size={20} 
                  color={isValid ? '#FFFFFF' : RealtorColors.textMuted} 
                />
              )}
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
    fontSize: 16,
    fontWeight: '600',
    color: RealtorColors.text,
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
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: RealtorColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: RealtorColors.textLight,
    marginBottom: 32,
    lineHeight: 22,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: RealtorColors.text,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: RealtorColors.text,
    borderWidth: 1,
    borderColor: RealtorColors.border,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: RealtorColors.textLight,
    lineHeight: 18,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RealtorColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: RealtorColors.border,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: RealtorColors.textMuted,
  },
  // Logged in user styles
  loggedInContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  loggedInTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: RealtorColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  loggedInSubtitle: {
    fontSize: 16,
    color: RealtorColors.textLight,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
});
