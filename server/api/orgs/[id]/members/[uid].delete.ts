import { createError, defineEventHandler } from 'h3';
import {
  assertOrgSuperAdmin,
  assertOrgSuperAdminDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import { logActivityAuto } from '~/server/utils/activity';

export default defineEventHandler(async (event) => {
  const isDb = useDbAuth();
  const user = isDb ? await getCurrentUserDb(event) : await getCurrentUser(event);
  const orgId = event.context.params?.id;
  const memberUserId = event.context.params?.uid;

  if (!orgId || !memberUserId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization id and member id are required.' });
  }

  // Verify super admin permission
  if (isDb) {
    await assertOrgSuperAdminDb(orgId, user.id);
  } else {
    assertOrgSuperAdmin(orgId, user.id);
  }

  // Prevent self-deletion
  if (memberUserId === user.id) {
    throw createError({ statusCode: 400, statusMessage: 'You cannot remove yourself from the organization.' });
  }

  if (isDb) {
    // Database mode
    const member = await db.orgMembers.get(orgId, memberUserId);

    if (!member) {
      throw createError({ statusCode: 404, statusMessage: 'Organization member not found.' });
    }

    // Check if removing last super admin
    if (member.system_role === 'super_admin') {
      const allMembers = await db.orgMembers.list(orgId);
      const superAdminCount = allMembers.filter((m) => m.system_role === 'super_admin').length;

      if (superAdminCount <= 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot remove the last super admin. Promote another member first.'
        });
      }
    }

    // Remove from org (cascades to project memberships via DB constraints)
    await db.orgMembers.delete(orgId, memberUserId);
  } else {
    // Store mode
    const store = getStore();
    const memberIndex = store.org_members.findIndex(
      (m) => m.org_id === orgId && m.user_id === memberUserId
    );

    if (memberIndex === -1) {
      throw createError({ statusCode: 404, statusMessage: 'Organization member not found.' });
    }

    const member = store.org_members[memberIndex]!;

    // Check if removing last super admin
    if (member.system_role === 'super_admin') {
      const superAdminCount = store.org_members.filter(
        (m) => m.org_id === orgId && m.system_role === 'super_admin'
      ).length;

      if (superAdminCount <= 1) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot remove the last super admin. Promote another member first.'
        });
      }
    }

    // Remove from org
    store.org_members.splice(memberIndex, 1);

    // Remove from all projects in this org
    store.project_members = store.project_members.filter((pm) => {
      const project = store.projects.find((p) => p.id === pm.project_id);
      return !(project?.org_id === orgId && pm.user_id === memberUserId);
    });
  }

  // Log activity
  await logActivityAuto({
    orgId,
    actorId: user.id,
    action: 'removed_member',
    targetType: 'org_member',
    targetId: memberUserId,
    metadata: {
      removed_user_id: memberUserId
    }
  });

  return { data: { success: true } };
});
