// ============================================================================
// ARTICLE DETAIL SCREEN v2.0
// ============================================================================
// Full article reading experience with block-based content
// Matches mockup design with author info, place cards, and content blocks
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabaseClient';
import { useThemeContext } from '../contexts/ThemeContext';
import {
  getRelatedArticles,
  getUserReaction,
  addReaction,
  removeReaction,
  isArticleSaved,
  saveArticle,
  unsaveArticle,
  getArticleBySlug,
  type AtlasArticle,
  type ArticleReaction,
} from '../lib/atlas';
import { ContentBlockRenderer, ContentBlock } from '../components/atlas';
import { getCoverImageUrl, getThumbnailUrl } from '../lib/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tavvy brand colors
const TEAL_PRIMARY = '#0D9488';
const TEAL_LIGHT = '#5EEAD4';

// Placeholder images
const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/100';
const PLACEHOLDER_ARTICLE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

// Extended article type with new fields
interface ExtendedAtlasArticle extends AtlasArticle {
  content_blocks?: ContentBlock[];
  article_template_type?: string;
  author_bio?: string;
  cover_image_caption?: string;
}

export default function ArticleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useThemeContext();
  
  const { article: initialArticle } = route.params as { article: ExtendedAtlasArticle };

  const [article, setArticle] = useState<ExtendedAtlasArticle>(initialArticle);
  const [relatedArticles, setRelatedArticles] = useState<AtlasArticle[]>([]);
  const [userReaction, setUserReaction] = useState<ArticleReaction | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadFullArticle();
  }, [initialArticle.id]);

  // Fetch full article data to ensure content_blocks are loaded
  const loadFullArticle = async () => {
    try {
      // Validate article ID before making database queries
      if (!initialArticle?.id) {
        console.error('Error: Article ID is missing or null');
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('=== Loading full article ===');
      console.log('Initial article ID:', initialArticle.id);
      
      // Fetch full article with content_blocks
      const { data: fullArticle, error } = await supabase
        .from('atlas_articles')
        .select(`
          *,
          category:atlas_categories(*),
          universe:atlas_universes(*)
        `)
        .eq('id', initialArticle.id)
        .single();

      console.log('Supabase response error:', error);
      console.log('Supabase response data keys:', fullArticle ? Object.keys(fullArticle) : 'null');
      console.log('content_blocks in response:', fullArticle?.content_blocks ? `Array with ${fullArticle.content_blocks.length} items` : 'null/undefined');

      if (error) {
        console.error('Error fetching full article:', error);
      } else if (fullArticle) {
        console.log('Setting article with content_blocks:', fullArticle.content_blocks?.length || 0, 'blocks');
        setArticle(fullArticle);
      }

      // Load other data
      await loadData();
      await incrementViewCount();
    } catch (error) {
      console.error('Error loading full article:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Load related articles (only if article ID and category_id are valid)
      if (article?.id && article?.category_id) {
        const related = await getRelatedArticles(article.id, article.category_id, 4);
        setRelatedArticles(related);
      }

      // Load user reaction if logged in
      if (user?.id && article?.id) {
        const reaction = await getUserReaction(article.id, user.id);
        setUserReaction(reaction);

        const saved = await isArticleSaved(article.id, user.id);
        setIsSaved(saved);
      }
    } catch (error) {
      console.error('Error loading article data:', error);
    }
  };

  const incrementViewCount = async () => {
    if (!article?.id) return;
    
    try {
      await supabase
        .from('atlas_articles')
        .update({ view_count: (article.view_count || 0) + 1 })
        .eq('id', article.id);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to save articles');
      return;
    }

    try {
      if (isSaved) {
        await unsaveArticle(article.id, userId);
        setIsSaved(false);
        setArticle({ ...article, save_count: (article.save_count || 0) - 1 });
      } else {
        await saveArticle(article.id, userId);
        setIsSaved(true);
        setArticle({ ...article, save_count: (article.save_count || 0) + 1 });
      }
    } catch (error) {
      console.error('Error saving article:', error);
      Alert.alert('Error', 'Failed to save article. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: article.title,
        message: `Check out "${article.title}" on Tavvy Atlas`,
        url: `https://tavvy.app/atlas/${article.slug}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleReaction = async (reactionType: 'love' | 'not_for_me') => {
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to react to articles');
      return;
    }

    try {
      setLoading(true);

      if (userReaction?.reaction_type === reactionType) {
        await removeReaction(article.id, userId);
        setUserReaction(null);
        if (reactionType === 'love') {
          setArticle({ ...article, love_count: (article.love_count || 0) - 1 });
        }
      } else {
        await addReaction(article.id, userId, reactionType);
        setUserReaction({ ...userReaction!, reaction_type: reactionType });
        if (reactionType === 'love') {
          const newLoveCount = (article.love_count || 0) + 1;
          const newNotForMeCount = userReaction?.reaction_type === 'not_for_me'
            ? (article.not_for_me_count || 0) - 1
            : article.not_for_me_count || 0;
          setArticle({ ...article, love_count: newLoveCount, not_for_me_count: newNotForMeCount });
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      Alert.alert('Error', 'Failed to save reaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Parse content blocks from article
  const contentBlocks: ContentBlock[] = article.content_blocks || [];

  // Debug logging
  console.log('Article ID:', article.id);
  console.log('Content blocks count:', contentBlocks.length);
  console.log('Has content_blocks field:', 'content_blocks' in article);

  // If no content blocks, create a simple paragraph from legacy content
  const displayBlocks: ContentBlock[] = contentBlocks.length > 0 
    ? contentBlocks 
    : article.content 
      ? [{ type: 'paragraph', text: article.content }]
      : [];

  // Show loading state while fetching full article
  if (loading && displayBlocks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#fff', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={TEAL_PRIMARY} />
        <Text style={{ marginTop: 12, color: '#6B7280' }}>Loading article...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? theme.background : '#fff' }]}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header with back button and actions */}
        <View style={[styles.headerBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleSave}
            >
              <Ionicons 
                name={isSaved ? 'bookmark' : 'bookmark-outline'} 
                size={24} 
                color={isSaved ? TEAL_PRIMARY : '#374151'} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          <Image
            source={{ uri: getCoverImageUrl(article.cover_image_url) || PLACEHOLDER_ARTICLE }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>

        {/* Article Content */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={[styles.title, { color: isDark ? theme.text : '#111827' }]}>
            {article.title}
          </Text>

          {/* Author Section */}
          <View style={styles.authorSection}>
            <Image
              source={{ uri: article.author_avatar_url || PLACEHOLDER_AVATAR }}
              style={styles.authorAvatar}
            />
            <View style={styles.authorInfo}>
              <Text style={[styles.authorName, { color: isDark ? theme.text : '#111827' }]}>
                {article.author_name || 'Tavvy Team'}
              </Text>
              <Text style={styles.authorRole}>
                {article.author_bio || 'Local Guide Writer'}
              </Text>
            </View>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>

          {/* Meta Info */}
          <View style={styles.metaSection}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>
                {article.read_time_minutes} min read
              </Text>
            </View>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>
              {formatDate(article.published_at)}
            </Text>
            <View style={styles.metaSpacer} />
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>
                {formatNumber(article.view_count || 0)} views
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Excerpt */}
          {article.excerpt && (
            <Text style={styles.excerpt}>{article.excerpt}</Text>
          )}

          {/* Content Blocks */}
          <ContentBlockRenderer blocks={displayBlocks} />

          {/* Reaction Section */}
          <View style={styles.reactionSection}>
            <Text style={styles.reactionTitle}>Did you find this helpful?</Text>
            <View style={styles.reactionButtons}>
              <TouchableOpacity
                style={[
                  styles.reactionButton,
                  userReaction?.reaction_type === 'love' && styles.reactionButtonActive,
                ]}
                onPress={() => handleReaction('love')}
                disabled={loading}
              >
                <Ionicons 
                  name={userReaction?.reaction_type === 'love' ? 'heart' : 'heart-outline'} 
                  size={20} 
                  color={userReaction?.reaction_type === 'love' ? '#fff' : TEAL_PRIMARY} 
                />
                <Text style={[
                  styles.reactionButtonText,
                  userReaction?.reaction_type === 'love' && styles.reactionButtonTextActive,
                ]}>
                  Love it ({formatNumber(article.love_count || 0)})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? theme.text : '#111827' }]}>
                Related Articles
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedScroll}
              >
                {relatedArticles.map((related) => (
                  <TouchableOpacity
                    key={related.id}
                    style={styles.relatedCard}
                    onPress={() => navigation.push('ArticleDetail', { article: related })}
                  >
                    <Image
                      source={{ uri: getThumbnailUrl(related.cover_image_url) || PLACEHOLDER_ARTICLE }}
                      style={styles.relatedImage}
                    />
                    <View style={styles.relatedContent}>
                      <Text style={styles.relatedTitle} numberOfLines={2}>
                        {related.title}
                      </Text>
                      <Text style={styles.relatedMeta}>
                        {related.read_time_minutes} min read
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // Header
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Cover Image
  coverImageContainer: {
    marginTop: 80,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  coverImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#E5E7EB',
  },

  // Content
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // Title
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 34,
    marginBottom: 20,
  },

  // Author Section
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  authorRole: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: TEAL_PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Meta Section
  metaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
  },
  metaDot: {
    color: '#D1D5DB',
    marginHorizontal: 8,
  },
  metaSpacer: {
    flex: 1,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },

  // Excerpt
  excerpt: {
    fontSize: 17,
    lineHeight: 26,
    color: '#374151',
    marginBottom: 16,
    fontStyle: 'italic',
  },

  // Reaction Section
  reactionSection: {
    marginTop: 32,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  reactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: TEAL_PRIMARY,
    gap: 8,
  },
  reactionButtonActive: {
    backgroundColor: TEAL_PRIMARY,
  },
  reactionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEAL_PRIMARY,
  },
  reactionButtonTextActive: {
    color: '#fff',
  },

  // Related Section
  relatedSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  relatedScroll: {
    paddingRight: 20,
  },
  relatedCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  relatedImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E5E7EB',
  },
  relatedContent: {
    padding: 12,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 6,
  },
  relatedMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
});
