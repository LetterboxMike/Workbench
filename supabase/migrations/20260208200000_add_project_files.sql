-- Project Files / File Management Migration
-- Date: 2026-02-08

-- Create project_files table for file management
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL DEFAULT 'project' CHECK (attachment_type IN ('project', 'document', 'task')),
  attachment_id UUID,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT
);

-- Index for querying files by project
CREATE INDEX IF NOT EXISTS idx_project_files_project ON project_files(project_id);

-- Index for querying files by attachment
CREATE INDEX IF NOT EXISTS idx_project_files_attachment ON project_files(attachment_type, attachment_id);

-- Index for querying files by uploader
CREATE INDEX IF NOT EXISTS idx_project_files_uploader ON project_files(uploaded_by);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- View policy: can view files if member of the project
DROP POLICY IF EXISTS project_files_view ON project_files;
CREATE POLICY project_files_view ON project_files FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = project_files.project_id
      AND pm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE p.id = project_files.project_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
);

-- Mutation policy: can upload/edit/delete files if admin or editor in project
DROP POLICY IF EXISTS project_files_mutation ON project_files;
CREATE POLICY project_files_mutation ON project_files FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = project_files.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
  OR EXISTS (
    SELECT 1
    FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE p.id = project_files.project_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1
    FROM project_members pm
    WHERE pm.project_id = project_files.project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'editor')
  )
  OR EXISTS (
    SELECT 1
    FROM projects p
    JOIN org_members om ON om.org_id = p.org_id
    WHERE p.id = project_files.project_id
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  )
);
