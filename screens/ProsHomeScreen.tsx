/**
 * Pros Home Screen
 * Install path: screens/ProsHomeScreen.tsx
 * 
 * PREMIUM DARK MODE REDESIGN - January 2026
 * - Minimalist header with tagline
 * - Sleek segmented control for Find a Pro / I'm a Pro
 * - 2x2 category grid with colorful icons
 * - Pro cards with trust badges
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useThemeContext } from '../contexts/ThemeContext';

import { 
  ProsColors, 
  PROS_CATEGORIES, 
  EARLY_ADOPTER_PRICE,
  STANDARD_PRICE,
  EARLY_ADOPTER_SPOTS_LEFT,
  EARLY_ADOPTER_SAVINGS,
} from '../constants/ProsConfig';
import { useSearchPros } from '../hooks/usePros';
import { useCategories } from '../hooks/useCategories';
import { useProsPendingRequests } from '../hooks/useProsPendingRequests';
import { Pro } from '../lib/ProsTypes';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

// Design System Colors
const COLORS = {
  background: '#0F0F0F',
  backgroundLight: '#FAFAFA',
  surface: '#111827',
  surfaceLight: '#FFFFFF',
  glassy: '#1A1A1A',
  accent: '#667EEA',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  success: '#10B981',
  verified: '#10B981',
};

// Category configuration with icons and colors
const CATEGORY_CONFIG = [
  { slug: 'plumbing', label: 'Plumbing', icon: 'construct-outline', color: '#3B82F6' },
  { slug: 'landscaping', label: 'Landscaping', icon: 'leaf-outline', color: '#10B981' },
  { slug: 'electrical', label: 'Electrical', icon: 'flash-outline', color: '#F59E0B' },
  { slug: 'cleaning', label: 'Cleaning', icon: 'sparkles-outline', color: '#8B5CF6' },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProsHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useThemeContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'user' | 'pro'>('user');

  const { pros, loading, searchPros } = useSearchPros();
  const { categories, loading: categoriesLoading } = useCategories();
  const { getPendingRequest } = useProsPendingRequests();
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  useEffect(() => {
    searchPros({ limit: 6 });
    checkPendingRequest();
  }, []);

  const checkPendingRequest = async () => {
    const pending = await getPendingRequest();
    if (pending) {
      setPendingRequest(pending);
    }
  };

  const handleCategoryPress = (slug: string) => {
    navigation.navigate('ProsRequestStep0');
  };

  const handleProPress = (slug: string) => {
    navigation.navigate('ProsProfile', { slug });
  };

  const handleProSignup = () => {
    navigation.navigate('ProsRegistration');
  };

  const handleProDashboard = () => {
    navigation.navigate('ProsDashboard');
  };

  const backgroundColor = theme.background;
  const surfaceColor = theme.surface;
  const glassyColor = isDark ? theme.surface : '#F3F4F6';
  const cardShadow = isDark ? {} : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  };
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;

  // Pro Mode View
  if (viewMode === 'pro') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Pros</Text>
            <Text style={[styles.tagline, { color: COLORS.accent }]}>
              Find trusted local experts.
            </Text>
          </View>

          {/* Segmented Control */}
          <View style={styles.segmentedControlContainer}>
            <View style={[styles.segmentedControl, { backgroundColor: glassyColor }]}>
              <TouchableOpacity
                style={[styles.segment, viewMode === 'user' && styles.segmentActive]}
                onPress={() => setViewMode('user')}
              >
                <Text style={[
                  styles.segmentText,
                  { color: viewMode === 'user' ? '#FFFFFF' : secondaryTextColor }
                ]}>
                  Find a Pro
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, viewMode === 'pro' && styles.segmentActive]}
                onPress={() => setViewMode('pro')}
              >
                <Text style={[
                  styles.segmentText,
                  { color: viewMode === 'pro' ? '#FFFFFF' : secondaryTextColor }
                ]}>
                  I'm a Pro
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pro Dashboard */}
          <View style={styles.proDashboard}>
            <Text style={[styles.welcomeText, { color: textColor }]}>Welcome, Pro!</Text>
            
            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: surfaceColor, ...cardShadow }]}>
                <Text style={[styles.statNumber, { color: textColor }]}>3</Text>
                <Text style={[styles.statLabel, { color: secondaryTextColor }]}>New Leads</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: surfaceColor, ...cardShadow }]}>
                <Text style={[styles.statNumber, { color: textColor }]}>1</Text>
                <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Messages</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: surfaceColor, ...cardShadow }]}>
                <Text style={[styles.statNumber, { color: textColor }]}>128</Text>
                <Text style={[styles.statLabel, { color: secondaryTextColor }]}>Views</Text>
              </View>
            </View>

            {/* Action Grid */}
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', borderWidth: isDark ? 0 : 1, borderColor: '#E5E7EB', ...cardShadow }]}
                onPress={() => navigation.navigate('ProsLeads')}
              >
                <Ionicons name="mail-outline" size={28} color={COLORS.success} />
                <Text style={[styles.actionLabel, { color: textColor }]}>Leads</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', borderWidth: isDark ? 0 : 1, borderColor: '#E5E7EB', ...cardShadow }]}
                onPress={() => navigation.navigate('ProsMessages')}
              >
                <Ionicons name="chatbubbles-outline" size={28} color={COLORS.accent} />
                <Text style={[styles.actionLabel, { color: textColor }]}>Messages</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', borderWidth: isDark ? 0 : 1, borderColor: '#E5E7EB', ...cardShadow }]}
                onPress={() => navigation.navigate('ProsProfile', { slug: 'my-profile' })}
              >
                <Ionicons name="person-outline" size={28} color="#F59E0B" />
                <Text style={[styles.actionLabel, { color: textColor }]}>Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: isDark ? glassyColor : '#FFFFFF', borderWidth: isDark ? 0 : 1, borderColor: '#E5E7EB', ...cardShadow }]}
                onPress={handleProDashboard}
              >
                <Ionicons name="stats-chart-outline" size={28} color="#EC4899" />
                <Text style={[styles.actionLabel, { color: textColor }]}>Analytics</Text>
              </TouchableOpacity>
            </View>

            {/* Early Adopter Banner */}
            <View style={styles.earlyAdopterBanner}>
              <Text style={styles.bannerTitle}>You're an Early Adopter!</Text>
              <Text style={styles.bannerSubtitle}>
                {EARLY_ADOPTER_SPOTS_LEFT} spots left at ${EARLY_ADOPTER_PRICE}/year
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // User Mode (Find a Pro)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Pros</Text>
          <Text style={[styles.tagline, { color: COLORS.accent }]}>
            Find trusted local experts.
          </Text>
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControlContainer}>
          <View style={[styles.segmentedControl, { backgroundColor: glassyColor }]}>
            <TouchableOpacity
              style={[styles.segment, viewMode === 'user' && styles.segmentActive]}
              onPress={() => setViewMode('user')}
            >
              <Text style={[
                styles.segmentText,
                { color: viewMode === 'user' ? '#FFFFFF' : secondaryTextColor }
              ]}>
                Find a Pro
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segment, viewMode === 'pro' && styles.segmentActive]}
              onPress={() => setViewMode('pro')}
            >
              <Text style={[
                styles.segmentText,
                { color: viewMode === 'pro' ? '#FFFFFF' : secondaryTextColor }
              ]}>
                I'm a Pro
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Start a Project Card */}
        <TouchableOpacity
          style={styles.startProjectCard}
          onPress={() => navigation.navigate('ProsRequestStep0')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#0EA5E9', '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startProjectGradient}
          >
            <View style={styles.startProjectIcon}>
              <Ionicons name="add-circle-outline" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.startProjectContent}>
              <Text style={styles.startProjectTitle}>Start a Project</Text>
              <Text style={styles.startProjectSubtitle}>Get quotes from multiple pros in minutes</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Continue Request Banner */}
        {pendingRequest && (
          <TouchableOpacity
            style={styles.continueRequestCard}
            onPress={() => navigation.navigate('ProsRequestStep1', { customerInfo: pendingRequest.customerInfo })}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueRequestGradient}
            >
              <Ionicons name="time-outline" size={24} color="#FFFFFF" />
              <View style={styles.continueRequestContent}>
                <Text style={styles.continueRequestTitle}>Continue your request?</Text>
                <Text style={styles.continueRequestSubtitle}>
                  You have an unfinished project for {pendingRequest.category || 'a service'}.
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Search Card */}
        <View style={styles.searchSection}>
          <View style={[styles.searchCard, { backgroundColor: glassyColor }]}>
            <View style={[styles.searchInputRow, { backgroundColor: isDark ? '#252525' : '#FFFFFF' }]}>
              <Ionicons name="search" size={20} color={secondaryTextColor} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search for plumbers, electricians..."
                placeholderTextColor={secondaryTextColor}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={[styles.searchInputRow, { backgroundColor: isDark ? '#252525' : '#FFFFFF' }]}>
              <Ionicons name="location-outline" size={20} color={secondaryTextColor} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Location"
                placeholderTextColor={secondaryTextColor}
                value={location}
                onChangeText={setLocation}
              />
              <TouchableOpacity>
                <Ionicons name="navigate" size={20} color={COLORS.accent} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Get Started - Category Grid */}
        <View style={styles.categorySection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Get Started</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_CONFIG.map((cat) => (
              <TouchableOpacity
                key={cat.slug}
                style={[
                  styles.categoryCard, 
                  { 
                    backgroundColor: isDark ? glassyColor : '#FFFFFF',
                    borderWidth: isDark ? 0 : 1,
                    borderColor: '#E5E7EB',
                    ...cardShadow,
                  }
                ]}
                onPress={() => handleCategoryPress(cat.slug)}
              >
                <Ionicons name={cat.icon as any} size={32} color={cat.color} />
                <Text style={[styles.categoryLabel, { color: textColor }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top-Rated Pros */}
        <View style={styles.prosSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Top-Rated Pros Near You</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.accent} />
          ) : (
            <View style={styles.prosList}>
              {pros.slice(0, 3).map((pro, index) => (
                <TouchableOpacity
                  key={pro.id || index}
                  style={[
                    styles.proCard, 
                    { 
                      backgroundColor: surfaceColor,
                      ...cardShadow,
                    }
                  ]}
                  onPress={() => handleProPress(pro.slug || '')}
                >
                  <View style={styles.proAvatar}>
                    {pro.profile_image_url ? (
                      <Image source={{ uri: pro.profile_image_url }} style={styles.proAvatarImage} />
                    ) : (
                      <View style={[styles.proAvatarPlaceholder, { backgroundColor: COLORS.accent }]}>
                        <Text style={styles.proAvatarText}>
                          {(pro.business_name || 'P').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.proInfo}>
                    <Text style={[styles.proName, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
                      {pro.business_name || 'Professional'}
                    </Text>
                    <Text style={[styles.proSpecialty, { color: secondaryTextColor }]}>
                      {pro.category || 'Service Professional'}
                    </Text>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.verified} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.requestButton}
                    onPress={() => handleCategoryPress(pro.category || '')}
                  >
                    <Text style={styles.requestButtonText}>Request Quote</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },

  // Segmented Control
  segmentedControlContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: COLORS.accent,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Start a Project Card
  startProjectCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startProjectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  startProjectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  startProjectContent: {
    flex: 1,
  },
  startProjectTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  startProjectSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },

  // Continue Request Card
  continueRequestCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueRequestGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  continueRequestContent: {
    flex: 1,
  },
  continueRequestTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  continueRequestSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },

  // Search
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchCard: {
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },

  // Categories
  categorySection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 52) / 2,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Pros List
  prosSection: {
    paddingHorizontal: 20,
  },
  prosList: {
    gap: 12,
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  proAvatar: {
    marginRight: 12,
  },
  proAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  proAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  proInfo: {
    flex: 1,
  },
  proName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  proSpecialty: {
    fontSize: 13,
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: COLORS.verified,
    fontWeight: '500',
  },
  requestButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Pro Dashboard
  proDashboard: {
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  earlyAdopterBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
