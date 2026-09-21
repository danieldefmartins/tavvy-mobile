import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  useReducedMotion
} from 'react-native-reanimated';
// Haptics removed temporarily to prevent crash
// import * as Haptics from 'expo-haptics';


interface PulseCardProps {
  label: string;
  icon: string;
  intensity: number; // 0, 1, 2, 3
  onTap: () => void;
  theme: 'positive' | 'vibe' | 'negative';
  disabled?: boolean;
  isDark?: boolean;
}

export default function PulseCard({ 
  label, 
  icon, 
  intensity, 
  onTap, 
  theme,
  disabled = false,
  isDark = false 
}: PulseCardProps) {
  
  const reduceMotion = useReducedMotion();
  // Animation Values
  const scale = useSharedValue(1);


  // Theme Colors
  const palette = {
    positive: { primary: '#00C2CB', selectedText: '#17013A', title: 'The Good' },
    vibe: { primary: '#8A05BE', selectedText: '#FFFFFF', title: 'The Vibe' },
    negative: { primary: '#F5A623', selectedText: '#17013A', title: 'Heads Up' },
  };
  const themeColors = palette[theme];
  const baseColor = isDark ? '#252532' : '#F2F0F7';
  const baseText = isDark ? '#FFFFFF' : '#17013A';
  
  // Dynamic Styles
  const animatedStyle = useAnimatedStyle(() => {

    return {
      transform: [{ scale: scale.value }],
      backgroundColor: intensity > 0 ? themeColors.primary : baseColor,
      borderColor: intensity > 0 ? themeColors.primary : isDark ? '#777184' : '#82788F',
      borderWidth: 2,
    };
  });

  const handlePress = () => {
    if (disabled && intensity === 0) return;

    // Animation: Bounce Effect
    if (!reduceMotion) scale.value = withSequence(
      withSpring(0.95),
      withSpring(1.05),
      withSpring(1)
    );

    onTap();
  };

  const getIndicator = () => {
    if (intensity === 0) return null;
    
    return (
      <View style={styles.indicatorContainer} accessible={false}>
        <Text style={[styles.indicatorText, { color: themeColors.selectedText }]}>{intensity} / 3 taps</Text>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={styles.touchable}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${themeColors.title}, ${intensity} of 3 taps`}
        accessibilityState={{ selected: intensity > 0, disabled: disabled && intensity === 0 }}
        accessibilityHint={intensity === 3 ? 'Tap to remove this signal.' : 'Tap to increase the intensity.'}
        onPress={handlePress}
        activeOpacity={0.9}
        disabled={disabled && intensity === 0}
      >
        {intensity > 0 && (
          <View style={[styles.checkmark, { backgroundColor: themeColors.selectedText }]}>
            <Text style={[styles.checkmarkText, { color: themeColors.primary }]}>✓</Text>
          </View>
        )}

        <Text style={styles.icon}>{icon}</Text>
        
        <Text style={[
          styles.label, 
          { color: intensity > 0 ? themeColors.selectedText : baseText, fontWeight: intensity > 0 ? '700' : '600' }
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
    minHeight: 170,
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
    paddingTop: 32,
    paddingBottom: 36,
  },
  icon: {
    fontSize: 32,
    marginBottom: 8,
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
    fontSize: 12,
    fontWeight: '700',
  }
});