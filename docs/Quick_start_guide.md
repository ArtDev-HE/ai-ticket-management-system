# Quick Start Guide — v1.1

This short guide helps a developer get the project running locally and continue work in the next session. Commands are PowerShell-friendly (Windows).
## Local developer flows

- Dev login: POST `/api/auth/dev-login` (used by `frontend/src/services/auth.ts`) returns a static dev token used during local development.
 - Change dev `currentEmployeeId` quickly: use the input control in the HeaderBar; it updates `UserContext` and `EmployeeInfoPanel` immediately.
 - Chat history persistence: stored in `sessionStorage` key `ai_chat_messages:${employeeId}` and capped at 500 messages. Exported MD files embed a signed JSON payload that can be re-imported via the UI.
 - Dev login: POST `/api/auth/dev-login` (used by `frontend/src/services/auth.ts`) returns a static dev token used during local development. Note: we now persist the token and `currentEmployeeId` in sessionStorage by default in recent dev changes (session lifetime tied to the browser tab). For production, migrate to HttpOnly cookies.
 - Change dev `currentEmployeeId` quickly: use the input control in the HeaderBar; it updates `UserContext` and `EmployeeInfoPanel` immediately.
 - Chat history persistence: stored in `sessionStorage` namespaced per employee under keys like `ai_chat_messages:${employeeId}` and capped at 500 messages. Exported MD files embed a signed JSON payload that can be re-imported via the UI.
# Quick Start Guide — v1.1

This short guide helps a developer get the project running locally and continue work in the next session. Commands are PowerShell-friendly (Windows).

Last updated: 2025-10-08
Last reviewed by: JS (2025-10-10)

## Prerequisites

- Node.js 18+ and npm installed
- PostgreSQL (Supabase or local) with credentials in `.env` for backend
- Recommended: VS Code with TypeScript & ESLint extensions

## Ports

- Backend: 3000
- Frontend (Next.js): 3001 (recommended)

## Setup (one-time)

1. Clone the repository and open workspace in VS Code.
2. Install backend dependencies (from repo root):

```powershell
cd c:\Users\Usuario\ticket-system-backend
npm install
```

3. Install frontend dependencies:

```powershell
cd frontend\ai_management_ticket_system
npm install
```

4. Create a `.env` for backend (if not present). Example keys:

```
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_NAME=ticket_management_system
PORT=3000
JWT_SECRET=your_jwt_secret_here
CHAT_EXPORT_SECRET=your_chat_export_secret_here
# Frontend env (set this in frontend/.env.local or process environment for dev)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

5. Ensure Postgres is reachable. For Supabase, use the connection string and set `ssl: { rejectUnauthorized: false }` in `src/config/db.js`.


## Run the apps (development)

Open two PowerShell terminals (or use integrated terminal with multiple tabs).

Terminal 1 - Backend

```powershell
cd c:\Users\Usuario\ticket-system-backend
npm run dev
# If your package.json uses nodemon or similar, this will start the backend on port 3000
```

Terminal 2 - Frontend

```powershell
npm run dev -- -p 3001
# Starts Next.js app on port 3001
```



- TypeScript check (frontend):

```powershell
cd frontend\ai_management_ticket_system
```

- Run smoke tests (frontend script that exercises the API):

```powershell
cd frontend\ai_management_ticket_system
node scripts\smokeTests.js
- If Export/Import of chat MD fails: the frontend embeds a signed JSON payload in the exported markdown between the markers
- <!--CHAT_EXPORT_JSON_START and CHAT_EXPORT_JSON_END--> (single-line JSON). The import flow extracts that JSON and posts it to the backend `/api/chat/import` endpoint for server-side verification. If you are testing locally, ensure the backend `CHAT_EXPORT_SECRET` is set and that the frontend `BACKEND_BASE` points to `http://localhost:3000`.

 - Dev login: POST `/api/auth/dev-login` (used by `frontend/src/services/auth.ts`) returns a static dev token used during local development. Note: we now persist the token and `currentEmployeeId` in sessionStorage by default in recent dev changes (session lifetime tied to the browser tab). For production, migrate to HttpOnly cookies.
 - Change dev `currentEmployeeId` quickly: use the input control in the HeaderBar; it updates `UserContext` and `EmployeeInfoPanel` immediately.
 - Chat history persistence: stored in `sessionStorage` namespaced per employee under keys like `ai_chat_messages:${employeeId}` and capped at 500 messages. Exported MD files embed a signed JSON payload that can be re-imported via the UI.
