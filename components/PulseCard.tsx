import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withTiming,
  interpolateColor,
  useDerivedValue
} from 'react-native-reanimated';
// Haptics removed temporarily to prevent crash
// import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/Colors';

interface PulseCardProps {
  label: string;
  icon: string;
  intensity: number; // 0, 1, 2, 3
  onTap: () => void;
  theme: 'positive' | 'vibe' | 'negative';
  disabled?: boolean;
}

export default function PulseCard({ 
  label, 
  icon, 
  intensity, 
  onTap, 
  theme,
  disabled = false 
}: PulseCardProps) {
  
  // Animation Values
  const scale = useSharedValue(1);
  const progress = useDerivedValue(() => {
    return withTiming(intensity > 0 ? 1 : 0, { duration: 300 });
  }, [intensity]);

  // Theme Colors
  const themeColors = Colors[theme];
  
  // Dynamic Styles
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#F3F4F6', themeColors.light]
    );

    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', themeColors.primary]
    );

    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
      borderWidth: intensity > 0 ? 2 : 0,
    };
  });

  const handlePress = () => {
    if (disabled && intensity === 0) return;

    // Animation: Bounce Effect
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1.05),
      withSpring(1)
    );

    onTap();
  };

  const getIndicator = () => {
    if (intensity === 0) return null;
    
    const symbol = theme === 'negative' ? '😢' : '🔥';
    const count = intensity; // 1, 2, or 3
    
    return (
      <View style={styles.indicatorContainer}>
        <Text style={styles.indicatorText}>
          {Array(count).fill(symbol).join('')}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={disabled && intensity === 0}
      >
        {intensity > 0 && (
          <View style={[styles.checkmark, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}

        <Text style={styles.icon}>{icon}</Text>
        
        <Text style={[
          styles.label, 
          intensity > 0 && { color: themeColors.text, fontWeight: '700' }
        ]}>
          {label}
        </Text>

        {getIndicator()}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  touchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
  },
  indicatorText: {
    fontSize: 16,
    letterSpacing: 2,
  }
});