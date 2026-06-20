import React, { useState, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { fetchLatestActivities } from '../lib/activityService'; // Hypothetical service to fetch activities

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    const getActivities = async () => {
      const latestActivities = await fetchLatestActivities();
      setActivities(latestActivities);
      fadeIn();
    };

    getActivities();
  }, []);

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getBackgroundColor = (type) => {
    switch (type) {
      case 'The Good':
        return styles.theGood;
      case 'The Vibe':
        return styles.theVibe;
      case 'Heads Up':
        return styles.headsUp;
      default:
        return styles.default;
    }
  };

  return (
    <View style={styles.container}>
      {activities.map((activity, index) => (
        <Animated.View key={index} style={[styles.activityItem, getBackgroundColor(activity.type), { opacity: fadeAnim }]}>
          <Text style={styles.activityText}>{activity.message}</Text>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  activityItem: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
  },
  activityText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#17013A',
  },
  theGood: {
    backgroundColor: '#00C2CB',
  },
  theVibe: {
    backgroundColor: '#8A05BE',
  },
  headsUp: {
    backgroundColor: '#F5A623',
  },
  default: {
    backgroundColor: '#FFFFFF',
  },
});

export default ActivityFeed;
