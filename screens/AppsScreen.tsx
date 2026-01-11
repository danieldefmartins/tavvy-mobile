import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

interface AppTile {
  id: string;
  name: string;
  icon: string;
  iconType: 'ionicons' | 'material';
  backgroundColor: string;
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
    iconColor: '#F59E0B',
    route: 'Home',
  },
  {
    id: 'paths',
    name: 'Paths',
    icon: 'signpost',
    iconType: 'material',
    backgroundColor: '#EDE9FE',
    iconColor: '#8B5CF6',
    route: 'Explore',
  },
  {
    id: 'happening',
    name: 'Happening',
    icon: 'sparkles',
    iconType: 'ionicons',
    backgroundColor: '#FCE7F3',
    iconColor: '#EC4899',
    route: 'Home',
  },
  {
    id: 'map-lens',
    name: 'Map Lens',
    icon: 'scan-circle-outline',
    iconType: 'ionicons',
    backgroundColor: '#D1FAE5',
    iconColor: '#10B981',
    route: 'Home',
  },
  {
    id: 'pros',
    name: 'Pros',
    icon: 'briefcase',
    iconType: 'ionicons',
    backgroundColor: '#DBEAFE',
    iconColor: '#3B82F6',
    route: 'Pros',
  },
  {
    id: 'saved',
    name: 'Saved',
    icon: 'bookmark',
    iconType: 'ionicons',
    backgroundColor: '#FEE2E2',
    iconColor: '#EF4444',
    route: 'Saved',
  },
  {
    id: 'account',
    name: 'Account',
    icon: 'person-circle-outline',
    iconType: 'ionicons',
    backgroundColor: '#E5E7EB',
    iconColor: '#374151',
    route: 'Profile',
  },
  {
    id: 'create',
    name: 'Create',
    icon: 'add-circle',
    iconType: 'ionicons',
    backgroundColor: '#D1FAE5',
    iconColor: '#10B981',
    route: 'UniversalAdd',
  },
];

export default function AppsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(colorScheme || 'light');

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
    if (tile.iconType === 'material') {
      return (
        <MaterialCommunityIcons
          name={tile.icon as any}
          size={size}
          color={tile.iconColor}
        />
      );
    }
    return (
      <Ionicons
        name={tile.icon as any}
        size={size}
        color={tile.iconColor}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Logo and Theme Toggle */}
        <View style={styles.header}>
          {/* Top Row: Logo + Theme Toggle */}
          <View style={styles.headerTopRow}>
            {/* TavvY Logo - Left Aligned */}
            <Image
              source={
                colorScheme === 'dark'
                  ? require('../assets/brand/logo-horizontal.png')
                  : require('../assets/brand/tavvy-logo-Original-Transparent.png')
              }
              style={styles.headerLogo}
              resizeMode="contain"
            />
            
            {/* Theme Toggle */}
            <View style={styles.themeToggle}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  themeMode === 'light' && styles.themeButtonActive,
                ]}
                onPress={() => setThemeMode('light')}
              >
                <Ionicons
                  name="sunny"
                  size={16}
                  color={themeMode === 'light' ? '#F59E0B' : '#9CA3AF'}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    themeMode === 'light' && styles.themeButtonTextActive,
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  themeMode === 'dark' && styles.themeButtonActiveDark,
                ]}
                onPress={() => setThemeMode('dark')}
              >
                <Ionicons
                  name="moon"
                  size={16}
                  color={themeMode === 'dark' ? '#3B82F6' : '#9CA3AF'}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    themeMode === 'dark' && styles.themeButtonTextActiveDark,
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Title Row */}
          <Text style={styles.headerTitle}>Apps</Text>
          <Text style={styles.headerSubtitle}>Tools & shortcuts</Text>
        </View>

        {/* Login Buttons */}
        {!user && (
          <View style={styles.loginButtons}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handlePersonalLogin}
            >
              <Ionicons name="person-outline" size={18} color="#3B82F6" />
              <Text style={styles.loginButtonText}>Personal Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, styles.proLoginButton]}
              onPress={handleProLogin}
            >
              <Ionicons name="briefcase-outline" size={18} color="#6B7280" />
              <Text style={[styles.loginButtonText, styles.proLoginText]}>
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
                  { backgroundColor: tile.backgroundColor },
                ]}
              >
                {renderIcon(tile)}
              </View>
              <Text style={styles.tileName}>{tile.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming Soon */}
        <Text style={styles.comingSoon}>More tools coming soon</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLogo: {
    width: 100,
    height: 28,
  },
  themeToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  themeButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  themeButtonActiveDark: {
    backgroundColor: '#1F2937',
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  themeButtonTextActive: {
    color: '#111827',
  },
  themeButtonTextActiveDark: {
    color: '#FFFFFF',
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
