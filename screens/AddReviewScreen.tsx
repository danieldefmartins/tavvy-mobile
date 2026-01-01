import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import SignalCard from '../components/SignalCard';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { submitReview, ReviewSignal } from '../lib/reviews';

type RootTabParamList = {
  'Add Review': { placeId?: string; placeName?: string };
};

type AddReviewRouteProp = RouteProp<RootTabParamList, 'Add Review'>;

interface Signal {
  id: string;
  label: string;
  icon: string;
  category: 'bestFor' | 'vibe' | 'headsUp';
}

const SIGNALS: Signal[] = [
  // Best For
  { id: 'great-food', label: 'Great Food', icon: '🍽️', category: 'bestFor' },
  { id: 'fast-service', label: 'Fast Service', icon: '⏱️', category: 'bestFor' },
  { id: 'family-friendly', label: 'Family-Friendly', icon: '👨‍👩‍👧‍👦', category: 'bestFor' },
  { id: 'good-prices', label: 'Good Prices', icon: '💰', category: 'bestFor' },
  
  // Vibe
  { id: 'cozy', label: 'Cozy', icon: '🛋️', category: 'vibe' },
  { id: 'loud-music', label: 'Loud Music', icon: '🔊', category: 'vibe' },
  { id: 'lively', label: 'Lively', icon: '👥', category: 'vibe' },
  { id: 'romantic', label: 'Romantic', icon: '💕', category: 'vibe' },
  
  // Heads Up
  { id: 'limited-parking', label: 'Limited Parking', icon: '🚗', category: 'headsUp' },
  { id: 'slow-service', label: 'Slow Service', icon: '⏰', category: 'headsUp' },
  { id: 'expensive', label: 'Expensive', icon: '💸', category: 'headsUp' },
  { id: 'noisy', label: 'Noisy', icon: '📢', category: 'headsUp' },
];

const CATEGORY_COLORS = {
  bestFor: '#3B82F6',
  vibe: '#6B7280',
  headsUp: '#F59E0B',
};

export default function AddReviewScreen() {
  const route = useRoute<AddReviewRouteProp>();
  const navigation = useNavigation();
  const placeId = route.params?.placeId;
  const placeName = route.params?.placeName || 'this place';

  const [tapCounts, setTapCounts] = useState<{ [key: string]: number }>({});

  const handleTap = (signalId: string) => {
    const currentCount = tapCounts[signalId] || 0;
    const newCount = currentCount < 3 ? currentCount + 1 : 0;
    
    if (newCount === 0) {
      const { [signalId]: _, ...rest } = tapCounts;
      setTapCounts(rest);
    } else {
      setTapCounts({ ...tapCounts, [signalId]: newCount });
    }
  };

  const handleContinue = async () => {
    // Get selected signals with their tap counts
    const selectedSignals: ReviewSignal[] = Object.entries(tapCounts).map(([signalId, count]) => {
      const signal = SIGNALS.find(s => s.id === signalId);
      return {
        signalId: signalId,
        label: signal?.label || '',
        tapCount: count,
        category: signal?.category || 'bestFor',
      };
    });

    // Show loading state
    Alert.alert(
      'Submitting Review...',
      'Please wait',
      [],
      { cancelable: false }
    );

    // Submit to Supabase
    const result = await submitReview(placeId || 'unknown', selectedSignals);

    if (result.success) {
      Alert.alert(
        'Review Submitted! 🎉',
        `You reviewed ${placeName} with ${selectedCount} signals!\n\nYour review has been saved to the database.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear the form
              setTapCounts({});
              // Navigate back
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Error',
        'Failed to save review. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const selectedCount = Object.keys(tapCounts).length;

  const renderCategory = (category: 'bestFor' | 'vibe' | 'headsUp', label: string) => {
    const categorySignals = SIGNALS.filter(s => s.category === category);
    
    return (
      <View key={category} style={styles.categorySection}>
        <View style={[styles.categoryLabel, { backgroundColor: CATEGORY_COLORS[category] }]}>
          <Text style={styles.categoryLabelText}>{label}</Text>
        </View>
        
        <View style={styles.grid}>
          {categorySignals.map(signal => (
            <SignalCard
              key={signal.id}
              label={signal.label}
              icon={signal.icon}
              tapCount={tapCounts[signal.id] || 0}
              onTap={() => handleTap(signal.id)}
              color={CATEGORY_COLORS[category]}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.placeTitle}>Review: {placeName}</Text>
        
        <View style={styles.header}>
          <Text style={styles.title}>What Stood Out?</Text>
          {selectedCount > 0 && (
            <Text style={styles.selectedCount}>{selectedCount} selected</Text>
          )}
        </View>
        
        <Text style={styles.subtitle}>
          Tap to select • Tap again to make it stronger
        </Text>

        {renderCategory('bestFor', 'Best For')}
        {renderCategory('vibe', 'Vibe')}
        {renderCategory('headsUp', 'Heads Up')}

        {selectedCount > 0 && (
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  placeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  selectedCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  categoryLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  continueButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
