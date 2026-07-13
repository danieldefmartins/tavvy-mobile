# Tavvy Pros — Workforce Module (Time Tracking + Payroll Prep)

Employee hours + payment system inside the Tavvy Pros app. Built multi-tenant
for all contractors; KIW is the design partner / first tenant.

## Confirmed decisions
- **Audience:** Pros app from day 1 (multi-tenant), not KIW-only.
- **Payments:** Calculate + export to QuickBooks; **CSV export ships first** as the
  fallback. We do NOT compute tax withholding (liability → QB/ADP/Gusto handle it).
- **Killer features (all in):** job-costing vs estimate, GPS/geofence clock-in,
  certified payroll, crew scheduling.
- **Backend:** One workforce domain in **Supabase + edge functions + RLS**,
  anchored on `pro_providers`. BOTH mobile and web portal call the same edge
  functions (avoids the MySQL/tRPC-vs-edge-function split; honors web+mobile sync).
- **Crew identity:** crew are **app users** who self clock-in with GPS; an optional
  PIN enables kiosk/shop-tablet mode (generalizes `kiw_shop_workers`).

## Repo / stack reality (from exploration)
- **tavvy-pros-portal** (web): React/Vite + Express + tRPC, MySQL (Drizzle) +
  Supabase. Pro identity = `pros` table. More review/listing oriented.
- **tavvy-mobile** (Expo RN): Supabase edge functions only. The real contractor
  marketplace (leads/bids/messaging, 30+ `Pros*` screens). Has `expo-location`,
  i18n (17 langs incl. ES), React Query + AsyncStorage, Stripe.
- Both share Supabase project `scasgwrikoqdwlwlwcff` ("tavvy's Project").
- **Employer identity = `pro_providers`** (rich, multi-tenant, currently 0 rows).

## Pre-existing systems we deliberately do NOT disturb
- `kiw_shop_workers` (PIN, role, active) / `kiw_shop_jobs` (job_number, est_number,
  current_stage) / `kiw_shop_stage_log` — KIW shop-floor workflow tracking.
  No clock-out, no hours, no pay. The new module is additive; later we can
  optionally map `kiw_shop_workers` → `pro_employees`.
- `fab_projects` / `fab_job_tickets` / `fab_communications` — KIW fabrication.

## Security note (open item — Task #5)
Supabase advisory: **52 public tables have RLS disabled** (anon can read/write),
incl. `places`, `leads`, `pro_categories`, `pro_service_areas`, `pro_availability`,
and KIW `fab_projects`/`fab_job_tickets`/`fab_communications`. The `kiw_shop_*`
tables already have RLS on. All new workforce tables ship RLS-on + policies.
Cleanup to be done deliberately (policies per table), not a blind enable.

## Data model (Phase 1 — see migration 20260626000000_workforce_module.sql)
All anchored on `pro_providers(id)` as `employer_id`, RLS-enforced.
- `pro_employees` — crew; auth_user_id (nullable until invite accepted) + optional pin;
  role owner/foreman/crew; pay_rate, ot_multiplier, classification.
- `pro_jobs` — worksites; geofence (lat/lng/radius); budget_hours + estimate_total
  (job-costing); est_number/external_ref (link KIW estimates); is_prevailing_wage.
- `pro_time_entries` — clock in/out, GPS in/out, in_geofence, breaks; one open entry
  per employee; source self/foreman/kiosk/manual.
- `pro_pay_periods` — weekly/biweekly calendar; lockable.
- `pro_timesheets` — per-employee roll-up per period; draft→submitted→approved→exported.
- `pro_payroll_exports` — quickbooks/csv/adp/gusto payloads.

RLS pattern: employer (`pro_providers.user_id`) full access to own rows; crew member
self-access to own employee row, read of employer jobs/pay-periods, read/write of own
*open* time entries. anon = nothing. Helpers: `pro_is_employer()`, `pro_current_employee_id()`.

## Edge functions (Phase 1, `pros-*` convention)
`pros-employees-invite|list|update`, `pros-employee-accept-invite`,
`pros-jobs-create|list|update`, `pros-timeclock-clock-in|clock-out` (geofence validation),
`pros-timesheets-list|approve` (OT auto-calc), `pros-payroll-export` (CSV first).

## Surfaces
- **Mobile (crew + owner-lite):** TimeClockScreen (one-tap GPS clock in/out + offline
  queue), MyScheduleScreen, MyTimesheetScreen, CrewScreen (live who's-on). ES default.
- **Web portal (owner-heavy):** Crew, Jobs (geofence on Map.tsx), Timesheets approval,
  JobCosting (Recharts), Payroll (QB/CSV), CertifiedPayroll.

## Build sequence
1. **Phase 1 — Spine:** schema + RLS → invite/accept crew → jobs w/ geofence →
   mobile clock in/out (GPS + offline) → owner approves weekly timesheet (OT calc)
   → CSV export. *Fully usable.*
2. **Phase 2:** Job-costing dashboard (cost vs estimate).
3. **Phase 3:** QuickBooks per-pro OAuth + payroll export (`pro_qbo_connections`).
4. **Phase 4:** Crew scheduling.
5. **Phase 5:** Certified payroll (WH-347 + MA prevailing wage). The moat.

## Status
- [x] Exploration of both repos + live DB schema
- [x] Phase 1 migration written + APPLIED (+ integrity_hardening delta: composite
      (employer_id,id) unique, cross-tenant FKs, tightened crew RLS, PIN-hash TODO)
- [x] Seeded KIW as first pro_provider (owner daniel@360forbusiness.com) + 3 employees
      mapped from kiw_shop_workers (PINs carried for kiosk mode)
- [x] Edge functions: pros-timeclock-clock-in / clock-out DEPLOYED (self + kiosk/PIN,
      GPS geofence via haversine, offline-replay timestamps). DB guards verified.
- [x] Seed data: 1 job (Broadway Village, geofenced), 1 weekly pay period, 1 sample shift
- [ ] Edge functions remaining: employees-invite/accept, jobs-create/list/update,
      timesheets-list/approve (OT calc), payroll-export (CSV)
- [x] Mobile TimeClockScreen BUILT + wired: hooks/useTimeClock.ts (offline queue via
      AsyncStorage, GPS via expo-location, direct RLS reads + edge-fn writes),
      screens/TimeClockScreen.tsx, registered in App.tsx ProsStack + navigation.ts,
      launch button on ProsDashboard Quick Actions, i18n timeclock block EN+ES.
      Typechecks clean. daniel@360forbusiness.com linked to KIW "Daniel Martins"
      employee for live self clock-in test.
- [ ] Mobile screens remaining: MyScheduleScreen, MyTimesheetScreen, owner CrewScreen
- [ ] Web portal screens
- [ ] PIN hashing before kiosk ships; RLS cleanup on 52 legacy tables (Task #5)
