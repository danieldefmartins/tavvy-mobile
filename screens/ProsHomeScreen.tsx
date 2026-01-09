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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { 
  ProsColors, 
  PROS_CATEGORIES, 
  SAMPLE_PROS,
  EARLY_ADOPTER_PRICE,
  STANDARD_PRICE,
  EARLY_ADOPTER_SPOTS_LEFT,
  EARLY_ADOPTER_SAVINGS,
} from '../constants/ProsConfig';
import { ProsCategoryCard } from '../components/ProsCategoryCard';
import { ProsProviderCard } from '../components/ProsProviderCard';
import { ProsSubscriptionBanner } from '../components/ProsSubscriptionBanner';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<any>;

export default function ProsHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'user' | 'pro'>('user');

  // Use sample data for now
  const featuredPros = SAMPLE_PROS.slice(0, 6);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSearch = () => {
    navigation.navigate('ProsBrowse', {
      query: searchQuery,
      location,
    });
  };

  const handleCategoryPress = (categorySlug: string) => {
    navigation.navigate('ProsBrowse', { categorySlug });
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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

        {/* Hero Section */}
        <LinearGradient
          colors={[ProsColors.heroBg, '#FFFFFF']}
          style={styles.heroSection}
        >
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
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={ProsColors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="What service do you need?"
                placeholderTextColor={ProsColors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.locationInputContainer}>
              <Ionicons name="location-outline" size={20} color={ProsColors.textMuted} />
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

          {/* Trust Badges */}
          <View style={styles.trustBadges}>
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark-outline" size={16} color={ProsColors.primary} />
              <Text style={styles.trustBadgeText}>Verified Pros</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="star-outline" size={16} color={ProsColors.primary} />
              <Text style={styles.trustBadgeText}>Community Reviews</Text>
            </View>
            <View style={styles.trustBadge}>
              <Ionicons name="time-outline" size={16} color={ProsColors.primary} />
              <Text style={styles.trustBadgeText}>Fast Response</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Browse by Service */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse by Service</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProsBrowse')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            {PROS_CATEGORIES.slice(0, 8).map((category) => (
              <ProsCategoryCard
                key={category.id}
                category={category}
                onPress={() => handleCategoryPress(category.slug)}
              />
            ))}
          </View>
        </View>

        {/* Featured Pros */}
        {featuredPros.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Pros</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProsBrowse')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={featuredPros}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <ProsProviderCard
                  provider={item}
                  onPress={() => handleProPress(item.slug)}
                  style={{ width: width * 0.7, marginRight: 12 }}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}

        {/* Pro CTA */}
        <ProsSubscriptionBanner
          onPress={handleProSignup}
        />

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: 16 }]}>How It Works</Text>
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: `${ProsColors.primary}15` }]}>
                <Ionicons name="search" size={24} color={ProsColors.primary} />
              </View>
              <Text style={styles.stepTitle}>1. Search</Text>
              <Text style={styles.stepDescription}>
                Find local pros by service type and location
              </Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: `${ProsColors.secondary}15` }]}>
                <Ionicons name="chatbubbles" size={24} color={ProsColors.secondary} />
              </View>
              <Text style={styles.stepTitle}>2. Connect</Text>
              <Text style={styles.stepDescription}>
                Message pros directly and request quotes
              </Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: `${ProsColors.success}15` }]}>
                <Ionicons name="checkmark-circle" size={24} color={ProsColors.success} />
              </View>
              <Text style={styles.stepTitle}>3. Hire</Text>
              <Text style={styles.stepDescription}>
                Choose the best pro and get the job done
              </Text>
            </View>
          </View>
        </View>

        {/* Are you a Pro? Link */}
        <View style={styles.proLinkSection}>
          <Text style={styles.proLinkText}>Are you a home service professional?</Text>
          <TouchableOpacity onPress={() => setViewMode('pro')}>
            <Text style={styles.proLinkButton}>Join TavvY Pros →</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing for tab bar */}
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
  // Mode Toggle
  modeToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  modeToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeToggleActive: {
    backgroundColor: ProsColors.primary,
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textSecondary,
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
  },
  // Hero Section
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  earlyAdopterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  earlyAdopterText: {
    fontSize: 12,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginLeft: 6,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 12,
  },
  heroTitleAccent: {
    color: ProsColors.primary,
  },
  heroSubtitle: {
    fontSize: 15,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: ProsColors.textPrimary,
    marginLeft: 8,
  },
  searchButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustBadgeText: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  section: {
    paddingTop: 24,
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
  featuredList: {
    paddingHorizontal: 16,
  },
  stepsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  stepIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Pro Link Section
  proLinkSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  proLinkText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginBottom: 8,
  },
  proLinkButton: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.primary,
  },
  // Pro Mode Styles
  proModeContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    fontSize: 15,
    color: ProsColors.textSecondary,
    textAlign: 'center',
  },
  proActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  proActionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  proActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: ProsColors.heroBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  notRegisteredTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  notRegisteredSubtitle: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  earlyAdopterNote: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  savingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pricingComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  originalPrice: {
    fontSize: 18,
    color: ProsColors.textMuted,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: ProsColors.primary,
  },
});