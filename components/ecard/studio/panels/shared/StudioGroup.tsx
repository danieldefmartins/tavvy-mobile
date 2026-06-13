/**
 * StudioGroup — Apple-style grouped settings container for Card Studio panels.
 *
 * Renders a section title + rounded container with subtle border,
 * matching the iOS Settings / Keynote inspector look.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StudioGroupProps {
  title?: string;
  children: React.ReactNode;
}

export default function StudioGroup({ title, children }: StudioGroupProps) {
  return (
    <View style={styles.wrapper}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.container}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  container: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
});
