import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import * as ImagePicker from 'expo-image-picker';

// Wizard Steps
const STEPS = [
  { id: 'name', title: "What's the Universe?", question: "Name this new universe (e.g., 'Best Coffee in NYC', 'Hidden Speakeasies')." },
  { id: 'description', title: "Tell us more", question: "What makes this universe special? Who is it for?" },
  { id: 'types', title: "What's inside?", question: "What type of places belong here? (e.g., Cafes, Bars, Parks)" },
  { id: 'photos', title: "Show us the vibe", question: "Upload some photos to set the mood." },
];

export default function RequestUniverseScreen() {
  const navigation = useNavigation();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({
    name: '',
    description: '',
    types: '',
    photos: [] as string[],
  });

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newPhotos = result.assets.map(asset => asset.uri);
      setData(prev => ({ ...prev, photos: [...prev.photos, ...newPhotos] }));
    }
  };

  const handleSubmit = () => {
    // In a real app, this would send data to Supabase
    console.log('Submitting Universe Request:', data);
    Alert.alert(
      "Request Sent! 🚀",
      "Thanks for helping expand the Tavvyverse! An admin will review your request shortly.",
      [{ text: "Awesome", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((currentStep + 1) / STEPS.length) * 100}%` }]} />
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.question}>{step.question}</Text>

        {step.id === 'photos' ? (
          <View>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={32} color={Colors.primary} />
              <Text style={styles.uploadText}>Pick Photos</Text>
            </TouchableOpacity>
            <View style={styles.photoGrid}>
              {data.photos.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.photoThumbnail} />
              ))}
            </View>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Type here..."
            placeholderTextColor="#999"
            value={data[step.id as keyof typeof data] as string}
            onChangeText={(text) => setData({ ...data, [step.id]: text })}
            multiline={step.id === 'description'}
            autoFocus
          />
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, (!data[step.id as keyof typeof data] && step.id !== 'photos') && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={!data[step.id as keyof typeof data] && step.id !== 'photos'}
        >
          <Text style={styles.buttonText}>{isLastStep ? "Submit Request" : "Next"}</Text>
          {!isLastStep && <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    marginRight: 16,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  content: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 32,
  },
  input: {
    fontSize: 18,
    color: Colors.text,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  button: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadText: {
    marginTop: 8,
    color: Colors.primary,
    fontWeight: '600',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});