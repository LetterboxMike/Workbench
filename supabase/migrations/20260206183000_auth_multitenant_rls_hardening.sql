-- Workbench auth + tenant hardening
-- Date: 2026-02-06

CREATE OR REPLACE FUNCTION public.workbench_user_is_org_member(target_org UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM org_members om
    WHERE om.org_id = target_org
      AND om.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.workbench_user_is_org_super_admin(target_org UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM org_members om
    WHERE om.org_id = target_org
      AND om.user_id = auth.uid()
      AND om.system_role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.workbench_user_can_access_project(target_project UUID, minimum_role TEXT DEFAULT 'viewer')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = target_project
      AND (
        public.workbench_user_is_org_super_admin(p.org_id)
        OR EXISTS (
          SELECT 1
          FROM project_members pm
          WHERE pm.project_id = target_project
            AND pm.user_id = auth.uid()
            AND (
              minimum_role = 'viewer'
              OR (minimum_role = 'editor' AND pm.role IN ('editor', 'admin'))
              OR (minimum_role = 'admin' AND pm.role = 'admin')
            )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.workbench_comment_target_project_id(target_type TEXT, target_id TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  project_id UUID;
BEGIN
  IF target_type = 'document' THEN
    SELECT d.project_id INTO project_id
    FROM documents d
    WHERE d.id::text = target_id;
    RETURN project_id;
  ELSIF target_type = 'task' THEN
    SELECT t.project_id INTO project_id
    FROM tasks t
    WHERE t.id::text = target_id;
    RETURN project_id;
  ELSIF target_type = 'block' THEN
    SELECT d.project_id INTO project_id
    FROM documents d
    WHERE d.id::text = split_part(target_id, ':', 1);
    RETURN project_id;
  END IF;

  RETURN NULL;
END;
$$;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizations_select ON organizations;
DROP POLICY IF EXISTS organizations_insert ON organizations;
DROP POLICY IF EXISTS organizations_update ON organizations;
DROP POLICY IF EXISTS organizations_delete ON organizations;

CREATE POLICY organizations_select ON organizations
FOR SELECT USING (public.workbench_user_is_org_member(id));

CREATE POLICY organizations_insert ON organizations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY organizations_update ON organizations
FOR UPDATE USING (public.workbench_user_is_org_super_admin(id))
WITH CHECK (public.workbench_user_is_org_super_admin(id));

CREATE POLICY organizations_delete ON organizations
FOR DELETE USING (public.workbench_user_is_org_super_admin(id));

DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_insert ON users;
DROP POLICY IF EXISTS users_update ON users;

CREATE POLICY users_select ON users
FOR SELECT USING (
  users.id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM org_members om_self
    JOIN org_members om_target ON om_target.org_id = om_self.org_id
    WHERE om_self.user_id = auth.uid()
      AND om_target.user_id = users.id
  )
);

CREATE POLICY users_insert ON users
FOR INSERT WITH CHECK (users.id = auth.uid());

CREATE POLICY users_update ON users
FOR UPDATE USING (users.id = auth.uid())
WITH CHECK (users.id = auth.uid());

DROP POLICY IF EXISTS org_members_select ON org_members;
DROP POLICY IF EXISTS org_members_insert ON org_members;
DROP POLICY IF EXISTS org_members_update ON org_members;
DROP POLICY IF EXISTS org_members_delete ON org_members;

CREATE POLICY org_members_select ON org_members
FOR SELECT USING (public.workbench_user_is_org_member(org_members.org_id));

CREATE POLICY org_members_insert ON org_members
FOR INSERT WITH CHECK (public.workbench_user_is_org_super_admin(org_members.org_id));

CREATE POLICY org_members_update ON org_members
FOR UPDATE USING (public.workbench_user_is_org_super_admin(org_members.org_id))
WITH CHECK (public.workbench_user_is_org_super_admin(org_members.org_id));

CREATE POLICY org_members_delete ON org_members
FOR DELETE USING (public.workbench_user_is_org_super_admin(org_members.org_id));

DROP POLICY IF EXISTS projects_select ON projects;
DROP POLICY IF EXISTS projects_admin_mutation ON projects;
DROP POLICY IF EXISTS projects_insert ON projects;
DROP POLICY IF EXISTS projects_update ON projects;
DROP POLICY IF EXISTS projects_delete ON projects;

CREATE POLICY projects_select ON projects
FOR SELECT USING (public.workbench_user_can_access_project(projects.id, 'viewer'));

CREATE POLICY projects_insert ON projects
FOR INSERT WITH CHECK (
  public.workbench_user_is_org_member(projects.org_id)
  AND (projects.created_by IS NULL OR projects.created_by = auth.uid())
);

CREATE POLICY projects_update ON projects
FOR UPDATE USING (public.workbench_user_can_access_project(projects.id, 'admin'))
WITH CHECK (public.workbench_user_can_access_project(projects.id, 'admin'));

CREATE POLICY projects_delete ON projects
FOR DELETE USING (public.workbench_user_can_access_project(projects.id, 'admin'));

DROP POLICY IF EXISTS project_members_view ON project_members;
DROP POLICY IF EXISTS project_members_admin_mutation ON project_members;
DROP POLICY IF EXISTS project_members_select ON project_members;
DROP POLICY IF EXISTS project_members_insert ON project_members;
DROP POLICY IF EXISTS project_members_update ON project_members;
DROP POLICY IF EXISTS project_members_delete ON project_members;

CREATE POLICY project_members_select ON project_members
FOR SELECT USING (public.workbench_user_can_access_project(project_members.project_id, 'viewer'));

CREATE POLICY project_members_insert ON project_members
FOR INSERT WITH CHECK (public.workbench_user_can_access_project(project_members.project_id, 'admin'));

CREATE POLICY project_members_update ON project_members
FOR UPDATE USING (public.workbench_user_can_access_project(project_members.project_id, 'admin'))
WITH CHECK (public.workbench_user_can_access_project(project_members.project_id, 'admin'));

CREATE POLICY project_members_delete ON project_members
FOR DELETE USING (public.workbench_user_can_access_project(project_members.project_id, 'admin'));

DROP POLICY IF EXISTS documents_view ON documents;
DROP POLICY IF EXISTS documents_edit ON documents;
DROP POLICY IF EXISTS documents_select ON documents;
DROP POLICY IF EXISTS documents_insert ON documents;
DROP POLICY IF EXISTS documents_update ON documents;
DROP POLICY IF EXISTS documents_delete ON documents;

CREATE POLICY documents_select ON documents
FOR SELECT USING (public.workbench_user_can_access_project(documents.project_id, 'viewer'));

CREATE POLICY documents_insert ON documents
FOR INSERT WITH CHECK (
  public.workbench_user_can_access_project(documents.project_id, 'editor')
  AND (documents.created_by IS NULL OR documents.created_by = auth.uid())
);

CREATE POLICY documents_update ON documents
FOR UPDATE USING (public.workbench_user_can_access_project(documents.project_id, 'editor'))
WITH CHECK (public.workbench_user_can_access_project(documents.project_id, 'editor'));

CREATE POLICY documents_delete ON documents
FOR DELETE USING (public.workbench_user_can_access_project(documents.project_id, 'editor'));

DROP POLICY IF EXISTS document_content_view ON document_content;
DROP POLICY IF EXISTS document_content_edit ON document_content;
DROP POLICY IF EXISTS document_content_select ON document_content;
DROP POLICY IF EXISTS document_content_insert ON document_content;
DROP POLICY IF EXISTS document_content_update ON document_content;
DROP POLICY IF EXISTS document_content_delete ON document_content;

CREATE POLICY document_content_select ON document_content
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM documents d
    WHERE d.id = document_content.document_id
      AND public.workbench_user_can_access_project(d.project_id, 'viewer')
  )
);

CREATE POLICY document_content_insert ON document_content
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM documents d
    WHERE d.id = document_content.document_id
      AND public.workbench_user_can_access_project(d.project_id, 'editor')
  )
);

