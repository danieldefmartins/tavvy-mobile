/**
 * useAutoSave -- watches dirty state in the editor context,
 * debounces for 2 seconds, then uploads pending files and saves card + links.
 *
 * React Native port:
 * - Uploads via supabase.storage with { uri, type, name } (FormData-compatible on RN)
 * - Filters out file:// URIs before saving to DB
 * - Queries digital_cards / digital_card_links directly
 */

import { useEffect, useRef, useCallback } from 'react';
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
  saveNow: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the URL is a local file path (not yet uploaded). */
function isLocalUri(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith('file://') || url.startsWith('content://');
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
 * Upload a file to Supabase Storage using the React Native-compatible
 * FormData approach (supabase-js accepts { uri, type, name } on RN).
 */
async function uploadFile(
  userId: string,
  upload: PendingUpload,
  folder: string
): Promise<string | null> {
  const filename = filenameFromUri(upload.uri);
  const storagePath = `${userId}/${folder}/${Date.now()}_${filename}`;
  const mimeType = upload.type || 'image/jpeg';

  const { data, error } = await supabase.storage
    .from('ecard-assets')
    .upload(storagePath, {
      uri: upload.uri,
      type: mimeType,
      name: filename,
    } as any, {
      contentType: mimeType,
      upsert: true,
    });

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
    if (!card?.id || !userId) return;

    // Validate template access -- premium templates require pro subscription
    const tpl = getTemplateById(card.template_id || 'basic');
    if (tpl?.isPremium && !isPro) return;

    dispatch({ type: 'MARK_SAVING' });

    try {
      // 1. Upload pending files ───────────────────────────────────────────

      let photoUrl = card.profile_photo_url;
      const profileUpload = pendingUploads.get('profile_photo');
      if (profileUpload) {
        const uploaded = await uploadFile(userId, profileUpload, 'profile');
        if (uploaded) photoUrl = uploaded;
      }

      let bannerUrl = card.banner_image_url;
      const bannerUpload = pendingUploads.get('banner_image');
      if (bannerUpload) {
        const uploaded = await uploadFile(userId, bannerUpload, 'banner');
        if (uploaded) bannerUrl = uploaded;
      }

      let logoUrl = card.logo_url;
      const logoUpload = pendingUploads.get('logo');
      if (logoUpload) {
        const uploaded = await uploadFile(userId, logoUpload, 'logo');
        if (uploaded) logoUrl = uploaded;
      }

      // Upload gallery images
      const galleryImages: { id: string; url: string; caption: string }[] = [];
      for (const img of card.gallery_images || []) {
        const pendingKey = `gallery_${img.id}`;
        const galleryUpload = pendingUploads.get(pendingKey);
        if (galleryUpload) {
          const url = await uploadFile(userId, galleryUpload, 'gallery');
          if (url) galleryImages.push({ id: img.id, url, caption: img.caption || '' });
        } else if (img.url && !isLocalUri(img.url)) {
          galleryImages.push({ id: img.id, url: img.url, caption: img.caption || '' });
        }
      }

      // 2. Build update payload -- never save local URIs ──────────────────

      const updatePayload: Record<string, any> = {
        full_name: (card.full_name || '').trim(),
        title: card.title || null,
        company: card.company || null,
        bio: card.bio || null,
        email: card.email || null,
        phone: card.phone || null,
        website: card.website || null,
        website_label: card.website_label || null,
        city: card.city || null,
        state: card.state || null,
        address: card.address || null,
        zip_code: card.zip_code || null,
        profile_photo_url: cleanUrl(photoUrl) || null,
        profile_photo_size: card.profile_photo_size || 'medium',
        banner_image_url: cleanUrl(bannerUrl) || null,
        logo_url: cleanUrl(logoUrl) || null,
        background_image_url: cleanUrl(card.background_image_url) || null,
        gradient_color_1: card.gradient_color_1 || '#667eea',
        gradient_color_2: card.gradient_color_2 || '#764ba2',
        font_style: card.font_style || 'default',
        font_color: card.font_color || null,
        button_style: card.button_style || 'fill',
        button_color: card.button_color || null,
        icon_color: card.icon_color || null,
        template_id: card.template_id,
        color_scheme_id: card.color_scheme_id || null,
        theme: card.theme || 'basic',
        show_contact_info: card.show_contact_info !== false,
        show_social_icons: card.show_social_icons !== false,
        featured_socials: card.featured_socials || [],
        gallery_images: galleryImages,
        videos: card.videos || [],
        pronouns: card.pronouns || null,
        card_type: card.card_type || null,
        country_code: card.country_code || null,
        pro_credentials: card.pro_credentials || null,
        professional_category: card.professional_category || null,
        form_block: card.form_block || null,
        industry_icons: card.industry_icons || null,
        // Civic fields
        ballot_number: card.ballot_number || null,
        party_name: card.party_name || null,
        office_running_for: card.office_running_for || null,
        election_year: card.election_year || null,
        campaign_slogan: card.campaign_slogan || null,
        region: card.region || null,
      };

      // 3. Save card ──────────────────────────────────────────────────────

      const { error: cardError } = await supabase
        .from('digital_cards')
        .update(updatePayload)
        .eq('id', card.id);

      if (cardError) {
        throw new Error(`Card save failed: ${cardError.message}`);
      }

      // 4. Save links (delete + re-insert) ────────────────────────────────

      const { error: deleteError } = await supabase
        .from('digital_card_links')
        .delete()
        .eq('card_id', card.id);

      if (deleteError) {
        console.warn('[useAutoSave] Links delete warning:', deleteError.message);
      }

      if (links.length > 0) {
        const linkRows = links.map((link, idx) => ({
          card_id: card.id,
          platform: link.platform || 'other',
          title: link.title || null,
          url: link.url,
          icon: link.icon || link.platform || 'other',
          sort_order: idx,
          is_active: link.is_active !== false,
          clicks: link.clicks || 0,
        }));

        const { error: insertError } = await supabase
          .from('digital_card_links')
          .insert(linkRows);

        if (insertError) {
          throw new Error(`Links save failed: ${insertError.message}`);
        }
      }

      // 5. Done ───────────────────────────────────────────────────────────

      if (isMountedRef.current) {
        dispatch({ type: 'CLEAR_ALL_PENDING_UPLOADS' });
        dispatch({ type: 'MARK_SAVED' });
      }
    } catch (err) {
      console.error('[useAutoSave] Save failed:', err);
      if (isMountedRef.current) {
        dispatch({ type: 'MARK_SAVE_ERROR' });
      }
    }
  }, [state, userId, isPro, dispatch]);

  // ── Auto-save on dirty state changes ───────────────────────────────────

  useEffect(() => {
    if (!state.isDirty || state.isSaving || !state.card?.id) return;

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
    performSave();
  }, [performSave]);

  return {
    isSaving: state.isSaving,
    isDirty: state.isDirty,
    lastSaved: state.lastSaved,
    saveNow,
  };
}
