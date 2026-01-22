// ============================================================================
// CITIES BROWSE SCREEN
// ============================================================================
// Browse cities with Tavvy signals - Cities are places too!
// Place this file in: screens/CitiesBrowseScreen.tsx
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
import { useThemeContext } from '../contexts/ThemeContext';
import { useTheme, spacing, borderRadius, shadows } from '../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

// ============================================
// TYPES
// ============================================

interface City {
  id: string;
  name: string;
  state_region?: string;
  country?: string;
  population?: number;
  cover_image_url?: string;
  signals?: Signal[];
}

interface Signal {
  bucket: string;
  tap_total: number;
}

type SortOption = 'popular' | 'alphabetical' | 'nearby';

// ============================================
// SAMPLE CITIES DATA
// ============================================

const SAMPLE_CITIES: City[] = [
  { 
    id: 'city-orlando', 
    name: 'Orlando', 
    state_region: 'Florida', 
    country: 'USA',
    population: 307573,
    cover_image_url: 'https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?w=800',
    signals: [] 
  },
  { 
    id: 'city-miami', 
    name: 'Miami', 
    state_region: 'Florida', 
    country: 'USA',
    population: 442241,
    cover_image_url: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800',
    signals: [] 
  },
  { 
    id: 'city-nyc', 
    name: 'New York City', 
    state_region: 'New York', 
    country: 'USA',
    population: 8336817,
    cover_image_url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    signals: [] 
  },
  { 
    id: 'city-la', 
    name: 'Los Angeles', 
    state_region: 'California', 
    country: 'USA',
    population: 3979576,
    cover_image_url: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
    signals: [] 
  },
  { 
    id: 'city-chicago', 
    name: 'Chicago', 
    state_region: 'Illinois', 
    country: 'USA',
    population: 2693976,
    cover_image_url: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800',
    signals: [] 
  },
  { 
    id: 'city-austin', 
    name: 'Austin', 
    state_region: 'Texas', 
    country: 'USA',
    population: 978908,
    cover_image_url: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800',
    signals: [] 
  },
  { 
    id: 'city-denver', 
    name: 'Denver', 
    state_region: 'Colorado', 
    country: 'USA',
    population: 715522,
    cover_image_url: 'https://images.unsplash.com/photo-1619856699906-09e1f58c98b1?w=800',
    signals: [] 
  },
  { 
    id: 'city-seattle', 
    name: 'Seattle', 
    state_region: 'Washington', 
    country: 'USA',
    population: 737015,
    cover_image_url: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=800',
    signals: [] 
  },
  { 
    id: 'city-nashville', 
    name: 'Nashville', 
    state_region: 'Tennessee', 
    country: 'USA',
    population: 689447,
    cover_image_url: 'https://images.unsplash.com/photo-1587475656908-5fa696d9e1b6?w=800',
    signals: [] 
  },
  { 
    id: 'city-sanfrancisco', 
    name: 'San Francisco', 
    state_region: 'California', 
    country: 'USA',
    population: 873965,
    cover_image_url: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
    signals: [] 
  },
];

// ============================================
// SIGNAL COLORS (matching PlaceCard)
// ============================================

