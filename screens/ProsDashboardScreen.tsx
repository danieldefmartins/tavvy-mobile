/**
 * Pros Dashboard Screen (UPDATED to match mockup)
 * Install path: screens/ProsDashboardScreen.tsx
 * 
 * The main dashboard for service providers to manage their business.
 * DESIGN MATCHES: pro_dashboard.png mockup
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors, EARLY_ADOPTER_PRICE } from '../constants/ProsConfig';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<any>;

// Sample data
const SAMPLE_PRO = {
  name: 'Mike',
  businessName: 'Ace Electric Services',
  isVerified: true,
  newLeads: 12,
  activeProjects: 8,
  rating: 4.9,
  unreadMessages: 3,
  subscriptionStatus: 'active',
  subscriptionType: 'Early Adopter',
  subscriptionPrice: EARLY_ADOPTER_PRICE,
  renewalDate: 'Dec 2024',
};

const SAMPLE_LEADS = [
  {
    id: '1',
    customerName: 'Sarah T.',
    projectTitle: 'Kitchen Lighting Install',
    location: 'Downtown, Seattle, WA',
    timeAgo: '3 hours ago',
    budgetMin: 1500,
    budgetMax: 2500,
    status: 'new',
  },
  {
    id: '2',
    customerName: 'James K.',
    projectTitle: 'Panel Upgrade',
    location: 'Bellevue, WA',
    timeAgo: 'Yesterday',
    budgetMin: 3000,
    budgetMax: 5000,
    status: 'contacted',
  },
];

export default function ProsDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const pro = SAMPLE_PRO;
  const leads = SAMPLE_LEADS;

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleSettings = () => {
    // Navigate to settings
  };

  const handleViewLeads = () => {
    navigation.navigate('ProsLeadsScreen');
  };

  const handleMessages = () => {
    navigation.navigate('ProsMessagesScreen');
  };

  const handleMyProfile = () => {
    navigation.navigate('ProsProfileScreen', { proId: 'my-profile' });
  };

  const handleAnalytics = () => {
    // Navigate to analytics
  };

  const handleLeadDetails = (leadId: string) => {
    navigation.navigate('ProsBidScreen', { leadId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return { bg: '#3B82F6', text: '#FFFFFF' };
      case 'contacted':
        return { bg: '#F59E0B', text: '#FFFFFF' };
      case 'hired':
        return { bg: ProsColors.primary, text: '#FFFFFF' };
      default:
        return { bg: '#6B7280', text: '#FFFFFF' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'contacted':
        return 'Contacted';
      case 'hired':
        return 'Hired';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pro Dashboard</Text>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={ProsColors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Welcome Banner - matches mockup */}
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Welcome back, {pro.name}!</Text>
            <View style={styles.businessNameRow}>
              <Text style={styles.businessName}>{pro.businessName}</Text>
              {pro.isVerified && (
                <Ionicons name="checkmark-circle" size={18} color={ProsColors.primary} />
              )}
            </View>
          </View>
          {/* Toolbox illustration placeholder */}
          <View style={styles.illustrationContainer}>
            <Ionicons name="construct" size={48} color={ProsColors.primary} />
          </View>
        </View>

        {/* Stats Row - matches mockup */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="mail" size={20} color="#3B82F6" />
            <Text style={styles.statValue}>{pro.newLeads}</Text>
            <Text style={styles.statLabel}>New Leads</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={20} color={ProsColors.primary} />
            <Text style={styles.statValue}>{pro.activeProjects}</Text>
            <Text style={styles.statLabel}>Active Projects</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.statValue}>{pro.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Quick Actions - matches mockup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleViewLeads}>
              <Ionicons name="mail-outline" size={22} color={ProsColors.primary} />
              <Text style={styles.quickActionText}>View Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleMessages}>
              <Ionicons name="chatbubble-outline" size={22} color={ProsColors.primary} />
              <Text style={styles.quickActionText}>Messages</Text>
              {pro.unreadMessages > 0 && (
                <View style={styles.messageBadge}>
                  <Text style={styles.messageBadgeText}>{pro.unreadMessages}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleMyProfile}>
              <Ionicons name="person-outline" size={22} color={ProsColors.primary} />
              <Text style={styles.quickActionText}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleAnalytics}>
              <Ionicons name="trending-up-outline" size={22} color={ProsColors.primary} />
              <Text style={styles.quickActionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Leads - matches mockup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Leads</Text>
          <View style={styles.leadsContainer}>
            {leads.map((lead) => {
              const statusColors = getStatusColor(lead.status);
              return (
                <View key={lead.id} style={styles.leadCard}>
                  <View style={styles.leadHeader}>
                    <Text style={styles.leadTitle}>
                      {lead.customerName} - {lead.projectTitle}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                        {getStatusLabel(lead.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.leadLocation}>{lead.location}</Text>
                  <Text style={styles.leadTime}>{lead.timeAgo}</Text>
                  <View style={styles.leadFooter}>
                    <Text style={styles.leadBudget}>
                      Budget: ${lead.budgetMin.toLocaleString()} - ${lead.budgetMax.toLocaleString()}
                    </Text>
                    <TouchableOpacity onPress={() => handleLeadDetails(lead.id)}>
                      <Text style={styles.viewDetailsLink}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Subscription Status - matches mockup */}
        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionTitle}>Subscription Status</Text>
          <View style={styles.subscriptionContent}>
            <View>
              <View style={styles.subscriptionTypeBadge}>
                <Text style={styles.subscriptionTypeBadgeText}>{pro.subscriptionType}</Text>
              </View>
              <Text style={styles.subscriptionPrice}>${pro.subscriptionPrice}/year</Text>
              <Text style={styles.subscriptionRenewal}>Renews {pro.renewalDate}</Text>
            </View>
            <View style={styles.subscriptionStatusBadge}>
              <Ionicons name="checkmark-circle" size={20} color={ProsColors.primary} />
              <Text style={styles.subscriptionStatusText}>Active</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Welcome Banner - matches mockup
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5F0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  businessNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  businessName: {
    fontSize: 15,
    color: ProsColors.textSecondary,
  },
  illustrationContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats Row - matches mockup
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 12,
  },

  // Quick Actions - matches mockup
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionButton: {
    width: (width - 42) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    borderColor: ProsColors.primary,
    gap: 10,
    position: 'relative',
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  messageBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  messageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Leads - matches mockup
  leadsContainer: {
    gap: 12,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ProsColors.primary,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  leadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leadLocation: {
    fontSize: 14,
    color: ProsColors.textPrimary,
    marginBottom: 2,
  },
  leadTime: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginBottom: 8,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadBudget: {
    fontSize: 14,
    color: ProsColors.textSecondary,
  },
  viewDetailsLink: {
    fontSize: 14,
    fontWeight: '600',
    color: ProsColors.primary,
    textDecorationLine: 'underline',
  },

  // Subscription - matches mockup
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ProsColors.primary,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ProsColors.textPrimary,
    marginBottom: 12,
  },
  subscriptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionTypeBadge: {
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  subscriptionTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  subscriptionPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  subscriptionRenewal: {
    fontSize: 13,
    color: ProsColors.textSecondary,
    marginTop: 2,
  },
  subscriptionStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subscriptionStatusText: {
    fontSize: 15,
    fontWeight: '600',
    color: ProsColors.primary,
  },
});
