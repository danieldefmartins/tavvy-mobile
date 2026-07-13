-- ============================================================================
-- Workforce Module — Phase 1 (spine)   [APPLIED — see also 20260707_*_integrity_hardening]
-- ----------------------------------------------------------------------------
-- Employee time tracking + payroll-prep for Tavvy Pros, anchored on
-- pro_providers (the employer). Multi-tenant, RLS-enforced.
--
-- Crew members are app users who self clock-in with GPS; an optional `pin`
-- generalizes the existing kiw_shop_workers shop-tablet pattern (kiosk mode).
--
-- PURELY ADDITIVE. Does NOT touch kiw_shop_* or fab_*.
-- NOTE: tables are created BEFORE the policy-helper functions, because the
-- helpers reference pro_employees (Postgres validates function bodies at create).
-- ============================================================================

-- updated_at trigger helper (needed before table triggers)
create or replace function public.pro_set_updated_at()
returns trigger language plpgsql
set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- pro_employees — the crew
-- ===========================================================================
create table if not exists public.pro_employees (
  id              uuid primary key default gen_random_uuid(),
  employer_id     uuid not null references public.pro_providers(id) on delete cascade,
  auth_user_id    uuid references auth.users(id) on delete set null, -- null until invite accepted
  full_name       text not null,
  email           text,
  phone           text,
  preferred_lang  text not null default 'en',
  role            text not null default 'crew' check (role in ('owner','foreman','crew')),
  pay_type        text not null default 'hourly' check (pay_type in ('hourly','salary')),
  pay_rate        numeric(10,2),               -- hourly rate, or annual if salary
  ot_multiplier   numeric(4,2) not null default 1.5,
  classification  text,                        -- for certified payroll (e.g. 'Ironworker')
  -- TODO(security): pin is stored in PLAINTEXT. Hash it (e.g. bcrypt/crypt via
  -- pgcrypto) before kiosk mode ships; compare via a security-definer helper.
  pin             text,                        -- optional kiosk/shop-tablet PIN
  status          text not null default 'invited' check (status in ('invited','active','inactive')),
  invited_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- (employer_id, id) unique so child tables can enforce same-tenant composite FKs
  unique (employer_id, id)
);
create unique index if not exists pro_employees_employer_user_uniq
  on public.pro_employees (employer_id, auth_user_id) where auth_user_id is not null;
create unique index if not exists pro_employees_employer_pin_uniq
  on public.pro_employees (employer_id, pin) where pin is not null;
create index if not exists pro_employees_employer_idx on public.pro_employees (employer_id);
create index if not exists pro_employees_auth_user_idx on public.pro_employees (auth_user_id);
drop trigger if exists pro_employees_set_updated_at on public.pro_employees;
create trigger pro_employees_set_updated_at before update on public.pro_employees
  for each row execute function public.pro_set_updated_at();

