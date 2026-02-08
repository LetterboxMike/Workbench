import type {
  ActivityLog,
  Comment,
  Document,
  DocumentContent,
  Invitation,
  LocalAuthAccount,
  LocalAuthSession,
  MagicLink,
  Notification,
  OrgInvoice,
  OrgSubscription,
  OrgUsageCounter,
  Organization,
  OrgMember,
  Project,
  ProjectFile,
  ProjectMember,
  Task,
  User,
  WorkbenchStore
} from '~/types/domain';
import { createId, nowIso } from '~/server/utils/id';
import { hashPassword } from '~/server/utils/password';

const DEMO_ORG_ID = '8f657dc3-3e04-4e44-a2df-7f9fbf8f7301';
const DEMO_USER_ID = '5cf4fca2-5686-4f94-8c7a-4fc6e575adff';
const DEMO_USER_2_ID = 'a9f6f903-5506-4ac5-9ab6-4a140719bf61';
const DEMO_USER_3_ID = 'd89d1538-1e6f-4faf-950e-7f4f7a95c9c1';
const DEMO_PROJECT_ID = '0f0ec94f-b5a5-4e6f-b6b5-449230a89afc';
const DEMO_DOC_ID = 'c42fa11e-b38c-47fc-bf01-a4e6ec4cf723';
const DEMO_DOC_2_ID = '8b4989d7-2c02-47d8-99f8-ab299e0fa53f';
const DEMO_TASK_ID = 'f30f19b2-b0a3-452d-9d1f-5714f4f61836';
const DEMO_TASK_2_ID = 'f30f19b2-b0a3-452d-9d1f-5714f4f61837';
const DEMO_TASK_3_ID = 'f30f19b2-b0a3-452d-9d1f-5714f4f61838';

const tiptapStarterDoc = (heading: string, paragraph: string): Record<string, unknown> => ({
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: heading }]
    },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: paragraph }]
    }
  ]
});

const seedOrganizations = (): Organization[] => [
  {
    id: DEMO_ORG_ID,
    name: 'BetterSignShop',
    slug: 'bettersignshop',
    created_at: nowIso()
  }
];

const seedUsers = (): User[] => [
  {
    id: DEMO_USER_ID,
    email: 'michael@bettersignshop.com',
    name: 'Michael',
    avatar_url: null,
    created_at: nowIso()
  },
  {
    id: DEMO_USER_2_ID,
    email: 'jake@bettersignshop.com',
    name: 'Jake',
    avatar_url: null,
    created_at: nowIso()
  },
  {
    id: DEMO_USER_3_ID,
    email: 'michael@letterboxsigndesign.com',
    name: 'Michael',
    avatar_url: null,
    created_at: nowIso()
  }
];

const seedOrgMembers = (): OrgMember[] => [
  {
    org_id: DEMO_ORG_ID,
    user_id: DEMO_USER_ID,
    system_role: 'super_admin',
    created_at: nowIso()
  },
  {
    org_id: DEMO_ORG_ID,
    user_id: DEMO_USER_2_ID,
    system_role: 'member',
    created_at: nowIso()
  },
  {
    org_id: DEMO_ORG_ID,
    user_id: DEMO_USER_3_ID,
    system_role: 'super_admin',
    created_at: nowIso()
  }
];

const seedProjects = (): Project[] => [
  {
    id: DEMO_PROJECT_ID,
    org_id: DEMO_ORG_ID,
    name: 'Workbench MVP',
    description: 'Build the internal Basecamp/Workbench platform.',
    icon: '???',
    color: '#0f766e',
    created_by: DEMO_USER_ID,
    created_at: nowIso(),
    archived_at: null,
    settings: {
      default_view: 'list',
      allow_ai: true
    }
  }
];

const seedProjectMembers = (): ProjectMember[] => [
  {
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_ID,
    role: 'admin',
    invited_by: DEMO_USER_ID,
    joined_at: nowIso()
  },
  {
    project_id: DEMO_PROJECT_ID,
    user_id: DEMO_USER_2_ID,
    role: 'editor',
    invited_by: DEMO_USER_ID,
    joined_at: nowIso()
  }
];

