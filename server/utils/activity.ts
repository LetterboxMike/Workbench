import type { ActivityLog } from '~/types/domain';
import { createId, nowIso } from '~/server/utils/id';
import { getStore } from '~/server/utils/store';
import { getAuthMode } from '~/server/utils/auth';
import { dbActivity } from '~/server/utils/db';

interface LogOptions {
  orgId: string;
  projectId?: string | null;
  actorId?: string | null;
  actorType?: ActivityLog['actor_type'];
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export const logActivity = (options: LogOptions): ActivityLog => {
  const store = getStore();

  const entry: ActivityLog = {
    id: createId(),
    org_id: options.orgId,
    project_id: options.projectId ?? null,
    actor_id: options.actorId ?? null,
    actor_type: options.actorType ?? 'user',
    action: options.action,
    target_type: options.targetType,
    target_id: options.targetId,
    metadata: options.metadata ?? {},
    created_at: nowIso()
  };

  store.activity_log.unshift(entry);

  return entry;
};

// Database-backed activity logging for Supabase mode
export const logActivityDb = async (options: LogOptions): Promise<ActivityLog> => {
  return dbActivity.log({
    org_id: options.orgId,
    project_id: options.projectId ?? null,
    actor_id: options.actorId ?? null,
    actor_type: options.actorType ?? 'user',
    action: options.action,
    target_type: options.targetType,
    target_id: options.targetId,
    metadata: options.metadata ?? {}
  });
};

// Smart activity logger that uses the right backend
export const logActivityAuto = async (options: LogOptions): Promise<ActivityLog> => {
  if (getAuthMode() === 'supabase') {
    return logActivityDb(options);
  }
  return logActivity(options);
};