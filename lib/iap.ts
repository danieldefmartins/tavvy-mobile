/**
 * StoreKit purchase flow for iOS digital-content subscriptions (Apple
 * Guideline 3.1.1). See lib/iapConfig.ts for the product IDs and the
 * IAP_ENABLED gate — this module is inert (never called) while that flag
 * is false. See docs/APPLE_IAP_SETUP.md for what must exist in App Store
 * Connect before it can be turned on.
 *
 * Flow: requestSubscription() → StoreKit sheet → purchaseUpdatedListener
 * receives the transaction → the receipt goes to verify-apple-purchase,
 * which binds the Apple original transaction to the signed-in Tavvy user →
 * only then is the transaction finished. Screens learn the outcome through
 * subscribeToPurchaseResults(), never from requestSubscription()'s return.
 */
import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  getSubscriptions,
  requestSubscription,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
  Subscription,
  Purchase,
  PurchaseError,
} from 'react-native-iap';
import { supabase } from './supabaseClient';
import { IapProductId, IAP_PRODUCTS } from './iapConfig';

export type PurchaseResult =
  | { type: 'success'; productId: string; expiresAt: string | null; restored: boolean }
  | { type: 'pending'; productId: string }
  | { type: 'error'; productId?: string; code?: string; message: string; cancelled: boolean };

type ResultListener = (result: PurchaseResult) => void;

let updateSub: { remove(): void } | null = null;
let errorSub: { remove(): void } | null = null;
let connected = false;
const resultListeners = new Set<ResultListener>();

function emit(result: PurchaseResult): void {
  resultListeners.forEach(listener => {
    try { listener(result); } catch (error) { console.error('[iap] Result listener failed:', error); }
  });
}

/** Screens subscribe to learn when a purchase/restore succeeded or failed. */
export function subscribeToPurchaseResults(listener: ResultListener): () => void {
  resultListeners.add(listener);
  return () => { resultListeners.delete(listener); };
}

export function isUserCancelled(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  return code === 'E_USER_CANCELLED' || code === 'E_DEFERRED_PAYMENT';
}

export async function initIap(onError?: (error: PurchaseError) => void): Promise<void> {
  if (Platform.OS !== 'ios') return;
  if (!connected) {
    await initConnection();
    connected = true;
  }
  updateSub?.remove();
  errorSub?.remove();
  updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
    try {
      const verified = await verifyAndFinish(purchase);
      if (verified.ok) {
        emit({ type: 'success', productId: purchase.productId, expiresAt: verified.expiresAt, restored: false });
      } else {
        emit({ type: 'error', productId: purchase.productId, code: verified.code, message: verified.message, cancelled: false });
      }
    } catch (error) {
      console.error('[iap] Failed to verify/finish purchase:', error);
      emit({ type: 'error', productId: purchase.productId, message: 'Your purchase could not be verified yet. It will be retried automatically.', cancelled: false });
    }
  });
  errorSub = purchaseErrorListener((error: PurchaseError) => {
    const cancelled = isUserCancelled(error);
    if (!cancelled) console.error('[iap] Purchase error:', error);
    emit({ type: 'error', code: error.code, message: error.message ?? 'Purchase failed.', cancelled });
    onError?.(error);
  });
}

export async function endIap(): Promise<void> {
  updateSub?.remove();
  errorSub?.remove();
  updateSub = null;
  errorSub = null;
  if (Platform.OS === 'ios' && connected) {
    connected = false;
    await endConnection();
  }
}

export async function fetchIapSubscriptions(): Promise<Subscription[]> {
  const skus = Object.keys(IAP_PRODUCTS) as IapProductId[];
  return getSubscriptions({ skus });
}

/** Localized display prices keyed by product ID (empty when StoreKit has none). */
export async function fetchIapPrices(): Promise<Record<string, string>> {
  const products = await fetchIapSubscriptions();
  return Object.fromEntries(products.flatMap(product =>
    'localizedPrice' in product && product.localizedPrice ? [[product.productId, product.localizedPrice]] : [],
  ));
}

