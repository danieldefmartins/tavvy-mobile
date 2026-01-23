/**
 * ECardBlockEditorScreen.tsx
 * Editor for individual block content
 * Beautiful forms for each block type
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import {
  BlockType,
  CardBlock,
  BlockConfig,
  BlockField,
  getBlockConfig,
} from '../config/eCardBlocks';

interface RouteParams {
  block: CardBlock;
  onSave: (data: any) => void;
  colorScheme?: { primary: string; secondary: string };
}

export default function ECardBlockEditorScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useThemeContext();
  
  const { block, onSave, colorScheme } = route.params as RouteParams;
  const config = getBlockConfig(block.type);
  
  const [formData, setFormData] = useState<any>(block.data || {});
  
  // Update field value
  const updateField = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };
  
  // Pick image
  const pickImage = async (key: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      updateField(key, result.assets[0].uri);
    }
  };
  
  // Save and go back
  const handleSave = () => {
    // Validate required fields
    if (config) {
      for (const field of config.fields) {
        if (field.required && !formData[field.key]?.toString().trim()) {
          Alert.alert('Required Field', `Please fill in ${field.label}`);
          return;
        }
      }
    }
    
    onSave(formData);
    navigation.goBack();
  };
  
  // Add item to array field
  const addArrayItem = (key: string, fields: BlockField[]) => {
    const newItem: any = {};
    fields.forEach(f => {
      newItem[f.key] = '';
    });
    
    const currentArray = formData[key] || [];
    updateField(key, [...currentArray, newItem]);
  };
  
  // Update array item
  const updateArrayItem = (key: string, index: number, itemKey: string, value: any) => {
    const currentArray = [...(formData[key] || [])];
    currentArray[index] = { ...currentArray[index], [itemKey]: value };
    updateField(key, currentArray);
  };
  
  // Remove array item
  const removeArrayItem = (key: string, index: number) => {
    const currentArray = [...(formData[key] || [])];
    currentArray.splice(index, 1);
    updateField(key, currentArray);
  };
  
  // Render a single field
  const renderField = (field: BlockField, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'text':
      case 'phone':
      case 'email':
      case 'url':
        return (
          <View style={styles.fieldContainer} key={field.key}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <TextInput
              style={styles.textInput}
              value={value || ''}
              onChangeText={onChange}
              placeholder={field.placeholder}
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType={
                field.type === 'phone' ? 'phone-pad' :
                field.type === 'email' ? 'email-address' :
                field.type === 'url' ? 'url' : 'default'
              }
              autoCapitalize={field.type === 'email' || field.type === 'url' ? 'none' : 'words'}
              maxLength={field.maxLength}
            />
          </View>
        );
        
      case 'textarea':
        return (
          <View style={styles.fieldContainer} key={field.key}>
            <Text style={styles.fieldLabel}>
              {field.label}
              {field.required && <Text style={styles.requiredStar}> *</Text>}
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={value || ''}
              onChangeText={onChange}
              placeholder={field.placeholder}
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={field.maxLength}
            />
            {field.maxLength && (
              <Text style={styles.charCount}>
                {(value || '').length}/{field.maxLength}
              </Text>
            )}
          </View>
        );
        
      case 'image':
        return (
          <View style={styles.fieldContainer} key={field.key}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={() => pickImage(field.key)}
            >
              {value ? (
                <Image source={{ uri: value }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="camera-outline" size={32} color="rgba(255,255,255,0.4)" />
                  <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
        
      case 'select':
        return (
          <View style={styles.fieldContainer} key={field.key}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.selectContainer}>
              {field.options?.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    value === option.value && styles.selectOptionActive,
                  ]}
                  onPress={() => onChange(option.value)}
                >
                  <Text style={[
                    styles.selectOptionText,
                    value === option.value && styles.selectOptionTextActive,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
        
      case 'array':
        const arrayValue = value || [];
        return (
          <View style={styles.fieldContainer} key={field.key}>
            <View style={styles.arrayHeader}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TouchableOpacity
                style={styles.addArrayButton}
                onPress={() => addArrayItem(field.key, field.arrayItemFields || [])}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addArrayButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            
            {arrayValue.map((item: any, index: number) => (
              <View key={index} style={styles.arrayItem}>
                <View style={styles.arrayItemHeader}>
                  <Text style={styles.arrayItemTitle}>Item {index + 1}</Text>
                  <TouchableOpacity
                    style={styles.arrayItemDelete}
                    onPress={() => removeArrayItem(field.key, index)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
                
                {field.arrayItemFields?.map(subField => (
                  <View key={subField.key} style={styles.subFieldContainer}>
                    <Text style={styles.subFieldLabel}>{subField.label}</Text>
                    {subField.type === 'select' ? (
                      <View style={styles.selectContainerSmall}>
                        {subField.options?.map(option => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.selectOptionSmall,
                              item[subField.key] === option.value && styles.selectOptionActive,
                            ]}
                            onPress={() => updateArrayItem(field.key, index, subField.key, option.value)}
                          >
                            <Text style={[
                              styles.selectOptionTextSmall,
                              item[subField.key] === option.value && styles.selectOptionTextActive,
                            ]}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : subField.type === 'image' ? (
                      <TouchableOpacity
                        style={styles.imagePickerButtonSmall}
                        onPress={async () => {
                          const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.8,
                          });
                          if (!result.canceled && result.assets[0]) {
                            updateArrayItem(field.key, index, subField.key, result.assets[0].uri);
                          }
                        }}
                      >
                        {item[subField.key] ? (
                          <Image source={{ uri: item[subField.key] }} style={styles.imagePreviewSmall} />
                        ) : (
                          <Ionicons name="camera-outline" size={24} color="rgba(255,255,255,0.4)" />
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TextInput
                        style={styles.textInputSmall}
                        value={item[subField.key] || ''}
                        onChangeText={(v) => updateArrayItem(field.key, index, subField.key, v)}
                        placeholder={subField.placeholder}
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        maxLength={subField.maxLength}
                      />
                    )}
                  </View>
                ))}
              </View>
            ))}
            
            {arrayValue.length === 0 && (
              <View style={styles.emptyArray}>
                <Text style={styles.emptyArrayText}>No items yet. Tap "Add" to create one.</Text>
              </View>
            )}
          </View>
        );
        
      default:
        return null;
    }
  };
  
  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Block not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background */}
      <LinearGradient
        colors={[colorScheme?.primary || '#1a1a2e', colorScheme?.secondary || '#16213e', '#0f0f1a']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.headerIcon, config.isPremium && styles.headerIconPremium]}>
            <Ionicons 
              name={config.icon as any} 
              size={20} 
              color={config.isPremium ? '#FFD700' : '#FFFFFF'} 
            />
          </View>
          <Text style={styles.headerTitle}>{config.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
      
      {/* Form */}
      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {config.fields.map(field => 
            renderField(field, formData[field.key], (value) => updateField(field.key, value))
          )}
          
          {/* Bottom Spacing */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconPremium: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  formContainer: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  requiredStar: {
    color: '#FF6B6B',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
    marginTop: 6,
  },
  imagePickerButton: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: '#FFFFFF',
  },
  selectOptionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  selectOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  arrayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addArrayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
  },
  addArrayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  arrayItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  arrayItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  arrayItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  arrayItemDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subFieldContainer: {
    marginBottom: 14,
  },
  subFieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  textInputSmall: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectContainerSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectOptionSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectOptionTextSmall: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  imagePickerButtonSmall: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imagePreviewSmall: {
    width: '100%',
    height: '100%',
  },
  emptyArray: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyArrayText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 100,
  },
});
