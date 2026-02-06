import { defineEventHandler } from 'h3';
import {
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getCurrentUser,
  getCurrentUserDb,
  getUserOrgMemberships,
  useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    const memberships = await db.orgMembers.getUserOrgs(user.id);
    const activeOrgId = await getActiveOrgIdForUserDb(event, user.id);

    const organizations = memberships
      .map((membership) => ({
        ...membership.organization,
        system_role: membership.system_role,
        is_active: membership.organization.id === activeOrgId
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      data: organizations
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const store = getStore();
  const memberships = getUserOrgMemberships(user.id);
  const activeOrgId = getActiveOrgIdForUser(event, user.id);

  const organizations = memberships
    .map((membership) => {
      const org = store.organizations.find((item) => item.id === membership.org_id);

      if (!org) {
        return null;
      }

      return {
        ...org,
        system_role: membership.system_role,
        is_active: org.id === activeOrgId
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    data: organizations
  };
});
