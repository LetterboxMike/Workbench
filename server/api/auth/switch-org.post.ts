import { createError, defineEventHandler } from 'h3';
import {
  getCurrentUser,
  getCurrentUserDb,
  setActiveOrgForSession,
  setActiveOrgForSessionDb,
  useDbAuth
} from '~/server/utils/auth';
import { ensureString, readJsonBody } from '~/server/utils/request';

interface SwitchOrgBody {
  org_id: string;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const user = useDb ? await getCurrentUserDb(event) : await getCurrentUser(event);
  const body = await readJsonBody<SwitchOrgBody>(event);
  const orgId = ensureString(body.org_id, 'org_id');

  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: 'org_id is required.' });
  }

  if (useDb) {
    await setActiveOrgForSessionDb(event, user.id, orgId);
  } else {
    setActiveOrgForSession(event, user.id, orgId);
  }

  return {
    data: {
      active_org_id: orgId
    }
  };
});
