import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAdmin,
  assertProjectAdminDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.pid;
  const memberUserId = event.context.params?.uid;

  if (!projectId || !memberUserId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id and member id are required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAdminDb(projectId, user.id);

    const membership = await db.projectMembers.get(projectId, memberUserId);

    if (!membership) {
      throw createError({ statusCode: 404, statusMessage: 'Member not found.' });
    }

    // Check if removing the last admin
    if (membership.role === 'admin') {
      const adminCount = await db.projectMembers.countAdmins(projectId);

      if (adminCount <= 1) {
        throw createError({ statusCode: 400, statusMessage: 'Project must keep at least one admin.' });
      }
    }

    await db.projectMembers.delete(projectId, memberUserId);

    const project = await db.projects.get(projectId);

    if (project) {
      await logActivityDb({
        orgId: project.org_id,
        projectId,
        actorId: user.id,
        action: 'removed',
        targetType: 'member',
        targetId: memberUserId
      });
    }

    return {
      data: {
        removed: true,
        user_id: memberUserId
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAdmin(projectId, user.id);

  const store = getStore();
  const index = store.project_members.findIndex((member) => member.project_id === projectId && member.user_id === memberUserId);

  if (index === -1) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found.' });
  }

  const membership = store.project_members[index]!;

  if (membership.role === 'admin') {
    const adminCount = store.project_members.filter((member) => member.project_id === projectId && member.role === 'admin').length;

    if (adminCount <= 1) {
      throw createError({ statusCode: 400, statusMessage: 'Project must keep at least one admin.' });
    }
  }

  store.project_members.splice(index, 1);

  const project = store.projects.find((item) => item.id === projectId);

  if (project) {
    logActivity({
      orgId: project.org_id,
      projectId,
      actorId: user.id,
      action: 'removed',
      targetType: 'member',
      targetId: memberUserId
    });
  }

  return {
    data: {
      removed: true,
      user_id: memberUserId
    }
  };
});
