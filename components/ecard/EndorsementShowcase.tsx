import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useEndorsements } from '../../lib/ecard/useEndorsements';

const EndorsementShowcase = () => {
  const endorsements = useEndorsements();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Endorsements</Text>
      {endorsements.length > 0 ? (
        endorsements.map((endorsement, index) => (
          <View key={index} style={styles.endorsementCard}>
            <Text style={styles.endorsementText}>{endorsement.message}</Text>
            <Text style={styles.endorserName}>- {endorsement.endorserName}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.noEndorsements}>No endorsements yet.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#17013A',
    marginBottom: 8,
  },
  endorsementCard: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
  },
  endorsementText: {
    fontSize: 14,
    color: '#17013A',
  },
  endorserName: {
    fontSize: 12,
    color: '#8A05BE',
    marginTop: 4,
  },
  noEndorsements: {
    fontSize: 14,
    color: '#8A05BE',
  },
});

export default EndorsementShowcase;
