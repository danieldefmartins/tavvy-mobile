/**
 * useAutoSave -- watches dirty state in the editor context,
 * debounces for 2 seconds, then uploads pending files and saves card + links.
 *
 * React Native port:
 * - Uploads native file bytes to supabase.storage as ArrayBuffer
 * - Filters out file:// URIs before saving to DB
 * - Queries digital_cards / digital_card_links directly
 */

import { useEffect, useRef, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { ecardLinkSavePayload } from './savePayload';
import { useEditor } from './EditorContext';
import { supabase } from '../../lib/supabaseClient';
import { getTemplateById } from '../../config/eCardTemplates';
import { CardData, LinkItem, PendingUpload } from './editorReducer';

// ── Types ────────────────────────────────────────────────────────────────────

interface UseAutoSaveOptions {
  userId: string | undefined;
  isPro: boolean;
  debounceMs?: number;
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  saveNow: () => Promise<boolean>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the URL is a local file path (not yet uploaded). */
function isLocalUri(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('file://') || url.startsWith('content://') || url.startsWith('blob:');
}

/** Strip local URIs -- never persist file:// or content:// paths to DB. */
function cleanUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (isLocalUri(url)) return undefined;
  return url;
}

/** Extract filename from a URI for storage path. */
function filenameFromUri(uri: string): string {
  const parts = uri.split('/');
  return parts[parts.length - 1] || `upload_${Date.now()}`;
}

/**
 * Read native file bytes; URI objects and Blob bodies are not reliable in React Native.
 */
async function uploadFile(
  userId: string,
  upload: PendingUpload,
  folder: string
): Promise<string | null> {
  const filename = filenameFromUri(upload.uri);
  const storagePath = `${userId}/${folder}/${Date.now()}_${filename}`;
  const mimeType = upload.type || 'image/jpeg';

  const bytes = decode(await FileSystem.readAsStringAsync(upload.uri, { encoding: FileSystem.EncodingType.Base64 }));
  const { data, error } = await supabase.storage.from('ecard-assets').upload(storagePath, bytes, { contentType: mimeType, upsert: false });

  if (error) {
    console.error(`[useAutoSave] Upload failed (${folder}):`, error.message);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('ecard-assets')
    .getPublicUrl(data.path);

  return urlData?.publicUrl || null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAutoSave({
  userId,
  isPro,
  debounceMs = 2000,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const { state, dispatch } = useEditor();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const latestState = useRef(state);
  latestState.current = state;
  const badgeFields = ['show_licensed_badge', 'show_insured_badge', 'show_bonded_badge', 'show_tavvy_verified_badge'] as const;
  const savedBadges = useRef<{ cardId: string; values: Record<string, boolean> } | null>(null);
  if (state.card?.id && savedBadges.current?.cardId !== state.card.id) {
    savedBadges.current = { cardId: state.card.id, values: Object.fromEntries(badgeFields.map(key => [key, !!state.card?.[key]])) };
  }

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── Core save logic ──────────────────────────────────────────────────────

  const performSave = useCallback(async () => {
    const { card, links, pendingUploads } = state;
    if (inFlightRef.current) return false;
    if (!card?.id || !userId) return false;

    // Validate template access -- premium templates require pro subscription
    const tpl = getTemplateById(card.template_id || 'basic');
    if (tpl?.isPremium && !isPro) { dispatch({ type: 'MARK_SAVE_ERROR', error: 'This template requires an active Pro subscription.' }); return false; }
    inFlightRef.current = true;

    dispatch({ type: 'MARK_SAVING' });

    try {
      // 1. Upload pending files ───────────────────────────────────────────

      let photoUrl = card.profile_photo_url;
      const profileUpload = pendingUploads.get('profile_photo');
      if (profileUpload) {
        const uploaded = await uploadFile(userId, profileUpload, 'profile');
        if (!uploaded) throw new Error('Image upload failed. Your changes remain unsaved.');
        photoUrl = uploaded;
      }

      let bannerUrl = card.banner_image_url;
      const bannerUpload = pendingUploads.get('banner_image');
      if (bannerUpload) {
        const uploaded = await uploadFile(userId, bannerUpload, 'banner');
        if (!uploaded) throw new Error('Image upload failed. Your changes remain unsaved.');
        bannerUrl = uploaded;
      }

      let logoUrl = card.company_logo_url;
      const logoUpload = pendingUploads.get('logo');
      if (logoUpload) {
        const uploaded = await uploadFile(userId, logoUpload, 'logo');
        if (!uploaded) throw new Error('Image upload failed. Your changes remain unsaved.');
        logoUrl = uploaded;
      }

      // Upload gallery images
      const galleryImages: Record<string, any>[] = [];
      for (const img of card.gallery_images || []) {
        const pendingKey = `gallery_${img.id}`;
        const galleryUpload = pendingUploads.get(pendingKey);
        if (galleryUpload) {
          const url = await uploadFile(userId, galleryUpload, 'gallery');
          if (!url) throw new Error('Gallery upload failed. Your changes remain unsaved.');
          const persisted = { ...img, url, caption: img.caption || '' } as Record<string, any>;
          if (isLocalUri(persisted.uri)) delete persisted.uri;
          galleryImages.push(persisted);
        } else {
          if (isLocalUri(img.url) || isLocalUri((img as any).uri)) throw new Error('A gallery photo is not uploaded. Add it again before saving; your changes are still here.');
          galleryImages.push({ ...img });
        }
      }
      if ([photoUrl, bannerUrl, logoUrl, card.background_image_url].some(isLocalUri)) throw new Error('A photo is not uploaded. Add it again before saving; your changes are still here.');

      // 2. Build update payload -- never save local URIs ──────────────────

      const updatePayload: Record<string, any> = {
        full_name: (card.full_name || '').trim(),
        title: card.title || null,
        company: card.company || null,
        bio: card.bio || null,
        pronouns: card.pronouns || null,
        business_type: card.business_type || null,
        description: card.description || null,
        background_type: card.background_type || 'gradient',
        email: card.email || null,
        phone: card.phone || null,
        website: card.website || null,
        website_label: card.website_label || null,
        city: card.city || null,
        state: card.state || null,
        address_1: card.address_1 || null,
        address_2: card.address_2 || null,
        zip_code: card.zip_code || null,
        profile_photo_url: cleanUrl(photoUrl) || null,
        profile_photo_size: card.profile_photo_size || 'medium',
        banner_image_url: cleanUrl(bannerUrl) || null,
        company_logo_url: cleanUrl(logoUrl) || null,
        background_image_url: cleanUrl(card.background_image_url) || null,
        gradient_color_1: card.gradient_color_1 || '#667eea',
        gradient_color_2: card.gradient_color_2 || '#764ba2',
        font_style: card.font_style || 'default',
        font_color: card.font_color || null,
        button_style: card.button_style || 'fill',
        button_color: card.button_color || null,
        icon_color: card.icon_color || null,
        social_icon_color: card.social_icon_color || null,
        template_id: card.template_id,
        color_scheme_id: card.color_scheme_id || null,
        theme: card.theme || 'basic',
        show_contact_info: card.show_contact_info !== false,
        show_social_icons: card.show_social_icons !== false,
        featured_socials: card.featured_socials || [],
        gallery_images: galleryImages,
        videos: card.videos || [],
        card_type: card.card_type || null,
        country_code: card.country_code || null,
        pro_credentials: card.pro_credentials || null,
        professional_category: card.professional_category || null,
        show_licensed_badge: card.show_licensed_badge || false,
        show_insured_badge: card.show_insured_badge || false,
        show_bonded_badge: card.show_bonded_badge || false,
        show_tavvy_verified_badge: card.show_tavvy_verified_badge || false,
        form_block: card.form_block || null,
        // Civic fields
        ballot_number: card.ballot_number || null,
        party_name: card.party_name || null,
        office_running_for: card.office_running_for || null,
        election_year: card.election_year || null,
        campaign_slogan: card.campaign_slogan || null,
        region: card.region || null,
      };

      // Unrelated edits must not reset an already approved badge request.
      if (badgeFields.some(key => updatePayload[key] && !savedBadges.current?.values[key])) {
        updatePayload.badge_approval_status = 'pending';
      }

      // 3. Save card ──────────────────────────────────────────────────────

      const { error: cardError } = await supabase
        .from('digital_cards')
        .update(updatePayload)
        .eq('id', card.id).eq('user_id', userId).select('id').single();

      if (cardError) {
        throw new Error(`Card save failed: ${cardError.message}`);
      }
      savedBadges.current = { cardId: card.id, values: Object.fromEntries(badgeFields.map(key => [key, !!updatePayload[key]])) };

      const { error: linksError } = await supabase.rpc('replace_ecard_links', { p_card_id: card.id, p_links: ecardLinkSavePayload(links) });
      if (linksError) throw new Error('Links could not be saved. Retry before publishing.');

      // 5. Done ───────────────────────────────────────────────────────────

      if (isMountedRef.current) {
        dispatch({ type: 'SAVE_COMPLETED', snapshot: { card, links, pendingUploads }, persisted: updatePayload });
      }
      return latestState.current.card === card && latestState.current.links === links && latestState.current.pendingUploads === pendingUploads;
    } catch (err) {
      console.error('[useAutoSave] Save failed:', err);
      if (isMountedRef.current) {
        dispatch({ type: 'MARK_SAVE_ERROR', error: err instanceof Error ? err.message : 'Save failed. Retry to save your changes.' });
      }
      return false;
    } finally { inFlightRef.current = false; }
  }, [state, userId, isPro, dispatch]);

  // ── Auto-save on dirty state changes ───────────────────────────────────

  useEffect(() => {
    if (!state.isDirty || state.isSaving || state.saveError || !state.card?.id) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.isDirty, state.isSaving, state.card?.id, debounceMs, performSave]);

  // ── Manual save (bypasses debounce) ────────────────────────────────────

  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    return performSave();
  }, [performSave]);

  return {
    isSaving: state.isSaving,
    isDirty: state.isDirty,
    lastSaved: state.lastSaved,
    saveError: state.saveError,
    saveNow,
  };
}
