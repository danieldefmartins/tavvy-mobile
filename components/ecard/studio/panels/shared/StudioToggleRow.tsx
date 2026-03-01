/**
 * StudioToggleRow — Toggle switch row for Card Studio inspector panels.
 *
 * Apple-style: label left, amber toggle right, separator between rows.
 */
import React from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';

const AMBER = '#FF9F0A';

interface StudioToggleRowProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  isLast?: boolean;
}

export default function StudioToggleRow({
  label,
  value,
  onChange,
  isLast = false,
}: StudioToggleRowProps) {
  return (
    <View style={[styles.container, !isLast && styles.separator]}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: 'rgba(255,255,255,0.15)', true: AMBER }}
        thumbColor="#fff"
        ios_backgroundColor="rgba(255,255,255,0.15)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
});