const seedDocuments = (): Document[] => [
  {
    id: DEMO_DOC_ID,
    project_id: DEMO_PROJECT_ID,
    parent_document_id: null,
    title: 'Product Brief',
    created_by: DEMO_USER_ID,
    created_at: nowIso(),
    updated_at: nowIso(),
    sort_order: 0,
    is_archived: false,
    tags: ['planning', 'prd']
  },
  {
    id: DEMO_DOC_2_ID,
    project_id: DEMO_PROJECT_ID,
    parent_document_id: DEMO_DOC_ID,
    title: 'Sprint 1 Checklist',
    created_by: DEMO_USER_ID,
    created_at: nowIso(),
    updated_at: nowIso(),
    sort_order: 1,
    is_archived: false,
    tags: ['tasks']
  }
];

const seedDocumentContent = (): DocumentContent[] => [
  {
    document_id: DEMO_DOC_ID,
    yjs_state: null,
    last_snapshot: tiptapStarterDoc(
      'Workbench Product Brief',
      'Use this document to capture requirements, decisions, and scope changes.'
    ),
    updated_at: nowIso()
  },
  {
    document_id: DEMO_DOC_2_ID,
    yjs_state: null,
    last_snapshot: tiptapStarterDoc(
      'Sprint 1 Checklist',
      'Convert these items into task blocks or manage them from Task views.'
    ),
    updated_at: nowIso()
  }
];

const seedTasks = (): Task[] => [
  {
    id: DEMO_TASK_ID,
    project_id: DEMO_PROJECT_ID,
    source_document_id: DEMO_DOC_ID,
    source_block_id: 'block-1',
    title: 'Set up Supabase schema and RLS',
    description: 'Create baseline tables, indexes, and role policies.',
    status: 'in_progress',
    priority: 'high',
    assignee_id: DEMO_USER_ID,
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    tags: ['backend', 'security'],
    created_by: DEMO_USER_ID,
    created_at: nowIso(),
    updated_at: nowIso(),
    completed_at: null,
    is_detached: false
  },
  {
    id: DEMO_TASK_2_ID,
    project_id: DEMO_PROJECT_ID,
    source_document_id: DEMO_DOC_2_ID,
    source_block_id: 'block-2',
    title: 'Build Task List/Kanban/Calendar views',
    description: 'One task index rendered through three synchronized lenses.',
    status: 'todo',
    priority: 'medium',
    assignee_id: DEMO_USER_2_ID,
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    tags: ['frontend', 'tasks'],
    created_by: DEMO_USER_ID,
    created_at: nowIso(),
    updated_at: nowIso(),
    completed_at: null,
    is_detached: false
  },
  {
    id: DEMO_TASK_3_ID,
    project_id: DEMO_PROJECT_ID,
    source_document_id: null,
    source_block_id: null,
    title: 'Stand up AI chat endpoint',
    description: 'Expose /api/ai/chat with tool-action audit logging.',
    status: 'backlog',
    priority: 'urgent',
    assignee_id: DEMO_USER_ID,
    due_date: null,
    tags: ['ai', 'api'],
    created_by: DEMO_USER_ID,
    created_at: nowIso(),
    updated_at: nowIso(),
    completed_at: null,
    is_detached: false
  }
];

const seedComments = (): Comment[] => [
  {
    id: createId(),
    target_type: 'document',
    target_id: DEMO_DOC_ID,
    parent_comment_id: null,
    author_id: DEMO_USER_2_ID,
    body: '@michael the scope looks good; add explicit invite flow acceptance criteria.',
    created_at: nowIso(),
    resolved_at: null,
    metadata: null
  }
];

const seedNotifications = (): Notification[] => [
  {
    id: createId(),
    user_id: DEMO_USER_ID,
    type: 'task_assigned',
    title: 'You are assigned to "Set up Supabase schema and RLS"',
    body: 'Due in 2 days.',
    link: `/projects/${DEMO_PROJECT_ID}/tasks/list`,
    read_at: null,
    created_at: nowIso()
  }
];

