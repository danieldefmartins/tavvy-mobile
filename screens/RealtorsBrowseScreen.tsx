/**
 * Realtors Browse Screen
 * Install path: screens/RealtorsBrowseScreen.tsx
 * 
 * Browse and search for real estate agents in your area.
 * Uses TavvY's signal-based review system.
 */
import React, { useState, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';

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

// TavvY Signal Colors
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

// Mock realtors data with signals
const MOCK_REALTORS = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    title: 'Licensed Real Estate Agent',
    company: 'Prestige Realty Group',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    yearsExperience: 12,
    transactionsClosed: 450,
    specialties: ['Luxury Homes', 'First-Time Buyers'],
    areas: ['Downtown', 'Westside'],
    verified: true,
    // TavvY Signals
    signals: {
      theGood: ['Responsive', 'Knowledgeable'],
      theVibe: null,
      headsUp: null,
    },
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'Broker Associate',
    company: 'Elite Properties',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    yearsExperience: 8,
    transactionsClosed: 280,
    specialties: ['Investment Properties', 'Commercial'],
    areas: ['Financial District', 'Midtown'],
    verified: true,
    signals: {
      theGood: null,
      theVibe: null,
      headsUp: null,
    },
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    title: 'Real Estate Consultant',
    company: 'HomeFirst Realty',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    yearsExperience: 15,
    transactionsClosed: 520,
    specialties: ['Relocation', 'First-Time Buyers'],
    areas: ['Suburbs', 'Lakefront'],
    verified: true,
    signals: {
      theGood: ['Patient', 'Great Negotiator'],
      theVibe: ['Professional'],
      headsUp: null,
    },
  },
  {
    id: '4',
    name: 'James Wilson',
    title: 'Senior Real Estate Agent',
    company: 'Cityscape Realty',
    photo: 'https://randomuser.me/api/portraits/men/75.jpg',
    yearsExperience: 20,
    transactionsClosed: 680,
    specialties: ['Luxury Homes', 'Investment Properties'],
    areas: ['Uptown', 'Historic District'],
    verified: true,
    signals: {
      theGood: null,
      theVibe: null,
      headsUp: null,
    },
  },
  {
    id: '5',
    name: 'Amanda Foster',
    title: 'Realtor',
    company: 'NextHome Partners',
    photo: 'https://randomuser.me/api/portraits/women/90.jpg',
    yearsExperience: 5,
    transactionsClosed: 120,
    specialties: ['First-Time Buyers', 'Relocation'],
    areas: ['East Side', 'University District'],
    verified: false,
    signals: {
      theGood: ['Friendly', 'Quick Responses'],
      theVibe: ['Energetic'],
      headsUp: ['New to Area'],
    },
  },
];

type NavigationProp = NativeStackNavigationProp<any>;

export default function RealtorsBrowseScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [realtors, setRealtors] = useState(MOCK_REALTORS);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSearch = useCallback(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      let filtered = MOCK_REALTORS;
      
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
          r.name.toLowerCase().includes(query) ||
          r.company.toLowerCase().includes(query) ||
          r.areas.some(a => a.toLowerCase().includes(query))
        );
      }
      
      if (selectedSpecialty !== 'all') {
        const specialtyMap: { [key: string]: string } = {
          'luxury': 'Luxury Homes',
          'first-time': 'First-Time Buyers',
          'investment': 'Investment Properties',
          'relocation': 'Relocation',
          'commercial': 'Commercial',
        };
        filtered = filtered.filter(r => 
          r.specialties.some(s => s.includes(specialtyMap[selectedSpecialty] || ''))
        );
      }
      
      setRealtors(filtered);
      setLoading(false);
    }, 500);
  }, [searchQuery, selectedSpecialty]);

  const handleSpecialtySelect = (id: string) => {
    setSelectedSpecialty(id);
    setTimeout(handleSearch, 100);
  };

  const handleRealtorPress = (realtor: typeof MOCK_REALTORS[0]) => {
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

  const renderRealtorCard = ({ item }: { item: typeof MOCK_REALTORS[0] }) => (
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

      <View style={styles.specialtiesRow}>
        {item.specialties.slice(0, 2).map((specialty, index) => (
          <View key={index} style={styles.specialtyTag}>
            <Text style={styles.specialtyText}>{specialty}</Text>
          </View>
        ))}
      </View>

      <View style={styles.areasRow}>
        <Ionicons name="location-outline" size={14} color={RealtorColors.textLight} />
        <Text style={styles.areasText}>{item.areas.join(' • ')}</Text>
      </View>

      {/* TavvY Signal Bars - 2 blue on first row, purple + orange on second row */}
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
      {/* Header with Gradient */}
      <LinearGradient
        colors={[RealtorColors.gradientStart, RealtorColors.gradientEnd]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Image 
                source={require('../assets/brand/tavvy-logo-white.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerTitle}>Realtors</Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color={RealtorColors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search realtors..."
                placeholderTextColor={RealtorColors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={RealtorColors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

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

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={RealtorColors.primary} />
        </View>
      ) : (
        <FlatList
          data={realtors}
          renderItem={renderRealtorCard}
          keyExtractor={(item, index) => `${item.id}-${index}`}
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
    width: 80,
    height: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
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
  // TavvY Signal Bars
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
});
