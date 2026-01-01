import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';

interface TagSelectorProps {
  category: 'bestFor' | 'vibe' | 'headsUp';
  selectedTags: { [tag: string]: number }; // tag name -> tap count (0-3)
  onTagTap: (tag: string) => void;
}

const TAGS = {
  bestFor: [
    'Great Food',
    'Good Coffee',
    'Fast Service',
    'Good Prices',
    'Large Portions',
    'Healthy Options',
  ],
  vibe: [
    'Cozy',
    'Lively',
    'Quiet',
    'Romantic',
    'Family Friendly',
    'Trendy',
  ],
  headsUp: [
    'Slow Service',
    'Expensive',
    'Small Portions',
    'Noisy',
    'Limited Parking',
    'Cash Only',
  ],
};

const COLORS = {
  bestFor: '#3B82F6',
  vibe: '#8B5CF6',
  headsUp: '#F59E0B',
};

const EMOJIS = {
  bestFor: '🔥',
  vibe: '✨',
  headsUp: '⚠️',
};

export default function TagSelector({ category, selectedTags, onTagTap }: TagSelectorProps) {
  const tags = TAGS[category];
  const color = COLORS[category];
  const emoji = EMOJIS[category];

  const getEmoji = (tapCount: number) => {
    if (tapCount === 0) return '';
    if (tapCount === 1) return emoji;
    if (tapCount === 2) return emoji + emoji;
    return emoji + emoji + emoji;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsContainer}
      >
        {tags.map((tag) => {
          const tapCount = selectedTags[tag] || 0;
          const isSelected = tapCount > 0;
          
          return (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tag,
                isSelected && { backgroundColor: color, borderColor: color }
              ]}
              onPress={() => onTagTap(tag)}
            >
              <Text style={[
                styles.tagText,
                isSelected && styles.tagTextSelected
              ]}>
                {tag} {getEmoji(tapCount)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  tagsContainer: {
    paddingHorizontal: 5,
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
});
