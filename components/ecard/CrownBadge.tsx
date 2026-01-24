import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';

interface CrownBadgeProps {
  tapCount: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
}

/**
 * CrownBadge Component
 * 
 * Displays a crown badge with the number of validation taps an eCard has received.
 * The crown represents how many people have validated/liked the digital card.
 * 
 * Format: 👑 x [tap_count]
 * 
 * Features:
 * - Gold pulsing glow animation
 * - Tappable to show validation details
 * - Three sizes: small, medium, large
 */
export default function CrownBadge({ 
  tapCount, 
  onPress, 
  size = 'medium',
  showAnimation = true 
}: CrownBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Pulse animation for the crown
  useEffect(() => {
    if (!showAnimation || tapCount === 0) return;

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, [showAnimation, tapCount]);

  // Size configurations
  const sizeConfig = {
    small: {
      container: { paddingHorizontal: 8, paddingVertical: 4 },
      crown: 14,
      text: 12,
      glow: 20,
    },
    medium: {
      container: { paddingHorizontal: 12, paddingVertical: 6 },
      crown: 18,
      text: 14,
      glow: 28,
    },
    large: {
      container: { paddingHorizontal: 16, paddingVertical: 8 },
      crown: 24,
      text: 18,
      glow: 36,
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
    return null; // Don't show badge if no taps
  }

  const BadgeContent = (
    <Animated.View
      style={[
        styles.container,
        config.container,
        { transform: [{ scale: pulseAnim }] },
      ]}
    >
      {/* Gold glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: config.glow,
            height: config.glow,
            opacity: glowAnim,
          },
        ]}
      />
      
      {/* Crown emoji */}
      <Text style={[styles.crown, { fontSize: config.crown }]}>👑</Text>
      
      {/* Tap count */}
      <Text style={[styles.tapCount, { fontSize: config.text }]}>
        x {formatTapCount(tapCount)}
      </Text>
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
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    gap: 4,
    position: 'relative',
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    left: -4,
    top: '50%',
    marginTop: -14,
    borderRadius: 20,
    backgroundColor: '#FFD700',
  },
  crown: {
    textShadowColor: 'rgba(255, 215, 0, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  tapCount: {
    color: '#FFD700',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
