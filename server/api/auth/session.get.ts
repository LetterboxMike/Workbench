import { defineEventHandler } from 'h3';
import {
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getAuthMode,
  getCurrentUser,
  getCurrentUserDb,
  getSystemRole,
  getSystemRoleDb,
  getUserOrgMemberships,
  getUserOrgMembershipsDb,
  useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { getOrgBillingSnapshotAuto } from '~/server/utils/billing';

const getBillingSnapshotSafe = async (orgId: string | null, activeRole: string | null, useDb: boolean) => {
  if (!orgId || !activeRole) {
    return null;
  }

  try {
    return await getOrgBillingSnapshotAuto(orgId, useDb);
  } catch (error) {
    console.warn('[auth/session] Failed to load billing snapshot. Returning session without billing context.', error);
    return null;
  }
};

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
    const activeRole = activeOrgId ? await getSystemRoleDb(activeOrgId, user.id) : null;
    const billing = await getBillingSnapshotSafe(activeOrgId, activeRole, true);

    return {
      data: {
        user,
        auth_mode: authMode,
        active_org_id: activeOrgId,
        organizations,
        billing
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
  const activeRole = activeOrgId ? getSystemRole(activeOrgId, user.id) : null;
  const billing = await getBillingSnapshotSafe(activeOrgId, activeRole, false);

  return {
    data: {
      user,
      auth_mode: authMode,
      active_org_id: activeOrgId,
      organizations,
      billing
    }
  };
});
