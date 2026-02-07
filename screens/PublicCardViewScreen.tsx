/**
 * PublicCardViewScreen.tsx
 * View a shared digital card (public view)
 * Path: screens/PublicCardViewScreen.tsx
 *
 * FEATURES:
 * - View anyone's digital card
 * - Save to Tavvy Wallet
 * - Save to phone contacts
 * - Call, Text, Email actions
 * - "Powered by Tavvy" branding
 */

import React, { useState, useEffect } from 'react';
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
  Linking,
  Image,
  ActivityIndicator,
  Share,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import * as Contacts from 'expo-contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WALLET_STORAGE_KEY = '@tavvy_wallet_cards';

interface CardData {
  id: string;
  slug: string;
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  city: string;
  state: string;
  gradientColors: [string, string];
  profilePhotoUrl: string | null;
  socialInstagram: string;
  socialFacebook: string;
  socialLinkedin: string;
  socialTwitter: string;
  socialTiktok: string;
  socialYoutube: string;
  socialSnapchat: string;
  socialPinterest: string;
  socialWhatsapp: string;
  featuredSocials: ({ platform: string; url: string } | string)[];
  galleryImages: { id: string; url: string; caption?: string }[];
  videos: { type: string; url: string }[];
  links: { id: string; title: string; url: string; icon: string }[];
  viewCount: number;
}

