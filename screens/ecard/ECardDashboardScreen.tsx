import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  Share,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
// Using React Native Share instead of expo-sharing
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
  email: { icon: 'mail', color: '#EA4335' },
  website: { icon: 'globe', color: '#4A90D9' },
  phone: { icon: 'call', color: '#34C759' },
  other: { icon: 'link', color: '#8E8E93' },
};

// Theme configurations
const THEMES = [
  { id: 'classic', name: 'Classic', colors: ['#667eea', '#764ba2'] },
  { id: 'modern', name: 'Modern', colors: ['#00C853', '#00E676'] },
  { id: 'minimal', name: 'Minimal', colors: ['#ffffff', '#f5f5f5'] },
  { id: 'bold', name: 'Bold', colors: ['#FF6B6B', '#FF8E53'] },
  { id: 'elegant', name: 'Elegant', colors: ['#1A1A1A', '#333333'] },
  { id: 'ocean', name: 'Ocean', colors: ['#0077B6', '#00B4D8'] },
  { id: 'sunset', name: 'Sunset', colors: ['#F97316', '#FACC15'] },
  { id: 'forest', name: 'Forest', colors: ['#059669', '#34D399'] },
];

// Font configurations
const FONTS = [
  { id: 'default', name: 'Default', style: {} },
  { id: 'modern', name: 'Modern', style: { fontWeight: '300' as const } },
  { id: 'classic', name: 'Classic', style: { fontStyle: 'italic' as const } },
  { id: 'bold', name: 'Bold', style: { fontWeight: '900' as const } },
];

// Button style configurations
const BUTTON_STYLES = [
  { id: 'fill', name: 'Fill' },
  { id: 'outline', name: 'Outline' },
  { id: 'rounded', name: 'Rounded' },
  { id: 'shadow', name: 'Shadow' },
];

interface LinkItem {
  id: string;
  platform: string;
  value: string;
  title?: string;
  clicks?: number;
}

interface CardData {
  id: string;
  slug: string;
  theme: string;
  background_type: string;
  button_style: string;
  font_style: string;
  gradient_color_1: string;
  gradient_color_2: string;
  full_name: string;
  title: string;
  company: string;
}

interface Props {
  navigation: any;
  route: any;
}

