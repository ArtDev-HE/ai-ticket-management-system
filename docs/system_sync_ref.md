# 🧭 System Sync Reference (AI Ticket Management System) — v1.1

> Purpose: Canonical handoff reference for the AI-driven Ticket Management System. Mirrors current implementation and near-future plans.

Last updated: 2025-10-08
Last reviewed by: JS (2025-10-10)

> n8n integration notes: Use the Code node (`n8n-nodes-base.code`) with `jsCode` or `pyCode` in modern n8n editors. When testing in the editor the webhook path is reachable under `/webhook-test/<path>` (e.g. `http://localhost:5678/webhook-test/ai-proxy`). Example workflows live under `devops/`.

---

## 1. Current Snapshot (2025-10-08)

- Backend: Node.js + Express, Postgres (pg), running on port 3000 in dev.
- Frontend: Next.js (App Router) + TypeScript, TailwindCSS, React Query (@tanstack/react-query), Recharts for charts.
- Dev environment: Frontend on port 3001 (recommended), backend on 3000. API baseURL configured in `frontend/src/services/api.ts`.
- Dev auth shim: `POST /api/auth/dev-login` returns a static dev token for local development flows.
- AI mock: deterministic mock located in `frontend/src/services/ai.ts` (generates text + visualization descriptors).
- Chat export/import: server-side HMAC signing is implemented in `src/routes/chat.js`. The frontend export routine requests a signature for the exported payload and, when received, embeds the signed JSON payload as a single-line JSON block inside the exported Markdown file between the HTML comment markers:
- <!--CHAT_EXPORT_JSON_START ... CHAT_EXPORT_JSON_END-->
- The import flow extracts this embedded JSON and POSTs it to `/api/chat/import` where the server verifies the HMAC and ownership (the importing user must match the payload.employeeId). If verification fails the import is rejected.
- Visualization system:
  - `frontend/src/config/VisualizationRegistry.ts` maps visualization keys to templates (label, requiredFields, component reference).
  - `frontend/src/utils/visualizationValidator.ts` validates descriptor data against template.requiredFields.
  - Chart components under `frontend/src/components/charts` render data (TrendlineChart, EstadoBarChart, KPIReport).
- Chat & interaction:
  - `ChatInput.tsx` parses structured commands (employee/procedure/department) and calls analytics services or AI mock.
  - `AiOutputPanel.tsx` sanitizes AI output (strips `title`/`label` from descriptor data) and passes validated descriptor to `AnalyticsView`.
  - AiOutputPanel update rules: the frontend will only update the visualization panel when the message is a recognized structured command (EMP-/PROC-/DEP-) or when the AI response explicitly contains both a `visualization` descriptor and the user's prompt expresses visualization intent (keywords like "chart", "plot", "visualize", "show trend"). This prevents spurious visual updates from very short or ambiguous prompts.
  - `ChatHistory.tsx` is controlled by the page, supports an "AI is thinking..." pending item, auto-scroll, and local persistence (sessionStorage key `ai_chat_messages`, capped to 500 messages).
- User context:
  - `frontend/src/context/UserContext.tsx` provides `currentEmployeeId` and setter for in-app dev selection. HeaderBar writes to this context so EmployeeInfoPanel updates immediately.
  - Session semantics: recent dev changes persist the dev token and `currentEmployeeId` in `sessionStorage` (per-tab lifetime) rather than global `localStorage`. Chat messages are persisted per-employee under keys like `ai_chat_messages:${employeeId}` and capped at 500 messages.
- Smoke tests: `frontend/scripts/smokeTests.js` exercises core API flows and auto-creates a test procedure when missing.

## Data Flow Diagram (quick)

User Input -> `ChatInput` -> (structured command?) -> Analytics Service / AI Mock -> Backend API -> `AiOutputPanel` -> `AnalyticsView` -> Chart Component

