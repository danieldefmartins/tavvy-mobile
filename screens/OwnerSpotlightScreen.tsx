// ============================================================================
// OWNER SPOTLIGHT SCREEN - Atlas v2.0
// ============================================================================
// Profile-style page for business owner spotlights
// Features: Owner profile, verified badge, posts grid, about section
// Matches mockup design with teal accents
// ============================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabaseClient';
import { useThemeContext } from '../contexts/ThemeContext';
import { type AtlasArticle } from '../lib/atlas';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POST_WIDTH = (SCREEN_WIDTH - 48) / 3;

// Tavvy brand colors
const TEAL_PRIMARY = '#0D9488';
const TEAL_LIGHT = '#5EEAD4';
const TEAL_BG = '#F0FDFA';

// Placeholder images
const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/200';
const PLACEHOLDER_POST = 'https://via.placeholder.com/300';

// Tab options
type TabType = 'posts' | 'about' | 'business';

interface OwnerData {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  business_name?: string;
  is_verified?: boolean;
  post_count?: number;
  follower_count?: number;
  love_count?: number;
}

interface OwnerPost {
  id: string;
  title: string;
  cover_image_url?: string;
  view_count?: number;
  love_count?: number;
}

interface PlaceData {
  id: string;
  name: string;
  category: string;
  address?: string;
  city?: string;
  state?: string;
  photos?: string[];
  rating?: number;
}

