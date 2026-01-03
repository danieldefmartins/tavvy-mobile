// ============================================
// ENHANCED ADD YOUR TAP CARD - ULTIMATE VERSION
// TavvY's core engagement feature with all enhancements
// ============================================

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// TYPES
// ============================================

interface AddYourTapCardProps {
  placeName: string;
  placeId: string;
  placeCategory: string; // e.g., 'restaurant', 'rv_park', 'coffee_shop', 'hospital'
  onPress: () => void;
  onQuickTap?: (signalId: string, signalName: string) => void;
  hasUserReviewed?: boolean;
  userSignalsCount?: number;
  // Social proof data
  todayTapCount?: number;
  lastTapTime?: string; // e.g., "2 hours ago"
  totalTapCount?: number;
  // Gamification data
  userStreak?: number;
  userTotalTaps?: number;
  userBadges?: string[];
  userImpactCount?: number; // How many people user's taps helped
  // User info
  userId?: string;
}

interface SignalOption {
  id: string;
  icon: string;
  label: string;
  category: 'positive' | 'vibe' | 'warning';
}

interface CategorySignals {
  [key: string]: SignalOption[];
}

// ============================================
// CATEGORY-SPECIFIC SIGNALS
// ============================================

const CATEGORY_SIGNALS: CategorySignals = {
  restaurant: [
    { id: 'great_food', icon: 'restaurant', label: 'Great Food', category: 'positive' },
    { id: 'fast_service', icon: 'flash', label: 'Fast Service', category: 'positive' },
    { id: 'good_portions', icon: 'resize', label: 'Good Portions', category: 'positive' },
    { id: 'family_friendly', icon: 'people', label: 'Family Friendly', category: 'positive' },
    { id: 'cozy', icon: 'cafe', label: 'Cozy', category: 'vibe' },
    { id: 'lively', icon: 'musical-notes', label: 'Lively', category: 'vibe' },
    { id: 'romantic', icon: 'heart', label: 'Romantic', category: 'vibe' },
    { id: 'pricey', icon: 'cash', label: 'Pricey', category: 'warning' },
    { id: 'long_wait', icon: 'time', label: 'Long Wait', category: 'warning' },
    { id: 'hard_parking', icon: 'car', label: 'Hard to Park', category: 'warning' },
  ],
  rv_park: [
    { id: 'level_sites', icon: 'analytics', label: 'Level Sites', category: 'positive' },
    { id: 'clean_bathrooms', icon: 'water', label: 'Clean Bathrooms', category: 'positive' },
    { id: 'good_hookups', icon: 'flash', label: 'Good Hookups', category: 'positive' },
    { id: 'felt_safe', icon: 'shield-checkmark', label: 'Felt Safe', category: 'positive' },
    { id: 'pet_friendly', icon: 'paw', label: 'Pet Friendly', category: 'positive' },
    { id: 'quiet_night', icon: 'moon', label: 'Quiet Night', category: 'vibe' },
    { id: 'scenic_views', icon: 'image', label: 'Scenic Views', category: 'vibe' },
    { id: 'friendly_staff', icon: 'happy', label: 'Friendly Staff', category: 'vibe' },
    { id: 'tight_spaces', icon: 'contract', label: 'Tight Spaces', category: 'warning' },
    { id: 'noisy', icon: 'volume-high', label: 'Noisy', category: 'warning' },
  ],
  coffee_shop: [
    { id: 'great_coffee', icon: 'cafe', label: 'Great Coffee', category: 'positive' },
    { id: 'fast_wifi', icon: 'wifi', label: 'Fast WiFi', category: 'positive' },
    { id: 'good_pastries', icon: 'nutrition', label: 'Good Pastries', category: 'positive' },
    { id: 'friendly_baristas', icon: 'happy', label: 'Friendly Baristas', category: 'positive' },
    { id: 'cozy_vibe', icon: 'home', label: 'Cozy Vibe', category: 'vibe' },
    { id: 'good_music', icon: 'musical-notes', label: 'Good Music', category: 'vibe' },
    { id: 'work_friendly', icon: 'laptop', label: 'Work Friendly', category: 'vibe' },
    { id: 'crowded', icon: 'people', label: 'Crowded', category: 'warning' },
    { id: 'limited_seating', icon: 'remove-circle', label: 'Limited Seating', category: 'warning' },
    { id: 'pricey', icon: 'cash', label: 'Pricey', category: 'warning' },
  ],
  hospital: [
    { id: 'short_wait', icon: 'time', label: 'Short Wait', category: 'positive' },
    { id: 'caring_staff', icon: 'heart', label: 'Caring Staff', category: 'positive' },
    { id: 'clean_facility', icon: 'sparkles', label: 'Clean Facility', category: 'positive' },
    { id: 'easy_parking', icon: 'car', label: 'Easy Parking', category: 'positive' },
    { id: 'clear_signage', icon: 'navigate', label: 'Clear Signage', category: 'vibe' },
    { id: 'comfortable', icon: 'bed', label: 'Comfortable', category: 'vibe' },
    { id: 'long_wait', icon: 'hourglass', label: 'Long Wait', category: 'warning' },
    { id: 'confusing_layout', icon: 'help-circle', label: 'Confusing Layout', category: 'warning' },
  ],
  hotel: [
    { id: 'clean_rooms', icon: 'sparkles', label: 'Clean Rooms', category: 'positive' },
    { id: 'comfy_beds', icon: 'bed', label: 'Comfy Beds', category: 'positive' },
    { id: 'great_breakfast', icon: 'restaurant', label: 'Great Breakfast', category: 'positive' },
    { id: 'friendly_staff', icon: 'happy', label: 'Friendly Staff', category: 'positive' },
    { id: 'quiet', icon: 'moon', label: 'Quiet', category: 'vibe' },
    { id: 'great_views', icon: 'image', label: 'Great Views', category: 'vibe' },
    { id: 'thin_walls', icon: 'volume-high', label: 'Thin Walls', category: 'warning' },
    { id: 'slow_wifi', icon: 'wifi', label: 'Slow WiFi', category: 'warning' },
  ],
  default: [
    { id: 'great_experience', icon: 'thumbs-up', label: 'Great Experience', category: 'positive' },
    { id: 'friendly_staff', icon: 'happy', label: 'Friendly Staff', category: 'positive' },
    { id: 'clean', icon: 'sparkles', label: 'Clean', category: 'positive' },
    { id: 'good_value', icon: 'pricetag', label: 'Good Value', category: 'positive' },
    { id: 'nice_atmosphere', icon: 'sunny', label: 'Nice Atmosphere', category: 'vibe' },
    { id: 'quiet', icon: 'moon', label: 'Quiet', category: 'vibe' },
    { id: 'crowded', icon: 'people', label: 'Crowded', category: 'warning' },
    { id: 'hard_parking', icon: 'car', label: 'Hard to Park', category: 'warning' },
  ],
};

