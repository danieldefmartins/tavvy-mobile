import OnTheGoSchedule from './OnTheGoSchedule';
import OnTheGoProfileEditor from './OnTheGoProfileEditor';
import React, { useState } from 'react';
import {useNavigation} from '@react-navigation/native';
import {useThemeContext} from '../contexts/ThemeContext';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View, Switch } from 'react-native';
import * as Location from 'expo-location';
import { OWNER_CATEGORIES, useOnTheGoOwner } from '../lib/useOnTheGoOwner';
export default function OnTheGoOwner({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const owner = useOnTheGoOwner();
  const navigation=useNavigation<any>();const {isDark}=useThemeContext();const text=isDark?'#fff':'#17013a',secondary=isDark?'#ccc':'#625e70',surface=isDark?'#292937':'#f1edf6';
  const [name, setName] = useState(''), [area, setArea] = useState(''), [category, setCategory] = useState(OWNER_CATEGORIES[0]);
  const [point, setPoint] = useState<[number, number] | null>(null), [locationError, setLocationError] = useState('');
  const [hours, setHours] = useState('4'), [note, setNote] = useState(''), [consent, setConsent] = useState(false);
  const [eventName, setEventName] = useState(''), [eventAddress, setEventAddress] = useState(''), [start, setStart] = useState(''), [end, setEnd] = useState('');
  const locate = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error();
      const p = await Location.getCurrentPositionAsync({}); setPoint([p.coords.latitude, p.coords.longitude]); setLocationError('');
    } catch { setLocationError('Location permission is needed to share this location.'); }
  };
  const field = (label: string, value: string, change: (s: string) => void) => <View><Text style={{ color: secondary, marginTop: 10 }}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={change} editable={!owner.busy} style={{ color: text, backgroundColor: surface, padding: 12, borderRadius: 8, marginVertical: 5 }} /></View>;
  const button = (label: string, action: () => unknown, disabled = false) => <TouchableOpacity accessibilityRole="button" disabled={owner.busy || disabled} onPress={action} style={{ backgroundColor: '#5563e8', padding: 12, borderRadius: 8, marginVertical: 6, opacity: owner.busy || disabled ? .5 : 1 }}><Text style={{ color: '#fff' }}>{label}</Text></TouchableOpacity>;
  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><ScrollView style={{ backgroundColor: isDark?'#0a0a0f':'#fff' }} contentContainerStyle={{ padding: 22, paddingTop: 60, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
    <TouchableOpacity accessibilityRole="button" onPress={onClose} style={{padding:12,minHeight:44}}><Text style={{color:text}}>Close</Text></TouchableOpacity><Text style={{ color: text, fontSize: 22 }}>Manage my mobile business</Text><Text style={{ color: secondary, marginVertical: 10 }}>Sign in to register and publish your location. Your businesses and sessions are restored when you return.</Text>
    {!owner.signedIn&&button('Sign in to manage your business',()=>{onClose();navigation.navigate('Login');})}{button('Refresh my businesses', owner.recover)}<ScrollView horizontal>{owner.places.map(p => <TouchableOpacity key={p.id} onPress={() => { owner.selectPlace(p.id); setPoint(null); setConsent(false); }} style={{ padding: 12, backgroundColor: owner.placeId === p.id ? '#5563e8' : surface, marginRight: 8 }}><Text style={{ color: owner.placeId===p.id?'#fff':text }}>{p.name}</Text></TouchableOpacity>)}</ScrollView>{button('Register another business', () => owner.selectPlace(''))}
    {!owner.registered && <>{field('Business name', name, setName)}<Text style={{ color: secondary }}>Category</Text><ScrollView horizontal>{OWNER_CATEGORIES.map(c => <TouchableOpacity key={c} onPress={() => setCategory(c)} style={{ padding: 10, backgroundColor: category === c ? '#5563e8' : surface, marginRight: 5 }}><Text style={{ color: category===c?'#fff':text }}>{c}</Text></TouchableOpacity>)}</ScrollView>{field('Service area', area, setArea)}{button('Register business', () => owner.register(name, category, area))}</>}
    {owner.placeId && <><OnTheGoProfileEditor placeId={owner.placeId}/>{/food|coffee|cafe|catering|ice.?cream/i.test(owner.places.find(p=>p.id===owner.placeId)?.tavvy_category||'')&&<>{button('Tavvy Menu, photos, stories & eCard',async()=>{const id=await owner.enableDetails();if(id){onClose();navigation.navigate('RestaurantWorkspace',{placeId:id});}})}<Text style={{color:secondary}}>Use your existing restaurant workspace. Ownership verification is required for its management tools.</Text></>}{button('Open full Tavvy place page',async()=>{const id=await owner.enableDetails();if(id){onClose();navigation.navigate('PlaceDetails',{placeId:id,mobileBusinessId:owner.placeId});}})}<Text style={{color:secondary}}>Enable one place page for reviews, photos and your available Tavvy features. This does not grant a verified badge.</Text>{button('Use my current location', locate)}{point && <Text style={{ color: text }}>Selected location: {point.map(n => n.toFixed(5)).join(', ')}</Text>}<Text style={{ color: secondary }}>{locationError}</Text><Text style={{ color: secondary }}>I agree to publish this business location. Live sessions end after the selected duration or when I end them.</Text><Switch value={consent} onValueChange={setConsent} accessibilityLabel="Agree to publish business location" />
      {!owner.sessionId ? <>{field('Duration (1–8 hours)', hours, setHours)}{field("Today's note", note, setNote)}{button('Start live session', () => point && owner.start(...point, Number(hours), note), !point || !consent)}</> : <>{button('Update live location', () => point && owner.update(...point, note), !point || !consent)}{field("Today's note", note, setNote)}{field('Public address', owner.address, owner.setAddress)}{button('Confirm public address', owner.confirm)}{button('End live session', owner.end)}</>}
      <OnTheGoSchedule key={owner.placeId} placeId={owner.placeId} refreshVersion={owner.scheduleVersion}/><Text style={{ color: text, fontSize: 18, marginTop: 20 }}>Schedule this selected location</Text>{field('Location name', eventName, setEventName)}{field('Address', eventAddress, setEventAddress)}{field('Start (YYYY-MM-DDTHH:mm, local time)', start, setStart)}{field('End (YYYY-MM-DDTHH:mm, local time)', end, setEnd)}{button('Publish schedule', () => point && owner.schedule(eventName, eventAddress, ...point, start, end), !point || !consent)}
    </>}
    <Text accessibilityLiveRegion="polite" style={{ color: text, marginVertical: 12 }}>{owner.busy ? 'Saving…' : owner.message}</Text>
  </ScrollView></Modal>;
}
