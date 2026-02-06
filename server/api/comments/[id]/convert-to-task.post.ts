import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { resolveTargetProjectId, resolveTargetProjectIdDb } from '~/server/utils/comments';
import { isTaskPriority, isTaskStatus } from '~/server/utils/constants';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { createId, nowIso } from '~/server/utils/id';
import { ensureString, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import type { Task, TaskPriority, TaskStatus } from '~/types/domain';

interface ConvertToTaskBody {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string | null;
  due_date?: string | null;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const commentId = event.context.params?.id;

  if (!commentId) {
    throw createError({ statusCode: 400, statusMessage: 'Comment id is required.' });
  }

  const body = await readJsonBody<ConvertToTaskBody>(event);
  const status: TaskStatus = isTaskStatus(body.status) ? body.status : 'todo';
  const priority: TaskPriority = isTaskPriority(body.priority) ? body.priority : 'none';
  const dueDate = body.due_date || null;

  if (dueDate && Number.isNaN(Date.parse(dueDate))) {
    throw createError({ statusCode: 400, statusMessage: 'due_date must be a valid date.' });
  }

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    const comment = await db.comments.get(commentId);

    if (!comment) {
      throw createError({ statusCode: 404, statusMessage: 'Comment not found.' });
    }

    // Check if already converted
    if (comment.metadata?.converted_to_task_id) {
      throw createError({ statusCode: 400, statusMessage: 'Comment has already been converted to a task.' });
    }

    // Resolve project ID from comment target
    const projectId = await resolveTargetProjectIdDb(comment.target_type, comment.target_id);
    await assertProjectAccessDb(projectId, user.id, 'editor');

    const project = await db.projects.get(projectId);
    if (!project) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
    }

    // Validate assignee_id
    if (body.assignee_id) {
      const projectMember = await db.projectMembers.get(projectId, body.assignee_id);
      if (!projectMember) {
        throw createError({ statusCode: 400, statusMessage: 'assignee_id must be a member of this project.' });
      }
    }

    // Determine source document ID from comment target
    let sourceDocumentId: string | null = null;
    if (comment.target_type === 'document') {
      sourceDocumentId = comment.target_id;
    } else if (comment.target_type === 'block') {
      // Block format: documentId:blockId
      const parts = comment.target_id.split(':');
      sourceDocumentId = parts[0];
    }

    // Build task description with backlink to comment
    const taskDescription =
      body.description ||
      `${comment.body}\n\n---\n\nConverted from comment: /projects/${projectId}#comment-${comment.id}`;

    // Create the task
    const task = await db.tasks.create({
      project_id: projectId,
      source_document_id: sourceDocumentId,
      source_block_id: null,
      title: ensureString(body.title, 'title'),
      description: taskDescription,
      status,
      priority,
      assignee_id: body.assignee_id || null,
      due_date: dueDate,
      tags: [],
      created_by: user.id
    });

    // Update comment metadata
    await db.comments.update(commentId, {
      metadata: {
        ...comment.metadata,
        converted_to_task_id: task.id
      }
    });

    // Log activity
    await logActivityDb({
      orgId: project.org_id,
      projectId,
      actorId: user.id,
      action: 'converted_to_task',
      targetType: 'comment',
      targetId: commentId,
      metadata: {
        task_id: task.id,
        task_title: task.title
      }
    });

    return {
      data: task
    };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const store = getStore();
  const comment = store.comments.find((c) => c.id === commentId);

  if (!comment) {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found.' });
  }

  // Check if already converted
  if (comment.metadata?.converted_to_task_id) {
    throw createError({ statusCode: 400, statusMessage: 'Comment has already been converted to a task.' });
  }

  // Resolve project ID from comment target
  const projectId = resolveTargetProjectId(comment.target_type, comment.target_id);
  assertProjectAccess(projectId, user.id, 'editor');

  const project = store.projects.find((p) => p.id === projectId);
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  // Validate assignee_id
  if (body.assignee_id) {
    const projectMember = store.project_members.find(
      (pm) => pm.project_id === projectId && pm.user_id === body.assignee_id
    );
    if (!projectMember) {
      throw createError({ statusCode: 400, statusMessage: 'assignee_id must be a member of this project.' });
    }
  }

  // Determine source document ID from comment target
  let sourceDocumentId: string | null = null;
  if (comment.target_type === 'document') {
    sourceDocumentId = comment.target_id;
  } else if (comment.target_type === 'block') {
    // Block format: documentId:blockId
    const parts = comment.target_id.split(':');
    sourceDocumentId = parts[0];
  }

  // Build task description with backlink to comment
  const taskDescription =
    body.description ||
    `${comment.body}\n\n---\n\nConverted from comment: /projects/${projectId}#comment-${comment.id}`;

  // Create the task
  const task: Task = {
    id: createId(),
    project_id: projectId,
    source_document_id: sourceDocumentId,
    source_block_id: null,
    title: ensureString(body.title, 'title'),
    description: taskDescription,
    status,
    priority,
    assignee_id: body.assignee_id || null,
    due_date: dueDate,
    tags: [],
    created_by: user.id,
    created_at: nowIso(),
    updated_at: nowIso(),
    completed_at: null,
    is_detached: false
  };

  store.tasks.push(task);

  // Update comment metadata
  comment.metadata = {
    ...comment.metadata,
    converted_to_task_id: task.id
  };

  // Log activity
  logActivity({
    orgId: project.org_id,
    projectId,
    actorId: user.id,
    action: 'converted_to_task',
    targetType: 'comment',
    targetId: commentId,
    metadata: {
      task_id: task.id,
      task_title: task.title
    }
  });

  return {
    data: task
  };
});
