import { useReleaseCopy } from '../../hooks/useReleaseCopy';
import { fetchMyECardEntitlement } from '../../lib/ecardEntitlement';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ECARD_PRO_ANNUAL, ECARD_PRO_MONTHLY, IAP_ENABLED } from '../../lib/iapConfig';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'color-palette', title: "Premium designs", description: "Choose from premium layouts and color palettes." },
  { icon: 'images', title: "Photo galleries", description: "Show multiple photos on your card." },
  { icon: 'videocam', title: "Embedded videos", description: "Add playable videos to your card." },
  { icon: 'document-text', title: "Contact forms", description: "Let visitors send an inquiry from your card." },
  { icon: 'shield-checkmark', title: "Professional credentials", description: "Display your professional credentials." },
];

interface Props {
  navigation: any;
  route: any;
}

export default function ECardPremiumUpsellScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const copy = useReleaseCopy();
  const { feature, themeName } = route.params || {};
  const { user, refreshProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [applePrices, setApplePrices] = useState<Record<string, string>>({});
  const [applePriceError, setApplePriceError] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !IAP_ENABLED) return;
    let active = true;
    let unsubscribe: (() => void) | undefined;
    void import('../../lib/iap').then(async ({ fetchIapPrices, subscribeToPurchaseResults }) => {
      if (!active) return;
      // The StoreKit sheet reports back asynchronously; this is where the
      // customer learns the purchase (or restore) actually unlocked Pro.
      unsubscribe = subscribeToPurchaseResults(result => {
        if (!active) return;
        setIsLoading(false);
        if (result.type === 'success' && (result.productId === ECARD_PRO_ANNUAL || result.productId === ECARD_PRO_MONTHLY)) {
          void refreshProfile();
          Alert.alert(
            copy('Pro access active'),
            copy(result.restored ? 'Your verified Pro access is available. Reopen your card to refresh its features.' : 'Thank you! Your eCard Pro subscription is active.'),
            [{ text: t('common.ok', { defaultValue: 'OK' }), onPress: () => navigation.goBack() }],
          );
        } else if (result.type === 'error' && !result.cancelled) {
          Alert.alert(copy('Purchase Error'), result.message);
        }
      });
      try {
        const prices = await fetchIapPrices();
        if (active) setApplePrices(prices);
      } catch {
        if (active) setApplePriceError(true);
      }
    });
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const selectedAppleProduct = selectedPlan === 'yearly' ? ECARD_PRO_ANNUAL : ECARD_PRO_MONTHLY;
  const applePriceReady = Boolean(applePrices[selectedAppleProduct]);
  const iosPurchaseDisabled = Platform.OS === 'ios' && (!IAP_ENABLED || !applePriceReady);

  const handleSubscribe = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to subscribe to Pro.');
      return;
    }

    if (Platform.OS === 'ios') {
      if (!IAP_ENABLED) {
        Alert.alert('Not available yet', 'Purchases through Apple are not available in this version yet.');
        return;
      }
      if (!applePriceReady) {
        Alert.alert('Prices unavailable', 'Could not load Apple subscription prices. Please try again later.');
        return;
      }
      setIsLoading(true);
      try {
        const { purchaseIapSubscription } = await import('../../lib/iap');
        await purchaseIapSubscription(selectedAppleProduct, user.id);
        // Outcome arrives through subscribeToPurchaseResults (above), which clears isLoading.
      } catch (error) {
        setIsLoading(false);
        const { isUserCancelled } = await import('../../lib/iap');
        if (!isUserCancelled(error)) {
          console.error('Apple purchase error:', error);
          Alert.alert(copy('Purchase Error'), copy('Could not start your purchase. Please try again.'));
        }
      }
      return;
    }

    setIsLoading(true);

    try {
      // Call the Edge Function to create a Stripe checkout session
      const { data, error } = await supabase.functions.invoke('ecard-stripe-create-checkout', {
        body: { plan_type: selectedPlan === 'yearly' ? 'annual' : 'monthly' },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create checkout session');
      }

      if (data?.url) {
        // Open Stripe Checkout in browser
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
          
          // Show success message after returning from checkout
          Alert.alert(
            'Complete Your Purchase',
            'You\'ll be redirected to complete your subscription. After payment, return to the app and your Pro features will be activated.',
            [{ text: 'OK' }]
          );
        } else {
          throw new Error('Cannot open checkout URL');
        }
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Subscription Error',
        error.message || 'Failed to start subscription. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to restore purchases.');
      return;
    }

    setIsRestoring(true);

    try {
      let restoreProblem: string | null = null;
      if (Platform.OS === 'ios' && IAP_ENABLED) {
        const { restorePurchases } = await import('../../lib/iap');
        const outcome = await restorePurchases();
        if (outcome.restored === 0 && outcome.failed > 0) restoreProblem = outcome.messages[0] ?? null;
      }
      const entitlement = await fetchMyECardEntitlement();
      if (entitlement.is_pro) void refreshProfile();
      Alert.alert(
        entitlement.is_pro ? copy('Pro access active') : copy('Plan not active'),
        entitlement.is_pro
          ? copy('Your verified Pro access is available. Reopen your card to refresh its features.')
          : restoreProblem ?? copy(Platform.OS === 'ios' && IAP_ENABLED ? 'No previous purchases were found for this Apple ID.' : 'If you just checked out, wait a moment and try again.'),
      );
    } catch (error: any) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Error',
        'Failed to restore purchases. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#1E0A3C', '#333333']}
        style={styles.gradient}
      >
        {/* Close Button */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.crownContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.crownGradient}
              >
                <Ionicons name="star" size={32} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Upgrade to Pro</Text>
            <Text style={styles.subtitle}>
              {feature === 'theme' && themeName 
                ? `Unlock "${themeName}" and all premium features`
                : 'Unlock all premium features and take your card to the next level'}
            </Text>
            <Text style={[styles.subtitle, { marginTop: 12 }]}>
              {copy('Free includes a design in every category and no plan-based link limit. Pro adds premium designs, galleries, embedded videos, contact forms and professional credentials.')}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {FEATURES.map((feat, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feat.icon as any} size={20} color="#FFD700" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{copy(feat.title)}</Text>
                  <Text style={styles.featureDescription}>{copy(feat.description)}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansContainer}>
            {/* Yearly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
            >
              {selectedPlan === 'yearly' && Platform.OS !== 'ios' && (
                <View style={styles.bestValueBadge}>
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <View style={[
                  styles.radioButton,
                  selectedPlan === 'yearly' && styles.radioButtonSelected,
                ]}>
                  {selectedPlan === 'yearly' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Yearly</Text>
                  {Platform.OS !== 'ios' && <Text style={styles.planSavings}>Save 33%</Text>}
                </View>
                <View style={styles.planPrice}>
                  <Text style={styles.priceAmount}>{Platform.OS === 'ios' ? (IAP_ENABLED ? applePrices[ECARD_PRO_ANNUAL] || '…' : 'Coming soon') : '$3.33'}</Text>
                  <Text style={styles.pricePeriod}>{Platform.OS === 'ios' ? '/year' : '/month'}</Text>
                </View>
              </View>
              {Platform.OS !== 'ios' && <Text style={styles.billedText}>Billed $39.99/year</Text>}
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              <View style={styles.planHeader}>
                <View style={[
                  styles.radioButton,
                  selectedPlan === 'monthly' && styles.radioButtonSelected,
                ]}>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Monthly</Text>
                </View>
                <View style={styles.planPrice}>
                  <Text style={styles.priceAmount}>{Platform.OS === 'ios' ? (IAP_ENABLED ? applePrices[ECARD_PRO_MONTHLY] || '…' : 'Coming soon') : '$4.99'}</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Platform Notice */}
          {Platform.OS === 'ios' && (
            <View style={styles.platformNotice}>
              <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.platformNoticeText}>
                {IAP_ENABLED ? (applePriceError ? copy('Apple prices could not be loaded. Please reopen this page.') : copy('Purchases are completed securely through Apple.')) : copy('Purchases through Apple are coming soon.')}
              </Text>
            </View>
          )}

          {/* Apple Guideline 3.1.2: renewal terms + Terms of Use / Privacy Policy links on the paywall */}
          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 17, textAlign: 'center' }}>
              {copy(Platform.OS === 'ios'
                ? 'Payment is charged to your Apple ID account at confirmation. The subscription renews automatically at the same price unless it is cancelled at least 24 hours before the end of the current period. Manage or cancel it in your App Store account settings.'
                : 'The subscription renews automatically until cancelled. You can manage or cancel it at any time.')}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10 }}>
              <TouchableOpacity onPress={() => Linking.openURL('https://tavvy.com/terms')} accessibilityRole="link">
                <Text style={{ color: '#FFD700', fontSize: 12, textDecorationLine: 'underline' }}>{copy('Terms of Use')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://tavvy.com/privacy')} accessibilityRole="link">
                <Text style={{ color: '#FFD700', fontSize: 12, textDecorationLine: 'underline' }}>{copy('Privacy Policy')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.subscribeButton, (isLoading || iosPurchaseDisabled) && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            activeOpacity={0.9}
            disabled={isLoading || iosPurchaseDisabled}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#1E0A3C" size="small" />
              ) : (
                <Text style={styles.subscribeText}>{Platform.OS === 'ios' && !IAP_ENABLED ? 'Coming soon' : Platform.OS === 'ios' && !applePriceReady ? 'Loading Apple prices…' : 'Subscribe Now'}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator color="rgba(255,255,255,0.6)" size="small" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Cancel anytime. By subscribing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E0A3C',
  },
  gradient: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 200,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  crownContainer: {
    marginBottom: 16,
  },
  crownGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  plansContainer: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E0A3C',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    borderColor: '#FFD700',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  planSavings: {
    fontSize: 13,
    color: '#00C853',
    fontWeight: '600',
    marginTop: 2,
  },
  planPrice: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  pricePeriod: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  billedText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    marginLeft: 36,
  },
  platformNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  platformNoticeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 40,
    backgroundColor: '#1E0A3C',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  subscribeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E0A3C',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  termsText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
