/**
 * TimeClockScreen — crew self clock-in/out with GPS + geofence feedback.
 * Install path: screens/TimeClockScreen.tsx
 *
 * Part of the Workforce module. Owner-side management lives on the web portal;
 * this is the crew-facing surface (Spanish-friendly via i18n).
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { ProsColors } from '../constants/ProsConfig';
import { useTimeClock } from '../hooks/useTimeClock';

function elapsed(fromISO: string): { h: number; m: number } {
  const ms = Date.now() - new Date(fromISO).getTime();
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  return { h: Math.floor(totalMin / 60), m: totalMin % 60 };
}

function formatTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
  catch { return ''; }
}

export default function TimeClockScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { loading, submitting, employee, openEntry, jobs, pendingSync, error, clockIn, clockOut } = useTimeClock();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  // Re-render every 30s so the elapsed timer stays live while clocked in.
  useEffect(() => {
    if (!openEntry) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [openEntry]);

  // Default the job picker to the first active job.
  useEffect(() => {
    if (!selectedJob && jobs.length > 0) setSelectedJob(jobs[0].id);
  }, [jobs, selectedJob]);

  const clockedIn = !!openEntry;
  const el = useMemo(() => (openEntry ? elapsed(openEntry.clock_in_at) : null), [openEntry]);

  const onClockIn = async () => {
    const res = await clockIn(selectedJob);
    if (!res.ok) { Alert.alert(t('timeclock.clockIn'), res.error || t('errors.generic', 'Something went wrong')); return; }
    if (res.queued) return; // banner shows pending state
    if (res.in_geofence === false) {
      Alert.alert(t('timeclock.offSite'), t('timeclock.offSiteWarn'));
    }
  };

  const onClockOut = async () => {
    const res = await clockOut();
    if (!res.ok) Alert.alert(t('timeclock.clockOut'), res.error || t('errors.generic', 'Something went wrong'));
  };

  const renderBody = () => {
    if (loading) {
      return <View style={styles.center}><ActivityIndicator size="large" color={ProsColors.primary} /></View>;
    }
    if (error === 'not_logged_in') {
      return <View style={styles.center}><Text style={styles.muted}>{t('timeclock.loginNeeded')}</Text></View>;
    }
    if (!employee) {
      return (
        <View style={styles.center}>
          <Ionicons name="person-outline" size={44} color={ProsColors.textMuted} />
          <Text style={[styles.muted, { marginTop: 12, textAlign: 'center' }]}>{t('timeclock.notCrew')}</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>{t('timeclock.hi', { name: employee.full_name })}</Text>

        {/* Status card */}
        <View style={[styles.statusCard, clockedIn ? styles.statusOn : styles.statusOff]}>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: clockedIn ? ProsColors.success : ProsColors.textMuted }]} />
            <Text style={styles.statusTitle}>
              {clockedIn ? t('timeclock.onTheClock') : t('timeclock.clockedOut')}
            </Text>
          </View>
          {clockedIn && el && (
            <>
              <Text style={styles.elapsed}>{el.h}h {el.m}m</Text>
              <Text style={styles.statusMeta}>
                {t('timeclock.since', { time: formatTime(openEntry!.clock_in_at) })}
                {openEntry?.job?.name ? ` · ${openEntry.job.name}` : ''}
              </Text>
              {openEntry?.in_geofence != null && (
                <View style={[styles.badge, openEntry.in_geofence ? styles.badgeOk : styles.badgeWarn]}>
                  <Ionicons
                    name={openEntry.in_geofence ? 'location' : 'warning'}
                    size={13}
                    color={openEntry.in_geofence ? ProsColors.success : ProsColors.warning}
                  />
                  <Text style={[styles.badgeText, { color: openEntry.in_geofence ? ProsColors.success : ProsColors.warning }]}>
                    {openEntry.in_geofence ? t('timeclock.onSite') : t('timeclock.offSite')}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {pendingSync && (
          <View style={styles.syncBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={ProsColors.warning} />
            <Text style={styles.syncText}>{t('timeclock.pendingSync')}</Text>
          </View>
        )}

        {/* Job picker (only when clocked out) */}
        {!clockedIn && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('timeclock.selectJob')}</Text>
            {jobs.length === 0 ? (
              <Text style={styles.muted}>{t('timeclock.noJobs')}</Text>
            ) : (
              jobs.map((j) => {
                const active = selectedJob === j.id;
                return (
                  <TouchableOpacity
                    key={j.id}
                    style={[styles.jobRow, active && styles.jobRowActive]}
                    onPress={() => setSelectedJob(j.id)}
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={active ? ProsColors.primary : ProsColors.textMuted}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.jobName}>{j.name}</Text>
                      {!!j.address && <Text style={styles.jobAddr}>{j.address}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Action button */}
        <TouchableOpacity
          style={[styles.actionBtn, clockedIn ? styles.actionOut : styles.actionIn, submitting && { opacity: 0.7 }]}
          onPress={clockedIn ? onClockOut : onClockIn}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.actionText}>{t('timeclock.gettingLocation')}</Text>
            </>
          ) : (
            <>
              <Ionicons name={clockedIn ? 'stop-circle' : 'play-circle'} size={24} color="#fff" />
              <Text style={styles.actionText}>{clockedIn ? t('timeclock.clockOut') : t('timeclock.clockIn')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('timeclock.title')}</Text>
        <View style={{ width: 26 }} />
      </View>
      {renderBody()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ProsColors.sectionBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: ProsColors.cardBg,
    borderBottomWidth: 1, borderBottomColor: ProsColors.border,
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: ProsColors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  muted: { color: ProsColors.textSecondary, fontSize: 15 },
  scroll: { padding: 16, paddingBottom: 40 },
  greeting: { fontSize: 22, fontWeight: '800', color: ProsColors.textPrimary, marginBottom: 16 },
  statusCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  statusOn: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusOff: { backgroundColor: ProsColors.cardBg, borderColor: ProsColors.border },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: ProsColors.textPrimary },
  elapsed: { fontSize: 40, fontWeight: '800', color: ProsColors.textPrimary, marginTop: 8 },
  statusMeta: { fontSize: 14, color: ProsColors.textSecondary, marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
    marginTop: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  badgeOk: { backgroundColor: 'rgba(34,197,94,0.12)' },
  badgeWarn: { backgroundColor: 'rgba(245,158,11,0.12)' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  syncBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12,
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 12,
  },
  syncText: { color: ProsColors.warning, fontSize: 13, fontWeight: '600', flex: 1 },
  section: { marginTop: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: ProsColors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  jobRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: ProsColors.cardBg,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: ProsColors.border, marginBottom: 8,
  },
  jobRowActive: { borderColor: ProsColors.primary, backgroundColor: ProsColors.heroBg },
  jobName: { fontSize: 15, fontWeight: '600', color: ProsColors.textPrimary },
  jobAddr: { fontSize: 13, color: ProsColors.textMuted, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 18, marginTop: 28,
  },
  actionIn: { backgroundColor: ProsColors.primary },
  actionOut: { backgroundColor: ProsColors.error },
  actionText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
