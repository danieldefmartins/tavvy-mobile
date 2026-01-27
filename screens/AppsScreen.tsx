/**
 * AppsScreen.tsx
 * Tools & shortcuts dashboard
 * Path: screens/AppsScreen.tsx
 *
 * PREMIUM REDESIGN - January 2026
 * - Clean minimalist header with tagline
 * - Search bar for app discovery
 * - Featured section with large horizontal cards
 * - All Apps grid with vibrant gradient tiles
 * - Dark/Light mode support
 * - Messages tile with unread badge
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import { useUnreadMessagesContext } from '../contexts/UnreadMessagesContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

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
};

interface AppTile {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  gradientColors: string[];
  route?: string;
  params?: object;
  showBadge?: boolean;
  isFeatured?: boolean;
}

// Featured Apps (shown in large horizontal cards)
const FEATURED_APPS: AppTile[] = [
  {
    id: 'pros',
    name: 'Pros',
    icon: 'construct',
    iconType: 'ionicons',
    gradientColors: ['#3B82F6', '#1D4ED8'],
    route: 'Pros',
    isFeatured: true,
  },
  {
    id: 'atlas',
    name: 'Atlas',
    icon: 'book',
    iconType: 'ionicons',
    gradientColors: ['#818CF8', '#6366F1'],
    route: 'Atlas',
    isFeatured: true,
  },
  {
    id: 'digital-card',
    name: 'eCard',
    icon: 'id-card',
    iconType: 'ionicons',
    gradientColors: ['#EC4899', '#BE185D'],
    route: 'ECardHub',
    isFeatured: true,
  },
];

// All Apps Grid
const APP_TILES: AppTile[] = [
  {
    id: 'universes',
    name: 'Universes',
    icon: 'planet',
    iconType: 'ionicons',
    gradientColors: ['#2DD4BF', '#14B8A6'],
    route: 'UniverseDiscovery',
  },
  {
    id: 'on-the-go',
    name: 'On The Go',
    icon: 'car-sport', // Changed to better represent mobile businesses
    iconType: 'ionicons',
    gradientColors: ['#10B981', '#059669'],
    route: 'OnTheGo',
  },
  {
    id: 'rides',
    name: 'Rides',
    icon: 'train',
    iconType: 'ionicons',
    gradientColors: ['#F87171', '#EF4444'],
    route: 'RidesBrowse',
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
    id: 'messages',
    name: 'Messages',
    icon: 'chatbubbles',
    iconType: 'ionicons',
    gradientColors: ['#EF4444', '#DC2626'],
    route: 'ProsMessages',
    showBadge: true,
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
    id: 'cities',
    name: 'Cities',
    icon: 'business',
    iconType: 'ionicons',
    gradientColors: ['#60A5FA', '#3B82F6'],
    route: 'CitiesBrowse',
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
  {
    id: 'realtors',
    name: 'Realtors',
    icon: 'home',
    iconType: 'ionicons',
    gradientColors: ['#14B8A6', '#0D9488'],
    route: 'RealtorsHub',
  },
  {
    id: 'happening',
    name: 'Happening',
    icon: 'sparkles',
    iconType: 'ionicons',
    gradientColors: ['#F472B6', '#EC4899'],
    route: 'HappeningNow',
  },
];

export default function AppsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme, isDark, setThemeMode } = useThemeContext();
  const { unreadCount } = useUnreadMessagesContext();
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTilePress = (tile: AppTile) => {
    if (tile.route) {
      // Special handling for routes that require login
      if ((tile.id === 'saved' || tile.id === 'account' || tile.id === 'messages') && !user) {
        navigation.navigate('Login');
        return;
      }
      
      // Special handling for eCard
      if (tile.id === 'digital-card') {
        if (!user) {
          navigation.navigate('Login');
          return;
        }
        navigation.navigate('ECardHub');
        return;
      }
      
      // Special handling for tab navigation
      if (tile.route === 'Atlas') {
        navigation.navigate('Atlas', { screen: 'AtlasMain' });
        return;
      }
      if (tile.route === 'Pros') {
        navigation.navigate('Pros', { screen: 'ProsHome' });
        return;
      }
      
      navigation.navigate(tile.route, tile.params || {});
    }
  };

  const handleMenuItemPress = (action: string) => {
    setMenuVisible(false);
    switch (action) {
      case 'help':
        navigation.navigate('HelpSupport');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
    }
  };

  const backgroundColor = theme.background;
  const surfaceColor = theme.surface;
  const glassyColor = isDark ? theme.surface : '#F3F4F6';
  const textColor = theme.text;
  const secondaryTextColor = theme.textSecondary;

  // Filter apps based on search
  const filteredApps = searchQuery
    ? APP_TILES.filter(app => 
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : APP_TILES;

  const renderIcon = (tile: AppTile, size: number = 32) => {
    if (tile.iconType === 'material') {
      return <MaterialCommunityIcons name={tile.icon as any} size={size} color="#FFFFFF" />;
    }
    return <Ionicons name={tile.icon as any} size={size} color="#FFFFFF" />;
  };

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: textColor }]}>Apps</Text>
              <Text style={[styles.tagline, { color: COLORS.accent }]}>
                Tools & shortcuts
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.menuButton, { backgroundColor: glassyColor }]}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="menu" size={24} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={[
            styles.searchBar, 
            { 
              backgroundColor: isDark ? glassyColor : '#FFFFFF',
              borderWidth: isDark ? 0 : 1,
              borderColor: '#E5E7EB',
            }
          ]}>
            <Ionicons name="search" size={20} color={secondaryTextColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search apps..."
              placeholderTextColor={secondaryTextColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={secondaryTextColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Featured Section */}
        {!searchQuery && (
          <View style={styles.featuredSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Featured</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {FEATURED_APPS.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.featuredCard}
                  onPress={() => handleTilePress(app)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={app.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featuredGradient}
                  >
                    {renderIcon(app, 48)}
                    <Text style={styles.featuredName}>{app.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* All Apps Grid */}
        <View style={styles.appsSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {searchQuery ? 'Search Results' : 'All Apps'}
          </Text>
          <View style={styles.appsGrid}>
            {filteredApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.appTile}
                onPress={() => handleTilePress(app)}
                activeOpacity={0.8}
              >
                <View style={styles.tileIconContainer}>
                  <LinearGradient
                    colors={app.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.tileGradient,
                      {
                        shadowColor: isDark ? 'transparent' : '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDark ? 0 : 0.15,
                        shadowRadius: 8,
                        elevation: isDark ? 0 : 4,
                      }
                    ]}
                  >
                    {renderIcon(app, 28)}
                  </LinearGradient>
                  {renderBadge(app)}
                </View>
                <Text style={[styles.tileName, { color: secondaryTextColor }]} numberOfLines={1}>
                  {app.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {filteredApps.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={secondaryTextColor} />
              <Text style={[styles.emptyText, { color: textColor }]}>No apps found</Text>
              <Text style={[styles.emptySubText, { color: secondaryTextColor }]}>
                Try a different search term
              </Text>
            </View>
          )}
        </View>

        {/* Theme Toggle */}
        <View style={styles.themeSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Appearance</Text>
          <View style={[
            styles.themeToggle, 
            { 
              backgroundColor: isDark ? glassyColor : '#FFFFFF',
              borderWidth: isDark ? 0 : 1,
              borderColor: '#E5E7EB',
            }
          ]}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                isDark && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode('dark')}
            >
              <Ionicons name="moon" size={20} color={isDark ? '#FFFFFF' : secondaryTextColor} />
              <Text style={[
                styles.themeOptionText,
                { color: isDark ? '#FFFFFF' : secondaryTextColor }
              ]}>Dark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeOption,
                !isDark && styles.themeOptionActive,
              ]}
              onPress={() => setThemeMode('light')}
            >
              <Ionicons name="sunny" size={20} color={!isDark ? '#FFFFFF' : secondaryTextColor} />
              <Text style={[
                styles.themeOptionText,
                { color: !isDark ? '#FFFFFF' : secondaryTextColor }
              ]}>Light</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: surfaceColor }]}>
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: textColor }]}>Menu</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('help')}
            >
              <Ionicons name="help-circle-outline" size={24} color={COLORS.accent} />
              <Text style={[styles.menuItemText, { color: textColor }]}>Help & Support</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('settings')}
            >
              <Ionicons name="settings-outline" size={24} color={secondaryTextColor} />
              <Text style={[styles.menuItemText, { color: textColor }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  // Featured Section
  featuredSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  featuredScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  featuredCard: {
    width: 140,
    height: 100,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  featuredGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  featuredName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Apps Grid
  appsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  appsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  appTile: {
    width: IS_TABLET ? '23%' : '23%',
    alignItems: 'center',
    marginBottom: 20,
  },
  tileIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  tileGradient: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tileBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#0F0F0F',
  },
  tileBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 4,
  },

  // Theme Toggle
  themeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  themeToggle: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  themeOptionActive: {
    backgroundColor: COLORS.accent,
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal
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
    minWidth: 220,
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
