import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface AddYourTapCardProps {
  onPress: () => void;
  onClaimPress?: () => void;
}

export default function AddYourTapCardEnhanced({ onPress, onClaimPress }: AddYourTapCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Been here?</Text>
          <Text style={styles.subtitle}>Help our community—share your experience!</Text>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={onPress}>
          <Ionicons name="add-circle" size={24} color="white" style={styles.icon} />
          <Text style={styles.buttonText}>Add Your Tap</Text>
        </TouchableOpacity>
      </View>

      {/* Claim Business Link */}
      <TouchableOpacity style={styles.claimLink} onPress={onClaimPress}>
        <Text style={styles.claimText}>Own this business? <Text style={styles.claimHighlight}>Claim it</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: 6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  claimLink: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  claimText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  claimHighlight: {
    color: Colors.primary,
    fontWeight: '600',
  },
});