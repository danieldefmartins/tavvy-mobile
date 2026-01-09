/**
 * Pros Request Quote Screen
 * Install path: screens/ProsRequestQuoteScreen.tsx
 * 
 * Form for users to request quotes from service providers.
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors } from '../constants/ProsConfig';
import { useServiceCategories } from '../hooks/useProsDirectory';
import { invokeEdgeFunction } from '../lib/prosEdge';

type RouteParams = {
  ProsRequestQuoteScreen: {
    categorySlug?: string;
    // Optional prefill
    city?: string;
    state?: string;
    zipCode?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

export default function ProsRequestQuoteScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsRequestQuoteScreen'>>();
  const { categorySlug, city, state, zipCode } = route.params || {};

  const { data: categories } = useServiceCategories();
  const selectedCategory = categorySlug
    ? categories?.find((c) => c.slug === categorySlug)
    : undefined;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preferredDate: '',
    budget: '',
    address: '',
    city: city ?? '',
    state: state ?? '',
    zipCode: zipCode ?? '',
    phone: '',
    email: '',
    urgency: 'this_week' as 'asap' | 'this_week' | 'this_month' | 'flexible',
    maxPros: 10,
  });

  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = () => {
    return formData.title.trim().length > 0;
  };

  const handleSubmit = async () => {
    if (!isValid()) {
      Alert.alert('Error', 'Please provide a title for your request.');
      return;
    }

    try {
      setSubmitting(true);

      if (!selectedCategory?.id) {
        Alert.alert('Error', 'Please select a service category.');
        return;
      }

      const payload = {
        category_id: selectedCategory.id,
        title: formData.title,
        description: formData.description,
        city: formData.city,
        state: formData.state,
        zip: formData.zipCode,
        urgency: formData.urgency,
        max_pros: formData.maxPros,
        // Optional contact info (kept private until user chooses to share)
        email: formData.email || undefined,
      };

      const res = await invokeEdgeFunction<{ project: any; invited_count: number }>(
        'pros-create-project',
        payload
      );

      // Navigate to a project status screen (customer-facing)
      navigation.replace('ProsProjectStatus', {
        projectId: res.project?.id,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to send your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={ProsColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Quote</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Category Info */}
          <View style={styles.proInfo}>
            <Ionicons name="briefcase" size={20} color={ProsColors.primary} />
            <Text style={styles.proInfoText}>
              {selectedCategory?.name ? `Service: ${selectedCategory.name}` : 'Choose a service'}
            </Text>
          </View>

          {/* Project Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>What do you need help with? *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Fix leaking faucet in bathroom"
                placeholderTextColor={ProsColors.textMuted}
                value={formData.title}
                onChangeText={(v) => updateField('title', v)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Provide more details about your project..."
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
                <Text style={styles.inputLabel}>Preferred Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={ProsColors.textMuted}
                  value={formData.preferredDate}
                  onChangeText={(v) => updateField('preferredDate', v)}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Budget</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., $500-$1000"
                  placeholderTextColor={ProsColors.textMuted}
                  value={formData.budget}
                  onChangeText={(v) => updateField('budget', v)}
                />
              </View>
            </View>

            {/* Urgency */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Urgency</Text>
              <View style={styles.choiceRow}>
                {[
                  { key: 'asap', label: 'ASAP' },
                  { key: 'this_week', label: 'This week' },
                  { key: 'this_month', label: 'This month' },
                  { key: 'flexible', label: 'Flexible' },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.choicePill,
                      formData.urgency === (opt.key as any) && styles.choicePillActive,
                    ]}
                    onPress={() => updateField('urgency', opt.key)}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        formData.urgency === (opt.key as any) && styles.choicePillTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* How many pros */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>How many pros should we recommend?</Text>
              <View style={styles.choiceRow}>
                {[3, 5, 10].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.choicePill,
                      formData.maxPros === n && styles.choicePillActive,
                    ]}
                    onPress={() => updateField('maxPros', n)}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        formData.maxPros === n && styles.choicePillTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.choicePill}
                  onPress={() => Alert.alert('More pros', 'We can increase this later. For now, defaulting to 10.')}
                >
                  <Text style={styles.choicePillText}>More</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                We’ll invite more pros if you don’t get enough responses.
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Location</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Street address"
                placeholderTextColor={ProsColors.textMuted}
                value={formData.address}
                onChangeText={(v) => updateField('address', v)}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={ProsColors.textMuted}
                  value={formData.city}
                  onChangeText={(v) => updateField('city', v)}
                />
              </View>
              <View style={{ width: 8 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ST"
                  placeholderTextColor={ProsColors.textMuted}
                  value={formData.state}
                  onChangeText={(v) => updateField('state', v)}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
              <View style={{ width: 8 }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>ZIP</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ZIP"
                  placeholderTextColor={ProsColors.textMuted}
                  value={formData.zipCode}
                  onChangeText={(v) => updateField('zipCode', v)}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Contact Info</Text>

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

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Ionicons name="information-circle-outline" size={20} color={ProsColors.textSecondary} />
            <Text style={styles.infoNoteText}>
              Pros can respond inside Tavvy. You decide if and when to share your contact info.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, (!isValid() || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Send Request</Text>
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </>
            )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  proInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ProsColors.primary}10`,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  proInfoText: {
    fontSize: 14,
    color: ProsColors.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 16,
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
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  choicePillActive: {
    backgroundColor: ProsColors.primary,
    borderColor: ProsColors.primary,
  },
  choicePillText: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    fontWeight: '600',
  },
  choicePillTextActive: {
    color: '#FFFFFF',
  },
  helperText: {
    marginTop: 4,
    fontSize: 12,
    color: ProsColors.textMuted,
    lineHeight: 16,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ProsColors.sectionBg,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: ProsColors.textSecondary,
    lineHeight: 18,
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: ProsColors.borderLight,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ProsColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});
