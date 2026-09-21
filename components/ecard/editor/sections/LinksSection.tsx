import { useReleaseCopy } from '../../../../hooks/useReleaseCopy';
/**
 * LinksSection -- Manage link items with a platform picker and no plan-based count limit.
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
import { orderRequestKey } from '../../../../lib/orderService';

// ── Constants ────────────────────────────────────────────────────────────────


// ── Props ────────────────────────────────────────────────────────────────────

interface LinksSectionProps {
  isDark: boolean;
  isPro: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LinksSection({ isDark, isPro }: LinksSectionProps) {
  const copy = useReleaseCopy();
  const { state, dispatch } = useEditor();
  const links = state.links;
  const [pickerVisible, setPickerVisible] = useState(false);

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';

  const activeLinkCount = links.filter(link => link.is_active === undefined || link.is_active === true).length;
  const hiddenLinkCount = links.length - activeLinkCount;

  // -- Handlers ---------------------------------------------------------------

  const handleAddLink = useCallback(
    (platformId: string) => {

      const newLink = {
        id: orderRequestKey(),
        platform: platformId,
        title: '',
        url: '',
        sort_order: links.length,
        is_active: true,
      };

      dispatch({ type: 'ADD_LINK', link: newLink });
      setPickerVisible(false);
    },
    [links.length, dispatch],
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
      title="Links & actions"
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
              onMove={(fromIndex, toIndex) => dispatch({ type: 'REORDER_LINKS', fromIndex, toIndex })}
              total={links.length}
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

      <Text style={{ fontSize: 12, color: textSecondary }}>{copy('No plan-based link limit')}</Text>

      {/* Link count */}
      <View style={styles.countContainer}>
        <Text style={[styles.countText, { color: textSecondary }]}>
          {activeLinkCount}
           active links{hiddenLinkCount ? ` · ${hiddenLinkCount} hidden links kept` : ''}
        </Text>
      </View>

      {/* Add link button */}
      {(
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
