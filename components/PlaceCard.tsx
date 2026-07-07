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
import SignalMatrix from './SignalMatrix';

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

export default function PlaceCard({ place, onPress }: PlaceCardProps) {
  const theme = useTheme();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const fullAddress = place.city && place.state_region
    ? `${place.address_line1}, ${place.city}`
    : place.address_line1;
  
  const displayPhotos = place.photos && place.photos.length > 0 
    ? place.photos.slice(0, 3) 
    : [null];
  
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
      
      {/* Signal Matrix — shared compact 2x2 grid (matches web PlaceCard) */}
      <View style={styles.signalsContainer}>
        <SignalMatrix simpleSignals={place.signals || []} compact={true} />
      </View>
      
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
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
