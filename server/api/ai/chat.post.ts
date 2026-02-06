import OpenAI from 'openai';
import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAccess,
  assertProjectAccessDb,
  assertOrgSuperAdmin,
  assertOrgSuperAdminDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { createId, nowIso } from '~/server/utils/id';
import { ensureString, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

interface AIChatBody {
  message: string;
  scope: 'inline' | 'project' | 'system';
  project_id?: string;
  document_id?: string;
  context?: Record<string, unknown>;
}

interface AIToolAction {
  endpoint: string;
  method: string;
  params: Record<string, unknown>;
  result: Record<string, unknown>;
}

const allowedScopes = ['inline', 'project', 'system'];
const mutationIntentPattern = /\b(create|update|delete|remove|archive|move|assign|set|bulk|edit)\b/i;

const summarizeProjectContext = async (projectId: string, useDb: boolean) => {
  if (useDb) {
    const documents = await db.documents.list(projectId);
    const tasks = await db.tasks.list(projectId);
    const activity = await db.activity.list({ project_id: projectId, limit: 40 });

    return {
      documents: documents.slice(0, 20).map((doc) => ({ id: doc.id, title: doc.title, updated_at: doc.updated_at })),
      tasks: tasks.slice(0, 100).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        assignee_id: task.assignee_id
      })),
      recent_activity: activity.map((a) => ({
        action: a.action,
        target_type: a.target_type,
        target_id: a.target_id,
        created_at: a.created_at
      }))
    };
  }

  const store = getStore();
  const documents = store.documents.filter((document) => document.project_id === projectId && !document.is_archived).slice(0, 20);
  const tasks = store.tasks.filter((task) => task.project_id === projectId).slice(0, 100);
  const recentActivity = store.activity_log.filter((activity) => activity.project_id === projectId).slice(0, 40);

  return {
    documents: documents.map((document) => ({ id: document.id, title: document.title, updated_at: document.updated_at })),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      assignee_id: task.assignee_id
    })),
    recent_activity: recentActivity.map((activity) => ({
      action: activity.action,
      target_type: activity.target_type,
      target_id: activity.target_id,
      created_at: activity.created_at
    }))
  };
};

