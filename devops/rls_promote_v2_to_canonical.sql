-- rls_promote_v2_to_canonical.sql
-- Reversible migration to promote `_v2` RLS policies to canonical policy names.
-- Usage: run in a staging environment first. The accompanying PowerShell runner
-- `devops/run_rls_promote.ps1` will prompt and run this script via psql.
--
-- This script performs safe pre-checks, creates backups of existing policies
-- into temporary tables (so they can be restored in rollback), and then drops
-- the old policies and creates canonical policies based on the verified `_v2`
-- logic.
--
-- Important note on the `NEW` parsing issue:
-- In some Postgres execution/migration environments, referencing `NEW.*` in
-- policy expressions (especially inside WITH CHECK) can cause a "missing
-- FROM-clause entry for table 'new'" parse-time error. To avoid that,
-- our `_v2` policies use unqualified column names inside WITH CHECK (these
-- are evaluated against the new row) instead of `NEW.column_name`. This is the
-- recommended, stable approach and is preserved in the canonical policies
-- created by this migration.

BEGIN;

-- 1) Safety pre-checks
-- Ensure we're not accidentally running on production: fail if the database
-- name looks like production (simple heuristic). Adjust to your environment.
DO $$
DECLARE
  dbname text := current_database();
BEGIN
  IF dbname ILIKE '%prod%' OR dbname ILIKE '%production%' THEN
    RAISE EXCEPTION 'Refusing to run promotion on database: %', dbname;
  END IF;
END$$;

-- 2) Create backup area for existing policies (so rollback can restore them)
CREATE TABLE IF NOT EXISTS devops.rls_policy_backups (
  policy_name text PRIMARY KEY,
  table_schema text,
  table_name text,
  policy_def text,
  created_at timestamptz DEFAULT now()
);

-- Helper: function to capture the text of existing policies
CREATE OR REPLACE FUNCTION devops.capture_policy( sch text, tbl text, pol text ) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  def text;
BEGIN
  SELECT pg_get_policydef(p.oid) INTO def
  FROM pg_policy p
  JOIN pg_class c ON p.polrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = sch AND c.relname = tbl AND p.polname = pol;

  IF def IS NOT NULL THEN
    INSERT INTO devops.rls_policy_backups(policy_name, table_schema, table_name, policy_def)
    VALUES (pol, sch, tbl, def)
    ON CONFLICT (policy_name) DO NOTHING;
  END IF;
END$$;

-- 3) Capture current policies we intend to replace (if they exist)
SELECT devops.capture_policy('public','tickets','tickets_insert_policy');
SELECT devops.capture_policy('public','tickets','tickets_update_policy');
SELECT devops.capture_policy('public','procedimientos','procedimientos_insert_policy');
SELECT devops.capture_policy('public','procedimientos','procedimientos_update_policy');
SELECT devops.capture_policy('public','procedimientos','procedimientos_delete_policy');
SELECT devops.capture_policy('public','empleados','empleados_update_policy');

-- 4) Drop old policies if present (non-destructive because backups exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid=c.oid JOIN pg_namespace n ON c.relnamespace=n.oid WHERE p.polname='tickets_insert_policy' AND n.nspname='public') THEN
    EXECUTE 'DROP POLICY IF EXISTS tickets_insert_policy ON public.tickets';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid=c.oid JOIN pg_namespace n ON c.relnamespace=n.oid WHERE p.polname='tickets_update_policy' AND n.nspname='public') THEN
    EXECUTE 'DROP POLICY IF EXISTS tickets_update_policy ON public.tickets';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid=c.oid JOIN pg_namespace n ON c.relnamespace=n.oid WHERE p.polname='procedimientos_insert_policy' AND n.nspname='public') THEN
    EXECUTE 'DROP POLICY IF EXISTS procedimientos_insert_policy ON public.procedimientos';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid=c.oid JOIN pg_namespace n ON c.relnamespace=n.oid WHERE p.polname='procedimientos_update_policy' AND n.nspname='public') THEN
    EXECUTE 'DROP POLICY IF EXISTS procedimientos_update_policy ON public.procedimientos';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid=c.oid JOIN pg_namespace n ON c.relnamespace=n.oid WHERE p.polname='procedimientos_delete_policy' AND n.nspname='public') THEN
    EXECUTE 'DROP POLICY IF EXISTS procedimientos_delete_policy ON public.procedimientos';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid=c.oid JOIN pg_namespace n ON c.relnamespace=n.oid WHERE p.polname='empleados_update_policy' AND n.nspname='public') THEN
    EXECUTE 'DROP POLICY IF EXISTS empleados_update_policy ON public.empleados';
  END IF;
