/**
 * Pros Claim Business Screen
 * Install path: screens/ProsClaimBusinessScreen.tsx
 * 
 * Multi-step screen for pros to claim and verify their business.
 * Includes business search, verification methods, and document upload.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';

import { ProsColors } from '../constants/ProsConfig';

type RouteParams = {
  ProsClaimBusinessScreen: {
    businessId?: number;
    businessName?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

type VerificationMethod = 'phone' | 'email' | 'document';

type Step = 'search' | 'verify' | 'documents' | 'review';

export default function ProsClaimBusinessScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsClaimBusinessScreen'>>();
  const { businessId, businessName } = route.params || {};

  const [currentStep, setCurrentStep] = useState<Step>(businessId ? 'verify' : 'search');
  const [loading, setLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(
    businessId ? { id: businessId, name: businessName } : null
  );

  // Verification state
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // Document state
  const [licenseImage, setLicenseImage] = useState<string | null>(null);
  const [insuranceImage, setInsuranceImage] = useState<string | null>(null);

  const handleBack = () => {
    if (currentStep === 'search' || (currentStep === 'verify' && businessId)) {
      navigation.goBack();
    } else if (currentStep === 'verify') {
      setCurrentStep('search');
    } else if (currentStep === 'documents') {
      setCurrentStep('verify');
    } else if (currentStep === 'review') {
      setCurrentStep('documents');
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;

    setLoading(true);
    // Simulate API search
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock results
    setSearchResults([
      { id: 1, name: `${searchQuery} Electric`, address: '123 Main St, Miami, FL', claimed: false },
      { id: 2, name: `${searchQuery} Plumbing Co`, address: '456 Oak Ave, Miami, FL', claimed: false },
      { id: 3, name: `${searchQuery} Home Services`, address: '789 Pine Rd, Miami, FL', claimed: true },
    ]);
    setLoading(false);
  };

  const handleSelectBusiness = (business: any) => {
    if (business.claimed) {
      Alert.alert(
        'Already Claimed',
        'This business has already been claimed. If you believe this is an error, please contact support.',
        [{ text: 'OK' }]
      );
      return;
    }
    setSelectedBusiness(business);
    setCurrentStep('verify');
  };

  const handleSendCode = async () => {
    if (!verificationMethod) return;

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCodeSent(true);
    setLoading(false);

    Alert.alert(
      'Code Sent!',
      `A verification code has been sent to your ${verificationMethod === 'phone' ? 'phone' : 'email'}.`
    );
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter the verification code.');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setCurrentStep('documents');
  };

  const handlePickImage = async (type: 'license' | 'insurance') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'license') {
        setLicenseImage(result.assets[0].uri);
      } else {
        setInsuranceImage(result.assets[0].uri);
      }
    }
  };

  const handleContinueToReview = () => {
    setCurrentStep('review');
  };

  const handleSubmitClaim = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);

    Alert.alert(
      'Claim Submitted!',
      'Your business claim has been submitted for review. We\'ll notify you within 24-48 hours once verified.',
      [
        {
          text: 'Go to Dashboard',
          onPress: () => navigation.navigate('ProsDashboardScreen'),
        },
      ]
    );
  };

  const getStepNumber = (): number => {
    switch (currentStep) {
      case 'search': return 1;
      case 'verify': return 2;
      case 'documents': return 3;
      case 'review': return 4;
      default: return 1;
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.progressStep}>
          <View style={[
            styles.progressDot,
            getStepNumber() >= step && styles.progressDotActive,
          ]}>
            {getStepNumber() > step ? (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.progressDotText,
                getStepNumber() >= step && styles.progressDotTextActive,
              ]}>
                {step}
              </Text>
            )}
          </View>
          {step < 4 && (
            <View style={[
              styles.progressLine,
              getStepNumber() > step && styles.progressLineActive,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderSearchStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Find Your Business</Text>
      <Text style={styles.stepDescription}>
        Search for your business to claim it and start receiving leads.
      </Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={ProsColors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by business name..."
          placeholderTextColor={ProsColors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={ProsColors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.searchButton, searchQuery.length < 2 && styles.searchButtonDisabled]}
        onPress={handleSearch}
        disabled={searchQuery.length < 2 || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.searchButtonText}>Search</Text>
        )}
      </TouchableOpacity>

      {searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Search Results</Text>
          {searchResults.map((business) => (
            <TouchableOpacity
              key={business.id}
              style={[styles.resultCard, business.claimed && styles.resultCardClaimed]}
              onPress={() => handleSelectBusiness(business)}
            >
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{business.name}</Text>
                <Text style={styles.resultAddress}>{business.address}</Text>
              </View>
              {business.claimed ? (
                <View style={styles.claimedBadge}>
                  <Text style={styles.claimedBadgeText}>Claimed</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={ProsColors.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.addNewButton}>
        <Ionicons name="add-circle-outline" size={20} color={ProsColors.primary} />
        <Text style={styles.addNewText}>Can't find your business? Add it</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Verify Ownership</Text>
      <Text style={styles.stepDescription}>
        Verify that you own or manage {selectedBusiness?.name}.
      </Text>

      <View style={styles.selectedBusinessCard}>
        <Ionicons name="business" size={24} color={ProsColors.primary} />
        <View style={styles.selectedBusinessInfo}>
          <Text style={styles.selectedBusinessName}>{selectedBusiness?.name}</Text>
          <Text style={styles.selectedBusinessAddress}>{selectedBusiness?.address}</Text>
        </View>
      </View>

      <Text style={styles.methodsTitle}>Choose verification method:</Text>

      <TouchableOpacity
        style={[
          styles.methodCard,
          verificationMethod === 'phone' && styles.methodCardSelected,
        ]}
        onPress={() => setVerificationMethod('phone')}
      >
        <View style={styles.methodIcon}>
          <Ionicons name="call" size={24} color={verificationMethod === 'phone' ? ProsColors.primary : ProsColors.textSecondary} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodTitle}>Phone Verification</Text>
          <Text style={styles.methodDescription}>We'll call or text the business phone number on file.</Text>
        </View>
        <View style={[
          styles.methodRadio,
          verificationMethod === 'phone' && styles.methodRadioSelected,
        ]}>
          {verificationMethod === 'phone' && (
            <View style={styles.methodRadioInner} />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.methodCard,
          verificationMethod === 'email' && styles.methodCardSelected,
        ]}
        onPress={() => setVerificationMethod('email')}
      >
        <View style={styles.methodIcon}>
          <Ionicons name="mail" size={24} color={verificationMethod === 'email' ? ProsColors.primary : ProsColors.textSecondary} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodTitle}>Email Verification</Text>
          <Text style={styles.methodDescription}>We'll send a code to the business email on file.</Text>
        </View>
        <View style={[
          styles.methodRadio,
          verificationMethod === 'email' && styles.methodRadioSelected,
        ]}>
          {verificationMethod === 'email' && (
            <View style={styles.methodRadioInner} />
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.methodCard,
          verificationMethod === 'document' && styles.methodCardSelected,
        ]}
        onPress={() => {
          setVerificationMethod('document');
          setCurrentStep('documents');
        }}
      >
        <View style={styles.methodIcon}>
          <Ionicons name="document-text" size={24} color={verificationMethod === 'document' ? ProsColors.primary : ProsColors.textSecondary} />
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodTitle}>Document Verification</Text>
          <Text style={styles.methodDescription}>Upload business license or utility bill.</Text>
        </View>
        <View style={[
          styles.methodRadio,
          verificationMethod === 'document' && styles.methodRadioSelected,
        ]}>
          {verificationMethod === 'document' && (
            <View style={styles.methodRadioInner} />
          )}
        </View>
      </TouchableOpacity>

      {verificationMethod && verificationMethod !== 'document' && !codeSent && (
        <TouchableOpacity
          style={styles.sendCodeButton}
          onPress={handleSendCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.sendCodeButtonText}>Send Verification Code</Text>
          )}
        </TouchableOpacity>
      )}

      {codeSent && (
        <View style={styles.codeInputContainer}>
          <Text style={styles.codeLabel}>Enter verification code:</Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Enter code"
            placeholderTextColor={ProsColors.textMuted}
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerifyCode}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderDocumentsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Upload Documents</Text>
      <Text style={styles.stepDescription}>
        Upload your business credentials for verification. This helps build trust with customers.
      </Text>

      <View style={styles.documentSection}>
        <Text style={styles.documentLabel}>Business License (Optional)</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => handlePickImage('license')}
        >
          {licenseImage ? (
            <Image source={{ uri: licenseImage }} style={styles.uploadedImage} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color={ProsColors.textMuted} />
              <Text style={styles.uploadText}>Tap to upload</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.documentSection}>
        <Text style={styles.documentLabel}>Insurance Certificate (Optional)</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => handlePickImage('insurance')}
        >
          {insuranceImage ? (
            <Image source={{ uri: insuranceImage }} style={styles.uploadedImage} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color={ProsColors.textMuted} />
              <Text style={styles.uploadText}>Tap to upload</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoNote}>
        <Ionicons name="shield-checkmark" size={18} color={ProsColors.primary} />
        <Text style={styles.infoNoteText}>
          Verified businesses with documents get a "Verified Pro" badge and appear higher in search results.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinueToReview}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleContinueToReview}
      >
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReviewStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepDescription}>
        Review your information before submitting your claim.
      </Text>

      <View style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Business</Text>
          <Text style={styles.reviewValue}>{selectedBusiness?.name}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Address</Text>
          <Text style={styles.reviewValue}>{selectedBusiness?.address || 'Not provided'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Verification</Text>
          <Text style={styles.reviewValue}>
            {verificationMethod === 'phone' ? 'Phone' : 
             verificationMethod === 'email' ? 'Email' : 'Document'}
          </Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Documents</Text>
          <Text style={styles.reviewValue}>
            {licenseImage || insuranceImage ? 'Uploaded' : 'None'}
          </Text>
        </View>
      </View>

      <View style={styles.termsContainer}>
        <Text style={styles.termsText}>
          By submitting, you confirm that you are authorized to claim this business and agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmitClaim}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Claim</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Claim Your Business</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 'search' && renderSearchStep()}
        {currentStep === 'verify' && renderVerifyStep()}
        {currentStep === 'documents' && renderDocumentsStep()}
        {currentStep === 'review' && renderReviewStep()}
      </ScrollView>
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ProsColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: ProsColors.primary,
  },
  progressDotText: {
    fontSize: 12,
    fontWeight: '600',
    color: ProsColors.textMuted,
  },
  progressDotTextActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: ProsColors.border,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: ProsColors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    color: ProsColors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ProsColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: ProsColors.textPrimary,
    paddingVertical: 14,
    marginLeft: 10,
  },
  searchButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  searchButtonDisabled: {
    backgroundColor: ProsColors.border,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultsContainer: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textSecondary,
    marginBottom: 12,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  resultCardClaimed: {
    opacity: 0.6,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  claimedBadge: {
    backgroundColor: ProsColors.textMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  claimedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
  },
  selectedBusinessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ProsColors.primary}10`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  selectedBusinessInfo: {
    flex: 1,
  },
  selectedBusinessName: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  selectedBusinessAddress: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  methodsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textSecondary,
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: `${ProsColors.primary}05`,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: ProsColors.textSecondary,
  },
  methodRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: ProsColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodRadioSelected: {
    borderColor: ProsColors.primary,
  },
  methodRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ProsColors.primary,
  },
  sendCodeButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  sendCodeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  codeInputContainer: {
    marginTop: 20,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  codeInput: {
    fontSize: 18,
    color: ProsColors.textPrimary,
    borderWidth: 1,
    borderColor: ProsColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 12,
  },
  verifyButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  documentSection: {
    marginBottom: 20,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  uploadBox: {
    height: 150,
    borderWidth: 2,
    borderColor: ProsColors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadText: {
    fontSize: 14,
    color: ProsColors.textMuted,
    marginTop: 8,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${ProsColors.primary}10`,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 24,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: ProsColors.textPrimary,
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textSecondary,
  },
  reviewCard: {
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  reviewLabel: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  termsLink: {
    color: ProsColors.primary,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
