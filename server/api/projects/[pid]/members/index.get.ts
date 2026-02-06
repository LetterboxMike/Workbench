import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.pid;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAccessDb(projectId, user.id, 'viewer');

    const members = await db.projectMembers.list(projectId);

    return {
      data: members
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAccess(projectId, user.id, 'viewer');

  const store = getStore();

  const members = store.project_members
    .filter((member) => member.project_id === projectId)
    .map((member) => ({
      ...member,
      user: store.users.find((userItem) => userItem.id === member.user_id) || null
    }));

  return {
    data: members
  };
});
