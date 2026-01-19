import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '../lib/supabaseClient';
import { ProsColors } from '../constants/ProsConfig';
import { useTranslation } from 'react-i18next';

type PlanType = 'monthly' | 'annual' | 'founding';

export default function ProsPaywallScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('founding');
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);

  const plans = [
    { id: 'founding' as PlanType, name: 'Founding Member', price: '$99', period: '/year', description: 'Limited to first 1,000 pros', savings: 'Save $400', badge: 'BEST DEAL' },
  ];

  const features = [
    { icon: 'infinite', title: 'Unlimited Leads', description: 'No per-lead fees, ever' },
    { icon: 'star', title: 'Featured Placement', description: 'Priority in search results' },
    { icon: 'shield-checkmark', title: 'Verified Badge', description: 'Build trust with customers' },
    { icon: 'analytics', title: 'Business Analytics', description: 'Track your performance' },
    { icon: 'chatbubbles', title: 'Direct Messaging', description: 'Connect with customers instantly' },
    { icon: 'notifications', title: 'Instant Alerts', description: 'Never miss a lead' },
  ];

  const handleBack = () => navigation.goBack();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pros-stripe-create-checkout');

      if (error) {
        throw new Error(error.message);
      }

      const { sessionId } = data;

      // Redirect to Stripe Checkout
      const { error: stripeError } = await initPaymentSheet({ 
        merchantDisplayName: 'TavvY, Inc.',
        paymentIntentClientSecret: sessionId,
      });

      if (stripeError) {
        Alert.alert('Error', 'Could not initialize payment sheet.');
        console.error(stripeError);
        setLoading(false);
        return;
      }

      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          Alert.alert('Error', 'Payment failed.');
          console.error(paymentError);
        }
      } else {
        Alert.alert('Success', 'You are now subscribed to TavvY Pros!');
        navigation.navigate('ProsDashboard');
      }

    } catch (err) {
      Alert.alert('Error', 'Could not create checkout session.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={handleBack} style={styles.closeButton}><Ionicons name="close" size={24} color="#374151" /></TouchableOpacity></View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}><Ionicons name="briefcase" size={40} color={ProsColors.primary} /></View>
          <Text style={styles.heroTitle}>Grow Your Business with TavvY Pros</Text>
          <Text style={styles.heroSubtitle}>Get unlimited leads for a flat annual fee. No per-lead charges.</Text>
        </View>
        <View style={styles.plansSection}>
          {plans.map((plan) => (
            <TouchableOpacity key={plan.id} style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected]} onPress={() => setSelectedPlan(plan.id)}>
              {plan.badge && <View style={styles.planBadge}><Text style={styles.planBadgeText}>{plan.badge}</Text></View>}
              <View style={styles.planHeader}>
                <View style={[styles.radioButton, selectedPlan === plan.id && styles.radioButtonSelected]}>{selectedPlan === plan.id && <View style={styles.radioButtonInner} />}</View>
                <View style={styles.planInfo}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.planDescription}>{plan.description}</Text></View>
                <View style={styles.planPricing}><Text style={styles.planPrice}>{plan.price}</Text><Text style={styles.planPeriod}>{plan.period}</Text></View>
              </View>
              {plan.savings ? <View style={styles.savingsBadge}><Text style={styles.savingsText}>{plan.savings}</Text></View> : null}
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Everything you need to succeed</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}><Ionicons name={feature.icon as any} size={22} color={ProsColors.primary} /></View>
                <View style={styles.featureContent}><Text style={styles.featureTitle}>{feature.title}</Text><Text style={styles.featureDescription}>{feature.description}</Text></View>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.guaranteeSection}>
          <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          <View style={styles.guaranteeContent}><Text style={styles.guaranteeTitle}>30-Day Money-Back Guarantee</Text><Text style={styles.guaranteeText}>Try TavvY Pros risk-free.</Text></View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe} disabled={loading}><Text style={styles.subscribeButtonText}>{loading ? 'Processing...' : 'Start Growing Your Business'}</Text></TouchableOpacity>
        <Text style={styles.footerText}>Cancel anytime. No hidden fees.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingVertical: 8 },
  closeButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  heroSection: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  plansSection: { paddingHorizontal: 16, gap: 12 },
  planCard: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: 'transparent' },
  planCardSelected: { backgroundColor: '#EFF6FF', borderColor: ProsColors.primary },
  planBadge: { position: 'absolute', top: -10, right: 16, backgroundColor: '#10B981', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  planBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  planHeader: { flexDirection: 'row', alignItems: 'center' },
  radioButton: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioButtonSelected: { borderColor: ProsColors.primary },
  radioButtonInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: ProsColors.primary },
  planInfo: { flex: 1 },
  planName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  planDescription: { fontSize: 13, color: '#6B7280' },
  planPricing: { alignItems: 'flex-end' },
  planPrice: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  planPeriod: { fontSize: 12, color: '#6B7280' },
  savingsBadge: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#D1FAE5', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  savingsText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  featuresSection: { padding: 24 },
  featuresTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  featuresGrid: { gap: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start' },
  featureIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  featureDescription: { fontSize: 13, color: '#6B7280' },
  guaranteeSection: { flexDirection: 'row', backgroundColor: '#ECFDF5', marginHorizontal: 16, padding: 16, borderRadius: 12, gap: 12, marginBottom: 24 },
  guaranteeContent: { flex: 1 },
  guaranteeTitle: { fontSize: 14, fontWeight: '600', color: '#065F46', marginBottom: 4 },
  guaranteeText: { fontSize: 13, color: '#047857' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  subscribeButton: { backgroundColor: ProsColors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  subscribeButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  footerText: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 12 },
});
