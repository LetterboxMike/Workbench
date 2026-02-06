import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { resolveTargetProjectId, resolveTargetProjectIdDb } from '~/server/utils/comments';
import { nowIso } from '~/server/utils/id';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const commentId = event.context.params?.id;

  if (!commentId) {
    throw createError({ statusCode: 400, statusMessage: 'Comment id is required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);

    const comment = await db.comments.get(commentId);

    if (!comment) {
      throw createError({ statusCode: 404, statusMessage: 'Comment not found.' });
    }

    const projectId = await resolveTargetProjectIdDb(comment.target_type, comment.target_id);
    await assertProjectAccessDb(projectId, user.id, 'viewer');

    const resolved = await db.comments.resolve(commentId);

    return {
      data: resolved
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);

  const store = getStore();
  const comment = store.comments.find((item) => item.id === commentId);

  if (!comment) {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found.' });
  }

  const projectId = resolveTargetProjectId(comment.target_type, comment.target_id);
  assertProjectAccess(projectId, user.id, 'viewer');

  comment.resolved_at = nowIso();

  return {
    data: comment
  };
});
