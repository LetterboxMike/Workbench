import { createError, defineEventHandler } from 'h3';
import {
  getCurrentUser,
  getCurrentUserDb,
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getSystemRole,
  getSystemRoleDb,
  useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();

  if (useDb) {
    // Supabase mode
    const user = await getCurrentUserDb(event);
    const activeOrgId = await getActiveOrgIdForUserDb(event, user.id);

    if (!activeOrgId) {
      throw createError({ statusCode: 400, statusMessage: 'No active organization.' });
    }

    const systemRole = await getSystemRoleDb(activeOrgId, user.id);

    if (systemRole !== 'super_admin') {
      throw createError({ statusCode: 403, statusMessage: 'Super admin access required.' });
    }

    const stats = await db.adminStats.getOrgStats(activeOrgId);

    return {
      data: {
        org_id: activeOrgId,
        ...stats
      }
    };
  }

  // Local mode
  const user = await getCurrentUser(event);
  const activeOrgId = getActiveOrgIdForUser(event, user.id);

  if (!activeOrgId) {
    throw createError({ statusCode: 400, statusMessage: 'No active organization.' });
  }

  const systemRole = getSystemRole(activeOrgId, user.id);

  if (systemRole !== 'super_admin') {
    throw createError({ statusCode: 403, statusMessage: 'Super admin access required.' });
  }

  const store = getStore();

  const userCount = store.org_members.filter((m) => m.org_id === activeOrgId).length;
  const projectCount = store.projects.filter((p) => p.org_id === activeOrgId && !p.archived_at).length;

  const orgProjects = store.projects.filter((p) => p.org_id === activeOrgId).map((p) => p.id);
  const taskCount = store.tasks.filter((t) => orgProjects.includes(t.project_id)).length;
  const documentCount = store.documents.filter((d) => orgProjects.includes(d.project_id) && !d.is_archived).length;

  return {
    data: {
      org_id: activeOrgId,
      user_count: userCount,
      project_count: projectCount,
      task_count: taskCount,
      document_count: documentCount
    }
  };
});
