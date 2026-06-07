import React, { useState } from 'react';
import { View, Text, Picker, Button, StyleSheet } from 'react-native';
import { useEditorField } from '../../lib/ecard/useEditorField';
import Colors from '../../constants/Colors';

const CustomizationOptions = () => {
  const [font, setFont] = useEditorField('font', 'Arial');
  const [backgroundColor, setBackgroundColor] = useEditorField('backgroundColor', Colors.white);
  const [buttonStyle, setButtonStyle] = useEditorField('buttonStyle', 'default');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Font Selection</Text>
      <Picker
        selectedValue={font}
        style={styles.picker}
        onValueChange={(itemValue) => setFont(itemValue)}
      >
        <Picker.Item label="Arial" value="Arial" />
        <Picker.Item label="Times New Roman" value="Times New Roman" />
        <Picker.Item label="Courier New" value="Courier New" />
      </Picker>

      <Text style={styles.label}>Background Color</Text>
      <Picker
        selectedValue={backgroundColor}
        style={styles.picker}
        onValueChange={(itemValue) => setBackgroundColor(itemValue)}
      >
        <Picker.Item label="White" value={Colors.white} />
        <Picker.Item label="Purple" value={Colors.purple} />
        <Picker.Item label="Teal" value={Colors.teal} />
        <Picker.Item label="Amber" value={Colors.amber} />
      </Picker>

      <Text style={styles.label}>Button Style</Text>
      <Picker
        selectedValue={buttonStyle}
        style={styles.picker}
        onValueChange={(itemValue) => setButtonStyle(itemValue)}
      >
        <Picker.Item label="Default" value="default" />
        <Picker.Item label="Rounded" value="rounded" />
        <Picker.Item label="Outline" value="outline" />
      </Picker>

      <Button title="Apply" onPress={() => console.log('Customization applied')} color={Colors.purple} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.dark,
  },
  label: {
    fontSize: 16,
    color: Colors.white,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 20,
    color: Colors.white,
    backgroundColor: Colors.dark,
  },
});

export default CustomizationOptions;
