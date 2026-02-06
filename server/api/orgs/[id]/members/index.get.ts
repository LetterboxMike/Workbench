import { createError, defineEventHandler } from 'h3';
import {
  assertOrgMembership,
  assertOrgMembershipDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const orgId = event.context.params?.id;

  if (!orgId) {
    throw createError({ statusCode: 400, statusMessage: 'Organization id is required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertOrgMembershipDb(orgId, user.id);

    const members = await db.orgMembers.list(orgId);

    return {
      data: members
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertOrgMembership(orgId, user.id);

  const store = getStore();
  const members = store.org_members
    .filter((member) => member.org_id === orgId)
    .map((member) => ({
      ...member,
      user: store.users.find((userItem) => userItem.id === member.user_id) || null
    }));

  return {
    data: members
  };
});
