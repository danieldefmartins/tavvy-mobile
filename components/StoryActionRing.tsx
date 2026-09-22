import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * "A story is waiting" ring for the place action row: the Tavvy logo colours slowly rotating
 * around the icon circle (mirrors `.story-ring` on the web place page). `StoryRing` (avatars in
 * the stories row) is a different component.
 */
export default function StoryActionRing({ background, children, size = 56 }: { background: string; children: React.ReactNode; size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', margin: -3 }}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <LinearGradient colors={['#00AAB4', '#8A05BE', '#58D9DE', '#00AAB4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: size / 2 }} />
      </Animated.View>
      <View style={{ width: size - 6, height: size - 6, borderRadius: (size - 6) / 2, backgroundColor: background, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}