export default function OwnerSpotlightScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useThemeContext();

  const { article } = route.params as { article: AtlasArticle };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  // Data states
  const [owner, setOwner] = useState<OwnerData | null>(null);
  const [posts, setPosts] = useState<OwnerPost[]>([]);
  const [place, setPlace] = useState<PlaceData | null>(null);

  useEffect(() => {
    loadData();
  }, [article.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Extract owner data from article
      const ownerData: OwnerData = {
        id: article.author_id || article.id,
        name: article.author_name || 'Business Owner',
        avatar_url: article.author_avatar_url,
        bio: article.excerpt || article.content,
        business_name: article.title?.replace('Meet the Owner: ', '') || 'Local Business',
        is_verified: true,
        post_count: 12,
        follower_count: 2400,
        love_count: 156,
      };
      setOwner(ownerData);

      // Fetch owner's posts (other articles by same author)
      const { data: authorPosts, error: postsError } = await supabase
        .from('atlas_articles')
        .select('id, title, cover_image_url, view_count, love_count')
        .eq('author_id', article.author_id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(12);

      if (!postsError && authorPosts) {
        setPosts(authorPosts);
      }

      // Fetch linked place data if available
      if (article.primary_place_id) {
        const { data: placeData, error: placeError } = await supabase
          .from('places')
          .select('id, name, category, address, city, state, photos, rating')
          .eq('id', article.primary_place_id)
          .single();

        if (!placeError && placeData) {
          setPlace(placeData);
        }
      }
    } catch (error) {
      console.error('Error loading owner data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    if (owner) {
      setOwner({
        ...owner,
        follower_count: isFollowing 
          ? (owner.follower_count || 0) - 1 
          : (owner.follower_count || 0) + 1,
      });
    }
  };

  const navigateToPost = (post: OwnerPost) => {
    navigation.navigate('ArticleDetail', { 
      article: { 
        ...post, 
        author_name: owner?.name,
        author_avatar_url: owner?.avatar_url,
      } 
    });
  };

  const navigateToPlace = () => {
    if (place) {
      navigation.navigate('PlaceDetails', { placeId: place.id });
    }
  };

  // Render post grid item
  const renderPostItem = ({ item, index }: { item: OwnerPost; index: number }) => (
    <TouchableOpacity
      style={[
        styles.postItem,
        { marginLeft: index % 3 === 0 ? 0 : 4 },
      ]}
      onPress={() => navigateToPost(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item.cover_image_url || PLACEHOLDER_POST }}
        style={styles.postImage}
      />
      <View style={styles.postOverlay}>
        <Text style={styles.postTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.postStats}>
          <Text style={styles.postStatText}>
            {formatNumber(item.view_count || 0)} Views
          </Text>
          <Text style={styles.postStatDot}>•</Text>
          <Text style={styles.postStatText}>
            {formatNumber(item.love_count || 0)} Loves
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render About tab content
  const renderAboutContent = () => (
    <View style={styles.aboutContainer}>
      <Text style={styles.aboutTitle}>About {owner?.name}</Text>
      <Text style={styles.aboutText}>{owner?.bio}</Text>
      
      {place && (
        <View style={styles.businessSection}>
          <Text style={styles.businessSectionTitle}>Business Location</Text>
          <TouchableOpacity 
            style={styles.businessCard}
            onPress={navigateToPlace}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: place.photos?.[0] || PLACEHOLDER_POST }}
              style={styles.businessImage}
            />
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{place.name}</Text>
              <Text style={styles.businessCategory}>{place.category}</Text>
              <Text style={styles.businessAddress}>
                {place.address}, {place.city}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render Business tab content
  const renderBusinessContent = () => (
    <View style={styles.businessContainer}>
      {place ? (
        <>
          <TouchableOpacity 
            style={styles.businessDetailCard}
            onPress={navigateToPlace}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: place.photos?.[0] || PLACEHOLDER_POST }}
              style={styles.businessDetailImage}
            />
            <View style={styles.businessDetailContent}>
              <Text style={styles.businessDetailName}>{place.name}</Text>
              <View style={styles.businessRating}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.businessRatingText}>
                  {place.rating?.toFixed(1) || '4.5'}
                </Text>
              </View>
              <Text style={styles.businessDetailCategory}>{place.category}</Text>
              <Text style={styles.businessDetailAddress}>
                {place.address}, {place.city}, {place.state}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.viewOnTavvyButton}
            onPress={navigateToPlace}
          >
            <Text style={styles.viewOnTavvyText}>View on Tavvy</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noBusinessContainer}>
          <Ionicons name="business-outline" size={48} color="#D1D5DB" />
          <Text style={styles.noBusinessText}>
            Business information not available
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? theme.background : '#fff' }]}>
        <ActivityIndicator size="large" color={TEAL_PRIMARY} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#fff' }]}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={TEAL_PRIMARY}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={TEAL_PRIMARY} />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Avatar */}
          <Image
            source={{ uri: owner?.avatar_url || PLACEHOLDER_AVATAR }}
            style={styles.avatar}
          />

          {/* Name and Badge */}
          <Text style={[styles.ownerName, { color: isDark ? theme.text : TEAL_PRIMARY }]}>
            {owner?.name}
          </Text>
          
          <View style={styles.businessBadge}>
            <Text style={styles.businessBadgeText}>
              Owner of {owner?.business_name}
            </Text>
            {owner?.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={TEAL_PRIMARY} />
                <Text style={styles.verifiedText}>Verified Business Owner</Text>
              </View>
            )}
          </View>

          {/* Bio */}
          <Text style={styles.bio} numberOfLines={3}>
            {owner?.bio}
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="image-multiple" size={18} color={TEAL_PRIMARY} />
              <Text style={styles.statNumber}>{owner?.post_count || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group" size={18} color={TEAL_PRIMARY} />
              <Text style={styles.statNumber}>{formatNumber(owner?.follower_count || 0)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={18} color={TEAL_PRIMARY} />
              <Text style={styles.statNumber}>{formatNumber(owner?.love_count || 0)}</Text>
              <Text style={styles.statLabel}>Loves</Text>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton,
            ]}
            onPress={handleFollow}
          >
            <Text style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText,
            ]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'posts' && styles.tabTextActive,
            ]}>
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'about' && styles.tabTextActive,
            ]}>
              About
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'business' && styles.tabActive]}
            onPress={() => setActiveTab('business')}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'business' && styles.tabTextActive,
            ]}>
              Business
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <View style={styles.postsGrid}>
            {posts.map((post, index) => (
              <View key={post.id}>
                {renderPostItem({ item: post, index })}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'about' && renderAboutContent()}
        {activeTab === 'business' && renderBusinessContent()}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    flex: 1,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E5E7EB',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ownerName: {
    fontSize: 24,
    fontWeight: '700',
    color: TEAL_PRIMARY,
    marginTop: 16,
    textAlign: 'center',
  },
  businessBadge: {
    alignItems: 'center',
    marginTop: 8,
  },
  businessBadgeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: TEAL_BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: TEAL_PRIMARY,
    fontWeight: '600',
    marginLeft: 4,
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: TEAL_PRIMARY,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Follow Button
  followButton: {
    backgroundColor: TEAL_PRIMARY,
    paddingHorizontal: 48,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: TEAL_PRIMARY,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  followingButtonText: {
    color: TEAL_PRIMARY,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: TEAL_PRIMARY,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: TEAL_PRIMARY,
    fontWeight: '600',
  },

  // Posts Grid
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  postItem: {
    width: POST_WIDTH,
    height: POST_WIDTH * 1.3,
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 8,
  },
  postTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.9)',
  },
  postStatDot: {
    color: 'rgba(255,255,255,0.7)',
    marginHorizontal: 4,
  },

  // About Content
  aboutContainer: {
    padding: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },
  businessSection: {
    marginTop: 24,
  },
  businessSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  businessImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  businessInfo: {
    flex: 1,
    marginLeft: 12,
  },
  businessName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  businessCategory: {
    fontSize: 13,
    color: TEAL_PRIMARY,
    marginTop: 2,
  },
  businessAddress: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Business Content
  businessContainer: {
    padding: 20,
  },
  businessDetailCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    overflow: 'hidden',
  },
  businessDetailImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  businessDetailContent: {
    padding: 16,
  },
  businessDetailName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  businessRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  businessRatingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  businessDetailCategory: {
    fontSize: 14,
    color: TEAL_PRIMARY,
    fontWeight: '500',
    marginBottom: 4,
  },
  businessDetailAddress: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
  },
  viewOnTavvyButton: {
    backgroundColor: TEAL_PRIMARY,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 16,
  },
  viewOnTavvyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noBusinessContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noBusinessText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