CREATE POLICY document_content_update ON document_content
FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM documents d
    WHERE d.id = document_content.document_id
      AND public.workbench_user_can_access_project(d.project_id, 'editor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM documents d
    WHERE d.id = document_content.document_id
      AND public.workbench_user_can_access_project(d.project_id, 'editor')
  )
);

CREATE POLICY document_content_delete ON document_content
FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM documents d
    WHERE d.id = document_content.document_id
      AND public.workbench_user_can_access_project(d.project_id, 'editor')
  )
);

DROP POLICY IF EXISTS tasks_view ON tasks;
DROP POLICY IF EXISTS tasks_edit ON tasks;
DROP POLICY IF EXISTS tasks_select ON tasks;
DROP POLICY IF EXISTS tasks_insert ON tasks;
DROP POLICY IF EXISTS tasks_update ON tasks;
DROP POLICY IF EXISTS tasks_delete ON tasks;

CREATE POLICY tasks_select ON tasks
FOR SELECT USING (public.workbench_user_can_access_project(tasks.project_id, 'viewer'));

CREATE POLICY tasks_insert ON tasks
FOR INSERT WITH CHECK (
  public.workbench_user_can_access_project(tasks.project_id, 'editor')
  AND (tasks.created_by IS NULL OR tasks.created_by = auth.uid())
);

