// ============================================
// TAVVY ENHANCED TAP SYSTEM - REACT HOOKS
// Save this as: hooks/useTapSystem.ts
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';


// ============================================
// TYPES
// ============================================

export interface PlaceTapStats {
  todayTapCount: number;
  totalTapCount: number;
  lastTapTime: string | null;
}

export interface UserGamification {
  totalPoints: number;
  totalTaps: number;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  impactCount: number;
}

export interface TapResult {
  success: boolean;
  newBadges: string[];
  totalPoints: number;
  currentStreak: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Badge definitions
export const BADGES: Record<string, Badge> = {
  first_tap: {
    id: 'first_tap',
    name: 'First Tap',
    description: 'Made your first tap!',
    icon: '🎉',
    color: '#FFD700',
  },
  streak_3: {
    id: 'streak_3',
    name: 'On Fire',
    description: '3 day tap streak!',
    icon: '🔥',
    color: '#FF6B35',
  },
  streak_7: {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7 day tap streak!',
    icon: '⚡',
    color: '#9B59B6',
  },
  streak_30: {
    id: 'streak_30',
    name: 'Tap Legend',
    description: '30 day tap streak!',
    icon: '👑',
    color: '#F1C40F',
  },
  helpful_100: {
    id: 'helpful_100',
    name: 'Helper',
    description: 'Your taps helped 100 people!',
    icon: '💪',
    color: '#3498DB',
  },
  top_tapper: {
    id: 'top_tapper',
    name: 'Top Tapper',
    description: '50+ taps contributed!',
    icon: '🏆',
    color: '#E74C3C',
  },
  local_expert: {
    id: 'local_expert',
    name: 'Local Expert',
    description: 'Tapped 10+ places in one area!',
    icon: '🗺️',
    color: '#27AE60',
  },
  first_to_tap: {
    id: 'first_to_tap',
    name: 'Pioneer',
    description: 'First to tap a new place!',
    icon: '🚀',
    color: '#8E44AD',
  },
};

// ============================================
// HOOK: usePlaceTapStats
// Get social proof stats for a place
// ============================================

export function usePlaceTapStats(placeId: string) {
  const [stats, setStats] = useState<PlaceTapStats>({
    todayTapCount: 0,
    totalTapCount: 0,
    lastTapTime: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!placeId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_place_tap_stats', { p_place_id: placeId });

      if (error) throw error;

      if (data) {
        setStats({
          todayTapCount: data.today_tap_count || 0,
          totalTapCount: data.total_tap_count || 0,
          lastTapTime: data.last_tap_time || null,
        });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching place tap stats:', err);
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

// ============================================
// HOOK: useUserGamification
// Get user's gamification data (points, streaks, badges)
// ============================================

export function useUserGamification() {
  const { user } = useAuth();
  const [gamification, setGamification] = useState<UserGamification>({
    totalPoints: 0,
    totalTaps: 0,
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
    impactCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGamification = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_gamification', { p_user_id: user.id });

      if (error) throw error;

      if (data) {
        setGamification({
          totalPoints: data.total_points || 0,
          totalTaps: data.total_taps || 0,
          currentStreak: data.current_streak || 0,
          longestStreak: data.longest_streak || 0,
          badges: Array.isArray(data.badges) ? data.badges : [],
          impactCount: data.impact_count || 0,
        });
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching user gamification:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchGamification();
  }, [fetchGamification]);

  // Get badge objects for user's badges (with null safety)
  const userBadges = (gamification.badges || [])
    .map(badgeId => BADGES[badgeId])
    .filter(Boolean);

  return { 
    gamification, 
    userBadges,
    loading, 
    error, 
    refetch: fetchGamification 
  };
}

// ============================================
// HOOK: useTap
// Record a tap and get updated stats
// ============================================

export function useTap() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordTap = useCallback(async (
    placeId: string,
    signalId: string,
    signalName: string,
    isQuickTap: boolean = false
  ): Promise<TapResult | null> => {
    if (!user?.id) {
      setError('Must be logged in to tap');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .rpc('record_tap', {
          p_user_id: user.id,
          p_place_id: placeId,
          p_signal_id: signalId,
          p_signal_name: signalName,
          p_is_quick_tap: isQuickTap,
        });

      if (error) throw error;

      return {
        success: data?.success || false,
        newBadges: data?.new_badges || [],
        totalPoints: data?.total_points || 0,
        currentStreak: data?.current_streak || 0,
      };
    } catch (err: any) {
      setError(err.message);
      console.error('Error recording tap:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Quick tap - single signal tap from the card
  const quickTap = useCallback(async (
    placeId: string,
    signalId: string,
    signalName: string
  ) => {
    return recordTap(placeId, signalId, signalName, true);
  }, [recordTap]);

  return { recordTap, quickTap, loading, error };
}

// ============================================
// HOOK: useHasUserTapped
// Check if user has already tapped a place
// ============================================

export function useHasUserTapped(placeId: string) {
  const { user } = useAuth();
  const [hasTapped, setHasTapped] = useState(false);
  const [userSignals, setUserSignals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserTaps = async () => {
      if (!user?.id || !placeId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('tap_activity')
          .select('signal_name')
          .eq('place_id', placeId)
          .eq('user_id', user.id);

        if (error) throw error;

        if (data && data.length > 0) {
          setHasTapped(true);
          setUserSignals(data.map(d => d.signal_name));
        }
      } catch (err) {
        console.error('Error checking user taps:', err);
      } finally {
        setLoading(false);
      }
    };

    checkUserTaps();
  }, [user?.id, placeId]);

  return { hasTapped, userSignals, loading };
}

// ============================================
// HOOK: useContextualPrompt
// Get time-based contextual prompts
// ============================================

export function useContextualPrompt(category: string) {
  const [prompt, setPrompt] = useState<{ text: string; emoji: string }>({
    text: 'What stood out?',
    emoji: '✨',
  });

  useEffect(() => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Time-based prompts
    if (hour >= 6 && hour < 11) {
      // Morning
      if (category === 'restaurant' || category === 'cafe') {
        setPrompt({ text: 'How was breakfast?', emoji: '☕' });
      } else {
        setPrompt({ text: 'Starting your day here?', emoji: '🌅' });
      }
    } else if (hour >= 11 && hour < 14) {
      // Lunch
      if (category === 'restaurant') {
        setPrompt({ text: 'How was lunch?', emoji: '🥗' });
      } else {
        setPrompt({ text: 'Midday visit?', emoji: '☀️' });
      }
    } else if (hour >= 17 && hour < 21) {
      // Dinner
      if (category === 'restaurant') {
        setPrompt({ text: 'How was dinner?', emoji: '🍽️' });
      } else if (category === 'bar') {
        setPrompt({ text: 'Happy hour vibes?', emoji: '🍻' });
      } else {
        setPrompt({ text: 'Evening visit?', emoji: '🌆' });
      }
    } else if (hour >= 21 || hour < 6) {
      // Night
      if (category === 'bar' || category === 'nightclub') {
        setPrompt({ text: 'How\'s the night scene?', emoji: '🌙' });
      } else {
        setPrompt({ text: 'Late night stop?', emoji: '🌃' });
      }
    }

    // Weekend override
    if (isWeekend) {
      if (category === 'restaurant') {
        setPrompt({ text: 'Weekend dining?', emoji: '🎉' });
      } else if (category === 'theme_park' || category === 'attraction') {
        setPrompt({ text: 'Weekend adventure?', emoji: '🎢' });
      }
    }

    // Category-specific defaults
    if (category === 'rv_park') {
      setPrompt({ text: 'How was your stay?', emoji: '🏕️' });
    } else if (category === 'hotel') {
      setPrompt({ text: 'How was your stay?', emoji: '🏨' });
    } else if (category === 'hospital') {
      setPrompt({ text: 'How was your experience?', emoji: '🏥' });
    } else if (category === 'airport') {
      setPrompt({ text: 'How was your journey?', emoji: '✈️' });
    }
  }, [category]);

  return prompt;
}

// ============================================
// UTILITY: Format points with suffix
// ============================================

export function formatPoints(points: number): string {
  if (points >= 1000000) {
    return (points / 1000000).toFixed(1) + 'M';
  }
  if (points >= 1000) {
    return (points / 1000).toFixed(1) + 'K';
  }
  return points.toString();
}

// ============================================
// UTILITY: Get streak message
// ============================================

export function getStreakMessage(streak: number): string {
  if (streak === 0) return '';
  if (streak === 1) return 'Start your streak!';
  if (streak < 3) return `${streak} day streak!`;
  if (streak < 7) return `🔥 ${streak} day streak!`;
  if (streak < 30) return `⚡ ${streak} day streak!`;
  return `👑 ${streak} day streak!`;
}

// ============================================
// UTILITY: Get next badge progress
// ============================================

export function getNextBadgeProgress(gamification: UserGamification): {
  badge: Badge;
  progress: number;
  target: number;
} | null {
  const { totalTaps, currentStreak, impactCount, badges } = gamification;

  // Check streak badges
  if (!badges.includes('streak_3') && currentStreak < 3) {
    return {
      badge: BADGES.streak_3,
      progress: currentStreak,
      target: 3,
    };
  }

  if (!badges.includes('streak_7') && currentStreak < 7) {
    return {
      badge: BADGES.streak_7,
      progress: currentStreak,
      target: 7,
    };
  }

  // Check tap count badges
  if (!badges.includes('top_tapper') && totalTaps < 50) {
    return {
      badge: BADGES.top_tapper,
      progress: totalTaps,
      target: 50,
    };
  }

  // Check impact badges
  if (!badges.includes('helpful_100') && impactCount < 100) {
    return {
      badge: BADGES.helpful_100,
      progress: impactCount,
      target: 100,
    };
  }

  return null;
}

console.log('useTapSystem loaded');
