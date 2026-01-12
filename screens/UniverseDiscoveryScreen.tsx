/**
 * UniverseDiscoveryScreen.tsx
 * Explore themed universes (theme parks, airports, campuses, etc.)
 * Path: screens/UniverseDiscoveryScreen.tsx
 * 
 * UPDATED: Full-width gradient header (no rounded corners) + white logo + "Universes"
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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function UniverseDiscoveryScreen() {
  const navigation = useNavigation();
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
    { id: 'jfk', name: 'JFK Airport', location: 'New York, NY', type: 'Airport', places: 128, image: 'https://images.unsplash.com/photo-1542296332-2e44a996aa0d?w=500' },
    { id: 'atlantis', name: 'Atlantis Bahamas', location: 'Nassau, Bahamas', type: 'Resort', places: 64, image: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=500' },
    { id: 'stanford', name: 'Stanford University', location: 'Stanford, CA', type: 'Campus', places: 92, image: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=500' },
    { id: 'coachella', name: 'Coachella', location: 'Indio, CA', type: 'Festival', places: 45, image: 'https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=500' },
  ];

  const nearbyUniverses = [
    { id: 'universal', name: 'Universal Studios', dist: '8.2 mi', type: 'Theme Park', image: 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=500' },
    { id: 'ucla', name: 'UCLA Campus', dist: '12.4 mi', type: 'Campus', image: 'https://images.unsplash.com/photo-1623000850260-297d2800c994?w=500' },
    { id: 'miami', name: 'Downtown Miami', dist: '15.1 mi', type: 'City', image: 'https://images.unsplash.com/photo-1535498730771-e735b998cd64?w=500' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Full-Width Gradient Header - NO rounded corners */}
      <LinearGradient
        colors={['#06B6D4', '#0891B2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          {/* Header Content with Logo */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image 
                source={require('../assets/brand/tavvy-logo-white.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerSectionName}>Universes</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-circle-outline" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.headerSubtitle}>Explore worlds with many places inside</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              placeholder="Find a universe..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                activeCategory === cat.id && styles.categoryChipActive
              ]}
              onPress={() => setActiveCategory(cat.id)}
            >
              {cat.icon && (
                <Ionicons 
                  name={cat.icon as any} 
                  size={16} 
                  color={activeCategory === cat.id ? '#fff' : '#4B5563'} 
                  style={{ marginRight: 6 }}
                />
              )}
              <Text style={[
                styles.categoryText,
                activeCategory === cat.id && styles.categoryTextActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Universe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Universe</Text>
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
              <Text style={styles.sectionTitleInline}>Nearby Universes</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See Map</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyContainer}>
            {nearbyUniverses.map((item) => (
              <TouchableOpacity key={item.id} style={styles.nearbyCard}>
                <Image source={{ uri: item.image }} style={styles.nearbyImage} />
                <View style={styles.nearbyContent}>
                  <Text style={styles.nearbyName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.nearbyMeta}>
                    <Text style={styles.nearbyType}>{item.type}</Text>
                    <Text style={styles.nearbyDist}>{item.dist}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <View style={styles.gridContainer}>
            {popularUniverses.map((item) => (
              <TouchableOpacity key={item.id} style={styles.gridCard}>
                <Image source={{ uri: item.image }} style={styles.gridImage} />
                <View style={styles.gridContent}>
                  <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.gridLocation} numberOfLines={1}>{item.location}</Text>
                  <View style={styles.gridFooter}>
                    <Text style={styles.gridType}>{item.type}</Text>
                    <View style={styles.gridBadge}>
                      <Text style={styles.gridBadgeText}>{item.places}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Full-width gradient header - NO rounded corners
  headerGradient: {
    paddingBottom: 20,
    // No borderRadius - full width edge to edge
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 80,
    height: 24,
    marginRight: 8,
  },
  headerSectionName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    // Modern font - Space Grotesk if available
    // fontFamily: 'SpaceGrotesk-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 16,
  },
  profileButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  scrollContent: {
    paddingTop: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipActive: {
    backgroundColor: '#06B6D4',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  categoryTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 28,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 20,
    marginBottom: 12,
  },
  sectionTitleInline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06B6D4',
  },
  featuredCard: {
    marginHorizontal: 20,
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMetaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  featuredDot: {
    color: '#fff',
    marginHorizontal: 8,
  },
  nearbyContainer: {
    paddingHorizontal: 20,
  },
  nearbyCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  nearbyImage: {
    width: '100%',
    height: 100,
  },
  nearbyContent: {
    padding: 10,
  },
  nearbyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  nearbyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nearbyType: {
    fontSize: 11,
    color: '#6B7280',
  },
  nearbyDist: {
    fontSize: 11,
    fontWeight: '600',
    color: '#06B6D4',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  gridImage: {
    width: '100%',
    height: 110,
  },
  gridContent: {
    padding: 12,
  },
  gridName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  gridLocation: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridType: {
    fontSize: 11,
    color: '#06B6D4',
    fontWeight: '500',
  },
  gridBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4B5563',
  },
});
