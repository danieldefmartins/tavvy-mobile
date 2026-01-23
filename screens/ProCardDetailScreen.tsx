/**
 * ProCardDetailScreen.tsx
 * Full Pro Card view when tapped from Wallet
 * Path: screens/ProCardDetailScreen.tsx
 *
 * FEATURES:
 * - Full Pro Card display with gradient header
 * - Contact actions (Call, Text, Email, Quote)
 * - Social links
 * - Share card functionality
 * - Save to contacts
 * - QR code display
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
  Linking,
  Share,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import * as Contacts from 'expo-contacts';
import QRCode from 'react-native-qrcode-svg';

interface ProCardData {
  id: string;
  companyName: string;
  tagline: string;
  category: string;
  city: string;
  state: string;
  phone: string;
  phoneDisplay: string;
  email: string;
  gradientColors: [string, string];
  profilePhoto?: string;
  logoPhoto?: string;
  verified: boolean;
  services: string[];
  socialLinks: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  tavvyProfileUrl: string;
  portfolioUrl: string;
}

// Mock data - will be fetched based on cardId
const MOCK_CARD_DATA: ProCardData = {
  id: '1',
  companyName: 'Martinez Plumbing',
  tagline: 'Your Trusted Local Plumber',
  category: 'Plumber',
  city: 'Orlando',
  state: 'FL',
  phone: '+15551234567',
  phoneDisplay: '(555) 123-4567',
  email: 'contact@martinezplumbing.com',
  gradientColors: ['#8B5CF6', '#6366F1'],
  verified: true,
  services: ['Leak Repair', 'Water Heater', 'Drain Cleaning', 'Pipe Repair', 'Emergency Services'],
  socialLinks: {
    instagram: 'martinezplumbing',
    facebook: 'martinezplumbingorlando',
    website: 'www.martinezplumbing.com',
  },
  tavvyProfileUrl: 'https://tavvy.com/pros/martinez-plumbing',
  portfolioUrl: 'https://tavvy.com/pros/martinez-plumbing/portfolio',
};

export default function ProCardDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useThemeContext();
  const [activeTab, setActiveTab] = useState('contact');
  const [showQRModal, setShowQRModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // In real app, fetch based on route.params.cardId
  const cardData = MOCK_CARD_DATA;
  const cardUrl = `https://pros.tavvy.com/pro/${cardData.id}`;
  const gradient = cardData.gradientColors;

  // Save contact to phone
  const saveContactToPhone = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to contacts to save this card.');
        return;
      }

      const contact: Contacts.Contact = {
        [Contacts.Fields.FirstName]: cardData.companyName,
        [Contacts.Fields.Company]: cardData.companyName,
        [Contacts.Fields.JobTitle]: cardData.category,
        [Contacts.Fields.PhoneNumbers]: [
          {
            label: 'work',
            number: cardData.phone,
          },
        ],
        [Contacts.Fields.Emails]: [
          {
            label: 'work',
            email: cardData.email,
          },
        ],
        [Contacts.Fields.Addresses]: [
          {
            label: 'work',
            city: cardData.city,
            region: cardData.state,
            country: 'USA',
          },
        ],
      };

      await Contacts.addContactAsync(contact);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      Alert.alert('Success', `${cardData.companyName} has been saved to your contacts!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    }
  };

  // Share card
  const shareCard = async () => {
    try {
      await Share.share({
        message: `Check out ${cardData.companyName} - ${cardData.tagline}\n${cardUrl}`,
        url: cardUrl,
        title: cardData.companyName,
      });
    } catch (error) {
      console.log('Share cancelled');
    }
  };

  // Open social link
  const openSocialLink = (type: string, value?: string) => {
    let url = '';
    switch (type) {
      case 'instagram':
        url = `https://instagram.com/${value}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${value}`;
        break;
      case 'website':
        url = value?.startsWith('http') ? value : `https://${value}`;
        break;
      case 'tavvy':
        url = cardData.tavvyProfileUrl;
        break;
      case 'portfolio':
        url = cardData.portfolioUrl;
        break;
    }
    if (url) Linking.openURL(url);
  };

  // Dynamic styles
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? theme.background : '#F3F4F6',
    },
    cardBg: {
      backgroundColor: isDark ? theme.surface : '#FFFFFF',
    },
    text: {
      color: isDark ? theme.text : '#111827',
    },
    textSecondary: {
      color: isDark ? theme.textSecondary : '#6B7280',
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gradient Header */}
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Tavvy Badge */}
          <View style={styles.tavvyBadge}>
            <Text style={styles.tavvyBadgeText}>Tavvy Pro</Text>
          </View>

          {/* Profile Photo */}
          <View style={styles.profilePhotoContainer}>
            {cardData.profilePhoto ? (
              <Image source={{ uri: cardData.profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Ionicons name="person" size={40} color="rgba(255,255,255,0.6)" />
              </View>
            )}
          </View>

          {/* Company Info */}
          <View style={styles.companyInfo}>
            <View style={styles.companyNameRow}>
              <Text style={styles.companyName}>{cardData.companyName}</Text>
              {cardData.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </View>
            <Text style={styles.tagline}>{cardData.tagline}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.locationText}>
                {cardData.category} • {cardData.city}, {cardData.state}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Card Body */}
        <View style={[styles.cardBody, dynamicStyles.cardBg]}>
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'contact' && { backgroundColor: gradient[0] },
              ]}
              onPress={() => setActiveTab('contact')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'contact' && styles.tabTextActive,
                ]}
              >
                Contact
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'services' && { backgroundColor: gradient[0] },
              ]}
              onPress={() => setActiveTab('services')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'services' && styles.tabTextActive,
                ]}
              >
                Services
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'contact' && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Linking.openURL(`tel:${cardData.phone}`)}
                >
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Call Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Linking.openURL(`sms:${cardData.phone}`)}
                >
                  <Ionicons name="chatbubble" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Send Text</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Linking.openURL(`mailto:${cardData.email}`)}
                >
                  <Ionicons name="mail" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Linking.openURL(`${cardData.tavvyProfileUrl}/quote`)}
                >
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Request Quote</Text>
                </TouchableOpacity>
              </>
            )}

            {activeTab === 'services' && (
              <>
                {cardData.services.map((service, index) => (
                  <View key={index} style={styles.serviceItem}>
                    <Text style={[styles.serviceText, dynamicStyles.text]}>{service}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Social Links */}
          <View style={styles.socialLinksContainer}>
            {cardData.socialLinks.instagram && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('instagram', cardData.socialLinks.instagram)}
              >
                <Ionicons name="logo-instagram" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            {cardData.socialLinks.facebook && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('facebook', cardData.socialLinks.facebook)}
              >
                <Ionicons name="logo-facebook" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            {cardData.socialLinks.website && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('website', cardData.socialLinks.website)}
              >
                <Ionicons name="globe" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openSocialLink('tavvy')}
            >
              <Text style={styles.tavvyIcon}>T</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => openSocialLink('portfolio')}
            >
              <Ionicons name="briefcase" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareCard}
            >
              <Ionicons name="share-outline" size={20} color="#374151" />
              <Text style={styles.shareButtonText}>Share Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: gradient[0] }]}
              onPress={saveContactToPhone}
            >
              <Ionicons name={saveSuccess ? 'checkmark' : 'download'} size={20} color="#fff" />
              <Text style={styles.saveButtonText}>
                {saveSuccess ? 'Saved!' : 'Save Contact'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => setShowQRModal(true)}
            >
              <Ionicons name="qr-code" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQRModal(false)}
        >
          <View style={[styles.qrModalContent, dynamicStyles.cardBg]}>
            <Text style={[styles.qrModalTitle, dynamicStyles.text]}>Scan to Save</Text>
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={cardUrl}
                size={200}
                backgroundColor="white"
                color="black"
              />
            </View>
            <Text style={[styles.qrModalSubtitle, dynamicStyles.textSecondary]}>
              Scan this QR code to open {cardData.companyName}'s digital card
            </Text>
            <TouchableOpacity
              style={styles.qrModalClose}
              onPress={() => setShowQRModal(false)}
            >
              <Text style={styles.qrModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  tavvyBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 35,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tavvyBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  profilePhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profilePhotoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyInfo: {
    alignItems: 'center',
  },
  companyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  verifiedBadge: {
    backgroundColor: '#3B82F6',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  cardBody: {
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 25,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  serviceText: {
    fontSize: 15,
  },
  socialLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tavvyIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  shareButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 25,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  qrButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
  },
  qrModalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrModalClose: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    alignItems: 'center',
  },
  qrModalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
});
