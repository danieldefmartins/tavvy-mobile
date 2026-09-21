import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';

export interface ToolHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onProfilePress?: () => void;
  /** Enable only when the screen is not already inside a top SafeAreaView. */
  safeAreaTop?: boolean;
  children?: React.ReactNode;
}

export default function ToolHeader({ title, subtitle, onBack, onProfilePress, safeAreaTop = false, children }: ToolHeaderProps) {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();
  const copy = useReleaseCopy();
  const back = () => {
    if (onBack) return onBack();
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tools', { screen: 'AppsMain' });
  };
  return <View style={[styles.header, { backgroundColor: theme.background, borderColor: theme.border, paddingTop: safeAreaTop ? insets.top : 0 }]}>
    <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
    <View style={[styles.row, { paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right }]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('Go back')} onPress={back} style={styles.button}><Ionicons name="chevron-back" size={24} color={theme.text} /></TouchableOpacity>
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.text }]}>{copy(title)}</Text>
        {!!subtitle && <Text style={[styles.subtitle, { color: isDark ? '#B9C4FF' : '#4656AD' }]}>{copy(subtitle)}</Text>}
      </View>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={copy('Profile')} onPress={onProfilePress || (() => navigation.navigate('Profile', { screen: 'ProfileMain' }))} style={styles.button}><Ionicons name="person-circle-outline" size={28} color={theme.text} /></TouchableOpacity>
    </View>
    {children && <View style={[styles.content, { paddingLeft: 16 + insets.left, paddingRight: 16 + insets.right }]}>{children}</View>}
  </View>;
}

const styles = StyleSheet.create({
  header: { width: '100%', borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  button: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  copy: { flex: 1, minWidth: 0, alignItems: 'center' },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 12, lineHeight: 17, fontWeight: '500', textAlign: 'center', marginTop: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
});
