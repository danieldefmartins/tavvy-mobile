/**
 * Pros Provider Card Component
 * Install path: components/ProsProviderCard.tsx
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
import { Pro } from '../lib/ProsTypes';

interface ProsProviderCardProps {
  pro: Pro;
  onPress: (slug: string) => void;
  onMessagePress?: (proId: number) => void;
}

export const ProsProviderCard: React.FC<ProsProviderCardProps> = ({
  pro,
  onPress,
  onMessagePress,
}) => {
  const rating = parseFloat(pro.averageRating) || 0;
  
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(pro.slug)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {pro.logoUrl ? (
          <Image source={{ uri: pro.logoUrl }} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Ionicons name="business" size={24} color={ProsColors.textMuted} />
          </View>
        )}
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {pro.businessName}
            </Text>
            {pro.isVerified && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={ProsColors.primary}
                style={styles.verifiedIcon}
              />
            )}
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={ProsColors.textSecondary} />
            <Text style={styles.location}>
              {pro.city}, {pro.state}
            </Text>
          </View>
        </View>
      </View>

      {pro.shortDescription && (
        <Text style={styles.description} numberOfLines={2}>
          {pro.shortDescription}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#F59E0B" />
          <Text style={styles.rating}>
            {rating > 0 ? rating.toFixed(1) : 'New'}
          </Text>
          {pro.totalReviews > 0 && (
            <Text style={styles.reviewCount}>
              ({pro.totalReviews} {pro.totalReviews === 1 ? 'review' : 'reviews'})
            </Text>
          )}
        </View>

        <View style={styles.badges}>
          {pro.isInsured && (
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={12} color={ProsColors.primary} />
              <Text style={styles.badgeText}>Insured</Text>
            </View>
          )}
          {pro.isLicensed && (
            <View style={styles.badge}>
              <Ionicons name="document-text" size={12} color={ProsColors.primary} />
              <Text style={styles.badgeText}>Licensed</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => onPress(pro.slug)}
        >
          <Text style={styles.viewButtonText}>View Profile</Text>
        </TouchableOpacity>
        {onMessagePress && (
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => onMessagePress(pro.id)}
          >
            <Ionicons name="chatbubble-outline" size={18} color={ProsColors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Featured pro card with larger display
export const ProsFeaturedCard: React.FC<ProsProviderCardProps> = ({
  pro,
  onPress,
}) => {
  const rating = parseFloat(pro.averageRating) || 0;

  return (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => onPress(pro.slug)}
      activeOpacity={0.7}
    >
      {pro.coverImageUrl ? (
        <Image source={{ uri: pro.coverImageUrl }} style={styles.coverImage} />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="image-outline" size={32} color={ProsColors.textMuted} />
        </View>
      )}
      
      <View style={styles.featuredContent}>
        <View style={styles.featuredHeader}>
          {pro.logoUrl ? (
            <Image source={{ uri: pro.logoUrl }} style={styles.featuredLogo} />
          ) : (
            <View style={styles.featuredLogoPlaceholder}>
              <Ionicons name="business" size={20} color={ProsColors.textMuted} />
            </View>
          )}
          <View style={styles.featuredInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.featuredName} numberOfLines={1}>
                {pro.businessName}
              </Text>
              {pro.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={ProsColors.primary}
                />
              )}
            </View>
            <Text style={styles.featuredLocation}>
              {pro.city}, {pro.state}
            </Text>
          </View>
        </View>

        <View style={styles.featuredFooter}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>
              {rating > 0 ? rating.toFixed(1) : 'New'}
            </Text>
          </View>
          {pro.isFeatured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="sparkles" size={12} color={ProsColors.secondary} />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ProsColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
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
  // Featured card styles
  featuredCard: {
    width: 260,
    backgroundColor: ProsColors.cardBg,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: 120,
    backgroundColor: ProsColors.sectionBg,
  },
  coverPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContent: {
    padding: 12,
  },
  featuredHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  featuredLogo: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: ProsColors.sectionBg,
  },
  featuredLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: ProsColors.sectionBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  featuredName: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    flex: 1,
  },
  featuredLocation: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginTop: 2,
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ProsColors.secondary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredBadgeText: {
    fontSize: 11,
    color: ProsColors.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ProsProviderCard;
