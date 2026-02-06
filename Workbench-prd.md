# Basecamp — Product Requirements Document

**Version:** 1.0
**Date:** February 2026
**Author:** Michael + Claude
**Status:** Draft

---

## 1. Executive Summary

Basecamp is an internal project management and collaboration platform purpose-built for the BetterSignShop/SignShopOS development team. It replaces Notion and Linear with a simpler, faster, AI-native workspace that combines document authoring, task management, and real-time collaboration under a unified, minimal interface.

**Core design philosophy:** Full-powered tool, dead-simple interface. All complexity lives in the engine, not the cockpit.

| Field | Value |
|---|---|
| Product Name | Basecamp |
| Type | Internal SaaS — Project Management & Collaboration |
| Primary Users | BetterSignShop / SignShopOS development team |
| Tech Stack | Nuxt 3, Tiptap, Yjs/Hocuspocus, Supabase, Anthropic API |

---

## 2. Problem Statement

Notion introduces excessive cognitive overhead — everything is a block, a page, a database, a relation, a view of a view. The system demands constant management of itself. Linear is opinionated and fast, but rigidly scoped to issue tracking and far too complex for our needs.

We need a workspace that is opinionated enough to be fast and flexible enough to not feel like a cage. A place to organize what we're building, write and think together, and have an AI assistant that can read, write, create, and manage everything in the system.

---

## 3. UX Philosophy

### 3.1 Core Principle

**Everything is a document. Everything lives in a project. Every document can contain anything.**

There is no separate "database" concept, no separate "task tracker" app, and no distinction between a spec, a to-do list, and meeting notes at the container level. A to-do list is a document with task blocks. A kanban board is a view of tasks that exist across documents in a project. The mental model requires learning exactly three things: **Projects, Documents, and Blocks.**

### 3.2 Design Tenets

- **Progressive disclosure:** Power reveals itself as needed. The default state is clean and minimal. Advanced features appear contextually, never in a settings maze.
- **Speed over ceremony:** Every action should feel instant. No loading spinners for basic operations. Optimistic UI updates everywhere.
- **Context preservation:** Users should never lose their place. Navigation, editing, and task management happen without full page reloads or jarring transitions.
- **AI as first-class citizen:** The assistant is not a bolt-on chatbot. It operates through the same API as the UI and has the same capabilities as a human user, scoped to permissions.
- **Dark/light mode from day one:** Theme support is baked into the design system, not bolted on later.

---

## 4. Object Model

The entire application is built on three core objects. Every feature is an expression of these primitives.

### 4.1 Project

The top-level organizational container. A project scopes all content, tasks, members, and permissions to a single initiative.

**Properties:**
- `id` (UUID)
- `org_id` (FK)
- `name` (string)
- `description` (text, optional)
- `icon` (string, optional — emoji or icon key)
- `color` (string, optional — hex)
- `created_by` (FK → users)
- `created_at` (timestamp)
- `archived_at` (timestamp, nullable)
- `settings` (JSONB — project-level configuration)

### 4.2 Document

The primary content unit. Documents live inside projects, support nesting (sub-documents), and have a body composed of blocks. Every document is URL-addressable and has a corresponding API endpoint.

**Properties:**
- `id` (UUID)
- `project_id` (FK)
- `parent_document_id` (FK, nullable — enables tree structure)
- `title` (string)
- `created_by` (FK → users)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `sort_order` (integer — sibling ordering)
- `is_archived` (boolean)
- `tags` (text array, optional)

**Content storage is separate (see Section 8 — Data Model):** Document body is stored as Yjs CRDT state for real-time collaboration, with a rendered JSON snapshot for API reads.

### 4.3 Block

The atomic content unit inside a document. Blocks are typed and extensible — new block types can be added without changing the document or project model.

