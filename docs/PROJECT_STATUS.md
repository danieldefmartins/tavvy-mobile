# Tavvy current engineering status

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
