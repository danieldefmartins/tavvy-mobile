import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Colors } from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// User level calculation based on points
const getUserLevel = (points: number) => {
  if (points >= 10000) return { level: 'Tavvy Legend', icon: '👑', color: '#FFD700', nextLevel: null, progress: 1 };
  if (points >= 5000) return { level: 'Tavvy Master', icon: '⭐', color: '#9333EA', nextLevel: 'Legend', progress: (points - 5000) / 5000 };
  if (points >= 2000) return { level: 'Tavvy Expert', icon: '🔥', color: '#F97316', nextLevel: 'Master', progress: (points - 2000) / 3000 };
  if (points >= 500) return { level: 'Tavvy Explorer', icon: '🧭', color: '#3B82F6', nextLevel: 'Expert', progress: (points - 500) / 1500 };
  if (points >= 100) return { level: 'Tavvy Starter', icon: '🌱', color: '#10B981', nextLevel: 'Explorer', progress: (points - 100) / 400 };
  return { level: 'Newcomer', icon: '👋', color: '#94A3B8', nextLevel: 'Starter', progress: points / 100 };
};

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    taps: 0,
    reviews: 0,
    savedPlaces: 0,
    points: 0,
    badges: 0,
    streak: 0,
  });
  const [memberSince, setMemberSince] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchUserStats();
      // Format member since date
      if (user.created_at) {
        const date = new Date(user.created_at);
        setMemberSince(date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
      }
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      if (!user) return;
      
      // Fetch taps count
      const { count: tapsCount } = await supabase
        .from('place_review_signal_taps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch saved places count
      const { count: savedCount } = await supabase
        .from('user_saved_places')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch reviews count
      const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch gamification data
      const { data: gamificationData } = await supabase
        .rpc('get_user_gamification', { p_user_id: user.id });

      setStats({
        taps: tapsCount || 0,
        reviews: reviewsCount || 0,
        savedPlaces: savedCount || 0,
        points: gamificationData?.total_points || 0,
        badges: Array.isArray(gamificationData?.badges) ? gamificationData.badges.length : 0,
        streak: gamificationData?.current_streak || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const userLevel = getUserLevel(stats.points);

  // 1. NOT LOGGED IN STATE
  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0F1233', '#1E293B']}
          style={styles.guestGradient}
        >
          <View style={styles.guestContent}>
            <View style={styles.guestHeader}>
              <Image 
                source={require('../assets/brand/logo-full.png')} 
                style={styles.guestLogo}
                resizeMode="contain"
              />
              <Text style={styles.guestTitle}>Welcome to Tavvy</Text>
              <Text style={styles.guestSubtitle}>
                A savvy way of tapping. Discover and share the vibe of places around you.
              </Text>
            </View>

            <View style={styles.guestButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.primaryButtonText}>Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('SignUp')}
              >
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // 2. LOGGED IN STATE
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Profile Card with Gradient */}
      <LinearGradient
        colors={['#0F1233', '#1E293B']}
        style={styles.profileHeader}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[userLevel.color, '#3B82F6']}
            style={styles.avatarGradient}
          >
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </LinearGradient>
          {/* Level Badge */}
          <View style={[styles.levelBadge, { backgroundColor: userLevel.color }]}>
            <Text style={styles.levelBadgeText}>{userLevel.icon}</Text>
          </View>
        </View>

        {/* User Info */}
        <Text style={styles.userName}>
          {user.user_metadata?.full_name || 'Tavvy Explorer'}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        
        {/* Level Info */}
        <View style={styles.levelContainer}>
          <Text style={[styles.levelText, { color: userLevel.color }]}>
            {userLevel.level}
          </Text>
          {userLevel.nextLevel && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${userLevel.progress * 100}%`, backgroundColor: userLevel.color }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(userLevel.progress * 100)}% to {userLevel.nextLevel}
              </Text>
            </View>
          )}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity 
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil" size={14} color="#FFFFFF" />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="finger-print" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.taps}</Text>
            <Text style={styles.statLabel}>Taps</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
              <Ionicons name="bookmark" size={24} color="#F97316" />
            </View>
            <Text style={styles.statValue}>{stats.savedPlaces}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="star" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.reviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(147, 51, 234, 0.15)' }]}>
              <Ionicons name="trophy" size={24} color="#9333EA" />
            </View>
            <Text style={styles.statValue}>{stats.points}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <Ionicons name="ribbon" size={24} color="#EC4899" />
            </View>
            <Text style={styles.statValue}>{stats.badges}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="flame" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Account Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>Account Information</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#64748B" />
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>{memberSince || 'N/A'}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" />
          <Text style={styles.infoLabel}>Account Type</Text>
          <Text style={styles.infoValue}>Free</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#64748B" />
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>United States</Text>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="settings-outline" size={22} color="#3B82F6" />
          </View>
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
            <Ionicons name="notifications-outline" size={22} color="#F97316" />
          </View>
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('MyDigitalCard')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Ionicons name="card-outline" size={22} color="#10B981" />
          </View>
          <Text style={styles.menuText}>My Digital Card</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(147, 51, 234, 0.1)' }]}>
            <Ionicons name="help-circle-outline" size={22} color="#9333EA" />
          </View>
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: 'rgba(100, 116, 139, 0.1)' }]}>
            <Ionicons name="document-text-outline" size={22} color="#64748B" />
          </View>
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#EF4444" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Guest Styles
  guestGradient: {
    flex: 1,
  },
  guestContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%',
  },
  guestHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  guestLogo: {
    width: 180,
    height: 120,
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  guestButtons: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Logged In Styles
  profileHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 4,
  },
  avatarInner: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0F1233',
  },
  levelBadgeText: {
    fontSize: 16,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Stats Cards
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    marginLeft: 12,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },

  // Menu Container
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },

  // Sign Out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#94A3B8',
    fontSize: 12,
  },
});
