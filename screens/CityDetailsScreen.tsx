import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  useColorScheme,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { fetchPlaceSignals } from '../lib/reviews';

const { width } = Dimensions.get('window');

interface City {
  id: string;
  name: string;
  slug: string;
  state: string | null;
  country: string;
  region: string | null;
  population: number | null;
  timezone: string | null;
  airport_code: string | null;
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  thumbnail_image_url: string | null;
  description: string | null;
  history: string | null;
  culture: string | null;
  famous_people: string | null;
  local_economy: string | null;
  major_companies: string | null;
  political_leaning: string | null;
  then_now_next: string | null;
  weather_summary: string | null;
  best_time_to_visit: string | null;
  cost_of_living_index: number | null;
  walkability_score: number | null;
  sales_tax_rate: number | null;
  avg_gas_price: number | null;
  is_featured: boolean;
  is_active: boolean;
}

interface SignalItem {
  label: string;
  taps: number;
  icon: string;
}

interface SignalData {
  theGood: SignalItem[];
  theVibe: SignalItem[];
  headsUp: SignalItem[];
}

interface InfoPopupData {
  title: string;
  value: string;
  description: string;
  icon: string;
}

const DEFAULT_SIGNALS: SignalData = {
  theGood: [],
  theVibe: [],
  headsUp: [],
};

