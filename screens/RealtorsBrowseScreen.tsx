/**
 * Realtors Browse Screen
 * Install path: screens/RealtorsBrowseScreen.tsx
 * 
 * Browse and search for real estate agents in your area.
 * Uses Tavvy's signal-based review system.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { UnifiedHeader } from '../components/UnifiedHeader';

const { width } = Dimensions.get('window');

// Realtor-specific colors
const RealtorColors = {
  primary: '#1E3A5F',      // Deep navy blue
  secondary: '#C9A227',    // Gold accent
  background: '#F8F9FA',
  cardBg: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  textMuted: '#9CA3AF',
  success: '#10B981',
  border: '#E5E7EB',
  gradientStart: '#1E3A5F',
  gradientEnd: '#2D5A8A',
};

// Tavvy Signal Colors
const SignalColors = {
  theGood: '#3B82F6',      // Blue - positive
  theVibe: '#8B5CF6',      // Purple - vibe
  headsUp: '#F97316',      // Orange - heads up
};

// Specialties for filtering
const SPECIALTIES = [
  { id: 'all', name: 'All', icon: 'grid-outline' },
  { id: 'luxury', name: 'Luxury', icon: 'diamond-outline' },
  { id: 'first-time', name: 'First-Time Buyers', icon: 'key-outline' },
  { id: 'investment', name: 'Investment', icon: 'trending-up-outline' },
  { id: 'relocation', name: 'Relocation', icon: 'airplane-outline' },
  { id: 'commercial', name: 'Commercial', icon: 'business-outline' },
];

// Default placeholder image
const PLACEHOLDER_PHOTO = 'https://ui-avatars.com/api/?name=Realtor&background=0D9488&color=fff&size=150';

// Realtor type from Supabase
interface Realtor {
  id: string;
  name: string;
  title: string;
  company: string;
  photo: string;
  yearsExperience: number;
  transactionsClosed: number;
  specialties: string[];
  areas: string[];
  verified: boolean;
  signals: {
    theGood: string[] | null;
    theVibe: string[] | null;
    headsUp: string[] | null;
  };
}

type NavigationProp = NativeStackNavigationProp<any>;

export default function RealtorsBrowseScreen() {
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
      // Fetch realtors from pro_providers table where provider_type = 'realtor'
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
        // Transform data to match the expected format
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

  // Transform Supabase data to component format
  const transformRealtorData = (row: any): Realtor => {
    return {
      id: row.id,
      name: row.display_name || row.business_name || 'Unknown',
      title: row.title || 'Real Estate Agent',
      company: row.company_name || row.brokerage || '',
      photo: row.profile_image_url || row.photo_url || PLACEHOLDER_PHOTO,
      yearsExperience: row.years_experience || 0,
      transactionsClosed: row.transactions_closed || row.total_transactions || 0,
      specialties: row.specialties || [],
      areas: row.service_areas || row.areas_served || [],
      verified: row.is_verified || false,
      signals: {
        theGood: row.signals_good || null,
        theVibe: row.signals_vibe || null,
        headsUp: row.signals_headsup || null,
      },
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

      // Apply search filter
      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`display_name.ilike.${searchTerm},business_name.ilike.${searchTerm},company_name.ilike.${searchTerm}`);
      }

      // Apply specialty filter
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

  // Signal Bar Component
  const SignalBar = ({ 
    type, 
    label, 
    hasSignals 
  }: { 
    type: 'theGood' | 'theVibe' | 'headsUp'; 
    label: string;
    hasSignals: boolean;
  }) => {
    const colors = {
      theGood: SignalColors.theGood,
      theVibe: SignalColors.theVibe,
      headsUp: SignalColors.headsUp,
    };

    const icons = {
      theGood: 'thumbs-up',
      theVibe: 'sparkles',
      headsUp: 'alert-circle',
    };

    return (
      <View style={[styles.signalBar, { backgroundColor: colors[type] }]}>
        <Ionicons name={icons[type] as any} size={14} color="#FFFFFF" />
        <Text style={styles.signalBarText}>
          {hasSignals ? label : 'Be the first to tap!'}
        </Text>
      </View>
    );
  };

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={RealtorColors.textMuted} />
      <Text style={styles.emptyStateTitle}>No Realtors Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery.trim() 
          ? 'Try adjusting your search or filters'
          : 'Be the first realtor to join Tavvy!'}
      </Text>
    </View>
  );

  const renderRealtorCard = ({ item }: { item: Realtor }) => (
    <TouchableOpacity 
      style={styles.realtorCard}
      onPress={() => handleRealtorPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.photo }} style={styles.realtorPhoto} />
        <View style={styles.realtorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.realtorName}>{item.name}</Text>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={16} color={RealtorColors.success} />
            )}
          </View>
          <Text style={styles.realtorTitle}>{item.title}</Text>
          <Text style={styles.realtorCompany}>{item.company}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.yearsExperience}</Text>
          <Text style={styles.statLabel}>Years Exp.</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.transactionsClosed}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>

      {item.specialties.length > 0 && (
        <View style={styles.specialtiesRow}>
          {item.specialties.slice(0, 2).map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>
      )}

      {item.areas.length > 0 && (
        <View style={styles.areasRow}>
          <Ionicons name="location-outline" size={14} color={RealtorColors.textLight} />
          <Text style={styles.areasText}>{item.areas.join(' • ')}</Text>
        </View>
      )}

      {/* Tavvy Signal Bars - 2 blue on first row, purple + orange on second row */}
      <View style={styles.signalBarsContainer}>
        {/* First Row - 2 Blue (The Good) bars */}
        <View style={styles.signalRow}>
          <SignalBar 
            type="theGood" 
            label={item.signals.theGood?.[0] || ''} 
            hasSignals={!!item.signals.theGood?.[0]} 
          />
          <SignalBar 
            type="theGood" 
            label={item.signals.theGood?.[1] || ''} 
            hasSignals={!!item.signals.theGood?.[1]} 
          />
        </View>
        {/* Second Row - Purple (The Vibe) + Orange (Heads Up) */}
        <View style={styles.signalRow}>
          <SignalBar 
            type="theVibe" 
            label={item.signals.theVibe?.[0] || ''} 
            hasSignals={!!item.signals.theVibe} 
          />
          <SignalBar 
            type="headsUp" 
            label={item.signals.headsUp?.[0] || ''} 
            hasSignals={!!item.signals.headsUp} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Unified Header */}
      <UnifiedHeader
        screenKey="realtors"
        title="Realtors"
        searchPlaceholder="Search realtors..."
        onSearch={(text) => {
          setSearchQuery(text);
          if (text.length === 0) loadRealtors();
        }}
        showBackButton={true}
      />

      {/* Specialty Pills */}
      <View style={styles.specialtiesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.specialtiesScroll}
        >
          {SPECIALTIES.map((specialty) => (
            <TouchableOpacity
              key={specialty.id}
              style={[
                styles.specialtyPill,
                selectedSpecialty === specialty.id && styles.specialtyPillActive,
              ]}
              onPress={() => handleSpecialtySelect(specialty.id)}
            >
              <Ionicons 
                name={specialty.icon as any} 
                size={16} 
                color={selectedSpecialty === specialty.id ? '#FFFFFF' : RealtorColors.primary} 
              />
              <Text style={[
                styles.specialtyPillText,
                selectedSpecialty === specialty.id && styles.specialtyPillTextActive,
              ]}>
                {specialty.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Find the Right Realtor CTA */}
      <TouchableOpacity 
        style={styles.findRealtorCard}
        onPress={() => navigation.navigate('RealtorMatchStart')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[RealtorColors.secondary, '#D4AF37']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.findRealtorGradient}
        >
          <View style={styles.findRealtorContent}>
            <View style={styles.findRealtorIcon}>
              <Ionicons name="people" size={28} color={RealtorColors.primary} />
            </View>
            <View style={styles.findRealtorText}>
              <Text style={styles.findRealtorTitle}>Find the Right Realtor</Text>
              <Text style={styles.findRealtorSubtitle}>Answer a few questions to get matched</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={RealtorColors.primary} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RealtorColors.primary} />
          <Text style={styles.loadingText}>Loading realtors...</Text>
        </View>
      ) : realtors.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={realtors}
          renderItem={renderRealtorCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {realtors.length} {realtors.length === 1 ? 'Realtor' : 'Realtors'} Found
            </Text>
          }
        />
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: RealtorColors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 100,
    height: 28,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loginButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: RealtorColors.text,
  },
  specialtiesContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: RealtorColors.border,
  },
  specialtiesScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  specialtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  specialtyPillActive: {
    backgroundColor: RealtorColors.primary,
  },
  specialtyPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: RealtorColors.primary,
  },
  specialtyPillTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: RealtorColors.textMuted,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: RealtorColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: RealtorColors.textMuted,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: RealtorColors.textLight,
    marginBottom: 12,
  },
  realtorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  realtorPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
    backgroundColor: '#E5E7EB',
  },
  realtorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  realtorName: {
    fontSize: 18,
    fontWeight: '700',
    color: RealtorColors.text,
  },
  realtorTitle: {
    fontSize: 14,
    color: RealtorColors.textLight,
    marginTop: 2,
  },
  realtorCompany: {
    fontSize: 13,
    color: RealtorColors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: RealtorColors.text,
  },
  statLabel: {
    fontSize: 12,
    color: RealtorColors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: RealtorColors.border,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  specialtyTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
    color: RealtorColors.primary,
  },
  areasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  areasText: {
    fontSize: 13,
    color: RealtorColors.textLight,
  },
  // Tavvy Signal Bars
  signalBarsContainer: {
    gap: 8,
  },
  signalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signalBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  signalBarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Find the Right Realtor Card
  findRealtorCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  findRealtorGradient: {
    padding: 16,
  },
  findRealtorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  findRealtorIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  findRealtorText: {
    flex: 1,
  },
  findRealtorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: RealtorColors.primary,
    marginBottom: 2,
  },
  findRealtorSubtitle: {
    fontSize: 13,
    color: RealtorColors.primary,
    opacity: 0.8,
  },
});
