/**
 * useDrafts Hook - Manages content drafts for Universal Add
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Note: Using simple fetch-based online check instead of NetInfo
import { supabase } from '../lib/supabaseClient';

export type ContentType = 'business' | 'universe' | 'city' | 'rv_campground' | 'event' | 'quick_add';
export type ContentSubtype = 
  | 'physical' | 'service' | 'on_the_go'
  | 'new_universe' | 'spot_in_universe'
  | 'rv_park' | 'campground' | 'boondocking' | 'overnight_parking'
  | 'restroom' | 'parking' | 'atm' | 'water_fountain' | 'pet_relief' | 'photo_spot';

export type DraftStatus = 
  | 'draft_location' | 'draft_type_selected' | 'draft_subtype_selected'
  | 'draft_details' | 'draft_review' | 'submitted' | 'failed';

export interface ContentDraft {
  id: string;
  user_id: string;
  status: DraftStatus;
  current_step: number;
  latitude: number | null;
  longitude: number | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  formatted_address: string | null;
  content_type: ContentType | null;
  content_subtype: ContentSubtype | null;
  data: Record<string, any>;
  photos: string[];
  cover_photo: string | null;
  created_at: string;
  updated_at: string;
  remind_later_until: string | null;
  is_offline: boolean;
  offline_created_at: string | null;
  sync_status: 'synced' | 'pending' | 'failed';
}

interface CreateDraftInput {
  latitude: number;
  longitude: number;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
  formatted_address?: string;
}

interface UpdateDraftInput {
  status?: DraftStatus;
  current_step?: number;
  content_type?: ContentType;
  content_subtype?: ContentSubtype;
  data?: Record<string, any>;
  photos?: string[];
  cover_photo?: string;
  [key: string]: any;
}

interface SubmitResult {
  success: boolean;
  final_id?: string;
  final_table?: string;
  taps_earned?: number;
  error?: string;
}

const OFFLINE_DRAFTS_KEY = '@tavvy_offline_drafts';
const AUTO_SAVE_DELAY = 2000;

export function useDrafts() {
  const [currentDraft, setCurrentDraft] = useState<ContentDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingDraft, setPendingDraft] = useState<ContentDraft | null>(null);
  
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdates = useRef<UpdateDraftInput>({});

  // Simple online check using fetch
  const checkOnlineStatus = useCallback(async () => {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
      });
      setIsOnline(response.ok);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    checkOnlineStatus();
    // Check online status periodically
    const interval = setInterval(checkOnlineStatus, 30000);
    return () => clearInterval(interval);
  }, [checkOnlineStatus]);

  useEffect(() => {
    checkForPendingDraft();
  }, []);

  const checkForPendingDraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: draft } = await supabase
        .from('content_drafts')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'submitted')
        .is('remind_later_until', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draft) {
        setPendingDraft(draft as ContentDraft);
      }
    } catch (error) {
      console.error('[useDrafts] Error checking for pending draft:', error);
    }
  };

  const createDraft = async (input: CreateDraftInput): Promise<ContentDraft | null> => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!isOnline) {
        const offlineDraft: ContentDraft = {
          id: `offline_${Date.now()}`,
          user_id: user.id,
          status: 'draft_location',
          current_step: 1,
          ...input,
          latitude: input.latitude,
          longitude: input.longitude,
          address_line1: input.address_line1 || null,
          address_line2: input.address_line2 || null,
          city: input.city || null,
          region: input.region || null,
          postal_code: input.postal_code || null,
          country: input.country || null,
          formatted_address: input.formatted_address || null,
          content_type: null,
          content_subtype: null,
          data: {},
          photos: [],
          cover_photo: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          remind_later_until: null,
          is_offline: true,
          offline_created_at: new Date().toISOString(),
          sync_status: 'pending',
        };
        
        await saveOfflineDraft(offlineDraft);
        setCurrentDraft(offlineDraft);
        return offlineDraft;
      }

      const { data, error } = await supabase
        .from('content_drafts')
        .insert({
          user_id: user.id,
          status: 'draft_location',
          current_step: 1,
          ...input,
          data: {},
          photos: [],
          sync_status: 'synced',
        })
        .select()
        .single();

      if (error) throw error;
      
      setCurrentDraft(data as ContentDraft);
      return data as ContentDraft;
    } catch (error) {
      console.error('[useDrafts] Error creating draft:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDraft = useCallback(async (updates: UpdateDraftInput, immediate = false) => {
    if (!currentDraft) return;

    pendingUpdates.current = {
      ...pendingUpdates.current,
      ...updates,
      data: updates.data 
        ? { ...pendingUpdates.current.data, ...updates.data }
        : pendingUpdates.current.data,
    };

    setCurrentDraft(prev => prev ? {
      ...prev,
      ...updates,
      data: updates.data ? { ...prev.data, ...updates.data } : prev.data,
      updated_at: new Date().toISOString(),
    } : null);

    if (immediate) {
      await flushPendingUpdates();
    } else {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(flushPendingUpdates, AUTO_SAVE_DELAY);
    }
  }, [currentDraft]);

  const flushPendingUpdates = async () => {
    if (!currentDraft || Object.keys(pendingUpdates.current).length === 0) return;

    setIsSaving(true);
    try {
      const updates = { ...pendingUpdates.current };
      pendingUpdates.current = {};

      if (currentDraft.is_offline || !isOnline) {
        const updatedDraft = {
          ...currentDraft,
          ...updates,
          data: updates.data ? { ...currentDraft.data, ...updates.data } : currentDraft.data,
          updated_at: new Date().toISOString(),
          sync_status: 'pending' as const,
        };
        await saveOfflineDraft(updatedDraft);
        setCurrentDraft(updatedDraft);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        if (updates.data) {
          updates.data = { ...currentDraft.data, ...updates.data };
        }

        const { data, error } = await supabase
          .from('content_drafts')
          .update(updates)
          .eq('id', currentDraft.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setCurrentDraft(data as ContentDraft);
      }
    } catch (error) {
      console.error('[useDrafts] Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDraft = async (draftId?: string): Promise<boolean> => {
    const id = draftId || currentDraft?.id;
    if (!id) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (id.startsWith('offline_')) {
        await removeOfflineDraft(id);
      } else {
        await supabase.from('content_drafts').delete().eq('id', id).eq('user_id', user.id);
      }

      if (id === currentDraft?.id) setCurrentDraft(null);
      if (id === pendingDraft?.id) setPendingDraft(null);
      return true;
    } catch (error) {
      console.error('[useDrafts] Error deleting draft:', error);
      return false;
    }
  };

  const snoozeDraft = async (hours: number = 24): Promise<boolean> => {
    if (!currentDraft) return false;
    const remindAt = new Date();
    remindAt.setHours(remindAt.getHours() + hours);
    await updateDraft({ remind_later_until: remindAt.toISOString() } as any, true);
    setCurrentDraft(null);
    setPendingDraft(null);
    return true;
  };

  const submitDraft = async (): Promise<SubmitResult> => {
    if (!currentDraft) return { success: false, error: 'No draft to submit' };
    await flushPendingUpdates();

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!currentDraft.latitude || !currentDraft.longitude) {
        return { success: false, error: 'Location is required' };
      }
      if (!currentDraft.content_type) {
        return { success: false, error: 'Content type is required' };
      }

      let result: SubmitResult;
      switch (currentDraft.content_type) {
        case 'business':
        case 'quick_add':
          result = await submitToTavvyPlaces(currentDraft, user.id);
          break;
        case 'event':
          result = await submitToTavvyEvents(currentDraft, user.id);
          break;
        case 'rv_campground':
          result = await submitToTavvyRvCampgrounds(currentDraft, user.id);
          break;
        default:
          return { success: false, error: `Unknown content type` };
      }

      if (result.success) {
        if (!currentDraft.id.startsWith('offline_')) {
          await supabase.from('content_drafts').update({ status: 'submitted' }).eq('id', currentDraft.id);
        } else {
          await removeOfflineDraft(currentDraft.id);
        }
        setCurrentDraft(null);
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to submit' };
    } finally {
      setIsLoading(false);
    }
  };

  const resumeDraft = (draft: ContentDraft) => {
    setCurrentDraft(draft);
    setPendingDraft(null);
  };

  const dismissPendingDraft = () => setPendingDraft(null);

  const saveOfflineDraft = async (draft: ContentDraft) => {
    const existing = await AsyncStorage.getItem(OFFLINE_DRAFTS_KEY);
    const drafts: ContentDraft[] = existing ? JSON.parse(existing) : [];
    const index = drafts.findIndex(d => d.id === draft.id);
    if (index >= 0) drafts[index] = draft;
    else drafts.push(draft);
    await AsyncStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(drafts));
  };

  const removeOfflineDraft = async (draftId: string) => {
    const existing = await AsyncStorage.getItem(OFFLINE_DRAFTS_KEY);
    if (!existing) return;
    const drafts: ContentDraft[] = JSON.parse(existing);
    await AsyncStorage.setItem(OFFLINE_DRAFTS_KEY, JSON.stringify(drafts.filter(d => d.id !== draftId)));
  };

  return {
    currentDraft, pendingDraft, isLoading, isSaving, isOnline,
    createDraft, updateDraft, deleteDraft, snoozeDraft, submitDraft,
    resumeDraft, dismissPendingDraft, flushPendingUpdates,
  };
}

/**
 * Maps business type to database place_type constraint
 * Database only allows: 'fixed' or 'on_the_go'
 */
