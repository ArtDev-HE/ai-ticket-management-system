Last updated: 2025-10-09

# DEV / Pre-production Cleanup Checklist

This file captures temporary, dev-only, or test-only artifacts that were introduced during development. It lists each temporary item, where it lives, why it's temporary, and suggested remediation. Use this as the authoritative pre-prod cleanup checklist before any production release.

Overview
--------
We added a number of developer conveniences to accelerate local development and testing. Those are useful for local work but must be removed, gated, or hardened before production. This document is the canonical list of what to remove or harden and how to do it.

High-level acceptance criteria
-----------------------------
Every dev-only artifact is either removed, gated behind an explicit environment flag that refuses to run in production, or moved to a `devops/` or `tests/` area and documented.
No hard-coded secrets remain in the codebase. `JWT_SECRET` and `CHAT_EXPORT_SECRET` (or equivalents) must be required in production; code should not fall back to development secrets.
LocalStorage JWT usage is replaced with a secure cookie strategy (HttpOnly, Secure) in production builds or documented exceptions are accepted by security reviewers.
CI/PR checks detect known dev tokens, placeholder IDs (like `EMP-TEST`/`EMP-001`), and dev-only env flags in branches targeted for production.
The `docs/DEV_PREPROD_CHECKLIST.md` file is finalized and linked in the release checklist.

Detailed items (what to remove/gate/replace)
-------------------------------------------

1) Dev auth shims & tokens
	 - Files / places:
		 - `src/routes/auth.js` (contains `dev-login` and a dev fast-path that issues permissive JWTs).
		 - `frontend/ai_management_ticket_system/src/services/auth.ts` (stores token in `localStorage` in dev flows and supports dev login).
		 - `frontend/ai_management_ticket_system/scripts/smokeTests.js` uses a static `DEV_TOKEN_FALLBACK`.
	 - Why temporary: these bypass real authentication flows and would allow unauthorized access if left enabled in production.
	 - Suggested remediation:
		 - Remove the `dev-login` endpoint or gate it with a strong guard that refuses to run when `NODE_ENV==='production'`.
		 - Replace localStorage client-side tokens with secure HttpOnly cookies for production flows. Document a migration strategy for auth in the frontend.
		 - Remove the static token fallback or make it a test-only fixture that is never merged to release branches.

2) Dev users & seed scripts
	 - Files / places:
		 - `scripts/dev_users.json` (stores dev user records with hashed passwords for local testing).
		 - `scripts/seed_emp_test.js` (seeds EMP-TEST tickets and dev users)
		 - package.json dev scripts: `dev:seed:emp-test` (moved to `devops/`).
	 - Why temporary: these scripts alter the database and create test users/data; they must not run in production or CI unless explicitly targeted to a disposable test DB.
	 - Suggested remediation:
		 - Keep them in `devops/` or `tests/`, require `ALLOW_DEV_SEEDS=true` to run, and refuse to run when `NODE_ENV==='production'`.
		 - Document how to run them and ensure they target a separate test/staging database (not production).

	    TODO: Upgrade password hashing in production to a stronger algorithm (argon2 or native bcrypt) and increase cost/work factor. The current use of `bcryptjs` is acceptable for development because it avoids native build requirements; however, before production, replace `bcryptjs` with `argon2` or `bcrypt` (native) and set an appropriate cost parameter (e.g., argon2 time/memory or bcrypt rounds >= 12). Add this TODO to the release checklist and track it as a hard requirement for production deploys.

3) Mock AI & orchestration helpers
	 - Files / places:
		 - `frontend/ai_management_ticket_system/src/services/ai.ts` (contains mocked AI responses for development).
		 - `src/routes/ai.js` has a `USE_N8N_MOCK` path and logic that can route to a local mock n8n server.
		 - `devops/test_ai_validation.js` and `devops/smokeTests_frontend.js` are dev-only harnesses.
	 - Why temporary: mock logic is intended for offline development and would produce incorrect outputs if exercised in production.
	 - Suggested remediation:
		 - Gate mocks behind explicit env variables and ensure they default to disabled in production.
		 - Prefer wiring mock servers into test suites (Jest/Mocha) rather than runtime code in `src/`.

4) Synthetic analytics & special-casing
	 - Files / places:
		 - `src/routes/analytics.js` contains synthetic data injections and special-cases for `EMP-001` and `EMP-TEST` to ensure the UI shows interesting charts.
	 - Why temporary: synthetic injections hide data quality issues and can mislead stakeholders.
	 - Suggested remediation:
		 - Remove special-case logic or gate it behind `USE_DEV_SYNTHETIC=true` and assert it is off in production.
		 - Provide a separate seeding/mirroring process to create realistic staging data.

