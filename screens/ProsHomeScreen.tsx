/**
 * Pros Home Screen - "The Tavvy Way"
 * Install path: screens/ProsHomeScreen.tsx
 * 
 * REDESIGN - January 2026
 * Focus on value proposition:
 * - Match guarantee
 * - Privacy protection (no sharing contact until ready)
 * - Best practices guidance
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useThemeContext } from '../contexts/ThemeContext';

import { 
  ProsColors, 
  PROS_CATEGORIES, 
  EARLY_ADOPTER_PRICE,
  STANDARD_PRICE,
  EARLY_ADOPTER_SPOTS_LEFT,
  EARLY_ADOPTER_SAVINGS,
} from '../constants/ProsConfig';
import { useSearchPros } from '../hooks/usePros';
import { useCategories } from '../hooks/useCategories';
import { useProsPendingRequests } from '../hooks/useProsPendingRequests';
import { Pro } from '../lib/ProsTypes';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Design System Colors
const COLORS = {
  background: '#0F0F0F',
  backgroundLight: '#FAFAFA',
  surface: '#111827',
  surfaceLight: '#FFFFFF',
  glassy: '#1A1A1A',
  accent: '#667EEA',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#10B981',
  verified: '#10B981',
  teal: '#14B8A6',
};

// Category configuration with icons and colors
const CATEGORY_CONFIG = [
  { slug: 'plumbing', label: 'Plumbing', icon: 'construct-outline', color: '#3B82F6' },
  { slug: 'landscaping', label: 'Landscaping', icon: 'leaf-outline', color: '#10B981' },
  { slug: 'electrical', label: 'Electrical', icon: 'flash-outline', color: '#F59E0B' },
  { slug: 'cleaning', label: 'Cleaning', icon: 'sparkles-outline', color: '#8B5CF6' },
];

// Best Practices Content
const BEST_PRACTICES = {
  dos: [
    'Get multiple quotes before deciding',
    'Check licenses and insurance',
    'Read reviews from verified customers',
    'Get everything in writing',
  ],
  donts: [
    'Pay full amount upfront',
    'Hire without checking references',
    'Skip the written contract',
    'Rush into a decision',
  ],
  expect: [
    'Clear communication and timelines',
    'Professional behavior and respect',
    'Quality workmanship',
    'Fair and transparent pricing',
  ],
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProsHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useThemeContext();
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'user' | 'pro'>('user');

  const { pros, loading, searchPros } = useSearchPros();
  const { categories, loading: categoriesLoading } = useCategories();
  const { getPendingRequest } = useProsPendingRequests();
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  useEffect(() => {
    searchPros({ limit: 6 });
    checkPendingRequest();
  }, []);

  const checkPendingRequest = async () => {
    const pending = await getPendingRequest();
    if (pending) {
      setPendingRequest(pending);
    }
  };

  const handleCategoryPress = (slug: string) => {
    navigation.navigate('ProsRequestStep0');
  };

  const handleProPress = (slug: string) => {
    navigation.navigate('ProsProfile', { slug });
  };

  const handleProSignup = () => {
    navigation.navigate('ProsRegistration');
  };

  const handleProDashboard = () => {
    navigation.navigate('ProsDashboard');
  };

  const backgroundColor = theme.background;
  const surfaceColor = theme.surface;
  const glassyColor = isDark ? theme.surface : '#F3F4F6';
  const cardShadow = isDark ? {} : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  };
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;

  // Pro Mode View
  if (viewMode === 'pro') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Pros</Text>
            <Text style={[styles.tagline, { color: COLORS.accent }]}>
              Grow your business with Tavvy.
            </Text>
          </View>

          {/* Segmented Control */}
          <View style={styles.segmentedControlContainer}>
            <View style={[styles.segmentedControl, { backgroundColor: glassyColor }]}>
              <TouchableOpacity
                style={[styles.segment, viewMode === 'user' && styles.segmentActive]}
                onPress={() => setViewMode('user')}
              >
                <Text style={[
                  styles.segmentText,
                  { color: viewMode === 'user' ? '#FFFFFF' : secondaryTextColor }
                ]}>
                  Find a Pro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, viewMode === 'pro' && styles.segmentActive]}
                onPress={() => setViewMode('pro')}
              >
                <Text style={[
                  styles.segmentText,
                  { color: viewMode === 'pro' ? '#FFFFFF' : secondaryTextColor }
                ]}>
                  I'm a Pro
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pro Dashboard */}
          <View style={styles.proDashboard}>
            <Text style={[styles.welcomeText, { color: textColor }]}>Welcome, Pro!</Text>
            
            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: surfaceColor, ...cardShadow }]}>
                <Text style={[styles.statNumber, { color: textColor }]}>3</Text>
                <Text style={[styles.statLabel, { color: secondaryTextColor }]}>New Leads</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: surfaceColor, ...cardShadow }]}>
                <Text style={[styles.statNumber, { color: textColor }]}>1</Text>
                <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Messages</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: surfaceColor, ...cardShadow }]}>
                <Text style={[styles.statNumber, { color: textColor }]}>128</Text>
                <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Views</Text>
              </View>
            </View>

            {/* Action Grid */}
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', borderWidth: isDark ? 0 : 1, borderColor: '#E5E7EB', ...cardShadow }]}
                onPress={() => navigation.navigate('ProsLeads')}
              >
                <Ionicons name="mail-outline" size={28} color={COLORS.success} />
                <Text style={[styles.actionLabel, { color: textColor }]}>Leads</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', borderWidth: isDark ? 0 : 1, borderColor: '#E5E7EB', ...cardShadow }]}
                onPress={() => navigation.navigate('ProsMessages')}
              >
                <Ionicons name="chatbubbles-outline" size={28} color={COLORS.accent} />
                <Text style={[styles.actionLabel, { color: textColor }]}>Messages</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', borderWidth: isDark ? 0 : 1, borderColor: '#E5E7EB', ...cardShadow }]}
                onPress={() => navigation.navigate('ProsProfile', { slug: 'my-profile' })}
              >
                <Ionicons name="person-outline" size={28} color="#F59E0B" />
                <Text style={[styles.actionLabel, { color: textColor }]}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', borderWidth: isDark ? 0 : 1, borderColor: '#E5E7EB', ...cardShadow }]}
                onPress={handleProDashboard}
              >
                <Ionicons name="stats-chart-outline" size={28} color="#EC4899" />
                <Text style={[styles.actionLabel, { color: textColor }]}>Analytics</Text>
              </TouchableOpacity>
            </View>

            {/* Early Adopter Banner */}
            <View style={styles.earlyAdopterBanner}>
              <Text style={styles.bannerTitle}>You're an Early Adopter!</Text>
              <Text style={styles.bannerSubtitle}>
                {EARLY_ADOPTER_SPOTS_LEFT} spots left at ${EARLY_ADOPTER_PRICE}/year
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // User Mode (Find a Pro) - THE TAVVY WAY
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Pros</Text>
          <Text style={[styles.heroTagline, { color: COLORS.teal }]}>
            We'll find the best pros for your needs.
          </Text>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControlContainer}>
          <View style={[styles.segmentedControl, { backgroundColor: glassyColor }]}>
            <TouchableOpacity
              style={[styles.segment, viewMode === 'user' && styles.segmentActive]}
              onPress={() => setViewMode('user')}
            >
              <Text style={[
                styles.segmentText,
                { color: viewMode === 'user' ? '#FFFFFF' : secondaryTextColor }
              ]}>
                Find a Pro
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, viewMode === 'pro' && styles.segmentActive]}
              onPress={() => setViewMode('pro')}
            >
              <Text style={[
                styles.segmentText,
                { color: viewMode === 'pro' ? '#FFFFFF' : secondaryTextColor }
              ]}>
                I'm a Pro
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start a Project Card - Primary CTA */}
        <TouchableOpacity
          style={styles.startProjectCard}
          onPress={() => navigation.navigate('ProsRequestStep0')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#0EA5E9', '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startProjectGradient}
          >
            <View style={styles.startProjectIcon}>
              <Ionicons name="add-circle-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.startProjectContent}>
              <Text style={styles.startProjectTitle}>Start a Project</Text>
              <Text style={styles.startProjectSubtitle}>Get quotes from multiple pros in minutes</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Continue Request Banner - Subtle/Secondary */}
        {pendingRequest && (
          <TouchableOpacity
            style={styles.continueRequestCard}
            onPress={() => navigation.navigate('ProsRequestStep1', { customerInfo: pendingRequest.customerInfo })}
            activeOpacity={0.9}
          >
            <View style={[styles.continueRequestInner, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Ionicons name="time-outline" size={20} color={secondaryTextColor} />
              <View style={styles.continueRequestContent}>
                <Text style={[styles.continueRequestTitle, { color: textColor }]}>Continue your request?</Text>
                <Text style={[styles.continueRequestSubtitle, { color: secondaryTextColor }]}>
                  You have an unfinished project for {pendingRequest.category || 'a service'}.
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={secondaryTextColor} />
            </View>
          </TouchableOpacity>
        )}

        {/* The Tavvy Way Section */}
        <View style={styles.tavvyWaySection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>The Tavvy Way</Text>
          
          {/* Value Props */}
          <View style={styles.valuePropsContainer}>
            {/* Match Guarantee */}
            <View style={[styles.valuePropCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', ...cardShadow }]}>
              <View style={[styles.valuePropIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
              </View>
              <View style={styles.valuePropContent}>
                <Text style={[styles.valuePropTitle, { color: textColor }]}>Match Guarantee</Text>
                <Text style={[styles.valuePropText, { color: secondaryTextColor }]}>
                  Tell us what you need. We'll match you with vetted pros who fit your project perfectly.
                </Text>
              </View>
            </View>

            {/* Privacy Protection */}
            <View style={[styles.valuePropCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', ...cardShadow }]}>
              <View style={[styles.valuePropIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="lock-closed" size={24} color="#10B981" />
              </View>
              <View style={styles.valuePropContent}>
                <Text style={[styles.valuePropTitle, { color: textColor }]}>Your Privacy Protected</Text>
                <Text style={[styles.valuePropText, { color: secondaryTextColor }]}>
                  No sharing your phone or email until you're ready to hire. Chat securely through the app.
                </Text>
              </View>
            </View>

            {/* Expert Guidance */}
            <View style={[styles.valuePropCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', ...cardShadow }]}>
              <View style={[styles.valuePropIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="bulb" size={24} color="#F59E0B" />
              </View>
              <View style={styles.valuePropContent}>
                <Text style={[styles.valuePropTitle, { color: textColor }]}>Expert Guidance</Text>
                <Text style={[styles.valuePropText, { color: secondaryTextColor }]}>
                  We'll help you with best practices, red flags to avoid, and what to expect from pros.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Best Practices Section */}
        <View style={styles.bestPracticesSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Hiring Best Practices</Text>
          
          {/* Do's */}
          <View style={[styles.practiceCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', ...cardShadow }]}>
            <View style={styles.practiceHeader}>
              <View style={[styles.practiceIconBg, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
              <Text style={[styles.practiceTitle, { color: '#10B981' }]}>Do's</Text>
            </View>
            {BEST_PRACTICES.dos.map((item, index) => (
              <View key={index} style={styles.practiceItem}>
                <Ionicons name="checkmark" size={16} color="#10B981" />
                <Text style={[styles.practiceText, { color: textColor }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Don'ts */}
          <View style={[styles.practiceCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', ...cardShadow }]}>
            <View style={styles.practiceHeader}>
              <View style={[styles.practiceIconBg, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.practiceTitle, { color: '#EF4444' }]}>Don'ts</Text>
            </View>
            {BEST_PRACTICES.donts.map((item, index) => (
              <View key={index} style={styles.practiceItem}>
                <Ionicons name="close" size={16} color="#EF4444" />
                <Text style={[styles.practiceText, { color: textColor }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* What to Expect */}
          <View style={[styles.practiceCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', ...cardShadow }]}>
            <View style={styles.practiceHeader}>
              <View style={[styles.practiceIconBg, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="star" size={20} color="#6366F1" />
              </View>
              <Text style={[styles.practiceTitle, { color: '#6366F1' }]}>What to Expect</Text>
            </View>
            {BEST_PRACTICES.expect.map((item, index) => (
              <View key={index} style={styles.practiceItem}>
                <Ionicons name="star-outline" size={16} color="#6366F1" />
                <Text style={[styles.practiceText, { color: textColor }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Get Started - Category Grid */}
        <View style={styles.categorySection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Get Started</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_CONFIG.map((cat) => (
              <TouchableOpacity
                key={cat.slug}
                style={[
                  styles.categoryCard, 
                  { 
                    backgroundColor: isDark ? glassyColor : '#FFFFFF',
                    borderWidth: isDark ? 0 : 1,
                    borderColor: '#E5E7EB',
                    ...cardShadow,
                  }
                ]}
                onPress={() => handleCategoryPress(cat.slug)}
              >
                <Ionicons name={cat.icon as any} size={32} color={cat.color} />
                <Text style={[styles.categoryLabel, { color: textColor }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  heroTagline: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 24,
  },

  // Segmented Control
  segmentedControlContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: COLORS.accent,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Start a Project Card
  startProjectCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startProjectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  startProjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  startProjectContent: {
    flex: 1,
  },
  startProjectTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startProjectSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },

  // Continue Request Card - Subtle/Secondary
  continueRequestCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueRequestInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderRadius: 12,
  },
  continueRequestContent: {
    flex: 1,
  },
  continueRequestTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  continueRequestSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // The Tavvy Way Section
  tavvyWaySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  valuePropsContainer: {
    gap: 12,
  },
  valuePropCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  valuePropIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valuePropContent: {
    flex: 1,
  },
  valuePropTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  valuePropText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Best Practices Section
  bestPracticesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  practiceCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  practiceIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  practiceText: {
    fontSize: 14,
    flex: 1,
  },

  // Categories
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Pro Dashboard
  proDashboard: {
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  earlyAdopterBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
