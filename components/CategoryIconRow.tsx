// =============================================
// CATEGORY ICON ROW COMPONENT
// =============================================
// Horizontal scrollable icon-based category shortcuts
// Replaces text filter pills with tap-first Tavvy design
// Icons are cleaner, faster to scan, and more "tap-first"

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Category definitions with icons
const CATEGORY_ICONS = [
  { id: 'all', name: 'All', icon: 'apps-outline', activeIcon: 'apps' },
  { id: 'restaurants', name: 'Restaurants', icon: 'restaurant-outline', activeIcon: 'restaurant' },
  { id: 'cafes', name: 'Cafes', icon: 'cafe-outline', activeIcon: 'cafe' },
  { id: 'bars', name: 'Bars', icon: 'beer-outline', activeIcon: 'beer' },
  { id: 'live-music', name: 'Live Music', icon: 'musical-notes-outline', activeIcon: 'musical-notes' },
  { id: 'events', name: 'Events', icon: 'calendar-outline', activeIcon: 'calendar' },
  { id: 'shopping', name: 'Shopping', icon: 'bag-outline', activeIcon: 'bag' },
  { id: 'outdoor', name: 'Outdoor', icon: 'leaf-outline', activeIcon: 'leaf' },
];

// Theme colors
const ACCENT = '#0F8A8A';

interface CategoryIconRowProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  isDark?: boolean;
  theme?: {
    text: string;
    textSecondary: string;
    surface: string;
    background: string;
  };
}

export const CategoryIconRow: React.FC<CategoryIconRowProps> = ({
  selectedCategory,
  onCategorySelect,
  isDark = false,
  theme = {
    text: '#111',
    textSecondary: '#666',
    surface: '#fff',
    background: '#f5f5f5',
  },
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {CATEGORY_ICONS.map((category) => {
          const isActive = selectedCategory.toLowerCase() === category.id || 
                          (category.id === 'all' && selectedCategory === 'All');
          
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.iconButton,
                isActive && styles.iconButtonActive,
                { backgroundColor: isActive ? ACCENT : (isDark ? theme.surface : '#F3F4F6') },
              ]}
              onPress={() => onCategorySelect(category.id === 'all' ? 'All' : category.name)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? category.activeIcon : category.icon}
                size={22}
                color={isActive ? '#fff' : (isDark ? theme.textSecondary : '#6B7280')}
              />
              <Text
                style={[
                  styles.iconLabel,
                  { color: isActive ? '#fff' : (isDark ? theme.textSecondary : '#6B7280') },
                ]}
                numberOfLines={1}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 10,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 70,
  },
  iconButtonActive: {
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  iconLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default CategoryIconRow;
