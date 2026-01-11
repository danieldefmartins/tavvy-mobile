import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius } from '../constants/Colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SignalBarProps {
  label: string;
  tapCount: number;
  type: 'positive' | 'neutral' | 'negative';
  icon?: string;
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

export default function SignalBar({ label, tapCount, type, icon, details }: SignalBarProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'positive':
        return theme.signalPros;      // Green - positive signals
      case 'neutral':
        return theme.signalUniverse;  // Blue - context/universe signals
      case 'negative':
        return theme.signalCons;      // Amber - warning/cons signals
    }
  };
  
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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.bar, { backgroundColor: getBackgroundColor() }]}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.barContent}>
          <Ionicons name={getIcon() as any} size={18} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.tapCount}>×{tapCount}</Text>
        </View>
        <Ionicons 
          name={expanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      
      {expanded && details && (
        <View style={[styles.expandedContent, { backgroundColor: theme.surface }]}>
          {/* Intensity Breakdown */}
          {(details.intensity1Count || details.intensity2Count || details.intensity3Count) && (
            <View style={styles.intensitySection}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Tap Intensity Breakdown
              </Text>
              <View style={styles.intensityRow}>
                <View style={styles.intensityItem}>
                  <Text style={[styles.intensityDot, { color: getBackgroundColor() }]}>•</Text>
                  <Text style={[styles.intensityLabel, { color: theme.text }]}>Light</Text>
                  <Text style={[styles.intensityCount, { color: theme.textSecondary }]}>
                    {details.intensity1Count || 0}
                  </Text>
                </View>
                <View style={styles.intensityItem}>
                  <Text style={[styles.intensityDot, { color: getBackgroundColor() }]}>••</Text>
                  <Text style={[styles.intensityLabel, { color: theme.text }]}>Medium</Text>
                  <Text style={[styles.intensityCount, { color: theme.textSecondary }]}>
                    {details.intensity2Count || 0}
                  </Text>
                </View>
                <View style={styles.intensityItem}>
                  <Text style={[styles.intensityDot, { color: getBackgroundColor() }]}>•••</Text>
                  <Text style={[styles.intensityLabel, { color: theme.text }]}>Strong</Text>
                  <Text style={[styles.intensityCount, { color: theme.textSecondary }]}>
                    {details.intensity3Count || 0}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          {/* Recent Taps */}
          {details.recentTaps && details.recentTaps.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Recent Taps
              </Text>
              {details.recentTaps.slice(0, 3).map((tap, index) => (
                <View key={index} style={styles.recentTapItem}>
                  <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarText}>
                      {tap.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.recentTapInfo}>
                    <Text style={[styles.recentTapUser, { color: theme.text }]}>
                      {tap.userName}
                    </Text>
                    <Text style={[styles.recentTapDate, { color: theme.textSecondary }]}>
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
                              ? getBackgroundColor() 
                              : theme.border 
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

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing.sm,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  tapCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
  },
  expandedContent: {
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  intensitySection: {
    marginBottom: spacing.md,
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
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
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