| Block Type | Description |
|---|---|
| **Text** | Rich formatted content: headings (H1–H3), bold, italic, strikethrough, inline code, links, callouts, blockquotes |
| **Image** | Embedded images via drag-drop, paste-from-clipboard, or URL. Stored in project-scoped storage bucket. |
| **Task** | Action item with assignee, due date, priority, status, and tags. **Dual-indexed:** exists inline in the document AND in the global project task index. This is the key architectural decision that enables views. |
| **Embed** | iframes, link previews, external content |
| **Code** | Syntax-highlighted code blocks with language selection |
| **Divider** | Visual separator |
| **Toggle** | Collapsible content section |
| **AI Prompt** | Special block: invoke the AI assistant inline, output becomes document content |

---

## 5. Features

### 5.1 Document Editor

The editor is the heart of the application. Built on **Tiptap** (ProseMirror-based), it provides a block-based editing experience with rich formatting, slash commands, and drag-to-reorder.

**Requirements:**
- Block-based editing with slash command menu (`/` to insert any block type)
- Rich text formatting toolbar (contextual, appears on text selection)
- Drag handle on each block for reordering
- Markdown shortcuts (e.g., `#` for headings, `**` for bold, `- ` for bullets, `[] ` for tasks)
- Image upload: drag-drop, paste from clipboard, or file picker
- Inline mentions: `@user` for people, `#doc` for document links
- Autosave — no save button, ever. Debounced writes to backend.
- Undo/redo stack
- Document outline panel (auto-generated from headings)
- Word count / reading time (subtle, footer)

### 5.2 Task System

Tasks are blocks AND first-class database objects. A task lives inside a document contextually, but also exists in a global task index for the project. This dual-citizenship is what enables multiple views of the same data.

**Task Properties:**
- `id` (UUID)
- `project_id` (FK)
- `source_document_id` (FK — the doc where the task was created)
- `source_block_id` (string — the block ID within the doc)
- `title` (string)
- `description` (text, optional)
- `status` (enum: `backlog`, `todo`, `in_progress`, `in_review`, `done`, `cancelled`)
- `priority` (enum: `none`, `low`, `medium`, `high`, `urgent`)
- `assignee_id` (FK → users, nullable)
- `due_date` (date, nullable)
- `tags` (text array)
- `created_by` (FK → users)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `completed_at` (timestamp, nullable)

**Behavior:**
- Creating a task block in a document automatically creates the corresponding task record in the database.
- Editing a task in any view (kanban, list, calendar, or inline in the doc) updates the same underlying record.
- Deleting a task block removes the inline representation but the task record persists in the index (with a flag). Deleting from a view prompts confirmation and removes both.
- Tasks can be created directly from views (without a parent document) — they get assigned to the project but have `source_document_id = null`.

### 5.3 Views

Views are not separate pages or apps. They are lenses on the same underlying task data within a project.

#### 5.3.1 List View
Flat, filterable, sortable table of all tasks in a project. Grouping by: status, assignee, due date, priority, tag, or parent document. Column visibility is configurable. Bulk actions: assign, change status, change priority, delete.

#### 5.3.2 Kanban View
Columns by status (default) or any single-select field. Drag-and-drop to update status. Card shows: title, assignee avatar, due date, priority indicator. Quick-add at the bottom of each column.

#### 5.3.3 Calendar View
Tasks plotted by due date. Week and month view toggles. Drag to reschedule. Click to open task detail. Tasks without due dates are excluded.

**All three views read from the same task index. Change something in kanban → instantly reflected in list and calendar. No sync, no duplication.**

### 5.4 Real-Time Collaboration

Two people open the same document, they see each other's cursors, edits appear live, no save button, no conflicts.

**Technical approach:** Yjs (CRDT library) + Hocuspocus (WebSocket server). Tiptap has a first-party Yjs integration.

