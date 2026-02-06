-- Workbench / Basecamp initial schema
-- Date: 2026-02-05

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_members (
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  system_role TEXT NOT NULL CHECK (system_role IN ('super_admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  settings JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS document_content (
  document_id UUID PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  yjs_state BYTEA,
  last_snapshot JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  source_block_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent')),
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  is_detached BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('document', 'task', 'block')),
  target_id TEXT NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'ai', 'system')),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (project_id, email)
);

CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_document_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_source_doc ON tasks(source_document_id);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_log(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_actor ON activity_log(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_tasks_fts ON tasks USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_comments_fts ON comments USING GIN (to_tsvector('english', body));

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_select ON projects;
CREATE POLICY projects_select ON projects FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM org_members om
    WHERE om.org_id = projects.org_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
);

DROP POLICY IF EXISTS projects_admin_mutation ON projects;
CREATE POLICY projects_admin_mutation ON projects FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM org_members om
    WHERE om.org_id = projects.org_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = projects.id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM org_members om
    WHERE om.org_id = projects.org_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
);

DROP POLICY IF EXISTS documents_view ON documents;
CREATE POLICY documents_view ON documents FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = documents.project_id
      AND pm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS documents_edit ON documents;
CREATE POLICY documents_edit ON documents FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = documents.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = documents.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
);

DROP POLICY IF EXISTS tasks_view ON tasks;
CREATE POLICY tasks_view ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS tasks_edit ON tasks;
CREATE POLICY tasks_edit ON tasks FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
);

DROP POLICY IF EXISTS notifications_self ON notifications;
CREATE POLICY notifications_self ON notifications FOR SELECT USING (notifications.user_id = auth.uid());
DROP POLICY IF EXISTS notifications_self_update ON notifications;
CREATE POLICY notifications_self_update ON notifications FOR UPDATE USING (notifications.user_id = auth.uid());

DROP POLICY IF EXISTS activity_project_view ON activity_log;
CREATE POLICY activity_project_view ON activity_log FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = activity_log.project_id
      AND pm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS project_members_view ON project_members;
CREATE POLICY project_members_view ON project_members FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM project_members self_pm
    WHERE self_pm.project_id = project_members.project_id
      AND self_pm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS project_members_admin_mutation ON project_members;
CREATE POLICY project_members_admin_mutation ON project_members FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM project_members admin_pm
    WHERE admin_pm.project_id = project_members.project_id
      AND admin_pm.user_id = auth.uid()
      AND admin_pm.role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE p.id = project_members.project_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM project_members admin_pm
    WHERE admin_pm.project_id = project_members.project_id
      AND admin_pm.user_id = auth.uid()
      AND admin_pm.role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE p.id = project_members.project_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
);

DROP POLICY IF EXISTS document_content_view ON document_content;
CREATE POLICY document_content_view ON document_content FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM documents d
    JOIN project_members pm ON pm.project_id = d.project_id
    WHERE d.id = document_content.document_id
      AND pm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS document_content_edit ON document_content;
CREATE POLICY document_content_edit ON document_content FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM documents d
    JOIN project_members pm ON pm.project_id = d.project_id
    WHERE d.id = document_content.document_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM documents d
    JOIN project_members pm ON pm.project_id = d.project_id
    WHERE d.id = document_content.document_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
);

DROP POLICY IF EXISTS comments_view ON comments;
CREATE POLICY comments_view ON comments FOR SELECT USING (
  (
    comments.target_type = 'document'
    AND EXISTS (
      SELECT 1
      FROM documents d
      JOIN project_members pm ON pm.project_id = d.project_id
      WHERE d.id::text = comments.target_id
        AND pm.user_id = auth.uid()
    )
  )
  OR (
    comments.target_type = 'task'
    AND EXISTS (
      SELECT 1
      FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id
      WHERE t.id::text = comments.target_id
        AND pm.user_id = auth.uid()
    )
  )
  OR (
    comments.target_type = 'block'
    AND EXISTS (
      SELECT 1
      FROM documents d
      JOIN project_members pm ON pm.project_id = d.project_id
      WHERE d.id::text = split_part(comments.target_id, ':', 1)
        AND pm.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS comments_create ON comments;
CREATE POLICY comments_create ON comments FOR INSERT WITH CHECK (
  comments.author_id = auth.uid()
  AND (
    (
      comments.target_type = 'document'
      AND EXISTS (
        SELECT 1
        FROM documents d
        JOIN project_members pm ON pm.project_id = d.project_id
        WHERE d.id::text = comments.target_id
          AND pm.user_id = auth.uid()
      )
    )
    OR (
      comments.target_type = 'task'
      AND EXISTS (
        SELECT 1
        FROM tasks t
        JOIN project_members pm ON pm.project_id = t.project_id
        WHERE t.id::text = comments.target_id
          AND pm.user_id = auth.uid()
      )
    )
    OR (
      comments.target_type = 'block'
      AND EXISTS (
        SELECT 1
        FROM documents d
        JOIN project_members pm ON pm.project_id = d.project_id
        WHERE d.id::text = split_part(comments.target_id, ':', 1)
          AND pm.user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS comments_edit ON comments;
CREATE POLICY comments_edit ON comments FOR UPDATE USING (
  comments.author_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM documents d
    JOIN project_members pm ON pm.project_id = d.project_id
    WHERE comments.target_type = 'document'
      AND d.id::text = comments.target_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
  OR EXISTS (
    SELECT 1
    FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE comments.target_type = 'task'
      AND t.id::text = comments.target_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
) WITH CHECK (true);

DROP POLICY IF EXISTS comments_delete ON comments;
CREATE POLICY comments_delete ON comments FOR DELETE USING (
  comments.author_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM documents d
    JOIN project_members pm ON pm.project_id = d.project_id
    WHERE comments.target_type = 'document'
      AND d.id::text = comments.target_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
  OR EXISTS (
    SELECT 1
    FROM tasks t
    JOIN project_members pm ON pm.project_id = t.project_id
    WHERE comments.target_type = 'task'
      AND t.id::text = comments.target_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
);

DROP POLICY IF EXISTS invitations_view ON invitations;
CREATE POLICY invitations_view ON invitations FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = invitations.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM org_members om
    WHERE om.org_id = invitations.org_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
);

DROP POLICY IF EXISTS invitations_admin_mutation ON invitations;
CREATE POLICY invitations_admin_mutation ON invitations FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = invitations.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM org_members om
    WHERE om.org_id = invitations.org_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = invitations.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
  )
  OR EXISTS (
    SELECT 1
    FROM org_members om
    WHERE om.org_id = invitations.org_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
);
