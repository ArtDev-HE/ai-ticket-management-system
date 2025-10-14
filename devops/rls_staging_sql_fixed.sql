-- Staging-ready RLS SQL (fixed): helper functions + corrected policies
-- Review before running. Do NOT run in production without review & backup.

-- 0) Helper functions
CREATE SCHEMA IF NOT EXISTS app;

-- Read JWT claims from GUCs
CREATE OR REPLACE FUNCTION app.jwt_claim(claim_name text)
RETURNS text
LANGUAGE SQL STABLE
AS $$
  SELECT current_setting('jwt.claims.' || claim_name, true);
$$;

-- Helper to check whether a procedimiento code belongs to a department
CREATE OR REPLACE FUNCTION app.procedimiento_belongs_to_department(proc_code text, dept text)
RETURNS boolean
LANGUAGE SQL STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.procedimientos p
    WHERE p.codigo = proc_code
      AND p.departamento_id = dept
  );
$$;

-- 1) TICKETS RLS (corrected)
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- SELECT policy: use existing row columns (no NEW)
CREATE POLICY tickets_select_policy ON public.tickets
  FOR SELECT
  USING (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (
      app.jwt_claim('role') = 'director'
      AND EXISTS (
        SELECT 1
        FROM public.procedimientos p
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
  );

-- INSERT policy: use WITH CHECK and NEW; rely on helper function to avoid complex subquery parsing issues
CREATE POLICY tickets_insert_policy ON public.tickets
  FOR INSERT
  WITH CHECK (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (
      app.jwt_claim('role') = 'director'
      AND app.procedimiento_belongs_to_department(NEW.codigo_procedimiento, app.jwt_claim('department_id'))
    )
    OR (
      app.jwt_claim('role') = 'employee'
      AND (
        NEW.asignado_por = app.jwt_claim('employee_id')
        OR NEW.asignado_a = app.jwt_claim('employee_id')
      )
    )
  );

-- UPDATE policy: USING checks existing row; WITH CHECK validates NEW
CREATE POLICY tickets_update_policy ON public.tickets
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
      AND app.procedimiento_belongs_to_department(NEW.codigo_procedimiento, app.jwt_claim('department_id'))
    )
    OR (
      app.jwt_claim('role') = 'employee'
      AND (
        NEW.asignado_a = app.jwt_claim('employee_id')
        OR NEW.asignado_por = app.jwt_claim('employee_id')
      )
    )
  );

-- DELETE policy: use existing row columns only (no NEW)
CREATE POLICY tickets_delete_policy ON public.tickets
  FOR DELETE
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
      AND public.tickets.asignado_por = app.jwt_claim('employee_id')
    )
  );


-- 2) PROCEDIMIENTOS RLS (corrected)
ALTER TABLE public.procedimientos ENABLE ROW LEVEL SECURITY;

CREATE POLICY procedimientos_select_policy ON public.procedimientos
  FOR SELECT
  USING (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') IN ('director','employee') AND public.procedimientos.departamento_id = app.jwt_claim('department_id'))
  );

CREATE POLICY procedimientos_insert_policy ON public.procedimientos
  FOR INSERT
  WITH CHECK (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND NEW.departamento_id = app.jwt_claim('department_id'))
  );

CREATE POLICY procedimientos_update_policy ON public.procedimientos
  FOR UPDATE
  USING (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND public.procedimientos.departamento_id = app.jwt_claim('department_id'))
  )
  WITH CHECK (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND NEW.departamento_id = app.jwt_claim('department_id'))
  );

CREATE POLICY procedimientos_delete_policy ON public.procedimientos
  FOR DELETE
  USING (
    app.jwt_claim('role') IN ('admin','sysadmin')
  );


-- 3) EMPLEADOS RLS (corrected)
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

CREATE POLICY empleados_select_policy ON public.empleados
  FOR SELECT
  USING (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND (public.empleados.organizacion ->> 'departamento') = app.jwt_claim('department_id'))
    OR (app.jwt_claim('role') = 'employee' AND public.empleados.id = app.jwt_claim('employee_id'))
  );

CREATE POLICY empleados_insert_policy ON public.empleados
  FOR INSERT
  WITH CHECK (
    app.jwt_claim('role') IN ('admin','sysadmin')
  );

CREATE POLICY empleados_update_policy ON public.empleados
  FOR UPDATE
  USING (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND (public.empleados.organizacion ->> 'departamento') = app.jwt_claim('department_id'))
    OR (app.jwt_claim('role') = 'employee' AND public.empleados.id = app.jwt_claim('employee_id'))
  )
  WITH CHECK (
    app.jwt_claim('role') IN ('admin','sysadmin')
    OR (app.jwt_claim('role') = 'director' AND NEW.organizacion ->> 'departamento' = app.jwt_claim('department_id'))
    OR (app.jwt_claim('role') = 'employee' AND NEW.id = app.jwt_claim('employee_id'))
  );

CREATE POLICY empleados_delete_policy ON public.empleados
  FOR DELETE
  USING (
    app.jwt_claim('role') IN ('admin','sysadmin')
  );

-- End of file
