import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';

interface HelpItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action: () => void;
}

export default function HelpSupportScreen({ navigation }: any) {
  const { t } = useTranslation();
  const SUPPORT_EMAIL = 'support@tavvy.com';
  const PRIVACY_POLICY_URL = 'https://tavvy.com/privacy';
  const TERMS_URL = 'https://tavvy.com/terms';
  const COMMUNITY_GUIDELINES_URL = 'https://tavvy.com/guidelines';

  const handleEmailSupport = async () => {
    const subject = encodeURIComponent('Tavvy App Support Request');
    const body = encodeURIComponent('\n\n---\nApp Version: 1.0.0\nPlatform: iOS');
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Email Not Available',
          `Please email us at ${SUPPORT_EMAIL}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Please email us at ${SUPPORT_EMAIL}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleOpenURL = async (url: string, title: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Unable to open ${title}`);
      }
    } catch (error) {
      Alert.alert('Error', `Unable to open ${title}`);
    }
  };

  const helpItems: HelpItem[] = [
    {
      icon: 'mail-outline',
      title: 'Contact Support',
      description: 'Get help with your account or report an issue',
      action: handleEmailSupport,
    },
    {
      icon: 'document-text-outline',
      title: 'Community Guidelines',
      description: 'Learn about our community standards',
      action: () => handleOpenURL(COMMUNITY_GUIDELINES_URL, 'Community Guidelines'),
    },
    {
      icon: 'shield-outline',
      title: 'Privacy Policy',
      description: 'How we protect your data',
      action: () => handleOpenURL(PRIVACY_POLICY_URL, 'Privacy Policy'),
    },
    {
      icon: 'reader-outline',
      title: 'Terms of Service',
      description: 'Our terms and conditions',
      action: () => handleOpenURL(TERMS_URL, 'Terms of Service'),
    },
  ];

  const faqItems = [
    {
      question: 'How do I tap on a place?',
      answer: 'Visit a place\'s page and tap on the signals that match your experience. Tap once for mild, twice for moderate, and three times for strong.',
    },
    {
      question: 'How do I report inappropriate content?',
      answer: 'Tap the three dots menu on any photo or review and select "Report". Our team reviews all reports promptly.',
    },
    {
      question: 'Can I edit my taps?',
      answer: 'Yes! You can update your taps anytime by visiting the place again and adjusting your signals.',
    },
    {
      question: 'How do I delete my account?',
      answer: 'Contact our support team via email and we\'ll process your request within 48 hours.',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Help Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          <View style={styles.helpContainer}>
            {helpItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.helpItem,
                  index === helpItems.length - 1 && styles.helpItemLast,
                ]}
                onPress={item.action}
              >
                <View style={styles.helpIconContainer}>
                  <Ionicons name={item.icon} size={22} color={Colors.primary} />
                </View>
                <View style={styles.helpContent}>
                  <Text style={styles.helpTitle}>{item.title}</Text>
                  <Text style={styles.helpDescription}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>
            {faqItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.faqItem,
                  index === faqItems.length - 1 && styles.faqItemLast,
                ]}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Direct Contact Card */}
        <View style={styles.contactCard}>
          <View style={styles.contactIconContainer}>
            <Ionicons name="chatbubbles" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactDescription}>
            Our support team is here to help you with any questions or concerns.
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
            <Ionicons name="mail" size={20} color={Colors.white} />
            <Text style={styles.contactButtonText}>Email Support</Text>
          </TouchableOpacity>
          <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Tavvy Version 1.0.0</Text>
          <Text style={styles.appCopyright}>© 2026 Tavvy, Inc. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  helpContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  helpItemLast: {
    borderBottomWidth: 0,
  },
  helpIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  helpDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  faqContainer: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  faqItemLast: {
    borderBottomWidth: 0,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  contactCard: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 24,
    backgroundColor: Colors.background,
    borderRadius: 16,
    alignItems: 'center',
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  contactDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  contactEmail: {
    marginTop: 12,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  appInfo: {
    marginTop: 32,
    alignItems: 'center',
  },
  appVersion: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
