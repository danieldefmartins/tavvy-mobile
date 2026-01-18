/**
 * Realtor Detail Screen
 * Install path: screens/RealtorDetailScreen.tsx
 * 
 * Detailed profile view for a real estate agent.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Realtor-specific colors
const RealtorColors = {
  primary: '#1E3A5F',
  secondary: '#C9A227',
  background: '#F8F9FA',
  cardBg: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  success: '#10B981',
  border: '#E5E7EB',
};

type RouteParams = {
  RealtorDetail: {
    realtorId: string;
    realtorName?: string;
  };
};

// Mock data for realtor profile
const MOCK_REALTORS: { [key: string]: any } = {
  '1': {
    id: '1',
    name: 'Sarah Mitchell',
    title: 'Licensed Real Estate Agent',
    company: 'Prestige Realty Group',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    coverPhoto: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    rating: 4.9,
    reviewCount: 127,
    yearsExperience: 12,
    transactionsClosed: 450,
    specialties: ['Luxury Homes', 'First-Time Buyers', 'Investment Properties', 'Relocation'],
    areas: ['Downtown', 'Westside', 'Lakefront', 'Suburbs'],
    bio: 'With over 12 years of experience in the local real estate market, I specialize in helping families find their dream homes. My approach combines market expertise with personalized service to ensure every client feels supported throughout their journey.',
    phone: '(555) 123-4567',
    email: 'sarah@prestigerealty.com',
    license: 'RE-12345678',
    languages: ['English', 'Spanish'],
    verified: true,
    listings: [
      {
        id: '1',
        image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
        price: '$1,250,000',
        address: '123 Lakefront Drive',
        beds: 4,
        baths: 3,
        sqft: '3,200',
        status: 'For Sale',
      },
      {
        id: '2',
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
        price: '$875,000',
        address: '456 Oak Street',
        beds: 3,
        baths: 2,
        sqft: '2,400',
        status: 'For Sale',
      },
      {
        id: '3',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
        price: '$2,100,000',
        address: '789 Hillside Manor',
        beds: 5,
        baths: 4,
        sqft: '4,800',
        status: 'Pending',
      },
    ],
    reviews: [
      {
        id: '1',
        author: 'Michael & Jennifer T.',
        rating: 5,
        date: 'December 2025',
        text: 'Sarah made our first home buying experience so smooth! She was patient, knowledgeable, and always available to answer our questions.',
      },
      {
        id: '2',
        author: 'David R.',
        rating: 5,
        date: 'November 2025',
        text: "Sold our home in just 2 weeks above asking price. Sarah's marketing strategy and negotiation skills are top-notch.",
      },
      {
        id: '3',
        author: 'Lisa M.',
        rating: 4,
        date: 'October 2025',
        text: 'Great experience overall. Sarah helped us find the perfect investment property. Very knowledgeable about the market.',
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Michael Chen',
    title: 'Broker Associate',
    company: 'Elite Properties',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    coverPhoto: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    rating: 4.8,
    reviewCount: 98,
    yearsExperience: 8,
    transactionsClosed: 280,
    specialties: ['Investment Properties', 'Commercial', 'Multi-Family'],
    areas: ['Financial District', 'Midtown', 'Industrial Park'],
    bio: 'Specializing in commercial and investment properties, I help investors maximize their returns through strategic acquisitions. My background in finance gives me unique insights into property valuation and market trends.',
    phone: '(555) 234-5678',
    email: 'michael@eliteproperties.com',
    license: 'RE-23456789',
    languages: ['English', 'Mandarin'],
    verified: true,
    listings: [],
    reviews: [],
  },
};

// Default realtor for unknown IDs
const DEFAULT_REALTOR = MOCK_REALTORS['1'];

type NavigationProp = NativeStackNavigationProp<any>;

export default function RealtorDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'RealtorDetail'>>();
  const { realtorId } = route.params;
  
  const [activeTab, setActiveTab] = useState<'about' | 'listings' | 'reviews'>('about');
  const realtor = MOCK_REALTORS[realtorId] || DEFAULT_REALTOR;

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCall = () => {
    Linking.openURL(`tel:${realtor.phone.replace(/[^0-9]/g, '')}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${realtor.email}`);
  };

  const handleMessage = () => {
    Alert.alert('Coming Soon', 'In-app messaging will be available soon!');
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share functionality coming soon!');
  };

  const renderStars = (rating: number, size: number = 16) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= Math.floor(rating) ? 'star' : star <= rating + 0.5 ? 'star-half' : 'star-outline'}
            size={size}
            color={RealtorColors.secondary}
          />
        ))}
      </View>
    );
  };

  const renderAboutTab = () => (
    <View style={styles.tabContent}>
      {/* Bio Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Me</Text>
        <Text style={styles.bioText}>{realtor.bio}</Text>
      </View>

      {/* Specialties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specialties</Text>
        <View style={styles.tagContainer}>
          {realtor.specialties.map((specialty: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{specialty}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Service Areas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Areas</Text>
        <View style={styles.tagContainer}>
          {realtor.areas.map((area: string, index: number) => (
            <View key={index} style={[styles.tag, styles.areaTag]}>
              <Ionicons name="location-outline" size={14} color={RealtorColors.primary} />
              <Text style={[styles.tagText, styles.areaTagText]}>{area}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Credentials */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credentials</Text>
        <View style={styles.credentialRow}>
          <Ionicons name="shield-checkmark" size={20} color={RealtorColors.success} />
          <Text style={styles.credentialText}>License: {realtor.license}</Text>
        </View>
        <View style={styles.credentialRow}>
          <Ionicons name="language" size={20} color={RealtorColors.primary} />
          <Text style={styles.credentialText}>Languages: {realtor.languages.join(', ')}</Text>
        </View>
        <View style={styles.credentialRow}>
          <Ionicons name="business" size={20} color={RealtorColors.primary} />
          <Text style={styles.credentialText}>{realtor.company}</Text>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
          <Ionicons name="call-outline" size={20} color={RealtorColors.primary} />
          <Text style={styles.contactText}>{realtor.phone}</Text>
          <Ionicons name="chevron-forward" size={16} color={RealtorColors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
          <Ionicons name="mail-outline" size={20} color={RealtorColors.primary} />
          <Text style={styles.contactText}>{realtor.email}</Text>
          <Ionicons name="chevron-forward" size={16} color={RealtorColors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderListingsTab = () => (
    <View style={styles.tabContent}>
      {realtor.listings.length > 0 ? (
        <>
          <Text style={styles.listingsHeader}>Active Listings ({realtor.listings.length})</Text>
          {realtor.listings.map((listing: any) => (
            <TouchableOpacity key={listing.id} style={styles.listingCard}>
              <Image source={{ uri: listing.image }} style={styles.listingImage} />
              <View style={[
                styles.listingStatus,
                listing.status === 'Pending' && styles.listingStatusPending
              ]}>
                <Text style={styles.listingStatusText}>{listing.status}</Text>
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
        <View style={styles.emptyState}>
          <Ionicons name="home-outline" size={48} color={RealtorColors.textMuted} />
          <Text style={styles.emptyStateText}>No active listings</Text>
          <Text style={styles.emptyStateSubtext}>Check back later for new properties</Text>
        </View>
      )}
    </View>
  );

  // TavvY Signal Colors
  const SignalColors = {
    theGood: '#3B82F6',      // Blue - positive
    theVibe: '#8B5CF6',      // Purple - vibe
    headsUp: '#F97316',      // Orange - heads up
  };

  // Community Signal Bar Component
  const CommunitySignalBar = ({ 
    type, 
    label, 
    icon,
    hasSignals 
  }: { 
    type: 'theGood' | 'theVibe' | 'headsUp'; 
    label: string;
    icon: string;
    hasSignals: boolean;
  }) => {
    const colors = {
      theGood: SignalColors.theGood,
      theVibe: SignalColors.theVibe,
      headsUp: SignalColors.headsUp,
    };

    return (
      <View style={[styles.communitySignalBar, { backgroundColor: colors[type] }]}>
        <Ionicons name={icon as any} size={18} color="#FFFFFF" />
        <Text style={styles.communitySignalText}>
          {label} · {hasSignals ? 'View signals' : 'Be the first to tap!'}
        </Text>
      </View>
    );
  };

  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      {/* Community Signals Section */}
      <View style={styles.signalsCard}>
        <Text style={styles.signalsTitle}>Community Signals</Text>
        
        <CommunitySignalBar 
          type="theGood" 
          label="The Good" 
          icon="thumbs-up"
          hasSignals={false} 
        />
        
        <CommunitySignalBar 
          type="theVibe" 
          label="The Vibe" 
          icon="sparkles"
          hasSignals={false} 
        />
        
        <CommunitySignalBar 
          type="headsUp" 
          label="Heads Up" 
          icon="alert-circle"
          hasSignals={false} 
        />
      </View>

      {/* Been here? CTA */}
      <View style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Worked with {realtor.name.split(' ')[0]}?</Text>
        <Text style={styles.ctaSubtitle}>Share your experience to help others.</Text>
        <TouchableOpacity style={styles.ctaButton}>
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>Add Your Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={styles.coverContainer}>
          <Image source={{ uri: realtor.coverPhoto }} style={styles.coverPhoto} />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={styles.coverGradient}
          />
          <SafeAreaView edges={['top']} style={styles.coverHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: realtor.photo }} style={styles.profilePhoto} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{realtor.name}</Text>
              {realtor.verified && (
                <Ionicons name="checkmark-circle" size={20} color={RealtorColors.success} />
              )}
            </View>
            <Text style={styles.profileTitle}>{realtor.title}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color={RealtorColors.secondary} />
              <Text style={styles.ratingText}>{realtor.rating}</Text>
              <Text style={styles.reviewCountText}>({realtor.reviewCount} reviews)</Text>
            </View>
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
            <Text style={styles.statValue}>{realtor.transactionsClosed}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{realtor.listings.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleMessage}>
            <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color={RealtorColors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleEmail}>
            <Ionicons name="mail-outline" size={20} color={RealtorColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RealtorColors.background,
  },
  coverContainer: {
    height: 200,
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  coverHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    justifyContent: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
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
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: RealtorColors.text,
  },
  reviewCountText: {
    fontSize: 14,
    color: RealtorColors.textLight,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: RealtorColors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: RealtorColors.textLight,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: RealtorColors.border,
  },
  actionButtons: {
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
    gap: 8,
    backgroundColor: RealtorColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: RealtorColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: RealtorColors.border,
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
    fontWeight: '600',
    color: RealtorColors.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: RealtorColors.textLight,
    lineHeight: 24,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: RealtorColors.primary,
  },
  areaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
  },
  areaTagText: {
    color: RealtorColors.text,
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  credentialText: {
    fontSize: 14,
    color: RealtorColors.text,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: RealtorColors.border,
  },
  contactText: {
    flex: 1,
    fontSize: 15,
    color: RealtorColors.primary,
  },
  listingsHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: RealtorColors.text,
    marginBottom: 16,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    borderRadius: 12,
  },
  listingStatusPending: {
    backgroundColor: RealtorColors.secondary,
  },
  listingStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listingInfo: {
    padding: 16,
  },
  listingPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: RealtorColors.text,
  },
  listingAddress: {
    fontSize: 14,
    color: RealtorColors.textLight,
    marginTop: 4,
  },
  listingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  listingDetail: {
    fontSize: 13,
    color: RealtorColors.textLight,
  },
  listingDetailDivider: {
    fontSize: 13,
    color: RealtorColors.textMuted,
    marginHorizontal: 8,
  },
  reviewsSummary: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  reviewsRating: {
    fontSize: 48,
    fontWeight: '700',
    color: RealtorColors.text,
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  reviewsCount: {
    fontSize: 14,
    color: RealtorColors.textLight,
    marginTop: 8,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
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
    color: RealtorColors.textMuted,
  },
  reviewText: {
    fontSize: 14,
    color: RealtorColors.textLight,
    lineHeight: 22,
    marginTop: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  seeAllButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: RealtorColors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: RealtorColors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: RealtorColors.textLight,
    marginTop: 4,
  },
  // Community Signals Styles
  signalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  signalsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RealtorColors.text,
    marginBottom: 16,
  },
  communitySignalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  communitySignalText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // CTA Card Styles
  ctaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RealtorColors.text,
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: RealtorColors.textLight,
    marginBottom: 16,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: RealtorColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
