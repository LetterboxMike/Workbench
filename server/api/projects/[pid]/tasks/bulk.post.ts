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
import type { Task } from '~/types/domain';

interface BulkUpdateBody {
  task_ids: string[];
  status?: string;
  priority?: string;
  assignee_id?: string | null;
  due_date?: string | null;
  tags?: string[];
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const user = useDb ? await getCurrentUserDb(event) : await getCurrentUser(event);
  const projectId = event.context.params?.pid;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  if (useDb) {
    await assertProjectAccessDb(projectId, user.id, 'editor');
  } else {
    assertProjectAccess(projectId, user.id, 'editor');
  }

  const body = await readJsonBody<BulkUpdateBody>(event);

  if (!Array.isArray(body.task_ids) || body.task_ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'task_ids is required.' });
  }

  if (useDb) {
    const project = await db.projects.get(projectId);

    if (!project) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
    }

    if (body.assignee_id) {
      const members = await db.projectMembers.list(projectId);
      const isProjectMember = members.some((member) => member.user_id === body.assignee_id);

      if (!isProjectMember) {
        throw createError({ statusCode: 400, statusMessage: 'assignee_id must be a member of this project.' });
      }
    }

    const updated: Task[] = [];

    for (const taskId of body.task_ids) {
      const updates: Record<string, unknown> = {};

      if (isTaskStatus(body.status)) {
        updates.status = body.status;
        updates.completed_at = body.status === 'done' ? nowIso() : null;
      }

      if (isTaskPriority(body.priority)) {
        updates.priority = body.priority;
      }

      if (body.assignee_id !== undefined) {
        updates.assignee_id = body.assignee_id;
      }

      if (body.due_date !== undefined) {
        updates.due_date = body.due_date;
      }

      if (body.tags !== undefined) {
        updates.tags = asStringArray(body.tags);
      }

      if (Object.keys(updates).length > 0) {
        const task = await db.tasks.update(taskId, updates);

        if (task) {
          updated.push(task);
        }
      }
    }

    await logActivityDb({
      orgId: project.org_id,
      projectId,
      actorId: user.id,
      action: 'bulk_updated',
      targetType: 'task',
      targetId: projectId,
      metadata: {
        task_count: updated.length
      }
    });

    return {
      data: updated
    };
  }

  const store = getStore();
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  if (body.assignee_id) {
    const isProjectMember = store.project_members.some(
      (member) => member.project_id === projectId && member.user_id === body.assignee_id
    );

    if (!isProjectMember) {
      throw createError({ statusCode: 400, statusMessage: 'assignee_id must be a member of this project.' });
    }
  }

  const updated = store.tasks
    .filter((task) => task.project_id === projectId && body.task_ids.includes(task.id))
    .map((task) => {
      if (isTaskStatus(body.status)) {
        task.status = body.status;
        task.completed_at = body.status === 'done' ? nowIso() : null;
      }

      if (isTaskPriority(body.priority)) {
        task.priority = body.priority;
      }

      if (body.assignee_id !== undefined) {
        task.assignee_id = body.assignee_id;
      }

      if (body.due_date !== undefined) {
        task.due_date = body.due_date;
      }

      if (body.tags !== undefined) {
        task.tags = asStringArray(body.tags);
      }

      task.updated_at = nowIso();
      return task;
    });

  logActivity({
    orgId: project.org_id,
    projectId,
    actorId: user.id,
    action: 'bulk_updated',
    targetType: 'task',
    targetId: projectId,
    metadata: {
      task_count: updated.length
    }
  });

  return {
    data: updated
  };
});
