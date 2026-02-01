/**
 * TavvyShieldScreen.tsx
 * 
 * Tavvy Shield: Protection Built Into Discovery
 * 
 * Features:
 * - Verified identity and payment accountability
 * - Real activity signals (not star ratings)
 * - Payment options: Direct pay or Tavvy pays on behalf
 * - Optional licensed professional inspection
 * - Municipal code compliance verification
 * - Transparent flat percentage fee
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { ProsColors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function TavvyShieldScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const bgColor = isDark ? '#000000' : '#F9F7F2';
  const cardBg = isDark ? '#1A1F2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? '#E5E7EB' : '#6B7280';
  const accentColor = ProsColors.primary;

  const features = [
    {
      icon: 'shield-checkmark',
      title: 'Verified Identity',
      description: 'All professionals complete identity verification, license validation, and background checks',
      color: '#6B7FFF',
    },
    {
      icon: 'analytics',
      title: 'Real Activity Signals',
      description: 'No fake reviews. We track real visits, live activity, and verified behavior patterns',
      color: '#8B5CF6',
    },
    {
      icon: 'card',
      title: 'Payment Protection',
      description: 'Choose to pay directly or let Tavvy handle payments. All transactions are tracked and accountable',
      color: '#10B981',
    },
    {
      icon: 'construct',
      title: 'Licensed Inspections',
      description: 'Optional: Hire a licensed professional to verify work quality and municipal code compliance',
      color: '#F59E0B',
    },
  ];

  const paymentOptions = [
    {
      icon: 'card-outline',
      title: 'Pay Contractor Directly',
      description: 'After Tavvy approval, pay the contractor directly with full transparency',
      badge: 'Popular',
      badgeColor: '#10B981',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Tavvy Pays on Your Behalf',
      description: 'We hold funds and release payment after work completion and your approval',
      badge: 'Safest',
      badgeColor: '#6B7FFF',
    },
  ];

  const inspectionFeatures = [
    { icon: 'checkmark-circle', text: 'Licensed professional site visit' },
    { icon: 'checkmark-circle', text: 'Municipal code compliance check' },
    { icon: 'checkmark-circle', text: 'Work quality verification' },
    { icon: 'checkmark-circle', text: 'Detailed inspection report' },
  ];

  const faqs = [
    {
      question: 'How much does Tavvy Shield cost?',
      answer: 'We charge a small flat percentage fee (3.5%) on transactions. This covers payment processing, verification, and protection services. No hidden fees.',
    },
    {
      question: 'What are the payment options?',
      answer: 'You can either pay the contractor directly after our approval, or have Tavvy hold and release funds on your behalf. Both options include full payment accountability.',
    },
    {
      question: 'What is the licensed inspection service?',
      answer: 'For an additional fee, we can send a licensed professional to your project site to verify work quality and ensure everything meets municipal building codes. This is optional but highly recommended for major projects.',
    },
    {
      question: 'How long does contractor approval take?',
      answer: 'Most contractor approvals are completed within 24-48 hours. We verify their identity, licenses, insurance, and past work history.',
    },
    {
      question: 'What happens if something goes wrong?',
      answer: 'If you have an issue with a Shield-protected transaction, file a dispute through Tavvy. We review all disputes fairly and work toward resolution. Contractors with repeated issues lose Shield eligibility.',
    },
    {
      question: 'Can contractors lose their Shield badge?',
      answer: 'Yes. Shield eligibility is behavior-based. Contractors who consistently violate policies, abandon work, or engage in fraud lose their Shield status and may be removed from Tavvy entirely.',
    },
  ];

  const benefits = [
    { icon: 'people', title: 'For Homeowners', items: ['Verified contractors', 'Payment protection', 'Dispute resolution', 'Optional inspections', 'Code compliance'] },
    { icon: 'briefcase', title: 'For Contractors', items: ['Higher trust', 'Better visibility', 'Fair disputes', 'Clear expectations', 'Good behavior rewards'] },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: bgColor, borderBottomColor: isDark ? '#1A1F2E' : '#E5E7EB' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Tavvy Shield</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['rgba(107, 127, 255, 0.2)', 'rgba(139, 92, 246, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="shield-checkmark" size={64} color="#6B7FFF" />
          </View>
          <Text style={[styles.heroTitle, { color: textColor }]}>Tavvy Shield</Text>
          <Text style={[styles.heroSubtitle, { color: secondaryTextColor }]}>
            A safer way to discover, hire, and pay.{'\n'}Built into every experience.
          </Text>
        </LinearGradient>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Protection by Design</Text>
          <Text style={[styles.bodyText, { color: secondaryTextColor }]}>
            Finding a contractor shouldn't feel like a gamble. Tavvy Shield is our protection layer — designed to help you make confident decisions when hiring professionals or paying for services.
          </Text>
          <Text style={[styles.bodyText, { color: secondaryTextColor, marginTop: 12 }]}>
            It's not insurance. It's not social media.
          </Text>
          <Text style={[styles.bodyText, { color: secondaryTextColor, marginTop: 12, fontWeight: '600' }]}>
            It's accountability, verification, and trust — built into Tavvy.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>What Shield Protects</Text>
          {features.map((feature, index) => (
            <View key={index} style={[styles.featureCard, { backgroundColor: cardBg }]}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={28} color={feature.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={[styles.featureTitle, { color: textColor }]}>{feature.title}</Text>
                <Text style={[styles.featureDesc, { color: secondaryTextColor }]}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>💳 Payment Options</Text>
          <Text style={[styles.bodyText, { color: secondaryTextColor, marginBottom: 16 }]}>
            Choose how you want to handle payments. Both options include full protection and accountability.
          </Text>
          {paymentOptions.map((option, index) => (
            <View key={index} style={[styles.paymentCard, { backgroundColor: cardBg }]}>
              <View style={styles.paymentHeader}>
                <View style={styles.paymentIconContainer}>
                  <Ionicons name={option.icon as any} size={24} color={accentColor} />
                </View>
                <View style={[styles.paymentBadge, { backgroundColor: option.badgeColor + '20' }]}>
                  <Text style={[styles.paymentBadgeText, { color: option.badgeColor }]}>{option.badge}</Text>
                </View>
              </View>
              <Text style={[styles.paymentTitle, { color: textColor }]}>{option.title}</Text>
              <Text style={[styles.paymentDesc, { color: secondaryTextColor }]}>{option.description}</Text>
            </View>
          ))}
          
          {/* Fee Information */}
          <View style={[styles.feeBox, { backgroundColor: isDark ? '#1A1F2E' : '#F3F4F6', borderColor: isDark ? '#374151' : '#D1D5DB' }]}>
            <Ionicons name="information-circle" size={20} color={accentColor} />
            <Text style={[styles.feeText, { color: secondaryTextColor }]}>
              <Text style={{ fontWeight: '600', color: textColor }}>Flat 3.5% fee</Text> on all transactions. No hidden charges. This covers payment processing, verification, and protection services.
            </Text>
          </View>
        </View>

        {/* Licensed Inspection Service */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>🔍 Licensed Inspection Service</Text>
          <Text style={[styles.bodyText, { color: secondaryTextColor, marginBottom: 16 }]}>
            Add an extra layer of protection with a licensed professional inspection. Recommended for major projects.
          </Text>
          <View style={[styles.inspectionCard, { backgroundColor: cardBg }]}>
            <View style={styles.inspectionHeader}>
              <Ionicons name="construct" size={32} color="#F59E0B" />
              <Text style={[styles.inspectionTitle, { color: textColor }]}>Professional Site Inspection</Text>
            </View>
            {inspectionFeatures.map((item, index) => (
              <View key={index} style={styles.inspectionItem}>
                <Ionicons name={item.icon as any} size={20} color="#10B981" />
                <Text style={[styles.inspectionItemText, { color: secondaryTextColor }]}>{item.text}</Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.inspectionButton, { backgroundColor: accentColor }]}>
              <Text style={styles.inspectionButtonText}>Request Inspection</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Benefits for Both Sides */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Built for Everyone</Text>
          <Text style={[styles.bodyText, { color: secondaryTextColor, marginBottom: 16 }]}>
            Tavvy Shield protects homeowners without punishing good contractors.
          </Text>
          {benefits.map((benefit, index) => (
            <View key={index} style={[styles.benefitCard, { backgroundColor: cardBg }]}>
              <View style={styles.benefitHeader}>
                <Ionicons name={benefit.icon as any} size={24} color={accentColor} />
                <Text style={[styles.benefitTitle, { color: textColor }]}>{benefit.title}</Text>
              </View>
              {benefit.items.map((item, idx) => (
                <View key={idx} style={styles.benefitItem}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={[styles.benefitItemText, { color: secondaryTextColor }]}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Frequently Asked Questions</Text>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.faqCard, { backgroundColor: cardBg }]}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: textColor, flex: 1 }]}>{faq.question}</Text>
                <Ionicons
                  name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={secondaryTextColor}
                />
              </View>
              {expandedFaq === index && (
                <Text style={[styles.faqAnswer, { color: secondaryTextColor }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Section */}
        <View style={[styles.ctaSection, { backgroundColor: cardBg }]}>
          <Ionicons name="shield-checkmark" size={48} color={accentColor} />
          <Text style={[styles.ctaTitle, { color: textColor }]}>Ready to Explore with Confidence?</Text>
          <Text style={[styles.ctaSubtitle, { color: secondaryTextColor }]}>
            Tavvy Shield is already built into Tavvy. You don't need to activate it — just look for the 🛡️ badge.
          </Text>
          <TouchableOpacity style={[styles.ctaButton, { backgroundColor: accentColor }]}>
            <Text style={styles.ctaButtonText}>Find Verified Contractors</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Footer Disclaimer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: secondaryTextColor }]}>
            Tavvy Shield is a trust and accountability framework, not an insurance policy. It helps reduce risk through verification and tracking, but doesn't provide financial guarantees for every possible scenario.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  heroIcon: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  paymentCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 127, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  paymentDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  feeBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    gap: 12,
  },
  feeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  inspectionCard: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  inspectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  inspectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  inspectionItemText: {
    fontSize: 15,
    flex: 1,
  },
  inspectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  inspectionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  benefitCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  benefitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  benefitItemText: {
    fontSize: 15,
    flex: 1,
  },
  faqCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  ctaSection: {
    marginHorizontal: 20,
    marginVertical: 24,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
