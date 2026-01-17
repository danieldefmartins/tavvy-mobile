/**
 * useProsServiceCategories Hook
 * Fetches service categories from Supabase service_categories table
 * 
 * This replaces hardcoded categories with dynamic data from the database,
 * allowing for easy management and scaling of service offerings.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export type ServiceCategory = {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  sort?: number | null;
};

/**
 * Fetch all service categories from Supabase
 * Categories are sorted by the 'sort' field for consistent ordering
 */
export function useProsServiceCategories() {
  return useQuery({
    queryKey: ['pros', 'service_categories'],
    queryFn: async (): Promise<ServiceCategory[]> => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id, slug, name, icon, sort')
        .order('sort', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching service categories:', error);
        throw error;
      }

      return (data ?? []) as ServiceCategory[];
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
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
        .select('id, slug, name, icon, sort')
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
        .select('id, slug, name, icon, sort')
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
