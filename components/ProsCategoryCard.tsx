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
const CARD_WIDTH = (width - 48) / 2;

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
      style={styles.card}
      onPress={() => onPress(slug)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={28} color={color} />
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

interface ProsCategoryListProps {
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    icon: string;
    color: string;
  }>;
  onCategoryPress: (slug: string) => void;
}

export const ProsCategoryGrid: React.FC<ProsCategoryListProps> = ({
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

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: ProsColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: ProsColors.borderLight,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: ProsColors.textPrimary,
    marginBottom: 4,
  },
  count: {
    fontSize: 13,
    color: ProsColors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
});

export default ProsCategoryCard;
