/**
 * ContactSection -- Email, phone, website, location, address, and contact
 * visibility toggle. Includes a collapsible full-address sub-section
 * animated with LayoutAnimation.
 *
 * React Native port of the web ContactSection.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  LayoutAnimation,
  Platform,
  UIManager,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import EditorField from '../shared/EditorField';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ContactSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function ContactSection({ isDark, isPro }: ContactSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;
  const [addressOpen, setAddressOpen] = useState(false);

  if (!card) return null;

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const toggleBg = isDark ? '#1E293B' : '#F3F4F6';
  const collapsibleBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const handleFieldChange = (field: string, value: any) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value });
  };

  const toggleAddress = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        250,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
    setAddressOpen((prev) => !prev);
  };

  return (
    <EditorSection
      id="contact"
      title="Contact Info"
      icon="call"
      defaultOpen={true}
      isDark={isDark}
    >
      {/* Show Contact Info Toggle */}
      <View style={[styles.toggleRow, { backgroundColor: toggleBg }]}>
        <Text style={[styles.toggleLabel, { color: textPrimary }]}>
          Show contact info on card
        </Text>
        <Switch
          value={card.show_contact_info !== false}
          onValueChange={(v) => handleFieldChange('show_contact_info', v)}
          trackColor={{ false: isDark ? '#475569' : '#D1D5DB', true: '#00C853' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Email */}
      <EditorField
        label="Email"
        value={card.email || ''}
        onChange={(v) => handleFieldChange('email', v)}
        placeholder="you@example.com"
        isDark={isDark}
      />

      {/* Phone */}
      <EditorField
        label="Phone"
        value={card.phone || ''}
        onChange={(v) => handleFieldChange('phone', v)}
        placeholder="+1 (555) 123-4567"
        isDark={isDark}
      />

      {/* Website */}
      <EditorField
        label="Website"
        value={card.website || ''}
        onChange={(v) => handleFieldChange('website', v)}
        placeholder="https://yourwebsite.com"
        isDark={isDark}
      />

      {/* Website Label */}
      <EditorField
        label="Website Label"
        value={card.website_label || ''}
        onChange={(v) => handleFieldChange('website_label', v)}
        placeholder="e.g. Visit My Site"
        isDark={isDark}
        maxLength={40}
      />

      {/* City / Location */}
      <EditorField
        label="City / Location"
        value={card.city || ''}
        onChange={(v) => handleFieldChange('city', v)}
        placeholder="e.g. San Francisco, CA"
        isDark={isDark}
      />

      {/* Collapsible Full Address */}
      <View
        style={[
          styles.collapsible,
          { borderColor: collapsibleBorder },
        ]}
      >
        <TouchableOpacity
          onPress={toggleAddress}
          activeOpacity={0.7}
          style={styles.collapsibleHeader}
        >
          <Text style={[styles.collapsibleLabel, { color: textSecondary }]}>
            Full Address (optional)
          </Text>
          <Ionicons
            name={addressOpen ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={textSecondary}
          />
        </TouchableOpacity>

        {addressOpen && (
          <View style={styles.collapsibleContent}>
            <EditorField
              label="Address Line 1"
              value={card.address_1 || card.address || ''}
              onChange={(v) => handleFieldChange('address_1', v)}
              placeholder="123 Main Street"
              isDark={isDark}
            />
            <EditorField
              label="Address Line 2"
              value={card.address_2 || ''}
              onChange={(v) => handleFieldChange('address_2', v)}
              placeholder="Suite 100"
              isDark={isDark}
            />
            <EditorField
              label="ZIP / Postal Code"
              value={card.zip_code || ''}
              onChange={(v) => handleFieldChange('zip_code', v)}
              placeholder="94102"
              isDark={isDark}
              maxLength={10}
            />
          </View>
        )}
      </View>
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
  collapsible: {
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  collapsibleLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  collapsibleContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});
