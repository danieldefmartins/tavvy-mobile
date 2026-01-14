/**
 * AppsScreen.tsx
 * Tools & shortcuts dashboard
 * Path: screens/AppsScreen.tsx
 *
 * UPDATED:
 * - Added full-width header banner (#0f1233) that extends to the top
 * - Toggle moved 1 line ABOVE the logo, aligned right (prevents clipping)
 * - Keeps logo switching for light/dark
 * - Keeps ThemeToggle
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

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
  const { theme, themeMode, isDark, setThemeMode } = useThemeContext();

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

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
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
    <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER BANNER (FULL WIDTH) */}
        <View style={styles.headerBanner}>
          {/* Toggle Row - HomeScreen style */}
          <View style={styles.toggleRow}>
            <View style={[styles.segment, { 
              borderColor: 'rgba(255,255,255,0.14)', 
              backgroundColor: 'rgba(255,255,255,0.08)' 
            }]}>
              <TouchableOpacity
                style={[styles.segmentItem, !isDark && styles.segmentItemActive]}
                onPress={() => setThemeMode('light')}
                activeOpacity={0.9}
              >
                <Ionicons name="sunny" size={16} color={!isDark ? '#fff' : 'rgba(255,255,255,0.6)'} />
                <Text style={[styles.segmentText, { color: !isDark ? '#fff' : 'rgba(255,255,255,0.6)' }]}>Light</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentItem, isDark && styles.segmentItemActive]}
                onPress={() => setThemeMode('dark')}
                activeOpacity={0.9}
              >
                <Ionicons name="moon" size={16} color={isDark ? '#fff' : 'rgba(255,255,255,0.6)'} />
                <Text style={[styles.segmentText, { color: isDark ? '#fff' : 'rgba(255,255,255,0.6)' }]}>Dark</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logo Row - Bigger logo */}
          <View style={styles.logoRow}>
            <Image
              source={require('../assets/brand/logo-horizontal.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
          </View>
        </View>

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
    </SafeAreaView>
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

  // Header banner background
  headerBanner: {
    backgroundColor: '#0f1233',
    paddingTop: 14,
    paddingBottom: 16,
  },

  // Toggle row - HomeScreen style
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  // Segment control (Light/Dark toggle) - Matching HomeScreen style
  segment: {
    height: 44,
    borderRadius: 18,
    flexDirection: 'row',
    padding: 4,
    borderWidth: 1,
    minWidth: 180,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  segmentItemActive: {
    backgroundColor: '#3B82F6',
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

  // Logo row below toggle - Bigger logo
  logoRow: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },

  headerLogo: {
    width: 240,
    height: 72,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
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