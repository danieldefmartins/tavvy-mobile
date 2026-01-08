import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface Tool {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color?: string;
}

const tools: Tool[] = [
  {
    title: 'Quick Finds',
    subtitle: 'Tap your criteria → Tavvy finds places known for that experience.',
    icon: 'flash-outline',
    route: 'QuickFinds',
    color: '#FF9500',
  },
  {
    title: 'Experience Paths',
    subtitle: 'Guided sequences like Date Night, Family Saturday, Moving to a City.',
    icon: 'trail-sign-outline',
    route: 'ExperiencePaths',
    color: '#5856D6',
  },
  {
    title: 'Happening Now',
    subtitle: 'Seasonal + live experiences nearby (events, lights, concerts, games).',
    icon: 'sparkles-outline',
    route: 'HappeningNow',
    color: '#FF2D55',
  },
  {
    title: 'Known For Map Mode',
    subtitle: 'Use the map lens to highlight places known for a chosen experience stamp.',
    icon: 'map-outline',
    route: 'Home', // Links to Home map with lens feature
    color: '#34C759',
  },
  {
    title: 'Pros Matching (B2B)',
    subtitle: 'Find pros by experience delivery + send intent to their Tavvy inbox / webhook.',
    icon: 'briefcase-outline',
    route: 'Pros', // Links to Pros tab
    color: '#007AFF',
  },
];

export default function AppsHomeScreen() {
  const navigation = useNavigation<any>();

  const handleToolPress = (tool: Tool) => {
    // Handle navigation based on route
    if (tool.route === 'Home' || tool.route === 'Pros') {
      // Navigate to other tabs
      navigation.navigate(tool.route);
    } else {
      // Navigate within Apps stack
      navigation.navigate(tool.route);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Apps</Text>
        <Text style={styles.subtitle}>Tools that help you find the right experience – fast.</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.title}
            style={styles.card}
            onPress={() => handleToolPress(tool)}
            activeOpacity={0.9}
          >
            <View style={[styles.iconWrap, { backgroundColor: (tool.color || '#0A84FF') + '15' }]}>
              <Ionicons name={tool.icon} size={24} color={tool.color || '#0A84FF'} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{tool.title}</Text>
              <Text style={styles.cardSub}>{tool.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          </TouchableOpacity>
        ))}

        {/* Coming Soon Section */}
        <View style={styles.comingSoonSection}>
          <Text style={styles.comingSoonTitle}>More Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            We're building more tools to help you discover and share great experiences.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
    fontSize: 15,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: '#666',
    lineHeight: 19,
  },
  comingSoonSection: {
    marginTop: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
});
