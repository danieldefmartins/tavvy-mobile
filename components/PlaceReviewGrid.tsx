import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { useThemeContext } from '../contexts/ThemeContext';
import { cardReviewRows, reviewSections, PlaceReviewSummary, ReviewTileKey, ReviewTopic } from '../lib/placeReviewSummary';

type Tone = ReviewTopic['tone'];
const SECTION_TONE: Record<ReviewTileKey, Tone> = { main: 'neutral', good: 'positive', vibe: 'neutral', headsup: 'concern' };
const ACCENT: Record<Tone, string> = { positive: '#00C2CB', neutral: '#8A05BE', concern: '#F5A623' };
// Bars need enough people to mean something; below this a tiny sample would look like a full bar.
const BAR_MIN_PEOPLE = 5;
const FULL_INITIAL_TOPICS = 3;

/**
 * Shared presentation (mirrors web): every displayed topic is one row whose background is its
 * frequency bar (people who mentioned it out of recent reviewers, one scale per place), with the
 * word and the count on top. Bar length is frequency, never quality or severity; concerns keep
 * their "!" marker. Compact mode is the search card (one expandable row per section); full mode
 * is the place screen (rows select a topic to show matching experiences).
 */
export default function PlaceReviewGrid({ summary, mode = 'compact', selectedTopic, onSelect }: {
  summary: PlaceReviewSummary; explain?: boolean; mode?: 'compact' | 'full'; selectedTopic?: string | null;
  onSelect?: (section: ReviewTileKey, topic: ReviewTopic) => void;
}) {
  const { theme, isDark } = useThemeContext(); const copy = useReleaseCopy();
  const [expanded, setExpanded] = useState<string[]>([]);
  const [about, setAbout] = useState(false);
  const compact = mode === 'compact', count = summary.recentReviewers || 0;
  const muted = { color: theme.textSecondary };
  if (summary.status !== 'ready') return <Text accessibilityLiveRegion="polite" style={[styles.note, muted]}>{copy(summary.status === 'loading' ? 'Loading recent reviews…' : summary.status === 'empty' ? 'Be the first to share your experience' : 'Recent reviews unavailable')}</Text>;
  const sections = compact ? cardReviewRows(summary) : reviewSections(summary);
  const toneColor: Record<Tone, string> = { positive: isDark ? '#58D9DE' : '#067A80', neutral: isDark ? '#D9B6FF' : '#74209A', concern: isDark ? '#FFD38A' : '#885000' };
  const fillTint: Record<Tone, string> = { positive: isDark ? '#204b4c' : '#b6e9e8', neutral: isDark ? '#4b315f' : '#e3cef4', concern: isDark ? '#5a3c18' : '#f8dca6' };
  const trackColor = isDark ? '#29252f' : '#f1f0f4';
  const showBars = count >= BAR_MIN_PEOPLE;
  const evidenceLine = copy(count === 1 ? 'Early impressions · 1 reviewer' : count > 1 ? '{{count}} people · Last 6 months' : 'No recent reviews').replace('{{count}}', String(count));
  const hasMainConcern = sections.some(row => row.key === 'main' && row.topics.some(topic => topic.tone === 'concern'));
  const emptyText = (key: ReviewTileKey) => copy(key === 'headsup' && count > 0 ? (hasMainConcern ? 'No other recent concerns reported' : 'No recent concerns reported') : 'More recent reviews needed');
  const width = (topic: ReviewTopic) => showBars ? `${Math.max(2, Math.round((topic.count / Math.max(count, 1)) * 100))}%` : '0%';
  const toneOf = (section: ReviewTileKey, topic: ReviewTopic): Tone => topic.tone === 'concern' ? 'concern' : SECTION_TONE[section] === 'neutral' && section !== 'main' ? 'neutral' : 'positive';
  const toggle = (key: string) => setExpanded(previous => previous.includes(key) ? previous.filter(item => item !== key) : [...previous, key]);
  // Accent for labels and controls: the logo's teal (text-safe shades), not the purple used for atmosphere.
  const accent = isDark ? '#58D9DE' : '#067A80';
  const labelColor = (section: ReviewTileKey) => section === 'main' ? accent : theme.textSecondary;
  const mark = <View style={styles.mark}><Text style={styles.markText}>!</Text></View>;
  const wordOf = (topic: ReviewTopic) => {
    const olderDate = topic.lastReportedAt ? topic.lastReportedAt.slice(0, 10) : '';
    const older = topic.older ? ` · ${compact ? copy('Older') : copy('Older report')}${!compact && olderDate ? ` · ${olderDate}` : ''}` : '';
    return <Text numberOfLines={2} style={[styles.word, !compact && styles.wordFull, { color: theme.text }]}>{topic.label}{older ? <Text style={styles.older}>{older}</Text> : null}</Text>;
  };

  // One row: the bar is the background; label (optional), word and count sit on it.
  const barRow = (section: ReviewTileKey, topic: ReviewTopic, options: { title?: string; onPress?: () => void; expandedState?: boolean; pressed?: boolean; accessibilityLabel?: string; indent?: boolean } = {}) => {
    const tone = toneOf(section, topic);
    const inner = <>
      <View pointerEvents="none" style={[styles.fill, { width: width(topic) as any, backgroundColor: fillTint[tone] }]} />
      {options.title ? <Text numberOfLines={1} style={[styles.wlabel, { color: labelColor(section) }]}>{copy(options.title)}</Text> : null}
      {topic.tone === 'concern' && mark}
      {wordOf(topic)}
      <Text style={[styles.count, { color: theme.text }]}>{topic.count}</Text>
      {options.expandedState !== undefined && <Ionicons name={options.expandedState ? 'chevron-up' : 'chevron-down'} size={14} color={theme.textSecondary} />}
    </>;
    const style = [styles.wrow, !compact && styles.wrowFull, options.indent && styles.wrowIndent, { backgroundColor: trackColor }];
    return options.onPress
      ? <Pressable key={topic.slug || topic.label} accessibilityRole="button" accessibilityState={{ expanded: options.expandedState, selected: options.pressed }} accessibilityLabel={options.accessibilityLabel} onPress={options.onPress} style={style}>{inner}</Pressable>
      : <View key={topic.slug || topic.label} style={style}>{inner}</View>;
  };

  return <View accessibilityLabel={copy('Recent reviews')}>
    {compact && <Text style={[styles.note, muted, { marginBottom: 8, fontSize: 12 }]}><Text style={{ color: theme.text, fontWeight: '800' }}>{copy('Reviews')}</Text> · {evidenceLine}</Text>}
    {!compact && <View style={styles.evidenceLine}>
      <Text style={[styles.evidenceFull, { color: theme.text }]}>{evidenceLine}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: about }} onPress={() => setAbout(value => !value)} style={styles.about}>
        <View style={[styles.info, { borderColor: theme.textSecondary }]}><Text style={[styles.infoText, muted]}>i</Text></View>
        <Text style={[styles.aboutText, muted]}>{copy('About these numbers')}</Text>
      </Pressable>
    </View>}
    {!compact && about && <Text style={[styles.note, muted, { marginBottom: 10 }]}>{copy('Numbers count people, not repeat taps. A person can mention more than one topic.')}{showBars ? ` ${copy('Bars show how many of the {{count}} people mentioned it').replace('{{count}}', String(count))}.` : ''}{onSelect ? ` ${copy('Choose a topic to see experiences.')}` : ''}</Text>}
    {sections.map(section => {
      const open = expanded.includes(section.key);
      const main = section.key === 'main';
      if (compact) {
        const [top, ...rest] = section.topics;
        return <View key={section.key} testID={`review-section-${section.key}`} style={{ marginTop: 6 }}>
          {top
            ? barRow(section.key, top, { title: section.title, onPress: rest.length ? () => toggle(section.key) : undefined, expandedState: rest.length ? open : undefined })
            : <View style={[styles.wrow, { backgroundColor: trackColor }]}><Text numberOfLines={1} style={[styles.wlabel, { color: labelColor(section.key) }]}>{copy(section.title)}</Text><Text style={[styles.note, muted, { flex: 1 }]}>{emptyText(section.key)}</Text></View>}
          {open && rest.length > 0 && <View style={{ gap: 3, paddingTop: 3 }}>{rest.map(topic => barRow(section.key, topic, { indent: true }))}</View>}
        </View>;
      }
      const ordered = main ? [...section.topics.filter(topic => topic.tone !== 'concern'), ...section.topics.filter(topic => topic.tone === 'concern')] : section.topics;
      const topics = !main && !open ? ordered.slice(0, FULL_INITIAL_TOPICS) : ordered;
      return <View key={section.key} testID={`review-section-${section.key}`} style={styles.section}>
        <View style={styles.labelRow}>
          {!main && <View style={[styles.dot, { backgroundColor: ACCENT[SECTION_TONE[section.key]] }]} />}
          <Text style={[main ? styles.mainLabel : styles.label, { color: main ? accent : toneColor[SECTION_TONE[section.key]] }]}>{copy(section.title)}</Text>
        </View>
        <View style={{ gap: 5 }}>
          {topics.map(topic => barRow(section.key, topic, onSelect ? { onPress: () => onSelect(section.key, topic), pressed: selectedTopic === topic.label, accessibilityLabel: `${topic.label}, ${topic.count} ${copy('people mentioned this')}. ${copy('See experiences')}` } : {}))}
          {!topics.length && <Text style={[styles.note, muted, { paddingVertical: 6 }]}>{emptyText(section.key)}</Text>}
        </View>
        {!main && section.topics.length > FULL_INITIAL_TOPICS && <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => toggle(section.key)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: accent, fontSize: 12, fontWeight: '700' }}>{copy(open ? 'Show less' : 'Show all')}</Text></Pressable>}
      </View>;
    })}
    {!compact && !!summary.practical?.length && <View style={styles.section}>
      <View style={styles.labelRow}><View style={[styles.dot, { backgroundColor: theme.textSecondary }]} /><Text style={[styles.label, muted]}>{copy('Good to know')}</Text></View>
      <View style={styles.chips}>{summary.practical.map(item => <View key={item.label} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.chipText, muted]}>{item.label} <Text style={{ fontWeight: '800' }}>{item.count}</Text></Text></View>)}</View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  note: { fontSize: 11, lineHeight: 17 },
  evidenceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  evidenceFull: { fontSize: 13, lineHeight: 18, fontWeight: '600', flexShrink: 1 },
  about: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 2 },
  aboutText: { fontSize: 12, fontWeight: '600' },
  info: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontSize: 10, fontWeight: '800', fontStyle: 'italic', lineHeight: 12 },
  section: { paddingTop: 8, paddingBottom: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  label: { fontSize: 11.5, lineHeight: 16, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  mainLabel: { fontSize: 20, lineHeight: 25, fontWeight: '800', letterSpacing: -0.3, marginBottom: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  wrow: { position: 'relative', flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingVertical: 6, paddingHorizontal: 11, borderRadius: 8, overflow: 'hidden' },
  wrowFull: { paddingHorizontal: 12, paddingVertical: 8 },
  wrowIndent: { paddingLeft: 23, minHeight: 36 },
  fill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  wlabel: { fontSize: 11, lineHeight: 14, fontWeight: '600', flexShrink: 0, maxWidth: '38%' },
  word: { flex: 1, fontSize: 14, lineHeight: 18, fontWeight: '600' },
  wordFull: { fontSize: 15, lineHeight: 19 },
  older: { fontSize: 11, fontWeight: '600' },
  count: { fontSize: 15, lineHeight: 19, fontWeight: '600', fontVariant: ['tabular-nums'] },
  mark: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center' },
  markText: { color: '#17013A', fontSize: 9.5, fontWeight: '900', lineHeight: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingVertical: 4 },
  chip: { paddingVertical: 6, paddingHorizontal: 11, borderWidth: 1, borderRadius: 20 },
  chipText: { fontSize: 12.5, fontWeight: '600' },
});
