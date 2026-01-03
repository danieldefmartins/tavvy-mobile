/**
 * useFavorites Hook - Favorites/Bookmarks functionality
 * 
 * Allows users to save places to custom lists like "Favorites",
 * "Want to Visit", "RV Trip 2026", etc.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Favorite {
  id: string;
  userId: string;
  placeId: string;
  listName: string;
  notes: string | null;
  createdAt: Date;
}

export interface FavoriteWithPlace extends Favorite {
  placeName: string;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  primaryCategory: string;
  coverImageUrl: string | null;
  phone: string | null;
  website: string | null;
}

export interface FavoriteList {
  listName: string;
  count: number;
}

/**
 * Get all favorite lists for current user
 */
export function useUserFavoriteLists() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['favorite-lists', user?.id],
    queryFn: async (): Promise<FavoriteList[]> => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_user_favorite_lists', {
        p_user_id: user.id,
      });

      if (error) throw error;

      return (data || []).map(row => ({
        listName: row.list_name,
        count: parseInt(row.count),
      }));
    },
    enabled: !!user,
  });
}

/**
 * Get all favorites for current user (optionally filtered by list)
 */
export function useUserFavorites(listName?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-favorites', user?.id, listName],
    queryFn: async (): Promise<FavoriteWithPlace[]> => {
      if (!user) return [];

      let query = supabase
        .from('user_favorites_with_details')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listName) {
        query = query.eq('list_name', listName);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        placeId: row.place_id,
        listName: row.list_name,
        notes: row.notes,
        createdAt: new Date(row.created_at),
        placeName: row.place_name,
        address: row.address,
        city: row.city,
        state: row.state,
        latitude: row.latitude,
        longitude: row.longitude,
        primaryCategory: row.primary_category,
        coverImageUrl: row.cover_image_url,
        phone: row.phone,
        website: row.website,
      }));
    },
    enabled: !!user,
  });
}

/**
 * Check if a place is favorited by current user
 */
export function useIsPlaceFavorited(placeId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-favorited', user?.id, placeId],
    queryFn: async (): Promise<boolean> => {
      if (!user) return false;

      const { data, error } = await supabase.rpc('is_place_favorited', {
        p_user_id: user.id,
        p_place_id: placeId,
      });

      if (error) {
        console.error('Error checking if place is favorited:', error);
        return false;
      }

      return data || false;
    },
    enabled: !!user && !!placeId,
  });
}

/**
 * Get favorite count for a place
 */
export function usePlaceFavoriteCount(placeId: string) {
  return useQuery({
    queryKey: ['place-favorite-count', placeId],
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('get_place_favorite_count', {
        p_place_id: placeId,
      });

      if (error) {
        console.error('Error fetching favorite count:', error);
        return 0;
      }

      return data || 0;
    },
    enabled: !!placeId,
  });
}

/**
 * Get user's favorite for a specific place (to check which list it's in)
 */
export function useUserFavoriteForPlace(placeId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-favorite-for-place', user?.id, placeId],
    queryFn: async (): Promise<Favorite[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('place_id', placeId);

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        userId: row.user_id,
        placeId: row.place_id,
        listName: row.list_name,
        notes: row.notes,
        createdAt: new Date(row.created_at),
      }));
    },
    enabled: !!user && !!placeId,
  });
}

/**
 * Add a place to favorites
 */
export function useAddFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      placeId,
      listName = 'Favorites',
      notes,
    }: {
      placeId: string;
      listName?: string;
      notes?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to add favorite');

      const { data, error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          place_id: placeId,
          list_name: listName,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['favorite-lists', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-favorited', user?.id, variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['user-favorite-for-place', user?.id, variables.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-favorite-count', variables.placeId] });
    },
  });
}

/**
 * Remove a place from favorites
 */
export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ favoriteId, placeId }: { favoriteId: string; placeId: string }) => {
      if (!user) throw new Error('Must be logged in to remove favorite');

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      return { placeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['favorite-lists', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-favorited', user?.id, data.placeId] });
      queryClient.invalidateQueries({ queryKey: ['user-favorite-for-place', user?.id, data.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-favorite-count', data.placeId] });
    },
  });
}

/**
 * Remove all favorites for a place (from all lists)
 */
export function useRemoveAllFavoritesForPlace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (placeId: string) => {
      if (!user) throw new Error('Must be logged in to remove favorites');

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('place_id', placeId);

      if (error) throw error;

      return { placeId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['favorite-lists', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['is-favorited', user?.id, data.placeId] });
      queryClient.invalidateQueries({ queryKey: ['user-favorite-for-place', user?.id, data.placeId] });
      queryClient.invalidateQueries({ queryKey: ['place-favorite-count', data.placeId] });
    },
  });
}

/**
 * Update favorite notes
 */
export function useUpdateFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      favoriteId,
      notes,
      listName,
    }: {
      favoriteId: string;
      notes?: string;
      listName?: string;
    }) => {
      if (!user) throw new Error('Must be logged in to update favorite');

      const updateData: any = {};
      if (notes !== undefined) updateData.notes = notes;
      if (listName !== undefined) updateData.list_name = listName;

      const { data, error } = await supabase
        .from('user_favorites')
        .update(updateData)
        .eq('id', favoriteId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['favorite-lists', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-favorite-for-place', user?.id, data.place_id] });
    },
  });
}

/**
 * Toggle favorite (add if not favorited, remove if favorited)
 */
export function useToggleFavorite() {
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveAllFavoritesForPlace();
  const { data: userFavorites } = useUserFavoriteForPlace;

  return {
    toggle: async (placeId: string, listName: string = 'Favorites') => {
      // Check if already favorited
      const { user } = useAuth();
      if (!user) throw new Error('Must be logged in');

      const { data: favorites } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('place_id', placeId);

      if (favorites && favorites.length > 0) {
        // Already favorited, remove it
        await removeFavorite.mutateAsync(placeId);
      } else {
        // Not favorited, add it
        await addFavorite.mutateAsync({ placeId, listName });
      }
    },
    isLoading: addFavorite.isLoading || removeFavorite.isLoading,
  };
}