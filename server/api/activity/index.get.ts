import { createError, defineEventHandler } from 'h3';
import { assertOrgSuperAdmin, getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    const orgMemberships = await db.orgMembers.getUserOrgs(user.id);

    const superAdminOrgIds = orgMemberships
      .filter((member) => member.system_role === 'super_admin')
      .map((member) => member.org_id);

    if (superAdminOrgIds.length === 0) {
      throw createError({ statusCode: 403, statusMessage: 'Super admin access required.' });
    }

    // Fetch activity for all super_admin orgs
    const activityPromises = superAdminOrgIds.map((orgId) =>
      db.activity.list({ org_id: orgId, limit: 500 })
    );
    const activityResults = await Promise.all(activityPromises);
    const allActivity = activityResults.flat();

    // Sort by created_at descending and limit to 500
    const feed = allActivity
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 500);

    return {
      data: feed
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const store = getStore();

  const superAdminOrgIds = store.org_members
    .filter((member) => member.user_id === user.id && member.system_role === 'super_admin')
    .map((member) => member.org_id);

  if (superAdminOrgIds.length === 0) {
    throw createError({ statusCode: 403, statusMessage: 'Super admin access required.' });
  }

  for (const orgId of superAdminOrgIds) {
    assertOrgSuperAdmin(orgId, user.id);
  }

  const feed = store.activity_log
    .filter((item) => superAdminOrgIds.includes(item.org_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 500);

  return {
    data: feed
  };
});
