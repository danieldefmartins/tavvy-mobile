/**
 * EditorField -- reusable labeled input/textarea for the card editor.
 * Supports single-line and multiline input with optional character count.
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';

interface EditorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
  isDark: boolean;
  maxLength?: number;
}

export default function EditorField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  required = false,
  isDark,
  maxLength,
}: EditorFieldProps) {
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputColor = isDark ? '#FFFFFF' : '#333333';
  const labelColor = isDark ? '#94A3B8' : '#6B7280';
  const borderColor = isDark ? '#334155' : '#E5E7EB';
  const placeholderColor = isDark ? '#475569' : '#BDBDBD';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: labelColor }]}>
        {label}
        {required && ' *'}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: inputBg,
            color: inputColor,
            borderColor: borderColor,
          },
          multiline && {
            minHeight: rows * 24 + 28,
            textAlignVertical: 'top',
            paddingTop: 12,
          },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={placeholderColor}
        multiline={multiline}
        numberOfLines={multiline ? rows : 1}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {maxLength !== undefined && (
        <Text style={[styles.charCount, { color: labelColor }]}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 15,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});
