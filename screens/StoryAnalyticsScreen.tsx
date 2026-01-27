// =============================================
// STORY ANALYTICS SCREEN
// =============================================
// Displays analytics and performance metrics for stories

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
  getStoryAnalytics,
  getPlaceAnalytics,
  StoryAnalytics,
  PlaceAnalytics,
} from '../lib/analyticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RouteParams {
  placeId?: string;
  placeName?: string;
  storyId?: string;
}

type ViewMode = 'place' | 'story';
type TimeRange = '7d' | '30d' | '90d' | 'all';

export default function StoryAnalyticsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { placeId, placeName, storyId } = (route.params as RouteParams) || {};

  const [viewMode, setViewMode] = useState<ViewMode>(storyId ? 'story' : 'place');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [placeAnalytics, setPlaceAnalytics] = useState<PlaceAnalytics | null>(null);
  const [storyAnalytics, setStoryAnalytics] = useState<StoryAnalytics | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [placeId, storyId, viewMode])
  );

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      if (viewMode === 'story' && storyId) {
        const data = await getStoryAnalytics(storyId);
        setStoryAnalytics(data);
      } else if (placeId) {
        const data = await getPlaceAnalytics(placeId);
        setPlaceAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    setIsRefreshing(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(1)}%`;
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderMetricCard = (
    icon: string,
    label: string,
    value: string,
    subvalue?: string,
    trend?: number,
    color: string = '#3B82F6'
  ) => (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {subvalue && <Text style={styles.metricSubvalue}>{subvalue}</Text>}
      {trend !== undefined && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={trend >= 0 ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend >= 0 ? '#10B981' : '#EF4444'}
          />
          <Text style={[styles.trendText, { color: trend >= 0 ? '#10B981' : '#EF4444' }]}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );

  const renderViewsChart = () => {
    const data = viewMode === 'place' 
      ? placeAnalytics?.viewsTrend || []
      : Object.entries(storyAnalytics?.viewsByDay || {}).map(([date, views]) => ({ date, views }));

    if (data.length === 0) return null;

    const maxViews = Math.max(...data.map(d => d.views), 1);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Views Over Time</Text>
        <View style={styles.chart}>
          {data.slice(-7).map((item, index) => (
            <View key={index} style={styles.chartBar}>
              <View
                style={[
                  styles.chartBarFill,
                  { height: `${(item.views / maxViews) * 100}%` },
                ]}
              />
              <Text style={styles.chartBarLabel}>
                {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={styles.chartBarValue}>{item.views}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHourlyChart = () => {
    if (viewMode !== 'story' || !storyAnalytics?.viewsByHour) return null;

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const maxViews = Math.max(...Object.values(storyAnalytics.viewsByHour), 1);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Views by Hour</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.hourlyChart}>
            {hours.map(hour => (
              <View key={hour} style={styles.hourlyBar}>
                <View
                  style={[
                    styles.hourlyBarFill,
                    { height: `${((storyAnalytics.viewsByHour[hour] || 0) / maxViews) * 100}%` },
                  ]}
                />
                <Text style={styles.hourlyLabel}>{hour}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderTopStories = () => {
    if (viewMode !== 'place' || !placeAnalytics?.topPerformingStories) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Performing Stories</Text>
        {placeAnalytics.topPerformingStories.map((story, index) => (
          <View key={story.id} style={styles.topStoryItem}>
            <View style={styles.topStoryRank}>
              <Text style={styles.topStoryRankText}>{index + 1}</Text>
            </View>
            <View style={styles.topStoryInfo}>
              <Text style={styles.topStoryId} numberOfLines={1}>
                Story #{story.id.slice(0, 8)}
              </Text>
              <Text style={styles.topStoryViews}>{formatNumber(story.views)} views</Text>
            </View>
            <TouchableOpacity
              style={styles.viewStoryButton}
              onPress={() => {
                // Navigate to story viewer
              }}
            >
              <Ionicons name="eye-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#1F2937" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Analytics</Text>
          {placeName && <Text style={styles.headerSubtitle}>{placeName}</Text>}
        </View>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      {storyId && placeId && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'place' && styles.toggleButtonActive]}
            onPress={() => setViewMode('place')}
          >
            <Text style={[styles.toggleText, viewMode === 'place' && styles.toggleTextActive]}>
              Place Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'story' && styles.toggleButtonActive]}
            onPress={() => setViewMode('story')}
          >
            <Text style={[styles.toggleText, viewMode === 'story' && styles.toggleTextActive]}>
              Story Details
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Place Analytics */}
        {viewMode === 'place' && placeAnalytics && (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              {renderMetricCard(
                'eye',
                'Total Views',
                formatNumber(placeAnalytics.totalStoryViews),
                undefined,
                undefined,
                '#3B82F6'
              )}
              {renderMetricCard(
                'images',
                'Total Stories',
                placeAnalytics.totalStories.toString(),
                `${placeAnalytics.activeStories} active`,
                undefined,
                '#8B5CF6'
              )}
              {renderMetricCard(
                'people',
                'Followers',
                formatNumber(placeAnalytics.followerCount),
                undefined,
                placeAnalytics.followerGrowth,
                '#10B981'
              )}
              {renderMetricCard(
                'flame',
                'Happening Score',
                placeAnalytics.happeningScore.toString(),
                undefined,
                undefined,
                '#F59E0B'
              )}
            </View>

            {/* Avg Views Per Story */}
            <View style={styles.highlightCard}>
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.highlightGradient}
              >
                <Ionicons name="analytics" size={32} color="#fff" />
                <View style={styles.highlightContent}>
                  <Text style={styles.highlightValue}>
                    {formatNumber(Math.round(placeAnalytics.avgViewsPerStory))}
                  </Text>
                  <Text style={styles.highlightLabel}>Average Views Per Story</Text>
                </View>
              </LinearGradient>
            </View>

            {renderViewsChart()}
            {renderTopStories()}
          </>
        )}

        {/* Story Analytics */}
        {viewMode === 'story' && storyAnalytics && (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              {renderMetricCard(
                'eye',
                'Total Views',
                formatNumber(storyAnalytics.totalViews),
                undefined,
                undefined,
                '#3B82F6'
              )}
              {renderMetricCard(
                'person',
                'Unique Viewers',
                formatNumber(storyAnalytics.uniqueViews),
                undefined,
                undefined,
                '#8B5CF6'
              )}
              {renderMetricCard(
                'checkmark-circle',
                'Completion Rate',
                formatPercentage(storyAnalytics.completionRate),
                undefined,
                undefined,
                '#10B981'
              )}
              {renderMetricCard(
                'time',
                'Avg Watch Time',
                formatDuration(storyAnalytics.avgWatchTime),
                undefined,
                undefined,
                '#F59E0B'
              )}
            </View>

            {/* Engagement Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Engagement</Text>
              <View style={styles.engagementGrid}>
                <View style={styles.engagementItem}>
                  <Ionicons name="share-outline" size={24} color="#3B82F6" />
                  <Text style={styles.engagementValue}>{storyAnalytics.shareCount}</Text>
                  <Text style={styles.engagementLabel}>Shares</Text>
                </View>
                <View style={styles.engagementItem}>
                  <Ionicons name="person-circle-outline" size={24} color="#8B5CF6" />
                  <Text style={styles.engagementValue}>{storyAnalytics.profileVisits}</Text>
                  <Text style={styles.engagementLabel}>Profile Visits</Text>
                </View>
                <View style={styles.engagementItem}>
                  <Ionicons name="play-forward" size={24} color="#F59E0B" />
                  <Text style={styles.engagementValue}>{storyAnalytics.tapForwardCount}</Text>
                  <Text style={styles.engagementLabel}>Tap Forward</Text>
                </View>
                <View style={styles.engagementItem}>
                  <Ionicons name="play-back" size={24} color="#EF4444" />
                  <Text style={styles.engagementValue}>{storyAnalytics.tapBackCount}</Text>
                  <Text style={styles.engagementLabel}>Tap Back</Text>
                </View>
              </View>
            </View>

            {renderViewsChart()}
            {renderHourlyChart()}
          </>
        )}

        {/* No Data State */}
        {!placeAnalytics && !storyAnalytics && (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Analytics Data</Text>
            <Text style={styles.emptyText}>
              Analytics will appear here once your stories start getting views.
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#3B82F6',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  metricSubvalue: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Highlight Card
  highlightCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  highlightGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  highlightContent: {
    flex: 1,
  },
  highlightValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  highlightLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Chart
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
  },
  chartBarValue: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Hourly Chart
  hourlyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    paddingRight: 16,
  },
  hourlyBar: {
    width: 20,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  hourlyBarFill: {
    width: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
    minHeight: 2,
  },
  hourlyLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },

  // Engagement Grid
  engagementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  engagementItem: {
    width: (SCREEN_WIDTH - 76) / 2,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  engagementValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  engagementLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },

  // Top Stories
  topStoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topStoryRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topStoryRankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  topStoryInfo: {
    flex: 1,
  },
  topStoryId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  topStoryViews: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  viewStoryButton: {
    padding: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },

  bottomPadding: {
    height: 32,
  },
});
