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
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  review_google_url?: string;
  review_yelp_url?: string;
  review_tripadvisor_url?: string;
  review_facebook_url?: string;
  review_bbb_url?: string;
  show_contact_info?: boolean;
  show_social_icons?: boolean;
  address_1?: string;
  address_2?: string;
  zip_code?: string;
  country?: string;
  professional_category?: string;
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

  // Endorsement popup state
  const [showEndorsementModal, setShowEndorsementModal] = useState(false);
  const [endorsementTags, setEndorsementTags] = useState<{ label: string; emoji: string; count: number }[]>([]);
  const [endorsementCount, setEndorsementCount] = useState(0);
  const [loadingEndorsements, setLoadingEndorsements] = useState(false);

  // Endorse flow state (badge selection, submission)
  const [showEndorseFlow, setShowEndorseFlow] = useState(false);
  const [endorsementSignals, setEndorsementSignals] = useState<{ id: string; label: string; emoji: string; category: string }[]>([]);
  const [signalTaps, setSignalTaps] = useState<Record<string, number>>({});
  const [endorseNote, setEndorseNote] = useState('');
  const [isSubmittingEndorsement, setIsSubmittingEndorsement] = useState(false);
  const [endorsementSubmitted, setEndorsementSubmitted] = useState(false);
  const [loadingSignals, setLoadingSignals] = useState(false);

  const selectedSignalCount = Object.keys(signalTaps).length;
  const fireEmojis = (intensity: number) => '\uD83D\uDD25'.repeat(Math.max(0, intensity - 1));

  const handleSignalTap = (signalId: string) => {
    setSignalTaps(prev => {
      const current = prev[signalId] || 0;
      if (current >= 3) {
        const next = { ...prev };
        delete next[signalId];
        return next;
      }
      return { ...prev, [signalId]: current + 1 };
    });
  };

  const CAT_COLORS: Record<string, string> = { universal: '#3B9FD9', sales: '#E87D3E', real_estate: '#6B7280', food_dining: '#E53E3E', health_wellness: '#38A169', beauty: '#D53F8C', home_services: '#DD6B20', legal_finance: '#2B6CB0', creative_marketing: '#8B5CF6', education_coaching: '#D69E2E', tech_it: '#319795', automotive: '#718096', events_entertainment: '#9F7AEA', pets: '#ED8936' };
  const CAT_LABELS: Record<string, string> = { universal: 'Strengths', sales: 'Sales Skills', real_estate: 'Real Estate', food_dining: 'Food & Dining', health_wellness: 'Health & Wellness', beauty: 'Beauty', home_services: 'Home Services', legal_finance: 'Legal & Finance', creative_marketing: 'Creative & Marketing', education_coaching: 'Education & Coaching', tech_it: 'Tech & IT', automotive: 'Automotive', events_entertainment: 'Events & Entertainment', pets: 'Pets' };

  // Fetch endorsement signals (badge options) for this card's category
  const fetchEndorsementSignals = async () => {
    if (!cardData?.id) return;
    setLoadingSignals(true);
    try {
      const cardCategory = (cardData as any).professional_category || 'universal';
      const categoriesToShow = cardCategory === 'universal' ? ['universal'] : ['universal', cardCategory];
      const { data: signals } = await supabase
        .from('review_items')
        .select('id, label, icon_emoji, sort_order, category')
        .eq('signal_type', 'pro_endorsement')
        .eq('is_active', true)
        .in('category', categoriesToShow)
        .order('sort_order', { ascending: true });
      setEndorsementSignals((signals || []).map((s: any) => ({
        id: s.id,
        label: s.label,
        emoji: s.icon_emoji || '\u2B50',
        category: s.category || 'universal',
      })));
    } catch (e) {
      console.log('Error fetching endorsement signals:', e);
    } finally {
      setLoadingSignals(false);
    }
  };

  // Submit endorsement directly via Supabase
  const submitEndorsement = async (signals: string[], intensities: Record<string, number>, note: string) => {
    if (!cardData?.id) return;
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession?.user) {
      // Not logged in — save pending and navigate to login
      await AsyncStorage.setItem('tavvy_pending_endorsement', JSON.stringify({
        cardId: cardData.id,
        signals,
        intensities,
        note,
      }));
      setShowEndorseFlow(false);
      navigation.navigate('Login');
      return;
    }

    const userId = currentSession.user.id;

    // Check if already endorsed
    const { data: existing } = await supabase
      .from('ecard_endorsements')
      .select('id')
      .eq('card_id', cardData.id)
      .eq('endorser_id', userId)
      .single();
    if (existing) {
      Alert.alert('Already Endorsed', 'You have already endorsed this card.');
      return;
    }

    // Get card owner
    const { data: cardOwner } = await supabase
      .from('digital_cards')
      .select('user_id')
      .eq('id', cardData.id)
      .single();
    if (!cardOwner) {
      Alert.alert('Error', 'Card not found.');
      return;
    }
    if (cardOwner.user_id === userId) {
      Alert.alert('Error', 'You cannot endorse your own card.');
      return;
    }

    // Create endorsement
    const { data: endorsement, error: insertError } = await supabase
      .from('ecard_endorsements')
      .insert({
        card_id: cardData.id,
        card_owner_id: cardOwner.user_id,
        endorser_id: userId,
        public_note: note || null,
      })
      .select('id')
      .single();
    if (insertError) {
      Alert.alert('Error', 'Failed to submit endorsement.');
      return;
    }

    // Create signal taps
    const signalRows = signals.map((signalId: string) => ({
      endorsement_id: endorsement.id,
      card_id: cardData.id,
      card_owner_id: cardOwner.user_id,
      signal_id: signalId,
    }));
    await supabase.from('ecard_endorsement_signals').insert(signalRows);

    // Update tap count
    const { data: currentCard } = await supabase
      .from('digital_cards')
      .select('tap_count')
      .eq('id', cardData.id)
      .single();
    await supabase
      .from('digital_cards')
      .update({ tap_count: (currentCard?.tap_count || 0) + 1 })
      .eq('id', cardData.id);

    // Update local count (each signal tap = +1)
    setEndorsementCount(prev => prev + signalIds.length);
    setEndorsementSubmitted(true);
    setShowEndorseFlow(false);
    // Refresh endorsement data
    fetchEndorsementData();
    Alert.alert('Thank You!', 'Your endorsement has been submitted.');
  };

  // Auto-submit pending endorsement after login
  useEffect(() => {
    if (!cardData?.id || !user) return;
    const checkPending = async () => {
      try {
        const pending = await AsyncStorage.getItem('tavvy_pending_endorsement');
        if (!pending) return;
        const data = JSON.parse(pending);
        if (data.cardId !== cardData.id) return;
        await AsyncStorage.removeItem('tavvy_pending_endorsement');
        setIsSubmittingEndorsement(true);
        try {
          await submitEndorsement(data.signals, data.intensities, data.note);
        } finally {
          setIsSubmittingEndorsement(false);
        }
      } catch (e) {
        await AsyncStorage.removeItem('tavvy_pending_endorsement');
      }
    };
    checkPending();
  }, [cardData?.id, user]);

  const fetchEndorsementData = async () => {
    if (!cardData?.id) return;
    setLoadingEndorsements(true);
    try {
      // Get endorsement count (each signal tap = +1)
      const { count } = await supabase
        .from('ecard_endorsement_signals')
        .select('*', { count: 'exact', head: true })
        .eq('card_id', cardData.id);
      setEndorsementCount(count || 0);

      // Get top signal tags (aggregated)
      const { data: signalTaps } = await supabase
        .from('ecard_endorsement_signals')
        .select('signal_id, review_items(label, icon_emoji)')
        .eq('card_id', cardData.id);
      if (signalTaps && signalTaps.length > 0) {
        const tagCounts: Record<string, { label: string; emoji: string; count: number }> = {};
        signalTaps.forEach((tap: any) => {
          const ri = tap.review_items;
          if (ri) {
            if (!tagCounts[tap.signal_id]) tagCounts[tap.signal_id] = { label: ri.label, emoji: ri.icon_emoji || '\u2B50', count: 0 };
            tagCounts[tap.signal_id].count++;
          }
        });
        setEndorsementTags(Object.values(tagCounts).sort((a, b) => b.count - a.count).slice(0, 8));
      }
    } catch (e) {
      console.log('Error fetching endorsement data:', e);
    } finally {
      setLoadingEndorsements(false);
    }
  };

  const handleBadgePress = () => {
    fetchEndorsementData();
    setShowEndorsementModal(true);
  };

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

  const handleSaveContact = () => {
    if (cardData?.slug) {
      Linking.openURL(`https://tavvy.com/api/ecard/wallet/vcard?slug=${cardData.slug}`);
    }
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
          // Use actual WCAG luminance calculation instead of just theme name matching
          const hexToLuminance = (hex: string) => {
            const c = hex.replace('#', '');
            if (c.length < 6) return 0.5;
            const r = parseInt(c.substring(0,2),16)/255;
            const g = parseInt(c.substring(2,4),16)/255;
            const b = parseInt(c.substring(4,6),16)/255;
            const toL = (v: number) => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
            return 0.2126*toL(r) + 0.7152*toL(g) + 0.0722*toL(b);
          };
          const avgLuminance = (hexToLuminance(gradientColors[0]) + hexToLuminance(gradientColors[1])) / 2;
          const isLightTheme = avgLuminance > 0.35 || LIGHT_THEMES.includes(themeId);
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
                  {/* Endorsement Badge */}
                  <View style={styles.crownBadgeContainer}>
                    <CrownBadge 
                      tapCount={reviewData.count || 0}
                      size="large"
                      isLightBackground={isLightTheme}
                      onPress={handleBadgePress}
                    />
                  </View>

                  {/* Address / Location Badge */}
                  {(cardData.address_1 || cardData.city) && (
                    <View style={[styles.addressBadge, isLightTheme ? { backgroundColor: 'rgba(0,0,0,0.06)', borderColor: 'rgba(0,0,0,0.1)' } : { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                      <Ionicons name="location-outline" size={16} color={isLightTheme ? '#555' : '#ccc'} />
                      <View style={{ marginLeft: 8, flex: 1 }}>
                        {cardData.address_1 && (
                          <Text style={{ fontSize: 13, color: textColor }}>
                            {cardData.address_1}{cardData.address_2 ? ` ${cardData.address_2}` : ''}
                          </Text>
                        )}
                        {(cardData.city || cardData.state || cardData.zip_code) && (
                          <Text style={{ fontSize: 12, color: subtitleColor, marginTop: cardData.address_1 ? 2 : 0 }}>
                            {[cardData.city, cardData.state].filter(Boolean).join(', ')}{cardData.zip_code ? ` ${cardData.zip_code}` : ''}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}
                  {!cardData.address_1 && !cardData.city && cardData.state && (
                    <View style={[styles.addressBadge, isLightTheme ? { backgroundColor: 'rgba(0,0,0,0.06)', borderColor: 'rgba(0,0,0,0.1)' } : { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                      <Ionicons name="location-outline" size={16} color={isLightTheme ? '#555' : '#ccc'} />
                      <Text style={{ marginLeft: 8, fontSize: 13, color: textColor }}>{cardData.state}</Text>
                    </View>
                  )}
                  
                  {/* Social Icons */}
                  {cardData.show_social_icons !== false && (featuredSocials.length > 0 || links.length > 0) && (
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

                  {/* Review Links — rendered as regular link rows (cover layout) */}
                  {(cardData.review_google_url || cardData.review_yelp_url || cardData.review_tripadvisor_url || cardData.review_facebook_url || cardData.review_bbb_url) && (
                    <View style={styles.linksSection}>
                      {cardData.review_google_url && (
                        <TouchableOpacity style={[styles.linkButton]} onPress={() => Linking.openURL(cardData.review_google_url!)} activeOpacity={0.8}>
                          <View style={[styles.linkIconContainer]}>
                            <Ionicons name="logo-google" size={18} color="#4285F4" />
                          </View>
                          <Text style={[styles.linkButtonText, { color: '#fff' }]}>Google Reviews</Text>
                        </TouchableOpacity>
                      )}
                      {cardData.review_yelp_url && (
                        <TouchableOpacity style={[styles.linkButton]} onPress={() => Linking.openURL(cardData.review_yelp_url!)} activeOpacity={0.8}>
                          <View style={[styles.linkIconContainer]}>
                            <Text style={{ fontSize: 16, fontWeight: '900', color: '#D32323' }}>Y</Text>
                          </View>
                          <Text style={[styles.linkButtonText, { color: '#fff' }]}>Yelp Reviews</Text>
                        </TouchableOpacity>
                      )}
                      {cardData.review_tripadvisor_url && (
                        <TouchableOpacity style={[styles.linkButton]} onPress={() => Linking.openURL(cardData.review_tripadvisor_url!)} activeOpacity={0.8}>
                          <View style={[styles.linkIconContainer]}>
                            <Ionicons name="compass-outline" size={18} color="#34E0A1" />
                          </View>
                          <Text style={[styles.linkButtonText, { color: '#fff' }]}>TripAdvisor Reviews</Text>
                        </TouchableOpacity>
                      )}
                      {cardData.review_facebook_url && (
                        <TouchableOpacity style={[styles.linkButton]} onPress={() => Linking.openURL(cardData.review_facebook_url!)} activeOpacity={0.8}>
                          <View style={[styles.linkIconContainer]}>
                            <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                          </View>
                          <Text style={[styles.linkButtonText, { color: '#fff' }]}>Facebook Reviews</Text>
                        </TouchableOpacity>
                      )}
                      {cardData.review_bbb_url && (
                        <TouchableOpacity style={[styles.linkButton]} onPress={() => Linking.openURL(cardData.review_bbb_url!)} activeOpacity={0.8}>
                          <View style={[styles.linkIconContainer]}>
                            <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
                          </View>
                          <Text style={[styles.linkButtonText, { color: '#fff' }]}>BBB</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  
                  {/* ═══ CARD FOOTER (cover) ═══ */}
                  <View style={styles.cardFooter}>

                    {/* Action Icons — Save, Share, Apple Wallet, Google Wallet */}
                    <View style={styles.actionIconsRow}>
                      <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.15)' }]} onPress={handleSaveContact}>
                        <Ionicons name="person-add-outline" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.15)' }]} onPress={handleShare}>
                        <Ionicons name="paper-plane-outline" size={24} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.walletIconBtn]} onPress={() => Alert.alert('Apple Wallet', 'Apple Wallet pass will be generated.')}>
                        <Image source={require('../../assets/icons/apple-wallet-icon.png')} style={styles.walletIconImg} resizeMode="cover" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.walletIconBtn]} onPress={() => Alert.alert('Google Wallet', 'Google Wallet pass will be generated.')}>
                        <Image source={require('../../assets/icons/google-wallet-icon.png')} style={styles.walletIconImg} resizeMode="cover" />
                      </TouchableOpacity>
                    </View>

                    {/* Row 4: Tavvy Branding */}
                    <View style={styles.tavvyBranding}>
                      <Image 
                        source={require('../../assets/brand/tavvy-wordmark-white.png')}
                        style={styles.tavvyLogo}
                        resizeMode="contain"
                      />
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>Create your free digital card</Text>
                    </View>
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
              {/* Endorsement Badge - Shows endorsement count */}
              <View style={styles.crownBadgeContainer}>
                <CrownBadge 
                  tapCount={reviewData.count || 0}
                  size="large"
                  isLightBackground={isLightTheme}
                  onPress={handleBadgePress}
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

              {/* Address / Location Badge */}
              {(cardData.address_1 || cardData.city) && (
                <View style={[styles.addressBadge, isLightTheme ? { backgroundColor: 'rgba(0,0,0,0.06)', borderColor: 'rgba(0,0,0,0.1)' } : { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                  <Ionicons name="location-outline" size={16} color={isLightTheme ? '#555' : '#ccc'} />
                  <View style={{ marginLeft: 8, flex: 1 }}>
                    {cardData.address_1 && (
                      <Text style={{ fontSize: 13, color: textColor }}>
                        {cardData.address_1}{cardData.address_2 ? ` ${cardData.address_2}` : ''}
                      </Text>
                    )}
                    {(cardData.city || cardData.state || cardData.zip_code) && (
                      <Text style={{ fontSize: 12, color: subtitleColor, marginTop: cardData.address_1 ? 2 : 0 }}>
                        {[cardData.city, cardData.state].filter(Boolean).join(', ')}{cardData.zip_code ? ` ${cardData.zip_code}` : ''}
                      </Text>
                    )}
                  </View>
                </View>
              )}
              {!cardData.address_1 && !cardData.city && cardData.state && (
                <View style={[styles.addressBadge, isLightTheme ? { backgroundColor: 'rgba(0,0,0,0.06)', borderColor: 'rgba(0,0,0,0.1)' } : { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                  <Ionicons name="location-outline" size={16} color={isLightTheme ? '#555' : '#ccc'} />
                  <Text style={{ marginLeft: 8, fontSize: 13, color: textColor }}>{cardData.state}</Text>
                </View>
              )}

              {/* Social Icons Row - Show featured socials or first 6 links */}
              {cardData.show_social_icons !== false && (featuredSocials.length > 0 || links.length > 0) && (
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

              {/* Review Links — rendered as regular link rows */}
              {(cardData.review_google_url || cardData.review_yelp_url || cardData.review_tripadvisor_url || cardData.review_facebook_url || cardData.review_bbb_url) && (
                <View style={styles.linksSection}>
                  {cardData.review_google_url && (
                    <TouchableOpacity style={[styles.linkButton, isLightTheme && styles.linkButtonLight]} onPress={() => Linking.openURL(cardData.review_google_url!)} activeOpacity={0.8}>
                      <View style={[styles.linkIconContainer, isLightTheme && styles.linkIconContainerLight]}>
                        <Ionicons name="logo-google" size={18} color="#4285F4" />
                      </View>
                      <Text style={[styles.linkButtonText, { color: textColor }]}>Google Reviews</Text>
                    </TouchableOpacity>
                  )}
                  {cardData.review_yelp_url && (
                    <TouchableOpacity style={[styles.linkButton, isLightTheme && styles.linkButtonLight]} onPress={() => Linking.openURL(cardData.review_yelp_url!)} activeOpacity={0.8}>
                      <View style={[styles.linkIconContainer, isLightTheme && styles.linkIconContainerLight]}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#D32323' }}>Y</Text>
                      </View>
                      <Text style={[styles.linkButtonText, { color: textColor }]}>Yelp Reviews</Text>
                    </TouchableOpacity>
                  )}
                  {cardData.review_tripadvisor_url && (
                    <TouchableOpacity style={[styles.linkButton, isLightTheme && styles.linkButtonLight]} onPress={() => Linking.openURL(cardData.review_tripadvisor_url!)} activeOpacity={0.8}>
                      <View style={[styles.linkIconContainer, isLightTheme && styles.linkIconContainerLight]}>
                        <Ionicons name="compass-outline" size={18} color="#34E0A1" />
                      </View>
                      <Text style={[styles.linkButtonText, { color: textColor }]}>TripAdvisor Reviews</Text>
                    </TouchableOpacity>
                  )}
                  {cardData.review_facebook_url && (
                    <TouchableOpacity style={[styles.linkButton, isLightTheme && styles.linkButtonLight]} onPress={() => Linking.openURL(cardData.review_facebook_url!)} activeOpacity={0.8}>
                      <View style={[styles.linkIconContainer, isLightTheme && styles.linkIconContainerLight]}>
                        <Ionicons name="logo-facebook" size={18} color="#1877F2" />
                      </View>
                      <Text style={[styles.linkButtonText, { color: textColor }]}>Facebook Reviews</Text>
                    </TouchableOpacity>
                  )}
                  {cardData.review_bbb_url && (
                    <TouchableOpacity style={[styles.linkButton, isLightTheme && styles.linkButtonLight]} onPress={() => Linking.openURL(cardData.review_bbb_url!)} activeOpacity={0.8}>
                      <View style={[styles.linkIconContainer, isLightTheme && styles.linkIconContainerLight]}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={isLightTheme ? '#333' : '#fff'} />
                      </View>
                      <Text style={[styles.linkButtonText, { color: textColor }]}>BBB</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* ═══ CARD FOOTER ═══ */}
              <View style={styles.cardFooter}>

                {/* Action Icons — Save, Share, Apple Wallet, Google Wallet */}
                <View style={styles.actionIconsRow}>
                  <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: isLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)', borderColor: isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)' }]} onPress={handleSaveContact}>
                    <Ionicons name="person-add-outline" size={24} color={isLightTheme ? '#1a1a2e' : '#fff'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: isLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)', borderColor: isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)' }]} onPress={handleShare}>
                    <Ionicons name="paper-plane-outline" size={24} color={isLightTheme ? '#1a1a2e' : '#fff'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.walletIconBtn]} onPress={() => Alert.alert('Apple Wallet', 'Apple Wallet pass will be generated.')}>
                    <Image source={require('../../assets/icons/apple-wallet-icon.png')} style={styles.walletIconImg} resizeMode="cover" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.walletIconBtn]} onPress={() => Alert.alert('Google Wallet', 'Google Wallet pass will be generated.')}>
                    <Image source={require('../../assets/icons/google-wallet-icon.png')} style={styles.walletIconImg} resizeMode="cover" />
                  </TouchableOpacity>
                </View>

                {/* Row 4: Tavvy Branding */}
                <View style={styles.tavvyBranding}>
                  <Image 
                    source={isLightTheme 
                      ? require('../../assets/brand/tavvy-wordmark-dark.png')
                      : require('../../assets/brand/tavvy-wordmark-white.png')
                    }
                    style={[styles.tavvyLogo, { opacity: isLightTheme ? 0.4 : 0.5 }]}
                    resizeMode="contain"
                  />
                  <Text style={{ fontSize: 12, color: isLightTheme ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.45)', marginTop: 4 }}>Create your free digital card</Text>
                </View>
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

      {/* Endorsement Modal */}
      <Modal
        visible={showEndorsementModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndorsementModal(false)}
      >
        <TouchableOpacity
          style={styles.endorseOverlay}
          activeOpacity={1}
          onPress={() => setShowEndorsementModal(false)}
        >
          <View style={styles.endorseSheet} onStartShouldSetResponder={() => true}>
            {/* Header — Tavvy logo + Endorsements */}
            <View style={styles.endorseHeader}>
              <View style={styles.endorseHeaderLeft}>
                <Image
                  source={require('../../assets/brand/tavvy-logo-horizontal-light.png')}
                  style={styles.endorseLogo}
                  resizeMode="contain"
                />
                <Text style={styles.endorseTitle}>Endorsements</Text>
              </View>
              <TouchableOpacity
                style={styles.endorseCloseBtn}
                onPress={() => setShowEndorsementModal(false)}
              >
                <Ionicons name="close" size={18} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.endorseSubtitle}>
              {endorsementCount} total endorsements
            </Text>

            {/* Endorsement Tags */}
            {loadingEndorsements ? (
              <View style={styles.endorseLoading}>
                <ActivityIndicator size="small" color="#3B9FD9" />
              </View>
            ) : endorsementTags.length > 0 ? (
              <View style={styles.endorseTagList}>
                {endorsementTags.map((tag, i) => (
                  <View key={i} style={styles.endorseTagRow}>
                    <View style={styles.endorseTagLeft}>
                      <Text style={styles.endorseTagEmoji}>{tag.emoji}</Text>
                      <Text style={styles.endorseTagLabel}>{tag.label}</Text>
                    </View>
                    <Text style={styles.endorseTagCount}>\u00D7{tag.count}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.endorseEmpty}>
                <Text style={styles.endorseEmptyText}>No endorsements yet. Be the first!</Text>
              </View>
            )}

            {/* Endorse Button */}
            <TouchableOpacity
              style={styles.endorseBtn}
              onPress={() => {
                setShowEndorsementModal(false);
                setSignalTaps({});
                setEndorseNote('');
                setEndorsementSubmitted(false);
                fetchEndorsementSignals();
                setShowEndorseFlow(true);
              }}
            >
              <Text style={styles.endorseBtnText}>
                Endorse {cardData?.full_name?.split(' ')[0] || ''} \u2192
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Endorse Flow Modal — Badge Selection */}
      <Modal
        visible={showEndorseFlow}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEndorseFlow(false)}
      >
        <TouchableOpacity
          style={styles.endorseOverlay}
          activeOpacity={1}
          onPress={() => setShowEndorseFlow(false)}
        >
          <View style={[styles.endorseSheet, { maxHeight: '92%' }]} onStartShouldSetResponder={() => true}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.endorseHeader}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#1a1a2e' }}>What Stood Out?</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#3B9FD9' }}>{selectedSignalCount} selected</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Tap to select \u00B7 Tap again to make it stronger</Text>

              {/* Badge Grid grouped by category */}
              {loadingSignals ? (
                <View style={styles.endorseLoading}>
                  <ActivityIndicator size="small" color="#3B9FD9" />
                </View>
              ) : (
                [...new Set(endorsementSignals.map(s => s.category))].map(cat => (
                  <View key={cat} style={{ marginBottom: 16 }}>
                    {/* Category Label */}
                    <View style={{ backgroundColor: CAT_COLORS[cat] || '#3B9FD9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 10 }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{CAT_LABELS[cat] || cat}</Text>
                    </View>
                    {/* Signal Tiles */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {endorsementSignals.filter(s => s.category === cat).map(signal => {
                        const intensity = signalTaps[signal.id] || 0;
                        const isSelected = intensity > 0;
                        const bgColor = isSelected ? (CAT_COLORS[cat] || '#3B9FD9') : '#f0f4f8';
                        return (
                          <TouchableOpacity
                            key={signal.id}
                            onPress={() => handleSignalTap(signal.id)}
                            style={{
                              width: (width - 72) / 3,
                              minHeight: 90,
                              borderRadius: 14,
                              backgroundColor: bgColor,
                              borderWidth: isSelected ? 0 : 1.5,
                              borderColor: '#e0e4e8',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 6,
                              position: 'relative' as const,
                            }}
                          >
                            {isSelected && (
                              <View style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="checkmark" size={12} color="#fff" />
                              </View>
                            )}
                            <Text style={{ fontSize: 28, marginBottom: 4 }}>{signal.emoji}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '600', textAlign: 'center', color: isSelected ? '#fff' : '#555', lineHeight: 14 }}>{signal.label}</Text>
                            {intensity > 1 && (
                              <Text style={{ fontSize: 12, marginTop: 2 }}>{fireEmojis(intensity)}</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}

              {/* Optional Note */}
              <View style={{ marginTop: 8, marginBottom: 16 }}>
                <TextInput
                  value={endorseNote}
                  onChangeText={setEndorseNote}
                  placeholder="Add a note (optional)..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={2}
                  style={{ width: '100%', padding: 12, borderRadius: 12, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0', color: '#333', fontSize: 14, minHeight: 50, textAlignVertical: 'top' }}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.endorseBtn, { opacity: selectedSignalCount === 0 || isSubmittingEndorsement ? 0.5 : 1 }]}
                disabled={selectedSignalCount === 0 || isSubmittingEndorsement}
                onPress={async () => {
                  setIsSubmittingEndorsement(true);
                  try {
                    const signalIds = Object.keys(signalTaps);
                    await submitEndorsement(signalIds, signalTaps, endorseNote);
                  } catch (err) {
                    Alert.alert('Error', 'Network error. Please try again.');
                  } finally {
                    setIsSubmittingEndorsement(false);
                  }
                }}
              >
                <Text style={styles.endorseBtnText}>
                  {isSubmittingEndorsement ? 'Submitting...' : `Continue (${selectedSignalCount})`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  addressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignSelf: 'center',
    maxWidth: '90%',
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
  actionIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    paddingVertical: 4,
  },
  actionIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  walletIconBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
  },
  walletIconImg: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  cardFooter: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  reviewIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  reviewIconPill: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  footerActionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  footerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  footerActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tavvyBranding: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
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
  // Endorsement Modal styles
  endorseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  endorseSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  endorseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  endorseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  endorseLogo: {
    height: 28,
    width: 90,
  },
  endorseTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2d3a4a',
    letterSpacing: -0.3,
  },
  endorseCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endorseSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
  },
  endorseLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  endorseTagList: {
    marginBottom: 24,
  },
  endorseTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  endorseTagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  endorseTagEmoji: {
    fontSize: 22,
  },
  endorseTagLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  endorseTagCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B9FD9',
  },
  endorseEmpty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  endorseEmptyText: {
    fontSize: 15,
    color: '#aaa',
  },
  endorseBtn: {
    backgroundColor: '#3B9FD9',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  endorseBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
