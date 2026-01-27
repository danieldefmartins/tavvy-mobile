import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';

// Mock Signals
const SIGNALS = {
  positive: [
    { id: 'walkable', label: 'Walkable', icon: 'walk' },
    { id: 'transit', label: 'Good Transit', icon: 'bus' },
    { id: 'bike', label: 'Bike Friendly', icon: 'bicycle' },
    { id: 'parking', label: 'Easy Parking', icon: 'car' },
    { id: 'airport', label: 'Easy Airport', icon: 'airplane' },
  ],
  vibe: [
    { id: 'safe', label: 'Safe', icon: 'shield-checkmark' },
    { id: 'affordable', label: 'Affordable', icon: 'cash' },
    { id: 'clean', label: 'Clean', icon: 'sparkles' },
    { id: 'family', label: 'Family Friendly', icon: 'people' },
    { id: 'pet', label: 'Pet Friendly', icon: 'paw' },
  ],
  heads_up: [
    { id: 'traffic', label: 'Bad Traffic', icon: 'car-sport' },
    { id: 'expensive', label: 'Expensive', icon: 'wallet' },
    { id: 'unsafe', label: 'Sketchy Areas', icon: 'alert-circle' },
  ],
};

export default function RateCityScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'positive' | 'vibe' | 'heads_up'>('positive');

  const toggleSignal = (id: string) => {
    if (selectedSignals.includes(id)) {
      setSelectedSignals(prev => prev.filter(s => s !== id));
    } else {
      if (selectedSignals.length >= 5) {
        Alert.alert("Limit Reached", "You can only select up to 5 signals.");
        return;
      }
      setSelectedSignals(prev => [...prev, id]);
    }
  };

  const handleSubmit = () => {
    Alert.alert("Submitted!", `You rated Orlando with ${selectedSignals.length} signals.`);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.content}>
        <Text style={styles.title}>Rate this City</Text>
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>🏙️</Text>
          <Text style={styles.locationName}>Orlando, FL</Text>
          <Text style={styles.instruction}>Tap signals that apply</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Tab 
            label="Positive" 
            icon="thumbs-up" 
            active={activeTab === 'positive'} 
            onPress={() => setActiveTab('positive')} 
            color="#2DD4BF"
          />
          <Tab 
            label="Vibe" 
            icon="sparkles" 
            active={activeTab === 'vibe'} 
            onPress={() => setActiveTab('vibe')} 
            color="#E879F9"
          />
          <Tab 
            label="Heads Up" 
            icon="warning" 
            active={activeTab === 'heads_up'} 
            onPress={() => setActiveTab('heads_up')} 
            color="#FB923C"
          />
        </View>

        <ScrollView style={styles.signalList}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'positive' ? "What's great about this city?" : 
             activeTab === 'vibe' ? "How does it feel?" : "Any warnings?"}
          </Text>
          <Text style={styles.subtitle}>Select all that apply</Text>

          <View style={styles.grid}>
            {SIGNALS[activeTab].map((signal) => (
              <TouchableOpacity 
                key={signal.id} 
                style={[
                  styles.signalButton, 
                  selectedSignals.includes(signal.id) && styles.signalActive,
                  selectedSignals.includes(signal.id) && { backgroundColor: getTabColor(activeTab) }
                ]}
                onPress={() => toggleSignal(signal.id)}
              >
                <Ionicons 
                  name={signal.icon as any} 
                  size={18} 
                  color={selectedSignals.includes(signal.id) ? 'white' : '#374151'} 
                />
                <Text style={[
                  styles.signalLabel,
                  selectedSignals.includes(signal.id) && { color: 'white' }
                ]}>{signal.label}</Text>
                {selectedSignals.includes(signal.id) && (
                  <Ionicons name="checkmark" size={16} color="white" style={{ marginLeft: 4 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Footer Selection Summary */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Your signals ({selectedSignals.length} selected)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedScroll}>
            {selectedSignals.map(id => {
              const signal = [...SIGNALS.positive, ...SIGNALS.vibe, ...SIGNALS.heads_up].find(s => s.id === id);
              if (!signal) return null;
              return (
                <View key={id} style={styles.selectedChip}>
                  <Text style={styles.selectedChipText}>{signal.label}</Text>
                  <TouchableOpacity onPress={() => toggleSignal(id)}>
                    <Ionicons name="close-circle" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
          
          <TouchableOpacity style={styles.bigSubmitButton} onPress={handleSubmit}>
            <Text style={styles.bigSubmitText}>Submit {selectedSignals.length} Signals for Orlando</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const Tab = ({ label, icon, active, onPress, color }: any) => (
  <TouchableOpacity 
    style={[styles.tab, active && { borderBottomColor: color }]} 
    onPress={onPress}
  >
    <Ionicons name={icon} size={16} color={active ? color : '#9CA3AF'} />
    <Text style={[styles.tabText, active && { color }]}>{label}</Text>
  </TouchableOpacity>
);

const getTabColor = (tab: string) => {
  switch(tab) {
    case 'positive': return '#2DD4BF';
    case 'vibe': return '#E879F9';
    case 'heads_up': return '#FB923C';
    default: return '#2DD4BF';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EF4444', // Red header background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  submitButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  submitText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    position: 'absolute',
    top: -60,
    left: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: -28,
    left: 20,
    gap: 8,
  },
  locationIcon: { fontSize: 16 },
  locationName: { color: 'white', fontWeight: '600' },
  instruction: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: '600',
    color: '#9CA3AF',
  },
  signalList: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  signalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
    minWidth: '45%',
  },
  signalActive: {
    // Color handled inline
  },
  signalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  selectedScroll: {
    flexDirection: 'row',
    marginBottom: 20,
    maxHeight: 40,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444', // Using brand color for summary chips
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  selectedChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  bigSubmitButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bigSubmitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});