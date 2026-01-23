import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Address interface
export interface AddressData {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  formattedAddress: string;
}

interface Props {
  value: AddressData;
  onChange: (address: AddressData) => void;
  googleApiKey?: string;
}

// Helper function to format text to Title Case
const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to format state to 2-letter abbreviation
const formatState = (state: string): string => {
  const stateAbbreviations: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  };
  
  const lowerState = state.toLowerCase().trim();
  
  // If already 2 letters, return uppercase
  if (state.length === 2) {
    return state.toUpperCase();
  }
  
  // Look up abbreviation
  return stateAbbreviations[lowerState] || state.toUpperCase().substring(0, 2);
};

// Format the display address
export const formatDisplayAddress = (address: AddressData): { line1: string; line2: string } => {
  const line1 = address.address2 
    ? `${address.address1} ${address.address2}`
    : address.address1;
  
  const line2 = `${address.city}, ${address.state} ${address.zipCode}`;
  
  return { line1, line2 };
};

export default function AddressAutocomplete({ value, onChange, googleApiKey }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Search for address predictions using Google Places API
  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setPredictions([]);
      return;
    }

    if (!googleApiKey) {
      // Fallback: just use the typed address
      console.log('No Google API key provided, using manual entry');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&components=country:us&key=${googleApiKey}`
      );
      const data = await response.json();
      
      if (data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Error fetching address predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      searchAddress(text);
    }, 300);
  };

  // Get place details and parse address components
  const selectPrediction = async (prediction: any) => {
    if (!googleApiKey) {
      // Manual entry fallback
      const parts = prediction.description?.split(',') || [];
      onChange({
        address1: toTitleCase(parts[0]?.trim() || ''),
        address2: '',
        city: toTitleCase(parts[1]?.trim() || ''),
        state: formatState(parts[2]?.trim() || ''),
        zipCode: '',
        country: 'USA',
        formattedAddress: prediction.description || '',
      });
      setModalVisible(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=address_components,formatted_address&key=${googleApiKey}`
      );
      const data = await response.json();
      
      if (data.result) {
        const components = data.result.address_components || [];
        
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';
        let country = '';
        
        components.forEach((component: any) => {
          const types = component.types;
          
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          }
          if (types.includes('route')) {
            route = component.long_name;
          }
          if (types.includes('locality')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.short_name; // Already abbreviated
          }
          if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
          if (types.includes('country')) {
            country = component.long_name;
          }
        });
        
        const address1 = toTitleCase(`${streetNumber} ${route}`.trim());
        
        onChange({
          address1,
          address2: '',
          city: toTitleCase(city),
          state: state.toUpperCase(),
          zipCode,
          country: country || 'USA',
          formattedAddress: data.result.formatted_address || '',
        });
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setLoading(false);
      setModalVisible(false);
      setSearchQuery('');
      setPredictions([]);
    }
  };

  // Check if address is filled
  const hasAddress = value.address1 && value.city && value.state;
  const displayAddress = hasAddress ? formatDisplayAddress(value) : null;

  return (
    <View style={styles.container}>
      {/* Address Display / Trigger */}
      <TouchableOpacity 
        style={styles.addressButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {hasAddress ? (
          <View style={styles.addressContent}>
            <Ionicons name="location" size={20} color="#00C853" />
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLine1}>{displayAddress?.line1}</Text>
              <Text style={styles.addressLine2}>{displayAddress?.line2}</Text>
            </View>
            <Ionicons name="pencil" size={16} color="#9E9E9E" />
          </View>
        ) : (
          <View style={styles.addressPlaceholder}>
            <Ionicons name="location-outline" size={20} color="#9E9E9E" />
            <Text style={styles.placeholderText}>Add your address</Text>
            <Ionicons name="chevron-forward" size={16} color="#9E9E9E" />
          </View>
        )}
      </TouchableOpacity>

      {/* Address Input Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                setSearchQuery('');
                setPredictions([]);
              }}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Enter Address</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9E9E9E" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for your address..."
              placeholderTextColor="#BDBDBD"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus
              autoCapitalize="words"
            />
            {loading && <ActivityIndicator size="small" color="#00C853" />}
          </View>

          {/* Predictions List */}
          {predictions.length > 0 && (
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.place_id}
              style={styles.predictionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.predictionItem}
                  onPress={() => selectPrediction(item)}
                >
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.predictionText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          {/* Manual Entry Section */}
          <View style={styles.manualEntryContainer}>
            <Text style={styles.manualEntryTitle}>Or enter manually:</Text>
            
            {/* Address Line 1 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Street address"
                placeholderTextColor="#BDBDBD"
                value={value.address1}
                onChangeText={(text) => onChange({ ...value, address1: toTitleCase(text) })}
                autoCapitalize="words"
              />
            </View>

            {/* Address Line 2 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address 2 (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Apt, Suite, Unit, etc."
                placeholderTextColor="#BDBDBD"
                value={value.address2}
                onChangeText={(text) => onChange({ ...value, address2: toTitleCase(text) })}
                autoCapitalize="words"
              />
            </View>

            {/* City, State, Zip Row */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#BDBDBD"
                  value={value.city}
                  onChangeText={(text) => onChange({ ...value, city: toTitleCase(text) })}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1, marginHorizontal: 8 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.input}
                  placeholder="FL"
                  placeholderTextColor="#BDBDBD"
                  value={value.state}
                  onChangeText={(text) => onChange({ ...value, state: formatState(text) })}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
              
              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={styles.inputLabel}>Zip Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="33432"
                  placeholderTextColor="#BDBDBD"
                  value={value.zipCode}
                  onChangeText={(text) => onChange({ ...value, zipCode: text })}
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!value.address1 || !value.city || !value.state) && styles.saveButtonDisabled
              ]}
              onPress={() => setModalVisible(false)}
              disabled={!value.address1 || !value.city || !value.state}
            >
              <Text style={styles.saveButtonText}>Save Address</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  addressButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  addressTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addressLine1: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addressLine2: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addressPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: '#BDBDBD',
    marginLeft: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 14,
  },
  predictionsList: {
    maxHeight: 200,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  predictionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
  },
  manualEntryContainer: {
    padding: 16,
    marginTop: 16,
  },
  manualEntryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  saveButton: {
    backgroundColor: '#00C853',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
