-- devops/rls_insert_compat_policy.sql
-- Safe, reversible compatibility policy for testing JWTs that use
-- role='authenticated' and include employee_id claim.
-- This policy is intentionally additive: it uses a new policy name
-- and does not drop or modify existing policies. When you are ready
-- to remove it, DROP POLICY IF EXISTS tickets_insert_policy_compat ON public.tickets;

BEGIN;

-- Create a compatibility policy that mirrors the 'employee' branch
-- but accepts tokens where role = 'authenticated' (common for PostgREST)
-- and where the token contains employee_id claim matching asignado_por/asignado_a.
-- The WITH CHECK must use unqualified column names to avoid NEW.* parser differences.
DROP POLICY IF EXISTS tickets_insert_policy_compat ON public.tickets;
CREATE POLICY tickets_insert_policy_compat
  ON public.tickets
  FOR INSERT
  WITH CHECK (
    (
      app.jwt_claim('role'::text) = 'authenticated'::text
      AND (
        (asignado_por)::text = app.jwt_claim('employee_id'::text)
        OR (asignado_a)::text = app.jwt_claim('employee_id'::text)
      )
    )
  );

COMMIT;

-- Usage: Run this file in your Supabase SQL editor (or via psql) in staging.
-- After you finish testing, remove with:
--   DROP POLICY IF EXISTS tickets_insert_policy_compat ON public.tickets;
