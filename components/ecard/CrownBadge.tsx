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
  /** true = badge sits on a light area → use white pill with dark text
   *  false = badge sits on a dark area → use dark frosted pill with white text */
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
 * Contrast-adaptive:
 * - Light background → white frosted pill, dark text, amber star
 * - Dark background → dark frosted pill, white text, gold star
 * 
 * The caller is responsible for determining whether the background behind
 * the badge is light or dark (e.g. by sampling the profile photo pixels
 * or checking gradient colors).
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
      starSize: 15,
      textSize: 13,
      chevronW: 8,
      chevronH: 5,
      gap: 4,
      borderRadius: 16,
    },
    medium: {
      paddingH: 14,
      paddingV: 8,
      starSize: 20,
      textSize: 17,
      chevronW: 10,
      chevronH: 6,
      gap: 6,
      borderRadius: 24,
    },
    large: {
      paddingH: 16,
      paddingV: 9,
      starSize: 22,
      textSize: 19,
      chevronW: 10,
      chevronH: 6,
      gap: 7,
      borderRadius: 26,
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

  // Contrast-adaptive colors
  const starColor = isLightBackground ? '#d97706' : '#facc15';
  const textColor = isLightBackground ? '#1a1a1a' : '#ffffff';
  const chevronColor = isLightBackground ? '#333333' : '#ffffff';

  const BadgeContent = (
    <Animated.View
      style={[
        isLightBackground ? styles.containerLight : styles.containerDark,
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
      <Text style={{ fontSize: config.starSize, color: starColor, lineHeight: config.starSize * 1.2 }}>★</Text>
      
      {/* Endorsement count */}
      <Text style={{
        fontSize: config.textSize,
        fontWeight: '700',
        color: textColor,
        letterSpacing: 0.3,
        ...(isLightBackground ? {} : {
          textShadowColor: 'rgba(0,0,0,0.3)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }),
      }}>
        {formatTapCount(tapCount)}
      </Text>

      {/* Subtle dropdown chevron */}
      <Svg 
        width={config.chevronW} 
        height={config.chevronH} 
        viewBox="0 0 10 6" 
        fill="none"
        style={{ opacity: 0.6 }}
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
  // Light background → white frosted pill with dark text
  containerLight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    overflow: 'hidden',
  },
  // Dark background → dark frosted pill with white text
  containerDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
    overflow: 'hidden',
  },
});
