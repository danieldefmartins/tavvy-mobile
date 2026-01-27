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

import { ProsColors, PROS_CATEGORIES } from '../constants/ProsConfig';
import { useProsLeads } from '../hooks/usePros';
import { useTranslation } from 'react-i18next';

type RouteParams = {
  ProsRequestQuoteScreen: {
    proId: number;
    proName?: string;
    categoryId?: number;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

export default function ProsRequestQuoteScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsRequestQuoteScreen'>>();
  const { proId, proName, categoryId } = route.params;

  const { createLead, loading } = useProsLeads();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preferredDate: '',
    budget: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    categoryId: categoryId || null,
  });

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
      await createLead({
        providerId: proId,
        categoryId: formData.categoryId || undefined,
        title: formData.title,
        description: formData.description || '',
        preferredDate: formData.preferredDate ? formData.preferredDate : undefined,
        budget: formData.budget || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
      });

      Alert.alert(
        'Request Sent!',
        `Your quote request has been sent to ${proName || 'the pro'}. They will respond soon.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send your request. Please try again.');
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
          {/* Pro Info */}
          {proName && (
            <View style={styles.proInfo}>
              <Ionicons name="business" size={20} color={ProsColors.primary} />
              <Text style={styles.proInfoText}>Requesting quote from {proName}</Text>
            </View>
          )}

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
              Your contact information will be shared with this pro so they can respond to your request.
            </Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, (!isValid() || loading) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid() || loading}
          >
            {loading ? (
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