CREATE POLICY tasks_update ON tasks
FOR UPDATE USING (public.workbench_user_can_access_project(tasks.project_id, 'editor'))
WITH CHECK (public.workbench_user_can_access_project(tasks.project_id, 'editor'));

CREATE POLICY tasks_delete ON tasks
FOR DELETE USING (public.workbench_user_can_access_project(tasks.project_id, 'editor'));

DROP POLICY IF EXISTS comments_view ON comments;
DROP POLICY IF EXISTS comments_create ON comments;
DROP POLICY IF EXISTS comments_edit ON comments;
DROP POLICY IF EXISTS comments_delete ON comments;
DROP POLICY IF EXISTS comments_select ON comments;
DROP POLICY IF EXISTS comments_insert ON comments;
DROP POLICY IF EXISTS comments_update ON comments;

CREATE POLICY comments_select ON comments
FOR SELECT USING (
  public.workbench_user_can_access_project(
    public.workbench_comment_target_project_id(comments.target_type, comments.target_id),
    'viewer'
  )
);

CREATE POLICY comments_insert ON comments
FOR INSERT WITH CHECK (
  comments.author_id = auth.uid()
  AND public.workbench_user_can_access_project(
    public.workbench_comment_target_project_id(comments.target_type, comments.target_id),
    'viewer'
  )
);

CREATE POLICY comments_update ON comments
FOR UPDATE USING (
  comments.author_id = auth.uid()
  OR public.workbench_user_can_access_project(
    public.workbench_comment_target_project_id(comments.target_type, comments.target_id),
    'editor'
  )
)
WITH CHECK (
  comments.author_id = auth.uid()
  OR public.workbench_user_can_access_project(
    public.workbench_comment_target_project_id(comments.target_type, comments.target_id),
    'editor'
  )
);

CREATE POLICY comments_delete ON comments
FOR DELETE USING (
  comments.author_id = auth.uid()
  OR public.workbench_user_can_access_project(
    public.workbench_comment_target_project_id(comments.target_type, comments.target_id),
    'editor'
  )
);

DROP POLICY IF EXISTS notifications_self ON notifications;
DROP POLICY IF EXISTS notifications_self_update ON notifications;
DROP POLICY IF EXISTS notifications_select ON notifications;
DROP POLICY IF EXISTS notifications_insert ON notifications;
DROP POLICY IF EXISTS notifications_update ON notifications;

