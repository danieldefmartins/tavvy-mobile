import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeContext } from '../contexts/ThemeContext';

/** Legacy route: city ratings have no supported persistence contract yet. */
export default function RateCityScreen() {
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <View style={{ padding: 24, gap: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>City reviews</Text>
      <Text style={{ color: theme.textSecondary }}>City reviews are not available yet. Open a place in this city to share your experience.</Text>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ color: theme.primary }}>Go back</Text></TouchableOpacity>
    </View>
  </SafeAreaView>;
}
