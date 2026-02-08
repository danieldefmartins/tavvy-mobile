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
 * - Subtle pulse animation
 * - Tappable to show endorsement details
 * - Three sizes: small, medium, large
 */
export default function CrownBadge({ 
  tapCount, 
  onPress, 
  size = 'medium',
  showAnimation = true 
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
      ]}
    >
      {/* Star icon */}
      <Text style={[styles.star, { fontSize: config.starSize }]}>★</Text>
      
      {/* Endorsement count */}
      <Text style={[styles.count, { fontSize: config.textSize }]}>
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
          stroke="#fff"
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
