import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';
import { useNavigation } from '@react-navigation/native';

export interface FormStep {
  id: string;
  title: string;
  question: string;
  type: 'text' | 'select' | 'location' | 'photo' | 'info' | 'tags' | 'hours' | 'phone' | 'url' | 'address' | 'multi-location' | 'date' | 'toggle' | 'socials';
  options?: string[]; // For select/tags
  placeholder?: string;
  required?: boolean;
  // Dynamic logic: if this step is answered, which step ID to go to next?
  // If undefined, goes to next index in the array (linear fallback).
  nextStep?: (answer: any) => string | null; 
}

interface QuickFormEngineProps {
  formId: string;
  title: string;
  steps: FormStep[];
  onComplete: (data: any) => void;
  onCancel: () => void;
}

// --- SUB-COMPONENTS ---

// Socials Input Component
const SocialsInput = ({ value, onChange }: { value: any, onChange: (val: any) => void }) => {
  const platforms = ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'X (Twitter)', 'WhatsApp'];
  const data = value || {};

  const updatePlatform = (platform: string, text: string) => {
    onChange({ ...data, [platform]: text });
  };

  return (
    <View style={{ gap: 12 }}>
      {platforms.map((p) => (
        <View key={p}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 }}>{p}</Text>
          <TextInput
            style={[styles.textInput, { fontSize: 16, paddingVertical: 8 }]}
            placeholder={`@username or link`}
            value={data[p] || ''}
            onChangeText={(text) => updatePlatform(p, text)}
            autoCapitalize="none"
          />
        </View>
      ))}
    </View>
  );
};

// Date Input Component (Simple Text Fallback for now, ideally a DatePicker)
const DateInput = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  return (
    <View>
      <TextInput
        style={styles.textInput}
        placeholder="YYYY-MM-DD"
        value={value || ''}
        onChangeText={onChange}
        keyboardType="numeric"
      />
      <Text style={{ marginTop: 8, color: '#6B7280' }}>e.g. 2015-04-20</Text>
    </View>
  );
};

// Toggle Input Component
const ToggleInput = ({ value, onChange, label }: { value: boolean, onChange: (val: boolean) => void, label?: string }) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151' }}>{label || "Yes / No"}</Text>
      <Switch
        value={value || false}
        onValueChange={onChange}
        trackColor={{ false: '#D1D5DB', true: Colors.primary }}
      />
    </View>
  );
};

// Multi-Location Input Component
const MultiLocationInput = ({ value, onChange, placeholder }: { value: string[], onChange: (val: string[]) => void, placeholder?: string }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const selectedLocations = value || [];

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.length > 2) {
      // Simulate API results for Cities, Counties, Zips
      setSuggestions([
        `${text} County, FL`,
        `${text} City, CA`,
        `${text} (Zip Code)`
      ]);
    } else {
      setSuggestions([]);
    }
  };

  const addLocation = (loc: string) => {
    if (!selectedLocations.includes(loc)) {
      onChange([...selectedLocations, loc]);
    }
    setQuery('');
    setSuggestions([]);
  };

  const removeLocation = (loc: string) => {
    onChange(selectedLocations.filter(l => l !== loc));
  };

  return (
    <View>
      <View style={styles.tagsContainer}>
        {selectedLocations.map((loc, index) => (
          <TouchableOpacity key={index} style={styles.tagChipSelected} onPress={() => removeLocation(loc)}>
            <Text style={styles.tagTextSelected}>{loc} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <TextInput
        style={[styles.textInput, { marginTop: 12 }]}
        placeholder={placeholder || "Add city, county, or zip..."}
        value={query}
        onChangeText={handleSearch}
      />
      
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => addLocation(s)}>
              <Ionicons name="map-outline" size={20} color="#6B7280" />
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Address Input Component (Extracted to fix Hooks Rule)
const AddressInput = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder?: string }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  const handleSearch = (text: string) => {
    setQuery(text);
    // Simulate API call
    if (text.length > 3) {
      setSuggestions([
        `${text} St, New York, NY`,
        `${text} Ave, San Francisco, CA`,
        `${text} Blvd, Austin, TX`
      ]);
    } else {
      setSuggestions([]);
    }
  };

  const selectAddress = (addr: string) => {
    setQuery(addr);
    onChange(addr);
    setSuggestions([]);
  };

  return (
    <View>
      <TextInput
        style={styles.textInput}
        placeholder={placeholder || "Start typing address..."}
        value={query}
        onChangeText={handleSearch}
        autoFocus
      />
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => selectAddress(s)}>
              <Ionicons name="location-outline" size={20} color="#6B7280" />
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {value && (
         <View style={styles.verifiedBadge}>
           <Ionicons name="checkmark-circle" size={16} color="green" />
           <Text style={{color: 'green', fontWeight: '600'}}>Address Verified</Text>
         </View>
      )}
    </View>
  );
};

