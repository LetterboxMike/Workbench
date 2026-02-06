import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  getSystemRole,
  getSystemRoleDb,
  getProjectRoleDb,
  useDbAuth
} from '~/server/utils/auth';
import { resolveTargetProjectId, resolveTargetProjectIdDb } from '~/server/utils/comments';
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
    await assertProjectAccessDb(projectId, user.id, 'editor');

    if (comment.author_id !== user.id) {
      const projectRole = await getProjectRoleDb(projectId, user.id);
      const isAdmin = projectRole === 'admin';
      const project = await db.projects.get(projectId);
      const isSuperAdmin = project ? (await getSystemRoleDb(project.org_id, user.id)) === 'super_admin' : false;

      if (!isAdmin && !isSuperAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Only author or admin can delete.' });
      }
    }

    await db.comments.delete(commentId);

    return {
      data: {
        deleted: true,
        id: commentId
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);

  const store = getStore();
  const index = store.comments.findIndex((item) => item.id === commentId);

  if (index < 0) {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found.' });
  }

  const comment = store.comments[index]!;
  const projectId = resolveTargetProjectId(comment.target_type, comment.target_id);
  assertProjectAccess(projectId, user.id, 'editor');

  if (comment.author_id !== user.id) {
    const isAdmin = store.project_members.find((member) => member.project_id === projectId && member.user_id === user.id)?.role === 'admin';
    const project = store.projects.find((item) => item.id === projectId);
    const isSuperAdmin = project ? getSystemRole(project.org_id, user.id) === 'super_admin' : false;

    if (!isAdmin && !isSuperAdmin) {
      throw createError({ statusCode: 403, statusMessage: 'Only author or admin can delete.' });
    }
  }

  store.comments.splice(index, 1);

  return {
    data: {
      deleted: true,
      id: commentId
    }
  };
});

