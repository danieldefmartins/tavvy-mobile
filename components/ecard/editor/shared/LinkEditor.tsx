/**
 * LinkEditor -- single link item editor with platform icon, title input, URL input, and remove.
 * Compact row layout ported from the web equivalent using React Native primitives.
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinkItem } from '../../../../lib/ecard/editorReducer';

/** Platform icon name and color mappings (Ionicons). */
export const PLATFORM_ICONS: Record<string, { icon: string; color: string }> = {
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
  github: { icon: 'logo-github', color: '#181717' },
  discord: { icon: 'logo-discord', color: '#5865F2' },
  twitch: { icon: 'logo-twitch', color: '#9146FF' },
  pinterest: { icon: 'logo-pinterest', color: '#E60023' },
  dribbble: { icon: 'logo-dribbble', color: '#EA4C89' },
  email: { icon: 'mail', color: '#EA4335' },
  website: { icon: 'globe', color: '#4A90D9' },
  phone: { icon: 'call', color: '#34C759' },
  custom: { icon: 'link', color: '#8E8E93' },
  other: { icon: 'link', color: '#8E8E93' },
};

/** Platform display names. */
const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  snapchat: 'Snapchat',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  spotify: 'Spotify',
  github: 'GitHub',
  discord: 'Discord',
  twitch: 'Twitch',
  pinterest: 'Pinterest',
  dribbble: 'Dribbble',
  email: 'Email',
  website: 'Website',
  phone: 'Phone',
  custom: 'Custom Link',
  other: 'Other',
};

interface LinkEditorProps {
  link: LinkItem;
  index: number;
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
  isDark: boolean;
}

export default function LinkEditor({
  link,
  index,
  onChange,
  onRemove,
  isDark,
}: LinkEditorProps) {
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputColor = isDark ? '#FFFFFF' : '#333333';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const placeholderColor = isDark ? '#475569' : '#BDBDBD';

  const platformConfig = PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other;
  const platformName = PLATFORM_NAMES[link.platform] || link.platform;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: cardBg,
          borderColor: borderColor,
        },
      ]}
    >
      {/* Platform icon */}
      <View style={styles.iconColumn}>
        <View style={[styles.iconCircle, { backgroundColor: platformConfig.color }]}>
          <Ionicons
            name={platformConfig.icon as any}
            size={16}
            color={link.platform === 'snapchat' ? '#000000' : '#FFFFFF'}
          />
        </View>
      </View>

      {/* Input fields */}
      <View style={styles.fields}>
        <TextInput
          style={[
            styles.input,
            styles.titleInput,
            {
              backgroundColor: inputBg,
              color: inputColor,
              borderColor: borderColor,
            },
          ]}
          value={link.title || ''}
          onChangeText={(text) => onChange(index, 'title', text)}
          placeholder={`${platformName} title`}
          placeholderTextColor={placeholderColor}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: inputBg,
              color: inputColor,
              borderColor: borderColor,
            },
          ]}
          value={link.url || ''}
          onChangeText={(text) => onChange(index, 'url', text)}
          placeholder="URL or value"
          placeholderTextColor={placeholderColor}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={
            link.platform === 'email'
              ? 'email-address'
              : link.platform === 'phone' || link.platform === 'whatsapp'
                ? 'phone-pad'
                : 'url'
          }
        />
      </View>

      {/* Remove button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemove(index)}
        activeOpacity={0.7}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Ionicons name="trash" size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  iconColumn: {
    flexShrink: 0,
    paddingTop: 4,
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fields: {
    flex: 1,
    gap: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
  },
  titleInput: {
    fontWeight: '500',
  },
  removeButton: {
    padding: 6,
    borderRadius: 6,
    flexShrink: 0,
    marginTop: 4,
  },
});
