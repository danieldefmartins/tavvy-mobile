import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CrownBadgeProps {
  tapCount: number;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showAnimation?: boolean;
}

export default function CrownBadge({ 
  tapCount, 
  size = 'medium', 
  onPress,
  showAnimation = true 
}: CrownBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (showAnimation && tapCount > 0) {
      // Pulse animation
      Animated.loop(
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
      ).start();

      // Glow animation
      Animated.loop(
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
      ).start();
    }
  }, [showAnimation, tapCount]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 60, height: 50, borderRadius: 12 },
          crown: { fontSize: 20 },
          count: { fontSize: 14 },
          x: { fontSize: 10 },
        };
      case 'large':
        return {
          container: { width: 100, height: 80, borderRadius: 20 },
          crown: { fontSize: 36 },
          count: { fontSize: 24 },
          x: { fontSize: 14 },
        };
      default: // medium
        return {
          container: { width: 80, height: 65, borderRadius: 16 },
          crown: { fontSize: 28 },
          count: { fontSize: 18 },
          x: { fontSize: 12 },
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const content = (
    <Animated.View 
      style={[
        styles.container, 
        sizeStyles.container,
        { transform: [{ scale: pulseAnim }] }
      ]}
    >
      {/* Glow effect */}
      <Animated.View 
        style={[
          styles.glowEffect,
          sizeStyles.container,
          { opacity: glowAnim }
        ]} 
      />
      
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, sizeStyles.container]}
      >
        <Text style={[styles.crown, { fontSize: sizeStyles.crown.fontSize }]}>👑</Text>
        <View style={styles.countRow}>
          <Text style={[styles.x, { fontSize: sizeStyles.x.fontSize }]}>x</Text>
          <Text style={[styles.count, { fontSize: sizeStyles.count.fontSize }]}>
            {tapCount >= 1000 ? `${(tapCount / 1000).toFixed(1)}k` : tapCount}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  glowEffect: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  crown: {
    marginBottom: -2,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  x: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  count: {
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
