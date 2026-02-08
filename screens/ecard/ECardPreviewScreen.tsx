import React, { useState, useEffect, useCallback } from 'react';
import { getTemplateById, getColorSchemeById } from '../../config/eCardTemplates';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Share,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import CrownBadge from '../../components/ecard/CrownBadge';

const { width } = Dimensions.get('window');

// Platform icons mapping
const PLATFORM_ICONS: Record<string, { icon: string; color: string }> = {
  instagram: { icon: 'logo-instagram', color: '#E4405F' },
  tiktok: { icon: 'logo-tiktok', color: '#000000' },
  youtube: { icon: 'logo-youtube', color: '#FF0000' },
  twitter: { icon: 'logo-twitter', color: '#1DA1F2' },
  linkedin: { icon: 'logo-linkedin', color: '#0A66C2' },
  facebook: { icon: 'logo-facebook', color: '#1877F2' },
  snapchat: { icon: 'logo-snapchat', color: '#FFFC00' },
  whatsapp: { icon: 'logo-whatsapp', color: '#25D366' },
  telegram: { icon: 'paper-plane', color: '#0088CC' },
  spotify: { icon: 'musical-notes', color: '#1DB954' },
  apple_music: { icon: 'musical-note', color: '#FA243C' },
  soundcloud: { icon: 'cloud', color: '#FF5500' },
  github: { icon: 'logo-github', color: '#181717' },
  dribbble: { icon: 'logo-dribbble', color: '#EA4C89' },
  behance: { icon: 'color-palette', color: '#1769FF' },
  twitch: { icon: 'logo-twitch', color: '#9146FF' },
  discord: { icon: 'logo-discord', color: '#5865F2' },
  pinterest: { icon: 'logo-pinterest', color: '#E60023' },
  email: { icon: 'mail', color: '#EA4335' },
  website: { icon: 'globe', color: '#4A90D9' },
  phone: { icon: 'call', color: '#34C759' },
  custom: { icon: 'link', color: '#8E8E93' },
  other: { icon: 'link', color: '#8E8E93' },
};

interface CardData {
  id: string;
  slug: string;
  full_name: string;
  title: string;
  company: string;
  profile_photo_url: string | null;
  gradient_color_1: string;
  gradient_color_2: string;
  bio?: string;
  city?: string;
  state?: string;
  profile_photo_size?: string;
  theme?: string;
}

// Photo size configurations
const PHOTO_SIZES: Record<string, number> = {
  small: 80,
  medium: 110,
  large: 150,
  xl: 200,
  cover: -1, // Special case for cover
};

// Light background themes that need dark text
const LIGHT_THEMES = ['minimal'];

interface LinkData {
  id: string;
  title: string;
  url: string;
  icon: string;
  platform?: string;
}

interface Props {
  navigation: any;
  route: any;
}

// CrownBadge is now imported from components/ecard/CrownBadge

// Free tier limits
const FREE_LINK_LIMIT = 5;