function getPlaceType(contentSubtype: string | null | undefined, hasPhysicalLocation?: boolean): 'fixed' | 'on_the_go' {
  if (contentSubtype === 'on_the_go') {
    return 'on_the_go';
  }
  if (contentSubtype === 'service') {
    // Service businesses: fixed if they have a physical location, on_the_go if they don't
    return hasPhysicalLocation === false ? 'on_the_go' : 'fixed';
  }
  // physical and all other types default to fixed
  return 'fixed';
}

async function submitToTavvyPlaces(draft: ContentDraft, userId: string): Promise<SubmitResult> {
  const { data, error } = await supabase.from('tavvy_places').insert({
    // Basic info
    name: draft.data?.name || draft.content_subtype || 'Place',
    description: draft.data?.description,
    tavvy_category: draft.data?.tavvy_category || draft.content_subtype || 'other',
    tavvy_subcategory: draft.data?.tavvy_subcategory,
    
    // Location - GPS coordinates
    latitude: draft.latitude,
    longitude: draft.longitude,
    
    // Address fields
    address: draft.address_line1,
    address_line1: draft.address_line1,
    address_line2: draft.address_line2,
    formatted_address: draft.formatted_address,
    city: draft.city,
    region: draft.region,
    postcode: draft.postal_code,
    country: draft.country,
    
    // Contact info
    phone: draft.data?.phone,
    email: draft.data?.email,
    website: draft.data?.website,
    instagram: draft.data?.instagram,
    facebook: draft.data?.facebook,
    twitter: draft.data?.twitter,
    tiktok: draft.data?.tiktok,
    
    // Photos
    photos: draft.photos,
    cover_image_url: draft.cover_photo,
    
    // Place type - database only allows 'fixed' or 'on_the_go'
    // physical → fixed, on_the_go → on_the_go, service → fixed (if has location) or on_the_go (if no physical location)
    place_type: getPlaceType(draft.content_subtype, draft.data?.has_physical_location),
    place_subtype: draft.content_subtype,
    service_area: draft.data?.service_area,
    
    // Quick add fields
    is_quick_add: draft.content_type === 'quick_add',
    quick_add_type: draft.content_type === 'quick_add' ? draft.content_subtype : null,
    
    // Metadata
    source: 'user',
    created_by: userId,
    draft_id: draft.id,
    notes: draft.data?.notes,
  }).select('id').single();
  
  if (error) return { success: false, error: error.message };
  return { success: true, final_id: data.id, final_table: 'tavvy_places', taps_earned: 50 };
}

