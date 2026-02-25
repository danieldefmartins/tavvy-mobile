/**
 * SocialSection -- Featured social icons (max 4) with URL input for each,
 * platform picker modal, and visibility toggle.
 *
 * React Native port of the web SocialSection.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import PlatformPicker, { SOCIAL_PLATFORMS } from '../shared/PlatformPicker';

interface SocialSectionProps {
  isDark: boolean;
  isPro: boolean;
}

const MAX_FEATURED = 4;

export default function SocialSection({ isDark, isPro }: SocialSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!card) return null;

  const featuredSocials = card.featured_socials || [];

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const toggleBg = isDark ? '#1E293B' : '#F3F4F6';
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputColor = isDark ? '#FFFFFF' : '#333333';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#FAFAFA';
  const placeholderColor = isDark ? '#475569' : '#BDBDBD';

  const handleAddSocial = (platformId: string) => {
    if (featuredSocials.length >= MAX_FEATURED) return;
    dispatch({
      type: 'ADD_FEATURED_SOCIAL',
      social: { platform: platformId, url: '' },
    });
  };

  const handleUpdateUrl = (platform: string, url: string) => {
    dispatch({ type: 'UPDATE_FEATURED_SOCIAL', platform, url });
  };

  const handleRemove = (platform: string) => {
    dispatch({ type: 'REMOVE_FEATURED_SOCIAL', platform });
  };

  const excludedIds = featuredSocials.map((s) => s.platform);

  /** Look up the Ionicons icon name and color for a platform. */
  const getPlatformInfo = (platformId: string) => {
    return SOCIAL_PLATFORMS.find((p) => p.id === platformId);
  };

  return (
    <EditorSection
      id="social"
      title="Featured Socials"
      icon="share-social"
      defaultOpen={true}
      isDark={isDark}
    >
      {/* Show Social Icons Toggle */}
      <View style={[styles.toggleRow, { backgroundColor: toggleBg }]}>
        <Text style={[styles.toggleLabel, { color: textPrimary }]}>
          Show social icons on card
        </Text>
        <Switch
          value={card.show_social_icons !== false}
          onValueChange={(v) =>
            dispatch({ type: 'SET_FIELD', field: 'show_social_icons', value: v })
          }
          trackColor={{ false: isDark ? '#475569' : '#D1D5DB', true: '#00C853' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Current Featured Socials */}
      {featuredSocials.length > 0 && (
        <View style={styles.socialList}>
          {featuredSocials.map((social) => {
            const info = getPlatformInfo(social.platform);
            const iconName = (info?.icon || 'link') as any;
            const iconBgColor = info?.color || '#8E8E93';
            const displayName = info?.name || social.platform;

            return (
              <View
                key={social.platform}
                style={[
                  styles.socialCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: borderColor,
                  },
                ]}
              >
                {/* Platform icon badge */}
                <View style={[styles.iconBadge, { backgroundColor: iconBgColor }]}>
                  <Ionicons
                    name={iconName}
                    size={18}
                    color={social.platform === 'snapchat' ? '#000000' : '#FFFFFF'}
                  />
                </View>

                {/* URL input */}
                <TextInput
                  style={[
                    styles.urlInput,
                    {
                      backgroundColor: inputBg,
                      color: inputColor,
                      borderColor: borderColor,
                    },
                  ]}
                  value={social.url || ''}
                  onChangeText={(url) => handleUpdateUrl(social.platform, url)}
                  placeholder={`${displayName} URL`}
                  placeholderTextColor={placeholderColor}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />

                {/* Remove button */}
                <TouchableOpacity
                  onPress={() => handleRemove(social.platform)}
                  activeOpacity={0.7}
                  style={styles.removeButton}
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Count indicator */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: textSecondary }]}>
          {featuredSocials.length} / {MAX_FEATURED} selected
        </Text>
      </View>

      {/* Add button */}
      {featuredSocials.length < MAX_FEATURED && (
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.7}
          style={[styles.addButton, { borderColor: borderColor }]}
        >
          <Ionicons name="add" size={18} color="#00C853" />
          <Text style={styles.addButtonText}>Add Social</Text>
        </TouchableOpacity>
      )}

      {/* Platform Picker Modal */}
      <PlatformPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddSocial}
        excludeIds={excludedIds}
        isDark={isDark}
      />
    </EditorSection>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  socialList: {
    gap: 10,
    marginBottom: 16,
  },
  socialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  urlInput: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 13,
  },
  removeButton: {
    flexShrink: 0,
    padding: 2,
  },
  countRow: {
    marginBottom: 12,
  },
  countText: {
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 10,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#00C853',
  },
});
