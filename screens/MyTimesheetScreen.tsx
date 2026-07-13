/**
 * MyTimesheetScreen — a crew member's own hours + pay for a pay period.
 * Reads are RLS-scoped to the signed-in employee. Part of the Workforce module.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { ProsColors } from '../constants/ProsConfig';
import { useMyTimesheet, entryHours, MyEntry } from '../hooks/useMyTimesheet';

function hm(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}
function dayLabel(iso: string): string {
  try { return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }); }
  catch { return ''; }
}
function timeRange(e: MyEntry): string {
  const opt: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const inT = new Date(e.clock_in_at).toLocaleTimeString([], opt);
  const outT = e.clock_out_at ? new Date(e.clock_out_at).toLocaleTimeString([], opt) : '—';
  return `${inT} – ${outT}`;
}

export default function MyTimesheetScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { loading, error, employee, periods, periodId, setPeriodId, entries, sheet, totalHours } = useMyTimesheet();
  const [pickerOpen, setPickerOpen] = useState(false);

  const period = periods.find((p) => p.id === periodId);

  const body = () => {
    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={ProsColors.primary} /></View>;
    if (error === 'not_logged_in') return <View style={styles.center}><Text style={styles.muted}>{t('timesheet.loginNeeded')}</Text></View>;
    if (!employee) return (
      <View style={styles.center}>
        <Ionicons name="time-outline" size={44} color={ProsColors.textMuted} />
        <Text style={[styles.muted, { marginTop: 12, textAlign: 'center' }]}>{t('timesheet.notCrew')}</Text>
      </View>
    );

    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Period selector */}
        {periods.length > 0 && (
          <TouchableOpacity style={styles.periodBtn} onPress={() => setPickerOpen((o) => !o)}>
            <Ionicons name="calendar-outline" size={16} color={ProsColors.textSecondary} />
            <Text style={styles.periodText}>
              {period ? `${period.starts_on} → ${period.ends_on}` : t('timesheet.period')}
            </Text>
            <Ionicons name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color={ProsColors.textSecondary} />
          </TouchableOpacity>
        )}
        {pickerOpen && (
          <View style={styles.picker}>
            {periods.map((p) => (
              <TouchableOpacity key={p.id} style={styles.pickerRow} onPress={() => { setPeriodId(p.id); setPickerOpen(false); }}>
                <Text style={[styles.pickerText, p.id === periodId && { color: ProsColors.primary, fontWeight: '700' }]}>
                  {p.starts_on} → {p.ends_on}{p.is_locked ? '  🔒' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Summary card */}
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>{t('timesheet.totalHours')}</Text>
          <Text style={styles.summaryHours}>{hm(totalHours)}</Text>
          {sheet ? (
            <>
              <View style={styles.breakdown}>
                <Breakdown label={t('timesheet.regular')} value={`${sheet.reg_hours}h`} />
                <Breakdown label={t('timesheet.overtime')} value={`${sheet.ot_hours}h`} />
                {employee.pay_type === 'hourly' && <Breakdown label={t('timesheet.gross')} value={`$${Number(sheet.gross_pay).toFixed(2)}`} />}
              </View>
              <View style={[styles.badge, sheet.status === 'approved' || sheet.status === 'exported' ? styles.badgeOk : styles.badgePend]}>
                <Text style={[styles.badgeText, { color: sheet.status === 'approved' || sheet.status === 'exported' ? ProsColors.success : ProsColors.warning }]}>
                  {sheet.status === 'approved' || sheet.status === 'exported' ? t('timesheet.approved') : t('timesheet.pending')}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.notBuilt}>{t('timesheet.notBuilt')}</Text>
          )}
        </View>

        {/* Entry list */}
        <Text style={styles.sectionLabel}>{t('timesheet.shifts')}</Text>
        {entries.length === 0 && <Text style={styles.muted}>{t('timesheet.noEntries')}</Text>}
        {entries.map((e) => (
          <View key={e.id} style={styles.entry}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryDay}>{dayLabel(e.clock_in_at)}</Text>
              <Text style={styles.entryMeta}>
                {timeRange(e)}{e.job?.name ? ` · ${e.job.name}` : ''}
                {e.break_minutes ? ` · ${e.break_minutes}m brk` : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.entryHours}>{e.clock_out_at ? hm(entryHours(e)) : t('timesheet.open')}</Text>
              {e.in_geofence === false && <Text style={styles.offSite}>⚠ {t('timesheet.offSite')}</Text>}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 2 }}>
          <Ionicons name="chevron-back" size={26} color={ProsColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('timesheet.title')}</Text>
        <View style={{ width: 26 }} />
      </View>
      {body()}
    </SafeAreaView>
  );
}

function Breakdown({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bItem}>
      <Text style={styles.bValue}>{value}</Text>
      <Text style={styles.bLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ProsColors.sectionBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: ProsColors.cardBg,
    borderBottomWidth: 1, borderBottomColor: ProsColors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: ProsColors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  muted: { color: ProsColors.textSecondary, fontSize: 15 },
  scroll: { padding: 16, paddingBottom: 40 },
  periodBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: ProsColors.cardBg, borderWidth: 1, borderColor: ProsColors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  periodText: { fontSize: 14, color: ProsColors.textPrimary, fontWeight: '600' },
  picker: { backgroundColor: ProsColors.cardBg, borderWidth: 1, borderColor: ProsColors.border, borderRadius: 10, marginTop: 6 },
  pickerRow: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: ProsColors.borderLight },
  pickerText: { fontSize: 14, color: ProsColors.textPrimary },
  summary: { backgroundColor: ProsColors.cardBg, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: ProsColors.border, marginTop: 14 },
  summaryLabel: { fontSize: 13, color: ProsColors.textSecondary, fontWeight: '600' },
  summaryHours: { fontSize: 40, fontWeight: '800', color: ProsColors.textPrimary, marginTop: 2 },
  breakdown: { flexDirection: 'row', gap: 24, marginTop: 12 },
  bItem: {},
  bValue: { fontSize: 18, fontWeight: '700', color: ProsColors.textPrimary },
  bLabel: { fontSize: 12, color: ProsColors.textMuted, marginTop: 2 },
  badge: { alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeOk: { backgroundColor: 'rgba(34,197,94,0.12)' },
  badgePend: { backgroundColor: 'rgba(245,158,11,0.12)' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  notBuilt: { fontSize: 13, color: ProsColors.textMuted, marginTop: 12, fontStyle: 'italic' },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: ProsColors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginBottom: 10 },
  entry: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: ProsColors.cardBg,
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: ProsColors.border, marginBottom: 8,
  },
  entryDay: { fontSize: 15, fontWeight: '600', color: ProsColors.textPrimary },
  entryMeta: { fontSize: 13, color: ProsColors.textMuted, marginTop: 2 },
  entryHours: { fontSize: 15, fontWeight: '700', color: ProsColors.textPrimary },
  offSite: { fontSize: 11, color: ProsColors.warning, marginTop: 2 },
});
