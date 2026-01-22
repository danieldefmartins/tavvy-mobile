// ============================================================================
// ARTICLE DETAIL SCREEN v2.3
// ============================================================================
// Full article reading experience with block-based content
// Features: Reading modes, Font size controls, Audio playback (Amazon Polly)
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
  Modal,
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
import { ContentBlockRenderer, ContentBlock, AudioPlayer } from '../components/atlas';
import { getCoverImageUrl, getThumbnailUrl } from '../lib/imageUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tavvy brand colors
const TEAL_PRIMARY = '#0D9488';
const TEAL_LIGHT = '#5EEAD4';

// Reading Mode Color Schemes (research-based for eye comfort)
// Dark mode now uses same bright text color as title for better readability
const READING_MODES = {
  light: {
    background: '#FAFAFA',
    text: '#1F2937',
    secondaryText: '#374151',
    metaText: '#6B7280',
    divider: '#E5E7EB',
    cardBg: '#FFFFFF',
    audioBg: '#F0FDFA',
    statusBar: 'dark-content' as const,
  },
  sepia: {
    background: '#FBF5E6',
    text: '#5C4B37',
    secondaryText: '#6B5A48',
    metaText: '#8B7B6B',
    divider: '#E8DCC8',
    cardBg: '#F5EFE0',
    audioBg: '#F5EFE0',
    statusBar: 'dark-content' as const,
  },
  dark: {
    background: '#1A1A2E',
    text: '#F5F5F5',           // Bright white for titles AND body text
    secondaryText: '#E8E6E3',   // Slightly softer for secondary
    metaText: '#B8B5B0',        // Lighter meta text
    divider: '#2D2D44',
    cardBg: '#252540',
    audioBg: '#252540',
    statusBar: 'light-content' as const,
  },
};

// Default reading settings
const DEFAULT_READING_MODE: ReadingMode = 'light';
const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 28;
const FONT_SIZE_STEP = 2;

type ReadingMode = 'light' | 'sepia' | 'dark';

// Placeholder images
const PLACEHOLDER_AVATAR = 'https://via.placeholder.com/100';
const PLACEHOLDER_ARTICLE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

// Extended article type with new fields
interface ExtendedAtlasArticle extends AtlasArticle {
  content_blocks?: ContentBlock[];
  article_template_type?: string;
  author_bio?: string;
  cover_image_caption?: string;
  audio_url?: string | null;
  audio_duration?: number | null;
  audio_generated_at?: string | null;
}

// Calculate font sizes based on body font size
const getFontSizes = (bodySize: number) => ({
  title: bodySize + 10,
  body: bodySize,
  meta: Math.max(11, bodySize - 3),
  excerpt: bodySize + 1,
  lineHeight: bodySize + 10,
});

