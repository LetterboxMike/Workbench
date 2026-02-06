import { createError, defineEventHandler, getQuery } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { nowIso } from '~/server/utils/id';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const taskId = event.context.params?.id;

  if (!taskId) {
    throw createError({ statusCode: 400, statusMessage: 'Task id is required.' });
  }

  const query = getQuery(event);
  const hardDelete = query.hard === 'true' || query.hard === '1';

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);

    const task = await db.tasks.get(taskId);
    if (!task) {
      throw createError({ statusCode: 404, statusMessage: 'Task not found.' });
    }

    await assertProjectAccessDb(task.project_id, user.id, 'editor');

    const project = await db.projects.get(task.project_id);

    // Soft delete (detach) if task is linked to a document and not already detached
    if (!hardDelete && task.source_document_id && !task.is_detached) {
      await db.tasks.update(taskId, {
        is_detached: true
      });

      if (project) {
        await logActivityDb({
          orgId: project.org_id,
          projectId: project.id,
          actorId: user.id,
          action: 'detached',
          targetType: 'task',
          targetId: taskId
        });
      }

      return {
        data: {
          detached: true,
          deleted: false,
          id: taskId
        }
      };
    }

    // Hard delete
    await db.tasks.delete(taskId);

    if (project) {
      await logActivityDb({
        orgId: project.org_id,
        projectId: project.id,
        actorId: user.id,
        action: 'deleted',
        targetType: 'task',
        targetId: taskId
      });
    }

    return {
      data: {
        deleted: true,
        detached: false,
        id: taskId
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);

  const store = getStore();
  const index = store.tasks.findIndex((item) => item.id === taskId);

  if (index < 0) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found.' });
  }

  const task = store.tasks[index]!;
  assertProjectAccess(task.project_id, user.id, 'editor');

  const project = store.projects.find((item) => item.id === task.project_id);

  if (!hardDelete && task.source_document_id && !task.is_detached) {
    task.is_detached = true;
    task.source_document_id = null;
    task.source_block_id = null;
    task.updated_at = nowIso();

    if (project) {
      logActivity({
        orgId: project.org_id,
        projectId: project.id,
        actorId: user.id,
        action: 'detached',
        targetType: 'task',
        targetId: taskId
      });
    }

    return {
      data: {
        detached: true,
        deleted: false,
        id: taskId
      }
    };
  }

  store.tasks.splice(index, 1);

  if (project) {
    logActivity({
      orgId: project.org_id,
      projectId: project.id,
      actorId: user.id,
      action: 'deleted',
      targetType: 'task',
      targetId: taskId
    });
  }

  return {
    data: {
      deleted: true,
      detached: false,
      id: taskId
    }
  };
});
