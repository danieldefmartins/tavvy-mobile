/**
 * Pros (Customer-side) data hooks powered by Supabase
 *
 * These hooks power the *customer* browsing + quote request flow.
 * They intentionally do NOT depend on the demo tRPC Pros API.
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

export type ServiceSubcategory = {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  sort?: number | null;
};

export type ProPlace = {
  id: string;
  name: string;
  primary_category?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state_region?: string | null;
  cover_image_url?: string | null;
  phone?: string | null;
};

export function useServiceCategories() {
  return useQuery({
    queryKey: ['pros', 'service_categories'],
    queryFn: async (): Promise<ServiceCategory[]> => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('id,slug,name,icon,sort')
        .order('sort', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ServiceCategory[];
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function useServiceSubcategories(categoryId?: string) {
  return useQuery({
    queryKey: ['pros', 'service_subcategories', categoryId],
    queryFn: async (): Promise<ServiceSubcategory[]> => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from('service_subcategories')
        .select('id,category_id,slug,name,sort')
        .eq('category_id', categoryId)
        .order('sort', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ServiceSubcategory[];
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Directory list of pros for a category.
 * MVP filtering: category only + optional text query and city/zip.
 * Later: radius/geo filtering.
 */
export function useProsDirectory(params: {
  categoryId?: string;
  query?: string;
  cityOrZip?: string;
  limit?: number;
}) {
  const { categoryId, query, cityOrZip, limit = 30 } = params;

  return useQuery({
    queryKey: ['pros', 'directory', categoryId, query, cityOrZip, limit],
    queryFn: async (): Promise<ProPlace[]> => {
      if (!categoryId) return [];

      // Join place_services -> places
      const { data, error } = await supabase
        .from('place_services')
        .select(
          `place_id,
           places:places(
             id,
             name,
             primary_category,
             address_line1,
             city,
             state_region,
             cover_image_url,
             phone
           )`
        )
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .limit(limit);

      if (error) throw error;

      const places = (data ?? [])
        .map((row: any) => row.places)
        .filter(Boolean) as ProPlace[];

      // Basic client-side filters (keeps SQL simple for MVP)
      const q = (query ?? '').trim().toLowerCase();
      const loc = (cityOrZip ?? '').trim().toLowerCase();

      return places
        .filter((p) => {
          if (!q) return true;
          return (p.name ?? '').toLowerCase().includes(q);
        })
        .filter((p) => {
          if (!loc) return true;
          const city = (p.city ?? '').toLowerCase();
          const state = (p.state_region ?? '').toLowerCase();
          return city.includes(loc) || state.includes(loc);
        });
    },
    enabled: !!categoryId,
    staleTime: 1000 * 30,
  });
}