const SIGNAL_COLORS = {
  positive: '#0A84FF', // Blue - The Good
  neutral: '#8B5CF6',  // Purple - The Vibe
  negative: '#FF9500', // Orange - Heads Up
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function CitiesBrowseScreen({ navigation }: { navigation: any }) {
  const { isDark } = useThemeContext();
  const theme = useTheme();
  
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  useEffect(() => {
    loadCities();
  }, [sortBy]);

  const loadCities = async () => {
    try {
      setLoading(true);

      // For now, use sample cities data
      // TODO: Once cities table is created, query from database
      // Cities are a special category - they need their own table or 
      // a dedicated category in the places system
      
      setCities(sortCities(SAMPLE_CITIES));
      
    } catch (error) {
      console.error('Error loading cities:', error);
      setCities(sortCities(SAMPLE_CITIES));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sortCities = (citiesList: City[]): City[] => {
    switch (sortBy) {
      case 'alphabetical':
        return [...citiesList].sort((a, b) => a.name.localeCompare(b.name));
      case 'popular':
        return [...citiesList].sort((a, b) => (b.population || 0) - (a.population || 0));
      default:
        return citiesList;
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCities();
  }, [sortBy]);

  const handleCityPress = (city: City) => {
    navigation.navigate('CityDetails', { 
      cityId: city.id, 
      cityName: city.name 
    });
  };

  const formatPopulation = (pop?: number): string => {
    if (!pop) return '';
    if (pop >= 1000000) {
      return `${(pop / 1000000).toFixed(1)}M people`;
    }
    if (pop >= 1000) {
      return `${(pop / 1000).toFixed(0)}K people`;
    }
    return `${pop} people`;
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
              {hasSignals ? `Great food ×12` : 'Be the first to tap!'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.signalBadge, { backgroundColor: SIGNAL_COLORS.positive }]}
            activeOpacity={0.8}
          >
            <Ionicons name="thumbs-up" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.signalText} numberOfLines={1}>
              {hasSignals ? `Walkable ×8` : 'Be the first to tap!'}
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
              {hasSignals ? `Trendy ×5` : 'Be the first to tap!'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.signalBadge, { backgroundColor: SIGNAL_COLORS.negative }]}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.signalText} numberOfLines={1}>
              {hasSignals ? `Expensive ×3` : 'Be the first to tap!'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCityCard = ({ item: city, index }: { item: City; index: number }) => {
    const imageUrl = city.cover_image_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800';
    const location = [city.state_region, city.country].filter(Boolean).join(', ') || 'USA';

    return (
      <TouchableOpacity
        key={`city-${city.id}-${index}`}
        style={[styles.card, { backgroundColor: isDark ? theme.surface : '#fff' }, shadows.large]}
        onPress={() => handleCityPress(city)}
        activeOpacity={0.9}
      >
        {/* Photo with Gradient Overlay */}
        <View style={styles.photoContainer}>
          <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          
          {/* City Badge */}
          <View style={styles.cityBadge}>
            <Ionicons name="business" size={12} color="#fff" />
            <Text style={styles.cityBadgeText}>CITY</Text>
          </View>
          
          {/* Gradient Overlay with Name */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradientOverlay}
          >
            <Text style={styles.cardTitle} numberOfLines={1}>{city.name}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {location} {city.population ? `• ${formatPopulation(city.population)}` : ''}
            </Text>
          </LinearGradient>
        </View>
        
        {/* Signal Badges - 2x2 Grid matching PlaceCard */}
        {renderSignalBadges(city.signals || [])}
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
          <Text style={[styles.headerTitle, { color: isDark ? theme.text : '#000' }]}>🏙️ Cities</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? theme.textSecondary : '#666' }]}>
            Discover and review cities around the world
          </Text>
        </View>
      </View>

      {/* Sort Options */}
      <View style={[styles.sortContainer, { backgroundColor: isDark ? theme.surface : '#fff' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortScroll}>
          {(['popular', 'alphabetical', 'nearby'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.sortButton,
                sortBy === option && styles.sortButtonActive,
                { backgroundColor: sortBy === option ? '#EF4444' : (isDark ? theme.background : '#F2F2F7') }
              ]}
              onPress={() => setSortBy(option)}
            >
              <Text style={[
                styles.sortButtonText,
                { color: sortBy === option ? '#fff' : (isDark ? theme.textSecondary : '#666') }
              ]}>
                {option === 'popular' ? '🔥 Popular' : option === 'alphabetical' ? '🔤 A-Z' : '📍 Nearby'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cities List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={[styles.loadingText, { color: isDark ? theme.textSecondary : '#666' }]}>
            Loading cities...
          </Text>
        </View>
      ) : (
        <FlatList
          data={cities}
          renderItem={renderCityCard}
          keyExtractor={(item, index) => `city-list-${item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#EF4444"
              colors={['#EF4444']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={64} color={isDark ? theme.textSecondary : '#ccc'} />
              <Text style={[styles.emptyText, { color: isDark ? theme.textSecondary : '#666' }]}>
                No cities found
              </Text>
              <Text style={[styles.emptySubtext, { color: isDark ? theme.textTertiary : '#999' }]}>
                Check back soon for more cities to explore
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
    shadowColor: '#EF4444',
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
  cityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  cityBadgeText: {
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
