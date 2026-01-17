/**
 * ProsRequestStep4Screen - Location & Timeline
 * Install path: screens/ProsRequestStep4Screen.tsx
 * 
 * Step 5 of 6: Users provide their location and preferred timeline
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
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
};

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressContainer}>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
    </View>
    <Text style={styles.progressText}>{progress}%</Text>
  </View>
);

export default function ProsRequestStep4Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  
  const { customerInfo, categoryId, categoryName, description, dynamicAnswers } = route.params;
  const { saveProgress } = useProsPendingRequests();
  
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);

  const timelines = [
    { id: 'urgent', label: 'Emergency / ASAP', sublabel: 'Within 24 hours', icon: 'alert-circle' },
    { id: 'this_week', label: 'This week', sublabel: 'Within 7 days', icon: 'calendar' },
    { id: 'this_month', label: 'This month', sublabel: 'Within 30 days', icon: 'calendar-outline' },
    { id: 'flexible', label: 'Flexible', sublabel: 'No rush, just planning', icon: 'time' },
  ];

  const handleNext = async () => {
    if (!city || !state || !zipCode) {
      Alert.alert('Missing Info', 'Please provide your city, state, and zip code.');
      return;
    }
    if (!selectedTimeline) {
      Alert.alert('Missing Info', 'Please select a timeline for your project.');
      return;
    }
    
    const formData = {
      customerInfo,
      categoryId,
      categoryName,
      description,
      dynamicAnswers,
      address,
      city,
      state,
      zipCode,
      timeline: selectedTimeline,
    };

    // Auto-save progress
    await saveProgress(categoryId, 4, formData);

    navigation.navigate('ProsRequestStep2Photo', formData);
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
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Location & Timing</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.progressWrapper}>
          <ProgressBar progress={67} />
          <Text style={styles.stepText}>Step 5 of 6: Logistics</Text>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.sectionTitle}>Where is the project located?</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="123 Main St"
              value={address}
              onChangeText={setAddress}
            />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Miami"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                style={styles.input}
                placeholder="FL"
                value={state}
                onChangeText={setState}
                autoCapitalize="characters"
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zip Code</Text>
            <TextInput
              style={styles.input}
              placeholder="33101"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>When do you need this done?</Text>
          <View style={styles.timelineGrid}>
            {timelines.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.timelineCard,
                  selectedTimeline === t.id && styles.timelineCardSelected
                ]}
                onPress={() => setSelectedTimeline(t.id)}
              >
                <Ionicons 
                  name={t.icon as any} 
                  size={24} 
                  color={selectedTimeline === t.id ? ProsColors.primary : '#6B7280'} 
                />
                <View style={styles.timelineText}>
                  <Text style={[
                    styles.timelineLabel,
                    selectedTimeline === t.id && styles.timelineLabelSelected
                  ]}>
                    {t.label}
                  </Text>
                  <Text style={styles.timelineSublabel}>{t.sublabel}</Text>
                </View>
                <View style={[
                  styles.radio,
                  selectedTimeline === t.id && styles.radioSelected
                ]}>
                  {selectedTimeline === t.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!city || !state || !zipCode || !selectedTimeline) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!city || !state || !zipCode || !selectedTimeline}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
    backgroundColor: ProsColors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineGrid: {
    gap: 12,
  },
  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timelineCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: `${ProsColors.primary}10`,
  },
  timelineText: {
    flex: 1,
    marginLeft: 12,
  },
  timelineLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  timelineLabelSelected: {
    color: ProsColors.primary,
  },
  timelineSublabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: ProsColors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ProsColors.primary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextButton: {
    backgroundColor: ProsColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
