/**
 * SignalBar - Universal signal bar component for Tavvy
 * 
 * This component renders signal bars consistently across the entire app.
 * Any change to this component will affect ALL screens that display signals.
 * 
 * Used in: HomeScreen, PlaceDetailsScreen, and any future screens
 * 
 * COLORS (Single source of truth):
 * - The Good (positive): Blue #0A84FF
 * - The Vibe (neutral): Purple #8B5CF6
 * - Heads Up (negative): Orange #FF9500
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============================================
// SIGNAL COLORS - Single source of truth
// Change these to update colors everywhere
// ============================================
export const SIGNAL_COLORS = {
  positive: {
    background: '#0A84FF',  // Blue - The Good
    text: '#FFFFFF',
    icon: '#FFFFFF',
  },
  neutral: {
    background: '#8B5CF6',  // Purple - The Vibe
    text: '#FFFFFF',
    icon: '#FFFFFF',
  },
  negative: {
    background: '#FF9500',  // Orange - Heads Up
    text: '#FFFFFF',
    icon: '#FFFFFF',
  },
};

// ============================================
// EMPTY STATE MESSAGES
// ============================================
export const EMPTY_STATE_MESSAGES = {
  positive: 'No The Good taps yet',
  neutral: 'No The Vibe taps yet',
  negative: 'No Heads Up taps yet',
  default: 'Be the first to tap!',
};

// ============================================
// TYPES
// ============================================
export type SignalType = 'positive' | 'neutral' | 'negative';

interface SignalBarProps {
  label: string;
  tapCount: number;
  type: SignalType;
  icon?: string;
  emoji?: string;
  /** Size variant: 'compact' for HomeScreen cards, 'full' for PlaceDetailsScreen */
  size?: 'compact' | 'full';
  /** Whether this is an empty placeholder (no taps yet) */
  isEmpty?: boolean;
  /** Custom empty state text */
  emptyText?: string;
  /** Whether to show the dropdown chevron */
  showChevron?: boolean;
  /** Whether the dropdown is expanded (controlled externally) */
  isExpanded?: boolean;
  /** Callback when pressed (for external expand control) */
  onPress?: () => void;
  /** Details for expanded view */
  details?: {
    intensity1Count?: number;
    intensity2Count?: number;
    intensity3Count?: number;
    recentTaps?: Array<{
      userName: string;
      date: string;
      intensity: number;
    }>;
  };
}

