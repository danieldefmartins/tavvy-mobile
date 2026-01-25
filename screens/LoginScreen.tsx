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
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
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
      // Navigation will be handled by AuthContext/App.tsx
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Generate decorative logo pattern positions
  const logoPatterns = [
    { top: '5%', left: '5%', opacity: 0.08, size: 60, rotation: '-15deg' },
    { top: '8%', right: '10%', opacity: 0.06, size: 45, rotation: '10deg' },
    { top: '15%', left: '15%', opacity: 0.05, size: 35, rotation: '25deg' },
    { top: '12%', right: '25%', opacity: 0.07, size: 50, rotation: '-5deg' },
    { top: '20%', left: '70%', opacity: 0.04, size: 40, rotation: '15deg' },
    { top: '25%', left: '3%', opacity: 0.06, size: 55, rotation: '-20deg' },
    { bottom: '35%', right: '5%', opacity: 0.05, size: 45, rotation: '30deg' },
    { bottom: '25%', left: '8%', opacity: 0.07, size: 50, rotation: '-10deg' },
    { bottom: '15%', right: '15%', opacity: 0.04, size: 35, rotation: '20deg' },
    { bottom: '8%', left: '20%', opacity: 0.06, size: 40, rotation: '-25deg' },
    { bottom: '5%', right: '30%', opacity: 0.05, size: 55, rotation: '5deg' },
  ];

  return (
    <View style={styles.container}>
      {/* Background Gradient - Tavvy Navy to Deep Blue */}
      <LinearGradient
        colors={['#0F1233', '#1a237e', '#0F1233']}
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
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/brand/tavvy-logo-white.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
              {/* Glow behind logo */}
              <View style={styles.logoGlow} />
            </View>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.subtitleText}>Sign in to continue your journey</Text>
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
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Log In</Text>
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

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Options */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Pro Login Link - visible without scrolling */}
          <TouchableOpacity 
            style={styles.proLinkButton}
            onPress={() => navigation.navigate('ProsLogin')}
          >
            <Text style={styles.proLinkText}>Are you a Pro? </Text>
            <Text style={styles.proLinkAction}>Sign in here</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1233',
  },
  patternLogo: {
    position: 'absolute',
    zIndex: 0,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#3B82F6',
    opacity: 0.15,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F97316',
    opacity: 0.1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    marginBottom: 4,
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
    marginBottom: 16,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  logoImage: {
    width: 160,
    height: 50,
    zIndex: 1,
  },
  logoGlow: {
    position: 'absolute',
    top: -15,
    left: -20,
    right: -20,
    bottom: -15,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    opacity: 0.25,
    zIndex: 0,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 15,
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
    marginTop: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
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
    color: '#94A3B8',
    fontSize: 13,
    marginHorizontal: 16,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
    color: '#94A3B8',
  },
  signUpLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  proLinkButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 6,
  },
  proLinkText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  proLinkAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});