export default function CityDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { cityId, cityName } = route.params || {};

  const [city, setCity] = useState<City | null>(null);
  const [signals, setSignals] = useState<SignalData>(DEFAULT_SIGNALS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'info' | 'photos'>('reviews');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [infoPopup, setInfoPopup] = useState<InfoPopupData | null>(null);

  const loadCity = useCallback(async () => {
    if (!cityId) return;

    try {
      const { data, error } = await supabase
        .from('tavvy_cities')
        .select('*')
        .eq('id', cityId)
        .single();

      if (error) {
        console.error('Error fetching city:', error);
        return;
      }

      setCity(data);

      // Load signals for this city
      try {
        const signalData = await fetchPlaceSignals(cityId);
        if (signalData) {
          setSignals({
            theGood: signalData.theGood || [],
            theVibe: signalData.theVibe || [],
            headsUp: signalData.headsUp || [],
          });
        }
      } catch (signalError) {
        console.error('Error loading signals:', signalError);
      }
    } catch (error) {
      console.error('Error loading city:', error);
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  useEffect(() => {
    loadCity();
  }, [loadCity]);

  const formatPopulation = (pop: number | null) => {
    if (!pop) return 'N/A';
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
    return pop.toString();
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const showInfoPopup = (type: 'population' | 'airport' | 'walkScore' | 'costIndex') => {
    if (!city) return;

    const popupData: Record<string, InfoPopupData> = {
      population: {
        title: 'Population',
        value: formatPopulation(city.population),
        description: `This city has an estimated population of ${city.population?.toLocaleString() || 'unknown'} residents. Population size affects everything from job opportunities and housing costs to traffic and cultural diversity.`,
        icon: 'people',
      },
      airport: {
        title: 'Airport Code',
        value: city.airport_code || 'N/A',
        description: city.airport_code 
          ? `${city.airport_code} is the primary airport code for this city. Use this code when booking flights or searching for travel deals.`
          : 'No major airport code available for this city. You may need to fly into a nearby city.',
        icon: 'airplane',
      },
      walkScore: {
        title: 'Walk Score',
        value: city.walkability_score?.toString() || 'N/A',
        description: city.walkability_score
          ? `A walk score of ${city.walkability_score} out of 100. ${
              city.walkability_score >= 90 ? "Walker's Paradise - daily errands don't require a car." :
              city.walkability_score >= 70 ? "Very Walkable - most errands can be done on foot." :
              city.walkability_score >= 50 ? "Somewhat Walkable - some errands can be done on foot." :
              "Car-Dependent - most errands require a car."
            }`
          : 'Walk score data not available for this city.',
        icon: 'walk',
      },
      costIndex: {
        title: 'Cost of Living Index',
        value: city.cost_of_living_index?.toString() || '100',
        description: `A cost index of ${city.cost_of_living_index || 100} compared to the national average of 100. ${
          (city.cost_of_living_index || 100) > 120 ? "This city is significantly more expensive than average." :
          (city.cost_of_living_index || 100) > 100 ? "This city is somewhat more expensive than average." :
          (city.cost_of_living_index || 100) === 100 ? "This city has average living costs." :
          "This city is more affordable than average."
        }`,
        icon: 'cash',
      },
    };

    setInfoPopup(popupData[type]);
  };

  const renderSignalBar = (
    type: 'good' | 'vibe' | 'headsUp',
    label: string,
    icon: string,
    signalItems: SignalItem[] | undefined | null,
    color: string
  ) => {
    const safeSignals = signalItems || [];
    const hasSignals = safeSignals.length > 0;
    const isExpanded = expandedSection === type;
    const displayText = hasSignals
      ? safeSignals.slice(0, 3).map(s => s.label).join(', ')
      : 'Be the first to tap!';

    return (
      <TouchableOpacity
        style={[styles.signalBar, { backgroundColor: color }]}
        onPress={() => hasSignals && toggleSection(type)}
        activeOpacity={hasSignals ? 0.8 : 1}
      >
        <View style={styles.signalBarContent}>
          <Ionicons name={icon as any} size={18} color="#FFF" />
          <Text style={styles.signalBarLabel}>{label}</Text>
          <Text style={styles.signalBarDot}>·</Text>
          <Text style={styles.signalBarText} numberOfLines={1}>
            {displayText}
          </Text>
        </View>
        {hasSignals && (
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#FFF"
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderInfoSection = (title: string, content: string | null, icon: string) => {
    if (!content) return null;
    return (
      <View style={[styles.infoSection, isDark && styles.infoSectionDark]}>
        <View style={styles.infoHeader}>
          <Ionicons name={icon as any} size={20} color="#3B82F6" />
          <Text style={[styles.infoTitle, isDark && styles.textDark]}>{title}</Text>
        </View>
        <Text style={[styles.infoContent, isDark && styles.textMutedDark]}>{content}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!city) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isDark && styles.textDark]}>City not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.errorLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: city.cover_image_url || 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />

          {/* Back Button */}
          <SafeAreaView style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="heart-outline" size={24} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton}>
                <Ionicons name="share-outline" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* City Badge */}
          <View style={styles.heroBadge}>
            <Ionicons name="business" size={12} color="#FFF" />
            <Text style={styles.heroBadgeText}>CITY</Text>
          </View>

          {/* City Name */}
          <Text style={styles.heroTitle}>{city.name}</Text>
        </View>

        {/* Quick Info Bar - Now Tappable */}
        <View style={[styles.quickInfoBar, isDark && styles.quickInfoBarDark]}>
          <TouchableOpacity style={styles.quickInfoItem} onPress={() => showInfoPopup('population')}>
            <Ionicons name="people" size={20} color="#3B82F6" />
            <Text style={[styles.quickInfoValue, isDark && styles.textDark]}>
              {formatPopulation(city.population)}
            </Text>
            <Text style={[styles.quickInfoLabel, isDark && styles.textMutedDark]}>Population</Text>
          </TouchableOpacity>
          <View style={styles.quickInfoDivider} />
          <TouchableOpacity style={styles.quickInfoItem} onPress={() => showInfoPopup('airport')}>
            <Ionicons name="airplane" size={20} color="#3B82F6" />
            <Text style={[styles.quickInfoValue, isDark && styles.textDark]}>
              {city.airport_code || 'N/A'}
            </Text>
            <Text style={[styles.quickInfoLabel, isDark && styles.textMutedDark]}>Airport</Text>
          </TouchableOpacity>
          <View style={styles.quickInfoDivider} />
          <TouchableOpacity style={styles.quickInfoItem} onPress={() => showInfoPopup('walkScore')}>
            <Ionicons name="walk" size={20} color="#3B82F6" />
            <Text style={[styles.quickInfoValue, isDark && styles.textDark]}>
              {city.walkability_score || 'N/A'}
            </Text>
            <Text style={[styles.quickInfoLabel, isDark && styles.textMutedDark]}>Walk Score</Text>
          </TouchableOpacity>
          <View style={styles.quickInfoDivider} />
          <TouchableOpacity style={styles.quickInfoItem} onPress={() => showInfoPopup('costIndex')}>
            <Ionicons name="cash" size={20} color="#3B82F6" />
            <Text style={[styles.quickInfoValue, isDark && styles.textDark]}>
              {city.cost_of_living_index || 100}
            </Text>
            <Text style={[styles.quickInfoLabel, isDark && styles.textMutedDark]}>Cost Index</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
          {(['reviews', 'info', 'photos'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                isDark && styles.textMutedDark,
                activeTab === tab && styles.tabTextActive,
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'reviews' && (
            <>
              {/* Community Signals Card */}
              <View style={[styles.signalsCard, isDark && styles.signalsCardDark]}>
                <Text style={[styles.signalsTitle, isDark && styles.textDark]}>
                  Community Signals
                </Text>

                {renderSignalBar('good', 'The Good', 'thumbs-up', signals?.theGood, '#3B82F6')}
                {renderSignalBar('vibe', 'The Vibe', 'sparkles', signals?.theVibe, '#8B5CF6')}
                {renderSignalBar('headsUp', 'Heads Up', 'alert-circle', signals?.headsUp, '#F97316')}
              </View>

              {/* Been Here CTA */}
              <View style={[styles.ctaCard, isDark && styles.ctaCardDark]}>
                <Text style={[styles.ctaTitle, isDark && styles.textDark]}>Been here?</Text>
                <Text style={[styles.ctaSubtitle, isDark && styles.textMutedDark]}>
                  Share your experience to help others.
                </Text>
              </View>
            </>
          )}

          {activeTab === 'info' && (
            <View style={styles.infoContainer}>
              {/* Description */}
              {city.description && (
                <View style={[styles.infoSection, isDark && styles.infoSectionDark]}>
                  <Text style={[styles.infoContent, isDark && styles.textMutedDark]}>
                    {city.description}
                  </Text>
                </View>
              )}

              {/* Key Stats */}
              <View style={[styles.statsGrid, isDark && styles.infoSectionDark]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, isDark && styles.textMutedDark]}>Weather</Text>
                  <Text style={[styles.statValue, isDark && styles.textDark]}>
                    {city.weather_summary || 'N/A'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, isDark && styles.textMutedDark]}>Best Time</Text>
                  <Text style={[styles.statValue, isDark && styles.textDark]}>
                    {city.best_time_to_visit || 'N/A'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, isDark && styles.textMutedDark]}>Sales Tax</Text>
                  <Text style={[styles.statValue, isDark && styles.textDark]}>
                    {city.sales_tax_rate ? `${city.sales_tax_rate}%` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, isDark && styles.textMutedDark]}>Gas Price</Text>
                  <Text style={[styles.statValue, isDark && styles.textDark]}>
                    {city.avg_gas_price ? `$${city.avg_gas_price.toFixed(2)}` : 'N/A'}
                  </Text>
                </View>
              </View>

              {renderInfoSection('History', city.history, 'time')}
              {renderInfoSection('Culture', city.culture, 'color-palette')}
              {renderInfoSection('Famous People', city.famous_people, 'star')}
              {renderInfoSection('Economy', city.local_economy, 'trending-up')}
              {renderInfoSection('Major Companies', city.major_companies, 'business')}
              {renderInfoSection('Political Leaning', city.political_leaning, 'flag')}
            </View>
          )}

          {activeTab === 'photos' && (
            <View style={styles.photosContainer}>
              <Text style={[styles.emptyText, isDark && styles.textMutedDark]}>
                No photos yet. Be the first to add one!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddReview', { placeId: cityId, placeName: city.name })}
      >
        <Ionicons name="add" size={28} color="#FFF" />
        <Text style={styles.fabText}>Tap</Text>
      </TouchableOpacity>

      {/* Info Popup Modal */}
      <Modal
        visible={infoPopup !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoPopup(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setInfoPopup(null)}
        >
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name={infoPopup?.icon as any} size={24} color="#3B82F6" />
              </View>
              <Text style={[styles.modalTitle, isDark && styles.textDark]}>
                {infoPopup?.title}
              </Text>
              <TouchableOpacity onPress={() => setInfoPopup(null)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalValue, isDark && styles.textDark]}>
              {infoPopup?.value}
            </Text>
            <Text style={[styles.modalDescription, isDark && styles.textMutedDark]}>
              {infoPopup?.description}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 12,
  },
  errorLink: {
    fontSize: 16,
    color: '#3B82F6',
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
  },
  heroBadge: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  quickInfoBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  quickInfoBarDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  quickInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickInfoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  quickInfoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  quickInfoDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabContainerDark: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#374151',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#EF4444',
  },
  tabContent: {
    padding: 16,
  },
  signalsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  signalsCardDark: {
    backgroundColor: '#1F2937',
  },
  signalsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  signalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  signalBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  signalBarLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },
  signalBarDot: {
    color: '#FFF',
    fontSize: 14,
    marginHorizontal: 8,
  },
  signalBarText: {
    color: '#FFF',
    fontSize: 14,
    flex: 1,
  },
  ctaCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  ctaCardDark: {
    backgroundColor: '#1F2937',
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoContainer: {
    gap: 16,
  },
  infoSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoSectionDark: {
    backgroundColor: '#1F2937',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    width: '50%',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  photosContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14B8A6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  fabText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textDark: {
    color: '#F9FAFB',
  },
  textMutedDark: {
    color: '#9CA3AF',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContentDark: {
    backgroundColor: '#1F2937',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
});