5) Dev-only chat export/import and signing helpers
	 - Files / places:
		 - `src/routes/chat.js` (implements server-side HMAC signing for exported chat markdown and verifies imports).
		 - Note: the signing uses `CHAT_EXPORT_SECRET` and may fall back to `JWT_SECRET` or a dev secret if env not set.
	 - Why temporary: the flow is useful for dev but must be configured securely for production — especially key management and verification.
	 - Suggested remediation:
		 - Require `CHAT_EXPORT_SECRET` to be provided in production (fail fast on startup if absent).
		 - Audit the export format, signature algorithm, and ensure no sensitive data is included in exports.

6) Debug UI and client fallbacks
	 - Files / places:
		 - `frontend/ai_management_ticket_system/src/components/HeaderBar.tsx` (previously contained a Set Employee control and debug buttons).
		 - `frontend/ai_management_ticket_system/src/components/ChatHistory.tsx` (Import/Export debug UI present during dev).
		 - UI components contain client-side fallbacks to render when server data is missing.
	 - Why temporary: these facilitate faster manual testing but can leak data or create UX edge cases in prod.
	 - Suggested remediation:
		 - Remove or gate debug UI behind `NEXT_PUBLIC_DEV_UI=true` (default off) and remove Set Employee controls from production builds.
		 - Replace fallbacks with clear loading states or server-driven mocks only used in staging/test environments.

7) Local storage and token handling
	 - Keys in use: `auth_token`, `current_employee`, `ai_chat_messages` (legacy per-employee keys)
	 - Why temporary: storing JWTs in `localStorage` is vulnerable to XSS. For production, prefer HttpOnly cookies + CSRF protection and refresh token rotation.
	 - Suggested remediation:
		 - Design and implement cookie-based auth before production release; document migration steps. If not possible now, ensure strong CSP and review for XSS risks.

8) Dev-only npm scripts and test harnesses
	 - Files / places: `devops/*`, `scripts/*` (guarded placeholders), and package.json dev scripts.
	 - Suggested remediation:
		 - Keep dev scripts under `devops/` and mark them explicitly `dev:*` in package.json. Ensure CI ignores these unless explicitly invoked in a test job that targets a disposable environment.

9) Hard-coded placeholder IDs and test data
	 - Examples: `EMP-TEST`, `EMP-001`, temporary ticket codes.
	 - Suggested remediation:
		 - Remove any production logic that depends on these IDs. Use fixtures in test DBs only.

10) Logging and console noise
	 - Files / places: ad-hoc `console.log` / `console.warn` sprinkled across backend and frontend for debugging.
	 - Suggested remediation:
		 - Replace with structured logger (pino or winston), set log levels, and ensure sensitive data is never logged. Configure different log levels for dev/staging/prod.

Quick commands (copyable) — SAFE DEVOPS USAGE
------------------------------------------------
Run dev seed (explicit opt-in):

```powershell
$Env:ALLOW_DEV_SEEDS='true'; node devops/seed_emp_test.js
```

Run dev AI validation (explicit opt-in):

```powershell
$Env:ALLOW_DEV_TESTS='true'; node devops/test_ai_validation.js
```

Run frontend smoke tests (explicit opt-in):

```powershell
$Env:ALLOW_DEV_TESTS='true'; node devops/smokeTests_frontend.js
```

CI / PR checks to add (recommended)
---------------------------------
- A simple grep-based check in CI that fails PRs if these words/flags appear in files on the branch: `dev-token-x-please-replace`, `EMP-TEST`, `EMP-001`, `USE_DEV_SYNTHETIC=true`, `ALLOW_DEV_SEEDS=true`.
- A startup assertion in `src/server.js` that refuses to start in production unless `JWT_SECRET` and `CHAT_EXPORT_SECRET` are set.

Acceptance & Release gate
-------------------------
Before marking a release candidate as ready for production, complete the following:

1. Run the CI pre-prod scan and fix any findings.
2. Ensure `JWT_SECRET` and `CHAT_EXPORT_SECRET` are configured in the deployment environment (and remove any dev fallback secrets).
3. Confirm no dev-only UI elements are visible in a production build.
4. Run the devops seed/smoke scripts only against a disposable test DB and verify they refuse to run without explicit env guards.
5. Merge a final PR that documents the remediation and changes in `docs/DEV_PREPROD_CHECKLIST.md`.

If you want, I can now:
- Expand this checklist with per-file remediation steps and suggested code snippets (e.g., how to require env vars at startup), or
- Add a simple CI job (GitHub Actions) that runs the grep scan on PRs and reports failures.

