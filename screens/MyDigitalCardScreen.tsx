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

import React, { useState, useRef, useEffect } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import QRCode from 'react-native-qrcode-svg';
import * as Contacts from 'expo-contacts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_URL_BASE = 'https://tavvy.com/card/';

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
}

export default function MyDigitalCardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useThemeContext();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const cardData: CardData = route.params?.cardData || {};
  const cardUrl = CARD_URL_BASE + (cardData.slug || 'preview');

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
      const message = cardData.company 
        ? `Check out ${cardData.fullName}'s digital card from ${cardData.company}: ${cardUrl}`
        : `Check out ${cardData.fullName}'s digital card: ${cardUrl}`;
      
      await Share.share({
        message,
        url: cardUrl,
        title: `${cardData.fullName}'s Digital Card`,
      });
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
    Alert.alert('Copied!', 'Card link copied to clipboard.');
  };

  // Share card link via native share sheet
  const handleShareVCard = async () => {
    setIsSharing(true);
    try {
      await Share.share({
        message: `Check out my digital business card: ${cardUrl}`,
        title: `${cardData.fullName}'s Digital Card`,
        url: cardUrl,
      });
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
            onPress={() => navigation.navigate('CreateDigitalCard')} 
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

          {/* Powered by Tavvy */}
          <View style={styles.poweredBy}>
            <Text style={styles.poweredByText}>Powered by Tavvy</Text>
          </View>
        </LinearGradient>

        {/* Share Section */}
        <View style={[styles.shareSection, { backgroundColor: theme.card }]}>
          <Text style={[styles.shareSectionTitle, { color: theme.text }]}>Share Your Card</Text>
          
          {/* QR Code Button */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: theme.background }]}
            onPress={() => setShowQRModal(true)}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="qr-code" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: theme.text }]}>QR Code</Text>
              <Text style={[styles.shareOptionSubtitle, { color: theme.textSecondary }]}>Let others scan to view your card</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Share via... */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: theme.background }]}
            onPress={handleNativeShare}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#3B82F6' }]}>
              <Ionicons name="share" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: theme.text }]}>Share via...</Text>
              <Text style={[styles.shareOptionSubtitle, { color: theme.textSecondary }]}>AirDrop, Messages, and more</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* SMS */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: theme.background }]}
            onPress={handleShareSMS}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#22C55E' }]}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: theme.text }]}>SMS / Text</Text>
              <Text style={[styles.shareOptionSubtitle, { color: theme.textSecondary }]}>Send via text message</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* WhatsApp */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: theme.background }]}
            onPress={handleShareWhatsApp}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#25D366' }]}>
              <Ionicons name="logo-whatsapp" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: theme.text }]}>WhatsApp</Text>
              <Text style={[styles.shareOptionSubtitle, { color: theme.textSecondary }]}>Share on WhatsApp</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: theme.background }]}
            onPress={handleShareEmail}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="mail" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: theme.text }]}>Email</Text>
              <Text style={[styles.shareOptionSubtitle, { color: theme.textSecondary }]}>Send via email</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Copy Link */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: theme.background }]}
            onPress={handleCopyLink}
          >
            <View style={[styles.shareIconContainer, { backgroundColor: '#6366F1' }]}>
              <Ionicons name="link" size={24} color="#fff" />
            </View>
            <View style={styles.shareOptionText}>
              <Text style={[styles.shareOptionTitle, { color: theme.text }]}>Copy Link</Text>
              <Text style={[styles.shareOptionSubtitle, { color: theme.textSecondary }]}>Copy card URL to clipboard</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {/* Share Contact File */}
          <TouchableOpacity 
            style={[styles.shareOption, { backgroundColor: theme.background }]}
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
              <Text style={[styles.shareOptionTitle, { color: theme.text }]}>Share Contact File</Text>
              <Text style={[styles.shareOptionSubtitle, { color: theme.textSecondary }]}>Send as .vcf contact card</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
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
          <View style={[styles.qrModal, { backgroundColor: theme.card }]}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowQRModal(false)}
            >
              <Ionicons name="close" size={28} color={theme.text} />
            </TouchableOpacity>
            
            <Text style={[styles.qrTitle, { color: theme.text }]}>Scan to View Card</Text>
            <Text style={[styles.qrSubtitle, { color: theme.textSecondary }]}>
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
            
            <Text style={[styles.qrUrl, { color: theme.textSecondary }]}>{cardUrl}</Text>
            
            <TouchableOpacity 
              style={styles.qrCopyButton}
              onPress={handleCopyLink}
            >
              <Ionicons name="copy" size={18} color="#8B5CF6" />
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
  poweredBy: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    width: '100%',
    alignItems: 'center',
  },
  poweredByText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModal: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
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
  },
  qrSubtitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 28,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrUrl: {
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
  },
  qrCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    gap: 8,
  },
  qrCopyText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '700',
  },
});
