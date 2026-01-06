/**
 * Pros Profile Screen
 * Install path: screens/ProsProfileScreen.tsx
 * 
 * Individual pro profile with details, photos, reviews.
 * Uses sample data for testing.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors, SAMPLE_PROS, DAYS_OF_WEEK, SamplePro } from '../constants/ProsConfig';

const { width } = Dimensions.get('window');

type RouteParams = {
  ProsProfile: {
    slug: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

// Sample reviews for testing
const SAMPLE_REVIEWS = [
  {
    id: 1,
    userName: 'Sarah M.',
    rating: 5,
    date: '2025-12-15',
    content: 'Excellent work! Very professional and completed the job on time. Would highly recommend.',
  },
  {
    id: 2,
    userName: 'John D.',
    rating: 5,
    date: '2025-12-10',
    content: 'Great service, fair pricing, and very knowledgeable. Will definitely use again.',
  },
  {
    id: 3,
    userName: 'Maria L.',
    rating: 4,
    date: '2025-11-28',
    content: 'Good work overall. Showed up on time and did a thorough job.',
  },
];

// Sample photos for testing
const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
];

export default function ProsProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsProfile'>>();
  const { slug } = route.params;

  const [activeTab, setActiveTab] = useState<'about' | 'photos' | 'reviews'>('about');

  // Find pro from sample data
  const pro = useMemo(() => {
    return SAMPLE_PROS.find(p => p.slug === slug);
  }, [slug]);

  const handleCall = () => {
    if (pro?.phone) {
      Linking.openURL(`tel:${pro.phone}`);
    }
  };

  const handleMessage = () => {
    navigation.navigate('ProsMessages', { 
      recipientId: pro?.id,
      recipientName: pro?.businessName 
    });
  };

  const handleRequestQuote = () => {
    navigation.navigate('ProsRequestQuote', { 
      proId: pro?.id, 
      proName: pro?.businessName 
    });
  };

  if (!pro) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={ProsColors.error} />
          <Text style={styles.errorTitle}>Pro not found</Text>
          <Text style={styles.errorText}>Unable to load this profile</Text>
          <TouchableOpacity 
            style={styles.backHomeButton}
            onPress={() => navigation.navigate('ProsHome')}
          >
            <Text style={styles.backHomeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <Image 
          source={{ uri: pro.profileImage }} 
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.businessName}>{pro.businessName}</Text>
              {pro.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color={ProsColors.primary} />
              )}
            </View>
            <Text style={styles.categoryName}>{pro.categoryName}</Text>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={styles.ratingText}>{pro.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>
                ({pro.reviewCount} {pro.reviewCount === 1 ? 'review' : 'reviews'})
              </Text>
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={ProsColors.textSecondary} />
              <Text style={styles.locationText}>
                {pro.city}, {pro.state} • Serves {pro.serviceRadius} mi radius
              </Text>
            </View>

            {/* Badges */}
            <View style={styles.badges}>
              {pro.isInsured && (
                <View style={styles.badge}>
                  <Ionicons name="shield-checkmark" size={14} color={ProsColors.primary} />
                  <Text style={styles.badgeText}>Insured</Text>
                </View>
              )}
              {pro.isLicensed && (
                <View style={styles.badge}>
                  <Ionicons name="document-text" size={14} color={ProsColors.primary} />
                  <Text style={styles.badgeText}>Licensed</Text>
                </View>
              )}
              {pro.yearsInBusiness && (
                <View style={styles.badge}>
                  <Ionicons name="time" size={14} color={ProsColors.primary} />
                  <Text style={styles.badgeText}>{pro.yearsInBusiness}+ years</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleRequestQuote}>
            <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Request Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleMessage}>
            <Ionicons name="chatbubble-outline" size={18} color={ProsColors.primary} />
          </TouchableOpacity>
          {pro.phone && (
            <TouchableOpacity style={styles.secondaryButton} onPress={handleCall}>
              <Ionicons name="call-outline" size={18} color={ProsColors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['about', 'photos', 'reviews'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'photos' && ` (${SAMPLE_PHOTOS.length})`}
                {tab === 'reviews' && ` (${pro.reviewCount})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            {/* About */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{pro.description}</Text>
            </View>

            {/* Services */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Services</Text>
              <View style={styles.servicesList}>
                <View style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{pro.categoryName}</Text>
                </View>
              </View>
            </View>

            {/* Contact Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              {pro.phone && (
                <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                  <Ionicons name="call-outline" size={18} color={ProsColors.primary} />
                  <Text style={styles.contactText}>{pro.phone}</Text>
                </TouchableOpacity>
              )}
              {pro.email && (
                <TouchableOpacity 
                  style={styles.contactRow}
                  onPress={() => Linking.openURL(`mailto:${pro.email}`)}
                >
                  <Ionicons name="mail-outline" size={18} color={ProsColors.primary} />
                  <Text style={styles.contactText}>{pro.email}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Business Hours */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Hours</Text>
              {DAYS_OF_WEEK.map((day) => (
                <View key={day} style={styles.hoursRow}>
                  <Text style={styles.dayText}>{day}</Text>
                  <Text style={styles.hoursText}>
                    {day === 'Sunday' ? 'Closed' : '8:00 AM - 6:00 PM'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'photos' && (
          <View style={styles.tabContent}>
            <View style={styles.photosGrid}>
              {SAMPLE_PHOTOS.map((photo, index) => (
                <TouchableOpacity key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                </TouchableOpacity>
              ))}
            </View>
            {SAMPLE_PHOTOS.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color={ProsColors.textMuted} />
                <Text style={styles.emptyStateText}>No photos yet</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            {/* Rating Summary */}
            <View style={styles.ratingSummary}>
              <Text style={styles.ratingBig}>{pro.rating.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(pro.rating) ? 'star' : 'star-outline'}
                    size={20}
                    color="#F59E0B"
                  />
                ))}
              </View>
              <Text style={styles.totalReviews}>
                Based on {pro.reviewCount} reviews
              </Text>
            </View>

            {/* Reviews List */}
            {SAMPLE_REVIEWS.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewUser}>
                    <View style={styles.reviewAvatarPlaceholder}>
                      <Ionicons name="person" size={16} color={ProsColors.textMuted} />
                    </View>
                    <View>
                      <Text style={styles.reviewUserName}>{review.userName}</Text>
                      <Text style={styles.reviewDate}>
                        {new Date(review.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reviewRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.reviewContent}>{review.content}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Spacing */}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 250,
    backgroundColor: ProsColors.sectionBg,
  },
  profileSection: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  profileHeader: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  categoryName: {
    fontSize: 14,
    color: ProsColors.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ProsColors.primary}10`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: ProsColors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ProsColors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ProsColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: ProsColors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: ProsColors.textSecondary,
  },
  tabTextActive: {
    color: ProsColors.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: ProsColors.textSecondary,
    lineHeight: 22,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: ProsColors.sectionBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  serviceTagText: {
    fontSize: 13,
    color: ProsColors.textPrimary,
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  contactText: {
    fontSize: 15,
    color: ProsColors.primary,
    marginLeft: 12,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dayText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  hoursText: {
    fontSize: 14,
    color: ProsColors.textPrimary,
    fontWeight: '500',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoItem: {
    width: (width - 48) / 3,
    height: (width - 48) / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: ProsColors.sectionBg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: ProsColors.textMuted,
    marginTop: 12,
  },
  ratingSummary: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
    marginBottom: 16,
  },
  ratingBig: {
    fontSize: 48,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  totalReviews: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  reviewCard: {
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  reviewDate: {
    fontSize: 12,
    color: ProsColors.textMuted,
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewContent: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  backHomeButton: {
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});