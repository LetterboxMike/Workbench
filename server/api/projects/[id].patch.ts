import { createError, defineEventHandler } from 'h3';
import {
  assertProjectAdmin,
  assertProjectAdminDb,
  getCurrentUser,
  getCurrentUserDb,
  useDbAuth
} from '~/server/utils/auth';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { nowIso } from '~/server/utils/id';
import { asStringArray, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

interface UpdateProjectBody {
  name?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  settings?: Record<string, unknown>;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const projectId = event.context.params?.id;

  if (!projectId) {
    throw createError({ statusCode: 400, statusMessage: 'Project id is required.' });
  }

  const body = await readJsonBody<UpdateProjectBody>(event);

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    await assertProjectAdminDb(projectId, user.id);

    const existingProject = await db.projects.get(projectId);

    if (!existingProject) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
    }

    // Build updates object
    const updates: {
      name?: string;
      description?: string | null;
      icon?: string | null;
      color?: string | null;
      settings?: Record<string, unknown>;
    } = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description ? body.description.trim() : null;
    }

    if (body.icon !== undefined) {
      updates.icon = body.icon ? body.icon.trim() : null;
    }

    if (body.color !== undefined) {
      updates.color = body.color ? body.color.trim() : null;
    }

    if (body.settings && typeof body.settings === 'object') {
      updates.settings = {
        ...existingProject.settings,
        ...body.settings,
        tags: asStringArray((body.settings as { tags?: unknown }).tags)
      };
    }

    const project = await db.projects.update(projectId, updates);

    await logActivityDb({
      orgId: project.org_id,
      projectId: project.id,
      actorId: user.id,
      action: 'updated',
      targetType: 'project',
      targetId: project.id,
      metadata: {
        updated_at: nowIso()
      }
    });

    return { data: project };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  assertProjectAdmin(projectId, user.id);

  const store = getStore();
  const project = store.projects.find((item) => item.id === projectId);

  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found.' });
  }

  if (typeof body.name === 'string' && body.name.trim()) {
    project.name = body.name.trim();
  }

  if (body.description !== undefined) {
    project.description = body.description ? body.description.trim() : null;
  }

  if (body.icon !== undefined) {
    project.icon = body.icon ? body.icon.trim() : null;
  }

  if (body.color !== undefined) {
    project.color = body.color ? body.color.trim() : null;
  }

  if (body.settings && typeof body.settings === 'object') {
    project.settings = {
      ...project.settings,
      ...body.settings,
      tags: asStringArray((body.settings as { tags?: unknown }).tags)
    };
  }

  logActivity({
    orgId: project.org_id,
    projectId: project.id,
    actorId: user.id,
    action: 'updated',
    targetType: 'project',
    targetId: project.id,
    metadata: {
      updated_at: nowIso()
    }
  });

  return {
    data: project
  };
});
