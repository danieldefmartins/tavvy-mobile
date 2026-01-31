/**
 * RealtorsHubScreen.tsx
 * Install path: screens/RealtorsHubScreen.tsx
 * 
 * Main Realtors hub screen with Smart Match CTA and featured realtors.
 * NEW DARK THEME DESIGN - Matches the new Tavvy app design language
 * 
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
  TextInput,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// New Dark Theme Colors (matching new Tavvy design)
const Colors = {
  background: '#0A0A0F',       // Deep black
  surface: '#1A1A24',          // Dark card background
  surfaceLight: '#252532',     // Lighter surface for inputs
  primary: '#3B82F6',          // Blue accent
  secondary: '#C9A227',        // Gold accent for realtors
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#10B981',
  border: '#2D2D3A',
  badge: '#EF4444',            // Red for badges
  badgeBlue: '#3B82F6',        // Blue for "FEATURED"
};

// Specialties for filtering
const SPECIALTIES = [
  { id: 'all', name: 'All', icon: 'grid-outline' },
  { id: 'luxury', name: 'Luxury', icon: 'diamond-outline' },
  { id: 'first-time', name: 'First-Time', icon: 'key-outline' },
  { id: 'investment', name: 'Investment', icon: 'trending-up-outline' },
  { id: 'relocation', name: 'Relocation', icon: 'airplane-outline' },
  { id: 'commercial', name: 'Commercial', icon: 'business-outline' },
];

// Default placeholder images
const PLACEHOLDER_PHOTO = 'https://ui-avatars.com/api/?name=Realtor&background=1E3A5F&color=fff&size=150';
const PLACEHOLDER_COVER = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';

// Realtor type from Supabase
interface Realtor {
  id: string;
  name: string;
  title: string;
  company: string;
  photo: string;
  coverPhoto?: string;
  yearsExperience: number;
  transactionsClosed: number;
  specialties: string[];
  areas: string[];
  verified: boolean;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
}

type NavigationProp = NativeStackNavigationProp<any>;

export default function RealtorsHubScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [featuredRealtor, setFeaturedRealtor] = useState<Realtor | null>(null);
  const [popularRealtors, setPopularRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealtors();
  }, []);

  const loadRealtors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pro_providers')
        .select('*')
        .eq('provider_type', 'realtor')
        .eq('is_active', true)
        .order('average_rating', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching realtors:', error);
        setFeaturedRealtor(null);
        setPopularRealtors([]);
      } else if (data && data.length > 0) {
        const mappedRealtors: Realtor[] = data.map((r: any) => ({
          id: r.id,
          name: r.display_name || r.business_name || 'Unknown',
          title: r.title || 'Real Estate Agent',
          company: r.company_name || r.brokerage || '',
          photo: r.profile_image_url || r.photo_url || PLACEHOLDER_PHOTO,
          coverPhoto: r.cover_image_url || PLACEHOLDER_COVER,
          yearsExperience: r.years_experience || 0,
          transactionsClosed: r.transactions_closed || r.total_transactions || 0,
          specialties: r.specialties || [],
          areas: r.service_areas || r.areas_served || [],
          verified: r.is_verified || false,
          rating: r.average_rating || 4.5,
          reviewCount: r.review_count || 0,
          isFeatured: r.is_featured || false,
        }));

        // First realtor as featured, rest as popular
        setFeaturedRealtor(mappedRealtors[0]);
        setPopularRealtors(mappedRealtors.slice(1, 5));
      }
    } catch (error) {
      console.error('Error loading realtors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSearch = () => {
    navigation.navigate('RealtorsBrowse', { searchQuery });
  };

  const handleSmartMatch = () => {
    navigation.navigate('RealtorMatchStart');
  };

  const handleBrowseAll = () => {
    navigation.navigate('RealtorsBrowse');
  };

  const handleRealtorPress = (realtor: Realtor) => {
    navigation.navigate('RealtorDetail', {
      realtorId: realtor.id,
      realtorName: realtor.name,
    });
  };

  const handleSpecialtyPress = (specialtyId: string) => {
    setSelectedSpecialty(specialtyId);
    navigation.navigate('RealtorsBrowse', { specialty: specialtyId });
  };

  // Render Featured Realtor Card (large hero card)
  const renderFeaturedCard = () => {
    if (!featuredRealtor) return null;

    return (
      <TouchableOpacity 
        style={styles.featuredCard}
        onPress={() => handleRealtorPress(featuredRealtor)}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: featuredRealtor.coverPhoto || PLACEHOLDER_COVER }} 
          style={styles.featuredImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.featuredGradient}
        />
        
        {/* Featured Badge */}
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredBadgeText}>TOP RATED</Text>
        </View>
        
        {/* Realtor Info */}
        <View style={styles.featuredInfo}>
          <View style={styles.featuredHeader}>
            <Image source={{ uri: featuredRealtor.photo }} style={styles.featuredAvatar} />
            <View style={styles.featuredTextContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.featuredName}>{featuredRealtor.name}</Text>
                {featuredRealtor.verified && (
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                )}
              </View>
              <Text style={styles.featuredSubtitle}>
                {featuredRealtor.areas[0] || 'Your Area'} • {featuredRealtor.yearsExperience} years exp.
              </Text>
            </View>
          </View>
          
          {/* Rating */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.ratingText}>{featuredRealtor.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({featuredRealtor.reviewCount} reviews)</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Popular Realtor Card (grid item)
  const renderRealtorCard = (realtor: Realtor, index: number) => (
    <TouchableOpacity 
      key={realtor.id}
      style={styles.realtorCard}
      onPress={() => handleRealtorPress(realtor)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: realtor.photo }} style={styles.realtorImage} />
      
      {/* Trending Badge */}
      {index < 2 && (
        <View style={styles.trendingBadge}>
          <Text style={styles.trendingText}>🔥 Trending</Text>
        </View>
      )}
      
      <View style={styles.realtorInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.realtorName} numberOfLines={1}>{realtor.name}</Text>
          {realtor.verified && (
            <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
          )}
        </View>
        <Text style={styles.realtorLocation} numberOfLines={1}>
          {realtor.areas[0] || 'Your Area'}
        </Text>
        <View style={styles.realtorRating}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={styles.realtorRatingText}>{realtor.rating.toFixed(1)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Realtors</Text>
            <Text style={styles.headerSubtitle}>Find your perfect agent.</Text>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search Bar */}
          <TouchableOpacity style={styles.searchBar} onPress={handleSearch}>
            <Ionicons name="search" size={20} color={Colors.textMuted} />
            <Text style={styles.searchPlaceholder}>Search realtors...</Text>
          </TouchableOpacity>

          {/* Filter Pills */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            {SPECIALTIES.map((specialty) => (
              <TouchableOpacity
                key={specialty.id}
                style={[
                  styles.filterPill,
                  selectedSpecialty === specialty.id && styles.filterPillActive
                ]}
                onPress={() => handleSpecialtyPress(specialty.id)}
              >
                <Text style={[
                  styles.filterPillText,
                  selectedSpecialty === specialty.id && styles.filterPillTextActive
                ]}>
                  {specialty.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Smart Match CTA Card */}
          <TouchableOpacity style={styles.smartMatchCard} onPress={handleSmartMatch}>
            <LinearGradient
              colors={['#6B7FFF', '#5563E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
              style={styles.smartMatchGradient}
            >
              <View style={styles.smartMatchContent}>
                <View style={styles.smartMatchIcon}>
                  <Ionicons name="flash" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.smartMatchText}>
                  <Text style={styles.smartMatchTitle}>Smart Match</Text>
                  <Text style={styles.smartMatchSubtitle}>
                    Answer a few questions and get matched with the perfect realtor for your needs.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.text} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Featured Realtor Section */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Finding top realtors...</Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Realtor</Text>
              </View>
              {renderFeaturedCard()}

              {/* Popular Realtors Section */}
              {popularRealtors.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Popular Realtors</Text>
                    <TouchableOpacity onPress={handleBrowseAll}>
                      <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.realtorsGrid}>
                    {popularRealtors.map((realtor, index) => renderRealtorCard(realtor, index))}
                  </View>
                </>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !featuredRealtor && (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Realtors Available</Text>
              <Text style={styles.emptyText}>
                Check back soon or use Smart Match to find realtors in your area.
              </Text>
              <TouchableOpacity style={styles.smartMatchButton} onPress={handleSmartMatch}>
                <Ionicons name="sparkles" size={20} color={Colors.text} />
                <Text style={styles.smartMatchButtonText}>Try Smart Match</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 2,
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  
  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: Colors.textMuted,
    marginLeft: 12,
  },
  
  // Filter Pills
  filtersContainer: {
    marginBottom: 20,
  },
  filtersContent: {
    paddingRight: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: Colors.text,
  },
  
  // Smart Match Card
  smartMatchCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  smartMatchGradient: {
    padding: 20,
  },
  smartMatchContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smartMatchIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  smartMatchText: {
    flex: 1,
  },
  smartMatchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  smartMatchSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // Featured Card
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    height: 220,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Colors.badge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.text,
  },
  featuredInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.text,
    marginRight: 12,
  },
  featuredTextContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  featuredSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  
  // Realtors Grid
  realtorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  realtorCard: {
    width: (width - 48) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  realtorImage: {
    width: '100%',
    height: 120,
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendingText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500',
  },
  realtorInfo: {
    padding: 12,
  },
  realtorName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  realtorLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  realtorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  realtorRatingText: {
    fontSize: 13,
    color: Colors.text,
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Loading State
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  smartMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  smartMatchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
