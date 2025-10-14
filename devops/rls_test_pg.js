#!/usr/bin/env node
// devops/rls_test_pg.js
// Deterministic RLS tests using `pg` and session GUCs (set_config).
// Usage:
// 1) Install deps: npm install pg
// 2) Set env: DATABASE_URL=postgres://user:pass@host:port/db
// 3) Run: node devops/rls_test_pg.js

const { Client } = require('pg');

async function run() {
  const conn = process.env.DATABASE_URL;
  if (!conn) {
    console.error('Set DATABASE_URL env var first (postgres://user:pass@host:port/db)');
    process.exit(1);
  }
  const client = new Client({ connectionString: conn });
  await client.connect();

  // helper to run a query and show results
  async function q(sql, params) {
    try {
      const res = await client.query(sql, params);
      console.log('SQL:', sql);
      console.log('Rows:', res.rows);
      return res;
    } catch (e) {
      console.error('SQL error:', e.message);
      return { error: e };
    }
  }

  // Clean up any previous test rows
  await q("DELETE FROM public.tickets WHERE id LIKE 'T-RLS-PG-%'");

  // Admin test: set claims to admin and attempt insert
  console.log('\n--- ADMIN tests ---');
  await q("SELECT set_config('jwt.claims.role','admin', true)");
  await q("INSERT INTO public.tickets (id, codigo_actividad, codigo_linea_trabajo, codigo_procedimiento, titulo, descripcion, asignado_por, tiempo_estimado) VALUES ('T-RLS-PG-ADMIN-1','ACT-1','LT-1','PROC-1','admin insert','', 'EMP-ADMIN', 10) RETURNING *");

  // Director test: set claims to director/department and attempt insert
  console.log('\n--- DIRECTOR tests ---');
  await q("SELECT set_config('jwt.claims.role','director', true)");
  await q("SELECT set_config('jwt.claims.department_id','DEP-1', true)");
  console.log('Check procedimiento belongs to department DEP-1:');
  await q("SELECT app.procedimiento_belongs_to_department('PROC-1', 'DEP-1') AS belongs");
  await q("INSERT INTO public.tickets (id, codigo_actividad, codigo_linea_trabajo, codigo_procedimiento, titulo, descripcion, asignado_por, tiempo_estimado) VALUES ('T-RLS-PG-DIR-1','ACT-1','LT-1','PROC-1','director insert','', 'EMP-DIR', 20) RETURNING *");

  // Employee test: set claims to employee and attempt insert assigned to them
  console.log('\n--- EMPLOYEE tests ---');
  await q("SELECT set_config('jwt.claims.role','employee', true)");
  await q("SELECT set_config('jwt.claims.employee_id','EMP-TEST-1', true)");
  await q("INSERT INTO public.tickets (id, codigo_actividad, codigo_linea_trabajo, codigo_procedimiento, titulo, descripcion, asignado_por, tiempo_estimado) VALUES ('T-RLS-PG-EMP-1','ACT-1','LT-1','PROC-1','employee insert','', 'EMP-TEST-1', 15) RETURNING *");

  // Employee should NOT be able to insert assigned to someone else
  await q("INSERT INTO public.tickets (id, codigo_actividad, codigo_linea_trabajo, codigo_procedimiento, titulo, descripcion, asignado_por, tiempo_estimado) VALUES ('T-RLS-PG-EMP-2','ACT-1','LT-1','PROC-1','employee insert denied','', 'EMP-OTHER', 15) RETURNING *");

  // Cleanup
  console.log('\n--- Cleanup ---');
  await q("DELETE FROM public.tickets WHERE id LIKE 'T-RLS-PG-%'");

  await client.end();
  console.log('PG tests complete');
}

run().catch(err => { console.error(err); process.exit(1); });
