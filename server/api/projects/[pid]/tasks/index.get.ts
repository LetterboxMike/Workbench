import { createError, defineEventHandler, getQuery } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { filterTasks, sortTasks } from '~/server/utils/tasks';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import type { TaskPriority, TaskStatus } from '~/types/domain';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.pid;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  const query = getQuery(event);
  const tags = typeof query.tags === 'string' ? query.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAccessDb(projectId, user.id, 'viewer');

    // Build filters for database query
    const filters: Parameters<typeof db.tasks.list>[1] = {};

    if (typeof query.status === 'string') {
      filters.status = query.status as TaskStatus;
    }
    if (typeof query.assignee_id === 'string') {
      filters.assignee_id = query.assignee_id || null;
    }
    if (typeof query.priority === 'string') {
      filters.priority = query.priority as TaskPriority;
    }
    if (typeof query.q === 'string') {
      filters.q = query.q;
    }
    if (tags.length > 0) {
      filters.tags = tags;
    }

    const tasks = await db.tasks.list(projectId, filters);

    // Filter by due_date and source_document_id if provided (not natively supported by db.tasks.list)
    let filteredTasks = tasks;
    if (typeof query.due_date === 'string') {
      filteredTasks = filteredTasks.filter((task) => task.due_date === query.due_date);
    }
    if (typeof query.source_document_id === 'string') {
      filteredTasks = filteredTasks.filter((task) => task.source_document_id === query.source_document_id);
    }

    // Sort tasks
    const sortedTasks = sortTasks(filteredTasks);

    // Enrich with assignee and source_document
    const enrichedTasks = await Promise.all(
      sortedTasks.map(async (task) => {
        const assignee = task.assignee_id ? await db.users.get(task.assignee_id) : null;
        const source_document = task.source_document_id ? await db.documents.get(task.source_document_id) : null;
        return {
          ...task,
          assignee,
          source_document
        };
      })
    );

    return {
      data: enrichedTasks
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAccess(projectId, user.id, 'viewer');

  const store = getStore();

  const tasks = sortTasks(
    filterTasks(store.tasks.filter((task) => task.project_id === projectId), {
      status: typeof query.status === 'string' ? query.status : undefined,
      assignee_id: typeof query.assignee_id === 'string' ? query.assignee_id : undefined,
      priority: typeof query.priority === 'string' ? query.priority : undefined,
      due_date: typeof query.due_date === 'string' ? query.due_date : undefined,
      source_document_id: typeof query.source_document_id === 'string' ? query.source_document_id : undefined,
      q: typeof query.q === 'string' ? query.q : undefined,
      tags
    })
  ).map((task) => ({
    ...task,
    assignee: task.assignee_id ? store.users.find((userItem) => userItem.id === task.assignee_id) || null : null,
    source_document: task.source_document_id
      ? store.documents.find((document) => document.id === task.source_document_id) || null
      : null
  }));

  return {
    data: tasks
  };
});
