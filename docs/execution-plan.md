# Workbench Multi-Agent Build Plan

This execution map turns the PRD into concurrent delivery lanes, each lane owned by an "agent" stream.

## Agent Lanes

1. Agent A - Platform and Infra
- Nuxt scaffold, environment config, deployment pipeline, runbook.
- Output: stable app runtime + env matrix.

2. Agent B - Data and Security
- Supabase schema, indexes, RLS policies, migration/versioning.
- Output: audited SQL migrations and policy tests.

3. Agent C - API Surface
- REST routes for projects/documents/tasks/comments/notifications/search/activity.
- Output: endpoint contract parity with PRD Section 10.

4. Agent D - App Shell and Navigation
- Top bar, sidebar, global search, responsive layout, theming.
- Output: consistent shell on desktop/mobile.

5. Agent E - Document System
- Tiptap editor, autosave loop, slash commands, document outline/metadata.
- Output: production editor experience.

6. Agent F - Task System and Views
- Dual-index task model, list/kanban/calendar sync, bulk actions.
- Output: one task source rendered in three views.

7. Agent G - Collaboration
- Yjs + Hocuspocus sync, presence cursors, offline queue behavior.
- Output: multi-user realtime editing.

8. Agent H - AI Assistant
- Scoped AI chat, tool/action transparency, activity logging.
- Output: safe AI workflows through same API surface.

9. Agent I - Notifications and Comms
- In-app notifications, mention triggers, Resend integration.
- Output: operational notification layer.

10. Agent J - QA and Release
- Type checks, integration tests, role regression matrix, performance checks.
- Output: releasable build + quality gate report.

## Dependency Graph

- A and B unblock C.
- C and D unblock E and F.
- E and F unblock G and H context fidelity.
- C and F unblock I event generation.
- J runs continuously and signs off after each lane merge.

## Current Status In This Repo

- Implemented now: lanes A, C, D, F (MVP), H (MVP), and B schema blueprint.
- Pending deeper work: G real-time CRDT server integration, I email delivery, B full RLS coverage and tests, J full automated suite.

## Exit Criteria for v1

1. Every endpoint in PRD Section 10 returns deterministic contract-safe responses.
2. Task edits in list/kanban/calendar mutate the same record and reflect immediately.
3. Document editor autosaves and restores server snapshot.
4. AI actions log to activity feed with actor_type `ai`.
5. Role checks block unauthorized edits across API routes.