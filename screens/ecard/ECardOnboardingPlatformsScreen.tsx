import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Platform configuration
const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { id: 'twitter', name: 'X / Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00' },
  { id: 'pinterest', name: 'Pinterest', icon: 'logo-pinterest', color: '#E60023' },
  { id: 'twitch', name: 'Twitch', icon: 'logo-twitch', color: '#9146FF' },
  { id: 'discord', name: 'Discord', icon: 'logo-discord', color: '#5865F2' },
  { id: 'spotify', name: 'Spotify', icon: 'musical-notes', color: '#1DB954' },
  { id: 'apple_music', name: 'Apple Music', icon: 'musical-note', color: '#FA243C' },
  { id: 'soundcloud', name: 'SoundCloud', icon: 'cloud', color: '#FF5500' },
  { id: 'github', name: 'GitHub', icon: 'logo-github', color: '#181717' },
  { id: 'dribbble', name: 'Dribbble', icon: 'logo-dribbble', color: '#EA4C89' },
  { id: 'behance', name: 'Behance', icon: 'color-palette', color: '#1769FF' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { id: 'telegram', name: 'Telegram', icon: 'paper-plane', color: '#0088CC' },
  { id: 'email', name: 'Email', icon: 'mail', color: '#EA4335' },
  { id: 'website', name: 'Website', icon: 'globe', color: '#4A90D9' },
  { id: 'phone', name: 'Phone', icon: 'call', color: '#34C759' },
  { id: 'other', name: 'Other', icon: 'link', color: '#8E8E93' },
];

interface Props {
  navigation: any;
  route: any;
}

export default function ECardOnboardingPlatformsScreen({ navigation, route }: Props) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const templateId = route.params?.templateId || 'classic-blue';
  const colorSchemeId = route.params?.colorSchemeId || 'blue';

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleContinue = () => {
    navigation.navigate('ECardOnboardingProfile', {
      templateId,
      colorSchemeId,
      selectedPlatforms,
    });
  };

  const handleSkip = () => {
    navigation.navigate('ECardOnboardingProfile', {
      templateId,
      colorSchemeId,
      selectedPlatforms: [],
    });
  };

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
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
          <Text style={styles.stepText}>Step 1 of 3</Text>
        </View>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Pick your platforms</Text>
        <Text style={styles.subtitle}>
          Select the platforms you want to share on your card. You can always add more later.
        </Text>
      </View>

      {/* Platform Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
      >
        {PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          return (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformCard,
                isSelected && styles.platformCardSelected,
              ]}
              onPress={() => togglePlatform(platform.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                { backgroundColor: platform.color + '15' }
              ]}>
                <Ionicons 
                  name={platform.icon as any} 
                  size={28} 
                  color={platform.color} 
                />
              </View>
              <Text style={styles.platformName}>{platform.name}</Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#00C853" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedPlatforms.length === 0 && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={selectedPlatforms.length > 0 ? ['#00C853', '#00E676'] : ['#E0E0E0', '#BDBDBD']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={[
              styles.continueButtonText,
              selectedPlatforms.length === 0 && styles.continueButtonTextDisabled
            ]}>
              Continue {selectedPlatforms.length > 0 && `(${selectedPlatforms.length} selected)`}
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={selectedPlatforms.length > 0 ? '#fff' : '#9E9E9E'} 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  skipText: {
    fontSize: 16,
    color: '#00C853',
    fontWeight: '600',
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
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
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  platformCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: '1.66%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  platformCardSelected: {
    borderColor: '#00C853',
    backgroundColor: '#E8F5E9',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  continueButtonDisabled: {
    opacity: 0.7,
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
  continueButtonTextDisabled: {
    color: '#9E9E9E',
  },
});
