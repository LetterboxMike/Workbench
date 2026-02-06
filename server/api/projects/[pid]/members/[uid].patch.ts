import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAdmin,
  assertProjectAdminDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { PROJECT_ROLES } from '~/server/utils/constants';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

interface UpdateMemberRoleBody {
  role: 'admin' | 'editor' | 'viewer';
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.pid;
  const memberUserId = event.context.params?.uid;

  if (!projectId || !memberUserId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id and member id are required.' });
  }

  const body = await readJsonBody<UpdateMemberRoleBody>(event);

  if (!PROJECT_ROLES.includes(body.role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid role.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAdminDb(projectId, user.id);

    const membership = await db.projectMembers.get(projectId, memberUserId);

    if (!membership) {
      throw createError({ statusCode: 404, statusMessage: 'Member not found.' });
    }

    // Check if demoting the last admin
    if (membership.role === 'admin' && body.role !== 'admin') {
      const adminCount = await db.projectMembers.countAdmins(projectId);

      if (adminCount <= 1) {
        throw createError({ statusCode: 400, statusMessage: 'Project must keep at least one admin.' });
      }
    }

    const updatedMembership = await db.projectMembers.updateRole(projectId, memberUserId, body.role);

    const project = await db.projects.get(projectId);

    if (project) {
      await logActivityDb({
        orgId: project.org_id,
        projectId,
        actorId: user.id,
        action: 'role_updated',
        targetType: 'member',
        targetId: memberUserId,
        metadata: { role: body.role }
      });
    }

    return { data: updatedMembership };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAdmin(projectId, user.id);

  const store = getStore();
  const membership = store.project_members.find((member) => member.project_id === projectId && member.user_id === memberUserId);

  if (!membership) {
    throw createError({ statusCode: 404, statusMessage: 'Member not found.' });
  }

  if (membership.role === 'admin' && body.role !== 'admin') {
    const adminCount = store.project_members.filter((member) => member.project_id === projectId && member.role === 'admin').length;

    if (adminCount <= 1) {
      throw createError({ statusCode: 400, statusMessage: 'Project must keep at least one admin.' });
    }
  }

  membership.role = body.role;

  const project = store.projects.find((item) => item.id === projectId);

  if (project) {
    logActivity({
      orgId: project.org_id,
      projectId,
      actorId: user.id,
      action: 'role_updated',
      targetType: 'member',
      targetId: memberUserId,
      metadata: { role: body.role }
    });
  }

  return {
    data: membership
  };
});