/**
 * Starts the StoreKit purchase sheet. `userId` (a UUID) is passed as Apple's
 * appAccountToken so the transaction is stamped with the Tavvy account that
 * bought it; the server additionally refuses to move an original transaction
 * between accounts. The outcome arrives via subscribeToPurchaseResults().
 */
export async function purchaseIapSubscription(sku: IapProductId, userId: string): Promise<void> {
  await requestSubscription({ sku, appAccountToken: userId });
}

interface VerifyOutcome { ok: boolean; expiresAt: string | null; code?: string; message: string }

/** Sends the receipt to our server for verification, then finishes the
 * transaction only if the server confirms it activated the entitlement —
 * never finish (acknowledge) a transaction StoreKit still has pending
 * verification for, or a failed payment could look "done" to the user. */
async function verifyAndFinish(purchase: Purchase): Promise<VerifyOutcome> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('[iap] Purchase received with no signed-in session; cannot verify.');
    return { ok: false, expiresAt: null, code: 'NO_SESSION', message: 'Sign in to Tavvy, then use Restore Purchases to attach this subscription to your account.' };
  }
  if (!purchase.transactionReceipt) {
    return { ok: false, expiresAt: null, code: 'NO_RECEIPT', message: 'Apple did not return a receipt yet. Please try Restore Purchases in a moment.' };
  }
  const { data, error } = await supabase.functions.invoke('verify-apple-purchase', {
    method: 'POST',
    body: {
      productId: purchase.productId,
      transactionReceipt: purchase.transactionReceipt,
    },
  });
  if (error || data?.status !== 'ok') {
    // Supabase's FunctionsHttpError hides the JSON body; surface the server message when possible.
    let message: string = data?.message || 'Your purchase could not be verified. Please try Restore Purchases.';
    let code: string | undefined = data?.code;
    const ctx = (error as { context?: Response } | null)?.context;
    if (ctx && typeof ctx.json === 'function') {
      try { const body = await ctx.json(); message = body?.message || message; code = body?.code || code; } catch { /* keep default */ }
    }
    console.error('[iap] Server verification failed; leaving transaction unfinished for retry:', error || data);
    if (code === 'EXPIRED') {
      // Nothing to unlock, and Apple would otherwise re-deliver it forever.
      await finishTransaction({ purchase, isConsumable: false }).catch(() => {});
    }
    return { ok: false, expiresAt: null, code, message };
  }
  await finishTransaction({ purchase, isConsumable: false });
  return { ok: true, expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : null, message: 'ok' };
}

/** Apple requires a reachable Restore Purchases action for subscriptions
 * bought outside the current install/device. Counts only purchases whose
 * server verification succeeds for the signed-in account. */
export async function restorePurchases(): Promise<{ restored: number; failed: number; messages: string[] }> {
  if (Platform.OS !== 'ios') return { restored: 0, failed: 0, messages: [] };
  if (!connected) {
    await initConnection();
    connected = true;
  }
  const purchases = await getAvailablePurchases();
  // Newest first, one attempt per product: the latest receipt already covers renewals.
  const seen = new Set<string>();
  let restored = 0;
  let failed = 0;
  const messages: string[] = [];
  const ordered = [...purchases].sort((a, b) => (b.transactionDate ?? 0) - (a.transactionDate ?? 0));
  for (const purchase of ordered) {
    if (!(purchase.productId in IAP_PRODUCTS) || seen.has(purchase.productId)) continue;
    seen.add(purchase.productId);
    try {
      const outcome = await verifyAndFinish(purchase);
      if (outcome.ok) {
        restored += 1;
        emit({ type: 'success', productId: purchase.productId, expiresAt: outcome.expiresAt, restored: true });
      } else if (outcome.code !== 'EXPIRED') {
        failed += 1;
        messages.push(outcome.message);
      }
    } catch (error) {
      failed += 1;
      console.error('[iap] Failed to restore purchase:', purchase.productId, error);
    }
  }
  return { restored, failed, messages };
}
