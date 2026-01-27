/**
 * Pros Home Screen - V2 "The Tavvy Way"
 * Install path: screens/ProsHomeScreen.tsx
 * 
 * REDESIGN V2 - January 2026
 * Combined recommendations from Developer 1 & 2:
 * - Match guarantee, Privacy protection, Expert guidance
 * - Social proof (no star rating)
 * - How It Works (3 steps)
 * - Before You Hire (education)
 * - Project Types (Quick/Medium/Major)
 * - Tavvy Shield (prominent card after How It Works)
 * - Best practices (Do's/Don'ts/What to Expect)
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

// V2 Design System Colors (Developer 1 recommendations)
const COLORS = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceAlt: '#2A2A2A',
  primaryBlue: '#6B7FFF',
  accentTeal: '#00CED1',
  successGreen: '#10B981',
  warningAmber: '#F59E0B',
  errorRed: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  border: '#333333',
};

// Category configuration with icons and colors
const CATEGORY_CONFIG = [
  { slug: 'home', label: 'Home', icon: 'home-outline', color: '#6B7FFF' },
  { slug: 'auto', label: 'Auto', icon: 'car-outline', color: '#10B981' },
  { slug: 'marine', label: 'Marine', icon: 'boat-outline', color: '#00CED1' },
  { slug: 'events', label: 'Events', icon: 'camera-outline', color: '#F59E0B' },
  { slug: 'business', label: 'Business', icon: 'briefcase-outline', color: '#8B5CF6' },
  { slug: 'creative', label: 'Creative', icon: 'color-palette-outline', color: '#EC4899' },
];

// Popular Services
const POPULAR_SERVICES = [
  { slug: 'auto-mechanic', label: 'Auto Mechanic', icon: 'construct-outline', color: '#6B7FFF', desc: 'Car repairs' },
  { slug: 'landscaping', label: 'Landscaping', icon: 'leaf-outline', color: '#10B981', desc: 'Lawn & garden' },
  { slug: 'electrical', label: 'Electrician', icon: 'flash-outline', color: '#F59E0B', desc: 'Electrical work' },
  { slug: 'contractor', label: 'Contractor', icon: 'hammer-outline', color: '#8B5CF6', desc: 'Remodeling' },
  { slug: 'plumbing', label: 'Plumber', icon: 'water-outline', color: '#EF4444', desc: 'Plumbing' },
  { slug: 'boat-mechanic', label: 'Boat Mechanic', icon: 'boat-outline', color: '#00CED1', desc: 'Marine repairs' },
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

// Before You Hire Education Content
const EDUCATION_CONTENT = [
  { icon: 'help-circle-outline', title: '5 Questions to Ask Every Contractor', subtitle: '2 min read' },
  { icon: 'cash-outline', title: 'How Much Should It Cost?', subtitle: 'Price guide' },
  { icon: 'flag-outline', title: 'Red Flags to Watch For', subtitle: 'Stay safe' },
  { icon: 'scale-outline', title: 'Your Rights as a Homeowner', subtitle: 'FL laws' },
];

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

  const backgroundColor = isDark ? COLORS.background : '#FAFAFA';
  const surfaceColor = isDark ? COLORS.surface : '#FFFFFF';
  const surfaceAltColor = isDark ? COLORS.surfaceAlt : '#F3F4F6';
  const cardShadow = isDark ? {} : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  };
  const textColor = isDark ? COLORS.textPrimary : '#111827';
  const secondaryTextColor = isDark ? COLORS.textSecondary : '#6B7280';
  const borderColor = isDark ? COLORS.border : '#E5E7EB';

  // Pro Mode View
  if (viewMode === 'pro') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Pros</Text>
            <Text style={[styles.tagline, { color: COLORS.primaryBlue }]}>
              Grow your business with Tavvy.
            </Text>
          </View>

          {/* Segmented Control */}
          <View style={styles.segmentedControlContainer}>
            <View style={[styles.segmentedControl, { backgroundColor: surfaceColor }]}>
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
                style={[styles.actionCard, { backgroundColor: surfaceColor, borderWidth: 1, borderColor, ...cardShadow }]}
                onPress={() => navigation.navigate('ProsLeads')}
              >
                <Ionicons name="mail-outline" size={28} color={COLORS.successGreen} />
                <Text style={[styles.actionLabel, { color: textColor }]}>Leads</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: surfaceColor, borderWidth: 1, borderColor, ...cardShadow }]}
                onPress={() => navigation.navigate('ProsMessages')}
              >
                <Ionicons name="chatbubbles-outline" size={28} color={COLORS.primaryBlue} />
                <Text style={[styles.actionLabel, { color: textColor }]}>Messages</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: surfaceColor, borderWidth: 1, borderColor, ...cardShadow }]}
                onPress={() => navigation.navigate('ProsProfile', { slug: 'my-profile' })}
              >
                <Ionicons name="person-outline" size={28} color={COLORS.warningAmber} />
                <Text style={[styles.actionLabel, { color: textColor }]}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: surfaceColor, borderWidth: 1, borderColor, ...cardShadow }]}
                onPress={handleProDashboard}
              >
                <Ionicons name="stats-chart-outline" size={28} color="#EC4899" />
                <Text style={[styles.actionLabel, { color: textColor }]}>Analytics</Text>
              </TouchableOpacity>
            </View>

            {/* Early Adopter Banner */}
            <View style={[styles.earlyAdopterBanner, { borderColor: COLORS.primaryBlue }]}>
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

  // User Mode (Find a Pro) - V2 THE TAVVY WAY
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Pros</Text>
          <Text style={[styles.heroTagline, { color: COLORS.accentTeal }]}>
            Connect with any professional.{'\n'}Any job. Any service. We'll match you.
          </Text>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControlContainer}>
          <View style={[styles.segmentedControl, { backgroundColor: surfaceColor }]}>
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
            colors={['#6B7FFF', '#5563E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startProjectGradient}
          >
            <View style={styles.startProjectIcon}>
              <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.startProjectContent}>
              <Text style={styles.startProjectTitle}>Start a Project</Text>
              <Text style={styles.startProjectSubtitle}>Tell us what you need, get matched with pros</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Continue Request Banner - Subtle/Secondary with specific service */}
        {pendingRequest && (
          <TouchableOpacity
            style={styles.continueRequestCard}
            onPress={() => navigation.navigate('ProsRequestStep1', { customerInfo: pendingRequest.customerInfo })}
            activeOpacity={0.9}
          >
            <View style={[styles.continueRequestInner, { backgroundColor: surfaceAltColor, borderColor, borderWidth: 1 }]}>
              <View style={[styles.continueIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                <Ionicons name="time-outline" size={20} color={COLORS.warningAmber} />
              </View>
              <View style={styles.continueRequestContent}>
                <Text style={[styles.continueRequestTitle, { color: COLORS.warningAmber }]}>Continue your request?</Text>
                <Text style={[styles.continueRequestSubtitle, { color: secondaryTextColor }]}>
                  You have an unfinished project for {pendingRequest.category || pendingRequest.service_type || 'a service'}.
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={secondaryTextColor} />
            </View>
          </TouchableOpacity>
        )}

        {/* Social Proof - No star rating */}
        <View style={[styles.socialProof, { borderColor }]}>
          <View style={styles.proofItem}>
            <Text style={[styles.proofNumber, { color: COLORS.successGreen }]}>12,450+</Text>
            <Text style={[styles.proofLabel, { color: secondaryTextColor }]}>PROJECTS</Text>
          </View>
          <View style={styles.proofDivider} />
          <View style={styles.proofItem}>
            <Text style={[styles.proofNumber, { color: COLORS.successGreen }]}>$340</Text>
            <Text style={[styles.proofLabel, { color: secondaryTextColor }]}>AVG SAVINGS</Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>✨ How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={[styles.stepCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1 }]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: textColor }]}>Tell us what you need</Text>
                <Text style={[styles.stepDesc, { color: secondaryTextColor }]}>From car repair to home renovation to event planning</Text>
              </View>
            </View>
            <View style={[styles.stepCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1 }]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: textColor }]}>We match you with pros</Text>
                <Text style={[styles.stepDesc, { color: secondaryTextColor }]}>Get quotes from vetted professionals in your area</Text>
              </View>
            </View>
            <View style={[styles.stepCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1 }]}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: textColor }]}>Chat & hire securely</Text>
                <Text style={[styles.stepDesc, { color: secondaryTextColor }]}>Your contact info stays private until you're ready</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tavvy Shield - Prominent Card (moved up after How It Works) */}
        <TouchableOpacity style={styles.tavvyShieldCard} activeOpacity={0.9}>
          <LinearGradient
            colors={['rgba(107, 127, 255, 0.15)', 'rgba(139, 92, 246, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.tavvyShieldGradient, { borderColor: 'rgba(107, 127, 255, 0.3)', borderWidth: 1 }]}
          >
            <View style={styles.shieldIconContainer}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.primaryBlue} />
            </View>
            <View style={styles.shieldContent}>
              <Text style={[styles.shieldTitle, { color: textColor }]}>Tavvy Shield</Text>
              <Text style={[styles.shieldDesc, { color: secondaryTextColor }]}>
                Want payment protection? Get covered with Tavvy Shield.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.accentTeal} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Before You Hire - Education */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>📚 Before You Hire</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eduScroll}>
            {EDUCATION_CONTENT.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.eduCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1 }]}
                activeOpacity={0.8}
              >
                <Ionicons name={item.icon as any} size={28} color={COLORS.accentTeal} />
                <Text style={[styles.eduTitle, { color: textColor }]}>{item.title}</Text>
                <Text style={[styles.eduSubtitle, { color: secondaryTextColor }]}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Project Types */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>📊 By Project Size</Text>
          <View style={styles.projectTypesRow}>
            <TouchableOpacity style={[styles.projectTypeCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1, borderTopColor: COLORS.successGreen, borderTopWidth: 3 }]}>
              <Ionicons name="flash" size={28} color={COLORS.successGreen} />
              <Text style={[styles.projectTypeTitle, { color: textColor }]}>Quick Jobs</Text>
              <Text style={[styles.projectTypeDesc, { color: secondaryTextColor }]}>Same day</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.projectTypeCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1, borderTopColor: COLORS.warningAmber, borderTopWidth: 3 }]}>
              <Ionicons name="hammer" size={28} color={COLORS.warningAmber} />
              <Text style={[styles.projectTypeTitle, { color: textColor }]}>Medium</Text>
              <Text style={[styles.projectTypeDesc, { color: secondaryTextColor }]}>1-2 weeks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.projectTypeCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1, borderTopColor: COLORS.errorRed, borderTopWidth: 3 }]}>
              <Ionicons name="business" size={28} color={COLORS.errorRed} />
              <Text style={[styles.projectTypeTitle, { color: textColor }]}>Major</Text>
              <Text style={[styles.projectTypeDesc, { color: secondaryTextColor }]}>1+ months</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Browse by Category */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>🔍 Browse by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORY_CONFIG.map((cat) => (
              <TouchableOpacity 
                key={cat.slug} 
                style={[styles.categoryChip, { backgroundColor: surfaceColor, borderColor, borderWidth: 1 }]}
                onPress={() => handleCategoryPress(cat.slug)}
              >
                <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                <Text style={[styles.categoryChipText, { color: textColor }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Services */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>🔥 Popular Services</Text>
          <View style={styles.servicesGrid}>
            {POPULAR_SERVICES.map((service) => (
              <TouchableOpacity 
                key={service.slug} 
                style={[styles.serviceCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1, ...cardShadow }]}
                onPress={() => handleCategoryPress(service.slug)}
              >
                <View style={[styles.serviceIcon, { backgroundColor: `${service.color}20` }]}>
                  <Ionicons name={service.icon as any} size={24} color={service.color} />
                </View>
                <Text style={[styles.serviceLabel, { color: textColor }]}>{service.label}</Text>
                <Text style={[styles.serviceDesc, { color: secondaryTextColor }]}>{service.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* The Tavvy Promise */}
        <View style={styles.section}>
          <View style={styles.promiseCard}>
            <LinearGradient
              colors={['#1E3A5F', surfaceColor]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.promiseGradient, { borderColor: 'rgba(107, 127, 255, 0.2)', borderWidth: 1 }]}
            >
              <Text style={[styles.promiseTitle, { color: textColor }]}>🛡️ The Tavvy Promise</Text>
              <View style={styles.promiseList}>
                <View style={styles.promiseItem}>
                  <View style={styles.promiseCheck}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.promiseText, { color: COLORS.textSecondary }]}>
                    <Text style={{ color: textColor, fontWeight: '600' }}>Privacy protected</Text> - Contact info stays private until you hire
                  </Text>
                </View>
                <View style={styles.promiseItem}>
                  <View style={styles.promiseCheck}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.promiseText, { color: COLORS.textSecondary }]}>
                    <Text style={{ color: textColor, fontWeight: '600' }}>Vetted pros</Text> - We verify licenses and reviews
                  </Text>
                </View>
                <View style={styles.promiseItem}>
                  <View style={styles.promiseCheck}>
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                  <Text style={[styles.promiseText, { color: COLORS.textSecondary }]}>
                    <Text style={{ color: textColor, fontWeight: '600' }}>Match guarantee</Text> - We'll find the right pro for you
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Expert Guidance - Do's/Don'ts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>💡 Expert Guidance</Text>
          
          {/* Do's */}
          <View style={[styles.practiceCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1 }]}>
            <View style={styles.practiceHeader}>
              <View style={[styles.practiceIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.successGreen} />
              </View>
              <Text style={[styles.practiceTitle, { color: COLORS.successGreen }]}>Do's</Text>
            </View>
            {BEST_PRACTICES.dos.map((item, index) => (
              <View key={index} style={styles.practiceItem}>
                <Ionicons name="checkmark" size={16} color={COLORS.successGreen} />
                <Text style={[styles.practiceText, { color: textColor }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Don'ts */}
          <View style={[styles.practiceCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1 }]}>
            <View style={styles.practiceHeader}>
              <View style={[styles.practiceIconBg, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Ionicons name="close-circle" size={20} color={COLORS.errorRed} />
              </View>
              <Text style={[styles.practiceTitle, { color: COLORS.errorRed }]}>Don'ts</Text>
            </View>
            {BEST_PRACTICES.donts.map((item, index) => (
              <View key={index} style={styles.practiceItem}>
                <Ionicons name="close" size={16} color={COLORS.errorRed} />
                <Text style={[styles.practiceText, { color: textColor }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* What to Expect */}
          <View style={[styles.practiceCard, { backgroundColor: surfaceColor, borderColor, borderWidth: 1 }]}>
            <View style={styles.practiceHeader}>
              <View style={[styles.practiceIconBg, { backgroundColor: 'rgba(107, 127, 255, 0.15)' }]}>
                <Ionicons name="star" size={20} color={COLORS.primaryBlue} />
              </View>
              <Text style={[styles.practiceTitle, { color: COLORS.primaryBlue }]}>What to Expect</Text>
            </View>
            {BEST_PRACTICES.expect.map((item, index) => (
              <View key={index} style={styles.practiceItem}>
                <Ionicons name="star-outline" size={16} color={COLORS.primaryBlue} />
                <Text style={[styles.practiceText, { color: textColor }]}>{item}</Text>
              </View>
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
    fontSize: 34,
    fontWeight: '800',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  heroTagline: {
    fontSize: 17,
    fontWeight: '500',
    marginTop: 8,
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
    backgroundColor: COLORS.primaryBlue,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Start a Project Card
  startProjectCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6B7FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  startProjectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  startProjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  startProjectContent: {
    flex: 1,
  },
  startProjectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startProjectSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },

  // Continue Request Card - Subtle/Secondary
  continueRequestCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueRequestInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderRadius: 14,
  },
  continueIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueRequestContent: {
    flex: 1,
  },
  continueRequestTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  continueRequestSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },

  // Social Proof
  socialProof: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    marginHorizontal: 20,
    marginBottom: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  proofItem: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  proofNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  proofLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  proofDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },

  // Steps
  stepsContainer: {
    gap: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    gap: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 18,
  },

  // Tavvy Shield
  tavvyShieldCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tavvyShieldGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 14,
  },
  shieldIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(107, 127, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldContent: {
    flex: 1,
  },
  shieldTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  shieldDesc: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Education Cards
  eduScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  eduCard: {
    width: 160,
    padding: 14,
    borderRadius: 14,
    marginRight: 10,
    gap: 8,
  },
  eduTitle: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  eduSubtitle: {
    fontSize: 11,
  },

  // Project Types
  projectTypesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  projectTypeCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
  },
  projectTypeTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  projectTypeDesc: {
    fontSize: 11,
  },

  // Category Chips
  categoryScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginRight: 10,
    gap: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Services Grid
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 52) / 2,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  serviceDesc: {
    fontSize: 11,
  },

  // Promise Card
  promiseCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  promiseGradient: {
    padding: 18,
    borderRadius: 16,
  },
  promiseTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  promiseList: {
    gap: 10,
  },
  promiseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  promiseCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.successGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Practice Cards
  practiceCard: {
    padding: 16,
    borderRadius: 14,
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
    fontSize: 15,
    fontWeight: '700',
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
  },
  practiceText: {
    fontSize: 14,
    flex: 1,
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
