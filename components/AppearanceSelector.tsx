import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';

/** A compact explicit override; the default continues to follow the device. */
export default function AppearanceSelector() {
  const { theme, setThemeMode, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  return <View>
    <View style={styles.row}><Text style={[styles.heading, { color: theme.text }]}>{copy('Appearance')}</Text>
      <View style={styles.control}><Text style={[styles.mode, { color: !isDark ? theme.text : theme.textSecondary, fontWeight: !isDark ? '700' : '400' }]}>{copy('Light')}</Text>
        <TouchableOpacity accessibilityRole="switch" accessibilityLabel={copy('Dark mode')} accessibilityState={{ checked: isDark }} onPress={() => setThemeMode(isDark ? 'light' : 'dark')} style={[styles.switch, { backgroundColor: isDark ? theme.primary : theme.border }]}><View style={[styles.thumb, isDark && styles.thumbOn]} /></TouchableOpacity>
        <Text style={[styles.mode, { color: isDark ? theme.text : theme.textSecondary, fontWeight: isDark ? '700' : '400' }]}>{copy('Dark')}</Text></View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heading: { fontSize: 15, fontWeight: '600' },
  control: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mode: { fontSize: 13 },
  switch: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  thumbOn: { alignSelf: 'flex-end' },
});
