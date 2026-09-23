import { useThemeContext } from '../contexts/ThemeContext';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { FoodMenuPlace, FoodMenuResult, FoodMenuSearch, searchFoodMenuPlaces, searchFoodMenus } from '../lib/foodMenu';

type MenuMode = 'dishes' | 'restaurants';

export default function FoodMenuScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialMode: MenuMode = route.params?.mode === 'restaurants' ? 'restaurants' : 'dishes';
  const { theme, isDark } = useThemeContext();
  const accent = isDark ? '#43D8CA' : '#006B72';
  const { width, fontScale } = useWindowDimensions();
  const stackCards = width < 380 || fontScale > 1.3;
  const s = makeStyles(theme, accent);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [center, setCenter] = useState<{ latitude: number; longitude: number }>();
  const [radius, setRadius] = useState(25);
  const [items, setItems] = useState<FoodMenuResult[]>([]);
  const [places, setPlaces] = useState<FoodMenuPlace[]>([]);
  const [mode, setMode] = useState<MenuMode>(initialMode);
  const modeRef = useRef<MenuMode>(initialMode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const request = useRef(0);
  const activeSearch = useRef<FoodMenuSearch>({});
  async function search(append = false, coordinates = center, nextMode = modeRef.current) {
    const current = ++request.current;
    const options = append ? activeSearch.current : { query, city: coordinates ? '' : city, ...coordinates, radiusKm: radius };
    if (!append) { activeSearch.current = options; setItems([]); setPlaces([]); setMore(false); }
    setLoading(true); setError('');
    try {
      if (nextMode === 'restaurants') {
        const rows = await searchFoodMenuPlaces({ ...options, offset: append ? places.length : 0 });
        if (current !== request.current) return;
        setPlaces(old => append ? [...old, ...rows] : rows); setMore(rows.length === 30);
      } else {
        const rows = await searchFoodMenus({ ...options, offset: append ? items.length : 0 });
        if (current !== request.current) return;
        setItems(old => append ? [...old, ...rows] : rows); setMore(rows.length === 30);
      }
    } catch (e) { if (current === request.current) setError((e as Error).message); }
    finally { if (current === request.current) setLoading(false); }
  }
  useEffect(() => { search(); return () => { request.current++; }; }, []);
  // Re-opening the tool with a different mode param (deep link / another screen) switches tabs.
  useEffect(() => { if (route.params?.mode === 'restaurants' || route.params?.mode === 'dishes') switchMode(route.params.mode); }, [route.params?.mode]);
  function switchMode(next: MenuMode) {
    if (next === mode) return;
    modeRef.current = next; setMode(next); search(false, center, next);
  }
  const resultCount = mode === 'restaurants' ? places.length : items.length;
  async function nearby() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { setError('Location access is off. Enter a city or ZIP code.'); return; }
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { latitude: p.coords.latitude, longitude: p.coords.longitude };
      setCenter(next); setCity(''); search(false, next);
    } catch { setError('Could not access your location. Enter a city or ZIP code.'); }
  }
  return <SafeAreaView style={s.screen}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button"><Text style={s.link}>← Explore</Text></TouchableOpacity>
    <Text style={s.title}>Food Menu</Text>
    <View style={s.segment} accessibilityRole="tablist">
      {([['dishes', 'Dishes'], ['restaurants', 'Restaurants']] as [MenuMode, string][]).map(([key, label]) => <TouchableOpacity key={key} accessibilityRole="tab" accessibilityState={{ selected: mode === key }} onPress={() => switchMode(key)} style={[s.segmentBtn, mode === key && s.segmentBtnOn]}><Text style={[s.segmentText, mode === key && s.segmentTextOn]}>{label}</Text></TouchableOpacity>)}
    </View>
    <Text style={s.body}>{mode === 'restaurants' ? 'Browse restaurants that share their full menu on Tavvy.' : 'Find dishes on restaurant menus, including dishes with creative names.'}</Text>
    <Text style={s.label}>{mode === 'restaurants' ? 'Restaurant or dish (optional)' : 'What would you like to eat?'}</Text>
    <TextInput placeholderTextColor={theme.textSecondary} style={s.input} value={query} onChangeText={setQuery} placeholder={mode === 'restaurants' ? 'Try feijoada or a restaurant name' : 'Try chicken parmesan or fish tacos'} maxLength={120} returnKeyType="search" onSubmitEditing={() => search()} accessibilityLabel={mode === 'restaurants' ? 'Restaurant search' : 'Dish search'} />
    <Text style={s.label}>City, state, or ZIP code</Text>
    <TextInput placeholderTextColor={theme.textSecondary} style={s.input} value={city} onChangeText={v => { setCity(v); setCenter(undefined); }} placeholder={center ? 'Using your current location' : 'All locations'} maxLength={120} accessibilityLabel="Search location" />
    <TouchableOpacity onPress={nearby} accessibilityRole="button"><Text style={s.link}>Use my location</Text></TouchableOpacity>
    {center && <View style={s.radii}>{[5, 10, 25, 50, 100].map(km => <TouchableOpacity key={km} onPress={() => setRadius(km)} accessibilityRole="button" accessibilityState={{ selected: radius === km }}><Text style={[s.radius, radius === km && s.selected]}>{km} km</Text></TouchableOpacity>)}</View>}
    <TouchableOpacity style={s.button} onPress={() => search()} disabled={loading} accessibilityRole="button"><Text style={s.buttonText}>Search menus</Text></TouchableOpacity>
    {loading && <ActivityIndicator color={accent} />}{!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
    {!loading && !error && <Text style={s.body}>{resultCount ? `${resultCount}${more ? '+' : ''} ${mode === 'restaurants' ? 'restaurants with menus' : 'dishes'} found` : mode === 'restaurants' ? 'No restaurant menus found here yet. Try another location.' : 'No dishes found. Try another dish or location. Restaurants may not have added their menus yet.'}</Text>}
    {mode === 'restaurants' && places.map(place => <TouchableOpacity key={place.place_id} style={[s.card, stackCards && { flexDirection: 'column' }]} onPress={() => navigation.navigate('MenuGallery', { placeId: place.place_id, placeName: place.place_name, view: 'list' })} accessibilityRole="button" accessibilityLabel={`${place.place_name} menu`}>
      {place.cover_image_url && <Image source={{ uri: place.cover_image_url }} style={s.image} />}
      <View style={{ flex: 1, minWidth: 0 }}><Text style={s.item}>{place.place_name}</Text>
      <Text style={s.body}>{[place.city, place.state].filter(Boolean).join(', ')}{place.distance_km != null && ` · ${place.distance_km.toFixed(1)} km`}</Text>
      <Text style={s.label}>{place.dish_count} {place.dish_count === 1 ? 'dish' : 'dishes'} on the menu</Text>
      {place.sample_dishes.length > 0 && <Text style={s.body}>{place.sample_dishes.join(' · ')}</Text>}
      <Text style={s.link}>See full menu →</Text></View>
    </TouchableOpacity>)}
    {mode === 'dishes' && items.map(item => <TouchableOpacity key={item.id} style={[s.card, stackCards && { flexDirection: 'column' }]} onPress={() => navigation.navigate('MenuGallery', { placeId: item.place_id, placeName: item.place_name, dishId: item.id, view: 'list' })} accessibilityRole="button">
      {item.image_url && <Image source={{ uri: item.image_url }} style={s.image} />}
      <View style={{ flex: 1, minWidth: 0 }}><Text style={s.item}>{item.item_name}</Text><Text style={s.label}>{item.place_name}</Text>
      <Text style={s.body}>{[item.city, item.state].filter(Boolean).join(', ')}{item.distance_km != null && ` · ${item.distance_km.toFixed(1)} km`}</Text>
      {!!item.dish_type && item.dish_type !== item.item_name && <Text style={s.body}>{item.dish_type}</Text>}
      {!!item.description && <Text style={s.body}>{item.description}</Text>}
      {(!!item.price_label || item.price != null) && <Text style={s.body}>{item.price_label || `Listed price: ${Number(item.price).toFixed(2)}`}</Text>}<Text style={s.link}>View menu →</Text></View>
    </TouchableOpacity>)}
    {more && <TouchableOpacity style={s.button} onPress={() => search(true)} disabled={loading}><Text style={s.buttonText}>Load more</Text></TouchableOpacity>}
    <Text style={s.note}>Menu details come from restaurants. Confirm ingredients, allergens, prices, and availability with the restaurant.</Text>
  </ScrollView></SafeAreaView>;
}
const makeStyles = (theme: { background: string; surface: string; text: string; textSecondary: string; border: string }, accent: string) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background }, segment: { flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12, padding: 4, marginBottom: 6, borderWidth: 1, borderColor: theme.border }, segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' }, segmentBtnOn: { backgroundColor: '#8A05BE' }, segmentText: { color: theme.text, fontWeight: '600' }, segmentTextOn: { color: '#fff' }, content: { padding: 20, paddingBottom: 70 }, title: { fontSize: 32, fontWeight: '700', color: theme.text, marginVertical: 14 },
  body: { color: theme.textSecondary, fontSize: 15, lineHeight: 22, marginVertical: 6 }, label: { color: theme.text, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: theme.textSecondary, borderRadius: 10, padding: 13, fontSize: 16, color: theme.text, backgroundColor: theme.surface },
  link: { color: accent, fontWeight: '600', paddingVertical: 10 }, button: { backgroundColor: '#8A05BE', padding: 15, borderRadius: 10, marginVertical: 15 }, buttonText: { color: 'white', textAlign: 'center', fontWeight: '700' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 16, padding: 16, marginVertical: 7 }, item: { color: theme.text, fontSize: 20, fontWeight: '700' }, image: { width: 72, height: 72, borderRadius: 10 }, note: { color: theme.textSecondary, fontSize: 13, marginTop: 24, lineHeight: 20 }, radii: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, radius: { padding: 8, color: accent }, selected: { backgroundColor: theme.surface, borderRadius: 8 },
});
