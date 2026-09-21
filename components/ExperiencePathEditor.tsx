import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';
import { useExperienceEditor } from '../lib/useExperienceEditor';
import design from '../config/design.json';

export default function ExperiencePathEditor({ pathId, onSaved, onCancel }: { pathId: string; onSaved: (id: string) => void; onCancel: () => void }) {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { isDark } = useThemeContext();
  const palette = isDark ? design.dark : design.light;
  const editor = useExperienceEditor(supabase, pathId, user?.id);
  const { draft, setDraft } = editor;
  const text = { color: palette.text };
  const secondary = { color: palette.textSecondary };
  const field = [styles.field, { color: palette.text, borderColor: palette.border, backgroundColor: palette.surface }];
  const button = (label: string, action: () => void, disabled = false, primary = false) => <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled || editor.saving} onPress={action} style={[styles.button, { borderColor: palette.border, backgroundColor: primary ? design.primary : palette.surface, opacity: disabled || editor.saving ? 0.5 : 1 }]}><Text style={{ color: primary ? '#FFFFFF' : palette.link }}>{label}</Text></TouchableOpacity>;
  if (!user) return <View><Text style={[styles.title, text]}>Create an experience path</Text><Text style={[styles.description, secondary]}>Sign in to collect real places into a path of your own.</Text>{button('Sign in', () => navigation.navigate('Login'))}</View>;
  if (editor.loading) return <ActivityIndicator accessibilityLabel="Opening your path" color={palette.link} />;
  if (editor.loadError) return <View><Text accessibilityRole="alert" style={text}>{editor.loadError}</Text>{button('Retry', editor.retry)}{button('Back', onCancel)}</View>;
  const save = async (publish: boolean) => { const id = await editor.save(publish); if (id) onSaved(id); };
  return <View>
    <Text style={[styles.eyebrow, { color: palette.link }]}>YOUR PLACES, YOUR PLAN</Text><Text style={[styles.title, text]}>{pathId === 'new' ? 'Create a path' : 'Edit your path'}</Text><Text style={[styles.description, secondary]}>Bring a few real places together. Save a private draft or publish it for others to discover.</Text>
    <Text style={[styles.label, text]}>Path title</Text><TextInput accessibilityLabel="Path title" editable={!editor.saving} maxLength={200} style={field} value={draft.title} onChangeText={title => setDraft({ ...draft, title })} placeholder="Give your path a name" placeholderTextColor={palette.textSecondary} />
    <Text style={[styles.label, text]}>About this path</Text><TextInput accessibilityLabel="About this path" editable={!editor.saving} multiline maxLength={5000} style={[field, styles.multiline]} value={draft.description} onChangeText={description => setDraft({ ...draft, description })} placeholder="What makes these places worth visiting together?" placeholderTextColor={palette.textSecondary} />
    <Text style={[styles.label, text]}>Category (optional)</Text><TextInput accessibilityLabel="Category" editable={!editor.saving} maxLength={80} style={field} value={draft.category} onChangeText={category => setDraft({ ...draft, category })} />
    <Text style={[styles.label, text]}>Duration in minutes (optional)</Text><TextInput accessibilityLabel="Duration in minutes" editable={!editor.saving} keyboardType="number-pad" style={field} value={draft.duration_minutes} onChangeText={duration_minutes => setDraft({ ...draft, duration_minutes })} />
    <Text style={[styles.label, text]}>Cover image URL (optional)</Text><TextInput accessibilityLabel="Cover image URL" editable={!editor.saving} autoCapitalize="none" keyboardType="url" style={field} value={draft.cover_image_url} onChangeText={cover_image_url => setDraft({ ...draft, cover_image_url })} placeholder="https://…" placeholderTextColor={palette.textSecondary} />
    <Text style={[styles.heading, text]}>Your stops</Text><Text style={[styles.description, secondary]}>Add places in the order you would visit them. You can move or remove a stop before saving.</Text>
    {!draft.stops.length && <Text style={secondary}>No stops yet. Search for a place below.</Text>}
    {draft.stops.map((stop, index) => <View key={`${stop.place_id}-${index}`} style={[styles.stop, { backgroundColor: palette.surface, borderColor: palette.border }]}><Text style={[styles.stopTitle, text]}>{index + 1}. {stop.name}</Text><View style={styles.row}>{button('Move up', () => editor.move(index, -1), index === 0)}{button('Move down', () => editor.move(index, 1), index === draft.stops.length - 1)}{button('Remove', () => editor.remove(index))}</View><Text style={[styles.label, text]}>Note for this stop</Text><TextInput accessibilityLabel={`Note for ${stop.name}`} editable={!editor.saving} multiline maxLength={2000} style={[field, styles.multiline]} value={stop.note} onChangeText={note => setDraft({ ...draft, stops: draft.stops.map((item, i) => index === i ? { ...item, note } : item) })} /></View>)}
    <Text style={[styles.label, text]}>Find a place</Text><TextInput accessibilityLabel="Find a place" editable={!editor.saving} style={field} value={editor.query} onChangeText={editor.setQuery} placeholder="Search by place name" placeholderTextColor={palette.textSecondary} />
    {editor.searching ? <ActivityIndicator color={palette.link} accessibilityLabel="Finding places" /> : editor.searchError ? <View><Text accessibilityRole="alert" style={text}>{editor.searchError}</Text>{button('Retry search', editor.retrySearch)}</View> : editor.query.trim().length >= 2 && !editor.places.length ? <Text style={secondary}>No places found. Try a more specific name.</Text> : editor.places.map(place => <TouchableOpacity key={place.id} accessibilityRole="button" accessibilityLabel={`Add ${place.name}, ${[place.city, place.region].filter(Boolean).join(', ')}`} disabled={editor.saving || draft.stops.length >= 100} style={[styles.stop, { backgroundColor: palette.surface, borderColor: palette.border }]} onPress={() => editor.add(place)}><Text style={[styles.stopTitle, text]}>{place.name}</Text><Text style={[styles.description, secondary]}>{[place.city, place.region].filter(Boolean).join(', ') || 'Location not listed'}</Text><Text style={{ color: palette.link }}>Add stop +</Text></TouchableOpacity>)}
    {editor.places.length === 20 && <Text style={secondary}>Showing the first 20 matches. Refine the name if your place is missing.</Text>}
    {editor.error && <Text accessibilityRole="alert" style={[styles.description, text]}>{editor.error}</Text>}
    <View style={styles.actions}>{button(editor.saving ? 'Saving…' : editor.published ? 'Save published changes' : 'Publish path', () => save(true), false, true)}{button(editor.published ? 'Make private & save' : 'Save private draft', () => save(false))}{button('Cancel', onCancel)}</View>
  </View>;
}
const styles = StyleSheet.create({ title: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, marginVertical: 12 }, heading: { fontSize: 22, fontWeight: '600', marginTop: 24 }, eyebrow: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700', marginTop: 16 }, description: { fontSize: 14, lineHeight: 22, marginVertical: 10 }, label: { fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 8 }, field: { padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 15 }, multiline: { minHeight: 88, textAlignVertical: 'top' }, button: { padding: 12, borderWidth: 1, borderRadius: 12, marginVertical: 4 }, stop: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 14 }, stopTitle: { fontSize: 16, fontWeight: '600' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }, actions: { marginTop: 24, gap: 6 } });
