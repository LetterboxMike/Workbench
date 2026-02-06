import { defineEventHandler, getQuery } from 'h3';
import {
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getCurrentUser,
  getCurrentUserDb,
  getSystemRole,
  getSystemRoleDb,
  useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const query = getQuery(event);
  const includeAll = query.include_all === '1' || query.include_all === 'true';

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    const activeOrgId = await getActiveOrgIdForUserDb(event, user.id);

    // Get user's org memberships
    const orgMemberships = await db.orgMembers.getUserOrgs(user.id);
    const orgRoles = new Map(orgMemberships.map((m) => [m.org_id, m.system_role]));

    // Get projects user has access to
    const projects = await db.projects.listForUser(user.id, includeAll ? undefined : (activeOrgId || undefined));

    // Get project stats and roles
    const enrichedProjects = await Promise.all(
      projects.map(async (project) => {
        const stats = await db.projects.getStats(project.id);
        const projectMember = await db.projectMembers.get(project.id, user.id);
        const systemRole = orgRoles.get(project.org_id);
        const role = projectMember?.role || (systemRole === 'super_admin' ? 'admin' : null);

        return {
          ...project,
          role,
          open_tasks: stats.open_tasks,
          document_count: stats.document_count
        };
      })
    );

    return {
      data: enrichedProjects.sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const store = getStore();
  const activeOrgId = getActiveOrgIdForUser(event, user.id);

  const orgRoles = new Map(
    store.org_members.filter((member) => member.user_id === user.id).map((member) => [member.org_id, member.system_role])
  );

  const projectRoles = new Map(
    store.project_members.filter((member) => member.user_id === user.id).map((member) => [member.project_id, member.role])
  );

  const projects = store.projects
    .filter((project) => {
      if (!includeAll && activeOrgId && project.org_id !== activeOrgId) {
        return false;
      }

      const systemRole = orgRoles.get(project.org_id);
      return systemRole === 'super_admin' || projectRoles.has(project.id);
    })
    .filter((project) => !project.archived_at)
    .map((project) => ({
      ...project,
      role: projectRoles.get(project.id) || (getSystemRole(project.org_id, user.id) === 'super_admin' ? 'admin' : null),
      open_tasks: store.tasks.filter((task) => task.project_id === project.id && task.status !== 'done').length,
      document_count: store.documents.filter((document) => document.project_id === project.id && !document.is_archived).length
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    data: projects
  };
});
