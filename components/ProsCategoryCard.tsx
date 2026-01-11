/**
 * Pros Category Card Component
 * Install path: components/ProsCategoryCard.tsx
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProsColors } from '../constants/ProsConfig';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 100; // Fixed width for horizontal scroll

interface ProsCategoryCardProps {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
  onPress: (slug: string) => void;
  providerCount?: number;
}

export const ProsCategoryCard: React.FC<ProsCategoryCardProps> = ({
  name,
  slug,
  icon,
  color,
  onPress,
  providerCount,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, { borderBottomColor: color }]}
      onPress={() => onPress(slug)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={36} color={color} />
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      {providerCount !== undefined && (
        <Text style={styles.count}>
          {providerCount} {providerCount === 1 ? 'pro' : 'pros'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

interface ProsCategoryGridProps {
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
  }>;
  onCategoryPress: (slug: string) => void;
}

export const ProsCategoryGrid: React.FC<ProsCategoryGridProps> = ({
  categories,
  onCategoryPress,
}) => {
  return (
    <View style={styles.grid}>
      {categories.map((category) => (
        <ProsCategoryCard
          key={category.id}
          {...category}
          onPress={onCategoryPress}
        />
      ))}
    </View>
  );
};

// Horizontal scroll version for the mockup
export const ProsCategoryScroll: React.FC<ProsCategoryGridProps> = ({
  categories,
  onCategoryPress,
}) => {
  return (
    <View style={styles.scrollContainer}>
      {categories.map((category) => (
        <ProsCategoryCard
          key={category.id}
          {...category}
          onPress={onCategoryPress}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: ProsColors.cardBg,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
    borderBottomWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  count: {
    fontSize: 11,
    color: ProsColors.textSecondary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  scrollContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
});

export default ProsCategoryCard;