Select one and I'll implement it next.
Last updated: 2025-10-09

# DEV / Pre-production Cleanup Checklist

This file captures temporary, dev-only, or test-only artifacts that were introduced during development. It lists each temporary item, where it lives, why it's temporary, and suggested remediation. Use this as the authoritative pre-prod cleanup checklist before any production release.

Overview
--------
We added a number of developer conveniences to accelerate local development and testing. Those are useful for local work but must be removed, gated, or hardened before production. This document is the canonical list of what to remove or harden and how to do it.

High-level acceptance criteria
-----------------------------
- Every dev-only artifact is either removed, gated behind an explicit environment flag that refuses to run in production, or moved to a `devops/` or `tests/` area and documented.
- No hard-coded secrets remain in the codebase. `JWT_SECRET` and `CHAT_EXPORT_SECRET` (or equivalents) must be required in production; code should not fall back to development secrets.
- LocalStorage JWT usage is replaced with a secure cookie strategy (HttpOnly, Secure) in production builds or documented exceptions are accepted by security reviewers.
- CI/PR checks detect known dev tokens, placeholder IDs (like `EMP-TEST`/`EMP-001`), and dev-only env flags in branches targeted for production.
- The `docs/DEV_PREPROD_CHECKLIST.md` file is finalized and linked in the release checklist.

Detailed items (what to remove/gate/replace)
-------------------------------------------

1) Dev auth shims & tokens
	 - Files / places:
		 - `src/routes/auth.js` (contains `dev-login` and a dev fast-path that issues permissive JWTs).
		 - `frontend/ai_management_ticket_system/src/services/auth.ts` (stores token in `localStorage` in dev flows and supports dev login).
		 - `frontend/ai_management_ticket_system/scripts/smokeTests.js` uses a static `DEV_TOKEN_FALLBACK`.
	 - Why temporary: these bypass real authentication flows and would allow unauthorized access if left enabled in production.
	 - Suggested remediation:
		 - Remove the `dev-login` endpoint or gate it with a strong guard that refuses to run when `NODE_ENV==='production'`.
		 - Replace localStorage client-side tokens with secure HttpOnly cookies for production flows. Document a migration strategy for auth in the frontend.
		 - Remove the static token fallback or make it a test-only fixture that is never merged to release branches.

2) Dev users & seed scripts
	 - Files / places:
		 - `scripts/dev_users.json` (stores dev user records with hashed passwords for local testing).
		 - `scripts/seed_emp_test.js` (seeds EMP-TEST tickets and dev users)
		 - package.json dev scripts: `dev:seed:emp-test` (moved to `devops/`).
	 - Why temporary: these scripts alter the database and create test users/data; they must not run in production or CI unless explicitly targeted to a disposable test DB.
	 - Suggested remediation:
		 - Keep them in `devops/` or `tests/`, require `ALLOW_DEV_SEEDS=true` to run, and refuse to run when `NODE_ENV==='production'`.
		 - Document how to run them and ensure they target a separate test/staging database (not production).

	    TODO: Upgrade password hashing in production to a stronger algorithm (argon2 or native bcrypt) and increase cost/work factor. The current use of `bcryptjs` is acceptable for development because it avoids native build requirements; however, before production, replace `bcryptjs` with `argon2` or `bcrypt` (native) and set an appropriate cost parameter (e.g., argon2 time/memory or bcrypt rounds >= 12). Add this TODO to the release checklist and track it as a hard requirement for production deploys.

3) Mock AI & orchestration helpers
	 - Files / places:
		 - `frontend/ai_management_ticket_system/src/services/ai.ts` (contains mocked AI responses for development).
		 - `src/routes/ai.js` has a `USE_N8N_MOCK` path and logic that can route to a local mock n8n server.
		 - `devops/test_ai_validation.js` and `devops/smokeTests_frontend.js` are dev-only harnesses.
	 - Why temporary: mock logic is intended for offline development and would produce incorrect outputs if exercised in production.
	 - Suggested remediation:
		 - Gate mocks behind explicit env variables and ensure they default to disabled in production.
		 - Prefer wiring mock servers into test suites (Jest/Mocha) rather than runtime code in `src/`.

4) Synthetic analytics & special-casing
	 - Files / places:
		 - `src/routes/analytics.js` contains synthetic data injections and special-cases for `EMP-001` and `EMP-TEST` to ensure the UI shows interesting charts.
	 - Why temporary: synthetic injections hide data quality issues and can mislead stakeholders.
	 - Suggested remediation:
		 - Remove special-case logic or gate it behind `USE_DEV_SYNTHETIC=true` and assert it is off in production.
		 - Provide a separate seeding/mirroring process to create realistic staging data.

