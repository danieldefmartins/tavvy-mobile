/**
 * Pros Home Screen
 * Install path: screens/ProsHomeScreen.tsx
 * 
 * This is the main entry point for the Pros feature.
 * Add navigation to this screen from your main navigation.
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

import { ProsColors, PROS_CATEGORIES } from '../constants/ProsConfig';
import { ProsCategoryCard } from '../components/ProsCategoryCard';
import { ProsFeaturedCard } from '../components/ProsProviderCard';
import { ProsSubscriptionBanner } from '../components/ProsSubscriptionBanner';
import { useFeaturedPros, useProsSubscription } from '../hooks/usePros';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<any>;

export default function ProsHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { pros: featuredPros, loading: featuredLoading, fetchFeatured } = useFeaturedPros();
  const { earlyAdopterCount, fetchEarlyAdopterCount } = useProsSubscription();

  useEffect(() => {
    fetchFeatured(6);
    fetchEarlyAdopterCount();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFeatured(6), fetchEarlyAdopterCount()]);
    setRefreshing(false);
  };

  const handleSearch = () => {
    navigation.navigate('ProsBrowseScreen', {
      query: searchQuery,
      location,
    });
  };

  const handleCategoryPress = (slug: string) => {
    navigation.navigate('ProsBrowseScreen', { categorySlug: slug });
  };

  const handleProPress = (slug: string) => {
    navigation.navigate('ProsProfileScreen', { slug });
  };

  const handleProSignup = () => {
    navigation.navigate('ProsRegistrationScreen');
  };

  const remainingSpots = Math.max(0, 1000 - earlyAdopterCount);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
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
          {/* Early Adopter Badge */}
          {remainingSpots > 0 && (
            <TouchableOpacity style={styles.earlyAdopterBadge} onPress={handleProSignup}>
              <Ionicons name="sparkles" size={14} color={ProsColors.primary} />
              <Text style={styles.earlyAdopterText}>
                {remainingSpots} early adopter spots left
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
            <TouchableOpacity onPress={() => navigation.navigate('ProsBrowseScreen')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoriesGrid}>
            {PROS_CATEGORIES.slice(0, 8).map((category) => (
              <ProsCategoryCard
                key={category.id}
                {...category}
                onPress={handleCategoryPress}
              />
            ))}
          </View>
        </View>

        {/* Featured Pros */}
        {featuredPros.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Pros</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProsBrowseScreen')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={featuredPros}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <ProsFeaturedCard
                  pro={item}
                  onPress={handleProPress}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}

        {/* Pro CTA */}
        <ProsSubscriptionBanner
          earlyAdopterCount={earlyAdopterCount}
          onPress={handleProSignup}
        />

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
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

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
    marginTop: 8,
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
});
