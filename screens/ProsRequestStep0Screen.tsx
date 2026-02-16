/**
 * ProsRequestStep0Screen - Customer Information Collection
 * Install path: screens/ProsRequestStep0Screen.tsx
 * 
 * Step 0 of 7: Collect customer contact information and privacy preference
 * Users provide: Name, Email, Phone, and choose between sharing info or app-only messaging
 */

import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
import { useTranslation } from 'react-i18next';

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}%</Text>
  </View>
);

export default function ProsRequestStep0Screen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyPreference, setPrivacyPreference] = useState<'share' | 'app_only'>('share');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = fullName.trim().length > 0 && email.trim().length > 0 && phone.trim().length > 0;

  const handleNext = async () => {
    if (!isFormValid) {
      Alert.alert('Missing Information', 'Please fill in all fields to continue.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Basic phone validation (at least 10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number.');
      return;
    }

    setIsLoading(true);

    try {
      // Navigate to Step 1 with customer info
      navigation.navigate('ProsRequestStep1', {
        customerInfo: {
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          privacyPreference,
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      console.error('Error in Step 0:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel? Your information will not be saved.',
      [
        { text: 'Keep Going', onPress: () => {} },
        { text: 'Cancel', onPress: () => navigation.goBack(), style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Service</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressWrapper}>
          <ProgressBar progress={14} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepNumber}>Step 1 of 7</Text>
            <Text style={styles.stepTitle}>Who are you?</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            We need your contact information so pros can reach out with their bids and answer questions about your project.
          </Text>

          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={20} color={ProsColors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail" size={20} color={ProsColors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call" size={20} color={ProsColors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor="#9CA3AF"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Privacy Preference */}
          <View style={styles.privacySection}>
            <Text style={styles.label}>How would you like to communicate?</Text>
            
            <TouchableOpacity 
              style={[
                styles.privacyOption,
                privacyPreference === 'share' && styles.privacyOptionSelected,
              ]}
              onPress={() => setPrivacyPreference('share')}
              disabled={isLoading}
            >
              <View style={[
                styles.radioButton,
                privacyPreference === 'share' && styles.radioButtonSelected,
              ]}>
                {privacyPreference === 'share' && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.privacyOptionContent}>
                <Text style={styles.privacyOptionTitle}>Share my contact info</Text>
                <Text style={styles.privacyOptionDescription}>
                  Pros can call or text you directly with their bids
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.privacyOption,
                privacyPreference === 'app_only' && styles.privacyOptionSelected,
              ]}
              onPress={() => setPrivacyPreference('app_only')}
              disabled={isLoading}
            >
              <View style={[
                styles.radioButton,
                privacyPreference === 'app_only' && styles.radioButtonSelected,
              ]}>
                {privacyPreference === 'app_only' && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.privacyOptionContent}>
                <Text style={styles.privacyOptionTitle}>App messaging only</Text>
                <Text style={styles.privacyOptionDescription}>
                  Communicate with pros through our secure in-app messaging
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={ProsColors.primary} />
            <Text style={styles.infoText}>
              Your information is secure and will only be shared with pros who bid on your project.
            </Text>
          </View>
        </ScrollView>

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.nextButton, !isFormValid && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!isFormValid || isLoading}
          >
            <Text style={styles.nextButtonText}>
              {isLoading ? 'Loading...' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ProsColors.primary,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 35,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  stepIndicator: {
    marginBottom: 24,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  privacySection: {
    marginBottom: 24,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  privacyOptionSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: `${ProsColors.primary}10`,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: ProsColors.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ProsColors.primary,
  },
  privacyOptionContent: {
    flex: 1,
  },
  privacyOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  privacyOptionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: `${ProsColors.primary}10`,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: ProsColors.primary,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
