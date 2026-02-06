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
import { createId, nowIso } from '~/server/utils/id';
import { asStringArray, ensureString, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import type { Task, TaskPriority, TaskStatus } from '~/types/domain';

interface CreateTaskBody {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string | null;
  due_date?: string | null;
  tags?: string[];
  source_document_id?: string | null;
  source_block_id?: string | null;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.pid;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  const body = await readJsonBody<CreateTaskBody>(event);
  const status: TaskStatus = isTaskStatus(body.status) ? body.status : 'todo';
  const priority: TaskPriority = isTaskPriority(body.priority) ? body.priority : 'none';
  const sourceDocumentId = body.source_document_id || null;
  const dueDate = body.due_date || null;

  if (dueDate && Number.isNaN(Date.parse(dueDate))) {
    throw createError({ statusCode: 400, statusMessage: 'due_date must be a valid date.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAccessDb(projectId, user.id, 'editor');

    const project = await db.projects.get(projectId);
    if (!project) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
    }

    // Validate source_document_id
    if (sourceDocumentId) {
      const sourceDocument = await db.documents.get(sourceDocumentId);
      if (!sourceDocument || sourceDocument.project_id !== projectId || sourceDocument.is_archived) {
        throw createError({ statusCode: 400, statusMessage: 'source_document_id must belong to this active project.' });
      }
    }

    // Validate assignee_id
    if (body.assignee_id) {
      const projectMember = await db.projectMembers.get(projectId, body.assignee_id);
      if (!projectMember) {
        throw createError({ statusCode: 400, statusMessage: 'assignee_id must be a member of this project.' });
      }
    }

    const task = await db.tasks.create({
      project_id: projectId,
      source_document_id: sourceDocumentId,
      source_block_id: body.source_block_id || null,
      title: ensureString(body.title, 'title'),
      description: body.description?.trim() || null,
      status,
      priority,
      assignee_id: body.assignee_id || null,
      due_date: dueDate,
      tags: asStringArray(body.tags),
      created_by: user.id
    });

    await logActivityDb({
      orgId: project.org_id,
      projectId,
      actorId: user.id,
      action: 'created',
      targetType: 'task',
      targetId: task.id,
      metadata: {
        title: task.title,
        status: task.status
      }
    });

    if (task.assignee_id) {
      await db.notifications.create({
        user_id: task.assignee_id,
        type: 'task_assigned',
        title: `Assigned: ${task.title}`,
        body: task.description,
        link: `/projects/${projectId}/tasks/list`
      });
    }

    return {
      data: task
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAccess(projectId, user.id, 'editor');

  const store = getStore();
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  if (sourceDocumentId) {
    const sourceDocument = store.documents.find(
      (item) => item.id === sourceDocumentId && item.project_id === projectId && !item.is_archived
    );

    if (!sourceDocument) {
      throw createError({ statusCode: 400, statusMessage: 'source_document_id must belong to this active project.' });
    }
  }

  if (body.assignee_id) {
    const isProjectMember = store.project_members.some(
      (member) => member.project_id === projectId && member.user_id === body.assignee_id
    );

    if (!isProjectMember) {
      throw createError({ statusCode: 400, statusMessage: 'assignee_id must be a member of this project.' });
    }
  }

  const task: Task = {
    id: createId(),
    project_id: projectId,
    source_document_id: sourceDocumentId,
    source_block_id: body.source_block_id || null,
    title: ensureString(body.title, 'title'),
    description: body.description?.trim() || null,
    status,
    priority,
    assignee_id: body.assignee_id || null,
    due_date: dueDate,
    tags: asStringArray(body.tags),
    created_by: user.id,
    created_at: nowIso(),
    updated_at: nowIso(),
    completed_at: status === 'done' ? nowIso() : null,
    is_detached: false
  };

  store.tasks.push(task);

  logActivity({
    orgId: project.org_id,
    projectId,
    actorId: user.id,
    action: 'created',
    targetType: 'task',
    targetId: task.id,
    metadata: {
      title: task.title,
      status: task.status
    }
  });

  if (task.assignee_id) {
    store.notifications.unshift({
      id: createId(),
      user_id: task.assignee_id,
      type: 'task_assigned',
      title: `Assigned: ${task.title}`,
      body: task.description,
      link: `/projects/${projectId}/tasks/list`,
      read_at: null,
      created_at: nowIso()
    });
  }

  return {
    data: task
  };
});

