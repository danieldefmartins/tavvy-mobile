import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { CityRecord, cityPhotos, loadCity, loadCityPlaces } from '../lib/cities';

export default function CityDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
  const { params } = useRoute();
  const cityId = (params as { cityId?: string } | undefined)?.cityId;
  const { theme } = useThemeContext();
  const [city, setCity] = useState<CityRecord | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placesError, setPlacesError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState('Info');
  useEffect(() => {
    let current = true;
    setLoading(true); setCity(null); setPlaces([]); setError(''); setPlacesError('');
    (async () => {
      try {
        const record = cityId ? await loadCity(supabase, cityId) : null;
        if (!current) return;
        setCity(record);
        if (record) {
          try {
            const rows = await loadCityPlaces(supabase, record);
            if (current) setPlaces(rows);
          } catch { if (current) setPlacesError('Places could not be loaded. Please retry.'); }
        }
      } catch { if (current) setError('City could not be loaded. Please retry.'); }
      finally { if (current) setLoading(false); }
    })();
    return () => { current = false; };
  }, [cityId, attempt]);
  const retry = () => setAttempt(value => value + 1);
  const text = { color: theme.text };
  const secondary = { color: theme.textSecondary };
  const photos = city ? cityPhotos(city) : [];
  return <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Back" onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={26} color={theme.text} /></TouchableOpacity>
      <Text style={[styles.title, text]}>{city?.name || 'City'}</Text>
      {city && <TouchableOpacity accessibilityLabel="Share city" onPress={() => { Share.share({ message: `Explore ${city.name} on Tavvy: https://tavvy.com/app/city/${city.slug || city.id}` }).catch(() => setError('Unable to share this city.')); }}><Ionicons name="share-outline" size={24} color={theme.text} /></TouchableOpacity>}
    </View>
    {loading ? <ActivityIndicator size="large" color={theme.primary} /> : !city ? <View style={styles.section}>
      <Text style={text}>{error || 'City not found'}</Text>
      {error ? <TouchableOpacity onPress={retry}><Text style={text}>Retry</Text></TouchableOpacity> : null}
    </View> : <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      {city.cover_image_url ? <Image source={{ uri: city.cover_image_url }} style={styles.hero} /> : null}
      <View style={styles.section}>
        <Text style={secondary}>{[city.state || city.region, city.country].filter(Boolean).join(', ')}</Text>
        <Text style={secondary}>{city.population != null ? `${city.population.toLocaleString()} residents · ` : ''}{placesError ? 'Place count unavailable' : `${places.length} listed places`}{` · ${photos.length} photos`}</Text>
        {error ? <Text style={secondary}>{error}</Text> : null}
      </View>
      <View style={styles.tabs}>{['Info', 'Places', 'Photos', 'Reviews'].map(label => <TouchableOpacity key={label} onPress={() => setTab(label)}><Text style={[styles.tab, { color: tab === label ? theme.primary : theme.textSecondary }]}>{label}</Text></TouchableOpacity>)}</View>
      <View style={styles.section}>
        {tab === 'Info' && <>
          {[['About', city.description], ['Culture', city.culture], ['History', city.history], ['Best time to visit', city.best_time_to_visit], ['Weather', city.weather_summary], ['Time zone', city.timezone]].map(([label, value]) => value ? <View key={label} style={{ marginBottom: 20 }}><Text style={[styles.title, text]}>{label}</Text><Text style={[styles.body, secondary]}>{value}</Text></View> : null)}
          {!city.description && !city.culture && !city.history && <Text style={secondary}>No city overview has been published yet.</Text>}
        </>}
        {tab === 'Places' && (placesError ? <TouchableOpacity onPress={retry}><Text style={text}>{placesError} Tap to retry.</Text></TouchableOpacity> : places.length ? places.map(place => <TouchableOpacity key={place.id} style={[styles.place, { backgroundColor: theme.surface }]} onPress={() => navigation.navigate('PlaceDetails', { placeId: place.id })}><Text style={[styles.title, text]}>{place.name}</Text><Text style={secondary}>{[place.tavvy_category, place.street].filter(Boolean).join(' · ')}</Text></TouchableOpacity>) : <Text style={secondary}>No published places found for this city.</Text>)}
        {tab === 'Photos' && (photos.length ? photos.map(url => <Image key={url} source={{ uri: url }} style={styles.photo} />) : <Text style={secondary}>No city photos have been published yet.</Text>)}
        {tab === 'Reviews' && <Text style={[styles.body, secondary]}>City reviews are not available yet. Open a place in this city to see its community signals or share your experience.</Text>}
      </View>
    </ScrollView>}
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '700' }, body: { fontSize: 15, lineHeight: 23, marginTop: 8 }, hero: { width: '100%', height: 240 },
  section: { padding: 20, gap: 8 }, tabs: { flexDirection: 'row', justifyContent: 'space-around' }, tab: { padding: 12, fontWeight: '600' },
  place: { padding: 16, borderRadius: 12, marginBottom: 8 }, photo: { width: '100%', height: 230, marginBottom: 12, borderRadius: 12 },
});
