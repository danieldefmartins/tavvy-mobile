/**
 * Pros Profile Screen
 * Install path: screens/ProsProfileScreen.tsx
 * 
 * Individual pro profile with details, photos, reviews.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors, DAYS_OF_WEEK } from '../constants/ProsConfig';
import { useProProfile } from '../hooks/usePros';
import { ProReview, ProPhoto } from '../lib/ProsTypes';

const { width } = Dimensions.get('window');

type RouteParams = {
  ProsProfileScreen: {
    slug: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

export default function ProsProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsProfileScreen'>>();
  const { slug } = route.params;

  const { pro, loading, error, fetchPro } = useProProfile();
  const [activeTab, setActiveTab] = useState<'about' | 'photos' | 'reviews'>('about');

  useEffect(() => {
    fetchPro(slug);
  }, [slug]);

  const handleCall = () => {
    if (pro?.phone) {
      Linking.openURL(`tel:${pro.phone}`);
    }
  };

  const handleMessage = () => {
    navigation.navigate('ProsMessagesScreen', { proId: pro?.id });
  };

  const handleRequestQuote = () => {
    navigation.navigate('ProsRequestQuoteScreen', { proId: pro?.id, proName: pro?.businessName });
  };

  const handleWebsite = () => {
    if (pro?.website) {
      Linking.openURL(pro.website.startsWith('http') ? pro.website : `https://${pro.website}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ProsColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !pro) {
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
          <Text style={styles.errorText}>{error || 'Unable to load this profile'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const rating = parseFloat(pro.averageRating) || 0;

  const renderReview = ({ item }: { item: ProReview }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          {item.user?.avatarUrl ? (
            <Image source={{ uri: item.user.avatarUrl }} style={styles.reviewAvatar} />
          ) : (
            <View style={styles.reviewAvatarPlaceholder}>
              <Ionicons name="person" size={16} color={ProsColors.textMuted} />
            </View>
          )}
          <View>
            <Text style={styles.reviewUserName}>{item.user?.name || 'Anonymous'}</Text>
            <Text style={styles.reviewDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= item.rating ? 'star' : 'star-outline'}
              size={14}
              color="#F59E0B"
            />
          ))}
        </View>
      </View>
      {item.title && <Text style={styles.reviewTitle}>{item.title}</Text>}
      {item.content && <Text style={styles.reviewContent}>{item.content}</Text>}
    </View>
  );

  const renderPhoto = ({ item }: { item: ProPhoto }) => (
    <TouchableOpacity style={styles.photoItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.photoImage} />
      {item.caption && (
        <Text style={styles.photoCaption} numberOfLines={1}>{item.caption}</Text>
      )}
    </TouchableOpacity>
  );

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
        {pro.coverImageUrl ? (
          <Image source={{ uri: pro.coverImageUrl }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name="image-outline" size={48} color={ProsColors.textMuted} />
          </View>
        )}

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.logoContainer}>
            {pro.logoUrl ? (
              <Image source={{ uri: pro.logoUrl }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="business" size={32} color={ProsColors.textMuted} />
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.businessName}>{pro.businessName}</Text>
              {pro.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color={ProsColors.primary} />
              )}
            </View>

            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {rating > 0 ? rating.toFixed(1) : 'New'}
              </Text>
              {pro.totalReviews > 0 && (
                <Text style={styles.reviewCount}>
                  ({pro.totalReviews} {pro.totalReviews === 1 ? 'review' : 'reviews'})
                </Text>
              )}
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={ProsColors.textSecondary} />
              <Text style={styles.locationText}>
                {pro.city}, {pro.state} • {pro.serviceRadius} mi radius
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
                {tab === 'photos' && pro.photos && ` (${pro.photos.length})`}
                {tab === 'reviews' && ` (${pro.totalReviews})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            {pro.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.description}>{pro.description}</Text>
              </View>
            )}

            {/* Services */}
            {pro.categories && pro.categories.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services</Text>
                <View style={styles.servicesList}>
                  {pro.categories.map((cat) => (
                    <View key={cat.id} style={styles.serviceTag}>
                      <Text style={styles.serviceTagText}>
                        {cat.category?.name || 'Service'}
                      </Text>
                      {cat.isPrimary && (
                        <View style={styles.primaryTag}>
                          <Text style={styles.primaryTagText}>Primary</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Contact Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              {pro.email && (
                <TouchableOpacity style={styles.contactRow}>
                  <Ionicons name="mail-outline" size={18} color={ProsColors.textSecondary} />
                  <Text style={styles.contactText}>{pro.email}</Text>
                </TouchableOpacity>
              )}
              {pro.phone && (
                <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                  <Ionicons name="call-outline" size={18} color={ProsColors.textSecondary} />
                  <Text style={styles.contactText}>{pro.phone}</Text>
                </TouchableOpacity>
              )}
              {pro.website && (
                <TouchableOpacity style={styles.contactRow} onPress={handleWebsite}>
                  <Ionicons name="globe-outline" size={18} color={ProsColors.textSecondary} />
                  <Text style={[styles.contactText, styles.linkText]}>{pro.website}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Availability */}
            {pro.availability && pro.availability.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Availability</Text>
                {DAYS_OF_WEEK.map((day) => {
                  const avail = pro.availability?.find((a) => a.dayOfWeek === day.value);
                  return (
                    <View key={day.value} style={styles.availabilityRow}>
                      <Text style={styles.dayText}>{day.short}</Text>
                      <Text style={[
                        styles.availabilityText,
                        !avail?.isAvailable && styles.unavailableText
                      ]}>
                        {avail?.isAvailable
                          ? `${avail.startTime} - ${avail.endTime}`
                          : 'Unavailable'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'photos' && (
          <View style={styles.tabContent}>
            {pro.photos && pro.photos.length > 0 ? (
              <FlatList
                data={pro.photos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderPhoto}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.photoRow}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="images-outline" size={48} color={ProsColors.textMuted} />
                <Text style={styles.emptyStateText}>No photos yet</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.tabContent}>
            {pro.reviews && pro.reviews.length > 0 ? (
              pro.reviews.map((review) => (
                <View key={review.id}>
                  {renderReview({ item: review })}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={ProsColors.textMuted} />
                <Text style={styles.emptyStateText}>No reviews yet</Text>
              </View>
            )}
          </View>
        )}

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  errorText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: ProsColors.sectionBg,
  },
  coverPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    paddingHorizontal: 16,
    marginTop: -40,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: ProsColors.sectionBg,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginTop: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
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
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ProsColors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ProsColors.sectionBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  serviceTagText: {
    fontSize: 14,
    color: ProsColors.textPrimary,
  },
  primaryTag: {
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryTagText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 14,
    color: ProsColors.textPrimary,
    marginLeft: 12,
  },
  linkText: {
    color: ProsColors.primary,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: ProsColors.textPrimary,
    width: 40,
  },
  availabilityText: {
    fontSize: 14,
    color: ProsColors.textPrimary,
  },
  unavailableText: {
    color: ProsColors.textMuted,
  },
  photoRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  photoItem: {
    width: (width - 40) / 2,
    marginBottom: 8,
  },
  photoImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: ProsColors.sectionBg,
  },
  photoCaption: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ProsColors.border,
    marginRight: 10,
  },
  reviewAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ProsColors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  reviewDate: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 6,
  },
  reviewContent: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    lineHeight: 20,
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
});
