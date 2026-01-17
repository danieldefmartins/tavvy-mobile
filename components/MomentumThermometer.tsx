import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
// Colors are hardcoded for consistency:
// Blue (#0A84FF) = The Good
// Purple (#8B5CF6) = The Vibe  
// Orange (#FF9500) = Heads Up

interface MomentumThermometerProps {
  goodTaps: number;
  vibeTaps: number;
  headsUpTaps: number;
  showLabels?: boolean;
  height?: number;
}

/**
 * MomentumThermometer Component
 * 
 * Displays a horizontal thermometer showing the ratio of:
 * - The Good (green) - positive signals
 * - The Vibe (blue) - neutral/atmosphere signals
 * - Heads Up (orange) - warning signals
 * 
 * The width of each segment is proportional to the tap count.
 */
export default function MomentumThermometer({
  goodTaps,
  vibeTaps,
  headsUpTaps,
  showLabels = true,
  height = 12,
}: MomentumThermometerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const total = goodTaps + vibeTaps + headsUpTaps;
  
  // Calculate percentages
  const goodPercent = total > 0 ? (goodTaps / total) * 100 : 0;
  const vibePercent = total > 0 ? (vibeTaps / total) * 100 : 0;
  const headsUpPercent = total > 0 ? (headsUpTaps / total) * 100 : 0;

  // If no data, show empty state
  if (total === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.emptyBar, { height }]}>
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            No taps yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Thermometer Bar */}
      <View style={[styles.thermometerContainer, { height }]}>
        {/* The Good (Green) */}
        {goodPercent > 0 && (
          <View 
            style={[
              styles.segment,
              styles.segmentGood,
              { 
                width: `${goodPercent}%`,
                borderTopLeftRadius: height / 2,
                borderBottomLeftRadius: height / 2,
                // Round right side if it's the only or last segment
                borderTopRightRadius: vibePercent === 0 && headsUpPercent === 0 ? height / 2 : 0,
                borderBottomRightRadius: vibePercent === 0 && headsUpPercent === 0 ? height / 2 : 0,
              }
            ]} 
          />
        )}
        
        {/* The Vibe (Blue) */}
        {vibePercent > 0 && (
          <View 
            style={[
              styles.segment,
              styles.segmentVibe,
              { 
                width: `${vibePercent}%`,
                // Round left if Good is 0
                borderTopLeftRadius: goodPercent === 0 ? height / 2 : 0,
                borderBottomLeftRadius: goodPercent === 0 ? height / 2 : 0,
                // Round right if HeadsUp is 0
                borderTopRightRadius: headsUpPercent === 0 ? height / 2 : 0,
                borderBottomRightRadius: headsUpPercent === 0 ? height / 2 : 0,
              }
            ]} 
          />
        )}
        
        {/* Heads Up (Orange) */}
        {headsUpPercent > 0 && (
          <View 
            style={[
              styles.segment,
              styles.segmentHeadsUp,
              { 
                width: `${headsUpPercent}%`,
                borderTopRightRadius: height / 2,
                borderBottomRightRadius: height / 2,
                // Round left if it's the only segment
                borderTopLeftRadius: goodPercent === 0 && vibePercent === 0 ? height / 2 : 0,
                borderBottomLeftRadius: goodPercent === 0 && vibePercent === 0 ? height / 2 : 0,
              }
            ]} 
          />
        )}
      </View>

      {/* Labels */}
      {showLabels && (
        <View style={styles.labelsContainer}>
          <View style={styles.labelItem}>
            <View style={[styles.labelDot, { backgroundColor: '#0A84FF' }]} />
            <View style={styles.labelTextContainer}>
              <Text style={[styles.labelTitle, isDark && styles.labelTitleDark]}>
                The Good
              </Text>
              <Text style={[styles.labelValue, isDark && styles.labelValueDark]}>
                ×{goodTaps} taps
              </Text>
            </View>
          </View>
          
          <View style={styles.labelItem}>
            <View style={[styles.labelDot, { backgroundColor: '#8B5CF6' }]} />
            <View style={styles.labelTextContainer}>
              <Text style={[styles.labelTitle, isDark && styles.labelTitleDark]}>
                The Vibe
              </Text>
              <Text style={[styles.labelValue, isDark && styles.labelValueDark]}>
                ×{vibeTaps} taps
              </Text>
            </View>
          </View>
          
          <View style={styles.labelItem}>
            <View style={[styles.labelDot, { backgroundColor: '#FF9500' }]} />
            <View style={styles.labelTextContainer}>
              <Text style={[styles.labelTitle, isDark && styles.labelTitleDark]}>
                Heads Up
              </Text>
              <Text style={[styles.labelValue, isDark && styles.labelValueDark]}>
                ×{headsUpTaps} taps
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  thermometerContainer: {
    flexDirection: 'row',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
  },
  segment: {
    height: '100%',
  },
  segmentGood: {
    backgroundColor: '#0A84FF',  // Apple Blue - The Good
  },
  segmentVibe: {
    backgroundColor: '#8B5CF6',  // Purple - The Vibe
  },
  segmentHeadsUp: {
    backgroundColor: '#FF9500',  // Apple Orange - Heads Up
  },
  emptyBar: {
    width: '100%',
    backgroundColor: '#E5E5EA',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyTextDark: {
    color: '#636366',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  labelTextContainer: {
    alignItems: 'flex-start',
  },
  labelTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  labelTitleDark: {
    color: '#FFFFFF',
  },
  labelValue: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  labelValueDark: {
    color: '#8E8E93',
  },
});
