--
-- PostgreSQL database dump
--

\restrict NokPVH6raYxNAImqUqqtxOPt4QIvWC4D06qar15XL9ALhVVModMmu0FdUP9S2lz

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA supabase_migrations;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: approve_business_claim(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.approve_business_claim(claim_id uuid, admin_id uuid, notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  claim RECORD;
BEGIN
  -- Get the pending claim
  SELECT * INTO claim 
  FROM place_claims 
  WHERE id = claim_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Claim not found or already processed'
    );
  END IF;
  
  -- Mark claim as verified
  UPDATE place_claims 
  SET status = 'verified', 
      verification_method = 'manual', 
      reviewed_by = admin_id, 
      reviewed_at = NOW(), 
      review_notes = notes
  WHERE id = claim_id;
  
  -- Update place to mark as owner-managed
  UPDATE places 
  SET owner_managed = true, 
      verified = true,
      owner_user_id = claim.user_id
  WHERE id = claim.place_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Claim approved', 
    'place_id', claim.place_id, 
    'user_id', claim.user_id
  );
END;
$$;


--
-- Name: approve_edit_suggestion(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.approve_edit_suggestion(suggestion_id uuid, admin_id uuid, notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  suggestion RECORD;
  change_key TEXT;
  change_value TEXT;
  update_query TEXT;
BEGIN
  -- Get the pending suggestion
  SELECT * INTO suggestion 
  FROM edit_suggestions 
  WHERE id = suggestion_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Suggestion not found or already processed'
    );
  END IF;
  
  -- Build dynamic UPDATE query
  update_query := 'UPDATE places SET ';
  
  FOR change_key, change_value IN 
    SELECT * FROM jsonb_each_text(suggestion.suggested_changes)
  LOOP
    update_query := update_query || format('%I = %L, ', change_key, change_value);
  END LOOP;
  
  -- Add updated_at and WHERE clause
  update_query := update_query || format('updated_at = NOW() WHERE id = %L', suggestion.place_id);
  
  -- Execute the update
  EXECUTE update_query;
  
  -- Mark suggestion as approved
  UPDATE edit_suggestions 
  SET status = 'approved', 
      reviewed_by = admin_id, 
      reviewed_at = NOW(), 
      review_notes = notes 
  WHERE id = suggestion_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Edit approved', 
    'place_id', suggestion.place_id
  );
END;
$$;


