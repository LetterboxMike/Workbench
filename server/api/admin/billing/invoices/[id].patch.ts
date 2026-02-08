import { createError, defineEventHandler } from 'h3';
import {
  getActiveOrgIdForUser,
  getActiveOrgIdForUserDb,
  getCurrentUser,
  getCurrentUserDb,
  getSystemRole,
  getSystemRoleDb,
  useDbAuth
} from '~/server/utils/auth';
import { updateOrgInvoiceAuto } from '~/server/utils/billing';
import { readJsonBody } from '~/server/utils/request';
import type { InvoiceStatus } from '~/types/domain';

interface UpdateInvoiceBody {
  status?: InvoiceStatus;
  due_at?: string | null;
  paid_at?: string | null;
  metadata?: Record<string, unknown>;
}

const ALLOWED_STATUSES = new Set(['draft', 'open', 'paid', 'void', 'uncollectible']);

export default defineEventHandler(async (event) => {
  const invoiceId = event.context.params?.id;

  if (!invoiceId) {
    throw createError({ statusCode: 400, statusMessage: 'Invoice id is required.' });
  }

  const useDb = useDbAuth();
  const user = useDb ? await getCurrentUserDb(event) : await getCurrentUser(event);
  const activeOrgId = useDb
    ? await getActiveOrgIdForUserDb(event, user.id)
    : getActiveOrgIdForUser(event, user.id);

  if (!activeOrgId) {
    throw createError({ statusCode: 400, statusMessage: 'No active organization.' });
  }

  const role = useDb
    ? await getSystemRoleDb(activeOrgId, user.id)
    : getSystemRole(activeOrgId, user.id);

  if (role !== 'super_admin') {
    throw createError({ statusCode: 403, statusMessage: 'Super admin access required.' });
  }

  const body = await readJsonBody<UpdateInvoiceBody>(event);
  const updates: Partial<{
    status: InvoiceStatus;
    due_at: string | null;
    paid_at: string | null;
    metadata: Record<string, unknown>;
  }> = {};

  if (body.status) {
    if (!ALLOWED_STATUSES.has(body.status)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid status.' });
    }
    updates.status = body.status;
  }

  if (body.due_at !== undefined) {
    updates.due_at = body.due_at;
  }

  if (body.paid_at !== undefined) {
    updates.paid_at = body.paid_at;
  }

  if (body.metadata !== undefined) {
    updates.metadata = body.metadata;
  }

  if (updates.status === 'paid' && updates.paid_at === undefined) {
    updates.paid_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No updates provided.' });
  }

  const invoice = await updateOrgInvoiceAuto(activeOrgId, invoiceId, useDb, updates);

  return {
    data: invoice
  };
});