CREATE POLICY notifications_select ON notifications
FOR SELECT USING (notifications.user_id = auth.uid());

CREATE POLICY notifications_insert ON notifications
FOR INSERT WITH CHECK (notifications.user_id = auth.uid());

CREATE POLICY notifications_update ON notifications
FOR UPDATE USING (notifications.user_id = auth.uid())
WITH CHECK (notifications.user_id = auth.uid());

DROP POLICY IF EXISTS activity_project_view ON activity_log;
DROP POLICY IF EXISTS activity_select ON activity_log;
DROP POLICY IF EXISTS activity_insert ON activity_log;

CREATE POLICY activity_select ON activity_log
FOR SELECT USING (
  (
    activity_log.project_id IS NOT NULL
    AND public.workbench_user_can_access_project(activity_log.project_id, 'viewer')
  )
  OR (
    activity_log.project_id IS NULL
    AND activity_log.org_id IS NOT NULL
    AND public.workbench_user_is_org_super_admin(activity_log.org_id)
  )
);

CREATE POLICY activity_insert ON activity_log
FOR INSERT WITH CHECK (
  activity_log.org_id IS NOT NULL
  AND public.workbench_user_is_org_member(activity_log.org_id)
  AND (activity_log.actor_id IS NULL OR activity_log.actor_id = auth.uid())
);

DROP POLICY IF EXISTS invitations_view ON invitations;
DROP POLICY IF EXISTS invitations_admin_mutation ON invitations;
DROP POLICY IF EXISTS invitations_select ON invitations;
DROP POLICY IF EXISTS invitations_insert ON invitations;
DROP POLICY IF EXISTS invitations_update ON invitations;
DROP POLICY IF EXISTS invitations_delete ON invitations;

CREATE POLICY invitations_select ON invitations
FOR SELECT USING (public.workbench_user_can_access_project(invitations.project_id, 'admin'));

CREATE POLICY invitations_insert ON invitations
FOR INSERT WITH CHECK (
  public.workbench_user_can_access_project(invitations.project_id, 'admin')
  AND public.workbench_user_is_org_member(invitations.org_id)
);

CREATE POLICY invitations_update ON invitations
FOR UPDATE USING (public.workbench_user_can_access_project(invitations.project_id, 'admin'))
WITH CHECK (public.workbench_user_can_access_project(invitations.project_id, 'admin'));

CREATE POLICY invitations_delete ON invitations
FOR DELETE USING (public.workbench_user_can_access_project(invitations.project_id, 'admin'));

CREATE OR REPLACE FUNCTION public.workbench_sync_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  resolved_name TEXT;
BEGIN
  resolved_name := COALESCE(
    NULLIF(new.raw_user_meta_data ->> 'name', ''),
    NULLIF(split_part(COALESCE(new.email, ''), '@', 1), ''),
    'User'
  );

  INSERT INTO public.users (id, email, name, avatar_url, created_at)
  VALUES (
    new.id,
    COALESCE(new.email, ''),
    resolved_name,
    NULLIF(new.raw_user_meta_data ->> 'avatar_url', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(users.name, ''), EXCLUDED.name),
    avatar_url = COALESCE(users.avatar_url, EXCLUDED.avatar_url);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS workbench_on_auth_user_created ON auth.users;
CREATE TRIGGER workbench_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.workbench_sync_auth_user();

INSERT INTO public.users (id, email, name, avatar_url, created_at)
SELECT
  au.id,
  COALESCE(au.email, ''),
  COALESCE(
    NULLIF(au.raw_user_meta_data ->> 'name', ''),
    NULLIF(split_part(COALESCE(au.email, ''), '@', 1), ''),
    'User'
  ),
  NULLIF(au.raw_user_meta_data ->> 'avatar_url', ''),
  NOW()
FROM auth.users au
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  name = COALESCE(NULLIF(users.name, ''), EXCLUDED.name),
  avatar_url = COALESCE(users.avatar_url, EXCLUDED.avatar_url);
