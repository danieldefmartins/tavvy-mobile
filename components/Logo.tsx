// ============================================================================
// TAVVY LOGO COMPONENT
// ============================================================================
// Reusable logo component with multiple variants
// Usage: <Logo variant="full" size="large" />
// ============================================================================

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeContext } from '../contexts/ThemeContext';

type LogoVariant = 'icon' | 'full' | 'horizontal' | 'wordmark';
type LogoSize = 'small' | 'medium' | 'large' | 'xlarge';

interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  style?: ViewStyle;
  showTagline?: boolean;
}

const SIZE_CONFIG = {
  small: { icon: 32, full: 80, wordmark: 16 },
  medium: { icon: 48, full: 120, wordmark: 24 },
  large: { icon: 80, full: 180, wordmark: 36 },
  xlarge: { icon: 120, full: 240, wordmark: 48 },
};

export default function Logo({ 
  variant = 'icon', 
  size = 'medium',
  style,
  showTagline = false,
}: LogoProps) {
  const { theme } = useThemeContext();
  const sizeConfig = SIZE_CONFIG[size];

  const renderIcon = () => (
    <Image
      source={require('../assets/brand/logo-icon.png')}
      style={[
        styles.iconImage,
        { width: sizeConfig.icon, height: sizeConfig.icon },
      ]}
      resizeMode="contain"
    />
  );

  const renderWordmark = () => (
    <Text style={[
      styles.wordmark,
      { fontSize: sizeConfig.wordmark, color: theme.text },
    ]}>
      tavvy
    </Text>
  );

  const renderTagline = () => (
    <Text style={[styles.tagline, { color: theme.textSecondary }]}>
      A savvy way of tapping
    </Text>
  );

  switch (variant) {
    case 'icon':
      return (
        <View style={[styles.container, style]}>
          {renderIcon()}
        </View>
      );

    case 'wordmark':
      return (
        <View style={[styles.container, style]}>
          {renderWordmark()}
          {showTagline && renderTagline()}
        </View>
      );

    case 'full':
      return (
        <View style={[styles.container, styles.fullContainer, style]}>
          {renderIcon()}
          {renderWordmark()}
          {showTagline && renderTagline()}
        </View>
      );

    case 'horizontal':
      return (
        <View style={[styles.container, styles.horizontalContainer, style]}>
          <Image
            source={require('../assets/brand/logo-icon.png')}
            style={[
              styles.iconImage,
              { width: sizeConfig.icon * 0.75, height: sizeConfig.icon * 0.75 },
            ]}
            resizeMode="contain"
          />
          <Text style={[
            styles.wordmark,
            styles.horizontalWordmark,
            { fontSize: sizeConfig.wordmark * 0.9, color: theme.text },
          ]}>
            tavvy
          </Text>
        </View>
      );

    default:
      return renderIcon();
  }
}

// Logo with circular background (for profile pictures, social media)
export function LogoCircle({ size = 'medium', style }: { size?: LogoSize; style?: ViewStyle }) {
  const sizeConfig = SIZE_CONFIG[size];
  
  return (
    <View style={[styles.circleContainer, style]}>
      <Image
        source={require('../assets/brand/logo-icon-circle.png')}
        style={[
          styles.circleImage,
          { width: sizeConfig.icon, height: sizeConfig.icon },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullContainer: {
    gap: 8,
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconImage: {
    borderRadius: 12,
  },
  wordmark: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  horizontalWordmark: {
    marginLeft: 4,
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleImage: {
    borderRadius: 9999,
  },
});