const tryOpenAIResponse = async (
  message: string,
  scope: 'inline' | 'project' | 'system',
  contextSummary: Record<string, unknown>
): Promise<string | null> => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || 'gpt-5.1-mini';
  const client = new OpenAI({ apiKey });

  try {
    const completion = await client.chat.completions.create({
      model,
      max_tokens: 800,
      messages: [
        {
          role: 'system',
          content: 'You are Workbench AI. Respond with concise, actionable output. If the user asks for mutations, describe exact operations to perform.'
        },
        {
          role: 'user',
          content: `Scope: ${scope}\n\nContext:\n${JSON.stringify(contextSummary, null, 2)}\n\nUser message:\n${message}`
        }
      ]
    });

    return completion.choices[0]?.message?.content || null;
  } catch {
    return null;
  }
};

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const user = useDb ? await getCurrentUserDb(event) : await getCurrentUser(event);
  const body = await readJsonBody<AIChatBody>(event);
  const message = ensureString(body.message, 'message');
  const scope = body.scope;

  if (!allowedScopes.includes(scope)) {
    throw createError({ statusCode: 400, statusMessage: 'scope must be inline, project, or system.' });
  }

  const store = useDb ? null : getStore();
  let projectId: string | null = null;
  let systemOrgIds: string[] = [];
  const hasMutationIntent = mutationIntentPattern.test(message);

  if (scope === 'project' || scope === 'inline') {
    projectId = body.project_id || null;

    if (!projectId) {
      throw createError({ statusCode: 400, statusMessage: 'project_id is required for project or inline scope.' });
    }

    if (useDb) {
      await assertProjectAccessDb(projectId, user.id, hasMutationIntent ? 'editor' : 'viewer');
    } else {
      assertProjectAccess(projectId, user.id, hasMutationIntent ? 'editor' : 'viewer');
    }
  }

  if (scope === 'system') {
    if (useDb) {
      const memberships = await db.orgMembers.getUserOrgs(user.id);
      const superAdminMemberships = memberships.filter((m) => m.system_role === 'super_admin');

      if (superAdminMemberships.length === 0) {
        throw createError({ statusCode: 403, statusMessage: 'Organization membership required.' });
      }

      systemOrgIds = superAdminMemberships.map((m) => m.org_id);

      for (const orgId of systemOrgIds) {
        await assertOrgSuperAdminDb(orgId, user.id);
      }
    } else {
      const superAdminMemberships = store!.org_members.filter(
        (member) => member.user_id === user.id && member.system_role === 'super_admin'
      );

      if (superAdminMemberships.length === 0) {
        throw createError({ statusCode: 403, statusMessage: 'Organization membership required.' });
      }

      systemOrgIds = superAdminMemberships.map((membership) => membership.org_id);

      for (const orgId of systemOrgIds) {
        assertOrgSuperAdmin(orgId, user.id);
      }
    }
  }

  const actions: AIToolAction[] = [];

  // Handle "create task" intent
  if (projectId && /create task/i.test(message)) {
    const titleMatch = message.match(/create task\s*[:\-]?\s*(.+)/i);
    const title = titleMatch?.[1]?.trim() || 'New task created by AI';

    if (useDb) {
      const project = await db.projects.get(projectId);

      if (project) {
        const task = await db.tasks.create({
          project_id: projectId,
          title,
          description: 'Created by AI assistant action.',
          status: 'todo',
          priority: 'medium',
          assignee_id: user.id,
          source_document_id: body.document_id || null,
          tags: ['ai'],
          created_by: user.id
        });

        actions.push({
          endpoint: `/api/projects/${projectId}/tasks`,
          method: 'POST',
          params: { title: task.title, source_document_id: task.source_document_id },
          result: { task_id: task.id, status: task.status }
        });

        await logActivityDb({
          orgId: project.org_id,
          projectId,
          actorId: null,
          actorType: 'ai',
          action: 'created',
          targetType: 'task',
          targetId: task.id,
          metadata: { source: 'ai_chat', prompt: message }
        });
      }
    } else {
      const project = store!.projects.find((item) => item.id === projectId);

      if (project) {
        const task = {
          id: createId(),
          project_id: projectId,
          source_document_id: body.document_id || null,
          source_block_id: null,
          title,
          description: 'Created by AI assistant action.',
          status: 'todo' as const,
          priority: 'medium' as const,
          assignee_id: user.id,
          due_date: null,
          tags: ['ai'],
          created_by: user.id,
          created_at: nowIso(),
          updated_at: nowIso(),
          completed_at: null,
          is_detached: false
        };

        store!.tasks.push(task);

        actions.push({
          endpoint: `/api/projects/${projectId}/tasks`,
          method: 'POST',
          params: { title: task.title, source_document_id: task.source_document_id },
          result: { task_id: task.id, status: task.status }
        });

        logActivity({
          orgId: project.org_id,
          projectId,
          actorId: null,
          actorType: 'ai',
          action: 'created',
          targetType: 'task',
          targetId: task.id,
          metadata: { source: 'ai_chat', prompt: message }
        });
      }
    }
  }

  let contextSummary: Record<string, unknown> = { scope };

  if (projectId) {
    const projectContext = await summarizeProjectContext(projectId, useDb);
    contextSummary = {
      ...contextSummary,
      project_id: projectId,
      ...projectContext
    };
  } else if (scope === 'system') {
    if (useDb) {
      let totalProjects = 0;
      let totalTasks = 0;

      for (const orgId of systemOrgIds) {
        const projects = await db.projects.list(orgId);
        totalProjects += projects.length;
        for (const project of projects) {
          const tasks = await db.tasks.list(project.id);
          totalTasks += tasks.length;
        }
      }

      contextSummary = {
        ...contextSummary,
        org_ids: systemOrgIds,
        project_count: totalProjects,
        task_count: totalTasks
      };
    } else {
      const systemProjects = store!.projects.filter((project) => systemOrgIds.includes(project.org_id));
      const systemProjectIds = new Set(systemProjects.map((project) => project.id));
      contextSummary = {
        ...contextSummary,
        org_ids: systemOrgIds,
        project_count: systemProjects.length,
        task_count: store!.tasks.filter((task) => systemProjectIds.has(task.project_id)).length
      };
    }
  }

  const openaiResponse = await tryOpenAIResponse(message, scope, {
    ...contextSummary,
    actions
  });

  const fallbackResponse = await (async () => {
    if (actions.length > 0) {
      return `Completed ${actions.length} action(s). Review actions_taken for details.`;
    }

    if (projectId) {
      const today = nowIso().slice(0, 10);
      let overdue: { title: string }[] = [];

      if (useDb) {
        const tasks = await db.tasks.list(projectId);
        overdue = tasks.filter(
          (task) => !!task.due_date && task.status !== 'done' && task.status !== 'cancelled' && task.due_date < today
        );
      } else {
        overdue = store!.tasks.filter(
          (task) =>
            task.project_id === projectId &&
            !!task.due_date &&
            task.status !== 'done' &&
            task.due_date < today
        );
      }

      if (/overdue/i.test(message)) {
        if (overdue.length === 0) {
          return 'No overdue tasks in this project.';
        }
        return `Overdue tasks (${overdue.length}): ${overdue.map((task) => task.title).join(', ')}`;
      }
    }

    return 'Workbench AI is connected. Add OPENAI_API_KEY to enable model-backed responses and tool planning.';
  })();

  // Log AI chat activity
  if (projectId) {
    if (useDb) {
      const project = await db.projects.get(projectId);

      if (project) {
        await logActivityDb({
          orgId: project.org_id,
          projectId,
          actorId: null,
          actorType: 'ai',
          action: 'ai_chat',
          targetType: 'project',
          targetId: projectId,
          metadata: {
            scope,
            prompt: message,
            actions_taken: actions.map((action) => ({ endpoint: action.endpoint, method: action.method }))
          }
        });
      }
    } else {
      const project = store!.projects.find((item) => item.id === projectId);

      if (project) {
        logActivity({
          orgId: project.org_id,
          projectId,
          actorId: null,
          actorType: 'ai',
          action: 'ai_chat',
          targetType: 'project',
          targetId: projectId,
          metadata: {
            scope,
            prompt: message,
            actions_taken: actions.map((action) => ({ endpoint: action.endpoint, method: action.method }))
          }
        });
      }
    }
  }

  return {
    response: openaiResponse || fallbackResponse,
    actions_taken: actions,
    context: contextSummary
  };
});