--
-- Name: bulk_approve_edits(uuid[], uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bulk_approve_edits(suggestion_ids uuid[], admin_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  success_count INT := 0;
  fail_count INT := 0;
  suggestion_id UUID;
  result JSONB;
BEGIN
  FOREACH suggestion_id IN ARRAY suggestion_ids
  LOOP
    result := approve_edit_suggestion(suggestion_id, admin_id, 'Bulk approved');
    IF (result->>'success')::BOOLEAN THEN
      success_count := success_count + 1;
    ELSE
      fail_count := fail_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true, 
    'approved', success_count, 
    'failed', fail_count
  );
END;
$$;


--
-- Name: bulk_reject_edits(uuid[], uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.bulk_reject_edits(suggestion_ids uuid[], admin_id uuid, notes text DEFAULT 'Bulk rejected'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  success_count INT := 0;
BEGIN
  UPDATE edit_suggestions 
  SET status = 'rejected', 
      reviewed_by = admin_id, 
      reviewed_at = NOW(), 
      review_notes = notes
  WHERE id = ANY(suggestion_ids) AND status = 'pending';
  
  GET DIAGNOSTICS success_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true, 
    'rejected', success_count
  );
END;
$$;


--
-- Name: calculate_decayed_count(text, integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_decayed_count(signal_color text, actual_count integer, last_tapped_at timestamp with time zone) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
  days_old INTEGER;
  half_life_days INTEGER := 180; -- 6 months
  decay_factor NUMERIC;
BEGIN
  -- Only decay negative (orange) signals
  IF signal_color != 'orange' THEN
    RETURN actual_count;
  END IF;
  
  days_old := EXTRACT(EPOCH FROM (NOW() - last_tapped_at)) / 86400;
  decay_factor := POWER(0.5, days_old::NUMERIC / half_life_days);
  
  RETURN actual_count * decay_factor;
END;
$$;


--
-- Name: calculate_time_decay(timestamp with time zone, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_time_decay(review_timestamp timestamp with time zone, half_life_days numeric DEFAULT 180) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  age_days numeric;
BEGIN
  -- Calculate age in days
  age_days := EXTRACT(EPOCH FROM (now() - review_timestamp)) / 86400.0;
  
  -- decay(age) = 0.5^(age_days / HALF_LIFE_DAYS)
  RETURN POWER(0.5, age_days / half_life_days);
END;
$$;


--
-- Name: FUNCTION calculate_time_decay(review_timestamp timestamp with time zone, half_life_days numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.calculate_time_decay(review_timestamp timestamp with time zone, half_life_days numeric) IS 'Returns decay factor (0..1) based on age with half-life of 180 days (default).';


--
-- Name: calculate_trust_score(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_trust_score(user_id_param uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  profile RECORD;
  score INT;
BEGIN
  SELECT * INTO profile FROM user_profiles WHERE id = user_id_param;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  score := LEAST(100, GREATEST(0,
    (COALESCE(profile.approved_edits, 0) * 10) +
    (COALESCE(profile.review_count, 0) * 2) -
    (COALESCE(profile.rejected_edits, 0) * 5) -
    (COALESCE(profile.reports_against, 0) * 20)
  ));
  
  RETURN score;
END;
$$;


--
-- Name: check_and_award_badges(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_and_award_badges(p_user_id uuid) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_badges TEXT[];
  v_total_taps INTEGER;
  v_current_streak INTEGER;
  v_impact_count INTEGER;
  v_new_badges TEXT[] := '{}';
BEGIN
  -- Get current user stats
  SELECT badges, total_taps, current_streak, impact_count
  INTO v_badges, v_total_taps, v_current_streak, v_impact_count
  FROM user_gamification
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN '{}';
  END IF;

  -- Check for first tap badge
  IF v_total_taps = 1 AND NOT 'first_tap' = ANY(v_badges) THEN
    v_new_badges := array_append(v_new_badges, 'first_tap');
  END IF;

  -- Check for streak badges
  IF v_current_streak >= 3 AND NOT 'streak_3' = ANY(v_badges) THEN
    v_new_badges := array_append(v_new_badges, 'streak_3');
  END IF;

  IF v_current_streak >= 7 AND NOT 'streak_7' = ANY(v_badges) THEN
    v_new_badges := array_append(v_new_badges, 'streak_7');
  END IF;

  IF v_current_streak >= 30 AND NOT 'streak_30' = ANY(v_badges) THEN
    v_new_badges := array_append(v_new_badges, 'streak_30');
  END IF;

  -- Check for helpful badge
  IF v_impact_count >= 100 AND NOT 'helpful_100' = ANY(v_badges) THEN
    v_new_badges := array_append(v_new_badges, 'helpful_100');
  END IF;

  -- Check for top tapper badge (50+ taps)
  IF v_total_taps >= 50 AND NOT 'top_tapper' = ANY(v_badges) THEN
    v_new_badges := array_append(v_new_badges, 'top_tapper');
  END IF;

  -- Update badges if new ones earned
  IF array_length(v_new_badges, 1) > 0 THEN
    UPDATE user_gamification
    SET badges = badges || v_new_badges,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN v_new_badges;
END;
$$;


--
-- Name: check_medal_eligibility(uuid, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_medal_eligibility(p_place_id uuid, p_score numeric, p_volume numeric) RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_first_review_date timestamptz;
  v_days_since_first int;
  v_recent_score_30d numeric;
  v_recent_score_90d numeric;
  v_top_recurring_negative_share numeric;
BEGIN
  -- Get first review date
  SELECT MIN(created_at) INTO v_first_review_date
  FROM place_reviews
  WHERE place_id = p_place_id;
  
  IF v_first_review_date IS NULL THEN
    RETURN NULL; -- No reviews yet
  END IF;
  
  v_days_since_first := EXTRACT(EPOCH FROM (now() - v_first_review_date)) / 86400.0;
  
  -- Calculate recent scores for GOLD/PLATINUM
  -- (Simplified: would need to recalculate score for specific time windows)
  -- For now, use current score as proxy
  v_recent_score_30d := p_score;
  v_recent_score_90d := p_score;
  
  -- Check top recurring negative share (for BRONZE)
  -- TODO: Implement proper check
  v_top_recurring_negative_share := 0;
  
  -- ============================================================
  -- Medal eligibility checks (from specification)
  -- ============================================================
  
  -- PLATINUM: Most elite
  IF p_volume >= 250 
     AND p_score >= 94 
     AND v_days_since_first >= 180 
     AND v_recent_score_90d >= 92 THEN
    RETURN 'platinum';
  END IF;
  
  -- GOLD: Excellent
  IF p_volume >= 120 
     AND p_score >= 90 
     AND v_days_since_first >= 90 
     AND v_recent_score_30d >= 88 THEN
    RETURN 'gold';
  END IF;
  
  -- SILVER: Strong
  IF p_volume >= 60 
     AND p_score >= 84 
     AND v_days_since_first >= 30 THEN
    RETURN 'silver';
  END IF;
  
  -- BRONZE: Good
  IF p_volume >= 25 
     AND p_score >= 78 THEN
    RETURN 'bronze';
  END IF;
  
  -- No medal
  RETURN NULL;
END;
$$;


--
-- Name: FUNCTION check_medal_eligibility(p_place_id uuid, p_score numeric, p_volume numeric); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_medal_eligibility(p_place_id uuid, p_score numeric, p_volume numeric) IS 'Determines medal (bronze/silver/gold/platinum) based on score, volume, time consistency, and recurring negatives.';


--
-- Name: check_recurring_negative(uuid, uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_recurring_negative(p_place_id uuid, p_signal_id uuid, recurrence_window_days integer DEFAULT 120, recurrence_min_count integer DEFAULT 3) RETURNS numeric
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  recent_count int;
BEGIN
  -- Count how many reviews in last N days contain this negative signal
  SELECT COUNT(DISTINCT pr.id)
  INTO recent_count
  FROM place_reviews pr
  JOIN place_review_signal_taps prst ON pr.id = prst.review_id
  WHERE pr.place_id = p_place_id
    AND prst.signal_id = p_signal_id
    AND pr.created_at >= (now() - (recurrence_window_days || ' days')::interval);

  -- Return recurrence factor:
  -- If recurring (≥3 times): 1.3 (upweight)
  -- If not recurring: 0.6 (downweight)
  IF recent_count >= recurrence_min_count THEN
    RETURN 1.3;
  ELSE
    RETURN 0.6;
  END IF;
END;
$$;


--
-- Name: FUNCTION check_recurring_negative(p_place_id uuid, p_signal_id uuid, recurrence_window_days integer, recurrence_min_count integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.check_recurring_negative(p_place_id uuid, p_signal_id uuid, recurrence_window_days integer, recurrence_min_count integer) IS 'Returns 1.3 if negative signal appears ≥3 times in last 120 days (recurring), otherwise 0.6 (one-off).';


--
-- Name: enforce_max_secondary_categories(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_max_secondary_categories() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  category_count int;
BEGIN
  SELECT COUNT(*) INTO category_count
  FROM place_secondary_categories
  WHERE place_id = NEW.place_id;
  
  IF category_count >= 2 THEN
    RAISE EXCEPTION 'A place can have at most 2 secondary categories';
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: get_admin_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_admin_stats() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'pending_edits', (
      SELECT COUNT(*) FROM edit_suggestions WHERE status = 'pending'
    ),
    'pending_claims', (
      SELECT COUNT(*) FROM place_claims WHERE status = 'pending'
    ),
    'approved_edits_today', (
      SELECT COUNT(*) FROM edit_suggestions 
      WHERE status = 'approved' AND reviewed_at::DATE = CURRENT_DATE
    ),
    'verified_claims_today', (
      SELECT COUNT(*) FROM place_claims 
      WHERE status = 'verified' AND reviewed_at::DATE = CURRENT_DATE
    ),
    'total_verified_places', (
      SELECT COUNT(DISTINCT place_id) FROM place_claims WHERE status = 'verified'
    ),
    'total_edits', (
      SELECT COUNT(*) FROM edit_suggestions
    ),
    'total_claims', (
      SELECT COUNT(*) FROM place_claims
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$;


--
-- Name: get_owner_dashboard(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_owner_dashboard(owner_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'claimed_places', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'place_id', p.id,
        'name', p.name,
        'address', p.address_line1,
        'city', p.city,
        'verified_at', pc.reviewed_at
      )), '[]'::jsonb)
      FROM places p
      INNER JOIN place_claims pc ON p.id = pc.place_id
      WHERE pc.user_id = owner_user_id AND pc.status = 'verified'
    ),
    'pending_claims', (
      SELECT COUNT(*) FROM place_claims 
      WHERE user_id = owner_user_id AND status = 'pending'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;


--
-- Name: get_place_card_signals(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_place_card_signals(p_place_id uuid) RETURNS TABLE(top_positive text, top_positive_count bigint, top_neutral text, top_neutral_count bigint, top_negative text, top_negative_count bigint)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
  v_positive RECORD;
  v_neutral RECORD;
  v_negative RECORD;
BEGIN
  -- Top 1 positive
  SELECT signal_name, tap_count INTO v_positive
  FROM get_top_signals_for_place(p_place_id, 'positive', 1)
  LIMIT 1;
  
  -- Top 1 neutral
  SELECT signal_name, tap_count INTO v_neutral
  FROM get_top_signals_for_place(p_place_id, 'neutral', 1)
  LIMIT 1;
  
  -- Top 1 negative
  SELECT signal_name, tap_count INTO v_negative
  FROM get_top_signals_for_place(p_place_id, 'negative', 1)
  LIMIT 1;
  
  RETURN QUERY SELECT 
    v_positive.signal_name,
    v_positive.tap_count,
    v_neutral.signal_name,
    v_neutral.tap_count,
    v_negative.signal_name,
    v_negative.tap_count;
END;
$$;


--
-- Name: get_place_tap_stats(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_place_tap_stats(p_place_id uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_today_count INTEGER;
  v_total_count INTEGER;
  v_last_tap TIMESTAMPTZ;
  v_last_tap_relative TEXT;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE),
    COUNT(*),
    MAX(created_at)
  INTO v_today_count, v_total_count, v_last_tap
  FROM tap_activity
  WHERE place_id = p_place_id;

  -- Calculate relative time
  IF v_last_tap IS NOT NULL THEN
    IF v_last_tap >= now() - INTERVAL '1 hour' THEN
      v_last_tap_relative := EXTRACT(MINUTE FROM (now() - v_last_tap))::INTEGER || ' min ago';
    ELSIF v_last_tap >= now() - INTERVAL '24 hours' THEN
      v_last_tap_relative := EXTRACT(HOUR FROM (now() - v_last_tap))::INTEGER || ' hours ago';
    ELSE
      v_last_tap_relative := EXTRACT(DAY FROM (now() - v_last_tap))::INTEGER || ' days ago';
    END IF;
  END IF;

  RETURN json_build_object(
    'today_tap_count', COALESCE(v_today_count, 0),
    'total_tap_count', COALESCE(v_total_count, 0),
    'last_tap_time', v_last_tap_relative
  );
END;
$$;


--
-- Name: get_review_items_for_place(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_review_items_for_place(place_uuid uuid) RETURNS TABLE(item_id uuid, slug text, label text, icon_emoji text, signal_type text, display_order integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ri.id,
    ri.slug,
    ri.label,
    ri.icon_emoji,
    ri.signal_type,
    cri.display_order
  FROM places p
  JOIN business_categories bc ON bc.id = p.category_id
  JOIN category_review_items cri ON cri.category_id = bc.id
  JOIN review_items ri ON ri.id = cri.review_item_id
  WHERE p.id = place_uuid
  ORDER BY ri.signal_type, cri.display_order;
END;
$$;


--
-- Name: get_signals_for_place(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_signals_for_place(place_uuid uuid) RETURNS TABLE(slug text, label text, icon_emoji text, signal_type text, review_count bigint, total_taps bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ri.slug,
    ri.label,
    ri.icon_emoji,
    ri.signal_type,
    COUNT(r.id) AS review_count,
    SUM(r.tap_count) AS total_taps
  FROM reviews r
  JOIN review_items ri ON ri.id = r.review_item_id
  WHERE r.place_id = place_uuid
  GROUP BY ri.id, ri.slug, ri.label, ri.icon_emoji, ri.signal_type
  HAVING COUNT(r.id) >= 3
  ORDER BY total_taps DESC;
END;
$$;


--
-- Name: get_tavvy_category_id(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_tavvy_category_id(fsq_category_label text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    level1_name TEXT;
    tavvy_slug TEXT;
    result_id UUID;
BEGIN
    -- Extract the first level from the category label (e.g., "Dining and Drinking > Restaurant > Italian" → "Dining and Drinking")
    level1_name := SPLIT_PART(fsq_category_label, ' > ', 1);
    
    -- Look up the TavvY slug from our mapping
    SELECT tavvy_primary_slug INTO tavvy_slug
    FROM fsq_to_tavvy_mapping
    WHERE fsq_level1_name = level1_name;
    
    -- If no mapping found, use 'other'
    IF tavvy_slug IS NULL THEN
        tavvy_slug := 'other';
    END IF;
    
    -- Get the TavvY category ID
    SELECT id INTO result_id
    FROM categories_primary
    WHERE slug = tavvy_slug;
    
    RETURN result_id;
END;
$$;


--
-- Name: get_top_signals_for_place(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_top_signals_for_place(p_place_id uuid, p_category text DEFAULT NULL::text, p_limit integer DEFAULT 5) RETURNS TABLE(signal_id uuid, signal_name text, signal_category text, tap_count bigint, unique_reviewers bigint)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    psa.signal_id,
    rs.name as signal_name,
    rs.category as signal_category,
    psa.tap_count,
    psa.unique_reviewers
  FROM place_signal_aggregates psa
  JOIN review_signals rs ON psa.signal_id = rs.id
  WHERE psa.place_id = p_place_id
    AND (p_category IS NULL OR rs.category = p_category)
  ORDER BY psa.tap_count DESC
  LIMIT p_limit;
END;
$$;


--
-- Name: get_user_gamification(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_gamification(p_user_id uuid) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_points', COALESCE(total_points, 0),
    'total_taps', COALESCE(total_taps, 0),
    'current_streak', COALESCE(current_streak, 0),
    'longest_streak', COALESCE(longest_streak, 0),
    'badges', COALESCE(badges, '{}'),
    'impact_count', COALESCE(impact_count, 0)
  )
  INTO v_result
  FROM user_gamification
  WHERE user_id = p_user_id;

  IF v_result IS NULL THEN
    RETURN json_build_object(
      'total_points', 0,
      'total_taps', 0,
      'current_streak', 0,
      'longest_streak', 0,
      'badges', '{}',
      'impact_count', 0
    );
  END IF;

  RETURN v_result;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;


--
-- Name: increment_impact_count(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.increment_impact_count(p_place_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Increment impact count for all users who tapped this place
  UPDATE user_gamification ug
  SET impact_count = impact_count + 1,
      updated_at = now()
  FROM (
    SELECT DISTINCT user_id
    FROM tap_activity
    WHERE place_id = p_place_id
    AND user_id IS NOT NULL
  ) ta
  WHERE ug.user_id = ta.user_id;
END;
$$;


--
-- Name: link_items_to_category(text, text[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.link_items_to_category(cat_slug text, item_slugs text[]) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  cat_id UUID;
  item_slug TEXT;
  item_id UUID;
  display_ord INT := 0;
BEGIN
  -- Get category ID
  SELECT id INTO cat_id FROM business_categories WHERE slug = cat_slug;
  
  -- Link each item
  FOREACH item_slug IN ARRAY item_slugs
  LOOP
    SELECT id INTO item_id FROM review_items WHERE slug = item_slug;
    IF item_id IS NOT NULL THEN
      INSERT INTO category_review_items (category_id, review_item_id, display_order)
      VALUES (cat_id, item_id, display_ord)
      ON CONFLICT (category_id, review_item_id) DO NOTHING;
      display_ord := display_ord + 1;
    END IF;
  END LOOP;
END;
$$;


--
-- Name: record_tap(uuid, uuid, text, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.record_tap(p_user_id uuid, p_place_id uuid, p_signal_id text, p_signal_name text, p_is_quick_tap boolean DEFAULT false) RETURNS json
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_new_badges TEXT[];
  v_points INTEGER;
  v_streak INTEGER;
BEGIN
  -- Record the tap activity
  INSERT INTO tap_activity (place_id, user_id, signal_id, signal_name, is_quick_tap)
  VALUES (p_place_id, p_user_id, p_signal_id, p_signal_name, p_is_quick_tap);

  -- Update user streak and points
  PERFORM update_user_streak(p_user_id);

  -- Check for new badges
  v_new_badges := check_and_award_badges(p_user_id);

  -- Get updated stats
  SELECT total_points, current_streak
  INTO v_points, v_streak
  FROM user_gamification
  WHERE user_id = p_user_id;

  -- Return result
  RETURN json_build_object(
    'success', true,
    'new_badges', v_new_badges,
    'total_points', v_points,
    'current_streak', v_streak
  );
END;
$$;


--
-- Name: reject_business_claim(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reject_business_claim(claim_id uuid, admin_id uuid, notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE place_claims 
  SET status = 'rejected', 
      reviewed_by = admin_id, 
      reviewed_at = NOW(), 
      review_notes = notes
  WHERE id = claim_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Claim not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Claim rejected'
  );
END;
$$;


--
-- Name: reject_edit_suggestion(uuid, uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.reject_edit_suggestion(suggestion_id uuid, admin_id uuid, notes text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  UPDATE edit_suggestions 
  SET status = 'rejected', 
      reviewed_by = admin_id, 
      reviewed_at = NOW(), 
      review_notes = notes
  WHERE id = suggestion_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Suggestion not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Edit rejected'
  );
END;
$$;


--
-- Name: search_edit_suggestions(text, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_edit_suggestions(search_status text DEFAULT NULL::text, search_place_id uuid DEFAULT NULL::uuid, limit_count integer DEFAULT 50) RETURNS TABLE(id uuid, place_id uuid, place_name text, user_id uuid, suggested_changes jsonb, reason text, status text, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.id,
    es.place_id,
    p.name AS place_name,
    es.user_id,
    es.suggested_changes,
    es.reason,
    es.status,
    es.created_at
  FROM edit_suggestions es
  INNER JOIN places p ON es.place_id = p.id
  WHERE 
    (search_status IS NULL OR es.status = search_status)
    AND (search_place_id IS NULL OR es.place_id = search_place_id)
  ORDER BY es.created_at DESC
  LIMIT limit_count;
END;
$$;


--
-- Name: search_places(double precision, double precision, integer, uuid, numeric, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_places(p_lat double precision, p_lng double precision, p_radius_meters integer DEFAULT 50000, p_primary_category_id uuid DEFAULT NULL::uuid, p_min_score numeric DEFAULT 0, p_limit integer DEFAULT 20) RETURNS TABLE(place_id uuid, name text, lat double precision, lng double precision, distance_meters integer, score_value numeric, primary_category_id uuid)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.lat,
    p.lng,
    ST_Distance(
      p.geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    )::int AS distance_meters,
    COALESCE(ps.score_value, 0) AS score_value,
    p.primary_category_id
  FROM places p
  LEFT JOIN place_scores ps ON ps.place_id = p.id
  WHERE 
    p.is_active = true 
    AND p.is_permanently_closed = false
    AND ST_DWithin(
      p.geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      p_radius_meters
    )
    AND (p_primary_category_id IS NULL OR p.primary_category_id = p_primary_category_id)
    AND COALESCE(ps.score_value, 0) >= p_min_score
  ORDER BY distance_meters ASC
  LIMIT p_limit;
END;
$$;


--
-- Name: update_article_reaction_counts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_article_reaction_counts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.reaction_type = 'love' THEN
            UPDATE public.atlas_articles SET love_count = love_count + 1 WHERE id = NEW.article_id;
        ELSIF NEW.reaction_type = 'not_for_me' THEN
            UPDATE public.atlas_articles SET not_for_me_count = not_for_me_count + 1 WHERE id = NEW.article_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.reaction_type = 'love' THEN
            UPDATE public.atlas_articles SET love_count = love_count - 1 WHERE id = OLD.article_id;
        ELSIF OLD.reaction_type = 'not_for_me' THEN
            UPDATE public.atlas_articles SET not_for_me_count = not_for_me_count - 1 WHERE id = OLD.article_id;
        END IF;
        IF NEW.reaction_type = 'love' THEN
            UPDATE public.atlas_articles SET love_count = love_count + 1 WHERE id = NEW.article_id;
        ELSIF NEW.reaction_type = 'not_for_me' THEN
            UPDATE public.atlas_articles SET not_for_me_count = not_for_me_count + 1 WHERE id = NEW.article_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.reaction_type = 'love' THEN
            UPDATE public.atlas_articles SET love_count = love_count - 1 WHERE id = OLD.article_id;
        ELSIF OLD.reaction_type = 'not_for_me' THEN
            UPDATE public.atlas_articles SET not_for_me_count = not_for_me_count - 1 WHERE id = OLD.article_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_article_save_counts(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_article_save_counts() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.atlas_articles SET save_count = save_count + 1 WHERE id = NEW.article_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.atlas_articles SET save_count = save_count - 1 WHERE id = OLD.article_id;
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: update_atlas_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_atlas_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- Name: update_place_geography(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_place_geography() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.geography = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$;


--
-- Name: update_place_search_vector(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_place_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.state_region, '')), 'C');
  RETURN NEW;
END;
$$;


--
-- Name: update_places_geography(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_places_geography() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.geography := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_user_streak(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_user_streak(p_user_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_last_tap_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  -- Get current values
  SELECT last_tap_date, current_streak, longest_streak
  INTO v_last_tap_date, v_current_streak, v_longest_streak
  FROM user_gamification
  WHERE user_id = p_user_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_gamification (user_id, current_streak, last_tap_date, total_taps, total_points)
    VALUES (p_user_id, 1, CURRENT_DATE, 1, 10);
    RETURN;
  END IF;

  -- Update streak logic
  IF v_last_tap_date = CURRENT_DATE THEN
    -- Already tapped today, just update points
    UPDATE user_gamification
    SET total_taps = total_taps + 1,
        total_points = total_points + 10,
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF v_last_tap_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day, increase streak
    UPDATE user_gamification
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_tap_date = CURRENT_DATE,
        total_taps = total_taps + 1,
        total_points = total_points + 10 + (LEAST(current_streak, 7) * 2), -- Bonus points for streak
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE user_gamification
    SET current_streak = 1,
        last_tap_date = CURRENT_DATE,
        total_taps = total_taps + 1,
        total_points = total_points + 10,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_leaf_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_leaf_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


--
-- Name: lock_top_prefixes(text[], text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.lock_top_prefixes(bucket_ids text[], names text[]) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


--
-- Name: objects_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: objects_update_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


--
-- Name: objects_update_level_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_level_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: prefixes_delete_cleanup(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_delete_cleanup() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: _backup_place_signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._backup_place_signals (
    id bigint,
    place_id uuid,
    signal_id uuid,
    count integer,
    intensity integer,
    bucket text,
    name text,
    signal_name text,
    label text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: _backup_signal_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._backup_signal_definitions (
    id uuid,
    name text,
    category text,
    emoji text,
    color text,
    place_types text[],
    display_order integer,
    created_at timestamp with time zone
);


--
-- Name: _backup_signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._backup_signals (
    id uuid,
    name text,
    category text,
    emoji text,
    color text,
    place_types text[],
    display_order integer,
    created_at timestamp with time zone
);


--
-- Name: admin_activity_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_activity_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id uuid NOT NULL,
    action_type text NOT NULL,
    target_id uuid NOT NULL,
    target_type text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT admin_activity_log_action_type_check CHECK ((action_type = ANY (ARRAY['approve_edit'::text, 'reject_edit'::text, 'approve_claim'::text, 'reject_claim'::text, 'bulk_approve'::text, 'bulk_reject'::text]))),
    CONSTRAINT admin_activity_log_target_type_check CHECK ((target_type = ANY (ARRAY['edit_suggestion'::text, 'place_claim'::text])))
);


--
-- Name: atlas_article_places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_article_places (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    place_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: atlas_article_reactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_article_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    user_id uuid NOT NULL,
    reaction_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT atlas_article_reactions_reaction_type_check CHECK ((reaction_type = ANY (ARRAY['love'::text, 'not_for_me'::text])))
);


--
-- Name: atlas_article_saves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_article_saves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    article_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: atlas_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_articles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text,
    content text NOT NULL,
    cover_image_url text,
    author_id uuid,
    author_name text,
    author_avatar_url text,
    category_id uuid,
    universe_id uuid,
    read_time_minutes integer,
    view_count integer DEFAULT 0,
    love_count integer DEFAULT 0,
    not_for_me_count integer DEFAULT 0,
    save_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    status text DEFAULT 'published'::text,
    seo_meta_description text,
    seo_keywords text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    CONSTRAINT atlas_articles_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: atlas_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    icon text,
    description text,
    color text,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: atlas_universe_places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_universe_places (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    universe_id uuid NOT NULL,
    place_id uuid NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: atlas_universes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atlas_universes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    location text,
    banner_image_url text,
    thumbnail_image_url text,
    category_id uuid,
    parent_universe_id uuid,
    place_count integer DEFAULT 0,
    article_count integer DEFAULT 0,
    sub_universe_count integer DEFAULT 0,
    total_signals integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    status text DEFAULT 'published'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    published_at timestamp with time zone,
    CONSTRAINT atlas_universes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])))
);


--
-- Name: business_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    icon_emoji text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: business_owners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_owners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    user_id uuid NOT NULL,
    verification_status text DEFAULT 'pending'::text,
    verification_method text NOT NULL,
    verification_code text,
    verification_confidence integer,
    verification_reason text,
    business_email text,
    business_phone text,
    created_at timestamp with time zone DEFAULT now(),
    verified_at timestamp with time zone
);


--
-- Name: categories_primary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories_primary (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    icon_key text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: categories_secondary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories_secondary (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    primary_id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    icon_key text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: category_review_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.category_review_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    review_item_id uuid NOT NULL,
    display_order integer DEFAULT 0 NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: content_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_flags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_type text NOT NULL,
    content_id uuid NOT NULL,
    flagged_by uuid,
    reason text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone
);


--
-- Name: edit_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.edit_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    user_id uuid NOT NULL,
    suggested_changes jsonb NOT NULL,
    reason text,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT edit_suggestions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    place_id uuid NOT NULL,
    list_name text DEFAULT 'Favorites'::text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: fsq_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fsq_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id text NOT NULL,
    category_level integer,
    category_name text NOT NULL,
    category_label text,
    level1_category_id text,
    level1_category_name text,
    level2_category_id text,
    level2_category_name text,
    level3_category_id text,
    level3_category_name text,
    level4_category_id text,
    level4_category_name text,
    level5_category_id text,
    level5_category_name text,
    level6_category_id text,
    level6_category_name text,
    tavvy_primary_category_id uuid,
    tavvy_secondary_category_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: fsq_to_tavvy_mapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fsq_to_tavvy_mapping (
    fsq_level1_name text NOT NULL,
    tavvy_primary_slug text NOT NULL
);


--
-- Name: legal_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legal_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    doc_type text NOT NULL,
    version text NOT NULL,
    url text NOT NULL,
    published_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    logo_url text,
    description text,
    website_url text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL
);


--
-- Name: moderation_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moderation_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_type text NOT NULL,
    item_id uuid NOT NULL,
    submitted_by uuid NOT NULL,
    content jsonb NOT NULL,
    status text DEFAULT 'pending'::text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: notification_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_queue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_user_id uuid NOT NULL,
    notification_type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    related_id uuid,
    sent boolean DEFAULT false NOT NULL,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT notification_queue_notification_type_check CHECK ((notification_type = ANY (ARRAY['edit_approved'::text, 'edit_rejected'::text, 'claim_verified'::text, 'claim_rejected'::text, 'new_edit_pending'::text, 'new_claim_pending'::text])))
);


--
-- Name: place_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_claims (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    user_id uuid NOT NULL,
    business_name text NOT NULL,
    contact_name text NOT NULL,
    contact_email text NOT NULL,
    contact_phone text,
    relationship text NOT NULL,
    verification_method text,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT place_claims_relationship_check CHECK ((relationship = ANY (ARRAY['owner'::text, 'manager'::text, 'employee'::text, 'other'::text]))),
    CONSTRAINT place_claims_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text]))),
    CONSTRAINT place_claims_verification_method_check CHECK ((verification_method = ANY (ARRAY['document'::text, 'email'::text, 'phone'::text, 'manual'::text])))
);


--
-- Name: places; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.places (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    slug text,
    primary_category_id uuid,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    geography public.geography(Point,4326),
    address_line1 text,
    address_line2 text,
    city text,
    state_region text,
    postal_code text,
    county text,
    country_code text DEFAULT 'US'::text NOT NULL,
    plus_code text,
    phone_e164 text,
    website_url text,
    email text,
    instagram_url text,
    facebook_url text,
    tiktok_url text,
    youtube_url text,
    established_year integer,
    price_level text,
    is_active boolean DEFAULT true NOT NULL,
    is_permanently_closed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    owner_user_id uuid,
    claimed_at timestamp with time zone,
    verification_status text DEFAULT 'unverified'::text NOT NULL,
    verified_at timestamp with time zone,
    verified_by_count integer DEFAULT 0 NOT NULL,
    search_vector tsvector,
    osm_id text,
    data_source text DEFAULT 'osm'::text,
    verified boolean DEFAULT false,
    owner_managed boolean DEFAULT false,
    updated_by uuid,
    last_updated_at timestamp with time zone DEFAULT now(),
    category_id uuid,
    category text,
    cover_image_url text,
    is_24_7 boolean DEFAULT false,
    current_status text DEFAULT 'unknown'::text,
    primary_category text,
    distance numeric(10,2),
    phone text,
    website text,
    state text,
    country text DEFAULT 'USA'::text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    features text[] DEFAULT '{}'::text[],
    avg_meal_cost text,
    closing_time text,
    total_sites integer,
    star_rating numeric,
    address_line_1 text,
    zip_code text,
    open_year_round boolean DEFAULT true,
    entrance_1_name text,
    entrance_1_latitude double precision,
    entrance_1_longitude double precision,
    entrance_1_is_primary boolean DEFAULT false,
    entrance_1_notes text,
    entrance_1_road text,
    entrance_1_max_rv_length_ft integer,
    entrance_1_max_rv_height_ft integer,
    entrance_1_road_type text,
    entrance_1_grade text,
    entrance_1_tight_turns boolean,
    entrance_1_low_clearance boolean,
    entrance_1_seasonal_access text,
    entrance_1_seasonal_notes text,
    entrance_2_name text,
    entrance_2_latitude double precision,
    entrance_2_longitude double precision,
    entrance_2_is_primary boolean DEFAULT false,
    entrance_2_notes text,
    entrance_3_name text,
    entrance_3_latitude double precision,
    entrance_3_longitude double precision,
    entrance_3_is_primary boolean DEFAULT false,
    entrance_3_notes text,
    entrance_4_name text,
    entrance_4_latitude double precision,
    entrance_4_longitude double precision,
    entrance_4_is_primary boolean DEFAULT false,
    entrance_4_notes text,
    insurance_provider text,
    license_number text,
    license_state text,
    certifications text[],
    established_date date,
    whatsapp_number text,
    socials jsonb DEFAULT '{}'::jsonb,
    logo_url text,
    profile_picture_url text,
    payment_methods text[],
    languages_spoken text[],
    content_type character varying(50) DEFAULT 'place'::character varying,
    custom_category character varying(255),
    fsq_place_id text,
    fsq_category_ids text[],
    fsq_category_labels text[],
    admin_region text,
    post_town text,
    po_box text,
    fsq_date_created date,
    fsq_date_refreshed date,
    fsq_date_closed date,
    twitter_handle text,
    fsq_unresolved_flags text[],
    fsq_placemaker_url text,
    bbox_xmin double precision,
    bbox_ymin double precision,
    bbox_xmax double precision,
    bbox_ymax double precision
);


--
-- Name: COLUMN places.insurance_provider; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.insurance_provider IS 'Name of the insurance provider for trust verification';


--
-- Name: COLUMN places.license_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.license_number IS 'Professional license number';


--
-- Name: COLUMN places.license_state; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.license_state IS 'State or jurisdiction where the license is valid';


--
-- Name: COLUMN places.certifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.certifications IS 'Array of professional certifications';


--
-- Name: COLUMN places.established_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.established_date IS 'Date when the business was established';


--
-- Name: COLUMN places.whatsapp_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.whatsapp_number IS 'WhatsApp contact number in E.164 format';


--
-- Name: COLUMN places.socials; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.socials IS 'JSON object containing social media URLs (instagram, facebook, tiktok, linkedin, x, etc.)';


--
-- Name: COLUMN places.logo_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.logo_url IS 'URL to the business logo image';


--
-- Name: COLUMN places.profile_picture_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.profile_picture_url IS 'URL to the business profile picture';


--
-- Name: COLUMN places.payment_methods; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.payment_methods IS 'Array of accepted payment methods';


--
-- Name: COLUMN places.languages_spoken; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.places.languages_spoken IS 'Array of languages spoken at the business';


--
-- Name: owner_places; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.owner_places AS
 SELECT p.id,
    p.name,
    p.description,
    p.slug,
    p.primary_category_id,
    p.lat,
    p.lng,
    p.address_line1,
    p.address_line2,
    p.city,
    p.state_region,
    p.postal_code,
    p.country_code,
    p.phone_e164,
    p.website_url,
    p.email,
    p.verified,
    p.owner_managed,
    p.owner_user_id,
    pc.id AS claim_id,
    pc.contact_name,
    pc.contact_email,
    pc.contact_phone,
    pc.reviewed_at AS ownership_verified_at
   FROM (public.places p
     JOIN public.place_claims pc ON ((p.id = pc.place_id)))
  WHERE (pc.status = 'verified'::text);


--
-- Name: photo_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    photo_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: photo_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    photo_id uuid,
    reporter_id uuid,
    reason text NOT NULL,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: place_checkins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_checkins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: place_entrances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_entrances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    label text DEFAULT 'Main Entrance'::text NOT NULL,
    lat double precision NOT NULL,
    lng double precision NOT NULL,
    geography public.geography(Point,4326),
    address_line1 text,
    city text,
    state_region text,
    postal_code text,
    country_code text,
    is_main boolean DEFAULT false NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: place_external_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_external_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    provider text NOT NULL,
    external_place_id text NOT NULL,
    external_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: place_external_rating_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_external_rating_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    provider text NOT NULL,
    rating_value numeric(3,2),
    rating_count integer,
    captured_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: place_hours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_hours (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    day_of_week smallint NOT NULL,
    open_time time without time zone,
    close_time time without time zone,
    is_closed boolean DEFAULT false NOT NULL,
    is_24h boolean DEFAULT false NOT NULL,
    note text,
    CONSTRAINT place_hours_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


--
-- Name: place_membership_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_membership_offers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    offer_type text NOT NULL,
    offer_details text,
    verified_by_count integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: place_owner_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_owner_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    owner_user_id uuid NOT NULL,
    label text NOT NULL,
    title text,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    never_expires boolean DEFAULT false NOT NULL,
    status text DEFAULT 'live'::text NOT NULL
);


--
-- Name: place_photos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    uploaded_by uuid,
    url text NOT NULL,
    thumbnail_url text,
    caption text,
    is_owner_photo boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'live'::text NOT NULL,
    flagged_count integer DEFAULT 0 NOT NULL,
    removed_reason text,
    removed_at timestamp with time zone,
    removed_by uuid,
    likes_count integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    is_flagged boolean DEFAULT false,
    flag_reason text,
    is_cover boolean DEFAULT false,
    user_id uuid
);


--
-- Name: place_review_signal_taps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_review_signal_taps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    place_id uuid NOT NULL,
    signal_id uuid NOT NULL,
    intensity smallint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT place_review_signal_taps_intensity_check CHECK (((intensity >= 1) AND (intensity <= 3)))
);


--
-- Name: place_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    private_note_owner text,
    public_note text,
    source text DEFAULT 'app'::text NOT NULL,
    status text DEFAULT 'live'::text NOT NULL
);


--
-- Name: place_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_scores (
    place_id uuid NOT NULL,
    score_value numeric(6,2) DEFAULT 0 NOT NULL,
    confidence numeric(5,2) DEFAULT 0 NOT NULL,
    total_positive_taps integer DEFAULT 0 NOT NULL,
    total_negative_taps integer DEFAULT 0 NOT NULL,
    total_neutral_taps integer DEFAULT 0 NOT NULL,
    total_reviews integer DEFAULT 0 NOT NULL,
    medal text,
    medal_awarded_at timestamp with time zone,
    google_rating_value numeric(3,2),
    google_rating_count integer,
    yelp_rating_value numeric(3,2),
    yelp_rating_count integer,
    last_computed_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT place_scores_medal_check CHECK ((medal = ANY (ARRAY['bronze'::text, 'silver'::text, 'gold'::text, 'platinum'::text])))
);


--
-- Name: place_secondary_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_secondary_categories (
    place_id uuid NOT NULL,
    secondary_id uuid NOT NULL,
    sort_order smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: place_signal_aggregates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_signal_aggregates (
    place_id uuid NOT NULL,
    signal_id uuid NOT NULL,
    bucket text NOT NULL,
    tap_total integer DEFAULT 0 NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    last_tap_at timestamp with time zone,
    CONSTRAINT place_signal_aggregates_bucket_check CHECK ((bucket = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text])))
);


--
-- Name: place_stories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    user_id uuid NOT NULL,
    media_url text NOT NULL,
    media_type text NOT NULL,
    caption text,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL,
    CONSTRAINT place_stories_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text])))
);


--
-- Name: tap_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tap_activity (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    user_id uuid,
    signal_id text NOT NULL,
    signal_name text NOT NULL,
    is_quick_tap boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: place_tap_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.place_tap_stats AS
 SELECT place_id,
    count(*) FILTER (WHERE (created_at >= CURRENT_DATE)) AS today_tap_count,
    count(*) AS total_tap_count,
    max(created_at) AS last_tap_time,
    count(DISTINCT user_id) AS unique_tappers
   FROM public.tap_activity
  GROUP BY place_id;


--
-- Name: place_warning_confirmations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_warning_confirmations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    warning_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_still_valid boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: place_warnings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.place_warnings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    warning_type_id uuid NOT NULL,
    reported_by uuid,
    note text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    confirmed_count integer DEFAULT 0 NOT NULL,
    removed_count integer DEFAULT 0 NOT NULL,
    last_confirmed_at timestamp with time zone
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    display_name text,
    avatar_url text,
    is_pro boolean DEFAULT false,
    trusted_contributor boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: review_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    label text NOT NULL,
    icon_emoji text,
    signal_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    color text,
    is_universal boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    CONSTRAINT review_items_signal_type_check CHECK ((signal_type = ANY (ARRAY['best_for'::text, 'vibe'::text, 'heads_up'::text])))
);


--
-- Name: review_signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.review_signals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    signal_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    intensity smallint DEFAULT 1,
    CONSTRAINT review_signals_intensity_check CHECK (((intensity >= 1) AND (intensity <= 3)))
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: search_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    query text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    place_id uuid NOT NULL,
    list_name text DEFAULT 'Favorites'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_favorites_with_details; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_favorites_with_details AS
 SELECT uf.id AS favorite_id,
    uf.user_id,
    uf.created_at AS favorited_at,
    p.id,
    p.name,
    p.description,
    p.slug,
    p.primary_category_id,
    p.lat,
    p.lng,
    p.geography,
    p.address_line1,
    p.address_line2,
    p.city,
    p.state_region,
    p.postal_code,
    p.county,
    p.country_code,
    p.plus_code,
    p.phone_e164,
    p.website_url,
    p.email,
    p.instagram_url,
    p.facebook_url,
    p.tiktok_url,
    p.youtube_url,
    p.established_year,
    p.price_level,
    p.is_active,
    p.is_permanently_closed,
    p.created_at,
    p.updated_at,
    p.created_by,
    p.owner_user_id,
    p.claimed_at,
    p.verification_status,
    p.verified_at,
    p.verified_by_count,
    p.search_vector,
    p.osm_id,
    p.data_source,
    p.verified,
    p.owner_managed,
    p.updated_by,
    p.last_updated_at,
    p.category_id,
    p.category,
    p.cover_image_url,
    p.is_24_7,
    p.current_status,
    p.primary_category,
    p.distance,
    p.phone,
    p.website,
    p.state,
    p.country,
    p.latitude,
    p.longitude,
    p.features,
    p.avg_meal_cost,
    p.closing_time,
    p.total_sites,
    p.star_rating,
    p.address_line_1,
    p.zip_code,
    p.open_year_round,
    p.entrance_1_name,
    p.entrance_1_latitude,
    p.entrance_1_longitude,
    p.entrance_1_is_primary,
    p.entrance_1_notes,
    p.entrance_1_road,
    p.entrance_1_max_rv_length_ft,
    p.entrance_1_max_rv_height_ft,
    p.entrance_1_road_type,
    p.entrance_1_grade,
    p.entrance_1_tight_turns,
    p.entrance_1_low_clearance,
    p.entrance_1_seasonal_access,
    p.entrance_1_seasonal_notes,
    p.entrance_2_name,
    p.entrance_2_latitude,
    p.entrance_2_longitude,
    p.entrance_2_is_primary,
    p.entrance_2_notes,
    p.entrance_3_name,
    p.entrance_3_latitude,
    p.entrance_3_longitude,
    p.entrance_3_is_primary,
    p.entrance_3_notes,
    p.entrance_4_name,
    p.entrance_4_latitude,
    p.entrance_4_longitude,
    p.entrance_4_is_primary,
    p.entrance_4_notes
   FROM (public.user_favorites uf
     JOIN public.places p ON ((uf.place_id = p.id)));


--
-- Name: user_gamification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_gamification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    total_points integer DEFAULT 0,
    total_taps integer DEFAULT 0,
    current_streak integer DEFAULT 0,
    longest_streak integer DEFAULT 0,
    last_tap_date date,
    badges text[] DEFAULT '{}'::text[],
    impact_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_legal_acceptances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_legal_acceptances (
    user_id uuid NOT NULL,
    legal_doc_id uuid NOT NULL,
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    ip_address inet,
    user_agent text
);


--
-- Name: user_memberships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_memberships (
    user_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id uuid NOT NULL,
    approved_edits integer DEFAULT 0,
    rejected_edits integer DEFAULT 0,
    review_count integer DEFAULT 0,
    reports_against integer DEFAULT 0,
    role text DEFAULT 'user'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_saved_places; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_saved_places AS
 SELECT uf.id AS saved_id,
    uf.user_id,
    uf.created_at AS saved_at,
    p.id,
    p.name,
    p.description,
    p.slug,
    p.primary_category_id,
    p.lat,
    p.lng,
    p.geography,
    p.address_line1,
    p.address_line2,
    p.city,
    p.state_region,
    p.postal_code,
    p.county,
    p.country_code,
    p.plus_code,
    p.phone_e164,
    p.website_url,
    p.email,
    p.instagram_url,
    p.facebook_url,
    p.tiktok_url,
    p.youtube_url,
    p.established_year,
    p.price_level,
    p.is_active,
    p.is_permanently_closed,
    p.created_at,
    p.updated_at,
    p.created_by,
    p.owner_user_id,
    p.claimed_at,
    p.verification_status,
    p.verified_at,
    p.verified_by_count,
    p.search_vector,
    p.osm_id,
    p.data_source,
    p.verified,
    p.owner_managed,
    p.updated_by,
    p.last_updated_at,
    p.category_id,
    p.category,
    p.cover_image_url,
    p.is_24_7,
    p.current_status,
    p.primary_category,
    p.distance,
    p.phone,
    p.website,
    p.state,
    p.country,
    p.latitude,
    p.longitude,
    p.features,
    p.avg_meal_cost,
    p.closing_time,
    p.total_sites,
    p.star_rating,
    p.address_line_1,
    p.zip_code,
    p.open_year_round,
    p.entrance_1_name,
    p.entrance_1_latitude,
    p.entrance_1_longitude,
    p.entrance_1_is_primary,
    p.entrance_1_notes,
    p.entrance_1_road,
    p.entrance_1_max_rv_length_ft,
    p.entrance_1_max_rv_height_ft,
    p.entrance_1_road_type,
    p.entrance_1_grade,
    p.entrance_1_tight_turns,
    p.entrance_1_low_clearance,
    p.entrance_1_seasonal_access,
    p.entrance_1_seasonal_notes,
    p.entrance_2_name,
    p.entrance_2_latitude,
    p.entrance_2_longitude,
    p.entrance_2_is_primary,
    p.entrance_2_notes,
    p.entrance_3_name,
    p.entrance_3_latitude,
    p.entrance_3_longitude,
    p.entrance_3_is_primary,
    p.entrance_3_notes,
    p.entrance_4_name,
    p.entrance_4_latitude,
    p.entrance_4_longitude,
    p.entrance_4_is_primary,
    p.entrance_4_notes
   FROM (public.user_favorites uf
     JOIN public.places p ON ((uf.place_id = p.id)));


--
-- Name: user_verification_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_verification_status (
    user_id uuid NOT NULL,
    review_count integer DEFAULT 0 NOT NULL,
    phone_verified boolean DEFAULT false NOT NULL,
    phone_verified_at timestamp with time zone,
    last_review_at timestamp with time zone,
    daily_review_count integer DEFAULT 0 NOT NULL,
    daily_count_reset_at date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE user_verification_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_verification_status IS 'Tracks review count and phone verification status for anti-spam protection.';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    phone_e164 text,
    password_hash text,
    oauth_provider text,
    oauth_subject text,
    is_phone_verified boolean DEFAULT false NOT NULL,
    is_email_verified boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_login_at timestamp with time zone,
    CONSTRAINT email_or_phone_required CHECK (((email IS NOT NULL) OR (phone_e164 IS NOT NULL)))
);


--
-- Name: verification_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    place_id uuid NOT NULL,
    user_id uuid NOT NULL,
    contact_method text NOT NULL,
    contact_value text NOT NULL,
    status text DEFAULT 'pending'::text,
    confidence integer,
    attempted_at timestamp with time zone DEFAULT now()
);


--
-- Name: verification_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    claim_id uuid NOT NULL,
    document_type text NOT NULL,
    file_url text NOT NULL,
    file_name text NOT NULL,
    file_size integer,
    mime_type text,
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT verification_documents_document_type_check CHECK ((document_type = ANY (ARRAY['business_license'::text, 'utility_bill'::text, 'tax_document'::text, 'other'::text])))
);


--
-- Name: warning_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warning_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug text NOT NULL,
    label text NOT NULL,
    icon_key text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: -
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: admin_activity_log admin_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_log
    ADD CONSTRAINT admin_activity_log_pkey PRIMARY KEY (id);


--
-- Name: atlas_article_places atlas_article_places_article_id_place_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_places
    ADD CONSTRAINT atlas_article_places_article_id_place_id_key UNIQUE (article_id, place_id);


--
-- Name: atlas_article_places atlas_article_places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_places
    ADD CONSTRAINT atlas_article_places_pkey PRIMARY KEY (id);


--
-- Name: atlas_article_reactions atlas_article_reactions_article_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_reactions
    ADD CONSTRAINT atlas_article_reactions_article_id_user_id_key UNIQUE (article_id, user_id);


--
-- Name: atlas_article_reactions atlas_article_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_reactions
    ADD CONSTRAINT atlas_article_reactions_pkey PRIMARY KEY (id);


--
-- Name: atlas_article_saves atlas_article_saves_article_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_saves
    ADD CONSTRAINT atlas_article_saves_article_id_user_id_key UNIQUE (article_id, user_id);


--
-- Name: atlas_article_saves atlas_article_saves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_saves
    ADD CONSTRAINT atlas_article_saves_pkey PRIMARY KEY (id);


--
-- Name: atlas_articles atlas_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_articles
    ADD CONSTRAINT atlas_articles_pkey PRIMARY KEY (id);


--
-- Name: atlas_articles atlas_articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_articles
    ADD CONSTRAINT atlas_articles_slug_key UNIQUE (slug);


--
-- Name: atlas_categories atlas_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_categories
    ADD CONSTRAINT atlas_categories_name_key UNIQUE (name);


--
-- Name: atlas_categories atlas_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_categories
    ADD CONSTRAINT atlas_categories_pkey PRIMARY KEY (id);


--
-- Name: atlas_categories atlas_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_categories
    ADD CONSTRAINT atlas_categories_slug_key UNIQUE (slug);


--
-- Name: atlas_universe_places atlas_universe_places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_universe_places
    ADD CONSTRAINT atlas_universe_places_pkey PRIMARY KEY (id);


--
-- Name: atlas_universe_places atlas_universe_places_universe_id_place_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_universe_places
    ADD CONSTRAINT atlas_universe_places_universe_id_place_id_key UNIQUE (universe_id, place_id);


--
-- Name: atlas_universes atlas_universes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_universes
    ADD CONSTRAINT atlas_universes_pkey PRIMARY KEY (id);


--
-- Name: atlas_universes atlas_universes_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_universes
    ADD CONSTRAINT atlas_universes_slug_key UNIQUE (slug);


--
-- Name: business_categories business_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_categories
    ADD CONSTRAINT business_categories_pkey PRIMARY KEY (id);


--
-- Name: business_categories business_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_categories
    ADD CONSTRAINT business_categories_slug_key UNIQUE (slug);


--
-- Name: business_owners business_owners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_owners
    ADD CONSTRAINT business_owners_pkey PRIMARY KEY (id);


--
-- Name: categories_primary categories_primary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_primary
    ADD CONSTRAINT categories_primary_pkey PRIMARY KEY (id);


--
-- Name: categories_primary categories_primary_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_primary
    ADD CONSTRAINT categories_primary_slug_key UNIQUE (slug);


--
-- Name: categories_secondary categories_secondary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_secondary
    ADD CONSTRAINT categories_secondary_pkey PRIMARY KEY (id);


--
-- Name: categories_secondary categories_secondary_primary_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_secondary
    ADD CONSTRAINT categories_secondary_primary_id_slug_key UNIQUE (primary_id, slug);


--
-- Name: category_review_items category_review_items_category_id_review_item_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_review_items
    ADD CONSTRAINT category_review_items_category_id_review_item_id_key UNIQUE (category_id, review_item_id);


--
-- Name: category_review_items category_review_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_review_items
    ADD CONSTRAINT category_review_items_pkey PRIMARY KEY (id);


--
-- Name: content_flags content_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_flags
    ADD CONSTRAINT content_flags_pkey PRIMARY KEY (id);


--
-- Name: edit_suggestions edit_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edit_suggestions
    ADD CONSTRAINT edit_suggestions_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_user_id_place_id_list_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_place_id_list_name_key UNIQUE (user_id, place_id, list_name);


--
-- Name: fsq_categories fsq_categories_category_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fsq_categories
    ADD CONSTRAINT fsq_categories_category_id_key UNIQUE (category_id);


--
-- Name: fsq_categories fsq_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fsq_categories
    ADD CONSTRAINT fsq_categories_pkey PRIMARY KEY (id);


--
-- Name: fsq_to_tavvy_mapping fsq_to_tavvy_mapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fsq_to_tavvy_mapping
    ADD CONSTRAINT fsq_to_tavvy_mapping_pkey PRIMARY KEY (fsq_level1_name);


--
-- Name: legal_documents legal_documents_doc_type_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_doc_type_version_key UNIQUE (doc_type, version);


--
-- Name: legal_documents legal_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legal_documents
    ADD CONSTRAINT legal_documents_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_slug_key UNIQUE (slug);


--
-- Name: moderation_queue moderation_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moderation_queue
    ADD CONSTRAINT moderation_queue_pkey PRIMARY KEY (id);


--
-- Name: notification_queue notification_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_pkey PRIMARY KEY (id);


--
-- Name: photo_likes photo_likes_photo_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_likes
    ADD CONSTRAINT photo_likes_photo_id_user_id_key UNIQUE (photo_id, user_id);


--
-- Name: photo_likes photo_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_likes
    ADD CONSTRAINT photo_likes_pkey PRIMARY KEY (id);


--
-- Name: photo_reports photo_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_reports
    ADD CONSTRAINT photo_reports_pkey PRIMARY KEY (id);


--
-- Name: place_checkins place_checkins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_checkins
    ADD CONSTRAINT place_checkins_pkey PRIMARY KEY (id);


--
-- Name: place_claims place_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_claims
    ADD CONSTRAINT place_claims_pkey PRIMARY KEY (id);


--
-- Name: place_entrances place_entrances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_entrances
    ADD CONSTRAINT place_entrances_pkey PRIMARY KEY (id);


--
-- Name: place_external_profiles place_external_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_external_profiles
    ADD CONSTRAINT place_external_profiles_pkey PRIMARY KEY (id);


--
-- Name: place_external_profiles place_external_profiles_place_id_provider_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_external_profiles
    ADD CONSTRAINT place_external_profiles_place_id_provider_key UNIQUE (place_id, provider);


--
-- Name: place_external_profiles place_external_profiles_provider_external_place_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_external_profiles
    ADD CONSTRAINT place_external_profiles_provider_external_place_id_key UNIQUE (provider, external_place_id);


--
-- Name: place_external_rating_snapshots place_external_rating_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_external_rating_snapshots
    ADD CONSTRAINT place_external_rating_snapshots_pkey PRIMARY KEY (id);


--
-- Name: place_hours place_hours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_hours
    ADD CONSTRAINT place_hours_pkey PRIMARY KEY (id);


--
-- Name: place_hours place_hours_place_id_day_of_week_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_hours
    ADD CONSTRAINT place_hours_place_id_day_of_week_key UNIQUE (place_id, day_of_week);


--
-- Name: place_membership_offers place_membership_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_membership_offers
    ADD CONSTRAINT place_membership_offers_pkey PRIMARY KEY (id);


--
-- Name: place_membership_offers place_membership_offers_place_id_membership_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_membership_offers
    ADD CONSTRAINT place_membership_offers_place_id_membership_id_key UNIQUE (place_id, membership_id);


--
-- Name: place_owner_posts place_owner_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_owner_posts
    ADD CONSTRAINT place_owner_posts_pkey PRIMARY KEY (id);


--
-- Name: place_photos place_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_photos
    ADD CONSTRAINT place_photos_pkey PRIMARY KEY (id);


--
-- Name: place_review_signal_taps place_review_signal_taps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_review_signal_taps
    ADD CONSTRAINT place_review_signal_taps_pkey PRIMARY KEY (id);


--
-- Name: place_review_signal_taps place_review_signal_taps_review_id_signal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_review_signal_taps
    ADD CONSTRAINT place_review_signal_taps_review_id_signal_id_key UNIQUE (review_id, signal_id);


--
-- Name: place_reviews place_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_reviews
    ADD CONSTRAINT place_reviews_pkey PRIMARY KEY (id);


--
-- Name: place_scores place_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_scores
    ADD CONSTRAINT place_scores_pkey PRIMARY KEY (place_id);


--
-- Name: place_secondary_categories place_secondary_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_secondary_categories
    ADD CONSTRAINT place_secondary_categories_pkey PRIMARY KEY (place_id, secondary_id);


--
-- Name: place_signal_aggregates place_signal_aggregates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_signal_aggregates
    ADD CONSTRAINT place_signal_aggregates_pkey PRIMARY KEY (place_id, signal_id);


--
-- Name: place_stories place_stories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_stories
    ADD CONSTRAINT place_stories_pkey PRIMARY KEY (id);


--
-- Name: place_warning_confirmations place_warning_confirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_warning_confirmations
    ADD CONSTRAINT place_warning_confirmations_pkey PRIMARY KEY (id);


--
-- Name: place_warning_confirmations place_warning_confirmations_warning_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_warning_confirmations
    ADD CONSTRAINT place_warning_confirmations_warning_id_user_id_key UNIQUE (warning_id, user_id);


--
-- Name: place_warnings place_warnings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_warnings
    ADD CONSTRAINT place_warnings_pkey PRIMARY KEY (id);


--
-- Name: places places_fsq_place_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_fsq_place_id_key UNIQUE (fsq_place_id);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- Name: places places_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_slug_key UNIQUE (slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);


--
-- Name: review_items review_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_items
    ADD CONSTRAINT review_items_pkey PRIMARY KEY (id);


--
-- Name: review_items review_items_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_items
    ADD CONSTRAINT review_items_slug_key UNIQUE (slug);


--
-- Name: review_signals review_signals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_signals
    ADD CONSTRAINT review_signals_pkey PRIMARY KEY (id);


--
-- Name: review_signals review_signals_review_id_signal_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_signals
    ADD CONSTRAINT review_signals_review_id_signal_id_key UNIQUE (review_id, signal_id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_place_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_place_id_user_id_key UNIQUE (place_id, user_id);


--
-- Name: search_history search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_pkey PRIMARY KEY (id);


--
-- Name: tap_activity tap_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tap_activity
    ADD CONSTRAINT tap_activity_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_user_id_place_id_list_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_place_id_list_name_key UNIQUE (user_id, place_id, list_name);


--
-- Name: user_gamification user_gamification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gamification
    ADD CONSTRAINT user_gamification_pkey PRIMARY KEY (id);


--
-- Name: user_gamification user_gamification_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gamification
    ADD CONSTRAINT user_gamification_user_id_key UNIQUE (user_id);


--
-- Name: user_legal_acceptances user_legal_acceptances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_legal_acceptances
    ADD CONSTRAINT user_legal_acceptances_pkey PRIMARY KEY (user_id, legal_doc_id);


--
-- Name: user_memberships user_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_memberships
    ADD CONSTRAINT user_memberships_pkey PRIMARY KEY (user_id, membership_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_verification_status user_verification_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_verification_status
    ADD CONSTRAINT user_verification_status_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_e164_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_e164_key UNIQUE (phone_e164);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_attempts verification_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_attempts
    ADD CONSTRAINT verification_attempts_pkey PRIMARY KEY (id);


--
-- Name: verification_documents verification_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_documents
    ADD CONSTRAINT verification_documents_pkey PRIMARY KEY (id);


--
-- Name: warning_types warning_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warning_types
    ADD CONSTRAINT warning_types_pkey PRIMARY KEY (id);


--
-- Name: warning_types warning_types_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warning_types
    ADD CONSTRAINT warning_types_slug_key UNIQUE (slug);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: -
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: categories_primary_sort_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_primary_sort_idx ON public.categories_primary USING btree (sort_order, name);


--
-- Name: categories_secondary_primary_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_secondary_primary_idx ON public.categories_secondary USING btree (primary_id, sort_order);


--
-- Name: content_flags_content_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_flags_content_idx ON public.content_flags USING btree (content_type, content_id);


--
-- Name: content_flags_flagged_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_flags_flagged_by_idx ON public.content_flags USING btree (flagged_by) WHERE (flagged_by IS NOT NULL);


--
-- Name: content_flags_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX content_flags_status_idx ON public.content_flags USING btree (status, created_at DESC);


--
-- Name: external_rating_snapshots_place_provider_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX external_rating_snapshots_place_provider_idx ON public.place_external_rating_snapshots USING btree (place_id, provider, captured_at DESC);


--
-- Name: idx_admin_activity_log_action_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_activity_log_action_type ON public.admin_activity_log USING btree (action_type);


--
-- Name: idx_admin_activity_log_admin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_activity_log_admin_id ON public.admin_activity_log USING btree (admin_id);


--
-- Name: idx_admin_activity_log_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_activity_log_created_at ON public.admin_activity_log USING btree (created_at DESC);


--
-- Name: idx_atlas_article_reactions_article; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_article_reactions_article ON public.atlas_article_reactions USING btree (article_id);


--
-- Name: idx_atlas_article_reactions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_article_reactions_user ON public.atlas_article_reactions USING btree (user_id);


--
-- Name: idx_atlas_article_saves_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_article_saves_user ON public.atlas_article_saves USING btree (user_id);


--
-- Name: idx_atlas_articles_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_articles_category ON public.atlas_articles USING btree (category_id);


--
-- Name: idx_atlas_articles_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_articles_featured ON public.atlas_articles USING btree (is_featured) WHERE (is_featured = true);


--
-- Name: idx_atlas_articles_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_articles_published_at ON public.atlas_articles USING btree (published_at DESC);


--
-- Name: idx_atlas_articles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_articles_status ON public.atlas_articles USING btree (status);


--
-- Name: idx_atlas_articles_universe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_articles_universe ON public.atlas_articles USING btree (universe_id);


--
-- Name: idx_atlas_universes_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_universes_category ON public.atlas_universes USING btree (category_id);


--
-- Name: idx_atlas_universes_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_universes_parent ON public.atlas_universes USING btree (parent_universe_id);


--
-- Name: idx_atlas_universes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_atlas_universes_status ON public.atlas_universes USING btree (status);


--
-- Name: idx_business_owners_place; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_owners_place ON public.business_owners USING btree (place_id);


--
-- Name: idx_business_owners_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_owners_status ON public.business_owners USING btree (verification_status);


--
-- Name: idx_business_owners_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_business_owners_user ON public.business_owners USING btree (user_id);


--
-- Name: idx_categories_primary_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_primary_slug ON public.categories_primary USING btree (slug);


--
-- Name: idx_categories_primary_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_primary_sort ON public.categories_primary USING btree (sort_order);


--
-- Name: idx_categories_secondary_primary; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_secondary_primary ON public.categories_secondary USING btree (primary_id);


--
-- Name: idx_categories_secondary_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_secondary_slug ON public.categories_secondary USING btree (slug);


--
-- Name: idx_categories_secondary_sort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_secondary_sort ON public.categories_secondary USING btree (sort_order);


--
-- Name: idx_edit_suggestions_place_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edit_suggestions_place_id ON public.edit_suggestions USING btree (place_id);


--
-- Name: idx_edit_suggestions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edit_suggestions_status ON public.edit_suggestions USING btree (status);


--
-- Name: idx_edit_suggestions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_edit_suggestions_user_id ON public.edit_suggestions USING btree (user_id);


--
-- Name: idx_favorites_list_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_list_name ON public.favorites USING btree (list_name);


--
-- Name: idx_favorites_place_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_place_id ON public.favorites USING btree (place_id);


--
-- Name: idx_favorites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_user_id ON public.favorites USING btree (user_id);


--
-- Name: idx_fsq_categories_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fsq_categories_category_id ON public.fsq_categories USING btree (category_id);


--
-- Name: idx_fsq_categories_level1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fsq_categories_level1 ON public.fsq_categories USING btree (level1_category_id);


--
-- Name: idx_moderation_queue_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moderation_queue_created_at ON public.moderation_queue USING btree (created_at DESC);


--
-- Name: idx_moderation_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moderation_queue_status ON public.moderation_queue USING btree (status);


--
-- Name: idx_moderation_queue_submitted_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moderation_queue_submitted_by ON public.moderation_queue USING btree (submitted_by);


--
-- Name: idx_moderation_queue_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moderation_queue_type ON public.moderation_queue USING btree (item_type);


--
-- Name: idx_notification_queue_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_queue_created_at ON public.notification_queue USING btree (created_at DESC);


--
-- Name: idx_notification_queue_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_queue_sent ON public.notification_queue USING btree (sent);


--
-- Name: idx_notification_queue_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_queue_user_id ON public.notification_queue USING btree (recipient_user_id);


--
-- Name: idx_one_verified_claim_per_place; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_one_verified_claim_per_place ON public.place_claims USING btree (place_id) WHERE (status = 'verified'::text);


--
-- Name: idx_place_checkins_place_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_checkins_place_id ON public.place_checkins USING btree (place_id);


--
-- Name: idx_place_checkins_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_checkins_user_id ON public.place_checkins USING btree (user_id);


--
-- Name: idx_place_claims_place_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_claims_place_id ON public.place_claims USING btree (place_id);


--
-- Name: idx_place_claims_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_claims_status ON public.place_claims USING btree (status);


--
-- Name: idx_place_claims_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_claims_user_id ON public.place_claims USING btree (user_id);


--
-- Name: idx_place_reviews_place; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_reviews_place ON public.place_reviews USING btree (place_id);


--
-- Name: idx_place_reviews_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_reviews_user ON public.place_reviews USING btree (user_id);


--
-- Name: idx_place_stories_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_stories_expires_at ON public.place_stories USING btree (expires_at);


--
-- Name: idx_place_stories_place_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_place_stories_place_id ON public.place_stories USING btree (place_id);


--
-- Name: idx_places_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_active ON public.places USING btree (is_active);


--
-- Name: idx_places_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_category ON public.places USING btree (category);


--
-- Name: idx_places_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_category_id ON public.places USING btree (category_id);


--
-- Name: idx_places_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_city ON public.places USING btree (city);


--
-- Name: idx_places_country_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_country_code ON public.places USING btree (country_code);


--
-- Name: idx_places_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_created_by ON public.places USING btree (created_by);


--
-- Name: idx_places_data_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_data_source ON public.places USING btree (data_source);


--
-- Name: idx_places_fsq_category_ids; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_fsq_category_ids ON public.places USING gin (fsq_category_ids);


--
-- Name: idx_places_fsq_place_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_fsq_place_id ON public.places USING btree (fsq_place_id);


--
-- Name: idx_places_geography; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_geography ON public.places USING gist (geography);


--
-- Name: idx_places_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_is_active ON public.places USING btree (is_active);


--
-- Name: idx_places_lat_lng; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_lat_lng ON public.places USING btree (lat, lng);


--
-- Name: idx_places_lng; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_lng ON public.places USING btree (lng);


--
-- Name: idx_places_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_location ON public.places USING btree (latitude, longitude);


--
-- Name: idx_places_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_name ON public.places USING btree (name);


--
-- Name: idx_places_osm_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_osm_id ON public.places USING btree (osm_id);


--
-- Name: idx_places_owner_managed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_owner_managed ON public.places USING btree (owner_managed);


--
-- Name: idx_places_postal_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_postal_code ON public.places USING btree (postal_code);


--
-- Name: idx_places_primary_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_primary_category_id ON public.places USING btree (primary_category_id);


--
-- Name: idx_places_state_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_state_region ON public.places USING btree (state_region);


--
-- Name: idx_places_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_places_verified ON public.places USING btree (verified);


--
-- Name: idx_review_signals_review_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_review_signals_review_id ON public.review_signals USING btree (review_id);


--
-- Name: idx_reviews_place_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_place_id ON public.reviews USING btree (place_id);


--
-- Name: idx_search_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_history_created_at ON public.search_history USING btree (created_at DESC);


--
-- Name: idx_search_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_history_user_id ON public.search_history USING btree (user_id);


--
-- Name: idx_tap_activity_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tap_activity_created_at ON public.tap_activity USING btree (created_at);


--
-- Name: idx_tap_activity_place_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tap_activity_place_id ON public.tap_activity USING btree (place_id);


--
-- Name: idx_tap_activity_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tap_activity_user_id ON public.tap_activity USING btree (user_id);


--
-- Name: idx_user_gamification_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_gamification_user_id ON public.user_gamification USING btree (user_id);


--
-- Name: idx_user_profiles_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_profiles_role ON public.user_profiles USING btree (role);


--
-- Name: idx_verification_attempts_place; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_attempts_place ON public.verification_attempts USING btree (place_id);


--
-- Name: idx_verification_attempts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_attempts_status ON public.verification_attempts USING btree (status);


--
-- Name: idx_verification_attempts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_attempts_user ON public.verification_attempts USING btree (user_id);


--
-- Name: idx_verification_docs_claim_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_verification_docs_claim_id ON public.verification_documents USING btree (claim_id);


--
-- Name: legal_documents_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX legal_documents_type_idx ON public.legal_documents USING btree (doc_type, published_at DESC);


--
-- Name: memberships_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX memberships_active_idx ON public.memberships USING btree (is_active, sort_order);


--
-- Name: owner_posts_place_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX owner_posts_place_idx ON public.place_owner_posts USING btree (place_id, status, created_at DESC);


--
-- Name: owner_posts_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX owner_posts_status_idx ON public.place_owner_posts USING btree (status, expires_at);


--
-- Name: place_entrances_geography_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_entrances_geography_idx ON public.place_entrances USING gist (geography);


--
-- Name: place_entrances_main_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX place_entrances_main_idx ON public.place_entrances USING btree (place_id) WHERE (is_main = true);


--
-- Name: place_entrances_place_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_entrances_place_idx ON public.place_entrances USING btree (place_id, sort_order);


--
-- Name: place_external_profiles_place_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_external_profiles_place_idx ON public.place_external_profiles USING btree (place_id);


--
-- Name: place_hours_place_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_hours_place_idx ON public.place_hours USING btree (place_id, day_of_week);


--
-- Name: place_membership_offers_membership_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_membership_offers_membership_idx ON public.place_membership_offers USING btree (membership_id);


--
-- Name: place_membership_offers_place_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_membership_offers_place_idx ON public.place_membership_offers USING btree (place_id);


--
-- Name: place_membership_offers_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_membership_offers_status_idx ON public.place_membership_offers USING btree (status);


--
-- Name: place_photos_place_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_photos_place_idx ON public.place_photos USING btree (place_id, created_at DESC);


--
-- Name: place_photos_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_photos_status_idx ON public.place_photos USING btree (status);


--
-- Name: place_photos_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_photos_user_idx ON public.place_photos USING btree (uploaded_by) WHERE (uploaded_by IS NOT NULL);


--
-- Name: place_reviews_place_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_reviews_place_idx ON public.place_reviews USING btree (place_id, created_at DESC);


--
-- Name: place_reviews_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_reviews_status_idx ON public.place_reviews USING btree (status);


--
-- Name: place_reviews_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_reviews_user_idx ON public.place_reviews USING btree (user_id, created_at DESC);


--
-- Name: place_scores_medal_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_scores_medal_idx ON public.place_scores USING btree (medal) WHERE (medal IS NOT NULL);


--
-- Name: place_scores_score_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_scores_score_idx ON public.place_scores USING btree (score_value DESC);


--
-- Name: place_secondary_categories_place_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_secondary_categories_place_idx ON public.place_secondary_categories USING btree (place_id);


--
-- Name: place_secondary_categories_secondary_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_secondary_categories_secondary_idx ON public.place_secondary_categories USING btree (secondary_id);


--
-- Name: place_signal_aggs_place_bucket_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_signal_aggs_place_bucket_idx ON public.place_signal_aggregates USING btree (place_id, bucket, tap_total DESC);


--
-- Name: place_signal_aggs_signal_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_signal_aggs_signal_idx ON public.place_signal_aggregates USING btree (signal_id);


--
-- Name: place_warning_confirmations_warning_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_warning_confirmations_warning_idx ON public.place_warning_confirmations USING btree (warning_id);


--
-- Name: place_warnings_place_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_warnings_place_idx ON public.place_warnings USING btree (place_id, status);


--
-- Name: place_warnings_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_warnings_status_idx ON public.place_warnings USING btree (status, created_at DESC);


--
-- Name: place_warnings_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX place_warnings_type_idx ON public.place_warnings USING btree (warning_type_id);


--
-- Name: places_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_active_idx ON public.places USING btree (is_active, is_permanently_closed);


--
-- Name: places_country_state_city_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_country_state_city_idx ON public.places USING btree (country_code, state_region, city);


--
-- Name: places_county_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_county_idx ON public.places USING btree (country_code, state_region, county) WHERE (county IS NOT NULL);


--
-- Name: places_geography_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_geography_idx ON public.places USING gist (geography);


--
-- Name: places_lat_lng_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_lat_lng_idx ON public.places USING btree (lat, lng);


--
-- Name: places_name_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_name_trgm_idx ON public.places USING gin (name public.gin_trgm_ops);


--
-- Name: places_primary_cat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_primary_cat_idx ON public.places USING btree (primary_category_id);


--
-- Name: places_search_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_search_idx ON public.places USING gin (search_vector);


--
-- Name: places_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX places_slug_idx ON public.places USING btree (slug) WHERE (slug IS NOT NULL);


--
-- Name: review_signal_taps_place_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX review_signal_taps_place_idx ON public.place_review_signal_taps USING btree (place_id, signal_id);


--
-- Name: review_signal_taps_review_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX review_signal_taps_review_idx ON public.place_review_signal_taps USING btree (review_id);


--
-- Name: review_signal_taps_signal_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX review_signal_taps_signal_idx ON public.place_review_signal_taps USING btree (signal_id);


--
-- Name: user_legal_acceptances_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_legal_acceptances_user_idx ON public.user_legal_acceptances USING btree (user_id, accepted_at DESC);


--
-- Name: user_memberships_membership_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_memberships_membership_idx ON public.user_memberships USING btree (membership_id);


--
-- Name: user_memberships_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_memberships_user_idx ON public.user_memberships USING btree (user_id);


--
-- Name: user_verification_status_last_review_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_verification_status_last_review_idx ON public.user_verification_status USING btree (last_review_at);


--
-- Name: user_verification_status_phone_verified_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_verification_status_phone_verified_idx ON public.user_verification_status USING btree (phone_verified);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email) WHERE (email IS NOT NULL);


--
-- Name: users_oauth_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_oauth_idx ON public.users USING btree (oauth_provider, oauth_subject) WHERE (oauth_provider IS NOT NULL);


--
-- Name: users_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_phone_idx ON public.users USING btree (phone_e164) WHERE (phone_e164 IS NOT NULL);


--
-- Name: warning_types_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX warning_types_active_idx ON public.warning_types USING btree (is_active, sort_order);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: -
--

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


--
-- Name: atlas_article_reactions article_reaction_counts_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER article_reaction_counts_trigger AFTER INSERT OR DELETE OR UPDATE ON public.atlas_article_reactions FOR EACH ROW EXECUTE FUNCTION public.update_article_reaction_counts();


--
-- Name: atlas_article_saves article_save_counts_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER article_save_counts_trigger AFTER INSERT OR DELETE ON public.atlas_article_saves FOR EACH ROW EXECUTE FUNCTION public.update_article_save_counts();


--
-- Name: atlas_articles atlas_articles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER atlas_articles_updated_at BEFORE UPDATE ON public.atlas_articles FOR EACH ROW EXECUTE FUNCTION public.update_atlas_updated_at();


--
-- Name: atlas_categories atlas_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER atlas_categories_updated_at BEFORE UPDATE ON public.atlas_categories FOR EACH ROW EXECUTE FUNCTION public.update_atlas_updated_at();


--
-- Name: atlas_universes atlas_universes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER atlas_universes_updated_at BEFORE UPDATE ON public.atlas_universes FOR EACH ROW EXECUTE FUNCTION public.update_atlas_updated_at();


--
-- Name: place_entrances entrance_geography_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER entrance_geography_trigger BEFORE INSERT OR UPDATE OF lat, lng ON public.place_entrances FOR EACH ROW EXECUTE FUNCTION public.update_place_geography();


--
-- Name: place_owner_posts place_owner_posts_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER place_owner_posts_updated_at_trigger BEFORE UPDATE ON public.place_owner_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: place_reviews place_reviews_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER place_reviews_updated_at_trigger BEFORE UPDATE ON public.place_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: place_scores place_scores_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER place_scores_updated_at_trigger BEFORE UPDATE ON public.place_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: place_secondary_categories place_secondary_categories_limit_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER place_secondary_categories_limit_trigger BEFORE INSERT ON public.place_secondary_categories FOR EACH ROW EXECUTE FUNCTION public.enforce_max_secondary_categories();


--
-- Name: places places_geography_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER places_geography_trigger BEFORE INSERT OR UPDATE OF lat, lng ON public.places FOR EACH ROW EXECUTE FUNCTION public.update_place_geography();


--
-- Name: places places_search_vector_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER places_search_vector_trigger BEFORE INSERT OR UPDATE OF name, description, city, state_region ON public.places FOR EACH ROW EXECUTE FUNCTION public.update_place_search_vector();


--
-- Name: places places_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER places_updated_at_trigger BEFORE UPDATE ON public.places FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: places trigger_update_places_geography; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_places_geography BEFORE INSERT OR UPDATE OF lat, lng ON public.places FOR EACH ROW EXECUTE FUNCTION public.update_places_geography();


--
-- Name: user_verification_status user_verification_status_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER user_verification_status_updated_at_trigger BEFORE UPDATE ON public.user_verification_status FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: admin_activity_log admin_activity_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_activity_log
    ADD CONSTRAINT admin_activity_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: atlas_article_places atlas_article_places_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_places
    ADD CONSTRAINT atlas_article_places_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.atlas_articles(id) ON DELETE CASCADE;


--
-- Name: atlas_article_places atlas_article_places_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_places
    ADD CONSTRAINT atlas_article_places_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: atlas_article_reactions atlas_article_reactions_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_reactions
    ADD CONSTRAINT atlas_article_reactions_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.atlas_articles(id) ON DELETE CASCADE;


--
-- Name: atlas_article_reactions atlas_article_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_reactions
    ADD CONSTRAINT atlas_article_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: atlas_article_saves atlas_article_saves_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_saves
    ADD CONSTRAINT atlas_article_saves_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.atlas_articles(id) ON DELETE CASCADE;


--
-- Name: atlas_article_saves atlas_article_saves_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_article_saves
    ADD CONSTRAINT atlas_article_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: atlas_articles atlas_articles_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_articles
    ADD CONSTRAINT atlas_articles_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: atlas_articles atlas_articles_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_articles
    ADD CONSTRAINT atlas_articles_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.atlas_categories(id) ON DELETE SET NULL;


--
-- Name: atlas_articles atlas_articles_universe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_articles
    ADD CONSTRAINT atlas_articles_universe_id_fkey FOREIGN KEY (universe_id) REFERENCES public.atlas_universes(id) ON DELETE SET NULL;


--
-- Name: atlas_universe_places atlas_universe_places_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_universe_places
    ADD CONSTRAINT atlas_universe_places_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: atlas_universe_places atlas_universe_places_universe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_universe_places
    ADD CONSTRAINT atlas_universe_places_universe_id_fkey FOREIGN KEY (universe_id) REFERENCES public.atlas_universes(id) ON DELETE CASCADE;


--
-- Name: atlas_universes atlas_universes_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_universes
    ADD CONSTRAINT atlas_universes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.atlas_categories(id) ON DELETE SET NULL;


--
-- Name: atlas_universes atlas_universes_parent_universe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atlas_universes
    ADD CONSTRAINT atlas_universes_parent_universe_id_fkey FOREIGN KEY (parent_universe_id) REFERENCES public.atlas_universes(id) ON DELETE CASCADE;


--
-- Name: categories_secondary categories_secondary_primary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_secondary
    ADD CONSTRAINT categories_secondary_primary_id_fkey FOREIGN KEY (primary_id) REFERENCES public.categories_primary(id) ON DELETE CASCADE;


--
-- Name: category_review_items category_review_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_review_items
    ADD CONSTRAINT category_review_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.business_categories(id) ON DELETE CASCADE;


--
-- Name: category_review_items category_review_items_review_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.category_review_items
    ADD CONSTRAINT category_review_items_review_item_id_fkey FOREIGN KEY (review_item_id) REFERENCES public.review_items(id) ON DELETE CASCADE;


--
-- Name: content_flags content_flags_flagged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_flags
    ADD CONSTRAINT content_flags_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: content_flags content_flags_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_flags
    ADD CONSTRAINT content_flags_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: edit_suggestions edit_suggestions_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edit_suggestions
    ADD CONSTRAINT edit_suggestions_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: edit_suggestions edit_suggestions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edit_suggestions
    ADD CONSTRAINT edit_suggestions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: edit_suggestions edit_suggestions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.edit_suggestions
    ADD CONSTRAINT edit_suggestions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: fsq_categories fsq_categories_tavvy_primary_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fsq_categories
    ADD CONSTRAINT fsq_categories_tavvy_primary_category_id_fkey FOREIGN KEY (tavvy_primary_category_id) REFERENCES public.categories_primary(id);


--
-- Name: fsq_categories fsq_categories_tavvy_secondary_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fsq_categories
    ADD CONSTRAINT fsq_categories_tavvy_secondary_category_id_fkey FOREIGN KEY (tavvy_secondary_category_id) REFERENCES public.categories_secondary(id);


--
-- Name: notification_queue notification_queue_recipient_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_queue
    ADD CONSTRAINT notification_queue_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: photo_likes photo_likes_photo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_likes
    ADD CONSTRAINT photo_likes_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.place_photos(id) ON DELETE CASCADE;


--
-- Name: photo_likes photo_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_likes
    ADD CONSTRAINT photo_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: photo_reports photo_reports_photo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_reports
    ADD CONSTRAINT photo_reports_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.place_photos(id);


--
-- Name: photo_reports photo_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_reports
    ADD CONSTRAINT photo_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id);


--
-- Name: place_checkins place_checkins_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_checkins
    ADD CONSTRAINT place_checkins_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_checkins place_checkins_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_checkins
    ADD CONSTRAINT place_checkins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: place_claims place_claims_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_claims
    ADD CONSTRAINT place_claims_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_claims place_claims_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_claims
    ADD CONSTRAINT place_claims_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: place_claims place_claims_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_claims
    ADD CONSTRAINT place_claims_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: place_entrances place_entrances_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_entrances
    ADD CONSTRAINT place_entrances_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_external_profiles place_external_profiles_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_external_profiles
    ADD CONSTRAINT place_external_profiles_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_external_rating_snapshots place_external_rating_snapshots_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_external_rating_snapshots
    ADD CONSTRAINT place_external_rating_snapshots_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_hours place_hours_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_hours
    ADD CONSTRAINT place_hours_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_membership_offers place_membership_offers_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_membership_offers
    ADD CONSTRAINT place_membership_offers_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;


--
-- Name: place_membership_offers place_membership_offers_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_membership_offers
    ADD CONSTRAINT place_membership_offers_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_owner_posts place_owner_posts_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_owner_posts
    ADD CONSTRAINT place_owner_posts_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: place_owner_posts place_owner_posts_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_owner_posts
    ADD CONSTRAINT place_owner_posts_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_photos place_photos_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_photos
    ADD CONSTRAINT place_photos_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_photos place_photos_removed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_photos
    ADD CONSTRAINT place_photos_removed_by_fkey FOREIGN KEY (removed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: place_photos place_photos_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_photos
    ADD CONSTRAINT place_photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: place_photos place_photos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_photos
    ADD CONSTRAINT place_photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: place_review_signal_taps place_review_signal_taps_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_review_signal_taps
    ADD CONSTRAINT place_review_signal_taps_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_review_signal_taps place_review_signal_taps_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_review_signal_taps
    ADD CONSTRAINT place_review_signal_taps_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.place_reviews(id) ON DELETE CASCADE;


--
-- Name: place_reviews place_reviews_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_reviews
    ADD CONSTRAINT place_reviews_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_reviews place_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_reviews
    ADD CONSTRAINT place_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: place_scores place_scores_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_scores
    ADD CONSTRAINT place_scores_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_secondary_categories place_secondary_categories_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_secondary_categories
    ADD CONSTRAINT place_secondary_categories_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_secondary_categories place_secondary_categories_secondary_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_secondary_categories
    ADD CONSTRAINT place_secondary_categories_secondary_id_fkey FOREIGN KEY (secondary_id) REFERENCES public.categories_secondary(id) ON DELETE CASCADE;


--
-- Name: place_signal_aggregates place_signal_aggregates_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_signal_aggregates
    ADD CONSTRAINT place_signal_aggregates_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_stories place_stories_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_stories
    ADD CONSTRAINT place_stories_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_stories place_stories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_stories
    ADD CONSTRAINT place_stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: place_warning_confirmations place_warning_confirmations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_warning_confirmations
    ADD CONSTRAINT place_warning_confirmations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: place_warning_confirmations place_warning_confirmations_warning_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_warning_confirmations
    ADD CONSTRAINT place_warning_confirmations_warning_id_fkey FOREIGN KEY (warning_id) REFERENCES public.place_warnings(id) ON DELETE CASCADE;


--
-- Name: place_warnings place_warnings_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_warnings
    ADD CONSTRAINT place_warnings_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: place_warnings place_warnings_reported_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_warnings
    ADD CONSTRAINT place_warnings_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: place_warnings place_warnings_warning_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.place_warnings
    ADD CONSTRAINT place_warnings_warning_type_id_fkey FOREIGN KEY (warning_type_id) REFERENCES public.warning_types(id) ON DELETE RESTRICT;


--
-- Name: places places_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.business_categories(id);


--
-- Name: places places_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: places places_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: places places_primary_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_primary_category_id_fkey FOREIGN KEY (primary_category_id) REFERENCES public.categories_primary(id);


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: review_signals review_signals_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.review_signals
    ADD CONSTRAINT review_signals_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: search_history search_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_history
    ADD CONSTRAINT search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tap_activity tap_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tap_activity
    ADD CONSTRAINT tap_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_favorites user_favorites_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_gamification user_gamification_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_gamification
    ADD CONSTRAINT user_gamification_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_legal_acceptances user_legal_acceptances_legal_doc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_legal_acceptances
    ADD CONSTRAINT user_legal_acceptances_legal_doc_id_fkey FOREIGN KEY (legal_doc_id) REFERENCES public.legal_documents(id) ON DELETE CASCADE;


--
-- Name: user_legal_acceptances user_legal_acceptances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_legal_acceptances
    ADD CONSTRAINT user_legal_acceptances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_memberships user_memberships_membership_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_memberships
    ADD CONSTRAINT user_memberships_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE;


--
-- Name: user_memberships user_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_memberships
    ADD CONSTRAINT user_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_verification_status user_verification_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_verification_status
    ADD CONSTRAINT user_verification_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verification_documents verification_documents_claim_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_documents
    ADD CONSTRAINT verification_documents_claim_id_fkey FOREIGN KEY (claim_id) REFERENCES public.place_claims(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: place_stories Active stories are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active stories are viewable by everyone" ON public.place_stories FOR SELECT USING ((expires_at > now()));


--
-- Name: place_claims Admins update claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins update claims" ON public.place_claims FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text)))));


--
-- Name: edit_suggestions Admins update edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins update edits" ON public.edit_suggestions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text)))));


--
-- Name: admin_activity_log Admins view activity log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view activity log" ON public.admin_activity_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text)))));


--
-- Name: place_claims Admins view all claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all claims" ON public.place_claims FOR SELECT USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text)))));


--
-- Name: verification_documents Admins view all docs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all docs" ON public.verification_documents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text)))));


--
-- Name: edit_suggestions Admins view all edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins view all edits" ON public.edit_suggestions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text)))));


--
-- Name: tap_activity Anyone can view tap activity; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view tap activity" ON public.tap_activity FOR SELECT TO authenticated USING (true);


--
-- Name: places Authenticated users can insert places; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert places" ON public.places FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));


--
-- Name: place_reviews Authenticated users can insert reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert reviews" ON public.place_reviews FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: place_checkins Check-ins are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Check-ins are viewable by everyone" ON public.place_checkins FOR SELECT USING (true);


--
-- Name: places Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.places FOR SELECT USING (true);


--
-- Name: places Everyone can view places; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view places" ON public.places FOR SELECT USING (true);


--
-- Name: review_signals Everyone can view review signals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view review signals" ON public.review_signals FOR SELECT USING (true);


--
-- Name: reviews Everyone can view reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Everyone can view reviews" ON public.reviews FOR SELECT USING (true);


--
-- Name: place_owner_posts Owner posts are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owner posts are viewable by everyone" ON public.place_owner_posts FOR SELECT USING (((status = 'live'::text) AND ((never_expires = true) OR (expires_at > now()))));


--
-- Name: place_owner_posts Owners can create posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can create posts" ON public.place_owner_posts FOR INSERT WITH CHECK ((auth.uid() = owner_user_id));


--
-- Name: place_owner_posts Owners can update their posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Owners can update their posts" ON public.place_owner_posts FOR UPDATE USING ((auth.uid() = owner_user_id));


--
-- Name: place_photos Photos are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Photos are viewable by everyone" ON public.place_photos FOR SELECT USING ((status = 'live'::text));


--
-- Name: places Places are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Places are viewable by everyone" ON public.places FOR SELECT USING ((is_active = true));


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: atlas_article_places Public can view article-place relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view article-place relationships" ON public.atlas_article_places FOR SELECT USING (true);


--
-- Name: place_photos Public can view photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view photos" ON public.place_photos FOR SELECT USING (true);


--
-- Name: atlas_articles Public can view published articles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view published articles" ON public.atlas_articles FOR SELECT USING ((status = 'published'::text));


--
-- Name: atlas_categories Public can view published categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view published categories" ON public.atlas_categories FOR SELECT USING (true);


--
-- Name: atlas_universes Public can view published universes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view published universes" ON public.atlas_universes FOR SELECT USING ((status = 'published'::text));


--
-- Name: atlas_universe_places Public can view universe-place relationships; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public can view universe-place relationships" ON public.atlas_universe_places FOR SELECT USING (true);


--
-- Name: place_photos Public photos are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public photos are viewable by everyone" ON public.place_photos FOR SELECT USING (true);


--
-- Name: place_reviews Reviews are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Reviews are viewable by everyone" ON public.place_reviews FOR SELECT USING (true);


--
-- Name: reviews Users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: place_stories Users can create stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create stories" ON public.place_stories FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: place_checkins Users can create their own check-ins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own check-ins" ON public.place_checkins FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: atlas_article_reactions Users can create their own reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own reactions" ON public.atlas_article_reactions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: place_reviews Users can create their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own reviews" ON public.place_reviews FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: atlas_article_saves Users can create their own saves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own saves" ON public.atlas_article_saves FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: places Users can delete own places; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own places" ON public.places FOR DELETE TO authenticated USING ((auth.uid() = created_by));


--
-- Name: place_reviews Users can delete own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own reviews" ON public.place_reviews FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: place_checkins Users can delete their own check-ins; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own check-ins" ON public.place_checkins FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: favorites Users can delete their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: place_photos Users can delete their own photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own photos" ON public.place_photos FOR DELETE USING ((auth.uid() = uploaded_by));


--
-- Name: atlas_article_reactions Users can delete their own reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reactions" ON public.atlas_article_reactions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: place_reviews Users can delete their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own reviews" ON public.place_reviews FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: atlas_article_saves Users can delete their own saves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own saves" ON public.atlas_article_saves FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: search_history Users can delete their own search history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own search history" ON public.search_history FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: place_stories Users can delete their own stories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own stories" ON public.place_stories FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: favorites Users can insert their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: search_history Users can insert their own search history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own search history" ON public.search_history FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: tap_activity Users can insert their own taps; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own taps" ON public.tap_activity FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: places Users can update own places; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own places" ON public.places FOR UPDATE TO authenticated USING ((auth.uid() = created_by)) WITH CHECK ((auth.uid() = created_by));


--
-- Name: place_reviews Users can update own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own reviews" ON public.place_reviews FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: favorites Users can update their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own favorites" ON public.favorites FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_gamification Users can update their own gamification data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own gamification data" ON public.user_gamification FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: atlas_article_reactions Users can update their own reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reactions" ON public.atlas_article_reactions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: place_reviews Users can update their own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own reviews" ON public.place_reviews FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: place_photos Users can upload own photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload own photos" ON public.place_photos FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: place_photos Users can upload photos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can upload photos" ON public.place_photos FOR INSERT WITH CHECK (true);


--
-- Name: atlas_article_reactions Users can view all reactions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all reactions" ON public.atlas_article_reactions FOR SELECT USING (true);


--
-- Name: atlas_article_saves Users can view all saves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view all saves" ON public.atlas_article_saves FOR SELECT USING (true);


--
-- Name: favorites Users can view their own favorites; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_gamification Users can view their own gamification data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own gamification data" ON public.user_gamification FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: search_history Users can view their own search history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own search history" ON public.search_history FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: place_claims Users submit claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users submit claims" ON public.place_claims FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: edit_suggestions Users submit edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users submit edits" ON public.edit_suggestions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: verification_documents Users upload docs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users upload docs" ON public.verification_documents FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.place_claims
  WHERE ((place_claims.id = verification_documents.claim_id) AND (place_claims.user_id = auth.uid())))));


--
-- Name: place_claims Users view own claims; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own claims" ON public.place_claims FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: verification_documents Users view own docs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own docs" ON public.verification_documents FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.place_claims
  WHERE ((place_claims.id = verification_documents.claim_id) AND (place_claims.user_id = auth.uid())))));


--
-- Name: edit_suggestions Users view own edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own edits" ON public.edit_suggestions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notification_queue Users view own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users view own notifications" ON public.notification_queue FOR SELECT USING ((auth.uid() = recipient_user_id));


--
-- Name: admin_activity_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_article_places; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_article_places ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_article_reactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_article_reactions ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_article_saves; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_article_saves ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_articles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_articles ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_categories ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_universe_places; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_universe_places ENABLE ROW LEVEL SECURITY;

--
-- Name: atlas_universes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.atlas_universes ENABLE ROW LEVEL SECURITY;

--
-- Name: business_owners auth_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auth_all ON public.business_owners TO authenticated USING (true) WITH CHECK (true);


--
-- Name: moderation_queue auth_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auth_all ON public.moderation_queue TO authenticated USING (true) WITH CHECK (true);


--
-- Name: user_profiles auth_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auth_all ON public.user_profiles TO authenticated USING (true) WITH CHECK (true);


--
-- Name: verification_attempts auth_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY auth_all ON public.verification_attempts TO authenticated USING (true) WITH CHECK (true);


--
-- Name: business_owners; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_owners ENABLE ROW LEVEL SECURITY;

--
-- Name: edit_suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.edit_suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: moderation_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: notification_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: place_checkins; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.place_checkins ENABLE ROW LEVEL SECURITY;

--
-- Name: place_claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.place_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: place_owner_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.place_owner_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: place_photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;

--
-- Name: place_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.place_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: place_stories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.place_stories ENABLE ROW LEVEL SECURITY;

--
-- Name: places; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: review_signals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.review_signals ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: search_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

--
-- Name: tap_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tap_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: user_gamification; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: verification_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: verification_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Authenticated users can upload photos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can upload photos" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'place-photos'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Authenticated users can upload stories; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Authenticated users can upload stories" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'place-stories'::text) AND (auth.role() = 'authenticated'::text)));


--
-- Name: objects Photos are publicly viewable; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Photos are publicly viewable" ON storage.objects FOR SELECT USING ((bucket_id = 'place-photos'::text));


--
-- Name: objects Stories are publicly viewable; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Stories are publicly viewable" ON storage.objects FOR SELECT USING ((bucket_id = 'place-stories'::text));


--
-- Name: objects Users can delete own photos; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE USING (((bucket_id = 'place-photos'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects Users can delete own stories; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Users can delete own stories" ON storage.objects FOR DELETE USING (((bucket_id = 'place-stories'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict NokPVH6raYxNAImqUqqtxOPt4QIvWC4D06qar15XL9ALhVVModMmu0FdUP9S2lz

