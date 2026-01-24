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
import { supabase } from '../../lib/supabaseClient';
import { FONTS, PREMIUM_FONT_COUNT } from '../../config/eCardFonts';
import { useAuth } from '../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');
const PREVIEW_HEIGHT = height * 0.32; // 32% of screen for preview

// Platform icons mapping
const PLATFORM_ICONS: Record<string, { icon: string; color: string; bgColor: string }> = {
  instagram: { icon: 'logo-instagram', color: '#fff', bgColor: '#E4405F' },
  tiktok: { icon: 'logo-tiktok', color: '#fff', bgColor: '#000000' },
  youtube: { icon: 'logo-youtube', color: '#fff', bgColor: '#FF0000' },
  twitter: { icon: 'logo-twitter', color: '#fff', bgColor: '#1DA1F2' },
  linkedin: { icon: 'logo-linkedin', color: '#fff', bgColor: '#0A66C2' },
  facebook: { icon: 'logo-facebook', color: '#fff', bgColor: '#1877F2' },
  snapchat: { icon: 'logo-snapchat', color: '#000', bgColor: '#FFFC00' },
  whatsapp: { icon: 'logo-whatsapp', color: '#fff', bgColor: '#25D366' },
  email: { icon: 'mail', color: '#fff', bgColor: '#EA4335' },
  website: { icon: 'globe', color: '#fff', bgColor: '#4A90D9' },
  phone: { icon: 'call', color: '#fff', bgColor: '#34C759' },
  other: { icon: 'link', color: '#fff', bgColor: '#8E8E93' },
};

// Theme configurations with better minimal theme
const THEMES = [
  { id: 'classic', name: 'Classic', colors: ['#667eea', '#764ba2'], textColor: '#fff' },
  { id: 'modern', name: 'Modern', colors: ['#00C853', '#00E676'], textColor: '#fff' },
  { id: 'minimal', name: 'Minimal', colors: ['#FAFAFA', '#F5F5F5'], textColor: '#1A1A1A', hasBorder: true },
  { id: 'bold', name: 'Bold', colors: ['#FF6B6B', '#FF8E53'], textColor: '#fff' },
  { id: 'elegant', name: 'Elegant', colors: ['#1A1A1A', '#333333'], textColor: '#fff' },
  { id: 'ocean', name: 'Ocean', colors: ['#0077B6', '#00B4D8'], textColor: '#fff' },
  { id: 'sunset', name: 'Sunset', colors: ['#F97316', '#FACC15'], textColor: '#fff' },
  { id: 'forest', name: 'Forest', colors: ['#059669', '#34D399'], textColor: '#fff' },
];

// Preset gradient colors for quick selection
const PRESET_GRADIENTS = [
  { id: 'purple', name: 'Purple', colors: ['#667eea', '#764ba2'] },
  { id: 'ocean', name: 'Ocean', colors: ['#0077B6', '#00B4D8'] },
  { id: 'sunset', name: 'Sunset', colors: ['#F97316', '#EC4899'] },
  { id: 'forest', name: 'Forest', colors: ['#059669', '#34D399'] },
  { id: 'fire', name: 'Fire', colors: ['#EF4444', '#F97316'] },
  { id: 'pink', name: 'Pink', colors: ['#EC4899', '#F472B6'] },
  { id: 'teal', name: 'Teal', colors: ['#14B8A6', '#06B6D4'] },
  { id: 'gold', name: 'Gold', colors: ['#D4AF37', '#F59E0B'] },
  { id: 'midnight', name: 'Midnight', colors: ['#1E1B4B', '#312E81'] },
  { id: 'coral', name: 'Coral', colors: ['#FB7185', '#F43F5E'] },
  { id: 'lavender', name: 'Lavender', colors: ['#A78BFA', '#8B5CF6'] },
  { id: 'mint', name: 'Mint', colors: ['#6EE7B7', '#34D399'] },
];

// Solid color presets
const PRESET_COLORS = [
  '#667eea', '#764ba2', '#00C853', '#00E676', '#FF6B6B', '#FF8E53',
  '#1A1A1A', '#333333', '#0077B6', '#00B4D8', '#F97316', '#FACC15',
  '#059669', '#34D399', '#EC4899', '#F472B6', '#14B8A6', '#06B6D4',
  '#EF4444', '#D4AF37', '#8B5CF6', '#A78BFA', '#FFFFFF', '#F5F5F5',
];