export default function ECardPreviewScreen({ navigation, route }: Props) {
  const { user, isPro } = useAuth();
  const { cardData: passedCardData, profile, links: passedLinks, featuredSocials: passedFeaturedSocials, templateId, colorSchemeId, reviews } = route.params || {};
  
  // Get the selected template and color scheme for proper colors
  const selectedTemplate = templateId ? getTemplateById(templateId) : null;
  const selectedColorScheme = templateId && colorSchemeId 
    ? getColorSchemeById(templateId, colorSchemeId) 
    : null;
  
  // Determine gradient colors from template or defaults
  const templateGradientColor1 = selectedColorScheme?.primary || '#667eea';
  const templateGradientColor2 = selectedColorScheme?.secondary || '#764ba2';
  
  const [isLoading, setIsLoading] = useState(true);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [featuredSocials, setFeaturedSocials] = useState<{platformId: string; url: string}[]>(passedFeaturedSocials || []);
  
  // Mock reviews data - in production this comes from Tavvy reviews system
  const reviewData = reviews || { count: 0, rating: 0 };
  const hasReviews = reviewData.count > 0;

  // Load card data from database or use passed data
  const loadCardData = useCallback(async () => {
    console.log('ECardPreview - Loading card data');
    console.log('passedCardData:', passedCardData);
    console.log('passedLinks:', passedLinks);
    setIsLoading(true);
    
    try {
      // If cardData was passed directly, use it
      if (passedCardData?.id) {
        setCardData(passedCardData);
        
        // Use passed links if available, otherwise load from database
        console.log('Checking passedLinks:', passedLinks, 'length:', passedLinks?.length);
        if (passedLinks && passedLinks.length > 0) {
          console.log('Using passed links');
          const mappedLinks = passedLinks.map((l: any) => ({
            id: l.id || l.platform,
            title: l.title || l.platform?.charAt(0).toUpperCase() + l.platform?.slice(1) || 'Link',
            url: l.value || l.url || '',
            icon: l.platform || l.icon || 'link',
            platform: l.platform || l.icon || 'other',
          }));
          console.log('Mapped links:', mappedLinks);
          setLinks(mappedLinks);
        } else {
          console.log('No passed links, loading from database');
          // Load links from database
          const { data: linksData } = await supabase
            .from('card_links')
            .select('*')
            .eq('card_id', passedCardData.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
          
          if (linksData) {
            setLinks(linksData.map(l => ({
              id: l.id,
              title: l.title,
              url: l.url,
              icon: l.icon || 'link',
              platform: l.icon || 'other',
            })));
          }
        }
        setIsLoading(false);
        return;
      }
      
      // If profile was passed (from onboarding), use that
      if (profile) {
        setCardData({
          id: '',
          slug: profile.name ? profile.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'preview',
          full_name: profile.name || 'Your Name',
          title: profile.title || '',
          company: '',
          profile_photo_url: profile.image || null,
          gradient_color_1: templateGradientColor1,
          gradient_color_2: templateGradientColor2,
          bio: profile.bio || '',
          city: profile.address?.city || '',
          state: profile.address?.state || '',
        });
        
        if (passedLinks) {
          setLinks(passedLinks.map((l: any) => ({
            id: l.id || l.platform,
            title: l.platform?.charAt(0).toUpperCase() + l.platform?.slice(1) || 'Link',
            url: l.value || '',
            icon: l.platform || 'link',
            platform: l.platform || 'other',
          })));
        }
        setIsLoading(false);
        return;
      }
      
      // Otherwise, load from database
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('digital_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data && !error) {
        setCardData(data);
        
        // Load links
        const { data: linksData } = await supabase
          .from('card_links')
          .select('*')
          .eq('card_id', data.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        
        if (linksData) {
          setLinks(linksData.map(l => ({
            id: l.id,
            title: l.title,
            url: l.url,
            icon: l.icon || 'link',
            platform: l.icon || 'other',
          })));
        }
      }
    } catch (error) {
      console.error('Error loading card:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, passedCardData, profile, passedLinks]);

  // Load on focus
  useFocusEffect(
    useCallback(() => {
      loadCardData();
    }, [loadCardData])
  );

  const cardUrl = `https://tavvy.com/${cardData?.slug || 'preview'}`;
  const isPublished = !!(cardData as any)?.is_published;

  // Check if card has premium features that require payment
  const hasPremiumFeatures = (): boolean => {
    // Check if template is premium
    if (selectedTemplate?.isPremium) return true;
    
    // Check link limit exceeded
    if (links.length > FREE_LINK_LIMIT) return true;
    
    // Check for premium blocks in passedCardData
    // Premium blocks: gallery, video, youtube, testimonials, form, credentials
    const premiumBlockTypes = ['gallery', 'video', 'youtube', 'testimonials', 'form', 'credentials'];
    if (passedCardData?.blocks) {
      const hasPremiumBlock = passedCardData.blocks.some((block: any) => 
        premiumBlockTypes.includes(block.type)
      );
      if (hasPremiumBlock) return true;
    }
    
    return false;
  };

  // Handle publish/share with payment gating
  const handlePublishShare = () => {
    // Check for premium features first
    if (!isPro && hasPremiumFeatures()) {
      Alert.alert(
        'Premium Features Detected',
        'Your card includes premium features. To share this card, you need to upgrade to Tavvy Pro.\n\nYou can also save your card and come back later.',
        [
          { 
            text: 'Save for Later', 
            style: 'cancel', 
            onPress: () => {
              // Card is already saved as draft, just go back to dashboard
              Alert.alert(
                'Card Saved!',
                'Your card has been saved. You can access it anytime from the Apps tab.',
                [{ text: 'OK', onPress: () => navigation.navigate('ECardDashboard') }]
              );
            }
          },
          { 
            text: 'Use Free Version', 
            style: 'destructive', 
            onPress: () => {
              // Navigate back to dashboard to remove premium features
              navigation.navigate('ECardDashboard', {
                showRemovePremiumPrompt: true,
                cardData: passedCardData,
              });
            }
          },
          { 
            text: 'Upgrade to Pro', 
            onPress: () => navigation.navigate('ECardPremiumUpsell') 
          },
        ]
      );
      return;
    }
    
    // No premium features or user is Pro — check if published
    if (!isPublished) {
      Alert.alert(
        'Publish First',
        'You need to publish your card before you can share it. Would you like to publish now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Publish', onPress: () => navigation.navigate('ECardDashboard', { cardId: cardData?.id }) },
        ]
      );
      return;
    }
    handleShare();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        url: cardUrl,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLinkPress = (link: LinkData) => {
    let url = link.url;
    
    // If URL doesn't start with http, it might be a username
    if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('tel:')) {
      const platform = link.platform || link.icon;
      switch (platform) {
        case 'instagram':
          url = `https://instagram.com/${url}`;
          break;
        case 'tiktok':
          url = `https://tiktok.com/@${url.replace('@', '')}`;
          break;
        case 'twitter':
          url = `https://x.com/${url}`;
          break;
        case 'linkedin':
          url = `https://linkedin.com/in/${url}`;
          break;
        case 'facebook':
          url = `https://facebook.com/${url}`;
          break;
        case 'youtube':
          url = `https://youtube.com/${url}`;
          break;
        case 'github':
          url = `https://github.com/${url}`;
          break;
        case 'email':
          url = `mailto:${url}`;
          break;
        case 'phone':
          url = `tel:${url}`;
          break;
        case 'whatsapp':
          url = `https://wa.me/${url.replace(/\D/g, '')}`;
          break;
        default:
          url = `https://${url}`;
      }
    }
    
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading your card...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const gradientColors: [string, string] = [
    cardData?.gradient_color_1 || '#667eea',
    cardData?.gradient_color_2 || '#764ba2'
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview</Text>
        {isPublished ? (
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.shareButton} />
        )}
      </View>

      {/* Card Preview */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Determine photo size and theme */}
        {(() => {
          const photoSizeId = passedCardData?.profile_photo_size || cardData?.profile_photo_size || 'medium';
          const isCoverPhoto = photoSizeId === 'cover';
          const photoSize = PHOTO_SIZES[photoSizeId] || 110;
          const themeId = passedCardData?.theme || cardData?.theme || 'classic';
          const isLightTheme = LIGHT_THEMES.includes(themeId);
          const textColor = isLightTheme ? '#1A1A1A' : '#fff';
          const subtitleColor = isLightTheme ? '#666' : 'rgba(255,255,255,0.8)';
          
          // Cover photo layout
          if (isCoverPhoto) {
            return (
              <View style={styles.coverContainer}>
                {/* Full-bleed cover photo */}
                <View style={styles.coverPhotoContainer}>
                  {cardData?.profile_photo_url ? (
                    <Image 
                      source={{ uri: cardData.profile_photo_url }} 
                      style={styles.coverPhoto}
                      resizeMode="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={gradientColors}
                      style={styles.coverPhotoPlaceholder}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name="image" size={50} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.coverPlaceholderText}>Add Cover Photo</Text>
                    </LinearGradient>
                  )}
                  {/* Gradient overlay for text readability */}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={styles.coverOverlay}
                  />
                  {/* Name & Title on cover */}
                  <View style={styles.coverTextContainer}>
                    <Text style={styles.coverName}>{cardData?.full_name || 'Your Name'}</Text>
                    {cardData?.title && (
                      <Text style={styles.coverTitle}>{cardData.title}</Text>
                    )}
                  </View>
                </View>
                
                {/* Links section below cover */}
                <LinearGradient
                  colors={gradientColors}
                  style={styles.coverLinksSection}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Crown Badge */}
                  <View style={styles.crownBadgeContainer}>
                    <CrownBadge 
                      tapCount={reviewData.count || 0}
                      size="large"
                      onPress={() => console.log('Show validation taps')}
                    />
                  </View>
                  
                  {/* Social Icons */}
                  {(featuredSocials.length > 0 || links.length > 0) && (
                    <View style={styles.socialIconsRow}>
                      {featuredSocials.length > 0 ? (
                        featuredSocials.map((social) => {
                          const platformConfig = PLATFORM_ICONS[social.platformId] || PLATFORM_ICONS.other;
                          const link = links.find(l => l.platform === social.platformId);
                          return (
                            <TouchableOpacity
                              key={social.platformId}
                              style={styles.socialIconButton}
                              onPress={() => link && handleLinkPress(link)}
                            >
                              <Ionicons name={platformConfig.icon as any} size={22} color="#fff" />
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        links.slice(0, 6).map((link) => {
                          const platformConfig = PLATFORM_ICONS[link.platform || link.icon] || PLATFORM_ICONS.other;
                          return (
                            <TouchableOpacity
                              key={link.id}
                              style={styles.socialIconButton}
                              onPress={() => handleLinkPress(link)}
                            >
                              <Ionicons name={platformConfig.icon as any} size={22} color="#fff" />
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  )}
                  
                  {/* Tavvy Logo */}
                  <View style={styles.tavvyBranding}>
                    <Image 
                      source={require('../../assets/brand/tavvy-wordmark-white.png')}
                      style={styles.tavvyLogo}
                      resizeMode="contain"
                    />
                  </View>
                </LinearGradient>
              </View>
            );
          }
          
          // Regular layout with dynamic photo size
          return (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.cardContainer, isLightTheme && styles.cardContainerLight]}
            >
              {/* Crown Badge - Shows validation tap count */}
              <View style={styles.crownBadgeContainer}>
                <CrownBadge 
                  tapCount={reviewData.count || 0}
                  size="large"
                  onPress={() => console.log('Show validation taps')}
                />
              </View>

              {/* Profile Section */}
              <View style={styles.profileSection}>
                {cardData?.profile_photo_url ? (
                  <Image 
                    source={{ uri: cardData.profile_photo_url }} 
                    style={[
                      styles.profileImage,
                      { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }
                    ]} 
                  />
                ) : (
                  <View style={[
                    styles.profileImagePlaceholder,
                    { width: photoSize, height: photoSize, borderRadius: photoSize / 2 }
                  ]}>
                    <Ionicons name="person" size={photoSize * 0.4} color={isLightTheme ? '#666' : '#fff'} />
                  </View>
                )}
                <Text style={[styles.profileName, { color: textColor }]}>{cardData?.full_name || 'Your Name'}</Text>
                {cardData?.title ? (
                  <Text style={[styles.profileTitle, { color: subtitleColor }]}>{cardData.title}</Text>
                ) : null}
                {cardData?.bio ? (
                  <Text style={[styles.profileBio, { color: subtitleColor }]}>{cardData.bio}</Text>
                ) : null}
              </View>

              {/* Social Icons Row - Show featured socials or first 6 links */}
              {(featuredSocials.length > 0 || links.length > 0) && (
                <View style={styles.socialIconsRow}>
                  {featuredSocials.length > 0 ? (
                    featuredSocials.map((social) => {
                      const platformConfig = PLATFORM_ICONS[social.platformId] || PLATFORM_ICONS.other;
                      const link = links.find(l => l.platform === social.platformId);
                      return (
                        <TouchableOpacity
                          key={social.platformId}
                          style={[styles.socialIconButton, isLightTheme && styles.socialIconButtonLight]}
                          onPress={() => link && handleLinkPress(link)}
                        >
                          <Ionicons 
                            name={platformConfig.icon as any} 
                            size={22} 
                            color={isLightTheme ? '#333' : '#fff'} 
                          />
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    links.slice(0, 6).map((link) => {
                      const platformConfig = PLATFORM_ICONS[link.platform || link.icon] || PLATFORM_ICONS.other;
                      return (
                        <TouchableOpacity
                          key={link.id}
                          style={[styles.socialIconButton, isLightTheme && styles.socialIconButtonLight]}
                          onPress={() => handleLinkPress(link)}
                        >
                          <Ionicons 
                            name={platformConfig.icon as any} 
                            size={22} 
                            color={isLightTheme ? '#333' : '#fff'} 
                          />
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}

              {/* Links List - Exclude featured socials */}
              {(() => {
                const nonFeaturedLinks = featuredSocials.length > 0 
                  ? links.filter(link => !featuredSocials.some(f => f.platformId === link.platform))
                  : links;
                return nonFeaturedLinks.length > 0 ? (
                  <View style={styles.linksSection}>
                    {nonFeaturedLinks.map((link) => {
                      const platformConfig = PLATFORM_ICONS[link.platform || link.icon] || PLATFORM_ICONS.other;
                      return (
                        <TouchableOpacity
                          key={link.id}
                          style={[styles.linkButton, isLightTheme && styles.linkButtonLight]}
                          onPress={() => handleLinkPress(link)}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.linkIconContainer, isLightTheme && styles.linkIconContainerLight]}>
                            <Ionicons 
                              name={platformConfig.icon as any} 
                              size={18} 
                              color={isLightTheme ? '#333' : '#fff'} 
                            />
                          </View>
                          <Text style={[styles.linkButtonText, { color: textColor }]}>
                            {link.title || (link.platform ? link.platform.charAt(0).toUpperCase() + link.platform.slice(1) : 'Link')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null;
              })()}

              {/* Empty State */}
              {links.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="link-outline" size={32} color={isLightTheme ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} />
                  <Text style={[styles.emptyStateText, { color: subtitleColor }]}>No links added yet</Text>
                </View>
              )}

              {/* Tavvy Logo */}
              <View style={styles.tavvyBranding}>
                <Image 
                  source={isLightTheme 
                    ? require('../../assets/brand/tavvy-wordmark-dark.png')
                    : require('../../assets/brand/tavvy-wordmark-white.png')
                  }
                  style={[styles.tavvyLogo, { opacity: isLightTheme ? 0.4 : 0.5 }]}
                  resizeMode="contain"
                />
              </View>
            </LinearGradient>
          );
        })()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('ECardCreate', { 
            mode: 'edit', 
            cardId: cardData?.id, 
            existingData: cardData,
            existingLinks: links,
            existingFeaturedSocials: featuredSocials,
            preserveData: true 
          })}
        >
          <Ionicons name="pencil" size={20} color="#00C853" />
          <Text style={styles.editButtonText}>Edit Card</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.publishButton}
          onPress={handlePublishShare}
        >
          <LinearGradient
            colors={['#00C853', '#00E676']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.publishGradient}
          >
            <Ionicons name={isPublished ? 'share' : 'rocket'} size={20} color="#fff" />
            <Text style={styles.publishButtonText}>{isPublished ? 'Share Card' : 'Publish & Share'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  cardContainer: {
    borderRadius: 24,
    padding: 24,
    minHeight: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  crownBadgeContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  crownGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  crownIcon: {
    fontSize: 14,
  },
  crownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  crownRating: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  crownCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 16,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  profileBio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linksSection: {
    width: '100%',
    gap: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  tavvyBranding: {
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    width: '100%',
  },
  tavvyLogo: {
    height: 18,
    width: 80,
    opacity: 0.5,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,200,83,0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00C853',
  },
  publishButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  publishGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  // Cover photo layout styles
  coverContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  coverPhotoContainer: {
    width: '100%',
    height: width * 0.6, // 60% of screen width for banner aspect ratio
    position: 'relative',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  coverTextContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  coverName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  coverTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  coverLinksSection: {
    padding: 24,
    alignItems: 'center',
  },
  // Light theme variant styles
  cardContainerLight: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  socialIconButtonLight: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  linkButtonLight: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  linkIconContainerLight: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});
