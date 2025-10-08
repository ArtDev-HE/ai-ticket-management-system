Frontend-Backend Integration README

Purpose
-------
Quick guide to run smoke tests that validate the Next.js frontend service layer against the local backend.

Prerequisites
-------------
- Node.js (v16+)
- From the frontend folder: npm install axios uuid
- Backend server running (from repo root): npm run dev or node src/server.js (ensure DB env is set)

Environment
-----------
Create a `.env.local` in the frontend folder (already present in repo) with:

NEXT_PUBLIC_API_URL=http://localhost:3000

This file is read by the smoke test script as well.

Run smoke tests
---------------
Open a terminal in:

c:\Users\Usuario\ticket-system-backend\frontend\ai_management_ticket_system

Then run:

```powershell
npm install axios uuid
node scripts/smokeTests.js
```

What the script does
--------------------
1. Calls GET /health
2. Lists up to 5 tickets (GET /api/tickets)
3. Creates a test ticket (POST /api/tickets)
4. Accepts the ticket (PATCH /api/tickets/:id/accept)
5. Completes the final hito (PATCH /api/tickets/:id/hito)
6. Submits KPIs (POST /api/tickets/:id/kpis) — expects kpis to be optional or validated by backend
7. Submits a review (POST /api/tickets/:id/review)
8. Fetches employee analytics (GET /api/analytics/employee/:id)

Troubleshooting
---------------
- 404 errors: confirm backend is running and the exact path (server mounts routes under /api/*). Also confirm CORS in backend allows the frontend origin.
- 500 errors: inspect backend server logs (console) for stack traces.
- KPI/Procedure validation errors: backend validates KPIs against `procedimientos` definitions. If you get a 400 on kpis, create a procedure with matching KPI definitions first.

Next steps
----------
- Convert these smoke scripts into a small test suite (Jest) if you want repeatable CI checks.
- Replace client-side stats with analytic endpoints when available for large datasets.
- Add auth token injection to the smoke script when JWT/login is available.
