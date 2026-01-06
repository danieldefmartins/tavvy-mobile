import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius, shadows, typography } from '../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // 16px padding on each side

interface Signal {
  bucket: string;
  tap_total: number;
}

interface PlaceCardProps {
  place: {
    id: string;
    name: string;
    address_line1: string;
    city?: string;
    state_region?: string;
    category: string;
    current_status?: string;
    signals?: Signal[];
    photos?: string[];
  };
  onPress: () => void;
}

// Determine signal type based on bucket name
const getSignalType = (bucket: string): 'positive' | 'neutral' | 'negative' => {
  const bucketLower = bucket.toLowerCase();
  
  // Positive signals
  if (bucketLower.includes('great') || bucketLower.includes('excellent') || 
      bucketLower.includes('amazing') || bucketLower.includes('affordable') ||
      bucketLower.includes('good') || bucketLower.includes('friendly') ||
      bucketLower.includes('fast') || bucketLower.includes('clean') ||
      bucketLower.includes('fresh') || bucketLower.includes('delicious')) {
    return 'positive';
  }
  
  // Negative signals (Watch Out)
  if (bucketLower.includes('pricey') || bucketLower.includes('expensive') || 
      bucketLower.includes('crowded') || bucketLower.includes('loud') ||
      bucketLower.includes('slow') || bucketLower.includes('dirty') ||
      bucketLower.includes('rude') || bucketLower.includes('limited') ||
      bucketLower.includes('wait') || bucketLower.includes('noisy')) {
    return 'negative';
  }
  
  // Everything else is neutral (Vibe)
  return 'neutral';
};

// Sort signals: 2 positive first, then 1 neutral, then 1 negative
const sortSignalsForDisplay = (signals: Signal[]): Signal[] => {
  const positive = signals.filter(s => getSignalType(s.bucket) === 'positive');
  const neutral = signals.filter(s => getSignalType(s.bucket) === 'neutral');
  const negative = signals.filter(s => getSignalType(s.bucket) === 'negative');
  
  const result: Signal[] = [];
  
  // First row: 2 positive (blue)
  result.push(...positive.slice(0, 2));
  
  // Second row: 1 neutral (gray) + 1 negative (orange)
  if (neutral.length > 0) {
    result.push(neutral[0]);
  }
  if (negative.length > 0) {
    result.push(negative[0]);
  }
  
  return result;
};

export default function PlaceCard({ place, onPress }: PlaceCardProps) {
  const theme = useTheme();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const fullAddress = place.city && place.state_region
    ? `${place.address_line1}, ${place.city}`
    : place.address_line1;
  
  const displayPhotos = place.photos && place.photos.length > 0 
    ? place.photos.slice(0, 3) 
    : [null];
  
  const sortedSignals = place.signals ? sortSignalsForDisplay(place.signals) : [];
  
  const getSignalBackgroundColor = (type: 'positive' | 'neutral' | 'negative') => {
    switch (type) {
      case 'positive':
        return theme.signalPositive;
      case 'neutral':
        return theme.signalNeutral;
      case 'negative':
        return theme.signalNegative;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBackground }, shadows.large]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Photo Carousel with Name Overlay */}
      <View style={styles.photoContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
            setCurrentPhotoIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {displayPhotos.map((photo, index) => (
            <View key={index} style={styles.photoWrapper}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={[styles.placeholderPhoto, { backgroundColor: theme.surface }]}>
                  <Ionicons name="image-outline" size={48} color={theme.textTertiary} />
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        
        {/* Dark Gradient Overlay for Text */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradientOverlay}
        >
          <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
          <Text style={styles.placeAddress} numberOfLines={1}>{fullAddress}</Text>
        </LinearGradient>
        
        {/* Pagination Dots */}
        {displayPhotos.length > 1 && (
          <View style={styles.dotsContainer}>
            {displayPhotos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentPhotoIndex === index ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
      
      {/* Signal Bars - 2x2 Grid */}
      {sortedSignals.length > 0 && (
        <View style={styles.signalsContainer}>
          {sortedSignals.map((signal, index) => {
            const signalType = getSignalType(signal.bucket);
            return (
              <View
                key={index}
                style={[
                  styles.signalBadge,
                  { backgroundColor: getSignalBackgroundColor(signalType) },
                ]}
              >
                <Text style={styles.signalText} numberOfLines={1}>
                  {signal.bucket} ×{signal.tap_total}
                </Text>
              </View>
            );
          })}
        </View>
      )}
      
      {/* Footer: Category • Price • Status */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          {place.category}
        </Text>
        <Text style={[styles.footerDot, { color: theme.textSecondary }]}> • </Text>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>$$</Text>
        {place.current_status && (
          <>
            <Text style={[styles.footerDot, { color: theme.textSecondary }]}> • </Text>
            <Text style={[styles.footerText, styles.statusOpen]}>
              {place.current_status === 'open_accessible' ? 'Open' : 
               place.current_status === 'unknown' ? 'No Vibe Yet' : 
               place.current_status}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  photoContainer: {
    height: 140,
    position: 'relative',
  },
  photoWrapper: {
    width: CARD_WIDTH,
    height: 140,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  placeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  placeAddress: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    textAlign: 'left',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  signalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    justifyContent: 'space-between',
  },
  signalBadge: {
    width: '48%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  footerText: {
    fontSize: 14,
  },
  footerDot: {
    fontSize: 14,
  },
  statusOpen: {
    color: '#34C759',
    fontWeight: '600',
  },
});
