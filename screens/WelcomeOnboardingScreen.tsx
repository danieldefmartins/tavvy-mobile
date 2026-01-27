/**
 * WelcomeOnboardingScreen v2 - "Experience First"
 * 6-screen onboarding flow that explains what life feels like with Tavvy
 * 
 * Core philosophy: Don't explain features. Explain what life feels like with Tavvy.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  footer?: string;
  bullets?: { emoji: string; text: string }[];
  chips?: string[];
  trustBadges?: string[];
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: string[];
  accentColor: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to Tavvy',
    subtitle: 'Discover places the way people actually experience them.',
    body: 'Find spots you\'ll love — based on real experiences, vibes, and honest heads-ups from the community.',
    icon: 'sparkles',
    gradientColors: ['#1E3A5F', '#0F172A'],
    accentColor: '#3B82F6',
  },
  {
    id: 'difference',
    title: 'No Star Ratings.\nNo Long Reviews.',
    subtitle: 'Just real reactions.',
    body: '',
    bullets: [
      { emoji: '👍', text: 'Did you like it or not?' },
      { emoji: '✨', text: 'What was the vibe?' },
      { emoji: '⚠️', text: 'Any heads-up for others?' },
    ],
    footer: 'Every 20 positive experiences balance out one negative one.',
    icon: 'thumbs-up',
    gradientColors: ['#7C3AED', '#4C1D95'],
    accentColor: '#A78BFA',
  },
  {
    id: 'universes',
    title: 'Universes',
    subtitle: 'Curated experiences, not endless scrolling.',
    body: 'From hidden gems to local favorites — each Universe is a hand-picked journey built around a vibe, a moment, or a lifestyle.',
    chips: ['🍔 Best Late-Night Eats', '🎢 Theme Park Rides', '🏕 RV-Friendly Stops'],
    icon: 'planet',
    gradientColors: ['#4C1D95', '#1E1B4B'],
    accentColor: '#8B5CF6',
  },
  {
    id: 'pros',
    title: 'Find Local Pros\nYou Can Trust',
    subtitle: 'Real feedback. Real people.',
    body: 'Hire plumbers, electricians, and contractors based on real experiences — not paid ads or fake reviews.',
    trustBadges: ['Community-driven', 'No review bombing', 'Experience-weighted feedback'],
    icon: 'construct',
    gradientColors: ['#065F46', '#064E3B'],
    accentColor: '#10B981',
  },
  {
    id: 'ecards',
    title: 'Digital Business Cards',
    subtitle: 'Connect beyond the first contact.',
    body: 'Save trusted pros, share contact info instantly, and keep everything organized — no paper, no hassle.',
    icon: 'card',
    gradientColors: ['#9D174D', '#831843'],
    accentColor: '#EC4899',
  },
  {
    id: 'more',
    title: 'One App.\nMany Ways to Explore.',
    subtitle: 'Realtors • RV & Camping • On The Go',
    body: 'Whether you\'re traveling, moving, or just exploring nearby — Tavvy adapts to how you live.',
    icon: 'apps',
    gradientColors: ['#B45309', '#92400E'],
    accentColor: '#F59E0B',
  },
];

// The review system screen is the soul of Tavvy - Skip should jump here
const REVIEW_SYSTEM_SCREEN_INDEX = 1;

export default function WelcomeOnboardingScreen({ navigation }: any) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    // Skip jumps to the Review System screen (Screen 2) - the soul of Tavvy
    if (currentIndex < REVIEW_SYSTEM_SCREEN_INDEX) {
      flatListRef.current?.scrollToIndex({ index: REVIEW_SYSTEM_SCREEN_INDEX });
      setCurrentIndex(REVIEW_SYSTEM_SCREEN_INDEX);
    } else {
      // If already past review system, go to home
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    return (
      <LinearGradient
        colors={item.gradientColors}
        style={styles.slide}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.slideContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: item.accentColor + '30' }]}>
            <Ionicons name={item.icon} size={56} color={item.accentColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: item.accentColor }]}>{item.subtitle}</Text>

          {/* Body text */}
          {item.body ? (
            <Text style={styles.body}>{item.body}</Text>
          ) : null}

          {/* Bullets (for review system screen) */}
          {item.bullets && (
            <View style={styles.bulletsContainer}>
              {item.bullets.map((bullet, index) => (
                <View key={index} style={styles.bulletRow}>
                  <Text style={styles.bulletEmoji}>{bullet.emoji}</Text>
                  <Text style={styles.bulletText}>{bullet.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Chips (for universes screen) */}
          {item.chips && (
            <View style={styles.chipsContainer}>
              {item.chips.map((chip, index) => (
                <View key={index} style={[styles.chip, { borderColor: item.accentColor + '50' }]}>
                  <Text style={styles.chipText}>{chip}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Trust badges (for pros screen) */}
          {item.trustBadges && (
            <View style={styles.trustBadgesContainer}>
              {item.trustBadges.map((badge, index) => (
                <View key={index} style={styles.trustBadgeRow}>
                  <Ionicons name="checkmark-circle" size={18} color={item.accentColor} />
                  <Text style={styles.trustBadgeText}>{badge}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Footer (for review system screen) */}
          {item.footer && (
            <Text style={styles.footer}>{item.footer}</Text>
          )}
        </View>
      </LinearGradient>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.pagination}>
        {ONBOARDING_SLIDES.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: ONBOARDING_SLIDES[currentIndex].accentColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {renderPagination()}

        <View style={styles.buttonContainer}>
          {!isLastSlide && (
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: ONBOARDING_SLIDES[currentIndex].accentColor },
              isLastSlide && styles.getStartedButton,
            ]}
            onPress={handleNext}
          >
            <Text style={styles.nextText}>
              {isLastSlide ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons
              name={isLastSlide ? 'checkmark' : 'arrow-forward'}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 180,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  body: {
    fontSize: 15,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  // Bullets (review system)
  bulletsContainer: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  bulletEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  bulletText: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  footer: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
  // Chips (universes)
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  chipText: {
    fontSize: 13,
    color: '#E2E8F0',
  },
  // Trust badges (pros)
  trustBadgesContainer: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  trustBadgeText: {
    fontSize: 14,
    color: '#E2E8F0',
    marginLeft: 8,
  },
  // Bottom controls
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingHorizontal: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  skipText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    gap: 8,
  },
  getStartedButton: {
    flex: 1,
    justifyContent: 'center',
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
