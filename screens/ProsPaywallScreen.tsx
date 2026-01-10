/**
 * Pros Paywall Screen
 * Install path: screens/ProsPaywallScreen.tsx
 * 
 * Subscription paywall screen that gates access to lead details and messaging.
 * Shows pricing ($499/year or $99 for first 1,000 pros) and benefits.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { ProsColors } from '../constants/ProsConfig';

const { width } = Dimensions.get('window');

type RouteParams = {
  ProsPaywallScreen: {
    returnTo?: string;
    feature?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

type PricingTier = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  period: string;
  badge?: string;
  features: string[];
  isPopular?: boolean;
};

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'early_bird',
    name: 'Early Bird',
    price: 99,
    originalPrice: 499,
    period: '/year',
    badge: 'LIMITED OFFER',
    features: [
      'Unlimited lead access',
      'Direct messaging with customers',
      'Priority listing in search',
      'Verified Pro badge',
      'Analytics dashboard',
      'Lock in this rate forever',
    ],
    isPopular: true,
  },
  {
    id: 'standard',
    name: 'Pro Annual',
    price: 499,
    period: '/year',
    features: [
      'Unlimited lead access',
      'Direct messaging with customers',
      'Standard listing in search',
      'Verified Pro badge',
      'Analytics dashboard',
    ],
    isPopular: false,
  },
];

const BENEFITS = [
  {
    icon: 'cash-outline',
    title: 'No Per-Lead Fees',
    description: 'Unlike competitors, you pay one flat annual fee. No surprises.',
  },
  {
    icon: 'people-outline',
    title: 'Quality Leads',
    description: 'Connect with customers actively looking for your services.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Verified Badge',
    description: 'Stand out with a verified pro badge on your profile.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Grow Your Business',
    description: 'Expand your customer base without expensive marketing.',
  },
];

export default function ProsPaywallScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsPaywallScreen'>>();
  const { returnTo, feature } = route.params || {};

  const [selectedTier, setSelectedTier] = useState<string>('early_bird');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      // TODO: Integrate with Stripe or payment provider
      // For now, show a placeholder message
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Coming Soon!',
        'Payment processing will be available soon. We\'ll notify you when you can complete your subscription.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const selectedTierData = PRICING_TIERS.find(t => t.id === selectedTier);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="close" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade to Pro</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="rocket" size={40} color={ProsColors.primary} />
          </View>
          <Text style={styles.heroTitle}>Unlock Your Full Potential</Text>
          <Text style={styles.heroSubtitle}>
            {feature 
              ? `Subscribe to ${feature} and grow your business with TavvY Pros.`
              : 'Get unlimited access to leads, messaging, and premium features.'}
          </Text>
        </View>

        {/* Early Bird Counter */}
        <View style={styles.counterSection}>
          <View style={styles.counterBadge}>
            <Ionicons name="flame" size={16} color="#FF6B35" />
            <Text style={styles.counterText}>
              <Text style={styles.counterNumber}>847</Text> of 1,000 early bird spots remaining
            </Text>
          </View>
        </View>

        {/* Pricing Tiers */}
        <View style={styles.tiersContainer}>
          {PRICING_TIERS.map((tier) => (
            <TouchableOpacity
              key={tier.id}
              style={[
                styles.tierCard,
                selectedTier === tier.id && styles.tierCardSelected,
                tier.isPopular && styles.tierCardPopular,
              ]}
              onPress={() => setSelectedTier(tier.id)}
              activeOpacity={0.8}
            >
              {tier.badge && (
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>{tier.badge}</Text>
                </View>
              )}
              
              <View style={styles.tierHeader}>
                <Text style={styles.tierName}>{tier.name}</Text>
                <View style={styles.tierPriceRow}>
                  {tier.originalPrice && (
                    <Text style={styles.tierOriginalPrice}>${tier.originalPrice}</Text>
                  )}
                  <Text style={styles.tierPrice}>${tier.price}</Text>
                  <Text style={styles.tierPeriod}>{tier.period}</Text>
                </View>
              </View>

              <View style={styles.tierFeatures}>
                {tier.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons 
                      name="checkmark-circle" 
                      size={18} 
                      color={selectedTier === tier.id ? ProsColors.primary : ProsColors.textSecondary} 
                    />
                    <Text style={[
                      styles.featureText,
                      selectedTier === tier.id && styles.featureTextSelected,
                    ]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Selection indicator */}
              <View style={[
                styles.selectionIndicator,
                selectedTier === tier.id && styles.selectionIndicatorSelected,
              ]}>
                {selectedTier === tier.id && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why TavvY Pros?</Text>
          <View style={styles.benefitsGrid}>
            {BENEFITS.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.benefitIconContainer}>
                  <Ionicons name={benefit.icon as any} size={24} color={ProsColors.primary} />
                </View>
                <Text style={styles.benefitTitle}>{benefit.title}</Text>
                <Text style={styles.benefitDescription}>{benefit.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Comparison Note */}
        <View style={styles.comparisonNote}>
          <Ionicons name="information-circle" size={20} color={ProsColors.primary} />
          <Text style={styles.comparisonText}>
            <Text style={styles.comparisonBold}>Save thousands</Text> compared to per-lead platforms. 
            Most pros spend $2,000-$5,000/year on leads elsewhere.
          </Text>
        </View>

        {/* Guarantee */}
        <View style={styles.guaranteeSection}>
          <Ionicons name="shield-checkmark" size={24} color={ProsColors.primary} />
          <Text style={styles.guaranteeText}>
            30-day money-back guarantee. No questions asked.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.subscribeButton, loading && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.subscribeButtonText}>
                Subscribe for ${selectedTierData?.price}{selectedTierData?.period}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Cancel anytime. Secure payment via Stripe.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${ProsColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  counterSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  counterText: {
    fontSize: 13,
    color: ProsColors.textSecondary,
  },
  counterNumber: {
    fontWeight: '700',
    color: '#FF6B35',
  },
  tiersContainer: {
    gap: 16,
    marginBottom: 32,
  },
  tierCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: ProsColors.border,
    position: 'relative',
  },
  tierCardSelected: {
    borderColor: ProsColors.primary,
    backgroundColor: `${ProsColors.primary}05`,
  },
  tierCardPopular: {
    borderColor: ProsColors.primary,
  },
  tierBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tierHeader: {
    marginBottom: 16,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 8,
  },
  tierPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  tierOriginalPrice: {
    fontSize: 16,
    color: ProsColors.textMuted,
    textDecorationLine: 'line-through',
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: ProsColors.primary,
  },
  tierPeriod: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  tierFeatures: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  featureTextSelected: {
    color: ProsColors.textPrimary,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ProsColors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: ProsColors.primary,
    borderColor: ProsColors.primary,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 16,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  benefitCard: {
    width: (width - 52) / 2,
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 12,
    padding: 16,
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${ProsColors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    lineHeight: 18,
  },
  comparisonNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${ProsColors.primary}10`,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  comparisonText: {
    flex: 1,
    fontSize: 14,
    color: ProsColors.textPrimary,
    lineHeight: 20,
  },
  comparisonBold: {
    fontWeight: '700',
  },
  guaranteeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  guaranteeText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: ProsColors.borderLight,
  },
  subscribeButton: {
    backgroundColor: ProsColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  subscribeButtonDisabled: {
    backgroundColor: ProsColors.border,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footerNote: {
    fontSize: 12,
    color: ProsColors.textMuted,
    textAlign: 'center',
  },
});
