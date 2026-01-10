/**
 * Pros Category Landing Screen
 * Install path: screens/ProsCategoryLandingScreen.tsx
 * 
 * Dedicated landing page for each service category.
 * Explains how TavvY works and shows top-rated pros in the category.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { ProsColors, PROS_CATEGORIES } from '../constants/ProsConfig';
import { ProsProviderCard } from '../components/ProsProviderCard';
import { useSearchPros } from '../hooks/usePros';

const { width } = Dimensions.get('window');

type RouteParams = {
  ProsCategoryLandingScreen: {
    categoryId: number;
    categorySlug: string;
    categoryName: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

// Category hero images (placeholder URLs - replace with actual images)
const CATEGORY_IMAGES: Record<string, string> = {
  electrician: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
  plumber: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800',
  'pool-cleaning': 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800',
  'floor-installation': 'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800',
  'kitchen-remodeling': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
  'house-cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
  hvac: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
  roofing: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=800',
  painting: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800',
  landscaping: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800',
  handyman: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
  'pest-control': 'https://images.unsplash.com/photo-1632935190605-828e3c9a8c0e?w=800',
};

// Popular services by category
const POPULAR_SERVICES: Record<string, string[]> = {
  electrician: ['Panel Upgrade', 'EV Charger Install', 'Rewiring', 'Outlet Repair', 'Lighting', 'Smart Home'],
  plumber: ['Leak Repair', 'Drain Cleaning', 'Water Heater', 'Pipe Replacement', 'Faucet Install', 'Toilet Repair'],
  'pool-cleaning': ['Weekly Cleaning', 'Chemical Balance', 'Filter Repair', 'Pool Opening', 'Algae Treatment', 'Equipment Check'],
  'floor-installation': ['Hardwood', 'Tile', 'Laminate', 'Vinyl', 'Carpet', 'Refinishing'],
  'kitchen-remodeling': ['Cabinet Install', 'Countertops', 'Backsplash', 'Appliances', 'Lighting', 'Full Remodel'],
  'house-cleaning': ['Deep Clean', 'Regular Clean', 'Move-In/Out', 'Post-Construction', 'Office Cleaning', 'Window Cleaning'],
  hvac: ['AC Repair', 'Heating Repair', 'Installation', 'Maintenance', 'Duct Cleaning', 'Thermostat'],
  roofing: ['Roof Repair', 'Replacement', 'Inspection', 'Gutter Install', 'Leak Fix', 'Shingle Repair'],
  painting: ['Interior', 'Exterior', 'Cabinet Painting', 'Deck Staining', 'Wallpaper', 'Touch-ups'],
  landscaping: ['Lawn Care', 'Tree Trimming', 'Garden Design', 'Irrigation', 'Hardscaping', 'Mulching'],
  handyman: ['Furniture Assembly', 'Drywall Repair', 'Door Install', 'Shelving', 'TV Mounting', 'Minor Repairs'],
  'pest-control': ['Termites', 'Rodents', 'Ants', 'Roaches', 'Bed Bugs', 'Prevention'],
};

// How it works steps
const HOW_IT_WORKS = [
  {
    number: '1',
    title: 'Describe Your Project',
    description: 'Share details about your needs and desired timeline to get started.',
    icon: 'clipboard-outline',
  },
  {
    number: '2',
    title: 'Get Matched with Pros',
    description: 'Receive quotes and profiles from qualified local professionals.',
    icon: 'people-outline',
  },
  {
    number: '3',
    title: 'Compare & Choose',
    description: 'Review ratings, past work, and prices to select the best pro.',
    icon: 'checkmark-circle-outline',
  },
];

export default function ProsCategoryLandingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsCategoryLandingScreen'>>();
  const { categoryId, categorySlug, categoryName } = route.params;

  const { pros, loading, searchPros } = useSearchPros();
  const [imageError, setImageError] = useState(false);

  const category = PROS_CATEGORIES.find(c => c.id === categoryId);
  const heroImage = CATEGORY_IMAGES[categorySlug] || CATEGORY_IMAGES.handyman;
  const popularServices = POPULAR_SERVICES[categorySlug] || POPULAR_SERVICES.handyman;

  useEffect(() => {
    searchPros({ categorySlug, limit: 4 });
  }, [categorySlug]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleGetQuotes = () => {
    navigation.navigate('ProsRequestStep1Screen', {
      categoryId,
      categoryName,
    });
  };

  const handleProPress = (slug: string) => {
    navigation.navigate('ProsProfileScreen', { slug });
  };

  const handleServicePress = (service: string) => {
    navigation.navigate('ProsRequestStep1Screen', {
      categoryId,
      categoryName,
      projectTitle: service,
    });
  };

  const handleBrowseAll = () => {
    navigation.navigate('ProsBrowseScreen', { categorySlug, categoryName });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={ProsColors.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName} Services</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          {!imageError ? (
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <Ionicons name={category?.icon as any || 'construct'} size={48} color={ProsColors.textMuted} />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Find Licensed {categoryName}s{'\n'}Near You
            </Text>
            <Text style={styles.heroSubtitle}>
              Connect with pre-screened local pros for residential and commercial projects.
            </Text>
          </View>
        </View>

        {/* How TavvY Works Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>How TavvY Works</Text>
            <View style={styles.sectionUnderline} />
          </View>
          
          <View style={styles.stepsContainer}>
            {HOW_IT_WORKS.map((step, index) => (
              <View key={index} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepNumber}>{step.number}.</Text>
                  <View style={styles.stepIconContainer}>
                    <Ionicons name={step.icon as any} size={24} color={ProsColors.primary} />
                  </View>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Popular Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Services</Text>
          <View style={styles.servicesContainer}>
            {popularServices.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.servicePill,
                  index === 0 && styles.servicePillPrimary,
                ]}
                onPress={() => handleServicePress(service)}
              >
                <Text style={[
                  styles.servicePillText,
                  index === 0 && styles.servicePillTextPrimary,
                ]}>
                  {service}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top Rated Pros Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Top Rated {categoryName}s</Text>
            <TouchableOpacity onPress={handleBrowseAll}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ProsColors.primary} />
            </View>
          ) : pros.length > 0 ? (
            <View style={styles.prosGrid}>
              {pros.slice(0, 4).map((pro) => (
                <TouchableOpacity
                  key={pro.id}
                  style={styles.proCard}
                  onPress={() => handleProPress(pro.slug)}
                >
                  <View style={styles.proImageContainer}>
                    {pro.logoUrl ? (
                      <Image source={{ uri: pro.logoUrl }} style={styles.proImage} />
                    ) : (
                      <View style={[styles.proImage, styles.proImagePlaceholder]}>
                        <Ionicons name="person" size={24} color={ProsColors.textMuted} />
                      </View>
                    )}
                    {pro.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={ProsColors.primary} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.proName} numberOfLines={1}>{pro.businessName}</Text>
                  <View style={styles.proRating}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.proRatingText}>
                      {pro.averageRating} ({pro.totalReviews})
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.requestQuoteButton}
                    onPress={() => navigation.navigate('ProsRequestStep1Screen', {
                      proId: pro.id,
                      proName: pro.businessName,
                      categoryId,
                      categoryName,
                    })}
                  >
                    <Text style={styles.requestQuoteText}>Request Quote</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={ProsColors.textMuted} />
              <Text style={styles.emptyText}>No pros found in this category yet</Text>
            </View>
          )}
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to get started?</Text>
          <Text style={styles.ctaSubtitle}>
            Describe your project and get matched with qualified {categoryName.toLowerCase()}s in your area.
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleGetQuotes}>
            <Text style={styles.ctaButtonText}>Get Free Quotes</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    color: ProsColors.textPrimary,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'left',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'left',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  sectionUnderline: {
    width: 40,
    height: 3,
    backgroundColor: ProsColors.primary,
    marginTop: 8,
    borderRadius: 2,
  },
  seeAllText: {
    fontSize: 14,
    color: ProsColors.primary,
    fontWeight: '600',
  },
  stepsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ProsColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: ProsColors.primary,
    marginRight: 8,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${ProsColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 11,
    color: ProsColors.textSecondary,
    lineHeight: 16,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  servicePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ProsColors.primary,
    backgroundColor: '#FFFFFF',
  },
  servicePillPrimary: {
    backgroundColor: ProsColors.primary,
  },
  servicePillText: {
    fontSize: 14,
    fontWeight: '500',
    color: ProsColors.primary,
  },
  servicePillTextPrimary: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  prosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  proCard: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: ProsColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  proImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  proImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  proImagePlaceholder: {
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  proName: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  proRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  proRatingText: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  requestQuoteButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  requestQuoteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginTop: 12,
  },
  ctaSection: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: `${ProsColors.primary}10`,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
