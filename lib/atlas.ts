// ============================================================================
// TAVVY ATLAS v2.0 - DATA LIBRARY
// ============================================================================
// This file contains all data fetching and mutation functions for Atlas
// Updated to support block-based content and new article types
// ============================================================================

import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface AtlasCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  color: string;
  display_order: number;
}

export interface AtlasUniverse {
  id: string;
  name: string;
  slug: string;
  description: string;
  location: string;
  banner_image_url: string;
  thumbnail_image_url: string;
  category_id: string;
  parent_universe_id: string | null;
  place_count: number;
  article_count: number;
  sub_universe_count: number;
  total_signals: number;
  is_featured: boolean;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at: string;
}

// Content block types for v2.0
export interface ContentBlock {
  type: string;
  [key: string]: any;
}

export interface AtlasArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string;
  category_id: string;
  universe_id: string | null;
  read_time_minutes: number;
  view_count: number;
  love_count: number;
  not_for_me_count: number;
  save_count: number;
  is_featured: boolean;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at: string;
  // v2.0 fields
  content_blocks?: ContentBlock[];
  article_template_type?: 'city_guide' | 'owner_spotlight' | 'tavvy_tips' | 'general';
  section_images?: { url: string; alt?: string; caption?: string }[];
  cover_image_alt?: string;
  cover_image_caption?: string;
  author_bio?: string;
  primary_place_id?: string;
  canonical_url?: string;
  seo_keywords?: string[];
  linked_place_ids?: string[];
  // Joined data
  category?: AtlasCategory;
  universe?: AtlasUniverse;
}

export interface ArticleReaction {
  id: string;
  article_id: string;
  user_id: string;
  reaction_type: 'love' | 'not_for_me';
  created_at: string;
}

