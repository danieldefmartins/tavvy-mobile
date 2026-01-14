/**
 * AppsScreen.tsx
 * Tools & shortcuts dashboard
 * Path: screens/AppsScreen.tsx
 *
 * FIXED:
 * - Toggle now matches HomeScreen's Standard/Map toggle EXACTLY (full-width, dark navy active, no icons)
 * - Header banner extends to the very top of the screen (no SafeAreaView gap)
 * - All app tiles preserved (Universes, Rides, RV & Camping, Atlas, Pros, etc.)
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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

// Match HomeScreen's ACCENT color exactly
const ACCENT = '#0F1233';

interface AppTile {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  backgroundColor: string;
  backgroundColorDark: string;
  iconColor: string;
  route?: string;
  params?: object;
}

const APP_TILES: AppTile[] = [
  {
    id: 'quick-finds',
    name: 'Quick Finds',
    icon: 'flash',
    iconType: 'ionicons',
    backgroundColor: '#FEF3C7',
    backgroundColorDark: '#78350F',
    iconColor: '#F59E0B',
    route: 'Home',
  },
  {
    id: 'universes',
    name: 'Universes',
    icon: 'planet',
    iconType: 'ionicons',
    backgroundColor: '#CCFBF1',
    backgroundColorDark: '#134E4A',
    iconColor: '#14B8A6',
    route: 'Universes',
  },
  {
    id: 'rides',
    name: 'Rides',
    icon: 'train',
    iconType: 'ionicons',
    backgroundColor: '#FEE2E2',
    backgroundColorDark: '#7F1D1D',
    iconColor: '#EF4444',
    route: 'RidesBrowse',
  },
  {
    id: 'rv-camping',
    name: 'RV & Camping',
    icon: 'bonfire',
    iconType: 'ionicons',
    backgroundColor: '#FED7AA',
    backgroundColorDark: '#7C2D12',
    iconColor: '#EA580C',
    route: 'RVCampingBrowse',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    icon: 'book',
    iconType: 'ionicons',
    backgroundColor: '#E0E7FF',
    backgroundColorDark: '#312E81',
    iconColor: '#4F46E5',
    route: 'Atlas',
  },
  {
    id: 'pros',
    name: 'Pros',
    icon: 'construct',
    iconType: 'ionicons',
    backgroundColor: '#DBEAFE',
    backgroundColorDark: '#1E3A8A',
    iconColor: '#3B82F6',
    route: 'Pros',
  },
  {
    id: 'saved',
    name: 'Saved',
    icon: 'heart',
    iconType: 'ionicons',
    backgroundColor: '#FCE7F3',
    backgroundColorDark: '#831843',
    iconColor: '#EC4899',
    route: 'Saved',
  },
  {
    id: 'account',
    name: 'Account',
    icon: 'person',
    iconType: 'ionicons',
    backgroundColor: '#E5E7EB',
    backgroundColorDark: '#374151',
    iconColor: '#6B7280',
    route: 'Profile',
  },
  {
    id: 'create',
    name: 'Create',
    icon: 'add-circle',
    iconType: 'ionicons',
    backgroundColor: '#D1FAE5',
    backgroundColorDark: '#064E3B',
    iconColor: '#10B981',
    route: 'UniversalAdd',
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

  const renderIcon = (tile: AppTile, size: number = 28) => {
    const iconColor = isDark ? '#FFFFFF' : tile.iconColor;

    if (tile.iconType === 'material') {
      return (
        <MaterialCommunityIcons
          name={tile.icon as any}
          size={size}
          color={iconColor}
        />
      );
    }

    return (
      <Ionicons
        name={tile.icon as any}
        size={size}
        color={iconColor}
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
      borderColor: isDark ? theme.primary : '#3B82F6',
    },
    loginButtonText: {
      color: isDark ? theme.primary : '#3B82F6',
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

        {/* Logo Row */}
        <View style={styles.logoRow}>
          <Image
            source={require('../assets/brand/logo-horizontal.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
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
              <Ionicons name="person-outline" size={18} color={isDark ? theme.primary : '#3B82F6'} />
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

        {/* App Tiles Grid */}
        <View style={styles.tilesGrid}>
          {APP_TILES.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              style={styles.tile}
              onPress={() => handleTilePress(tile)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.tileIconContainer,
                  { backgroundColor: isDark ? tile.backgroundColorDark : tile.backgroundColor },
                ]}
              >
                {renderIcon(tile)}
              </View>
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
    alignItems: 'flex-start',
  },

  headerLogo: {
    width: 180,
    height: 54,
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
    borderColor: '#3B82F6',
    backgroundColor: '#fff',
    gap: 8,
  },
  proLoginButton: {
    borderColor: '#D1D5DB',
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  proLoginText: {
    color: '#6B7280',
  },

  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
    justifyContent: 'flex-start',
  },
  tile: {
    width: '29%',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileName: {
    fontSize: 13,
    fontWeight: '500',
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
