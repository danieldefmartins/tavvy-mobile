import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const OnboardingProcess = () => {
  const [step, setStep] = useState(1);

  const nextStep = () => {
    setStep(prevStep => prevStep + 1);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <Text style={styles.text}>Welcome to Tavvy! Let's get started with setting up your profile.</Text>;
      case 2:
        return <Text style={styles.text}>Customize your QR code with branding options.</Text>;
      case 3:
        return <Text style={styles.text}>Learn how to track your QR code analytics.</Text>;
      case 4:
        return <Text style={styles.text}>Integrate with CRM tools to capture leads.</Text>;
      default:
        return <Text style={styles.text}>You're all set! Enjoy using Tavvy.</Text>;
    }
  };

  return (
    <View style={styles.container}>
      {renderStepContent()}
      {step < 5 && <Button title="Next" onPress={nextStep} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#17013A',
  },
  text: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default OnboardingProcess;