// Place data for PlaceCardBlock
export interface PlaceData {
  id: string;
  name: string;
  category: string;
  rating?: number;
  review_count?: number;
  photos?: string[];
  address?: string;
  city?: string;
  state?: string;
}

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getCategories(): Promise<AtlasCategory[]> {
  const { data, error } = await supabase
    .from('atlas_categories')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<AtlasCategory | null> {
  const { data, error } = await supabase
    .from('atlas_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// ============================================================================
// UNIVERSES
// ============================================================================

export async function getFeaturedUniverses(limit = 10): Promise<AtlasUniverse[]> {
  const { data, error } = await supabase
    .from('atlas_universes')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getUniverseBySlug(slug: string): Promise<AtlasUniverse | null> {
  const { data, error } = await supabase
    .from('atlas_universes')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getSubUniverses(parentId: string): Promise<AtlasUniverse[]> {
  const { data, error } = await supabase
    .from('atlas_universes')
    .select('*')
    .eq('parent_universe_id', parentId)
    .eq('status', 'published')
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getUniversesByCategory(categoryId: string): Promise<AtlasUniverse[]> {
  const { data, error } = await supabase
    .from('atlas_universes')
    .select('*')
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============================================================================
// ARTICLES
// ============================================================================

export async function getFeaturedArticle(): Promise<AtlasArticle | null> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*),
      universe:atlas_universes(*)
    `)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// Get all published articles with pagination and optional randomization
export async function getAllArticles(
  options: {
    limit?: number;
    offset?: number;
    shuffle?: boolean;
  } = {}
): Promise<AtlasArticle[]> {
  const { limit = 20, offset = 0, shuffle = false } = options;

  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  
  let articles = data || [];
  
  // Shuffle if requested
  if (shuffle && articles.length > 0) {
    articles = articles.sort(() => Math.random() - 0.5);
  }
  
  return articles;
}

export async function getTrendingArticles(limit = 10): Promise<AtlasArticle[]> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('status', 'published')
    .order('love_count', { ascending: false })
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getArticleBySlug(slug: string): Promise<AtlasArticle | null> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*),
      universe:atlas_universes(*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Increment view count
  await supabase
    .from('atlas_articles')
    .update({ view_count: data.view_count + 1 })
    .eq('id', data.id);

  return data;
}

export async function getArticleById(id: string): Promise<AtlasArticle | null> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*),
      universe:atlas_universes(*)
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

export async function getArticlesByCategory(
  categoryId: string,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: 'popular' | 'recent' | 'most_loved';
  } = {}
): Promise<AtlasArticle[]> {
  const { limit = 20, offset = 0, sortBy = 'recent' } = options;

  let query = supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'published');

  // Apply sorting
  if (sortBy === 'popular') {
    query = query.order('view_count', { ascending: false });
  } else if (sortBy === 'most_loved') {
    query = query.order('love_count', { ascending: false });
  } else {
    query = query.order('published_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getArticlesByCategorySlug(
  categorySlug: string,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: 'popular' | 'recent' | 'most_loved';
  } = {}
): Promise<AtlasArticle[]> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return [];
  return getArticlesByCategory(category.id, options);
}

export async function getArticlesByTemplateType(
  templateType: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<AtlasArticle[]> {
  const { limit = 20, offset = 0 } = options;

  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('article_template_type', templateType)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

export async function getArticlesByUniverse(universeId: string): Promise<AtlasArticle[]> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('universe_id', universeId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getRelatedArticles(
  articleId: string,
  categoryId: string,
  limit = 4
): Promise<AtlasArticle[]> {
  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .neq('id', articleId)
    .order('love_count', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function searchArticles(
  query: string,
  filters: {
    categoryId?: string;
    universeId?: string;
    templateType?: string;
  } = {}
): Promise<AtlasArticle[]> {
  let supabaseQuery = supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*),
      universe:atlas_universes(*)
    `)
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`);

  if (filters.categoryId) {
    supabaseQuery = supabaseQuery.eq('category_id', filters.categoryId);
  }

  if (filters.universeId) {
    supabaseQuery = supabaseQuery.eq('universe_id', filters.universeId);
  }

  if (filters.templateType) {
    supabaseQuery = supabaseQuery.eq('article_template_type', filters.templateType);
  }

  supabaseQuery = supabaseQuery.order('love_count', { ascending: false }).limit(50);

  const { data, error } = await supabaseQuery;
  if (error) throw error;
  return data || [];
}

// ============================================================================
// PLACES (for PlaceCardBlock)
// ============================================================================

export async function getPlaceById(placeId: string): Promise<PlaceData | null> {
  const { data, error } = await supabase
    .from('places')
    .select('id, name, category, rating, review_count, photos, address, city, state')
    .eq('id', placeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getPlacesByIds(placeIds: string[]): Promise<PlaceData[]> {
  if (placeIds.length === 0) return [];

  const { data, error } = await supabase
    .from('places')
    .select('id, name, category, rating, review_count, photos, address, city, state')
    .in('id', placeIds);

  if (error) throw error;
  return data || [];
}

// ============================================================================
// REACTIONS
// ============================================================================

export async function getUserReaction(
  articleId: string,
  userId: string
): Promise<ArticleReaction | null> {
  const { data, error } = await supabase
    .from('atlas_article_reactions')
    .select('*')
    .eq('article_id', articleId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function addReaction(
  articleId: string,
  userId: string,
  reactionType: 'love' | 'not_for_me'
): Promise<void> {
  const { error } = await supabase
    .from('atlas_article_reactions')
    .upsert(
      {
        article_id: articleId,
        user_id: userId,
        reaction_type: reactionType,
      },
      {
        onConflict: 'article_id,user_id',
      }
    );

  if (error) throw error;
}

export async function removeReaction(articleId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('atlas_article_reactions')
    .delete()
    .eq('article_id', articleId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================================================
// SAVES
// ============================================================================

export async function isArticleSaved(articleId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('atlas_article_saves')
    .select('id')
    .eq('article_id', articleId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false;
    throw error;
  }
  return !!data;
}

export async function saveArticle(articleId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('atlas_article_saves')
    .insert({
      article_id: articleId,
      user_id: userId,
    });

  if (error) throw error;
}

export async function unsaveArticle(articleId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('atlas_article_saves')
    .delete()
    .eq('article_id', articleId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getSavedArticles(userId: string): Promise<AtlasArticle[]> {
  const { data, error } = await supabase
    .from('atlas_article_saves')
    .select(`
      article:atlas_articles(
        *,
        category:atlas_categories(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data?.map((item: any) => item.article).filter(Boolean) || [];
}

// ============================================================================
// UNIVERSE PLACES
// ============================================================================

export async function getUniversePlaces(universeId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('atlas_universe_places')
    .select(`
      place:places(*)
    `)
    .eq('universe_id', universeId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data?.map((item: any) => item.place).filter(Boolean) || [];
}

// ============================================================================
// OWNER SPOTLIGHTS
// ============================================================================

export async function getOwnerSpotlights(limit = 10): Promise<AtlasArticle[]> {
  return getArticlesByTemplateType('owner_spotlight', { limit });
}

export async function getArticlesByAuthor(
  authorId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<AtlasArticle[]> {
  const { limit = 20, offset = 0 } = options;

  const { data, error } = await supabase
    .from('atlas_articles')
    .select(`
      *,
      category:atlas_categories(*)
    `)
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  // Categories
  getCategories,
  getCategoryBySlug,
  
  // Universes
  getFeaturedUniverses,
  getUniverseBySlug,
  getSubUniverses,
  getUniversesByCategory,
  
  // Articles
  getFeaturedArticle,
  getTrendingArticles,
  getArticleBySlug,
  getArticleById,
  getArticlesByCategory,
  getArticlesByCategorySlug,
  getArticlesByTemplateType,
  getArticlesByUniverse,
  getRelatedArticles,
  searchArticles,
  
  // Places
  getPlaceById,
  getPlacesByIds,
  
  // Reactions
  getUserReaction,
  addReaction,
  removeReaction,
  
  // Saves
  isArticleSaved,
  saveArticle,
  unsaveArticle,
  getSavedArticles,
  
  // Universe Places
  getUniversePlaces,
  
  // Owner Spotlights
  getOwnerSpotlights,
  getArticlesByAuthor,
};
