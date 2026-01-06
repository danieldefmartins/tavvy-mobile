// ============================================================================
// ARTICLE DETAIL SCREEN
// ============================================================================
// Full article reading experience with reactions
// Place this file in: screens/ArticleDetailScreen.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import {
  getRelatedArticles,
  getUserReaction,
  addReaction,
  removeReaction,
  isArticleSaved,
  saveArticle,
  unsaveArticle,
  type AtlasArticle,
  type ArticleReaction,
} from '../lib/atlas';

export default function ArticleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { article: initialArticle } = route.params as { article: AtlasArticle };

  const [article, setArticle] = useState<AtlasArticle>(initialArticle);
  const [relatedArticles, setRelatedArticles] = useState<AtlasArticle[]>([]);
  const [userReaction, setUserReaction] = useState<ArticleReaction | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [article.id]);

  const loadData = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Load related articles
      const related = await getRelatedArticles(
        article.id,
        article.category_id,
        4
      );
      setRelatedArticles(related);

      // Load user reaction if logged in
      if (user?.id) {
        const reaction = await getUserReaction(article.id, user.id);
        setUserReaction(reaction);

        const saved = await isArticleSaved(article.id, user.id);
        setIsSaved(saved);
      }
    } catch (error) {
      console.error('Error loading article data:', error);
    }
  };

  const handleReaction = async (reactionType: 'love' | 'not_for_me') => {
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to react to articles');
      return;
    }

    try {
      setLoading(true);

      // If same reaction, remove it
      if (userReaction?.reaction_type === reactionType) {
        await removeReaction(article.id, userId);
        setUserReaction(null);

        // Update local counts
        if (reactionType === 'love') {
          setArticle({ ...article, love_count: article.love_count - 1 });
        } else {
          setArticle({ ...article, not_for_me_count: article.not_for_me_count - 1 });
        }
      } else {
        // Add or update reaction
        await addReaction(article.id, userId, reactionType);
        setUserReaction({ ...userReaction!, reaction_type: reactionType });

        // Update local counts
        if (reactionType === 'love') {
          const newLoveCount = article.love_count + 1;
          const newNotForMeCount =
            userReaction?.reaction_type === 'not_for_me'
              ? article.not_for_me_count - 1
              : article.not_for_me_count;
          setArticle({
            ...article,
            love_count: newLoveCount,
            not_for_me_count: newNotForMeCount,
          });
        } else {
          const newNotForMeCount = article.not_for_me_count + 1;
          const newLoveCount =
            userReaction?.reaction_type === 'love'
              ? article.love_count - 1
              : article.love_count;
          setArticle({
            ...article,
            love_count: newLoveCount,
            not_for_me_count: newNotForMeCount,
          });
        }
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      Alert.alert('Error', 'Failed to save reaction. Please try again.');
    } finally {
      setLoading(false);
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
        setArticle({ ...article, save_count: article.save_count - 1 });
      } else {
        await saveArticle(article.id, userId);
        setIsSaved(true);
        setArticle({ ...article, save_count: article.save_count + 1 });
      }
    } catch (error) {
      console.error('Error saving article:', error);
      Alert.alert('Error', 'Failed to save article. Please try again.');
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: article.cover_image_url }} style={styles.heroImage} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveIcon}>{isSaved ? '🔖' : '📑'}</Text>
          </TouchableOpacity>
        </View>

        {/* Article Content */}
        <View style={styles.content}>
          {/* Category Badge */}
          {article.category && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: article.category.color },
              ]}
            >
              <Text style={styles.categoryText}>
                {article.category.name.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Author Info */}
          <View style={styles.authorSection}>
            {article.author_avatar_url && (
              <Image
                source={{ uri: article.author_avatar_url }}
                style={styles.authorAvatar}
              />
            )}
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>By {article.author_name}</Text>
              <Text style={styles.authorMeta}>
                {article.read_time_minutes} min read • {new Date(article.published_at).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Stats Bar - Clean Line Design */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={18} color="#666" />
              <Text style={styles.statText}>{formatNumber(article.view_count)} reads</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={18} color="#EF4444" />
              <Text style={styles.statText}>{formatNumber(article.love_count)}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="bookmark" size={18} color="#9CA3AF" />
              <Text style={styles.statText}>{formatNumber(article.save_count)} saves</Text>
            </View>
          </View>

          {/* Reaction Buttons - Colorful & Rounded */}
          <View style={styles.reactionButtons}>
            <TouchableOpacity
              style={[styles.reactionButton, styles.loveButton]}
              onPress={() => handleReaction('love')}
              disabled={loading}
            >
              <Text style={styles.loveButtonText}>Love it ❤️</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.reactionButton, styles.notForMeButton]}
              onPress={() => handleReaction('not_for_me')}
              disabled={loading}
            >
              <Text style={styles.notForMeButtonText}>Not for me 💔</Text>
            </TouchableOpacity>
          </View>

          {/* Article Body */}
          <Text style={styles.body}>{article.content}</Text>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>Related in Atlas</Text>
              <View style={styles.relatedGrid}>
                {relatedArticles.map((related) => (
                  <TouchableOpacity
                    key={related.id}
                    style={styles.relatedCard}
                    onPress={() =>
                      navigation.navigate('ArticleDetail', {
                        article: related,
                      })
                    }
                  >
                    <Image
                      source={{ uri: related.cover_image_url }}
                      style={styles.relatedImage}
                    />
                    <Text style={styles.relatedCardTitle} numberOfLines={2}>
                      {related.title}
                    </Text>
                    <Text style={styles.relatedMeta}>
                      {related.read_time_minutes} min read
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 24,
  },
  saveButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveIcon: {
    fontSize: 24,
  },
  content: {
    padding: 20,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  authorInfo: {
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  authorMeta: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  reactionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loveButton: {
    backgroundColor: '#4DB6AC', // Teal color from mockup
  },
  notForMeButton: {
    backgroundColor: '#E5E7EB', // Light gray
  },
  loveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  notForMeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF', // Gray text
  },
  body: {
    fontSize: 17,
    lineHeight: 28,
    color: '#333',
    marginBottom: 32,
  },
  relatedSection: {
    marginTop: 32,
    paddingTop: 32,
    borderTopWidth: 1,
    borderColor: '#e5e5e5',
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  relatedCard: {
    width: '48%',
    margin: '1%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relatedImage: {
    width: '100%',
    height: 120,
  },
  relatedCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    padding: 12,
    paddingBottom: 4,
  },
  relatedMeta: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});