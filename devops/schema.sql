-- devops/schema.sql
-- Minimal schema for local RLS testing
SET client_min_messages = WARNING;

-- Create app schema and helper functions
CREATE SCHEMA IF NOT EXISTS app;
CREATE OR REPLACE FUNCTION app.jwt_claim(claim_name text)
RETURNS text
LANGUAGE sql
STABLE
AS $function$
  SELECT current_setting('jwt.claims.' || claim_name, true);
$function$;

CREATE OR REPLACE FUNCTION app.procedimiento_belongs_to_department(proc_code text, dept text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.procedimientos p
    WHERE p.codigo = proc_code
      AND p.departamento_id = dept
  );
$function$;

-- empleados table (minimal)
CREATE TABLE IF NOT EXISTS public.empleados (
  id text PRIMARY KEY,
  nombre text
);

-- departamentos table
CREATE TABLE IF NOT EXISTS public.departamentos (
  id text PRIMARY KEY,
  nombre text
);

-- procedimientos table
CREATE TABLE IF NOT EXISTS public.procedimientos (
  id text PRIMARY KEY,
  codigo text UNIQUE NOT NULL,
  nombre text,
  departamento_id text
);

ALTER TABLE public.procedimientos
  ADD CONSTRAINT procedimientos_fk_departamento
  FOREIGN KEY (departamento_id) REFERENCES public.departamentos(id)
  ON DELETE SET NULL;

-- tickets table (fields used by policies)
CREATE TABLE IF NOT EXISTS public.tickets (
  id serial PRIMARY KEY,
  codigo_actividad text,
  codigo_linea_trabajo text,
  codigo_procedimiento text,
  titulo text,
  asignado_a text,
  asignado_por text,
  created_at timestamptz DEFAULT now()
);

-- activities table (minimal)
CREATE TABLE IF NOT EXISTS public.actividades (
  id text PRIMARY KEY,
  codigo text UNIQUE,
  nombre text
);

-- simple files table to resemble attachments
CREATE TABLE IF NOT EXISTS public.archivos (
  id serial PRIMARY KEY,
  ticket_id integer REFERENCES public.tickets(id) ON DELETE CASCADE,
  nombre text,
  url text
);

-- Create _v2 policies for tickets (same logic as production)
-- Insert policy (WITH CHECK uses unqualified column names)
DROP POLICY IF EXISTS tickets_insert_policy_v2 ON public.tickets;
CREATE POLICY tickets_insert_policy_v2
  ON public.tickets
  FOR INSERT
  WITH CHECK (
    (
      app.jwt_claim('role'::text) = ANY (ARRAY['admin'::text, 'sysadmin'::text])
    )
    OR (
      app.jwt_claim('role'::text) = 'director'::text
      AND (
        EXISTS (
          SELECT 1 FROM procedimientos p
          WHERE p.codigo = tickets.codigo_procedimiento
            AND p.departamento_id = app.jwt_claim('department_id'::text)
        )
      )
    )
    OR (
      app.jwt_claim('role'::text) = 'employee'::text
      AND (
        (asignado_por)::text = app.jwt_claim('employee_id'::text)
        OR (asignado_a)::text = app.jwt_claim('employee_id'::text)
      )
    )
  );

-- Select policy
DROP POLICY IF EXISTS tickets_select_policy ON public.tickets;
CREATE POLICY tickets_select_policy
  ON public.tickets
  FOR SELECT
  USING (
    (
      app.jwt_claim('role'::text) = ANY (ARRAY['admin'::text, 'sysadmin'::text])
    )
    OR (
      app.jwt_claim('role'::text) = 'director'::text
      AND (
        EXISTS (
          SELECT 1 FROM procedimientos p
          WHERE p.codigo = tickets.codigo_procedimiento
            AND p.departamento_id = app.jwt_claim('department_id'::text)
        )
      )
    )
    OR (
      app.jwt_claim('role'::text) = 'employee'::text
      AND (
        (asignado_a)::text = app.jwt_claim('employee_id'::text)
        OR (asignado_por)::text = app.jwt_claim('employee_id'::text)
      )
    )
  );

-- Update policy
DROP POLICY IF EXISTS tickets_update_policy_v2 ON public.tickets;
CREATE POLICY tickets_update_policy_v2
  ON public.tickets
  FOR UPDATE
  USING (
    (
      app.jwt_claim('role'::text) = ANY (ARRAY['admin'::text, 'sysadmin'::text])
    )
    OR (
      app.jwt_claim('role'::text) = 'director'::text
      AND (
        EXISTS (
          SELECT 1 FROM procedimientos p
          WHERE p.codigo = tickets.codigo_procedimiento
            AND p.departamento_id = app.jwt_claim('department_id'::text)
        )
      )
    )
    OR (
      app.jwt_claim('role'::text) = 'employee'::text
      AND (
        (asignado_a)::text = app.jwt_claim('employee_id'::text)
        OR (asignado_por)::text = app.jwt_claim('employee_id'::text)
      )
    )
  )
  WITH CHECK (
    (
      app.jwt_claim('role'::text) = ANY (ARRAY['admin'::text, 'sysadmin'::text])
    )
    OR (
      app.jwt_claim('role'::text) = 'director'::text
      AND app.procedimiento_belongs_to_department((codigo_procedimiento)::text, app.jwt_claim('department_id'::text))
    )
    OR (
      app.jwt_claim('role'::text) = 'employee'::text
      AND (
        (asignado_a)::text = app.jwt_claim('employee_id'::text)
        OR (asignado_por)::text = app.jwt_claim('employee_id'::text)
      )
    )
  );

-- Enable row level security on tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
