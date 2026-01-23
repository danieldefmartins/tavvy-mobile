/**
 * useProfile Hook
 * React hook for managing user profile state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  UserProfile,
  UpdateProfileData,
  getProfile,
  upsertProfile,
  updateProfile,
  uploadAvatar,
  getUserStats,
  isUsernameAvailable,
} from '../lib/profileService';

export interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  stats: {
    reviews: number;
    savedPlaces: number;
  };
}

export function useProfile() {
  const { user } = useAuth();
  const [state, setState] = useState<ProfileState>({
    profile: null,
    loading: true,
    error: null,
    stats: { reviews: 0, savedPlaces: 0 },
  });

  // Fetch profile and stats
  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setState(prev => ({ ...prev, loading: false, profile: null }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [profile, stats] = await Promise.all([
        getProfile(user.id),
        getUserStats(user.id),
      ]);

      setState({
        profile,
        loading: false,
        error: null,
        stats,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update profile
  const update = useCallback(async (updates: UpdateProfileData): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      const result = await upsertProfile(user.id, updates);
      
      if (result.success && result.profile) {
        setState(prev => ({
          ...prev,
          profile: result.profile!,
        }));
      }

      return { success: result.success, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user?.id]);

  // Upload and update avatar
  const updateAvatar = useCallback(async (imageUri: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'Not logged in' };
    }

    try {
      // Upload image
      const uploadResult = await uploadAvatar(user.id, imageUri);
      
      if (!uploadResult.success || !uploadResult.url) {
        return { success: false, error: uploadResult.error || 'Upload failed' };
      }

      // Update profile with new avatar URL
      const updateResult = await upsertProfile(user.id, {
        avatar_url: uploadResult.url,
      });

      if (updateResult.success && updateResult.profile) {
        setState(prev => ({
          ...prev,
          profile: updateResult.profile!,
        }));
      }

      return { success: updateResult.success, error: updateResult.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user?.id]);

  // Check username availability
  const checkUsername = useCallback(async (username: string): Promise<boolean> => {
    if (!username || username.length < 3) return false;
    return isUsernameAvailable(username, user?.id);
  }, [user?.id]);

  // Refresh profile and stats
  const refresh = useCallback(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    ...state,
    update,
    updateAvatar,
    checkUsername,
    refresh,
  };
}

export default useProfile;