export default function ECardDashboardScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { templateId, colorSchemeId, profile, links: initialLinks, isNewCard, openAppearance, cardId } = route.params || {};
  
  const [links, setLinks] = useState<LinkItem[]>(initialLinks || []);
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'analytics'>('links');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  
  // Appearance state
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [selectedBackground, setSelectedBackground] = useState('gradient');
  const [selectedButtonStyle, setSelectedButtonStyle] = useState('fill');
  const [selectedFont, setSelectedFont] = useState('default');
  const [gradientColors, setGradientColors] = useState<[string, string]>(['#667eea', '#764ba2']);
  
  // QR Code state
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // Card URL
  const [cardUrl, setCardUrl] = useState('tavvy.com/yourname');
  
  // Slug editing modal state
  const [showSlugModal, setShowSlugModal] = useState(false);
  const [slugInput, setSlugInput] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 30);
  };

  // Check if slug is available
  const checkSlugAvailability = async (slug: string): Promise<boolean> => {
    if (!slug || slug.length < 3) return false;
    
    try {
      const { data, error } = await supabase
        .from('digital_cards')
        .select('id')
        .eq('slug', slug)
        .neq('user_id', user?.id || '')
        .limit(1);
      
      if (error) throw error;
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking slug:', error);
      return false;
    }
  };

  // Create a new card from onboarding data
  const createNewCard = async () => {
    if (!user || !profile) return;
    
    try {
      // Always create a new card when isNewCard is true
      // The card limit check is done in MyCardsScreen before navigating here
      // Generate slug from name
      const slug = generateSlug(profile.name || 'user');
      
      // Check if slug is available, if not add random suffix
      let finalSlug = slug;
      let attempts = 0;
      while (attempts < 10) {
        const isAvailable = await checkSlugAvailability(finalSlug);
        if (isAvailable) break;
        finalSlug = `${slug}${Math.floor(Math.random() * 10000)}`;
        attempts++;
      }
      
      // Prepare card data
      const newCardData = {
        user_id: user.id,
        slug: finalSlug,
        full_name: profile.name || '',
        title: profile.title || '',
        company: '',
        phone: '',
        email: '',
        website: '',
        city: profile.address?.city || '',
        state: profile.address?.state || '',
        gradient_color_1: '#667eea',
        gradient_color_2: '#764ba2',
        profile_photo_url: profile.image || null,
        theme: 'classic',
        background_type: 'gradient',
        button_style: 'fill',
        font_style: 'default',
        is_active: true,
      };
      
      // Insert the card
      const { data: insertedCard, error: insertError } = await supabase
        .from('digital_cards')
        .insert(newCardData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Insert links if any
      if (initialLinks && initialLinks.length > 0) {
        const linksToInsert = initialLinks
          .filter((link: any) => link.value && link.value.trim())
          .map((link: any, index: number) => {
            const platform = link.platform || 'other';
            let url = link.value;
            
            // Build full URL based on platform
            if (platform === 'instagram') url = `https://instagram.com/${link.value}`;
            else if (platform === 'tiktok') url = `https://tiktok.com/@${link.value}`;
            else if (platform === 'youtube') url = `https://youtube.com/${link.value}`;
            else if (platform === 'twitter') url = `https://x.com/${link.value}`;
            else if (platform === 'linkedin') url = `https://linkedin.com/in/${link.value}`;
            else if (platform === 'facebook') url = `https://facebook.com/${link.value}`;
            else if (platform === 'whatsapp') url = `https://wa.me/${link.value}`;
            else if (platform === 'phone') url = `tel:${link.value}`;
            else if (platform === 'email') url = `mailto:${link.value}`;
            else if (!url.startsWith('http')) url = `https://${url}`;
            
            return {
              card_id: insertedCard.id,
              title: platform.charAt(0).toUpperCase() + platform.slice(1),
              url: url,
              icon: platform,
              sort_order: index,
              is_active: true,
            };
          });
        
        if (linksToInsert.length > 0) {
          await supabase.from('card_links').insert(linksToInsert);
        }
      }
      
      // Update local state
      setCardData(insertedCard);
      setCardUrl(`tavvy.com/${finalSlug}`);
      setSlugInput(finalSlug);
      
      // Reload to get links
      await loadCardData();
      
    } catch (error) {
      console.error('Error creating card:', error);
      Alert.alert('Error', 'Failed to create your card. Please try again.');
    }
  };

  // Load card data on mount
  useEffect(() => {
    if (isNewCard && profile) {
      // Create new card from onboarding data
      createNewCard();
    } else {
      loadCardData();
    }
  }, []);

  useEffect(() => {
    if (openAppearance) {
      setActiveTab('appearance');
    }
  }, [openAppearance]);

  const loadCardData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('digital_cards')
        .select('*')
        .eq('user_id', user.id);

      if (cardId) {
        query = query.eq('id', cardId);
      } else {
        // Get the most recently created card
        query = query.order('created_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query.single();

      if (data && !error) {
        setCardData(data);
        setSelectedTheme(data.theme || 'classic');
        setSelectedBackground(data.background_type || 'gradient');
        setSelectedButtonStyle(data.button_style || 'fill');
        setSelectedFont(data.font_style || 'default');
        setGradientColors([data.gradient_color_1 || '#667eea', data.gradient_color_2 || '#764ba2']);
        setCardUrl(`tavvy.com/${data.slug || 'yourname'}`);

        // Load links
        const { data: linksData } = await supabase
          .from('card_links')
          .select('*')
          .eq('card_id', data.id)
          .order('sort_order', { ascending: true });

        if (linksData) {
          setLinks(linksData.map(l => ({
            id: l.id,
            platform: l.icon || 'other',
            value: l.url,
            title: l.title,
            clicks: l.clicks || 0,
          })));
        }
      }
    } catch (error) {
      console.error('Error loading card:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAppearanceSettings = async (settings: Partial<{
    theme: string;
    background_type: string;
    button_style: string;
    font_style: string;
    gradient_color_1: string;
    gradient_color_2: string;
  }>) => {
    if (!cardData?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('digital_cards')
        .update(settings)
        .eq('id', cardData.id);

      if (error) throw error;
      
      // Update local state
      setCardData(prev => prev ? { ...prev, ...settings } : null);
    } catch (error) {
      console.error('Error saving appearance:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeSelect = (themeId: string) => {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      setSelectedTheme(themeId);
      setGradientColors(theme.colors as [string, string]);
      saveAppearanceSettings({
        theme: themeId,
        gradient_color_1: theme.colors[0],
        gradient_color_2: theme.colors[1],
      });
    }
  };

  const handleBackgroundSelect = (bgType: string) => {
    if (bgType === 'video') {
      Alert.alert('Pro Feature', 'Video backgrounds are available with Tavvy Pro!', [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade', onPress: () => navigation.navigate('ECardPremiumUpsell') }
      ]);
      return;
    }
    setSelectedBackground(bgType);
    saveAppearanceSettings({ background_type: bgType });
  };

  const handleButtonStyleSelect = (styleId: string) => {
    setSelectedButtonStyle(styleId);
    saveAppearanceSettings({ button_style: styleId });
  };

  const handleFontSelect = (fontId: string) => {
    setSelectedFont(fontId);
    saveAppearanceSettings({ font_style: fontId });
  };

  const generateQRCode = () => {
    if (!cardData?.slug) {
      Alert.alert('Error', 'Please save your card first to generate a QR code.');
      return;
    }
    
    const cardFullUrl = `https://tavvy.com/${cardData.slug}`;
    // Using QR Server API for QR code generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(cardFullUrl)}&bgcolor=ffffff&color=000000&format=png`;
    setQrCodeUrl(qrUrl);
    setShowQRModal(true);
  };

  const downloadQRCode = async () => {
    try {
      const fileName = `tavvy-qr-${cardData?.slug || 'card'}.png`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(qrCodeUrl, fileUri);
      
      if (downloadResult.status === 200) {
        // Use React Native Share to share the downloaded file
        await Share.share({
          url: downloadResult.uri,
          title: 'My Tavvy QR Code',
        });
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      Alert.alert('Error', 'Failed to download QR code. Please try again.');
    }
  };

  const shareQRCode = async () => {
    try {
      await Share.share({
        message: `Scan this QR code to view my digital card: https://tavvy.com/${cardData?.slug}`,
        url: qrCodeUrl,
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  const handleShare = async () => {
    try {
      const fullUrl = `https://${cardUrl}`;
      await Share.share({
        url: fullUrl,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(`https://${cardUrl}`);
    Alert.alert('Copied!', `https://${cardUrl}`);
  };

  const handleAddLink = () => {
    navigation.navigate('ECardAddLink', {
      onAdd: (newLink: LinkItem) => {
        setLinks(prev => [...prev, newLink]);
      },
    });
  };

  const handleEditLink = (link: LinkItem) => {
    navigation.navigate('ECardEditLink', {
      link,
      onSave: (updatedLink: LinkItem) => {
        setLinks(prev => prev.map(l => l.id === updatedLink.id ? updatedLink : l));
      },
      onDelete: () => {
        setLinks(prev => prev.filter(l => l.id !== link.id));
      },
    });
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const newLinks = [...links];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];
    setLinks(newLinks);
  };

  const renderLinksTab = () => (
    <View style={styles.tabContent}>
      {/* Add New Link Button */}
      <TouchableOpacity 
        style={styles.addLinkButton}
        onPress={handleAddLink}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#00C853', '#00E676']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addLinkGradient}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.addLinkText}>Add New Link</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Links List */}
      {links.length > 0 ? (
        <View style={styles.linksList}>
          {links.map((link, index) => {
            const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
            return (
              <TouchableOpacity
                key={link.id}
                style={styles.linkCard}
                onPress={() => handleEditLink(link)}
                activeOpacity={0.7}
              >
                {/* Drag Handle */}
                <View style={styles.dragHandle}>
                  <Ionicons name="menu" size={20} color="#BDBDBD" />
                </View>

                {/* Link Icon */}
                <View style={[styles.linkIcon, { backgroundColor: platformConfig.color + '15' }]}>
                  <Ionicons name={platformConfig.icon as any} size={20} color={platformConfig.color} />
                </View>

                {/* Link Info */}
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle} numberOfLines={1}>
                    {link.title || link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                  </Text>
                  <Text style={styles.linkValue} numberOfLines={1}>{link.value}</Text>
                </View>

                {/* Stats */}
                <View style={styles.linkStats}>
                  <Ionicons name="eye-outline" size={14} color="#9E9E9E" />
                  <Text style={styles.linkClicks}>{link.clicks || 0}</Text>
                </View>

                {/* Reorder Buttons */}
                <View style={styles.reorderButtons}>
                  <TouchableOpacity 
                    onPress={() => moveLink(index, 'up')}
                    disabled={index === 0}
                    style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                  >
                    <Ionicons name="chevron-up" size={18} color={index === 0 ? '#E0E0E0' : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => moveLink(index, 'down')}
                    disabled={index === links.length - 1}
                    style={[styles.reorderBtn, index === links.length - 1 && styles.reorderBtnDisabled]}
                  >
                    <Ionicons name="chevron-down" size={18} color={index === links.length - 1 ? '#E0E0E0' : '#666'} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="link-outline" size={48} color="#E0E0E0" />
          <Text style={styles.emptyStateTitle}>No links yet</Text>
          <Text style={styles.emptyStateText}>
            Add your first link to start sharing your content
          </Text>
        </View>
      )}
    </View>
  );

  const renderAppearanceTab = () => (
    <View style={styles.tabContent}>
      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color="#00C853" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}

      {/* Themes Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Themes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ECardThemes')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themesScroll}>
          {THEMES.slice(0, 5).map((theme) => (
            <TouchableOpacity 
              key={theme.id} 
              style={[styles.themeCard, selectedTheme === theme.id && styles.selectedOption]}
              onPress={() => handleThemeSelect(theme.id)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={theme.colors}
                style={styles.themePreview}
              >
                <View style={styles.themePreviewContent}>
                  <View style={styles.themePreviewCircle} />
                  <View style={styles.themePreviewLine} />
                  <View style={styles.themePreviewLineShort} />
                </View>
              </LinearGradient>
              <Text style={styles.themeName}>{theme.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Backgrounds Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Backgrounds</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ECardBackgrounds')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.backgroundOptions}>
          <TouchableOpacity 
            style={[styles.backgroundOption, selectedBackground === 'solid' && styles.selectedOption]}
            onPress={() => handleBackgroundSelect('solid')}
            activeOpacity={0.7}
          >
            <View style={[styles.backgroundPreview, { backgroundColor: gradientColors[0] }]} />
            <Text style={styles.backgroundName}>Solid</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.backgroundOption, selectedBackground === 'gradient' && styles.selectedOption]}
            onPress={() => handleBackgroundSelect('gradient')}
            activeOpacity={0.7}
          >
            <LinearGradient colors={gradientColors} style={styles.backgroundPreview} />
            <Text style={styles.backgroundName}>Gradient</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.backgroundOption, selectedBackground === 'image' && styles.selectedOption]}
            onPress={() => handleBackgroundSelect('image')}
            activeOpacity={0.7}
          >
            <View style={[styles.backgroundPreview, { backgroundColor: '#F5F5F5' }]}>
              <Ionicons name="image" size={20} color="#9E9E9E" />
            </View>
            <Text style={styles.backgroundName}>Image</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.backgroundOption, selectedBackground === 'video' && styles.selectedOption]}
            onPress={() => handleBackgroundSelect('video')}
            activeOpacity={0.7}
          >
            <View style={[styles.backgroundPreview, { backgroundColor: '#1A1A1A' }]}>
              <Ionicons name="videocam" size={20} color="#fff" />
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.backgroundName}>Video</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Buttons Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Buttons</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ECardButtons')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonOptions}>
          {BUTTON_STYLES.map((style) => (
            <TouchableOpacity 
              key={style.id}
              style={[styles.buttonOption, selectedButtonStyle === style.id && styles.selectedButtonOption]}
              onPress={() => handleButtonStyleSelect(style.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.buttonPreview, 
                style.id === 'fill' && { backgroundColor: '#1A1A1A' },
                style.id === 'outline' && { borderWidth: 2, borderColor: '#1A1A1A', backgroundColor: 'transparent' },
                style.id === 'rounded' && { backgroundColor: '#1A1A1A', borderRadius: 8 },
                style.id === 'shadow' && { backgroundColor: '#1A1A1A', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
              ]}>
                <Text style={[styles.buttonPreviewText, style.id === 'outline' && { color: '#1A1A1A' }]}>
                  {style.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Fonts Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fonts</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ECardFonts')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.fontOptions}>
          {FONTS.map((font) => (
            <TouchableOpacity 
              key={font.id} 
              style={[styles.fontOption, selectedFont === font.id && styles.selectedFontOption]}
              onPress={() => handleFontSelect(font.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.fontPreviewText, font.style]}>Aa</Text>
              <Text style={styles.fontName}>{font.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.analyticsTitle}>Total Views</Text>
          <Text style={styles.analyticsPeriod}>Last 30 days</Text>
        </View>
        <Text style={styles.analyticsNumber}>0</Text>
        <View style={styles.analyticsChart}>
          <Text style={styles.analyticsPlaceholder}>Chart coming soon</Text>
        </View>
      </View>

      <View style={styles.analyticsCard}>
        <Text style={styles.analyticsTitle}>Top Links</Text>
        {links.length > 0 ? (
          links.slice(0, 5).map((link, index) => (
            <View key={link.id} style={styles.topLinkItem}>
              <Text style={styles.topLinkRank}>{index + 1}</Text>
              <Text style={styles.topLinkName} numberOfLines={1}>{link.title || link.platform}</Text>
              <Text style={styles.topLinkClicks}>{link.clicks || 0} clicks</Text>
            </View>
          ))
        ) : (
          <Text style={styles.analyticsPlaceholder}>No data yet</Text>
        )}
      </View>

      {/* Pro Upsell */}
      <TouchableOpacity style={styles.proUpsell}>
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.proUpsellGradient}
        >
          <Ionicons name="star" size={24} color="#fff" />
          <View style={styles.proUpsellText}>
            <Text style={styles.proUpsellTitle}>Unlock Pro Analytics</Text>
            <Text style={styles.proUpsellSubtitle}>Get detailed insights and more</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // QR Code Modal
  const renderQRModal = () => (
    <Modal
      visible={showQRModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowQRModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.qrModalContent}>
          <View style={styles.qrModalHeader}>
            <Text style={styles.qrModalTitle}>Your QR Code</Text>
            <TouchableOpacity onPress={() => setShowQRModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.qrCodeContainer}>
            {qrCodeUrl ? (
              <Image 
                source={{ uri: qrCodeUrl }} 
                style={styles.qrCodeImage}
                resizeMode="contain"
              />
            ) : (
              <ActivityIndicator size="large" color="#00C853" />
            )}
          </View>
          
          <Text style={styles.qrCodeUrl}>tavvy.com/{cardData?.slug}</Text>
          
          <View style={styles.qrActions}>
            <TouchableOpacity style={styles.qrActionButton} onPress={downloadQRCode}>
              <Ionicons name="download-outline" size={24} color="#00C853" />
              <Text style={styles.qrActionText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrActionButton} onPress={shareQRCode}>
              <Ionicons name="share-outline" size={24} color="#00C853" />
              <Text style={styles.qrActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00C853" />
          <Text style={styles.loadingText}>Loading your card...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Card</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ECardPreview', { cardData })} style={styles.previewButton}>
          <Ionicons name="eye-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Card URL & Actions */}
      <View style={styles.cardUrlSection}>
        <TouchableOpacity 
          style={styles.cardUrlBox}
          onPress={() => {
            setSlugInput(cardData?.slug || '');
            setSlugAvailable(null);
            setShowSlugModal(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="link" size={18} color="#666" />
          <Text style={styles.cardUrlText}>{cardUrl}</Text>
          <Ionicons name="pencil" size={14} color="#00C853" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
            <Ionicons name="copy-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={generateQRCode}>
            <Ionicons name="qr-code-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'links' && styles.activeTab]}
          onPress={() => setActiveTab('links')}
        >
          <Ionicons 
            name="link" 
            size={18} 
            color={activeTab === 'links' ? '#00C853' : '#9E9E9E'} 
          />
          <Text style={[styles.tabText, activeTab === 'links' && styles.activeTabText]}>
            Links
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appearance' && styles.activeTab]}
          onPress={() => setActiveTab('appearance')}
        >
          <Ionicons 
            name="color-palette" 
            size={18} 
            color={activeTab === 'appearance' ? '#00C853' : '#9E9E9E'} 
          />
          <Text style={[styles.tabText, activeTab === 'appearance' && styles.activeTabText]}>
            Appearance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Ionicons 
            name="bar-chart" 
            size={18} 
            color={activeTab === 'analytics' ? '#00C853' : '#9E9E9E'} 
          />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'links' && renderLinksTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>

      {/* QR Code Modal */}
      {renderQRModal()}
      
      {/* Slug Editing Modal */}
      <Modal
        visible={showSlugModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSlugModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.slugModalContent}>
            <View style={styles.slugModalHeader}>
              <Text style={styles.slugModalTitle}>Edit Card URL</Text>
              <TouchableOpacity onPress={() => setShowSlugModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.slugModalSubtitle}>
              Choose a custom URL for your digital card
            </Text>
            
            <View style={styles.slugInputContainer}>
              <Text style={styles.slugPrefix}>tavvy.com/</Text>
              <TextInput
                style={styles.slugInput}
                value={slugInput}
                onChangeText={(text) => {
                  const formatted = text.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 30);
                  setSlugInput(formatted);
                  setSlugAvailable(null);
                }}
                placeholder="yourname"
                placeholderTextColor="#BDBDBD"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            {slugInput.length > 0 && slugInput.length < 3 && (
              <Text style={styles.slugError}>Slug must be at least 3 characters</Text>
            )}
            
            {slugAvailable === true && (
              <View style={styles.slugAvailableRow}>
                <Ionicons name="checkmark-circle" size={18} color="#00C853" />
                <Text style={styles.slugAvailableText}>This URL is available!</Text>
              </View>
            )}
            
            {slugAvailable === false && (
              <View style={styles.slugAvailableRow}>
                <Ionicons name="close-circle" size={18} color="#F44336" />
                <Text style={styles.slugUnavailableText}>This URL is already taken</Text>
              </View>
            )}
            
            <View style={styles.slugModalActions}>
              <TouchableOpacity 
                style={styles.checkAvailabilityButton}
                onPress={async () => {
                  if (slugInput.length < 3) return;
                  setIsCheckingSlug(true);
                  const available = await checkSlugAvailability(slugInput);
                  setSlugAvailable(available);
                  setIsCheckingSlug(false);
                }}
                disabled={isCheckingSlug || slugInput.length < 3}
              >
                {isCheckingSlug ? (
                  <ActivityIndicator size="small" color="#00C853" />
                ) : (
                  <Text style={styles.checkAvailabilityText}>Check Availability</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.saveSlugButton,
                  (!slugAvailable || slugInput.length < 3) && styles.saveSlugButtonDisabled
                ]}
                onPress={async () => {
                  if (!slugAvailable || !cardData?.id) return;
                  
                  try {
                    const { error } = await supabase
                      .from('digital_cards')
                      .update({ slug: slugInput })
                      .eq('id', cardData.id);
                    
                    if (error) throw error;
                    
                    setCardData(prev => prev ? { ...prev, slug: slugInput } : null);
                    setCardUrl(`tavvy.com/${slugInput}`);
                    setShowSlugModal(false);
                    Alert.alert('Success', 'Your card URL has been updated!');
                  } catch (error) {
                    console.error('Error updating slug:', error);
                    Alert.alert('Error', 'Failed to update URL. Please try again.');
                  }
                }}
                disabled={!slugAvailable || slugInput.length < 3}
              >
                <LinearGradient
                  colors={slugAvailable && slugInput.length >= 3 ? ['#00C853', '#00E676'] : ['#E0E0E0', '#BDBDBD']}
                  style={styles.saveSlugGradient}
                >
                  <Text style={[
                    styles.saveSlugText,
                    (!slugAvailable || slugInput.length < 3) && styles.saveSlugTextDisabled
                  ]}>Save URL</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  previewButton: {
    padding: 4,
  },
  cardUrlSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardUrlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  cardUrlText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#00C853',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  // Links Tab Styles
  addLinkButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  addLinkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linksList: {
    gap: 12,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dragHandle: {
    marginRight: 8,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  linkValue: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  linkStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    gap: 4,
  },
  linkClicks: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  reorderButtons: {
    gap: 2,
  },
  reorderBtn: {
    padding: 2,
  },
  reorderBtnDisabled: {
    opacity: 0.3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  // Appearance Tab Styles
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  savingText: {
    fontSize: 14,
    color: '#00C853',
  },
  appearanceSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  seeAllText: {
    fontSize: 14,
    color: '#00C853',
    fontWeight: '600',
  },
  themesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  themeCard: {
    marginRight: 12,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 4,
  },
  selectedOption: {
    borderColor: '#00C853',
  },
  themePreview: {
    width: 80,
    height: 100,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themePreviewContent: {
    alignItems: 'center',
  },
  themePreviewCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 8,
  },
  themePreviewLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  themePreviewLineShort: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  themeName: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  backgroundOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  backgroundOption: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 4,
  },
  backgroundPreview: {
    width: '100%',
    height: 70,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundName: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  proBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  buttonOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonOption: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 4,
  },
  selectedButtonOption: {
    borderColor: '#00C853',
  },
  buttonPreview: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPreviewText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  fontOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  fontOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedFontOption: {
    borderColor: '#00C853',
  },
  fontPreviewText: {
    fontSize: 28,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  fontName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Analytics Tab Styles
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  analyticsPeriod: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  analyticsNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  analyticsChart: {
    height: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsPlaceholder: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  topLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topLinkRank: {
    width: 24,
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  topLinkName: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
  },
  topLinkClicks: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  proUpsell: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  proUpsellGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  proUpsellText: {
    flex: 1,
  },
  proUpsellTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  proUpsellSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  // QR Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  qrCodeContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  qrCodeImage: {
    width: 180,
    height: 180,
  },
  qrCodeUrl: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  qrActions: {
    flexDirection: 'row',
    gap: 24,
  },
  qrActionButton: {
    alignItems: 'center',
    gap: 4,
  },
  qrActionText: {
    fontSize: 14,
    color: '#00C853',
    fontWeight: '500',
  },
  // Slug Modal Styles
  slugModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  slugModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slugModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  slugModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  slugInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  slugPrefix: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  slugInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
    padding: 0,
  },
  slugError: {
    fontSize: 12,
    color: '#F44336',
    marginBottom: 8,
  },
  slugAvailableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  slugAvailableText: {
    fontSize: 14,
    color: '#00C853',
    fontWeight: '500',
  },
  slugUnavailableText: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: '500',
  },
  slugModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  checkAvailabilityButton: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkAvailabilityText: {
    fontSize: 14,
    color: '#00C853',
    fontWeight: '600',
  },
  saveSlugButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveSlugButtonDisabled: {
    opacity: 0.6,
  },
  saveSlugGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSlugText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  saveSlugTextDisabled: {
    color: '#9E9E9E',
  },
});
