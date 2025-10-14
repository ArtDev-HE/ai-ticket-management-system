# Documentation Change Log

This changelog tracks documentation updates, reviewer initials, and brief notes.

## 2025-10-10
- Quick Start Guide — v1.1 — Last reviewed by JS
  - Fixed .env example, added NEXT_PUBLIC_API_URL, added Common first-run issues, added Test User IDs, added chat cap troubleshooting.
- System Sync Reference — v1.1 — Last reviewed by JS
  - Added Data Flow Diagram, clarified CHAT_EXPORT_SECRET fallback and dev-convenience warning, added effort estimates.
- DEV_PREPROD_CHECKLIST — v1.1 — Last reviewed by JS
  - Added Risk Assessment table, clarified CHAT_EXPORT_SECRET fallback and production requirement.
- Complete Reference (Updated) — v1.1 — Last reviewed by JS
  - Added ADR section for sessionStorage dev tokens and synchronized notes on export/import signing and session semantics.
 - 2025-10-10 session updates
   - Performed a frontend TypeScript/ESLint pass to remove explicit `any` usages and add runtime guards for AI/visualization payloads.
   - Fixed a parse error in the frontend smoke test harness and executed the smoke tests against a running backend; the smoke tests completed successfully and backend `/health` returned OK.
  - Committed the code and documentation changes to `main` with message: "chore: lint/type fixes and run frontend smoke tests".
  - n8n integration note: added guidance to prefer the Code node (`n8n-nodes-base.code`) with `jsCode`/`pyCode`, and reminder that editor test webhooks are reachable under `/webhook-test/`.
  - Verification:
    - UI manually tested in-browser; chat and visualization panels render correctly.
    - Dev smoke tests executed and passed; commits pushed to remote `main`.

  ## 2025-10-14
  - Database schema snapshots added for `actividades` and `alertas` to documentation files (`complete_reference_updated.md`, `Quick_start_guide.md`, `system_sync_ref.md`, `DEV_PREPROD_CHECKLIST.md`). These are developer-facing notes recorded during an inspection session; run `information_schema` queries against the production database for authoritative metadata. Added by automation during the inspection session.
  - Added `empleados` table snapshot to the same documentation files (columns, indexes and sample rows noted). Observed `organizacion.departamento` values include `DEPT-MARKETING`, `DEPT-CREATIVO`, and `DEPT-TEST`. Row count observed: 7. 
  - Added `tickets` table snapshot to documentation files. Observed columns include `asignado_a` and `asignado_por` (employee ids) and multiple JSONB fields (`hitos`, `kpis`, `metadatos`). Row count observed: 14.
  - RLS planning deferred: RLS policies will be drafted but NOT applied until all seven tables are inspected and the full FK/index map is confirmed across the schema.
  - Added `departamentos` snapshot to docs (sample rows: `DEPT-MARKETING`, `DEPT-CREATIVO`). Row count observed: 2.

  - Added `procedimientos` snapshot to docs. Observed `codigo` unique constraint, `departamento_id` FK and JSONB fields (`recursos`, `kpis`, `responsabilidades`, `validaciones`). Row count observed: 4.
  - Added `lineas_trabajo` snapshot to docs. Observed FK `actividad_id` -> `actividades.id`, `tipo`/`orden` fields and an index `idx_lineas_trabajo_actividad`. Row count observed: 3.


## Previous
- 2025-10-08: Initial draft and session updates (various files)


> Note: Use reviewer initials (e.g., JS) and date when reviewing or approving further doc changes.
