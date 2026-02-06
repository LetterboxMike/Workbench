import { createError, defineEventHandler } from 'h3';
import {
  getCurrentUser,
  getCurrentUserDb,
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getSystemRole,
  getSystemRoleDb,
  useDbAuth
} from '~/server/utils/auth';
import { logActivity, logActivityDb } from '~/server/utils/activity';
import { readJsonBody } from '~/server/utils/request';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

interface UpdateOrgBody {
  name?: string;
  slug?: string;
}

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const body = await readJsonBody<UpdateOrgBody>(event);

  if (useDb) {
    // Supabase mode
    const user = await getCurrentUserDb(event);
    const activeOrgId = await getActiveOrgIdForUserDb(event, user.id);

    if (!activeOrgId) {
      throw createError({ statusCode: 400, statusMessage: 'No active organization.' });
    }

    const systemRole = await getSystemRoleDb(activeOrgId, user.id);

    if (systemRole !== 'super_admin') {
      throw createError({ statusCode: 403, statusMessage: 'Super admin access required.' });
    }

    const updates: Partial<{ name: string; slug: string }> = {};

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (typeof body.slug === 'string' && body.slug.trim()) {
      const slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      // Check if slug is already taken by another org
      const existingOrg = await db.organizations.getBySlug(slug);
      if (existingOrg && existingOrg.id !== activeOrgId) {
        throw createError({ statusCode: 409, statusMessage: 'This slug is already in use.' });
      }
      updates.slug = slug;
    }

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No valid updates provided.' });
    }

    const org = await db.organizations.update(activeOrgId, updates);

    await logActivityDb({
      orgId: activeOrgId,
      actorId: user.id,
      action: 'updated',
      targetType: 'organization',
      targetId: activeOrgId,
      metadata: updates
    });

    return { data: org };
  }

  // Local mode
  const user = await getCurrentUser(event);
  const activeOrgId = getActiveOrgIdForUser(event, user.id);

  if (!activeOrgId) {
    throw createError({ statusCode: 400, statusMessage: 'No active organization.' });
  }

  const systemRole = getSystemRole(activeOrgId, user.id);

  if (systemRole !== 'super_admin') {
    throw createError({ statusCode: 403, statusMessage: 'Super admin access required.' });
  }

  const store = getStore();
  const org = store.organizations.find((o) => o.id === activeOrgId);

  if (!org) {
    throw createError({ statusCode: 404, statusMessage: 'Organization not found.' });
  }

  const updates: Record<string, string> = {};

  if (typeof body.name === 'string' && body.name.trim()) {
    org.name = body.name.trim();
    updates.name = org.name;
  }

  if (typeof body.slug === 'string' && body.slug.trim()) {
    const slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const existingOrg = store.organizations.find((o) => o.slug === slug && o.id !== activeOrgId);
    if (existingOrg) {
      throw createError({ statusCode: 409, statusMessage: 'This slug is already in use.' });
    }
    org.slug = slug;
    updates.slug = org.slug;
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No valid updates provided.' });
  }

  logActivity({
    orgId: activeOrgId,
    actorId: user.id,
    action: 'updated',
    targetType: 'organization',
    targetId: activeOrgId,
    metadata: updates
  });

  return { data: org };
});
