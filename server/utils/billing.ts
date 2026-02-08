import { createError } from 'h3';
import type {
  BillingInterval,
  BillingPlanId,
  InvoiceStatus,
  OrgInvoice,
  OrgSubscription,
  SubscriptionStatus
} from '~/types/domain';
import { db } from '~/server/utils/db';
import { createId, nowIso } from '~/server/utils/id';
import { getStore } from '~/server/utils/store';

const MB = 1024 * 1024;
const DEFAULT_TRIAL_DAYS = 14;
const DEFAULT_BILLING_DAYS = 30;
const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const BILLING_TABLE_NAMES = ['org_subscriptions', 'org_usage_counters', 'org_invoices'] as const;

export type PlanEntitlements = {
  max_projects: number | null;
  max_tasks_per_project: number | null;
  max_documents_per_project: number | null;
  max_members: number | null;
  max_upload_mb: number;
  ai_enabled: boolean;
};

export const BILLING_PLAN_ENTITLEMENTS: Record<BillingPlanId, PlanEntitlements> = {
  starter: {
    max_projects: 3,
    max_tasks_per_project: 200,
    max_documents_per_project: 100,
    max_members: 3,
    max_upload_mb: 256,
    ai_enabled: false
  },
  growth: {
    max_projects: 25,
    max_tasks_per_project: 5000,
    max_documents_per_project: 1500,
    max_members: 50,
    max_upload_mb: 4096,
    ai_enabled: true
  },
  enterprise: {
    max_projects: null,
    max_tasks_per_project: null,
    max_documents_per_project: null,
    max_members: null,
    max_upload_mb: 51200,
    ai_enabled: true
  }
};

const getPlanEntitlements = (planId: BillingPlanId): PlanEntitlements => {
  return BILLING_PLAN_ENTITLEMENTS[planId] || BILLING_PLAN_ENTITLEMENTS.starter;
};

export const resolvePlanEntitlements = (planId: BillingPlanId): PlanEntitlements => getPlanEntitlements(planId);

const seatLimitForSubscription = (subscription: OrgSubscription, entitlements: PlanEntitlements): number => {
  if (entitlements.max_members === null) {
    return subscription.seat_count;
  }

  return Math.min(subscription.seat_count, entitlements.max_members);
};

const createBillingError = (statusMessage: string, code: string, details: Record<string, unknown> = {}) => {
  throw createError({
    statusCode: 402,
    statusMessage,
    data: {
      code,
      ...details
    }
  });
};

const assertSubscriptionAllowsWrites = (subscription: OrgSubscription) => {
  if (subscription.status === 'active') {
    return;
  }

  if (subscription.status === 'trialing') {
    if (!subscription.trial_ends_at || Date.parse(subscription.trial_ends_at) >= Date.now()) {
      return;
    }

    createBillingError('Trial period has ended. Update your subscription to continue.', 'TRIAL_EXPIRED', {
      trial_ends_at: subscription.trial_ends_at
    });
  }

  if (subscription.status === 'past_due') {
    createBillingError('Subscription is past due. Resolve billing before creating new data.', 'SUBSCRIPTION_PAST_DUE');
  }

  if (subscription.status === 'paused') {
    createBillingError('Subscription is paused. Resume billing to continue.', 'SUBSCRIPTION_PAUSED');
  }

  createBillingError('Subscription is canceled. Reactivate billing to continue.', 'SUBSCRIPTION_CANCELED');
};

const createDefaultSubscriptionInput = (orgId: string) => {
  const now = new Date();

  return {
    id: createId(),
    org_id: orgId,
    plan_id: 'starter' as const,
    status: 'trialing' as const,
    billing_interval: 'monthly' as const,
    seat_count: 3,
    trial_ends_at: new Date(now.getTime() + DEFAULT_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    current_period_start: now.toISOString(),
    current_period_end: new Date(now.getTime() + DEFAULT_BILLING_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    cancel_at_period_end: false,
    canceled_at: null,
    metadata: {},
    created_at: nowIso(),
    updated_at: nowIso()
  };
};

const isMissingBillingSchemaError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error || '');
  if (!message.includes('Could not find the table')) {
    return false;
  }

  return BILLING_TABLE_NAMES.some((tableName) => message.includes(tableName));
};

