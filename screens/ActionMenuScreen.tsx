import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { BlurView } from 'expo-blur'; // Optional: for glass effect if available, otherwise fallback to view

export default function ActionMenuScreen({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const navigation = useNavigation();

  const handleAction = (action: string) => {
    onClose(); // Close menu first
    switch (action) {
      case 'universe':
        navigation.navigate('RequestUniverse' as never);
        break;
      case 'place':
        navigation.navigate('AddPlace' as never); // Existing screen
        break;
      case 'city':
        // Placeholder for now
        alert('City creation coming soon!');
        break;
      case 'review':
        // Navigate to a place picker or the review flow
        // For now, let's assume we go to Explore to find a place to review
        navigation.navigate('Explore' as never); 
        break;
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Create New</Text>
            
            <MenuItem 
              icon="planet" 
              color="#8B5CF6" 
              title="Universe" 
              subtitle="Request a new community"
              onPress={() => handleAction('universe')} 
            />
            <MenuItem 
              icon="location" 
              color="#EF4444" 
              title="Place" 
              subtitle="Add a missing spot"
              onPress={() => handleAction('place')} 
            />
            <MenuItem 
              icon="business" 
              color="#10B981" 
              title="City" 
              subtitle="Expand to a new area"
              onPress={() => handleAction('city')} 
            />
            <MenuItem 
              icon="star" 
              color="#F59E0B" 
              title="Review" 
              subtitle="Rate a place you visited"
              onPress={() => handleAction('review')} 
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const MenuItem = ({ icon, color, title, subtitle, onPress }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.itemSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 48, // Extra padding for safe area
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
});