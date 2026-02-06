import { createError, defineEventHandler } from 'h3';
import {
  assertOrgSuperAdmin,
  assertOrgSuperAdminDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

interface UpdateOrgMemberBody {
  system_role: 'super_admin' | 'member';
}

const SYSTEM_ROLES = new Set(['super_admin', 'member']);

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const orgId = event.context.params?.id;
  const memberUserId = event.context.params?.uid;

  if (!orgId || !memberUserId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization id and member id are required.' });
  }

  const body = await readJsonBody<UpdateOrgMemberBody>(event);

  if (!SYSTEM_ROLES.has(body.system_role)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid system_role.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertOrgSuperAdminDb(orgId, user.id);

    const membership = await db.orgMembers.get(orgId, memberUserId);

    if (!membership) {
      throw createError({ statusCode: 404, statusMessage: 'Organization member not found.' });
    }

    if (membership.system_role === 'super_admin' && body.system_role !== 'super_admin') {
      const allMembers = await db.orgMembers.list(orgId);
      const superAdminCount = allMembers.filter((member) => member.system_role === 'super_admin').length;

      if (superAdminCount <= 1) {
        throw createError({ statusCode: 400, statusMessage: 'Organization must keep at least one super admin.' });
      }
    }

    const updatedMembership = await db.orgMembers.updateRole(orgId, memberUserId, body.system_role);

    return {
      data: updatedMembership
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertOrgSuperAdmin(orgId, user.id);

  const store = getStore();
  const membership = store.org_members.find((member) => member.org_id === orgId && member.user_id === memberUserId);

  if (!membership) {
    throw createError({ statusCode: 404, statusMessage: 'Organization member not found.' });
  }

  if (membership.system_role === 'super_admin' && body.system_role !== 'super_admin') {
    const superAdminCount = store.org_members.filter(
      (member) => member.org_id === orgId && member.system_role === 'super_admin'
    ).length;

    if (superAdminCount <= 1) {
      throw createError({ statusCode: 400, statusMessage: 'Organization must keep at least one super admin.' });
    }
  }

  membership.system_role = body.system_role;

  return {
    data: membership
  };
});