const ensureOrgSubscriptionInStore = (orgId: string): OrgSubscription => {
  const store = getStore();
  const existing = store.org_subscriptions
    .filter((subscription) => subscription.org_id === orgId && subscription.status !== 'canceled')
    .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))[0];

  if (existing) {
    return existing;
  }

  const seeded = createDefaultSubscriptionInput(orgId);
  store.org_subscriptions.push(seeded);
  return seeded;
};

export const ensureOrgSubscriptionAuto = async (orgId: string, useDb: boolean): Promise<OrgSubscription> => {
  if (useDb) {
    try {
      const existing = await db.billingSubscriptions.getActiveForOrg(orgId);
      if (existing) {
        return existing;
      }

      const seeded = createDefaultSubscriptionInput(orgId);
      const created = await db.billingSubscriptions.create({
        org_id: seeded.org_id,
        plan_id: seeded.plan_id,
        status: seeded.status,
        billing_interval: seeded.billing_interval,
        seat_count: seeded.seat_count,
        trial_ends_at: seeded.trial_ends_at,
        current_period_start: seeded.current_period_start,
        current_period_end: seeded.current_period_end,
        cancel_at_period_end: seeded.cancel_at_period_end,
        canceled_at: seeded.canceled_at,
        metadata: seeded.metadata
      });

      return created;
    } catch (error) {
      if (!isMissingBillingSchemaError(error)) {
        throw error;
      }
      return ensureOrgSubscriptionInStore(orgId);
    }
  }

  return ensureOrgSubscriptionInStore(orgId);
};

export const getOrgSubscriptionAuto = async (orgId: string, useDb: boolean): Promise<OrgSubscription> => {
  return ensureOrgSubscriptionAuto(orgId, useDb);
};

export const updateOrgSubscriptionAuto = async (
  orgId: string,
  useDb: boolean,
  updates: Partial<{
    plan_id: BillingPlanId;
    status: SubscriptionStatus;
    billing_interval: BillingInterval;
    seat_count: number;
    trial_ends_at: string | null;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
    metadata: Record<string, unknown>;
  }>
): Promise<OrgSubscription> => {
  const subscription = await ensureOrgSubscriptionAuto(orgId, useDb);

  if (useDb) {
    try {
      return await db.billingSubscriptions.update(subscription.id, updates);
    } catch (error) {
      if (!isMissingBillingSchemaError(error)) {
        throw error;
      }
      return updateOrgSubscriptionAuto(orgId, false, updates);
    }
  }

  const store = getStore();
  const existing = store.org_subscriptions.find((item) => item.id === subscription.id);

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Subscription not found.' });
  }

  if (updates.plan_id !== undefined) existing.plan_id = updates.plan_id;
  if (updates.status !== undefined) existing.status = updates.status;
  if (updates.billing_interval !== undefined) existing.billing_interval = updates.billing_interval;
  if (updates.seat_count !== undefined) existing.seat_count = updates.seat_count;
  if (updates.trial_ends_at !== undefined) existing.trial_ends_at = updates.trial_ends_at;
  if (updates.current_period_start !== undefined) existing.current_period_start = updates.current_period_start;
  if (updates.current_period_end !== undefined) existing.current_period_end = updates.current_period_end;
  if (updates.cancel_at_period_end !== undefined) existing.cancel_at_period_end = updates.cancel_at_period_end;
  if (updates.canceled_at !== undefined) existing.canceled_at = updates.canceled_at;
  if (updates.metadata !== undefined) existing.metadata = updates.metadata;
  existing.updated_at = nowIso();

  return existing;
};