Alternative (AI-driven):
User Input -> `ChatInput` -> AI Mock / AI Proxy -> returns descriptor -> `AiOutputPanel` validates -> `AnalyticsView` renders


## 2. Key Files & Responsibilities

- Frontend
  - `src/app/page.tsx` - central orchestration for chat messages state, persistence, export & clear handlers, and providers wiring.
  - `src/components/HeaderBar.tsx` - top header; includes dev control to set `currentEmployeeId` using `UserContext`.
  - `src/components/InteractionLog.tsx` - layout container: left `AiOutputPanel`, right `ChatHistory` (50/50 split).
  - `src/components/ChatInput.tsx` - user input, structured command parsing, send flow, calls analytics services or AI mock.
  - `src/components/AiOutputPanel.tsx` - renders AI text and visualization using `AnalyticsView`.
  - `src/components/AnalyticsView.tsx` - loads chart component from `VisualizationRegistry` and passes data.
  - `src/components/charts/*` - visualization implementations using Recharts.
  - `src/context/UserContext.tsx` - provides `currentEmployeeId` and setter; synced with `sessionStorage` for persistence (dev-only behavior).
  - `src/services/*.ts` - typed axios service wrappers mirroring backend endpoints (tickets, procedures, employees, analytics, auth).

- Backend
  - `src/server.js` - Express app and route registrations.
  - `src/routes/*.js` - routes: `tickets.js`, `procedimientos.js`, `empleados.js`, `analytics.js`, plus `auth.js` (dev-login).
  - `src/routes/chat.js` - export/import endpoints that sign and verify exported chat payloads. Signing uses HMAC-SHA256 with `CHAT_EXPORT_SECRET` and requires the backend environment variable `CHAT_EXPORT_SECRET` to be configured in production. The import endpoint verifies that the signed payload.employeeId matches `req.user.employeeId` (requires `verifyJwt` middleware).
  - Note: current dev implementation will fall back to `process.env.JWT_SECRET` or a dev fallback string when `CHAT_EXPORT_SECRET` is not set (see `src/routes/chat.js`). This is a development convenience and MUST be removed or disabled for production; production should require `CHAT_EXPORT_SECRET` explicitly and fail to start otherwise.
  - `src/config/db.js` - Postgres pool connector.


## 3. Contracts & Data Shapes (short)

- AI descriptor (frontend contract):
  {
    text: string,
    visualization?: {
      key: string, // key into VisualizationRegistry
      parameters?: Record<string, any>,
      data?: any[] | object,
      dataUrl?: string
    }
  }

- Visualization template (VisualizationRegistry):
  {
    label: string,
    component: string, // logical name mapped by AnalyticsView
    requiredFields: string[]
  }

- Chat message shape (local):
  { sender: 'user' | 'ai', text: string, timestamp?: string }


## 4. What was implemented (high-level)

- End-to-end frontend↔backend parity for tickets, employees, procedures, analytics.
- Dev-friendly auth: `POST /api/auth/dev-login` and frontend dev auth shim.
- Deterministic AI mock to produce structured visualization descriptors.
- Visualization registry and validator to ensure charts only render with required data.
- Chat UI: send flow, pending placeholder, auto-scroll, local persistence (cap 500), export (Markdown) and clear history.
- Command parsing in `ChatInput` to call analytics endpoints for `EMP-`, `PROC-`, `DEP-` identifiers and produce deterministic visualizations instead of free-form AI text.
- UserContext to allow instant dev selection of `currentEmployeeId` without JWT.
- Smoke tests script updated to auto-provision missing test data.


## 5. Near-Future Plans (next session priorities)

1. Replace dev auth/local employee shim with production JWT and server-side user→employee mapping.
   - Implement backend JWT issuance & verification.
   - Map authenticated user to `employeeId` on the server and pass to frontend in a secure session or access token payload.
   - Update axios interceptors to include auth token and refresh flow.
  - Estimated effort: 2-3 days (core work: backend middleware, frontend auth wiring, minor UX changes) — Priority: 🔴 High

