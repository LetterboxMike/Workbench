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
  const projectId = event.context.params?.id;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAccessDb(projectId, user.id, 'viewer');

    const project = await db.projects.get(projectId);

    if (!project) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
    }

    const stats = await db.projects.getStats(projectId);
    const allTasks = await db.tasks.list(projectId);
    const today = new Date().toISOString().slice(0, 10);
    const overdueTasks = allTasks.filter(
      (task) => task.due_date && task.status !== 'done' && task.status !== 'cancelled' && task.due_date < today
    );

    return {
      data: {
        ...project,
        metrics: {
          documents: stats.document_count,
          tasks: allTasks.length,
          open_tasks: stats.open_tasks,
          overdue_tasks: overdueTasks.length
        }
      }
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAccess(projectId, user.id, 'viewer');

  const store = getStore();
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  const documents = store.documents.filter((item) => item.project_id === projectId && !item.is_archived);
  const tasks = store.tasks.filter((item) => item.project_id === projectId);

  return {
    data: {
      ...project,
      metrics: {
        documents: documents.length,
        tasks: tasks.length,
        open_tasks: tasks.filter((task) => task.status !== 'done').length,
        overdue_tasks: tasks.filter((task) => task.due_date && task.status !== 'done' && task.due_date < new Date().toISOString().slice(0, 10)).length
      }
    }
  };
});