END$$;

-- 5) Create canonical policies based on the tested `_v2` logic.
-- NOTE: We intentionally use unqualified column names in WITH CHECK expressions
-- (e.g., asignado_por) instead of NEW.asignado_por to avoid the parser issue.

-- tickets: insert policy
DROP POLICY IF EXISTS tickets_insert_policy_v2 ON public.tickets;
CREATE POLICY tickets_insert_policy ON public.tickets FOR INSERT TO public
  USING ( true )
  WITH CHECK (
    -- allow admin role
    app.jwt_claim('role') = 'admin'
    OR (
      -- employees can create tickets assigned to themselves
      app.jwt_claim('role') = 'employee' AND asignado_por = app.jwt_claim('employee_id')
    )
    OR (
      -- directors can create tickets for procedures in their department
      app.jwt_claim('role') = 'director' AND app.procedimiento_belongs_to_department(procedimiento_codigo, app.jwt_claim('department_id'))
    )
  );

-- tickets: update policy
DROP POLICY IF EXISTS tickets_update_policy_v2 ON public.tickets;
CREATE POLICY tickets_update_policy ON public.tickets FOR UPDATE TO public
  USING (
    app.jwt_claim('role') = 'admin'
    OR (
      app.jwt_claim('role') = 'employee' AND asignado_por = app.jwt_claim('employee_id')
    )
    OR (
      app.jwt_claim('role') = 'director' AND app.procedimiento_belongs_to_department(procedimiento_codigo, app.jwt_claim('department_id'))
    )
  )
  WITH CHECK (
    -- Same constraints for updated values
    app.jwt_claim('role') = 'admin'
    OR (
      app.jwt_claim('role') = 'employee' AND asignado_por = app.jwt_claim('employee_id')
    )
    OR (
      app.jwt_claim('role') = 'director' AND app.procedimiento_belongs_to_department(procedimiento_codigo, app.jwt_claim('department_id'))
    )
  );

-- procedimientos: insert/update/delete policies
DROP POLICY IF EXISTS procedimientos_insert_policy_v2 ON public.procedimientos;
CREATE POLICY procedimientos_insert_policy ON public.procedimientos FOR INSERT TO public
  USING ( app.jwt_claim('role') = 'admin' )
  WITH CHECK ( app.jwt_claim('role') = 'admin' );

DROP POLICY IF EXISTS procedimientos_update_policy_v2 ON public.procedimientos;
CREATE POLICY procedimientos_update_policy ON public.procedimientos FOR UPDATE TO public
  USING ( app.jwt_claim('role') = 'admin' )
  WITH CHECK ( app.jwt_claim('role') = 'admin' );

DROP POLICY IF EXISTS procedimientos_delete_policy_v2 ON public.procedimientos;
CREATE POLICY procedimientos_delete_policy ON public.procedimientos FOR DELETE TO public
  USING ( app.jwt_claim('role') = 'admin' );

-- empleados: update policy (allow admin or the employee themself)
DROP POLICY IF EXISTS empleados_update_policy_v2 ON public.empleados;
CREATE POLICY empleados_update_policy ON public.empleados FOR UPDATE TO public
  USING (
    app.jwt_claim('role') = 'admin' OR app.jwt_claim('employee_id') = id
  )
  WITH CHECK (
    app.jwt_claim('role') = 'admin' OR app.jwt_claim('employee_id') = id
  );

-- 6) Mark success
COMMIT;

-- Rollback instructions:
-- To rollback, the `devops.rls_policy_backups` table contains textual policy defs
-- that can be applied (see `devops/rls_promote_v2_to_canonical_rollback.sql` which
-- the PowerShell runner will generate and run on demand).