export default function SignalBar({ 
  label, 
  tapCount, 
  type, 
  icon, 
  emoji,
  size = 'full',
  isEmpty = false,
  emptyText,
  showChevron,
  isExpanded: externalExpanded,
  onPress,
  details,
}: SignalBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  // Use external expanded state if provided, otherwise use internal
  const expanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  
  const colors = SIGNAL_COLORS[type];
  const isCompact = size === 'compact';
  
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'positive':
        return 'thumbs-up';
      case 'neutral':
        return 'sparkles';
      case 'negative':
        return 'warning';
    }
  };
  
  const toggleExpand = () => {
    if (onPress) {
      onPress();
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInternalExpanded(!internalExpanded);
    }
  };

  // Get the display text
  const displayText = isEmpty 
    ? (emptyText || EMPTY_STATE_MESSAGES[type] || EMPTY_STATE_MESSAGES.default)
    : label;

  // Determine if we should show chevron
  const shouldShowChevron = showChevron !== undefined ? showChevron : (details && !isCompact);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          isCompact ? styles.barCompact : styles.barFull,
          { backgroundColor: colors.background },
        ]}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.barContent}>
          {/* Emoji or Icon */}
          {emoji ? (
            <Text style={isCompact ? styles.emojiCompact : styles.emojiFull}>{emoji}</Text>
          ) : (
            <Ionicons 
              name={getIcon() as any} 
              size={isCompact ? 14 : 18} 
              color={colors.icon} 
              style={isCompact ? styles.iconCompact : styles.iconFull} 
            />
          )}
          
          {/* Label */}
          <Text 
            style={[
              isCompact ? styles.labelCompact : styles.labelFull,
              { color: colors.text },
              isEmpty && styles.labelEmpty,
            ]}
            numberOfLines={1}
          >
            {displayText}
          </Text>
          
          {/* Tap Count - only show if not empty */}
          {!isEmpty && (
            <Text style={[
              isCompact ? styles.tapCountCompact : styles.tapCountFull,
              { color: colors.text },
            ]}>
              ×{tapCount}
            </Text>
          )}
        </View>
        
        {/* Chevron */}
        {shouldShowChevron && (
          <Ionicons 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={isCompact ? 16 : 20} 
            color={colors.icon} 
          />
        )}
      </TouchableOpacity>
      
      {/* Expanded Details - only for full size */}
      {expanded && details && !isCompact && (
        <View style={[
          styles.expandedContent, 
          { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5' },
        ]}>
          {/* Intensity Breakdown */}
          {(details.intensity1Count || details.intensity2Count || details.intensity3Count) && (
            <View style={styles.intensitySection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#8E8E93' : '#666' }]}>
                Tap Intensity Breakdown
              </Text>
              <View style={styles.intensityRow}>
                <View style={styles.intensityItem}>
                  <Text style={[styles.intensityDot, { color: colors.background }]}>•</Text>
                  <Text style={[styles.intensityLabel, { color: isDark ? '#FFF' : '#000' }]}>Light</Text>
                  <Text style={[styles.intensityCount, { color: isDark ? '#8E8E93' : '#666' }]}>
                    {details.intensity1Count || 0}
                  </Text>
                </View>
                <View style={styles.intensityItem}>
                  <Text style={[styles.intensityDot, { color: colors.background }]}>••</Text>
                  <Text style={[styles.intensityLabel, { color: isDark ? '#FFF' : '#000' }]}>Medium</Text>
                  <Text style={[styles.intensityCount, { color: isDark ? '#8E8E93' : '#666' }]}>
                    {details.intensity2Count || 0}
                  </Text>
                </View>
                <View style={styles.intensityItem}>
                  <Text style={[styles.intensityDot, { color: colors.background }]}>•••</Text>
                  <Text style={[styles.intensityLabel, { color: isDark ? '#FFF' : '#000' }]}>Strong</Text>
                  <Text style={[styles.intensityCount, { color: isDark ? '#8E8E93' : '#666' }]}>
                    {details.intensity3Count || 0}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Recent Taps */}
          {details.recentTaps && details.recentTaps.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#8E8E93' : '#666' }]}>
                Recent Taps
              </Text>
              {details.recentTaps.slice(0, 3).map((tap, index) => (
                <View key={index} style={styles.recentTapItem}>
                  <View style={[styles.avatar, { backgroundColor: colors.background }]}>
                    <Text style={styles.avatarText}>
                      {tap.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.recentTapInfo}>
                    <Text style={[styles.recentTapUser, { color: isDark ? '#FFF' : '#000' }]}>
                      {tap.userName}
                    </Text>
                    <Text style={[styles.recentTapDate, { color: isDark ? '#8E8E93' : '#666' }]}>
                      {tap.date}
                    </Text>
                  </View>
                  <View style={styles.intensityDots}>
                    {[1, 2, 3].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.intensityDotSmall,
                          { 
                            backgroundColor: i <= tap.intensity 
                              ? colors.background 
                              : (isDark ? '#3A3A3C' : '#DDD'),
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ============================================
// HELPER FUNCTION - Get signal type from bucket name
// ============================================
export function getSignalTypeFromBucket(bucket: string): SignalType {
  const bucketLower = bucket.toLowerCase();
  
  // Check for exact category names first
  if (bucketLower === 'the good' || bucketLower.includes('the good') || bucketLower === 'best_for') {
    return 'positive';
  }
  if (bucketLower === 'the vibe' || bucketLower.includes('the vibe') || bucketLower === 'vibe') {
    return 'neutral';
  }
  if (bucketLower === 'heads up' || bucketLower.includes('heads up') || bucketLower === 'heads_up') {
    return 'negative';
  }
  
  // Fallback to keyword detection
  if (bucketLower.includes('great') || bucketLower.includes('excellent') || 
      bucketLower.includes('amazing') || bucketLower.includes('affordable') ||
      bucketLower.includes('good') || bucketLower.includes('friendly') ||
      bucketLower.includes('fast') || bucketLower.includes('clean') ||
      bucketLower.includes('fresh') || bucketLower.includes('delicious')) {
    return 'positive';
  }
  
  if (bucketLower.includes('pricey') || bucketLower.includes('expensive') || 
      bucketLower.includes('crowded') || bucketLower.includes('loud') ||
      bucketLower.includes('slow') || bucketLower.includes('dirty') ||
      bucketLower.includes('rude') || bucketLower.includes('limited') ||
      bucketLower.includes('wait') || bucketLower.includes('noisy')) {
    return 'negative';
  }
  
  return 'neutral';
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  
  // Full size bar (PlaceDetailsScreen)
  barFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // Compact bar (HomeScreen cards)
  barCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  
  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  // Icons
  iconFull: {
    marginRight: 10,
  },
  iconCompact: {
    marginRight: 8,
  },
  
  // Emojis
  emojiFull: {
    fontSize: 18,
    marginRight: 10,
  },
  emojiCompact: {
    fontSize: 14,
    marginRight: 8,
  },
  
  // Labels
  labelFull: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  labelCompact: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  labelEmpty: {
    fontStyle: 'italic',
    opacity: 0.9,
  },
  
  // Tap counts
  tapCountFull: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  tapCountCompact: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  
  // Expanded content
  expandedContent: {
    marginTop: 4,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  intensitySection: {
    marginBottom: 16,
  },
  intensityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityItem: {
    alignItems: 'center',
    flex: 1,
  },
  intensityDot: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  intensityLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  intensityCount: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  recentSection: {},
  recentTapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recentTapInfo: {
    flex: 1,
  },
  recentTapUser: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentTapDate: {
    fontSize: 12,
  },
  intensityDots: {
    flexDirection: 'row',
    gap: 4,
  },
  intensityDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
