import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';
import {
  Signal,
  ReviewCategory,
  CATEGORY_COLORS,
  SIGNAL_LABELS,
  preloadSignalCache,
} from '../lib/signalService';
import { spacing, borderRadius, typography, shadows } from '../constants/Colors';
import { withScreenErrorBoundary } from '../components/ScreenErrorBoundary';

const { width } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface PlaceResult {
  place_id: string;
  name: string;
  address: string;
  city: string | null;
  total_taps: number;
  matching_signals: {
    signal_id: string;
    label: string;
    icon_emoji: string;
    signal_type: ReviewCategory;
    tap_count: number;
  }[];
}

// ============================================
// COMPONENT
// ============================================

function SignalSearchScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();

  // State
  const [allSignals, setAllSignals] = useState<Signal[]>([]);
  const [selectedSignalIds, setSelectedSignalIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoadingSignals, setIsLoadingSignals] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ============================================
  // LOAD SIGNALS
  // ============================================

  useEffect(() => {
    loadAllSignals();
  }, []);

  const loadAllSignals = async () => {
    setIsLoadingSignals(true);
    try {
      await preloadSignalCache();

      const { data, error } = await supabase
        .from('review_items')
        .select('id, slug, label, icon_emoji, signal_type, color')
        .eq('is_active', true)
        .in('signal_type', ['best_for', 'vibe', 'heads_up'])
        .order('label');

      if (error) {
        console.error('Error loading signals:', error);
        return;
      }

      const signals: Signal[] = (data || []).map((item: any) => ({
        id: item.id,
        slug: item.slug,
        label: item.label,
        icon_emoji: item.icon_emoji,
        signal_type: item.signal_type as ReviewCategory,
        color: item.color,
      }));

      setAllSignals(signals);
    } catch (err) {
      console.error('Error loading signals:', err);
    } finally {
      setIsLoadingSignals(false);
    }
  };

  // ============================================
  // GROUP SIGNALS BY CATEGORY
  // ============================================

  const signalsByCategory = useMemo(() => {
    const grouped: Record<ReviewCategory, Signal[]> = {
      best_for: [],
      vibe: [],
      heads_up: [],
    };

    allSignals.forEach((signal) => {
      if (grouped[signal.signal_type]) {
        grouped[signal.signal_type].push(signal);
      }
    });

    return grouped;
  }, [allSignals]);

  // ============================================
  // TOGGLE SIGNAL SELECTION
  // ============================================

  const toggleSignal = useCallback((signalId: string) => {
    setSelectedSignalIds((prev) => {
      const next = new Set(prev);
      if (next.has(signalId)) {
        next.delete(signalId);
      } else {
        next.add(signalId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSignalIds(new Set());
    setResults([]);
    setHasSearched(false);
  }, []);

  // ============================================
  // SEARCH PLACES BY SIGNALS
  // ============================================

  useEffect(() => {
    if (selectedSignalIds.size > 0) {
      searchPlaces();
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [selectedSignalIds]);

  const searchPlaces = async () => {
    if (selectedSignalIds.size === 0) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const signalIds = Array.from(selectedSignalIds);

      // Step 1: Get all taps for the selected signals
      const { data: taps, error: tapsError } = await supabase
        .from('place_review_signal_taps')
        .select('place_id, signal_id, intensity')
        .in('signal_id', signalIds);

      if (tapsError) {
        console.error('Error searching signal taps:', tapsError);
        setResults([]);
        return;
      }

      if (!taps || taps.length === 0) {
        setResults([]);
        return;
      }

      // Step 2: Aggregate by place_id, only keep places that have ALL selected signals
      const placeSignalMap: Record<string, Record<string, number>> = {};

      taps.forEach((tap: any) => {
        if (!placeSignalMap[tap.place_id]) {
          placeSignalMap[tap.place_id] = {};
        }
        if (!placeSignalMap[tap.place_id][tap.signal_id]) {
          placeSignalMap[tap.place_id][tap.signal_id] = 0;
        }
        placeSignalMap[tap.place_id][tap.signal_id] += tap.intensity;
      });

      // Filter: place must have ALL selected signals (AND search)
      const qualifyingPlaceIds: string[] = [];
      const placeTapTotals: Record<string, number> = {};
      const placeSignalDetails: Record<string, { signal_id: string; tap_count: number }[]> = {};

      for (const [placeId, signalMap] of Object.entries(placeSignalMap)) {
        const hasAll = signalIds.every((sid) => signalMap[sid] && signalMap[sid] > 0);
        if (hasAll) {
          qualifyingPlaceIds.push(placeId);
          let total = 0;
          const details: { signal_id: string; tap_count: number }[] = [];
          for (const [sid, count] of Object.entries(signalMap)) {
            if (signalIds.includes(sid)) {
              total += count;
              details.push({ signal_id: sid, tap_count: count });
            }
          }
          placeTapTotals[placeId] = total;
          placeSignalDetails[placeId] = details;
        }
      }

      if (qualifyingPlaceIds.length === 0) {
        setResults([]);
        return;
      }

      // Step 3: Fetch place details
      const { data: places, error: placesError } = await supabase
        .from('places')
        .select('id, name, address, city')
        .in('id', qualifyingPlaceIds.slice(0, 50));

      if (placesError) {
        console.error('Error fetching places:', placesError);
        setResults([]);
        return;
      }

      // Step 4: Build result objects with signal metadata
      const signalLookup = new Map<string, Signal>();
      allSignals.forEach((s) => signalLookup.set(s.id, s));

      const resultList: PlaceResult[] = (places || []).map((place: any) => {
        const matchingSignals = (placeSignalDetails[place.id] || []).map((detail) => {
          const signal = signalLookup.get(detail.signal_id);
          return {
            signal_id: detail.signal_id,
            label: signal?.label || 'Unknown',
            icon_emoji: signal?.icon_emoji || '',
            signal_type: (signal?.signal_type || 'best_for') as ReviewCategory,
            tap_count: detail.tap_count,
          };
        });

        return {
          place_id: place.id,
          name: place.name || 'Unknown Place',
          address: place.address || '',
          city: place.city || null,
          total_taps: placeTapTotals[place.id] || 0,
          matching_signals: matchingSignals,
        };
      });

      // Sort by combined signal strength (total taps) descending
      resultList.sort((a, b) => b.total_taps - a.total_taps);

      setResults(resultList);
    } catch (err) {
      console.error('Error in signal search:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // ============================================
  // HELPERS
  // ============================================

  const getCategoryPillType = (category: ReviewCategory): 'good' | 'vibe' | 'headsup' => {
    switch (category) {
      case 'best_for': return 'good';
      case 'vibe': return 'vibe';
      case 'heads_up': return 'headsup';
      default: return 'good';
    }
  };

  const getSignalBgColor = (category: ReviewCategory, selected: boolean) => {
    if (selected) {
      return CATEGORY_COLORS[category].bg;
    }
    if (isDark) {
      switch (category) {
        case 'best_for': return theme.signalGoodBg;
        case 'vibe': return theme.signalVibeBg;
        case 'heads_up': return theme.signalHeadsUpBg;
      }
    }
    switch (category) {
      case 'best_for': return 'rgba(0, 194, 203, 0.10)';
      case 'vibe': return 'rgba(138, 5, 190, 0.08)';
      case 'heads_up': return 'rgba(245, 166, 35, 0.10)';
    }
  };

  const getSignalBorderColor = (category: ReviewCategory, selected: boolean) => {
    if (selected) {
      return CATEGORY_COLORS[category].bg;
    }
    if (isDark) {
      switch (category) {
        case 'best_for': return theme.signalGoodBorder;
        case 'vibe': return theme.signalVibeBorder;
        case 'heads_up': return theme.signalHeadsUpBorder;
      }
    }
    switch (category) {
      case 'best_for': return 'rgba(0, 194, 203, 0.25)';
      case 'vibe': return 'rgba(138, 5, 190, 0.18)';
      case 'heads_up': return 'rgba(245, 166, 35, 0.22)';
    }
  };

  const getSignalTextColor = (category: ReviewCategory, selected: boolean) => {
    if (selected) {
      return '#FFFFFF';
    }
    if (isDark) {
      switch (category) {
        case 'best_for': return theme.signalGoodText;
        case 'vibe': return theme.signalVibeText;
        case 'heads_up': return theme.signalHeadsUpText;
      }
    }
    return theme.text;
  };

  const getResultSignalPillBg = (category: ReviewCategory) => {
    if (isDark) {
      switch (category) {
        case 'best_for': return theme.signalGoodBg;
        case 'vibe': return theme.signalVibeBg;
        case 'heads_up': return theme.signalHeadsUpBg;
      }
    }
    switch (category) {
      case 'best_for': return 'rgba(0, 194, 203, 0.10)';
      case 'vibe': return 'rgba(138, 5, 190, 0.08)';
      case 'heads_up': return 'rgba(245, 166, 35, 0.10)';
    }
  };

  const getResultSignalPillText = (category: ReviewCategory) => {
    if (isDark) {
      switch (category) {
        case 'best_for': return theme.signalGoodText;
        case 'vibe': return theme.signalVibeText;
        case 'heads_up': return theme.signalHeadsUpText;
      }
    }
    switch (category) {
      case 'best_for': return '#00C2CB';
      case 'vibe': return '#8A05BE';
      case 'heads_up': return '#F5A623';
    }
  };

  // ============================================
  // RENDER: SIGNAL CHIP
  // ============================================

  const renderSignalChip = (signal: Signal) => {
    const selected = selectedSignalIds.has(signal.id);
    const bg = getSignalBgColor(signal.signal_type, selected);
    const border = getSignalBorderColor(signal.signal_type, selected);
    const textColor = getSignalTextColor(signal.signal_type, selected);

    return (
      <TouchableOpacity
        key={signal.id}
        style={[
          styles.signalChip,
          {
            backgroundColor: bg,
            borderColor: border,
          },
        ]}
        onPress={() => toggleSignal(signal.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.signalChipEmoji}>{signal.icon_emoji}</Text>
        <Text style={[styles.signalChipLabel, { color: textColor }]}>
          {signal.label}
        </Text>
        {selected && (
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
        )}
      </TouchableOpacity>
    );
  };

  // ============================================
  // RENDER: CATEGORY SECTION
  // ============================================

  const renderCategorySection = (category: ReviewCategory) => {
    const signals = signalsByCategory[category];
    if (!signals || signals.length === 0) return null;

    const label = SIGNAL_LABELS[category];
    const color = CATEGORY_COLORS[category].bg;

    return (
      <View style={styles.categorySection} key={category}>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryDot, { backgroundColor: color }]} />
          <Text style={[styles.categoryLabel, { color: theme.text }]}>
            {label}
          </Text>
          <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>
            {signals.length}
          </Text>
        </View>
        <View style={styles.chipsContainer}>
          {signals.map(renderSignalChip)}
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER: PLACE RESULT CARD
  // ============================================

  const renderPlaceCard = ({ item }: { item: PlaceResult }) => {
    const addressParts = [item.address, item.city].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    return (
      <TouchableOpacity
        style={[
          styles.placeCard,
          {
            backgroundColor: isDark ? theme.surface : '#FFFFFF',
            borderColor: isDark ? theme.border : 'rgba(0,0,0,0.06)',
          },
        ]}
        onPress={() => {
          navigation.navigate('PlaceDetails', { placeId: item.place_id });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.placeCardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.placeName, { color: theme.text }]} numberOfLines={1}>
              {item.name}
            </Text>
            {fullAddress ? (
              <Text style={[styles.placeAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                {fullAddress}
              </Text>
            ) : null}
          </View>
          <View style={styles.tapBadge}>
            <Ionicons name="pulse-outline" size={14} color={theme.signalGood} />
            <Text style={[styles.tapBadgeText, { color: theme.signalGood }]}>
              {item.total_taps}
            </Text>
          </View>
        </View>

        <View style={styles.matchingSignalsRow}>
          {item.matching_signals.map((ms) => (
            <View
              key={ms.signal_id}
              style={[
                styles.matchingSignalPill,
                {
                  backgroundColor: getResultSignalPillBg(ms.signal_type),
                },
              ]}
            >
              <Text style={styles.matchingSignalEmoji}>{ms.icon_emoji}</Text>
              <Text
                style={[
                  styles.matchingSignalLabel,
                  { color: getResultSignalPillText(ms.signal_type) },
                ]}
              >
                {ms.label}
              </Text>
              <Text
                style={[
                  styles.matchingSignalCount,
                  { color: getResultSignalPillText(ms.signal_type) },
                ]}
              >
                x{ms.tap_count}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  // ============================================
  // RENDER: EMPTY STATE
  // ============================================

  const renderEmptyState = () => {
    if (isSearching) return null;
    if (!hasSearched) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="search-outline"
          size={48}
          color={theme.textTertiary}
        />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No places found
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          No places match all selected signals yet. Try selecting fewer signals or different combinations.
        </Text>
      </View>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  const selectedCount = selectedSignalIds.size;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Signal Search
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Find places by what people love
          </Text>
        </View>
        {selectedCount > 0 ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSelection}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.clearButtonText, { color: theme.signalHeadsUp }]}>
              Clear
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* Selected Count Bar */}
      {selectedCount > 0 && (
        <View style={[styles.selectedBar, { backgroundColor: isDark ? theme.surfaceElevated : '#F0F0F5' }]}>
          <Ionicons name="filter" size={16} color={theme.primary} />
          <Text style={[styles.selectedBarText, { color: theme.text }]}>
            {selectedCount} signal{selectedCount !== 1 ? 's' : ''} selected
          </Text>
          {isSearching && (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 8 }} />
          )}
        </View>
      )}

      {isLoadingSignals ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading signals...
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id}
          renderItem={renderPlaceCard}
          ListHeaderComponent={
            <View style={styles.signalsSection}>
              {renderCategorySection('best_for')}
              {renderCategorySection('vibe')}
              {renderCategorySection('heads_up')}
            </View>
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerTitle: {
    ...typography.title3,
  },
  headerSubtitle: {
    ...typography.caption1,
    marginTop: 2,
  },
  headerRight: {
    width: 50,
  },
  clearButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  clearButtonText: {
    ...typography.subhead,
    fontWeight: '600',
  },

  // Selected Bar
  selectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  selectedBarText: {
    ...typography.footnote,
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.subhead,
  },

  // List
  listContent: {
    paddingBottom: 40,
  },

  // Signals Section
  signalsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  // Category Section
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryLabel: {
    ...typography.headline,
  },
  categoryCount: {
    ...typography.caption1,
  },

  // Chips Container
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  // Signal Chip
  signalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
  },
  signalChipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  signalChipLabel: {
    ...typography.signalPillSm,
  },

  // Place Card
  placeCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.small,
  },
  placeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  placeName: {
    ...typography.headline,
    marginBottom: 4,
  },
  placeAddress: {
    ...typography.footnote,
  },
  tapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
    backgroundColor: 'rgba(0, 194, 203, 0.1)',
  },
  tapBadgeText: {
    ...typography.caption1,
    fontWeight: '700',
  },

  // Matching Signals Row
  matchingSignalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  matchingSignalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    gap: 4,
  },
  matchingSignalEmoji: {
    fontSize: 12,
  },
  matchingSignalLabel: {
    ...typography.caption2,
    fontWeight: '600',
  },
  matchingSignalCount: {
    ...typography.caption2,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.headline,
  },
  emptySubtitle: {
    ...typography.subhead,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default withScreenErrorBoundary(SignalSearchScreen, 'SignalSearchScreen');
