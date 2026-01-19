/**
 * AppsScreen.tsx
 * Tools & shortcuts dashboard with Tavvy-style large icons
 * Path: screens/AppsScreen.tsx
 *
 * Features:
 * - Large, prominent app icons (iOS-style)
 * - Tavvy cyan accent throughout
 * - Clean 3-column grid
 * - Vibrant gradient-style backgrounds
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 64) / 3; // 3 columns with padding

// Tavvy brand colors
const ACCENT = '#0F1233';
const TAVVY_CYAN = '#06B6D4';

interface AppTile {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  gradientColors: [string, string];
  route?: string;
  params?: object;
}

const APP_TILES: AppTile[] = [
  {
    id: 'quick-finds',
    name: 'Quick Finds',
    icon: 'flash',
    iconType: 'ionicons',
    gradientColors: ['#FCD34D', '#F59E0B'],
    route: 'Home',
  },
  {
    id: 'universes',
    name: 'Universes',
    icon: 'planet',
    iconType: 'ionicons',
    gradientColors: ['#5EEAD4', '#14B8A6'],
    route: 'Explore',
  },
  {
    id: 'rides',
    name: 'Rides',
    icon: 'train',
    iconType: 'ionicons',
    gradientColors: ['#FCA5A5', '#EF4444'],
    route: 'RidesBrowse',
  },
  {
    id: 'rv-camping',
    name: 'RV & Camping',
    icon: 'bonfire',
    iconType: 'ionicons',
    gradientColors: ['#FDBA74', '#EA580C'],
    route: 'RVCampingBrowse',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    icon: 'book',
    iconType: 'ionicons',
    gradientColors: ['#A5B4FC', '#6366F1'],
    route: 'Atlas',
  },
  {
    id: 'cities',
    name: 'Cities',
    icon: 'business',
    iconType: 'ionicons',
    gradientColors: ['#93C5FD', '#3B82F6'],
    route: 'CitiesBrowse',
  },
  {
    id: 'happening-now',
    name: 'Happening Now',
    icon: 'sparkles',
    iconType: 'ionicons',
    gradientColors: ['#F9A8D4', '#EC4899'],
    route: 'HappeningNow',
  },
  {
    id: 'experiences',
    name: 'Experiences',
    icon: 'compass',
    iconType: 'ionicons',
    gradientColors: ['#C4B5FD', '#8B5CF6'],
    route: 'ExperiencePaths',
  },
  {
    id: 'realtors',
    name: 'Realtors',
    icon: 'home',
    iconType: 'ionicons',
    gradientColors: ['#67E8F9', '#06B6D4'],
    route: 'RealtorsBrowse',
  },
  {
    id: 'pros',
    name: 'Pros',
    icon: 'construct',
    iconType: 'ionicons',
    gradientColors: ['#60A5FA', '#2563EB'],
    route: 'Pros',
  },
  {
    id: 'saved',
    name: 'Saved',
    icon: 'heart',
    iconType: 'ionicons',
    gradientColors: ['#FB7185', '#E11D48'],
    route: 'Saved',
  },
  {
    id: 'account',
    name: 'Account',
    icon: 'person',
    iconType: 'ionicons',
    gradientColors: ['#9CA3AF', '#4B5563'],
    route: 'ProfileMain',
  },
  {
    id: 'create',
    name: 'Create',
    icon: 'add-circle',
    iconType: 'ionicons',
    gradientColors: ['#6EE7B7', '#10B981'],
    route: 'UniversalAdd',
  },
  {
    id: 'help',
    name: 'Help',
    icon: 'help-circle',
    iconType: 'ionicons',
    gradientColors: ['#818CF8', '#4F46E5'],
    route: 'HelpSupport',
  },
];

export default function AppsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDark, setThemeMode } = useThemeContext();

  const handleTilePress = (tile: AppTile) => {
    if (tile.route) {
      navigation.navigate(tile.route, tile.params || {});
    }
  };

  const handlePersonalLogin = () => {
    navigation.navigate('Profile', { screen: 'Login' });
  };

  const handleProLogin = () => {
    navigation.navigate('Pros', { screen: 'ProsRegistration' });
  };

  const renderIcon = (tile: AppTile) => {
    if (tile.iconType === 'material') {
      return (
        <MaterialCommunityIcons
          name={tile.icon as any}
          size={42}
          color="#FFFFFF"
        />
      );
    }

    return (
      <Ionicons
        name={tile.icon as any}
        size={42}
        color="#FFFFFF"
      />
    );
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDark ? theme.background : '#F9FAFB',
    },
    headerTitle: {
      color: isDark ? theme.text : '#111827',
    },
    headerSubtitle: {
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
      
      {/* HEADER BANNER */}
      <View style={styles.headerBanner}>
        {/* Toggle */}
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

        {/* Logo Row */}
        <View style={styles.logoRow}>
          <Image
            source={require('../assets/brand/logo-horizontal.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => navigation.navigate('HelpSupport')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="help-circle-outline" size={26} color="#FFFFFF" />
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
              style={[styles.loginButton, { borderColor: TAVVY_CYAN, backgroundColor: isDark ? theme.surface : '#fff' }]}
              onPress={handlePersonalLogin}
            >
              <Ionicons name="person-outline" size={20} color={TAVVY_CYAN} />
              <Text style={[styles.loginButtonText, { color: TAVVY_CYAN }]}>Personal Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, { borderColor: isDark ? theme.border : '#D1D5DB', backgroundColor: isDark ? theme.surface : '#fff' }]}
              onPress={handleProLogin}
            >
              <Ionicons name="briefcase-outline" size={20} color={isDark ? theme.textSecondary : '#6B7280'} />
              <Text style={[styles.loginButtonText, { color: isDark ? theme.textSecondary : '#6B7280' }]}>
                Pro Login
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* App Tiles Grid - Large Tavvy-style icons */}
        <View style={styles.tilesGrid}>
          {APP_TILES.map((tile, index) => (
            <TouchableOpacity
              key={`${tile.id}-${index}`}
              style={styles.tile}
              onPress={() => handleTilePress(tile)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={tile.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.tileIconContainer}
              >
                {renderIcon(tile)}
              </LinearGradient>
              <Text style={[styles.tileName, dynamicStyles.tileName]} numberOfLines={2}>{tile.name}</Text>
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
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header banner
  headerBanner: {
    backgroundColor: '#0f1233',
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    paddingBottom: 20,
  },

  // Segment wrap
  segmentWrap: {
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 16,
  },

  // Segment control
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
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerLogo: {
    width: 180,
    height: 54,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },

  loginButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 32,
  },
  loginButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Tiles Grid - Large iOS-style icons
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  tile: {
    width: TILE_SIZE,
    alignItems: 'center',
    marginBottom: 24,
  },
  tileIconContainer: {
    width: TILE_SIZE - 16,
    height: TILE_SIZE - 16,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  tileName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 4,
  },

  comingSoon: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
    fontWeight: '500',
  },
});
