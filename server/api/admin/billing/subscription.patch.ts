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
import {
  createOrgInvoiceAuto,
  getOrgBillingSnapshotAuto,
  getOrgSubscriptionAuto,
  updateOrgSubscriptionAuto
} from '~/server/utils/billing';
import { readJsonBody } from '~/server/utils/request';
import type { BillingInterval, BillingPlanId, SubscriptionStatus } from '~/types/domain';

interface UpdateSubscriptionBody {
  action?: 'activate' | 'pause' | 'mark_past_due' | 'cancel_now' | 'cancel_end_of_period' | 'resume';
  plan_id?: BillingPlanId;
  billing_interval?: BillingInterval;
  seat_count?: number;
  status?: SubscriptionStatus;
  issue_invoice?: {
    amount_cents: number;
    currency?: string;
    due_at?: string | null;
  };
}

const ALLOWED_ACTIONS = new Set([
  'activate',
  'pause',
  'mark_past_due',
  'cancel_now',
  'cancel_end_of_period',
  'resume'
]);

export default defineEventHandler(async (event) => {
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

  const body = await readJsonBody<UpdateSubscriptionBody>(event);
  const subscription = await getOrgSubscriptionAuto(activeOrgId, useDb);
  const updates: Partial<{
    plan_id: BillingPlanId;
    status: SubscriptionStatus;
    billing_interval: BillingInterval;
    seat_count: number;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
  }> = {};

  if (body.plan_id) {
    updates.plan_id = body.plan_id;
  }

  if (body.billing_interval) {
    updates.billing_interval = body.billing_interval;
  }

  if (typeof body.seat_count === 'number') {
    if (!Number.isInteger(body.seat_count) || body.seat_count < 1) {
      throw createError({ statusCode: 400, statusMessage: 'seat_count must be a positive integer.' });
    }
    updates.seat_count = body.seat_count;
  }

  if (body.status) {
    updates.status = body.status;
  }

  const action = body.action;
  if (action) {
    if (!ALLOWED_ACTIONS.has(action)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid action.' });
    }

    if (action === 'activate' || action === 'resume') {
      updates.status = 'active';
      updates.cancel_at_period_end = false;
      updates.canceled_at = null;
    } else if (action === 'pause') {
      updates.status = 'paused';
    } else if (action === 'mark_past_due') {
      updates.status = 'past_due';
    } else if (action === 'cancel_now') {
      updates.status = 'canceled';
      updates.cancel_at_period_end = false;
      updates.canceled_at = new Date().toISOString();
    } else if (action === 'cancel_end_of_period') {
      updates.cancel_at_period_end = true;
      if (subscription.status === 'canceled') {
        updates.status = 'active';
      }
    }
  }

  if (Object.keys(updates).length === 0 && !body.issue_invoice) {
    throw createError({ statusCode: 400, statusMessage: 'No updates provided.' });
  }

  const nextSubscription = Object.keys(updates).length
    ? await updateOrgSubscriptionAuto(activeOrgId, useDb, updates)
    : subscription;

  let invoice = null;
  if (body.issue_invoice) {
    const amount = Number(body.issue_invoice.amount_cents);
    if (!Number.isFinite(amount) || amount < 0) {
      throw createError({ statusCode: 400, statusMessage: 'issue_invoice.amount_cents must be a non-negative number.' });
    }

    invoice = await createOrgInvoiceAuto(activeOrgId, useDb, {
      subscription_id: nextSubscription.id,
      status: 'open',
      amount_cents: Math.round(amount),
      currency: body.issue_invoice.currency || 'usd',
      due_at: body.issue_invoice.due_at || null,
      paid_at: null,
      period_start: nextSubscription.current_period_start,
      period_end: nextSubscription.current_period_end,
      metadata: {
        created_by_admin: user.id
      }
    });
  }

  const snapshot = await getOrgBillingSnapshotAuto(activeOrgId, useDb);

  return {
    data: {
      org_id: activeOrgId,
      subscription: snapshot.subscription,
      entitlements: snapshot.entitlements,
      usage: snapshot.usage,
      invoice
    }
  };
});
