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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      Alert.alert(t('common.error'), 'Failed to save reaction. Please try again.');
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
      Alert.alert(t('common.error'), 'Failed to save article. Please try again.');
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
              <Text style={styles.relatedTitle}>{t('atlas.articles')}</Text>
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
    fontWeight: 'bold',
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
    fontSize: 20,
  },
  content: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#fff',
    marginTop: -20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginBottom: 12,
  },
  categoryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
    marginBottom: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorInfo: {},
  authorName: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  authorMeta: {
    color: '#666',
    fontSize: 13,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#333',
  },
  reactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  reactionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loveButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  loveButtonText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notForMeButton: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  notForMeButtonText: {
    color: '#4B5563',
    fontWeight: 'bold',
    fontSize: 16,
  },
  body: {
    fontSize: 17,
    lineHeight: 28,
    color: '#333',
    textAlign: 'justify',
  },
  relatedSection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 24,
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  relatedCard: {
    width: '48%',
    marginBottom: 16,
  },
  relatedImage: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    marginBottom: 8,
  },
  relatedCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  relatedMeta: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
