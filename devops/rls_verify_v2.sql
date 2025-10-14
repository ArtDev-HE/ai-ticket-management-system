-- devops/rls_verify_v2.sql
-- Idempotent verification script for RLS v2 policies (tickets/procedimientos/empleados)
-- Intended for staging only. Review before running in any environment.
-- Usage: psql -h <host> -U <user> -d <db> -f devops/rls_verify_v2.sql

BEGIN;

-- 0) Create helper schema/function if missing
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.jwt_claim(claim_name text)
RETURNS text
LANGUAGE SQL STABLE
AS $$
  SELECT current_setting('jwt.claims.' || claim_name, true);
$$;

CREATE OR REPLACE FUNCTION app.procedimiento_belongs_to_department(proc_code text, dept text)
RETURNS boolean
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.procedimientos p
    WHERE p.codigo = proc_code
      AND p.departamento_id = dept
  );
$$;

-- 1) Create/replace RLS v2 policies (uses _v2 suffix to avoid touching existing policies)

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tickets_insert_policy_v2 ON public.tickets;
CREATE POLICY tickets_insert_policy_v2 ON public.tickets
  FOR INSERT
  WITH CHECK (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (
      app.jwt_claim('role') = 'director'
      AND EXISTS (
        SELECT 1 FROM public.procedimientos p
        WHERE p.codigo = codigo_procedimiento
          AND p.departamento_id = app.jwt_claim('department_id')
      )
    )
    OR (
      app.jwt_claim('role') = 'employee'
      AND (
        asignado_por = app.jwt_claim('employee_id')
        OR asignado_a = app.jwt_claim('employee_id')
      )
    )
  );

DROP POLICY IF EXISTS tickets_update_policy_v2 ON public.tickets;
CREATE POLICY tickets_update_policy_v2 ON public.tickets
  FOR UPDATE
  USING (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (
      app.jwt_claim('role') = 'director'
      AND EXISTS (
        SELECT 1 FROM public.procedimientos p
        WHERE p.codigo = public.tickets.codigo_procedimiento
          AND p.departamento_id = app.jwt_claim('department_id')
      )
    )
    OR (
      app.jwt_claim('role') = 'employee'
      AND (
        public.tickets.asignado_a = app.jwt_claim('employee_id')
        OR public.tickets.asignado_por = app.jwt_claim('employee_id')
      )
    )
  )
  WITH CHECK (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (
      app.jwt_claim('role') = 'director'
      AND app.procedimiento_belongs_to_department(codigo_procedimiento, app.jwt_claim('department_id'))
    )
    OR (
      app.jwt_claim('role') = 'employee'
      AND (
        asignado_a = app.jwt_claim('employee_id')
        OR asignado_por = app.jwt_claim('employee_id')
      )
    )
  );

-- Procedimientos
ALTER TABLE public.procedimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS procedimientos_insert_policy_v2 ON public.procedimientos;
CREATE POLICY procedimientos_insert_policy_v2 ON public.procedimientos
  FOR INSERT
  WITH CHECK (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND departamento_id = app.jwt_claim('department_id'))
  );

DROP POLICY IF EXISTS procedimientos_update_policy_v2 ON public.procedimientos;
CREATE POLICY procedimientos_update_policy_v2 ON public.procedimientos
  FOR UPDATE
  USING (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND public.procedimientos.departamento_id = app.jwt_claim('department_id'))
  )
  WITH CHECK (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND departamento_id = app.jwt_claim('department_id'))
  );

DROP POLICY IF EXISTS procedimientos_delete_policy_v2 ON public.procedimientos;
CREATE POLICY procedimientos_delete_policy_v2 ON public.procedimientos
  FOR DELETE
  USING ( app.jwt_claim('role') IN ('admin','sysadmin') );

-- Empleados
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS empleados_update_policy_v2 ON public.empleados;
CREATE POLICY empleados_update_policy_v2 ON public.empleados
  FOR UPDATE
  USING (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND (public.empleados.organizacion ->> 'departamento') = app.jwt_claim('department_id'))
    OR (app.jwt_claim('role') = 'employee' AND public.empleados.id = app.jwt_claim('employee_id'))
  )
  WITH CHECK (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND (organizacion ->> 'departamento') = app.jwt_claim('department_id'))
    OR (app.jwt_claim('role') = 'employee' AND id = app.jwt_claim('employee_id'))
  );

-- 2) Simple verification: insert test rows (ids chosen to avoid collision)

-- EMPLOYEE test
SELECT set_config('jwt.claims.employee_id','EMP-TEST-VERIFY', true);
SELECT set_config('jwt.claims.role','employee', true);
SELECT set_config('jwt.claims.department_id','DEPT-TEST', true);

INSERT INTO public.tickets (id, codigo_actividad, codigo_linea_trabajo, codigo_procedimiento, titulo, tiempo_estimado, asignado_por)
VALUES ('T-RLS-VERIFY-EMP', 'ACT-CAMPANA-DIGITAL-001', 'LT-PREPARACION', 'PROC-001', 'RLS Verify Insert (employee)', 1, 'EMP-TEST-VERIFY')
ON CONFLICT DO NOTHING;

-- DIRECTOR test (dept must match procedimiento)
SELECT set_config('jwt.claims.employee_id','EMP-DIR-VERIFY', true);
SELECT set_config('jwt.claims.role','director', true);
SELECT set_config('jwt.claims.department_id','DEPT-MARKETING', true);

INSERT INTO public.tickets (id, codigo_actividad, codigo_linea_trabajo, codigo_procedimiento, titulo, tiempo_estimado, asignado_por)
VALUES ('T-RLS-VERIFY-DIR', 'ACT-CAMPANA-DIGITAL-001', 'LT-PREPARACION', 'PROC-001', 'RLS Verify Insert (director)', 1, 'EMP-DIR-VERIFY')
ON CONFLICT DO NOTHING;

-- Show verification rows
SELECT id, codigo_procedimiento, titulo, asignado_por, fecha_creacion FROM public.tickets WHERE id LIKE 'T-RLS-VERIFY-%';

-- Cleanup test rows
DELETE FROM public.tickets WHERE id IN ('T-RLS-VERIFY-EMP','T-RLS-VERIFY-DIR');

COMMIT;

-- End of file
