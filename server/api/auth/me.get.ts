import { defineEventHandler } from 'h3';
import {
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getCurrentUser,
  getCurrentUserDb,
  getSystemRole,
  getSystemRoleDb,
  useDbAuth
} from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const user = useDb ? await getCurrentUserDb(event) : await getCurrentUser(event);
  const activeOrgId = useDb
    ? await getActiveOrgIdForUserDb(event, user.id)
    : getActiveOrgIdForUser(event, user.id);

  const role = activeOrgId
    ? (useDb
      ? await getSystemRoleDb(activeOrgId, user.id)
      : getSystemRole(activeOrgId, user.id))
    : null;

  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    display_name: user.name,
    role: role || 'member'
  };

  // Return both keys for backward compatibility with legacy clients.
  return {
    user: payload,
    data: payload
  };
});
