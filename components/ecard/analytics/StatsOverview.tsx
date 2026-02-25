/**
 * StatsOverview -- Views and Taps stat cards in a 2-column grid.
 * React Native port of web StatsOverview.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatsOverviewProps {
  viewCount: number;
  tapCount: number;
  isDark: boolean;
}

export default function StatsOverview({ viewCount, tapCount, isDark }: StatsOverviewProps) {
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';

  return (
    <View style={styles.row}>
      {/* Views */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            shadowOpacity: isDark ? 0 : 0.06,
          },
        ]}
      >
        <Ionicons name="eye" size={22} color="#3B82F6" style={styles.icon} />
        <Text style={[styles.value, { color: textPrimary }]}>
          {viewCount.toLocaleString()}
        </Text>
        <Text style={[styles.label, { color: textSecondary }]}>Views</Text>
      </View>

      {/* Link Taps */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            shadowOpacity: isDark ? 0 : 0.06,
          },
        ]}
      >
        <Ionicons name="hand-left" size={22} color="#00C853" style={styles.icon} />
        <Text style={[styles.value, { color: textPrimary }]}>
          {tapCount.toLocaleString()}
        </Text>
        <Text style={[styles.label, { color: textSecondary }]}>Link Taps</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    flex: 1,
    padding: 20,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
  },
});
