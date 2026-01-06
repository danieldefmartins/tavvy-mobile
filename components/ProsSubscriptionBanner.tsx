/**
 * Pros Subscription Banner Component
 * Install path: components/ProsSubscriptionBanner.tsx
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors, PROS_SUBSCRIPTION_TIERS } from '../constants/ProsConfig';

interface ProsSubscriptionBannerProps {
  earlyAdopterCount: number;
  onPress: () => void;
}

export const ProsSubscriptionBanner: React.FC<ProsSubscriptionBannerProps> = ({
  earlyAdopterCount,
  onPress,
}) => {
  const remainingSpots = Math.max(0, 1000 - earlyAdopterCount);
  const isEarlyAdopterAvailable = remainingSpots > 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={[ProsColors.primary, ProsColors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {isEarlyAdopterAvailable
                ? `Only ${remainingSpots} Early Adopter Spots Left!`
                : 'Join 1,000+ Trusted Pros'}
            </Text>
            <Text style={styles.subtitle}>
              {isEarlyAdopterAvailable
                ? `Get started for just $${PROS_SUBSCRIPTION_TIERS.earlyAdopter.price}/year`
                : `Full access for $${PROS_SUBSCRIPTION_TIERS.standard.price}/year`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Compact version for pro dashboard
export const ProsSubscriptionStatusBanner: React.FC<{
  tier: 'early_adopter' | 'standard' | null;
  status: 'active' | 'expired' | 'pending' | null;
  earlyAdopterNumber?: number;
  expiresAt?: string;
  onUpgrade?: () => void;
}> = ({ tier, status, earlyAdopterNumber, expiresAt, onUpgrade }) => {
  if (status === 'active') {
    return (
      <View style={styles.statusBanner}>
        <View style={styles.statusContent}>
          <Ionicons name="checkmark-circle" size={20} color={ProsColors.success} />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              {tier === 'early_adopter' ? 'Early Adopter' : 'Standard'} Plan
              {earlyAdopterNumber && ` #${earlyAdopterNumber}`}
            </Text>
            {expiresAt && (
              <Text style={styles.statusSubtitle}>
                Renews {new Date(expiresAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.upgradeBanner} onPress={onUpgrade}>
      <View style={styles.upgradeContent}>
        <Ionicons name="rocket" size={20} color={ProsColors.secondary} />
        <View style={styles.upgradeText}>
          <Text style={styles.upgradeTitle}>Upgrade Your Profile</Text>
          <Text style={styles.upgradeSubtitle}>Get more visibility and leads</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={ProsColors.textSecondary} />
    </TouchableOpacity>
  );
};

// Pricing card for subscription selection
export const ProsPricingCard: React.FC<{
  tier: 'earlyAdopter' | 'standard';
  isAvailable: boolean;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ tier, isAvailable, isSelected, onSelect }) => {
  const config = PROS_SUBSCRIPTION_TIERS[tier];
  const isEarlyAdopter = tier === 'earlyAdopter';

  return (
    <TouchableOpacity
      style={[
        styles.pricingCard,
        isSelected && styles.pricingCardSelected,
        !isAvailable && styles.pricingCardDisabled,
      ]}
      onPress={onSelect}
      disabled={!isAvailable}
      activeOpacity={0.7}
    >
      {isEarlyAdopter && isAvailable && (
        <View style={styles.limitedBadge}>
          <Text style={styles.limitedBadgeText}>Limited Time</Text>
        </View>
      )}

      <Text style={styles.pricingTier}>{config.label}</Text>
      <Text style={styles.pricingDescription}>{config.description}</Text>

      <View style={styles.priceContainer}>
        <Text style={styles.priceAmount}>${config.price}</Text>
        <Text style={styles.pricePeriod}>/year</Text>
      </View>

      <View style={styles.featuresList}>
        {config.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons
              name="checkmark-circle"
              size={16}
              color={ProsColors.success}
            />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {!isAvailable && isEarlyAdopter && (
        <View style={styles.soldOutOverlay}>
          <Text style={styles.soldOutText}>Sold Out</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Status banner styles
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${ProsColors.success}10`,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${ProsColors.success}30`,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 10,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  statusSubtitle: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: ProsColors.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Upgrade banner styles
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${ProsColors.secondary}10`,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${ProsColors.secondary}30`,
  },
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeText: {
    marginLeft: 10,
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  upgradeSubtitle: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginTop: 2,
  },
  // Pricing card styles
  pricingCard: {
    backgroundColor: ProsColors.cardBg,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: ProsColors.border,
  },
  pricingCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: `${ProsColors.primary}05`,
  },
  pricingCardDisabled: {
    opacity: 0.6,
  },
  limitedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  limitedBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  pricingTier: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  pricingDescription: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: ProsColors.primary,
  },
  pricePeriod: {
    fontSize: 16,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  featuresList: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: ProsColors.textPrimary,
    marginLeft: 8,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  soldOutText: {
    fontSize: 18,
    fontWeight: '700',
    color: ProsColors.textMuted,
  },
});

export default ProsSubscriptionBanner;
