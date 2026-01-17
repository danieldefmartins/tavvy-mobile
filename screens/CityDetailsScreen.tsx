import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { fetchPlaceSignals, SignalAggregate } from '../lib/reviews';

const { width } = Dimensions.get('window');

// Category colors matching the universal review system
const CATEGORY_COLORS = {
  best_for: '#0A84FF',
  vibe: '#8B5CF6',
  heads_up: '#FF9500',
};

interface CityData {
  id: string;
  name: string;
  location: string;
  country: string;
  population?: string;
  image: string;
  primaryCategory: string;
  stats: {
    signals: string;
    universes: string;
    places: string;
    photos: string;
  };
}

interface RouteParams {
  cityId: string;
  cityName?: string;
}

export default function CityDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [city, setCity] = useState<CityData | null>(null);
  const [signals, setSignals] = useState<{
    best_for: SignalAggregate[];
    vibe: SignalAggregate[];
    heads_up: SignalAggregate[];
  }>({ best_for: [], vibe: [], heads_up: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Signals');

  useEffect(() => {
    loadCityData();
  }, [params?.cityId]);

  const loadCityData = async () => {
    if (!params?.cityId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch city details from database
      const { data: cityData, error: cityError } = await supabase
        .from('places')
        .select('*')
        .eq('id', params.cityId)
        .single();

      if (cityError) {
        console.error('Error fetching city:', cityError);
      }

      if (cityData) {
        setCity({
          id: cityData.id,
          name: cityData.name || params.cityName || 'Unknown City',
          location: cityData.state || cityData.region || '',
          country: cityData.country || 'USA',
          population: cityData.population ? `${(cityData.population / 1000000).toFixed(1)}M population` : undefined,
          image: cityData.cover_image_url || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
          primaryCategory: cityData.category_slug || cityData.primary_category || 'city',
          stats: {
            signals: '0',
            universes: '0',
            places: '0',
            photos: '0',
          },
        });
      } else {
        // Fallback for when city is not in database yet
        setCity({
          id: params.cityId,
          name: params.cityName || 'City',
          location: '',
          country: '',
          image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
          primaryCategory: 'city',
          stats: {
            signals: '0',
            universes: '0',
            places: '0',
            photos: '0',
          },
        });
      }

      // Fetch signals using the universal review system
      const signalData = await fetchPlaceSignals(params.cityId);
      setSignals({
        best_for: signalData.best_for || [],
        vibe: signalData.vibe || [],
        heads_up: signalData.heads_up || [],
      });

    } catch (error) {
      console.error('Error loading city data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format score for display (x + amount format)
  const formatScore = (score: number): string => {
    if (score >= 1000) {
      return `x${(score / 1000).toFixed(1)}k`;
    }
    return `x${Math.round(score)}`;
  };

  // Navigate to the universal AddReview screen (same as PlaceDetailsScreen)
  const handleAddReview = () => {
    if (!city) return;
    navigation.navigate('AddReview' as never, { 
      placeId: city.id, 
      placeName: city.name, 
      placeCategory: city.primaryCategory 
    } as never);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#EF4444" />
        <Text style={styles.loadingText}>Loading city...</Text>
      </View>
    );
  }

  if (!city) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>City not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#EF4444', marginTop: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalSignals = signals.best_for.length + signals.vibe.length + signals.heads_up.length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: city.image }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          />
          
          {/* Header Actions */}
          <SafeAreaView style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="heart-outline" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="share-outline" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* City Info Overlay */}
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Ionicons name="business" size={12} color="white" />
              <Text style={styles.badgeText}>CITY</Text>
            </View>
            <Text style={styles.cityName}>{city.name}</Text>
            <View style={styles.locationRow}>
              {city.country && <Text style={styles.locationText}>🌍 {city.location ? `${city.location}, ${city.country}` : city.country}</Text>}
              {city.population && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <Ionicons name="people" size={14} color="#9CA3AF" />
                  <Text style={styles.locationText}>{city.population}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <StatItem value={city.stats.signals} label="Signals" icon="star" color="#F59E0B" />
          <StatItem value={city.stats.universes} label="Universes" icon="planet" color="#6366F1" />
          <StatItem value={city.stats.places} label="Places" icon="location" color="#EF4444" />
          <StatItem value={city.stats.photos} label="Photos" icon="camera" color="#10B981" />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TabItem label="Signals" active={activeTab === 'Signals'} onPress={() => setActiveTab('Signals')} />
          <TabItem label="Explore" active={activeTab === 'Explore'} onPress={() => setActiveTab('Explore')} />
          <TabItem label="Photos" active={activeTab === 'Photos'} onPress={() => setActiveTab('Photos')} />
          <TabItem label="Info" active={activeTab === 'Info'} onPress={() => setActiveTab('Info')} />
        </View>

        {/* Signals Section */}
        {activeTab === 'Signals' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 What people say about {city.name}</Text>
            
            {/* The Good (Best For) */}
            <SignalGroup 
              title="👍 THE GOOD" 
              icon="thumbs-up" 
              color={CATEGORY_COLORS.best_for}
              onPress={handleAddReview}
            >
              {signals.best_for.length > 0 ? (
                signals.best_for.map(s => (
                  <SignalPill 
                    key={s.signal_id} 
                    label={s.label || s.signal_id} 
                    score={s.current_score}
                    color={CATEGORY_COLORS.best_for}
                    icon={s.icon}
                    isGhost={s.is_ghost}
                  />
                ))
              ) : (
                <TouchableOpacity onPress={handleAddReview}>
                  <Text style={styles.emptyText}>No The Good taps yet. Be the first!</Text>
                </TouchableOpacity>
              )}
            </SignalGroup>

            {/* The Vibe */}
            <SignalGroup 
              title="✨ THE VIBE" 
              icon="sparkles" 
              color={CATEGORY_COLORS.vibe}
              onPress={handleAddReview}
            >
              {signals.vibe.length > 0 ? (
                signals.vibe.map(s => (
                  <SignalPill 
                    key={s.signal_id} 
                    label={s.label || s.signal_id} 
                    score={s.current_score}
                    color={CATEGORY_COLORS.vibe}
                    icon={s.icon}
                    isGhost={s.is_ghost}
                  />
                ))
              ) : (
                <TouchableOpacity onPress={handleAddReview}>
                  <Text style={styles.emptyText}>No The Vibe taps yet. Be the first!</Text>
                </TouchableOpacity>
              )}
            </SignalGroup>

            {/* Heads Up */}
            <SignalGroup 
              title="⚠️ HEADS UP" 
              icon="warning" 
              color={CATEGORY_COLORS.heads_up}
              onPress={handleAddReview}
            >
              {signals.heads_up.length > 0 ? (
                signals.heads_up.map(s => (
                  <SignalPill 
                    key={s.signal_id} 
                    label={s.label || s.signal_id} 
                    score={s.current_score}
                    color={CATEGORY_COLORS.heads_up}
                    icon={s.icon}
                    isGhost={s.is_ghost}
                  />
                ))
              ) : (
                <TouchableOpacity onPress={handleAddReview}>
                  <Text style={styles.emptyText}>No Heads Up taps yet. Be the first!</Text>
                </TouchableOpacity>
              )}
            </SignalGroup>

            {/* Add Your Tap CTA */}
            <View style={styles.addTapContainer}>
              <Text style={styles.addTapText}>Help our community and leave your review</Text>
              <TouchableOpacity style={styles.addTapButton} onPress={handleAddReview}>
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addTapButtonText}>Add Your Tap</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Explore Tab Placeholder */}
        {activeTab === 'Explore' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗺️ Explore {city.name}</Text>
            <Text style={styles.emptyText}>Places in this city coming soon...</Text>
          </View>
        )}

        {/* Photos Tab Placeholder */}
        {activeTab === 'Photos' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📷 Photos of {city.name}</Text>
            <Text style={styles.emptyText}>Photos coming soon...</Text>
          </View>
        )}

        {/* Info Tab Placeholder */}
        {activeTab === 'Info' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ About {city.name}</Text>
            <Text style={styles.emptyText}>City information coming soon...</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={handleAddReview}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Components
const StatItem = ({ value, label, icon, color }: any) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 4 }} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TabItem = ({ label, active, onPress }: any) => (
  <TouchableOpacity style={[styles.tabItem, active && styles.activeTab]} onPress={onPress}>
    <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
  </TouchableOpacity>
);

