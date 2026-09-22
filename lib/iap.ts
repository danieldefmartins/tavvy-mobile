/**
 * StoreKit purchase flow for iOS digital-content subscriptions (Apple
 * Guideline 3.1.1). See lib/iapConfig.ts for the product IDs and the
 * IAP_ENABLED gate — this module is inert (never called) while that flag
 * is false. See docs/APPLE_IAP_SETUP.md for what must exist in App Store
 * Connect before it can be turned on.
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

let updateSub: { remove(): void } | null = null;
let errorSub: { remove(): void } | null = null;

export async function initIap(onError?: (error: PurchaseError) => void): Promise<void> {
  if (Platform.OS !== 'ios') return;
  await initConnection();
  updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
    try {
      await verifyAndFinish(purchase);
    } catch (error) {
      console.error('[iap] Failed to verify/finish purchase:', error);
    }
  });
  errorSub = purchaseErrorListener((error: PurchaseError) => {
    console.error('[iap] Purchase error:', error);
    onError?.(error);
  });
}

export async function endIap(): Promise<void> {
  updateSub?.remove();
  errorSub?.remove();
  updateSub = null;
  errorSub = null;
  if (Platform.OS === 'ios') await endConnection();
}

export async function fetchIapSubscriptions(): Promise<Subscription[]> {
  const skus = Object.keys(IAP_PRODUCTS) as IapProductId[];
  return getSubscriptions({ skus });
}

export async function purchaseIapSubscription(sku: IapProductId, userId: string): Promise<void> {
  await requestSubscription({ sku, appAccountToken: userId });
  // Result arrives via purchaseUpdatedListener, not this call's return value.
}

/** Sends the receipt to our server for verification, then finishes the
 * transaction only if the server confirms it activated the entitlement —
 * never finish (acknowledge) a transaction StoreKit still has pending
 * verification for, or a failed payment could look "done" to the user. */
async function verifyAndFinish(purchase: Purchase): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('[iap] Purchase received with no signed-in session; cannot verify.');
    return;
  }
  const { data, error } = await supabase.functions.invoke('verify-apple-purchase', {
    method: 'POST',
    body: {
      productId: purchase.productId,
      transactionReceipt: purchase.transactionReceipt,
    },
  });
  if (error || data?.status !== 'ok') {
    console.error('[iap] Server verification failed; leaving transaction unfinished for retry:', error || data);
    return;
  }
  await finishTransaction({ purchase, isConsumable: false });
}

/** Apple requires a reachable Restore Purchases action for non-consumable
 * subscriptions bought outside the current install/device. */
export async function restorePurchases(): Promise<{ restored: number }> {
  if (Platform.OS !== 'ios') return { restored: 0 };
  const purchases = await getAvailablePurchases();
  let restored = 0;
  for (const purchase of purchases) {
    try {
      await verifyAndFinish(purchase);
      restored += 1;
    } catch (error) {
      console.error('[iap] Failed to restore purchase:', purchase.productId, error);
    }
  }
  return { restored };
}
