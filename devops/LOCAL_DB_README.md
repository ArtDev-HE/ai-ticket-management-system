Local development Postgres for RLS testing
========================================

This directory contains files to run a local Postgres instance with a seeded schema to test Row-Level Security (RLS) and JWT-driven behavior safely.

Files added:
- `docker-compose.yml` (root): starts Postgres and mounts `devops/` for init scripts.
- `devops/schema.sql`: schema, helper functions, and `_v2` RLS policies (idempotent).
- `devops/seed.sql`: sample data (empleados, procedimientos, sample ticket).
- `devops/run_local_db.ps1`: PowerShell helper to start the container and apply schema/seed.

Quick start (PowerShell, from repo root):

Start and seed local DB:
.
\devops\run_local_db.ps1

Connect with psql:
psql -h localhost -p 55432 -U postgres -d postgres

To remove the local DB and data:

.\devops\run_local_db.ps1 -TearDown

Testing notes:
- The local DB listens on port 55432. Connection string: postgres://postgres:localpassword@localhost:55432/postgres.
- This setup does not run PostgREST or Supabase auth. Use psql with SET LOCAL or set_config('jwt.claims.x', 'value', true) inside a transaction to simulate claims for deterministic tests, or add PostgREST later if you need HTTP-level integration.
- After starting the DB, you can run the JWT-based tests by creating tokens signed with a local secret and running PostgREST if you choose to add it.

If you want, I can add a PostgREST container and a small Node helper to issue JWTs signed with the same secret for end-to-end HTTP tests.
