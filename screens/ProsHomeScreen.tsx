/**
 * Pros Home Screen (UPDATED to match mockup)
 * Install path: screens/ProsHomeScreen.tsx
 * 
 * This is the main entry point for the Pros feature.
 * Users can browse services or switch to Pro mode.
 * 
 * DESIGN MATCHES: pros_home_screen.png mockup
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<any>;

// Category data matching the mockup
const CATEGORY_ICONS = [
  { id: 'electrician', name: 'Electrician', icon: 'flash', color: '#16A34A' },
  { id: 'plumber', name: 'Plumber', icon: 'water', color: '#3B82F6' },
  { id: 'pool_cleaning', name: 'Pool Cleaning', icon: 'water-outline', color: '#3B82F6' },
  { id: 'house_cleaning', name: 'House Cleaning', icon: 'sparkles', color: '#F59E0B' },
  { id: 'hvac', name: 'HVAC', icon: 'thermometer', color: '#EF4444' },
  { id: 'roofing', name: 'Roofing', icon: 'home', color: '#6B7280' },
  { id: 'landscaping', name: 'Landscaping', icon: 'leaf', color: '#16A34A' },
  { id: 'painting', name: 'Painting', icon: 'color-palette', color: '#8B5CF6' },
];

export default function ProsHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'user' | 'pro'>('user');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Use sample data for now
  const featuredPros = SAMPLE_PROS.slice(0, 4);
  const remainingSpots = EARLY_ADOPTER_SPOTS_LEFT;

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryId);
    navigation.navigate('ProsCategoryLandingScreen', { categoryId, categoryName });
  };

  const handleProPress = (proId: string) => {
    navigation.navigate('ProsProfileScreen', { proId });
  };

  const handleGetQuote = (proId: string, categoryName: string) => {
    navigation.navigate('ProsRequestStep1Screen', { 
      categoryId: proId,
      categoryName 
    });
  };

  const handleProSignup = () => {
    navigation.navigate('ProsRegistrationScreen');
  };

  const handleProDashboard = () => {
    navigation.navigate('ProsDashboardScreen');
  };

  // Pro Mode View
  if (viewMode === 'pro') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Toggle */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>TavvY Pros</Text>
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.toggleButton, viewMode === 'user' && styles.toggleButtonActive]}
                onPress={() => setViewMode('user')}
              >
                <Text style={[styles.toggleText, viewMode === 'user' && styles.toggleTextActive]}>
                  Find Pros
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, viewMode === 'pro' && styles.toggleButtonActive]}
                onPress={() => setViewMode('pro')}
              >
                <Text style={[styles.toggleText, viewMode === 'pro' && styles.toggleTextActive]}>
                  I'm a Pro
                </Text>
              </TouchableOpacity>
            </View>
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
                onPress={() => navigation.navigate('ProsLeadsScreen')}
              >
                <View style={[styles.proActionIcon, { backgroundColor: '#10B98115' }]}>
                  <Ionicons name="mail" size={28} color="#10B981" />
                </View>
                <Text style={styles.proActionTitle}>Leads</Text>
                <Text style={styles.proActionSubtitle}>Manage requests</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.proActionCard}
                onPress={() => navigation.navigate('ProsMessagesScreen')}
              >
                <View style={[styles.proActionIcon, { backgroundColor: '#3B82F615' }]}>
                  <Ionicons name="chatbubbles" size={28} color="#3B82F6" />
                </View>
                <Text style={styles.proActionTitle}>Messages</Text>
                <Text style={styles.proActionSubtitle}>Chat with clients</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.proActionCard}
                onPress={() => navigation.navigate('ProsProfileScreen', { proId: 'my-profile' })}
              >
                <View style={[styles.proActionIcon, { backgroundColor: '#F59E0B15' }]}>
                  <Ionicons name="person" size={28} color="#F59E0B" />
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

  // User Mode (default) - Find Pros - MATCHES MOCKUP
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
        {/* Header with Toggle - Matches Mockup */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>TavvY Pros</Text>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'user' && styles.toggleButtonActive]}
              onPress={() => setViewMode('user')}
            >
              <Text style={[styles.toggleText, viewMode === 'user' && styles.toggleTextActive]}>
                Find Pros
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'pro' && styles.toggleButtonActive]}
              onPress={() => setViewMode('pro')}
            >
              <Text style={[styles.toggleText, viewMode === 'pro' && styles.toggleTextActive]}>
                I'm a Pro
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section - Matches Mockup */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Find Trusted Local{'\n'}Home Service Pros
          </Text>
          <Text style={styles.heroSubtitle}>
            Connect with verified electricians, plumbers, cleaners, and more. Get quotes in minutes.
          </Text>

          {/* Search Box - Matches Mockup */}
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
                placeholder="Location"
                placeholderTextColor={ProsColors.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>
        </View>

        {/* Category Icons - Horizontal Scroll - Matches Mockup */}
        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {CATEGORY_ICONS.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category.id, category.name)}
                activeOpacity={0.7}
              >
                <View style={[styles.categoryIconCircle, { backgroundColor: `${category.color}15` }]}>
                  <Ionicons name={category.icon as any} size={24} color={category.color} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                {selectedCategory === category.id && (
                  <View style={styles.categoryIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Pros Section - Matches Mockup */}
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Pros</Text>
          
          <View style={styles.prosGrid}>
            {featuredPros.map((pro) => (
              <TouchableOpacity
                key={pro.id}
                style={styles.proCard}
                onPress={() => handleProPress(pro.id)}
                activeOpacity={0.7}
              >
                {/* Pro Avatar */}
                <View style={styles.proCardHeader}>
                  <View style={styles.proAvatar}>
                    <Ionicons name="person" size={24} color={ProsColors.textMuted} />
                  </View>
                  <View style={styles.proInfo}>
                    <Text style={styles.proName} numberOfLines={2}>{pro.name}</Text>
                  </View>
                </View>

                {/* Rating */}
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingNumber}>{pro.rating}</Text>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.floor(pro.rating) ? 'star' : star - 0.5 <= pro.rating ? 'star-half' : 'star-outline'}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewCount}>({pro.reviewCount} reviews)</Text>
                </View>

                {/* Location */}
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={ProsColors.textSecondary} />
                  <Text style={styles.locationText}>{pro.location}</Text>
                </View>

                {/* Get Quote Button */}
                <TouchableOpacity
                  style={styles.getQuoteButton}
                  onPress={() => handleGetQuote(pro.id, pro.category)}
                >
                  <Text style={styles.getQuoteButtonText}>Get Quote</Text>
                </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header - Matches Mockup
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 3,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 17,
  },
  toggleButtonActive: {
    backgroundColor: ProsColors.primary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: ProsColors.textSecondary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },

  // Hero Section - Matches Mockup
  heroSection: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: ProsColors.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },

  // Search Container - Matches Mockup
  searchContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: ProsColors.textPrimary,
    marginLeft: 8,
  },

  // Categories Section - Matches Mockup
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginTop: 8,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '500',
    color: ProsColors.textPrimary,
    textAlign: 'center',
  },
  categoryIndicator: {
    width: 24,
    height: 3,
    backgroundColor: ProsColors.primary,
    borderRadius: 1.5,
    marginTop: 6,
  },

  // Featured Section - Matches Mockup
  featuredSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 16,
  },
  prosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  proCard: {
    width: (width - 44) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  proCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  proAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  proInfo: {
    flex: 1,
  },
  proName: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginRight: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: ProsColors.textSecondary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  getQuoteButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  getQuoteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F59E0B',
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
