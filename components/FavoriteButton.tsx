import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// ✅ correct file name (no "s")
import {
  useIsFavorite,
  useAddFavorite,
  useRemoveAllFavoritesForPlace,
} from '../hooks/useFavorite';

interface FavoriteButtonProps {
  placeId: string;
  size?: number;
  color?: string;
}

export default function FavoriteButton({
  placeId,
  size = 28,
  color = '#EF4444',
}: FavoriteButtonProps) {
  const { user } = useAuth();

  // ✅ auth handled internally by the hook, only pass placeId
  const { data: isFavorite = false, isLoading } = useIsPlaceFavorited(placeId);

  const addFavorite = useAddFavorite();
  const removeAllFavorites = useRemoveAllFavoritesForPlace();

  const handlePress = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to save favorites');
      return;
    }

    try {
      if (isFavorite) {
        await removeAllFavorites.mutateAsync(placeId);
      } else {
        await addFavorite.mutateAsync({
          placeId,
          listName: 'Favorites',
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const isMutating = addFavorite.isPending || removeAllFavorites.isPending;

  if (isLoading) {
    return (
      <TouchableOpacity style={styles.button} disabled>
        <ActivityIndicator size="small" color={color} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} disabled={isMutating}>
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={isFavorite ? color : '#9CA3AF'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});