/**
 * SwipeableCardRow -- iOS-style swipe actions for eCard hub rows.
 *
 * Swipe left  -> Stats (blue) + Delete (red)
 * Swipe right -> Duplicate (gray)
 *
 * Haptic feedback fires on every action tap.
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SwipeableCardRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onStats: () => void;
  onDuplicate: () => void;
  isDark: boolean;
  duplicating?: boolean;
}

const ACTION_WIDTH = 72;

export default function SwipeableCardRow({
  children,
  onDelete,
  onStats,
  onDuplicate,
  isDark,
  duplicating = false,
}: SwipeableCardRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const fireAction = useCallback(
    (callback: () => void) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Small delay so the haptic is perceived before the row closes
      setTimeout(() => {
        swipeableRef.current?.close();
        callback();
      }, 120);
    },
    [],
  );

  // ---- Right actions (revealed on swipe-left): Stats + Delete ----
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const totalWidth = ACTION_WIDTH * 2;

    // Stats button slides in first (closer to content)
    const statsTranslate = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [totalWidth, 0],
      extrapolate: 'clamp',
    });
    const statsOpacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.6, 1],
      extrapolate: 'clamp',
    });

    // Delete button slides in behind Stats
    const deleteTranslate = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [totalWidth, 0],
      extrapolate: 'clamp',
    });
    const deleteOpacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.6, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActionsContainer}>
        {/* Stats */}
        <Animated.View
          style={[
            styles.actionButton,
            styles.statsButton,
            {
              transform: [{ translateX: statsTranslate }],
              opacity: statsOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionTouchable}
            onPress={() => fireAction(onStats)}
            activeOpacity={0.7}
          >
            <Ionicons name="bar-chart" size={22} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Stats</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Delete */}
        <Animated.View
          style={[
            styles.actionButton,
            styles.deleteButton,
            {
              transform: [{ translateX: deleteTranslate }],
              opacity: deleteOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.actionTouchable}
            onPress={() => fireAction(onDelete)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={22} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  // ---- Left actions (revealed on swipe-right): Duplicate ----
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const duplicateTranslate = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-ACTION_WIDTH, 0],
      extrapolate: 'clamp',
    });
    const duplicateOpacity = progress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.6, 1],
      extrapolate: 'clamp',
    });

    const bg = isDark ? '#334155' : '#E5E7EB';
    const iconColor = isDark ? '#E2E8F0' : '#374151';

    return (
      <Animated.View
        style={[
          styles.actionButton,
          styles.duplicateButton,
          {
            backgroundColor: bg,
            transform: [{ translateX: duplicateTranslate }],
            opacity: duplicateOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionTouchable}
          onPress={() => fireAction(onDuplicate)}
          activeOpacity={0.7}
          disabled={duplicating}
        >
          {duplicating ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <Ionicons name="copy" size={22} color={iconColor} />
          )}
          <Text style={[styles.actionLabel, { color: iconColor }]}>
            {duplicating ? 'Copying' : 'Duplicate'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={ACTION_WIDTH * 0.4}
      rightThreshold={ACTION_WIDTH * 0.4}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightActionsContainer: {
    flexDirection: 'row',
    width: ACTION_WIDTH * 2,
  },
  actionButton: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  statsButton: {
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  duplicateButton: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
});
