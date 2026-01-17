// ============================================================================
// RIDES BROWSE SCREEN
// ============================================================================
// Browse theme park rides and attractions with TavvY signals
// Place this file in: screens/RidesBrowseScreen.tsx
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTheme, spacing, borderRadius, shadows } from '../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// ============================================
// TYPES
// ============================================

interface Place {
  id: string;
  name: string;
  category: string;
  address_line1?: string;
  city?: string;
  state_region?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  signals?: Signal[];
  parkName?: string;
}

interface Signal {
  bucket: string;
  tap_total: number;
}

type SortOption = 'popular' | 'recent' | 'nearby';

// ============================================
// SIGNAL COLORS (matching PlaceCard)
// ============================================

const SIGNAL_COLORS = {
  positive: '#0A84FF', // Blue - The Good
  neutral: '#8B5CF6',  // Purple - The Vibe
  negative: '#FF9500', // Orange - Heads Up
};

// ============================================
// SAMPLE RIDES DATA
// ============================================

const SAMPLE_RIDES: Place[] = [
  { 
    id: 'ride-velocicoaster', 
    name: 'VelociCoaster', 
    category: 'Roller Coaster', 
    city: 'Orlando', 
    state_region: 'FL',
    parkName: 'Islands of Adventure',
    photos: ['https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800'],
    signals: [] 
  },
  { 
    id: 'ride-hagrids', 
    name: "Hagrid's Magical Creatures", 
    category: 'Family Ride', 
    city: 'Orlando', 
    state_region: 'FL',
    parkName: 'Islands of Adventure',
    photos: ['https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800'],
    signals: [] 
  },
  { 
    id: 'ride-avatar', 
    name: 'Avatar Flight of Passage', 
    category: 'Immersive', 
    city: 'Orlando', 
    state_region: 'FL',
    parkName: "Disney's Animal Kingdom",
    photos: ['https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800'],
    signals: [] 
  },
  { 
    id: 'ride-guardians', 
    name: 'Guardians of the Galaxy: Cosmic Rewind', 
    category: 'Roller Coaster', 
    city: 'Orlando', 
    state_region: 'FL',
    parkName: 'EPCOT',
    photos: ['https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800'],
    signals: [] 
  },
  { 
    id: 'ride-pirates', 
    name: 'Pirates of the Caribbean', 
    category: 'Classic', 
    city: 'Anaheim', 
    state_region: 'CA',
    parkName: 'Disneyland',
    photos: ['https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800'],
    signals: [] 
  },
  { 
    id: 'ride-space', 
    name: 'Space Mountain', 
    category: 'Thrill Ride', 
    city: 'Orlando', 
    state_region: 'FL',
    parkName: 'Magic Kingdom',
    photos: ['https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800'],
    signals: [] 
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function RidesBrowseScreen({ navigation }: { navigation: any }) {
  const { isDark } = useThemeContext();
  const theme = useTheme();
  
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [hasMore, setHasMore] = useState(true);

  // Categories to filter for rides/attractions
  const RIDE_CATEGORIES = [
    'Theme Park', 'Amusement Park', 'Attraction', 'Theme Park Ride', 
    'Roller Coaster', 'Water Park', 'Amusement Ride', 'Carnival',
    'Fairground', 'Fun Park'
  ];

  useEffect(() => {
    loadPlaces();
  }, [sortBy]);

  const loadPlaces = async (offset = 0) => {
    try {
      if (offset === 0) setLoading(true);

      // For now, use sample rides data
      // TODO: Query from database when rides are added
      setPlaces(SAMPLE_RIDES);
      
    } catch (error) {
      console.error('Error loading rides:', error);
      setPlaces(SAMPLE_RIDES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlaces();
  }, [sortBy]);

  const handlePlacePress = (place: Place) => {
    navigation.navigate('RideDetails', { 
      rideId: place.id, 
      rideName: place.name,
      parkName: place.parkName,
    });
  };

  // Get category-based fallback image
  const getCategoryFallbackImage = (category: string): string => {
    const lowerCategory = (category || '').toLowerCase();
    
    if (lowerCategory.includes('roller') || lowerCategory.includes('thrill')) {
      return 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800';
    }
    if (lowerCategory.includes('water')) {
      return 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=800';
    }
    if (lowerCategory.includes('family') || lowerCategory.includes('kid')) {
      return 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800';
    }
    return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
  };

  // Render signal badges in 2x2 grid format (matching PlaceCard)
  // Row 1: 2 blue (The Good)
  // Row 2: 1 purple (The Vibe) + 1 orange (Heads Up)
  const renderSignalBadges = (signals: Signal[]) => {
    const hasSignals = signals && signals.length > 0;
    
    return (
      <View style={styles.signalsContainer}>
        {/* Row 1: 2 Blue badges (The Good) */}
        <View style={styles.signalRow}>
          <TouchableOpacity 
            style={[styles.signalBadge, { backgroundColor: SIGNAL_COLORS.positive }]}
            activeOpacity={0.8}
          >
            <Ionicons name="thumbs-up" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.signalText} numberOfLines={1}>
              {hasSignals ? `Thrilling ×12` : 'Be the first to tap!'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.signalBadge, { backgroundColor: SIGNAL_COLORS.positive }]}
            activeOpacity={0.8}
          >
            <Ionicons name="thumbs-up" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.signalText} numberOfLines={1}>
              {hasSignals ? `Smooth ×8` : 'Be the first to tap!'}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Row 2: 1 Purple (The Vibe) + 1 Orange (Heads Up) */}
        <View style={styles.signalRow}>
          <TouchableOpacity 
            style={[styles.signalBadge, { backgroundColor: SIGNAL_COLORS.neutral }]}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.signalText} numberOfLines={1}>
              {hasSignals ? `Immersive ×5` : 'Be the first to tap!'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.signalBadge, { backgroundColor: SIGNAL_COLORS.negative }]}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.signalText} numberOfLines={1}>
              {hasSignals ? `Long lines ×3` : 'Be the first to tap!'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPlaceCard = ({ item: place, index }: { item: Place; index: number }) => {
    const imageUrl = place.photos && place.photos.length > 0 
      ? place.photos[0] 
      : getCategoryFallbackImage(place.category);
    const location = place.parkName || [place.city, place.state_region].filter(Boolean).join(', ') || 'Unknown Location';

    return (
      <TouchableOpacity
        key={`ride-${place.id}-${index}`}
        style={[styles.card, { backgroundColor: isDark ? theme.surface : '#fff' }, shadows.large]}
        onPress={() => handlePlacePress(place)}
        activeOpacity={0.9}
      >
        {/* Photo with Gradient Overlay */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          
          {/* Ride Badge */}
          <View style={styles.rideBadge}>
            <Ionicons name="rocket" size={12} color="#fff" />
            <Text style={styles.rideBadgeText}>RIDE</Text>
          </View>
          
          {/* Gradient Overlay with Name */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradientOverlay}
          >
            <Text style={styles.cardTitle} numberOfLines={1}>{place.name}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {place.category} • {location}
            </Text>
          </LinearGradient>
        </View>
        
        {/* Signal Badges - 2x2 Grid matching PlaceCard */}
        {renderSignalBadges(place.signals || [])}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? theme.background : '#F2F2F7' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? theme.text : '#000'} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#000' }]}>🎢 Rides & Attractions</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
            Theme park experiences reviewed by the community
          </Text>
        </View>
      </View>

      {/* Sort Options */}
      <View style={[styles.sortContainer, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
          {(['popular', 'recent', 'nearby'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortButton,
                sortBy === option && styles.sortButtonActive,
                { backgroundColor: sortBy === option ? '#0A84FF' : (isDark ? theme.background : '#F2F2F7') }
              ]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[
                styles.sortButtonText,
                { color: sortBy === option ? '#fff' : (isDark ? theme.textSecondary : '#666') }
              ]}>
                {option === 'popular' ? '🔥 Popular' : option === 'recent' ? '🆕 Recent' : '📍 Nearby'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Places List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A84FF" />
          <Text style={[styles.loadingText, { color: isDark ? theme.textSecondary : '#666' }]}>
            Loading rides...
          </Text>
        </View>
      ) : (
        <FlatList
          data={places}
          renderItem={renderPlaceCard}
          keyExtractor={(item, index) => `ride-list-${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0A84FF"
              colors={['#0A84FF']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="rocket-outline" size={64} color={isDark ? theme.textSecondary : '#ccc'} />
              <Text style={[styles.emptyText, { color: isDark ? theme.textSecondary : '#666' }]}>
                No rides found
              </Text>
              <Text style={[styles.emptySubtext, { color: isDark ? theme.textTertiary : '#999' }]}>
                Check back soon for more rides to explore
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sortContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sortScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sortButtonActive: {
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  photoContainer: {
    height: 180,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  rideBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A84FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  rideBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    textAlign: 'left',
  },
  // Signal badges - matching PlaceCard style
  signalsContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  signalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  signalBadge: {
    width: '48%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  signalText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
