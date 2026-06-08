/**
 * ECardAnalyticsDashboardScreen -- Advanced Analytics Dashboard
 * Mobile port of web: pages/app/ecard/analytics-dashboard.tsx
 *
 * Aggregates engagement data across ALL user eCards and shows:
 * - Total views, taps, and link clicks
 * - Engagement over time (bar chart)
 * - Top performing cards
 * - Top performing links
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabaseClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PURPLE = '#8A05BE';
const TEAL = '#00C2CB';
const ACCENT = '#00C853';

interface CardData {
  id: string;
  full_name: string;
  slug: string;
  view_count: number;
  tap_count: number;
  created_at: string;
}

interface LinkData {
  id: string;
  card_id: string;
  platform: string;
  title?: string;
  url: string;
  clicks?: number;
}

// Month labels for the chart
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ECardAnalyticsDashboardScreen() {
  const navigation = useNavigation<any>();
  const { user, loading: authLoading } = useAuth();
  const { isDark } = useThemeContext();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cards, setCards] = useState<CardData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);

  // Theme colors
  const bg = isDark ? '#0a0a0a' : '#FAFAFA';
  const headerBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const cardBg = isDark ? '#1E0A3C' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // Aggregated metrics
  const totalViews = cards.reduce((sum, c) => sum + (c.view_count || 0), 0);
  const totalTaps = cards.reduce((sum, c) => sum + (c.tap_count || 0), 0);
  const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);

  // Engagement data for bar chart — distribute engagement across months based on card creation dates
  const engagementByMonth = React.useMemo(() => {
    const months = new Array(7).fill(0);
    const now = new Date();
    const currentMonth = now.getMonth();

    cards.forEach((card) => {
      const createdAt = new Date(card.created_at);
      const monthDiff = (now.getFullYear() - createdAt.getFullYear()) * 12 + (currentMonth - createdAt.getMonth());
      const engagement = (card.view_count || 0) + (card.tap_count || 0);

      if (monthDiff >= 0 && monthDiff < 7) {
        months[6 - monthDiff] += engagement;
      } else if (monthDiff >= 7) {
        // Older cards — attribute to earliest visible month
        months[0] += Math.round(engagement * 0.1);
      }
    });

    // Add link clicks distributed across recent months
    const totalLinkClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    if (totalLinkClicks > 0 && months.some(m => m > 0)) {
      const totalEngagement = months.reduce((a, b) => a + b, 0);
      if (totalEngagement > 0) {
        months.forEach((val, i) => {
          const ratio = val / totalEngagement;
          months[i] = val + Math.round(totalLinkClicks * ratio);
        });
      }
    }

    // Generate labels for last 7 months
    const labels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), currentMonth - i, 1);
      labels.push(MONTH_LABELS[d.getMonth()]);
    }

    return { data: months, labels };
  }, [cards, links]);

  // Top performing cards (by total engagement)
  const topCards = React.useMemo(() => {
    return [...cards]
      .sort((a, b) => ((b.view_count || 0) + (b.tap_count || 0)) - ((a.view_count || 0) + (a.tap_count || 0)))
      .slice(0, 5);
  }, [cards]);

  // Top performing links (by clicks)
  const topLinks = React.useMemo(() => {
    return [...links]
      .filter(l => (l.clicks || 0) > 0)
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5);
  }, [links]);

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const [cardsResult, linksResult] = await Promise.all([
        supabase
          .from('digital_cards')
          .select('id, full_name, slug, view_count, tap_count, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('digital_card_links')
          .select('id, card_id, platform, title, url, clicks')
          .eq('is_active', true),
      ]);

      if (cardsResult.data) {
        setCards(cardsResult.data);

        // Filter links to only those belonging to user's cards
        const cardIds = new Set(cardsResult.data.map((c: CardData) => c.id));
        if (linksResult.data) {
          setLinks(linksResult.data.filter((l: any) => cardIds.has(l.card_id)));
        }
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
      return;
    }
    fetchData();
  }, [user, authLoading, navigation, fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (user) fetchData();
    }, [user, fetchData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Bar chart max value
  const maxEngagement = Math.max(...engagementByMonth.data, 1);
  const CHART_HEIGHT = 160;
  const BAR_WIDTH = (SCREEN_WIDTH - 80) / 7;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PURPLE} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('ECardHome' as never);
            }
          }}
        >
          <Ionicons name="arrow-back" size={22} color={textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: textPrimary }]}>
          Analytics Dashboard
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PURPLE}
            colors={[PURPLE]}
          />
        }
      >
        {/* Stat Cards Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="eye" size={20} color="#3B82F6" />
            <Text style={[styles.statValue, { color: textPrimary }]}>
              {totalViews.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Views</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="hand-left" size={20} color={TEAL} />
            <Text style={[styles.statValue, { color: textPrimary }]}>
              {totalTaps.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Taps</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: cardBg }]}>
            <Ionicons name="link" size={20} color={PURPLE} />
            <Text style={[styles.statValue, { color: textPrimary }]}>
              {totalClicks.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>Clicks</Text>
          </View>
        </View>

        {/* Engagement Over Time Chart */}
        <View style={[styles.chartSection, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>
            Engagement Over Time
          </Text>
          <Text style={[styles.sectionSubtitle, { color: textSecondary }]}>
            Combined views, taps, and clicks — last 7 months
          </Text>

          {/* Bar Chart */}
          <View style={styles.chartContainer}>
            {/* Y-axis labels */}
            <View style={styles.yAxis}>
              <Text style={[styles.yLabel, { color: textSecondary }]}>
                {maxEngagement.toLocaleString()}
              </Text>
              <Text style={[styles.yLabel, { color: textSecondary }]}>
                {Math.round(maxEngagement / 2).toLocaleString()}
              </Text>
              <Text style={[styles.yLabel, { color: textSecondary }]}>0</Text>
            </View>

            {/* Bars */}
            <View style={styles.barsContainer}>
              {/* Grid lines */}
              <View style={[styles.gridLine, { top: 0, borderColor: border }]} />
              <View style={[styles.gridLine, { top: CHART_HEIGHT / 2, borderColor: border }]} />
              <View style={[styles.gridLine, { top: CHART_HEIGHT, borderColor: border }]} />

              {engagementByMonth.data.map((value, index) => {
                const barHeight = maxEngagement > 0
                  ? Math.max((value / maxEngagement) * CHART_HEIGHT, value > 0 ? 4 : 0)
                  : 0;

                return (
                  <View key={index} style={styles.barColumn}>
                    <View style={[styles.barWrapper, { height: CHART_HEIGHT }]}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: PURPLE,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.xLabel, { color: textSecondary }]}>
                      {engagementByMonth.labels[index]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Top Performing Cards */}
        {topCards.length > 0 && (
          <View style={[styles.listSection, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Top Performing Cards
            </Text>

            {topCards.map((card, index) => {
              const engagement = (card.view_count || 0) + (card.tap_count || 0);
              return (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.listRow, { borderBottomColor: border }]}
                  onPress={() => navigation.navigate('ECardStats', { cardId: card.id })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.rankBadge, { backgroundColor: index === 0 ? PURPLE : (isDark ? '#1A1A2E' : '#F1F5F9') }]}>
                    <Text style={[styles.rankText, { color: index === 0 ? '#FFFFFF' : textSecondary }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.listItemTitle, { color: textPrimary }]} numberOfLines={1}>
                      {card.full_name || 'Untitled Card'}
                    </Text>
                    <Text style={[styles.listItemSub, { color: textSecondary }]}>
                      {(card.view_count || 0).toLocaleString()} views  ·  {(card.tap_count || 0).toLocaleString()} taps
                    </Text>
                  </View>
                  <Text style={[styles.engagementValue, { color: TEAL }]}>
                    {engagement.toLocaleString()}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={textSecondary}
                    style={{ marginLeft: 4 }}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Top Performing Links */}
        {topLinks.length > 0 && (
          <View style={[styles.listSection, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Top Performing Links
            </Text>

            {topLinks.map((link, index) => (
              <View
                key={link.id}
                style={[styles.listRow, { borderBottomColor: border }]}
              >
                <View style={[styles.rankBadge, { backgroundColor: index === 0 ? TEAL : (isDark ? '#1A1A2E' : '#F1F5F9') }]}>
                  <Text style={[styles.rankText, { color: index === 0 ? '#FFFFFF' : textSecondary }]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.listItemTitle, { color: textPrimary }]} numberOfLines={1}>
                    {link.title || link.platform || 'Link'}
                  </Text>
                  <Text style={[styles.listItemSub, { color: textSecondary }]} numberOfLines={1}>
                    {link.url}
                  </Text>
                </View>
                <Text style={[styles.engagementValue, { color: PURPLE }]}>
                  {(link.clicks || 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {cards.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: cardBg, borderColor: border }]}>
            <Ionicons name="analytics-outline" size={40} color={textSecondary} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>
              No analytics data yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
              Create and share eCards to start tracking engagement metrics.
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: PURPLE }]}
              onPress={() => navigation.navigate('ECardNew')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Create eCard</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Chart Section
  chartSection: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
  },
  yAxis: {
    width: 36,
    height: 160,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  yLabel: {
    fontSize: 9,
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  barColumn: {
    alignItems: 'center',
  },
  barWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 6,
    minWidth: 14,
  },
  xLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 8,
  },

  // List Section
  listSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  listItemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  engagementValue: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    maxWidth: 260,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
