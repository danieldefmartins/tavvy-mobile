/**
 * Pros Leads Screen - Updated for Project Requests
 * Install path: screens/ProsLeadsScreen.tsx
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors } from '../constants/ProsConfig';
import { ProsLeadCard } from '../components/ProsLeadCard';
import { useProjectRequests, ProjectRequest } from '../hooks/useProjectRequests';
import { useTranslation } from 'react-i18next';

type NavigationProp = NativeStackNavigationProp<any>;

type FilterStatus = 'all' | 'pending' | 'contacted' | 'quoted' | 'won' | 'lost';

export default function ProsLeadsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

  const { requests, loading, fetchProjectRequests } = useProjectRequests();

  useEffect(() => {
    fetchProjectRequests();
  }, [fetchProjectRequests]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProjectRequests();
    setRefreshing(false);
  };

  const filteredRequests = activeFilter === 'all'
    ? requests
    : requests.filter(req => req.status === activeFilter);

  const handleLeadPress = (request: ProjectRequest) => {
    // Navigate to detail screen - passing the whole request object
    navigation.navigate('ProsLeadDetailScreen', { leadId: request.id, lead: request });
  };

  const handleMessagePress = (request: ProjectRequest) => {
    navigation.navigate('ProsMessages', { 
      leadId: request.id,
      customerName: request.customer_name 
    });
  };

  const renderFilterTab = (status: FilterStatus, label: string) => {
    const count = status === 'all' 
      ? requests.length 
      : requests.filter(r => r.status === status).length;

    return (
      <TouchableOpacity
        key={status}
        style={[styles.filterTab, activeFilter === status && styles.filterTabActive]}
        onPress={() => setActiveFilter(status)}
      >
        <Text style={[styles.filterTabText, activeFilter === status && styles.filterTabTextActive]}>
          {label}
        </Text>
        <View style={[styles.filterBadge, activeFilter === status && styles.filterBadgeActive]}>
          <Text style={[styles.filterBadgeText, activeFilter === status && styles.filterBadgeTextActive]}>
            {count}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLead = ({ item }: { item: ProjectRequest }) => {
    // Map ProjectRequest to the format expected by ProsLeadCard
    const mappedLead = {
      id: item.id,
      title: item.description || 'Project Request',
      description: item.description,
      status: item.status as any,
      city: item.city,
      state: item.state,
      zipCode: item.zip_code,
      createdAt: item.created_at,
      phone: item.contact_info_approved ? item.customer_phone : null,
      email: item.contact_info_approved ? item.customer_email : null,
      user: {
        name: item.customer_name,
        avatarUrl: null
      }
    };

    return (
      <ProsLeadCard
        lead={mappedLead as any}
        onPress={() => handleLeadPress(item)}
        onMessagePress={() => handleMessagePress(item)}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leads</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={[
            { status: 'all' as FilterStatus, label: 'All' },
            { status: 'pending' as FilterStatus, label: 'New' },
            { status: 'contacted' as FilterStatus, label: 'Contacted' },
            { status: 'quoted' as FilterStatus, label: 'Quoted' },
            { status: 'won' as FilterStatus, label: 'Won' },
            { status: 'lost' as FilterStatus, label: 'Lost' },
          ]}
          keyExtractor={(item, index) => `${item.status}-${index}`}
          renderItem={({ item }) => renderFilterTab(item.status, item.label)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Leads List */}
      {loading && requests.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ProsColors.primary} />
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={ProsColors.textMuted} />
          <Text style={styles.emptyTitle}>
            {activeFilter === 'all' ? 'No leads yet' : `No ${activeFilter} leads`}
          </Text>
          <Text style={styles.emptyText}>
            {activeFilter === 'all'
              ? 'When customers request quotes, they will appear here.'
              : `You don't have any leads with "${activeFilter}" status.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderLead}
          contentContainerStyle={styles.leadsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ProsColors.textPrimary,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  filterList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: ProsColors.sectionBg,
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: ProsColors.primary,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: ProsColors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    marginLeft: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ProsColors.border,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: ProsColors.textSecondary,
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
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
    fontSize: 20,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  leadsList: {
    padding: 16,
  },
});
