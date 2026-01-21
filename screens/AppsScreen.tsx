/**
 * AppsScreen.tsx
 * Tools & shortcuts dashboard
 * Path: screens/AppsScreen.tsx
 *
 * FEATURES:
 * - Large gradient tiles with white icons
 * - Correct app order: Pros, Realtors, Cities, Atlas, RV & Camping, Universes, Rides, Experiences, Happening Now, then others
 * - Fixed navigation routes
 * - Dark/Light mode toggle
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_SIZE = (SCREEN_WIDTH - 60) / 3; // 3 columns with padding

// Match HomeScreen's ACCENT color exactly
const ACCENT = '#0F1233';

interface AppTile {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  gradientColors: string[];
  route?: string;
  params?: object;
}

const APP_TILES: AppTile[] = [
  // Row 1: Pros, Realtors, Cities
  {
    id: 'pros',
    name: 'Pros',
    icon: 'construct',
    iconType: 'ionicons',
    gradientColors: ['#3B82F6', '#1D4ED8'],
    route: 'Pros',
  },
  {
    id: 'realtors',
    name: 'Realtors',
    icon: 'home',
    iconType: 'ionicons',
    gradientColors: ['#14B8A6', '#0D9488'],
    route: 'RealtorsHub',
  },
  {
    id: 'cities',
    name: 'Cities',
    icon: 'business',
    iconType: 'ionicons',
    gradientColors: ['#60A5FA', '#3B82F6'],
    route: 'CitiesBrowse',
  },
  // Row 2: Atlas, RV & Camping, Universes
  {
    id: 'atlas',
    name: 'Atlas',
    icon: 'book',
    iconType: 'ionicons',
    gradientColors: ['#818CF8', '#6366F1'],
    route: 'Atlas',
  },
  {
    id: 'rv-camping',
    name: 'RV & Camping',
    icon: 'bonfire',
    iconType: 'ionicons',
    gradientColors: ['#FB923C', '#EA580C'],
    route: 'RVCampingBrowse',
  },
  {
    id: 'universes',
    name: 'Universes',
    icon: 'planet',
    iconType: 'ionicons',
    gradientColors: ['#2DD4BF', '#14B8A6'],
    route: 'UniverseDiscovery',
  },
  // Row 3: Rides, Experiences, Happening Now
  {
    id: 'rides',
    name: 'Rides',
    icon: 'train',
    iconType: 'ionicons',
    gradientColors: ['#F87171', '#EF4444'],
    route: 'RidesBrowse',
  },
  {
    id: 'experiences',
    name: 'Experiences',
    icon: 'leaf',
    iconType: 'ionicons',
    gradientColors: ['#A78BFA', '#8B5CF6'],
    route: 'Home', // TODO: Create ExperiencesBrowse screen
  },
  {
    id: 'happening',
    name: 'Happening Now',
    icon: 'sparkles',
    iconType: 'ionicons',
    gradientColors: ['#F472B6', '#EC4899'],
    route: 'Home', // TODO: Create HappeningNow screen
  },
  // Row 4+: Quick Finds, Saved, Account, Create
  {
    id: 'quick-finds',
    name: 'Quick Finds',
    icon: 'flash',
    iconType: 'ionicons',
    gradientColors: ['#FBBF24', '#F59E0B'],
    route: 'Home',
  },
  {
    id: 'saved',
    name: 'Saved',
    icon: 'heart',
    iconType: 'ionicons',
    gradientColors: ['#FB7185', '#F43F5E'],
    route: 'SavedMain',
  },
  {
    id: 'account',
    name: 'Account',
    icon: 'person',
    iconType: 'ionicons',
    gradientColors: ['#94A3B8', '#64748B'],
    route: 'ProfileMain',
  },
  {
    id: 'create',
    name: 'Create',
    icon: 'add-circle',
    iconType: 'ionicons',
    gradientColors: ['#34D399', '#10B981'],
    route: 'UniversalAdd',
  },
];

export default function AppsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDark, setThemeMode } = useThemeContext();

  const handleTilePress = (tile: AppTile) => {
    if (tile.route) {
      // Special handling for routes that require login
      if ((tile.id === 'saved' || tile.id === 'account') && !user) {
        navigation.navigate('Login');
        return;
      }
      navigation.navigate(tile.route, tile.params || {});
    }
  };

  const handlePersonalLogin = () => {
    navigation.navigate('Login');
  };

  const handleProLogin = () => {
    // Navigate to Pros tab which has login flow
    navigation.navigate('Pros');
  };

  const renderIcon = (tile: AppTile, size: number = 36) => {
    if (tile.iconType === 'material') {
      return (
        <MaterialCommunityIcons
          name={tile.icon as any}
          size={size}
          color="#FFFFFF"
        />
      );
    }

    return (
      <Ionicons
        name={tile.icon as any}
        size={size}
        color="#FFFFFF"
      />
    );
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? theme.background : '#F3F4F6',
    },
    headerTitle: {
      color: isDark ? theme.text : '#111827',
    },
    headerSubtitle: {
      color: isDark ? theme.textSecondary : '#6B7280',
    },
    loginButton: {
      backgroundColor: isDark ? theme.surface : '#fff',
      borderColor: isDark ? theme.primary : '#14B8A6',
    },
    loginButtonText: {
      color: isDark ? theme.primary : '#14B8A6',
    },
    proLoginButton: {
      borderColor: isDark ? theme.border : '#D1D5DB',
    },
    proLoginText: {
      color: isDark ? theme.textSecondary : '#6B7280',
    },
    tileName: {
      color: isDark ? theme.text : '#374151',
    },
    comingSoon: {
      color: isDark ? theme.textTertiary : '#9CA3AF',
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER BANNER - Extends to very top of screen */}
      <View style={styles.headerBanner}>
        {/* Toggle - EXACTLY matching HomeScreen style (full-width, no icons) */}
        <View style={styles.segmentWrap}>
          <View style={[styles.segment, { 
            borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,18,51,0.12)', 
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)' 
          }]}>
            <TouchableOpacity
              style={[styles.segmentItem, !isDark && [styles.segmentItemActive, { backgroundColor: ACCENT }]]}
              onPress={() => setThemeMode('light')}
              activeOpacity={0.9}
            >
              <Text style={[styles.segmentText, { color: !isDark ? '#fff' : (isDark ? theme.textSecondary : '#6B6B6B') }]}>Light</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentItem, isDark && [styles.segmentItemActive, { backgroundColor: ACCENT }]]}
              onPress={() => setThemeMode('dark')}
              activeOpacity={0.9}
            >
              <Text style={[styles.segmentText, { color: isDark ? '#fff' : (isDark ? theme.textSecondary : '#6B6B6B') }]}>Dark</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logo Row with Help Icon */}
        <View style={styles.logoRow}>
          <Image
            source={require('../assets/brand/logo-horizontal.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <TouchableOpacity 
            style={styles.helpButton}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <Ionicons name="help-circle-outline" size={28} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Apps</Text>
          <Text style={[styles.headerSubtitle, dynamicStyles.headerSubtitle]}>Tools & shortcuts</Text>
        </View>

        {/* Login Buttons */}
        {!user && (
          <View style={styles.loginButtons}>
            <TouchableOpacity
              style={[styles.loginButton, dynamicStyles.loginButton]}
              onPress={handlePersonalLogin}
            >
              <Ionicons name="person-outline" size={18} color={isDark ? theme.primary : '#14B8A6'} />
              <Text style={[styles.loginButtonText, dynamicStyles.loginButtonText]}>Personal Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, dynamicStyles.loginButton, dynamicStyles.proLoginButton]}
              onPress={handleProLogin}
            >
              <Ionicons name="briefcase-outline" size={18} color={isDark ? theme.textSecondary : '#6B7280'} />
              <Text style={[styles.loginButtonText, dynamicStyles.proLoginText]}>
                Pro Login
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* App Tiles Grid - Large Gradient Tiles */}
        <View style={styles.tilesGrid}>
          {APP_TILES.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              style={styles.tile}
              onPress={() => handleTilePress(tile)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={tile.gradientColors}
                style={styles.tileGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {renderIcon(tile)}
              </LinearGradient>
              <Text style={[styles.tileName, dynamicStyles.tileName]}>{tile.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming Soon */}
        <Text style={[styles.comingSoon, dynamicStyles.comingSoon]}>More tools coming soon</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header banner - extends to the very top of the screen
  headerBanner: {
    backgroundColor: '#0f1233',
    // Use platform-specific padding to account for status bar
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 20,
  },

  // Segment wrap - EXACTLY matching HomeScreen style
  segmentWrap: {
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 16,
  },

  // Segment control - EXACTLY matching HomeScreen style
  segment: {
    height: 44,
    borderRadius: 18,
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.0,
    shadowRadius: 12,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Logo row
  logoRow: {
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLogo: {
    width: 180,
    height: 54,
  },

  helpButton: {
    padding: 4,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7280',
  },

  loginButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  loginButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#14B8A6',
    backgroundColor: '#fff',
    gap: 8,
  },
  proLoginButton: {
    borderColor: '#D1D5DB',
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14B8A6',
  },
  proLoginText: {
    color: '#6B7280',
  },

  // Large gradient tiles
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    justifyContent: 'flex-start',
  },
  tile: {
    width: TILE_SIZE,
    alignItems: 'center',
    marginBottom: 12,
  },
  tileGradient: {
    width: TILE_SIZE - 8,
    height: TILE_SIZE - 8,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },

  comingSoon: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
});
