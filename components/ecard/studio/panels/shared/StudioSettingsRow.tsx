/**
 * StudioSettingsRow — Navigation/action row for Card Studio inspector panels.
 *
 * Apple-style: icon + label + optional value + chevron/trailing.
 * Matches the Keynote inspector look with amber icon backgrounds.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AMBER = '#FF9F0A';

interface StudioSettingsRowProps {
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  destructive?: boolean;
  isLast?: boolean;
}

export default function StudioSettingsRow({
  label,
  value,
  icon,
  onPress,
  trailing,
  destructive = false,
  isLast = false,
}: StudioSettingsRowProps) {
  const content = (
    <View style={[styles.container, !isLast && styles.separator]}>
      {icon && (
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: destructive
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(255,159,10,0.12)',
            },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={15}
            color={destructive ? '#ef4444' : AMBER}
          />
        </View>
      )}
      <View style={styles.textWrap}>
        <Text
          style={[
            styles.label,
            destructive && { color: '#ef4444' },
          ]}
        >
          {label}
        </Text>
        {value && <Text style={styles.value}>{value}</Text>}
      </View>
      {trailing || (
        onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color="rgba(255,255,255,0.25)"
          />
        )
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 20,
  },
  value: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
});
