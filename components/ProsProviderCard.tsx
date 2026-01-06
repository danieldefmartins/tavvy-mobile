/**
 * Pros Provider Card Component
 * Install path: components/ProsProviderCard.tsx
 * 
 * Works with both API data (Pro type) and sample data (SamplePro type)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors, SamplePro } from '../constants/ProsConfig';

// Unified provider type that works with both API and sample data
interface ProviderData {
  id: number;
  slug: string;
  businessName: string;
  city: string;
  state: string;
  rating?: number;
  averageRating?: string;
  reviewCount?: number;
  totalReviews?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  isInsured?: boolean;
  isLicensed?: boolean;
  profileImage?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  shortDescription?: string;
  description?: string;
  categoryName?: string;
  yearsInBusiness?: number;
}

interface ProsProviderCardProps {
  provider: ProviderData | SamplePro;
  onPress: () => void;
  onMessagePress?: () => void;
  style?: ViewStyle;
}

export function ProsProviderCard({ provider, onPress, onMessagePress, style }: ProsProviderCardProps) {
  // Guard against undefined provider
  if (!provider) {
    return null;
  }
  
  // Normalize data from different sources
  const pro = provider as any;
  const rating = pro.rating ?? (pro.averageRating ? parseFloat(pro.averageRating) : 0);
  const reviewCount = pro.reviewCount ?? pro.totalReviews ?? 0;
  const imageUrl = pro.profileImage ?? pro.logoUrl;
  const description = pro.description ?? pro.shortDescription;
  
  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business" size={24} color={ProsColors.textMuted} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {provider.businessName}
            </Text>
            {provider.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={ProsColors.primary}
                style={styles.verifiedIcon}
              />
            )}
          </View>
          {(provider as any).categoryName && (
            <Text style={styles.category}>{(provider as any).categoryName}</Text>
          )}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={ProsColors.textSecondary} />
            <Text style={styles.location}>
              {provider.city}, {provider.state}
            </Text>
          </View>
        </View>
      </View>

      {description && (
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.rating}>
            {rating > 0 ? rating.toFixed(1) : 'New'}
          </Text>
          {reviewCount > 0 && (
            <Text style={styles.reviewCount}>
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </Text>
          )}
        </View>

        <View style={styles.badges}>
          {(provider as any).yearsInBusiness && (
            <View style={styles.badge}>
              <Ionicons name="time-outline" size={12} color={ProsColors.primary} />
              <Text style={styles.badgeText}>{(provider as any).yearsInBusiness}+ yrs</Text>
            </View>
          )}
          {provider.isInsured && (
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={12} color={ProsColors.primary} />
              <Text style={styles.badgeText}>Insured</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={onPress}
        >
          <Text style={styles.viewButtonText}>View Profile</Text>
        </TouchableOpacity>
        {onMessagePress && (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={onMessagePress}
          >
            <Ionicons name="chatbubble-outline" size={18} color={ProsColors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ProsColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: ProsColors.sectionBg,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  category: {
    fontSize: 13,
    color: ProsColors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ProsColors.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    color: ProsColors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: ProsColors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ProsColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProsProviderCard;