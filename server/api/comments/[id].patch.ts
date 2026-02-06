import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { resolveTargetProjectId, resolveTargetProjectIdDb } from '~/server/utils/comments';
import { ensureString, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

interface UpdateCommentBody {
  body: string;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const commentId = event.context.params?.id;

  if (!commentId) {
    throw createError({ statusCode: 400, statusMessage: 'Comment id is required.' });
  }

  const body = await readJsonBody<UpdateCommentBody>(event);

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);

    const comment = await db.comments.get(commentId);

    if (!comment) {
      throw createError({ statusCode: 404, statusMessage: 'Comment not found.' });
    }

    const projectId = await resolveTargetProjectIdDb(comment.target_type, comment.target_id);
    await assertProjectAccessDb(projectId, user.id, 'viewer');

    if (comment.author_id !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Only comment author can edit.' });
    }

    const updated = await db.comments.update(commentId, { body: ensureString(body.body, 'body') });

    return {
      data: updated
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

  if (comment.author_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Only comment author can edit.' });
  }

  comment.body = ensureString(body.body, 'body');

  return {
    data: comment
  };
});