export const listOrgInvoicesAuto = async (orgId: string, useDb: boolean): Promise<OrgInvoice[]> => {
  if (useDb) {
    try {
      return await db.billingInvoices.listByOrg(orgId);
    } catch (error) {
      if (!isMissingBillingSchemaError(error)) {
        throw error;
      }
    }
  }

  const store = getStore();
  return store.org_invoices
    .filter((invoice) => invoice.org_id === orgId)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
};

export const createOrgInvoiceAuto = async (
  orgId: string,
  useDb: boolean,
  invoice: {
    subscription_id?: string | null;
    status: InvoiceStatus;
    amount_cents: number;
    currency?: string;
    due_at?: string | null;
    paid_at?: string | null;
    period_start: string;
    period_end: string;
    metadata?: Record<string, unknown>;
  }
): Promise<OrgInvoice> => {
  if (useDb) {
    try {
      return await db.billingInvoices.create({
        org_id: orgId,
        subscription_id: invoice.subscription_id || null,
        status: invoice.status,
        amount_cents: invoice.amount_cents,
        currency: invoice.currency || 'usd',
        due_at: invoice.due_at || null,
        paid_at: invoice.paid_at || null,
        period_start: invoice.period_start,
        period_end: invoice.period_end,
        metadata: invoice.metadata || {}
      });
    } catch (error) {
      if (!isMissingBillingSchemaError(error)) {
        throw error;
      }
    }
  }

  const store = getStore();
  const created: OrgInvoice = {
    id: createId(),
    org_id: orgId,
    subscription_id: invoice.subscription_id || null,
    status: invoice.status,
    amount_cents: invoice.amount_cents,
    currency: (invoice.currency || 'usd').toLowerCase(),
    due_at: invoice.due_at || null,
    paid_at: invoice.paid_at || null,
    period_start: invoice.period_start,
    period_end: invoice.period_end,
    metadata: invoice.metadata || {},
    created_at: nowIso(),
    updated_at: nowIso()
  };

  store.org_invoices.push(created);
  return created;
};

export const updateOrgInvoiceAuto = async (
  orgId: string,
  invoiceId: string,
  useDb: boolean,
  updates: Partial<Pick<OrgInvoice, 'status' | 'due_at' | 'paid_at' | 'metadata'>>
): Promise<OrgInvoice> => {
  if (useDb) {
    try {
      const invoice = await db.billingInvoices.get(invoiceId);
      if (!invoice || invoice.org_id !== orgId) {
        throw createError({ statusCode: 404, statusMessage: 'Invoice not found.' });
      }
      return await db.billingInvoices.update(invoiceId, updates);
    } catch (error) {
      if (!isMissingBillingSchemaError(error)) {
        throw error;
      }
      return updateOrgInvoiceAuto(orgId, invoiceId, false, updates);
    }
  }

  const store = getStore();
  const invoice = store.org_invoices.find((item) => item.id === invoiceId && item.org_id === orgId);

  if (!invoice) {
    throw createError({ statusCode: 404, statusMessage: 'Invoice not found.' });
  }

  if (updates.status !== undefined) invoice.status = updates.status;
  if (updates.due_at !== undefined) invoice.due_at = updates.due_at;
  if (updates.paid_at !== undefined) invoice.paid_at = updates.paid_at;
  if (updates.metadata !== undefined) invoice.metadata = updates.metadata;
  invoice.updated_at = nowIso();

  return invoice;
};

const getProjectCount = async (orgId: string, useDb: boolean): Promise<number> => {
  if (useDb) {
    return (await db.projects.list(orgId, false)).length;
  }

  const store = getStore();
  return store.projects.filter((project) => project.org_id === orgId && !project.archived_at).length;
};

const getTaskCountForProject = async (projectId: string, useDb: boolean): Promise<number> => {
  if (useDb) {
    return (await db.tasks.list(projectId)).length;
  }

  const store = getStore();
  return store.tasks.filter((task) => task.project_id === projectId).length;
};

const getDocumentCountForProject = async (projectId: string, useDb: boolean): Promise<number> => {
  if (useDb) {
    return (await db.documents.list(projectId, false)).length;
  }

  const store = getStore();
  return store.documents.filter((doc) => doc.project_id === projectId && !doc.is_archived).length;
};

