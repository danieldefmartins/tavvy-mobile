import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'color-palette',
    title: 'Premium Themes',
    description: 'Access 20+ stunning premium themes',
  },
  {
    icon: 'link',
    title: 'Unlimited Links',
    description: 'Add as many links as you want',
  },
  {
    icon: 'bar-chart',
    title: 'Advanced Analytics',
    description: 'Track views, clicks, and engagement',
  },
  {
    icon: 'videocam',
    title: 'Video Backgrounds',
    description: 'Make your card stand out with video',
  },
  {
    icon: 'brush',
    title: 'Custom Fonts',
    description: 'Choose from 50+ premium fonts',
  },
  {
    icon: 'shield-checkmark',
    title: 'Priority Support',
    description: 'Get help when you need it',
  },
];

interface Props {
  navigation: any;
  route: any;
}

export default function ECardPremiumUpsellScreen({ navigation, route }: Props) {
  const { feature, themeName } = route.params || {};
  const { user, refreshProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to subscribe to Pro.');
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
      // Check if user has an active subscription in the database
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (subscription) {
        // User has an active subscription, update their profile
        await supabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('id', user.id);

        // Refresh the auth context
        if (refreshProfile) {
          await refreshProfile();
        }

        Alert.alert(
          'Subscription Restored',
          'Your Pro subscription has been restored successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'No Active Subscription',
          'We couldn\'t find an active subscription for your account. If you believe this is an error, please contact support.',
          [{ text: 'OK' }]
        );
      }
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
        colors={['#1A1A1A', '#333333']}
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
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {FEATURES.map((feat, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feat.icon as any} size={20} color="#FFD700" />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{feat.title}</Text>
                  <Text style={styles.featureDescription}>{feat.description}</Text>
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
              {selectedPlan === 'yearly' && (
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
                  <Text style={styles.planSavings}>Save 33%</Text>
                </View>
                <View style={styles.planPrice}>
                  <Text style={styles.priceAmount}>$3.33</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
              </View>
              <Text style={styles.billedText}>Billed $39.99/year</Text>
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
                  <Text style={styles.priceAmount}>$4.99</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Free Trial Info */}
          <View style={styles.trialInfo}>
            <Ionicons name="gift" size={20} color="#00C853" />
            <Text style={styles.trialText}>Start with a 7-day free trial</Text>
          </View>

          {/* Platform Notice */}
          {Platform.OS === 'ios' && (
            <View style={styles.platformNotice}>
              <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.platformNoticeText}>
                You'll be redirected to complete payment securely via Stripe
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.subscribeButton, isLoading && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            activeOpacity={0.9}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.subscribeGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#1A1A1A" size="small" />
              ) : (
                <Text style={styles.subscribeText}>Start Free Trial</Text>
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
    backgroundColor: '#1A1A1A',
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
    color: '#1A1A1A',
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
  trialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,200,83,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  trialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
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
    backgroundColor: '#1A1A1A',
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
    color: '#1A1A1A',
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
