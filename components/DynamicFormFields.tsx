/**
 * Tavvy Dynamic Form Fields Component
 * 
 * Renders form fields dynamically based on the selected category.
 * Supports various field types and conditional display logic.
 * 
 * Path: components/DynamicFormFields.tsx
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AddressAutocomplete } from './AddressAutocomplete';
import {
  CategoryField,
  getFieldsBySection,
  SECTION_NAMES,
  SECTION_ORDER,
} from '../lib/categoryFieldConfig';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface DynamicFormFieldsProps {
  primaryCategory: string;
  subcategory?: string;
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  excludeUniversalFields?: boolean;
}

interface FieldRendererProps {
  field: CategoryField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  allValues: Record<string, any>;
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  
  // Switch field styles
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  switchLabel: {
    flex: 1,
    marginRight: 12,
  },
  switchLabelText: {
    fontSize: 16,
    color: '#374151',
  },
  
  // Select field styles
  selectContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  selectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectOptionLast: {
    borderBottomWidth: 0,
  },
  selectOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  selectOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  selectOptionTextSelected: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  
  // Multi-select styles
  multiSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  multiSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  multiSelectChipSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  multiSelectChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
  multiSelectChipTextSelected: {
    color: '#4F46E5',
  },
  
  // Array field styles
  arrayContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
  },
  arrayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  arrayItemInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  arrayItemRemove: {
    marginLeft: 8,
    padding: 4,
  },
  arrayAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  arrayAddButtonText: {
    fontSize: 14,
    color: '#6366F1',
    marginLeft: 4,
  },
  
  // Icon container for fields with icons
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputWithIconText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
});

// ============================================
// FIELD RENDERER COMPONENT
// ============================================

const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  error,
  disabled,
  allValues,
}) => {
  // Check conditional display
  if (field.showIf) {
    const conditionValue = allValues[field.showIf.field];
    if (conditionValue !== field.showIf.value) {
      return null;
    }
  }

  const renderLabel = () => (
    <Text style={styles.label}>
      {field.label}
      {field.required && <Text style={styles.requiredStar}> *</Text>}
    </Text>
  );

  const renderHelperText = () => (
    <>
      {field.helpText && <Text style={styles.helpText}>{field.helpText}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </>
  );

  switch (field.type) {
    // Address fields use autocomplete
    case 'address':
      return (
        <View style={styles.fieldContainer}>
          <AddressAutocomplete
            value={value || ''}
            onSelect={(address, details) => {
              // Set the full address
              onChange(address);
              
              // Auto-fill related fields
              if (details.city) {
                onChange('city', details.city);
              }
              if (details.state) {
                onChange('state', details.state);
              }
              if (details.postalCode) {
                onChange('postal_code', details.postalCode);
              }
              if (details.street) {
                onChange('street_address', details.street);
              }
              if (details.streetNumber) {
                onChange('street_number', details.streetNumber);
              }
            }}
            onChange={onChange}
            placeholder={field.placeholder || 'Start typing an address...'}
            label={field.label}
            required={field.required}
            error={error}
            disabled={disabled}
            mode="address"
          />
        </View>
      );

    // Service area fields use autocomplete with area mode
    case 'area':
      return (
        <View style={styles.fieldContainer}>
          <AddressAutocomplete
            value={value || ''}
            onSelect={(area, details) => {
              // Set the service area
              onChange(area);
              
              // Auto-fill related location fields if available
              if (details.city) {
                onChange('service_area_city', details.city);
              }
              if (details.state) {
                onChange('service_area_state', details.state);
              }
              if (details.country) {
                onChange('service_area_country', details.country);
              }
            }}
            onChange={onChange}
            placeholder={field.placeholder || 'Enter city or region...'}
            label={field.label}
            required={field.required}
            error={error}
            disabled={disabled}
            mode="area"
          />
        </View>
      );

    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          {field.icon ? (
            <View style={[styles.inputWithIcon, error && styles.inputError]}>
              <Ionicons
                name={field.icon as any}
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputWithIconText}
                value={value || ''}
                onChangeText={onChange}
                placeholder={field.placeholder}
                placeholderTextColor="#9CA3AF"
                editable={!disabled}
                keyboardType={
                  field.type === 'email' ? 'email-address' :
                  field.type === 'phone' ? 'phone-pad' :
                  field.type === 'url' ? 'url' : 'default'
                }
                autoCapitalize={field.type === 'email' || field.type === 'url' ? 'none' : 'sentences'}
              />
            </View>
          ) : (
            <TextInput
              style={[
                styles.input,
                error && styles.inputError,
                disabled && styles.inputDisabled,
              ]}
              value={value || ''}
              onChangeText={onChange}
              placeholder={field.placeholder}
              placeholderTextColor="#9CA3AF"
              editable={!disabled}
              keyboardType={
                field.type === 'email' ? 'email-address' :
                field.type === 'phone' ? 'phone-pad' :
                field.type === 'url' ? 'url' : 'default'
              }
              autoCapitalize={field.type === 'email' || field.type === 'url' ? 'none' : 'sentences'}
            />
          )}
          {renderHelperText()}
        </View>
      );

    case 'number':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <TextInput
            style={[
              styles.input,
              error && styles.inputError,
              disabled && styles.inputDisabled,
            ]}
            value={value?.toString() || ''}
            onChangeText={(text) => {
              const num = parseFloat(text);
              onChange(isNaN(num) ? null : num);
            }}
            placeholder={field.placeholder}
            placeholderTextColor="#9CA3AF"
            editable={!disabled}
            keyboardType="numeric"
          />
          {renderHelperText()}
        </View>
      );

    case 'textarea':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              error && styles.inputError,
              disabled && styles.inputDisabled,
            ]}
            value={value || ''}
            onChangeText={onChange}
            placeholder={field.placeholder}
            placeholderTextColor="#9CA3AF"
            editable={!disabled}
            multiline
            numberOfLines={4}
          />
          {renderHelperText()}
        </View>
      );

    case 'boolean':
      return (
        <View style={styles.fieldContainer}>
          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <Text style={styles.switchLabelText}>{field.label}</Text>
              {field.helpText && (
                <Text style={styles.helpText}>{field.helpText}</Text>
              )}
            </View>
            <Switch
              value={value || false}
              onValueChange={onChange}
              disabled={disabled}
              trackColor={{ false: '#D1D5DB', true: '#A5B4FC' }}
              thumbColor={value ? '#6366F1' : '#F3F4F6'}
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      );

    case 'select':
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <View style={styles.selectContainer}>
            {field.options?.map((option, index) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectOption,
                  index === (field.options?.length || 0) - 1 && styles.selectOptionLast,
                  value === option.value && styles.selectOptionSelected,
                ]}
                onPress={() => onChange(option.value)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    value === option.value && styles.selectOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {value === option.value && (
                  <Ionicons name="checkmark" size={20} color="#6366F1" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {renderHelperText()}
        </View>
      );

    case 'multiselect':
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <View style={styles.multiSelectContainer}>
            {field.options?.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.multiSelectChip,
                    isSelected && styles.multiSelectChipSelected,
                  ]}
                  onPress={() => {
                    if (isSelected) {
                      onChange(selectedValues.filter((v: string) => v !== option.value));
                    } else {
                      onChange([...selectedValues, option.value]);
                    }
                  }}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.multiSelectChipText,
                      isSelected && styles.multiSelectChipTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#6366F1"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {renderHelperText()}
        </View>
      );

    case 'array':
      const arrayValue = Array.isArray(value) ? value : [];
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <View style={styles.arrayContainer}>
            {arrayValue.map((item: string, index: number) => (
              <View key={index} style={styles.arrayItem}>
                <TextInput
                  style={styles.arrayItemInput}
                  value={item}
                  onChangeText={(text) => {
                    const newArray = [...arrayValue];
                    newArray[index] = text;
                    onChange(newArray);
                  }}
                  placeholder={field.placeholder}
                  placeholderTextColor="#9CA3AF"
                  editable={!disabled}
                />
                <TouchableOpacity
                  style={styles.arrayItemRemove}
                  onPress={() => {
                    const newArray = arrayValue.filter((_: any, i: number) => i !== index);
                    onChange(newArray);
                  }}
                  disabled={disabled}
                >
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.arrayAddButton}
              onPress={() => onChange([...arrayValue, ''])}
              disabled={disabled}
            >
              <Ionicons name="add-circle" size={20} color="#6366F1" />
              <Text style={styles.arrayAddButtonText}>Add {field.label}</Text>
            </TouchableOpacity>
          </View>
          {renderHelperText()}
        </View>
      );

    default:
      return (
        <View style={styles.fieldContainer}>
          {renderLabel()}
          <TextInput
            style={[
              styles.input,
              error && styles.inputError,
              disabled && styles.inputDisabled,
            ]}
            value={value || ''}
            onChangeText={onChange}
            placeholder={field.placeholder}
            placeholderTextColor="#9CA3AF"
            editable={!disabled}
          />
          {renderHelperText()}
        </View>
      );
  }
};

// ============================================
// SECTION ICONS
// ============================================

const SECTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  basic: 'information-circle',
  location: 'location',
  contact: 'call',
  social: 'share-social',
  details: 'list',
  features: 'star',
  amenities: 'bed',
  services: 'construct',
  credentials: 'ribbon',
  policies: 'document-text',
  accessibility: 'accessibility',
  other: 'ellipsis-horizontal',
};

// ============================================
// MAIN COMPONENT
// ============================================

export const DynamicFormFields: React.FC<DynamicFormFieldsProps> = ({
  primaryCategory,
  subcategory,
  values,
  onChange,
  errors = {},
  disabled = false,
  excludeUniversalFields = false,
}) => {
  // Get fields organized by section
  const fieldsBySection = useMemo(() => {
    if (!primaryCategory) return {};
    return getFieldsBySection(primaryCategory, subcategory);
  }, [primaryCategory, subcategory]);

  // Filter out universal fields if requested
  const filteredSections = useMemo(() => {
    if (!excludeUniversalFields) return fieldsBySection;
    
    const filtered: Record<string, CategoryField[]> = {};
    for (const [section, fields] of Object.entries(fieldsBySection)) {
      if (section !== 'basic' && section !== 'location' && section !== 'contact') {
        filtered[section] = fields;
      }
    }
    return filtered;
  }, [fieldsBySection, excludeUniversalFields]);

  // Sort sections by defined order
  const sortedSections = useMemo(() => {
    return SECTION_ORDER.filter(section => filteredSections[section]?.length > 0);
  }, [filteredSections]);

  if (!primaryCategory) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Select a category to see available fields</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sortedSections.map((sectionKey) => (
        <View key={sectionKey} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons
              name={SECTION_ICONS[sectionKey] || 'ellipsis-horizontal'}
              size={20}
              color="#6366F1"
            />
            <Text style={styles.sectionTitle}>
              {SECTION_NAMES[sectionKey] || sectionKey}
            </Text>
          </View>
          
          {filteredSections[sectionKey].map((field) => (
            <FieldRenderer
              key={field.field}
              field={field}
              value={values[field.field]}
              onChange={(value) => onChange(field.field, value)}
              error={errors[field.field]}
              disabled={disabled}
              allValues={values}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

export default DynamicFormFields;