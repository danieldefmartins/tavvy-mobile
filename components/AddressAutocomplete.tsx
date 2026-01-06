/**
 * AddressAutocomplete Component
 * 
 * A free address autocomplete component using Nominatim (OpenStreetMap).
 * No API key required, completely free to use.
 * 
 * Usage:
 * <AddressAutocomplete
 *   value={address}
 *   onSelect={(address, details) => {
 *     setAddress(address);
 *     setCity(details.city);
 *     setState(details.state);
 *     setPostalCode(details.postalCode);
 *     setCountry(details.country);
 *   }}
 *   placeholder="Enter address"
 *   label="Address"
 *   required
 * />
 * 
 * Path: components/AddressAutocomplete.tsx
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// ============================================
// TYPES
// ============================================

interface AddressDetails {
  fullAddress: string;
  streetNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onSelect: (address: string, details: AddressDetails) => void;
  onChange?: (text: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  // For service area mode - searches for cities/regions instead of street addresses
  mode?: 'address' | 'area';
}

// ============================================
// COMPONENT
// ============================================

export function AddressAutocomplete({
  value,
  onSelect,
  onChange,
  placeholder = 'Start typing an address...',
  label,
  required = false,
  error,
  disabled = false,
  mode = 'address',
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch suggestions from Nominatim
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Build Nominatim URL
      // For area mode, we search for cities/towns/regions
      // For address mode, we search for full addresses
      const baseUrl = 'https://nominatim.openstreetmap.org/search';
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        // Restrict to certain types for area mode
        ...(mode === 'area' && { featuretype: 'city' }),
      });

      const response = await fetch(`${baseUrl}?${params}`, {
        headers: {
          'Accept': 'application/json',
          // Nominatim requires a User-Agent header
          'User-Agent': 'TavvY-App/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data: NominatimResult[] = await response.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch (err) {
      console.error('Address autocomplete error:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [mode]);

  // Handle text input change with debounce
  const handleChangeText = useCallback((text: string) => {
    setInputValue(text);
    onChange?.(text);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the API call (300ms)
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  }, [onChange, fetchSuggestions]);

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback((result: NominatimResult) => {
    const address = result.address;
    
    // Extract city from various possible fields
    const city = address.city || address.town || address.village || address.municipality || '';
    
    // Build the details object
    const details: AddressDetails = {
      fullAddress: result.display_name,
      streetNumber: address.house_number,
      street: address.road,
      city: city,
      state: address.state,
      postalCode: address.postcode,
      country: address.country,
      countryCode: address.country_code?.toUpperCase(),
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    // For area mode, just use city/state/country
    // For address mode, use full address
    let displayAddress: string;
    if (mode === 'area') {
      const parts = [city, address.state, address.country].filter(Boolean);
      displayAddress = parts.join(', ');
    } else {
      // Build a cleaner address for display
      const parts = [
        address.house_number && address.road ? `${address.house_number} ${address.road}` : address.road,
        city,
        address.state,
        address.postcode,
      ].filter(Boolean);
      displayAddress = parts.join(', ');
    }

    setInputValue(displayAddress);
    setSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
    
    onSelect(displayAddress, details);
  }, [onSelect, mode]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding suggestions to allow tap to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  }, []);

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    onChange?.('');
    inputRef.current?.focus();
  }, [onChange]);

  // Render suggestion item
  const renderSuggestionItem = useCallback(({ item }: { item: NominatimResult }) => {
    const address = item.address;
    const city = address.city || address.town || address.village || '';
    
    // Primary text (street or city name)
    let primaryText: string;
    if (mode === 'area') {
      primaryText = city || item.display_name.split(',')[0];
    } else {
      primaryText = address.road 
        ? (address.house_number ? `${address.house_number} ${address.road}` : address.road)
        : item.display_name.split(',')[0];
    }
    
    // Secondary text (city, state, country)
    const secondaryParts = mode === 'area'
      ? [address.state, address.country].filter(Boolean)
      : [city, address.state, address.country].filter(Boolean);
    const secondaryText = secondaryParts.join(', ');

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSelectSuggestion(item)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionIcon}>
          <Ionicons 
            name={mode === 'area' ? 'location' : 'location-outline'} 
            size={20} 
            color={Colors.primary} 
          />
        </View>
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionPrimary} numberOfLines={1}>
            {primaryText}
          </Text>
          {secondaryText && (
            <Text style={styles.suggestionSecondary} numberOfLines={1}>
              {secondaryText}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [handleSelectSuggestion, mode]);

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
      )}

      {/* Input container */}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        disabled && styles.inputContainerDisabled,
      ]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={isFocused ? Colors.primary : '#9CA3AF'} 
          style={styles.searchIcon}
        />
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          editable={!disabled}
          autoCorrect={false}
          autoCapitalize="words"
        />

        {isLoading && (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
        )}

        {!isLoading && inputValue.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Error message */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={renderSuggestionItem}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={suggestions.length > 3}
            style={styles.suggestionsList}
          />
          
          {/* Attribution (required by Nominatim) */}
          <View style={styles.attribution}>
            <Text style={styles.attributionText}>
              Powered by OpenStreetMap
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000, // Ensure dropdown appears above other elements
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputContainerFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  inputContainerDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 250,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionPrimary: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  suggestionSecondary: {
    fontSize: 13,
    color: '#6B7280',
  },
  attribution: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attributionText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default AddressAutocomplete;