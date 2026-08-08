/**
 * StudioContactPanel — Contact tab content for Card Studio bottom sheet.
 *
 * Contains: contact visibility toggle, email, phone, website, website label,
 * social profiles, and custom links.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import StudioField from './shared/StudioField';
import StudioGroup from './shared/StudioGroup';
import StudioToggleRow from './shared/StudioToggleRow';
import PlatformPicker, { SOCIAL_PLATFORMS } from '../../editor/shared/PlatformPicker';
import LinkEditor from '../../editor/shared/LinkEditor';

const AMBER = '#FF9F0A';
const MAX_FEATURED = 4;
const FREE_LINK_LIMIT = 5;

// ── Props ────────────────────────────────────────────────────────────────────
interface StudioContactPanelProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function StudioContactPanel({ isDark, isPro }: StudioContactPanelProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const links = state.links;
  const [socialPickerVisible, setSocialPickerVisible] = useState(false);
  const [linkPickerVisible, setLinkPickerVisible] = useState(false);

  if (!card) return null;

  const set = (field: string, value: any) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value });
  };

  const socials = card.featured_socials || [];
  const isAtLinkLimit = !isPro && links.length >= FREE_LINK_LIMIT;

  // ── Social handlers ────────────────────────────────────────────────────────
  const handleAddSocial = (platformId: string) => {
    if (socials.length >= MAX_FEATURED) return;
    Haptics.selectionAsync();
    dispatch({
      type: 'ADD_FEATURED_SOCIAL',
      social: { platform: platformId, url: '' },
    });
  };

  const handleRemoveSocial = (platform: string) => {
    Haptics.selectionAsync();
    dispatch({ type: 'REMOVE_FEATURED_SOCIAL', platform });
  };

  // ── Link handlers ──────────────────────────────────────────────────────────
  const handleAddLink = (platformId: string) => {
    if (isAtLinkLimit) return;
    Haptics.selectionAsync();
    dispatch({
      type: 'ADD_LINK',
      link: {
        id: `link_${Date.now()}`,
        card_id: card.id,
        platform: platformId,
        title: '',
        url: '',
        icon: platformId,
        sort_order: links.length,
        is_active: true,
        clicks: 0,
      },
    });
    setLinkPickerVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Contact Info */}
      <StudioGroup title="Contact Info">
        <StudioToggleRow
          label="Show contact info on card"
          value={card.show_contact_info !== false}
          onChange={(v) => set('show_contact_info', v)}
        />
        <StudioField
          label="Email"
          value={card.email || ''}
          onChange={(v) => set('email', v)}
          placeholder="email@example.com"
          keyboardType="email-address"
        />
        <StudioField
          label="Phone"
          value={card.phone || ''}
          onChange={(v) => set('phone', v)}
          placeholder="(555) 000-0000"
          keyboardType="phone-pad"
        />
        <StudioField
          label="Website"
          value={card.website || ''}
          onChange={(v) => set('website', v)}
          placeholder="https://..."
          keyboardType="url"
        />
        <StudioField
          label="Website Button Label"
          value={card.website_label || ''}
          onChange={(v) => set('website_label', v)}
          placeholder="Visit Website"
          isLast
        />
      </StudioGroup>

      {/* Social Profiles */}
      <StudioGroup title="Social Profiles">
        <StudioToggleRow
          label="Show social icons on card"
          value={card.show_social_icons !== false}
          onChange={(v) => set('show_social_icons', v)}
        />
        {socials.map((social: any, idx: number) => {
          const platform = SOCIAL_PLATFORMS.find((p) => p.id === social.platform);
          return (
            <View
              key={social.platform}
              style={[
                styles.socialRow,
                idx < socials.length - 1 && styles.separator,
              ]}
            >
              <View style={styles.socialInfo}>
                <Ionicons
                  name={(platform?.icon || 'link') as any}
                  size={18}
                  color={platform?.color || '#9E9E9E'}
                />
                <View style={styles.socialText}>
                  <Text style={styles.socialName}>
                    {platform?.name || social.platform}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveSocial(social.platform)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </View>
          );
        })}
        {socials.length < MAX_FEATURED && (
          <TouchableOpacity
            onPress={() => setSocialPickerVisible(true)}
            style={styles.addButton}
          >
            <Ionicons name="add-circle" size={18} color={AMBER} />
            <Text style={styles.addLabel}>Add Social Profile</Text>
          </TouchableOpacity>
        )}
      </StudioGroup>

      {/* Custom Links */}
      <StudioGroup title="Custom Links">
        {links.map((link, idx) => (
          <View
            key={link.id}
            style={[
              styles.linkRow,
              idx < links.length - 1 && styles.separator,
            ]}
          >
            <LinkEditor
              link={link}
              onUpdate={(updates) =>
                dispatch({ type: 'UPDATE_LINK', id: link.id, updates })
              }
              onRemove={() => dispatch({ type: 'REMOVE_LINK', id: link.id })}
              isDark={true}
            />
          </View>
        ))}
        {!isAtLinkLimit && (
          <TouchableOpacity
            onPress={() => setLinkPickerVisible(true)}
            style={styles.addButton}
          >
            <Ionicons name="add-circle" size={18} color={AMBER} />
            <Text style={styles.addLabel}>Add Link</Text>
          </TouchableOpacity>
        )}
        {isAtLinkLimit && (
          <View style={styles.limitNotice}>
            <Ionicons name="lock-closed" size={14} color={AMBER} />
            <Text style={styles.limitText}>
              Free plan: {FREE_LINK_LIMIT} links max. Upgrade for unlimited.
            </Text>
          </View>
        )}
      </StudioGroup>

      {/* Platform Pickers (Modals) */}
      <PlatformPicker
        visible={socialPickerVisible}
        onSelect={(id) => {
          handleAddSocial(id);
          setSocialPickerVisible(false);
        }}
        onClose={() => setSocialPickerVisible(false)}
        isDark={true}
        excludePlatforms={socials.map((s: any) => s.platform)}
      />
      <PlatformPicker
        visible={linkPickerVisible}
        onSelect={handleAddLink}
        onClose={() => setLinkPickerVisible(false)}
        isDark={true}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {},
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  socialInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  socialText: {
    flex: 1,
  },
  socialName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  linkRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9F0A',
  },
  limitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  limitText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    flex: 1,
  },
});
