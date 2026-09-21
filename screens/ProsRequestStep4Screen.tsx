import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';

export default function ProsRequestStep4Screen({ navigation, route }: any) {
  const { t } = useTranslation();
  // SAFE PARAMETER HANDLING: Prevent crash if route.params or requestData is undefined
  const params = route.params || {};
  const requestData = params.requestData || {};

  const [address, setAddress] = useState(requestData.address || '');
  const [city, setCity] = useState(requestData.city || '');
  const [state, setState] = useState(requestData.state || '');
  const [zipCode, setZipCode] = useState(requestData.zipCode || '');
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const requestId = useRef(0);
  const [nearbyPosition, setNearbyPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [approximateState, setApproximateState] = useState<string | null>(null);
  const [locationPending, setLocationPending] = useState(true);

  useEffect(() => {
    fetch('https://tavvy.com/api/pros/address-context').then(response => response.ok ? response.json() : null).then(data => {
      if (typeof data?.state === 'string') setApproximateState(data.state);
    }).catch(() => {});
    Location.requestForegroundPermissionsAsync().then(async permission => {
      if (permission.granted) {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setNearbyPosition({ lat: position.coords.latitude, lon: position.coords.longitude });
      }
    }).catch(() => {}).finally(() => setLocationPending(false));
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Photon provides search-as-you-type with nearby ranking.
  const searchAddress = async (text: string) => {
    if (locationPending && !nearbyPosition) return;
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const currentRequest = ++requestId.current;
      const query = nearbyPosition ? text : [text, state.trim() || approximateState].filter(Boolean).join(', ');
      const params = new URLSearchParams({ q: query, limit: '8', lang: 'en' });
      if (nearbyPosition) {
        params.set('lat', String(nearbyPosition.lat));
        params.set('lon', String(nearbyPosition.lon));
      }
      const response = await fetch(`https://photon.komoot.io/api/?${params}`);
      if (!response.ok) return;
      const data = await response.json();
      if (currentRequest !== requestId.current) return;
      const matches = (data.features || []).filter((item: any) => item.properties?.countrycode?.toUpperCase() === 'US' && item.properties?.street);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!locationPending && address.length >= 3) searchAddress(address);
  }, [nearbyPosition, locationPending, approximateState]);

  const handleTextChange = (text: string) => {
    requestId.current++;
    setAddress(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchAddress(text);
    }, 700);
  };

  const handleSelectAddress = (item: any) => {
    requestId.current++;
    const addr = item.properties || {};
    
    const streetNumber = addr.housenumber || '';
    const road = addr.street || '';
    const streetAddress = `${streetNumber} ${road}`.trim();
    
    setAddress(streetAddress);
    setCity(addr.city || addr.town || addr.village || addr.suburb || '');
    setState(addr.state || '');
    setZipCode(addr.postcode || '');
    
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const handleContinue = () => {
    if (!address || !city || !state || !zipCode) {
      Alert.alert('Missing Info', 'Please provide a complete address.');
      return;
    }
    navigation.navigate('ProsRequestStep5', {
      requestData: { ...requestData, address, city, state, zipCode }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location & Timing</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Where is the project located?</Text>
        
        <Text style={styles.label}>Street Address</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Start typing your address..."
            value={address}
            onChangeText={handleTextChange}
            onFocus={() => address.length >= 3 && setShowSuggestions(true)}
          />
          {loading && <ActivityIndicator style={styles.loader} color="#00875A" />}
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionContainer}>
            {suggestions.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.suggestionItem}
                onPress={() => handleSelectAddress(item)}
              >
                <Ionicons name="location-sharp" size={20} color="#00875A" style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionMainText} numberOfLines={1}>
                    {`${item.properties.housenumber || ''} ${item.properties.street || ''}`.trim()}
                  </Text>
                  <Text style={styles.suggestionSubText} numberOfLines={1}>
                    {[item.properties.city || item.properties.town, item.properties.state, item.properties.postcode].filter(Boolean).join(', ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.row}>
          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput 
              style={styles.input} 
              value={city} 
              onChangeText={setCity} 
              placeholder="City"
            />
          </View>
          <View style={[styles.field, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>State</Text>
            <TextInput 
              style={styles.input} 
              value={state} 
              onChangeText={setState} 
              placeholder="State"
            />
          </View>
        </View>

        <Text style={styles.label}>Zip Code</Text>
        <TextInput 
          style={styles.input} 
          value={zipCode} 
          onChangeText={setZipCode} 
          placeholder="Zip Code"
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E0A3C' },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1E0A3C', marginBottom: 24, marginTop: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#4A4A4A', marginBottom: 8, marginTop: 16 },
  inputWrapper: { position: 'relative' },
  input: { borderWidth: 1.5, borderColor: '#F0F0F0', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#F9F9F9', color: '#1E0A3C' },
  loader: { position: 'absolute', right: 16, top: 18 },
  suggestionContainer: { backgroundColor: '#fff', borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 1000 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestionMainText: { fontSize: 16, fontWeight: '700', color: '#1E0A3C' },
  suggestionSubText: { fontSize: 13, color: '#7A7A7A', marginTop: 2 },
  row: { flexDirection: 'row' },
  field: { flex: 1 },
  button: { backgroundColor: '#00875A', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 40, shadowColor: '#00875A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
