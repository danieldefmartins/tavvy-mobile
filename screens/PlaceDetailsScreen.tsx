import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type RootTabParamList = {
  Home: undefined;
  Explore: undefined;
  'Add Review': { placeId?: string; placeName?: string };
  Saved: undefined;
  Profile: undefined;
};

type HomeStackParamList = {
  HomeMain: undefined;
  PlaceDetails: { placeId: string };
};

type PlaceDetailsRouteProp = RouteProp<HomeStackParamList, 'PlaceDetails'>;
type NavigationProp = BottomTabNavigationProp<RootTabParamList>;

interface Signal {
  label: string;
  count: number;
  emoji: string;
}

interface Place {
  id: string;
  name: string;
  category: string;
  distance: string;
  address: string;
  signals: {
    bestFor: Signal[];
    vibe: Signal[];
    headsUp: Signal[];
  };
}

const SIGNAL_COLORS = {
  '🔥': '#3B82F6',
  '✨': '#6B7280',
  '⚠️': '#F59E0B',
};

export default function PlaceDetailsScreen() {
  const route = useRoute<PlaceDetailsRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { placeId } = route.params;

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlace();
  }, [placeId]);

  const loadPlace = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('id', placeId)
        .single();

      if (error) {
        console.error('Error loading place:', error);
        return;
      }

      if (data) {
        // Transform Supabase data to our Place format
        const transformedPlace: Place = {
          id: data.id,
          name: data.name || 'Unknown Place',
          category: 'Restaurant', // We'll fix this later with category lookup
          distance: '0.5 mi',
          address: data.address_line1 || 'Address not available',
          signals: {
            bestFor: [
              { label: 'Great Food', count: 89, emoji: '🔥' },
              { label: 'Fast Service', count: 67, emoji: '🔥' },
            ],
            vibe: [
              { label: 'Cozy', count: 45, emoji: '✨' },
            ],
            headsUp: [
              { label: 'Limited Parking', count: 23, emoji: '⚠️' },
            ],
          },
        };

        setPlace(transformedPlace);
        console.log('✅ Loaded place:', transformedPlace);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = () => {
    navigation.navigate('Add Review', {
      placeId: place?.id,
      placeName: place?.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Loading...</Text>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Place not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.placeName}>{place.name}</Text>
          <Text style={styles.placeInfo}>
            {place.category} • {place.distance}
          </Text>
          <Text style={styles.placeAddress}>{place.address}</Text>
        </View>

        <View style={styles.signalsSection}>
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Best For</Text>
            <View style={styles.signalsGrid}>
              {place.signals.bestFor.map((signal, index) => (
                <View
                  key={index}
                  style={[styles.signalPill, { backgroundColor: SIGNAL_COLORS['🔥'] }]}
                >
                  <Text style={styles.signalText}>
                    {signal.label} ×{signal.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Vibe</Text>
            <View style={styles.signalsGrid}>
              {place.signals.vibe.map((signal, index) => (
                <View
                  key={index}
                  style={[styles.signalPill, { backgroundColor: SIGNAL_COLORS['✨'] }]}
                >
                  <Text style={styles.signalText}>
                    {signal.label} ×{signal.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Heads Up</Text>
            <View style={styles.signalsGrid}>
              {place.signals.headsUp.map((signal, index) => (
                <View
                  key={index}
                  style={[styles.signalPill, { backgroundColor: SIGNAL_COLORS['⚠️'] }]}
                >
                  <Text style={styles.signalText}>
                    {signal.label} ×{signal.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.addReviewButton}
        onPress={handleAddReview}
      >
        <Text style={styles.addReviewButtonText}>Add Your Review</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  placeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  placeInfo: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  placeAddress: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  signalsSection: {
    padding: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  signalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signalPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  signalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addReviewButton: {
    backgroundColor: '#3B82F6',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  addReviewButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
});
