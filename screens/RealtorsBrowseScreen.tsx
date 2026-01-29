/**
 * Realtors Browse Screen
 * Install path: screens/RealtorsBrowseScreen.tsx
 * 
 * Browse and search for real estate agents in your area.
 * NEW DARK THEME DESIGN - Matches the new Tavvy app design language
 * 
 * NOW CONNECTED TO SUPABASE - Fetches real data from pro_providers table
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// New Dark Theme Colors (matching new Tavvy design)
const Colors = {
  background: '#0A0A0F',       // Deep black
  surface: '#1A1A24',          // Dark card background
  surfaceLight: '#252532',     // Lighter surface for inputs
  primary: '#3B82F6',          // Blue accent (matching other screens)
  secondary: '#C9A227',        // Gold accent for realtors
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#10B981',
  border: '#2D2D3A',
  cardBorder: '#3D3D4A',
  badge: '#EF4444',            // Red for badges like "TOP RATED"
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

// Default placeholder image
const PLACEHOLDER_PHOTO = 'https://ui-avatars.com/api/?name=Realtor&background=1E3A5F&color=fff&size=150';

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

export default function RealtorsBrowseScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load realtors on mount
  useEffect(() => {
    loadRealtors();
  }, []);

  // Reload when specialty changes
  useEffect(() => {
    if (!initialLoading) {
      handleSearch();
    }
  }, [selectedSpecialty]);

  const loadRealtors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pro_providers')
        .select('*')
        .eq('provider_type', 'realtor')
        .eq('is_active', true)
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching realtors:', error);
        setRealtors([]);
      } else {
        const transformedRealtors = (data || []).map(transformRealtorData);
        setRealtors(transformedRealtors);
      }
    } catch (error) {
      console.error('Error loading realtors:', error);
      setRealtors([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const transformRealtorData = (row: any): Realtor => {
    return {
      id: row.id,
      name: row.display_name || row.business_name || 'Unknown',
      title: row.title || 'Real Estate Agent',
      company: row.company_name || row.brokerage || '',
      photo: row.profile_image_url || row.photo_url || PLACEHOLDER_PHOTO,
      coverPhoto: row.cover_image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
      yearsExperience: row.years_experience || 0,
      transactionsClosed: row.transactions_closed || row.total_transactions || 0,
      specialties: row.specialties || [],
      areas: row.service_areas || row.areas_served || [],
      verified: row.is_verified || false,
      rating: row.average_rating || 4.8,
      reviewCount: row.review_count || 0,
      isFeatured: row.is_featured || row.is_verified || false,
    };
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleFindRealtor = () => {
    navigation.navigate('RealtorMatchStart');
  };

  const handleSearch = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pro_providers')
        .select('*')
        .eq('provider_type', 'realtor')
        .eq('is_active', true);

      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`display_name.ilike.${searchTerm},business_name.ilike.${searchTerm},company_name.ilike.${searchTerm}`);
      }

      if (selectedSpecialty !== 'all') {
        const specialtyMap: { [key: string]: string } = {
          'luxury': 'Luxury',
          'first-time': 'First-Time',
          'investment': 'Investment',
          'relocation': 'Relocation',
          'commercial': 'Commercial',
        };
        const specialtyTerm = specialtyMap[selectedSpecialty];
        if (specialtyTerm) {
          query = query.contains('specialties', [specialtyTerm]);
        }
      }

      query = query
        .order('is_verified', { ascending: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error searching realtors:', error);
        setRealtors([]);
      } else {
        const transformedRealtors = (data || []).map(transformRealtorData);
        setRealtors(transformedRealtors);
      }
    } catch (error) {
      console.error('Error in search:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSpecialty]);

  const handleSpecialtySelect = (id: string) => {
    setSelectedSpecialty(id);
  };

  const handleRealtorPress = (realtor: Realtor) => {
    navigation.navigate('RealtorDetail', { 
      realtorId: realtor.id,
      realtorName: realtor.name,
    });
  };

  // Get featured realtor (first verified one or first in list)
  const featuredRealtor = realtors.find(r => r.isFeatured) || realtors[0];
  const popularRealtors = realtors.filter(r => r.id !== featuredRealtor?.id);

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={Colors.textMuted} />
      <Text style={styles.emptyStateTitle}>No Realtors Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery.trim() 
          ? 'Try adjusting your search or filters'
          : 'Be the first realtor to join Tavvy!'}
      </Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={handleFindRealtor}>
        <Text style={styles.emptyStateButtonText}>Use Smart Match Instead</Text>
      </TouchableOpacity>
    </View>
  );

  // Featured Realtor Card (large hero card)
  const FeaturedRealtorCard = ({ realtor }: { realtor: Realtor }) => (
    <TouchableOpacity 
      style={styles.featuredCard}
      onPress={() => handleRealtorPress(realtor)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: realtor.coverPhoto || realtor.photo }} 
        style={styles.featuredImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.featuredGradient}
      />
      
      {/* Badge */}
      <View style={styles.featuredBadge}>
        <Text style={styles.featuredBadgeText}>TOP RATED</Text>
      </View>
      
      {/* Content */}
      <View style={styles.featuredContent}>
        <View style={styles.featuredRealtorRow}>
          <Image source={{ uri: realtor.photo }} style={styles.featuredAvatar} />
          <View style={styles.featuredInfo}>
            <Text style={styles.featuredName}>{realtor.name}</Text>
            <Text style={styles.featuredSubtitle}>
              {realtor.areas[0] || 'Real Estate'} • {realtor.yearsExperience} yrs exp
            </Text>
          </View>
        </View>
        
        {/* Rating */}
        <View style={styles.featuredRating}>
          <Ionicons name="star" size={16} color="#FBBF24" />
          <Text style={styles.featuredRatingText}>{realtor.rating.toFixed(1)}</Text>
          <Text style={styles.featuredReviewCount}>({realtor.reviewCount} reviews)</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Popular Realtor Card (grid item)
  const RealtorGridCard = ({ realtor }: { realtor: Realtor }) => (
    <TouchableOpacity 
      style={styles.gridCard}
      onPress={() => handleRealtorPress(realtor)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: realtor.photo }} style={styles.gridImage} />
      
      {realtor.verified && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
          <Text style={styles.verifiedBadgeText}>Verified</Text>
        </View>
      )}
      
      <View style={styles.gridContent}>
        <Text style={styles.gridName} numberOfLines={1}>{realtor.name}</Text>
        <Text style={styles.gridSubtitle} numberOfLines={1}>
          {realtor.areas[0] || realtor.company || 'Real Estate Agent'}
        </Text>
        
        {/* Rating stars */}
        <View style={styles.gridRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons 
              key={star}
              name={star <= Math.round(realtor.rating) ? "star" : "star-outline"} 
              size={12} 
              color="#3B82F6" 
            />
          ))}
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
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
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search realtors..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

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
                onPress={() => handleSpecialtySelect(specialty.id)}
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

          {/* Smart Match CTA */}
          <TouchableOpacity style={styles.smartMatchCTA} onPress={handleFindRealtor}>
            <LinearGradient
              colors={['#1E3A5F', '#2D5A8A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.smartMatchGradient}
            >
              <View style={styles.smartMatchContent}>
                <View style={styles.smartMatchIcon}>
                  <Ionicons name="sparkles" size={24} color="#C9A227" />
                </View>
                <View style={styles.smartMatchText}>
                  <Text style={styles.smartMatchTitle}>Find Your Perfect Match</Text>
                  <Text style={styles.smartMatchSubtitle}>Answer a few questions to get matched</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.text} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Finding realtors...</Text>
            </View>
          ) : realtors.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Featured Realtor */}
              {featuredRealtor && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Featured Realtor</Text>
                  <FeaturedRealtorCard realtor={featuredRealtor} />
                </View>
              )}

              {/* Popular Realtors Grid */}
              {popularRealtors.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Popular Realtors</Text>
                  <View style={styles.gridContainer}>
                    {popularRealtors.map((realtor) => (
                      <RealtorGridCard key={realtor.id} realtor={realtor} />
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  
  // Filters
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 16,
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
  
  // Smart Match CTA
  smartMatchCTA: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  smartMatchGradient: {
    padding: 16,
  },
  smartMatchContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smartMatchIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 162, 39, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  smartMatchText: {
    flex: 1,
  },
  smartMatchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  smartMatchSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  
  // Featured Card
  featuredCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    height: 220,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
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
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredRealtorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featuredAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.text,
    marginRight: 12,
  },
  featuredInfo: {
    flex: 1,
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
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 4,
  },
  featuredReviewCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  
  // Grid Cards
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  gridCard: {
    width: (width - 48) / 2,
    marginHorizontal: 4,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.surfaceLight,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 4,
  },
  gridContent: {
    padding: 12,
  },
  gridName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  gridSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  gridRating: {
    flexDirection: 'row',
    gap: 2,
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
});
