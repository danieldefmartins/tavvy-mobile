import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { withScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import ReviewChoices from '../components/ReviewChoices';
import { fetchUserReview, submitReview, updateReview, todayVisitDate, visitDateToIso } from '../lib/reviewPersistence';
import { getSignalsForCategory, SignalsByCategory } from '../lib/signalService';
import { loadPlaceSignalCategory } from '../lib/signalCatalog';
import { supabase } from '../lib/supabaseClient';
import { restoreSignalTaps, selectedSignalTaps } from '../lib/signalTapSelection';

type Params = { placeId?: string; placeName?: string; primaryCategory?: string; subcategory?: string; eventId?: string; eventName?: string; isEvent?: boolean };
type SavedReview = { review: { id: string; public_note?: string | null; private_note_owner?: string | null } | null; signals: { signalId: string; intensity: number }[] };
const EMPTY: SignalsByCategory = { best_for: [], vibe: [], heads_up: [] };
function AddReviewScreen() {
  const params = useRoute().params as Params | undefined;
  const navigation = useNavigation<any>(); const { user } = useAuth(); const { theme, isDark } = useThemeContext(); const copy = useReleaseCopy();
  const isEvent = !!params?.isEvent, id = (isEvent ? params?.eventId : params?.placeId) || '', name = (isEvent ? params?.eventName : params?.placeName) || '';
  const [signals, setSignals] = useState<SignalsByCategory>(EMPTY), [selected, setSelected] = useState<Record<string, number>>({});
  const [subject, setSubject] = useState({ category: params?.primaryCategory || 'other', subcategory: params?.subcategory });
  const [previous, setPrevious] = useState<SavedReview | null>(null), [editing, setEditing] = useState(false), [note, setNote] = useState(''), [date, setDate] = useState(todayVisitDate);
  const [visitOpen, setVisitOpen] = useState(false), [loading, setLoading] = useState(true), [loadError, setLoadError] = useState(''), [error, setError] = useState(''), [saving, setSaving] = useState(false), [success, setSuccess] = useState(false);
  const generation = useRef(0), busy = useRef(false), allowLeave = useRef(false);
  const total = Object.keys(selected).length;
  const load = useCallback(async () => {
    const request = ++generation.current;
    busy.current = false; setSaving(false); setLoading(true); setLoadError(''); setError(''); setSelected({}); setNote(''); setEditing(false); setPrevious(null); setDate(todayVisitDate()); setSuccess(false); allowLeave.current = false;
    try {
      if (!id) throw new Error('This place could not be found.');
      if (!user) return;
      if (isEvent) {
        const api = await import('../lib/eventReviews');
        const [catalog, saved] = await Promise.all([api.fetchSignalsForEvent(id), api.fetchUserEventReview(id)]);
        if (request !== generation.current) return;
        setSubject({ category: 'events', subcategory: undefined }); setSignals(catalog); setPrevious(saved);
        if (saved.review) { setEditing(true); setSelected(restoreSignalTaps(saved.signals)); setNote(saved.review.public_note || ''); }
      } else {
        const category = params?.primaryCategory ? { primary: params.primaryCategory, subcategory: params.subcategory } : await loadPlaceSignalCategory(supabase, id);
        const [catalog, saved] = await Promise.all([getSignalsForCategory(category.primary, category.subcategory), fetchUserReview(id)]);
        if (request !== generation.current) return;
        setSubject({ category: category.primary, subcategory: category.subcategory }); setSignals(catalog); setPrevious(saved);
      }
    } catch (cause) { if (request === generation.current) setLoadError(cause instanceof Error ? cause.message : 'Your review could not be loaded. Please try again.'); }
    finally { if (request === generation.current) setLoading(false); }
  }, [id, isEvent, user?.id, params?.primaryCategory, params?.subcategory]);
  useEffect(() => { void load(); return () => { generation.current++; }; }, [load]);
  useEffect(() => navigation.addListener('beforeRemove', (event: any) => {
    if (allowLeave.current || (!busy.current && !total && !note.trim())) return;
    event.preventDefault(); if (busy.current) return;
    Alert.alert(copy('Leave this review?'), copy('Your unsaved selections will be discarded.'), [{ text: copy('Keep editing'), style: 'cancel' }, { text: copy('Discard'), style: 'destructive', onPress: () => { allowLeave.current = true; navigation.dispatch(event.data.action); } }]);
  }), [navigation, total, note]);
  async function post() {
    if (busy.current || loading || loadError || !total || success || !user) return;
    busy.current = true; setSaving(true); setError(''); const request = generation.current;
    try {
      const taps = selectedSignalTaps(selected); let result;
      if (isEvent) {
        const api = await import('../lib/eventReviews');
        result = previous?.review ? await api.updateEventReview(previous.review.id, id, taps, note.trim(), previous.review.private_note_owner || '') : await api.submitEventReview(id, name, taps, note.trim(), '');
      } else result = editing && previous?.review ? await updateReview(previous.review.id, id, taps, note.trim(), previous.review.private_note_owner || undefined) : await submitReview(id, name, taps, note.trim() || undefined, undefined, { visitedAt: visitDateToIso(date) });
      if (!result.success) throw new Error(typeof result.error === 'string' ? result.error : 'Your review could not be saved. Please try again.');
      if (request !== generation.current) return;
      allowLeave.current = true; setSuccess(true);
    } catch (cause) { if (request === generation.current) setError(cause instanceof Error ? cause.message : 'Your review could not be saved. Please try again.'); }
    finally { if (request === generation.current) { busy.current = false; setSaving(false); } }
  }
  const text = { color: theme.text }, muted = { color: theme.textSecondary }, field = [styles.input, text, { backgroundColor: theme.surface, borderColor: theme.border }];
  const action = (label: string, onPress: () => void, disabled = false) => <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.primary, { backgroundColor: theme.primary, opacity: disabled ? .45 : 1 }]}><Text style={styles.primaryText}>{copy(label)}</Text></Pressable>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { borderColor: theme.border }]}><View style={{ flex: 1 }}><Text accessibilityRole="header" style={[styles.title, text]}>{copy(success ? 'Experience shared' : 'What stood out?')}</Text><Text style={[styles.subtitle, muted]}>{name}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={copy('Close')} disabled={saving} onPress={() => navigation.goBack()} style={[styles.close, { backgroundColor: theme.surface }]}><Ionicons name="close" size={23} color={theme.text}/></Pressable></View>
      {!user ? <View style={styles.body}><Text style={[styles.help, muted]}>{copy('Sign in to share your experience.')}</Text>{action('Sign in', () => navigation.navigate('Login'))}</View> : success ? <View style={[styles.body, { alignItems: 'center', gap: 18 }]}><Ionicons name="checkmark-circle-outline" size={54} color={theme.primary}/><Text style={[styles.heading, text]}>{copy('Thank you for sharing your experience.')}</Text><Text style={[styles.help, muted]}>{copy('Your words help someone choose their next place.')}</Text>{action('Done', () => navigation.goBack())}</View> : <>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
          {loading ? <ActivityIndicator color={theme.primary}/> : loadError ? <><Text accessibilityRole="alert" style={text}>{copy(loadError)}</Text>{action('Try again', () => void load())}</> : <>
            <ReviewChoices signals={Object.values(signals).flat()} subject={subject} selected={selected} onChange={setSelected} disabled={saving}/>
            <Text style={[styles.heading, text]}>{copy('Add context (optional)')}</Text><TextInput accessibilityLabel={copy('Add context (optional)')} multiline editable={!saving} value={note} onChangeText={setNote} maxLength={4000} placeholder={copy('What would help someone decide? Your note will be public.')} placeholderTextColor={theme.textSecondary} style={[field, { minHeight: 100, textAlignVertical: 'top', marginTop: 9 }]}/>
            {!isEvent && <><Pressable accessibilityRole="button" accessibilityState={{ expanded: visitOpen }} onPress={() => setVisitOpen(value => !value)} style={styles.visit}><Text style={muted}>{copy(editing ? 'Editing your previous review' : 'Visit date')} · {editing ? copy('Original date kept') : date} {visitOpen ? '−' : '+'}</Text></Pressable>{visitOpen && <View style={{ gap: 12 }}>
              {previous?.review && <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: editing }} disabled={saving} onPress={() => { setEditing(!editing); setSelected(editing ? {} : restoreSignalTaps(previous.signals)); setNote(editing ? '' : previous.review?.public_note || ''); }} style={styles.visit}><Text style={text}>{editing ? '☑' : '□'} {copy('Edit my previous review')}</Text></Pressable>}
              {!editing && <TextInput accessibilityLabel={copy('Visit date')} editable={!saving} value={date} onChangeText={setDate} maxLength={10} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" style={field}/>}
              <Text style={[styles.help, muted]}>{copy('A new visit adds an experience. Editing keeps the original visit and its history.')}</Text>
            </View>}</>}
          </>}
        </ScrollView>
        <View style={[styles.footer, { borderColor: theme.border }]}>{!!error && <Text accessibilityRole="alert" style={{ color: isDark ? '#FFB3B3' : '#A32131', marginBottom: 10 }}>{copy(error)}</Text>}{action(saving ? 'Saving…' : `${copy(editing ? 'Update review' : 'Post review')}${total ? ' · ' + total : ''}`, () => void post(), saving || loading || !!loadError || !total)}<Text style={[styles.footerNote, muted]}>{copy('Choose at least one word. A written review is optional.')}</Text></View>
      </>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: StyleSheet.hairlineWidth }, title: { fontSize: 25, fontWeight: '700', letterSpacing: -.5 }, subtitle: { fontSize: 14, marginTop: 5 }, close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, body: { padding: 20, paddingBottom: 30 }, heading: { fontSize: 14, fontWeight: '600', marginTop: 12 }, help: { fontSize: 13, lineHeight: 20, marginBottom: 12 }, input: { padding: 12, borderWidth: 1, borderRadius: 12, fontSize: 14 }, primary: { minHeight: 48, borderRadius: 14, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#fff', fontSize: 15, fontWeight: '600' }, footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, paddingHorizontal: 20 }, footerNote: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 8 }, visit: { minHeight: 44, paddingVertical: 12, marginTop: 6 } });
export default withScreenErrorBoundary(AddReviewScreen, 'AddReviewScreen');