const getOrgMemberCount = async (orgId: string, useDb: boolean): Promise<number> => {
  if (useDb) {
    return (await db.orgMembers.list(orgId)).length;
  }

  const store = getStore();
  return store.org_members.filter((member) => member.org_id === orgId).length;
};

const getPendingOrgInviteCount = async (orgId: string, useDb: boolean): Promise<number> => {
  const now = Date.now();

  if (useDb) {
    const [links, invitations] = await Promise.all([
      db.magicLinks.listByOrg(orgId),
      db.invitations.listByOrg(orgId)
    ]);
    const pendingEmails = new Set<string>();

    for (const link of links) {
      if (!link.redeemed_at && Date.parse(link.expires_at) > now) {
        pendingEmails.add(normalizeEmail(link.email));
      }
    }

    for (const invitation of invitations) {
      pendingEmails.add(normalizeEmail(invitation.email));
    }

    return pendingEmails.size;
  }

  const store = getStore();
  const pendingEmails = new Set<string>();

  for (const link of store.magic_links) {
    if (link.org_id === orgId && !link.redeemed_at && Date.parse(link.expires_at) > now) {
      pendingEmails.add(normalizeEmail(link.email));
    }
  }

  for (const invitation of store.invitations) {
    if (invitation.org_id === orgId && !invitation.accepted_at) {
      pendingEmails.add(normalizeEmail(invitation.email));
    }
  }

  return pendingEmails.size;
};

const getUploadBytesUsed = async (orgId: string, useDb: boolean): Promise<number> => {
  if (useDb) {
    try {
      const usage = await db.billingUsage.get(orgId, 'upload_bytes');
      return Number(usage?.value || 0);
    } catch (error) {
      if (!isMissingBillingSchemaError(error)) {
        throw error;
      }
      return 0;
    }
  }

  const store = getStore();
  const usage = store.org_usage_counters.find((counter) => counter.org_id === orgId && counter.metric === 'upload_bytes');
  return Number(usage?.value || 0);
};

export const getOrgBillingSnapshotAuto = async (orgId: string, useDb: boolean): Promise<{
  subscription: OrgSubscription;
  entitlements: PlanEntitlements & { seat_limit: number };
  usage: {
    projects: number;
    members: number;
    pending_invites: number;
    upload_bytes: number;
  };
}> => {
  const subscription = await ensureOrgSubscriptionAuto(orgId, useDb);
  const entitlements = getPlanEntitlements(subscription.plan_id);
  const [projects, members, pendingInvites, uploadBytes] = await Promise.all([
    getProjectCount(orgId, useDb),
    getOrgMemberCount(orgId, useDb),
    getPendingOrgInviteCount(orgId, useDb),
    getUploadBytesUsed(orgId, useDb)
  ]);

  return {
    subscription,
    entitlements: {
      ...entitlements,
      seat_limit: seatLimitForSubscription(subscription, entitlements)
    },
    usage: {
      projects,
      members,
      pending_invites: pendingInvites,
      upload_bytes: uploadBytes
    }
  };
};

export const assertCanCreateProjectAuto = async (orgId: string, useDb: boolean): Promise<void> => {
  const snapshot = await getOrgBillingSnapshotAuto(orgId, useDb);
  assertSubscriptionAllowsWrites(snapshot.subscription);

  if (snapshot.entitlements.max_projects !== null && snapshot.usage.projects >= snapshot.entitlements.max_projects) {
    createBillingError('Project limit reached for current plan.', 'PROJECT_LIMIT_REACHED', {
      limit: snapshot.entitlements.max_projects,
      current: snapshot.usage.projects
    });
  }
};

