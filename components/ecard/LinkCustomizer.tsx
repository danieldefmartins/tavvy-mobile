import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

const LinkCustomizer = ({ onCustomize }: { onCustomize: (value: { color: string; icon: keyof typeof FontAwesome.glyphMap }) => void }) => {
  const [selectedColor, setSelectedColor] = useState(Colors.primary);
  const [selectedIcon, setSelectedIcon] = useState<keyof typeof FontAwesome.glyphMap>('link');

  const colors = [Colors.primary, Colors.secondary, Colors.warning, Colors.background];
  const icons = ['link', 'star', 'heart', 'user'] as const;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onCustomize({ color, icon: selectedIcon });
  };

  const handleIconSelect = (icon: keyof typeof FontAwesome.glyphMap) => {
    setSelectedIcon(icon);
    onCustomize({ color: selectedColor, icon });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customize Your Link</Text>
      <View style={styles.optionsContainer}>
        <Text style={styles.optionTitle}>Colors</Text>
        <View style={styles.optionsRow}>
          {colors.map((color: string) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorOption, { backgroundColor: color }]}
              onPress={() => handleColorSelect(color)}
            />
          ))}
        </View>
        <Text style={styles.optionTitle}>Icons</Text>
        <View style={styles.optionsRow}>
          {icons.map((icon: keyof typeof FontAwesome.glyphMap) => (
            <TouchableOpacity key={icon} onPress={() => handleIconSelect(icon)}>
              <FontAwesome name={icon} size={24} color={selectedColor} style={styles.iconOption} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionTitle: {
    fontSize: 16,
    marginVertical: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconOption: {
    marginHorizontal: 8,
  },
});

export default LinkCustomizer;
