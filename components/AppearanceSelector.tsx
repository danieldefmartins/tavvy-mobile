import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';

/** Text and radio states make all three choices clear without theme symbols. */
export default function AppearanceSelector() {
  const { theme, themeMode, setThemeMode, isDark } = useThemeContext();
  const copy = useReleaseCopy();
  return <View>
    <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>{copy('Appearance')}</Text>
    <Text style={[styles.description, { color: theme.textSecondary }]}>{copy('Choose how Tavvy looks on this device.')}</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel={copy('Appearance')} style={styles.choices}>
      {([
        ['system', 'Use device setting'],
        ['light', 'Light'],
        ['dark', 'Dark'],
      ] as const).map(([mode, label]) => {
        const selected = themeMode === mode;
        const accent = isDark ? '#D4A0FF' : '#74129B';
        return <TouchableOpacity key={mode} accessibilityRole="radio" accessibilityLabel={copy(label)}
          accessibilityState={{ checked: selected }} onPress={() => setThemeMode(mode)}
          style={[styles.choice, mode === 'system' && styles.deviceChoice, {
            borderColor: selected ? accent : theme.border,
            backgroundColor: selected ? (isDark ? '#3A254B' : '#F0E7F8') : theme.surface,
          }]}>
          <View style={[styles.radio, { borderColor: selected ? accent : theme.textSecondary }]}>
            {selected && <View style={[styles.dot, { backgroundColor: accent }]} />}
          </View>
          <Text style={[styles.label, { color: theme.text }]}>{copy(label)}</Text>
        </TouchableOpacity>;
      })}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  heading: { fontSize: 20, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 16 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, padding: 14, borderWidth: 1, borderRadius: 12, flexGrow: 1, flexBasis: '45%' },
  deviceChoice: { flexBasis: '100%' },
  radio: { width: 20, height: 20, borderWidth: 2, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { fontSize: 15, lineHeight: 21, flexShrink: 1 },
});
