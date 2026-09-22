import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';

/**
 * The app follows the device appearance until the owner picks Light or Dark
 * here; "Match device" hands control back to the device setting.
 */
export default function AppearanceSelector() {
  const { theme, themeMode, setThemeMode, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  const followsDevice = themeMode === 'system';
  return <View>
    <View style={styles.row}><Text style={[styles.heading, { color: theme.text }]}>{copy('Appearance')}</Text>
      <View style={styles.control}><Text style={[styles.mode, { color: !isDark ? theme.text : theme.textSecondary, fontWeight: !isDark ? '700' : '400' }]}>{copy('Light')}</Text>
        <TouchableOpacity accessibilityRole="switch" accessibilityLabel={copy('Dark mode')} accessibilityState={{ checked: isDark }} onPress={() => setThemeMode(isDark ? 'light' : 'dark')} style={[styles.switch, { backgroundColor: isDark ? theme.primary : theme.border }]}><View style={[styles.thumb, isDark && styles.thumbOn]} /></TouchableOpacity>
        <Text style={[styles.mode, { color: isDark ? theme.text : theme.textSecondary, fontWeight: isDark ? '700' : '400' }]}>{copy('Dark')}</Text></View>
    </View>
    <View style={[styles.row, styles.secondRow]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.mode, { color: theme.text }]}>{copy('Match device')}</Text>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>{copy(followsDevice ? 'Light or dark follows your device setting.' : 'Your choice above stays until you change it here.')}</Text>
      </View>
      <TouchableOpacity accessibilityRole="switch" accessibilityLabel={copy('Match device')} accessibilityState={{ checked: followsDevice }} onPress={() => setThemeMode(followsDevice ? (isDark ? 'dark' : 'light') : 'system')} style={[styles.switch, { backgroundColor: followsDevice ? theme.primary : theme.border }]}><View style={[styles.thumb, followsDevice && styles.thumbOn]} /></TouchableOpacity>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heading: { fontSize: 15, fontWeight: '600' },
  secondRow: { marginTop: 12 },
  hint: { fontSize: 12, marginTop: 2 },
  control: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mode: { fontSize: 13 },
  switch: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  thumbOn: { alignSelf: 'flex-end' },
});
