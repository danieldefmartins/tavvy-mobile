# Tavvy iOS subscription setup

Status: **products created; server side deployed; purchases enabled only in the
TestFlight verification build**. `lib/iapConfig.ts` reads
`EXPO_PUBLIC_IAP_ENABLED` and defaults to off; the EAS profile `production-iap`
sets it to `true` for the sandbox test build (build 29). Verification returns
`NOT_CONFIGURED` until `APPLE_SHARED_SECRET` is set. These products are distinct
from the separate restaurant membership offer.

## 0. What is deployed (September 22, 2026)

| Piece | Where | State |
| --- | --- | --- |
| `verify-apple-purchase` | Supabase Edge Function | v2 deployed: bundle check, newest matching transaction, `appAccountToken` must equal the caller, original transaction bound to the first Tavvy account (409 otherwise), expired → `EXPIRED`, entitlement written through `_shared/appleEntitlements.ts` |
| `apple-server-notifications` | Supabase Edge Function (no JWT) | deployed: verifies the ES256 JWS chain against the pinned Apple Root CA - G3, stores every notification in `apple_server_notifications` (idempotent on `notificationUUID`), applies renewals, billing retry/grace, expiry, cancellation, refund and plan switches |
| `store-apple-credential` | Supabase Edge Function | deployed: stores the Sign in with Apple refresh token for later revocation |
| `delete-account` | Supabase Edge Function | v3 deployed (paginated storage cleanup); still gated by the policy row and env flag |
| Client | `lib/iap.ts`, paywalls, Settings | purchase/restore results surfaced, renewal terms + Terms/Privacy links, Restore in Settings |

Secrets the maintainer must set in the Supabase dashboard (Edge Function secrets):
`APPLE_SHARED_SECRET` (App Store Connect → App Information → App-Specific Shared
Secret), `ACCOUNT_DELETION_RETENTION_POLICY_APPROVED=true` (with
`update account_deletion_policy set approved=true, approved_by=…, approved_at=now()`),
and for Sign in with Apple revocation `APPLE_TEAM_ID`, `APPLE_KEY_ID`,
`APPLE_PRIVATE_KEY`, `APPLE_CLIENT_ID` (only once Apple is enabled as a Supabase
Auth provider; today only email is enabled, so the app hides the Apple button).

Register the notifications URL in App Store Connect → App Information → App Store
Server Notifications, Version 2, for both Production and Sandbox:
`https://scasgwrikoqdwlwlwcff.supabase.co/functions/v1/apple-server-notifications`.

## 1. Account Holder: commerce prerequisites

App Store Connect showed an updated Apple Developer Program License Agreement
on September 22, 2026. The Account Holder accepted it, after which Apple allowed
the subscription product forms to open. This agent did not accept legal terms.

In App Store Connect, open **Business → Agreements** and check that the Paid
Apps Agreement is active. Complete the required tax and banking information.
Only the account holder can accept legal terms. Do not put banking details,
Apple credentials, or shared secrets in this repository.