// Supabase Edge Function URL for audio generation
const AUDIO_FUNCTION_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/hyper-service`;

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
  
  // Audio state
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  // Reading preferences - now with numeric font size
  const [readingMode, setReadingMode] = useState<ReadingMode>(DEFAULT_READING_MODE);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Get current theme colors based on reading mode
  const colors = READING_MODES[readingMode];
  const fontSizes = getFontSizes(fontSize);

  // Check if settings have been modified from defaults
  const isModified = readingMode !== DEFAULT_READING_MODE || fontSize !== DEFAULT_FONT_SIZE;

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
      
      // Fetch full article with content_blocks and audio fields
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
      console.log('audio_url in response:', fullArticle?.audio_url || 'null');

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

  // Generate audio for the article
  const handleGenerateAudio = async () => {
    if (!article?.id) return;

    try {
      setIsGeneratingAudio(true);
      console.log('Generating audio for article:', article.id);

      const response = await fetch(AUDIO_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ article_id: article.id }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Audio generated:', result.audio_url);
        setArticle({
          ...article,
          audio_url: result.audio_url,
          audio_duration: result.audio_duration,
          audio_generated_at: new Date().toISOString(),
        });
      } else {
        throw new Error(result.error || 'Failed to generate audio');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      Alert.alert(
        'Audio Generation Failed',
        'Unable to generate audio for this article. Please try again later.'
      );
    } finally {
      setIsGeneratingAudio(false);
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

  // Font size controls
  const increaseFontSize = () => {
    if (fontSize < MAX_FONT_SIZE) {
      setFontSize(prev => Math.min(prev + FONT_SIZE_STEP, MAX_FONT_SIZE));
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > MIN_FONT_SIZE) {
      setFontSize(prev => Math.max(prev - FONT_SIZE_STEP, MIN_FONT_SIZE));
    }
  };

  const restoreDefaults = () => {
    setReadingMode(DEFAULT_READING_MODE);
    setFontSize(DEFAULT_FONT_SIZE);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Check for invalid date (Unix epoch / null timestamp)
    if (date.getFullYear() < 2000) {
      return 'Recently published';
    }
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

  // Render Reading Settings Modal
  const renderSettingsModal = () => (
    <Modal
      visible={showSettingsModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSettingsModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={[styles.modalContent, { backgroundColor: colors.cardBg }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reading Settings</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Reading Mode Selection */}
          <Text style={[styles.settingLabel, { color: colors.secondaryText }]}>Reading Mode</Text>
          <View style={styles.modeOptions}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                { backgroundColor: READING_MODES.light.background, borderColor: readingMode === 'light' ? TEAL_PRIMARY : '#E5E7EB' },
                readingMode === 'light' && styles.modeButtonSelected,
              ]}
              onPress={() => setReadingMode('light')}
            >
              <Text style={[styles.modeButtonText, { color: READING_MODES.light.text }]}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                { backgroundColor: READING_MODES.sepia.background, borderColor: readingMode === 'sepia' ? TEAL_PRIMARY : '#E5E7EB' },
                readingMode === 'sepia' && styles.modeButtonSelected,
              ]}
              onPress={() => setReadingMode('sepia')}
            >
              <Text style={[styles.modeButtonText, { color: READING_MODES.sepia.text }]}>Sepia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                { backgroundColor: READING_MODES.dark.background, borderColor: readingMode === 'dark' ? TEAL_PRIMARY : '#2D2D44' },
                readingMode === 'dark' && styles.modeButtonSelected,
              ]}
              onPress={() => setReadingMode('dark')}
            >
              <Text style={[styles.modeButtonText, { color: READING_MODES.dark.text }]}>Dark</Text>
            </TouchableOpacity>
          </View>

          {/* Font Size Controls - Incremental */}
          <Text style={[styles.settingLabel, { color: colors.secondaryText, marginTop: 24 }]}>Font Size</Text>
          <View style={styles.fontSizeControls}>
            <TouchableOpacity
              style={[
                styles.fontSizeControlButton,
                { backgroundColor: colors.background, borderColor: colors.divider },
                fontSize <= MIN_FONT_SIZE && styles.fontSizeControlButtonDisabled,
              ]}
              onPress={decreaseFontSize}
              disabled={fontSize <= MIN_FONT_SIZE}
            >
              <Text style={[
                styles.fontSizeControlText, 
                { color: fontSize <= MIN_FONT_SIZE ? colors.metaText : colors.text }
              ]}>
                A-
              </Text>
            </TouchableOpacity>
            
            <View style={styles.fontSizeDisplay}>
              <Text style={[styles.fontSizeValue, { color: colors.text }]}>{fontSize}px</Text>
              <Text style={[styles.fontSizeHint, { color: colors.metaText }]}>
                {fontSize === DEFAULT_FONT_SIZE ? 'Default' : fontSize < DEFAULT_FONT_SIZE ? 'Smaller' : 'Larger'}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.fontSizeControlButton,
                { backgroundColor: colors.background, borderColor: colors.divider },
                fontSize >= MAX_FONT_SIZE && styles.fontSizeControlButtonDisabled,
              ]}
              onPress={increaseFontSize}
              disabled={fontSize >= MAX_FONT_SIZE}
            >
              <Text style={[
                styles.fontSizeControlText, 
                styles.fontSizeControlTextLarge,
                { color: fontSize >= MAX_FONT_SIZE ? colors.metaText : colors.text }
              ]}>
                A+
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preview Text */}
          <View style={[styles.previewContainer, { backgroundColor: colors.background, borderColor: colors.divider }]}>
            <Text style={[styles.previewText, { color: colors.text, fontSize: fontSize, lineHeight: fontSize + 10 }]}>
              Preview: The quick brown fox jumps over the lazy dog.
            </Text>
          </View>

          {/* Restore Defaults Button */}
          {isModified && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={restoreDefaults}
            >
              <Ionicons name="refresh" size={18} color={TEAL_PRIMARY} />
              <Text style={styles.restoreButtonText}>Restore Original Settings</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  // Show loading state while fetching full article
  if (loading && displayBlocks.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={TEAL_PRIMARY} />
        <Text style={{ marginTop: 12, color: colors.metaText }}>Loading article...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />
      
      {/* Fixed Header Bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.cardBg }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.cardBg }]}
            onPress={() => setShowSettingsModal(true)}
          >
            <Ionicons name="text" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.cardBg }]}
            onPress={handleSave}
          >
            <Ionicons 
              name={isSaved ? 'bookmark' : 'bookmark-outline'} 
              size={24} 
              color={isSaved ? TEAL_PRIMARY : colors.text} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.cardBg }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingTop: insets.top + 60 }}
      >
        {/* Cover Image - Now properly positioned below header */}
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
          <Text style={[styles.title, { color: colors.text, fontSize: fontSizes.title }]}>
            {article.title}
          </Text>

          {/* Author Section */}
          <View style={styles.authorSection}>
            <Image
              source={{ uri: article.author_avatar_url || PLACEHOLDER_AVATAR }}
              style={styles.authorAvatar}
            />
            <View style={styles.authorInfo}>
              <Text style={[styles.authorName, { color: colors.text }]}>
                {article.author_name || 'Tavvy Team'}
              </Text>
              <Text style={[styles.authorRole, { color: colors.metaText }]}>
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
              <Ionicons name="time-outline" size={16} color={colors.metaText} />
              <Text style={[styles.metaText, { color: colors.metaText, fontSize: fontSizes.meta }]}>
                {article.read_time_minutes} min read
              </Text>
            </View>
            <Text style={[styles.metaDot, { color: colors.divider }]}>•</Text>
            <Text style={[styles.metaText, { color: colors.metaText, fontSize: fontSizes.meta }]}>
              {formatDate(article.published_at)}
            </Text>
            <View style={styles.metaSpacer} />
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={16} color={colors.metaText} />
              <Text style={[styles.metaText, { color: colors.metaText, fontSize: fontSizes.meta }]}>
                {formatNumber(article.view_count || 0)} views
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Audio Player */}
          <AudioPlayer
            articleId={article.id}
            audioUrl={article.audio_url}
            audioDuration={article.audio_duration}
            onGenerateAudio={handleGenerateAudio}
            isGenerating={isGeneratingAudio}
            backgroundColor={colors.audioBg}
            textColor={colors.text}
          />

          {/* Excerpt */}
          {article.excerpt && (
            <Text style={[styles.excerpt, { color: colors.secondaryText, fontSize: fontSizes.excerpt }]}>
              {article.excerpt}
            </Text>
          )}

          {/* Content Blocks */}
          <ContentBlockRenderer 
            blocks={displayBlocks} 
            textColor={colors.text}
            fontSize={fontSizes.body}
            lineHeight={fontSizes.lineHeight}
          />

          {/* Reaction Section */}
          <View style={[styles.reactionSection, { borderTopColor: colors.divider }]}>
            <Text style={[styles.reactionTitle, { color: colors.secondaryText }]}>Did you find this helpful?</Text>
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
            <View style={[styles.relatedSection, { borderTopColor: colors.divider }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
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
                    style={[styles.relatedCard, { backgroundColor: colors.cardBg }]}
                    onPress={() => navigation.push('ArticleDetail', { article: related })}
                  >
                    <Image
                      source={{ uri: getThumbnailUrl(related.cover_image_url) || PLACEHOLDER_ARTICLE }}
                      style={styles.relatedImage}
                    />
                    <View style={styles.relatedContent}>
                      <Text style={[styles.relatedTitle, { color: colors.text }]} numberOfLines={2}>
                        {related.title}
                      </Text>
                      <Text style={[styles.relatedMeta, { color: colors.metaText }]}>
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

      {/* Settings Modal */}
      {renderSettingsModal()}
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
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Cover Image
  coverImageContainer: {
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  modeButtonSelected: {
    borderWidth: 3,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Font Size Controls - New incremental style
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  fontSizeControlButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeControlButtonDisabled: {
    opacity: 0.4,
  },
  fontSizeControlText: {
    fontSize: 18,
    fontWeight: '700',
  },
  fontSizeControlTextLarge: {
    fontSize: 22,
  },
  fontSizeDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  fontSizeValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  fontSizeHint: {
    fontSize: 12,
    marginTop: 4,
  },

  // Preview
  previewContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewText: {
    textAlign: 'center',
  },

  // Restore button
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: TEAL_PRIMARY,
    gap: 8,
  },
  restoreButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEAL_PRIMARY,
  },
});
