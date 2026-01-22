/**
 * Realtor Detail Screen
 * Install path: screens/RealtorDetailScreen.tsx
 * 
 * Detailed profile view for a real estate agent.
 * Matches the PlaceDetailsScreen style with Tavvy signal-based reviews.
 */
import React, { useState, useRef } from 'react';
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Tavvy Signal Colors
const SignalColors = {
  theGood: '#0A84FF',      // Blue - positive
  theVibe: '#8B5CF6',      // Purple - vibe
  headsUp: '#FF9500',      // Orange - heads up
};

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
    signalCount: 127,
    yearsExperience: 12,
    transactionsClosed: 450,
    specialties: ['Luxury Homes', 'First-Time Buyers', 'Investment Properties', 'Relocation'],
    areas: ['Downtown', 'Westside', 'Lakefront', 'Suburbs'],
    languages: ['English', 'Spanish'],
    bio: 'With over 12 years of experience in the local real estate market, I specialize in helping families find their dream homes. My approach combines market expertise with personalized service to ensure every client feels supported throughout their journey.',
    phone: '(555) 123-4567',
    email: 'sarah@prestigerealty.com',
    license: 'RE-12345678',
    verified: true,
    photos: [
      { id: '1', url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800' },
      { id: '2', url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800' },
      { id: '3', url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800' },
    ],
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
  },
  '2': {
    id: '2',
    name: 'Michael Chen',
    title: 'Broker Associate',
    company: 'Elite Properties',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    coverPhoto: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    signalCount: 98,
    yearsExperience: 8,
    transactionsClosed: 280,
    specialties: ['Investment Properties', 'Commercial', 'Multi-Family'],
    areas: ['Financial District', 'Midtown', 'Industrial Park'],
    languages: ['English', 'Mandarin', 'Cantonese'],
    bio: 'Specializing in commercial and investment properties, I help investors maximize their returns through strategic acquisitions. My background in finance gives me unique insights into property valuation and market trends.',
    phone: '(555) 234-5678',
    email: 'michael@eliteproperties.com',
    license: 'RE-23456789',
    verified: true,
    photos: [
      { id: '1', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800' },
    ],
    listings: [],
  },
};

// Default realtor for unknown IDs
const DEFAULT_REALTOR = MOCK_REALTORS['1'];

type NavigationProp = NativeStackNavigationProp<any>;

export default function RealtorDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'RealtorDetail'>>();
  const { realtorId } = route.params;
  
  const [activeTab, setActiveTab] = useState<'reviews' | 'info' | 'photos'>('reviews');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  
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

  const handleCarouselScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentPhotoIndex(index);
  };

  // Render photo carousel item
  const renderCarouselItem = ({ item }: { item: { id: string; url: string } }) => (
    <Image
      source={{ uri: item.url }}
      style={styles.carouselImage}
      resizeMode="cover"
    />
  );

  // Reviews Tab with Community Signals
  const renderReviewsTab = () => (
    <View style={styles.tabContent}>
      {/* Community Signals Section */}
      <View style={styles.signalsCard}>
        <Text style={styles.signalsTitle}>Community Signals</Text>
        
        {/* The Good - Blue Empty Bar */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.signalBar, { backgroundColor: SignalColors.theGood }]}
        >
          <Ionicons name="thumbs-up" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.signalBarText}>
            The Good · Be the first to tap!
          </Text>
        </TouchableOpacity>
        
        {/* The Vibe - Purple Empty Bar */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.signalBar, { backgroundColor: SignalColors.theVibe }]}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.signalBarText}>
            The Vibe · Be the first to tap!
          </Text>
        </TouchableOpacity>
        
        {/* Heads Up - Orange Empty Bar */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.signalBar, { backgroundColor: SignalColors.headsUp, marginBottom: 0 }]}
        >
          <Ionicons name="alert-circle" size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.signalBarText}>
            Heads Up · Be the first to tap!
          </Text>
        </TouchableOpacity>
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

  // Info Tab
  const renderInfoTab = () => (
    <View style={styles.tabContent}>
      {/* Languages Section - Prominent */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>Languages</Text>
        <View style={styles.languagesContainer}>
          {realtor.languages.map((language: string, index: number) => (
            <View key={index} style={styles.languageTag}>
              <Ionicons name="globe-outline" size={16} color={RealtorColors.primary} />
              <Text style={styles.languageText}>{language}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* About Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>About</Text>
        <Text style={styles.bioText}>{realtor.bio}</Text>
      </View>

      {/* Specialties */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>Specialties</Text>
        <View style={styles.tagsContainer}>
          {realtor.specialties.map((specialty: string, index: number) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyTagText}>{specialty}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Service Areas */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>Service Areas</Text>
        <View style={styles.tagsContainer}>
          {realtor.areas.map((area: string, index: number) => (
            <View key={index} style={styles.areaTag}>
              <Ionicons name="location-outline" size={14} color={RealtorColors.text} />
              <Text style={styles.areaTagText}>{area}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Contact Information */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>Contact</Text>
        
        <TouchableOpacity style={styles.contactItem} onPress={handleCall}>
          <Ionicons name="call" size={20} color="#007AFF" />
          <Text style={styles.contactItemText}>{realtor.phone}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
          <Ionicons name="mail" size={20} color="#007AFF" />
          <Text style={styles.contactItemText}>{realtor.email}</Text>
        </TouchableOpacity>
        
        <View style={styles.contactItem}>
          <Ionicons name="business" size={20} color={RealtorColors.textLight} />
          <Text style={[styles.contactItemText, { color: RealtorColors.text }]}>{realtor.company}</Text>
        </View>
        
        <View style={styles.contactItem}>
          <Ionicons name="shield-checkmark" size={20} color={RealtorColors.success} />
          <Text style={[styles.contactItemText, { color: RealtorColors.text }]}>License: {realtor.license}</Text>
        </View>
      </View>

      {/* Active Listings */}
      {realtor.listings.length > 0 && (
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Active Listings ({realtor.listings.length})</Text>
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
        </View>
      )}
    </View>
  );

  // Photos Tab
  const renderPhotosTab = () => (
    <View style={styles.tabContent}>
      {realtor.photos.length > 0 ? (
        <View style={styles.photosGrid}>
          {realtor.photos.map((photo: any, index: number) => (
            <TouchableOpacity key={photo.id} style={styles.photoGridItem}>
              <Image source={{ uri: photo.url }} style={styles.photoGridImage} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="camera-outline" size={48} color={RealtorColors.textMuted} />
          <Text style={styles.emptyStateText}>No photos yet</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* ===== HERO SECTION ===== */}
        <View style={styles.heroContainer}>
          {/* Photo Carousel */}
          <FlatList
            ref={carouselRef}
            data={realtor.photos}
            renderItem={renderCarouselItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleCarouselScroll}
            scrollEventThrottle={16}
          />
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.heroGradient}
          />
          
          {/* Back Button */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          {/* Top Right Buttons */}
          <View style={styles.topRightButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="#000" />
            </TouchableOpacity>
          </View>
          
          {/* Photo Count Badge */}
          {realtor.photos.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
              <Text style={styles.photoCountText}>{realtor.photos.length}</Text>
            </View>
          )}
          
          {/* Pagination Dots */}
          {realtor.photos.length > 1 && (
            <View style={styles.paginationDots}>
              {realtor.photos.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === currentPhotoIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
          
          {/* Hero Text Overlay */}
          <View style={styles.heroTextContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image source={{ uri: realtor.photo }} style={styles.profilePhoto} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.heroName}>{realtor.name}</Text>
                  {realtor.verified && (
                    <Ionicons name="checkmark-circle" size={18} color={RealtorColors.success} />
                  )}
                </View>
                <View style={styles.heroSubtitle}>
                  <Text style={styles.heroSubtitleText}>🏠 {realtor.title}</Text>
                  <Text style={styles.heroSubtitleText}>📍 {realtor.areas[0]}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ===== QUICK INFO BAR ===== */}
        <View style={styles.quickInfoBar}>
          <TouchableOpacity style={styles.quickInfoItem} onPress={handleMessage}>
            <Text style={styles.quickInfoIcon}>💬</Text>
            <Text style={styles.quickInfoValue}>Message</Text>
            <Text style={styles.quickInfoSub}>Agent</Text>
          </TouchableOpacity>
          
          <View style={styles.quickInfoDivider} />
          
          <TouchableOpacity style={styles.quickInfoItem} onPress={handleCall}>
            <Text style={styles.quickInfoIcon}>📞</Text>
            <Text style={styles.quickInfoValue}>Call</Text>
            <Text style={styles.quickInfoSub}>Direct</Text>
          </TouchableOpacity>
          
          <View style={styles.quickInfoDivider} />
          
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoIcon}>🏆</Text>
            <Text style={styles.quickInfoValue}>{realtor.transactionsClosed}</Text>
            <Text style={styles.quickInfoSub}>Closed</Text>
          </View>
          
          <View style={styles.quickInfoDivider} />
          
          <View style={styles.quickInfoItem}>
            <Text style={styles.quickInfoIcon}>📅</Text>
            <Text style={styles.quickInfoValue}>{realtor.yearsExperience}yr</Text>
            <Text style={styles.quickInfoSub}>Exp.</Text>
          </View>
        </View>

        {/* ===== LANGUAGES PILLS ===== */}
        <View style={styles.languagePillsContainer}>
          {realtor.languages.map((language: string, index: number) => (
            <View key={index} style={styles.languagePill}>
              <Ionicons name="globe-outline" size={14} color={RealtorColors.primary} />
              <Text style={styles.languagePillText}>{language}</Text>
            </View>
          ))}
        </View>

        {/* ===== TAB NAVIGATION ===== */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>
              Reviews
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
            onPress={() => setActiveTab('photos')}
          >
            <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>
              Photos
            </Text>
          </TouchableOpacity>
        </View>

        {/* ===== TAB CONTENT ===== */}
        {activeTab === 'reviews' && renderReviewsTab()}
        {activeTab === 'info' && renderInfoTab()}
        {activeTab === 'photos' && renderPhotosTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RealtorColors.background,
  },
  scrollView: {
    flex: 1,
  },
  // Hero Section
  heroContainer: {
    height: 280,
    position: 'relative',
  },
  carouselImage: {
    width: width,
    height: 280,
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topRightButtons: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoCountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  heroTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  profilePhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  heroSubtitleText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  // Quick Info Bar
  quickInfoBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: RealtorColors.border,
  },
  quickInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickInfoIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: RealtorColors.text,
  },
  quickInfoSub: {
    fontSize: 11,
    color: RealtorColors.textLight,
    marginTop: 2,
  },
  quickInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: RealtorColors.border,
    alignSelf: 'center',
  },
  // Language Pills
  languagePillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: RealtorColors.border,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languagePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: RealtorColors.primary,
  },
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: RealtorColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: RealtorColors.textLight,
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  // Tab Content
  tabContent: {
    padding: 16,
  },
  // Signals Card
  signalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  signalsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: RealtorColors.text,
    marginBottom: 16,
  },
  signalBar: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  signalBarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
    opacity: 0.9,
  },
  // CTA Card
  ctaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
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
  // Info Section
  infoSection: {
    marginBottom: 24,
  },
  infoSectionTitle: {
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
  // Languages
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  languageText: {
    fontSize: 15,
    fontWeight: '600',
    color: RealtorColors.primary,
  },
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: RealtorColors.primary,
  },
  areaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  areaTagText: {
    fontSize: 13,
    fontWeight: '500',
    color: RealtorColors.text,
  },
  // Contact Items
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: RealtorColors.border,
  },
  contactItemText: {
    flex: 1,
    fontSize: 15,
    color: '#007AFF',
  },
  // Listings
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
    height: 160,
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
  // Photos Grid
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoGridItem: {
    width: (width - 48) / 3,
    height: (width - 48) / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  // Empty State
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
});
