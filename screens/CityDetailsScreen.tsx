import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabaseClient';
import { fetchPlaceSignals, SignalAggregate } from '../lib/reviews';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Category colors matching the universal review system (same as PlaceDetailsScreen)
const CATEGORY_COLORS = {
  best_for: '#0A84FF',  // Blue - The Good
  vibe: '#8B5CF6',      // Purple - The Vibe
  heads_up: '#FF9500',  // Orange - Heads Up
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
  const { t } = useTranslation();
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
  const [activeTab, setActiveTab] = useState('Reviews');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    loadCityData();
  }, [params?.cityId]);

  const loadCityData = async () => {
    if (!params?.cityId) {
      setLoading(false);
      return;
    }

    try {
      // For sample cities, use fallback data
      // TODO: Fetch from database when cities table is created
      setCity({
        id: params.cityId,
        name: params.cityName || 'City',
        location: '',
        country: '',
        image: getCityImage(params.cityName || ''),
        primaryCategory: 'city',
        stats: {
          signals: '0',
          universes: '0',
          places: '0',
          photos: '0',
        },
      });

      // Fetch signals using the universal review system
      try {
        const signalData = await fetchPlaceSignals(params.cityId);
        setSignals({
          best_for: signalData.best_for || [],
          vibe: signalData.vibe || [],
          heads_up: signalData.heads_up || [],
        });
      } catch (signalError) {
        console.log('No signals found for city, using empty state');
        setSignals({ best_for: [], vibe: [], heads_up: [] });
      }

    } catch (error) {
      console.error('Error loading city data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get city image based on name
  const getCityImage = (name: string): string => {
    const cityImages: Record<string, string> = {
      'Orlando': 'https://images.unsplash.com/photo-1575089976121-8ed7b2a54265?w=800',
      'Miami': 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800',
      'New York City': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
      'Los Angeles': 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=800',
      'Chicago': 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800',
      'Austin': 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800',
      'Denver': 'https://images.unsplash.com/photo-1619856699906-09e1f58c98b1?w=800',
      'Seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=800',
      'Nashville': 'https://images.unsplash.com/photo-1587475656908-5fa696d9e1b6?w=800',
      'San Francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800',
    };
    return cityImages[name] || 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800';
  };

  // Toggle section expansion (matching PlaceDetailsScreen)
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
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

  // Render signal bar (matching PlaceDetailsScreen exactly)
  const renderSignalBar = (
    type: 'best_for' | 'vibe' | 'heads_up',
    categoryTitle: string,
    signalsList: SignalAggregate[],
    bgColor: string,
    iconName: string
  ) => {
    const isExpanded = expandedSection === type;
    const hasMore = signalsList && signalsList.length > 1;
    const hasSignals = signalsList && signalsList.length > 0;

    // Render a single solid colored signal bar
    const renderSolidSignalBar = (signal: SignalAggregate, index: number) => {
      return (
        <TouchableOpacity 
          key={signal.signal_id || index}
          activeOpacity={0.9}
          onPress={() => hasMore && toggleSection(type)}
          style={{
            backgroundColor: bgColor,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 18, marginRight: 10 }}>{signal.icon || '📍'}</Text>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 16, 
              fontWeight: '700',
              flex: 1,
            }}>
              {signal.label}
            </Text>
            <Text style={{ 
              color: '#FFFFFF', 
              fontSize: 16, 
              fontWeight: '600',
              marginLeft: 8,
            }}>
              ×{signal.tap_total || signal.current_score || 0}
            </Text>
          </View>
          
          {index === 0 && hasMore && (
            <Ionicons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color="#FFFFFF" 
              style={{ marginLeft: 8 }}
            />
          )}
        </TouchableOpacity>
      );
    };

    // Empty state bar (matching PlaceDetailsScreen)
    const renderEmptyBar = () => (
      <TouchableOpacity 
        onPress={handleAddReview}
        activeOpacity={0.8}
        style={{
          backgroundColor: bgColor,
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Ionicons name={iconName as any} size={18} color="#FFFFFF" style={{ marginRight: 10 }} />
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600', fontStyle: 'italic', opacity: 0.9 }}>
          {categoryTitle} · Be the first to tap!
        </Text>
      </TouchableOpacity>
    );

    return (
      <View style={{ marginBottom: 8 }}>
        {hasSignals ? (
          <>
            {/* Top Signal (Always Visible) */}
            {renderSolidSignalBar(signalsList[0], 0)}
            
            {/* Expanded Signals List */}
            {isExpanded && signalsList.length > 1 && (
              <View>
                {signalsList.slice(1).map((signal, idx) => 
                  renderSolidSignalBar(signal, idx + 1)
                )}
              </View>
            )}
          </>
        ) : (
          renderEmptyBar()
        )}
      </View>
    );
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
          </View>
        </View>

        {/* Quick Info Bar (matching PlaceDetailsScreen) */}
        <View style={styles.quickInfoBar}>
          <TouchableOpacity style={styles.quickInfoItem}>
            <Text style={styles.quickInfoIcon}>🕐</Text>
            <Text style={styles.quickInfoLabel}>Open</Text>
          </TouchableOpacity>
          
          <View style={styles.quickInfoDivider} />
          
          <TouchableOpacity style={styles.quickInfoItem}>
            <Text style={styles.quickInfoIcon}>📞</Text>
            <Text style={styles.quickInfoValue}>Call</Text>
            <Text style={styles.quickInfoSub}>Business</Text>
          </TouchableOpacity>
          
          <View style={styles.quickInfoDivider} />
          
          <TouchableOpacity style={styles.quickInfoItem}>
            <Text style={styles.quickInfoIcon}>📷</Text>
            <Text style={styles.quickInfoValue}>0</Text>
            <Text style={styles.quickInfoSub}>Photos</Text>
          </TouchableOpacity>
          
          <View style={styles.quickInfoDivider} />
          
          <TouchableOpacity style={styles.quickInfoItem}>
            <Text style={styles.quickInfoIcon}>🚗</Text>
            <Text style={styles.quickInfoValue}>{'< 1 min'}</Text>
            <Text style={styles.quickInfoSub}>Drive</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs (matching PlaceDetailsScreen) */}
        <View style={styles.tabsContainer}>
          {['Reviews', 'Info', 'Photos'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.activeTab]} 
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Reviews Tab (matching PlaceDetailsScreen layout) */}
        {activeTab === 'Reviews' && (
          <View style={styles.section}>
            {/* Community Signals Card (matching PlaceDetailsScreen) */}
            <View style={styles.signalsCard}>
              <Text style={styles.signalsCardTitle}>Community Signals</Text>
              
              {/* The Good - Blue */}
              {renderSignalBar('best_for', 'The Good', signals.best_for, CATEGORY_COLORS.best_for, 'thumbs-up')}
              
              {/* The Vibe - Purple */}
              {renderSignalBar('vibe', 'The Vibe', signals.vibe, CATEGORY_COLORS.vibe, 'sparkles')}
              
              {/* Heads Up - Orange */}
              {renderSignalBar('heads_up', 'Heads Up', signals.heads_up, CATEGORY_COLORS.heads_up, 'alert-circle')}
            </View>

            {/* Been Here CTA (matching PlaceDetailsScreen) */}
            <View style={styles.beenHereCard}>
              <Text style={styles.beenHereTitle}>Been here?</Text>
              <Text style={styles.beenHereSubtitle}>Share your experience to help others.</Text>
            </View>
          </View>
        )}

        {/* Info Tab */}
        {activeTab === 'Info' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About {city.name}</Text>
            <Text style={styles.emptyText}>City information coming soon...</Text>
          </View>
        )}

        {/* Photos Tab */}
        {activeTab === 'Photos' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos of {city.name}</Text>
            <Text style={styles.emptyText}>Photos coming soon...</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (matching PlaceDetailsScreen) */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
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
  },
  // Quick Info Bar (matching PlaceDetailsScreen)
  quickInfoBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickInfoItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickInfoIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickInfoSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  quickInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  // Tabs (matching PlaceDetailsScreen)
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabItem: {
    paddingVertical: 16,
    marginRight: 32,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#EF4444',
  },
  tabText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#EF4444',
  },
  // Section
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  // Signals Card (matching PlaceDetailsScreen)
  signalsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  signalsCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  // Been Here Card (matching PlaceDetailsScreen)
  beenHereCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  beenHereTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  beenHereSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontStyle: 'italic',
  },
  // FAB (matching PlaceDetailsScreen)
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
