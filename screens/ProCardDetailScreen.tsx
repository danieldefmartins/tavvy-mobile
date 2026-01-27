/**
 * ProCardDetailScreen.tsx
 * Full Pro Card view from wallet
 * Path: screens/ProCardDetailScreen.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
  Alert,
  Linking,
  Share,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import * as Contacts from 'expo-contacts';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WALLET_STORAGE_KEY = '@tavvy_wallet_cards';

interface ProCardData {
  id: string;
  slug: string;
  company_name: string;
  tagline: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  category: string;
  gradient_color_1: string;
  gradient_color_2: string;
  profile_photo_url: string | null;
  logo_url: string | null;
  verified: boolean;
  enabled_tabs: string[];
  services: string[];
  social_instagram: string | null;
  social_facebook: string | null;
  social_website: string | null;
  social_tiktok: string | null;
  about_text: string | null;
}

export default function ProCardDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useThemeContext();
  
  const { cardId, slug, card: passedCard } = route.params || {};
  
  const [cardData, setCardData] = useState<ProCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contact');
  const [showQR, setShowQR] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Load card data
  useEffect(() => {
    loadCardData();
    checkIfSaved();
  }, [cardId, slug]);

  const loadCardData = async () => {
    try {
      // If we have a passed card with basic info, use it initially
      if (passedCard) {
        setCardData({
          id: passedCard.id,
          slug: passedCard.slug || passedCard.id,
          company_name: passedCard.companyName,
          tagline: passedCard.tagline || '',
          phone: passedCard.phone,
          email: passedCard.email,
          city: passedCard.city,
          state: passedCard.state,
          category: passedCard.category,
          gradient_color_1: passedCard.gradientColors?.[0] || '#8B5CF6',
          gradient_color_2: passedCard.gradientColors?.[1] || '#6366F1',
          profile_photo_url: passedCard.profilePhoto || null,
          logo_url: null,
          verified: passedCard.verified || false,
          enabled_tabs: ['contact', 'services'],
          services: passedCard.services || [],
          social_instagram: null,
          social_facebook: null,
          social_website: null,
          social_tiktok: null,
          about_text: null,
        });
        setIsLoading(false);
      }

      // Fetch full data from database
      let query;
      if (slug) {
        query = supabase.from('pro_cards').select('*').eq('slug', slug).single();
      } else if (cardId) {
        query = supabase.from('pro_cards').select('*').eq('id', cardId).single();
      } else {
        setIsLoading(false);
        return;
      }

      const { data, error } = await query;

      if (!error && data) {
        setCardData(data);
        if (data.enabled_tabs && data.enabled_tabs.length > 0) {
          setActiveTab(data.enabled_tabs[0]);
        }
      }
    } catch (error) {
      console.error('Error loading card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const localCards = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
      if (localCards) {
        const cards = JSON.parse(localCards);
        const found = cards.find((c: any) => c.id === cardId || c.slug === slug);
        setIsSaved(!!found);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  // Save to wallet
  const saveToWallet = async () => {
    if (!cardData) return;

    try {
      // Get existing cards
      const localCards = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
      const cards = localCards ? JSON.parse(localCards) : [];

      // Check if already saved
      if (cards.find((c: any) => c.id === cardData.id)) {
        Alert.alert('Already Saved', 'This card is already in your wallet.');
        return;
      }

      // Add new card
      const newCard = {
        id: cardData.id,
        slug: cardData.slug,
        companyName: cardData.company_name,
        category: cardData.category,
        city: cardData.city,
        state: cardData.state,
        phone: cardData.phone,
        email: cardData.email,
        gradientColors: [cardData.gradient_color_1, cardData.gradient_color_2],
        profilePhoto: cardData.profile_photo_url,
        verified: cardData.verified,
        savedAt: new Date().toISOString(),
      };

      cards.unshift(newCard);
      await AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(cards));

      // Also save to database if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_wallet').insert({
          user_id: user.id,
          card_id: cardData.id,
        });
      }

      setIsSaved(true);
      Alert.alert('Saved!', `${cardData.company_name} has been added to your wallet.`);
    } catch (error) {
      console.error('Error saving to wallet:', error);
      Alert.alert('Error', 'Failed to save card. Please try again.');
    }
  };

  // Save contact to phone
  const saveContactToPhone = async () => {
    if (!cardData) return;

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to contacts to save this card.');
        return;
      }

      const contact: Contacts.Contact = {
        [Contacts.Fields.FirstName]: cardData.company_name,
        [Contacts.Fields.Company]: cardData.company_name,
        [Contacts.Fields.JobTitle]: cardData.category,
        [Contacts.Fields.PhoneNumbers]: cardData.phone ? [
          { label: 'work', number: cardData.phone },
        ] : [],
        [Contacts.Fields.Emails]: cardData.email ? [
          { label: 'work', email: cardData.email },
        ] : [],
        [Contacts.Fields.Addresses]: (cardData.city || cardData.state) ? [
          {
            label: 'work',
            city: cardData.city,
            region: cardData.state,
            country: 'USA',
          },
        ] : [],
      };

      await Contacts.addContactAsync(contact);
      Alert.alert('Success', `${cardData.company_name} has been saved to your contacts!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    }
  };

  // Share card
  const shareCard = async () => {
    if (!cardData) return;

    const cardUrl = `https://pros.tavvy.com/pro/${cardData.slug}`;
    try {
      await Share.share({
        message: `Check out ${cardData.company_name}${cardData.tagline ? ' - ' + cardData.tagline : ''}\n${cardUrl}`,
        url: cardUrl,
        title: cardData.company_name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Open social link
  const openSocialLink = (type: string, value: string | null) => {
    if (!value) return;
    let url = '';
    switch (type) {
      case 'instagram':
        url = value.startsWith('http') ? value : `https://instagram.com/${value}`;
        break;
      case 'facebook':
        url = value.startsWith('http') ? value : `https://facebook.com/${value}`;
        break;
      case 'website':
        url = value.startsWith('http') ? value : `https://${value}`;
        break;
      case 'tiktok':
        url = value.startsWith('http') ? value : `https://tiktok.com/@${value.replace('@', '')}`;
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

  if (isLoading || !cardData) {
    return (
      <View style={[styles.container, dynamicStyles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const gradient: [string, string] = [cardData.gradient_color_1, cardData.gradient_color_2];
  const cardUrl = `https://pros.tavvy.com/pro/${cardData.slug}`;

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView style={styles.scrollView} bounces={false}>
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
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Tavvy Pro</Text>
          </View>

          {/* Profile Photo */}
          <View style={styles.profileContainer}>
            {cardData.profile_photo_url ? (
              <Image 
                source={{ uri: cardData.profile_photo_url }} 
                style={styles.profilePhoto}
              />
            ) : (
              <View style={styles.profilePhotoPlaceholder}>
                <Ionicons name="person" size={40} color="rgba(255,255,255,0.6)" />
              </View>
            )}
          </View>

          {/* Company Info */}
          <View style={styles.companyInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.companyName}>{cardData.company_name}</Text>
              {cardData.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </View>
            {cardData.tagline && (
              <Text style={styles.tagline}>{cardData.tagline}</Text>
            )}
            <Text style={styles.location}>
              {cardData.category}
              {cardData.city && ` • ${cardData.city}`}
              {cardData.state && `, ${cardData.state}`}
            </Text>
          </View>
        </LinearGradient>

        {/* Card Body */}
        <View style={[styles.body, dynamicStyles.cardBg]}>
          {/* Tabs */}
          {cardData.enabled_tabs && cardData.enabled_tabs.length > 0 && (
            <View style={styles.tabs}>
              {cardData.enabled_tabs.map((tabId) => (
                <TouchableOpacity
                  key={tabId}
                  style={[
                    styles.tab,
                    activeTab === tabId && { backgroundColor: gradient[0] },
                  ]}
                  onPress={() => setActiveTab(tabId)}
                >
                  <Text style={[
                    styles.tabText,
                    activeTab === tabId && styles.tabTextActive,
                  ]}>
                    {tabId.charAt(0).toUpperCase() + tabId.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'contact' && (
              <>
                {cardData.phone && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Linking.openURL(`tel:${cardData.phone}`)}
                  >
                    <Ionicons name="call" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Call Now</Text>
                  </TouchableOpacity>
                )}
                {cardData.phone && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Linking.openURL(`sms:${cardData.phone}`)}
                  >
                    <Ionicons name="chatbubble" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Send Text</Text>
                  </TouchableOpacity>
                )}
                {cardData.email && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Linking.openURL(`mailto:${cardData.email}`)}
                  >
                    <Ionicons name="mail" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Email</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Request Quote</Text>
                </TouchableOpacity>
              </>
            )}

            {activeTab === 'services' && (
              <View style={styles.servicesList}>
                {cardData.services && cardData.services.length > 0 ? (
                  cardData.services.map((service, index) => (
                    <View key={index} style={styles.serviceItem}>
                      <Text style={[styles.serviceText, dynamicStyles.text]}>{service}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>No services listed</Text>
                )}
              </View>
            )}

            {activeTab === 'about' && (
              <View style={styles.aboutSection}>
                {cardData.about_text ? (
                  <Text style={[styles.aboutText, dynamicStyles.text]}>{cardData.about_text}</Text>
                ) : (
                  <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>No about information available</Text>
                )}
              </View>
            )}

            {activeTab === 'reviews' && (
              <View style={styles.reviewsSection}>
                <Text style={[styles.emptyText, dynamicStyles.textSecondary]}>Reviews coming soon</Text>
              </View>
            )}
          </View>

          {/* Social Links */}
          <View style={styles.socialLinks}>
            {cardData.social_instagram && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('instagram', cardData.social_instagram)}
              >
                <Ionicons name="logo-instagram" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            {cardData.social_facebook && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('facebook', cardData.social_facebook)}
              >
                <Ionicons name="logo-facebook" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            {cardData.social_website && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('website', cardData.social_website)}
              >
                <Ionicons name="globe" size={22} color="#fff" />
              </TouchableOpacity>
            )}
            {cardData.social_tiktok && (
              <TouchableOpacity
                style={styles.socialButton}
                onPress={() => openSocialLink('tiktok', cardData.social_tiktok)}
              >
                <Text style={styles.tiktokText}>TT</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.tavvyText}>T</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.shareButton} onPress={shareCard}>
              <Ionicons name="share-outline" size={20} color="#374151" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: gradient[0] }]}
              onPress={saveContactToPhone}
            >
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Contact</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.qrButton}
              onPress={() => setShowQR(true)}
            >
              <Ionicons name="qr-code" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Save to Wallet */}
          {!isSaved && (
            <TouchableOpacity
              style={styles.walletBanner}
              onPress={saveToWallet}
            >
              <LinearGradient
                colors={['#F97316', '#EA580C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.walletBannerGradient}
              >
                <View style={styles.walletBannerContent}>
                  <View style={styles.walletIcon}>
                    <Ionicons name="wallet" size={20} color="#fff" />
                  </View>
                  <View style={styles.walletBannerText}>
                    <Text style={styles.walletBannerTitle}>Save to Tavvy Wallet</Text>
                    <Text style={styles.walletBannerSubtitle}>Keep all your contractors in one place</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQR}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQR(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQR(false)}
        >
          <View style={[styles.qrModal, dynamicStyles.cardBg]}>
            <Text style={[styles.qrTitle, dynamicStyles.text]}>Scan to Save</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={cardUrl}
                size={200}
                backgroundColor="#fff"
              />
            </View>
            <Text style={[styles.qrSubtitle, dynamicStyles.textSecondary]}>
              Scan this QR code to open {cardData.company_name}'s digital card
            </Text>
            <TouchableOpacity
              style={styles.qrCloseButton}
              onPress={() => setShowQR(false)}
            >
              <Text style={styles.qrCloseText}>Close</Text>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  profileContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  profilePhoto: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profilePhotoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  nameRow: {
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  body: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: 400,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
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
    gap: 8,
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 24,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  servicesList: {
    gap: 8,
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
    fontSize: 14,
  },
  aboutSection: {
    paddingVertical: 8,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
  },
  reviewsSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tiktokText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  tavvyText: {
    color: '#fff',
    fontSize: 14,
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
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 24,
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
    borderRadius: 24,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  qrButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletBanner: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  walletBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  walletBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletBannerText: {},
  walletBannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  walletBannerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  qrModal: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
  },
  qrSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrCloseButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    alignItems: 'center',
  },
  qrCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
});
