/**
 * RealtorMatchQ3Screen.tsx
 * Install path: screens/RealtorMatchQ3Screen.tsx
 * 
 * Question 3: Where is the property located?
 * Uses AddressAutocomplete component for location suggestions
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import { useTranslation } from 'react-i18next';

type RouteParams = {
  params: {
    lookingTo: string;
    propertyType: string;
  };
};

const RealtorColors = {
  primary: '#1E3A5F',
  secondary: '#C9A227',
  background: '#F8F9FA',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
};

export default function RealtorMatchQ3Screen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const [location, setLocation] = useState('');
  const [locationDetails, setLocationDetails] = useState<any>(null);

  const progress = (3 / 12) * 100;

  const handleLocationSelect = (address: string, details: any) => {
    // Format as "City, State" for cleaner display
    const city = details.city || '';
    const state = details.state || '';
    const formattedLocation = city && state ? `${city}, ${state}` : address;
    
    setLocation(formattedLocation);
    setLocationDetails(details);
  };

  const handleNext = () => {
    if (location.trim()) {
      navigation.navigate('RealtorMatchQ4', { 
        ...route.params,
        location: location.trim(),
        locationDetails: locationDetails,
      });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClose = () => {
    navigation.navigate('RealtorsBrowse');
  };

  const handleQuickSelect = (city: string) => {
    setLocation(city);
    setLocationDetails({ city: city.split(',')[0], state: city.split(',')[1]?.trim() });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={RealtorColors.text} />
          </TouchableOpacity>
          <Text style={styles.stepText}>3 of 12</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={RealtorColors.text} />
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <KeyboardAvoidingView 
          style={styles.contentContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.question}>Where is the property located?</Text>
            <Text style={styles.subtitle}>
              Enter a city, state, or ZIP code to find realtors in that area.
            </Text>

            {/* Address Autocomplete with dropdown suggestions */}
            <View style={styles.autocompleteContainer}>
              <AddressAutocomplete
                value={location}
                onSelect={handleLocationSelect}
                onChange={(text) => setLocation(text)}
                placeholder="City, State or ZIP code"
                mode="area"
              />
            </View>

            {/* Popular locations suggestion - only show when no input */}
            {!location && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Popular areas</Text>
                <View style={styles.suggestionsRow}>
                  {['Miami, FL', 'Los Angeles, CA', 'New York, NY', 'Houston, TX'].map((city) => (
                    <TouchableOpacity 
                      key={city}
                      style={styles.suggestionChip}
                      onPress={() => handleQuickSelect(city)}
                    >
                      <Text style={styles.suggestionText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={[
                styles.nextButton,
                !location.trim() && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!location.trim()}
            >
              <Text style={[
                styles.nextButtonText,
                !location.trim() && styles.nextButtonTextDisabled,
              ]}>
                Continue
              </Text>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={location.trim() ? '#FFFFFF' : RealtorColors.textMuted} 
              />
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
    fontSize: 14,
    fontWeight: '600',
    color: RealtorColors.textLight,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  progressBackground: {
    height: 4,
    backgroundColor: RealtorColors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: RealtorColors.primary,
    borderRadius: 2,
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
  question: {
    fontSize: 26,
    fontWeight: '700',
    color: RealtorColors.text,
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: RealtorColors.textLight,
    marginBottom: 24,
    lineHeight: 22,
  },
  autocompleteContainer: {
    zIndex: 1000, // Ensure dropdown appears above other content
  },
  suggestionsContainer: {
    marginTop: 32,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: RealtorColors.textLight,
    marginBottom: 12,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: RealtorColors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: RealtorColors.text,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RealtorColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: RealtorColors.border,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextButtonTextDisabled: {
    color: RealtorColors.textMuted,
  },
});
