/**
 * Pros Home Screen
 * Install path: screens/ProsHomeScreen.tsx
 * 
 * This is the main entry point for the Pros feature.
 * Users can browse services or switch to Pro mode.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

import { 
  ProsColors, 
  PROS_CATEGORIES, 
  EARLY_ADOPTER_PRICE,
  STANDARD_PRICE,
  EARLY_ADOPTER_SPOTS_LEFT,
  EARLY_ADOPTER_SAVINGS,
} from '../constants/ProsConfig';
import { ProsCategoryCard, ProsCategoryScroll } from '../components/ProsCategoryCard';
import { ProsProviderCard } from '../components/ProsProviderCard';
import { useSearchPros } from '../hooks/usePros';
import { useCategories } from '../hooks/useCategories';
import { useProsPendingRequests } from '../hooks/useProsPendingRequests';
import { Pro } from '../lib/ProsTypes';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProsHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'user' | 'pro'>('user');

  const { pros, loading, searchPros } = useSearchPros();
  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { getPendingRequest } = useProsPendingRequests();
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  useEffect(() => {
    // Load initial pros near user
    searchPros({ limit: 6 });
    
    // Check for pending requests
    checkPendingRequest();
  }, []);

  const checkPendingRequest = async () => {
    const pending = await getPendingRequest();
    if (pending) {
      setPendingRequest(pending);
    }
  };

  const handleResume = () => {
    if (!pendingRequest) return;
    
    const stepName = `ProsRequestStep${pendingRequest.step}`;
    navigation.navigate(stepName as any, pendingRequest.form_data);
    setPendingRequest(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await searchPros({ limit: 6 });
    setRefreshing(false);
  };

  const handleSearch = () => {
    navigation.navigate('ProsBrowse', {
      query: searchQuery,
      location,
    });
  };

  const handleCategoryPress = (slug: string) => {
    // Try to find category from fetched categories first, then fall back to hardcoded
    const category = categories.find(c => c.slug === slug) || PROS_CATEGORIES.find(c => c.slug === slug);
    if (category) {
      navigation.navigate('ProsRequestStep0');
    }
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

  const handleViewAll = () => {
    navigation.navigate('ProsBrowse');
  };

  const remainingSpots = EARLY_ADOPTER_SPOTS_LEFT;

  // If user switches to Pro mode, show Pro options
  if (viewMode === 'pro') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mode Toggle */}
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeToggle, viewMode === 'user' && styles.modeToggleActive]}
              onPress={() => setViewMode('user')}
            >
              <Ionicons name="search" size={18} color={viewMode === 'user' ? '#fff' : ProsColors.textSecondary} />
              <Text style={[styles.modeToggleText, viewMode === 'user' && styles.modeToggleTextActive]}>
                Find Pros
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeToggle, viewMode === 'pro' && styles.modeToggleActive]}
              onPress={() => setViewMode('pro')}
            >
              <Ionicons name="construct" size={18} color={viewMode === 'pro' ? '#fff' : ProsColors.textSecondary} />
              <Text style={[styles.modeToggleText, viewMode === 'pro' && styles.modeToggleTextActive]}>
                I'm a Pro
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pro Mode Content */}
          <View style={styles.proModeContainer}>
            <View style={styles.proModeHeader}>
              <Ionicons name="construct" size={48} color={ProsColors.primary} />
              <Text style={styles.proModeTitle}>Welcome, Pro!</Text>
              <Text style={styles.proModeSubtitle}>
                Manage your business and connect with customers
              </Text>
            </View>

            {/* Pro Actions */}
            <View style={styles.proActionsGrid}>
              <TouchableOpacity style={styles.proActionCard} onPress={handleProDashboard}>
                <View style={[styles.proActionIcon, { backgroundColor: `${ProsColors.primary}15` }]}>
                  <Ionicons name="grid" size={28} color={ProsColors.primary} />
                </View>
                <Text style={styles.proActionTitle}>Dashboard</Text>
                <Text style={styles.proActionSubtitle}>View stats & leads</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.proActionCard} 
                onPress={() => navigation.navigate('ProsLeads')}
              >
                <View style={[styles.proActionIcon, { backgroundColor: `${ProsColors.success}15` }]}>
                  <Ionicons name="mail" size={28} color={ProsColors.success} />
                </View>
                <Text style={styles.proActionTitle}>Leads</Text>
                <Text style={styles.proActionSubtitle}>Manage requests</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.proActionCard}
                onPress={() => navigation.navigate('ProsMessages')}
              >
                <View style={[styles.proActionIcon, { backgroundColor: `${ProsColors.secondary}15` }]}>
                  <Ionicons name="chatbubbles" size={28} color={ProsColors.secondary} />
                </View>
                <Text style={styles.proActionTitle}>Messages</Text>
                <Text style={styles.proActionSubtitle}>Chat with clients</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.proActionCard}
                onPress={() => navigation.navigate('ProsProfile', { slug: 'my-profile' })}
              >
                <View style={[styles.proActionIcon, { backgroundColor: `${ProsColors.warning}15` }]}>
                  <Ionicons name="person" size={28} color={ProsColors.warning} />
                </View>
                <Text style={styles.proActionTitle}>My Profile</Text>
                <Text style={styles.proActionSubtitle}>Edit your listing</Text>
              </TouchableOpacity>
            </View>

            {/* Not registered yet? */}
            <View style={styles.notRegisteredSection}>
              <View style={styles.savingsBadge}>
                <Ionicons name="sparkles" size={16} color="#fff" />
                <Text style={styles.savingsBadgeText}>SAVE ${EARLY_ADOPTER_SAVINGS}</Text>
              </View>
              <Text style={styles.notRegisteredTitle}>Join as an Early Adopter</Text>
              <Text style={styles.notRegisteredSubtitle}>
                The first 1,000 pros pay just a fraction of the regular price.
                Only {remainingSpots} spots remaining!
              </Text>
              <View style={styles.pricingComparison}>
                <Text style={styles.originalPrice}>${STANDARD_PRICE}/year</Text>
                <Text style={styles.discountedPrice}>${EARLY_ADOPTER_PRICE}/year</Text>
              </View>
              <TouchableOpacity style={styles.registerButton} onPress={handleProSignup}>
                <Text style={styles.registerButtonText}>Claim Your Spot - ${EARLY_ADOPTER_PRICE}/year</Text>
              </TouchableOpacity>
              <Text style={styles.earlyAdopterNote}>
                ✓ No per-lead fees  ✓ Unlimited leads  ✓ Verified badge
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // User Mode (default) - Find Pros
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TavvY Pros</Text>
        <View style={styles.headerToggle}>
          <TouchableOpacity
            style={[styles.modeToggle, viewMode === 'user' && styles.modeToggleActive]}
            onPress={() => setViewMode('user')}
          >
            <Text style={[styles.modeToggleText, viewMode === 'user' && styles.modeToggleTextActive]}>
              Find Pros
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeToggle, viewMode === 'pro' && styles.modeToggleActive]}
            onPress={() => setViewMode('pro')}
          >
            <Text style={[styles.modeToggleText, viewMode === 'pro' && styles.modeToggleTextActive]}>
              I'm a Pro
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

        {/* Hero Section */}
        <LinearGradient
          colors={[ProsColors.heroBg, '#FFFFFF']}
          style={styles.heroSection}
        >
          {/* Resume Pending Project Banner */}
          {pendingRequest && (
            <TouchableOpacity style={styles.resumeBanner} onPress={handleResume}>
              <View style={styles.resumeContent}>
                <Ionicons name="time" size={20} color="#FFFFFF" />
                <View style={styles.resumeTextContainer}>
                  <Text style={styles.resumeTitle}>Continue your request?</Text>
                  <Text style={styles.resumeSubtitle}>You have an unfinished project for {pendingRequest.form_data.categoryName || 'a service'}.</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
          {/* Early Adopter Badge */}
          {remainingSpots > 0 && (
            <TouchableOpacity style={styles.earlyAdopterBadge} onPress={handleProSignup}>
              <Ionicons name="sparkles" size={14} color={ProsColors.primary} />
              <Text style={styles.earlyAdopterText}>
                Are you a Pro? Save ${EARLY_ADOPTER_SAVINGS} · Only {remainingSpots} spots left!
              </Text>
            </TouchableOpacity>
          )}

          <Text style={styles.heroTitle}>
            Find Trusted Local{'\n'}
            <Text style={styles.heroTitleAccent}>Home Service Pros</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Connect with verified electricians, plumbers, cleaners, and more.
            Get quotes in minutes, not days.
          </Text>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={ProsColors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="What service do you need? (e.g. Plumber)"
                placeholderTextColor={ProsColors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.locationInputContainer}>
              <Ionicons name="location" size={20} color={ProsColors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="City or ZIP code"
                placeholderTextColor={ProsColors.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Ionicons name="checkmark-circle-outline" size={16} color={ProsColors.success} />
              <Text style={styles.trustBadgeText}>Verified Pros</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="star-outline" size={16} color={ProsColors.warning} />
              <Text style={styles.trustBadgeText}>Community Reviews</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="time-outline" size={16} color={ProsColors.primary} />
              <Text style={styles.trustBadgeText}>Fast Response</Text>
            </View>
          </View>

          {/* Start a Project CTA */}
          <TouchableOpacity 
            style={styles.startProjectButton}
            onPress={() => navigation.navigate('ProsRequestStep0')}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startProjectGradient}
            >
              <View style={styles.startProjectContent}>
                <View style={styles.startProjectIconContainer}>
                  <Ionicons name="add-circle" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.startProjectTextContainer}>
                  <Text style={styles.startProjectTitle}>Start a Project</Text>
                  <Text style={styles.startProjectSubtitle}>Get quotes from multiple pros in minutes</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Browse by Service - Horizontal Scroll */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Service</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {(categories.length > 0 ? categories : PROS_CATEGORIES).map((category) => (
              <ProsCategoryCard
                key={category.id}
                {...category}
                onPress={() => handleCategoryPress(category.slug)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Pros Near You - The "Browse" List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pros Near You</Text>
            <TouchableOpacity onPress={handleViewAll}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.featuredList}>
            {pros.map((pro) => (
              <ProsProviderCard
                key={pro.id}
                pro={pro}
                onPress={() => handleProPress(pro.slug)}
              />
            ))}
            {loading && <ActivityIndicator size="small" color={ProsColors.primary} style={{ marginVertical: 20 }} />}
          </View>
        </View>

        {/* How it Works */}
        <View style={[styles.section, { backgroundColor: '#F9FAFB' }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>How it Works</Text>
          </View>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: `${ProsColors.primary}15` }]}>
                <Ionicons name="list" size={24} color={ProsColors.primary} />
              </View>
              <View>
                <Text style={styles.stepTitle}>1. Describe your project</Text>
                <Text style={styles.stepDescription}>Tell us what you need and when you need it.</Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: `${ProsColors.secondary}15` }]}>
                <Ionicons name="people" size={24} color={ProsColors.secondary} />
              </View>
              <View>
                <Text style={styles.stepTitle}>2. Get matched with pros</Text>
                <Text style={styles.stepDescription}>We'll notify top-rated local professionals.</Text>
              </View>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: `${ProsColors.success}15` }]}>
                <Ionicons name="chatbubbles" size={24} color={ProsColors.success} />
              </View>
              <View>
                <Text style={styles.stepTitle}>3. Compare and hire</Text>
                <Text style={styles.stepDescription}>Review quotes, chat, and choose the best pro.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pro Link */}
        <View style={styles.proLinkSection}>
          <Text style={styles.proLinkText}>Are you a service professional?</Text>
          <TouchableOpacity onPress={() => setViewMode('pro')}>
            <Text style={styles.proLinkButton}>Switch to Pro Mode</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  headerToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  // Mode Toggle
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  modeToggleActive: {
    backgroundColor: ProsColors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: ProsColors.textSecondary,
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
  },
  // Hero Section
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  earlyAdopterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ProsColors.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: `${ProsColors.primary}20`,
  },
  earlyAdopterText: {
    fontSize: 12,
    fontWeight: '600',
    color: ProsColors.primary,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: ProsColors.textPrimary,
    lineHeight: 40,
    marginBottom: 12,
  },
  heroTitleAccent: {
    color: ProsColors.primary,
  },
  heroSubtitle: {
    fontSize: 16,
    color: ProsColors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 8,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: ProsColors.textPrimary,
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustBadgeText: {
    fontSize: 12,
    color: ProsColors.textSecondary,
  },
  // Sections
  section: {
    paddingVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  categoriesSection: {
    paddingVertical: 16,
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  // Steps
  stepsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 24,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    flex: 1,
  },
  // Pro Link
  proLinkSection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  proLinkText: {
    fontSize: 15,
    color: ProsColors.textSecondary,
    marginBottom: 8,
  },
  proLinkButton: {
    fontSize: 16,
    fontWeight: '700',
    color: ProsColors.primary,
  },
  // Pro Mode Styles
  proModeContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  proModeHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  proModeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  proModeSubtitle: {
    fontSize: 16,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  proActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
  proActionCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  proActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  proActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  proActionSubtitle: {
    fontSize: 12,
    color: ProsColors.textSecondary,
  },
  notRegisteredSection: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notRegisteredTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  notRegisteredSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  pricingComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  originalPrice: {
    fontSize: 16,
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  earlyAdopterNote: {
    fontSize: 12,
    color: '#6B7280',
  },
  resumeBanner: {
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resumeTextContainer: {
    flex: 1,
  },
  resumeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resumeSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
  },
  // Start a Project CTA styles
  startProjectButton: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startProjectGradient: {
    borderRadius: 16,
    padding: 16,
  },
  startProjectContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startProjectIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  startProjectTextContainer: {
    flex: 1,
  },
  startProjectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  startProjectSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
});
