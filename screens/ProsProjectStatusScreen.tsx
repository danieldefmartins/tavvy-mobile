/**
 * Customer-facing Project Status screen (Pros tab)
 *
 * Shows:
 * - project summary
 * - how many pros have been invited
 * - list of invited pros (business names)
 *
 * DB tables expected:
 * - pros_projects
 * - pros_project_invites (project_id, place_id, status, created_at)
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ProsColors } from '../constants/ProsConfig';
import { supabase } from '../lib/supabaseClient';

type RouteParams = {
  ProsProjectStatus: {
    projectId: string;
  };
};

type NavigationProp = NativeStackNavigationProp<any>;

type InviteRow = {
  id: string;
  status: string;
  created_at: string;
  places?: {
    id: string;
    name: string;
    city?: string | null;
    state_region?: string | null;
  } | null;
};

export default function ProsProjectStatusScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp<RouteParams, 'ProsProjectStatus'>>();
  const projectId = route.params?.projectId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [invites, setInvites] = useState<InviteRow[]>([]);

  const fetchAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const { data: projectData, error: projectError } = await supabase
        .from('pros_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      const { data: invitesData, error: invitesError } = await supabase
        .from('pros_project_invites')
        .select(
          `id,status,created_at,
           places:places(id,name,city,state_region)`
        )
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (invitesError) throw invitesError;

      setProject(projectData);
      setInvites((invitesData ?? []) as any);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const invitedCount = invites.length;
  const invitedLabel = useMemo(() => {
    if (!invitedCount) return 'Inviting pros...';
    return `Invited ${invitedCount} ${invitedCount === 1 ? 'pro' : 'pros'}`;
  }, [invitedCount]);

  const renderInvite = ({ item }: { item: InviteRow }) => {
    const name = item.places?.name ?? 'Pro';
    const loc = [item.places?.city, item.places?.state_region].filter(Boolean).join(', ');

    return (
      <View style={styles.inviteRow}>
        <View style={styles.inviteLeft}>
          <View style={styles.inviteIcon}>
            <Ionicons name="business" size={18} color={ProsColors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inviteName} numberOfLines={1}>{name}</Text>
            {!!loc && <Text style={styles.inviteLoc} numberOfLines={1}>{loc}</Text>}
          </View>
        </View>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>{item.status}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Project</Text>
        <TouchableOpacity onPress={fetchAll} style={styles.backButton}>
          <Ionicons name="refresh" size={22} color={ProsColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ProsColors.primary} />
          <Text style={styles.centerText}>Loading your project...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={40} color={ProsColors.error} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={fetchAll}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle} numberOfLines={2}>
              {project?.title ?? 'Project'}
            </Text>
            {!!project?.description && (
              <Text style={styles.summaryDescription} numberOfLines={3}>
                {project.description}
              </Text>
            )}
            <View style={styles.summaryMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={ProsColors.textSecondary} />
                <Text style={styles.metaText}>{project?.urgency ?? '—'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={16} color={ProsColors.textSecondary} />
                <Text style={styles.metaText}>{project?.max_pros ?? 10} recommended</Text>
              </View>
            </View>
            <Text style={styles.invitedLabel}>{invitedLabel}</Text>
          </View>

          <FlatList
            data={invites}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderInvite}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.centerSmall}>
                <ActivityIndicator color={ProsColors.primary} />
                <Text style={styles.centerText}>Inviting pros in your area...</Text>
              </View>
            }
          />
        </>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: ProsColors.sectionBg,
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: ProsColors.textPrimary,
  },
  summaryDescription: {
    marginTop: 8,
    fontSize: 14,
    color: ProsColors.textSecondary,
    lineHeight: 20,
  },
  summaryMeta: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: ProsColors.textSecondary,
    fontWeight: '600',
  },
  invitedLabel: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    color: ProsColors.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ProsColors.borderLight,
  },
  inviteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  inviteIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ProsColors.sectionBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
  },
  inviteName: {
    fontSize: 14,
    fontWeight: '700',
    color: ProsColors.textPrimary,
  },
  inviteLoc: {
    marginTop: 2,
    fontSize: 12,
    color: ProsColors.textMuted,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: ProsColors.primaryLight,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: ProsColors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centerSmall: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  centerText: {
    marginTop: 10,
    fontSize: 13,
    color: ProsColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: ProsColors.textPrimary,
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: ProsColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
