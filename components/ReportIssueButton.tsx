import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

const ReportIssueButton = () => {
  const handleReportIssue = () => {
    Alert.alert(
      'Report an Issue',
      'Thank you for helping us improve. Your report has been submitted.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleReportIssue}>
        <Text style={styles.buttonText}>Report an Issue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#F5A623',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default ReportIssueButton;
