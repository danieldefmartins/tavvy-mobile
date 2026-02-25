/**
 * PlatformPicker -- modal grid of social platform icons for adding links.
 * 4-column grid inside a modal with semi-transparent backdrop.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 8;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * 3) / 4;

export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
  { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { id: 'twitter', name: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'logo-linkedin', color: '#0A66C2' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { id: 'snapchat', name: 'Snapchat', icon: 'logo-snapchat', color: '#FFFC00' },
  { id: 'spotify', name: 'Spotify', icon: 'musical-notes', color: '#1DB954' },
  { id: 'github', name: 'GitHub', icon: 'logo-github', color: '#181717' },
  { id: 'discord', name: 'Discord', icon: 'logo-discord', color: '#5865F2' },
  { id: 'pinterest', name: 'Pinterest', icon: 'logo-pinterest', color: '#E60023' },
  { id: 'twitch', name: 'Twitch', icon: 'logo-twitch', color: '#9146FF' },
  { id: 'telegram', name: 'Telegram', icon: 'paper-plane', color: '#0088CC' },
  { id: 'email', name: 'Email', icon: 'mail', color: '#EA4335' },
  { id: 'website', name: 'Website', icon: 'globe', color: '#4A90D9' },
  { id: 'phone', name: 'Phone', icon: 'call', color: '#34C759' },
  { id: 'other', name: 'Other', icon: 'link', color: '#8E8E93' },
];

interface PlatformPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (platform: string) => void;
  excludeIds?: string[];
  isDark: boolean;
}

export default function PlatformPicker({
  visible,
  onClose,
  onSelect,
  excludeIds = [],
  isDark,
}: PlatformPickerProps) {
  const containerBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const itemBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const textColor = isDark ? '#94A3B8' : '#6B7280';
  const titleColor = isDark ? '#FFFFFF' : '#111111';

  const filtered = SOCIAL_PLATFORMS.filter(p => !excludeIds.includes(p.id));

  const handleSelect = (platformId: string) => {
    onSelect(platformId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View />
      </TouchableOpacity>

      {/* Content */}
      <View style={[styles.sheet, { backgroundColor: containerBg }]}>
        {/* Handle bar */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: isDark ? '#334155' : '#D1D5DB' }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: titleColor }]}>Add Link</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={28} color={isDark ? '#64748B' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        {/* Platform grid */}
        <ScrollView
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {filtered.map((platform) => (
              <TouchableOpacity
                key={platform.id}
                style={[
                  styles.item,
                  {
                    backgroundColor: itemBg,
                    borderColor: borderColor,
                  },
                ]}
                onPress={() => handleSelect(platform.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: platform.color }]}>
                  <Ionicons
                    name={platform.icon as any}
                    size={18}
                    color={platform.id === 'snapchat' ? '#000000' : '#FFFFFF'}
                  />
                </View>
                <Text
                  style={[styles.platformName, { color: textColor }]}
                  numberOfLines={1}
                >
                  {platform.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 34, // safe area
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  gridContent: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformName: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
});
