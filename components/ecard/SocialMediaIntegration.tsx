import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { FontAwesome } from '@expo/vector-icons';

const SocialMediaIntegration = () => {
  const { user } = useAuth();

  const handleConnect = (platform: string) => {
    // Implement the logic to connect to the social media platform
    console.log(`Connecting to ${platform}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect Your Social Media</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => handleConnect('Facebook')}>
          <FontAwesome name="facebook" size={24} color="white" />
          <Text style={styles.buttonText}>Facebook</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleConnect('Twitter')}>
          <FontAwesome name="twitter" size={24} color="white" />
          <Text style={styles.buttonText}>Twitter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleConnect('LinkedIn')}>
          <FontAwesome name="linkedin" size={24} color="white" />
          <Text style={styles.buttonText}>LinkedIn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#17013A',
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: '#8A05BE',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C2CB',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    marginLeft: 5,
  },
});

export default SocialMediaIntegration;
