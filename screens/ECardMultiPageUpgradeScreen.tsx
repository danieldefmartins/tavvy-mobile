import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';

// Stripe Price ID for Multi-Page subscription - UPDATE THIS with your actual Stripe Price ID
const MULTI_PAGE_PRICE_ID = 'price_XXXXXX'; // Replace with actual Stripe price ID

interface RouteParams {
  templateId: string;
  colorSchemeId: string;
  cardId?: string;
  returnTo?: string;
}

const ECardMultiPageUpgradeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [loading, setLoading] = useState(false);

  const features = [
    {
      icon: 'layers-outline',
      title: '3-Page eCard',
      description: 'Profile + Links + Products pages',
    },
    {
      icon: 'link-outline',
      title: 'Unlimited Links',
      description: 'Add as many links as you need',
    },
    {
      icon: 'cart-outline',
      title: 'Product Showcase',
      description: 'Display and sell your products',
    },
    {
      icon: 'analytics-outline',
      title: 'Advanced Analytics',
      description: 'Track views, clicks, and engagement',
    },
    {
      icon: 'color-palette-outline',
      title: 'Premium Templates',
      description: 'Access all premium designs',
    },
    {
      icon: 'crown-outline',
      title: 'Priority Support',
      description: 'Get help when you need it',
    },
  ];

  const handleSubscribe = async () => {
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please log in to subscribe');
        setLoading(false);
        return;
      }

      // Create Stripe checkout session via your backend/edge function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: MULTI_PAGE_PRICE_ID,
          userId: user.id,
          successUrl: 'tavvy://subscription-success',
          cancelUrl: 'tavvy://subscription-cancel',
          metadata: {
            feature: 'multi_page_ecard',
            templateId: params.templateId,
            colorSchemeId: params.colorSchemeId,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in browser
        await Linking.openURL(data.url);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      Alert.alert(
        'Subscription Error',
        'Unable to start subscription. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'Please log in to restore purchases');
        setLoading(false);
        return;
      }

      // Check if user has active subscription
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscription) {
        Alert.alert(
          'Subscription Found!',
          'Your Multi-Page subscription is active.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          'No Active Subscription',
          'We couldn\'t find an active subscription for your account.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Unable to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#d4af37', '#f4d03f']}
            style={styles.crownBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="diamond" size={32} color="#000" />
          </LinearGradient>
          
          <Text style={styles.heroTitle}>Upgrade to Multi-Page</Text>
          <Text style={styles.heroSubtitle}>
            Unlock the full potential of your Tavvy eCard
          </Text>
        </View>

        {/* Preview Cards */}
        <View style={styles.previewSection}>
          <View style={styles.previewCards}>
            <View style={[styles.previewCard, styles.previewCard1]}>
              <Text style={styles.previewCardLabel}>Profile</Text>
            </View>
            <View style={[styles.previewCard, styles.previewCard2]}>
              <Text style={styles.previewCardLabel}>Links</Text>
            </View>
            <View style={[styles.previewCard, styles.previewCard3]}>
              <Text style={styles.previewCardLabel}>Products</Text>
            </View>
          </View>
        </View>

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={24} color="#d4af37" />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.pricingSection}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>$4.99</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          <Text style={styles.priceNote}>Cancel anytime • No hidden fees</Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleSubscribe}
          disabled={loading}
        >
          <LinearGradient
            colors={['#d4af37', '#f4d03f']}
            style={styles.subscribeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={loading}
        >
          <Text style={styles.restoreButtonText}>Restore Purchase</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By subscribing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  crownBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  previewSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  previewCards: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: -20,
  },
  previewCard: {
    width: 80,
    height: 120,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  previewCard1: {
    backgroundColor: '#3b82f6',
    transform: [{ rotate: '-10deg' }],
    zIndex: 1,
  },
  previewCard2: {
    backgroundColor: '#8b5cf6',
    height: 130,
    zIndex: 2,
  },
  previewCard3: {
    backgroundColor: '#ec4899',
    transform: [{ rotate: '10deg' }],
    zIndex: 1,
  },
  previewCardLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  featuresSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  pricingSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#d4af37',
  },
  pricePeriod: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 4,
  },
  priceNote: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  subscribeGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  termsText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
  termsLink: {
    color: '#3b82f6',
    textDecorationLine: 'underline',
  },
});

export default ECardMultiPageUpgradeScreen;
