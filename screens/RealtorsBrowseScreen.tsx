/**
 * Realtors Browse Screen
 * Install path: screens/RealtorsBrowseScreen.tsx
 * 
 * Browse and search for real estate agents in your area.
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

// Specialties for filtering
const SPECIALTIES = [
  { id: 'all', name: 'All', icon: 'grid-outline' },
  { id: 'luxury', name: 'Luxury', icon: 'diamond-outline' },
  { id: 'first-time', name: 'First-Time Buyers', icon: 'key-outline' },
  { id: 'investment', name: 'Investment', icon: 'trending-up-outline' },
  { id: 'relocation', name: 'Relocation', icon: 'airplane-outline' },
  { id: 'commercial', name: 'Commercial', icon: 'business-outline' },
];

// Mock realtors data
const MOCK_REALTORS = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    title: 'Licensed Real Estate Agent',
    company: 'Prestige Realty Group',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4.9,
    reviewCount: 127,
    yearsExperience: 12,
    transactionsClosed: 450,
    specialties: ['Luxury Homes', 'First-Time Buyers'],
    areas: ['Downtown', 'Westside'],
    verified: true,
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'Broker Associate',
    company: 'Elite Properties',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 4.8,
    reviewCount: 98,
    yearsExperience: 8,
    transactionsClosed: 280,
    specialties: ['Investment Properties', 'Commercial'],
    areas: ['Financial District', 'Midtown'],
    verified: true,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    title: 'Real Estate Consultant',
    company: 'HomeFirst Realty',
    photo: 'https://randomuser.me/api/portraits/women/68.jpg',
    rating: 4.7,
    reviewCount: 156,
    yearsExperience: 15,
    transactionsClosed: 520,
    specialties: ['Relocation', 'First-Time Buyers'],
    areas: ['Suburbs', 'Lakefront'],
    verified: true,
  },
  {
    id: '4',
    name: 'James Wilson',
    title: 'Senior Real Estate Agent',
    company: 'Century Homes',
    photo: 'https://randomuser.me/api/portraits/men/75.jpg',
    rating: 4.9,
    reviewCount: 203,
    yearsExperience: 20,
    transactionsClosed: 750,
    specialties: ['Luxury Homes', 'Investment Properties'],
    areas: ['Hillside', 'Waterfront'],
    verified: true,
  },
  {
    id: '5',
    name: 'Amanda Foster',
    title: 'Realtor',
    company: 'Urban Living Realty',
    photo: 'https://randomuser.me/api/portraits/women/90.jpg',
    rating: 4.6,
    reviewCount: 67,
    yearsExperience: 5,
    transactionsClosed: 120,
    specialties: ['First-Time Buyers', 'Condos'],
    areas: ['Downtown', 'Arts District'],
    verified: false,
  },
];

type NavigationProp = NativeStackNavigationProp<any>;

export default function RealtorsBrowseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [loading, setLoading] = useState(false);
  const [realtors, setRealtors] = useState(MOCK_REALTORS);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSearch = useCallback(() => {
    setLoading(true);
    // Simulate search - in production, this would call an API
    setTimeout(() => {
      let filtered = MOCK_REALTORS;
      
      if (searchQuery) {
        filtered = filtered.filter(r => 
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.company.toLowerCase().includes(searchQuery.toLowerCase())
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
    // Trigger search when specialty changes
    setTimeout(handleSearch, 100);
  };

  const handleRealtorPress = (realtor: typeof MOCK_REALTORS[0]) => {
    navigation.navigate('RealtorDetail', { 
      realtorId: realtor.id,
      realtorName: realtor.name,
    });
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
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color={RealtorColors.secondary} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.statLabel}>{item.reviewCount} reviews</Text>
        </View>
        <View style={styles.statDivider} />
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

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.contactButton}
          onPress={() => handleRealtorPress(item)}
        >
          <Text style={styles.contactButtonText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble-outline" size={20} color={RealtorColors.primary} />
        </TouchableOpacity>
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={RealtorColors.textMuted} />
              <Text style={styles.emptyText}>No realtors found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
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
    color: RealtorColors.primary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: RealtorColors.border,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: RealtorColors.text,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: RealtorColors.text,
  },
  statLabel: {
    fontSize: 12,
    color: RealtorColors.textLight,
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
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: RealtorColors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: RealtorColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: RealtorColors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: RealtorColors.textLight,
    marginTop: 4,
  },
});
