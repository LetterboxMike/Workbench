import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { COMMENT_TARGET_TYPES } from '~/server/utils/constants';
import { resolveTargetProjectId, resolveTargetProjectIdDb } from '~/server/utils/comments';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { createId, nowIso } from '~/server/utils/id';
import { ensureString, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import { extractMentionedUserIds, validateProjectMembers } from '~/server/utils/mentions';
import type { CommentTargetType, CommentMetadata } from '~/types/domain';

interface CreateCommentBody {
  target_type: 'document' | 'task' | 'block';
  target_id: string;
  body: string;
  parent_comment_id?: string | null;
  metadata?: CommentMetadata | null;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const body = await readJsonBody<CreateCommentBody>(event);

  if (!COMMENT_TARGET_TYPES.includes(body.target_type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid target_type.' });
  }

  const targetId = ensureString(body.target_id, 'target_id');

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    const projectId = await resolveTargetProjectIdDb(body.target_type, targetId);
    await assertProjectAccessDb(projectId, user.id, 'viewer');

    const project = await db.projects.get(projectId);

    if (!project) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
    }

    // Extract and validate mentioned user IDs
    const commentBody = ensureString(body.body, 'body');
    const mentionedUserIds = extractMentionedUserIds(commentBody);
    const validMentionedUserIds = await validateProjectMembers(mentionedUserIds, projectId, true);

    // Prepare comment metadata
    const commentMetadata: CommentMetadata = {
      ...(body.metadata || {}),
      mentioned_user_ids: validMentionedUserIds.length > 0 ? validMentionedUserIds : undefined
    };

    const comment = await db.comments.create({
      target_type: body.target_type as CommentTargetType,
      target_id: targetId,
      parent_comment_id: body.parent_comment_id || null,
      author_id: user.id,
      body: commentBody,
      metadata: Object.keys(commentMetadata).length > 0 ? commentMetadata : undefined
    });

    await logActivityDb({
      orgId: project.org_id,
      projectId,
      actorId: user.id,
      action: 'created',
      targetType: 'comment',
      targetId: comment.id,
      metadata: {
        target_type: comment.target_type,
        target_id: comment.target_id,
        has_mentions: validMentionedUserIds.length > 0
      }
    });

    // Create notifications for mentioned users (exclude comment author)
    for (const mentionedUserId of validMentionedUserIds) {
      if (mentionedUserId !== user.id) {
        await db.notifications.create({
          user_id: mentionedUserId,
          type: 'comment_mention',
          title: `${user.name} mentioned you in a comment`,
          body: commentBody.length > 100 ? commentBody.substring(0, 100) + '...' : commentBody,
          link: `/projects/${projectId}#comment-${comment.id}`
        });
      }
    }

    // Create notification for parent comment author (if reply)
    if (comment.parent_comment_id) {
      const parentComment = await db.comments.get(comment.parent_comment_id);
      if (parentComment && parentComment.author_id !== user.id && !validMentionedUserIds.includes(parentComment.author_id)) {
        await db.notifications.create({
          user_id: parentComment.author_id,
          type: 'comment_reply',
          title: `${user.name} replied to your comment`,
          body: commentBody.length > 100 ? commentBody.substring(0, 100) + '...' : commentBody,
          link: `/projects/${projectId}#comment-${comment.id}`
        });
      }
    }

    return {
      data: comment
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const projectId = resolveTargetProjectId(body.target_type, targetId);
  assertProjectAccess(projectId, user.id, 'viewer');

  const store = getStore();
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  // Extract and validate mentioned user IDs
  const commentBody = ensureString(body.body, 'body');
  const mentionedUserIds = extractMentionedUserIds(commentBody);
  const validMentionedUserIds = await validateProjectMembers(mentionedUserIds, projectId, false);

  // Prepare comment metadata
  const commentMetadata: CommentMetadata = {
    ...(body.metadata || {}),
    mentioned_user_ids: validMentionedUserIds.length > 0 ? validMentionedUserIds : undefined
  };

  const comment = {
    id: createId(),
    target_type: body.target_type,
    target_id: targetId,
    parent_comment_id: body.parent_comment_id || null,
    author_id: user.id,
    body: commentBody,
    created_at: nowIso(),
    resolved_at: null,
    metadata: Object.keys(commentMetadata).length > 0 ? commentMetadata : null
  };

  store.comments.push(comment);

  logActivity({
    orgId: project.org_id,
    projectId,
    actorId: user.id,
    action: 'created',
    targetType: 'comment',
    targetId: comment.id,
    metadata: {
      target_type: comment.target_type,
      target_id: comment.target_id,
      has_mentions: validMentionedUserIds.length > 0
    }
  });

  // Create notifications for mentioned users (exclude comment author)
  for (const mentionedUserId of validMentionedUserIds) {
    if (mentionedUserId !== user.id) {
      store.notifications.push({
        id: createId(),
        user_id: mentionedUserId,
        type: 'comment_mention',
        title: `${user.name} mentioned you in a comment`,
        body: commentBody.length > 100 ? commentBody.substring(0, 100) + '...' : commentBody,
        link: `/projects/${projectId}#comment-${comment.id}`,
        read_at: null,
        created_at: nowIso()
      });
    }
  }

  // Create notification for parent comment author (if reply)
  if (comment.parent_comment_id) {
    const parentComment = store.comments.find((c) => c.id === comment.parent_comment_id);
    if (parentComment && parentComment.author_id !== user.id && !validMentionedUserIds.includes(parentComment.author_id)) {
      store.notifications.push({
        id: createId(),
        user_id: parentComment.author_id,
        type: 'comment_reply',
        title: `${user.name} replied to your comment`,
        body: commentBody.length > 100 ? commentBody.substring(0, 100) + '...' : commentBody,
        link: `/projects/${projectId}#comment-${comment.id}`,
        read_at: null,
        created_at: nowIso()
      });
    }
  }

  return {
    data: comment
  };
});
