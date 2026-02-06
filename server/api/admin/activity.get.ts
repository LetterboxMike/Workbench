import { createError, defineEventHandler, getQuery } from 'h3';
import {
  getCurrentUser,
  getCurrentUserDb,
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getSystemRole,
  getSystemRoleDb,
  useDbAuth
} from '~/server/utils/auth';
import { getStore } from '~/server/utils/store';
import { db } from '~/server/utils/db';

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const query = getQuery(event);

  const limit = Math.min(parseInt(String(query.limit || '50'), 10), 200);
  const offset = parseInt(String(query.offset || '0'), 10);
  const action = typeof query.action === 'string' ? query.action : undefined;
  const targetType = typeof query.target_type === 'string' ? query.target_type : undefined;
  const projectId = typeof query.project_id === 'string' ? query.project_id : undefined;

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

    const entries = await db.activity.list({
      org_id: activeOrgId,
      project_id: projectId,
      action,
      target_type: targetType,
      limit,
      offset
    });

    return {
      data: entries,
      pagination: {
        limit,
        offset,
        has_more: entries.length === limit
      }
    };
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

  let entries = store.activity_log
    .filter((entry) => entry.org_id === activeOrgId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (action) {
    entries = entries.filter((e) => e.action === action);
  }
  if (targetType) {
    entries = entries.filter((e) => e.target_type === targetType);
  }
  if (projectId) {
    entries = entries.filter((e) => e.project_id === projectId);
  }

  const paginatedEntries = entries.slice(offset, offset + limit);

  // Enrich with actor info
  const enriched = paginatedEntries.map((entry) => {
    const actor = entry.actor_id ? store.users.find((u) => u.id === entry.actor_id) : null;
    return { ...entry, actor: actor || null };
  });

  return {
    data: enriched,
    pagination: {
      limit,
      offset,
      has_more: entries.length > offset + limit
    }
  };
});
