export type SystemRole = 'super_admin' | 'member';
export type ProjectRole = 'admin' | 'editor' | 'viewer';

export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'done'
  | 'cancelled';

export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export type CommentTargetType = 'document' | 'task' | 'block';
export type BillingPlanId = 'starter' | 'growth' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled';
export type BillingInterval = 'monthly' | 'annual';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  created_at: string;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  system_role: SystemRole;
  created_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  created_by: string;
  created_at: string;
  archived_at?: string | null;
  settings: Record<string, unknown>;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: ProjectRole;
  invited_by?: string | null;
  joined_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  parent_document_id?: string | null;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  sort_order: number;
  is_archived: boolean;
  tags: string[];
}

export interface DocumentContent {
  document_id: string;
  yjs_state?: string | null;
  last_snapshot: Record<string, unknown>;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  source_document_id?: string | null;
  source_block_id?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string | null;
  due_date?: string | null;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  is_detached: boolean;
}

export type FileAttachmentType = 'project' | 'document' | 'task';

export interface ProjectFile {
  id: string;
  project_id: string;
  attachment_type: FileAttachmentType;
  attachment_id?: string | null;
  filename: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  url: string;
  uploaded_by: string;
  created_at: string;
  description?: string | null;
}

export interface Comment {
  id: string;
  target_type: CommentTargetType;
  target_id: string;
  parent_comment_id?: string | null;
  author_id: string;
  body: string;
  created_at: string;
  resolved_at?: string | null;
  metadata?: CommentMetadata | null;
}

export interface CommentMetadata {
  anchor?: {
    from: number;
    to: number;
    text: string;
    blockId?: string;
  };
  converted_to_task_id?: string;
  mentioned_user_ids?: string[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  org_id: string;
  project_id?: string | null;
  actor_id?: string | null;
  actor_type: 'user' | 'ai' | 'system';
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Invitation {
  id: string;
  org_id: string;
  project_id: string;
  email: string;
  role: ProjectRole;
  invited_by: string;
  created_at: string;
  accepted_at?: string | null;
}

export interface MagicLink {
  id: string;
  token: string;
  org_id: string;
  email: string;
  system_role: SystemRole;
  invited_by: string;
  created_at: string;
  expires_at: string;
  redeemed_at?: string | null;
  redeemed_by?: string | null;
}

export interface OrgSubscription {
  id: string;
  org_id: string;
  plan_id: BillingPlanId;
  status: SubscriptionStatus;
  billing_interval: BillingInterval;
  seat_count: number;
  trial_ends_at?: string | null;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface OrgUsageCounter {
  org_id: string;
  metric: string;
  value: number;
  updated_at: string;
}

export interface OrgInvoice {
  id: string;
  org_id: string;
  subscription_id?: string | null;
  status: InvoiceStatus;
  amount_cents: number;
  currency: string;
  due_at?: string | null;
  paid_at?: string | null;
  period_start: string;
  period_end: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkbenchStore {
  organizations: Organization[];
  users: User[];
  org_members: OrgMember[];
  projects: Project[];
  project_members: ProjectMember[];
  documents: Document[];
  document_content: DocumentContent[];
  tasks: Task[];
  project_files: ProjectFile[];
  comments: Comment[];
  notifications: Notification[];
  activity_log: ActivityLog[];
  invitations: Invitation[];
  magic_links: MagicLink[];
  org_subscriptions: OrgSubscription[];
  org_usage_counters: OrgUsageCounter[];
  org_invoices: OrgInvoice[];
  local_auth_accounts: LocalAuthAccount[];
  local_auth_sessions: LocalAuthSession[];
}

export interface LocalAuthAccount {
  user_id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface LocalAuthSession {
  token: string;
  user_id: string;
  active_org_id: string | null;
  created_at: string;
  expires_at: string;
}

export type ExportFormat = 'pdf' | 'docx' | 'markdown';

export type ExportTemplate = 'default' | 'minimal' | 'professional' | 'modern';

export interface ExportOptions {
  includeComments?: boolean;
  includeImages?: boolean;
  paperSize?: 'A4' | 'Letter';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  headerFooter?: boolean;
  template?: ExportTemplate;
}
