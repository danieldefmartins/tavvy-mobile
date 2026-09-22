import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { useThemeContext } from '../contexts/ThemeContext';
import { compactReviewSections, reviewSections, PlaceReviewSummary, ReviewTileKey, ReviewTopic } from '../lib/placeReviewSummary';
export default function PlaceReviewGrid({ summary, mode = 'compact', selectedTopic, onSelect }: {
  summary: PlaceReviewSummary; explain?: boolean; mode?: 'compact' | 'full'; selectedTopic?: string | null;
  onSelect?: (section: ReviewTileKey, topic: ReviewTopic) => void;
}) {
  const { theme, isDark } = useThemeContext(); const copy = useReleaseCopy();
  const [expanded, setExpanded] = useState<string[]>([]);
  const compact = mode === 'compact', count = summary.recentReviewers || 0;
  const muted = { color: theme.textSecondary }, text = { color: theme.text };
  if (summary.status !== 'ready') return <Text accessibilityLiveRegion="polite" style={[styles.note, muted]}>{copy(summary.status === 'loading' ? 'Loading recent reviews…' : summary.status === 'empty' ? 'Be the first to share your experience' : 'Recent reviews unavailable')}</Text>;
  const sections = compact ? compactReviewSections(summary) : reviewSections(summary);
  const topicText = (topic: ReviewTopic) => <Text style={[styles.topic, topic.tone === 'concern' ? { color: isDark ? '#FFD38A' : '#885000' } : text]}>{topic.tone === 'concern' ? '! ' : ''}{topic.label} <Text style={{ fontWeight: '700' }}>{topic.count}</Text>{topic.older ? ` · ${copy('Older report')}${topic.lastReportedAt ? ' · ' + topic.lastReportedAt.slice(0, 10) : ''}` : ''}</Text>;
  return <View accessibilityLabel={copy('Recent reviews')} style={{ gap: compact ? 5 : 0 }}>
    {sections.map(section => {
      const topics = compact || expanded.includes(section.key) ? section.topics : section.topics.slice(0, 6);
      const label = [styles.label, section.key === 'main' ? { color: isDark ? '#D9B6FF' : '#74209A' } : muted];
      if (compact) return <Text key={section.key} testID={`review-section-${section.key}`} style={[styles.topic, text]}><Text style={label}>{copy(section.title)}  </Text>{topics.length ? topics.map((topic, index) => <Text key={topic.slug || topic.label}>{index > 0 ? ' · ' : ''}{topicText(topic)}</Text>) : <Text style={muted}>{copy('More recent reviews needed')}</Text>}</Text>;
      return <View key={section.key} testID={`review-section-${section.key}`} style={[styles.section, { borderBottomColor: theme.border }]}>
        <Text style={[label, section.key === 'main' && styles.main]}>{copy(section.title)}</Text>
        <View style={styles.topics}>{topics.map(topic => onSelect ? <Pressable key={topic.slug || topic.label} accessibilityRole="button" accessibilityState={{ selected: selectedTopic === topic.label }} accessibilityLabel={`${topic.label}, ${topic.count} ${copy('people mentioned this')}. ${copy('See experiences')}`} onPress={() => onSelect(section.key, topic)} style={[styles.chip, { backgroundColor: theme.surface, borderColor: selectedTopic === topic.label ? theme.primary : theme.border }]}>{topicText(topic)}<Text style={muted}> ›</Text></Pressable> : <View key={topic.slug || topic.label} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>{topicText(topic)}</View>)}</View>
        {!topics.length && <Text style={[styles.note, muted]}>{copy(section.key === 'headsup' && count > 0 ? (sections.some(row => row.key === 'main' && row.topics.some(topic => topic.tone === 'concern')) ? 'No other recent concerns reported' : 'No recent concerns reported') : 'More recent reviews needed')}</Text>}
        {section.topics.length > 6 && <Pressable accessibilityRole="button" accessibilityState={{ expanded: expanded.includes(section.key) }} onPress={() => setExpanded(previous => previous.includes(section.key) ? previous.filter(key => key !== section.key) : [...previous, section.key])} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: isDark ? '#D9B6FF' : theme.primary }}>{copy(expanded.includes(section.key) ? 'Show less' : 'Show all')}</Text></Pressable>}
      </View>;
    })}
    <Text style={[styles.note, muted, { marginTop: compact ? 2 : 12 }]}>{copy(count === 1 ? 'Early impressions · 1 reviewer' : count > 1 ? '{{count}} reviewers · Last 6 months' : 'No recent reviews').replace('{{count}}', String(count))}</Text>
    {!compact && <Text style={[styles.note, muted, { marginTop: 5 }]}>{copy('Numbers count people, not repeat taps. A person can mention more than one topic.')} {onSelect ? copy('Choose a topic to see experiences.') : ''}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  topic: { flexShrink: 1, fontSize: 13, lineHeight: 19 }, label: { fontSize: 12, fontWeight: '600' }, note: { fontSize: 11, lineHeight: 17 },
  section: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 }, main: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 11, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', maxWidth: '100%', flexShrink: 1 },
});