async function submitToTavvyEvents(draft: ContentDraft, userId: string): Promise<SubmitResult> {
  const { data, error } = await supabase.from('tavvy_events').insert({
    name: draft.data?.name, description: draft.data?.description,
    latitude: draft.latitude, longitude: draft.longitude,
    address_line1: draft.address_line1, city: draft.city, region: draft.region,
    country: draft.country, formatted_address: draft.formatted_address,
    start_datetime: draft.data?.start_datetime, end_datetime: draft.data?.end_datetime,
    is_all_day: draft.data?.is_all_day || false, event_category: draft.data?.event_category,
    cover_photo: draft.cover_photo, photos: draft.photos,
    ticket_url: draft.data?.ticket_url, is_free: draft.data?.is_free !== false,
    created_by: userId, status: 'published',
  }).select('id').single();
  if (error) return { success: false, error: error.message };
  return { success: true, final_id: data.id, final_table: 'tavvy_events', taps_earned: 50 };
}

async function submitToTavvyRvCampgrounds(draft: ContentDraft, userId: string): Promise<SubmitResult> {
  const { data, error } = await supabase.from('tavvy_rv_campgrounds').insert({
    name: draft.data?.name, description: draft.data?.description,
    latitude: draft.latitude, longitude: draft.longitude,
    address_line1: draft.address_line1, city: draft.city, region: draft.region,
    country: draft.country, formatted_address: draft.formatted_address,
    campground_type: draft.content_subtype, amenities: draft.data?.amenities || {},
    has_electric: draft.data?.has_electric, has_water: draft.data?.has_water,
    has_sewer: draft.data?.has_sewer, has_wifi: draft.data?.has_wifi,
    price_per_night: draft.data?.price_per_night,
    phone: draft.data?.phone, website: draft.data?.website,
    cover_photo: draft.cover_photo, photos: draft.photos,
    created_by: userId, status: 'published',
  }).select('id').single();
  if (error) return { success: false, error: error.message };
  return { success: true, final_id: data.id, final_table: 'tavvy_rv_campgrounds', taps_earned: 50 };
}

export default useDrafts;