// ============================================
// CONTEXTUAL PROMPTS (Time-based)
// ============================================

const getContextualPrompt = (category: string): { title: string; subtitle: string } => {
  const hour = new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());

  // Time-based prompts
  if (category === 'restaurant') {
    if (hour >= 6 && hour < 11) {
      return { title: 'How was breakfast? ☕', subtitle: 'Share your morning experience' };
    } else if (hour >= 11 && hour < 15) {
      return { title: 'How was lunch? 🍽️', subtitle: 'Help others find a great spot' };
    } else if (hour >= 17 && hour < 22) {
      return { title: 'How was dinner? 🌙', subtitle: 'Share your evening experience' };
    }
  }

  if (category === 'coffee_shop') {
    if (hour >= 6 && hour < 12) {
      return { title: 'Morning coffee hit the spot? ☕', subtitle: 'Rate your caffeine fix' };
    } else if (hour >= 12 && hour < 17) {
      return { title: 'Afternoon pick-me-up? 🧋', subtitle: 'How was your coffee break?' };
    }
  }

  if (isWeekend) {
    return { title: 'Weekend vibes? 🎉', subtitle: 'Share what stood out' };
  }

  // Default prompts
  return { title: 'What Stood Out?', subtitle: 'Tap to share your experience' };
};

// ============================================
// BADGE DEFINITIONS
// ============================================

const BADGES: { [key: string]: { icon: string; label: string; color: string } } = {
  first_tap: { icon: 'ribbon', label: 'First Tap', color: '#FFD700' },
  streak_3: { icon: 'flame', label: '3-Day Streak', color: '#FF6B6B' },
  streak_7: { icon: 'flame', label: 'Week Warrior', color: '#FF4500' },
  streak_30: { icon: 'trophy', label: 'Monthly Master', color: '#9B59B6' },
  top_tapper: { icon: 'star', label: 'Top Tapper', color: '#F1C40F' },
  local_expert: { icon: 'map', label: 'Local Expert', color: '#3498DB' },
  helpful_100: { icon: 'heart', label: 'Super Helpful', color: '#E74C3C' },
};

