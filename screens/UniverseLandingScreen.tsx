import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Optional: Remove if not installed

const { width } = Dimensions.get('window');

// Get category-based fallback image URL when place has no photo
const getCategoryFallbackImage = (category: string): string => {
  const lowerCategory = (category || '').toLowerCase();
  
  const imageMap: Record<string, string> = {
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    'ride': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'attraction': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'theme park': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'family': 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=800',
    'themed': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    'unique': 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  };
  
  for (const [key, url] of Object.entries(imageMap)) {
    if (lowerCategory.includes(key)) return url;
  }
  
  return imageMap.default;
};

export default function UniverseLandingScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Places');
  const [activeZone, setActiveZone] = useState('All Zones');

  const stats = [
    { val: "47", label: "Places" },
    { val: "12.4k", label: "Signals" },
    { val: "4", label: "Parks" },
    { val: "8", label: "Entrances" }
  ];

  const zones = ["All Zones", "🏰 Magic Kingdom", "🌍 EPCOT", "🎬 Hollywood Studios", "🦁 Animal Kingdom", "🏨 Disney Springs"];

  const places = [
    { id: 'tonys', name: "Tony's Town Square", zone: "🏰 Magic Kingdom", status: "Open", type: "Family", count: 156, img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300" },
    { id: 'beourguest', name: "Be Our Guest Restaurant", zone: "🏰 Magic Kingdom", status: "Open", type: "Themed", count: 234, img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300" },
    { id: 'space220', name: "Space 220 Restaurant", zone: "🌍 EPCOT", status: "Closed", type: "Unique", count: 312, img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=800' }} 
            style={styles.heroImage} 
          />
          <View style={styles.heroOverlay} />
          
          {/* Hero Nav */}
          <SafeAreaView style={styles.heroNav}>
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View style={styles.navActions}>
              <TouchableOpacity style={styles.navButton}>
                <Ionicons name="heart-outline" size={24} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navButton}>
                <Ionicons name="share-outline" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={styles.universeBadge}>
              <Text style={styles.universeBadgeIcon}>🌌</Text>
              <Text style={styles.universeBadgeText}>UNIVERSE</Text>
            </View>
            <Text style={styles.heroTitle}>Walt Disney World</Text>
            <View style={styles.heroMeta}>
              <Ionicons name="location" size={14} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.heroMetaText}>Orlando, FL</Text>
              <Text style={styles.heroDot}>•</Text>
              <Text style={styles.heroMetaText}>Theme Park</Text>
            </View>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsContainer}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.val}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          {["Places", "Map", "Signals", "Info"].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search & Filter */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <Text style={styles.searchPlaceholder}>Search in this universe...</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zonesContainer}>
            {zones.map((zone) => (
              <TouchableOpacity 
                key={zone}
                style={[styles.zoneChip, activeZone === zone && styles.zoneChipActive]}
                onPress={() => setActiveZone(zone)}
              >
                <Text style={[styles.zoneText, activeZone === zone && styles.zoneTextActive]}>{zone}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Map Preview */}
        <TouchableOpacity style={styles.mapPreview}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Text style={styles.mapText}>View Universe Map →</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'exit-outline', label: "Entrances" },
            { icon: 'restaurant-outline', label: "Dining" },
            { icon: 'water-outline', label: "Restrooms" },
            { icon: 'car-outline', label: "Parking" }
          ].map((action, i) => (
            <TouchableOpacity key={i} style={styles.actionButton}>
              <Ionicons name={action.icon as any} size={24} color="#374151" />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Places List */}
        <View style={styles.placesSection}>
          <View style={styles.placesHeader}>
            <Text style={styles.placesTitle}>Places in this Universe</Text>
            <Text style={styles.placesCount}>47 places</Text>
          </View>

          {places.map((place) => (
            <TouchableOpacity 
              key={place.id} 
              style={[styles.placeCard, place.status === 'Closed' && styles.placeCardClosed]}
              onPress={() => navigation.navigate('PlaceDetails', { placeId: place.id })}
            >
              <Image source={{ uri: place.img || getCategoryFallbackImage(place.type) }} style={styles.placeImage} />
              <View style={styles.placeContent}>
                <View style={styles.placeHeader}>
                  <View>
                    <Text style={styles.placeName}>{place.name}</Text>
                    <Text style={styles.placeZone}>{place.zone}</Text>
                  </View>
                  <View style={[styles.statusBadge, place.status === 'Closed' ? styles.statusClosed : styles.statusOpen]}>
                    <Text style={[styles.statusText, place.status === 'Closed' ? styles.statusTextClosed : styles.statusTextOpen]}>
                      {place.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.placeTags}>
                  <View style={styles.placeTag}>
                    <Text style={styles.placeTagText}>✨ {place.type} ×{place.count}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  navButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  universeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.9)', // Cyan-500
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  universeBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  universeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  heroDot: {
    color: '#fff',
    marginHorizontal: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06B6D4',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#06B6D4',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#06B6D4',
  },
  filterSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: '#9CA3AF',
    fontSize: 13,
  },
  zonesContainer: {
    paddingRight: 16,
  },
  zoneChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  zoneChipActive: {
    backgroundColor: '#06B6D4',
  },
  zoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  zoneTextActive: {
    color: '#fff',
  },
  mapPreview: {
    marginHorizontal: 16,
    marginBottom: 16,
    height: 140,
    backgroundColor: '#E0F2FE', // Blue-50
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  mapIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '500',
  },
  placesSection: {
    paddingHorizontal: 16,
  },
  placesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  placesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  placesCount: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  placeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  placeCardClosed: {
    opacity: 0.7,
  },
  placeImage: {
    width: 100,
    height: 100,
  },
  placeContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  placeZone: {
    fontSize: 11,
    color: '#06B6D4',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusOpen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  statusClosed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusTextOpen: {
    color: '#059669',
  },
  statusTextClosed: {
    color: '#DC2626',
  },
  placeTags: {
    flexDirection: 'row',
    marginTop: 8,
  },
  placeTag: {
    backgroundColor: '#ECFEFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CFFAFE',
  },
  placeTagText: {
    fontSize: 10,
    color: '#0891B2',
    fontWeight: '500',
  },
});