/**
 * RealtorMatchStartScreen.tsx
 * Install path: screens/RealtorMatchStartScreen.tsx
 * 
 * Entry point for the Smart Realtor Match questionnaire flow.
 * Shows an introduction and starts the matching process.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const RealtorColors = {
  primary: '#1E3A5F',
  secondary: '#C9A227',
  background: '#F8F9FA',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
};

export default function RealtorMatchStartScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleStart = () => {
    navigation.navigate('RealtorMatchQ1');
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[RealtorColors.primary, '#2D5A8A']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={64} color="#FFFFFF" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Find the Right Realtor</Text>
            <Text style={styles.subtitle}>
              Answer a few quick questions and we'll match you with the perfect real estate professional for your needs.
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="shield-checkmark" size={20} color={RealtorColors.secondary} />
                </View>
                <Text style={styles.benefitText}>Spam-free matching</Text>
              </View>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="time" size={20} color={RealtorColors.secondary} />
                </View>
                <Text style={styles.benefitText}>Takes less than 2 minutes</Text>
              </View>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="chatbubbles" size={20} color={RealtorColors.secondary} />
                </View>
                <Text style={styles.benefitText}>Connect with up to 5 realtors</Text>
              </View>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="lock-closed" size={20} color={RealtorColors.secondary} />
                </View>
                <Text style={styles.benefitText}>You control who contacts you</Text>
              </View>
            </View>
          </View>

          {/* Start Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color={RealtorColors.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  benefitsContainer: {
    width: '100%',
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: RealtorColors.primary,
  },
});
