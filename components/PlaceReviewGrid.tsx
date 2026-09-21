import { useReleaseCopy } from '../hooks/useReleaseCopy';
import { reviewSummaryCopy, reviewMentionCopy } from '../lib/reviewSummaryCopy';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';
import type { PlaceReviewSummary, ReviewTileKey } from '../lib/placeReviewSummary';

const COLORS: Record<ReviewTileKey, [string, string, string]> = {
  main: ['#2455A6', '#ADC8FF', 'rgba(69,121,214,.12)'],
  good: ['#067A80', '#58D9DE', 'rgba(0,194,203,.12)'],
  vibe: ['#74209A', '#D9B6FF', 'rgba(138,5,190,.10)'],
  headsup: ['#885000', '#FFD38A', 'rgba(245,166,35,.12)'],
};
export default function PlaceReviewGrid({ summary }: { summary: PlaceReviewSummary }) {
  const { isDark, theme } = useThemeContext();
  const copy = useReleaseCopy();
  return <View style={styles.grid} accessibilityLabel={copy("Recent reviews")}>
    {summary.tiles.map(tile => <View key={tile.key} testID={`review-tile-${tile.key}`} style={[styles.tile, { backgroundColor: COLORS[tile.key][2], borderColor: theme.border }]}>
      <Text style={[styles.title, { color: COLORS[tile.key][isDark ? 1 : 0] }]}>{reviewSummaryCopy(tile.title, copy)}</Text>
      <Text style={[styles.detail, { color: theme.text }]}>{reviewSummaryCopy(tile.detail, copy)}</Text>
      {tile.count != null && tile.count > 0 && <Text style={[styles.note, { color: theme.textSecondary }]}>{reviewMentionCopy(tile.count, copy)}</Text>}
      {!!tile.note && <Text style={[styles.note, { color: theme.textSecondary }]}>{reviewSummaryCopy(tile.note, copy)}</Text>}
    </View>)}
  </View>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48%', flexGrow: 1, minWidth: 0, gap: 5, padding: 10, borderWidth: 1, borderRadius: 12 },
  title: { fontSize: 11, lineHeight: 15, fontWeight: '700' },
  detail: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  note: { fontSize: 11, lineHeight: 15 },
});
