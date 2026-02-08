import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface CrownBadgeProps {
  tapCount: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showAnimation?: boolean;
}

/**
 * EndorsementBadge Component (formerly CrownBadge)
 * 
 * Displays a thumbs-up badge with the number of endorsements an eCard has received.
 * The thumbs-up icon clearly communicates social proof and approval.
 * 
 * Format: 👍 x12
 * 
 * Features:
 * - Gold pulsing glow animation
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
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Pulse animation
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
      icon: 20,
      text: 12,
      glow: 20,
    },
    medium: {
      container: { paddingHorizontal: 12, paddingVertical: 6 },
      icon: 26,
      text: 14,
      glow: 28,
    },
    large: {
      container: { paddingHorizontal: 16, paddingVertical: 8 },
      icon: 32,
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
    return null; // Don't show badge if no endorsements
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
      
      {/* Thumbs-up icon */}
      <Svg width={config.icon} height={config.icon} viewBox="0 0 24 24" fill="none">
        <Defs>
          <LinearGradient id="thumbGoldMobile" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFE066" />
            <Stop offset="50%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#FFA500" />
          </LinearGradient>
        </Defs>
        <Path
          d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m7-2V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"
          fill="url(#thumbGoldMobile)"
          stroke="#FFA500"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      
      {/* Endorsement count */}
      <Text style={[styles.tapCount, { fontSize: config.text }]}>
        x{formatTapCount(tapCount)}
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
  tapCount: {
    color: '#FFD700',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
