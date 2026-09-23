import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HEADS_UP_ACK_KEY = '@tavvy_headsup_ack';
import * as Haptics from 'expo-haptics';
import { useThemeContext } from '../contexts/ThemeContext';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { EvidenceSubject } from '../lib/placeEvidence';
import { SignalTapSelection } from '../lib/signalTapSelection';
import { ComposerSignal, reviewComposerSections, reviewChoiceIntensity, toggleComposerChoice, emphasizeComposerChoice, selectedReviewChoices, visibleReviewChoices, ComposerChoice } from '../lib/reviewComposer';
export default function ReviewChoices({ signals, subject, selected, onChange, disabled = false, maxSelections = 100 }: {
  signals: ComposerSignal[]; subject?: EvidenceSubject; selected: SignalTapSelection; onChange: (next: SignalTapSelection) => void; disabled?: boolean; maxSelections?: number;
}) {
  const { theme, isDark } = useThemeContext(); const copy = useReleaseCopy();
  const [query, setQuery] = useState(''), [expanded, setExpanded] = useState<string[]>([]), [emphasis, setEmphasis] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  // First Heads Up in a review gets a one-time explanation: it counts against the place. Remembered per device.
  const pick = async (choice: ComposerChoice) => {
    const apply = () => { onChange(toggleComposerChoice(selected, choice)); void Haptics.selectionAsync().catch(() => {}); };
    if (choice.signal_type !== 'heads_up' || reviewChoiceIntensity(selected, choice)) return apply();
    let seen = false;
    try { seen = !!(await AsyncStorage.getItem(HEADS_UP_ACK_KEY)); } catch {}
    if (seen) return apply();
    Alert.alert(copy('A quick note on Heads Up'), copy('Heads Up tells other people what to watch out for, and it counts against this place. Add it when it would genuinely help someone decide.'), [
      { text: copy('Not now'), style: 'cancel' },
      { text: copy('Add it'), onPress: () => { AsyncStorage.setItem(HEADS_UP_ACK_KEY, new Date().toISOString()).catch(() => {}); apply(); } },
    ]);
  };
  const sections = reviewComposerSections(signals, subject, query).filter(section => section.signals.length);
  const choices = selectedReviewChoices(signals, selected), searching = !!query.trim();
  const activeKey = active ?? sections[0]?.key;
  const atLimit = Object.keys(selected).length >= maxSelections;
  const muted = { color: theme.textSecondary }, text = { color: theme.text }, accent = isDark ? '#D9B6FF' : theme.primary;
  return <View>
    <Text style={[styles.help, muted]}>{copy('Choose what you experienced. Tap again to remove. Every section is optional.')}</Text>
    <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}><Ionicons name="search-outline" size={18} color={theme.textSecondary}/><TextInput value={query} editable={!disabled} onChangeText={setQuery} placeholder={copy('Find a word')} accessibilityLabel={copy('Find a word')} placeholderTextColor={theme.textSecondary} style={[styles.searchInput, text]}/></View>
    {sections.map(section => {
      const open = searching || activeKey === section.key, all = searching || expanded.includes(section.key);
      const count = section.signals.filter(choice => reviewChoiceIntensity(selected, choice)).length;
      return <View key={section.key} style={[styles.section, { borderColor: theme.border }]}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open, disabled: disabled || searching }} disabled={disabled || searching} onPress={() => setActive(open ? '' : section.key)} style={styles.sectionToggle}>
          <Text style={[styles.heading, section.key === 'main' ? { fontSize: 18, color: accent } : text]}>{copy(section.title)}</Text>
          {count > 0 && <View style={[styles.count,{backgroundColor:isDark?'#33213F':'#F4EAF9'}]}><Text style={{color:accent,fontSize:12}}>{count}</Text><Ionicons name="checkmark" size={12} color={accent}/></View>}
          <Ionicons name={open?'chevron-up':'chevron-down'} size={18} color={theme.textSecondary}/>
        </Pressable>
        {open && <View style={{paddingBottom:16}}>
          <View style={styles.choices}>{visibleReviewChoices(section, selected, all, 8).map(choice => {
            const intensity = reviewChoiceIntensity(selected, choice), unavailable = disabled || (atLimit && !intensity);
            return <Pressable key={choice.id} accessibilityRole="button" accessibilityState={{ selected: !!intensity, disabled: unavailable }} disabled={unavailable} onPress={() => { void pick(choice); }} style={[styles.choice, { opacity: unavailable ? .6 : 1, borderColor: intensity ? accent : theme.border, backgroundColor: intensity ? isDark ? '#33213F' : '#F4EAF9' : theme.background }]}>
              {!!intensity && <Ionicons name="checkmark" size={15} color={theme.text}/>}<Text style={[styles.choiceText, text, intensity ? { fontWeight: '600' } : {}]}>{choice.label}{intensity > 1 ? ' ×'+intensity : ''}</Text>
            </Pressable>;
          })}</View>
          {!searching && section.signals.length > 8 && <Pressable accessibilityRole="button" accessibilityState={{ expanded: all }} disabled={disabled} onPress={() => setExpanded(previous => all ? previous.filter(key => key !== section.key) : [...previous, section.key])} style={styles.more}><Text style={{ color: accent, fontSize: 13 }}>{copy(all ? 'Show less' : 'More words')}</Text></Pressable>}
        </View>}
      </View>;
    })}
    {!sections.length && <Text accessibilityLiveRegion="polite" style={[styles.help, muted]}>{copy(searching ? 'No matching words. Your selections are kept.' : 'Review words are unavailable. Please try again.')}</Text>}
    {atLimit && <Text accessibilityLiveRegion="polite" style={[styles.help, muted]}>{copy('Selection limit reached. Remove a word to choose another.')}</Text>}
    {choices.length > 0 && <View><Pressable accessibilityRole="button" accessibilityState={{ expanded: emphasis }} disabled={disabled} onPress={() => setEmphasis(value => !value)} style={styles.more}><Text style={[styles.help, muted]}>{copy('Add emphasis (optional)')} {emphasis ? '−' : '+'}</Text></Pressable>{emphasis && <><Text style={[styles.help, muted]}>{copy('Emphasis describes your experience. It never counts as extra people.')}</Text>{choices.map(choice => <View key={choice.id} style={styles.strength}><Text style={[text, { flex: 1 }]}>{choice.label}</Text><View style={styles.choices}>{[1, 2, 3].map(value => <Pressable key={value} accessibilityRole="button" disabled={disabled} accessibilityLabel={choice.label+' · '+value} accessibilityState={{ selected: reviewChoiceIntensity(selected, choice) === value }} onPress={() => onChange(emphasizeComposerChoice(selected, choice, value))} style={[styles.level, { borderColor: reviewChoiceIntensity(selected, choice) === value ? accent : theme.border, backgroundColor: theme.surface }]}><Text style={text}>{value}</Text></Pressable>)}</View></View>)}</>}</View>}
  </View>;
}
const styles = StyleSheet.create({
  help: { fontSize: 13, lineHeight: 20, marginBottom: 12 }, search: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginBottom:10 }, searchInput: { flex: 1, minHeight: 44, fontSize: 14 },
  section: { borderBottomWidth: StyleSheet.hairlineWidth }, sectionToggle:{flexDirection:'row',alignItems:'center',gap:9,minHeight:56,paddingVertical:12}, heading: { flex:1,fontSize: 15, fontWeight: '600' }, count:{flexDirection:'row',alignItems:'center',gap:4,paddingHorizontal:7,paddingVertical:4,borderRadius:8},
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 12, maxWidth: '100%' }, choiceText: { fontSize: 14, flexShrink: 1 }, more: { minHeight: 44, justifyContent: 'center', paddingVertical: 8 },
  strength: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }, level: { minWidth: 44, minHeight: 44, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }
});
