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
  /** @deprecated No longer used — badge always uses universal dark pill style */
  isLightBackground?: boolean;
}

/**
 * EndorsementBadge Component (formerly CrownBadge)
 * 
 * Displays a solid dark pill badge with gold star icon, white endorsement count,
 * and a subtle dropdown chevron to indicate it's tappable.
 * 
 * Format: ★ 12 ˅
 * 
 * The badge ALWAYS uses a dark opaque background (#1a1a2e) so it is clearly
 * visible on ANY card background — photos, light gradients, dark gradients,
 * white, black, or anything in between. No conditional light/dark logic.
 */
export default function CrownBadge({ 
  tapCount, 
  onPress, 
  size = 'medium',
  showAnimation = true,
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

  // Size configurations — bigger than before for visibility
  const sizeConfig = {
    small: {
      paddingH: 12,
      paddingV: 6,
      starSize: 16,
      textSize: 14,
      chevronW: 8,
      chevronH: 5,
      gap: 5,
      borderRadius: 18,
    },
    medium: {
      paddingH: 18,
      paddingV: 10,
      starSize: 22,
      textSize: 18,
      chevronW: 10,
      chevronH: 6,
      gap: 8,
      borderRadius: 26,
    },
    large: {
      paddingH: 22,
      paddingV: 12,
      starSize: 26,
      textSize: 22,
      chevronW: 12,
      chevronH: 7,
      gap: 10,
      borderRadius: 30,
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
      {/* Gold star icon */}
      <Text style={[styles.star, { fontSize: config.starSize }]}>★</Text>
      
      {/* White endorsement count */}
      <Text style={[styles.count, { fontSize: config.textSize }]}>
        {formatTapCount(tapCount)}
      </Text>

      {/* Subtle dropdown chevron */}
      <Svg 
        width={config.chevronW} 
        height={config.chevronH} 
        viewBox="0 0 10 6" 
        fill="none"
        style={{ opacity: 0.7 }}
      >
        <Path
          d="M1 1L5 5L9 1"
          stroke="#ffffff"
          strokeWidth={2}
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
    // Universal dark opaque pill — visible on ANY background
    backgroundColor: '#1a1a2e',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
    overflow: 'hidden',
  },
  star: {
    color: '#facc15',
    lineHeight: undefined,
  },
  count: {
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
