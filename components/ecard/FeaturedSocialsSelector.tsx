import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Social platform definitions
export const SOCIAL_PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { id: 'twitter', name: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00' },
  { id: 'pinterest', name: 'Pinterest', icon: 'logo-pinterest', color: '#E60023' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { id: 'telegram', name: 'Telegram', icon: 'paper-plane', color: '#0088CC' },
  { id: 'discord', name: 'Discord', icon: 'logo-discord', color: '#5865F2' },
  { id: 'twitch', name: 'Twitch', icon: 'logo-twitch', color: '#9146FF' },
  { id: 'spotify', name: 'Spotify', icon: 'musical-notes', color: '#1DB954' },
  { id: 'soundcloud', name: 'SoundCloud', icon: 'cloud', color: '#FF5500' },
  { id: 'github', name: 'GitHub', icon: 'logo-github', color: '#181717' },
  { id: 'dribbble', name: 'Dribbble', icon: 'logo-dribbble', color: '#EA4C89' },
  { id: 'behance', name: 'Behance', icon: 'brush', color: '#1769FF' },
  { id: 'medium', name: 'Medium', icon: 'document-text', color: '#000000' },
  { id: 'email', name: 'Email', icon: 'mail', color: '#EA4335' },
  { id: 'phone', name: 'Phone', icon: 'call', color: '#00C853' },
  { id: 'website', name: 'Website', icon: 'globe', color: '#2196F3' },
];

interface FeaturedSocial {
  platformId: string;
  url: string;
}

interface Props {
  featuredSocials: FeaturedSocial[];
  allLinks: FeaturedSocial[];
  onChange: (featured: FeaturedSocial[]) => void;
  maxFeatured?: number;
}

export default function FeaturedSocialsSelector({ 
  featuredSocials, 
  allLinks, 
  onChange,
  maxFeatured = 6 
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);

  // Get platform info by ID
  const getPlatform = (id: string) => {
    return SOCIAL_PLATFORMS.find(p => p.id === id) || {
      id,
      name: id,
      icon: 'link',
      color: '#666',
    };
  };

  // Check if a platform is featured
  const isFeatured = (platformId: string) => {
    return featuredSocials.some(f => f.platformId === platformId);
  };

  // Toggle a platform as featured
  const toggleFeatured = (link: FeaturedSocial) => {
    if (isFeatured(link.platformId)) {
      // Remove from featured
      onChange(featuredSocials.filter(f => f.platformId !== link.platformId));
    } else {
      // Add to featured (if under max)
      if (featuredSocials.length < maxFeatured) {
        onChange([...featuredSocials, link]);
      }
    }
  };

  // Move featured item up
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newFeatured = [...featuredSocials];
    [newFeatured[index - 1], newFeatured[index]] = [newFeatured[index], newFeatured[index - 1]];
    onChange(newFeatured);
  };

  // Move featured item down
  const moveDown = (index: number) => {
    if (index === featuredSocials.length - 1) return;
    const newFeatured = [...featuredSocials];
    [newFeatured[index], newFeatured[index + 1]] = [newFeatured[index + 1], newFeatured[index]];
    onChange(newFeatured);
  };

  return (
    <View style={styles.container}>
      {/* Featured Icons Row */}
      <View style={styles.featuredRow}>
        {featuredSocials.map((social, index) => {
          const platform = getPlatform(social.platformId);
          return (
            <TouchableOpacity
              key={social.platformId}
              style={[styles.featuredIcon, { backgroundColor: platform.color }]}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name={platform.icon as any} size={20} color="#fff" />
            </TouchableOpacity>
          );
        })}
        
        {/* Add Button */}
        {featuredSocials.length < maxFeatured && allLinks.length > featuredSocials.length && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#9E9E9E" />
          </TouchableOpacity>
        )}
      </View>

      {/* Edit hint */}
      <TouchableOpacity 
        style={styles.editHint}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.editHintText}>Tap to customize icons</Text>
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Featured Socials</Text>
            <TouchableOpacity 
              style={styles.doneButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                Select up to {maxFeatured} icons to display prominently. These won't appear in your links list below.
              </Text>
            </View>

            {/* Current Featured */}
            {featuredSocials.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured ({featuredSocials.length}/{maxFeatured})</Text>
                {featuredSocials.map((social, index) => {
                  const platform = getPlatform(social.platformId);
                  return (
                    <View key={social.platformId} style={styles.featuredItem}>
                      <View style={styles.reorderButtons}>
                        <TouchableOpacity
                          onPress={() => moveUp(index)}
                          disabled={index === 0}
                          style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                        >
                          <Ionicons name="chevron-up" size={18} color={index === 0 ? '#E0E0E0' : '#666'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => moveDown(index)}
                          disabled={index === featuredSocials.length - 1}
                          style={[styles.reorderButton, index === featuredSocials.length - 1 && styles.reorderButtonDisabled]}
                        >
                          <Ionicons name="chevron-down" size={18} color={index === featuredSocials.length - 1 ? '#E0E0E0' : '#666'} />
                        </TouchableOpacity>
                      </View>
                      <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                        <Ionicons name={platform.icon as any} size={18} color="#fff" />
                      </View>
                      <Text style={styles.platformName}>{platform.name}</Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => toggleFeatured(social)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF5252" />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Available Links */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Links</Text>
              {allLinks.filter(link => !isFeatured(link.platformId)).map((link) => {
                const platform = getPlatform(link.platformId);
                return (
                  <TouchableOpacity
                    key={link.platformId}
                    style={styles.availableItem}
                    onPress={() => toggleFeatured(link)}
                    disabled={featuredSocials.length >= maxFeatured}
                  >
                    <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                      <Ionicons name={platform.icon as any} size={18} color="#fff" />
                    </View>
                    <Text style={styles.platformName}>{platform.name}</Text>
                    {featuredSocials.length < maxFeatured ? (
                      <View style={styles.addIconButton}>
                        <Ionicons name="add-circle" size={24} color="#00C853" />
                      </View>
                    ) : (
                      <Text style={styles.maxReachedText}>Max reached</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              
              {allLinks.filter(link => !isFeatured(link.platformId)).length === 0 && (
                <Text style={styles.emptyText}>All your links are featured!</Text>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  featuredIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editHint: {
    marginTop: 8,
  },
  editHintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00C853',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1565C0',
    marginLeft: 8,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reorderButtons: {
    marginRight: 12,
  },
  reorderButton: {
    padding: 2,
  },
  reorderButtonDisabled: {
    opacity: 0.5,
  },
  platformIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  removeButton: {
    padding: 4,
  },
  availableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addIconButton: {
    padding: 4,
  },
  maxReachedText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
