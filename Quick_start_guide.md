# Quick Start Guide

This short guide helps a developer get the project running locally and continue work in the next session. Commands are PowerShell-friendly (Windows).

Last updated: 2025-10-08

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
cd c:\Users\Usuario\ticket-system-backend\frontend\ai_management_ticket_system
npm run dev -- -p 3001
# Starts Next.js app on port 3001
```


## Useful developer commands

- TypeScript check (frontend):

```powershell
cd frontend\ai_management_ticket_system
npx -y tsc --noEmit
```

- Run smoke tests (frontend script that exercises the API):

```powershell
cd frontend\ai_management_ticket_system
node scripts\smokeTests.js
```

- Run quick linter (if configured):

```powershell
cd frontend\ai_management_ticket_system
npm run lint
```


## Debugging tips

- If frontend cannot reach backend: verify backend process is listening on port 3000 and CORS allows `http://localhost:3001`.
- If a smoke test fails with 404 for a procedure, the smoke script now attempts to auto-create the missing procedure; ensure backend writable DB connections are configured.
- If charts don't render: open the browser console to see whether a visualization key from AI or analytics matches a key in `frontend/src/config/VisualizationRegistry.ts`. Also confirm the descriptor `data` contains the `requiredFields` for that key.


## Local developer flows

- Dev login: POST `/api/auth/dev-login` (used by `frontend/src/services/auth.ts`) returns a static dev token used during local development.
- Change dev `currentEmployeeId` quickly: use the input control in the HeaderBar; it updates `UserContext` and `EmployeeInfoPanel` immediately.
- Chat history persistence: stored in `localStorage` key `ai_chat_messages`.


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

