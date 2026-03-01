/**
 * AdvancedSection -- professional badges, category, and contact form toggle.
 * Only shown for pro templates. Collapsed by default.
 *
 * React Native port of the web AdvancedSection.
 */

import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
} from 'react-native';
import { useEditor } from '../../../../lib/ecard/EditorContext';
import EditorSection from '../shared/EditorSection';
import EditorField from '../shared/EditorField';

interface AdvancedSectionProps {
  isDark: boolean;
  isPro: boolean;
}

export default function AdvancedSection({ isDark, isPro }: AdvancedSectionProps) {
  const { state, dispatch } = useEditor();
  const card = state.card;

  if (!card) return null;

  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const rowText = isDark ? '#E2E8F0' : '#374151';

  const toggleBadge = (field: string) => {
    dispatch({ type: 'SET_FIELD', field: field as any, value: !(card as any)[field] });
  };

  return (
    <EditorSection
      id="advanced"
      title="Advanced"
      icon="settings"
      defaultOpen={false}
      isDark={isDark}
    >
      {/* ===== Professional Badges ===== */}
      <View style={styles.block}>
        <Text style={[styles.subHeading, { color: rowText }]}>
          Professional Badges
        </Text>

        <ToggleRow
          label="Licensed"
          checked={!!card.show_licensed_badge}
          onToggle={() => toggleBadge('show_licensed_badge')}
          isDark={isDark}
          borderColor={borderColor}
          textColor={rowText}
        />
        <ToggleRow
          label="Insured"
          checked={!!card.show_insured_badge}
          onToggle={() => toggleBadge('show_insured_badge')}
          isDark={isDark}
          borderColor={borderColor}
          textColor={rowText}
        />
        <ToggleRow
          label="Bonded"
          checked={!!card.show_bonded_badge}
          onToggle={() => toggleBadge('show_bonded_badge')}
          isDark={isDark}
          borderColor={borderColor}
          textColor={rowText}
        />
        <ToggleRow
          label="Tavvy Verified"
          checked={!!card.show_tavvy_verified_badge}
          onToggle={() => toggleBadge('show_tavvy_verified_badge')}
          isDark={isDark}
          borderColor={borderColor}
          textColor={rowText}
          isLast
        />

        {/* Badge Approval Status */}
        {(card as any).badge_approval_status && (card as any).badge_approval_status !== 'none' && (
          <View style={[styles.approvalStatus, {
            backgroundColor: (card as any).badge_approval_status === 'pending'
              ? (isDark ? '#422006' : '#FFFBEB')
              : (card as any).badge_approval_status === 'approved'
              ? (isDark ? '#064E3B' : '#ECFDF5')
              : (isDark ? '#7F1D1D' : '#FEF2F2'),
          }]}>
            <Text style={{
              fontSize: 13, fontWeight: '500',
              color: (card as any).badge_approval_status === 'pending'
                ? (isDark ? '#FDE68A' : '#92400E')
                : (card as any).badge_approval_status === 'approved'
                ? (isDark ? '#6EE7B7' : '#059669')
                : (isDark ? '#FCA5A5' : '#DC2626'),
            }}>
              {(card as any).badge_approval_status === 'pending' && 'Pending Review'}
              {(card as any).badge_approval_status === 'approved' && 'Approved'}
              {(card as any).badge_approval_status === 'rejected' && 'Rejected'}
            </Text>
          </View>
        )}
      </View>

      {/* ===== Professional Category ===== */}
      <EditorField
        label="Professional Category"
        value={card.professional_category || ''}
        onChange={(v) =>
          dispatch({
            type: 'SET_FIELD',
            field: 'professional_category' as any,
            value: v,
          })
        }
        placeholder="e.g. Real Estate, Marketing"
        isDark={isDark}
      />

      {/* ===== Contact Form Toggle ===== */}
      <View style={styles.formBlock}>
        <Text style={[styles.subHeading, { color: rowText }]}>
          Contact Form
        </Text>

        <ToggleRow
          label="Show contact form on card"
          checked={!!card.form_block}
          onToggle={() => toggleBadge('form_block')}
          isDark={isDark}
          borderColor={borderColor}
          textColor={rowText}
          isLast
        />
        <Text style={[styles.helperText, { color: textSecondary }]}>
          When enabled, visitors can send you messages through your card.
        </Text>
      </View>
    </EditorSection>
  );
}

// ── Helper Component ─────────────────────────────────────────────────────────

function ToggleRow({
  label,
  checked,
  onToggle,
  isDark,
  borderColor,
  textColor,
  isLast = false,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  isDark: boolean;
  borderColor: string;
  textColor: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.toggleRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: borderColor },
      ]}
    >
      <Text style={[styles.toggleLabel, { color: textColor }]}>{label}</Text>
      <Switch
        value={checked}
        onValueChange={onToggle}
        trackColor={{
          false: isDark ? '#475569' : '#D1D5DB',
          true: '#00C853',
        }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  block: {
    marginBottom: 20,
  },
  approvalStatus: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  formBlock: {
    marginTop: 8,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
});
