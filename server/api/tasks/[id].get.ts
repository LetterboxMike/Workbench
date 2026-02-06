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
  const taskId = event.context.params?.id;

  if (!taskId) {
    throw createError({ statusCode: 400, statusMessage: 'Task id is required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);

    const task = await db.tasks.get(taskId);
    if (!task) {
      throw createError({ statusCode: 404, statusMessage: 'Task not found.' });
    }

    await assertProjectAccessDb(task.project_id, user.id, 'viewer');

    const comments = await db.comments.list('task', task.id);

    return {
      data: {
        ...task,
        comments
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);

  const store = getStore();
  const task = store.tasks.find((item) => item.id === taskId);

  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found.' });
  }

  assertProjectAccess(task.project_id, user.id, 'viewer');

  return {
    data: {
      ...task,
      comments: store.comments.filter((comment) => comment.target_type === 'task' && comment.target_id === task.id)
    }
  };
});
