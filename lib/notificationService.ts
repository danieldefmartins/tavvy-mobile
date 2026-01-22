// =============================================
// NOTIFICATION SERVICE
// =============================================
// Handles push notifications for story updates and discovery features

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabaseClient';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Notification types
export type NotificationType = 
  | 'new_story'
  | 'story_expiring'
  | 'place_trending'
  | 'new_follower'
  | 'story_view_milestone';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// =============================================
// PUSH TOKEN MANAGEMENT
// =============================================

/**
 * Register for push notifications and save token to database
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if running on a physical device
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID || 'tavvy-mobile',
    });
    const token = tokenData.data;

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });

      await Notifications.setNotificationChannelAsync('stories', {
        name: 'Stories',
        description: 'Notifications for new stories from places you follow',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
      });

      await Notifications.setNotificationChannelAsync('trending', {
        name: 'Trending',
        description: 'Notifications for trending places nearby',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    // Save token to database
    await savePushToken(token);

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Save push token to user's profile in database
 */
async function savePushToken(token: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: user.id,
        push_token: token,
        platform: Platform.OS,
        device_name: Device.deviceName || 'Unknown',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,push_token',
      });
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

/**
 * Remove push token when user logs out
 */
export async function removePushToken(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    
    await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('push_token', tokenData.data);
  } catch (error) {
    console.error('Error removing push token:', error);
  }
}

// =============================================
// NOTIFICATION PREFERENCES
// =============================================

export interface NotificationPreferences {
  new_stories: boolean;
  story_expiring: boolean;
  place_trending: boolean;
  new_followers: boolean;
  story_milestones: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  new_stories: true,
  story_expiring: true,
  place_trending: true,
  new_followers: true,
  story_milestones: true,
};

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return DEFAULT_PREFERENCES;

    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return DEFAULT_PREFERENCES;

    return {
      new_stories: data.new_stories ?? true,
      story_expiring: data.story_expiring ?? true,
      place_trending: data.place_trending ?? true,
      new_followers: data.new_followers ?? true,
      story_milestones: data.story_milestones ?? true,
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Update user's notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    return !error;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

// =============================================
// LOCAL NOTIFICATIONS
// =============================================

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  payload: NotificationPayload,
  triggerSeconds?: number
): Promise<string | null> {
  try {
    const trigger = triggerSeconds 
      ? { seconds: triggerSeconds }
      : null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: {
          type: payload.type,
          ...payload.data,
        },
        sound: true,
        badge: 1,
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

// =============================================
// NOTIFICATION LISTENERS
// =============================================

/**
 * Add listener for received notifications (app in foreground)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for notification responses (user tapped notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// =============================================
// STORY-SPECIFIC NOTIFICATIONS
// =============================================

/**
 * Send notification when a followed place posts a new story
 */
export async function notifyNewStory(
  placeId: string,
  placeName: string,
  storyId: string
): Promise<void> {
  await scheduleLocalNotification({
    type: 'new_story',
    title: `${placeName} posted a new story`,
    body: 'Tap to watch their latest update',
    data: {
      placeId,
      storyId,
      screen: 'StoryViewer',
    },
  });
}

/**
 * Send notification when user's story is about to expire
 */
export async function notifyStoryExpiring(
  storyId: string,
  placeName: string,
  hoursRemaining: number
): Promise<void> {
  await scheduleLocalNotification({
    type: 'story_expiring',
    title: 'Story expiring soon',
    body: `Your story at ${placeName} will expire in ${hoursRemaining} hours`,
    data: {
      storyId,
      screen: 'StoryViewer',
    },
  });
}

/**
 * Send notification when a place starts trending
 */
export async function notifyPlaceTrending(
  placeId: string,
  placeName: string,
  reason: string
): Promise<void> {
  await scheduleLocalNotification({
    type: 'place_trending',
    title: `${placeName} is trending!`,
    body: reason,
    data: {
      placeId,
      screen: 'PlaceDetails',
    },
  });
}

/**
 * Send notification when story reaches view milestone
 */
export async function notifyStoryMilestone(
  storyId: string,
  viewCount: number
): Promise<void> {
  await scheduleLocalNotification({
    type: 'story_view_milestone',
    title: 'Your story is getting views!',
    body: `Your story has reached ${viewCount} views`,
    data: {
      storyId,
      screen: 'StoryAnalytics',
    },
  });
}

// =============================================
// BADGE MANAGEMENT
// =============================================

/**
 * Get current badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
}

/**
 * Clear badge
 */
export async function clearBadge(): Promise<void> {
  await setBadgeCount(0);
}

// =============================================
// FOLLOW MANAGEMENT FOR NOTIFICATIONS
// =============================================

/**
 * Follow a place to receive story notifications
 */
export async function followPlace(placeId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_place_follows')
      .upsert({
        user_id: user.id,
        place_id: placeId,
        notify_stories: true,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,place_id',
      });

    return !error;
  } catch (error) {
    console.error('Error following place:', error);
    return false;
  }
}

/**
 * Unfollow a place
 */
export async function unfollowPlace(placeId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_place_follows')
      .delete()
      .eq('user_id', user.id)
      .eq('place_id', placeId);

    return !error;
  } catch (error) {
    console.error('Error unfollowing place:', error);
    return false;
  }
}

/**
 * Check if user follows a place
 */
export async function isFollowingPlace(placeId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('user_place_follows')
      .select('id')
      .eq('user_id', user.id)
      .eq('place_id', placeId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Toggle story notifications for a followed place
 */
export async function togglePlaceNotifications(
  placeId: string,
  enabled: boolean
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('user_place_follows')
      .update({ notify_stories: enabled })
      .eq('user_id', user.id)
      .eq('place_id', placeId);

    return !error;
  } catch (error) {
    console.error('Error toggling place notifications:', error);
    return false;
  }
}

/**
 * Get list of followed places
 */
export async function getFollowedPlaces(): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('user_place_follows')
      .select('place_id')
      .eq('user_id', user.id);

    if (error) return [];

    return data?.map(f => f.place_id) || [];
  } catch (error) {
    console.error('Error getting followed places:', error);
    return [];
  }
}
