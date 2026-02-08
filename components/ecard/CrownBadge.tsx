import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface CrownBadgeProps {
  tapCount: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
  /** When true, renders a solid white pill with dark text (for light card backgrounds) */
  isLightBackground?: boolean;
}

/**
 * EndorsementBadge Component (formerly CrownBadge)
 * 
 * Displays a frosted glass pill badge with star icon, endorsement count,
 * and a subtle dropdown chevron to indicate it's tappable.
 * 
 * Format: ★ 12 ˅
 * 
 * Features:
 * - Frosted glass pill that adapts to any card background
 * - Contrast-aware: solid white pill on light backgrounds, frosted glass on dark
 * - Subtle pulse animation
 * - Tappable to show endorsement details
 * - Three sizes: small, medium, large
 */
export default function CrownBadge({ 
  tapCount, 
  onPress, 
  size = 'medium',
  showAnimation = true,
  isLightBackground = false,
}: CrownBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Subtle pulse animation
  useEffect(() => {
    if (!showAnimation || tapCount === 0) return;

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [showAnimation, tapCount]);

  // Size configurations
  const sizeConfig = {
    small: {
      paddingH: 10,
      paddingV: 5,
      starSize: 14,
      textSize: 13,
      chevronW: 8,
      chevronH: 5,
      gap: 4,
      borderRadius: 16,
    },
    medium: {
      paddingH: 14,
      paddingV: 8,
      starSize: 18,
      textSize: 16,
      chevronW: 10,
      chevronH: 6,
      gap: 6,
      borderRadius: 24,
    },
    large: {
      paddingH: 18,
      paddingV: 10,
      starSize: 22,
      textSize: 20,
      chevronW: 12,
      chevronH: 7,
      gap: 8,
      borderRadius: 28,
    },
  };

  const config = sizeConfig[size];

  // Format the tap count for display
  const formatTapCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (tapCount === 0) {
    return null; // Don't show badge if no endorsements
  }

  // Contrast-aware colors
  const starColor = isLightBackground ? '#2563eb' : '#fff';
  const textColor = isLightBackground ? '#1a1a1a' : '#fff';
  const chevronColor = isLightBackground ? '#1a1a1a' : '#fff';
  const shadowConfig = isLightBackground
    ? { textShadowColor: 'transparent', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 0 }
    : { textShadowColor: 'rgba(0, 0, 0, 0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 };

  const BadgeContent = (
    <Animated.View
      style={[
        styles.container,
        {
          paddingHorizontal: config.paddingH,
          paddingVertical: config.paddingV,
          borderRadius: config.borderRadius,
          gap: config.gap,
          transform: [{ scale: pulseAnim }],
        },
        isLightBackground && styles.containerLight,
      ]}
    >
      {/* Star icon */}
      <Text style={[styles.star, { fontSize: config.starSize, color: starColor, ...shadowConfig }]}>★</Text>
      
      {/* Endorsement count */}
      <Text style={[styles.count, { fontSize: config.textSize, color: textColor, ...shadowConfig }]}>
        {formatTapCount(tapCount)}
      </Text>

      {/* Subtle dropdown chevron */}
      <Svg 
        width={config.chevronW} 
        height={config.chevronH} 
        viewBox="0 0 10 6" 
        fill="none"
        style={{ opacity: 0.5 }}
      >
        <Path
          d="M1 1L5 5L9 1"
          stroke={chevronColor}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {BadgeContent}
      </TouchableOpacity>
    );
  }

  return BadgeContent;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        // iOS supports backdrop blur natively
      },
      android: {
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderColor: 'rgba(255, 255, 255, 0.15)',
      },
    }),
    overflow: 'hidden',
  },
  containerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        elevation: 4,
      },
    }),
  },
  star: {
    color: '#fff',
    lineHeight: undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  count: {
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
