import { createError, defineEventHandler } from 'h3';
import {
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getCurrentUser,
  getCurrentUserDb,
  getUserOrgMemberships,
  getUserOrgMembershipsDb,
  useDbAuth
} from '~/server/utils/auth';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { createId, nowIso } from '~/server/utils/id';
import { ensureString, readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';
import { assertCanCreateProjectAuto } from '~/server/utils/billing';

interface CreateProjectBody {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  org_id?: string;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const body = await readJsonBody<CreateProjectBody>(event);
  const name = ensureString(body.name, 'name');

  if (useDb) {
    // Supabase mode: use database
    const user = await getCurrentUserDb(event);
    const memberships = await getUserOrgMembershipsDb(user.id);

    if (memberships.length === 0) {
      throw createError({ statusCode: 403, statusMessage: 'User must belong to an organization.' });
    }

    const activeOrgId = await getActiveOrgIdForUserDb(event, user.id);
    const orgId = body.org_id || activeOrgId || memberships[0]!.org_id;
    const orgMembership = memberships.find((member) => member.org_id === orgId);

    if (!orgMembership) {
      throw createError({ statusCode: 403, statusMessage: 'You do not have access to the requested organization.' });
    }

    await assertCanCreateProjectAuto(orgId, true);

    const project = await db.projects.create({
      org_id: orgId,
      name,
      description: body.description?.trim() || null,
      icon: body.icon?.trim() || 'WB',
      color: body.color?.trim() || '#0f766e',
      created_by: user.id,
      settings: { default_view: 'list', allow_ai: true }
    });

    await db.projectMembers.create({
      project_id: project.id,
      user_id: user.id,
      role: 'admin',
      invited_by: user.id
    });

    await logActivityDb({
      orgId: project.org_id,
      projectId: project.id,
      actorId: user.id,
      action: 'created',
      targetType: 'project',
      targetId: project.id,
      metadata: { name: project.name }
    });

    return { data: project };
  }

  // Local mode: use store
  const user = await getCurrentUser(event);
  const store = getStore();
  const memberships = getUserOrgMemberships(user.id);

  if (memberships.length === 0) {
    throw createError({ statusCode: 403, statusMessage: 'User must belong to an organization.' });
  }

  const activeOrgId = getActiveOrgIdForUser(event, user.id);
  const orgId = body.org_id || activeOrgId || memberships[0]!.org_id;
  const orgMembership = memberships.find((member) => member.org_id === orgId);

  if (!orgMembership) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to the requested organization.' });
  }

  await assertCanCreateProjectAuto(orgId, false);

  const project = {
    id: createId(),
    org_id: orgId,
    name,
    description: body.description?.trim() || null,
    icon: body.icon?.trim() || 'WB',
    color: body.color?.trim() || '#0f766e',
    created_by: user.id,
    created_at: nowIso(),
    archived_at: null,
    settings: {}
  };

  store.projects.push(project);
  store.project_members.push({
    project_id: project.id,
    user_id: user.id,
    role: 'admin',
    invited_by: user.id,
    joined_at: nowIso()
  });

  logActivity({
    orgId: project.org_id,
    projectId: project.id,
    actorId: user.id,
    action: 'created',
    targetType: 'project',
    targetId: project.id,
    metadata: { name: project.name }
  });

  return { data: project };
});
