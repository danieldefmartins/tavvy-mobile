import design from '../config/design.json';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { ExperiencePath, loadExperiencePaths, matchesPath, loadOwnedExperiencePaths } from '../lib/experiencePaths';

export default function ExperiencePathsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDark } = useThemeContext();
  const palette = isDark ? design.dark : design.light;
  const [owned, setOwned] = useState<ExperiencePath[]>([]);
  const [ownedError, setOwnedError] = useState(false);
  const [ownedLoading, setOwnedLoading] = useState(false);
  const [ownedRetry, setOwnedRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setOwned([]); setOwnedError(false); setOwnedLoading(Boolean(user));
    if (user) loadOwnedExperiencePaths(supabase, user.id).then(rows => { if (active) setOwned(rows); }).catch(() => { if (active) setOwnedError(true); }).finally(() => { if (active) setOwnedLoading(false); });
    return () => { active = false; };
  }, [user?.id, ownedRetry]));
  const [paths, setPaths] = useState<ExperiencePath[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(false);
    loadExperiencePaths(supabase).then(data => { if (active) setPaths(data); })
      .catch(() => { if (active) setError(true); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]));
  const categories = ['all', ...Array.from(new Set(paths.map(p => p.category).filter((c): c is string => Boolean(c))))];
  const filtered = paths.filter(p => matchesPath(p, search, category));
  return <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
    <View style={styles.header}><TouchableOpacity accessibilityLabel="Go back" onPress={() => navigation.goBack()}><Text style={[styles.link, { color: palette.link }]}>← Back</Text></TouchableOpacity><Text style={[styles.heading, { color: theme.text }]}>Experiences</Text></View>
    <View style={{ paddingHorizontal: 16 }}><TouchableOpacity style={{ backgroundColor: theme.primary, borderRadius: 12, padding: 14, marginBottom: 12 }} onPress={() => navigation.navigate('ExperiencePathDetail', { pathId: 'new' })}><Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Create a path</Text></TouchableOpacity></View>
    <TextInput accessibilityLabel="Search experiences" placeholder="Search experiences…" value={search} onChangeText={setSearch} placeholderTextColor={theme.textSecondary} style={[styles.search, { backgroundColor: theme.surface, color: theme.text }]} />
    <View><ScrollView horizontal contentContainerStyle={styles.categories}>{categories.map(c => <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: c === category }} key={c} onPress={() => setCategory(c)} style={[styles.pill, { backgroundColor: c === category ? design.primary : theme.surface }]}><Text style={{ color: c === category ? 'white' : palette.link }}>{c === 'all' ? 'All paths' : c}</Text></TouchableOpacity>)}</ScrollView></View>
    <ScrollView contentContainerStyle={styles.content}>
      {user && <View style={{ marginBottom: 24 }}><Text style={[styles.title, { color: theme.text }]}>My paths</Text>{ownedLoading ? <ActivityIndicator accessibilityLabel="Loading your paths" color={theme.primary} /> : ownedError ? <TouchableOpacity onPress={() => setOwnedRetry(x => x + 1)}><Text style={{ color: theme.textSecondary }}>Your paths could not be loaded. Tap to retry.</Text></TouchableOpacity> : owned.length ? owned.map(path => <TouchableOpacity key={path.id} onPress={() => navigation.navigate('ExperiencePathDetail', { pathId: path.id })}><Text style={[styles.link, { color: palette.link }]}>{path.title} · {path.is_published ? 'Published' : 'Private draft'}</Text></TouchableOpacity>) : <Text style={{ color: theme.textSecondary, marginTop: 8 }}>Your saved paths will appear here.</Text>}</View>}
      {loading ? <ActivityIndicator accessibilityLabel="Loading experiences" /> : error ? <View><Text style={{ color: theme.textSecondary }}>Experiences could not be loaded.</Text><TouchableOpacity onPress={() => setRetry(x => x + 1)}><Text style={[styles.link, { color: palette.link }]}>Retry</Text></TouchableOpacity></View> : filtered.length === 0 ? <Text style={{ color: theme.textSecondary }}>{search || category !== 'all' ? 'No paths match your search.' : 'No published experience paths yet. Check back soon.'}</Text> : filtered.map(path => <TouchableOpacity accessibilityRole="button" key={path.id} style={[styles.card, { backgroundColor: theme.surface }]} onPress={() => navigation.navigate('ExperiencePathDetail', { pathId: path.id })}>
        {path.cover_image_url && <Image source={{ uri: path.cover_image_url }} style={styles.image} />}
        <View style={styles.body}><Text style={[styles.title, { color: theme.text }]}>{path.title}</Text>{path.description && <Text style={[styles.description, { color: theme.textSecondary }]}>{path.description}</Text>}<Text style={[styles.description, { color: theme.textSecondary }]}>{[path.category, path.duration_minutes != null ? `${path.duration_minutes} minutes` : null].filter(Boolean).join(' · ')}</Text></View>
      </TouchableOpacity>)}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' }, header: { padding: 16 }, heading: { fontSize: 28, fontWeight: '700', color: '#1F2937', marginTop: 12 }, link: { color: '#5856D6', paddingVertical: 12 }, search: { marginHorizontal: 16, padding: 14, borderRadius: 12, backgroundColor: 'white', color: '#1F2937' }, categories: { padding: 16, gap: 8 }, pill: { borderRadius: 24, padding: 12, backgroundColor: '#EDE9FE' }, selected: { backgroundColor: '#5856D6' }, content: { padding: 16, paddingBottom: 60 }, card: { backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }, image: { width: '100%', height: 180 }, body: { padding: 16 }, title: { fontSize: 20, fontWeight: '600', color: '#1F2937' }, description: { color: '#6B7280', marginTop: 8, lineHeight: 21 },
});