**Requirements:**
- Multi-cursor presence (colored cursors with name labels)
- Live text sync with conflict-free resolution
- Online/offline indicator per user
- Presence awareness in project sidebar (who's viewing what)
- Graceful offline handling: edits queue locally and sync when connection restores

### 5.5 Comments

Threaded comments on documents, tasks, and individual blocks.

**Properties:**
- `id` (UUID)
- `target_type` (enum: `document`, `task`, `block`)
- `target_id` (UUID or string)
- `parent_comment_id` (FK, nullable — for threading)
- `author_id` (FK → users)
- `body` (text — supports basic formatting)
- `created_at` (timestamp)
- `resolved_at` (timestamp, nullable)

**Behavior:**
- Comments on a block appear as a sidebar indicator (like Google Docs)
- Comments on a task appear in the task detail panel
- Document-level comments appear in a comments panel
- `@mention` in comments triggers a notification
- Comments can be resolved (collapsed but not deleted)

### 5.6 Search

Global search across all accessible projects, documents, tasks, and comments.

**Requirements:**
- Full-text search powered by Postgres `tsvector` / `ts_query`
- Results grouped by type (documents, tasks, comments)
- Scoped search within a project
- Keyboard shortcut to open search (`Cmd+K` / `Ctrl+K`)
- Recent searches and recently visited documents

### 5.7 Notifications

In-app and email notifications for relevant events.

**Triggers:**
- Assigned to a task
- Mentioned in a document or comment (`@`)
- Task due date approaching (1 day before)
- Task status changed (if assignee)
- Comment on your task or document
- Invited to a project

**In-app:** Real-time via Supabase Realtime subscriptions on a `notifications` table. Bell icon with unread count. Notification panel with mark-read and mark-all-read.

**Email:** Sent via Resend (or Postmark). Batched digest option (immediate, hourly, daily). Configurable per-user in settings.

---

## 6. Authentication & Authorization

### 6.1 Auth

Supabase Auth with email/password and magic link sign-in. OAuth providers (Google, GitHub) as stretch goals.

### 6.2 Organization

Multi-tenant at the org level. Each org has its own projects, members, and settings. A user belongs to one org (initially — multi-org is a future concern).

### 6.3 Roles

Four-tier role system, enforced at both API and database (RLS) levels.

| Role | Scope | Capabilities |
|---|---|---|
| **Super Admin** | Organization-wide | Full system control. All projects, all users, billing, system settings. Can access and manage any project regardless of membership. |
| **Admin** | Per-project | Full control within assigned projects. Invite/remove members, manage roles, delete content, configure project settings. |
| **Editor** | Per-project | Create, edit, delete documents and tasks. Comment. Cannot manage members or project settings. |
| **Viewer** | Per-project | Read-only access. Can comment. Cannot create or edit content. |

**Implementation:**
- `org_members` table holds the org-level role (`super_admin` or `member`).
- `project_members` table holds per-project roles (`admin`, `editor`, `viewer`).
- RLS policies on every table check both org membership and project role before returning data.
- API middleware validates permissions before executing any mutation.
- Super admin bypasses project-level role checks.

### 6.4 Invite Flow

Admins (project or super) can invite users by email. Invitation creates a pending record. If the user doesn't have an account, they receive a sign-up link. On account creation, they're automatically added to the org and project with the specified role.

---

## 7. AI Assistant

The AI assistant is the key differentiator. It operates at three levels and uses the same REST API as the frontend — no backdoor, no special internal methods. Every action is auditable, permissioned, and reversible.

### 7.1 Inline Mode

Triggered from within a document.

- **Highlight + prompt:** Select text, click AI icon (or keyboard shortcut), type instruction. "Rewrite this more concisely." "Translate to Spanish." "Fix grammar."
- **AI Prompt block:** Drop a special block, type a prompt, AI generates content that becomes document content. The prompt block can be kept (for context) or discarded after generation.
- **Slash command AI:** Type `/ai` in the editor to trigger an inline prompt.

### 7.2 Project-Level Mode

A chat panel scoped to a project. The assistant has full context of every document and task in that project.

**Example interactions:**
- "What's overdue?"
- "Summarize the decisions from last week's docs."
- "Create a task for each action item in the design review doc."
- "Draft a status update based on what was completed this sprint."
- "Move all tasks tagged 'v2' to backlog."

### 7.3 System-Level Mode

Available to super admins only. Operates across all projects.

**Example interactions:**
- "Show me all tasks assigned to Jake across every project."
- "Create a new project called 'Q2 Launch' with the standard template."
- "How many tasks were completed org-wide last week?"

### 7.4 API-First Architecture

Every action the AI takes goes through the same REST API the frontend uses. This means:

- All AI actions respect RLS and role permissions.
- All AI actions are logged in the `activity_log` with `actor_type = 'ai'`.
- Any custom integration built later gets the same capabilities for free.
- The AI's tool definitions are generated directly from the API schema — when a new endpoint is added, the AI automatically gains that capability.

### 7.5 AI Tool Definitions

The assistant uses function calling / tool use. Each API endpoint is registered as a tool:

- `create_project`, `update_project`, `archive_project`
- `create_document`, `update_document`, `move_document`, `delete_document`
- `get_document_content`, `update_document_content`
- `create_task`, `update_task`, `delete_task`, `bulk_update_tasks`
- `list_tasks` (with filters: status, assignee, due_date, priority, tags, project, document)
- `create_comment`, `resolve_comment`
- `search` (full-text across docs, tasks, comments)
- `list_project_members`, `invite_member`
- `get_activity_log`

---

## 8. Data Model

### 8.1 Core Tables

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Org membership + system role
CREATE TABLE org_members (
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  system_role TEXT NOT NULL CHECK (system_role IN ('super_admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'
);

-- Project membership + project role
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  sort_order INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}'
);

-- Document content (separate for performance)
CREATE TABLE document_content (
  document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  yjs_state BYTEA,  -- CRDT binary state for real-time collab
  last_snapshot JSONB,  -- Rendered block tree for API reads / AI context
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks (dual-citizen: inline block + indexed record)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  source_block_id TEXT,  -- Block ID within the document
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'none'
    CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent')),
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Comments (polymorphic target)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('document', 'task', 'block')),
  target_id TEXT NOT NULL,  -- UUID or block ID
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- 'task_assigned', 'mentioned', 'due_soon', 'comment', 'invite'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,  -- Deep link into the app
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity log (audit trail — critical for AI accountability)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  project_id UUID REFERENCES projects(id),
  actor_id UUID REFERENCES users(id),  -- NULL if system/AI
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'ai', 'system')),
  action TEXT NOT NULL,  -- 'created', 'updated', 'deleted', 'moved', 'assigned', etc.
  target_type TEXT NOT NULL,  -- 'project', 'document', 'task', 'comment', 'member'
  target_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',  -- Action-specific details (old/new values, AI prompt, etc.)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Invitations (pending)
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (project_id, email)
);
```

### 8.2 Key Indexes

```sql
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_parent ON documents(parent_document_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_source_doc ON tasks(source_document_id);
CREATE INDEX idx_comments_target ON comments(target_type, target_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX idx_activity_project ON activity_log(project_id, created_at DESC);
CREATE INDEX idx_activity_actor ON activity_log(actor_id, created_at DESC);

-- Full-text search
CREATE INDEX idx_documents_fts ON documents USING gin(to_tsvector('english', title));
CREATE INDEX idx_tasks_fts ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### 8.3 RLS Policy Pattern

Every table follows this pattern:

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can see projects they're a member of, OR if they're a super_admin
CREATE POLICY "projects_select" ON projects FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_members pm WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM org_members om WHERE om.org_id = projects.org_id AND om.user_id = auth.uid() AND om.system_role = 'super_admin'
  )
);

