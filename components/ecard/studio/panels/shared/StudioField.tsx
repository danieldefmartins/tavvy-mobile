/**
 * StudioField — Inline edit field for Card Studio inspector panels.
 *
 * Apple-style: label above, transparent input, separator between fields.
 * Always uses dark theme (white text on dark background).
 */
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

interface StudioFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  isLast?: boolean;
  maxLength?: number;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url' | 'numeric';
}

export default function StudioField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  isLast = false,
  maxLength,
  keyboardType = 'default',
}: StudioFieldProps) {
  return (
    <View
      style={[
        styles.container,
        !isLast && styles.separator,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
      {multiline ? (
        <TextInput
          style={[styles.input, styles.multiline]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    color: '#fff',
    fontSize: 15,
    fontWeight: '400',
    padding: 0,
  },
  multiline: {
    minHeight: 60,
    lineHeight: 22,
  },
});
