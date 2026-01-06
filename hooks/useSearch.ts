import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

interface SearchHistoryItem {
  id: string;
  user_id: string;
  query: string;
  created_at: string;
}

export function useSearchHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ['searchHistory', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as SearchHistoryItem[];
    },
    enabled: !!userId,
  });
}

export function useAddSearchHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, query }: { userId: string; query: string }) => {
      const { data, error } = await supabase
        .from('search_history')
        .insert({ user_id: userId, query })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory', variables.userId] });
    },
  });
}

export function useClearSearchHistory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory', userId] });
    },
  });
}