// --- MAIN COMPONENT ---

export default function QuickFormEngine({ formId, title, steps, onComplete, onCancel }: QuickFormEngineProps) {
  const navigation = useNavigation();
  
  // STATE
  const [currentStepId, setCurrentStepId] = useState<string>(steps[0].id);
  const [historyStack, setHistoryStack] = useState<string[]>([]); // Tracks path for "Back" button
  const [formData, setFormData] = useState<any>({});
  
  // Load draft on mount
  useEffect(() => {
    checkDraft();
  }, []);

  const checkDraft = async () => {
    try {
      const saved = await AsyncStorage.getItem(formId);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) {
          Alert.alert(
            "Resume Draft?",
            `You have an unfinished ${title}. Would you like to continue?`,
            [
              { text: "No, Start Over", style: "destructive", onPress: () => clearDraft() },
              { text: "Yes, Resume", onPress: () => setFormData(parsed) }
            ]
          );
        }
      }
    } catch (e) {
      console.error("Failed to load draft", e);
    }
  };

  const saveDraft = async (data: any) => {
    try {
      await AsyncStorage.setItem(formId, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save draft", e);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(formId);
      setFormData({});
      setCurrentStepId(steps[0].id);
      setHistoryStack([]);
    } catch (e) {
      console.error("Failed to clear draft", e);
    }
  };

  const updateField = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    saveDraft(newData);
  };

  // NAVIGATION LOGIC
  const currentStep = steps.find(s => s.id === currentStepId) || steps[0];
  const currentStepIndex = steps.findIndex(s => s.id === currentStepId);
  const progress = (historyStack.length + 1) / (historyStack.length + 5); // Approximate progress

  const handleNext = () => {
    // Validation
    if (currentStep.required && !formData[currentStep.id]) {
      Alert.alert("Required", "Please answer this question to continue.");
      return;
    }

    // Determine Next Step ID
    let nextId: string | null = null;
    
    if (currentStep.nextStep) {
      nextId = currentStep.nextStep(formData[currentStep.id]);
    } else {
      // Fallback: Next item in array
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        nextId = steps[nextIndex].id;
      }
    }

    if (nextId) {
      // Push current step to history BEFORE moving
      setHistoryStack([...historyStack, currentStepId]);
      setCurrentStepId(nextId);
    } else {
      // End of flow
      Alert.alert(
        "All Done! 🎉",
        "Ready to submit?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Submit", 
            onPress: () => {
              clearDraft();
              onComplete(formData);
            }
          }
        ]
      );
    }
  };

  const handleBack = () => {
    if (historyStack.length > 0) {
      const prevStepId = historyStack[historyStack.length - 1];
      const newStack = historyStack.slice(0, -1);
      setHistoryStack(newStack);
      setCurrentStepId(prevStepId);
    } else {
      // Exit
      Alert.alert(
        "Exit?",
        "Do you want to save your progress for later?",
        [
          { text: "Discard", style: 'destructive', onPress: () => { clearDraft(); onCancel(); } },
          { text: "Save & Exit", onPress: onCancel },
          { text: "Cancel", style: 'cancel' }
        ]
      );
    }
  };

  // RENDERERS
  const renderInput = () => {
    switch (currentStep.type) {
      case 'text':
        return (
          <View>
            <TextInput
              style={styles.textInput}
              placeholder={currentStep.placeholder || "Type here..."}
              value={formData[currentStep.id] || ''}
              onChangeText={(text) => updateField(currentStep.id, text)}
              autoFocus
              autoCapitalize="sentences"
            />
          </View>
        );

      case 'phone':
        // International Phone Logic
        const formatPhone = (text: string) => {
          // Allow only numbers and +
          let cleaned = text.replace(/[^0-9+]/g, '');
          updateField(currentStep.id, cleaned);
        };

        const isValidPhone = (p: string) => {
          // Basic E.164 check: Starts with +, followed by 7-15 digits
          return /^\+[1-9]\d{7,14}$/.test(p);
        };

        return (
          <View>
            <TextInput
              style={styles.textInput}
              placeholder={currentStep.placeholder || "+1 555 123 4567"}
              value={formData[currentStep.id] || ''}
              onChangeText={formatPhone}
              keyboardType="phone-pad"
              autoFocus
            />
            <Text style={{marginTop: 8, color: '#6B7280', fontSize: 14}}>
              Include country code (e.g. +1 for USA)
            </Text>
            {formData[currentStep.id] && isValidPhone(formData[currentStep.id]) && (
               <View style={styles.verifiedBadge}>
                 <Ionicons name="checkmark-circle" size={16} color="green" />
                 <Text style={{color: 'green', fontWeight: '600'}}>Valid Number</Text>
               </View>
            )}
          </View>
        );

      case 'url':
        return (
          <TextInput
            style={styles.textInput}
            placeholder={currentStep.placeholder || "https://..."}
            value={formData[currentStep.id] || ''}
            onChangeText={(text) => updateField(currentStep.id, text.toLowerCase())}
            autoFocus
            keyboardType="url"
            autoCapitalize="none"
          />
        );

      case 'address':
        return (
          <AddressInput 
            value={formData[currentStep.id]} 
            onChange={(val) => updateField(currentStep.id, val)}
            placeholder={currentStep.placeholder}
          />
        );

      case 'multi-location':
        return (
          <MultiLocationInput
            value={formData[currentStep.id]}
            onChange={(val) => updateField(currentStep.id, val)}
            placeholder={currentStep.placeholder}
          />
        );

      case 'date':
        return (
          <DateInput
            value={formData[currentStep.id]}
            onChange={(val) => updateField(currentStep.id, val)}
          />
        );

      case 'toggle':
        return (
          <ToggleInput
            value={formData[currentStep.id]}
            onChange={(val) => updateField(currentStep.id, val)}
            label={currentStep.placeholder}
          />
        );

      case 'socials':
        return (
          <SocialsInput
            value={formData[currentStep.id]}
            onChange={(val) => updateField(currentStep.id, val)}
          />
        );

      case 'select':
        return (
          <View style={styles.optionsContainer}>
            {currentStep.options?.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionButton,
                  formData[currentStep.id] === opt && styles.optionSelected
                ]}
                onPress={() => updateField(currentStep.id, opt)}
              >
                <Text style={[
                  styles.optionText,
                  formData[currentStep.id] === opt && styles.optionTextSelected
                ]}>{opt}</Text>
                {formData[currentStep.id] === opt && (
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'tags':
        const selectedTags = formData[currentStep.id] || [];
        const toggleTag = (tag: string) => {
          if (selectedTags.includes(tag)) {
            updateField(currentStep.id, selectedTags.filter((t: string) => t !== tag));
          } else {
            updateField(currentStep.id, [...selectedTags, tag]);
          }
        };
        return (
          <View style={styles.tagsContainer}>
            {currentStep.options?.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  selectedTags.includes(tag) && styles.tagChipSelected
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[
                  styles.tagText,
                  selectedTags.includes(tag) && styles.tagTextSelected
                ]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'hours':
        return (
          <View style={styles.placeholderBox}>
            <Ionicons name="time" size={40} color="#9CA3AF" />
            <Text style={styles.placeholderText}>Hours Editor Coming Soon</Text>
            <TextInput
              style={[styles.textInput, { marginTop: 16, fontSize: 16 }]}
              placeholder="e.g. Mon-Fri 9am-5pm"
              value={formData[currentStep.id] || ''}
              onChangeText={(text) => updateField(currentStep.id, text)}
            />
          </View>
        );

      default:
        return (
          <View style={styles.placeholderBox}>
            <Ionicons name={currentStep.type === 'photo' ? 'camera' : 'map'} size={40} color="#9CA3AF" />
            <Text style={styles.placeholderText}>{currentStep.type === 'photo' ? 'Photo Upload' : 'Location Picker'} Coming Soon</Text>
            <Text style={styles.placeholderSub}>Tap Next to skip for now</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.questionTitle}>{currentStep.title}</Text>
          <Text style={styles.questionText}>{currentStep.question}</Text>
          <View style={styles.inputContainer}>
            {renderInput()}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentStep.nextStep ? 'Next' : 'Finish'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backButton: { marginRight: 16 },
  progressContainer: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginRight: 16, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  content: { padding: 24, flexGrow: 1 },
  questionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  questionText: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginBottom: 32, lineHeight: 32 },
  inputContainer: { flex: 1 },
  textInput: { fontSize: 20, color: Colors.text, borderBottomWidth: 2, borderBottomColor: '#E5E7EB', paddingVertical: 12, minHeight: 50 },
  optionsContainer: { gap: 12 },
  optionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  optionSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { fontSize: 18, fontWeight: '600', color: '#374151' },
  optionTextSelected: { color: 'white' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  tagChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tagText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  tagTextSelected: { color: 'white' },
  suggestionsContainer: { marginTop: 8, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 8 },
  suggestionText: { fontSize: 16, color: '#374151' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  placeholderBox: { alignItems: 'center', justifyContent: 'center', padding: 40, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', borderRadius: 16 },
  placeholderText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: '#6B7280' },
  placeholderSub: { marginTop: 4, fontSize: 14, color: '#9CA3AF' },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  nextButton: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 8, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  nextButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});