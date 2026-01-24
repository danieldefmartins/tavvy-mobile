import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

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
}

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

// Crown Badge Component for Tavvy Reviews
const CrownBadge = ({ reviewCount, rating, onPress }: { reviewCount: number; rating: number; onPress: () => void }) => (
  <TouchableOpacity 
    style={styles.crownBadge}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <LinearGradient
      colors={['#FFD700', '#FFA500']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.crownGradient}
    >
      <Text style={styles.crownIcon}>👑</Text>
      <View style={styles.crownInfo}>
        <Text style={styles.crownRating}>{rating.toFixed(1)}</Text>
        <Text style={styles.crownCount}>({reviewCount})</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

export default function ECardPreviewScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { cardData: passedCardData, profile, links: passedLinks, templateId, reviews } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);
  
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
          gradient_color_1: '#667eea',
          gradient_color_2: '#764ba2',
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
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Card Preview */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardContainer}
        >
          {/* Crown Badge - Shows if user has Tavvy reviews */}
          {hasReviews && (
            <CrownBadge 
              reviewCount={reviewData.count}
              rating={reviewData.rating}
              onPress={() => {
                // Navigate to reviews or show reviews modal
                console.log('Show reviews');
              }}
            />
          )}

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {cardData?.profile_photo_url ? (
              <Image source={{ uri: cardData.profile_photo_url }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <Text style={styles.profileName}>{cardData?.full_name || 'Your Name'}</Text>
            {cardData?.title ? (
              <Text style={styles.profileTitle}>{cardData.title}</Text>
            ) : null}
            {cardData?.bio ? (
              <Text style={styles.profileBio}>{cardData.bio}</Text>
            ) : null}
          </View>

          {/* Social Icons Row */}
          {links.length > 0 && (
            <View style={styles.socialIconsRow}>
              {links.slice(0, 6).map((link) => {
                const platformConfig = PLATFORM_ICONS[link.platform || link.icon] || PLATFORM_ICONS.other;
                return (
                  <TouchableOpacity
                    key={link.id}
                    style={styles.socialIconButton}
                    onPress={() => handleLinkPress(link)}
                  >
                    <Ionicons 
                      name={platformConfig.icon as any} 
                      size={22} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Links List */}
          {links.length > 0 && (
            <View style={styles.linksSection}>
              {links.map((link) => {
                const platformConfig = PLATFORM_ICONS[link.platform || link.icon] || PLATFORM_ICONS.other;
                return (
                  <TouchableOpacity
                    key={link.id}
                    style={styles.linkButton}
                    onPress={() => handleLinkPress(link)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.linkIconContainer}>
                      <Ionicons 
                        name={platformConfig.icon as any} 
                        size={18} 
                        color="#fff" 
                      />
                    </View>
                    <Text style={styles.linkButtonText}>
                      {link.title || (link.platform ? link.platform.charAt(0).toUpperCase() + link.platform.slice(1) : 'Link')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Empty State */}
          {links.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="link-outline" size={32} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyStateText}>No links added yet</Text>
            </View>
          )}

          {/* Powered by Tavvy */}
          <View style={styles.poweredBy}>
            <Text style={styles.poweredByText}>Powered by </Text>
            <Text style={styles.poweredByBrand}>Tavvy</Text>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('ECardTemplateGallery', { mode: 'edit', cardId: cardData?.id, existingData: cardData })}
        >
          <Ionicons name="pencil" size={20} color="#00C853" />
          <Text style={styles.editButtonText}>Edit Card</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.publishButton}
          onPress={handleShare}
        >
          <LinearGradient
            colors={['#00C853', '#00E676']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.publishGradient}
          >
            <Ionicons name="rocket" size={20} color="#fff" />
            <Text style={styles.publishButtonText}>Publish & Share</Text>
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
  crownBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 20,
    overflow: 'hidden',
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
  poweredBy: {
    flexDirection: 'row',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    justifyContent: 'center',
  },
  poweredByText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  poweredByBrand: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
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
});
