/**
 * ProsManageProfileScreen - Business Management for Pros
 * Install path: screens/ProsManageProfileScreen.tsx
 * 
 * Allows Pros to manage their business details and select technical 
 * specialties (Tier 1 branches) for the TavvY Matching Engine.
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';
import { supabase } from '../lib/supabaseClient';

export default function ProsManageProfileScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pros')
        .select('*, category:service_categories(name, id)')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Fetch available specialties for this category from the question library
      const { data: questions } = await supabase
        .from('service_category_questions')
        .select('options')
        .eq('category_id', data.category_id)
        .is('parent_question_id', null)
        .single();

      if (questions && questions.options) {
        setAvailableSpecialties(questions.options);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    const current = profile.specialties || [];
    const updated = current.includes(specialty)
      ? current.filter((s: string) => s !== specialty)
      : [...current, specialty];
    
    setProfile({ ...profile, specialties: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('pros')
        .update({
          business_name: profile.business_name,
          specialties: profile.specialties,
          service_radius_miles: profile.service_radius_miles,
        })
        .eq('id', profile.id);

      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
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
        <Text style={styles.headerTitle}>Manage Business</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={ProsColors.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BUSINESS INFO</Text>
          <TextInput
            style={styles.input}
            value={profile.business_name}
            onChangeText={(text) => setProfile({ ...profile, business_name: text })}
            placeholder="Business Name"
          />
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{profile.category?.name}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR SPECIALTIES</Text>
          <Text style={styles.sectionSubtext}>
            Select the specific services you offer. We'll use these to match you with high-quality leads.
          </Text>
          <View style={styles.specialtyGrid}>
            {availableSpecialties.map((specialty, i) => {
              const isSelected = profile.specialties?.includes(specialty);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.specialtyChip, isSelected && styles.specialtyChipSelected]}
                  onPress={() => toggleSpecialty(specialty)}
                >
                  <Text style={[styles.specialtyText, isSelected && styles.specialtyTextSelected]}>
                    {specialty}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SERVICE RADIUS</Text>
          <View style={styles.radiusRow}>
            <Text style={styles.radiusValue}>{profile.service_radius_miles} miles</Text>
            <View style={styles.radiusButtons}>
              <TouchableOpacity 
                onPress={() => setProfile({...profile, service_radius_miles: Math.max(5, profile.service_radius_miles - 5)})}
                style={styles.radiusBtn}
              >
                <Ionicons name="remove" size={20} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setProfile({...profile, service_radius_miles: Math.min(100, profile.service_radius_miles + 5)})}
                style={styles.radiusBtn}
              >
                <Ionicons name="add" size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  saveText: { color: ProsColors.primary, fontWeight: '700', fontSize: 16 },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 32 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 12 },
  sectionSubtext: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 18 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  categoryText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  specialtyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    gap: 6,
  },
  specialtyChipSelected: {
    backgroundColor: ProsColors.primary,
    borderColor: ProsColors.primary,
  },
  specialtyText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  specialtyTextSelected: { color: '#FFF' },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  radiusValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  radiusButtons: { flexDirection: 'row', gap: 12 },
  radiusBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
