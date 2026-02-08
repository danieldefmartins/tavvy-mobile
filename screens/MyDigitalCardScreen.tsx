/**
 * MyDigitalCardScreen.tsx
 * View and share your digital card with all sharing methods
 * Path: screens/MyDigitalCardScreen.tsx
 *
 * SHARING METHODS:
 * - QR Code (scan to open)
 * - NFC Tap (phone to phone)
 * - SMS/iMessage
 * - WhatsApp
 * - Email
 * - AirDrop (via native share)
 * - Copy Link
 * - Social Media
 * - Save to Contacts (vCard)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Share,
  Linking,
  Image,
  Modal,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import QRCode from 'react-native-qrcode-svg';
import * as Contacts from 'expo-contacts';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_URL_BASE = 'https://tavvy.com/';

// V2 Design System Colors
const V2_COLORS = {
  background: '#0A0A0F',
  cardBackground: '#1A1A24',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  border: 'rgba(255, 255, 255, 0.1)',
};

interface CardLink {
  id?: string;
  title: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

interface CardData {
  id?: string;
  slug?: string;
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  state: string;
  gradientColors: [string, string];
  profilePhotoUri: string | null;
  socialInstagram: string;
  socialFacebook: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialTiktok: string;
  links?: CardLink[];
}

// Link icons mapping
const LINK_ICONS: { [key: string]: string } = {
  globe: 'globe-outline',
  cart: 'cart-outline',
  calendar: 'calendar-outline',
  document: 'document-text-outline',
  play: 'play-circle-outline',
  music: 'musical-notes-outline',
  gift: 'gift-outline',
  mail: 'mail-outline',
  link: 'link-outline',
};

export default function MyDigitalCardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cardData, setCardData] = useState<CardData>(route.params?.cardData || {});
  const [hasCard, setHasCard] = useState(false);
  const [activeTab, setActiveTab] = useState<'card' | 'links'>('card');
  
  const cardUrl = CARD_URL_BASE + (cardData.slug || 'preview');

  // Fetch user's digital card from database
  const fetchUserCard = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // If cardData was passed via params, use it
    if (route.params?.cardData?.slug) {
      setCardData(route.params.cardData);
      setHasCard(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('digital_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        setHasCard(false);
        setIsLoading(false);
        return;
      }

      // Also fetch links for this card
      const { data: linksData } = await supabase
        .from('card_links')
        .select('*')
        .eq('card_id', data.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      const card: CardData = {
        id: data.id,
        slug: data.slug,
        fullName: data.full_name,
        title: data.title || '',
        company: data.company || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        city: data.city || '',
        state: data.state || '',
        gradientColors: [data.gradient_color_1 || '#8B5CF6', data.gradient_color_2 || '#4F46E5'],
        profilePhotoUri: data.profile_photo_url,
        socialInstagram: data.social_instagram || '',
        socialFacebook: data.social_facebook || '',
        socialLinkedin: data.social_linkedin || '',
        socialTwitter: data.social_twitter || '',
        socialTiktok: data.social_tiktok || '',
        links: linksData?.map(l => ({
          id: l.id,
          title: l.title,
          url: l.url,
          icon: l.icon || 'link',
          sort_order: l.sort_order,
          is_active: l.is_active,
        })) || [],
      };

      setCardData(card);
      setHasCard(true);
    } catch (error) {
      console.error('Error fetching card:', error);
      setHasCard(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, route.params?.cardData]);

  // Fetch card on focus (in case user just created one)
  useFocusEffect(
    useCallback(() => {
      fetchUserCard();
    }, [fetchUserCard])
  );

  // Generate vCard string
  const generateVCard = (): string => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${cardData.fullName}`,
      `N:${cardData.fullName.split(' ').reverse().join(';')};;;`,
      cardData.company ? `ORG:${cardData.company}` : '',
      cardData.title ? `TITLE:${cardData.title}` : '',
      cardData.phone ? `TEL;TYPE=CELL:${cardData.phone}` : '',
      cardData.email ? `EMAIL:${cardData.email}` : '',
      cardData.website ? `URL:${cardData.website.startsWith('http') ? cardData.website : 'https://' + cardData.website}` : '',
      (cardData.city || cardData.state) ? `ADR;TYPE=WORK:;;${cardData.city};${cardData.state};;;` : '',
      `NOTE:Digital card created with Tavvy - ${cardUrl}`,
      'END:VCARD',
    ].filter(Boolean).join('\n');
    return vcard;
  };

  // Save to phone contacts
  const handleSaveToContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to contacts to save this card.');
        return;
      }

      const contact: Contacts.Contact = {
        contactType: Contacts.ContactTypes.Person,
        name: cardData.fullName,
        firstName: cardData.fullName.split(' ')[0],
        lastName: cardData.fullName.split(' ').slice(1).join(' '),
        company: cardData.company,
        jobTitle: cardData.title,
        phoneNumbers: cardData.phone ? [{ label: 'mobile', number: cardData.phone }] : [],
        emails: cardData.email ? [{ label: 'work', email: cardData.email }] : [],
        urlAddresses: cardData.website ? [{ label: 'website', url: cardData.website }] : [],
        note: `Digital card: ${cardUrl}`,
      };

      await Contacts.addContactAsync(contact);
      Alert.alert('Success!', `${cardData.fullName} has been saved to your contacts.`);
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    }
  };

  // Share via native share sheet (AirDrop, Messages, etc.)
  const handleNativeShare = async () => {
    try {
      // On iOS, only pass URL so Copy copies just the URL
      // On Android, pass message since it doesn't support url separately
      if (Platform.OS === 'ios') {
        await Share.share({
          url: cardUrl,
        });
      } else {
        await Share.share({
          message: cardUrl,
          title: `${cardData.fullName}'s Digital Card`,
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Share via SMS
  const handleShareSMS = () => {
    const message = encodeURIComponent(`Check out my digital card: ${cardUrl}`);
    Linking.openURL(`sms:&body=${message}`);
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`Check out my digital card: ${cardUrl}`);
    Linking.openURL(`whatsapp://send?text=${message}`).catch(() => {
      Alert.alert('WhatsApp Not Found', 'Please install WhatsApp to share via this method.');
    });
  };

  // Share via Email
  const handleShareEmail = () => {
    const subject = encodeURIComponent(`${cardData.fullName}'s Digital Business Card`);
    const body = encodeURIComponent(
      `Hi,\n\nHere's my digital business card:\n${cardUrl}\n\nYou can save my contact info directly from the card.\n\nBest regards,\n${cardData.fullName}`
    );
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
  };

  // Copy link to clipboard
  const handleCopyLink = () => {
    Clipboard.setString(cardUrl);
    Alert.alert('Copied!', `${cardUrl} copied to clipboard.`);
  };

  // Share card link via native share sheet
  const handleShareVCard = async () => {
    setIsSharing(true);
    try {
      // On iOS, only pass URL so Copy copies just the URL
      // On Android, pass message since it doesn't support url separately
      if (Platform.OS === 'ios') {
        await Share.share({
          url: cardUrl,
        });
      } else {
        await Share.share({
          message: cardUrl,
          title: `${cardData.fullName}'s Digital Card`,
        });
      }
    } catch (error) {
      console.error('Error sharing card:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Open social links
  const openSocialLink = (platform: string, username: string) => {
    let url = '';
    switch (platform) {
      case 'instagram':
        url = `https://instagram.com/${username}`;
        break;
      case 'facebook':
        url = username.startsWith('http') ? username : `https://facebook.com/${username}`;
        break;
      case 'linkedin':
        url = username.startsWith('http') ? username : `https://linkedin.com/in/${username}`;
        break;
      case 'twitter':
        url = `https://twitter.com/${username}`;
        break;
      case 'tiktok':
        url = `https://tiktok.com/@${username}`;
        break;
    }
    if (url) Linking.openURL(url);
  };

  const hasSocialLinks = cardData.socialInstagram || cardData.socialFacebook || 
                         cardData.socialLinkedin || cardData.socialTwitter || cardData.socialTiktok;

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: V2_COLORS.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: V2_COLORS.textSecondary }]}>Loading your card...</Text>
        </View>
      </View>
    );
  }

  // No card state - prompt to create one
  if (!hasCard && !route.params?.cardData) {
    return (
      <View style={[styles.container, { backgroundColor: V2_COLORS.background }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.noCardContainer}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.noCardBackButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <LinearGradient
            colors={['#8B5CF6', '#4F46E5']}
            style={styles.noCardIcon}
          >
            <Ionicons name="id-card" size={48} color="#fff" />
          </LinearGradient>
          
          <Text style={[styles.noCardTitle, { color: V2_COLORS.text }]}>No Digital Card Yet</Text>
          <Text style={[styles.noCardSubtitle, { color: V2_COLORS.textSecondary }]}>
            Create your digital business card to share your contact info instantly with anyone.
          </Text>
          
          <TouchableOpacity 
            style={styles.createCardButton}
            onPress={() => navigation.navigate('ECardTemplateGallery', { mode: 'create' })}
          >
            <LinearGradient
              colors={['#8B5CF6', '#4F46E5']}
              style={styles.createCardButtonGradient}
            >
              <Ionicons name="add" size={24} color="#fff" />
              <Text style={styles.createCardButtonText}>Create My Card</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Display */}
        <LinearGradient
          colors={cardData.gradientColors || ['#8B5CF6', '#4F46E5']}
          style={styles.card}
        >
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Edit Button */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('ECardCreate', { mode: 'edit', cardId: cardData.id, existingData: cardData })} 
            style={styles.editButton}
          >
            <Ionicons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            {cardData.profilePhotoUri ? (
              <Image source={{ uri: cardData.profilePhotoUri }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={50} color="#fff" />
              </View>
            )}
          </View>

          {/* Name & Info */}
          <Text style={styles.name}>{cardData.fullName || 'Your Name'}</Text>
          {cardData.title && <Text style={styles.title}>{cardData.title}</Text>}
          {cardData.company && <Text style={styles.company}>{cardData.company}</Text>}
          
          {(cardData.city || cardData.state) && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.location}>
                {[cardData.city, cardData.state].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {cardData.phone && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => Linking.openURL(`tel:${cardData.phone}`)}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            )}
            {cardData.phone && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => Linking.openURL(`sms:${cardData.phone}`)}
              >
                <Ionicons name="chatbubble" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Text</Text>
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
            {cardData.website && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => Linking.openURL(cardData.website.startsWith('http') ? cardData.website : `https://${cardData.website}`)}
              >
                <Ionicons name="globe" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Web</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Social Links */}
          {hasSocialLinks && (
            <View style={styles.socialLinks}>
              {cardData.socialInstagram && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => openSocialLink('instagram', cardData.socialInstagram)}
                >
                  <Ionicons name="logo-instagram" size={24} color="#fff" />
                </TouchableOpacity>
              )}
              {cardData.socialFacebook && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => openSocialLink('facebook', cardData.socialFacebook)}
                >
                  <Ionicons name="logo-facebook" size={24} color="#fff" />
                </TouchableOpacity>
              )}
              {cardData.socialLinkedin && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => openSocialLink('linkedin', cardData.socialLinkedin)}
                >
                  <Ionicons name="logo-linkedin" size={24} color="#fff" />
                </TouchableOpacity>
              )}
              {cardData.socialTwitter && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => openSocialLink('twitter', cardData.socialTwitter)}
                >
                  <Ionicons name="logo-twitter" size={24} color="#fff" />
                </TouchableOpacity>
              )}
              {cardData.socialTiktok && (
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => openSocialLink('tiktok', cardData.socialTiktok)}
                >
                  <Ionicons name="logo-tiktok" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Tavvy Logo */}
          <View style={styles.tavvyBranding}>
            <Image 
              source={require('../assets/brand/tavvy-wordmark-white.png')}
              style={styles.tavvyLogo}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>

        {/* Toggle Tabs - Card / Links */}
        {cardData.links && cardData.links.length > 0 && (
          <View style={[styles.toggleContainer, { backgroundColor: V2_COLORS.cardBackground }]}>
            <TouchableOpacity
              style={[styles.toggleTab, activeTab === 'card' && styles.toggleTabActive]}
              onPress={() => setActiveTab('card')}
            >
              <Ionicons name="id-card-outline" size={18} color={activeTab === 'card' ? '#fff' : theme.textSecondary} />
              <Text style={[styles.toggleTabText, activeTab === 'card' && styles.toggleTabTextActive]}>Card</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleTab, activeTab === 'links' && styles.toggleTabActive]}
              onPress={() => setActiveTab('links')}
            >
              <Ionicons name="link-outline" size={18} color={activeTab === 'links' ? '#fff' : theme.textSecondary} />
              <Text style={[styles.toggleTabText, activeTab === 'links' && styles.toggleTabTextActive]}>Links</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Links Section */}
        {activeTab === 'links' && cardData.links && cardData.links.length > 0 && (
          <View style={[styles.linksSection, { backgroundColor: V2_COLORS.cardBackground }]}>
            <Text style={[styles.linksSectionTitle, { color: V2_COLORS.text }]}>My Links</Text>
            {cardData.links.map((link, index) => (
              <TouchableOpacity
                key={link.id || index}
                style={[styles.linkButton, { backgroundColor: cardData.gradientColors[0] }]}
                onPress={() => Linking.openURL(link.url)}
              >
                <Ionicons 
                  name={(LINK_ICONS[link.icon] || 'link-outline') as any} 
                  size={20} 
                  color="#fff" 
                />
                <Text style={styles.linkButtonText}>{link.title}</Text>
                <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Share Section */}
        <View style={[styles.shareSection, { backgroundColor: V2_COLORS.cardBackground }]}>
          <Text style={[styles.shareSectionTitle, { color: V2_COLORS.text }]}>Share Your Card</Text>
          
          {/* QR Code Button */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: V2_COLORS.background }]}
            onPress={() => setShowQRModal(true)}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="qr-code" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: V2_COLORS.text }]}>QR Code</Text>
              <Text style={[styles.shareOptionSubtitle, { color: V2_COLORS.textSecondary }]}>Let others scan to view your card</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={V2_COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Share via... */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: V2_COLORS.background }]}
            onPress={handleNativeShare}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="share" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: V2_COLORS.text }]}>Share via...</Text>
              <Text style={[styles.shareOptionSubtitle, { color: V2_COLORS.textSecondary }]}>AirDrop, Messages, and more</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={V2_COLORS.textSecondary} />
          </TouchableOpacity>

          {/* SMS */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: V2_COLORS.background }]}
            onPress={handleShareSMS}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#22C55E' }]}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: V2_COLORS.text }]}>SMS / Text</Text>
              <Text style={[styles.shareOptionSubtitle, { color: V2_COLORS.textSecondary }]}>Send via text message</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={V2_COLORS.textSecondary} />
          </TouchableOpacity>

          {/* WhatsApp */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: V2_COLORS.background }]}
            onPress={handleShareWhatsApp}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: V2_COLORS.text }]}>WhatsApp</Text>
              <Text style={[styles.shareOptionSubtitle, { color: V2_COLORS.textSecondary }]}>Share on WhatsApp</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={V2_COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: V2_COLORS.background }]}
            onPress={handleShareEmail}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="mail" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: V2_COLORS.text }]}>Email</Text>
              <Text style={[styles.shareOptionSubtitle, { color: V2_COLORS.textSecondary }]}>Send via email</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={V2_COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Copy Link */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: V2_COLORS.background }]}
            onPress={handleCopyLink}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#6366F1' }]}>
              <Ionicons name="link" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: V2_COLORS.text }]}>Copy Link</Text>
              <Text style={[styles.shareOptionSubtitle, { color: V2_COLORS.textSecondary }]}>Copy card URL to clipboard</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={V2_COLORS.textSecondary} />
          </TouchableOpacity>

          {/* Share Contact File */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: V2_COLORS.background }]}
            onPress={handleShareVCard}
            disabled={isSharing}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#F59E0B' }]}>
              {isSharing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="person-add" size={24} color="#fff" />
              )}
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: V2_COLORS.text }]}>Share Contact File</Text>
              <Text style={[styles.shareOptionSubtitle, { color: V2_COLORS.textSecondary }]}>Send as .vcf contact card</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={V2_COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Save to Contacts */}
        <TouchableOpacity 
          style={styles.saveContactButton}
          onPress={handleSaveToContacts}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.saveContactGradient}
          >
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.saveContactText}>Save to My Contacts</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowQRModal(false)}
            >
              <Ionicons name="close-circle" size={32} color="#64748B" />
            </TouchableOpacity>
            
            <Text style={styles.qrTitle}>Scan to View Card</Text>
            <Text style={styles.qrSubtitle}>
              Point your camera at this QR code
            </Text>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={cardUrl}
                size={200}
                backgroundColor="#fff"
                color="#000"
              />
            </View>
            
            <Text style={styles.qrUrl}>{cardUrl}</Text>
            
            <TouchableOpacity 
              style={styles.qrCopyButton}
              onPress={handleCopyLink}
            >
              <Ionicons name="copy" size={18} color="#fff" />
              <Text style={styles.qrCopyText}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  card: {
    margin: 20,
    borderRadius: 28,
    padding: 28,
    paddingTop: Platform.OS === 'ios' ? 64 : 56,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 44,
    left: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 20,
  },
  editButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 44,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 20,
  },
  photoContainer: {
    marginBottom: 20,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  name: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginTop: 6,
    textAlign: 'center',
  },
  company: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  location: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 28,
    gap: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 10,
    minWidth: 100,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  socialLinks: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 18,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tavvyBranding: {
    alignItems: 'center',
    marginTop: 28,
    paddingTop: 20,
    width: '100%',
  },
  tavvyLogo: {
    height: 18,
    width: 80,
    opacity: 0.5,
  },
  shareSection: {
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 20,
  },
  shareSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  shareIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareOptionText: {
    flex: 1,
    marginLeft: 16,
  },
  shareOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  shareOptionSubtitle: {
    fontSize: 14,
    marginTop: 3,
  },
  saveContactButton: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveContactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveContactText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModal: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalClose: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 6,
  },
  qrTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: -0.3,
    color: '#1E293B',
  },
  qrSubtitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 28,
    color: '#64748B',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrUrl: {
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    color: '#64748B',
  },
  qrCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    gap: 8,
  },
  qrCopyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  noCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  noCardBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    padding: 10,
  },
  noCardIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  noCardTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  noCardSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  createCardButton: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  createCardButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 10,
  },
  createCardButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Toggle tabs styles
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 6,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  toggleTabActive: {
    backgroundColor: '#8B5CF6',
  },
  toggleTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleTabTextActive: {
    color: '#fff',
  },
  // Links section styles
  linksSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
  },
  linksSectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    marginBottom: 12,
    gap: 12,
  },
  linkButtonText: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
