import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { REVIEW_WISHLIST_CATEGORIES, submitReviewWishlist } from '../lib/reviewWishlist';

const DONE_KEY = '@tavvy_review_wishlist_done';

/**
 * Tools screen block: a bold "Add a place" call-to-action plus a two-question
 * survey about what people want to review next (places they miss, and whether
 * general products like electronics, cars or handbags belong on Tavvy).
 */
export default function ReviewWishlistCard() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDark } = useThemeContext();
  const { i18n } = useTranslation();
  const copy = useReleaseCopy();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [missing, setMissing] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { AsyncStorage.getItem(DONE_KEY).then(v => { if (v) setDone(true); }).catch(() => {}); }, []);

  const toggle = (id: string) => setCategories(old => old.includes(id) ? old.filter(c => c !== id) : [...old, id]);
  const send = async () => {
    setSending(true); setError('');
    try {
      await submitReviewWishlist({ platform: Platform.OS === 'ios' ? 'ios' : 'android', userId: user?.id ?? null, missingPlaces: missing, productCategories: categories, otherText: other, locale: i18n.language });
      setDone(true); setOpen(false);
      AsyncStorage.setItem(DONE_KEY, new Date().toISOString()).catch(() => {});
    } catch (e) { setError((e as Error).message); }
    finally { setSending(false); }
  };
  const purple = '#8A05BE';
  return <View style={[styles.card, { backgroundColor: isDark ? '#2A1740' : '#F3E8FA', borderColor: isDark ? '#4D365E' : '#E0D0EE' }]}>
    <Text style={[styles.eyebrow, { color: isDark ? '#D8B4FE' : purple }]}>{copy('REVIEW ANYTHING')}</Text>
    <Text style={[styles.title, { color: theme.text }]}>{copy('What places are you missing?')}</Text>
    <Text style={[styles.body, { color: theme.textSecondary }]}>{copy('On Tavvy you can review anything that can get a review: a restaurant, a ride, a park, even a public bathroom. If it is not here yet, add it.')}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={() => navigation.navigate('UniversalAdd')} style={[styles.cta, { backgroundColor: purple }]}>
      <Ionicons name="add-circle" size={20} color="#fff" /><Text style={styles.ctaText}>{copy('Add a place')}</Text>
    </TouchableOpacity>

    {done ? <Text style={[styles.thanks, { color: theme.textSecondary }]}>{copy('Thanks! We read every answer.')}</Text>
    : !open ? <TouchableOpacity accessibilityRole="button" onPress={() => setOpen(true)} style={styles.openBtn}>
        <Text style={[styles.openText, { color: isDark ? '#D8B4FE' : purple }]}>{copy('Help us decide what comes next')}</Text><Ionicons name="chevron-down" size={16} color={isDark ? '#D8B4FE' : purple} />
      </TouchableOpacity>
    : <View style={styles.form}>
        <Text style={[styles.question, { color: theme.text }]}>{copy('Would you also review general products?')}</Text>
        <View style={styles.chips}>{REVIEW_WISHLIST_CATEGORIES.map(c => { const on = categories.includes(c.id); return <TouchableOpacity key={c.id} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => toggle(c.id)} style={[styles.chip, { borderColor: on ? purple : theme.border, backgroundColor: on ? purple : theme.surface }]}><Text style={{ color: on ? '#fff' : theme.text, fontSize: 13, fontWeight: '600' }}>{copy(c.label)}</Text></TouchableOpacity>; })}</View>
        <Text style={[styles.question, { color: theme.text }]}>{copy('What are you missing on Tavvy?')}</Text>
        <TextInput value={missing} onChangeText={setMissing} placeholder={copy('Places, products, anything you would love to review')} placeholderTextColor={theme.textSecondary} multiline maxLength={1000} style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} accessibilityLabel={copy('What are you missing on Tavvy?')} />
        {categories.includes('other') && <TextInput value={other} onChangeText={setOther} placeholder={copy('Which products?')} placeholderTextColor={theme.textSecondary} maxLength={500} style={[styles.input, { minHeight: 44, color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} accessibilityLabel={copy('Which products?')} />}
        {!!error && <Text accessibilityRole="alert" style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <TouchableOpacity accessibilityRole="button" disabled={sending} onPress={send} style={[styles.cta, { backgroundColor: purple, flex: 1, marginTop: 0 }]}>{sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>{copy('Send')}</Text>}</TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => setOpen(false)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}><Text style={{ color: theme.textSecondary, fontWeight: '600' }}>{copy('Not now')}</Text></TouchableOpacity>
        </View>
      </View>}
  </View>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 20, marginBottom: 26 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 27 },
  body: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 14, marginTop: 16 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  openBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, marginTop: 6 },
  openText: { fontSize: 14, fontWeight: '700' },
  thanks: { fontSize: 13, textAlign: 'center', marginTop: 12 },
  form: { marginTop: 18, gap: 12 },
  question: { fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 19, borderWidth: 1 },
  input: { minHeight: 80, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 15, textAlignVertical: 'top' },
});
