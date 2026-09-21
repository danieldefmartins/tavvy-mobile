import { supabase } from './supabaseClient';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Canonical promotion is backend-controlled by prepared migration 006. */
export async function resolvePhotoPlace(placeId: string): Promise<string> {
  const cleanId = placeId.startsWith('fsq:') ? placeId.slice(4) : placeId;
  const { data, error } = await supabase.rpc('resolve_review_place', { p_identifier: cleanId });
  if (error) throw new Error(error.message || 'Unable to resolve this place.');
  if (typeof data !== 'string' || !UUID.test(data)) throw new Error('The server did not confirm the place.');
  return data;
}
export async function uploadPlacePhoto(placeIdentifier: string, userId: string, bytes: Uint8Array, caption: string): Promise<void> {
  const placeId = await resolvePhotoPlace(placeIdentifier);
  // The deployed delete policy requires the uploader UUID in the first folder.
  const fileName = `${userId}/${placeId}/${Date.now()}.jpg`;
  const storage = supabase.storage.from('place-photos');
  const { error: uploadError } = await storage.upload(fileName, bytes, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) throw new Error(uploadError.message || 'Photo upload failed.');
  const { data: urlData } = storage.getPublicUrl(fileName);
  const { error: insertError } = await supabase.from('place_photos').insert({
    place_id: placeId, uploaded_by: userId, user_id: userId, url: urlData.publicUrl,
    caption: caption.trim() || null, is_owner_photo: false, status: 'live',
  }).select('id').single();
  if (insertError) {
    const { error: cleanupError } = await storage.remove([fileName]);
    if (cleanupError) console.warn('Unable to remove photo after metadata failure:', cleanupError.message);
    throw new Error('Photo details could not be saved. Please try again.');
  }
}
