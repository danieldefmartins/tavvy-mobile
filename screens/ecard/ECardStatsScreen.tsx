/**
 * ECardStatsScreen -- Analytics + Inbox with tab toggle.
 * Ported from web: pages/app/ecard/[cardId]/stats.tsx
 *
 * Fetches card data + links in parallel, then renders analytics
 * components (StatsOverview, ProBanner, LinkPerformance) or Inbox.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import StatsOverview from '../../components/ecard/analytics/StatsOverview';
import LinkPerformance from '../../components/ecard/analytics/LinkPerformance';
import ProBanner from '../../components/ecard/analytics/ProBanner';
// TODO: Import GeoAnalyticsDashboard once it exists on mobile
// import GeoAnalyticsDashboard from '../../components/GeoAnalyticsDashboard';
// TODO: Import ECardInbox once it exists on mobile
// import ECardInbox from '../../components/ECardInbox';

const ACCENT = '#00C853';

type StatsTab = 'analytics' | 'inbox';

interface CardData {
  id: string;
  template_id?: string;
  view_count: number;
  tap_count: number;
  [key: string]: any;
}

interface LinkItem {
  id: string;
  card_id?: string;
  platform: string;
  title?: string;
  url: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
  clicks?: number;
}

export default function ECardStatsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ECardStats'>>();
  const { cardId } = route.params;

  const { user, loading: authLoading, isPro } = useAuth();
  const { isDark } = useThemeContext();

  const [loading, setLoading] = useState(true);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [activeTab, setActiveTab] = useState<StatsTab>('analytics');

  // ── Theme colors ────────────────────────────────────────────────────────────

  const bg = isDark ? '#000000' : '#FAFAFA';
  const headerBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const isCivic =
    cardData?.template_id?.startsWith('civic-') ||
    cardData?.template_id === 'politician-generic';

  // ── Auth guard + data fetch ─────────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
      return;
    }

    if (!cardId) return;

    Promise.all([
      supabase
        .from('digital_cards')
        .select('*')
        .eq('id', cardId)
        .single(),
      supabase
        .from('digital_card_links')
        .select('*')
        .eq('card_id', cardId)
        .eq('is_active', true)
        .order('sort_order'),
    ])
      .then(([cardResult, linksResult]) => {
        if (cardResult.data) {
          setCardData(cardResult.data as CardData);
        }
        if (linksResult.data) {
          setLinks(
            linksResult.data.map((l: any) => ({
              id: l.id,
              card_id: l.card_id,
              platform: l.icon || l.platform || 'other',
              title: l.title,
              url: l.url,
              icon: l.icon,
              sort_order: l.sort_order,
              is_active: l.is_active,
              clicks: l.clicks,
            }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cardId, user, authLoading, navigation]);

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: headerBg, borderBottomColor: border },
        ]}
      >
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
          Card Stats
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            navigation.navigate('ECardStudio' as never, { cardId } as never)
          }
        >
          <Ionicons name="create-outline" size={20} color={textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tab Toggle */}
      <View
        style={[
          styles.tabContainer,
          {
            borderColor: border,
            backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF',
          },
        ]}
      >
        {(['analytics', 'inbox'] as StatsTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                {
                  backgroundColor: isActive ? ACCENT : 'transparent',
                },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab === 'analytics' ? 'bar-chart' : 'mail'}
                size={16}
                color={isActive ? '#FFFFFF' : textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? '#FFFFFF' : textSecondary },
                ]}
              >
                {tab === 'analytics' ? 'Analytics' : 'Inbox'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'analytics' && (
          <>
            <StatsOverview
              viewCount={cardData?.view_count || 0}
              tapCount={cardData?.tap_count || 0}
              isDark={isDark}
            />

            {!isPro && <ProBanner isDark={isDark} />}

            {/* Link Performance */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                Link Performance
              </Text>
              <LinkPerformance links={links} isDark={isDark} />
            </View>

            {/* Geo Analytics for civic cards */}
            {isCivic && cardId && (
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>
                  Geo Intelligence
                </Text>
                {/* TODO: Render GeoAnalyticsDashboard once it exists on mobile */}
                <View
                  style={[
                    styles.placeholder,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: border,
                    },
                  ]}
                >
                  <Ionicons
                    name="map-outline"
                    size={28}
                    color={textSecondary}
                  />
                  <Text style={[styles.placeholderText, { color: textSecondary }]}>
                    Geo analytics coming soon
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {activeTab === 'inbox' && (
          <>
            {/* TODO: Render ECardInbox once it exists on mobile */}
            <View
              style={[
                styles.placeholder,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: border,
                },
              ]}
            >
              <Ionicons name="mail-outline" size={32} color={textSecondary} />
              <Text style={[styles.placeholderText, { color: textSecondary }]}>
                Inbox coming soon
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

  // Tab toggle
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionBlock: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Placeholder for components not yet built on mobile
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  placeholderText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
