/**
 * Pros Category Landing Screen (UPDATED to match mockup)
 * Install path: screens/ProsCategoryLandingScreen.tsx
 * 
 * Dedicated landing page for each service category.
 * Explains how TavvY works and shows top-rated pros in the category.
 * DESIGN MATCHES: service_landing_page.png mockup
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

import { ProsColors, SAMPLE_PROS } from '../constants/ProsConfig';

const { width } = Dimensions.get('window');

type RouteParams = {
  ProsCategoryLandingScreen: {
    categoryId: string;
    categoryName: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

// Category hero images
const CATEGORY_IMAGES: Record<string, string> = {
  electrician: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
  plumber: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800',
  pool_cleaning: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800',
  house_cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
  hvac: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
  roofing: 'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=800',
  painting: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=800',
  landscaping: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800',
};

// Popular services by category
const POPULAR_SERVICES: Record<string, string[]> = {
  electrician: ['Panel Upgrade', 'EV Charger Install', 'Rewiring', 'Outlet Repair', 'Lighting', 'Smart Home'],
  plumber: ['Leak Repair', 'Drain Cleaning', 'Water Heater', 'Pipe Replacement', 'Faucet Install', 'Toilet Repair'],
  pool_cleaning: ['Weekly Cleaning', 'Chemical Balance', 'Filter Repair', 'Pool Opening', 'Algae Treatment', 'Equipment Check'],
  house_cleaning: ['Deep Clean', 'Regular Clean', 'Move-In/Out', 'Post-Construction', 'Office Cleaning', 'Window Cleaning'],
  hvac: ['AC Repair', 'Heating Repair', 'Installation', 'Maintenance', 'Duct Cleaning', 'Thermostat'],
  roofing: ['Roof Repair', 'Replacement', 'Inspection', 'Gutter Install', 'Leak Fix', 'Shingle Repair'],
  painting: ['Interior', 'Exterior', 'Cabinet Painting', 'Deck Staining', 'Wallpaper', 'Touch-ups'],
  landscaping: ['Lawn Care', 'Tree Trimming', 'Garden Design', 'Irrigation', 'Hardscaping', 'Mulching'],
};

// How it works steps - matches mockup design
const HOW_IT_WORKS = [
  {
    number: '1',
    title: 'Describe Your Project',
    description: 'Share details about your needs and desired timeline to get started.',
    icon: 'clipboard-outline',
    color: ProsColors.primary,
  },
  {
    number: '2',
    title: 'Get Matched with Pros',
    description: 'Receive quotes and profiles from qualified local professionals willing to do the job.',
    icon: 'people-outline',
    color: '#3B82F6',
  },
  {
    number: '3',
    title: 'Compare & Choose',
    description: 'Review ratings, past work, and prices to select the best pro for your project.',
    icon: 'checkmark-circle',
    color: ProsColors.primary,
  },
];

export default function ProsCategoryLandingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsCategoryLandingScreen'>>();
  const { categoryId, categoryName } = route.params;

  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Use sample data
  const pros = SAMPLE_PROS.filter(p => p.category.toLowerCase() === categoryId.toLowerCase()).slice(0, 4);
  const heroImage = CATEGORY_IMAGES[categoryId] || CATEGORY_IMAGES.electrician;
  const popularServices = POPULAR_SERVICES[categoryId] || POPULAR_SERVICES.electrician;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleGetQuotes = () => {
    navigation.navigate('ProsRequestStep1Screen', {
      categoryId,
      categoryName,
    });
  };

  const handleProPress = (proId: string) => {
    navigation.navigate('ProsProfileScreen', { proId });
  };

  const handleServicePress = (service: string) => {
    navigation.navigate('ProsRequestStep1Screen', {
      categoryId,
      categoryName,
      projectTitle: service,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - matches mockup */}
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
        {/* Hero Section - matches mockup with image and overlay text */}
        <View style={styles.heroSection}>
          {!imageError ? (
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <Ionicons name="construct" size={48} color={ProsColors.textMuted} />
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Find Licensed{'\n'}{categoryName}s{'\n'}Near You
            </Text>
            <Text style={styles.heroSubtitle}>
              Connect with pre-screened local pros for residential and commercial {categoryName.toLowerCase()} projects.
            </Text>
          </View>
        </View>

        {/* How TavvY Works Section - matches mockup with cards */}
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
                  <View style={[styles.stepIconContainer, { backgroundColor: `${step.color}15` }]}>
                    <Ionicons name={step.icon as any} size={22} color={step.color} />
                  </View>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Popular Services Section - matches mockup with pill tags */}
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

        {/* Top Rated Pros Section - matches mockup with horizontal cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Rated {categoryName}s</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ProsColors.primary} />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.prosScrollContent}
            >
              {(pros.length > 0 ? pros : SAMPLE_PROS.slice(0, 4)).map((pro) => (
                <TouchableOpacity
                  key={pro.id}
                  style={styles.proCard}
                  onPress={() => handleProPress(pro.id)}
                >
                  {/* Pro Image */}
                  <View style={styles.proImageContainer}>
                    <View style={styles.proImagePlaceholder}>
                      <Ionicons name="person" size={28} color={ProsColors.textMuted} />
                    </View>
                    {pro.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={ProsColors.primary} />
                      </View>
                    )}
                  </View>

                  {/* Pro Info */}
                  <View style={styles.proInfo}>
                    <Text style={styles.proName} numberOfLines={1}>{pro.name}</Text>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{pro.rating}</Text>
                      <Text style={styles.reviewCount}>({pro.reviewCount} reviews)</Text>
                    </View>
                  </View>

                  {/* Request Quote Button */}
                  <TouchableOpacity
                    style={styles.requestQuoteButton}
                    onPress={() => handleGetQuotes()}
                  >
                    <Text style={styles.requestQuoteButtonText}>Request Quote</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to get started?</Text>
          <Text style={styles.ctaSubtitle}>
            Describe your project and get matched with top-rated {categoryName.toLowerCase()}s in your area.
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleGetQuotes}>
            <Text style={styles.ctaButtonText}>Get Free Quotes</Text>
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
    paddingBottom: 20,
  },

  // Hero Section - matches mockup
  heroSection: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
    marginBottom: 8,
    textAlign: 'left',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    textAlign: 'left',
  },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  sectionUnderline: {
    width: 40,
    height: 3,
    backgroundColor: ProsColors.primary,
    borderRadius: 1.5,
  },

  // Steps - matches mockup with cards
  stepsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  stepCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginRight: 8,
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 11,
    color: ProsColors.textSecondary,
    lineHeight: 16,
  },

  // Services - matches mockup with pills
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  servicePill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ProsColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
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

  // Pros - matches mockup with horizontal scroll
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prosScrollContent: {
    paddingTop: 12,
    gap: 12,
  },
  proCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  proImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
  },
  proImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  proInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  proName: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  reviewCount: {
    fontSize: 12,
    color: ProsColors.textSecondary,
  },
  requestQuoteButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  requestQuoteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // CTA Section
  ctaSection: {
    marginHorizontal: 16,
    marginTop: 32,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