2. Cleanup & consolidation
   - Remove or archive unused files in `garbage/` and other legacy artifacts.
   - Consolidate duplicated helper utilities and types across frontend services.

2. Cleanup & consolidation
  - Estimated effort: 1 day — Priority: 🟡 Medium

3. UX improvements (low-risk)
   - Confirmation modal for Clear chat.
   - Autocomplete/suggestions for employee/procedure ids in ChatInput.
   - Allow optional AI-provided label override only with explicit user confirmation.

4. Testing & CI
   - Add unit tests for critical services (analytics mapping, visualization validator).
   - Add end-to-end smoke tests to CI (GitHub Actions) that run the `scripts/smokeTests.js` against a local backend.
    - Estimated effort: 1-2 days to add a simple GH Actions workflow to run smoke + tsc — Priority: 🟡 Medium


## 6. Troubleshooting (common issues)

- Backend not reachable from frontend: ensure backend is running on port 3000 and CORS allows origin `http://localhost:3001`.
- TypeScript errors after edits: run `npx -y tsc --noEmit` in `frontend/ai_management_ticket_system`.
- Chat messages not persisting: check `sessionStorage` key `ai_chat_messages:${employeeId}` and verify JSON shape.
- Charts not rendering: check that `visualization.key` returned by AI or analytics matches a key in `VisualizationRegistry` and that `data` contains `requiredFields`.


## 7. Quick pointers for next dev session

- Focus: Production auth (JWT) -> map to employee id -> update HeaderBar/UserContext to read from server session.
- Suggested first PR: implement backend middleware to decode and validate JWT, then return `employeeId` in `/api/auth/me`.
- Run the smoke script after implementing JWT to ensure end-to-end flows still work (use dev token fallback while iterating).

---

Last synced: 2025-10-08

## Recent session summary (what changed)

- AI proxy and validation
  - `src/routes/ai.js` now returns deterministic canned descriptors in dev and forwards to a configured n8n webhook in production. AJV validation is applied and, on failure, the backend falls back to a safe canned descriptor instead of returning an error.

- Analytics dev helpers & seeding
  - `src/routes/analytics.js` contains dev-only deterministic trend injection and logic to compute or fill missing `eficiencia_temporal` values for employees like `EMP-001` and `EMP-TEST` so charts display meaningful trends during development.
  - `scripts/seed_emp_test.js` was added and run to persist completed tickets for `EMP-TEST`, producing non-zero analytics for consistent dev testing.

- Frontend normalizations and UI fixes
  - `ChatInput.tsx`: added structured command parsing for `EMP-/PROC-/DEP-` commands, and client-side normalization of trend data to canonical fields to avoid chart rendering errors.
  - `AiOutputPanel.tsx`: strips AI-provided chart titles and normalizes alternate data shapes (e.g., `{date,value}`) to the expected `{fecha_actualizado, eficiencia_temporal}` format.
  - HeaderBar is now a client component and writes `currentEmployeeId` into `UserContext` for immediate UI updates.
  - Chat layout fixes to keep top controls fixed while messages scroll.

- Testing
  - `scripts/test_ai_validation.js` added to validate that the backend will fallback to safe descriptors if backend orchestration returns malformed descriptors. Run with `npm run test:ai-validation`.

## 2025-10-10 - Developer session update
- Additional TypeScript/ESLint pass performed across the frontend to remove explicit `any` usages and add runtime guards for AI/visualization payloads; this reduced static errors and improved robustness when normalizing AI responses for charts.
- The frontend smoke test harness was fixed and executed against a running local backend; smoke tests completed successfully and backend health was confirmed. All changes were committed to `main` (message: "chore: lint/type fixes and run frontend smoke tests").

### Verification — 2025-10-10
- Web UI tested manually and confirmed to load the main page and render charts for AI/analytics responses.
- Smoke tests ran successfully against the local backend; changes were committed and pushed.