// ============================================
// MAIN COMPONENT
// ============================================

const AddYourTapCardEnhanced: React.FC<AddYourTapCardProps> = ({
  placeName,
  placeId,
  placeCategory = 'default',
  onPress,
  onQuickTap,
  hasUserReviewed = false,
  userSignalsCount = 0,
  todayTapCount = 0,
  lastTapTime,
  totalTapCount = 0,
  userStreak = 0,
  userTotalTaps = 0,
  userBadges = [],
  userImpactCount = 0,
  userId,
}) => {
  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  // State
  const [showQuickTapModal, setShowQuickTapModal] = useState(false);
  const [selectedQuickTap, setSelectedQuickTap] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Get category-specific signals
  const signals = useMemo(() => {
    return CATEGORY_SIGNALS[placeCategory] || CATEGORY_SIGNALS.default;
  }, [placeCategory]);

  // Get contextual prompt
  const contextualPrompt = useMemo(() => {
    return getContextualPrompt(placeCategory);
  }, [placeCategory]);

  // Animations setup
  useEffect(() => {
    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulseAnimation.start();

    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    return () => pulseAnimation.stop();
  }, []);

  // Handle quick tap
  const handleQuickTap = (signal: SignalOption) => {
    setSelectedQuickTap(signal.id);
    setShowConfetti(true);

    // Confetti animation
    Animated.sequence([
      Animated.timing(confettiAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(confettiAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      setShowConfetti(false);
      if (onQuickTap) {
        onQuickTap(signal.id, signal.label);
      }
      setShowQuickTapModal(false);
      setSelectedQuickTap(null);
    });
  };

  // Get color for signal category
  const getSignalColor = (category: string) => {
    switch (category) {
      case 'positive': return '#007AFF';
      case 'vibe': return '#6B7280';
      case 'warning': return '#F97316';
      default: return '#007AFF';
    }
  };

  // If user has already reviewed
  if (hasUserReviewed) {
    return (
      <Animated.View style={[styles.cardReviewed, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <View style={styles.reviewedHeader}>
            <View style={styles.reviewedIconContainer}>
              <Ionicons name="checkmark-circle" size={32} color="#10b981" />
            </View>
            <View style={styles.reviewedTextContainer}>
              <Text style={styles.reviewedTitle}>You've Tapped! 🎉</Text>
              <Text style={styles.reviewedSubtitle}>
                You added {userSignalsCount} signal{userSignalsCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.updateButton} onPress={onPress}>
              <Text style={styles.updateButtonText}>Update</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Impact Stats */}
          {userImpactCount > 0 && (
            <View style={styles.impactContainer}>
              <Ionicons name="heart" size={16} color="#E74C3C" />
              <Text style={styles.impactText}>
                Your taps helped <Text style={styles.impactNumber}>{userImpactCount}</Text> people this week!
              </Text>
            </View>
          )}

          {/* Streak Display */}
          {userStreak > 0 && (
            <View style={styles.streakContainer}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{userStreak} day streak!</Text>
              {userStreak >= 7 && <Text style={styles.streakBonus}>+2x points</Text>}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <>
      <Animated.View
        style={[
          styles.card,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
            ],
          },
        ]}
      >
        <TouchableOpacity onPress={onPress} activeOpacity={0.95}>
         <View style={[styles.cardGradient, { backgroundColor: '#ffffff' }]}>
            {/* Social Proof Banner */}
            {todayTapCount > 0 && (
              <View style={styles.socialProofBanner}>
                <View style={styles.socialProofItem}>
                  <Text style={styles.socialProofEmoji}>🔥</Text>
                  <Text style={styles.socialProofText}>
                    {todayTapCount} {todayTapCount === 1 ? 'person' : 'people'} tapped today
                  </Text>
                </View>
                {lastTapTime && (
                  <Text style={styles.lastTapText}>Last tap: {lastTapTime}</Text>
                )}
              </View>
            )}

            {/* Header with Contextual Prompt */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.tapIconContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Ionicons name="hand-left" size={28} color="#fff" />
              </Animated.View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{contextualPrompt.title}</Text>
                <Text style={styles.subtitle}>{contextualPrompt.subtitle}</Text>
              </View>
            </View>

            {/* Quick Tap Section */}
            <View style={styles.quickTapSection}>
              <Text style={styles.quickTapLabel}>⚡ Quick Tap</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickTapScroll}
              >
                {signals.slice(0, 4).map((signal) => (
                  <TouchableOpacity
                    key={signal.id}
                    style={[
                      styles.quickTapChip,
                      { 
                        backgroundColor: getSignalColor(signal.category) + '15',
                        borderColor: getSignalColor(signal.category) + '40',
                      },
                    ]}
                    onPress={() => handleQuickTap(signal)}
                  >
                    <Ionicons
                      name={signal.icon as any}
                      size={16}
                      color={getSignalColor(signal.category)}
                    />
                    <Text
                      style={[
                        styles.quickTapChipText,
                        { color: getSignalColor(signal.category) },
                      ]}
                    >
                      {signal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.moreChip}
                  onPress={() => setShowQuickTapModal(true)}
                >
                  <Text style={styles.moreChipText}>+{signals.length - 4} more</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Category Badges */}
            <View style={styles.categoryBadges}>
              <View style={[styles.categoryBadge, styles.categoryBest]}>
                <Text style={styles.categoryBadgeIcon}>👍</Text>
                <Text style={[styles.categoryBadgeText, { color: '#007AFF' }]}>Best For</Text>
              </View>
              <View style={[styles.categoryBadge, styles.categoryVibe]}>
                <Text style={styles.categoryBadgeIcon}>✨</Text>
                <Text style={[styles.categoryBadgeText, { color: '#6B7280' }]}>Vibe</Text>
              </View>
              <View style={[styles.categoryBadge, styles.categoryHeadsUp]}>
                <Text style={styles.categoryBadgeIcon}>⚠️</Text>
                <Text style={[styles.categoryBadgeText, { color: '#F97316' }]}>Heads Up</Text>
              </View>
            </View>

            {/* Gamification: Points Preview */}
            <View style={styles.pointsPreview}>
              <View style={styles.pointsItem}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.pointsText}>+10 pts per tap</Text>
              </View>
              {userStreak > 0 && (
                <View style={styles.pointsItem}>
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.pointsText}>{userStreak} day streak</Text>
                </View>
              )}
              {totalTapCount > 0 && (
                <View style={styles.pointsItem}>
                  <Text style={styles.pointsText}>Be #{totalTapCount + 1} to tap!</Text>
                </View>
              )}
            </View>

            {/* CTA */}
            <View style={styles.ctaContainer}>
              <Text style={styles.ctaText}>Help others know what to expect</Text>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaButtonText}>Add Your Tap</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>

            {/* User Badges Display */}
            {userBadges.length > 0 && (
              <View style={styles.userBadgesContainer}>
                <Text style={styles.userBadgesLabel}>Your Badges:</Text>
                <View style={styles.userBadgesList}>
                  {userBadges.slice(0, 3).map((badgeId) => {
                    const badge = BADGES[badgeId];
                    if (!badge) return null;
                    return (
                      <View
                        key={badgeId}
                        style={[styles.userBadge, { backgroundColor: badge.color + '20' }]}
                      >
                        <Ionicons name={badge.icon as any} size={12} color={badge.color} />
                        <Text style={[styles.userBadgeText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Quick Tap Modal */}
      <Modal
        visible={showQuickTapModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuickTapModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Tap</Text>
              <TouchableOpacity onPress={() => setShowQuickTapModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Tap one signal quickly, or press "Full Review" for more options
            </Text>

            {/* Positive Signals */}
            <Text style={styles.signalCategoryTitle}>👍 Best For</Text>
            <View style={styles.signalGrid}>
              {signals.filter(s => s.category === 'positive').map((signal) => (
                <TouchableOpacity
                  key={signal.id}
                  style={[
                    styles.signalGridItem,
                    selectedQuickTap === signal.id && styles.signalGridItemSelected,
                  ]}
                  onPress={() => handleQuickTap(signal)}
                >
                  <Ionicons name={signal.icon as any} size={24} color="#007AFF" />
                  <Text style={styles.signalGridItemText}>{signal.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Vibe Signals */}
            <Text style={styles.signalCategoryTitle}>✨ Vibe</Text>
            <View style={styles.signalGrid}>
              {signals.filter(s => s.category === 'vibe').map((signal) => (
                <TouchableOpacity
                  key={signal.id}
                  style={[
                    styles.signalGridItem,
                    styles.signalGridItemVibe,
                    selectedQuickTap === signal.id && styles.signalGridItemSelected,
                  ]}
                  onPress={() => handleQuickTap(signal)}
                >
                  <Ionicons name={signal.icon as any} size={24} color="#6B7280" />
                  <Text style={[styles.signalGridItemText, { color: '#6B7280' }]}>
                    {signal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Warning Signals */}
            <Text style={styles.signalCategoryTitle}>⚠️ Heads Up</Text>
            <View style={styles.signalGrid}>
              {signals.filter(s => s.category === 'warning').map((signal) => (
                <TouchableOpacity
                  key={signal.id}
                  style={[
                    styles.signalGridItem,
                    styles.signalGridItemWarning,
                    selectedQuickTap === signal.id && styles.signalGridItemSelected,
                  ]}
                  onPress={() => handleQuickTap(signal)}
                >
                  <Ionicons name={signal.icon as any} size={24} color="#F97316" />
                  <Text style={[styles.signalGridItemText, { color: '#F97316' }]}>
                    {signal.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Full Review Button */}
            <TouchableOpacity
              style={styles.fullReviewButton}
              onPress={() => {
                setShowQuickTapModal(false);
                onPress();
              }}
            >
              <Text style={styles.fullReviewButtonText}>Full Review</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confetti Animation */}
        {showConfetti && (
          <Animated.View
            style={[
              styles.confettiContainer,
              {
                opacity: confettiAnim,
                transform: [
                  {
                    scale: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.2],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.confettiText}>🎉</Text>
            <Text style={styles.confettiMessage}>Tap Added!</Text>
            <Text style={styles.confettiPoints}>+10 points</Text>
          </Animated.View>
        )}
      </Modal>
    </>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Main Card
  card: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },

  // Social Proof Banner
  socialProofBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    marginHorizontal: -20,
    marginTop: -20,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  socialProofItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialProofEmoji: {
    fontSize: 14,
  },
  socialProofText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  lastTapText: {
    fontSize: 11,
    color: '#B45309',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tapIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Quick Tap Section
  quickTapSection: {
    marginBottom: 16,
  },
  quickTapLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickTapScroll: {
    gap: 8,
  },
  quickTapChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  quickTapChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  moreChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  moreChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },

  // Category Badges
  categoryBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  categoryBest: { backgroundColor: '#e3f2fd' },
  categoryVibe: { backgroundColor: '#f3f4f6' },
  categoryHeadsUp: { backgroundColor: '#fff7ed' },
  categoryBadgeIcon: { fontSize: 14 },
  categoryBadgeText: { fontSize: 13, fontWeight: '600' },

  // Points Preview
  pointsPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pointsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    color: '#666',
  },
  streakEmoji: {
    fontSize: 12,
  },

  // CTA
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  // User Badges
  userBadgesContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  userBadgesLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  userBadgesList: {
    flexDirection: 'row',
    gap: 8,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  userBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Reviewed State
  cardReviewed: {
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  reviewedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewedIconContainer: {
    marginRight: 12,
  },
  reviewedTextContainer: {
    flex: 1,
  },
  reviewedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  reviewedSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  impactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
    gap: 6,
  },
  impactText: {
    fontSize: 13,
    color: '#666',
  },
  impactNumber: {
    fontWeight: '700',
    color: '#E74C3C',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F97316',
  },
  streakBonus: {
    fontSize: 11,
    color: '#10b981',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  signalCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
    marginBottom: 10,
  },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  signalGridItem: {
    width: (SCREEN_WIDTH - 60) / 3 - 7,
    aspectRatio: 1,
    backgroundColor: '#e3f2fd',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  signalGridItemVibe: {
    backgroundColor: '#f3f4f6',
  },
  signalGridItemWarning: {
    backgroundColor: '#fff7ed',
  },
  signalGridItemSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  signalGridItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 6,
  },
  fullReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    gap: 8,
  },
  fullReviewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Confetti
  confettiContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  confettiText: {
    fontSize: 60,
  },
  confettiMessage: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  confettiPoints: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 4,
  },
});

export default AddYourTapCardEnhanced;