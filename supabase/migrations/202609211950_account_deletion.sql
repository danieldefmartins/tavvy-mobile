-- Genuine account deletion: policy gate + caller-scoped cleanup RPC.
--
-- Architecture (see docs/ACCOUNT_DELETION_READINESS.md for the full design
-- this implements): the delete-account Edge Function verifies the caller,
-- checks the policy gate below, cancels Stripe subscriptions, removes owned
-- Storage objects, calls delete_own_account_data() for every public-schema
-- row, then hard-deletes the Auth identity via the Admin API. This
-- migration only adds the policy table and the SQL cleanup RPC — it does
-- NOT enable deletion. account_deletion_policy.approved defaults to false
-- and must be explicitly flipped (by the maintainer, in a separate
-- statement, after reviewing the retention behavior below) before the
-- Edge Function will allow a real deletion to proceed.
--
-- Audited against the live schema on 2026-09-21 (not just this repo's
-- migration files, which lag production). Two identity systems exist in
-- this database: `auth.users` (current Supabase Auth) and a legacy
-- `public.users` table with its own password_hash/oauth columns. This RPC
-- only ever touches rows tied to auth.uid() — it never resolves, reads or
-- deletes anything through the legacy public.users table or by email
-- matching, per the project's standing rule against conflating the two.

CREATE TABLE IF NOT EXISTS public.account_deletion_policy (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = true), -- singleton row
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.account_deletion_policy (id, approved)
VALUES (true, false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.account_deletion_policy ENABLE ROW LEVEL SECURITY;
-- No policies: unreadable/unwritable by anon or authenticated roles.
-- Only the service role (which bypasses RLS) and this migration can touch it.

-- Stores the Apple refresh token captured at sign-in so it can be revoked
-- with Apple's /auth/revoke endpoint when the account is deleted (Apple
-- Guideline 5.1.1(v)). Populated by a native auth-flow change that is a
-- separate piece of work; this table is prepared ahead of it. Never
-- readable by the client — service role only.
CREATE TABLE IF NOT EXISTS public.user_apple_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_refresh_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_apple_credentials ENABLE ROW LEVEL SECURITY;
-- No policies: service-role only, same reasoning as account_deletion_policy.

-- Caller-scoped cleanup for every public-schema table that would otherwise
-- block (RESTRICT/NO ACTION) or mishandle (wrongly CASCADE a shared
-- business record) a hard delete of the caller's auth.users row. Tables
-- with a correct ON DELETE CASCADE/SET NULL straight to auth.users(id)
-- need no entry here — the Admin API delete handles them automatically.
CREATE OR REPLACE FUNCTION public.delete_own_account_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_approved BOOLEAN;
  v_summary jsonb := '{}'::jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'ACCOUNT_DELETION_NO_CALLER' USING ERRCODE = '28000';
  END IF;

  SELECT approved INTO v_approved FROM public.account_deletion_policy WHERE id = true;
  IF NOT COALESCE(v_approved, false) THEN
    RAISE EXCEPTION 'ACCOUNT_DELETION_NOT_APPROVED' USING ERRCODE = '42501';
  END IF;

  -- 1. End any of the caller's own active live/location-sharing sessions
  -- before anything else, per the release doc's required ordering.
  UPDATE public.live_sessions
  SET status = 'ended', actual_end_at = COALESCE(actual_end_at, NOW())
  WHERE started_by_auth = v_uid AND status = 'active';

  -- Historical session rows: detach the identity, keep the record.
  UPDATE public.live_sessions SET started_by_auth = NULL WHERE started_by_auth = v_uid;
  UPDATE public.live_sessions SET disabled_by_auth = NULL WHERE disabled_by_auth = v_uid;

  -- 2. Disable (never delete) Pro/business listings the caller owns.
  -- Preserves service history, employee records and payroll relationships
  -- for everyone else attached to the business.
  UPDATE public.pro_providers
  SET user_id = NULL,
      is_active = false,
      phone = NULL,
      email = NULL,
      website = NULL,
      whatsapp_number = NULL,
      onboarding_data = NULL
  WHERE user_id = v_uid;

  UPDATE public.pros
  SET user_id = NULL,
      is_active = false,
      contact_email = NULL,
      contact_phone = NULL
  WHERE user_id = v_uid;

  -- 3. Delete the caller's own authored content. place_review_signal_taps
  -- cascades from place_reviews.id already.
  DELETE FROM public.place_review_revisions WHERE auth_user_id = v_uid;
  DELETE FROM public.place_reviews WHERE auth_user_id = v_uid;
  DELETE FROM public.place_photos WHERE user_id = v_uid;
  DELETE FROM public.photo_likes WHERE user_id = v_uid;
  DELETE FROM public.realtor_match_requests WHERE user_id = v_uid;
  DELETE FROM public.place_admins WHERE user_id = v_uid;

  -- 4. Block relationships lose meaning once one side is gone.
  DELETE FROM public.blocked_users WHERE blocker_id = v_uid OR blocked_id = v_uid;

  -- 5. Detach acting-identity references on records that must survive
  -- (public places/events, other people's audit trail, other admins'
  -- grants) — never cascade-delete the shared record itself.
  UPDATE public.places SET claimed_by = NULL WHERE claimed_by = v_uid;
  UPDATE public.scheduled_events SET created_by = NULL WHERE created_by = v_uid;
  UPDATE public.user_roles SET granted_by = NULL WHERE granted_by = v_uid;
  UPDATE public.user_verifications SET reviewed_by = NULL WHERE reviewed_by = v_uid;
  UPDATE public.story_reports SET reporter_user_id = NULL WHERE reporter_user_id = v_uid;
  UPDATE public.search_analytics SET user_id = NULL WHERE user_id = v_uid;

  -- 6. Clear caller-linked audit/security identity while preserving the
  -- security record itself, per the approved retention policy.
  UPDATE public.audit_log SET user_id = NULL WHERE user_id = v_uid;
  UPDATE public.login_anomalies SET user_id = NULL WHERE user_id = v_uid;
  UPDATE public.login_anomalies SET acknowledged_by = NULL WHERE acknowledged_by = v_uid;

  v_summary := jsonb_build_object('user_id', v_uid, 'cleaned_at', NOW());
  RETURN v_summary;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_own_account_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account_data() TO authenticated;
