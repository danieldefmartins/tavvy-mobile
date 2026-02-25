/**
 * CardSearchBar -- Animated search input for filtering eCards in the hub.
 *
 * Highlights with the ACCENT color (#00C853) on focus.
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#00C853';

interface CardSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  isDark: boolean;
}

export default function CardSearchBar({
  value,
  onChangeText,
  isDark,
}: CardSearchBarProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const backgroundColor = isDark ? '#1A1A1A' : '#F3F4F6';
  const textColor = isDark ? '#F1F5F9' : '#111827';
  const placeholderColor = isDark ? '#64748B' : '#9CA3AF';
  const iconColor = focused ? ACCENT : placeholderColor;
  const borderColor = focused ? ACCENT : isDark ? '#2D2D2D' : '#E5E7EB';

  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
  }, [onChangeText]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <Ionicons
        name="search"
        size={18}
        color={iconColor}
        style={styles.searchIcon}
      />

      <TextInput
        ref={inputRef}
        style={[styles.input, { color: textColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Search cards..."
        placeholderTextColor={placeholderColor}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {value.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.6}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={18} color={placeholderColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 6,
  },
});
