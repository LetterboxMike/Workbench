# Workbench App (PRD-driven MVP)

Nuxt 3 implementation of the Workbench/Basecamp PRD with a working backend API, app shell, document editor, task views, and AI chat endpoint.

## What Is Implemented

- Nuxt 3 app shell with:
  - Top bar
  - project/document sidebar
  - command palette search (`Ctrl/Cmd + K`)
  - theme toggle
  - AI slide-over panel
- Core API routes from PRD Section 10:
  - projects, members, documents, document content
  - tasks, bulk task update, comments, notifications
  - search, activity, AI chat, auth session/login/signup/logout
- Role-aware access checks (viewer/editor/admin + super admin path)
- Session-based auth flow with three modes:
  - `local` (default when Supabase keys are absent)
  - `supabase` (when Supabase keys are present)
  - `disabled` (only when `WORKBENCH_AUTH_DISABLED=1`)
- Auth endpoints:
  - `/login` page (sign in + sign up)
  - cookie-backed API session (`wb_session`)
  - active organization switching (`/api/auth/switch-org`)
  - auth middleware for protected routes whenever auth mode is enabled
- Organization + tenant operations:
  - `/api/orgs` list/create
  - org member management for super admins
  - active-org scoped project listing
- Document editing with Tiptap + autosave (`/api/documents/:id/content`)
- Task views against one shared task index:
  - list
  - kanban (drag/drop status)
  - calendar (drag/drop due dates)
- Notifications page with mark-read and mark-all-read actions
- AI endpoint (`POST /api/ai/chat`):
  - scope checks
  - context assembly
  - action transparency (`actions_taken`)
  - activity logging with `actor_type = 'ai'`
- Supabase SQL migration blueprint in `supabase/migrations/20260205150000_initial_workbench.sql`
- Multi-agent execution plan in `docs/execution-plan.md`

## Local Data Model

The app runs immediately with an in-memory seeded dataset (`server/utils/store.ts`) plus local auth accounts:
- `michael@bettersignshop.com` / `workbench-demo`
- `jake@bettersignshop.com` / `workbench-demo`

## Optional External Integrations

Set env vars to enable service-backed integrations:

- `ANTHROPIC_API_KEY` for model-backed AI responses
- `ANTHROPIC_MODEL` (optional override)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (auth + future DB adapter wiring)
- `WORKBENCH_AUTH_DISABLED=1` to bypass auth entirely (debug-only)

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/projects` in demo mode, or `http://localhost:3000/login` when Supabase auth is configured.

## Quality Commands

```bash
npm run typecheck
npm run build
```

## Notes

- This MVP prioritizes end-to-end architecture and API parity.
- Real-time CRDT collaboration (Yjs + Hocuspocus), email notifications, and billing remain staged next.