export default function PublicCardViewScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useThemeContext();
  const { user } = useAuth();
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavedToWallet, setIsSavedToWallet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const cardSlug = route.params?.slug;
  const cardId = route.params?.cardId;

  useEffect(() => {
    if (cardSlug || cardId) {
      loadCardData();
    }
  }, [cardSlug, cardId]);

  const loadCardData = async () => {
    setIsLoading(true);
    try {
      let query = supabase.from('digital_cards').select('*');
      
      if (cardSlug) {
        query = query.eq('slug', cardSlug);
      } else if (cardId) {
        query = query.eq('id', cardId);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        Alert.alert('Card Not Found', 'This digital card could not be found.');
        navigation.goBack();
        return;
      }

      // Fetch links from digital_card_links (primary) then card_links (fallback)
      let linksData: any[] = [];
      const { data: digitalLinksData } = await supabase
        .from('digital_card_links')
        .select('*')
        .eq('card_id', data.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (digitalLinksData && digitalLinksData.length > 0) {
        linksData = digitalLinksData;
      } else {
        const { data: legacyLinksData } = await supabase
          .from('card_links')
          .select('*')
          .eq('card_id', data.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        linksData = legacyLinksData || [];
      }

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
        profilePhotoUrl: data.profile_photo_url,
        socialInstagram: data.social_instagram || '',
        socialFacebook: data.social_facebook || '',
        socialLinkedin: data.social_linkedin || '',
        socialTwitter: data.social_twitter || '',
        socialTiktok: data.social_tiktok || '',
        socialYoutube: data.social_youtube || '',
        socialSnapchat: data.social_snapchat || '',
        socialPinterest: data.social_pinterest || '',
        socialWhatsapp: data.social_whatsapp || '',
        featuredSocials: data.featured_socials ?
          (typeof data.featured_socials === 'string' ? JSON.parse(data.featured_socials) : data.featured_socials)
          : [],
        galleryImages: data.gallery_images ?
          (typeof data.gallery_images === 'string' ? JSON.parse(data.gallery_images) : data.gallery_images)
          : [],
        videos: data.videos ?
          (typeof data.videos === 'string' ? JSON.parse(data.videos) : data.videos)
          : [],
        links: linksData.map((l: any) => ({
          id: l.id,
          title: l.title,
          url: l.url,
          icon: l.icon || 'link',
        })),
        viewCount: data.view_count || 0,
      };

      setCardData(card);

      // Increment view count
      await supabase
        .from('digital_cards')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      // Check if already saved to wallet
      const savedCards = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        setIsSavedToWallet(cards.some((c: any) => c.id === data.id));
      }
    } catch (error) {
      console.error('Error loading card:', error);
      Alert.alert('Error', 'Failed to load the card. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToWallet = async () => {
    if (!cardData) return;
    setIsSaving(true);

    try {
      // Save to local storage
      const savedCards = await AsyncStorage.getItem(WALLET_STORAGE_KEY);
      let cards = savedCards ? JSON.parse(savedCards) : [];
      
      if (!cards.some((c: any) => c.id === cardData.id)) {
        const walletCard = {
          id: cardData.id,
          slug: cardData.slug,
          companyName: cardData.company || cardData.fullName,
          category: cardData.title || 'Contact',
          city: cardData.city,
          state: cardData.state,
          phone: cardData.phone,
          email: cardData.email,
          gradientColors: cardData.gradientColors,
          profilePhoto: cardData.profilePhotoUrl,
          verified: false,
          savedAt: new Date().toISOString(),
        };
        cards.unshift(walletCard);
        await AsyncStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(cards));
      }

      // If user is logged in, also save to database
      if (user) {
        await supabase.from('user_wallet').upsert({
          user_id: user.id,
          card_id: cardData.id,
          saved_at: new Date().toISOString(),
        });
      }

      setIsSavedToWallet(true);
      Alert.alert('Saved!', 'This card has been added to your Tavvy Wallet.');
    } catch (error) {
      console.error('Error saving to wallet:', error);
      Alert.alert('Error', 'Failed to save to wallet. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveToContacts = async () => {
    if (!cardData) return;

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
        note: `Tavvy Card: https://tavvy.com/${cardData.slug}`,
      };

      await Contacts.addContactAsync(contact);
      Alert.alert('Success!', `${cardData.fullName} has been saved to your contacts.`);
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!cardData) return;
    
    try {
      await Share.share({
        message: `Check out ${cardData.fullName}'s digital card: https://tavvy.com/${cardData.slug}`,
        url: `https://tavvy.com/${cardData.slug}`,
        title: `${cardData.fullName}'s Digital Card`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

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

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading card...</Text>
        </View>
      </View>
    );
  }

  if (!cardData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.textSecondary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Card not found</Text>
        </View>
      </View>
    );
  }

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
          colors={cardData.gradientColors}
          style={styles.card}
        >
          {/* Back Button */}
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity 
            onPress={handleShare} 
            style={styles.shareButton}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            {cardData.profilePhotoUrl ? (
              <Image source={{ uri: cardData.profilePhotoUrl }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="person" size={50} color="#fff" />
              </View>
            )}
          </View>

          {/* Name & Info */}
          <Text style={styles.name}>{cardData.fullName}</Text>
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

          {/* Gallery Images */}
          {cardData.galleryImages && cardData.galleryImages.length > 0 && (
            <View style={styles.gallerySection}>
              <View style={styles.galleryGrid}>
                {cardData.galleryImages.slice(0, 9).map((image, index) => (
                  <TouchableOpacity 
                    key={image.id || index} 
                    style={styles.galleryImageContainer}
                    activeOpacity={0.8}
                    onPress={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                  >
                    <Image source={{ uri: image.url }} style={styles.galleryImage} />
                    {index === 8 && cardData.galleryImages.length > 9 && (
                      <View style={styles.galleryMoreOverlay}>
                        <Text style={styles.galleryMoreText}>+{cardData.galleryImages.length - 9}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.galleryCountBadge}>
                <Ionicons name="images" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={styles.galleryCountText}>{cardData.galleryImages.length} photos</Text>
              </View>
            </View>
          )}

          {/* Videos (Tavvy Shorts & External) */}
          {cardData.videos && cardData.videos.length > 0 && (
            <View style={styles.videosSection}>
              {cardData.videos.map((video, index) => {
                if (video.type === 'tavvy_short') {
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.videoCard}
                      onPress={() => Linking.openURL(video.url)}
                    >
                      <Ionicons name="videocam" size={20} color="#00C853" />
                      <Text style={styles.videoCardText}>Tavvy Short</Text>
                      <Ionicons name="play-circle" size={20} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                  );
                } else {
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.videoCard}
                      onPress={() => Linking.openURL(video.url.startsWith('http') ? video.url : `https://${video.url}`)}
                    >
                      <Ionicons name="videocam" size={20} color="#fff" />
                      <Text style={styles.videoCardText}>Video</Text>
                      <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.6)" />
                    </TouchableOpacity>
                  );
                }
              })}
            </View>
          )}

          {/* Website Links */}
          {cardData.links && cardData.links.length > 0 && (
            <View style={styles.linksSection}>
              {cardData.links.map((link, index) => {
                const href = link.url.startsWith('http') ? link.url : `https://${link.url}`;
                return (
                  <TouchableOpacity
                    key={link.id || index}
                    style={styles.linkCard}
                    onPress={() => Linking.openURL(href)}
                  >
                    <Ionicons name={link.icon === 'website' ? 'globe' : 'link'} size={18} color="#fff" />
                    <Text style={styles.linkCardText}>{link.title}</Text>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Powered by Tavvy */}
          <TouchableOpacity 
            style={styles.poweredBy}
            onPress={() => navigation.getParent()?.navigate('Home')}
          >
            <Text style={styles.poweredByText}>Powered by Tavvy</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Save Actions */}
        <View style={styles.saveActions}>
          {/* Save to Wallet */}
          <TouchableOpacity 
            style={[styles.saveButton, isSavedToWallet && styles.saveButtonDisabled]}
            onPress={handleSaveToWallet}
            disabled={isSavedToWallet || isSaving}
          >
            <LinearGradient
              colors={isSavedToWallet ? ['#9CA3AF', '#6B7280'] : ['#8B5CF6', '#6366F1']}
              style={styles.saveButtonGradient}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons 
                    name={isSavedToWallet ? 'checkmark-circle' : 'wallet'} 
                    size={20} 
                    color="#fff" 
                  />
                  <Text style={styles.saveButtonText}>
                    {isSavedToWallet ? 'Saved to Wallet' : 'Save to Tavvy Wallet'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Save to Contacts */}
          <TouchableOpacity 
            style={[styles.contactButton, { borderColor: theme.border }]}
            onPress={handleSaveToContacts}
          >
            <Ionicons name="person-add" size={20} color="#8B5CF6" />
            <Text style={[styles.contactButtonText, { color: '#8B5CF6' }]}>
              Save to Contacts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Create Your Own Card CTA */}
        <View style={[styles.ctaSection, { backgroundColor: theme.card }]}>
          <Text style={[styles.ctaTitle, { color: theme.text }]}>Want your own digital card?</Text>
          <Text style={[styles.ctaSubtitle, { color: theme.textSecondary }]}>
            Create a free digital business card and share it with anyone!
          </Text>
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => navigation.navigate('CreateDigitalCard')}
          >
            <Text style={styles.ctaButtonText}>Create My Card</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Photo Lightbox Modal */}
      <Modal
        visible={lightboxOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLightboxOpen(false)}
      >
        <View style={styles.lightboxOverlay}>
          {/* Close button */}
          <TouchableOpacity 
            style={styles.lightboxClose}
            onPress={() => setLightboxOpen(false)}
          >
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>

          {/* Counter */}
          <View style={styles.lightboxCounter}>
            <Text style={styles.lightboxCounterText}>
              {lightboxIndex + 1} / {cardData?.galleryImages?.length || 0}
            </Text>
          </View>

          {/* Swipeable image viewer */}
          <FlatList
            data={cardData?.galleryImages || []}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={lightboxIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={(e) => {
              const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setLightboxIndex(newIndex);
            }}
            keyExtractor={(item, index) => item.id || index.toString()}
            renderItem={({ item }) => (
              <View style={styles.lightboxSlide}>
                <Image
                  source={{ uri: item.url }}
                  style={styles.lightboxImage}
                  resizeMode="contain"
                />
                {item.caption ? (
                  <Text style={styles.lightboxCaption}>{item.caption}</Text>
                ) : null}
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '500',
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
  shareButton: {
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
  saveActions: {
    paddingHorizontal: 20,
    gap: 14,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.8,
    shadowOpacity: 0,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 2,
    gap: 10,
  },
  contactButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  ctaSection: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  ctaSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  // Gallery styles
  gallerySection: {
    width: '100%',
    marginTop: 24,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  galleryImageContainer: {
    width: (SCREEN_WIDTH - 80 - 8) / 3,
    height: (SCREEN_WIDTH - 80 - 8) / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryMoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryMoreText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  galleryCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    borderRadius: 20,
  },
  galleryCountText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  // Videos styles
  videosSection: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  videoCardText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  // Links styles
  linksSection: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  linkCardText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },

  // Lightbox styles
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 16,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCounter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 64 : 24,
    alignSelf: 'center',
    zIndex: 10,
  },
  lightboxCounterText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  lightboxSlide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  lightboxImage: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
    borderRadius: 8,
  },
  lightboxCaption: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
});
