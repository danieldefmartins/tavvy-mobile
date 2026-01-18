import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
import { useTranslation } from 'react-i18next';

type RouteParams = { projectId: string; categoryName: string; timeline: string; budget: string; proCount: number };
type ProResponse = { id: string; name: string; company: string; rating: number; reviews: number; estimate: string; responseTime: string; status: 'pending' | 'responded' | 'hired' };

export default function ProsProjectStatusScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { projectId, categoryName, timeline, budget, proCount } = route.params;
  const [proResponses] = useState<ProResponse[]>([
    { id: '1', name: 'John Smith', company: 'Smith Plumbing Co.', rating: 4.9, reviews: 127, estimate: '$350 - $500', responseTime: '2 hours ago', status: 'responded' },
    { id: '2', name: 'Mike Johnson', company: 'Johnson Services', rating: 4.7, reviews: 89, estimate: '$400 - $550', responseTime: '4 hours ago', status: 'responded' },
    { id: '3', name: 'David Wilson', company: 'Wilson Home Repair', rating: 4.8, reviews: 156, estimate: 'Pending', responseTime: 'Waiting...', status: 'pending' },
  ]);
  const handleBack = () => navigation.goBack();
  const handleViewProfile = (proId: string) => navigation.navigate('ProsProfile', { proId });
  const handleMessage = (proId: string) => navigation.navigate('ProsMessages', { proId });
  const respondedCount = proResponses.filter(p => p.status === 'responded').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#374151" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Project Status</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusBadge}><Ionicons name="time" size={16} color="#F59E0B" /><Text style={styles.statusBadgeText}>In Progress</Text></View>
            <Text style={styles.statusDate}>Submitted today</Text>
          </View>
          <Text style={styles.projectTitle}>{categoryName} Request</Text>
          <View style={styles.projectDetails}>
            <View style={styles.detailRow}><Ionicons name="calendar" size={16} color="#6B7280" /><Text style={styles.detailText}>{timeline}</Text></View>
            <View style={styles.detailRow}><Ionicons name="wallet" size={16} color="#6B7280" /><Text style={styles.detailText}>{budget}</Text></View>
          </View>
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}><Text style={styles.progressLabel}>Responses received</Text><Text style={styles.progressCount}>{respondedCount} of {proCount}</Text></View>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${(respondedCount / proCount) * 100}%` }]} /></View>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Pro Responses</Text>
        {proResponses.map((pro) => (
          <View key={pro.id} style={styles.proCard}>
            <View style={styles.proHeader}>
              <View style={styles.proAvatar}><Text style={styles.proAvatarText}>{pro.name.charAt(0)}</Text></View>
              <View style={styles.proInfo}>
                <Text style={styles.proName}>{pro.name}</Text>
                <Text style={styles.proCompany}>{pro.company}</Text>
                <View style={styles.proRating}><Ionicons name="star" size={14} color="#F59E0B" /><Text style={styles.ratingText}>{pro.rating}</Text><Text style={styles.reviewsText}>({pro.reviews} reviews)</Text></View>
              </View>
              {pro.status === 'responded' ? <View style={styles.respondedBadge}><Ionicons name="checkmark-circle" size={16} color="#10B981" /></View> : <View style={styles.pendingBadge}><Ionicons name="time" size={16} color="#9CA3AF" /></View>}
            </View>
            {pro.status === 'responded' ? (
              <>
                <View style={styles.estimateRow}><Text style={styles.estimateLabel}>Estimate:</Text><Text style={styles.estimateValue}>{pro.estimate}</Text></View>
                <Text style={styles.responseTime}>{pro.responseTime}</Text>
                <View style={styles.proActions}>
                  <TouchableOpacity style={styles.viewProfileButton} onPress={() => handleViewProfile(pro.id)}><Text style={styles.viewProfileText}>View Profile</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.messageButton} onPress={() => handleMessage(pro.id)}><Ionicons name="chatbubble" size={18} color="#FFFFFF" /><Text style={styles.messageText}>Message</Text></TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.pendingMessage}><Ionicons name="hourglass" size={18} color="#9CA3AF" /><Text style={styles.pendingText}>Waiting for response...</Text></View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1, padding: 16 },
  statusCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 24 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, gap: 4 },
  statusBadgeText: { color: '#D97706', fontSize: 12, fontWeight: '600' },
  statusDate: { color: '#9CA3AF', fontSize: 12 },
  projectTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  projectDetails: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { color: '#6B7280', fontSize: 14 },
  progressSection: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: '#6B7280', fontSize: 14 },
  progressCount: { color: '#111827', fontSize: 14, fontWeight: '600' },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: ProsColors.primary, borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  proCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  proHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  proAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: ProsColors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  proAvatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  proInfo: { flex: 1 },
  proName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  proCompany: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  proRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  reviewsText: { fontSize: 12, color: '#9CA3AF' },
  respondedBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  pendingBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  estimateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  estimateLabel: { fontSize: 14, color: '#6B7280', marginRight: 8 },
  estimateValue: { fontSize: 16, fontWeight: '600', color: '#10B981' },
  responseTime: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  proActions: { flexDirection: 'row', gap: 12 },
  viewProfileButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  viewProfileText: { color: '#374151', fontSize: 14, fontWeight: '500' },
  messageButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 8, backgroundColor: ProsColors.primary, alignItems: 'center', justifyContent: 'center', gap: 6 },
  messageText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  pendingMessage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  pendingText: { color: '#9CA3AF', fontSize: 14 },
});
