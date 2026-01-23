import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Platform configuration with URL patterns
const PLATFORM_CONFIG: Record<string, { name: string; icon: string; color: string; placeholder: string; prefix: string }> = {
  instagram: { name: 'Instagram', icon: 'logo-instagram', color: '#E4405F', placeholder: 'username', prefix: 'instagram.com/' },
  tiktok: { name: 'TikTok', icon: 'logo-tiktok', color: '#000000', placeholder: '@username', prefix: 'tiktok.com/@' },
  youtube: { name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', placeholder: 'channel name', prefix: 'youtube.com/' },
  twitter: { name: 'X / Twitter', icon: 'logo-twitter', color: '#1DA1F2', placeholder: 'username', prefix: 'x.com/' },
  linkedin: { name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2', placeholder: 'username', prefix: 'linkedin.com/in/' },
  facebook: { name: 'Facebook', icon: 'logo-facebook', color: '#1877F2', placeholder: 'username', prefix: 'facebook.com/' },
  snapchat: { name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00', placeholder: 'username', prefix: 'snapchat.com/add/' },
  pinterest: { name: 'Pinterest', icon: 'logo-pinterest', color: '#E60023', placeholder: 'username', prefix: 'pinterest.com/' },
  twitch: { name: 'Twitch', icon: 'logo-twitch', color: '#9146FF', placeholder: 'username', prefix: 'twitch.tv/' },
  discord: { name: 'Discord', icon: 'logo-discord', color: '#5865F2', placeholder: 'invite code', prefix: 'discord.gg/' },
  spotify: { name: 'Spotify', icon: 'musical-notes', color: '#1DB954', placeholder: 'profile link', prefix: '' },
  apple_music: { name: 'Apple Music', icon: 'musical-note', color: '#FA243C', placeholder: 'profile link', prefix: '' },
  soundcloud: { name: 'SoundCloud', icon: 'cloud', color: '#FF5500', placeholder: 'username', prefix: 'soundcloud.com/' },
  github: { name: 'GitHub', icon: 'logo-github', color: '#181717', placeholder: 'username', prefix: 'github.com/' },
  dribbble: { name: 'Dribbble', icon: 'logo-dribbble', color: '#EA4C89', placeholder: 'username', prefix: 'dribbble.com/' },
  behance: { name: 'Behance', icon: 'color-palette', color: '#1769FF', placeholder: 'username', prefix: 'behance.net/' },
  whatsapp: { name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366', placeholder: 'phone number', prefix: 'wa.me/' },
  telegram: { name: 'Telegram', icon: 'paper-plane', color: '#0088CC', placeholder: 'username', prefix: 't.me/' },
  email: { name: 'Email', icon: 'mail', color: '#EA4335', placeholder: 'your@email.com', prefix: '' },
  website: { name: 'Website', icon: 'globe', color: '#4A90D9', placeholder: 'yourwebsite.com', prefix: '' },
  phone: { name: 'Phone', icon: 'call', color: '#34C759', placeholder: '+1 234 567 8900', prefix: '' },
  other: { name: 'Custom Link', icon: 'link', color: '#8E8E93', placeholder: 'https://...', prefix: '' },
};

interface LinkItem {
  id: string;
  platform: string;
  value: string;
}

interface Props {
  navigation: any;
  route: any;
}

export default function ECardOnboardingLinksScreen({ navigation, route }: Props) {
  const { templateId, colorSchemeId, selectedPlatforms, profile } = route.params || {};
  
  const [links, setLinks] = useState<LinkItem[]>([]);

  // Initialize links from selected platforms
  useEffect(() => {
    if (selectedPlatforms && selectedPlatforms.length > 0) {
      const initialLinks = selectedPlatforms.map((platform: string) => ({
        id: platform,
        platform,
        value: '',
      }));
      setLinks(initialLinks);
    }
  }, []);

  const updateLinkValue = (id: string, value: string) => {
    setLinks(prev => prev.map(link => 
      link.id === id ? { ...link, value } : link
    ));
  };

  const removeLink = (id: string) => {
    setLinks(prev => prev.filter(link => link.id !== id));
  };

  const addCustomLink = () => {
    const newLink: LinkItem = {
      id: `custom-${Date.now()}`,
      platform: 'other',
      value: '',
    };
    setLinks(prev => [...prev, newLink]);
  };

  const handleFinish = () => {
    // Filter out empty links
    const validLinks = links.filter(link => link.value.trim().length > 0);
    
    navigation.navigate('ECardOnboardingComplete', {
      templateId,
      colorSchemeId,
      profile,
      links: validLinks,
    });
  };

  const filledLinksCount = links.filter(link => link.value.trim().length > 0).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.stepText}>Step 3 of 3</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Add your links</Text>
            <Text style={styles.subtitle}>
              Fill in your usernames or URLs. Leave empty to skip any platform.
            </Text>
          </View>

          {/* Links List */}
          <View style={styles.linksContainer}>
            {links.map((link) => {
              const config = PLATFORM_CONFIG[link.platform] || PLATFORM_CONFIG.other;
              return (
                <View key={link.id} style={styles.linkCard}>
                  <View style={styles.linkHeader}>
                    <View style={[styles.linkIcon, { backgroundColor: config.color + '15' }]}>
                      <Ionicons name={config.icon as any} size={20} color={config.color} />
                    </View>
                    <Text style={styles.linkName}>{config.name}</Text>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeLink(link.id)}
                    >
                      <Ionicons name="close-circle" size={22} color="#BDBDBD" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inputContainer}>
                    {config.prefix ? (
                      <Text style={styles.inputPrefix}>{config.prefix}</Text>
                    ) : null}
                    <TextInput
                      style={[styles.linkInput, !config.prefix && styles.linkInputFull]}
                      placeholder={config.placeholder}
                      placeholderTextColor="#BDBDBD"
                      value={link.value}
                      onChangeText={(value) => updateLinkValue(link.id, value)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType={link.platform === 'email' ? 'email-address' : link.platform === 'phone' ? 'phone-pad' : 'default'}
                    />
                  </View>
                </View>
              );
            })}

            {/* Add Custom Link Button */}
            <TouchableOpacity 
              style={styles.addLinkButton}
              onPress={addCustomLink}
              activeOpacity={0.7}
            >
              <View style={styles.addLinkIcon}>
                <Ionicons name="add" size={24} color="#00C853" />
              </View>
              <Text style={styles.addLinkText}>Add custom link</Text>
            </TouchableOpacity>
          </View>

          {/* Empty State */}
          {links.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="link-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyStateText}>No platforms selected</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Add custom link" to add your first link
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#00C853', '#00E676']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.continueButtonText}>
                {filledLinksCount > 0 
                  ? `Finish (${filledLinksCount} link${filledLinksCount > 1 ? 's' : ''})` 
                  : 'Finish without links'}
              </Text>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  keyboardView: {
    flex: 1,
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
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00C853',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  linksContainer: {
    paddingHorizontal: 24,
  },
  linkCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  linkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  removeButton: {
    padding: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  inputPrefix: {
    paddingLeft: 12,
    paddingRight: 4,
    fontSize: 14,
    color: '#9E9E9E',
  },
  linkInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
  },
  linkInputFull: {
    paddingLeft: 12,
  },
  addLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E8F5E9',
    borderStyle: 'dashed',
  },
  addLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00C853',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#BDBDBD',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
});
