import { defineEventHandler } from 'h3';
import {
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getAuthMode,
  getCurrentUser,
  getCurrentUserDb,
  getUserOrgMemberships,
  getUserOrgMembershipsDb,
  useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';

export default defineEventHandler(async (event) => {
  const authMode = getAuthMode();
  const useDb = useDbAuth();

  if (useDb) {
    // Supabase mode: use database-backed functions
    const user = await getCurrentUserDb(event);
    const memberships = await getUserOrgMembershipsDb(user.id);
    const activeOrgId = await getActiveOrgIdForUserDb(event, user.id);

    const organizations = memberships.map((membership) => ({
      ...membership.organization,
      system_role: membership.system_role,
      is_active: membership.organization.id === activeOrgId
    }));

    return {
      data: {
        user,
        auth_mode: authMode,
        active_org_id: activeOrgId,
        organizations
      }
    };
  }

  // Local mode: use store-based functions
  const user = await getCurrentUser(event);
  const memberships = getUserOrgMemberships(user.id);
  const activeOrgId = getActiveOrgIdForUser(event, user.id);
  const store = getStore();
  const organizations = memberships
    .map((membership) => {
      const organization = store.organizations.find((org) => org.id === membership.org_id);

      if (!organization) {
        return null;
      }

      return {
        ...organization,
        system_role: membership.system_role,
        is_active: organization.id === activeOrgId
      };
    })
    .filter((organization): organization is NonNullable<typeof organization> => !!organization);

  return {
    data: {
      user,
      auth_mode: authMode,
      active_org_id: activeOrgId,
      organizations
    }
  };
});
