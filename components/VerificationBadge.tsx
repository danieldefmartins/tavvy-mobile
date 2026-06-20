import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VerificationBadge = () => {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>Verified</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#8A05BE',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default VerificationBadge;
