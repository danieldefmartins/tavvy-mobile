/**
 * AppsScreen.tsx
 * Tools & shortcuts dashboard
 * Path: screens/AppsScreen.tsx
 *
 * FEATURES:
 * - Large gradient tiles with white icons
 * - Correct app order: Pros, eCard, Realtors, Atlas, RV & Camping, Universes, Rides, Experiences, Happening Now, then others
 * - Fixed navigation routes
 * - Dark/Light mode toggle (below banner)
 * - Hamburger menu with Help option
 * - Messages tile with unread badge notification
 */

import React, { useState } from 'react';
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
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { useUnreadMessagesContext } from '../contexts/UnreadMessagesContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;
const COLUMNS = IS_TABLET ? 4 : 3;
// iPad needs larger tiles for better touch targets - Apple requires minimum 44pt touch targets
const MAX_TILE_SIZE_PHONE = 95;
const MAX_TILE_SIZE_TABLET = 140; // Larger tiles for iPad
const MAX_TILE_SIZE = IS_TABLET ? MAX_TILE_SIZE_TABLET : MAX_TILE_SIZE_PHONE;
const CALCULATED_TILE_SIZE = (SCREEN_WIDTH - 40 - (COLUMNS - 1) * (IS_TABLET ? 20 : 12)) / COLUMNS;
const TILE_SIZE = Math.min(CALCULATED_TILE_SIZE, MAX_TILE_SIZE);
// Minimum touch target size per Apple HIG (44pt)
const MIN_TOUCH_TARGET = 44;

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
  showBadge?: boolean; // Flag to show unread badge
}

