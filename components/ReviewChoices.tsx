import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { EvidenceSubject } from '../lib/placeEvidence';
import { SignalTapSelection } from '../lib/signalTapSelection';
import { ComposerSignal, reviewComposerSections, toggleReviewChoice, visibleReviewChoices } from '../lib/reviewComposer';
export default function ReviewChoices({ signals, subject, selected, onChange, disabled = false, maxSelections = 100 }: {
  signals: ComposerSignal[]; subject?: EvidenceSubject; selected: SignalTapSelection; onChange: (next: SignalTapSelection) => void; disabled?: boolean; maxSelections?: number;
}) {
  const { theme, isDark } = useThemeContext(); const copy = useReleaseCopy();
  const [query, setQuery] = useState(''), [expanded, setExpanded] = useState<string[]>([]), [emphasis, setEmphasis] = useState(false);
  const sections = reviewComposerSections(signals, subject, query), choices = signals.filter(signal => selected[signal.id]);
  const atLimit = Object.keys(selected).length >= maxSelections;
  const muted = { color: theme.textSecondary }, text = { color: theme.text }, accent = isDark ? '#D9B6FF' : theme.primary;
  return <View>
    <Text style={[styles.help, muted]}>{copy('Choose what you experienced. Tap again to remove. Every section is optional.')}</Text>
    <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}><Ionicons name="search-outline" size={18} color={theme.textSecondary}/><TextInput value={query} editable={!disabled} onChangeText={setQuery} placeholder={copy('Find a word')} accessibilityLabel={copy('Find a word')} placeholderTextColor={theme.textSecondary} style={[styles.searchInput, text]}/></View>
    {sections.filter(section => section.signals.length).map(section => {
      const all = !!query.trim() || expanded.includes(section.key), limit = section.key === 'main' ? 8 : 4;
      return <View key={section.key} style={[styles.section, { borderColor: theme.border }]}>
        <Text accessibilityRole="header" style={[styles.heading, section.key === 'main' ? { fontSize: 19, color: accent } : text]}>{copy(section.title)}</Text>
        <View style={styles.choices}>{visibleReviewChoices(section, selected, all, limit).map(signal => <Pressable key={signal.id} accessibilityRole="button" accessibilityState={{ selected: !!selected[signal.id], disabled: disabled || (atLimit && !selected[signal.id]) }} disabled={disabled || (atLimit && !selected[signal.id])} onPress={() => { onChange(toggleReviewChoice(selected, signal.id)); void Haptics.selectionAsync().catch(() => {}); }} style={[styles.choice, { opacity: disabled || (atLimit && !selected[signal.id]) ? .6 : 1, borderColor: selected[signal.id] ? accent : theme.border, backgroundColor: selected[signal.id] ? isDark ? '#33213F' : '#F4EAF9' : theme.background }]}>
          {!!selected[signal.id] && <Ionicons name="checkmark" size={15} color={theme.text}/>}<Text style={[styles.choiceText, text, selected[signal.id] ? { fontWeight: '600' } : {}]}>{signal.label}{selected[signal.id] > 1 ? ` ×${selected[signal.id]}` : ''}</Text>
        </Pressable>)}</View>
        {!query.trim() && section.signals.length > limit && <Pressable accessibilityRole="button" accessibilityState={{ expanded: all }} disabled={disabled} onPress={() => setExpanded(previous => all ? previous.filter(key => key !== section.key) : [...previous, section.key])} style={styles.more}><Text style={{ color: accent, fontSize: 12 }}>{copy(all ? 'Show less' : 'More words')}</Text></Pressable>}
      </View>;
    })}
    {!sections.some(section => section.signals.length) && <Text accessibilityLiveRegion="polite" style={[styles.help, muted]}>{copy(query.trim() ? 'No matching words. Your selections are kept.' : 'Review words are unavailable. Please try again.')}</Text>}
    {atLimit && <Text accessibilityLiveRegion="polite" style={[styles.help, muted]}>{copy('Selection limit reached. Remove a word to choose another.')}</Text>}
    {choices.length > 0 && <View><Pressable accessibilityRole="button" accessibilityState={{ expanded: emphasis }} onPress={() => setEmphasis(value => !value)} style={styles.more}><Text style={[styles.help, muted]}>{copy('Add emphasis (optional)')} {emphasis ? '−' : '+'}</Text></Pressable>{emphasis && <><Text style={[styles.help, muted]}>{copy('Emphasis describes your experience. It never counts as extra people.')}</Text>{choices.map(signal => <View key={signal.id} style={styles.strength}><Text style={[text, { flex: 1 }]}>{signal.label}</Text><View style={styles.choices}>{[1, 2, 3].map(value => <Pressable key={value} accessibilityRole="button" disabled={disabled} accessibilityLabel={`${signal.label} · ${value}`} accessibilityState={{ selected: selected[signal.id] === value }} onPress={() => onChange({ ...selected, [signal.id]: value })} style={[styles.level, { borderColor: selected[signal.id] === value ? accent : theme.border, backgroundColor: theme.surface }]}><Text style={text}>{value}</Text></Pressable>)}</View></View>)}</>}</View>}
  </View>;
}
const styles = StyleSheet.create({ help: { fontSize: 13, lineHeight: 20, marginBottom: 12 }, search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 }, searchInput: { flex: 1, minHeight: 44, fontSize: 14 }, section: { paddingTop: 17, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth }, heading: { fontSize: 14, fontWeight: '600', marginBottom: 10 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 12, maxWidth: '100%' }, choiceText: { fontSize: 14, flexShrink: 1 }, more: { minHeight: 44, justifyContent: 'center', paddingVertical: 8 }, strength: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }, level: { minWidth: 44, minHeight: 44, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' } });
