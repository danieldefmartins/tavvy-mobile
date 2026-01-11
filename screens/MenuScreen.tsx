// ============================================================================
// MENU SCREEN
// ============================================================================
// Menu screen with Profile, Saved, Add New, and Pro Dashboard options
// Place this file in: screens/MenuScreen.tsx
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function MenuScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme } = useThemeContext();

  const menuItems = [
    {
      id: 'profile',
      title: 'Profile',
      subtitle: user ? 'View and edit your profile' : 'Sign in to your account',
      icon: 'person',
      screen: 'ProfileMain',
      color: theme.primary,
    },
    {
      id: 'saved',
      title: 'Saved Places',
      subtitle: 'Your bookmarked places',
      icon: 'bookmark',
      screen: 'SavedMain',
      color: theme.signalCons, // Amber/Orange
    },
    // ========== Add New (Create) option ==========
    {
      id: 'add',
      title: 'Add New',
      subtitle: 'Add a place, business, city, or universe',
      icon: 'add-circle',
      screen: 'UniversalAdd',
      color: theme.signalPros, // Green
    },
    // ========== Pro Dashboard option ==========
    {
      id: 'proDashboard',
      title: 'Pro Dashboard',
      subtitle: 'Manage your service business',
      icon: 'construct',
      screen: 'ProsDashboard',
      color: theme.signalUniverse, // Blue
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'App preferences and account',
      icon: 'settings',
      screen: null, // Not implemented yet
      color: theme.textSecondary,
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and send feedback',
      icon: 'help-circle',
      screen: null, // Not implemented yet
      color: theme.brandOrange,
    },
  ];

  const handleMenuItemPress = (item: typeof menuItems[0]) => {
    if (item.screen) {
      navigation.navigate(item.screen as never);
    } else {
      // Show "Coming soon" message for unimplemented features
      alert('Coming soon!');
    }
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: theme.background,
    },
    header: {
      borderBottomColor: theme.border,
    },
    headerTitle: {
      color: theme.text,
    },
    userCard: {
      backgroundColor: theme.primary,
    },
    menuItem: {
      borderBottomColor: theme.surface,
    },
    menuTitle: {
      color: theme.text,
    },
    menuSubtitle: {
      color: theme.textSecondary,
    },
    appInfoText: {
      color: theme.textTertiary,
    },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Menu</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Info Card (if logged in) */}
        {user && (
          <View style={[styles.userCard, dynamicStyles.userCard]}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={32} color="#fff" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.email}</Text>
              <Text style={styles.userSubtitle}>Tavvy Member</Text>
            </View>
          </View>
        )}

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image 
            source={require('../assets/brand/logo-icon.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, dynamicStyles.menuItem]}
              onPress={() => handleMenuItemPress(item)}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}20` }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, dynamicStyles.menuTitle]}>{item.title}</Text>
                <Text style={[styles.menuSubtitle, dynamicStyles.menuSubtitle]}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, dynamicStyles.appInfoText]}>Tavvy v1.0.0</Text>
          <Text style={[styles.appInfoText, dynamicStyles.appInfoText]}>A savvy way of tapping</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  menuSection: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});