export const assertCanCreateTaskAuto = async (orgId: string, projectId: string, useDb: boolean): Promise<void> => {
  const subscription = await ensureOrgSubscriptionAuto(orgId, useDb);
  assertSubscriptionAllowsWrites(subscription);

  const entitlements = getPlanEntitlements(subscription.plan_id);
  if (entitlements.max_tasks_per_project === null) {
    return;
  }

  const currentCount = await getTaskCountForProject(projectId, useDb);
  if (currentCount >= entitlements.max_tasks_per_project) {
    createBillingError('Task limit reached for this project on current plan.', 'TASK_LIMIT_REACHED', {
      limit: entitlements.max_tasks_per_project,
      current: currentCount
    });
  }
};

export const assertCanCreateDocumentAuto = async (orgId: string, projectId: string, useDb: boolean): Promise<void> => {
  const subscription = await ensureOrgSubscriptionAuto(orgId, useDb);
  assertSubscriptionAllowsWrites(subscription);

  const entitlements = getPlanEntitlements(subscription.plan_id);
  if (entitlements.max_documents_per_project === null) {
    return;
  }

  const currentCount = await getDocumentCountForProject(projectId, useDb);
  if (currentCount >= entitlements.max_documents_per_project) {
    createBillingError('Document limit reached for this project on current plan.', 'DOCUMENT_LIMIT_REACHED', {
      limit: entitlements.max_documents_per_project,
      current: currentCount
    });
  }
};

export const assertCanInviteOrgMemberAuto = async (orgId: string, useDb: boolean): Promise<void> => {
  const snapshot = await getOrgBillingSnapshotAuto(orgId, useDb);
  assertSubscriptionAllowsWrites(snapshot.subscription);

  const consumedSeats = snapshot.usage.members + snapshot.usage.pending_invites;
  if (consumedSeats >= snapshot.entitlements.seat_limit) {
    createBillingError('No available seats on current subscription.', 'SEAT_LIMIT_REACHED', {
      seat_limit: snapshot.entitlements.seat_limit,
      members: snapshot.usage.members,
      pending_invites: snapshot.usage.pending_invites
    });
  }
};

export const assertCanRedeemOrgMemberAuto = async (orgId: string, useDb: boolean): Promise<void> => {
  const snapshot = await getOrgBillingSnapshotAuto(orgId, useDb);
  assertSubscriptionAllowsWrites(snapshot.subscription);

  if (snapshot.usage.members >= snapshot.entitlements.seat_limit) {
    createBillingError('No available seats on current subscription.', 'SEAT_LIMIT_REACHED', {
      seat_limit: snapshot.entitlements.seat_limit,
      members: snapshot.usage.members
    });
  }
};

export const assertCanUploadFileAuto = async (orgId: string, useDb: boolean, bytes: number): Promise<void> => {
  const snapshot = await getOrgBillingSnapshotAuto(orgId, useDb);
  assertSubscriptionAllowsWrites(snapshot.subscription);

  const limitBytes = snapshot.entitlements.max_upload_mb * MB;
  if (snapshot.usage.upload_bytes + bytes > limitBytes) {
    createBillingError('Storage upload quota exceeded for current plan.', 'UPLOAD_QUOTA_EXCEEDED', {
      limit_mb: snapshot.entitlements.max_upload_mb,
      used_mb: Number((snapshot.usage.upload_bytes / MB).toFixed(2)),
      requested_mb: Number((bytes / MB).toFixed(2))
    });
  }
};

export const recordUploadUsageAuto = async (orgId: string, useDb: boolean, bytes: number): Promise<void> => {
  if (bytes <= 0) {
    return;
  }

  if (useDb) {
    try {
      await db.billingUsage.increment(orgId, 'upload_bytes', bytes);
      return;
    } catch (error) {
      if (!isMissingBillingSchemaError(error)) {
        throw error;
      }
    }
  }

  const store = getStore();
  const existing = store.org_usage_counters.find((counter) => counter.org_id === orgId && counter.metric === 'upload_bytes');

  if (existing) {
    existing.value = Number(existing.value || 0) + bytes;
    existing.updated_at = nowIso();
    return;
  }

  store.org_usage_counters.push({
    org_id: orgId,
    metric: 'upload_bytes',
    value: bytes,
    updated_at: nowIso()
  });
};
