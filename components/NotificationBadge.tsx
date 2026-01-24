/**
 * NotificationBadge - Red badge component for displaying unread counts
 * Used on tab bar icons and app tiles to show notification counts
 * 
 * Install path: components/NotificationBadge.tsx
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  style?: object;
}

export default function NotificationBadge({ count, size = 'medium', style }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();
  
  const sizeStyles = {
    small: {
      minWidth: 16,
      height: 16,
      fontSize: 10,
      paddingHorizontal: 4,
    },
    medium: {
      minWidth: 20,
      height: 20,
      fontSize: 12,
      paddingHorizontal: 5,
    },
    large: {
      minWidth: 24,
      height: 24,
      fontSize: 14,
      paddingHorizontal: 6,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View 
      style={[
        styles.badge, 
        { 
          minWidth: currentSize.minWidth, 
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
        style
      ]}
    >
      <Text style={[styles.badgeText, { fontSize: currentSize.fontSize }]}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#EF4444', // Red color
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: -4,
    right: -8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
