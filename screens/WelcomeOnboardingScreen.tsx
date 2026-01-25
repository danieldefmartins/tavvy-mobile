/**
 * WelcomeOnboardingScreen
 * 5-screen onboarding flow shown after signup to introduce Tavvy's main features
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: string[];
  accentColor: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to Tavvy!',
    subtitle: 'Your Local Discovery Companion',
    description: 'Thank you for joining! Tavvy helps you discover, connect, and explore your community like never before. Let us show you what you can do.',
    icon: 'sparkles',
    gradientColors: ['#1E3A5F', '#0F172A'],
    accentColor: '#3B82F6',
  },
  {
    id: 'universes',
    title: 'Universes',
    subtitle: 'Explore Curated Collections',
    description: 'Discover themed collections of places - from hidden gems to local favorites. Each Universe is a curated journey through your city\'s best spots.',
    icon: 'planet',
    gradientColors: ['#4C1D95', '#1E1B4B'],
    accentColor: '#8B5CF6',
  },
  {
    id: 'pros',
    title: 'Find Local Pros',
    subtitle: 'Trusted Service Professionals',
    description: 'Need a plumber, electrician, or contractor? Connect with verified local professionals. Get quotes, read reviews, and hire with confidence.',
    icon: 'construct',
    gradientColors: ['#065F46', '#064E3B'],
    accentColor: '#10B981',
  },
  {
    id: 'ecards',
    title: 'Digital Business Cards',
    subtitle: 'Your Professional Identity',
    description: 'Create stunning digital business cards in seconds. Share via NFC, QR code, or link. Perfect for networking and growing your business.',
    icon: 'card',
    gradientColors: ['#9D174D', '#831843'],
    accentColor: '#EC4899',
  },
  {
    id: 'more',
    title: 'And So Much More',
    subtitle: 'Realtors • RV & Camping • On The Go',
    description: 'Find your perfect realtor, discover RV parks and campgrounds, or explore mobile businesses near you. Tavvy is your all-in-one local companion.',
    icon: 'apps',
    gradientColors: ['#B45309', '#92400E'],
    accentColor: '#F59E0B',
  },
];

export default function WelcomeOnboardingScreen({ navigation }: any) {
  const { theme } = useThemeContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last slide - go to home
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    // Navigate to Home tab
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

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => {
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
            <Ionicons name={item.icon} size={60} color={item.accentColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>
          <Text style={[styles.subtitle, { color: item.accentColor }]}>{item.subtitle}</Text>

          {/* Description */}
          <Text style={styles.description}>{item.description}</Text>
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
    paddingHorizontal: 40,
    paddingBottom: 180,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 24,
  },
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
