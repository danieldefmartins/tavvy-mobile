import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface GuidelineSection {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const guidelines: GuidelineSection[] = [
  {
    icon: 'checkmark-circle',
    title: 'Be Honest',
    description: 'Share your genuine experiences. Your taps help others make informed decisions about places.',
  },
  {
    icon: 'people',
    title: 'Be Respectful',
    description: 'Treat other community members and business owners with respect. Avoid personal attacks or harassment.',
  },
  {
    icon: 'camera',
    title: 'Share Relevant Photos',
    description: 'Only upload photos that are relevant to the place. No inappropriate, offensive, or copyrighted content.',
  },
  {
    icon: 'location',
    title: 'Review Real Visits',
    description: 'Only tap on places you have actually visited. Authentic experiences make Tavvy valuable for everyone.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Protect Privacy',
    description: 'Do not share personal information about yourself or others. Respect the privacy of everyone.',
  },
  {
    icon: 'ban',
    title: 'No Spam or Fake Content',
    description: 'Do not post spam, promotional content, or fake reviews. This includes incentivized reviews.',
  },
  {
    icon: 'flag',
    title: 'Report Violations',
    description: 'If you see content that violates these guidelines, please report it. We review all reports promptly.',
  },
];

export default function CommunityGuidelinesScreen({ navigation }: any) {
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
        <Text style={styles.headerTitle}>Community Guidelines</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Section */}
        <View style={styles.introSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="heart" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.introTitle}>Welcome to the Tavvy Community</Text>
          <Text style={styles.introText}>
            Tavvy is built on trust and authentic experiences. These guidelines help us maintain a helpful, respectful community for everyone.
          </Text>
        </View>

        {/* Guidelines List */}
        <View style={styles.guidelinesContainer}>
          {guidelines.map((guideline, index) => (
            <View key={index} style={styles.guidelineItem}>
              <View style={styles.guidelineIconContainer}>
                <Ionicons name={guideline.icon} size={22} color={Colors.primary} />
              </View>
              <View style={styles.guidelineContent}>
                <Text style={styles.guidelineTitle}>{guideline.title}</Text>
                <Text style={styles.guidelineDescription}>{guideline.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Enforcement Section */}
        <View style={styles.enforcementSection}>
          <Text style={styles.enforcementTitle}>Enforcement</Text>
          <Text style={styles.enforcementText}>
            Violations of these guidelines may result in content removal, temporary suspension, or permanent account termination depending on the severity and frequency of violations.
          </Text>
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions or Concerns?</Text>
          <Text style={styles.contactText}>
            If you have questions about these guidelines or need to report a concern, please contact our support team.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <Ionicons name="mail-outline" size={20} color={Colors.white} />
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Last Updated */}
        <Text style={styles.lastUpdated}>Last updated: January 2026</Text>
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
  introSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  introText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  guidelinesContainer: {
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  guidelineItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  guidelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guidelineContent: {
    flex: 1,
  },
  guidelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  guidelineDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  enforcementSection: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  enforcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 8,
  },
  enforcementText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: Colors.background,
    borderRadius: 16,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  lastUpdated: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
