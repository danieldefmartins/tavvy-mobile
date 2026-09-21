import AsyncStorage from '@react-native-async-storage/async-storage';
const read = (key: string) => AsyncStorage.getItem(key);
const write = (key: string, value: string) => AsyncStorage.setItem(key, value);
const remove = (key: string) => AsyncStorage.removeItem(key);
const pending = new Map<string, string>();
// Keep note content out of storage keys. This is an identity hash, not an auth secret.
function storageKey(identity: string) {
  let a = 2166136261, b = 2246822519;
  for (let i = 0; i < identity.length; i++) { a = Math.imul(a ^ identity.charCodeAt(i), 16777619); b = Math.imul(b ^ identity.charCodeAt(i), 3266489917); }
  return `@tavvy_review_pending:${(a >>> 0).toString(36)}:${(b >>> 0).toString(36)}`;
}
export async function pendingReviewRequest(identity: string, supplied?: string): Promise<string> {
  if (supplied) return supplied;
  const key = storageKey(identity);
  if (pending.has(key)) return pending.get(key)!;
  let saved: string | null = null;
  try { saved = await read(key); } catch { /* in-memory retry remains available */ }
  const value = saved || `review-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  pending.set(key, value);
  try { await write(key, value); } catch { /* storage can be unavailable */ }
  return value;
}
export async function confirmReviewRequest(identity: string): Promise<void> {
  const key = storageKey(identity);
  pending.delete(key);
  try { await remove(key); } catch { /* a later retry remains safely idempotent */ }
}
