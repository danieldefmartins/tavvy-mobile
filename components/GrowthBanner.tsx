import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// Start Date: Jan 1, 2024 (Arbitrary anchor)
const START_DATE = new Date('2024-01-01T00:00:00').getTime();
const BASE_USERS = 12450; // Starting number
const GROWTH_RATE_PER_MINUTE = 3; // ~4300 new users/day

export default function GrowthBanner() {
  const [count, setCount] = useState(BASE_USERS);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // 1. Calculate initial count based on time elapsed
    const now = Date.now();
    const minutesElapsed = (now - START_DATE) / (1000 * 60);
    const calculatedCount = Math.floor(BASE_USERS + (minutesElapsed * GROWTH_RATE_PER_MINUTE));
    
    setCount(calculatedCount);

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // 2. Start the "Live Ticker"
    // Add a new user every ~20 seconds (randomized slightly)
    const interval = setInterval(() => {
      setCount(prev => prev + 1);
    }, 20000 / GROWTH_RATE_PER_MINUTE); // Adjust speed to match rate

    return () => clearInterval(interval);
  }, []);

  // Format number with commas (e.g., 12,450)
  const formattedCount = count.toLocaleString();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="rocket" size={16} color="white" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>
            Join the movement! 🚀
          </Text>
          <Text style={styles.count}>
            <Text style={styles.bold}>{formattedCount}</Text> users and counting...
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>+1 just now</Text>
        </View>
      </View>
      {/* Progress Bar to 1 Million */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${(count / 1000000) * 100}%` }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937', // Dark gray/black
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  count: {
    color: 'white',
    fontSize: 14,
  },
  bold: {
    fontWeight: 'bold',
    color: Colors.primary, // Highlight the number
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)', // Green tint
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  badgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#374151',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});