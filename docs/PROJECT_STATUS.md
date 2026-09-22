# Tavvy current engineering status

## Apple release completion — September 22 (branch `feature/apple-release-completion-20260922`)

Source published on the feature branch from `release/apple-final-20260922` (`1abd8e1`).
Not merged. EAS store build 29 (`bce12481`, profile `production-iap`, version 1.0.1)
was built from `ca13af7` and submitted to App Store Connect / TestFlight the same day.
The committed `IAP_ENABLED` default stays off; only the `production-iap` profile sets
`EXPO_PUBLIC_IAP_ENABLED=true` so the TestFlight build can run sandbox purchase tests.

**Live changes made during this batch (verified):**
- Supabase Auth has only the email provider enabled, so the Apple and Google buttons on
  both login screens were dead controls. They now render only when the public auth
  settings list the provider (Google never without Apple, Guideline 4.8). The Pros login
  Forgot Password control had no handler and now sends the reset email.
- `verify-apple-purchase` v2, `apple-server-notifications` (new), `store-apple-credential`
  (new) and `delete-account` v3 are deployed. `apple_server_notifications` table and the
  `places.rv_group` generated column + index are applied. The notifications endpoint
  verifies Apple's ES256 JWS chain against the pinned Apple Root CA - G3 (nine local
  positive/negative tests) and logs every notification idempotently.
- `verify-apple-purchase` returns 503 `NOT_CONFIGURED` until `APPLE_SHARED_SECRET` is set;
  `delete-account` returns `unavailable` until the DB policy row and
  `ACCOUNT_DELETION_RETENTION_POLICY_APPROVED=true` are both set. Neither secret could be
  set from this session; the maintainer sets them in the Supabase dashboard.
- All 16 non-English catalogs now cover every English key (about 5,500 strings added,
  including new login/paywall keys). RTL relies on the existing Arabic `forceRTL` restart.
- Brand: every in-app logo, the App Store icon, Android adaptive icon, Expo splash and the
  native launch image are regenerated from the designer's mark (`scripts/generate-brand-assets.py`,
  source `assets/brand/tavvy-mark-source.png`). Old logo files were removed.
- On The Go crashed on open (stray text node); fixed. RV & Camping "All" tab hit the
  statement timeout; the catalog now filters on `rv_group`. Both screens have a List / Map
  toggle with My location / Standard / Dark / Satellite icon controls on the map; the RV
  map mode is a full-screen map with a floating search field and filter icon. The same
  RV/On The Go changes are on tavvy-web branch `feature/rv-map-toggle-20260922` (`76e2e87`),
  ready to fast-forward into `release/verified-web-20260921` for the Railway deploy.
- Favorites: the app called RPCs that do not exist; it reads `user_favorites` directly.
- Appearance follows the device until Light/Dark is chosen; Settings has a Match device switch.
- Paywalls show Apple's renewal terms with Terms of Use and Privacy Policy links; purchase
  and restore results are surfaced to the user; the Stripe money-back promise is iOS-hidden.
- Dev-only QA deep links (`tavvy://qa/nav|signin|signout`, `lib/devQaNavigation.ts`) drive
  the simulator; they are compiled out of release builds.

