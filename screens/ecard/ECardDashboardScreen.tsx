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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

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

interface LinkItem {
  id: string;
  platform: string;
  value: string;
  title?: string;
  clicks?: number;
}

interface Props {
  navigation: any;
  route: any;
}

export default function ECardDashboardScreen({ navigation, route }: Props) {
  const { templateId, colorSchemeId, profile, links: initialLinks, isNewCard, openAppearance } = route.params || {};
  
  const [links, setLinks] = useState<LinkItem[]>(initialLinks || []);
  const [activeTab, setActiveTab] = useState<'links' | 'appearance' | 'analytics'>('links');
  // Generate card URL from profile name (will be dynamic based on saved slug)
  const generateSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
  const [cardUrl] = useState(`tavvy.com/${profile?.name ? generateSlug(profile.name) : 'yourname'}`);
  
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (openAppearance) {
      setActiveTab('appearance');
    }
  }, [openAppearance]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my digital card: https://${cardUrl}`,
        url: `https://${cardUrl}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(`https://${cardUrl}`);
    Alert.alert('Copied!', 'Link copied to clipboard');
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
      {/* Themes Section */}
      <View style={styles.appearanceSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Themes</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ECardThemes')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themesScroll}>
          {['classic', 'modern', 'minimal', 'bold', 'elegant'].map((theme, index) => (
            <TouchableOpacity key={theme} style={styles.themeCard}>
              <LinearGradient
                colors={index === 0 ? ['#667eea', '#764ba2'] : index === 1 ? ['#00C853', '#00E676'] : index === 2 ? ['#fff', '#f5f5f5'] : index === 3 ? ['#FF6B6B', '#FF8E53'] : ['#1A1A1A', '#333']}
                style={styles.themePreview}
              >
                <View style={styles.themePreviewContent}>
                  <View style={styles.themePreviewCircle} />
                  <View style={styles.themePreviewLine} />
                  <View style={styles.themePreviewLineShort} />
                </View>
              </LinearGradient>
              <Text style={styles.themeName}>{theme.charAt(0).toUpperCase() + theme.slice(1)}</Text>
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
          <TouchableOpacity style={styles.backgroundOption}>
            <View style={[styles.backgroundPreview, { backgroundColor: '#667eea' }]} />
            <Text style={styles.backgroundName}>Solid</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backgroundOption}>
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.backgroundPreview} />
            <Text style={styles.backgroundName}>Gradient</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backgroundOption}>
            <View style={[styles.backgroundPreview, { backgroundColor: '#F5F5F5' }]}>
              <Ionicons name="image" size={20} color="#9E9E9E" />
            </View>
            <Text style={styles.backgroundName}>Image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backgroundOption}>
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
          <TouchableOpacity style={styles.buttonOption}>
            <View style={[styles.buttonPreview, { backgroundColor: '#1A1A1A' }]}>
              <Text style={styles.buttonPreviewText}>Fill</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonOption}>
            <View style={[styles.buttonPreview, { borderWidth: 2, borderColor: '#1A1A1A', backgroundColor: 'transparent' }]}>
              <Text style={[styles.buttonPreviewText, { color: '#1A1A1A' }]}>Outline</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonOption}>
            <View style={[styles.buttonPreview, { backgroundColor: '#1A1A1A', borderRadius: 8 }]}>
              <Text style={styles.buttonPreviewText}>Rounded</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonOption}>
            <View style={[styles.buttonPreview, { backgroundColor: '#1A1A1A', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }]}>
              <Text style={styles.buttonPreviewText}>Shadow</Text>
            </View>
          </TouchableOpacity>
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
          {['Default', 'Modern', 'Classic', 'Bold'].map((font) => (
            <TouchableOpacity key={font} style={styles.fontOption}>
              <Text style={[
                styles.fontPreviewText,
                font === 'Modern' && { fontWeight: '300' },
                font === 'Classic' && { fontStyle: 'italic' },
                font === 'Bold' && { fontWeight: '900' },
              ]}>Aa</Text>
              <Text style={styles.fontName}>{font}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Card</Text>
        <TouchableOpacity 
          style={styles.previewButton}
          onPress={() => navigation.navigate('ECardPreview', { profile, links, templateId })}
        >
          <Ionicons name="eye-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Preview Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradient}
          >
            {profile?.image ? (
              <Image source={{ uri: profile.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
            )}
            <Text style={styles.profileName}>{profile?.name || 'Your Name'}</Text>
            {profile?.title ? <Text style={styles.profileTitle}>{profile.title}</Text> : null}
          </LinearGradient>
          
          {/* Share Bar */}
          <View style={styles.shareBar}>
            <View style={styles.urlContainer}>
              <Ionicons name="link" size={16} color="#9E9E9E" />
              <Text style={styles.urlText} numberOfLines={1}>{cardUrl}</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
              <Ionicons name="copy-outline" size={18} color="#00C853" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {(['links', 'appearance', 'analytics'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons 
                name={tab === 'links' ? 'link' : tab === 'appearance' ? 'color-palette' : 'bar-chart'} 
                size={20} 
                color={activeTab === tab ? '#00C853' : '#9E9E9E'} 
              />
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === 'links' && renderLinksTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  previewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  profileGradient: {
    padding: 24,
    alignItems: 'center',
  },
  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  profileTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  shareBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  urlContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  urlText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#00C853',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#E8F5E9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  tabTextActive: {
    color: '#00C853',
  },
  tabContent: {
    padding: 20,
  },
  addLinkButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  addLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addLinkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  linksList: {
    gap: 12,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dragHandle: {
    paddingRight: 8,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
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
  reorderButtons: {
    gap: 2,
  },
  reorderBtn: {
    padding: 4,
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
    marginTop: 8,
    textAlign: 'center',
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
    fontWeight: '600',
    color: '#00C853',
  },
  themesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  themeCard: {
    marginRight: 12,
    alignItems: 'center',
  },
  themePreview: {
    width: 80,
    height: 120,
    borderRadius: 12,
    padding: 12,
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
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 4,
  },
  themePreviewLineShort: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  themeName: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  backgroundOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  backgroundOption: {
    flex: 1,
    alignItems: 'center',
  },
  backgroundPreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundName: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  proBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFD700',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#fff',
  },
  buttonOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonOption: {
    flex: 1,
  },
  buttonPreview: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fontPreviewText: {
    fontSize: 24,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  fontName: {
    fontSize: 11,
    color: '#9E9E9E',
  },
  analyticsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
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
    fontSize: 48,
    fontWeight: '700',
    color: '#00C853',
  },
  analyticsChart: {
    height: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#00C853',
    fontWeight: '600',
  },
  proUpsell: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  proUpsellGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  proUpsellText: {
    flex: 1,
  },
  proUpsellTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  proUpsellSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
