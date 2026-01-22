// =============================================
// QUICK FINDS COMPONENT
// =============================================
// Horizontal scrollable buttons for quick context-based discovery
// Coffee & WiFi, Late Night Eats, Good for Kids, etc.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getQuickFindPresets, QuickFindPreset } from '../lib/storyService';
import { trackQuickFindTap } from '../lib/analyticsService';

interface QuickFindsProps {
  onPresetPress?: (preset: QuickFindPreset) => void;
}

export const QuickFinds: React.FC<QuickFindsProps> = ({ onPresetPress }) => {
  const [presets, setPresets] = useState<QuickFindPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    setIsLoading(true);
    try {
      const data = await getQuickFindPresets();
      setPresets(data);
    } catch (error) {
      console.error('Error loading quick find presets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetPress = async (preset: QuickFindPreset) => {
    setSelectedSlug(preset.slug);
    
    // Track the tap event
    try {
      await trackQuickFindTap(preset.slug, preset.tags);
    } catch (error) {
      console.error('Error tracking quick find tap:', error);
    }
    
    if (onPresetPress) {
      onPresetPress(preset);
    } else {
      // Navigate to Quick Find Results screen
      (navigation as any).navigate('QuickFindResults', {
        tags: preset.tags,
        label: preset.label,
        icon: preset.icon,
      });
    }
    
    // Clear selection after animation
    setTimeout(() => setSelectedSlug(null), 300);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  if (presets.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Quick Finds</Text>
        <Text style={styles.subtitle}>Discover places by vibe</Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {presets.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.presetButton,
              selectedSlug === preset.slug && styles.presetButtonSelected,
            ]}
            onPress={() => handlePresetPress(preset)}
            activeOpacity={0.7}
          >
            <Text style={styles.presetIcon}>{preset.icon}</Text>
            <Text style={[
              styles.presetLabel,
              selectedSlug === preset.slug && styles.presetLabelSelected,
            ]}>
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 10,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  presetButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  presetIcon: {
    fontSize: 16,
  },
  presetLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  presetLabelSelected: {
    color: '#fff',
  },
});

export default QuickFinds;
