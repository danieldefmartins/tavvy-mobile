/**
 * MobileBusinessSection -- mobile business configuration fields.
 * Only shown when template is mobile-business.
 *
 * React Native port of the web MobileBusinessSection.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import EditorField from '../shared/EditorField';

interface MobileBusinessSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function MobileBusinessSection({ isDark }: MobileBusinessSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;

  if (!card) return null;

  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const infoBg = isDark ? 'rgba(255,255,255,0.04)' : '#F0F9FF';
  const infoBorder = isDark ? 'rgba(255,255,255,0.08)' : '#BAE6FD';

  return (
    <EditorSection
      id="mobile-business"
      title="Mobile Business"
      icon="car"
      defaultOpen={true}
      isDark={isDark}
    >
      {/* Info callout */}
      <View style={[styles.infoBox, { backgroundColor: infoBg, borderColor: infoBorder }]}>
        <Ionicons
          name="information-circle"
          size={18}
          color={isDark ? '#60A5FA' : '#0284C7'}
          style={styles.infoIcon}
        />
        <Text style={[styles.infoText, { color: textSecondary }]}>
          Configure your mobile business details. Menu items and live session features
          are managed from the live card page.
        </Text>
      </View>

      <EditorField
        label="Business Type"
        value={(card as any).business_type || ''}
        onChange={(v) =>
          dispatch({ type: 'SET_FIELD', field: 'business_type' as any, value: v })
        }
        placeholder="e.g. Food Truck, Pop-up Shop"
        isDark={isDark}
      />

      <EditorField
        label="Specialties"
        value={card.description || ''}
        onChange={(v) =>
          dispatch({ type: 'SET_FIELD', field: 'description' as any, value: v })
        }
        placeholder="e.g. Tacos, BBQ, Vegan bowls"
        multiline
        rows={2}
        isDark={isDark}
        maxLength={300}
      />
    </EditorSection>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
});
