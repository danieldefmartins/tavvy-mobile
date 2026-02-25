/**
 * LinksSection -- Manage link items with platform picker and free-tier limit notice.
 * Mobile port of the web LinksSection using React Native primitives.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import LinkEditor from '../shared/LinkEditor';
import PlatformPicker from '../shared/PlatformPicker';

// ── Constants ────────────────────────────────────────────────────────────────

const FREE_LINK_LIMIT = 5;

// ── Props ────────────────────────────────────────────────────────────────────

interface LinksSectionProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LinksSection({ isDark, isPro }: LinksSectionProps) {
  const { state, dispatch } = useEditor();
  const links = state.links;
  const [pickerVisible, setPickerVisible] = useState(false);

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const warningBg = isDark ? 'rgba(245,158,11,0.1)' : '#FFFBEB';
  const warningBorder = isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A';

  const isAtLimit = !isPro && links.length >= FREE_LINK_LIMIT;

  // -- Handlers ---------------------------------------------------------------

  const handleAddLink = useCallback(
    (platformId: string) => {
      if (isAtLimit) return;

      const newLink = {
        id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        platform: platformId,
        title: '',
        url: '',
        sort_order: links.length,
        is_active: true,
      };

      dispatch({ type: 'ADD_LINK', link: newLink });
      setPickerVisible(false);
    },
    [isAtLimit, links.length, dispatch],
  );

  const handleUpdateLink = useCallback(
    (index: number, field: string, value: string) => {
      const link = links[index];
      if (!link) return;
      dispatch({ type: 'UPDATE_LINK', id: link.id, updates: { [field]: value } });
    },
    [links, dispatch],
  );

  const handleRemoveLink = useCallback(
    (index: number) => {
      const link = links[index];
      if (!link) return;

      Alert.alert(
        'Remove Link',
        'Are you sure you want to remove this link?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => dispatch({ type: 'REMOVE_LINK', id: link.id }),
          },
        ],
      );
    },
    [links, dispatch],
  );

  // -- Render -----------------------------------------------------------------

  return (
    <EditorSection
      id="links"
      title="Links"
      icon="link"
      defaultOpen={true}
      isDark={isDark}
    >
      {/* Link list */}
      {links.length > 0 && (
        <View style={styles.linkList}>
          {links.map((link, index) => (
            <LinkEditor
              key={link.id}
              link={link}
              index={index}
              onChange={handleUpdateLink}
              onRemove={handleRemoveLink}
              isDark={isDark}
            />
          ))}
        </View>
      )}

      {/* Empty state */}
      {links.length === 0 && !pickerVisible && (
        <Text style={[styles.emptyText, { color: textSecondary }]}>
          No links added yet. Add links to share on your card.
        </Text>
      )}

      {/* Free tier limit warning */}
      {isAtLimit && (
        <View
          style={[
            styles.warningBanner,
            { backgroundColor: warningBg, borderColor: warningBorder },
          ]}
        >
          <Ionicons name="lock-closed" size={16} color="#F59E0B" />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>
              Free plan limit reached ({FREE_LINK_LIMIT} links)
            </Text>
            <Text style={[styles.warningSubtitle, { color: textSecondary }]}>
              Upgrade to Pro for unlimited links.
            </Text>
          </View>
        </View>
      )}

      {/* Link count */}
      <View style={styles.countContainer}>
        <Text style={[styles.countText, { color: textSecondary }]}>
          {links.length}
          {!isPro ? ` / ${FREE_LINK_LIMIT}` : ''} links
        </Text>
      </View>

      {/* Add link button */}
      {!isAtLimit && (
        <TouchableOpacity
          style={[styles.addButton, { borderColor }]}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={18} color="#00C853" />
          <Text style={styles.addButtonText}>Add Link</Text>
        </TouchableOpacity>
      )}

      {/* Platform picker modal */}
      <PlatformPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddLink}
        isDark={isDark}
      />
    </EditorSection>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  linkList: {
    gap: 10,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#F59E0B',
  },
  warningSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  countContainer: {
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
