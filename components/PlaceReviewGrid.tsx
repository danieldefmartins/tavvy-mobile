import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { useThemeContext } from '../contexts/ThemeContext';
import { reviewSections, searchReviewSections, PlaceReviewSummary, ReviewTileKey, ReviewTopic } from '../lib/placeReviewSummary';

type Tone = ReviewTopic['tone'];
const SECTION_TONE: Record<ReviewTileKey, Tone> = { main: 'neutral', good: 'positive', vibe: 'neutral', headsup: 'concern' };
const ACCENT: Record<Tone, string> = { positive: '#00C2CB', neutral: '#8A05BE', concern: '#F5A623' };
// Bars need enough people to mean something; below this a tiny sample would look like a full bar.
const BAR_MIN_PEOPLE = 5;
const FULL_INITIAL_TOPICS = 3;

/**
 * Shared presentation (mirrors web): every displayed topic is word + people count + a thin
 * frequency bar on one scale per place. Bar length is frequency, never quality or severity;
 * concerns keep their "!" marker so a rarely mentioned serious concern stays visible.
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
  const sections = compact ? searchReviewSections(summary) : reviewSections(summary);
  const toneColor: Record<Tone, string> = { positive: isDark ? '#58D9DE' : '#067A80', neutral: isDark ? '#D9B6FF' : '#74209A', concern: isDark ? '#FFD38A' : '#885000' };
  const showBars = count >= BAR_MIN_PEOPLE;
  const trackColor = isDark ? 'rgba(255,255,255,.09)' : 'rgba(23,1,58,.08)';
  const evidenceLine = copy(count === 1 ? 'Early impressions · 1 reviewer' : count > 1 ? '{{count}} people · Last 6 months' : 'No recent reviews').replace('{{count}}', String(count));
  const hasMainConcern = sections.some(row => row.key === 'main' && row.topics.some(topic => topic.tone === 'concern'));
  const emptyText = (key: ReviewTileKey) => copy(key === 'headsup' && count > 0 ? (hasMainConcern ? 'No other recent concerns reported' : 'No recent concerns reported') : 'More recent reviews needed');
  const interactive = !compact && !!onSelect;

  const mark = <View style={[styles.mark, compact && styles.markCompact]}><Text style={[styles.markText, compact && styles.markTextCompact]}>!</Text></View>;
  const bar = (topic: ReviewTopic, tone: Tone) => showBars
    ? <View style={[styles.track, compact && styles.trackCompact, { backgroundColor: trackColor }]}><View style={{ width: `${Math.max(2, Math.round((topic.count / Math.max(count, 1)) * 100))}%`, height: '100%', borderRadius: 3, backgroundColor: ACCENT[tone] }} /></View>
    : null;

  const topicRow = (section: ReviewTileKey, topic: ReviewTopic, first: boolean, title: string) => {
    const tone: Tone = topic.tone === 'concern' ? 'concern' : SECTION_TONE[section] === 'neutral' && section !== 'main' ? 'neutral' : 'positive';
    const wordColor = topic.tone === 'concern' ? toneColor.concern : theme.text;
    const olderDate = topic.lastReportedAt ? topic.lastReportedAt.slice(0, 10) : '';
    const older = topic.older ? ` · ${compact ? copy('Older') : copy('Older report')}${!compact && olderDate ? ` · ${olderDate}` : ''}` : '';
    const selected = selectedTopic === topic.label;
    // Search cards: quiet label · word · short bar beside the count, one row per topic.
    if (compact) return <View key={topic.slug || topic.label} style={styles.cRow}>
      <Text numberOfLines={1} style={[styles.cLabel, muted]}>{first ? copy(title) : ''}</Text>
      <View style={styles.cWord}>{topic.tone === 'concern' && mark}<Text numberOfLines={2} style={[styles.cWordText, { color: wordColor }]}>{topic.label}<Text style={styles.older}>{older}</Text></Text></View>
      <View style={styles.cSide}>{bar(topic, tone)}<Text style={[styles.cCount, { color: toneColor[tone] }]}>{topic.count}</Text></View>
    </View>;
    const inner = <>
      <View style={styles.top}>
        <View style={styles.wordRow}>{topic.tone === 'concern' && mark}<Text style={[styles.word, { color: wordColor }]}>{topic.label}<Text style={styles.older}>{older}</Text></Text></View>
        <Text style={[styles.count, { color: toneColor[tone] }]}>{topic.count}</Text>
      </View>
      {bar(topic, tone)}
    </>;
    return interactive
      ? <Pressable key={topic.slug || topic.label} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${topic.label}, ${topic.count} ${copy('people mentioned this')}. ${copy('See experiences')}`} onPress={() => onSelect!(section, topic)} style={[styles.fRow, selected && { backgroundColor: isDark ? 'rgba(255,255,255,.06)' : 'rgba(23,1,58,.04)' }]}>{inner}</Pressable>
      : <View key={topic.slug || topic.label} style={styles.fRow}>{inner}</View>;
  };

  return <View accessibilityLabel={copy('Recent reviews')}>
    {compact && <Text style={[styles.note, muted, { marginBottom: 5, fontSize: 11.5 }]}><Text style={{ color: theme.text, fontWeight: '800' }}>{copy('Reviews')}</Text> · {evidenceLine}</Text>}
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
      const ordered = main && !compact ? [...section.topics.filter(topic => topic.tone !== 'concern'), ...section.topics.filter(topic => topic.tone === 'concern')] : section.topics;
      const topics = !compact && !main && !open ? ordered.slice(0, FULL_INITIAL_TOPICS) : ordered;
      if (compact) return <View key={section.key} testID={`review-section-${section.key}`} style={{ gap: 3 }}>
        {topics.map((topic, index) => topicRow(section.key, topic, index === 0, section.title))}
        {!topics.length && <View style={styles.cRow}><Text numberOfLines={1} style={[styles.cLabel, muted]}>{copy(section.title)}</Text><Text style={[styles.note, muted, { flex: 1 }]}>{emptyText(section.key)}</Text></View>}
      </View>;
      return <View key={section.key} testID={`review-section-${section.key}`} style={main
        ? [styles.mainPanel, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(138,5,190,.16)' : 'rgba(138,5,190,.06)' }]
        : [styles.section, { borderTopColor: theme.border }]}>
        <View style={styles.labelRow}>
          {!main && <View style={[styles.dot, { backgroundColor: ACCENT[SECTION_TONE[section.key]] }]} />}
          <Text style={[main ? styles.mainLabel : styles.label, { color: toneColor[SECTION_TONE[section.key]] }]}>{copy(section.title)}</Text>
        </View>
        {topics.map((topic, index) => topicRow(section.key, topic, index === 0, section.title))}
        {!topics.length && <Text style={[styles.note, muted, { paddingVertical: 6 }]}>{emptyText(section.key)}</Text>}
        {!main && section.topics.length > FULL_INITIAL_TOPICS && <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setExpanded(previous => open ? previous.filter(key => key !== section.key) : [...previous, section.key])} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: toneColor.neutral, fontSize: 12, fontWeight: '700' }}>{copy(open ? 'Show less' : 'Show all')}</Text></Pressable>}
      </View>;
    })}
    {!compact && !!summary.practical?.length && <View style={[styles.section, { borderTopColor: theme.border }]}>
      <View style={styles.labelRow}><View style={[styles.dot, { backgroundColor: theme.textSecondary }]} /><Text style={[styles.label, muted]}>{copy('Good to know')}</Text></View>
      <View style={styles.chips}>{summary.practical.map(item => <View key={item.label} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.chipText, muted]}>{item.label} <Text style={{ fontWeight: '800' }}>{item.count}</Text></Text></View>)}</View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  note: { fontSize: 11, lineHeight: 17 },
  evidenceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  evidenceFull: { fontSize: 13, lineHeight: 18, fontWeight: '600', flexShrink: 1 },
  about: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 2 },
  aboutText: { fontSize: 12, fontWeight: '600' },
  info: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontSize: 10, fontWeight: '800', fontStyle: 'italic', lineHeight: 12 },
  mainPanel: { padding: 14, paddingBottom: 10, borderRadius: 16, borderWidth: 1, marginBottom: 6 },
  section: { paddingTop: 10, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  label: { fontSize: 11.5, lineHeight: 16, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  mainLabel: { fontSize: 21, lineHeight: 26, fontWeight: '800', letterSpacing: -0.3, marginBottom: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  fRow: { minHeight: 44, paddingVertical: 6, borderRadius: 8, gap: 5 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  wordRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, flexWrap: 'wrap' },
  word: { fontSize: 15, lineHeight: 20, fontWeight: '700', flexShrink: 1 },
  older: { fontSize: 11, fontWeight: '600' },
  count: { fontSize: 15, lineHeight: 20, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  trackCompact: { height: 5, width: 36 },
  mark: { width: 15, height: 15, borderRadius: 8, backgroundColor: '#F5A623', alignItems: 'center', justifyContent: 'center', marginRight: 5 },
  markCompact: { width: 13, height: 13, marginRight: 4 },
  markText: { color: '#17013A', fontSize: 10.5, fontWeight: '900', lineHeight: 13 },
  markTextCompact: { fontSize: 9, lineHeight: 11 },
  cRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 20 },
  cLabel: { width: '21%', fontSize: 11, lineHeight: 16, fontWeight: '600' },
  cWord: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  cWordText: { fontSize: 13, lineHeight: 17, fontWeight: '700', flexShrink: 1 },
  cSide: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cCount: { fontSize: 13, lineHeight: 18, fontWeight: '800', minWidth: 16, textAlign: 'right', fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingVertical: 4 },
  chip: { paddingVertical: 6, paddingHorizontal: 11, borderWidth: 1, borderRadius: 20 },
  chipText: { fontSize: 12.5, fontWeight: '600' },
});
