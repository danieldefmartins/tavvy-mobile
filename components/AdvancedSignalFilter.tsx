import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

const AdvancedSignalFilter = () => {
  const [mustHaves, setMustHaves] = useState('');
  const [niceToHaves, setNiceToHaves] = useState('');

  const handleSearch = () => {
    // Implement search logic here
    console.log('Searching with:', { mustHaves, niceToHaves });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advanced Multi-Signal Filtering</Text>
      <TextInput
        style={styles.input}
        placeholder="Must-Haves (e.g., Fresh Pasta x500+)"
        value={mustHaves}
        onChangeText={setMustHaves}
      />
      <TextInput
        style={styles.input}
        placeholder="Nice-to-Haves (e.g., Cozy & Intimate x400+)"
        value={niceToHaves}
        onChangeText={setNiceToHaves}
      />
      <Button title="Search" onPress={handleSearch} color={Colors.brand.teal} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: Colors.inputBorder,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
});

export default AdvancedSignalFilter;
