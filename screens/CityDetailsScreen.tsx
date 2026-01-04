import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Mock Data for Orlando
const CITY_DATA = {
  id: 'orlando',
  name: 'Orlando, FL',
  location: 'Florida, USA',
  population: '2.1M population',
  image: 'https://images.unsplash.com/photo-1597466599360-3b9775841fea?w=800', // Orlando skyline
  stats: {
    signals: '45.2k',
    universes: '12',
    places: '2.4k',
    photos: '18k',
  },
  signals: {
    best_for: [
      { id: 'family', label: 'Family Trips', score: 8.2, color: '#2DD4BF' },
      { id: 'parks', label: 'Theme Parks', score: 7.5, color: '#2DD4BF' },
      { id: 'weather', label: 'Great Weather', score: 5.1, color: '#2DD4BF' },
    ],
    vibe: [
      { id: 'touristy', label: 'Touristy', score: 4.3, color: '#E879F9' },
      { id: 'tropical', label: 'Tropical', score: 3.8, color: '#E879F9' },
    ],
    heads_up: [
      { id: 'car', label: 'Need a Car', score: 3.2, color: '#FB923C' },
      { id: 'hot', label: 'Hot Summers', score: 2.8, color: '#FB923C' },
      { id: 'crowded', label: 'Crowded', score: 2.1, color: '#FB923C' },
    ],
  },
};

export default function CityDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // In a real app, use route.params.cityId to fetch data
  const city = CITY_DATA;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: city.image }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          />
          
          {/* Header Actions */}
          <SafeAreaView style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="heart-outline" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="share-outline" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* City Info Overlay */}
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Ionicons name="business" size={12} color="white" />
              <Text style={styles.badgeText}>CITY</Text>
            </View>
            <Text style={styles.cityName}>{city.name}</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>🇺🇸 {city.location}</Text>
              <Text style={styles.dot}>•</Text>
              <Ionicons name="people" size={14} color="#9CA3AF" />
              <Text style={styles.locationText}>{city.population}</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <StatItem value={city.stats.signals} label="Signals" icon="star" color="#F59E0B" />
          <StatItem value={city.stats.universes} label="Universes" icon="planet" color="#6366F1" />
          <StatItem value={city.stats.places} label="Places" icon="location" color="#EF4444" />
          <StatItem value={city.stats.photos} label="Photos" icon="camera" color="#10B981" />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TabItem label="Signals" active />
          <TabItem label="Explore" />
          <TabItem label="Photos" />
          <TabItem label="Info" />
        </View>

        {/* Signals Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 What people say about Orlando</Text>
          
          <SignalGroup title="👍 BEST FOR" icon="thumbs-up" color="#F59E0B">
            {city.signals.best_for.map(s => <SignalPill key={s.id} {...s} />)}
          </SignalGroup>

          <SignalGroup title="✨ VIBE" icon="sparkles" color="#E879F9">
            {city.signals.vibe.map(s => <SignalPill key={s.id} {...s} />)}
          </SignalGroup>

          <SignalGroup title="⚠️ HEADS UP" icon="warning" color="#F59E0B">
            {city.signals.heads_up.map(s => <SignalPill key={s.id} {...s} />)}
          </SignalGroup>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('RateCity', { cityId: city.id })}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Components
const StatItem = ({ value, label, icon, color }: any) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={20} color={color} style={{ marginBottom: 4 }} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TabItem = ({ label, active }: any) => (
  <View style={[styles.tabItem, active && styles.activeTab]}>
    <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
  </View>
);

const SignalGroup = ({ title, icon, color, children }: any) => (
  <View style={styles.signalGroup}>
    <View style={styles.groupHeader}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={styles.groupTitle}>{title}</Text>
    </View>
    <View style={styles.pillContainer}>{children}</View>
  </View>
);

const SignalPill = ({ label, score, color }: any) => (
  <View style={[styles.pill, { backgroundColor: `${color}20` }]}>
    <Text style={[styles.pillText, { color: '#1F2937' }]}>{label}</Text>
    <View style={[styles.scoreBadge, { backgroundColor: `${color}40` }]}>
      <Text style={[styles.scoreText, { color: '#1F2937' }]}>x{score}k</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    gap: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cityName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  dot: {
    color: '#D1D5DB',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabItem: {
    paddingVertical: 16,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#EF4444',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#EF4444',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  signalGroup: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
    letterSpacing: 1,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2DD4BF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});