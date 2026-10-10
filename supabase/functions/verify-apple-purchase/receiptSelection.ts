/** Selection is only used after Apple has verified the receipt and app bundle. */
export interface AppleReceiptEntry {
  product_id: string;
  original_transaction_id: string;
  transaction_id?: string;
  expires_date_ms: string;
  purchase_date_ms?: string;
  cancellation_date_ms?: string;
  app_account_token?: string;
}

export interface AppleRenewalInfo {
  product_id?: string;
  auto_renew_product_id?: string;
  auto_renew_status?: string;
  original_transaction_id?: string;
  grace_period_expires_date_ms?: string;
}

export function selectReceiptEntry(
  entries: AppleReceiptEntry[], renewals: AppleRenewalInfo[], requestedProduct: string,
  ecardProducts: readonly string[], now = Date.now(),
): { entry: AppleReceiptEntry; scheduledChange?: { productId: string; effectiveAt: string } } | null {
  const valid = entries.filter(e => e.original_transaction_id &&
    Number(e.expires_date_ms) > 0 && Number(e.expires_date_ms) <= 8.64e15)
    .sort((a, b) => Number(b.expires_date_ms) - Number(a.expires_date_ms));
  const requested = valid.find(e => e.product_id === requestedProduct);
  if (requested && Number(requested.expires_date_ms) > now && !requested.cancellation_date_ms) {
    return { entry: requested };
  }
  // Different-duration eCard crossgrades take effect at renewal. Never infer
  // this from a client selection alone, or cross from eCard into the Pros group.
  if (ecardProducts.includes(requestedProduct)) {
    for (const renewal of renewals) {
      if (renewal.auto_renew_product_id !== requestedProduct || renewal.auto_renew_status !== '1') continue;
      const current = valid.find(e => e.original_transaction_id === renewal.original_transaction_id);
      if (!current || current.product_id === requestedProduct || !ecardProducts.includes(current.product_id) ||
        current.product_id !== renewal.product_id || current.cancellation_date_ms || Number(current.expires_date_ms) <= now) continue;
      return { entry: current, scheduledChange: { productId: requestedProduct, effectiveAt: new Date(Number(current.expires_date_ms)).toISOString() } };
    }
  }
  return requested ? { entry: requested } : null;
}
