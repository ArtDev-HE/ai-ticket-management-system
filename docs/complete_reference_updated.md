# Complete Reference (Updated)

This document documents the current codebase, files changed during recent work, and the intended responsibilities of each file. It acts as a developer-oriented reference for contributors continuing work on the project.

Last updated: 2025-10-08

---

## Recent work (session summary)

These are the concrete changes made during the current development session (for quick onboarding/reference):

- Backend
  - Added `src/routes/ai.js` AI proxy endpoint that returns dev canned visualization descriptors and forwards to an orchestration webhook (n8n) in production. Introduced AJV-based schema validation and a fallback so invalid descriptors no longer cause hard errors.
  - Enhanced `src/routes/analytics.js` with dev-only helpers: deterministic synthetic trend injection for testing (EMP-001, EMP-TEST), and logic to fill missing `eficiencia_temporal` where possible.
  - Added `scripts/seed_emp_test.js` (idempotent) to persist completed tickets for `EMP-TEST` so analytics return non-zero metrics during dev.

- Frontend
  - `frontend/src/components/ChatInput.tsx`: command parsing for `EMP-`, `PROC-`, `DEP-` commands; client-side normalization and deterministic fallbacks for `trendline_efficiency` descriptors to ensure charts always get the expected `{ fecha_actualizado, eficiencia_temporal }` numeric shape.
  - `frontend/src/components/AiOutputPanel.tsx`: sanitizes AI descriptors, normalizes alternate shapes (e.g., `{ date, value }` → `{ fecha_actualizado, eficiencia_temporal }`), validates descriptors before rendering.
  - `frontend/src/context/UserContext.tsx` and `HeaderBar.tsx`: dev employee selection persisted to localStorage and wired into the UI; `HeaderBar` made a client component so Set Employee is interactive.
  - UI fixes: `ChatHistory.tsx` and `InteractionLog.tsx` layout changes to keep header/buttons fixed while messages scroll; `EmployeeStats.tsx` now coerces numeric strings to Number before formatting.

- Tests & tooling
  - Added lightweight test `scripts/test_ai_validation.js` to simulate an invalid n8n response and assert the backend returns a safe fallback descriptor. Added `npm run test:ai-validation`.

Small notes
- Feature flags used: `NEXT_PUBLIC_USE_BACKEND_AI` (frontend) and `USE_N8N_MOCK`/`NODE_ENV` checks (backend) toggle mock vs real orchestration.
- Dev helpers are intentionally non-destructive: analytics helpers modify only in-memory responses unless the seed script is executed which writes to the DB.


## Project Structure (focused)

- frontend/ai_management_ticket_system/
  - src/
    - app/
      - layout.tsx
      - page.tsx
    - components/
      - HeaderBar.tsx
      - InteractionLog.tsx
      - ChatHistory.tsx
      - AiOutputPanel.tsx
      - ChatInput.tsx
      - EmployeeInfoPanel.tsx
      - EmployeeStats.tsx
      - TicketCard.tsx
      - AnalyticsView.tsx
      - charts/
        - TrendlineChart.tsx
        - EstadoBarChart.tsx
        - KPIReport.tsx
    - config/
      - VisualizationRegistry.ts
    - context/
      - UserContext.tsx
    - hooks/
      - useTickets.ts
    - services/
      - api.ts
      - tickets.ts
      - employees.ts
      - procedures.ts
      - analytics.ts
      - auth.ts
      - ai.ts
    - styles/
      - globals.css

- backend/
  - src/
    - server.js
    - routes/
      - tickets.js
      - procedimientos.js
      - empleados.js
      - analytics.js
      - auth.js
    - config/
      - db.js


## Files changed / created during the recent integration

- frontend/src/context/UserContext.tsx (NEW)
  - Purpose: Provide `currentEmployeeId` and setter across the app. Syncs with localStorage for persistence. Used by `HeaderBar` and `EmployeeInfoPanel` to reflect dev-selected employee immediately.

- frontend/src/components/ChatInput.tsx (UPDATED)
  - Purpose: Accept user input, parse structured commands (e.g., `show efficiency trend EMP-001`), call analytics services for `EMP-`, `PROC-`, and `DEP-` identifiers, and fall back to AI mock in `ai.ts`.
  - Key behaviors:
    - No-op on empty input.
    - Pushes a pending AI message to allow UI to show "AI is thinking..." state.
    - On successful analytics call, constructs a deterministic visualization descriptor matching VisualizationRegistry keys and passes it to the parent.
    - Emits clear error messages when requested entity not found.

- frontend/src/components/AiOutputPanel.tsx (UPDATED)
  - Purpose: Render AI output text and structured visualizations. Validate descriptors with `visualizationValidator` and sanitize descriptor.data (strip `title`, `label` fields) before handing to `AnalyticsView`.

- frontend/src/components/AnalyticsView.tsx (UPDATED)
  - Purpose: Accept `visualizationKey` + `data` and render the chart component mapped to the key. Chart heading/title uses the static label from `VisualizationRegistry` rather than AI-provided titles.

- frontend/src/components/ChatHistory.tsx (UPDATED)
  - Purpose: Controlled rendering of messages. Auto-scrolls to the latest message, shows pending AI message with 'italic/animate-pulse' style, supports Export (Markdown) and Clear actions. Messages persisted to `sessionStorage` namespaced per employee (e.g., `ai_chat_messages:${employeeId}`) and capped at 500 messages to avoid unbounded growth.

- frontend/src/components/HeaderBar.tsx (UPDATED)
  - Purpose: Top bar with dev controls. Now reads/writes `currentEmployeeId` via `UserContext` for immediate UI reflection.