-- ===========================================================================
-- pro_jobs — worksites/projects (geofence + job-costing inputs)
-- ===========================================================================
create table if not exists public.pro_jobs (
  id                  uuid primary key default gen_random_uuid(),
  employer_id         uuid not null references public.pro_providers(id) on delete cascade,
  name                text not null,
  customer_name       text,
  address             text,
  lat                 numeric,
  lng                 numeric,
  geofence_radius_m   integer not null default 150,
  budget_hours        numeric(10,2),           -- job-costing: estimated labor hours
  estimate_total      numeric(12,2),           -- job-costing: quoted total
  est_number          text,                    -- link to KIW estimate / kiw_shop_jobs.est_number
  external_ref        uuid,                    -- optional link to kiw_shop_jobs.id / project id
  is_prevailing_wage  boolean not null default false, -- certified payroll
  wage_determination  jsonb,
  status              text not null default 'active' check (status in ('active','completed','archived')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists pro_jobs_employer_idx on public.pro_jobs (employer_id);
drop trigger if exists pro_jobs_set_updated_at on public.pro_jobs;
create trigger pro_jobs_set_updated_at before update on public.pro_jobs
  for each row execute function public.pro_set_updated_at();

-- ===========================================================================
-- pro_time_entries — clock in/out events (GPS, geofence, breaks)
-- employer_id denormalized so RLS doesn't need a join.
-- ===========================================================================
create table if not exists public.pro_time_entries (
  id              uuid primary key default gen_random_uuid(),
  employer_id     uuid not null references public.pro_providers(id) on delete cascade,
  employee_id     uuid not null references public.pro_employees(id) on delete cascade,
  job_id          uuid references public.pro_jobs(id) on delete set null,
  clock_in_at     timestamptz not null,
  clock_out_at    timestamptz,
  clock_in_lat    numeric,
  clock_in_lng    numeric,
  clock_out_lat   numeric,
  clock_out_lng   numeric,
  in_geofence     boolean,                     -- was clock-in inside the job geofence?
  break_minutes   integer not null default 0,
  breaks          jsonb not null default '[]'::jsonb,
  source          text not null default 'self' check (source in ('self','foreman','kiosk','manual')),
  note            text,
  status          text not null default 'open' check (status in ('open','closed','edited','void')),
  edited_by       uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- cross-tenant integrity: the employee must belong to THIS employer
  foreign key (employer_id, employee_id)
    references public.pro_employees (employer_id, id) on delete cascade
);
create index if not exists pro_time_entries_employee_idx on public.pro_time_entries (employee_id);
create index if not exists pro_time_entries_job_idx on public.pro_time_entries (job_id);
create index if not exists pro_time_entries_employer_clockin_idx
  on public.pro_time_entries (employer_id, clock_in_at);
-- one open entry per employee at a time
create unique index if not exists pro_time_entries_one_open_per_employee
  on public.pro_time_entries (employee_id) where status = 'open';
drop trigger if exists pro_time_entries_set_updated_at on public.pro_time_entries;
create trigger pro_time_entries_set_updated_at before update on public.pro_time_entries
  for each row execute function public.pro_set_updated_at();

-- ===========================================================================
-- pro_pay_periods — the calendar payroll runs against
-- ===========================================================================
create table if not exists public.pro_pay_periods (
  id            uuid primary key default gen_random_uuid(),
  employer_id   uuid not null references public.pro_providers(id) on delete cascade,
  frequency     text not null default 'weekly'
                  check (frequency in ('weekly','biweekly','semimonthly','monthly')),
  starts_on     date not null,
  ends_on       date not null,
  is_locked     boolean not null default false,
  locked_at     timestamptz,
  created_at    timestamptz not null default now(),
  unique (employer_id, starts_on, ends_on)
);
create index if not exists pro_pay_periods_employer_idx on public.pro_pay_periods (employer_id);

-- ===========================================================================
-- pro_timesheets — per-employee roll-up per pay period (approval gate)
-- ===========================================================================
create table if not exists public.pro_timesheets (
  id              uuid primary key default gen_random_uuid(),
  employer_id     uuid not null references public.pro_providers(id) on delete cascade,
  employee_id     uuid not null references public.pro_employees(id) on delete cascade,
  pay_period_id   uuid not null references public.pro_pay_periods(id) on delete cascade,
  reg_hours       numeric(8,2) not null default 0,
  ot_hours        numeric(8,2) not null default 0,
  gross_pay       numeric(12,2) not null default 0,
  status          text not null default 'draft' check (status in ('draft','submitted','approved','exported')),
  approved_by     uuid references auth.users(id) on delete set null,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (employee_id, pay_period_id),
  -- cross-tenant integrity: the employee must belong to THIS employer
  foreign key (employer_id, employee_id)
    references public.pro_employees (employer_id, id) on delete cascade
);
create index if not exists pro_timesheets_period_idx on public.pro_timesheets (pay_period_id);
drop trigger if exists pro_timesheets_set_updated_at on public.pro_timesheets;
create trigger pro_timesheets_set_updated_at before update on public.pro_timesheets
  for each row execute function public.pro_set_updated_at();

-- ===========================================================================
-- pro_payroll_exports — what got pushed to QB / CSV
-- ===========================================================================
create table if not exists public.pro_payroll_exports (
  id              uuid primary key default gen_random_uuid(),
  employer_id     uuid not null references public.pro_providers(id) on delete cascade,
  pay_period_id   uuid not null references public.pro_pay_periods(id) on delete cascade,
  target          text not null check (target in ('quickbooks','csv','adp','gusto')),
  payload         jsonb,
  status          text not null default 'pending' check (status in ('pending','exported','failed')),
  exported_by     uuid references auth.users(id) on delete set null,
  exported_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists pro_payroll_exports_employer_idx on public.pro_payroll_exports (employer_id);

-- ===========================================================================
-- Policy-helper functions (created AFTER tables exist).
-- SECURITY DEFINER + pinned search_path; executable by authenticated only.
-- ===========================================================================
create or replace function public.pro_is_employer(p_employer_id uuid)
returns boolean language sql security definer stable
set search_path = public as $$
  select exists (
    select 1 from public.pro_providers pp
    where pp.id = p_employer_id and pp.user_id = auth.uid()
  );
$$;

create or replace function public.pro_current_employee_id(p_employer_id uuid)
returns uuid language sql security definer stable
set search_path = public as $$
  select e.id from public.pro_employees e
  where e.employer_id = p_employer_id and e.auth_user_id = auth.uid()
  limit 1;
$$;

revoke execute on function public.pro_is_employer(uuid) from public, anon;
revoke execute on function public.pro_current_employee_id(uuid) from public, anon;
grant execute on function public.pro_is_employer(uuid) to authenticated;
grant execute on function public.pro_current_employee_id(uuid) to authenticated;

-- ===========================================================================
-- Row Level Security
-- employer (pro_providers.user_id) = full access to own rows; crew member =
-- self-access to own employee row + read employer jobs/pay-periods + read/write
-- own *open* time entries. anon = nothing.
-- ===========================================================================
alter table public.pro_employees       enable row level security;
alter table public.pro_jobs            enable row level security;
alter table public.pro_time_entries    enable row level security;
alter table public.pro_pay_periods     enable row level security;
alter table public.pro_timesheets      enable row level security;
alter table public.pro_payroll_exports enable row level security;

drop policy if exists pro_employees_employer_all on public.pro_employees;
create policy pro_employees_employer_all on public.pro_employees
  for all to authenticated
  using (public.pro_is_employer(employer_id)) with check (public.pro_is_employer(employer_id));
drop policy if exists pro_employees_self_read on public.pro_employees;
create policy pro_employees_self_read on public.pro_employees
  for select to authenticated using (auth_user_id = auth.uid());

drop policy if exists pro_jobs_employer_all on public.pro_jobs;
create policy pro_jobs_employer_all on public.pro_jobs
  for all to authenticated
  using (public.pro_is_employer(employer_id)) with check (public.pro_is_employer(employer_id));
drop policy if exists pro_jobs_employee_read on public.pro_jobs;
create policy pro_jobs_employee_read on public.pro_jobs
  for select to authenticated using (public.pro_current_employee_id(employer_id) is not null);

drop policy if exists pro_time_entries_employer_all on public.pro_time_entries;
create policy pro_time_entries_employer_all on public.pro_time_entries
  for all to authenticated
  using (public.pro_is_employer(employer_id)) with check (public.pro_is_employer(employer_id));
drop policy if exists pro_time_entries_employee_read on public.pro_time_entries;
create policy pro_time_entries_employee_read on public.pro_time_entries
  for select to authenticated using (employee_id = public.pro_current_employee_id(employer_id));
drop policy if exists pro_time_entries_employee_insert on public.pro_time_entries;
-- Tightened: employees may only create their OWN live self clock-ins
-- ('self' = mobile self clock-in source), status must start 'open', and the
-- clock-in time must be within 15 minutes of now() (no backdating/forward-dating).
create policy pro_time_entries_employee_insert on public.pro_time_entries
  for insert to authenticated with check (
    employee_id = public.pro_current_employee_id(employer_id)
    and source = 'self'
    and status = 'open'
    and clock_in_at between now() - interval '15 minutes' and now() + interval '15 minutes'
  );
drop policy if exists pro_time_entries_employee_update on public.pro_time_entries;
-- Tightened: employees can only edit their own OPEN entries, and may only move
-- status to 'closed' (clock-out) or leave it 'open' — never 'edited'/'void'.
create policy pro_time_entries_employee_update on public.pro_time_entries
  for update to authenticated
  using (employee_id = public.pro_current_employee_id(employer_id) and status = 'open')
  with check (
    employee_id = public.pro_current_employee_id(employer_id)
    and status in ('open','closed')
  );

drop policy if exists pro_pay_periods_employer_all on public.pro_pay_periods;
create policy pro_pay_periods_employer_all on public.pro_pay_periods
  for all to authenticated
  using (public.pro_is_employer(employer_id)) with check (public.pro_is_employer(employer_id));
drop policy if exists pro_pay_periods_employee_read on public.pro_pay_periods;
create policy pro_pay_periods_employee_read on public.pro_pay_periods
  for select to authenticated using (public.pro_current_employee_id(employer_id) is not null);

drop policy if exists pro_timesheets_employer_all on public.pro_timesheets;
create policy pro_timesheets_employer_all on public.pro_timesheets
  for all to authenticated
  using (public.pro_is_employer(employer_id)) with check (public.pro_is_employer(employer_id));
drop policy if exists pro_timesheets_employee_read on public.pro_timesheets;
create policy pro_timesheets_employee_read on public.pro_timesheets
  for select to authenticated using (employee_id = public.pro_current_employee_id(employer_id));

drop policy if exists pro_payroll_exports_employer_all on public.pro_payroll_exports;
create policy pro_payroll_exports_employer_all on public.pro_payroll_exports
  for all to authenticated
  using (public.pro_is_employer(employer_id)) with check (public.pro_is_employer(employer_id));
