/**
 * Profile Service
 * Handles user profile CRUD operations and avatar uploads
 */

import { supabase } from './supabaseClient';

export interface UserProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  trusted_contributor: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
}

/**
 * Get user profile by user ID
 */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Profile might not exist yet
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in getProfile:', error);
    return null;
  }
}

/**
 * Create or update user profile (upsert)
 * Uses UPDATE for existing records to preserve unspecified fields
 */
export async function upsertProfile(
  userId: string,
  profileData: UpdateProfileData
): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
  try {
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      // Profile exists - use UPDATE to preserve other fields
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('username')) {
          return { success: false, error: 'Username is already taken' };
        }
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, profile: data as UserProfile };
    } else {
      // Profile doesn't exist - INSERT new record
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505' && error.message.includes('username')) {
          return { success: false, error: 'Username is already taken' };
        }
        console.error('Error inserting profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, profile: data as UserProfile };
    }
  } catch (error: any) {
    console.error('Error in upsertProfile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update specific profile fields
 */
export async function updateProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation on username
      if (error.code === '23505' && error.message.includes('username')) {
        return { success: false, error: 'Username is already taken' };
      }
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, profile: data as UserProfile };
  } catch (error: any) {
    console.error('Error in updateProfile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string, currentUserId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('profiles')
      .select('user_id')
      .eq('username', username.toLowerCase());

    // Exclude current user when checking
    if (currentUserId) {
      query = query.neq('user_id', currentUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking username:', error);
      return false;
    }

    return !data || data.length === 0;
  } catch (error) {
    console.error('Error in isUsernameAvailable:', error);
    return false;
  }
}

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Generate unique filename
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;

    // Fetch the image and convert to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, {
        contentType: `image/${fileExt}`,
        upsert: true,
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error('Error in uploadAvatar:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete old avatar from storage
 */
export async function deleteAvatar(avatarUrl: string): Promise<boolean> {
  try {
    // Extract path from URL
    const urlParts = avatarUrl.split('/avatars/');
    if (urlParts.length < 2) return false;

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting avatar:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAvatar:', error);
    return false;
  }
}

/**
 * Get user stats (reviews, saved places)
 */
export async function getUserStats(userId: string): Promise<{
  reviews: number;
  savedPlaces: number;
}> {
  try {
    // Fetch reviews count from place_reviews
    const { count: reviewsCount } = await supabase
      .from('place_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Fetch saved places count from user_favorites
    const { count: savedCount } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      reviews: reviewsCount || 0,
      savedPlaces: savedCount || 0,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { reviews: 0, savedPlaces: 0 };
  }
}

/**
 * Get profile by username
 */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error) {
      console.error('Error fetching profile by username:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in getProfileByUsername:', error);
    return null;
  }
}
