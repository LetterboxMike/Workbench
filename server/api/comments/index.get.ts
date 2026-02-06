import { createError, defineEventHandler, getQuery } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { resolveTargetProjectId, resolveTargetProjectIdDb } from '~/server/utils/comments';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import type { CommentTargetType, Comment, User, Task } from '~/types/domain';

interface EnrichedComment extends Comment {
  author?: User | null;
  replies?: EnrichedComment[];
  mentioned_users?: User[];
  converted_to_task?: { id: string; title: string } | null;
}

/**
 * Enriches comments with mentioned users and task conversion info
 */
async function enrichCommentsDb(comments: Comment[]): Promise<EnrichedComment[]> {
  const enriched: EnrichedComment[] = [];

  for (const comment of comments) {
    const enrichedComment: EnrichedComment = { ...comment };

    // Populate mentioned users
    if (comment.metadata?.mentioned_user_ids && comment.metadata.mentioned_user_ids.length > 0) {
      const mentionedUsers: User[] = [];
      for (const userId of comment.metadata.mentioned_user_ids) {
        const user = await db.users.get(userId);
        if (user) {
          mentionedUsers.push(user);
        }
      }
      enrichedComment.mentioned_users = mentionedUsers;
    }

    // Populate converted task info
    if (comment.metadata?.converted_to_task_id) {
      const task = await db.tasks.get(comment.metadata.converted_to_task_id);
      if (task) {
        enrichedComment.converted_to_task = { id: task.id, title: task.title };
      }
    }

    enriched.push(enrichedComment);
  }

  return enriched;
}

/**
 * Enriches comments with mentioned users and task conversion info (local mode)
 */
function enrichCommentsLocal(comments: Comment[], users: User[], tasks: Task[]): EnrichedComment[] {
  return comments.map((comment) => {
    const enrichedComment: EnrichedComment = { ...comment };

    // Populate mentioned users
    if (comment.metadata?.mentioned_user_ids && comment.metadata.mentioned_user_ids.length > 0) {
      enrichedComment.mentioned_users = users.filter((u) =>
        comment.metadata?.mentioned_user_ids?.includes(u.id)
      );
    }

    // Populate converted task info
    if (comment.metadata?.converted_to_task_id) {
      const task = tasks.find((t) => t.id === comment.metadata?.converted_to_task_id);
      if (task) {
        enrichedComment.converted_to_task = { id: task.id, title: task.title };
      }
    }

    return enrichedComment;
  });
}

/**
 * Nests replies under their parent comments
 */
function nestCommentReplies(comments: EnrichedComment[]): EnrichedComment[] {
  const commentMap = new Map<string, EnrichedComment>();
  const rootComments: EnrichedComment[] = [];

  // First pass: create map and initialize replies array
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: nest replies under parents
  comments.forEach((comment) => {
    const enrichedComment = commentMap.get(comment.id)!;

    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies!.push(enrichedComment);
      } else {
        // Orphaned reply (parent not found), treat as root
        rootComments.push(enrichedComment);
      }
    } else {
      rootComments.push(enrichedComment);
    }
  });

  return rootComments;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const query = getQuery(event);
  const targetType = typeof query.target_type === 'string' ? query.target_type : null;
  const targetId = typeof query.target_id === 'string' ? query.target_id : null;

  if (!targetType || !targetId) {
    throw createError({ statusCode: 400, statusMessage: 'target_type and target_id are required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    const projectId = await resolveTargetProjectIdDb(targetType, targetId);
    await assertProjectAccessDb(projectId, user.id, 'viewer');

    const comments = await db.comments.list(targetType as CommentTargetType, targetId);
    const enrichedComments = await enrichCommentsDb(comments);
    const nestedComments = nestCommentReplies(enrichedComments);

    return {
      data: nestedComments
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const projectId = resolveTargetProjectId(targetType, targetId);
  assertProjectAccess(projectId, user.id, 'viewer');

  const store = getStore();

  const comments = store.comments
    .filter((comment) => comment.target_type === targetType && comment.target_id === targetId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((comment) => ({
      ...comment,
      author: store.users.find((userItem) => userItem.id === comment.author_id) || null
    }));

  const enrichedComments = enrichCommentsLocal(comments, store.users, store.tasks);
  const nestedComments = nestCommentReplies(enrichedComments);

  return {
    data: nestedComments
  };
});
