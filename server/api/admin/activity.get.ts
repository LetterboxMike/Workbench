import { createError, defineEventHandler, getQuery, setHeader } from 'h3';
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

const csvEscape = (value: unknown): string => {
  const text = typeof value === 'string' ? value : value == null ? '' : String(value);
  if (text.includes('"') || text.includes(',') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const getActorName = (entry: any): string => {
  if (entry.actor_type === 'system') return 'system';
  if (entry.actor_type === 'ai') return 'ai';
  return entry.actor?.display_name || entry.actor?.name || entry.actor?.email || entry.actor_id || '';
};

const toCsv = (entries: any[]): string => {
  const headers = [
    'created_at',
    'actor_type',
    'actor_name',
    'action',
    'target_type',
    'target_id',
    'project_id',
    'org_id',
    'metadata'
  ];

  const rows = entries.map((entry) => ([
    entry.created_at,
    entry.actor_type,
    getActorName(entry),
    entry.action,
    entry.target_type,
    entry.target_id,
    entry.project_id || '',
    entry.org_id,
    JSON.stringify(entry.metadata || {})
  ].map(csvEscape).join(',')));

  return [headers.join(','), ...rows].join('\n');
};

export default defineEventHandler(async (event) => {
  const useDb = useDbAuth();
  const query = getQuery(event);

  const limit = Math.min(parseInt(String(query.limit || '50'), 10), 200);
  const offset = parseInt(String(query.offset || '0'), 10);
  const action = typeof query.action === 'string' ? query.action : undefined;
  const targetType = typeof query.target_type === 'string' ? query.target_type : undefined;
  const projectId = typeof query.project_id === 'string' ? query.project_id : undefined;
  const format = typeof query.format === 'string' ? query.format : 'json';

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
      limit: format === 'csv' ? 5000 : limit,
      offset: format === 'csv' ? 0 : offset
    });

    if (format === 'csv') {
      const csv = toCsv(entries);
      const stamp = new Date().toISOString().slice(0, 10);
      setHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
      setHeader(event, 'Content-Disposition', `attachment; filename="activity-log-${stamp}.csv"`);
      return csv;
    }

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

  if (format === 'csv') {
    const enrichedAll = entries.map((entry) => {
      const actor = entry.actor_id ? store.users.find((u) => u.id === entry.actor_id) : null;
      return { ...entry, actor: actor || null };
    });
    const csv = toCsv(enrichedAll);
    const stamp = new Date().toISOString().slice(0, 10);
    setHeader(event, 'Content-Type', 'text/csv; charset=utf-8');
    setHeader(event, 'Content-Disposition', `attachment; filename="activity-log-${stamp}.csv"`);
    return csv;
  }

  return {
    data: enriched,
    pagination: {
      limit,
      offset,
      has_more: entries.length > offset + limit
    }
  };
});