-- Only admins (project or super) can insert/update/delete
-- Pattern repeats for each operation with appropriate role checks
```

---

## 9. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | Nuxt 3 (Vue 3) | Already in our ecosystem. SSR, file-based routing, composables. |
| **Rich Text Editor** | Tiptap | ProseMirror-based, block-oriented, extensible, first-party Yjs collab support. Custom block types via extensions. |
| **Real-Time Collab** | Yjs + Hocuspocus | CRDT-based conflict-free sync. Hocuspocus = WebSocket server for Yjs. Presence awareness included. |
| **Backend / DB** | Supabase | Postgres, Auth, RLS, Realtime subscriptions, Storage, Edge Functions. |
| **API Layer** | Nuxt Server Routes | REST endpoints co-located with frontend. Extractable to standalone API later. |
| **AI** | Anthropic API (Claude) | Function calling / tool use. Tool definitions mirror API endpoints. |
| **Email** | Resend | Transactional email for notifications and invites. |
| **File Storage** | Supabase Storage | Project-scoped buckets. RLS on storage. Signed URLs for private content. |
| **Hosting** | Vercel or Cloudflare Pages | Nuxt 3 deploys cleanly to either. Vercel for simplicity, Cloudflare for cost at scale. |

---

## 10. API Endpoints

All endpoints follow REST conventions. All mutations are logged to `activity_log`. All endpoints enforce RLS.

### 10.1 Projects

```
GET    /api/projects                    — List projects for current user
POST   /api/projects                    — Create project
GET    /api/projects/:id                — Get project details
PATCH  /api/projects/:id                — Update project
DELETE /api/projects/:id                — Archive project
GET    /api/projects/:id/members        — List project members
POST   /api/projects/:id/members        — Invite member
PATCH  /api/projects/:id/members/:uid   — Update member role
DELETE /api/projects/:id/members/:uid   — Remove member
```

### 10.2 Documents

```
GET    /api/projects/:pid/documents          — List documents (tree structure)
POST   /api/projects/:pid/documents          — Create document
GET    /api/documents/:id                    — Get document metadata
PATCH  /api/documents/:id                    — Update document (title, tags, parent, sort)
DELETE /api/documents/:id                    — Delete document
GET    /api/documents/:id/content            — Get document content (JSON snapshot)
PUT    /api/documents/:id/content            — Update document content (for AI writes)
```

### 10.3 Tasks

```
GET    /api/projects/:pid/tasks              — List tasks (filterable: status, assignee, priority, due_date, tags)
POST   /api/projects/:pid/tasks              — Create task
GET    /api/tasks/:id                        — Get task detail
PATCH  /api/tasks/:id                        — Update task
DELETE /api/tasks/:id                        — Delete task
POST   /api/projects/:pid/tasks/bulk         — Bulk update tasks (status, assignee, priority)
```

### 10.4 Comments

```
GET    /api/comments?target_type=X&target_id=Y  — List comments for target
POST   /api/comments                             — Create comment
PATCH  /api/comments/:id                         — Update comment
DELETE /api/comments/:id                         — Delete comment
POST   /api/comments/:id/resolve                 — Resolve comment thread
```

### 10.5 Notifications

```
GET    /api/notifications                    — List notifications for current user
PATCH  /api/notifications/:id/read           — Mark as read
POST   /api/notifications/read-all           — Mark all as read
```

### 10.6 Search

```
GET    /api/search?q=term&project_id=X       — Full-text search across docs, tasks, comments
```

### 10.7 Activity Log

```
GET    /api/projects/:pid/activity           — Project activity feed
GET    /api/activity                         — Org-wide activity (super admin only)
```

### 10.8 AI Assistant

```
POST   /api/ai/chat                          — Send message to AI assistant
  Body: { message, scope: 'inline' | 'project' | 'system', project_id?, document_id?, context? }
  Response: { response, actions_taken: [{ endpoint, method, params, result }] }
