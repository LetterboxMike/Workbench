import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAdmin,
  assertProjectAdminDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { nowIso } from '~/server/utils/id';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.id;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAdminDb(projectId, user.id);

    const existingProject = await db.projects.get(projectId);

    if (!existingProject) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
    }

    const project = await db.projects.archive(projectId);

    await logActivityDb({
      orgId: project.org_id,
      projectId: project.id,
      actorId: user.id,
      action: 'archived',
      targetType: 'project',
      targetId: project.id
    });

    return { data: project };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAdmin(projectId, user.id);

  const store = getStore();
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  project.archived_at = nowIso();

  logActivity({
    orgId: project.org_id,
    projectId: project.id,
    actorId: user.id,
    action: 'archived',
    targetType: 'project',
    targetId: project.id
  });

  return {
    data: project
  };
});
