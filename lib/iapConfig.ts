/**
 * In-App Purchase configuration for iOS (Apple Guideline 3.1.1: digital
 * content/subscriptions unlocked inside the app must go through StoreKit,
 * not Stripe or an external checkout link).
 *
 * IAP_ENABLED must stay false until ALL three of these are true at once:
 *   1. Every product ID below exists in App Store Connect, in "Ready to
 *      Submit" state, with the exact prices listed.
 *   2. Restore Purchases (lib/iap.ts: restorePurchases) has been exercised
 *      on a real device against the Sandbox environment.
 *   3. At least one sandbox purchase has been completed end-to-end,
 *      including server-side verification (supabase/functions/
 *      verify-apple-purchase) correctly activating the entitlement.
 * Flipping it before all three pass ships a purchase button that cannot
 * complete a transaction. See docs/APPLE_IAP_SETUP.md for the exact
 * App Store Connect steps this requires from the account holder.
 *
 * The committed default is OFF. A build may turn it on only through the
 * build-time environment variable EXPO_PUBLIC_IAP_ENABLED=true (set on the
 * EAS build profile or in .env for a local test build), so a sandbox /
 * TestFlight verification build can exercise StoreKit without changing the
 * source that ships. Any other value, or no value, keeps purchases off.
 */
export const IAP_ENABLED: boolean = process.env.EXPO_PUBLIC_IAP_ENABLED === 'true';

export type IapProductId =
  | 'com.360.tavvy.ecard.pro.monthly'
  | 'com.360.tavvy.ecard.pro.annual'
  | 'com.360.tavvy.pros.founding.annual';

export const ECARD_PRO_MONTHLY: IapProductId = 'com.360.tavvy.ecard.pro.monthly';
export const ECARD_PRO_ANNUAL: IapProductId = 'com.360.tavvy.ecard.pro.annual';
export const PROS_FOUNDING_ANNUAL: IapProductId = 'com.360.tavvy.pros.founding.annual';

/** Must match the Stripe prices these replace on iOS, so switching doesn't
 * change what the customer is told before they were on Stripe. */
export const IAP_PRODUCTS: Record<IapProductId, { type: 'subs'; referencePrice: string; referencePeriod: string }> = {
  [ECARD_PRO_MONTHLY]: { type: 'subs', referencePrice: '$4.99', referencePeriod: 'month' },
  [ECARD_PRO_ANNUAL]: { type: 'subs', referencePrice: '$39.99', referencePeriod: 'year' },
  [PROS_FOUNDING_ANNUAL]: { type: 'subs', referencePrice: '$199', referencePeriod: 'year' },
};
