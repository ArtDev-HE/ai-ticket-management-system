-- devops/seed.sql
-- Seed data for local RLS testing

-- Empleados
INSERT INTO public.empleados (id, nombre) VALUES
  ('EMP-001', 'Alice'),
  ('EMP-002', 'Bob'),
  ('EMP-TEST-1', 'Test User')
ON CONFLICT DO NOTHING;

-- Procedimientos
INSERT INTO public.procedimientos (id, codigo, nombre, departamento_id) VALUES
  ('proc-1', 'P-001', 'Investigación de Mercado', 'DEPT-MARKETING'),
  ('proc-2', 'P-002', 'Análisis de Competencia', 'DEPT-MARKETING'),
  ('proc-3', 'P-TEST', 'Test Procedure', 'DEPT-MARKETING')
ON CONFLICT DO NOTHING;

-- Sample ticket assigned by EMP-TEST-1 to no one
INSERT INTO public.tickets (codigo_actividad, codigo_linea_trabajo, codigo_procedimiento, titulo, asignado_por)
VALUES ('ACT-RLS-TEST', 'LT-1', 'P-001', 'seeded test ticket', 'EMP-TEST-1')
ON CONFLICT DO NOTHING;
