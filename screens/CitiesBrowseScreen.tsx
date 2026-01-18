import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';

interface City {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  country: string;
  region: string | null;
  population: number | null;
  cover_image_url: string | null;
  description: string | null;
  is_featured: boolean;
  is_active: boolean;
}

interface CitySignals {
  theGood: string[];
  theVibe: string[];
  headsUp: string[];
}

export default function CitiesBrowseScreen() {
  const navigation = useNavigation<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'az' | 'nearby'>('popular');

  const loadCities = useCallback(async () => {
    try {
      let query = supabase
        .from('tavvy_cities')
        .select('*')
        .eq('is_active', true);

      // Apply sorting
      if (sortBy === 'az') {
        query = query.order('name', { ascending: true });
      } else if (sortBy === 'popular') {
        query = query.order('is_featured', { ascending: false }).order('population', { ascending: false });
      } else {
        query = query.order('name', { ascending: true });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading cities:', error);
        return;
      }

      setCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sortBy]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCities();
  };

  const formatPopulation = (pop: number | null) => {
    if (!pop) return '';
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M people`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K people`;
    return `${pop} people`;
  };

  const renderCityCard = ({ item }: { item: City }) => {
    const location = [item.state, item.country].filter(Boolean).join(', ');
    
    return (
      <TouchableOpacity
        style={[styles.cityCard, isDark && styles.cityCardDark]}
        onPress={() => navigation.navigate('CityDetails', { cityId: item.id, cityName: item.name })}
        activeOpacity={0.9}
      >
        {/* Cover Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.cover_image_url || 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800' }}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />
          
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Ionicons name="business" size={12} color="#FFF" />
            <Text style={styles.categoryText}>CITY</Text>
          </View>
        </View>

        {/* City Info */}
        <View style={styles.cityInfo}>
          <Text style={[styles.cityName, isDark && styles.textDark]}>{item.name}</Text>
          <Text style={[styles.cityLocation, isDark && styles.textMutedDark]}>
            {location} {item.population ? `• ${formatPopulation(item.population)}` : ''}
          </Text>

          {/* Signal Badges - Matching PlaceCard style */}
          {/* Row 1: 2 Blue badges (The Good) */}
          <View style={styles.signalRow}>
            <View style={[styles.signalBadge, styles.signalBadgeBlue]}>
              <Ionicons name="thumbs-up" size={12} color="#FFF" />
              <Text style={styles.signalBadgeText}>Be the first to tap!</Text>
            </View>
            <View style={[styles.signalBadge, styles.signalBadgeBlue]}>
              <Ionicons name="thumbs-up" size={12} color="#FFF" />
              <Text style={styles.signalBadgeText}>Be the first to tap!</Text>
            </View>
          </View>
          
          {/* Row 2: 1 Purple (Vibe) + 1 Orange (Heads Up) */}
          <View style={styles.signalRow}>
            <View style={[styles.signalBadge, styles.signalBadgePurple]}>
              <Ionicons name="sparkles" size={12} color="#FFF" />
              <Text style={styles.signalBadgeText}>Be the first to tap!</Text>
            </View>
            <View style={[styles.signalBadge, styles.signalBadgeOrange]}>
              <Ionicons name="alert-circle" size={12} color="#FFF" />
              <Text style={styles.signalBadgeText}>Be the first to tap!</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSortButton = (type: 'popular' | 'az' | 'nearby', label: string, icon?: string) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortBy === type && styles.sortButtonActive,
      ]}
      onPress={() => setSortBy(type)}
    >
      {icon && <Text style={styles.sortIcon}>{icon}</Text>}
      <Text style={[
        styles.sortButtonText,
        sortBy === type && styles.sortButtonTextActive,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={[styles.loadingText, isDark && styles.textMutedDark]}>Loading cities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#1F2937'} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerEmoji}>🏙️</Text>
          <Text style={[styles.headerText, isDark && styles.textDark]}>Cities</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <Text style={[styles.subtitle, isDark && styles.textMutedDark]}>
        Discover and review cities around the world
      </Text>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        {renderSortButton('popular', 'Popular', '🔥')}
        {renderSortButton('az', 'A-Z', '🔤')}
        {renderSortButton('nearby', 'Nearby', '📍')}
      </View>

      {/* Cities List */}
      <FlatList
        data={cities}
        renderItem={renderCityCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🏙️</Text>
            <Text style={[styles.emptyText, isDark && styles.textDark]}>No cities found</Text>
            <Text style={[styles.emptySubtext, isDark && styles.textMutedDark]}>
              Check back later for more cities
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  containerDark: {
    backgroundColor: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  sortIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  sortButtonTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cityCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cityCardDark: {
    backgroundColor: '#1F2937',
  },
  imageContainer: {
    height: 180,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cityInfo: {
    padding: 16,
  },
  cityName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  cityLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  signalRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  signalBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  signalBadgeBlue: {
    backgroundColor: '#3B82F6',
  },
  signalBadgePurple: {
    backgroundColor: '#8B5CF6',
  },
  signalBadgeOrange: {
    backgroundColor: '#F97316',
  },
  signalBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  textDark: {
    color: '#F9FAFB',
  },
  textMutedDark: {
    color: '#9CA3AF',
  },
});
