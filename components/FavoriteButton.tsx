import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useAddFavorite, useRemoveFavorite, useIsFavorite } from '../hooks/useFavorites';

interface FavoriteButtonProps {
  placeId: string;
  size?: number;
  color?: string;
}

export default function FavoriteButton({ 
  placeId, 
  size = 28, 
  color = '#EF4444' 
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { data: isFavorite, isLoading } = useIsFavorite(user?.id, placeId);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const handlePress = async () => {
    if (!user) {
      // Show login prompt
      alert('Please sign in to save favorites');
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite.mutateAsync({ userId: user.id, placeId });
      } else {
        await addFavorite.mutateAsync({ 
          userId: user.id, 
          placeId,
          listName: 'Favorites' 
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite');
    }
  };

  if (isLoading) {
    return (
      <TouchableOpacity style={styles.button} disabled>
        <ActivityIndicator size="small" color={color} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handlePress}
      disabled={addFavorite.isPending || removeFavorite.isPending}
    >
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
