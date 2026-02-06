import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { isTaskPriority, isTaskStatus } from '~/server/utils/constants';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { nowIso } from '~/server/utils/id';
import { asStringArray, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import type { Task, TaskPriority, TaskStatus } from '~/types/domain';

interface UpdateTaskBody {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assignee_id?: string | null;
  due_date?: string | null;
  tags?: string[];
  source_document_id?: string | null;
  source_block_id?: string | null;
  is_detached?: boolean;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const taskId = event.context.params?.id;

  if (!taskId) {
    throw createError({ statusCode: 400, statusMessage: 'Task id is required.' });
  }

  const body = await readJsonBody<UpdateTaskBody>(event);

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);

    const existingTask = await db.tasks.get(taskId);
    if (!existingTask) {
      throw createError({ statusCode: 404, statusMessage: 'Task not found.' });
    }

    await assertProjectAccessDb(existingTask.project_id, user.id, 'editor');

    // Build updates object
    const updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assignee_id' | 'due_date' | 'tags' | 'is_detached' | 'completed_at'>> = {};

    if (typeof body.title === 'string' && body.title.trim()) {
      updates.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description ? body.description.trim() : null;
    }

    if (isTaskStatus(body.status)) {
      updates.status = body.status as TaskStatus;
      updates.completed_at = body.status === 'done' ? nowIso() : null;
    }

    if (isTaskPriority(body.priority)) {
      updates.priority = body.priority as TaskPriority;
    }

    if (body.assignee_id !== undefined) {
      if (body.assignee_id) {
        const projectMember = await db.projectMembers.get(existingTask.project_id, body.assignee_id);
        if (!projectMember) {
          throw createError({ statusCode: 400, statusMessage: 'assignee_id must be a member of this project.' });
        }
      }
      updates.assignee_id = body.assignee_id;
    }

    if (body.due_date !== undefined) {
      if (body.due_date && Number.isNaN(Date.parse(body.due_date))) {
        throw createError({ statusCode: 400, statusMessage: 'due_date must be a valid date.' });
      }
      updates.due_date = body.due_date;
    }

    if (body.tags !== undefined) {
      updates.tags = asStringArray(body.tags);
    }

    if (body.is_detached !== undefined) {
      updates.is_detached = body.is_detached;
    }

    // Note: source_document_id and source_block_id are not directly supported by db.tasks.update
    // They would need special handling if required

    const task = await db.tasks.update(taskId, updates);

    const project = await db.projects.get(task.project_id);
    if (project) {
      await logActivityDb({
        orgId: project.org_id,
        projectId: project.id,
        actorId: user.id,
        action: 'updated',
        targetType: 'task',
        targetId: task.id,
        metadata: {
          status: task.status,
          priority: task.priority
        }
      });
    }

    return {
      data: task
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);

  const store = getStore();
  const task = store.tasks.find((item) => item.id === taskId);

  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Task not found.' });
  }

  assertProjectAccess(task.project_id, user.id, 'editor');

  if (typeof body.title === 'string' && body.title.trim()) {
    task.title = body.title.trim();
  }

  if (body.description !== undefined) {
    task.description = body.description ? body.description.trim() : null;
  }

  if (isTaskStatus(body.status)) {
    task.status = body.status;
    task.completed_at = body.status === 'done' ? nowIso() : null;
  }

  if (isTaskPriority(body.priority)) {
    task.priority = body.priority;
  }

  if (body.assignee_id !== undefined) {
    if (body.assignee_id) {
      const isProjectMember = store.project_members.some(
        (member) => member.project_id === task.project_id && member.user_id === body.assignee_id
      );

      if (!isProjectMember) {
        throw createError({ statusCode: 400, statusMessage: 'assignee_id must be a member of this project.' });
      }
    }

    task.assignee_id = body.assignee_id;
  }

  if (body.due_date !== undefined) {
    if (body.due_date && Number.isNaN(Date.parse(body.due_date))) {
      throw createError({ statusCode: 400, statusMessage: 'due_date must be a valid date.' });
    }

    task.due_date = body.due_date;
  }

  if (body.tags !== undefined) {
    task.tags = asStringArray(body.tags);
  }

  if (body.source_document_id !== undefined) {
    if (body.source_document_id) {
      const sourceDocument = store.documents.find(
        (item) => item.id === body.source_document_id && item.project_id === task.project_id && !item.is_archived
      );

      if (!sourceDocument) {
        throw createError({ statusCode: 400, statusMessage: 'source_document_id must belong to this active project.' });
      }

      task.is_detached = false;
    }

    task.source_document_id = body.source_document_id;
  }

  if (body.source_block_id !== undefined) {
    task.source_block_id = body.source_block_id;
  }

  if (body.is_detached !== undefined) {
    task.is_detached = body.is_detached;

    if (body.is_detached) {
      task.source_document_id = null;
      task.source_block_id = null;
    }
  }

  task.updated_at = nowIso();

  const project = store.projects.find((item) => item.id === task.project_id);

  if (project) {
    logActivity({
      orgId: project.org_id,
      projectId: project.id,
      actorId: user.id,
      action: 'updated',
      targetType: 'task',
      targetId: task.id,
      metadata: {
        status: task.status,
        priority: task.priority
      }
    });
  }

  return {
    data: task
  };
});

