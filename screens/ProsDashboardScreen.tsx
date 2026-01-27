/**
 * Pros Dashboard Screen
 * Install path: screens/ProsDashboardScreen.tsx
 * 
 * Dashboard for service providers to manage their profile, leads, and messages.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors } from '../constants/ProsConfig';
import { ProsSubscriptionStatusBanner } from '../components/ProsSubscriptionBanner';
import { ProsLeadCardCompact } from '../components/ProsLeadCard';
import { useProDashboard, useProsLeads, useProsSubscription, useProsConversations } from '../hooks/usePros';

type NavigationProp = NativeStackNavigationProp<any>;

export default function ProsDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const { profile, loading: profileLoading, fetchProfile } = useProDashboard();
  const { leads, loading: leadsLoading, fetchLeads } = useProsLeads();
  const { subscription, fetchSubscription } = useProsSubscription();
  const { conversations, fetchConversations } = useProsConversations();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchProfile(),
      fetchLeads(),
      fetchSubscription(),
      fetchConversations(),
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const newLeadsCount = leads.filter(l => (l.status as string) === 'new' || (l.status as string) === 'pending').length;
  const unreadMessagesCount = conversations.reduce((sum, c) => sum + ((c as any).conversation?.providerUnread || 0), 0);

  if (profileLoading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ProsColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color={ProsColors.textMuted} />
          <Text style={styles.emptyTitle}>Become a Pro</Text>
          <Text style={styles.emptyText}>
            Register your business to start receiving leads and connecting with customers.
          </Text>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('ProsRegistration')}
          >
            <Text style={styles.registerButtonText}>Register Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const rating = parseFloat(profile.averageRating as any) || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={ProsColors.textPrimary} />
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

        {/* Recent Leads */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Leads</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProsLeads')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {leads.length > 0 ? (
            leads.slice(0, 3).map((lead) => (
              <ProsLeadCardCompact
                key={lead.id}
                lead={lead as any}
                onPress={() => navigation.navigate('ProsLeadDetail', { leadId: lead.id })}
              />
            ))
          ) : (
            <View style={styles.emptyLeads}>
              <Ionicons name="document-text-outline" size={32} color={ProsColors.textMuted} />
              <Text style={styles.emptyLeadsText}>No leads yet</Text>
            </View>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pro Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={24} color={ProsColors.secondary} />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Complete Your Profile</Text>
              <Text style={styles.tipText}>
                Profiles with photos and detailed descriptions get 3x more leads.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginTop: 24,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  registerButton: {
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginHorizontal: 16,
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileLogo: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: ProsColors.border,
  },
  profileLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: ProsColors.border,
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
    color: ProsColors.textPrimary,
  },
  profileRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginTop: 16,
  },
  statCard: {
    width: '50%',
    padding: 4,
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
    color: ProsColors.textPrimary,
  },
  statLabel: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${ProsColors.primary}08`,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${ProsColors.primary}20`,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: ProsColors.primary,
    marginLeft: 6,
  },
  emptyLeads: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: ProsColors.sectionBg,
    borderRadius: 10,
  },
  emptyLeadsText: {
    fontSize: 14,
    color: ProsColors.textMuted,
    marginTop: 8,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: `${ProsColors.secondary}10`,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: `${ProsColors.secondary}20`,
  },
  tipContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    lineHeight: 18,
  },
});