Apple guidance: [agreements](https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements),
[banking](https://developer.apple.com/help/app-store-connect/manage-banking-information/enter-banking-information).

## 2. Create two auto-renewable subscription groups

App Store Connect → **Apps → Tavvy → Monetization → Subscriptions**.
Use **two groups** because a customer may subscribe to eCard Pro and Tavvy
Pros at the same time. Apple allows one active subscription per group.

| Group reference name | Group display name | Products |
| --- | --- | --- |
| Tavvy eCard Pro | Tavvy eCard Pro | Monthly and Annual, same service level |
| Tavvy Pros | Tavvy Pros | Founding Annual |

Created in App Store Connect on September 22, 2026: eCard group ID `22405023`
and Pros group ID `22405130`. Both have English (U.S.) display names. eCard
Monthly and Annual are at the same service level (level 1).

Within **Tavvy eCard Pro**, put Monthly and Annual at the same subscription
level so customers can change billing period without gaining or losing features.
Do not put Pros in this group. Group display names and product copy need
localization for each storefront Tavvy offers.

Apple guidance: [subscription groups](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/auto-renewable-subscription-information),
[creating subscriptions](https://developer.apple.com/app-store/subscriptions/).

## 3. Create these exact products

The product IDs are already in both the mobile app and verification function.
Do not change their spelling or reuse an ID for a different offer.

| Group | Reference name | Product ID | Duration | US price | English display name | English description |
| --- | --- | --- | --- | --- | --- | --- |
| Tavvy eCard Pro | eCard Pro Monthly | `com.360.tavvy.ecard.pro.monthly` | 1 month | $4.99 | eCard Pro Monthly | Premium card designs, photo galleries, video, contact forms, and professional credentials. |
| Tavvy eCard Pro | eCard Pro Annual | `com.360.tavvy.ecard.pro.annual` | 1 year | $39.99 | eCard Pro Annual | The same eCard Pro features with annual billing. |
| Tavvy Pros | Pros Founding Annual | `com.360.tavvy.pros.founding.annual` | 1 year | $199 | Tavvy Pros Founding | Professional profile, lead access, direct messages, and provider tools. |

Apple product records: eCard Monthly `6814897486`, eCard Annual `6814899973`,
Pros Founding Annual `6814902186`. Their US base prices are $4.99, $39.99 and
$199.00 respectively. English (U.S.) names and concise descriptions are saved.
All 175 current App Store regions are selected for each product; automatic
availability in future regions is off. Annual products use **1 Year Upfront**,
not Apple's separate 12-month monthly-commitment option.
Product status remains **Prepare for Submission**. Final paywall screenshots,
review metadata, other localizations and submission with the release build remain.

These prices reflect the existing mobile paywalls. Confirm storefront prices
and availability in App Store Connect before enabling them. No introductory
offers or free trials are specified in the app. Add localized descriptions,
review notes, and a screenshot of the **final matching paywall** for each
product. Submit the subscriptions with the final app version for review.

Apple guidance: [required subscription properties](https://developer.apple.com/help/app-store-connect/reference/app-information/required-localizable-and-editable-properties),
[availability](https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-availability-for-an-auto-renewable-subscription).

## 4. Verification and sandbox setup

Generate Tavvy's **app-specific shared secret** under App Information. Store
it only as the Supabase Edge Function secret `APPLE_SHARED_SECRET`; never in
the app, Git, or a message. Do not regenerate an existing secret without a
rotation plan. Apple guidance: [shared secret](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/generate-a-shared-secret-to-verify-receipts).

Create a Sandbox Apple Account under **Users and Access → Sandbox**. Use an
email address that is not already an Apple Account. On a physical test iPhone,
sign in through the Sandbox account setting; do not sign out of the device's
main Apple Account. Apple guidance: [Sandbox account](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/create-a-sandbox-apple-account).

## 5. Code gates before an enabled build

The receipt verifier is **not ready to activate**. The integration branch now
checks the returned bundle ID, uses the newest matching transaction, rejects an
expired subscription, and prevents an already-claimed transaction from moving
to another Tavvy account. Before activation, prove the complete eCard and Pros
entitlement paths against disposable database fixtures, including subscription
switching and concurrent claims. Confirm the Apple transaction is bound to the
intended Tavvy user, not merely the first caller holding a valid receipt.
The iOS paywall must show Apple's localized product price rather than relying
on hard-coded US prices. Only after those checks should a test build turn
`IAP_ENABLED` on locally.

## 6. End-to-end acceptance

On a physical iPhone with the final test build, prove all three products load
at their configured localized prices. Buy each with disposable Tavvy/Sandbox
accounts; confirm server verification, entitlement activation, and the UI
unlock. Verify eCard Monthly ↔ Annual switching, simultaneous eCard + Pros
subscriptions, failed payments, reinstall/sign-in, and Restore Purchases.
Verify a receipt from one Tavvy account cannot unlock another account.
Keep screenshots and a redacted test log outside the public repository.

After these pass, enable IAP in the final source, build once from that commit,
repeat purchase and restore smoke tests, and capture the final App Store
screenshots from the same build. Renewal, cancellation, refund, and billing
issue updates need App Store Server Notifications or an equivalent status
reconciliation path before broad paid launch.