const SignalGroup = ({ title, icon, color, children, onPress }: any) => (
  <View style={styles.signalGroup}>
    <TouchableOpacity style={styles.groupHeader} onPress={onPress}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={styles.groupTitle}>{title}</Text>
    </TouchableOpacity>
    <View style={styles.pillContainer}>{children}</View>
  </View>
);

const SignalPill = ({ label, score, color, icon, isGhost }: any) => {
  // Format score as "x + amount"
  const formatScore = (score: number): string => {
    if (score >= 1000) {
      return `x${(score / 1000).toFixed(1)}k`;
    }
    return `x${Math.round(score)}`;
  };

  return (
    <View style={[styles.pill, { backgroundColor: `${color}20`, opacity: isGhost ? 0.6 : 1 }]}>
      {icon && <Text style={styles.pillIcon}>{icon}</Text>}
      <Text style={[styles.pillText, { color: '#1F2937' }]}>{label}</Text>
      <View style={[styles.scoreBadge, { backgroundColor: `${color}40` }]}>
        <Text style={[styles.scoreText, { color: '#1F2937' }]}>{formatScore(score)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cityName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  dot: {
    color: '#D1D5DB',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabItem: {
    paddingVertical: 16,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#EF4444',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#EF4444',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  signalGroup: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 1,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  addTapContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
  },
  addTapText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  addTapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2DD4BF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
  },
  addTapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2DD4BF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