cd frontend\ai_management_ticket_system
npm run lint
- Export / Import: Exported markdown now attempts to obtain a server-side HMAC signature for the exported chat payload and embeds the signed JSON header (between <!--CHAT_EXPORT_JSON_START ... CHAT_EXPORT_JSON_END-->). Import logic will extract that header and POST to `/api/chat/import` for verification and ownership checks.
- Auth/session: During recent dev iterations, frontend uses sessionStorage to hold the in-memory dev token and `currentEmployeeId`. This is intended for dev only; production must use secure cookies.
- Dev scripts moved: dev seeding and test scripts are now under `devops/` and require explicit environment guards such as `ALLOW_DEV_SEEDS=true` or `ALLOW_DEV_TESTS=true` to run.
```


## Debugging tips

- If frontend cannot reach backend: verify backend process is listening on port 3000 and CORS allows `http://localhost:3001`.
- If a smoke test fails with 404 for a procedure, the smoke script now attempts to auto-create the missing procedure; ensure backend writable DB connections are configured.
- If charts don't render: open the browser console to see whether a visualization key from AI or analytics matches a key in `frontend/src/config/VisualizationRegistry.ts`. Also confirm the descriptor `data` contains the `requiredFields` for that key.

- If chat history stops updating: check whether the per-employee sessionStorage cap (500 messages) has been reached for the current `employeeId` (keys like `ai_chat_messages:${employeeId}`).

## Common first-run issues

- CORS errors when the frontend calls the backend? Ensure backend CORS allows `http://localhost:3001` (or your frontend origin). Check the backend logs for CORS rejections.
- Port 3000 in use? Find and stop the occupying process in PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

- Database connection refused? Verify your `.env` settings (DB_HOST/DB_USER/DB_PASSWORD) and that Postgres is listening on the expected interface. For Supabase use the provided connection string.

- Export/Import fails because backend rejects signature? Ensure `CHAT_EXPORT_SECRET` is set in the backend environment and that the frontend `BACKEND_BASE` points to `http://localhost:3000` during local testing.
 - Export/Import fails because backend rejects signature? Ensure `CHAT_EXPORT_SECRET` is set in the backend environment and that the frontend `BACKEND_BASE` or `NEXT_PUBLIC_API_URL` points to `http://localhost:3000` during local testing.


## Local developer flows

- Dev login: POST `/api/auth/dev-login` (used by `frontend/src/services/auth.ts`) returns a static dev token used during local development.
- Change dev `currentEmployeeId` quickly: use the input control in the HeaderBar; it updates `UserContext` and `EmployeeInfoPanel` immediately.
- Chat history persistence: stored in `sessionStorage` key `ai_chat_messages`.

## Test User IDs (Development)

- `EMP-001`: Primary dev user — synthetic trend data is injected for this employee to make charts show meaningful trends during development.
- `EMP-TEST`: Secondary test user — seeded by `devops/seed_emp_test.js` when `ALLOW_DEV_SEEDS=true` is used.
- `PROC-001`: Example/test procedure id — the smoke tests will auto-create this procedure if missing to avoid 404s during testing.


## Quick checklist before committing work

- Run TypeScript checks: `npx -y tsc --noEmit`
- Run smoke tests (optional): `node scripts\smokeTests.js`
- Run linter: `npm run lint` (if configured)
- Commit and push to `main` or a feature branch; open a PR for non-trivial changes.


## Next session suggestions

- Implement JWT auth and `/api/auth/me` to map server sessions to `employeeId` (high priority for production).
- Add unit tests for `visualizationValidator` and `ai.ts` mapping functions.
- Add confirmation modal for clearing chat history.

---

That's it — you're ready to run and continue development. If you want, I can also add a small GitHub Actions workflow to run the TypeScript check and smoke tests on PRs.

## Recent changes (quick reference)

- AI proxy & validation: backend `/api/ai/query` returns dev canned descriptors and forwards to n8n in production. AJV validation is applied and the backend will fallback to a safe descriptor when the returned descriptor fails schema validation.
- Analytics helpers & seeding: dev-only synthetic trend injection for `EMP-001`/`EMP-TEST` and `scripts/seed_emp_test.js` to persist completed tickets for consistent analytics during development.
- Frontend normalizations: `ChatInput` and `AiOutputPanel` now normalize alternate descriptor shapes (e.g., `{date,value}` → `{fecha_actualizado, eficiencia_temporal}`) so charts render reliably.
- Quick test command (backend must be running on port 3000):

```powershell
# Verify backend fallback behavior for malformed n8n responses
cd C:\Users\Usuario\ticket-system-backend
npm run test:ai-validation
```

