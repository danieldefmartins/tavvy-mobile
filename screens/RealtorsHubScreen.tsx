/**
 * RealtorsHubScreen.tsx
 * Install path: screens/RealtorsHubScreen.tsx
 * 
 * Realtor profile detail screen with About, Listings, and Reviews tabs.
 * NOW CONNECTED TO SUPABASE - Fetches real data from pro_providers table
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabaseClient';

const { width } = Dimensions.get('window');

// Realtor-specific colors
const RealtorColors = {
  primary: '#1E3A5F',      // Deep navy blue
  secondary: '#C9A227',    // Gold accent
  background: '#F8F9FA',
  cardBg: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  success: '#10B981',
  border: '#E5E7EB',
};

// Default placeholder images
const PLACEHOLDER_PHOTO = 'https://via.placeholder.com/150?text=No+Photo';
const PLACEHOLDER_COVER = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';

type RouteParams = {
  realtorId?: string;
  realtorName?: string;
};

// Realtor type from Supabase
interface Realtor {
  id: string;
  name: string;
  title: string;
  company: string;
  photo: string;
  coverPhoto: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  transactionsClosed: number;
  specialties: string[];
  areas: string[];
  bio: string;
  phone: string;
  email: string;
  license: string;
  languages: string[];
}

// Listing type
interface Listing {
  id: string;
  image: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  sqft: string;
  status: string;
}

// Review type
interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
}

export default function RealtorsHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  
  const [activeTab, setActiveTab] = useState<'about' | 'listings' | 'reviews'>('about');
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Get realtorId from route params
  const realtorId = route.params?.realtorId;

  useEffect(() => {
    if (realtorId) {
      loadRealtorData();
    } else {
      // No realtorId provided, show browse screen instead
      navigation.replace('RealtorsBrowse');
    }
  }, [realtorId]);

  const loadRealtorData = async () => {
    setLoading(true);
    try {
      // Fetch realtor profile from pro_providers
      const { data, error } = await supabase
        .from('pro_providers')
        .select('*')
        .eq('id', realtorId)
        .eq('provider_type', 'realtor')
        .single();

      if (error) {
        console.error('Error fetching realtor:', error);
        setRealtor(null);
      } else if (data) {
        // Transform data to component format
        setRealtor({
          id: data.id,
          name: data.display_name || data.business_name || 'Unknown',
          title: data.title || 'Real Estate Agent',
          company: data.company_name || data.brokerage || '',
          photo: data.profile_image_url || data.photo_url || PLACEHOLDER_PHOTO,
          coverPhoto: data.cover_image_url || PLACEHOLDER_COVER,
          rating: data.average_rating || 0,
          reviewCount: data.review_count || 0,
          yearsExperience: data.years_experience || 0,
          transactionsClosed: data.transactions_closed || data.total_transactions || 0,
          specialties: data.specialties || [],
          areas: data.service_areas || data.areas_served || [],
          bio: data.bio || data.description || '',
          phone: data.phone || data.contact_phone || '',
          email: data.email || data.contact_email || '',
          license: data.license_number || '',
          languages: data.languages || ['English'],
        });

        // TODO: Load listings from a separate table when available
        setListings([]);

        // TODO: Load reviews from a separate table when available
        setReviews([]);
      }
    } catch (error) {
      console.error('Error loading realtor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleContact = () => {
    if (realtor) {
      navigation.navigate('ProsMessagesScreen', {
        recipientId: realtor.id,
        recipientName: realtor.name,
        recipientType: 'realtor',
      });
    }
  };

  const handleCall = () => {
    if (realtor?.phone) {
      // In production, use Linking.openURL(`tel:${realtor.phone}`)
      console.log('Calling:', realtor.phone);
    }
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RealtorColors.primary} />
          <Text style={styles.loadingText}>Loading realtor profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No realtor found
  if (!realtor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <TouchableOpacity style={styles.backButtonEmpty} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={RealtorColors.text} />
          </TouchableOpacity>
          <Ionicons name="person-outline" size={64} color={RealtorColors.textLight} />
          <Text style={styles.emptyTitle}>Realtor Not Found</Text>
          <Text style={styles.emptyText}>This realtor profile is no longer available.</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('RealtorsBrowse')}>
            <Text style={styles.browseButtonText}>Browse Realtors</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {/* Bio Section */}
      {realtor.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bioText}>{realtor.bio}</Text>
        </View>
      ) : null}

      {/* Specialties */}
      {realtor.specialties.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.tagContainer}>
            {realtor.specialties.map((specialty, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Service Areas */}
      {realtor.areas.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Areas</Text>
          <View style={styles.tagContainer}>
            {realtor.areas.map((area, index) => (
              <View key={index} style={[styles.tag, styles.areaTag]}>
                <Ionicons name="location-outline" size={14} color={RealtorColors.primary} />
                <Text style={[styles.tagText, styles.areaTagText]}>{area}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Credentials */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credentials</Text>
        {realtor.license && (
          <View style={styles.credentialRow}>
            <Ionicons name="shield-checkmark" size={20} color={RealtorColors.success} />
            <Text style={styles.credentialText}>License: {realtor.license}</Text>
          </View>
        )}
        {realtor.languages.length > 0 && (
          <View style={styles.credentialRow}>
            <Ionicons name="language" size={20} color={RealtorColors.primary} />
            <Text style={styles.credentialText}>Languages: {realtor.languages.join(', ')}</Text>
          </View>
        )}
        {realtor.company && (
          <View style={styles.credentialRow}>
            <Ionicons name="business" size={20} color={RealtorColors.primary} />
            <Text style={styles.credentialText}>{realtor.company}</Text>
          </View>
        )}
      </View>

      {/* Empty state if no info */}
      {!realtor.bio && realtor.specialties.length === 0 && realtor.areas.length === 0 && (
        <View style={styles.emptyTabState}>
          <Ionicons name="information-circle-outline" size={48} color={RealtorColors.textLight} />
          <Text style={styles.emptyTabText}>No additional information available yet.</Text>
        </View>
      )}
    </View>
  );

  const renderListingsTab = () => (
    <View style={styles.tabContent}>
      {listings.length > 0 ? (
        <>
          <Text style={styles.listingsHeader}>Active Listings ({listings.length})</Text>
          {listings.map((listing) => (
            <TouchableOpacity key={listing.id} style={styles.listingCard}>
              <Image source={{ uri: listing.image }} style={styles.listingImage} />
              <View style={styles.listingStatus}>
                <Text style={[
                  styles.listingStatusText,
                  listing.status === 'Pending' && styles.listingStatusPending
                ]}>
                  {listing.status}
                </Text>
              </View>
              <View style={styles.listingInfo}>
                <Text style={styles.listingPrice}>{listing.price}</Text>
                <Text style={styles.listingAddress}>{listing.address}</Text>
                <View style={styles.listingDetails}>
                  <Text style={styles.listingDetail}>{listing.beds} beds</Text>
                  <Text style={styles.listingDetailDivider}>•</Text>
                  <Text style={styles.listingDetail}>{listing.baths} baths</Text>
                  <Text style={styles.listingDetailDivider}>•</Text>
                  <Text style={styles.listingDetail}>{listing.sqft} sqft</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <View style={styles.emptyTabState}>
          <Ionicons name="home-outline" size={48} color={RealtorColors.textLight} />
          <Text style={styles.emptyTabTitle}>No Active Listings</Text>
          <Text style={styles.emptyTabText}>This realtor doesn't have any active listings at the moment.</Text>
        </View>
      )}
    </View>
  );

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      {realtor.reviewCount > 0 || reviews.length > 0 ? (
        <>
          <View style={styles.reviewsSummary}>
            <Text style={styles.reviewsRating}>{realtor.rating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(realtor.rating) ? 'star' : 'star-outline'}
                  size={20}
                  color={RealtorColors.secondary}
                />
              ))}
            </View>
            <Text style={styles.reviewsCount}>{realtor.reviewCount} reviews</Text>
          </View>

          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{review.author}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= review.rating ? 'star' : 'star-outline'}
                    size={14}
                    color={RealtorColors.secondary}
                  />
                ))}
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))}

          {reviews.length > 0 && (
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={styles.seeAllButtonText}>See All Reviews</Text>
              <Ionicons name="arrow-forward" size={16} color={RealtorColors.primary} />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.emptyTabState}>
          <Ionicons name="chatbubbles-outline" size={48} color={RealtorColors.textLight} />
          <Text style={styles.emptyTabTitle}>No Reviews Yet</Text>
          <Text style={styles.emptyTabText}>Be the first to leave a review for this realtor!</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: realtor.coverPhoto }} style={styles.coverPhoto} />
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: realtor.photo }} style={styles.profilePhoto} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{realtor.name}</Text>
            <Text style={styles.profileTitle}>{realtor.title}</Text>
            {realtor.rating > 0 && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={RealtorColors.secondary} />
                <Text style={styles.ratingText}>{realtor.rating.toFixed(1)}</Text>
                <Text style={styles.reviewCountText}>({realtor.reviewCount} reviews)</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{realtor.yearsExperience}</Text>
            <Text style={styles.statLabel}>Years Exp.</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{realtor.transactionsClosed}+</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{realtor.areas.length}</Text>
            <Text style={styles.statLabel}>Areas Served</Text>
          </View>
        </View>

        {/* Contact Buttons */}
        <View style={styles.contactButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleContact}>
            <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color={RealtorColors.primary} />
            <Text style={styles.secondaryButtonText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'listings' && styles.tabActive]}
            onPress={() => setActiveTab('listings')}
          >
            <Text style={[styles.tabText, activeTab === 'listings' && styles.tabTextActive]}>
              Listings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'listings' && renderListingsTab()}
        {activeTab === 'reviews' && renderReviewsTab()}

        {/* Footer Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RealtorColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: RealtorColors.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  backButtonEmpty: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: RealtorColors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: RealtorColors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    color: RealtorColors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  browseButton: {
    marginTop: 24,
    backgroundColor: RealtorColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  coverContainer: {
    position: 'relative',
    height: 200,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    marginTop: -50,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    marginTop: 55,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: RealtorColors.text,
  },
  profileTitle: {
    fontSize: 14,
    color: RealtorColors.textLight,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: RealtorColors.text,
    marginLeft: 4,
  },
  reviewCountText: {
    fontSize: 14,
    color: RealtorColors.textLight,
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: RealtorColors.cardBg,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: RealtorColors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: RealtorColors.textLight,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: RealtorColors.border,
  },
  contactButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RealtorColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: RealtorColors.cardBg,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RealtorColors.primary,
    gap: 8,
  },
  secondaryButtonText: {
    color: RealtorColors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: RealtorColors.border,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: RealtorColors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: RealtorColors.textLight,
  },
  tabTextActive: {
    color: RealtorColors.primary,
    fontWeight: '600',
  },
  tabContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: RealtorColors.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 24,
    color: RealtorColors.text,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: RealtorColors.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    color: RealtorColors.primary,
    fontWeight: '500',
  },
  areaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: RealtorColors.cardBg,
    borderWidth: 1,
    borderColor: RealtorColors.border,
  },
  areaTagText: {
    color: RealtorColors.text,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  credentialText: {
    fontSize: 15,
    color: RealtorColors.text,
  },
  emptyTabState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTabTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: RealtorColors.text,
    marginTop: 16,
  },
  emptyTabText: {
    fontSize: 15,
    color: RealtorColors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  listingsHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: RealtorColors.text,
    marginBottom: 16,
  },
  listingCard: {
    backgroundColor: RealtorColors.cardBg,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listingImage: {
    width: '100%',
    height: 180,
  },
  listingStatus: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: RealtorColors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  listingStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  listingStatusPending: {
    backgroundColor: RealtorColors.secondary,
  },
  listingInfo: {
    padding: 16,
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: RealtorColors.text,
  },
  listingAddress: {
    fontSize: 15,
    color: RealtorColors.textLight,
    marginTop: 4,
  },
  listingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  listingDetail: {
    fontSize: 14,
    color: RealtorColors.textLight,
  },
  listingDetailDivider: {
    marginHorizontal: 8,
    color: RealtorColors.textLight,
  },
  reviewsSummary: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: RealtorColors.cardBg,
    borderRadius: 12,
    marginBottom: 20,
  },
  reviewsRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: RealtorColors.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  reviewsCount: {
    fontSize: 14,
    color: RealtorColors.textLight,
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: RealtorColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: RealtorColors.text,
  },
  reviewDate: {
    fontSize: 13,
    color: RealtorColors.textLight,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 22,
    color: RealtorColors.text,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  seeAllButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: RealtorColors.primary,
  },
});
