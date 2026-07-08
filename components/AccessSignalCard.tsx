import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AccessSignalCardProps {
  signal: string;
  count: number;
}

const AccessSignalCard: React.FC<AccessSignalCardProps> = ({ signal, count }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.signalText}>{signal}</Text>
      <Text style={styles.countText}>x{count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#8A05BE',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  signalText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  countText: {
    color: '#F5A623',
    fontSize: 16,
  },
});

export default AccessSignalCard;
