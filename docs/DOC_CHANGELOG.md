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
  - Verification:
    - UI manually tested in-browser; chat and visualization panels render correctly.
    - Dev smoke tests executed and passed; commits pushed to remote `main`.


## Previous
- 2025-10-08: Initial draft and session updates (various files)


> Note: Use reviewer initials (e.g., JS) and date when reviewing or approving further doc changes.
