/**
 * ProBanner -- Upgrade CTA for non-pro users on the stats page.
 * React Native port of web ProBanner.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const ACCENT = '#00C853';

interface ProBannerProps {
  isDark: boolean;
}

export default function ProBanner({ isDark }: ProBannerProps) {
  const navigation = useNavigation();

  const bg = isDark ? '#1E293B' : '#FFF9E6';
  const titleColor = isDark ? '#FFFFFF' : '#333333';
  const bodyColor = isDark ? '#94A3B8' : '#6B7280';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.title, { color: titleColor }]}>
        Unlock Advanced Analytics
      </Text>
      <Text style={[styles.body, { color: bodyColor }]}>
        See detailed click tracking, visitor locations, and more with Pro
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('ECardPremiumUpsell' as never)
        }
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Upgrade to Pro</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: ACCENT,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
