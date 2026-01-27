/**
 * Pros Registration Screen
 * Install path: screens/ProsRegistrationScreen.tsx
 * 
 * Registration flow for new service providers.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors, PROS_CATEGORIES, PROS_SUBSCRIPTION_TIERS } from '../constants/ProsConfig';
import { ProsPricingCard } from '../components/ProsSubscriptionBanner';
import { useProDashboard, useProsSubscription } from '../hooks/usePros';
import { useTranslation } from 'react-i18next';

type NavigationProp = NativeStackNavigationProp<any>;

type Step = 'business' | 'services' | 'location' | 'pricing' | 'review';

export default function ProsRegistrationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { register, loading: registerLoading } = useProDashboard();
  const { earlyAdopterCount, fetchEarlyAdopterCount, subscribe, loading: subscribeLoading } = useProsSubscription();

  const [currentStep, setCurrentStep] = useState<Step>('business');
  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    zipCode: '',
    categoryIds: [] as number[],
    primaryCategoryId: null as number | null,
    selectedTier: 'early_adopter' as 'early_adopter' | 'standard',
  });

  useEffect(() => {
    fetchEarlyAdopterCount();
  }, []);

  const isEarlyAdopterAvailable = earlyAdopterCount < 1000;
  const remainingSpots = Math.max(0, 1000 - earlyAdopterCount);

  const steps: Step[] = ['business', 'services', 'location', 'pricing', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryId: number) => {
    setFormData(prev => {
      const isSelected = prev.categoryIds.includes(categoryId);
      let newCategoryIds: number[];
      let newPrimaryId = prev.primaryCategoryId;

      if (isSelected) {
        newCategoryIds = prev.categoryIds.filter(id => id !== categoryId);
        if (newPrimaryId === categoryId) {
          newPrimaryId = newCategoryIds[0] || null;
        }
      } else {
        newCategoryIds = [...prev.categoryIds, categoryId];
        if (!newPrimaryId) {
          newPrimaryId = categoryId;
        }
      }

      return {
        ...prev,
        categoryIds: newCategoryIds,
        primaryCategoryId: newPrimaryId,
      };
    });
  };

  const setPrimaryCategory = (categoryId: number) => {
    setFormData(prev => ({ ...prev, primaryCategoryId: categoryId }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'business':
        return formData.businessName.trim().length > 0;
      case 'services':
        return formData.categoryIds.length > 0;
      case 'location':
        return formData.city.trim().length > 0 && formData.state.trim().length > 0;
      case 'pricing':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    try {
      // Register the business
      await register({
        businessName: formData.businessName,
        description: formData.description || undefined,
        phone: formData.phone || '',
        email: formData.email || '',
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode || '',
        categoryIds: formData.categoryIds,
      } as any);

      // Subscribe to selected tier
      await subscribe(formData.selectedTier);

      Alert.alert(
        'Welcome to Tavvy Pros!',
        'Your business profile has been created. Complete your profile to start receiving leads.',
        [
          {
            text: 'Go to Dashboard',
            onPress: () => navigation.replace('ProsDashboardScreen'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create your profile. Please try again.');
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <View
            style={[
              styles.stepDot,
              index <= currentStepIndex && styles.stepDotActive,
            ]}
          >
            {index < currentStepIndex ? (
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.stepNumber,
                index <= currentStepIndex && styles.stepNumberActive,
              ]}>
                {index + 1}
              </Text>
            )}
          </View>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.stepLine,
                index < currentStepIndex && styles.stepLineActive,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderBusinessStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tell us about your business</Text>
      <Text style={styles.stepSubtitle}>
        This information will be displayed on your public profile.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Business Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., John's Plumbing Services"
          placeholderTextColor={ProsColors.textMuted}
          value={formData.businessName}
          onChangeText={(v) => updateField('businessName', v)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell customers about your services, experience, and what makes you different..."
          placeholderTextColor={ProsColors.textMuted}
          value={formData.description}
          onChangeText={(v) => updateField('description', v)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="(555) 123-4567"
            placeholderTextColor={ProsColors.textMuted}
            value={formData.phone}
            onChangeText={(v) => updateField('phone', v)}
            keyboardType="phone-pad"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={ProsColors.textMuted}
            value={formData.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );

  const renderServicesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What services do you offer?</Text>
      <Text style={styles.stepSubtitle}>
        Select all that apply. Tap again to set as primary service.
      </Text>

      <View style={styles.categoriesGrid}>
        {PROS_CATEGORIES.map((category) => {
          const isSelected = formData.categoryIds.includes(category.id);
          const isPrimary = formData.primaryCategoryId === category.id;

          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                isSelected && styles.categoryCardSelected,
                isPrimary && styles.categoryCardPrimary,
              ]}
              onPress={() => {
                if (isSelected && !isPrimary) {
                  setPrimaryCategory(category.id);
                } else {
                  toggleCategory(category.id);
                }
              }}
            >
              <Ionicons
                name={category.icon as any}
                size={24}
                color={isSelected ? '#FFFFFF' : category.color}
              />
              <Text
                style={[
                  styles.categoryCardText,
                  isSelected && styles.categoryCardTextSelected,
                ]}
              >
                {category.name}
              </Text>
              {isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {formData.categoryIds.length > 0 && (
        <Text style={styles.selectedCount}>
          {formData.categoryIds.length} service{formData.categoryIds.length !== 1 ? 's' : ''} selected
        </Text>
      )}
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Where do you operate?</Text>
      <Text style={styles.stepSubtitle}>
        Customers will find you based on your service area.
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>City *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Miami"
          placeholderTextColor={ProsColors.textMuted}
          value={formData.city}
          onChangeText={(v) => updateField('city', v)}
        />
      </View>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>State *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., FL"
            placeholderTextColor={ProsColors.textMuted}
            value={formData.state}
            onChangeText={(v) => updateField('state', v)}
            autoCapitalize="characters"
            maxLength={2}
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.inputLabel}>ZIP Code</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 33101"
            placeholderTextColor={ProsColors.textMuted}
            value={formData.zipCode}
            onChangeText={(v) => updateField('zipCode', v)}
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
      </View>
    </View>
  );

  const renderPricingStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choose your plan</Text>
      <Text style={styles.stepSubtitle}>
        No per-lead fees. One flat annual price for unlimited leads.
      </Text>

      {isEarlyAdopterAvailable && (
        <View style={styles.earlyAdopterAlert}>
          <Ionicons name="sparkles" size={20} color={ProsColors.primary} />
          <Text style={styles.earlyAdopterAlertText}>
            Only {remainingSpots} early adopter spots remaining!
          </Text>
        </View>
      )}

      <ProsPricingCard
        tier="earlyAdopter"
        isAvailable={isEarlyAdopterAvailable}
        isSelected={formData.selectedTier === 'early_adopter'}
        onSelect={() => updateField('selectedTier', 'early_adopter')}
      />

      <ProsPricingCard
        tier="standard"
        isAvailable={true}
        isSelected={formData.selectedTier === 'standard'}
        onSelect={() => updateField('selectedTier', 'standard')}
      />
    </View>
  );

  const renderReviewStep = () => {
    const selectedCategories = PROS_CATEGORIES.filter(c => formData.categoryIds.includes(c.id));
    const primaryCategory = PROS_CATEGORIES.find(c => c.id === formData.primaryCategoryId);
    const selectedPlan = formData.selectedTier === 'early_adopter'
      ? PROS_SUBSCRIPTION_TIERS.earlyAdopter
      : PROS_SUBSCRIPTION_TIERS.standard;

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Review your information</Text>
        <Text style={styles.stepSubtitle}>
          Make sure everything looks correct before submitting.
        </Text>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Business</Text>
          <Text style={styles.reviewValue}>{formData.businessName}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Primary Service</Text>
          <Text style={styles.reviewValue}>{primaryCategory?.name || 'Not set'}</Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>All Services</Text>
          <Text style={styles.reviewValue}>
            {selectedCategories.map(c => c.name).join(', ')}
          </Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Location</Text>
          <Text style={styles.reviewValue}>
            {formData.city}, {formData.state} {formData.zipCode}
          </Text>
        </View>

        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>Plan</Text>
          <Text style={styles.reviewValue}>
            {selectedPlan.label} - ${selectedPlan.price}/year
          </Text>
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'business':
        return renderBusinessStep();
      case 'services':
        return renderServicesStep();
      case 'location':
        return renderLocationStep();
      case 'pricing':
        return renderPricingStep();
      case 'review':
        return renderReviewStep();
    }
  };

  const isLoading = registerLoading || subscribeLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become a Pro</Text>
          <View style={{ width: 40 }} />
        </View>

        {renderStepIndicator()}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {currentStep === 'review' ? (
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>Complete Registration</Text>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, !canProceed() && styles.buttonDisabled]}
              onPress={handleNext}
              disabled={!canProceed()}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: ProsColors.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: ProsColors.textMuted,
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: ProsColors.sectionBg,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: ProsColors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  stepContent: {
    paddingHorizontal: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: ProsColors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: ProsColors.textPrimary,
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    backgroundColor: ProsColors.primary,
    borderColor: ProsColors.primary,
  },
  categoryCardPrimary: {
    borderColor: ProsColors.secondary,
  },
  categoryCardText: {
    fontSize: 13,
    fontWeight: '500',
    color: ProsColors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  categoryCardTextSelected: {
    color: '#FFFFFF',
  },
  primaryBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: ProsColors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedCount: {
    fontSize: 14,
    color: ProsColors.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
  },
  earlyAdopterAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ProsColors.primary}10`,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  earlyAdopterAlertText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
    marginLeft: 8,
  },
  reviewSection: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  reviewLabel: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontWeight: '500',
    color: ProsColors.textPrimary,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: ProsColors.borderLight,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ProsColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
