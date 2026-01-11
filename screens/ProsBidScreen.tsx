import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';

type RouteParams = { leadId: string; customerName: string; service: string; timeline: string; budget: string; description: string };

export default function ProsBidScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const { leadId, customerName, service, timeline, budget, description } = route.params || { leadId: '1', customerName: 'Customer', service: 'Service', timeline: 'Flexible', budget: 'Not specified', description: '' };
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => navigation.goBack();

  const handleSubmit = async () => {
    if (!minPrice || !maxPrice) { Alert.alert('Missing Information', 'Please enter your price range.'); return; }
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Success!', 'Your bid has been submitted. The customer will be notified.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="#374151" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Bid</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.leadCard}>
          <View style={styles.leadHeader}>
            <View style={styles.customerAvatar}><Text style={styles.avatarText}>{customerName.charAt(0)}</Text></View>
            <View style={styles.leadInfo}><Text style={styles.customerName}>{customerName}</Text><Text style={styles.serviceType}>{service}</Text></View>
          </View>
          <View style={styles.leadDetails}>
            <View style={styles.detailItem}><Ionicons name="calendar" size={16} color="#6B7280" /><Text style={styles.detailLabel}>Timeline:</Text><Text style={styles.detailValue}>{timeline}</Text></View>
            <View style={styles.detailItem}><Ionicons name="wallet" size={16} color="#6B7280" /><Text style={styles.detailLabel}>Budget:</Text><Text style={styles.detailValue}>{budget}</Text></View>
          </View>
          {description ? <View style={styles.descriptionBox}><Text style={styles.descriptionLabel}>Project Description:</Text><Text style={styles.descriptionText}>{description}</Text></View> : null}
        </View>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Your Estimate</Text>
          <Text style={styles.sectionSubtitle}>Provide a ballpark price range for this project</Text>
          <View style={styles.priceInputs}>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.inputLabel}>Min Price</Text>
              <View style={styles.priceInput}><Text style={styles.dollarSign}>$</Text><TextInput style={styles.input} placeholder="0" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={minPrice} onChangeText={setMinPrice} /></View>
            </View>
            <View style={styles.priceDivider}><Text style={styles.dividerText}>to</Text></View>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.inputLabel}>Max Price</Text>
              <View style={styles.priceInput}><Text style={styles.dollarSign}>$</Text><TextInput style={styles.input} placeholder="0" placeholderTextColor="#9CA3AF" keyboardType="numeric" value={maxPrice} onChangeText={setMaxPrice} /></View>
            </View>
          </View>
        </View>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Message to Customer</Text>
          <Text style={styles.sectionSubtitle}>Introduce yourself and explain your approach</Text>
          <TextInput style={styles.messageInput} placeholder="Hi! I'd be happy to help with your project..." placeholderTextColor="#9CA3AF" multiline numberOfLines={6} value={message} onChangeText={setMessage} textAlignVertical="top" />
        </View>
        <View style={styles.tipsCard}>
          <Ionicons name="bulb" size={20} color="#F59E0B" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Tips for a winning bid</Text>
            <Text style={styles.tipsText}>• Respond quickly - fast responses get hired more</Text>
            <Text style={styles.tipsText}>• Be specific about your experience</Text>
            <Text style={styles.tipsText}>• Explain your process and timeline</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <Text style={styles.submitButtonText}>Submitting...</Text> : <><Text style={styles.submitButtonText}>Submit Bid</Text><Ionicons name="send" size={18} color="#FFFFFF" /></>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1, padding: 16 },
  leadCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16 },
  leadHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  customerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: ProsColors.primary, fontSize: 18, fontWeight: 'bold' },
  leadInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  serviceType: { fontSize: 14, color: '#6B7280' },
  leadDetails: { gap: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  descriptionBox: { marginTop: 16, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8 },
  descriptionLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  descriptionText: { fontSize: 14, color: '#374151' },
  formSection: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
  priceInputs: { flexDirection: 'row', alignItems: 'flex-end' },
  priceInputWrapper: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  priceInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12 },
  dollarSign: { fontSize: 16, color: '#6B7280', marginRight: 4 },
  input: { flex: 1, fontSize: 16, color: '#111827', paddingVertical: 12 },
  priceDivider: { paddingHorizontal: 12, paddingBottom: 12 },
  dividerText: { color: '#9CA3AF', fontSize: 14 },
  messageInput: { backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', padding: 12, fontSize: 14, color: '#111827', minHeight: 120 },
  tipsCard: { flexDirection: 'row', backgroundColor: '#FFFBEB', borderRadius: 12, padding: 16, marginBottom: 16, gap: 12 },
  tipsContent: { flex: 1 },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 8 },
  tipsText: { fontSize: 13, color: '#78350F', marginBottom: 4 },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  submitButton: { backgroundColor: ProsColors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  submitButtonDisabled: { backgroundColor: '#9CA3AF' },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
