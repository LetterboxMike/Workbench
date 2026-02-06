import { defineEventHandler } from 'h3';
import {
  createOrganizationForUser,
  createOrganizationForUserDb,
  getCurrentUser,
  getCurrentUserDb,
  setActiveOrgForSession,
  setActiveOrgForSessionDb,
  useDbAuth
} from '~/server/utils/auth';
import { ensureString, readJsonBody } from '~/server/utils/request';

interface CreateOrgBody {
  name: string;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const body = await readJsonBody<CreateOrgBody>(event);
  const name = ensureString(body.name, 'name');

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    const org = await createOrganizationForUserDb(user.id, name, true);

    await setActiveOrgForSessionDb(event, user.id, org.id);

    return {
      data: {
        ...org,
        system_role: 'super_admin',
        is_active: true
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const org = createOrganizationForUser(user.id, name, true);

  setActiveOrgForSession(event, user.id, org.id);

  return {
    data: {
      ...org,
      system_role: 'super_admin',
      is_active: true
    }
  };
});
