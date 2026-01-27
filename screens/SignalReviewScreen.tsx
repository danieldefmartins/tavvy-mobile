/**
 * SignalReviewScreen - The Heart of Tavvy
 * Install path: screens/SignalReviewScreen.tsx
 * 
 * Replaces traditional star ratings with structured, tap-based signals.
 * Captures what the pro was good for and how the experience felt.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

export default function SignalReviewScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { leadId, proId, proName } = route.params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSignals, setAvailableSignals] = useState<any[]>([]);
  const [selectedSignals, setSelectedSignals] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase.from('signals').select('*');
      if (error) throw error;
      setAvailableSignals(data || []);
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignalTap = (signalId: string) => {
    const currentIntensity = selectedSignals[signalId] || 0;
    const nextIntensity = (currentIntensity + 1) % 4; // 0, 1, 2, 3 taps
    
    const updated = { ...selectedSignals };
    if (nextIntensity === 0) {
      delete updated[signalId];
    } else {
      updated[signalId] = nextIntensity;
    }
    setSelectedSignals(updated);
  };

  const handleSubmit = async () => {
    if (Object.keys(selectedSignals).length === 0) {
      Alert.alert('Wait', 'Please tap at least one signal to describe your experience.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        lead_id: leadId,
        pro_id: proId,
        content: comment,
        signals: selectedSignals,
        rating: 5, // Legacy support
      });

      if (error) throw error;
      
      Alert.alert('Thank You!', 'Your signals help the community find the best pros.', [
        { text: 'Done', onPress: () => navigation.navigate('Home' as any) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ProsColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review {proName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>How was the experience?</Text>
        <Text style={styles.subtitle}>Tap signals 1-3 times to show intensity.</Text>

        <View style={styles.signalGrid}>
          {availableSignals.map((signal) => {
            const intensity = selectedSignals[signal.id] || 0;
            return (
              <TouchableOpacity
                key={signal.id}
                style={[
                  styles.signalCard,
                  intensity > 0 && styles.signalCardActive,
                  intensity === 2 && styles.signalCardMedium,
                  intensity === 3 && styles.signalCardHigh,
                ]}
                onPress={() => handleSignalTap(signal.id)}
              >
                <Ionicons 
                  name={signal.icon as any} 
                  size={24} 
                  color={intensity > 0 ? '#FFF' : '#374151'} 
                />
                <Text style={[styles.signalName, intensity > 0 && styles.signalTextActive]}>
                  {signal.name}
                </Text>
                {intensity > 0 && (
                  <View style={styles.intensityRow}>
                    {[1, 2, 3].map((i) => (
                      <View 
                        key={i} 
                        style={[styles.intensityDot, i <= intensity && styles.intensityDotActive]} 
                      />
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>ADDITIONAL COMMENTS (OPTIONAL)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="Anything else the community should know?"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />

        <TouchableOpacity 
          style={[styles.submitButton, submitting && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Signals</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
  signalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 },
  signalCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  signalCardActive: { backgroundColor: '#60A5FA', borderColor: '#3B82F6' },
  signalCardMedium: { backgroundColor: '#3B82F6' },
  signalCardHigh: { backgroundColor: '#1D4ED8' },
  signalName: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#374151' },
  signalTextActive: { color: '#FFF' },
  intensityRow: { flexDirection: 'row', gap: 4, marginTop: 8 },
  intensityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  intensityDotActive: { backgroundColor: '#FFF' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12 },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    textAlignVertical: 'top',
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: ProsColors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  disabledButton: { opacity: 0.7 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
