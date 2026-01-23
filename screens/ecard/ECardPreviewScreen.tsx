import React from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

interface Props {
  navigation: any;
  route: any;
}

export default function ECardPreviewScreen({ navigation, route }: Props) {
  const { profile, links, templateId } = route.params || {};

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my digital card!`,
        url: `https://tavvy.com/card/preview`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLinkPress = (link: any) => {
    let url = link.value;
    
    // Build full URL based on platform
    switch (link.platform) {
      case 'instagram':
        url = `https://instagram.com/${link.value}`;
        break;
      case 'tiktok':
        url = `https://tiktok.com/@${link.value.replace('@', '')}`;
        break;
      case 'twitter':
        url = `https://x.com/${link.value}`;
        break;
      case 'linkedin':
        url = `https://linkedin.com/in/${link.value}`;
        break;
      case 'facebook':
        url = `https://facebook.com/${link.value}`;
        break;
      case 'youtube':
        url = `https://youtube.com/${link.value}`;
        break;
      case 'github':
        url = `https://github.com/${link.value}`;
        break;
      case 'email':
        url = `mailto:${link.value}`;
        break;
      case 'phone':
        url = `tel:${link.value}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/${link.value.replace(/\D/g, '')}`;
        break;
      default:
        if (!url.startsWith('http')) {
          url = `https://${url}`;
        }
    }
    
    Linking.openURL(url).catch(err => console.error('Error opening URL:', err));
  };

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
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardContainer}
        >
          {/* Profile Section */}
          <View style={styles.profileSection}>
            {profile?.image ? (
              <Image source={{ uri: profile.image }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <Text style={styles.profileName}>{profile?.name || 'Your Name'}</Text>
            {profile?.title ? (
              <Text style={styles.profileTitle}>{profile.title}</Text>
            ) : null}
            {profile?.bio ? (
              <Text style={styles.profileBio}>{profile.bio}</Text>
            ) : null}
          </View>

          {/* Social Icons Row */}
          {links && links.length > 0 && (
            <View style={styles.socialIconsRow}>
              {links.slice(0, 6).map((link: any) => {
                const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
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
          {links && links.length > 0 && (
            <View style={styles.linksSection}>
              {links.map((link: any) => {
                const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
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
                      {link.title || link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Empty State */}
          {(!links || links.length === 0) && (
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
          onPress={() => navigation.goBack()}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  cardContainer: {
    borderRadius: 24,
    padding: 24,
    minHeight: 500,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
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
  },
  profileTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  profileBio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  socialIconsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  socialIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linksSection: {
    gap: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  linkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginRight: 44, // Balance the icon
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 12,
  },
  poweredBy: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
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
