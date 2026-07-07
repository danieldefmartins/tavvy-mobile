/**
 * SignalMatrix — 2x2 Grid Reviews Component (React Native)
 *
 * Replaces the old 3-section pill layout (The Good / The Vibe / Heads Up).
 * Shows top signal per category in a compact grid. Each box expands
 * to show all signals in that category.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SignalAggregate {
  signal_id: string;
  tap_total: number;
  review_count: number;
  label?: string;
  icon?: string;
  category?: string;
}

interface SignalGroup {
  best_for: SignalAggregate[];
  vibe: SignalAggregate[];
  heads_up: SignalAggregate[];
}

export interface SimpleSignal {
  bucket: string;
  tap_total: number;
}

interface SignalMatrixProps {
  signals?: SignalGroup;
  /** Simple flat signals (e.g. from tap_activity aggregates) — auto-categorized. Matches web's SignalMatrix. */
  simpleSignals?: SimpleSignal[];
  compact?: boolean;
  onReview?: () => void;
}

const CATEGORIES = [
  { key: 'best_for', label: 'The Good', color: '#00C2CB', bg: 'rgba(0,194,203,0.1)', border: 'rgba(0,194,203,0.2)', textColor: '#0A8A8F' },
  { key: 'best_for_2', label: 'The Good', color: '#00C2CB', bg: 'rgba(0,194,203,0.1)', border: 'rgba(0,194,203,0.2)', textColor: '#0A8A8F' },
  { key: 'vibe', label: 'The Vibe', color: '#8A05BE', bg: 'rgba(138,5,190,0.08)', border: 'rgba(138,5,190,0.2)', textColor: '#6B04A0' },
  { key: 'heads_up', label: 'Heads Up', color: '#F5A623', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)', textColor: '#9A6600' },
];

// Known heads_up / vibe signal labels for categorization (mirrors web SignalMatrix)
const VIBE_KEYWORDS = ['vibe', 'cozy', 'romantic', 'lively', 'casual', 'upscale', 'old school', 'trendy', 'family', 'quiet', 'loud', 'intimate', 'modern', 'classic', 'chill', 'energetic'];
const HEADS_UP_KEYWORDS = ['cash only', 'no reservation', 'wait', 'noisy', 'crowded', 'slow', 'expensive', 'limited', 'parking', 'small', 'closed'];

function categorizeSimpleSignal(label: string): 'best_for' | 'vibe' | 'heads_up' {
  const lower = label.toLowerCase();
  if (HEADS_UP_KEYWORDS.some(kw => lower.includes(kw))) return 'heads_up';
  if (VIBE_KEYWORDS.some(kw => lower.includes(kw))) return 'vibe';
  return 'best_for';
}

function simpleToGrouped(simpleSignals: SimpleSignal[]): SignalGroup {
  const grouped: SignalGroup = { best_for: [], vibe: [], heads_up: [] };
  for (const s of simpleSignals) {
    const cat = categorizeSimpleSignal(s.bucket);
    grouped[cat].push({
      signal_id: s.bucket,
      tap_total: s.tap_total,
      review_count: s.tap_total,
      label: s.bucket,
      icon: '',
      category: cat,
    });
  }
  return grouped;
}