- frontend/src/components/EmployeeInfoPanel.tsx (UPDATED)
  - Purpose: Shows tickets and employee analytics for the selected `currentEmployeeId` from `UserContext`.

- frontend/src/services/ai.ts (NEW/UPDATED)
  - Purpose: Deterministic AI mock that returns text and structured visualization descriptors. Used locally until real AI backend is integrated.

- frontend/scripts/smokeTests.js (UPDATED)
  - Purpose: Node smoke test that exercises create/accept/hito/kpis and analytics flows. Auto-creates missing procedure data to avoid 404s.

- frontend/src/services/auth.ts (UPDATED)
  - Purpose: Dev auth helper functions (loginDev, logoutDev), dev token storage, and helpers to set/get dev employee id (migration path to JWT later).

- frontend/src/config/VisualizationRegistry.ts (UPDATED)
  - Purpose: Template registry mapping keys to visualization templates (label, requiredFields, description). Ensures UI uses canonical labels.

- frontend/src/utils/visualizationValidator.ts (NEW)
  - Purpose: Validate that visualization descriptor data contains required fields before rendering. Prevents charts from rendering on incomplete data.

- AI behavior note:
  - The AI mock was updated to be intent-aware: it only returns visualization descriptors when the user's prompt includes explicit visualization intent (keywords like "chart", "plot", "visualize", "show trend"). Very short or ambiguous prompts return a neutral clarification instead of triggering visual updates.

- Session/auth note:
  - Recent dev iterations persist the dev token and `currentEmployeeId` in `sessionStorage` (tab-scoped). This reduces accidental cross-tab token reuse during development, but is unsuitable for production. For production, migrate to HttpOnly, Secure cookies and fetch the mapped `employeeId` from `/api/auth/me` on app load.

- Devops note:
  - Dev seeding and test scripts have been moved to `devops/` and require explicit guards such as `ALLOW_DEV_SEEDS=true` or `ALLOW_DEV_TESTS=true` to run. Confirm canonical scripts live under `devops/` (e.g., `devops/seed_emp_test.js`, `devops/test_ai_validation.js`).

## Export / Import (signed)

- The project implements a server-side HMAC signing flow for exported chats. Key points:
  - Backend endpoint `POST /api/chat/export` can sign a chat payload using `CHAT_EXPORT_SECRET` and return a signed payload.
  - The frontend export routine, when it obtains the signature, embeds the signed JSON payload as a single-line JSON block inside the exported Markdown file between these HTML comment markers:
    - <!--CHAT_EXPORT_JSON_START {..signed json..} CHAT_EXPORT_JSON_END-->
  - The import routine extracts that embedded JSON and POSTs it to `/api/chat/import` for server-side HMAC verification and ownership checks. The server verifies the HMAC and that `payload.employeeId === req.user.employeeId` before returning the validated messages to the client.

## AiOutputPanel update rules

- The UI updates the visualization panel only when:
  1. The message originated from a recognized structured command (EMP-/PROC-/DEP-), or
  2. The AI response contains a `visualization` descriptor and the user's prompt expresses visualization intent (keyword-based check).

- This avoids spurious visual updates for very short or ambiguous prompts.


## Notable implementation notes and rationale

- Chart Title Authority
  - Chart titles are sourced from `VisualizationRegistry` (`template.label`). AI-provided `title` or `label` in descriptor.data is deliberately stripped by `AiOutputPanel` to avoid UI jitter where the last AI message overwrote chart titles.

- Local dev auth vs production JWT
  - For speed of iteration we added a dev-login route and a small frontend auth shim. The next session should replace this with proper JWT/session handling mapped to `employeeId`.

- Command parsing in `ChatInput`
  - Supports shorthand commands that identify employees or procedures and uses typed services to build visualization descriptors. This keeps the UX deterministic and testable.

- Persistence & Size Cap
  - Chat messages saved to `localStorage` under `ai_chat_messages`. Cap set at 500 messages to avoid unbounded growth.


## Tests & Verification

- TypeScript checks: `npx -y tsc --noEmit` executed in the frontend workspace; last run exit code 0 (no blocking type errors).
- Smoke script: Updated to handle missing `PROC-001`; user-run smoke tests completed successfully (health OK, ticket lifecycle outputs, analytics keys present).


## Known issues / Deferred work

- Replace dev auth with JWT and server-side user→employee mapping (priority for production).
- Consider adding a confirmation modal for Clear chat (low risk) and an undo flow for clears.
- Add unit tests for visualizationValidator and mapping logic in `ai.ts`.
- Remove/clean up large/legacy files in `garbage/` folder.


## File map quick reference (important types & services)

- `frontend/src/services/api.ts` - axios instance with baseURL `http://localhost:3000` and JSON headers.
- `frontend/src/services/tickets.ts` - wrappers for `/api/tickets` endpoints.
- `frontend/src/services/employees.ts` - wrappers for `/api/empleados`.
- `frontend/src/services/procedures.ts` - wrappers for `/api/procedimientos`.
- `frontend/src/services/analytics.ts` - wrappers for `/api/analytics/*` endpoints.


## Next actionable items (for next session)

1. Implement backend JWT issuance & verification and an `/api/auth/me` endpoint returning the mapped `employeeId`.
2. Update frontend `auth.ts` and axios interceptors to include tokens and fetch current `employeeId` on app load into `UserContext`.
3. Add unit tests for `visualizationValidator` and critical services.
4. Add a confirmation modal for clearing chat history.


---

