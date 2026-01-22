import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

// Pros brand green color
const PROS_GREEN = '#10B981';
const PROS_GREEN_DARK = '#059669';
const PROS_GREEN_LIGHT = '#34D399';

export default function ProsLoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const { theme, isDark } = useThemeContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      await signIn(email.trim(), password);
      // After login, navigate to Pros dashboard
      navigation.navigate('Pros');
    } catch (error: any) {
      console.error('Pro Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    // Navigate to Pro signup flow
    navigation.navigate('ProsRequest');
  };

  // Generate decorative logo pattern positions (green-themed)
  const logoPatterns = [
    { top: '3%', left: '5%', opacity: 0.06, size: 55, rotation: '-15deg' },
    { top: '6%', right: '8%', opacity: 0.05, size: 40, rotation: '10deg' },
    { top: '12%', left: '20%', opacity: 0.04, size: 30, rotation: '25deg' },
    { top: '10%', right: '22%', opacity: 0.06, size: 45, rotation: '-5deg' },
    { top: '18%', left: '75%', opacity: 0.04, size: 35, rotation: '15deg' },
    { bottom: '30%', right: '3%', opacity: 0.05, size: 40, rotation: '30deg' },
    { bottom: '22%', left: '5%', opacity: 0.06, size: 45, rotation: '-10deg' },
    { bottom: '12%', right: '12%', opacity: 0.04, size: 30, rotation: '20deg' },
    { bottom: '5%', left: '18%', opacity: 0.05, size: 35, rotation: '-25deg' },
    { bottom: '3%', right: '28%', opacity: 0.04, size: 50, rotation: '5deg' },
  ];

  return (
    <View style={styles.container}>
      {/* Background Gradient - Deep Green Theme */}
      <LinearGradient
        colors={['#064E3B', '#065F46', '#064E3B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Logo Pattern Background */}
      {logoPatterns.map((pattern, index) => (
        <Image
          key={index}
          source={require('../assets/brand/tavvy-logo-white.png')}
          style={[
            styles.patternLogo,
            {
              top: pattern.top,
              bottom: pattern.bottom,
              left: pattern.left,
              right: pattern.right,
              opacity: pattern.opacity,
              width: pattern.size,
              height: pattern.size,
              transform: [{ rotate: pattern.rotation }],
            },
          ]}
          resizeMode="contain"
        />
      ))}

      {/* Subtle Glow Effects */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <View style={styles.backButtonCircle}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            {/* Icon with Green Gradient */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[PROS_GREEN, PROS_GREEN_DARK]}
                style={styles.iconGradient}
              >
                <Ionicons name="construct" size={44} color="#fff" />
              </LinearGradient>
              {/* Glow behind icon */}
              <View style={styles.iconGlow} />
            </View>

            {/* Tavvy Wordmark */}
            <Image
              source={require('../assets/brand/tavvy-logo-white.png')}
              style={styles.wordmark}
              resizeMode="contain"
            />

            {/* Pros Badge */}
            <View style={styles.prosBadge}>
              <Text style={styles.prosBadgeText}>PROS</Text>
            </View>

            <Text style={styles.subtitleText}>Service Provider Portal</Text>
          </View>

          {/* Benefits Card */}
          <View style={styles.benefitsCard}>
            <View style={styles.benefitItem}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
              <Text style={styles.benefitText}>Get discovered by local customers</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
              <Text style={styles.benefitText}>Flat annual fee - no per-lead charges</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
              <Text style={styles.benefitText}>Manage leads and messages in one place</Text>
            </View>
          </View>

          {/* Login Form Card */}
          <View style={styles.formCard}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[PROS_GREEN, PROS_GREEN_DARK]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Log In as Pro</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Create Account Section */}
          <View style={styles.createAccountSection}>
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>New to Tavvy Pros?</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={handleCreateAccount}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={22} color={PROS_GREEN} />
              <Text style={styles.createAccountText}>Create Pro Account</Text>
            </TouchableOpacity>

            <View style={styles.promoContainer}>
              <Text style={styles.promoEmoji}>🎉</Text>
              <Text style={styles.promoText}>
                First 1,000 providers: Only <Text style={styles.promoPrice}>$99/year</Text> (reg. $499)
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Looking for services instead? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Pros')}>
              <Text style={styles.browseLink}>Browse Pros</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064E3B',
  },
  patternLogo: {
    position: 'absolute',
    zIndex: 0,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: PROS_GREEN,
    opacity: 0.15,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: PROS_GREEN_LIGHT,
    opacity: 0.1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  iconGradient: {
    width: 88,
    height: 88,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 30,
    backgroundColor: PROS_GREEN,
    opacity: 0.3,
    zIndex: 0,
  },
  wordmark: {
    width: 120,
    height: 40,
    marginBottom: 8,
  },
  prosBadge: {
    backgroundColor: PROS_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  prosBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  subtitleText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  benefitsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: PROS_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 14,
    overflow: 'hidden',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: PROS_GREEN,
  },
  createAccountSection: {
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginHorizontal: 16,
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 12,
  },
  createAccountText: {
    color: PROS_GREEN,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  promoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  promoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  promoPrice: {
    fontWeight: '700',
    color: PROS_GREEN_LIGHT,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  browseLink: {
    fontSize: 14,
    fontWeight: '600',
    color: PROS_GREEN_LIGHT,
  },
});
