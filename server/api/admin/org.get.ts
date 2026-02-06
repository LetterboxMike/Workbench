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

    const org = await db.organizations.get(activeOrgId);

    if (!org) {
      throw createError({ statusCode: 404, statusMessage: 'Organization not found.' });
    }

    return { data: org };
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
  const org = store.organizations.find((o) => o.id === activeOrgId);

  if (!org) {
    throw createError({ statusCode: 404, statusMessage: 'Organization not found.' });
  }

  return { data: org };
});
