import { createError, defineEventHandler } from 'h3';
import { assertProjectAccess, assertProjectAccessDb, getCurrentUser, getCurrentUserDb, useDbAuth } from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const projectId = event.context.params?.pid;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  const useDb = useDbAuth();

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAccessDb(projectId, user.id, 'viewer');

    const feed = await db.activity.list({ project_id: projectId, limit: 200 });

    return {
      data: feed
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAccess(projectId, user.id, 'viewer');

  const store = getStore();

  const feed = store.activity_log
    .filter((item) => item.project_id === projectId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 200);

  return {
    data: feed
  };
});
