-- devops/seed_realistic.sql
-- More realistic seed: departments, empleados with roles, procedimientos, actividades, and tickets

-- Departments
INSERT INTO public.departamentos (id, nombre) VALUES
  ('DEPT-MARKETING', 'Marketing'),
  ('DEPT-SALES', 'Sales'),
  ('DEPT-IT', 'IT')
ON CONFLICT DO NOTHING;

-- Empleados with simple role metadata in a metadata jsonb
INSERT INTO public.empleados (id, nombre) VALUES
  ('EMP-001', 'Alice Marketing'),
  ('EMP-002', 'Bob Sales'),
  ('EMP-DIR-MKT', 'Director Marketing'),
  ('EMP-IT-ADMIN', 'IT Admin'),
  ('EMP-TEST-1', 'Test User')
ON CONFLICT DO NOTHING;

-- Procedimientos
INSERT INTO public.procedimientos (id, codigo, nombre, departamento_id) VALUES
  ('proc-1', 'P-001', 'Investigación de Mercado', 'DEPT-MARKETING'),
  ('proc-2', 'P-002', 'Análisis de Competencia', 'DEPT-MARKETING'),
  ('proc-3', 'P-SALES-1', 'Gestión de Leads', 'DEPT-SALES'),
  ('proc-4', 'P-IT-1', 'Provisionamiento', 'DEPT-IT'),
  ('proc-5', 'P-TEST', 'Test Procedure', 'DEPT-MARKETING')
ON CONFLICT DO NOTHING;

-- Actividades
INSERT INTO public.actividades (id, codigo, nombre) VALUES
  ('ACT-1', 'ACT-RLS-TEST', 'RLS Test Activity')
ON CONFLICT DO NOTHING;

-- Tickets: some owned by Marketing, some by Sales
INSERT INTO public.tickets (codigo_actividad, codigo_linea_trabajo, codigo_procedimiento, titulo, asignado_por, asignado_a)
VALUES
  ('ACT-RLS-TEST', 'LT-1', 'P-001', 'Marketing analysis task', 'EMP-001', 'EMP-002'),
  ('ACT-RLS-TEST', 'LT-1', 'P-002', 'Competitor research', 'EMP-DIR-MKT', NULL),
  ('ACT-RLS-TEST', 'LT-2', 'P-SALES-1', 'Call lead', 'EMP-002', 'EMP-002'),
  ('ACT-RLS-TEST', 'LT-3', 'P-TEST', 'Seeded test for RLS', 'EMP-TEST-1', NULL)
ON CONFLICT DO NOTHING;
