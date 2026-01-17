/**
 * useCategories Hook
 * Fetches service categories from Supabase service_categories table.
 * 
 * Updated to use direct Supabase client for reliability.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order?: number;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('service_categories')
          .select('id, name, slug, description, icon, "order"')
          .order('order', { ascending: true });

        if (supabaseError) {
          throw supabaseError;
        }

        setCategories(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error fetching categories:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};