// Button style configurations
const BUTTON_STYLES = [
  { id: 'fill', name: 'Fill' },
  { id: 'outline', name: 'Outline' },
  { id: 'rounded', name: 'Rounded' },
  { id: 'shadow', name: 'Shadow' },
  { id: 'pill', name: 'Pill' },
  { id: 'minimal', name: 'Minimal' },
];

// FONTS imported from config/eCardFonts.ts (50+ fonts: 8 free, 42+ premium)

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
  profile_photo_url?: string;
  bio?: string;
}

interface Props {
  navigation: any;
  route: any;
}

export default function ECardDashboardScreen({ navigation, route }: Props) {
  const { user, isPro } = useAuth();
  const { templateId, colorSchemeId, profile, links: initialLinks, isNewCard, openAppearance, cardId } = route.params || {};
  
  const [links, setLinks] = useState<LinkItem[]>(initialLinks || []);
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'analytics'>(openAppearance ? 'appearance' : 'links');
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
  
  // Color picker modal state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingColorIndex, setEditingColorIndex] = useState<0 | 1>(0);
  const [tempColor, setTempColor] = useState('#667eea');

  // Link limit for free users
  const FREE_LINK_LIMIT = 5;
  const canAddMoreLinks = isPro || links.length < FREE_LINK_LIMIT;

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
      const slug = generateSlug(profile.name || 'user');
      
      let finalSlug = slug;
      let attempts = 0;
      while (attempts < 10) {
        const isAvailable = await checkSlugAvailability(finalSlug);
        if (isAvailable) break;
        finalSlug = `${slug}${Math.floor(Math.random() * 10000)}`;
        attempts++;
      }
      
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
      
      const { data: insertedCard, error: insertError } = await supabase
        .from('digital_cards')
        .insert(newCardData)
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      if (initialLinks && initialLinks.length > 0) {
        const linksToInsert = initialLinks
          .filter((link: any) => link.value && link.value.trim())
          .map((link: any, index: number) => {
            const platform = link.platform || 'other';
            let url = link.value;
            
            if (platform === 'instagram') url = `https://instagram.com/${link.value}`;
            else if (platform === 'tiktok') url = `https://tiktok.com/@${link.value}`;
            else if (platform === 'youtube') url = `https://youtube.com/@${link.value}`;
            else if (platform === 'twitter') url = `https://twitter.com/${link.value}`;
            else if (platform === 'linkedin') url = `https://linkedin.com/in/${link.value}`;
            else if (platform === 'facebook') url = `https://facebook.com/${link.value}`;
            else if (platform === 'snapchat') url = `https://snapchat.com/add/${link.value}`;
            else if (platform === 'whatsapp') url = `https://wa.me/${link.value.replace(/\D/g, '')}`;
            else if (platform === 'phone') url = `tel:${link.value}`;
            else if (platform === 'email') url = `mailto:${link.value}`;
            
            return {
              card_id: insertedCard.id,
              platform,
              url,
              title: link.title || platform.charAt(0).toUpperCase() + platform.slice(1),
              display_order: index,
              is_active: true,
            };
          });
        
        if (linksToInsert.length > 0) {
          await supabase.from('card_links').insert(linksToInsert);
        }
      }
      
      setCardData(insertedCard);
      setCardUrl(`tavvy.com/${insertedCard.slug}`);
      setGradientColors([insertedCard.gradient_color_1, insertedCard.gradient_color_2]);
      setSelectedTheme(insertedCard.theme || 'classic');
      setSelectedBackground(insertedCard.background_type || 'gradient');
      setSelectedButtonStyle(insertedCard.button_style || 'fill');
      setSelectedFont(insertedCard.font_style || 'default');
      
    } catch (error: any) {
      console.error('Error creating card:', error);
      Alert.alert('Error', 'Failed to create your card. Please try again.');
    }
  };

  // Load existing card data
  useEffect(() => {
    const loadCardData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        if (isNewCard && profile) {
          await createNewCard();
        } else {
          let query = supabase
            .from('digital_cards')
            .select('*')
            .eq('user_id', user.id);
          
          if (cardId) {
            query = query.eq('id', cardId);
          }
          
          const { data: cards, error } = await query.order('created_at', { ascending: false }).limit(1);

          if (error) throw error;

          if (cards && cards.length > 0) {
            const card = cards[0];
            setCardData(card);
            setCardUrl(`tavvy.com/${card.slug}`);
            setGradientColors([card.gradient_color_1 || '#667eea', card.gradient_color_2 || '#764ba2']);
            setSelectedTheme(card.theme || 'classic');
            setSelectedBackground(card.background_type || 'gradient');
            setSelectedButtonStyle(card.button_style || 'fill');
            setSelectedFont(card.font_style || 'default');

            const { data: cardLinks, error: linksError } = await supabase
              .from('card_links')
              .select('*')
              .eq('card_id', card.id)
              .order('display_order', { ascending: true });

            if (!linksError && cardLinks) {
              setLinks(cardLinks.map(link => ({
                id: link.id,
                platform: link.platform,
                value: link.url,
                title: link.title,
                clicks: link.click_count || 0,
              })));
            }
          }
        }
      } catch (error) {
        console.error('Error loading card:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCardData();
  }, [user, isNewCard, cardId]);

  // Save appearance settings
  const saveAppearanceSettings = async (settings: Partial<CardData>) => {
    if (!cardData?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('digital_cards')
        .update(settings)
        .eq('id', cardData.id);
      
      if (error) throw error;
      
      setCardData(prev => prev ? { ...prev, ...settings } : null);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Theme selection handler
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

  // Background selection handler
  const handleBackgroundSelect = (bgType: string) => {
    if (bgType === 'video' && !isPro) {
      Alert.alert('Pro Feature', 'Video backgrounds are available with Tavvy Pro!', [
        { text: 'Maybe Later', style: 'cancel' },
        { text: 'Upgrade', onPress: () => navigation.navigate('ECardPremiumUpsell') }
      ]);
      return;
    }
    setSelectedBackground(bgType);
    saveAppearanceSettings({ background_type: bgType });
  };

  // Preset gradient selection
  const handlePresetGradientSelect = (gradient: { id: string; name: string; colors: string[] }) => {
    setGradientColors(gradient.colors as [string, string]);
    saveAppearanceSettings({
      gradient_color_1: gradient.colors[0],
      gradient_color_2: gradient.colors[1],
    });
  };

  // Solid color selection
  const handleSolidColorSelect = (color: string) => {
    setGradientColors([color, color]);
    saveAppearanceSettings({
      gradient_color_1: color,
      gradient_color_2: color,
    });
  };

  // Open color picker
  const openColorPicker = (index: 0 | 1) => {
    setEditingColorIndex(index);
    setTempColor(gradientColors[index]);
    setShowColorPicker(true);
  };

  // Apply custom color
  const applyCustomColor = () => {
    const newColors: [string, string] = [...gradientColors];
    newColors[editingColorIndex] = tempColor;
    setGradientColors(newColors);
    saveAppearanceSettings({
      gradient_color_1: newColors[0],
      gradient_color_2: newColors[1],
    });
    setShowColorPicker(false);
  };

  // Button style selection
  const handleButtonStyleSelect = (styleId: string) => {
    setSelectedButtonStyle(styleId);
    saveAppearanceSettings({ button_style: styleId });
  };

  // Font selection
  const handleFontSelect = (fontId: string) => {
    setSelectedFont(fontId);
    saveAppearanceSettings({ font_style: fontId });
  };

  // Delete card function
  const handleDeleteCard = () => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card? This will permanently delete your card, all links, and free up your URL slug. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              
              // Delete all links first
              if (cardData?.id) {
                await supabase
                  .from('card_links')
                  .delete()
                  .eq('card_id', cardData.id);
                
                // Delete the card
                const { error } = await supabase
                  .from('digital_cards')
                  .delete()
                  .eq('id', cardData.id);
                
                if (error) throw error;
                
                Alert.alert('Success', 'Your card has been deleted.', [
                  { text: 'OK', onPress: () => navigation.navigate('MyCards') }
                ]);
              }
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete card. Please try again.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  // Share functions
  const handleShare = async () => {
    try {
      await Share.share({ url: `https://${cardUrl}` });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(`https://${cardUrl}`);
    Alert.alert('Copied!', `https://${cardUrl}`);
  };

  // QR Code generation
  const generateQRCode = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://${cardUrl}`;
    setQrCodeUrl(qrUrl);
    setShowQRModal(true);
  };

  // Add link handler
  const handleAddLink = () => {
    if (!canAddMoreLinks) {
      Alert.alert(
        'Link Limit Reached',
        `Free users can add up to ${FREE_LINK_LIMIT} links. Upgrade to Pro for unlimited links!`,
        [
          { text: 'Maybe Later', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('ECardPremiumUpsell') }
        ]
      );
      return;
    }
    
    navigation.navigate('ECardAddLink', {
      onAdd: (newLink: LinkItem) => {
        setLinks(prev => [...prev, newLink]);
      },
    });
  };

  // Edit link handler
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

  // Get current theme config
  const getCurrentTheme = () => {
    return THEMES.find(t => t.id === selectedTheme) || THEMES[0];
  };

  // Get text color based on background
  const getTextColor = () => {
    const theme = getCurrentTheme();
    return theme.textColor || '#fff';
  };


  // Render Live Card Preview
  const renderLivePreview = () => {
    const theme = getCurrentTheme();
    const textColor = getTextColor();
    const hasLightBg = theme.id === 'minimal';
    
    return (
      <View style={styles.previewContainer}>
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.previewCard,
            hasLightBg && styles.previewCardBorder
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Profile Photo */}
          <View style={[styles.previewPhotoContainer, hasLightBg && styles.previewPhotoBorderDark]}>
            {cardData?.profile_photo_url ? (
              <Image source={{ uri: cardData.profile_photo_url }} style={styles.previewPhoto} />
            ) : (
              <Ionicons name="person" size={28} color={hasLightBg ? '#666' : 'rgba(255,255,255,0.5)'} />
            )}
          </View>
          
          {/* Name & Title */}
          <Text style={[styles.previewName, { color: textColor }]} numberOfLines={1}>
            {cardData?.full_name || 'Your Name'}
          </Text>
          <Text style={[styles.previewTitle, { color: hasLightBg ? '#666' : 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>
            {cardData?.title || 'Your Title'}
          </Text>
          
          {/* Links Preview */}
          <View style={styles.previewLinksRow}>
            {links.slice(0, 4).map((link, index) => {
              const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
              return (
                <View 
                  key={link.id || index} 
                  style={[
                    styles.previewLinkIcon,
                    selectedButtonStyle === 'outline' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: textColor },
                    selectedButtonStyle === 'rounded' && { borderRadius: 8 },
                    selectedButtonStyle === 'pill' && { borderRadius: 20 },
                    selectedButtonStyle === 'minimal' && { backgroundColor: 'transparent' },
                  ]}
                >
                  <Ionicons 
                    name={platformConfig.icon as any} 
                    size={16} 
                    color={selectedButtonStyle === 'outline' || selectedButtonStyle === 'minimal' ? textColor : platformConfig.color} 
                  />
                </View>
              );
            })}
            {links.length > 4 && (
              <View style={styles.previewMoreLinks}>
                <Text style={[styles.previewMoreText, { color: textColor }]}>+{links.length - 4}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>
    );
  };

  // Render Links Tab
  const renderLinksTab = () => (
    <View style={styles.tabContent}>
      {/* Link Limit Info for Free Users */}
      {!isPro && (
        <View style={styles.linkLimitBanner}>
          <Ionicons name="information-circle" size={18} color="#F97316" />
          <Text style={styles.linkLimitText}>
            {links.length}/{FREE_LINK_LIMIT} links used
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('ECardPremiumUpsell')}>
            <Text style={styles.upgradeText}>Upgrade</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Add New Link Button */}
      <TouchableOpacity 
        style={[styles.addLinkButton, !canAddMoreLinks && styles.addLinkButtonDisabled]}
        onPress={handleAddLink}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={canAddMoreLinks ? ['#00C853', '#00E676'] : ['#E0E0E0', '#BDBDBD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.addLinkGradient}
        >
          <Ionicons name="add-circle" size={24} color={canAddMoreLinks ? '#fff' : '#9E9E9E'} />
          <Text style={[styles.addLinkText, !canAddMoreLinks && styles.addLinkTextDisabled]}>Add New Link</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Links List */}
      {links.length > 0 ? (
        <View style={styles.linksList}>
          {links.map((link, index) => {
            const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
            return (
              <TouchableOpacity
                key={link.id || index}
                style={styles.linkItem}
                onPress={() => handleEditLink(link)}
                activeOpacity={0.7}
              >
                <View style={styles.linkDragHandle}>
                  <Ionicons name="menu" size={20} color="#BDBDBD" />
                </View>
                <View style={[styles.linkIconContainer, { backgroundColor: platformConfig.bgColor }]}>
                  <Ionicons name={platformConfig.icon as any} size={20} color={platformConfig.color} />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkTitle}>{link.title || link.platform}</Text>
                  <Text style={styles.linkValue} numberOfLines={1}>{link.value}</Text>
                </View>
                <View style={styles.linkStats}>
                  <Ionicons name="eye-outline" size={14} color="#9E9E9E" />
                  <Text style={styles.linkClicks}>{link.clicks || 0}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyLinks}>
          <Ionicons name="link-outline" size={48} color="#E0E0E0" />
          <Text style={styles.emptyLinksText}>No links added yet</Text>
          <Text style={styles.emptyLinksSubtext}>Tap the button above to add your first link</Text>
        </View>
      )}
    </View>
  );

  // Render Appearance Tab
  const renderAppearanceTab = () => (
    <View style={styles.tabContent}>
      {/* Themes Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Themes</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themesScroll}>
          {THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              style={[styles.themeOption, selectedTheme === theme.id && styles.selectedTheme]}
              onPress={() => handleThemeSelect(theme.id)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={theme.colors}
                style={[styles.themePreview, theme.hasBorder && styles.themePreviewBorder]}
              >
                <View style={[styles.themePhotoPlaceholder, theme.hasBorder && { borderColor: '#E0E0E0' }]} />
                <View style={[styles.themeLine, { backgroundColor: theme.textColor }]} />
                <View style={[styles.themeLine, styles.themeLineShort, { backgroundColor: theme.textColor }]} />
              </LinearGradient>
              <Text style={styles.themeName}>{theme.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Colors Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Colors</Text>
        </View>
        
        {/* Current Colors */}
        <View style={styles.currentColorsRow}>
          <TouchableOpacity style={styles.currentColorBox} onPress={() => openColorPicker(0)}>
            <View style={[styles.colorSwatch, { backgroundColor: gradientColors[0] }]} />
            <Text style={styles.colorLabel}>Color 1</Text>
          </TouchableOpacity>
          <Ionicons name="arrow-forward" size={16} color="#9E9E9E" />
          <TouchableOpacity style={styles.currentColorBox} onPress={() => openColorPicker(1)}>
            <View style={[styles.colorSwatch, { backgroundColor: gradientColors[1] }]} />
            <Text style={styles.colorLabel}>Color 2</Text>
          </TouchableOpacity>
        </View>

        {/* Preset Gradients */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
          {PRESET_GRADIENTS.map((gradient) => (
            <TouchableOpacity
              key={gradient.id}
              style={[
                styles.presetItem,
                gradientColors[0] === gradient.colors[0] && gradientColors[1] === gradient.colors[1] && styles.selectedPreset
              ]}
              onPress={() => handlePresetGradientSelect(gradient)}
            >
              <LinearGradient colors={gradient.colors} style={styles.presetGradient} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Backgrounds Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Backgrounds</Text>
        </View>
        <View style={styles.backgroundOptions}>
          {['solid', 'gradient', 'image', 'video'].map((bgType) => (
            <TouchableOpacity
              key={bgType}
              style={[styles.backgroundOption, selectedBackground === bgType && styles.selectedBackground]}
              onPress={() => handleBackgroundSelect(bgType)}
            >
              {bgType === 'solid' && <View style={[styles.bgPreview, { backgroundColor: gradientColors[0] }]} />}
              {bgType === 'gradient' && <LinearGradient colors={gradientColors} style={styles.bgPreview} />}
              {bgType === 'image' && (
                <View style={[styles.bgPreview, styles.bgPreviewIcon]}>
                  <Ionicons name="image" size={20} color="#9E9E9E" />
                </View>
              )}
              {bgType === 'video' && (
                <View style={[styles.bgPreview, styles.bgPreviewDark]}>
                  <Ionicons name="videocam" size={20} color="#fff" />
                  {!isPro && <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>}
                </View>
              )}
              <Text style={styles.bgName}>{bgType.charAt(0).toUpperCase() + bgType.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Button Styles Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Buttons</Text>
        </View>
        <View style={styles.buttonOptions}>
          {BUTTON_STYLES.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[styles.buttonOption, selectedButtonStyle === style.id && styles.selectedButtonOption]}
              onPress={() => handleButtonStyleSelect(style.id)}
            >
              <View style={[
                styles.buttonPreview,
                style.id === 'fill' && { backgroundColor: '#1A1A1A' },
                style.id === 'outline' && { borderWidth: 2, borderColor: '#1A1A1A', backgroundColor: 'transparent' },
                style.id === 'rounded' && { backgroundColor: '#1A1A1A', borderRadius: 8 },
                style.id === 'shadow' && { backgroundColor: '#1A1A1A', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
                style.id === 'pill' && { backgroundColor: '#1A1A1A', borderRadius: 20 },
                style.id === 'minimal' && { backgroundColor: 'transparent', borderBottomWidth: 2, borderBottomColor: '#1A1A1A' },
              ]}>
                <Text style={[styles.buttonPreviewText, (style.id === 'outline' || style.id === 'minimal') && { color: '#1A1A1A' }]}>
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
          <Text style={styles.sectionSubtitle}>{FONTS.length} fonts ({PREMIUM_FONT_COUNT} premium)</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontsScroll}>
          {FONTS.map((font) => (
            <TouchableOpacity
              key={font.id}
              style={[styles.fontOption, selectedFont === font.id && styles.selectedFont]}
              onPress={() => {
                if (font.isPremium && !isPro) {
                  navigation.navigate('ECardPremiumUpsell');
                } else {
                  handleFontSelect(font.id);
                }
              }}
            >
              {font.isPremium && (
                <View style={styles.fontProBadge}>
                  <Text style={styles.fontProBadgeText}>PRO</Text>
                </View>
              )}
              <Text style={[styles.fontPreview, font.style]}>{font.preview}</Text>
              <Text style={styles.fontName}>{font.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  // Render Analytics Tab
  const renderAnalyticsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.analyticsCard}>
        <View style={styles.analyticsHeader}>
          <Ionicons name="bar-chart" size={24} color="#00C853" />
          <Text style={styles.analyticsTitle}>Card Performance</Text>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Link Clicks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0%</Text>
            <Text style={styles.statLabel}>Click Rate</Text>
          </View>
        </View>
      </View>

      {!isPro && (
        <TouchableOpacity 
          style={styles.upgradeCard}
          onPress={() => navigation.navigate('ECardPremiumUpsell')}
        >
          <LinearGradient
            colors={['#F97316', '#FACC15']}
            style={styles.upgradeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="star" size={24} color="#fff" />
            <View style={styles.upgradeTextContainer}>
              <Text style={styles.upgradeTitle}>Unlock Advanced Analytics</Text>
              <Text style={styles.upgradeSubtitle}>Track views, clicks, and engagement</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={styles.linkAnalytics}>
        <Text style={styles.linkAnalyticsTitle}>Link Performance</Text>
        {links.length > 0 ? (
          links.map((link, index) => {
            const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
            return (
              <View key={link.id || index} style={styles.linkAnalyticsItem}>
                <View style={[styles.linkAnalyticsIcon, { backgroundColor: platformConfig.bgColor }]}>
                  <Ionicons name={platformConfig.icon as any} size={16} color={platformConfig.color} />
                </View>
                <Text style={styles.linkAnalyticsName}>{link.title || link.platform}</Text>
                <Text style={styles.linkAnalyticsClicks}>{link.clicks || 0} clicks</Text>
              </View>
            );
          })
        ) : (
          <Text style={styles.noLinksText}>Add links to see their performance</Text>
        )}
      </View>

      {/* Delete Card Section */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.deleteCardButton} onPress={handleDeleteCard}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
          <Text style={styles.deleteCardText}>Delete This Card</Text>
        </TouchableOpacity>
        <Text style={styles.deleteCardHint}>This will permanently delete your card, all links, and free up your URL slug.</Text>
      </View>
    </View>
  );

  // Render QR Modal
  const renderQRModal = () => (
    <Modal
      visible={showQRModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowQRModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.qrModalContent}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowQRModal(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.qrModalTitle}>Your QR Code</Text>
          {qrCodeUrl && (
            <Image source={{ uri: qrCodeUrl }} style={styles.qrCodeImage} />
          )}
          <Text style={styles.qrModalUrl}>{cardUrl}</Text>
          <View style={styles.qrModalActions}>
            <TouchableOpacity style={styles.qrActionButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#00C853" />
              <Text style={styles.qrActionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render Slug Modal
  const renderSlugModal = () => (
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
          
          {slugAvailable === true && (
            <View style={styles.slugStatusRow}>
              <Ionicons name="checkmark-circle" size={18} color="#00C853" />
              <Text style={styles.slugAvailableText}>Available!</Text>
            </View>
          )}
          
          {slugAvailable === false && (
            <View style={styles.slugStatusRow}>
              <Ionicons name="close-circle" size={18} color="#F44336" />
              <Text style={styles.slugUnavailableText}>Already taken</Text>
            </View>
          )}
          
          <View style={styles.slugModalActions}>
            <TouchableOpacity
              style={styles.checkButton}
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
                <Text style={styles.checkButtonText}>Check</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveSlugButton, !slugAvailable && styles.saveSlugButtonDisabled]}
              onPress={async () => {
                if (!slugAvailable || !cardData?.id) return;
                try {
                  await supabase.from('digital_cards').update({ slug: slugInput }).eq('id', cardData.id);
                  setCardData(prev => prev ? { ...prev, slug: slugInput } : null);
                  setCardUrl(`tavvy.com/${slugInput}`);
                  setShowSlugModal(false);
                  Alert.alert('Success', 'URL updated!');
                } catch (error) {
                  Alert.alert('Error', 'Failed to update URL');
                }
              }}
              disabled={!slugAvailable}
            >
              <LinearGradient
                colors={slugAvailable ? ['#00C853', '#00E676'] : ['#E0E0E0', '#BDBDBD']}
                style={styles.saveSlugGradient}
              >
                <Text style={[styles.saveSlugText, !slugAvailable && { color: '#9E9E9E' }]}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render Color Picker Modal
  const renderColorPickerModal = () => (
    <Modal
      visible={showColorPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowColorPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.colorPickerContent}>
          <View style={styles.colorPickerHeader}>
            <Text style={styles.colorPickerTitle}>
              {editingColorIndex === 0 ? 'Color 1' : 'Color 2'}
            </Text>
            <TouchableOpacity onPress={() => setShowColorPicker(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.colorPreviewLarge, { backgroundColor: tempColor }]} />
          
          <View style={styles.hexInputRow}>
            <Text style={styles.hexLabel}>Hex:</Text>
            <TextInput
              style={styles.hexInput}
              value={tempColor}
              onChangeText={(text) => {
                let formatted = text.toUpperCase();
                if (!formatted.startsWith('#')) formatted = '#' + formatted;
                if (formatted.length <= 7) setTempColor(formatted);
              }}
              placeholder="#667EEA"
              maxLength={7}
            />
          </View>
          
          <View style={styles.quickColors}>
            {PRESET_COLORS.slice(0, 12).map((color, index) => (
              <TouchableOpacity
                key={`${color}-${index}`}
                style={[styles.quickColorItem, tempColor === color && styles.quickColorSelected]}
                onPress={() => setTempColor(color)}
              >
                <View style={[styles.quickColorSwatch, { backgroundColor: color }]} />
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.applyColorButton} onPress={applyCustomColor}>
            <LinearGradient colors={['#00C853', '#00E676']} style={styles.applyColorGradient}>
              <Text style={styles.applyColorText}>Apply Color</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );


  // Loading state
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
        <TouchableOpacity 
          onPress={() => navigation.navigate('ECardPreview', { cardData })} 
          style={styles.previewButton}
        >
          <Ionicons name="eye-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* Live Card Preview */}
      {renderLivePreview()}

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
          <Ionicons name="link" size={16} color="#666" />
          <Text style={styles.cardUrlText} numberOfLines={1}>{cardUrl}</Text>
          <Ionicons name="pencil" size={12} color="#00C853" />
        </TouchableOpacity>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCopyLink}>
            <Ionicons name="copy-outline" size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={generateQRCode}>
            <Ionicons name="qr-code-outline" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'links' && styles.activeTab]}
          onPress={() => setActiveTab('links')}
        >
          <Ionicons name="link" size={16} color={activeTab === 'links' ? '#00C853' : '#9E9E9E'} />
          <Text style={[styles.tabText, activeTab === 'links' && styles.activeTabText]}>Links</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'appearance' && styles.activeTab]}
          onPress={() => setActiveTab('appearance')}
        >
          <Ionicons name="color-palette" size={16} color={activeTab === 'appearance' ? '#00C853' : '#9E9E9E'} />
          <Text style={[styles.tabText, activeTab === 'appearance' && styles.activeTabText]}>Appearance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Ionicons name="bar-chart" size={16} color={activeTab === 'analytics' ? '#00C853' : '#9E9E9E'} />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'links' && renderLinksTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>

      {/* Modals */}
      {renderQRModal()}
      {renderSlugModal()}
      {renderColorPickerModal()}
      
      {/* Saving Indicator */}
      {isSaving && (
        <View style={styles.savingIndicator}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  
  // Live Preview
  previewContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  previewCard: {
    width: width - 80,
    height: PREVIEW_HEIGHT,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCardBorder: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewPhotoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  previewPhotoBorderDark: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  previewPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewTitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  previewLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewLinkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewMoreLinks: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewMoreText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Card URL Section
  cardUrlSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardUrlBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    gap: 6,
  },
  cardUrlText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00C853',
  },
  tabText: {
    fontSize: 13,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#00C853',
    fontWeight: '600',
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  
  // Link Limit Banner
  linkLimitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    gap: 8,
  },
  linkLimitText: {
    flex: 1,
    fontSize: 13,
    color: '#9A3412',
  },
  upgradeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F97316',
  },
  
  // Add Link Button
  addLinkButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addLinkButtonDisabled: {
    opacity: 0.7,
  },
  addLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  addLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addLinkTextDisabled: {
    color: '#9E9E9E',
  },
  
  // Links List
  linksList: {
    gap: 8,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  linkDragHandle: {
    marginRight: 8,
  },
  linkIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  linkValue: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 2,
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
  
  // Empty Links
  emptyLinks: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyLinksText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: 12,
  },
  emptyLinksSubtext: {
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 4,
  },
  
  // Appearance Section
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  
  // Themes
  themesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  themeOption: {
    marginRight: 12,
    alignItems: 'center',
  },
  selectedTheme: {
    transform: [{ scale: 1.05 }],
  },
  themePreview: {
    width: 70,
    height: 90,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themePreviewBorder: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  themePhotoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
  },
  themeLine: {
    width: 30,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
    opacity: 0.7,
  },
  themeLineShort: {
    width: 20,
  },
  themeName: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  
  // Colors
  currentColorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 16,
  },
  currentColorBox: {
    alignItems: 'center',
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  colorLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  presetsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  presetItem: {
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPreset: {
    borderColor: '#00C853',
  },
  presetGradient: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  
  // Backgrounds
  backgroundOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  backgroundOption: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
  },
  selectedBackground: {
    borderColor: '#00C853',
  },
  bgPreview: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    marginBottom: 6,
  },
  bgPreviewIcon: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgPreviewDark: {
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FACC15',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bgName: {
    fontSize: 12,
    color: '#666',
  },
  
  // Button Styles
  buttonOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buttonOption: {
    width: (width - 48) / 3 - 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
  },
  selectedButtonOption: {
    borderColor: '#00C853',
  },
  buttonPreview: {
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPreviewText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Fonts
  fontsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  fontOption: {
    marginRight: 12,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#fff',
    minWidth: 70,
  },
  selectedFont: {
    borderColor: '#00C853',
  },
  fontPreview: {
    fontSize: 24,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  fontName: {
    fontSize: 11,
    color: '#666',
  },
  fontProBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FACC15',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fontProBadgeText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  fontNameDummy: {
    color: '#666',
  },
  
  // Analytics
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  upgradeCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  upgradeTextContainer: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  upgradeSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  linkAnalytics: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  linkAnalyticsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  linkAnalyticsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  linkAnalyticsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkAnalyticsName: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  linkAnalyticsClicks: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  noLinksText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  qrModalUrl: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  qrModalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  qrActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  qrActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
  },
  
  // Slug Modal
  slugModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
  },
  slugModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  slugModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  slugInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  slugPrefix: {
    fontSize: 15,
    color: '#9E9E9E',
  },
  slugInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    paddingVertical: 14,
  },
  slugStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  slugAvailableText: {
    fontSize: 14,
    color: '#00C853',
  },
  slugUnavailableText: {
    fontSize: 14,
    color: '#F44336',
  },
  slugModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  checkButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  checkButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  saveSlugButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveSlugButtonDisabled: {
    opacity: 0.5,
  },
  saveSlugGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveSlugText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Color Picker Modal
  colorPickerContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: width - 48,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  colorPreviewLarge: {
    width: '100%',
    height: 80,
    borderRadius: 12,
    marginBottom: 16,
  },
  hexInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  hexLabel: {
    fontSize: 14,
    color: '#666',
  },
  hexInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
  },
  quickColors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickColorItem: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickColorSelected: {
    borderColor: '#00C853',
  },
  quickColorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  applyColorButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyColorGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyColorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Saving Indicator
  savingIndicator: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  savingText: {
    fontSize: 14,
    color: '#fff',
  },
  
  // Danger Zone / Delete Card
  dangerZone: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 12,
  },
  deleteCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  deleteCardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteCardHint: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 8,
    textAlign: 'center',
  },
});
