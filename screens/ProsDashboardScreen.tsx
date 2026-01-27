/**
 * ProsDashboardScreen.tsx
 * Dashboard for service providers to manage their business
 * Path: screens/ProsDashboardScreen.tsx
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import { ProsColors } from '../constants/ProsConfig';
import { useProProfile, useProSubscription, useProStats } from '../hooks/usePros';
import { ProsSubscriptionStatusBanner } from '../components/ProsSubscriptionStatusBanner';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
export default function ProsDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { profile, loading: profileLoading, refresh: refreshProfile } = useProProfile();
  const { subscription, loading: subscriptionLoading, refresh: refreshSubscription } = useProSubscription();
  const { stats, loading: statsLoading, refresh: refreshStats } = useProStats();
  const [refreshing, setRefreshing] = useState(false);
  // Calculate stats
  const rating = profile?.averageRating || 0;
  const newLeadsCount = stats?.newLeads || 0;
  const unreadMessagesCount = stats?.unreadMessages || 0;
  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();
      refreshSubscription();
      refreshStats();
    }, [])
  );
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), refreshSubscription(), refreshStats()]);
    setRefreshing(false);
  };
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={64} color={ProsColors.textMuted} />
          <Text style={styles.emptyTitle}>Sign in Required</Text>
          <Text style={styles.emptySubtitle}>Please sign in to access your Pro dashboard</Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('ProsLogin')}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  if (profileLoading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ProsColors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="construct-outline" size={64} color={ProsColors.textMuted} />
          <Text style={styles.emptyTitle}>Become a Pro</Text>
          <Text style={styles.emptySubtitle}>
            Register as a service provider to access your dashboard
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('ProsRegistration')}
          >
            <Text style={styles.signInButtonText}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ProsColors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pro Dashboard</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color={ProsColors.text} />
          </TouchableOpacity>
        </View>
        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => Alert.alert('Coming Soon', 'Edit Profile will be available in a future update.')}
        >
          <View style={styles.profileHeader}>
            {(profile as any).logoUrl ? (
              <Image source={{ uri: (profile as any).logoUrl }} style={styles.profileLogo} />
            ) : (
              <View style={styles.profileLogoPlaceholder}>
                <Ionicons name="business" size={28} color={ProsColors.textMuted} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileName}>{profile.businessName}</Text>
                {profile.isVerified && (
                  <Ionicons name="checkmark-circle" size={18} color={ProsColors.primary} />
                )}
              </View>
              <View style={styles.profileRating}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {rating > 0 ? rating.toFixed(1) : 'New'} • {profile.totalReviews} reviews
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={ProsColors.textMuted} />
          </View>
        </TouchableOpacity>
        {/* Subscription Status */}
        <ProsSubscriptionStatusBanner
          tier={subscription?.tier || null}
          status={(subscription?.status as any) || null}
          earlyAdopterNumber={(subscription as any)?.earlyAdopterNumber || undefined}
          expiresAt={subscription?.endDate}
          onUpgrade={() => Alert.alert('Coming Soon', 'Subscription upgrades will be available in a future update.')}
        />
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('ProsLeads')}
          >
            <View style={[styles.statIcon, { backgroundColor: `${ProsColors.primary}15` }]}>
              <Ionicons name="document-text" size={24} color={ProsColors.primary} />
            </View>
            <Text style={styles.statValue}>{newLeadsCount}</Text>
            <Text style={styles.statLabel}>New Leads</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('ProsMessages')}
          >
            <View style={[styles.statIcon, { backgroundColor: `${ProsColors.secondary}15` }]}>
              <Ionicons name="chatbubbles" size={24} color={ProsColors.secondary} />
            </View>
            <Text style={styles.statValue}>{unreadMessagesCount}</Text>
            <Text style={styles.statLabel}>Unread Messages</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${ProsColors.success}15` }]}>
              <Ionicons name="star" size={24} color={ProsColors.success} />
            </View>
            <Text style={styles.statValue}>{profile.totalReviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${ProsColors.accent}15` }]}>
              <Ionicons name="eye" size={24} color={ProsColors.accent} />
            </View>
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Profile Views</Text>
          </View>
        </View>
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => Alert.alert('Coming Soon', 'Edit Profile will be available in a future update.')}
            >
              <Ionicons name="person-outline" size={22} color={ProsColors.primary} />
              <Text style={styles.quickActionText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => Alert.alert('Coming Soon', 'Photo management will be available in a future update.')}
            >
              <Ionicons name="images-outline" size={22} color={ProsColors.primary} />
              <Text style={styles.quickActionText}>Manage Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => Alert.alert('Coming Soon', 'Availability settings will be available in a future update.')}
            >
              <Ionicons name="calendar-outline" size={22} color={ProsColors.primary} />
              <Text style={styles.quickActionText}>Set Availability</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => Alert.alert('Coming Soon', 'Service management will be available in a future update.')}
            >
              <Ionicons name="construct-outline" size={22} color={ProsColors.primary} />
              <Text style={styles.quickActionText}>Services</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityEmpty}>No recent activity</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ProsColors.background,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: ProsColors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signInButton: {
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: ProsColors.text,
  },
  profileCard: {
    backgroundColor: ProsColors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  profileLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: ProsColors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.text,
  },
  profileRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: ProsColors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.text,
  },
  statLabel: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.text,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    width: '47%',
    backgroundColor: ProsColors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: ProsColors.text,
  },
  activityCard: {
    backgroundColor: ProsColors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  activityEmpty: {
    fontSize: 14,
    color: ProsColors.textMuted,
  },
});
