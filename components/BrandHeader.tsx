// ============================================
// BrandHeader.tsx
// Reusable header component with TavvY logo
// Path: components/BrandHeader.tsx
// ============================================

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Logo assets - make sure these are in assets/brand/
const LOGOS = {
  // For dark backgrounds (subpages like Universes, Atlas, Pros)
  white: require('../assets/brand/tavvy-logo-white.png'),
  // For light mode main screens
  originalTransparent: require('../assets/brand/tavvy-logo-Original-Transparent.png'),
  // For dark mode main screens
  horizontal: require('../assets/brand/logo-horizontal.png'),
};

interface BrandHeaderProps {
  // Section name to display after logo (e.g., "Universes", "Atlas", "Pros")
  // If not provided, only logo is shown
  sectionName?: string;
  // Type of header: 'main' for Home/Apps, 'subpage' for Universes/Atlas/Pros
  variant?: 'main' | 'subpage';
  // Show profile button on the right
  showProfile?: boolean;
  // Custom right element
  rightElement?: React.ReactNode;
  // Callback for profile press
  onProfilePress?: () => void;
  // Background color override
  backgroundColor?: string;
  // Force a specific logo variant
  forceLogo?: 'white' | 'original' | 'horizontal';
}

export default function BrandHeader({
  sectionName,
  variant = 'main',
  showProfile = false,
  rightElement,
  onProfilePress,
  backgroundColor,
  forceLogo,
}: BrandHeaderProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  // Determine which logo to use
  const getLogoSource = () => {
    if (forceLogo) {
      switch (forceLogo) {
        case 'white':
          return LOGOS.white;
        case 'original':
          return LOGOS.originalTransparent;
        case 'horizontal':
          return LOGOS.horizontal;
      }
    }

    if (variant === 'subpage') {
      // Subpages always use white logo
      return LOGOS.white;
    }

    // Main screens use original based on color scheme
    return isDark ? LOGOS.horizontal : LOGOS.originalTransparent;
  };

  // Determine text color for section name
  const getSectionTextColor = () => {
    if (variant === 'subpage') {
      return '#FFFFFF';
    }
    return isDark ? '#FFFFFF' : '#111827';
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8 },
        backgroundColor && { backgroundColor },
      ]}
    >
      <View style={styles.content}>
        {/* Logo + Section Name */}
        <View style={styles.brandContainer}>
          <Image
            source={getLogoSource()}
            style={[
              styles.logo,
              variant === 'subpage' && styles.logoSubpage,
            ]}
            resizeMode="contain"
          />
          {sectionName && (
            <Text
              style={[
                styles.sectionName,
                { color: getSectionTextColor() },
              ]}
            >
              {sectionName}
            </Text>
          )}
        </View>

        {/* Right Side */}
        <View style={styles.rightContainer}>
          {rightElement}
          {showProfile && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={onProfilePress}
            >
              <Ionicons
                name="person-circle-outline"
                size={32}
                color={variant === 'subpage' ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#374151')}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    height: 28,
    width: 100,
  },
  logoSubpage: {
    height: 24,
    width: 80,
  },
  sectionName: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'SpaceGrotesk-SemiBold', // Make sure this font is loaded
    letterSpacing: 0.5,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    padding: 4,
  },
});
