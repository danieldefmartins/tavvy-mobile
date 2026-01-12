/**
 * UniverseDiscoveryScreen.tsx
 * Explore themed universes (theme parks, airports, campuses, etc.)
 * Path: screens/UniverseDiscoveryScreen.tsx
 *
 * HEADER LAYOUT:
 * Left  = Logo
 * Center = "Universes"
 * Right = Profile icon
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function UniverseDiscoveryScreen() {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useThemeContext();
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    { id: 'All', label: 'All', icon: null },
    { id: 'Theme Parks', label: 'Theme Parks', icon: 'ticket-outline' },
    { id: 'Airports', label: 'Airports', icon: 'airplane-outline' },
    { id: 'Campuses', label: 'Campuses', icon: 'school-outline' },
    { id: 'Festivals', label: 'Festivals', icon: 'musical-notes-outline' },
    { id: 'Resorts', label: 'Resorts', icon: 'business-outline' },
  ];

  const popularUniverses = [
    {
      id: 'jfk',
      name: 'JFK Airport',
      location: 'New York, NY',
      type: 'Airport',
      places: 128,
      image: 'https://images.unsplash.com/photo-1542296332-2e44a996aa0d?w=500',
    },
    {
      id: 'atlantis',
      name: 'Atlantis Bahamas',
      location: 'Nassau, Bahamas',
      type: 'Resort',
      places: 64,
      image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=500',
    },
    {
      id: 'stanford',
      name: 'Stanford University',
      location: 'Stanford, CA',
      type: 'Campus',
      places: 92,
      image: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=500',
    },
    {
      id: 'coachella',
      name: 'Coachella',
      location: 'Indio, CA',
      type: 'Festival',
      places: 45,
      image: 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=500',
    },
  ];

  const nearbyUniverses = [
    {
      id: 'universal',
      name: 'Universal Studios',
      dist: '8.2 mi',
      type: 'Theme Park',
      image: 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=500',
    },
    {
      id: 'ucla',
      name: 'UCLA Campus',
      dist: '12.4 mi',
      type: 'Campus',
      image: 'https://images.unsplash.com/photo-1623000850260-297d2800c994?w=500',
    },
    {
      id: 'miami',
      name: 'Downtown Miami',
      dist: '15.1 mi',
      type: 'City',
      image: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=500',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#F9FAFB' }]}>
      <StatusBar barStyle="light-content" />

      {/* Full-width gradient header */}
      <LinearGradient
        colors={['#06B6D4', '#0891B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView>
          {/* Header row: Logo (L) / Title (C) / Icon (R) */}
          <View style={styles.headerRow}>
            {/* Left: Logo */}
            <View style={styles.headerLeft}>
              <Image
                source={require('../assets/brand/tavvy-logo-white.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>

            {/* Center: Title (absolute centered) */}
            <View style={styles.headerCenter} pointerEvents="none">
              <Text style={styles.headerTitle}>Universes</Text>
            </View>

            {/* Right: Profile */}
            <TouchableOpacity style={styles.headerRight}>
              <Ionicons name="person-circle-outline" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Subtitle aligned with logo left edge */}
          <Text style={styles.headerSubtitle}>Explore worlds with many places inside</Text>

          {/* Search bar */}
          <View style={[styles.searchContainer, { backgroundColor: isDark ? theme.surface : '#0B1220' }]}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              placeholder="Find a universe..."
              placeholderTextColor="#9CA3AF"
              style={[styles.searchInput, { color: '#fff' }]}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { backgroundColor: isDark ? theme.surface : '#1F2937' },
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => setActiveCategory(cat.id)}
              >
                {cat.icon && (
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={isActive ? '#fff' : '#9CA3AF'}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text style={[styles.categoryText, { color: isActive ? '#fff' : '#E5E7EB' }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Featured Universe */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#E5E7EB' }]}>Featured Universe</Text>

          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => navigation.navigate('UniverseLanding', { universeId: 'disney' })}
          >
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1597466599360-3b9775841aec?w=800' }}
              style={styles.featuredImage}
            />
            <View style={styles.featuredOverlay}>
              <View style={styles.popularTag}>
                <Ionicons name="flame" size={12} color="#F59E0B" />
                <Text style={styles.popularTagText}>Popular</Text>
              </View>

              <Text style={styles.featuredName}>Walt Disney World</Text>

              <View style={styles.featuredMeta}>
                <Ionicons name="location" size={14} color="#EF4444" />
                <Text style={styles.featuredMetaText}>Orlando, FL</Text>
                <Text style={styles.featuredDot}>•</Text>
                <Text style={styles.featuredMetaText}>47 Places</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Nearby Universes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="navigate" size={18} color="#06B6D4" />
              <Text style={[styles.sectionTitleInline, { color: isDark ? theme.text : '#E5E7EB' }]}>
                Nearby Universes
              </Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See Map</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyContainer}>
            {nearbyUniverses.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.nearbyCard, { backgroundColor: isDark ? theme.surface : '#111827' }]}>
                <Image source={{ uri: item.image }} style={styles.nearbyImage} />
                <View style={styles.nearbyContent}>
                  <Text style={[styles.nearbyName, { color: '#E5E7EB' }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.nearbyMeta}>
                    <Text style={[styles.nearbyType, { color: '#9CA3AF' }]}>{item.type}</Text>
                    <Text style={styles.nearbyDist}>{item.dist}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#E5E7EB' }]}>Popular Destinations</Text>

          <View style={styles.gridContainer}>
            {popularUniverses.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.gridCard, { backgroundColor: isDark ? theme.surface : '#111827' }]}>
                <Image source={{ uri: item.image }} style={styles.gridImage} />
                <View style={styles.gridContent}>
                  <Text style={[styles.gridName, { color: '#E5E7EB' }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.gridLocation, { color: '#9CA3AF' }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                  <View style={styles.gridFooter}>
                    <Text style={styles.gridType}>{item.type}</Text>
                    <View style={[styles.gridBadge, { backgroundColor: '#0B1220' }]}>
                      <Text style={[styles.gridBadgeText, { color: '#E5E7EB' }]}>{item.places}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerGradient: {
    paddingBottom: 18,
  },

  // Header layout
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerLeft: {
    width: 140, // reserved space so title can center independently
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  headerCenter: {
  position: 'absolute',
  left: 0,
  right: 0,
  top: Platform.OS === 'android' ? 40 : 16,
  height: 64,
  justifyContent: 'center',
  alignItems: 'center',

  marginLeft: 100,
  marginTop: -8, // ← moves UP (try -2, -4, -6) // ← ADD THIS
},


  headerRight: {
    marginLeft: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },

  headerLogo: {
    width: 192,
    height: 70,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },

  headerSubtitle: {
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center', // ← ADD THIS
  },

  // Search
  searchContainer: {
    marginHorizontal: 20,
    height: 52,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },

  searchIcon: { marginRight: 12 },

  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  // Content
  scrollContent: { paddingTop: 16 },

  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },

  categoryChipActive: {
    backgroundColor: '#06B6D4',
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },

  section: { marginBottom: 28 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 20,
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  sectionTitleInline: {
    fontSize: 18,
    fontWeight: '700',
  },

  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06B6D4',
  },

  // Featured
  featuredCard: {
    marginHorizontal: 20,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },

  featuredImage: { width: '100%', height: '100%' },

  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },

  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },

  popularTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  featuredName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  featuredMeta: { flexDirection: 'row', alignItems: 'center' },

  featuredMetaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },

  featuredDot: { color: '#fff', marginHorizontal: 8 },

  // Nearby
  nearbyContainer: { paddingHorizontal: 20 },

  nearbyCard: {
    width: 160,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  nearbyImage: { width: '100%', height: 100 },

  nearbyContent: { padding: 10 },

  nearbyName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },

  nearbyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  nearbyType: { fontSize: 11 },

  nearbyDist: {
    fontSize: 11,
    fontWeight: '700',
    color: '#06B6D4',
  },

  // Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },

  gridCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  gridImage: { width: '100%', height: 110 },

  gridContent: { padding: 12 },

  gridName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },

  gridLocation: { fontSize: 12, marginBottom: 8 },

  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  gridType: {
    fontSize: 11,
    color: '#06B6D4',
    fontWeight: '700',
  },

  gridBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  gridBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
