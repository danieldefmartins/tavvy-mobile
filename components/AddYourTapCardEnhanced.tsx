import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface AddYourTapCardProps {
  placeId: string;
  placeName: string;
  placeCategory: string;
  onPress: () => void;
  onQuickTap?: (signalId: string, signalName: string) => void;
  hasUserReviewed?: boolean;
  userSignalsCount?: number;
  todayTapCount?: number;
  lastTapTime?: string | null;
  totalTapCount?: number;
  userStreak?: number;
  userBadges?: string[];
  userImpactCount?: number;
}

export default function AddYourTapCardEnhanced({ 
  placeId,
  placeName,
  placeCategory,
  onPress, 
  onQuickTap,
  hasUserReviewed = false,
  userSignalsCount = 0,
  userStreak = 0,
  userImpactCount = 0
}: AddYourTapCardProps) {

  // Quick tap options based on category (simplified logic)
  const getQuickOptions = () => {
    const common = [
      { id: 'good_vibes', label: 'Good Vibes', icon: '✨' },
      { id: 'friendly_staff', label: 'Friendly Staff', icon: '😊' },
      { id: 'clean', label: 'Clean', icon: '🧹' },
    ];
    
    if (placeCategory.toLowerCase().includes('coffee')) {
      return [
        { id: 'great_coffee', label: 'Great Coffee', icon: '☕' },
        { id: 'good_wifi', label: 'Good WiFi', icon: 'wifi' },
        ...common
      ];
    }
    
    return common;
  };

  const quickOptions = getQuickOptions();

  return (
    <View style={styles.container}>
      {/* Header with Gamification Stats */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {hasUserReviewed ? 'Thanks for tapping!' : 'Been here?'}
          </Text>
          <Text style={styles.subtitle}>
            {hasUserReviewed 
              ? 'Your input helps the community.' 
              : 'Share your experience to help others.'}
          </Text>
        </View>
        
        {userStreak > 0 && (
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={16} color="#FF9500" />
            <Text style={styles.streakText}>{userStreak} day streak</Text>
          </View>
        )}
      </View>

      {/* Quick Tap Buttons */}
      {!hasUserReviewed && onQuickTap && (
        <View style={styles.quickTapContainer}>
          <Text style={styles.quickTapTitle}>Quick Tap:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickTapScroll}>
            {quickOptions.map((option) => (
              <TouchableOpacity 
                key={option.id}
                style={styles.quickTapButton}
                onPress={() => onQuickTap(option.id, option.label)}
              >
                <Text style={styles.quickTapIcon}>{option.icon}</Text>
                <Text style={styles.quickTapLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Main CTA Button */}
      <TouchableOpacity 
        style={[styles.button, hasUserReviewed && styles.buttonSecondary]} 
        onPress={onPress}
      >
        <Ionicons 
          name={hasUserReviewed ? "create-outline" : "add-circle"} 
          size={24} 
          color={hasUserReviewed ? Colors.primary : "white"} 
          style={styles.icon} 
        />
        <Text style={[styles.buttonText, hasUserReviewed && styles.buttonTextSecondary]}>
          {hasUserReviewed ? 'Edit Your Review' : 'Write Full Review'}
        </Text>
      </TouchableOpacity>

      {/* Impact Footer */}
      {userImpactCount > 0 && (
        <View style={styles.footer}>
          <Ionicons name="people" size={14} color="#6B7280" />
          <Text style={styles.footerText}>
            Your reviews have helped {userImpactCount} people
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
  },
  quickTapContainer: {
    marginBottom: 20,
  },
  quickTapTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickTapScroll: {
    flexDirection: 'row',
  },
  quickTapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickTapIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  quickTapLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  button: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: '#EFF6FF',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonTextSecondary: {
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});