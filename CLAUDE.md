# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Workbench is a Nuxt 3 project management and collaboration platform (internal Basecamp/Notion replacement) for BetterSignShop. It combines document authoring (Tiptap), task management with multiple views (list/kanban/calendar), and an AI assistant that operates through the same REST API as the UI.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:4000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # TypeScript type checking
npm run test         # Run integration tests (builds first, then runs auth/tenancy scenario)
```

## Demo Accounts (Local Auth Mode)

- `michael@bettersignshop.com` / `workbench-demo` (super_admin)
- `jake@bettersignshop.com` / `workbench-demo` (member)

## Architecture

### Auth Modes

The app has three auth modes determined by environment variables:
- **local** (default): In-memory session store with seeded demo data
- **supabase**: When `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- **disabled**: When `WORKBENCH_AUTH_DISABLED=1` (debug only)

### Data Layer

- **In-memory store**: `server/utils/store.ts` holds all entities in a global singleton, seeded on first access
- **Type definitions**: `types/domain.ts` defines all entity interfaces
- **Supabase migration**: `supabase/migrations/` contains the production schema blueprint

### Key Architectural Patterns

1. **Dual-citizen tasks**: Tasks exist both as blocks in documents AND as indexed records, enabling inline authoring plus project-wide views from the same data.

2. **Role hierarchy**: Super admins bypass project-level checks. Project roles (admin > editor > viewer) are enforced via `assertProjectAccess()` in `server/utils/auth.ts`.

3. **AI API parity**: The AI endpoint (`POST /api/ai/chat`) uses the same REST API as the frontend. All AI actions are logged with `actor_type: 'ai'`.

4. **Activity logging**: All mutations log to `activity_log` via helpers in `server/utils/activity.ts`.

### Directory Structure

```
components/         # Vue components (AppSidebar, DocumentEditor, TaskPill, etc.)
composables/        # Vue composables (useTheme, useWorkbenchApi, useWorkbenchSupabase)
layouts/            # Nuxt layouts (default with sidebar/topbar shell)
middleware/         # Route middleware (auth.global.ts protects routes)
pages/              # File-based routing
  projects/[id]/    # Project-scoped pages (documents, tasks/list|kanban|calendar)
server/
  api/              # REST endpoints matching PRD Section 10
  utils/            # Server utilities (auth, store, activity, tasks, documents, etc.)
types/              # TypeScript type definitions
```

### API Route Patterns

API routes follow Nuxt's file-based convention. See `docs/api-coverage.md` for the complete endpoint map. Key patterns:
- Route params: `[id]`, `[pid]`, `[uid]`, `[docId]`
- Method suffixes: `.get.ts`, `.post.ts`, `.patch.ts`, `.delete.ts`

### Environment Variables

See `.env.example`:
- `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`: Enable AI chat responses
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`: Enable Supabase auth
- `WORKBENCH_AUTH_DISABLED=1`: Bypass auth (debug only)

## Testing

Integration tests run against a built production server:
```bash
npm run test:integration
```

This builds the app, starts the server, and runs `scripts/integration-auth-tenancy.mjs` which tests signup, org creation, project sharing, and tenant isolation.