const APP_TILES: AppTile[] = [
  // Row 1: Pros, eCard, Realtors
  {
    id: 'pros',
    name: 'Pros',
    icon: 'construct',
    iconType: 'ionicons',
    gradientColors: ['#3B82F6', '#1D4ED8'],
    route: 'Pros',
  },
  {
    id: 'digital-card',
    name: 'eCard',
    icon: 'id-card',
    iconType: 'ionicons',
    gradientColors: ['#EC4899', '#BE185D'],
    route: 'ECardTemplateGallery', // New Linktree-style flow
  },
  {
    id: 'realtors',
    name: 'Realtors',
    icon: 'home',
    iconType: 'ionicons',
    gradientColors: ['#14B8A6', '#0D9488'],
    route: 'RealtorsHub',
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
    route: 'HappeningNow',
  },
  // Row 4: Messages, Wallet, Quick Finds
  {
    id: 'messages',
    name: 'Messages',
    icon: 'chatbubbles',
    iconType: 'ionicons',
    gradientColors: ['#EF4444', '#DC2626'],
    route: 'ProsMessages',
    showBadge: true, // Show unread badge on this tile
  },
  {
    id: 'wallet',
    name: 'Wallet',
    icon: 'wallet',
    iconType: 'ionicons',
    gradientColors: ['#8B5CF6', '#6366F1'],
    route: 'Wallet',
  },
  {
    id: 'quick-finds',
    name: 'Quick Finds',
    icon: 'flash',
    iconType: 'ionicons',
    gradientColors: ['#FBBF24', '#F59E0B'],
    route: 'Home',
  },
  // Row 5: Saved, Account, Cities
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
    id: 'cities',
    name: 'Cities',
    icon: 'business',
    iconType: 'ionicons',
    gradientColors: ['#60A5FA', '#3B82F6'],
    route: 'CitiesBrowse',
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
  const { unreadCount } = useUnreadMessagesContext();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleTilePress = (tile: AppTile) => {
    if (tile.route) {
      // Special handling for routes that require login
      if ((tile.id === 'saved' || tile.id === 'account' || tile.id === 'messages') && !user) {
        navigation.navigate('Login');
        return;
      }
      
      // Special handling for bottom tab navigation
      // These are tabs, not screens in the current stack
      if (tile.route === 'Atlas') {
        // Navigate to Atlas tab
        navigation.navigate('Atlas', { screen: 'AtlasMain' });
        return;
      }
      if (tile.route === 'Pros') {
        // Navigate to Pros tab
        navigation.navigate('Pros', { screen: 'ProsHome' });
        return;
      }
      if (tile.route === 'Home') {
        // Navigate to Home tab
        navigation.navigate('Home', { screen: 'HomeMain' });
        return;
      }
      
      navigation.navigate(tile.route, tile.params || {});
    }
  };

  const handlePersonalLogin = () => {
    navigation.navigate('Login');
  };

  const handleMenuItemPress = (action: string) => {
    setMenuVisible(false);
    switch (action) {
      case 'help':
        navigation.navigate('HelpSupport');
        break;
      case 'about':
        navigation.navigate('HelpSupport'); // Could navigate to About screen
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
    }
  };

  const renderIcon = (tile: AppTile, size: number = IS_TABLET ? 56 : 48) => {
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

  // Render badge for tiles that need it
  const renderBadge = (tile: AppTile) => {
    if (!tile.showBadge || unreadCount <= 0) return null;
    
    return (
      <View style={styles.tileBadge}>
        <Text style={styles.tileBadgeText}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </Text>
      </View>
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
      
      {/* HEADER BANNER - Large logo and hamburger menu */}
      <View style={styles.headerBanner}>
        <View style={styles.bannerContent}>
          {/* Large Logo - Centered */}
          <Image
            source={require('../assets/brand/logo-horizontal.png')}
            style={styles.largeLogo}
            resizeMode="contain"
          />
          
          {/* Hamburger Menu Icon - Top Right */}
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme Toggle - Below Banner, Above "Apps" */}
      <View style={[styles.toggleContainer, { backgroundColor: isDark ? theme.background : '#F3F4F6' }]}>
        <View style={[styles.segment, { 
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,18,51,0.12)', 
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.95)' 
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
              <Ionicons name="log-in-outline" size={18} color={isDark ? theme.primary : '#14B8A6'} />
              <Text style={[styles.loginButtonText, dynamicStyles.loginButtonText]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* App Tiles Grid - Large Gradient Tiles */}
        <View style={styles.tilesGrid}>
          {APP_TILES.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              style={[styles.tile, IS_TABLET && styles.tileTablet]}
              onPress={() => handleTilePress(tile)}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              delayPressIn={0}
              accessible={true}
              accessibilityLabel={`${tile.name} button`}
              accessibilityRole="button"
            >
              <View style={styles.tileGradientContainer}>
                <LinearGradient
                  colors={tile.gradientColors}
                  style={styles.tileGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {renderIcon(tile)}
                </LinearGradient>
                {renderBadge(tile)}
              </View>
              <Text style={[styles.tileName, dynamicStyles.tileName]}>{tile.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming Soon */}
        <Text style={[styles.comingSoon, dynamicStyles.comingSoon]}>More tools coming soon</Text>
      </ScrollView>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: isDark ? theme.cardBackground : '#FFFFFF' }]}>
            {/* Menu Header */}
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: isDark ? theme.text : '#111827' }]}>Menu</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={24} color={isDark ? theme.text : '#111827'} />
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('help')}
            >
              <Ionicons name="help-circle-outline" size={24} color={isDark ? theme.text : '#374151'} />
              <Text style={[styles.menuItemText, { color: isDark ? theme.text : '#374151' }]}>Help</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('settings')}
            >
              <Ionicons name="settings-outline" size={24} color={isDark ? theme.text : '#374151'} />
              <Text style={[styles.menuItemText, { color: isDark ? theme.text : '#374151' }]}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('about')}
            >
              <Ionicons name="information-circle-outline" size={24} color={isDark ? theme.text : '#374151'} />
              <Text style={[styles.menuItemText, { color: isDark ? theme.text : '#374151' }]}>About Tavvy</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
    paddingBottom: 24,
    paddingHorizontal: 18,
  },

  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  largeLogo: {
    width: 200,
    height: 60,
  },

  menuButton: {
    position: 'absolute',
    right: 0,
    padding: 8,
  },

  // Toggle container - below banner
  toggleContainer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
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
    paddingHorizontal: IS_TABLET ? 40 : 20,
    gap: IS_TABLET ? 20 : 12,
    justifyContent: 'space-between',
  },
  tile: {
    width: TILE_SIZE,
    minWidth: MIN_TOUCH_TARGET, // Ensure minimum touch target
    minHeight: MIN_TOUCH_TARGET, // Ensure minimum touch target
    alignItems: 'center',
    marginBottom: IS_TABLET ? 20 : 12,
  },
  tileTablet: {
    width: TILE_SIZE,
    paddingVertical: 8,
  },
  tileGradientContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  tileGradient: {
    width: IS_TABLET ? TILE_SIZE - 20 : TILE_SIZE - 12,
    height: IS_TABLET ? TILE_SIZE - 20 : TILE_SIZE - 12,
    minWidth: MIN_TOUCH_TARGET, // Ensure minimum touch target per Apple HIG
    minHeight: MIN_TOUCH_TARGET, // Ensure minimum touch target per Apple HIG
    borderRadius: IS_TABLET ? 24 : 20,
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tileName: {
    fontSize: IS_TABLET ? 15 : 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  // Badge styles for tiles
  tileBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tileBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  comingSoon: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 20,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    marginTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 24) + 16,
    marginRight: 16,
    borderRadius: 16,
    padding: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