const seedActivity = (): ActivityLog[] => [
  {
    id: createId(),
    org_id: DEMO_ORG_ID,
    project_id: DEMO_PROJECT_ID,
    actor_id: DEMO_USER_ID,
    actor_type: 'user',
    action: 'created',
    target_type: 'project',
    target_id: DEMO_PROJECT_ID,
    metadata: {
      name: 'Workbench MVP'
    },
    created_at: nowIso()
  }
];

const seedInvitations = (): Invitation[] => [];

const seedMagicLinks = (): MagicLink[] => [];

const seedProjectFiles = (): ProjectFile[] => [];

const seedOrgSubscriptions = (): OrgSubscription[] => {
  const now = new Date();
  const currentPeriodStart = now.toISOString();
  const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return [
    {
      id: createId(),
      org_id: DEMO_ORG_ID,
      plan_id: 'growth',
      status: 'active',
      billing_interval: 'monthly',
      seat_count: 10,
      trial_ends_at: null,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: false,
      canceled_at: null,
      metadata: {},
      created_at: nowIso(),
      updated_at: nowIso()
    }
  ];
};

const seedOrgUsageCounters = (): OrgUsageCounter[] => [
  {
    org_id: DEMO_ORG_ID,
    metric: 'upload_bytes',
    value: 0,
    updated_at: nowIso()
  }
];

const seedOrgInvoices = (): OrgInvoice[] => {
  const now = new Date();
  const periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const periodEnd = now.toISOString();

  return [
    {
      id: createId(),
      org_id: DEMO_ORG_ID,
      subscription_id: null,
      status: 'paid',
      amount_cents: 9900,
      currency: 'usd',
      due_at: null,
      paid_at: nowIso(),
      period_start: periodStart,
      period_end: periodEnd,
      metadata: { seed: true },
      created_at: nowIso(),
      updated_at: nowIso()
    }
  ];
};

const seedLocalAuthAccounts = (): LocalAuthAccount[] => [
  {
    user_id: DEMO_USER_ID,
    email: 'michael@bettersignshop.com',
    password_hash: hashPassword('workbench-demo', 'workbench-demo-user-one'),
    created_at: nowIso()
  },
  {
    user_id: DEMO_USER_2_ID,
    email: 'jake@bettersignshop.com',
    password_hash: hashPassword('workbench-demo', 'workbench-demo-user-two'),
    created_at: nowIso()
  },
  {
    user_id: DEMO_USER_3_ID,
    email: 'michael@letterboxsigndesign.com',
    password_hash: hashPassword('abc123!!', 'letterbox-super-admin-seed'),
    created_at: nowIso()
  }
];

const seedLocalAuthSessions = (): LocalAuthSession[] => [];

const createSeedStore = (): WorkbenchStore => ({
  organizations: seedOrganizations(),
  users: seedUsers(),
  org_members: seedOrgMembers(),
  projects: seedProjects(),
  project_members: seedProjectMembers(),
  documents: seedDocuments(),
  document_content: seedDocumentContent(),
  tasks: seedTasks(),
  project_files: seedProjectFiles(),
  comments: seedComments(),
  notifications: seedNotifications(),
  activity_log: seedActivity(),
  invitations: seedInvitations(),
  magic_links: seedMagicLinks(),
  org_subscriptions: seedOrgSubscriptions(),
  org_usage_counters: seedOrgUsageCounters(),
  org_invoices: seedOrgInvoices(),
  local_auth_accounts: seedLocalAuthAccounts(),
  local_auth_sessions: seedLocalAuthSessions()
});

declare global {
  // eslint-disable-next-line no-var
  var __workbenchStore: WorkbenchStore | undefined;
}

export const getStore = (): WorkbenchStore => {
  if (!globalThis.__workbenchStore) {
    globalThis.__workbenchStore = createSeedStore();
  }

  return globalThis.__workbenchStore;
};

export const getDefaultUserId = (): string => DEMO_USER_ID;
