/**
 * useProsServiceCategories Hook
 * Fetches service categories from Supabase service_categories table
 * 
 * Supports two-level hierarchy:
 * - Parent categories (parent_id IS NULL) — broad service types
 * - Sub-categories (parent_id = <parent_id>) — specific services within a parent
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export type ServiceCategory = {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  parent_id?: string | null;
  display_order?: number | null;
  order?: number | null;
};

/**
 * Fetch all service categories from Supabase (both parents and children)
 * Categories are sorted by display_order then name
 */
export function useProsServiceCategories() {
  return useQuery({
    queryKey: ['pros', 'service_categories'],
    queryFn: async (): Promise<ServiceCategory[]> => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, slug, name, icon, color, parent_id, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching service categories:', error);
        throw error;
      }

      return (data ?? []) as ServiceCategory[];
    },
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });
}

/**
 * Fetch only parent categories (parent_id IS NULL)
 */
export function useProsParentCategories() {
  return useQuery({
    queryKey: ['pros', 'parent_categories'],
    queryFn: async (): Promise<ServiceCategory[]> => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, slug, name, icon, color, parent_id, display_order')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching parent categories:', error);
        throw error;
      }

      return (data ?? []) as ServiceCategory[];
    },
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });
}

/**
 * Fetch sub-categories for a specific parent
 */
export function useProsSubCategories(parentId?: string) {
  return useQuery({
    queryKey: ['pros', 'sub_categories', parentId],
    queryFn: async (): Promise<ServiceCategory[]> => {
      if (!parentId) return [];

      const { data, error } = await supabase
        .from('service_categories')
        .select('id, slug, name, icon, color, parent_id, display_order')
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching sub-categories:', error);
        throw error;
      }

      return (data ?? []) as ServiceCategory[];
    },
    enabled: !!parentId,
    staleTime: 1000 * 60 * 10,
    retry: 2,
  });
}

/**
 * Fetch a single category by slug
 */
export function useProsServiceCategoryBySlug(slug?: string) {
  return useQuery({
    queryKey: ['pros', 'service_category', slug],
    queryFn: async (): Promise<ServiceCategory | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('service_categories')
        .select('id, slug, name, icon, color, parent_id, display_order')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching service category:', error);
        return null;
      }

      return (data ?? null) as ServiceCategory | null;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}

/**
 * Fetch a single category by ID
 */
export function useProsServiceCategoryById(id?: string) {
  return useQuery({
    queryKey: ['pros', 'service_category_id', id],
    queryFn: async (): Promise<ServiceCategory | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('service_categories')
        .select('id, slug, name, icon, color, parent_id, display_order')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching service category by ID:', error);
        return null;
      }

      return (data ?? null) as ServiceCategory | null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });
}
