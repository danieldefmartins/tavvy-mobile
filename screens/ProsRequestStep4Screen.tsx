import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList, ActivityIndicator, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProsRequestStep4Screen({ navigation, route }: any) {
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Free Address Search using OpenStreetMap (Nominatim)
  const searchAddress = async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=5&countrycodes=us`,
        {
          headers: {
            'User-Agent': 'Tavvy-Mobile-App'
          }
        }
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setAddress(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchAddress(text);
    }, 500);
  };

  const handleSelectAddress = (item: any) => {
    const addr = item.address;
    
    const streetNumber = addr.house_number || '';
    const road = addr.road || '';
    const streetAddress = `${streetNumber} ${road}`.trim() || item.display_name.split(',')[0];
    
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
                    {item.display_name.split(',')[0]}
                  </Text>
                  <Text style={styles.suggestionSubText} numberOfLines={1}>
                    {item.display_name.split(',').slice(1).join(',').trim()}
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  content: { paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', marginBottom: 24, marginTop: 10 },
  label: { fontSize: 14, fontWeight: '700', color: '#4A4A4A', marginBottom: 8, marginTop: 16 },
  inputWrapper: { position: 'relative' },
  input: { borderWidth: 1.5, borderColor: '#F0F0F0', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#F9F9F9', color: '#1A1A1A' },
  loader: { position: 'absolute', right: 16, top: 18 },
  suggestionContainer: { backgroundColor: '#fff', borderRadius: 12, marginTop: 8, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, zIndex: 1000 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  suggestionMainText: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  suggestionSubText: { fontSize: 13, color: '#7A7A7A', marginTop: 2 },
  row: { flexDirection: 'row' },
  field: { flex: 1 },
  button: { backgroundColor: '#00875A', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 40, shadowColor: '#00875A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