5) Dev-only chat export/import and signing helpers
	 - Files / places:
		 - `src/routes/chat.js` (implements server-side HMAC signing for exported chat markdown and verifies imports).
		 - Note: the signing uses `CHAT_EXPORT_SECRET` and may fall back to `JWT_SECRET` or a dev secret if env not set.
	 - Why temporary: the flow is useful for dev but must be configured securely for production — especially key management and verification.
	 - Suggested remediation:
		 - Require `CHAT_EXPORT_SECRET` to be provided in production (fail fast on startup if absent).
		 - Audit the export format, signature algorithm, and ensure no sensitive data is included in exports.

6) Debug UI and client fallbacks
	 - Files / places:
		 - `frontend/ai_management_ticket_system/src/components/HeaderBar.tsx` (previously contained a Set Employee control and debug buttons).
		 - `frontend/ai_management_ticket_system/src/components/ChatHistory.tsx` (Import/Export debug UI present during dev).
		 - UI components contain client-side fallbacks to render when server data is missing.
	 - Why temporary: these facilitate faster manual testing but can leak data or create UX edge cases in prod.
	 - Suggested remediation:
		 - Remove or gate debug UI behind `NEXT_PUBLIC_DEV_UI=true` (default off) and remove Set Employee controls from production builds.
		 - Replace fallbacks with clear loading states or server-driven mocks only used in staging/test environments.

7) Local storage and token handling
	 - Keys in use: `auth_token`, `current_employee`, `ai_chat_messages` (legacy per-employee keys)
	 - Why temporary: storing JWTs in `localStorage` is vulnerable to XSS. For production, prefer HttpOnly cookies + CSRF protection and refresh token rotation.
	 - Suggested remediation:
		 - Design and implement cookie-based auth before production release; document migration steps. If not possible now, ensure strong CSP and review for XSS risks.

8) Dev-only npm scripts and test harnesses
	 - Files / places: `devops/*`, `scripts/*` (guarded placeholders), and package.json dev scripts.
	 - Suggested remediation:
		 - Keep dev scripts under `devops/` and mark them explicitly `dev:*` in package.json. Ensure CI ignores these unless explicitly invoked in a test job that targets a disposable environment.

9) Hard-coded placeholder IDs and test data
	 - Examples: `EMP-TEST`, `EMP-001`, temporary ticket codes.
	 - Suggested remediation:
		 - Remove any production logic that depends on these IDs. Use fixtures in test DBs only.

10) Logging and console noise
	 - Files / places: ad-hoc `console.log` / `console.warn` sprinkled across backend and frontend for debugging.
	 - Suggested remediation:
		 - Replace with structured logger (pino or winston), set log levels, and ensure sensitive data is never logged. Configure different log levels for dev/staging/prod.

Quick commands (copyable) — SAFE DEVOPS USAGE
------------------------------------------------
Run dev seed (explicit opt-in):

```powershell
$Env:ALLOW_DEV_SEEDS='true'; node devops/seed_emp_test.js
```

Run dev AI validation (explicit opt-in):

```powershell
$Env:ALLOW_DEV_TESTS='true'; node devops/test_ai_validation.js
```

Run frontend smoke tests (explicit opt-in):

```powershell
$Env:ALLOW_DEV_TESTS='true'; node devops/smokeTests_frontend.js
```

CI / PR checks to add (recommended)
---------------------------------
- A simple grep-based check in CI that fails PRs if these words/flags appear in files on the branch: `dev-token-x-please-replace`, `EMP-TEST`, `EMP-001`, `USE_DEV_SYNTHETIC=true`, `ALLOW_DEV_SEEDS=true`.
- A startup assertion in `src/server.js` that refuses to start in production unless `JWT_SECRET` and `CHAT_EXPORT_SECRET` are set.

Acceptance & Release gate
-------------------------
Before marking a release candidate as ready for production, complete the following:

1. Run the CI pre-prod scan and fix any findings.
2. Ensure `JWT_SECRET` and `CHAT_EXPORT_SECRET` are configured in the deployment environment (and remove any dev fallback secrets).
3. Confirm no dev-only UI elements are visible in a production build.
4. Run the devops seed/smoke scripts only against a disposable test DB and verify they refuse to run without explicit env guards.
5. Merge a final PR that documents the remediation and changes in `docs/DEV_PREPROD_CHECKLIST.md`.

If you want, I can now:
- Expand this checklist with per-file remediation steps and suggested code snippets (e.g., how to require env vars at startup), or
- Add a simple CI job (GitHub Actions) that runs the grep scan on PRs and reports failures.

Select one and I'll implement it next.