export default function SignalMatrix({ signals, simpleSignals, compact = false, onReview }: SignalMatrixProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  // Convert simple signals to grouped if needed
  const grouped = signals || (simpleSignals ? simpleToGrouped(simpleSignals) : { best_for: [], vibe: [], heads_up: [] });

  const hasSignals = grouped.best_for?.length > 0 || grouped.vibe?.length > 0 || grouped.heads_up?.length > 0;

  const good1 = grouped.best_for?.[0] || null;
  const good2 = grouped.best_for?.[1] || null;
  const vibe1 = grouped.vibe?.[0] || null;
  const headsUp1 = grouped.heads_up?.[0] || null;

  const boxes = [
    { signal: good1, cat: CATEGORIES[0], expandKey: 'best_for', allSignals: grouped.best_for || [] },
    { signal: good2, cat: CATEGORIES[1], expandKey: 'best_for_2', allSignals: (grouped.best_for || []).slice(1) },
    { signal: vibe1, cat: CATEGORIES[2], expandKey: 'vibe', allSignals: grouped.vibe || [] },
    { signal: headsUp1, cat: CATEGORIES[3], expandKey: 'heads_up', allSignals: grouped.heads_up || [] },
  ];

  if (!hasSignals) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>No reviews yet</Text>
        <Text style={styles.emptyText}>Be the first to review this place</Text>
        {onReview && (
          <TouchableOpacity onPress={onReview} style={styles.reviewBtn}>
            <Text style={styles.reviewBtnText}>Leave a Review</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const toggleExpand = (key: string) => {
    if (compact) return;
    setExpanded(expanded === key ? null : key);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Reviews</Text>
      <View style={styles.grid}>
        {boxes.map(({ signal, cat, expandKey, allSignals }, i) => {
          const isExpanded = expanded === expandKey;
          const hasMore = allSignals.length > 1;

          if (!signal) {
            return (
              <View key={i} style={[
                styles.box,
                compact && styles.boxCompact,
                { backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.06)' },
                isExpanded && styles.boxExpanded,
              ]}>
                <Text style={[styles.boxEmptyText, compact && { fontSize: 10 }]}>
                  No {cat.label === 'The Good' ? 'good' : cat.label === 'The Vibe' ? 'vibe' : 'heads up'} signals yet
                </Text>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={i}
              activeOpacity={hasMore && !compact ? 0.7 : 1}
              onPress={() => hasMore && toggleExpand(expandKey)}
              style={[
                styles.box,
                compact && styles.boxCompact,
                { backgroundColor: cat.bg, borderColor: cat.border },
                isExpanded && styles.boxExpanded,
              ]}
            >
              <View style={styles.boxContent}>
                <Text style={{ fontSize: compact ? 18 : 24 }}>{signal.icon}</Text>
                <View style={styles.boxInfo}>
                  <Text
                    style={[styles.boxLabel, { color: cat.textColor, fontSize: compact ? 11 : 14 }]}
                    numberOfLines={1}
                  >
                    {signal.label}
                  </Text>
                  <Text style={[styles.boxCount, { color: cat.textColor, fontSize: compact ? 10 : 12 }]}>
                    x{signal.review_count}
                  </Text>
                </View>
                {!compact && hasMore && (
                  <Text style={[styles.chevron, { color: cat.color, transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }]}>
                    ▼
                  </Text>
                )}
              </View>

              {isExpanded && (
                <View style={styles.expandedList}>
                  {allSignals.slice(1).map(s => (
                    <View key={s.signal_id} style={styles.expandedPill}>
                      <Text>{s.icon}</Text>
                      <Text style={[styles.expandedLabel, { color: cat.textColor }]}>{s.label}</Text>
                      <Text style={[styles.expandedCount, { color: cat.textColor }]}>x{s.review_count}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  box: {
    width: '48%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  boxCompact: {
    padding: 8,
    borderRadius: 10,
  },
  boxExpanded: {
    width: '100%',
  },
  boxContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  boxInfo: {
    flex: 1,
  },
  boxLabel: {
    fontWeight: '600',
    lineHeight: 17,
  },
  boxCount: {
    fontWeight: '500',
    opacity: 0.6,
    marginTop: 2,
  },
  boxEmptyText: {
    color: 'rgba(0,0,0,0.25)',
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 10,
    marginLeft: 'auto',
  },
  expandedList: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  expandedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  expandedLabel: {
    fontWeight: '500',
    fontSize: 13,
  },
  expandedCount: {
    opacity: 0.5,
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  reviewBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#8A05BE',
    borderRadius: 10,
  },
  reviewBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
