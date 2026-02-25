/**
 * SectionNavigator -- floating dot navigation on the right edge of the screen.
 * Dots represent each visible editor section. Active dot highlights based on
 * scroll position. Tapping a dot scrolls to that section.
 *
 * React Native port of the web SectionNavigator.tsx.
 * - Uses registerSectionOffset() to track Y positions of each section
 * - Provides onScroll handler for the parent ScrollView
 * - Position: absolute, right edge, vertically centered
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from 'react-native';

const ACCENT = '#00C853';
const DOT_ACTIVE_SIZE = 12;
const DOT_INACTIVE_SIZE = 8;
const HEADER_OFFSET = 60; // approximate header height for scroll calculations

// ── Types ────────────────────────────────────────────────────────────────────

interface SectionDef {
  id: string;
  label: string;
}

interface SectionNavigatorProps {
  sections: SectionDef[];
  scrollViewRef: React.RefObject<ScrollView>;
  isDark: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SectionNavigator({
  sections,
  scrollViewRef,
  isDark,
}: SectionNavigatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionOffsetsRef = useRef<Map<string, number>>(new Map());

  // ── Scroll to section ────────────────────────────────────────────────────

  const scrollToSection = useCallback(
    (index: number) => {
      const section = sections[index];
      if (!section || !scrollViewRef.current) return;

      const offset = sectionOffsetsRef.current.get(section.id);

      if (offset !== undefined) {
        scrollViewRef.current.scrollTo({
          y: Math.max(0, offset - HEADER_OFFSET),
          animated: true,
        });
      } else {
        // Fallback: estimate position based on index.
        // Each collapsed section ~70px, expanded ~300px. Use a conservative average.
        const estimatedOffset = index * 200;
        scrollViewRef.current.scrollTo({
          y: estimatedOffset,
          animated: true,
        });
      }

      setActiveIndex(index);
    },
    [sections, scrollViewRef]
  );

  // ── Theme ────────────────────────────────────────────────────────────────

  const containerBg = isDark
    ? 'rgba(0,0,0,0.6)'
    : 'rgba(255,255,255,0.8)';
  const inactiveDotBg = isDark
    ? 'rgba(255,255,255,0.2)'
    : 'rgba(0,0,0,0.15)';

  // ── Render ───────────────────────────────────────────────────────────────

  if (sections.length <= 1) return null;

  return (
    <View style={styles.outerWrapper} pointerEvents="box-none">
      <View
        style={[styles.container, { backgroundColor: containerBg }]}
        pointerEvents="auto"
      >
        {sections.map((section, index) => {
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity
              key={section.id}
              onPress={() => scrollToSection(index)}
              hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
              accessibilityLabel={`Jump to ${section.label} section`}
              accessibilityRole="button"
              style={styles.dotTouchable}
            >
              <View
                style={[
                  styles.dot,
                  {
                    width: isActive ? DOT_ACTIVE_SIZE : DOT_INACTIVE_SIZE,
                    height: isActive ? DOT_ACTIVE_SIZE : DOT_INACTIVE_SIZE,
                    borderRadius: isActive
                      ? DOT_ACTIVE_SIZE / 2
                      : DOT_INACTIVE_SIZE / 2,
                    backgroundColor: isActive ? ACCENT : inactiveDotBg,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Exported helper ──────────────────────────────────────────────────────────

/**
 * Creates an onScroll handler for the parent ScrollView that updates the
 * active section index based on registered section offsets.
 *
 * Usage in EditorLayout:
 * ```
 * const [activeIndex, setActiveIndex] = useState(0);
 * <ScrollView onScroll={createScrollHandler(sectionOffsets, setActiveIndex, sections)} />
 * ```
 */
export function createScrollHandler(
  sectionOffsets: Map<string, number>,
  setActiveIndex: (index: number) => void,
  sections: SectionDef[]
) {
  return (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    let closestIndex = 0;
    let closestDist = Infinity;

    sections.forEach((section, index) => {
      const offset = sectionOffsets.get(section.id);
      if (offset === undefined) return;
      const dist = Math.abs(offset - scrollY - HEADER_OFFSET);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 50,
  },
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  dotTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  dot: {
    // width, height, borderRadius, backgroundColor set dynamically
  },
});
