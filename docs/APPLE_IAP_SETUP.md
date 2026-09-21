# Apple In-App Purchase setup — required before enabling IAP

Status as of 2026-09-21: code is written and deployed but **inert**.
`lib/iapConfig.ts` → `IAP_ENABLED = false`. eCard Pro and Pros still sell
through Stripe today; nothing changes for real users until this flag flips.

This document is the exact list of things only the Apple Developer /
App Store Connect account holder can do. None of it can be done from
this repo or from Supabase.

## 1. Create the products in App Store Connect

App Store Connect → your app → Monetization → Subscriptions (or In-App
Purchases). Create an auto-renewable subscription group, then these
products, with these **exact** product IDs (the client and the
verification Edge Function both hard-code them):

| Product ID | Price | Matches today's Stripe price |
|---|---|---|
| `com.360.tavvy.ecard.pro.monthly` | $4.99 / month | eCard Pro monthly |
| `com.360.tavvy.ecard.pro.annual` | $39.99 / year | eCard Pro annual |
| `com.360.tavvy.pros.founding.annual` | $199 / year | Pros "Founding Member" |

Each product needs a display name, description, and a review screenshot
(App Store Connect requires one before a subscription can go to "Ready
to Submit" — a screenshot of the in-app paywall is fine).

## 2. Generate the App-Specific Shared Secret

App Store Connect → your app → App Information → App-Specific Shared
Secret → generate. Set it as an Edge Function secret:

```
supabase secrets set APPLE_SHARED_SECRET=<the secret> --project-ref scasgwrikoqdwlwlwcff
```

This is what `supabase/functions/verify-apple-purchase` uses to validate
receipts with Apple's `verifyReceipt` endpoint. Without it the function
returns 503 (already verified — see the milestone report).

## 3. Add a Sandbox tester

App Store Connect → Users and Access → Sandbox → Testers. Add a test
Apple ID (not your real one) so a real device can complete a sandbox
purchase without charging a card.

## 4. Build and test

1. `npx pod-install` (react-native-iap needs the native pod linked;
   already added to package.json).
2. Build to a physical device (sandbox purchases don't work reliably in
   the Simulator) signed out of the App Store with your real Apple ID,
   signed into the Sandbox tester when the purchase sheet asks.
3. Flip `IAP_ENABLED = true` in `lib/iapConfig.ts` **locally only** for
   this test — do not commit it true until all three conditions in that
   file's comment are met.
4. Confirm: product loads with the right price, purchase completes,
   `verify-apple-purchase` returns `{status:"ok"}`, the entitlement
   shows up in `user_subscriptions` or `pro_providers` with
   `source = 'apple'`, and the app immediately reflects Pro access.
5. Confirm Restore Purchases (Settings) re-activates the same
   entitlement after a fresh install/sign-in on the same sandbox
   account.

## 5. Only then

Commit `IAP_ENABLED = true`, and separately decide whether to keep the
existing Stripe paywall on Android/web as-is (it already only appears on
non-iOS platforms once this flips) or migrate it too.

## Known gaps not covered by this setup

- **Renewal/cancellation notifications**: Apple's App Store Server
  Notifications V2 webhook (for renewals, refunds, billing-issue
  downgrades happening outside the app) is not implemented. Without it,
  an entitlement only updates when the user opens the app and their
  subscription happens to be checked again. Recommend adding this before
  a real launch, not required to pass initial App Store review.
- **Family Sharing / offer codes / promotional offers**: not implemented.
