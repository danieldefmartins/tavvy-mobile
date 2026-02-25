/**
 * LinkPerformance -- Per-link click performance list.
 * React Native port of web LinkPerformance.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LinkItem {
  id: string;
  platform: string;
  title?: string;
  url: string;
  clicks?: number;
  [key: string]: any;
}

interface LinkPerformanceProps {
  links: LinkItem[];
  isDark: boolean;
}

export default function LinkPerformance({ links, isDark }: LinkPerformanceProps) {
  const textPrimary = isDark ? '#E2E8F0' : '#374151';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const borderColor = isDark ? '#334155' : '#E5E7EB';

  if (links.length === 0) {
    return (
      <Text style={[styles.emptyText, { color: textSecondary }]}>
        Add links to your card to start tracking clicks.
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      {links.map((link) => (
        <View
          key={link.id}
          style={[
            styles.row,
            { backgroundColor: cardBg, borderColor },
          ]}
        >
          <Text
            style={[styles.linkTitle, { color: textPrimary }]}
            numberOfLines={1}
          >
            {link.title || link.url}
          </Text>
          <Text style={[styles.clicks, { color: textSecondary }]}>
            {link.clicks || 0} clicks
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  linkTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  clicks: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
  },
});
