// ============================================================================
// RIDES BROWSE SCREEN
// ============================================================================
// Browse theme park rides and attractions with Tavvy signals
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
  description?: string;
  tavvy_category?: string;
  tavvy_subcategory?: string;
  city?: string;
  region?: string;
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
// RIDE CATEGORIES
// ============================================

const RIDE_CATEGORIES = [
  'Attraction', 'Ride', 'Roller Coaster', 'Theme Park Ride',
  'Water Ride', 'Dark Ride', 'Thrill Ride', 'Family Ride',
  'Spinner', 'Show', 'Experience', 'Interactive'
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

  useEffect(() => {
    loadPlaces();
  }, [sortBy]);

  const loadPlaces = async (offset = 0) => {
    try {
      if (offset === 0) setLoading(true);

      // Query places that are rides/attractions from atlas_universe_places
      const { data: placesData, error } = await supabase
        .from('places')
        .select(`
          id,
          name,
          description,
          tavvy_category,
          tavvy_subcategory,
          city,
          region,
          latitude,
          longitude
        `)
        .eq('source_type', 'tavvy_curated')
        .or(RIDE_CATEGORIES.map(cat => `tavvy_category.ilike.%${cat}%`).join(','))
        .limit(50);

      if (error) {
        console.error('Error loading rides:', error);
        // Try alternative query - get all curated places
        const { data: fallbackData } = await supabase
          .from('places')
          .select('*')
          .eq('source_type', 'tavvy_curated')
          .limit(50);
        
        if (fallbackData && fallbackData.length > 0) {
          setPlaces(fallbackData.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            tavvy_category: p.tavvy_category,
            tavvy_subcategory: p.tavvy_subcategory,
            city: p.city,
            region: p.region,
            latitude: p.latitude,
            longitude: p.longitude,
            photos: [],
            signals: [],
          })));
        } else {
          setPlaces([]);
        }
        return;
      }

      if (placesData && placesData.length > 0) {
        setPlaces(placesData.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          tavvy_category: p.tavvy_category,
          tavvy_subcategory: p.tavvy_subcategory,
          city: p.city,
          region: p.region,
          latitude: p.latitude,
          longitude: p.longitude,
          photos: [],
          signals: [],
        })));
        setHasMore(placesData.length === 50);
      } else {
        setPlaces([]);
      }
      
    } catch (error) {
      console.error('Error loading rides:', error);
      setPlaces([]);
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
      parkName: place.parkName || place.city,
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
    if (lowerCategory.includes('dark') || lowerCategory.includes('indoor')) {
      return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
    }
    return 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800';
  };

  // Render signal badges in 2x2 grid format (matching PlaceCard)
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
              {hasSignals ? `Thrilling ×${signals[0]?.tap_total || 0}` : 'Be the first to tap!'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.signalBadge, { backgroundColor: SIGNAL_COLORS.positive }]}
            activeOpacity={0.8}
          >
            <Ionicons name="thumbs-up" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.signalText} numberOfLines={1}>
              {hasSignals ? `Smooth ×${signals[1]?.tap_total || 0}` : 'Be the first to tap!'}
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
              {hasSignals ? `Immersive ×${signals[2]?.tap_total || 0}` : 'Be the first to tap!'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.signalBadge, { backgroundColor: SIGNAL_COLORS.negative }]}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.signalText} numberOfLines={1}>
              {hasSignals ? `Long lines ×${signals[3]?.tap_total || 0}` : 'Be the first to tap!'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPlaceCard = ({ item: place, index }: { item: Place; index: number }) => {
    const imageUrl = place.photos && place.photos.length > 0 
      ? place.photos[0] 
      : getCategoryFallbackImage(place.tavvy_category || '');
    const location = place.parkName || [place.city, place.region].filter(Boolean).join(', ') || 'Theme Park';
    const category = place.tavvy_subcategory || place.tavvy_category || 'Attraction';

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
              {category} • {location}
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
                No rides found yet
              </Text>
              <Text style={[styles.emptySubtext, { color: isDark ? theme.textTertiary : '#999' }]}>
                Check back soon for rides and attractions to explore
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