```

The AI endpoint receives the message, resolves scope and permissions, assembles context (project docs, tasks, activity), and calls the Anthropic API with tool definitions matching the endpoints above. Actions taken are returned for transparency and logged to `activity_log`.

---

## 11. UI Layout

### 11.1 App Shell

```
┌──────────────────────────────────────────────────────┐
│  Top Bar: Org name, Search (Cmd+K), Notifications,  │
│           User avatar/menu, Theme toggle             │
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│  Sidebar   │  Main Content Area                      │
│            │                                         │
│  Projects  │  (Document editor, Task views,          │
│  └ Docs    │   Project dashboard, Settings)          │
│    └ Sub   │                                         │
│  ────────  │                                         │
│  Views     │                                         │
│  - List    │                                         │
│  - Kanban  │                                         │
│  - Calendar│                                         │
│  ────────  │                                         │
│  AI Chat   │                                         │
│            │                                         │
├────────────┴─────────────────────────────────────────┤
│  (AI Chat panel — slides in from right when active)  │
└──────────────────────────────────────────────────────┘
```

### 11.2 Key Screens

- **Project Dashboard:** Overview of recent docs, task summary (by status), recent activity, team members online.
- **Document Editor:** Full-width editor with optional sidebar (outline, comments, or AI). Document tree in left sidebar.
- **Task Views:** Toggle between List/Kanban/Calendar. Filter bar at top. Quick-add inline.
- **Settings:** Project settings (members, roles, notifications) and user settings (profile, theme, notification preferences).
- **Admin Panel:** (Super admin only) Org settings, user management, system activity log, AI usage stats.

---

## 12. Implementation Roadmap

### Phase 1 — Foundation (Weeks 1–3)

- [ ] Supabase project setup: database, auth, RLS policies
- [ ] Nuxt 3 project scaffold with design system (colors, typography, spacing, dark/light theme)
- [ ] Auth: email/password sign-up, magic link sign-in, session management
- [ ] Org and project CRUD with API endpoints
- [ ] Project member management and invite flow
- [ ] Role enforcement at API and RLS level
- [ ] Basic app shell: sidebar, top bar, routing
- [ ] Project dashboard (placeholder content)

**Milestone:** A user can sign up, create an org, create projects, invite team members with roles, and navigate the app shell.

### Phase 2 — Document Editor (Weeks 4–7)

- [ ] Tiptap integration with core block types: text, headings, image, divider, toggle, callout, code, blockquote
- [ ] Slash command menu for block insertion
- [ ] Rich text formatting toolbar (contextual on selection)
- [ ] Block drag-and-drop reordering
- [ ] Markdown keyboard shortcuts
- [ ] Image upload (drag-drop, paste, file picker) → Supabase Storage
- [ ] Document tree in sidebar (nested docs, drag to reorder)
- [ ] Document CRUD via API
- [ ] Autosave with debounce
- [ ] Document outline panel

**Milestone:** Users can create, edit, nest, and organize rich documents within projects. Full API coverage for document operations.

### Phase 3 — Tasks & Views (Weeks 8–10)

- [ ] Task block type in Tiptap (checkbox, assignee, due date, priority inline)
- [ ] Task CRUD API with full filtering/sorting
- [ ] Task ↔ block sync (create block → create record, edit either → both update)
- [ ] List view with filters, sorting, grouping, bulk actions
- [ ] Kanban view with drag-and-drop status updates
- [ ] Calendar view (week/month, drag to reschedule)
- [ ] Task detail panel (slide-over or modal)
- [ ] Quick-add task from any view

**Milestone:** Full task management with three synchronized views. Tasks created in documents appear in views and vice versa.

### Phase 4 — Real-Time Collaboration (Weeks 11–13)

- [ ] Hocuspocus server setup and deployment
- [ ] Yjs integration with Tiptap
- [ ] Multi-cursor presence with colored cursors and name labels
- [ ] Live document sync across clients
- [ ] Online/offline indicators
- [ ] Presence awareness in sidebar (who's in which doc)
- [ ] Offline queue with reconnection sync
- [ ] Real-time task status updates across views (Supabase Realtime)

**Milestone:** Multiple users can edit the same document simultaneously with full cursor presence. Task updates propagate live.

### Phase 5 — AI Assistant (Weeks 14–16)

- [ ] API tool definitions for all endpoints
- [ ] AI chat endpoint with scope resolution (inline/project/system)
- [ ] Context assembly: gather relevant docs, tasks, activity for the AI's context window
- [ ] Inline AI: highlight-to-prompt, AI prompt blocks, `/ai` slash command
- [ ] Project-level chat panel (right sidebar)
- [ ] System-level chat for super admins
- [ ] Action transparency: show user what the AI did (endpoints called, changes made)
- [ ] Activity log entries for all AI actions with `actor_type = 'ai'`

**Milestone:** AI assistant can read, create, edit, and manage all content in the system through natural language. Every action is logged and permissioned.

### Phase 6 — Notifications, Comments & Polish (Weeks 17–18)

- [ ] Comment system: threaded comments on documents, tasks, and blocks
- [ ] `@mention` in comments and documents with autocomplete
- [ ] In-app notification system (Supabase Realtime)
- [ ] Email notifications via Resend (immediate + digest options)
- [ ] Notification preferences per user
- [ ] Global search (Cmd+K) with full-text across docs, tasks, comments
- [ ] Recent searches and recently visited
- [ ] Admin panel for super admins
- [ ] Performance optimization and polish pass

**Milestone:** Fully functional v1 with collaboration, notifications, search, and AI. Ready for daily team use.

---

## 13. Future Considerations (Post-V1)

These are explicitly out of scope for v1 but the architecture should not prevent them:

- **Templates:** Project templates and document templates for repeatable structures.
- **Custom fields:** User-defined metadata on tasks (dropdown, number, date, text fields).
- **Automations:** "When task moves to Done, notify channel" style rules.
- **Integrations:** GitHub (link PRs to tasks), Slack (notifications), email-in (create tasks via email).
- **Multi-org:** Users belonging to multiple organizations.
- **Public sharing:** Share a document or project view via public link (read-only).
- **Version history:** Document revision history with diff view and rollback.
- **Mobile app:** Native iOS/Android or responsive PWA.
- **OAuth providers:** Google and GitHub sign-in.
- **File attachments:** Beyond images — PDFs, documents, etc. attached to tasks or docs.
- **Time tracking:** Optional time logging on tasks.
- **Recurring tasks:** Tasks that auto-regenerate on a schedule.

---

## 14. Open Questions

1. **Naming:** "Basecamp" is a placeholder (and a trademark). Final product name TBD.
2. **Hocuspocus hosting:** Self-hosted on a VPS (e.g., Railway, Fly.io) or Hocuspocus Cloud? Needs to support WebSocket connections at team scale.
3. **AI context limits:** For large projects with many documents, how do we select which content to include in the AI's context window? Likely a RAG approach with embeddings, but v1 could use a simpler heuristic (most recently edited docs + all tasks).
4. **Editor content format:** Tiptap outputs JSON by default. Do we also store/export Markdown for portability?
5. **Offline support depth:** Full offline editing with conflict resolution, or just graceful degradation (read-only cache + edit queue)?

---

## Appendix A: Naming Candidates

To be discussed. Some options:

- Basecamp (placeholder — trademarked)
- Forge
- Workbench
- Draftboard
- Planhaus
- Buildpad

---

## Appendix B: Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Tasks as dual-citizens (block + record) | Block in doc + row in tasks table | Enables inline authoring AND project-wide views from the same data source |
| Separate `document_content` table | Yjs binary + JSON snapshot | Keeps document metadata queries fast; binary CRDT state is large and only needed for editing |
| AI uses same REST API as frontend | No special internal API | Auditability, permission enforcement, and free extensibility for future integrations |
| RLS over application-level auth | Supabase RLS policies | Defense in depth. Even if API middleware is bypassed, the database enforces access. |
| Tiptap over Slate/ProseMirror direct | Tiptap | Higher-level API, better DX, first-party collab plugin, active ecosystem |
| Yjs over OT (Operational Transform) | Yjs CRDTs | No central authority needed, better offline support, proven with Tiptap |
