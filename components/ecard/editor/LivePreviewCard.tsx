/**
 * LivePreviewCard -- collapsible mini card preview that sits at the top of
 * the eCard editor. Shows a real-time preview of the card as the user edits,
 * reading directly from EditorContext.
 *
 * Features:
 * - Gradient header with profile photo overlay
 * - Name, title, and featured social icons
 * - Collapse/expand with LayoutAnimation + persisted via AsyncStorage
 * - Fade-in transition via react-native-reanimated when card data changes
 * - Tap to navigate to full preview
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEditor } from '../../../lib/ecard/EditorContext';
import { SOCIAL_PLATFORMS } from '../FeaturedSocialsSelector';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#00C853';
const STORAGE_KEY = 'ecard_live_preview_collapsed';
const PREVIEW_HEIGHT = 200;
const COLLAPSED_HEIGHT = 48;
const DEFAULT_GRADIENT_1 = '#1A1A2E';
const DEFAULT_GRADIENT_2 = '#16213E';

// ── Types ────────────────────────────────────────────────────────────────────

interface LivePreviewCardProps {
  isDark: boolean;
  onExpandPreview: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getSocialIcon(platformId: string): { icon: string; color: string } {
  const match = SOCIAL_PLATFORMS.find((p) => p.id === platformId);
  if (match) return { icon: match.icon, color: match.color };
  return { icon: 'link', color: '#9E9E9E' };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LivePreviewCard({
  isDark,
  onExpandPreview,
}: LivePreviewCardProps) {
  const { state } = useEditor();
  const card = state.card;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Reanimated fade value -- pulses on data changes
  const fadeValue = useSharedValue(1);
  const prevDataRef = useRef<string>('');

  // ── Load persisted collapsed state ──────────────────────────────────────

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === 'true') setIsCollapsed(true);
        setStorageLoaded(true);
      })
      .catch(() => setStorageLoaded(true));
  }, []);

  // ── Persist collapsed state ─────────────────────────────────────────────

  const toggleCollapsed = useCallback(() => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        280,
        LayoutAnimation.Types.easeInEaseOut,
        LayoutAnimation.Properties.opacity
      )
    );
    setIsCollapsed((prev) => {
      const next = !prev;
      AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  // ── Fade-in when card data changes ──────────────────────────────────────

  useEffect(() => {
    if (!card) return;

    const dataFingerprint = [
      card.full_name,
      card.title,
      card.company,
      card.profile_photo_url,
      card.gradient_color_1,
      card.gradient_color_2,
      JSON.stringify(card.featured_socials || []),
    ].join('|');

    if (prevDataRef.current && prevDataRef.current !== dataFingerprint) {
      fadeValue.value = 0.6;
      fadeValue.value = withTiming(1, {
        duration: 350,
        easing: Easing.out(Easing.quad),
      });
    }

    prevDataRef.current = dataFingerprint;
  }, [
    card?.full_name,
    card?.title,
    card?.company,
    card?.profile_photo_url,
    card?.gradient_color_1,
    card?.gradient_color_2,
    card?.featured_socials,
    fadeValue,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
  }));

  // ── Theme colors ────────────────────────────────────────────────────────

  const containerBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const borderColor = isDark
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.06)';
  const textPrimary = isDark ? '#FFFFFF' : '#111111';
  const textSecondary = isDark ? '#94A3B8' : '#6B7280';
  const collapsedBg = isDark ? '#0F0F23' : '#F9FAFB';

  // ── Derived card data ───────────────────────────────────────────────────

  const fullName = card?.full_name || '';
  const title = card?.title || '';
  const profilePhoto = card?.profile_photo_url;
  const gradient1 = card?.gradient_color_1 || DEFAULT_GRADIENT_1;
  const gradient2 = card?.gradient_color_2 || DEFAULT_GRADIENT_2;
  const socials = card?.featured_socials || [];

  // Don't render until storage is loaded (prevents flash)
  if (!storageLoaded) return null;

  // ── Collapsed state ─────────────────────────────────────────────────────

  if (isCollapsed) {
    return (
      <View
        style={[
          styles.collapsedContainer,
          {
            backgroundColor: collapsedBg,
            borderColor,
          },
        ]}
      >
        <View style={styles.collapsedContent}>
          {/* Color swatch showing gradient */}
          <LinearGradient
            colors={[gradient1, gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.collapsedSwatch}
          />
          <Text
            style={[styles.collapsedName, { color: textPrimary }]}
            numberOfLines={1}
          >
            {fullName || 'Your Card'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={toggleCollapsed}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.collapsedToggle}
          accessibilityLabel="Show preview"
          accessibilityRole="button"
        >
          <Text style={[styles.collapsedToggleText, { color: ACCENT }]}>
            Show Preview
          </Text>
          <Ionicons name="eye-outline" size={16} color={ACCENT} />
        </TouchableOpacity>
      </View>
    );
  }

  // ── Expanded state ──────────────────────────────────────────────────────

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onExpandPreview}
        accessibilityLabel="Card preview. Tap to open full preview"
        accessibilityRole="button"
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: containerBg,
              borderColor,
            },
          ]}
        >
          {/* Collapse toggle (top-right) */}
          <TouchableOpacity
            onPress={toggleCollapsed}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.toggleButton}
            accessibilityLabel="Hide preview"
            accessibilityRole="button"
          >
            <View
              style={[
                styles.togglePill,
                {
                  backgroundColor: isDark
                    ? 'rgba(0,0,0,0.5)'
                    : 'rgba(255,255,255,0.9)',
                },
              ]}
            >
              <Ionicons
                name="eye-off-outline"
                size={14}
                color={isDark ? '#94A3B8' : '#6B7280'}
              />
            </View>
          </TouchableOpacity>

          {/* Gradient header area */}
          <LinearGradient
            colors={[gradient1, gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            {/* Profile photo */}
            <View style={styles.photoContainer}>
              {profilePhoto ? (
                <Image
                  source={{ uri: profilePhoto }}
                  style={styles.profilePhoto}
                  accessibilityLabel={`${fullName} profile photo`}
                />
              ) : (
                <View
                  style={[
                    styles.profilePhoto,
                    styles.photoPlaceholder,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(255,255,255,0.3)',
                    },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={28}
                    color="rgba(255,255,255,0.6)"
                  />
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Card info area */}
          <View style={styles.infoArea}>
            {/* Name */}
            <Text
              style={[styles.nameText, { color: textPrimary }]}
              numberOfLines={1}
            >
              {fullName || 'Your Name'}
            </Text>

            {/* Title / Company */}
            {(title || card?.company) && (
              <Text
                style={[styles.titleText, { color: textSecondary }]}
                numberOfLines={1}
              >
                {[title, card?.company].filter(Boolean).join(' at ')}
              </Text>
            )}

            {/* Featured social icons */}
            {socials.length > 0 && (
              <View style={styles.socialsRow}>
                {socials.slice(0, 6).map((social, index) => {
                  const { icon, color } = getSocialIcon(social.platform);
                  return (
                    <View
                      key={`${social.platform}-${index}`}
                      style={[styles.socialBubble, { backgroundColor: color }]}
                    >
                      <Ionicons
                        name={icon as any}
                        size={13}
                        color="#FFFFFF"
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Tap hint */}
          <View style={styles.tapHint}>
            <Text style={[styles.tapHintText, { color: textSecondary }]}>
              Tap for full preview
            </Text>
            <Ionicons
              name="expand-outline"
              size={12}
              color={textSecondary}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Expanded ──────────────────────────────────────────────────────────
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gradientHeader: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  photoContainer: {
    position: 'absolute',
    bottom: -32,
    alignSelf: 'center',
    zIndex: 2,
  },
  profilePhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoArea: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  nameText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  socialsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  socialBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: 10,
  },
  tapHintText: {
    fontSize: 11,
    fontWeight: '500',
  },
  toggleButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  togglePill: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  // ── Collapsed ─────────────────────────────────────────────────────────
  collapsedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: COLLAPSED_HEIGHT,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  collapsedSwatch: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 10,
  },
  collapsedName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  collapsedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collapsedToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
