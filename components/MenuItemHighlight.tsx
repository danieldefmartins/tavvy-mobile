import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MenuItemHighlightProps {
  itemName: string;
  quality: string;
  description: string;
}

const MenuItemHighlight: React.FC<MenuItemHighlightProps> = ({ itemName, quality, description }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.itemName}>{itemName}</Text>
      <Text style={styles.quality}>{quality}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: '#F5A623',
    borderRadius: 5,
    marginVertical: 5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#17013A',
  },
  quality: {
    fontSize: 14,
    color: '#8A05BE',
  },
  description: {
    fontSize: 12,
    color: '#00C2CB',
  },
});

export default MenuItemHighlight;
