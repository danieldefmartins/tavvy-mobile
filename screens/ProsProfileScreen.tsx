/**
 * Pros Profile Screen (UPDATED to match mockup)
 * Install path: screens/ProsProfileScreen.tsx
 * 
 * Displays a Pro's full profile with cover image, stats, tabs, and reviews.
 * DESIGN MATCHES: contractor_details_screen.png mockup
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors } from '../constants/ProsConfig';

const { width } = Dimensions.get('window');

type RouteParams = {
  ProsProfileScreen: {
    proId: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

// Tab options
const TABS = ['About', 'Services', 'Photos', 'Reviews'];

// Sample pro data (would come from API)
const SAMPLE_PRO = {
  id: '1',
  name: 'Ace Electric Services',
  tagline: 'Licensed & Insured Electrician',
  rating: 4.9,
  reviewCount: 127,
  yearsInBusiness: 15,
  location: 'Miami, FL',
  serviceRadius: '30 mi radius',
  isVerified: true,
  coverImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
  profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  description: 'Ace Electric Services is your trusted residential and commercial electrician in Miami. With over 15 years of experience, we specialize in electrical panel upgrades, rewiring, lighting installation, and emergency repairs. We are committed to safety, quality workmanship, and excellent customer service.',
  licenseNumber: 'EC13009876',
  insurance: 'General Liability $2M, Workers\' Compensation',
  services: [
    'Panel Upgrades', 'Rewiring', 'Lighting Installation', 'Troubleshooting',
    'EV Charger Install', 'Smart Home Setup', 'Safety Inspections', 'Generator Installation'
  ],
  recentWork: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400',
  ],
  reviews: [
    {
      id: '1',
      author: 'Sarah J.',
      avatar: null,
      rating: 5,
      date: 'Oct 12, 2023',
      text: 'Ace Electric Services did an amazing job upgrading our electrical panel. They were professional, efficient, and left the workspace clean. Highly recommend!',
    },
    {
      id: '2',
      author: 'Mike D.',
      avatar: null,
      rating: 5,
      date: 'Sept 28, 2023',
      text: 'Excellent service! Fixed a flickering light issue that others couldn\'t solve. Very knowledgeable and fair pricing. Will definitely use again.',
    },
  ],
};

export default function ProsProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsProfileScreen'>>();
  const { proId } = route.params;

  const [activeTab, setActiveTab] = useState('About');
  const scrollY = useRef(new Animated.Value(0)).current;

  // Use sample data for now
  const pro = SAMPLE_PRO;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRequestQuote = () => {
    navigation.navigate('ProsRequestStep1Screen', {
      categoryId: 'electrician',
      categoryName: 'Electrician',
      proId: pro.id,
    });
  };

  const handleMessage = () => {
    navigation.navigate('ProsMessagesScreen', {
      proId: pro.id,
      proName: pro.name,
    });
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= Math.floor(rating) ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
            size={16}
            color="#F59E0B"
          />
        ))}
      </View>
    );
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {/* Business Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Description</Text>
        <Text style={styles.descriptionText}>{pro.description}</Text>
      </View>

      {/* License & Insurance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>License & Insurance</Text>
        <Text style={styles.licenseText}>
          <Text style={styles.licenseLabel}>License Number: </Text>
          {pro.licenseNumber}
        </Text>
        <Text style={styles.licenseText}>
          <Text style={styles.licenseLabel}>Insurance: </Text>
          {pro.insurance}
        </Text>
      </View>

      {/* Services Offered */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services Offered</Text>
        <View style={styles.servicesContainer}>
          {pro.services.map((service, index) => (
            <View key={index} style={styles.servicePill}>
              <Text style={styles.servicePillText}>{service}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Work */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Work</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.workGallery}>
            {pro.recentWork.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.workImage}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Customer Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
        <View style={styles.reviewsContainer}>
          {pro.reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={styles.reviewerAvatar}>
                    <Ionicons name="person" size={16} color={ProsColors.textMuted} />
                  </View>
                  <View>
                    <Text style={styles.reviewerName}>{review.author}</Text>
                    {renderStars(review.rating)}
                  </View>
                </View>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderServicesTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Services</Text>
        <View style={styles.servicesListContainer}>
          {pro.services.map((service, index) => (
            <TouchableOpacity key={index} style={styles.serviceListItem}>
              <View style={styles.serviceListIcon}>
                <Ionicons name="checkmark-circle" size={20} color={ProsColors.primary} />
              </View>
              <Text style={styles.serviceListText}>{service}</Text>
              <Ionicons name="chevron-forward" size={20} color={ProsColors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderPhotosTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work Gallery</Text>
        <View style={styles.photosGrid}>
          {pro.recentWork.map((image, index) => (
            <TouchableOpacity key={index} style={styles.photoGridItem}>
              <Image source={{ uri: image }} style={styles.photoGridImage} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <View style={styles.reviewsSummary}>
          <Text style={styles.reviewsSummaryRating}>{pro.rating}</Text>
          {renderStars(pro.rating)}
          <Text style={styles.reviewsSummaryCount}>Based on {pro.reviewCount} reviews</Text>
        </View>
      </View>
      <View style={styles.section}>
        {pro.reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewerInfo}>
                <View style={styles.reviewerAvatar}>
                  <Ionicons name="person" size={16} color={ProsColors.textMuted} />
                </View>
                <View>
                  <Text style={styles.reviewerName}>{review.author}</Text>
                  {renderStars(review.rating)}
                </View>
              </View>
              <Text style={styles.reviewDate}>{review.date}</Text>
            </View>
            <Text style={styles.reviewText}>{review.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'About':
        return renderAboutTab();
      case 'Services':
        return renderServicesTab();
      case 'Photos':
        return renderPhotosTab();
      case 'Reviews':
        return renderReviewsTab();
      default:
        return renderAboutTab();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pro Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: pro.coverImage }}
            style={styles.coverImage}
          />
          {/* Profile Image - overlapping cover */}
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: pro.profileImage }}
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.proName}>{pro.name}</Text>
            {pro.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={ProsColors.primary} />
              </View>
            )}
          </View>
          <Text style={styles.proTagline}>{pro.tagline}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star-outline" size={18} color={ProsColors.textSecondary} />
              <Text style={styles.statValue}>{pro.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={18} color={ProsColors.textSecondary} />
              <Text style={styles.statValue}>{pro.reviewCount}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color={ProsColors.textSecondary} />
              <Text style={styles.statValue}>{pro.yearsInBusiness}</Text>
              <Text style={styles.statLabel}>Years</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={ProsColors.textSecondary} />
            <Text style={styles.locationText}>
              {pro.location} - Serves {pro.serviceRadius}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.requestQuoteButton} onPress={handleRequestQuote}>
              <Ionicons name="document-text" size={18} color="#FFFFFF" />
              <Text style={styles.requestQuoteButtonText}>Request Quote</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessage}>
              <Ionicons name="mail-outline" size={18} color={ProsColors.primary} />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}

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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },

  // Cover & Profile Image
  coverContainer: {
    height: 180,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  profileImageContainer: {
    position: 'absolute',
    bottom: -40,
    left: '50%',
    marginLeft: -45,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 41,
  },

  // Profile Info
  profileInfo: {
    paddingTop: 50,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proName: {
    fontSize: 22,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  verifiedBadge: {
    marginLeft: 4,
  },
  proTagline: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: ProsColors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: ProsColors.borderLight,
  },

  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  requestQuoteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ProsColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  requestQuoteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: ProsColors.primary,
    gap: 8,
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: ProsColors.primary,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: ProsColors.textSecondary,
  },
  tabTextActive: {
    color: ProsColors.primary,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: ProsColors.primary,
    borderRadius: 1.5,
  },

  // Tab Content
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    lineHeight: 22,
  },
  licenseText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginBottom: 4,
  },
  licenseLabel: {
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },

  // Services
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    backgroundColor: `${ProsColors.primary}15`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  servicePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: ProsColors.primary,
  },
  servicesListContainer: {
    gap: 8,
  },
  serviceListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
  },
  serviceListIcon: {
    marginRight: 12,
  },
  serviceListText: {
    flex: 1,
    fontSize: 15,
    color: ProsColors.textPrimary,
  },

  // Work Gallery
  workGallery: {
    flexDirection: 'row',
    gap: 10,
  },
  workImage: {
    width: 140,
    height: 100,
    borderRadius: 10,
  },

  // Photos Grid
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoGridItem: {
    width: (width - 48) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },

  // Reviews
  reviewsContainer: {
    gap: 12,
  },
  reviewsSummary: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  reviewsSummaryRating: {
    fontSize: 48,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  reviewsSummaryCount: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: ProsColors.textMuted,
  },
  reviewText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    lineHeight: 20,
  },
});
