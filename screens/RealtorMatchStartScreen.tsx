/**
 * RealtorMatchStartScreen.tsx
 * Install path: screens/RealtorMatchStartScreen.tsx
 * 
 * Entry point for the Smart Realtor Match questionnaire flow.
 * Shows an introduction and starts the matching process.
 * 
 * NEW DARK THEME DESIGN - Matches the new Tavvy app design language
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

// New Dark Theme Colors
const Colors = {
  background: '#0A0A0F',
  surface: '#1A1A24',
  primary: '#3B82F6',
  secondary: '#C9A227',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#10B981',
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
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.background, '#0F1520', '#1A2535']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <View style={styles.closeButtonInner}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </View>
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#1E3A5F', '#2D4A6F']}
                style={styles.iconGradient}
              >
                <Ionicons name="sparkles" size={48} color={Colors.secondary} />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>Smart Match</Text>
            <Text style={styles.subtitle}>
              Answer a few quick questions and we'll match you with the perfect real estate professional for your needs.
            </Text>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Spam-free matching</Text>
                  <Text style={styles.benefitDesc}>No unwanted calls or emails</Text>
                </View>
              </View>
              
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="time" size={20} color={Colors.primary} />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Takes less than 2 minutes</Text>
                  <Text style={styles.benefitDesc}>Quick and easy process</Text>
                </View>
              </View>
              
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="people" size={20} color={Colors.secondary} />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>Connect with top realtors</Text>
                  <Text style={styles.benefitDesc}>Up to 5 matched professionals</Text>
                </View>
              </View>
              
              <View style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name="lock-closed" size={20} color="#EF4444" />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={styles.benefitTitle}>You're in control</Text>
                  <Text style={styles.benefitDesc}>Choose who contacts you</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Start Button */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <LinearGradient
                colors={[Colors.primary, '#2563EB']}
                style={styles.startButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.startButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.text} />
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={styles.privacyText}>
              Your information is secure and never shared without your permission.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    zIndex: 10,
  },
  closeButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  benefitsContainer: {
    width: '100%',
    gap: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  benefitDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  privacyText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
