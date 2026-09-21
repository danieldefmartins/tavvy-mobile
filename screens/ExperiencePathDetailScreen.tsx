import design from '../config/design.json';
import ExperiencePathEditor from '../components/ExperiencePathEditor';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import { ExperiencePath, ExperienceStop, loadExperiencePath, loadExperienceStops, loadEditableExperiencePath } from '../lib/experiencePaths';

export default function ExperiencePathDetailScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDark } = useThemeContext();
  const palette = isDark ? design.dark : design.light;
  const [editing, setEditing] = useState(false);
  const route = useRoute<any>();
  const id = typeof route.params?.pathId === 'string' ? route.params.pathId : '';
  const [path, setPath] = useState<ExperiencePath | null>(null);
  const [stops, setStops] = useState<ExperienceStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false); setPath(null); setStops([]);
    (async () => {
      try {
        const owned = user ? await loadEditableExperiencePath(supabase, id, user.id) : null;
        const result = owned || await loadExperiencePath(supabase, id);
        const items = result ? await loadExperienceStops(supabase, id) : [];
        if (active) { setPath(result); setStops(items); }
      } catch { if (active) setError(true); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [id, retry, user?.id]);
  return <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
    <TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()}><Text style={[styles.link, { color: palette.link }]}>← Experiences</Text></TouchableOpacity>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
      {id === 'new' || editing ? <ExperiencePathEditor pathId={id} onCancel={() => { if (id === 'new') navigation.goBack(); else setEditing(false); }} onSaved={savedId => { setEditing(false); setRetry(x => x + 1); navigation.setParams({ pathId: savedId, saved: true }); }} /> : loading ? <ActivityIndicator accessibilityLabel="Loading experience" /> : error ? <View><Text style={{ color: theme.textSecondary }}>Experience could not be loaded.</Text><TouchableOpacity onPress={() => setRetry(x => x + 1)}><Text style={[styles.link, { color: palette.link }]}>Retry</Text></TouchableOpacity></View> : !path ? <Text style={{ color: theme.textSecondary }}>Experience not found.</Text> : <>
        {path.cover_image_url && <Image source={{ uri: path.cover_image_url }} style={styles.image} />}
        {route.params?.saved && <Text style={{ color: theme.textSecondary }}>{path.is_published ? 'Your path is published.' : 'Your private draft is saved.'}</Text>}
        {user?.id === path.owner_id && <TouchableOpacity onPress={() => setEditing(true)}><Text style={[styles.link, { color: palette.link }]}>Edit path · {path.is_published ? 'Published' : 'Private draft'}</Text></TouchableOpacity>}
        <Text style={[styles.heading, { color: theme.text }]}>{path.title}</Text><Text style={[styles.description, { color: theme.textSecondary }]}>{path.description}</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>{[path.category, path.duration_minutes != null ? `${path.duration_minutes} minutes` : null].filter(Boolean).join(' · ')}</Text>
        <Text style={[styles.title, { color: theme.text }]}>{stops.length} stops</Text>
        {stops.length === 0 ? <Text style={{ color: theme.textSecondary }}>No stops have been added to this experience yet.</Text> : stops.map((stop, index) => <View key={stop.id} style={[styles.card, { backgroundColor: theme.surface }]}>
          {stop.place ? <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('PlaceDetails', { placeId: stop.place_id })}><Text style={[styles.link, { color: palette.link }]}>{index + 1}. {stop.place.name}</Text></TouchableOpacity> : <Text style={{ color: theme.textSecondary }}>{index + 1}. Place unavailable</Text>}
          {stop.note && <Text style={[styles.description, { color: theme.textSecondary }]}>{stop.note}</Text>}
        </View>)}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F8F9FA' }, content: { padding: 16, paddingBottom: 60 }, link: { color: '#5856D6', padding: 16, fontSize: 16 }, image: { width: '100%', height: 220, borderRadius: 16 }, heading: { fontSize: 28, fontWeight: '700', color: '#1F2937', marginTop: 16 }, title: { fontSize: 20, fontWeight: '600', marginVertical: 16 }, description: { color: '#6B7280', lineHeight: 22, marginVertical: 8 }, card: { backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 12 } });