**App Store Connect (done via the maintainer's signed-in browser):** eight framed iPhone
6.5" and eight iPad 13" screenshots replaced the January set (both ordered Home, Place,
Signals, Pros, eCard, Universes, RV map, Tools); App Review notes rewritten with the
sign-in locations, subscription paths, deletion path and iPad note; version set to 1.0.1;
demo account `review@tavvy.com` verified to sign in and given a fictional eCard.

**Simulator evidence:** iPhone 17, iPhone 17 Pro Max and iPad Pro 13" development
builds through Metro: login, Tools, Settings, place, Signal Search, Pros, eCard hub and
preview, Universes, RV list/map, On The Go list/map, launch screen. No physical-device
run and no purchase test yet.

**Verified later the same evening:** the App Store Connect app-specific shared secret is
generated and stored in the service-role-only `private_app_config` table (env still wins
when set); `verify-apple-purchase` now reaches Apple (status 21002 for a dummy receipt
instead of `NOT_CONFIGURED`). App Store Server Notifications V2 URLs (production and
sandbox) are registered in App Store Connect. The deletion policy row is approved and
the env flag is only a veto; a real deletion of the disposable QA account returned
`deleted`, sign-in was refused afterwards and no `auth.users`, `profiles`,
`digital_cards` or `user_favorites` rows remained. The web branch was fast-forwarded into
`release/verified-web-20260921`; Railway deployment of `76e2e87` succeeded and
tavvy.com/app/rv-camping?view=map renders the full-screen map.

**Still open before submission:** wait for EAS submission `474eabbf` to deliver build 29
to TestFlight (it was still queued at the end of the session), then attach build 29 to
version 1.0.1; run the sandbox purchase / restore / account-binding test on a physical
iPhone with TestFlight build 29 and capture the paywall screenshots for each
subscription's review information; submit version 1.0.1 with the three subscriptions.
Sign in with Apple stays hidden until Apple is enabled as a Supabase Auth provider
(revocation keys then go into the function secrets).

## Apple integration — September 22, source branch only

The App Store Connect version 1.0 currently displays the icon from rejected build 21.
On September 22, the iOS asset catalog and Expo `assets/icon.png` were aligned to
Tavvy's current purple/teal web icon. Both are opaque 1024 × 1024 RGB PNGs and
byte-identical. This is source preparation only: Apple takes the displayed icon
from a newly uploaded build, so the App Store Connect icon has not changed yet.
The Account Holder accepted Apple's updated Developer Program License Agreement.
The Tavvy eCard Pro and Tavvy Pros subscription groups and all three planned
products now exist in App Store Connect with English (U.S.) names, US prices and
availability in all 175 current regions. eCard Monthly and Annual share level 1;
annual subscriptions use upfront yearly billing. They are still Prepare for
Submission, and `IAP_ENABLED` remains false pending verification, final paywall
screenshots and a release build.

`release/apple-final-20260922` starts from the latest deployed-design mobile
preview (`ccdd815`) and merges Claude's Apple-readiness branch (`92e330d`).
The combined source passed `npm run typecheck`. The eCard iOS paywall no longer
opens a Stripe website; it uses the gated Apple purchase flow when enabled,
and its Restore action invokes Apple restoration before checking entitlement.
The app now initializes the purchase listener when IAP is enabled, and Restore
counts only purchases whose server verification succeeds. Android/web checkout
behavior is unchanged. No new binary has been built or distributed from this
integration branch, and `IAP_ENABLED` remains false pending App Store Connect
products and physical-device sandbox verification. Account deletion remains
server-gated; the existing deployment is unchanged by this source commit.
The prepared deletion handler now traverses nested user storage folders,
paginates beyond 1,000 files, checks removal errors, and tolerates a Stripe
subscription that was already removed on retry. This source fix has not been
deployed or tested against a disposable account. Apple sign-in token capture,
retention-policy activation, billing checks, and end-to-end deletion remain
release gates.

The owner confirmed the three Apple subscription products are not configured.
`docs/APPLE_IAP_SETUP.md` now defines two separate groups, the exact existing
product IDs and prices, Account Holder prerequisites, and sandbox acceptance.
The source-only verification draft checks bundle identity, expiry and prior
transaction ownership, and aligns eCard entitlement fields with the existing
Stripe webhook. The eCard iOS paywall loads Apple-localized prices when enabled;
the current disabled build remains unaffected. Receipt-to-account binding,
Pros price display, subscription switching, server notification handling and
end-to-end tests are still open; do not enable `IAP_ENABLED` yet.

## Review entry and place imagery — September 22, web released; mobile source published

The standard place Add a review sheet had a styled-jsx scope bug: its outer overlay
was unstyled, so clicking the actual place action rendered the form below the page.
The overlay now fills the viewport, keeps its Post action visible and clears navigation.
Signed-out visitors return directly to the review form after login. The standalone
form hides bottom navigation.

Web and mobile now combine duplicate catalog labels and a small explicit synonym list
into one choice, retaining saved IDs and emphasis. Sections expand one at a time;
word search crosses all sections, and selections survive section changes. No catalog
records or review history were deleted. Existing summary labels are not migrated.

Search photos are now 112 × 104 (96 × 96 on narrow web screens). The standard detail
hero uses the same category illustration when real approved photos are missing; real
photos take priority and failed real images fall through to another photo/illustration.
Illustrations remain labeled and are never added to the place gallery or database.

Web production build, both application TypeScript commands, 27 focused unit checks,
and the production-build composer/card browser tests passed. The composer test now
clicks the actual place action after scrolling and checks overlay/footer bounds,
duplicate choices, close behavior and real-photo replacement. Browser writes use
intercepted fixtures. The enlarged native search card was checked in the existing
iPhone development app; no new native/EAS build or production review was created.

Web commit `3127da8` deployed successfully to Tavvy.com; the Railway health gate and
public health endpoint passed. The composer/card browser checks also passed against
the live build, with all review writes intercepted. The signed-out review action
was checked on a real public place page and retains the return-to-form URL.

Mobile commit `55a686b` is published on `release/native-preview-20260921`. The existing
iPhone development app additionally passed isolated duplicate-choice, selection,
section-switching and dark/light checks. The temporary fixture was removed and the
normal app restored. Mobile distribution remains on hold.
Full implementation and rules: [Review experience implementation](REVIEW_EXPERIENCE_IMPLEMENTATION.md).

## Search previews — September 21 evening, web released

Search and map previews now put the name, specific category, address and distance before
photos, followed by recent Tavvy experiences and available direct actions. Real place
photos support horizontal galleries. Empty, loading and unavailable review states use
one compact message; available reviews retain the domain-aware four-part grid and
actual recent reviewer counts. Browse cards load the same evidence as place details and
discard responses after their list changes. Google/Tavvy comparison screenshots supplied
by the user informed the hierarchy and reduced header clutter.

Distance remains in meters through provider adapters and place services; conversion happens
at display time. Map/native cards use actual device coordinates when available and
otherwise label the search-origin distance. Zero remains valid and missing/invalid
distances stay hidden. Search projection preserves real photos, address and contact fields.

Web assets contain 130 generated category illustrations across 26 groups (five each,
approximately 8.1 MB total compressed). Their public manifest records prompts and purpose.
Subcategory matching precedes broad categories and selection is stable per place.
Real cover/gallery photos immediately supersede illustrations, which are display-only
and must never be saved into business records. Native uses the web-hosted image library.

Web/mobile TypeScript and six focused distance/photo/review regressions passed.
Local Chrome checks passed for light/dark cards, true counts, all four review sections,
compact unavailable state, gallery scrolling, phone/website links, photo replacement
and map rendering. Map tiles were blocked in the synthetic browser fixture.
Web source `dffb662` deployed successfully through Railway's build and health gate.
Matching mobile source `c55eaf4` is published; native has not been rebuilt.
The subsequent user-approved color adjustment uses the logo's primary purple for
preview action buttons, with white icons/text and 44-point minimum targets.
Its light/dark browser checks and mobile TypeScript passed before publication.
Real opening hours, menu availability, accessibility and other missing business data
are not fabricated. Full translations of the new helper copy remain release follow-up.

As of September 21, 2026, morning, America/New_York.
Read PROJECT_MEMORY.md for product decisions. The full requested release is not complete.

## Release boundaries

The reviewed web and mobile source branches have the user's explicit publication
approval. They are not merged into main. Main workspaces contain unrelated unfinished
work; deploy reviewed snapshots. Source publication, web deployment, native Simulator
verification, EAS upload and App Store submission are separate states.
Relative source manifests are under `docs/release-manifests/`. Never replay migrations
based only on their filenames; obtain private release evidence from the maintainer.

## Current web release

Verified live build: `w9SaMXYfyY0LIBlDDSuY6`. The simplified cruise directory with all
26 official line logos and one Filters control is deployed from reviewed commit
`e1ec9f5`: seven live HTTP checks and 24 live browser checks passed, including touch,
keyboard, themes, filters, pagination and Back state.

The preceding cruise photo/Stories update (`kgb4gXgRxNZrraBUwSWBt`) is retained
from reviewed web commit `79a17b8`. Seven live HTTP checks, 13 photo browser checks and
16 Stories browser checks passed with the exact live build; no real records were changed
by those browser checks. The registered uploaded ship photo appears in the live page
and share metadata. This replaces `8AyFMYKC7PMLjYfxoIweN`, whose earlier cruise/eCard
release passed the following checks. Local production browser checks
passed 17 cruise, 18 eCard and two fully rendered 9:16 previews; all three suites
also passed against the deployed build. Ten live HTTP checks and three read-only
catalog checks passed. Browser data/write fixtures did not mutate real records.

The currently live release includes Cruise discovery through the Universe categories
and Tools, with Ocean/River/Expedition filters. Fourteen deployed navigation checks and
public route/health checks passed. Preserve Docker runtime-copy ownership: missing
ownership caused an earlier failed startup, and the corrected replacement is healthy.

Earlier live work includes destination-aware search, browser history/list restoration,
touch search-sheet improvements, owner/menu save integrity, inline restaurant onboarding,
full Tavvy Menu, appearance controls, place sharing, eCard previews, tool layouts,
community safety, On The Go and Atlas. Public Discover/RV/Atlas/review fixed labels have
41 added keys in 17 catalogs. Full workflows are not completely translated.

## Cruise catalog and administration

376 verified ships across 26 operators are published: 209 ocean, 149 river and
18 expedition ships, with 2,081 sourced venues, 60 cabin categories and 71 programs.
Catalog batches 001–006 passed collision, rollback, publication and public projection
checks. Worldwide overnight fleet coverage remains incomplete. Do not invent missing
facts, photos, reviews or venue identities.

Backend 019 is installed and postchecked. It provides full cruise-line facets and
server-side composed filtering before pagination. The live web release adds a
searchable company picker, retained filters and a curated Featured ships row. Featured
is editorial selection, not a popularity or review ranking, and respects active filters.

Backend 020 is installed and postchecked. Admin authorization, atomic versioned edits,
private image metadata, public gallery projection and protected upload paths passed
29 actual-schema rollback checks and independent cleanup checks. No synthetic customer
records or uploaded test images were retained.

The dedicated admin ship editor is live at https://admin.tavvy.com/cruises, version
`2026-09-21-cruise-photo021` (updated from admin020). It includes all statuses,
search and filters, Information/Photos/Facts/Sources tabs, cover/gallery management and
in-memory unsaved-draft recovery. Production UI checks 28, cache checks 12 and focused
server/image checks 13 passed. Railway Linux image decoding/re-encoding, live health,
assets and version checks passed; unauthenticated cruise queries return 401. No real ship
records or photos were changed for deployment testing. See [Cruise management](cruise-management.md) for the workflow. Public web/native
gallery rendering is live on web and included in the mobile candidate.

The user approved canonical onboard restaurants, bars, shops and other places with
separate venue reviews on September 21, superseding the earlier deferral. Architecture
and identity/visibility checks are underway; venue creation is not implemented yet.
Ship reviews must remain separate from venue reviews.

## eCard organization and approved offer

All 21 layouts and 123 palettes remain. Creation browsing is organized as Business &
Services; Personal & Creators; Food & Mobile Businesses; Real Estate; Faith & Community;
Politics & Public Service, with a separate Free/Pro filter. Browse categories do not
replace persisted card types. Political designs stay out of business-only selection.
The live web release fixes repeated category/plan selections and preserves entered
information, hidden links and saved link identity.

Backend 018 is installed: 33 actual-schema checks, rollback cleanup, rehearsal and
exact post-install checks passed. Free has no plan-based basic-link limit; requests
have a 1 MiB resource bound. At least one Free design is available in every category,
including the specifically approved Agent and civic palettes. There are now 10 Free
designs and 26 Free palettes. Pro retains premium designs, galleries, embedded videos,
forms and professional credentials. Existing prices remain $4.99/month or $39.99/year.
Creation, editing, persistence and publication use the approved design rules.
The offer is live on web and passed native iPhone/iPad verification. The native705 internal cloud build finished successfully; the physical-device IPA is available.
Preserve existing published content and customer media.
Restaurant membership remains a separate offer with unresolved final pricing.

## Mobile and Apple

- Native705 was uploaded for an internal iOS preview build on September 21. Expo
  accepted build `dd0a579c-31dd-4d46-b55e-2f87b7cbb816`, version 1.0.1 build 26;
  status FINISHED. The physical-device IPA download was verified with a bounded read.
  This is not evidence of installation on a physical device.
  No App Store submission has been made.
- Native 688 Cruise entry/navigation passed on iPhone and iPad. The new 705-file
  candidate includes the current Cruise, eCard, Atlas taxonomy and truthful account
  deletion UI work. Typecheck, 23 focused handler checks and configured Xcode build
  passed. Actual testing caught a Photos & stories raw-text crash in the earlier 704
  candidate. Native 705 fixes it, including a regression that failed before the fix.
  All required English Cruise, Photos & stories, Back/filter/query, chooser-repeat,
  preview Close and exact unsaved-input retention cases passed on both iPhone and
  iPad. The initial input test dropped simulated keystrokes; a corrected targeted
  test verified the exact value both before navigation and after return without any
  app change or draft creation. Existing EAS preview connection settings passed
  the actual installed client read checks; no configuration changes were needed.
  Exact source and device-QA receipts were verified before the internal upload.
- Public client settings were verified in the binary; privileged server keys are absent.
- Native 687 has 32 screenshots, including 28 Store candidates and 4 Atlas QA-only
  captures. Final screenshots must match the submitted binary. Native705 adds 12 archived frames: 4 English chooser candidates and 8 Cruise QA
  captures. These are not a complete final Store screenshot set.
- Full 17-language/RTL coverage remains incomplete; several new flows use English
  fallback outside EN/PT/ES. Atlas category label translations are in the current web release and native candidate.
- Earlier Apple navigation/sign-in checks used iPad Air 11-inch M4/iOS 26.5, not the
  original M3/iPadOS 26.2 review configuration.
- Genuine account deletion is still an Apple blocker. Backend 016 remains disabled
  preparation. The new UI truthfully reports unavailability and does not sign out or
  promise completion. Deletion, retention, billing and Auth cleanup are not implemented.
- Digital-purchase compliance, final device/safety/playback checks and review
  instructions remain. Internal EAS approval is not App Store submission approval.

## Providers and search

Provider backend 014 safety and 015 vocabulary are installed. Projection 017 passed
43 actual-schema rollback checks after an exact repair to an obsolete trigger;
independent checks confirmed all synthetic changes rolled back. **017 is not installed.**
Its coordinated web/native/Edge rollout and typed four-part review write path remain
pending. Do not convert old stars into invented tap evidence or expose private owner data.

The reviewed search import continuation is running from its verified checkpoint.
Original search remains live. Never reset the replacement or start a second writer.
Full target verification, permissions, restart persistence, producer reconciliation and
traffic switch remain pending. Private cost, deadline and ambiguity limits still apply.

## Other pending work

- Complete worldwide overnight fleet research.
- The user removed mandatory source/permission steps for admin cruise photo uploads.
  Backend021, admin and web are live; native706 passed configured iPhone/iPad checks.
  Historical metadata remains intact and ship factual verification remains separate.
  Existing EAS705 does not contain this new photo-publication change.
- StoriesRow scope corrections are deployed on web and included in verified native706,
  with 18 component regressions and 16 live web browser checks passing. They preserve
  empty Universe results and reject stale scope/account responses. Native706 has not
  been uploaded to EAS.
- Complete On The Go expiry scheduling and non-food owner features.
- Persist remaining Settings preferences that currently only change component state.
- RV offline maps need a provider permitting downloads; offline routing is separate.
- Atlas full narration is verified for Los Angeles, Chicago and Nashville; audio
  presence alone does not prove complete narration for every article.

Further TDM/Aline card work and the attributed RV-article search were closed by the
user. Do not reopen them. Keep operational logs, credentials, customer exports and
private release evidence outside the public repositories.

## Cruise completion checkpoint — September 21, later morning

Active implementation is now focused on cruise fixes and complete catalog/content
coverage. The user approved onboard canonical places and reviews; other new feature
implementation is paused while the already-running search copy continues.

Backend021 is installed:46 actual-database rollback checks, independent cleanup and
10 exact post-install checks passed. The simplified admin photo editor is live as
`2026-09-21-cruise-photo021`; production build, health, version, assets and anonymous
authorization checks passed. Photo source/permission fields are no longer required.
Historical metadata is preserved without inventing verification claims.

The new web photo/Stories client is deployed and passed its live checks. Railway
archive transfers failed before compilation; fetching the exact reviewed Git commit
through the existing repository connection succeeded. A configured native706 build and 32 native tests passed. Actual
iPhone and iPad checks also passed: the real uploaded photo appears in the directory,
hero and gallery, Photos & stories opens correctly, and Back preserves the ship filters.
Eight original Simulator screenshots are archived. This is separate from completed
internal EAS705; native706 has not been uploaded to EAS.

The horizontal cruise-line logo strip and unified Filters control, with all 26 official
operator logos, is deployed on web and passed 24 live browser checks. Native737
portrait iPhone/iPad workflows passed with 13 actual captures and all 26 bundled
logos verified. Landscape remains unverified: the existing app stayed portrait before
the modal opened, so no orientation policy was changed. No native737 EAS upload. Fleet/image/fact completeness is
not yet established. Current inventory remains376 ships across26 operators.


## New admin photo actions — in progress

The user approved drag-and-drop and multi-file uploads, confirmed Delete photo, and
automatic gallery saving after uploads. This supersedes the earlier staged-upload
Save requirement. Backend/admin023 implementation is isolated and not deployed yet.
Deletion must clear the matching cover and remove the stored file, with explicit
cleanup status if storage fails. Successful photo operations must preserve unrelated
unsaved information/fact/source edits. No actual customer photos are deleted for tests.

## Cruise discovery filters — September 21 afternoon

Matching native source at `5bde784` adds ship-length, build-year, official family-activities and adults-only (18+) filters, matching the live web v3 reader. Audience choices describe operator programs/policy, not guest-rated quality. App TypeScript passes. Internal iOS EAS preview build `fa50ec07-8d30-4439-ace0-5974c36baf54` finished successfully on September 21; final simulator/device QA, distribution and App Store release remain pending. Web source `179597e` is deployed as Railway `1ae20a56-c55e-447d-8a76-9009d8ae282e` and passed live browser checks. Six curated verified ships lead unsearched Explore ships; unknown ship facts remain excluded from exact filters.

## Home visual parity — September 21

The native home quick actions now use colored vector icon badges in place of emoji, and the featured image carousel uses screen-width slides. The first EAS simulator screenshot showed five bordered actions were still cramped, so Surprise moved to an accessible dice button in the search field; four unbordered action icons now match the web layout. Native app TypeScript passes. Local Xcode simulator compilation hit an existing `fmt` Pod/toolchain consteval error before app compilation; a reproducible EAS simulator preview profile is available for actual visual QA. A second simulator build/screenshot and device preview remain pending at this checkpoint. The web homepage now exposes an explicit Where field and the live Boston route check passes without overriding it with current GPS.


## Review experience redesign — September 21 evening

Implemented in this release branch: compact search cards, full topic summaries on
place/cruise details, shared neutral review choices, optional emphasis, preserved
edit history/private notes, and domain-specific provider wording. The web direct
review route now uses the same sheet as the place page. No production schema changes
or synthetic customer reviews were made for this batch.

Verification: web production build and both application TypeScript checks passed.
The focused suite includes distinct-person counts, sparse/older concerns, domain
classification, single-tap removal, category images/distances, RV/On The Go summary
lifecycle and local PostgreSQL review-history tests. Intercepted browser tests cover
place cards, a concern-only submission, failed-save retry with the same request key,
editing with the original date/private note/emphasis, hotel vocabulary, PT/AR,
light/dark mode, provider submission and cruise save/moderation/late-response guards.
The older atomic-review script additionally depends on a private admin migration
absent from this public release checkout; its complete legacy gate was not rerun.
The review-history SQL gate passed using private schema-only fixtures kept outside Git.

The existing iPhone 17 development app loaded this branch's JavaScript through local
Metro. Boston search/results were checked against live read-only services. Native
summary and selection components were also rendered with isolated in-memory fixtures
in light/dark mode; selection/removal worked. The temporary fixture entry was removed
and the normal application entry restored. No EAS upload or native compilation was
started, honoring the user's build hold. This is not final iPad/App Store screenshot
or on-device release-build certification. No real production review was posted.

At this checkpoint source publication and the web deployment receipt are recorded
in the follow-up release entry. The mobile changes need the next consolidated binary;
the 13 remaining locale fallbacks remain part of the Apple language-completion gate.


### Confirmed review rollout

Web source `1c5e8e4` is live: Railway deployment
`f0a9dc24-5eeb-49cf-9a77-6d08e92e6939` completed successfully and passed its health
check. The deployed site passed the compact-card and composer browser checks,
including light/dark, PT/AR, concern-only saves, retries and edit preservation;
all test writes were intercepted. Public health, Boston search, the previously
reported indexed FSQ place and the restaurant demonstration route returned HTTP 200.
The final focused suite passed 29 tests with zero failures.

Matching mobile source `5da4f2e` is published on
`release/native-preview-20260921`. Its application TypeScript check passed after the
temporary native fixture was removed. Native component visual/interaction checks
and the live read-only Boston search ran in the existing iPhone Simulator app.
A new distributed binary, full iPad release QA and remaining-language translation
are still outstanding. Claude's separate Apple readiness branch was not modified.

## Review presentation redesign — September 22, source only

Mirrors the approved web presentation: `lib/placeReviewSummary.ts` is copied from
web (adds `practical`, `searchReviewSections()` and `cardReviewRows()`), and
`components/PlaceReviewGrid.tsx` renders every topic as a row whose background is
its frequency bar on one scale per place (teal/purple/amber; bars hidden below five
recent reviewers) with the word and people count on top: the place screen shows the
core experience first, three-row supporting sections with Show all, tappable rows
that show matching experiences, an About these numbers control and a Good to know
row; search cards open with `Reviews · {{count}} people · Last 6 months` and show one
expandable row per section. The search card (`CardHero` in `screens/HomeScreen.tsx`)
sets the name, category, distance and address on a 172-pt swipeable photo header
with a `1 / N` counter and step buttons, and ends with the place-screen icon
shortcuts (Call, Directions, Website, Details). The place screen follows the same
concept: the hero swipes through real photos with a counter and a View all photos
chip, the pill reads category · subcategory, tabs under the action icons are
Overview (with the four-row review teaser and reported payment details), Reviews
(rows whose chevron opens the other words; a tapped word shows matching
experiences), Photos & Stories and Tavvy Menu (only with a menu); Details folded into
Overview. Accent is the logo teal. The place screen title is Reviews and Heads Up chips carry the `!`
marker. Four locale keys (`reviewExperience82`–`85`) were added to en/es/pt/ar.
Application TypeScript and 16 focused unit tests passed. This has not been rendered
in the Simulator or included in any EAS build; native visual verification remains open.

Later the same day (source only, mirroring web): the Overview no longer repeats what the
icon row already offers — the review teaser's own `Reviews · {{count}} people` line is the
heading (See experiences beside it, `action` prop on `PlaceReviewGrid`), and the info card
(now Location & hours) keeps the address, confirmed links and hours but drops the phone,
website, eCard and Get directions rows. The Reviews tab keeps the summary rows plus filters
(selected word, Last 6 months / All time, With comments, Newest/Oldest first) and Show more.
`screens/MenuGalleryScreen.tsx` mirrors the web menu: `lib/menuAppearance.ts` (copied from
web) exposes `entryView`, so the owner's Menu design decides whether the screen opens as
the text list (Elegant Ivory, Clean White) or the full-screen photo menu (Visual, the
default); an explicit `view` route param wins. Photo mode is the whole screen: full-bleed
photo pages (`expo-linear-gradient` shade, details over the lower part, long text scrolls),
a floating bar (back, `n / N`, list icon) and floating filters (All, periods, categories,
dietary funnel); the Previous/Next footer is gone. The list keeps one photo icon to switch
back. Application TypeScript is clean; the repository's Deno functions and a jest-style test
file report pre-existing environment errors; no device run in this batch.

Third follow-up (source only): the place action row shows Stories next to Website when the
place has stories, wrapped in `components/StoryActionRing.tsx` — a slowly rotating
`expo-linear-gradient` ring in the logo colours (#00AAB4 → #8A05BE → #58D9DE) that mirrors the
web `.story-ring`; tapping opens the story viewer. (`StoryRing` for avatars in the stories row
is unchanged.) TypeScript clean; no device run in this batch.
