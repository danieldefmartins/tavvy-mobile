/**
 * User Preferences Service
 * 
 * Tracks user behavior to provide personalized content on the home screen.
 * Stores search queries, viewed categories, locations, and places.
 * 
 * Path: lib/userPreferencesService.ts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SearchEntry {
  query: string;
  timestamp: number;
  category?: string;
  location?: string;
}

export interface CategoryView {
  category: string;
  count: number;
  lastViewed: number;
}

export interface LocationSearch {
  city?: string;
  state?: string;
  country?: string;
  count: number;
  lastSearched: number;
}

export interface PlaceView {
  placeId: string;
  placeName: string;
  category?: string;
  timestamp: number;
}

export interface UserPreferences {
  // Search history
  recentSearches: SearchEntry[];
  
  // Category preferences (what they search for most)
  categoryViews: CategoryView[];
  
  // Location preferences (where they search)
  locationSearches: LocationSearch[];
  
  // Places they've viewed
  recentPlaceViews: PlaceView[];
  
  // User's home location (detected or set)
  homeLocation?: {
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  
  // Time-based patterns
  preferredSearchTimes?: {
    morning: number;   // 6am-12pm
    afternoon: number; // 12pm-6pm
    evening: number;   // 6pm-12am
    night: number;     // 12am-6am
  };
  
  // Last updated timestamp
  lastUpdated: number;
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  USER_PREFERENCES: '@tavvy_user_preferences',
  SEARCH_HISTORY: '@tavvy_search_history',
};

// ============================================
// DEFAULT PREFERENCES
// ============================================

const DEFAULT_PREFERENCES: UserPreferences = {
  recentSearches: [],
  categoryViews: [],
  locationSearches: [],
  recentPlaceViews: [],
  preferredSearchTimes: {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  },
  lastUpdated: Date.now(),
};

// ============================================
// LIMITS
// ============================================

const MAX_RECENT_SEARCHES = 50;
const MAX_RECENT_PLACE_VIEWS = 100;
const MAX_CATEGORY_VIEWS = 20;
const MAX_LOCATION_SEARCHES = 30;

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'night';
}

// ============================================
// MAIN SERVICE
// ============================================

class UserPreferencesService {
  private preferences: UserPreferences = DEFAULT_PREFERENCES;
  private initialized: boolean = false;

  /**
   * Initialize the service by loading stored preferences
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (stored) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
      this.initialized = true;
      console.log('✅ User preferences loaded');
    } catch (error) {
      console.error('Error loading user preferences:', error);
      this.preferences = DEFAULT_PREFERENCES;
      this.initialized = true;
    }
  }

  /**
   * Save preferences to storage
   */
  private async savePreferences(): Promise<void> {
    try {
      this.preferences.lastUpdated = Date.now();
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(this.preferences)
      );
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Track a search query
   */
  async trackSearch(query: string, category?: string, location?: string): Promise<void> {
    await this.initialize();
    
    const entry: SearchEntry = {
      query: query.toLowerCase().trim(),
      timestamp: Date.now(),
      category,
      location,
    };

    // Add to recent searches (avoid duplicates of same query)
    this.preferences.recentSearches = this.preferences.recentSearches.filter(
      s => s.query !== entry.query
    );
    this.preferences.recentSearches.unshift(entry);
    
    // Limit size
    if (this.preferences.recentSearches.length > MAX_RECENT_SEARCHES) {
      this.preferences.recentSearches = this.preferences.recentSearches.slice(0, MAX_RECENT_SEARCHES);
    }

    // Update time-of-day preferences
    const timeOfDay = getTimeOfDay();
    if (this.preferences.preferredSearchTimes) {
      this.preferences.preferredSearchTimes[timeOfDay]++;
    }

    await this.savePreferences();
  }

  /**
   * Track a category view/filter
   */
  async trackCategoryView(category: string): Promise<void> {
    await this.initialize();
    
    const normalizedCategory = category.toLowerCase().trim();
    const existing = this.preferences.categoryViews.find(
      c => c.category === normalizedCategory
    );

    if (existing) {
      existing.count++;
      existing.lastViewed = Date.now();
    } else {
      this.preferences.categoryViews.push({
        category: normalizedCategory,
        count: 1,
        lastViewed: Date.now(),
      });
    }

    // Sort by count and limit
    this.preferences.categoryViews.sort((a, b) => b.count - a.count);
    if (this.preferences.categoryViews.length > MAX_CATEGORY_VIEWS) {
      this.preferences.categoryViews = this.preferences.categoryViews.slice(0, MAX_CATEGORY_VIEWS);
    }

    await this.savePreferences();
  }

  /**
   * Track a location search
   */
  async trackLocationSearch(city?: string, state?: string, country?: string): Promise<void> {
    await this.initialize();
    
    if (!city && !state) return;

    const key = `${city || ''}-${state || ''}-${country || ''}`.toLowerCase();
    const existing = this.preferences.locationSearches.find(
      l => `${l.city || ''}-${l.state || ''}-${l.country || ''}`.toLowerCase() === key
    );

    if (existing) {
      existing.count++;
      existing.lastSearched = Date.now();
    } else {
      this.preferences.locationSearches.push({
        city,
        state,
        country,
        count: 1,
        lastSearched: Date.now(),
      });
    }

    // Sort by count and limit
    this.preferences.locationSearches.sort((a, b) => b.count - a.count);
    if (this.preferences.locationSearches.length > MAX_LOCATION_SEARCHES) {
      this.preferences.locationSearches = this.preferences.locationSearches.slice(0, MAX_LOCATION_SEARCHES);
    }

    await this.savePreferences();
  }

  /**
   * Track a place view
   */
  async trackPlaceView(placeId: string, placeName: string, category?: string): Promise<void> {
    await this.initialize();
    
    const entry: PlaceView = {
      placeId,
      placeName,
      category,
      timestamp: Date.now(),
    };

    // Remove duplicate if exists
    this.preferences.recentPlaceViews = this.preferences.recentPlaceViews.filter(
      p => p.placeId !== placeId
    );
    this.preferences.recentPlaceViews.unshift(entry);

    // Limit size
    if (this.preferences.recentPlaceViews.length > MAX_RECENT_PLACE_VIEWS) {
      this.preferences.recentPlaceViews = this.preferences.recentPlaceViews.slice(0, MAX_RECENT_PLACE_VIEWS);
    }

    // Also track the category
    if (category) {
      await this.trackCategoryView(category);
    }

    await this.savePreferences();
  }

  /**
   * Set user's home location
   */
  async setHomeLocation(
    city: string,
    state: string,
    country: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    await this.initialize();
    
    this.preferences.homeLocation = {
      city,
      state,
      country,
      latitude,
      longitude,
    };

    await this.savePreferences();
  }

  /**
   * Get all preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    await this.initialize();
    return this.preferences;
  }

  /**
   * Get recent searches
   */
  async getRecentSearches(limit: number = 10): Promise<SearchEntry[]> {
    await this.initialize();
    return this.preferences.recentSearches.slice(0, limit);
  }

  /**
   * Get top categories
   */
  async getTopCategories(limit: number = 5): Promise<CategoryView[]> {
    await this.initialize();
    return this.preferences.categoryViews.slice(0, limit);
  }

  /**
   * Get top locations
   */
  async getTopLocations(limit: number = 5): Promise<LocationSearch[]> {
    await this.initialize();
    return this.preferences.locationSearches.slice(0, limit);
  }

  /**
   * Get recently viewed places
   */
  async getRecentPlaceViews(limit: number = 10): Promise<PlaceView[]> {
    await this.initialize();
    return this.preferences.recentPlaceViews.slice(0, limit);
  }

  /**
   * Get home location
   */
  async getHomeLocation(): Promise<UserPreferences['homeLocation']> {
    await this.initialize();
    return this.preferences.homeLocation;
  }

  /**
   * Get personalized content suggestions based on preferences
   */
  async getPersonalizedSuggestions(): Promise<{
    suggestedCategories: string[];
    suggestedCities: string[];
    recentSearchTerms: string[];
    favoriteTimeOfDay: string;
  }> {
    await this.initialize();

    // Top categories
    const suggestedCategories = this.preferences.categoryViews
      .slice(0, 5)
      .map(c => c.category);

    // Top cities
    const suggestedCities = this.preferences.locationSearches
      .filter(l => l.city)
      .slice(0, 5)
      .map(l => l.city as string);

    // Recent search terms
    const recentSearchTerms = this.preferences.recentSearches
      .slice(0, 5)
      .map(s => s.query);

    // Favorite time of day
    const times = this.preferences.preferredSearchTimes || {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };
    const favoriteTimeOfDay = Object.entries(times).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    return {
      suggestedCategories,
      suggestedCities,
      recentSearchTerms,
      favoriteTimeOfDay,
    };
  }

  /**
   * Clear all preferences (for testing or user request)
   */
  async clearPreferences(): Promise<void> {
    this.preferences = DEFAULT_PREFERENCES;
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    console.log('✅ User preferences cleared');
  }

  /**
   * Sync preferences to Supabase (for logged-in users)
   */
  async syncToCloud(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preferences: this.preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error syncing preferences to cloud:', error);
      } else {
        console.log('✅ Preferences synced to cloud');
      }
    } catch (error) {
      console.error('Error syncing preferences:', error);
    }
  }

  /**
   * Load preferences from cloud (for logged-in users)
   */
  async loadFromCloud(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('No cloud preferences found, using local');
        return;
      }

      if (data?.preferences) {
        this.preferences = { ...DEFAULT_PREFERENCES, ...data.preferences };
        await this.savePreferences();
        console.log('✅ Preferences loaded from cloud');
      }
    } catch (error) {
      console.error('Error loading preferences from cloud:', error);
    }
  }
}

// Export singleton instance
export const userPreferencesService = new UserPreferencesService();

// Export convenience functions
export const trackSearch = (query: string, category?: string, location?: string) =>
  userPreferencesService.trackSearch(query, category, location);

export const trackCategoryView = (category: string) =>
  userPreferencesService.trackCategoryView(category);

export const trackLocationSearch = (city?: string, state?: string, country?: string) =>
  userPreferencesService.trackLocationSearch(city, state, country);

export const trackPlaceView = (placeId: string, placeName: string, category?: string) =>
  userPreferencesService.trackPlaceView(placeId, placeName, category);

export const getPersonalizedSuggestions = () =>
  userPreferencesService.getPersonalizedSuggestions();

export const getRecentSearches = (limit?: number) =>
  userPreferencesService.getRecentSearches(limit);

export const getTopCategories = (limit?: number) =>
  userPreferencesService.getTopCategories(limit);

export const getRecentPlaceViews = (limit?: number) =>
  userPreferencesService.getRecentPlaceViews(limit);