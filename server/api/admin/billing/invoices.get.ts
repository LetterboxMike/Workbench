import { createError, defineEventHandler } from 'h3';
import {
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getCurrentUser,
  getCurrentUserDb,
  getSystemRole,
  getSystemRoleDb,
  useDbAuth
} from '~/server/utils/auth';
import { listOrgInvoicesAuto } from '~/server/utils/billing';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const user = useDb ? await getCurrentUserDb(event) : await getCurrentUser(event);
  const activeOrgId = useDb
    ? await getActiveOrgIdForUserDb(event, user.id)
    : getActiveOrgIdForUser(event, user.id);

  if (!activeOrgId) {
    throw createError({ statusCode: 400, statusMessage: 'No active organization.' });
  }

  const role = useDb
    ? await getSystemRoleDb(activeOrgId, user.id)
    : getSystemRole(activeOrgId, user.id);

  if (role !== 'super_admin') {
    throw createError({ statusCode: 403, statusMessage: 'Super admin access required.' });
  }

  const invoices = await listOrgInvoicesAuto(activeOrgId, useDb);

  return {
    data: {
      org_id: activeOrgId,
      invoices
    }
  };
});
