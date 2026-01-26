/**
 * RealtorMatchCompleteScreen.tsx
 * Install path: screens/RealtorMatchCompleteScreen.tsx
 * 
 * Completion screen that prompts users to create an account.
 * If user is already logged in, shows success message without signup prompt.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

type RouteParams = {
  params: {
    email?: string;
    name?: string;
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
  success: '#10B981',
};

export default function RealtorMatchCompleteScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const { user } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

  const email = route.params?.email;
  const name = route.params?.name;

  // Check if user is already logged in
  const isLoggedIn = !!user;

  const handleCreateAccount = async () => {
    if (password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords don\'t match', 'Please make sure your passwords match.');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email!,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setAccountCreated(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleContinueAsGuest = () => {
    navigation.navigate('RealtorsBrowse');
  };

  const handleGoToMatches = () => {
    navigation.navigate('RealtorsBrowse');
  };

  // LOGGED IN USER - Show success without signup prompt
  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[RealtorColors.primary, '#2D5A8A']}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Request Submitted!</Text>
              <Text style={styles.successSubtitle}>
                We're matching you with the best realtors for your needs. You'll receive notifications when realtors respond.
              </Text>
              <TouchableOpacity style={styles.whiteButton} onPress={handleGoToMatches}>
                <Text style={styles.whiteButtonText}>View Matched Realtors</Text>
                <Ionicons name="arrow-forward" size={20} color={RealtorColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.skipButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // Account created success view (for guest users who just created an account)
  if (accountCreated) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[RealtorColors.primary, '#2D5A8A']}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Account Created!</Text>
              <Text style={styles.successSubtitle}>
                Welcome to Tavvy! Your account has been created and your realtor match request is being processed.
              </Text>
              <TouchableOpacity style={styles.whiteButton} onPress={handleGoToMatches}>
                <Text style={styles.whiteButtonText}>View Matched Realtors</Text>
                <Ionicons name="arrow-forward" size={20} color={RealtorColors.primary} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // GUEST USER - Show signup prompt
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[RealtorColors.primary, '#2D5A8A']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleContinueAsGuest}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.content}>
            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="rocket" size={64} color="#FFFFFF" />
            </View>

            <Text style={styles.title}>Your request is submitted!</Text>
            <Text style={styles.subtitle}>
              We're matching you with the best realtors for your needs. Create an account to track your matches and communicate with realtors.
            </Text>

            {!showPasswordFields ? (
              <>
                {/* Benefits of creating account */}
                <View style={styles.benefitsContainer}>
                  <View style={styles.benefitRow}>
                    <Ionicons name="notifications-outline" size={20} color={RealtorColors.secondary} />
                    <Text style={styles.benefitText}>Get notified when realtors respond</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <Ionicons name="chatbubbles-outline" size={20} color={RealtorColors.secondary} />
                    <Text style={styles.benefitText}>Message realtors directly</Text>
                  </View>
                  <View style={styles.benefitRow}>
                    <Ionicons name="bookmark-outline" size={20} color={RealtorColors.secondary} />
                    <Text style={styles.benefitText}>Save your favorite properties</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  style={styles.createAccountButton} 
                  onPress={() => setShowPasswordFields(true)}
                >
                  <Text style={styles.createAccountButtonText}>Create Account</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.skipButton} onPress={handleContinueAsGuest}>
                  <Text style={styles.skipButtonText}>Continue as Guest</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Password Fields */}
                <View style={styles.passwordContainer}>
                  <Text style={styles.emailDisplay}>
                    Creating account for: {email}
                  </Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Create Password</Text>
                    <TextInput
                      style={styles.passwordInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm password"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.createAccountButton, isCreating && styles.buttonDisabled]} 
                  onPress={handleCreateAccount}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator color={RealtorColors.primary} />
                  ) : (
                    <Text style={styles.createAccountButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.skipButton} 
                  onPress={() => setShowPasswordFields(false)}
                >
                  <Text style={styles.skipButtonText}>Back</Text>
                </TouchableOpacity>
              </>
            )}
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
    paddingTop: 100,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  createAccountButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  createAccountButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: RealtorColors.primary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  passwordContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  emailDisplay: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  passwordInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  // Success view styles
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  whiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
  },
  whiteButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: RealtorColors.primary,
  },
});
