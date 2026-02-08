import type {
  ActivityLog,
  BillingPlanId,
  BillingInterval,
  Comment,
  CommentTargetType,
  Document,
  DocumentContent,
  Invitation,
  InvoiceStatus,
  MagicLink,
  Notification,
  OrgInvoice,
  OrgSubscription,
  OrgUsageCounter,
  Organization,
  OrgMember,
  Project,
  ProjectMember,
  ProjectRole,
  SubscriptionStatus,
  SystemRole,
  Task,
  TaskPriority,
  TaskStatus,
  User
} from '~/types/domain';
import { getSupabaseServiceClient } from './supabase';
import { createId, nowIso } from './id';

// Type for Supabase errors
interface DbError {
  message: string;
  code?: string;
}

// Helper to throw if no client
const getClient = () => {
  const client = getSupabaseServiceClient();
  if (!client) {
    throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return client;
};

// ============================================================================
// ORGANIZATIONS
// ============================================================================

export const dbOrganizations = {
  async list(userId: string): Promise<Organization[]> {
    const client = getClient();
    const { data, error } = await client
      .from('organizations')
      .select('*, org_members!inner(user_id)')
      .eq('org_members.user_id', userId);

    if (error) throw new Error(error.message);
    return (data || []).map(({ org_members, ...org }) => org as Organization);
  },

  async get(id: string): Promise<Organization | null> {
    const client = getClient();
    const { data, error } = await client
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Organization | null;
  },

  async getBySlug(slug: string): Promise<Organization | null> {
    const client = getClient();
    const { data, error } = await client
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Organization | null;
  },

  async create(org: { name: string; slug: string }): Promise<Organization> {
    const client = getClient();
    const { data, error } = await client
      .from('organizations')
      .insert({
        id: createId(),
        name: org.name,
        slug: org.slug,
        created_at: nowIso()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Organization;
  },

  async update(id: string, updates: Partial<Pick<Organization, 'name' | 'slug'>>): Promise<Organization> {
    const client = getClient();
    const { data, error } = await client
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Organization;
  },

  async delete(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};

// ============================================================================
// USERS
// ============================================================================

export const dbUsers = {
  async get(id: string): Promise<User | null> {
    const client = getClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as User | null;
  },

  async getByEmail(email: string): Promise<User | null> {
    const client = getClient();
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as User | null;
  },

  async create(user: { id: string; email: string; name: string; avatar_url?: string | null }): Promise<User> {
    const client = getClient();
    const { data, error } = await client
      .from('users')
      .insert({
        id: user.id,
        email: user.email.toLowerCase(),
        name: user.name,
        avatar_url: user.avatar_url || null,
        created_at: nowIso()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  },

  async update(id: string, updates: Partial<Pick<User, 'name' | 'avatar_url'>>): Promise<User> {
    const client = getClient();
    const { data, error } = await client
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as User;
  },

  async listByOrg(orgId: string): Promise<User[]> {
    const client = getClient();
    const { data, error } = await client
      .from('users')
      .select('*, org_members!inner(org_id)')
      .eq('org_members.org_id', orgId);

    if (error) throw new Error(error.message);
    return (data || []).map(({ org_members, ...user }) => user as User);
  }
};

// ============================================================================
// ORG MEMBERS
// ============================================================================

export const dbOrgMembers = {
  async list(orgId: string): Promise<(OrgMember & { user: User })[]> {
    const client = getClient();
    const { data, error } = await client
      .from('org_members')
      .select('*, user:users(*)')
      .eq('org_id', orgId);

    if (error) throw new Error(error.message);
    return (data || []) as (OrgMember & { user: User })[];
  },

  async get(orgId: string, userId: string): Promise<OrgMember | null> {
    const client = getClient();
    const { data, error } = await client
      .from('org_members')
      .select('*')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as OrgMember | null;
  },

  async getUserOrgs(userId: string): Promise<(OrgMember & { organization: Organization })[]> {
    const client = getClient();
    const { data, error } = await client
      .from('org_members')
      .select('*, organization:organizations(*)')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return (data || []) as (OrgMember & { organization: Organization })[];
  },

  async create(member: { org_id: string; user_id: string; system_role: SystemRole }): Promise<OrgMember> {
    const client = getClient();
    const { data, error } = await client
      .from('org_members')
      .insert({
        org_id: member.org_id,
        user_id: member.user_id,
        system_role: member.system_role,
        created_at: nowIso()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as OrgMember;
  },

  async updateRole(orgId: string, userId: string, systemRole: SystemRole): Promise<OrgMember> {
    const client = getClient();
    const { data, error } = await client
      .from('org_members')
      .update({ system_role: systemRole })
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as OrgMember;
  },

  async delete(orgId: string, userId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('org_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }
};

// ============================================================================
// PROJECTS
// ============================================================================

export const dbProjects = {
  async list(orgId: string, includeArchived = false): Promise<Project[]> {
    const client = getClient();
    let query = client
      .from('projects')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (!includeArchived) {
      query = query.is('archived_at', null);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Project[];
  },

  async listForUser(userId: string, orgId?: string): Promise<Project[]> {
    const client = getClient();

    // Get projects where user is a member
    let query = client
      .from('projects')
      .select('*, project_members!inner(user_id)')
      .eq('project_members.user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(({ project_members, ...project }) => project as Project);
  },

  async get(id: string): Promise<Project | null> {
    const client = getClient();
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Project | null;
  },

  async create(project: {
    org_id: string;
    name: string;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
    created_by: string;
    settings?: Record<string, unknown>;
  }): Promise<Project> {
    const client = getClient();
    const { data, error } = await client
      .from('projects')
      .insert({
        id: createId(),
        org_id: project.org_id,
        name: project.name,
        description: project.description || null,
        icon: project.icon || null,
        color: project.color || null,
        created_by: project.created_by,
        created_at: nowIso(),
        archived_at: null,
        settings: project.settings || { default_view: 'list', allow_ai: true }
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Project;
  },

  async update(id: string, updates: Partial<Pick<Project, 'name' | 'description' | 'icon' | 'color' | 'settings' | 'archived_at'>>): Promise<Project> {
    const client = getClient();
    const { data, error } = await client
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Project;
  },

  async archive(id: string): Promise<Project> {
    return this.update(id, { archived_at: nowIso() });
  },

  async delete(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async getStats(id: string): Promise<{ open_tasks: number; document_count: number }> {
    const client = getClient();

    const [tasksResult, docsResult] = await Promise.all([
      client
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', id)
        .not('status', 'in', '("done","cancelled")'),
      client
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', id)
        .eq('is_archived', false)
    ]);

    return {
      open_tasks: tasksResult.count || 0,
      document_count: docsResult.count || 0
    };
  }
};

// ============================================================================
// PROJECT MEMBERS
// ============================================================================

export const dbProjectMembers = {
  async list(projectId: string): Promise<(ProjectMember & { user: User })[]> {
    const client = getClient();
    const { data, error } = await client
      .from('project_members')
      // project_members has two FKs to users (user_id, invited_by), so the join must be explicit.
      .select('*, user:users!project_members_user_id_fkey(*)')
      .eq('project_id', projectId);

    if (error) throw new Error(error.message);
    return (data || []) as (ProjectMember & { user: User })[];
  },

  async get(projectId: string, userId: string): Promise<ProjectMember | null> {
    const client = getClient();
    const { data, error } = await client
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as ProjectMember | null;
  },

  async create(member: {
    project_id: string;
    user_id: string;
    role: ProjectRole;
    invited_by?: string | null;
  }): Promise<ProjectMember> {
    const client = getClient();
    const { data, error } = await client
      .from('project_members')
      .insert({
        project_id: member.project_id,
        user_id: member.user_id,
        role: member.role,
        invited_by: member.invited_by || null,
        joined_at: nowIso()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProjectMember;
  },

  async updateRole(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
    const client = getClient();
    const { data, error } = await client
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ProjectMember;
  },

  async delete(projectId: string, userId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  },

  async countAdmins(projectId: string): Promise<number> {
    const client = getClient();
    const { count, error } = await client
      .from('project_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('role', 'admin');

    if (error) throw new Error(error.message);
    return count || 0;
  }
};

// ============================================================================
// DOCUMENTS
// ============================================================================

export const dbDocuments = {
  async list(projectId: string, includeArchived = false): Promise<Document[]> {
    const client = getClient();
    let query = client
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Document[];
  },

  async get(id: string): Promise<Document | null> {
    const client = getClient();
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Document | null;
  },

  async create(doc: {
    project_id: string;
    title: string;
    parent_document_id?: string | null;
    created_by: string;
    tags?: string[];
    sort_order?: number;
  }): Promise<Document> {
    const client = getClient();
    const now = nowIso();
    const docId = createId();

    const { data, error } = await client
      .from('documents')
      .insert({
        id: docId,
        project_id: doc.project_id,
        parent_document_id: doc.parent_document_id || null,
        title: doc.title,
        created_by: doc.created_by,
        created_at: now,
        updated_at: now,
        sort_order: doc.sort_order ?? 0,
        is_archived: false,
        tags: doc.tags || []
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Also create empty document content
    await client
      .from('document_content')
      .insert({
        document_id: docId,
        yjs_state: null,
        last_snapshot: { type: 'doc', content: [] },
        updated_at: now
      });

    return data as Document;
  },

  async update(id: string, updates: Partial<Pick<Document, 'title' | 'parent_document_id' | 'sort_order' | 'is_archived' | 'tags'>>): Promise<Document> {
    const client = getClient();
    const { data, error } = await client
      .from('documents')
      .update({ ...updates, updated_at: nowIso() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Document;
  },

  async delete(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async getChildren(parentId: string): Promise<Document[]> {
    const client = getClient();
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('parent_document_id', parentId)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Document[];
  }
};

// ============================================================================
// DOCUMENT CONTENT
// ============================================================================

export const dbDocumentContent = {
  async get(documentId: string): Promise<DocumentContent | null> {
    const client = getClient();
    const { data, error } = await client
      .from('document_content')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as DocumentContent | null;
  },

  async upsert(content: {
    document_id: string;
    yjs_state?: string | null;
    last_snapshot?: Record<string, unknown>;
  }): Promise<DocumentContent> {
    const client = getClient();
    const { data, error } = await client
      .from('document_content')
      .upsert({
        document_id: content.document_id,
        yjs_state: content.yjs_state,
        last_snapshot: content.last_snapshot,
        updated_at: nowIso()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as DocumentContent;
  }
};

// ============================================================================
// TASKS
// ============================================================================

export const dbTasks = {
  async list(projectId: string, filters?: {
    status?: TaskStatus | TaskStatus[];
    priority?: TaskPriority | TaskPriority[];
    assignee_id?: string | null;
    due_date_before?: string;
    due_date_after?: string;
    tags?: string[];
    q?: string;
  }): Promise<Task[]> {
    const client = getClient();
    let query = client
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority);
        } else {
          query = query.eq('priority', filters.priority);
        }
      }

      if (filters.assignee_id !== undefined) {
        if (filters.assignee_id === null) {
          query = query.is('assignee_id', null);
        } else {
          query = query.eq('assignee_id', filters.assignee_id);
        }
      }

      if (filters.due_date_before) {
        query = query.lte('due_date', filters.due_date_before);
      }

      if (filters.due_date_after) {
        query = query.gte('due_date', filters.due_date_after);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.q) {
        query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Task[];
  },

  async get(id: string): Promise<Task | null> {
    const client = getClient();
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Task | null;
  },

  async create(task: {
    project_id: string;
    title: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    assignee_id?: string | null;
    due_date?: string | null;
    tags?: string[];
    source_document_id?: string | null;
    source_block_id?: string | null;
    created_by: string;
  }): Promise<Task> {
    const client = getClient();
    const now = nowIso();
    const { data, error } = await client
      .from('tasks')
      .insert({
        id: createId(),
        project_id: task.project_id,
        source_document_id: task.source_document_id || null,
        source_block_id: task.source_block_id || null,
        title: task.title,
        description: task.description || null,
        status: task.status || 'todo',
        priority: task.priority || 'none',
        assignee_id: task.assignee_id || null,
        due_date: task.due_date || null,
        tags: task.tags || [],
        created_by: task.created_by,
        created_at: now,
        updated_at: now,
        completed_at: null,
        is_detached: false
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Task;
  },

  async update(id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assignee_id' | 'due_date' | 'tags' | 'is_detached' | 'completed_at'>>): Promise<Task> {
    const client = getClient();

    // Auto-set completed_at when status changes to done
    if (updates.status === 'done' && !updates.completed_at) {
      updates.completed_at = nowIso();
    } else if (updates.status && updates.status !== 'done') {
      updates.completed_at = null;
    }

    const { data, error } = await client
      .from('tasks')
      .update({ ...updates, updated_at: nowIso() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Task;
  },

  async delete(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async bulkUpdate(ids: string[], updates: Partial<Pick<Task, 'status' | 'priority' | 'assignee_id'>>): Promise<Task[]> {
    const client = getClient();
    const { data, error } = await client
      .from('tasks')
      .update({ ...updates, updated_at: nowIso() })
      .in('id', ids)
      .select();

    if (error) throw new Error(error.message);
    return (data || []) as Task[];
  }
};

// ============================================================================
// COMMENTS
// ============================================================================

export const dbComments = {
  async list(targetType: CommentTargetType, targetId: string): Promise<(Comment & { author?: User })[]> {
    const client = getClient();
    const { data, error } = await client
      .from('comments')
      .select('*, author:users(*)')
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as (Comment & { author?: User })[];
  },

  async get(id: string): Promise<Comment | null> {
    const client = getClient();
    const { data, error } = await client
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Comment | null;
  },

  async create(comment: {
    target_type: CommentTargetType;
    target_id: string;
    parent_comment_id?: string | null;
    author_id: string;
    body: string;
    metadata?: any;
  }): Promise<Comment> {
    const client = getClient();
    const { data, error } = await client
      .from('comments')
      .insert({
        id: createId(),
        target_type: comment.target_type,
        target_id: comment.target_id,
        parent_comment_id: comment.parent_comment_id || null,
        author_id: comment.author_id,
        body: comment.body,
        created_at: nowIso(),
        resolved_at: null,
        metadata: comment.metadata || null
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Comment;
  },

  async update(id: string, updates: Partial<Pick<Comment, 'body' | 'resolved_at' | 'metadata'>>): Promise<Comment> {
    const client = getClient();
    const { data, error } = await client
      .from('comments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Comment;
  },

  async delete(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('comments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async resolve(id: string): Promise<Comment> {
    return this.update(id, { resolved_at: nowIso() });
  }
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const dbNotifications = {
  async list(userId: string, unreadOnly = false): Promise<Notification[]> {
    const client = getClient();
    let query = client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as Notification[];
  },

  async get(id: string): Promise<Notification | null> {
    const client = getClient();
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Notification | null;
  },

  async create(notification: {
    user_id: string;
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
  }): Promise<Notification> {
    const client = getClient();
    const { data, error } = await client
      .from('notifications')
      .insert({
        id: createId(),
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        body: notification.body || null,
        link: notification.link || null,
        read_at: null,
        created_at: nowIso()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Notification;
  },

  async markRead(id: string): Promise<Notification> {
    const client = getClient();
    const { data, error } = await client
      .from('notifications')
      .update({ read_at: nowIso() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Notification;
  },

  async markAllRead(userId: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('notifications')
      .update({ read_at: nowIso() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw new Error(error.message);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const client = getClient();
    const { count, error } = await client
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw new Error(error.message);
    return count || 0;
  }
};

// ============================================================================
// ACTIVITY LOG
// ============================================================================

export const dbActivity = {
  async list(options: {
    org_id?: string;
    project_id?: string;
    actor_id?: string;
    action?: string;
    target_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<(ActivityLog & { actor?: User })[]> {
    const client = getClient();
    let query = client
      .from('activity_log')
      .select('*, actor:users(*)')
      .order('created_at', { ascending: false })
      .limit(options.limit || 50);

    if (options.org_id) {
      query = query.eq('org_id', options.org_id);
    }
    if (options.project_id) {
      query = query.eq('project_id', options.project_id);
    }
    if (options.actor_id) {
      query = query.eq('actor_id', options.actor_id);
    }
    if (options.action) {
      query = query.eq('action', options.action);
    }
    if (options.target_type) {
      query = query.eq('target_type', options.target_type);
    }
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []) as (ActivityLog & { actor?: User })[];
  },

  async log(entry: {
    org_id: string;
    project_id?: string | null;
    actor_id?: string | null;
    actor_type: 'user' | 'ai' | 'system';
    action: string;
    target_type: string;
    target_id: string;
    metadata?: Record<string, unknown>;
  }): Promise<ActivityLog> {
    const client = getClient();
    const { data, error } = await client
      .from('activity_log')
      .insert({
        id: createId(),
        org_id: entry.org_id,
        project_id: entry.project_id || null,
        actor_id: entry.actor_id || null,
        actor_type: entry.actor_type,
        action: entry.action,
        target_type: entry.target_type,
        target_id: entry.target_id,
        metadata: entry.metadata || {},
        created_at: nowIso()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ActivityLog;
  }
};

// ============================================================================
// INVITATIONS
// ============================================================================

export const dbInvitations = {
  async list(projectId: string): Promise<Invitation[]> {
    const client = getClient();
    const { data, error } = await client
      .from('invitations')
      .select('*')
      .eq('project_id', projectId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Invitation[];
  },

  async listByOrg(orgId: string): Promise<Invitation[]> {
    const client = getClient();
    const { data, error } = await client
      .from('invitations')
      .select('*')
      .eq('org_id', orgId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Invitation[];
  },

  async getByEmail(email: string): Promise<Invitation[]> {
    const client = getClient();
    const { data, error } = await client
      .from('invitations')
      .select('*')
      .eq('email', email.toLowerCase())
      .is('accepted_at', null);

    if (error) throw new Error(error.message);
    return (data || []) as Invitation[];
  },

  async getPendingByProjectAndEmail(projectId: string, email: string): Promise<Invitation | null> {
    const client = getClient();
    const { data, error } = await client
      .from('invitations')
      .select('*')
      .eq('project_id', projectId)
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Invitation | null;
  },

  async get(id: string): Promise<Invitation | null> {
    const client = getClient();
    const { data, error } = await client
      .from('invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Invitation | null;
  },

  async create(invitation: {
    org_id: string;
    project_id: string;
    email: string;
    role: ProjectRole;
    invited_by: string;
  }): Promise<Invitation> {
    const client = getClient();
    const { data, error } = await client
      .from('invitations')
      .insert({
        id: createId(),
        org_id: invitation.org_id,
        project_id: invitation.project_id,
        email: invitation.email.toLowerCase(),
        role: invitation.role,
        invited_by: invitation.invited_by,
        created_at: nowIso(),
        accepted_at: null
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Invitation;
  },

  async accept(id: string): Promise<Invitation> {
    const client = getClient();
    const { data, error } = await client
      .from('invitations')
      .update({ accepted_at: nowIso() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Invitation;
  },

  async delete(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client
      .from('invitations')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};

// ============================================================================
// MAGIC LINKS
// ============================================================================

export const dbMagicLinks = {
  async create(link: {
    token: string;
    org_id: string;
    email: string;
    system_role: SystemRole;
    invited_by: string;
    expires_at: string;
  }): Promise<MagicLink> {
    const client = getClient();
    const { data, error } = await client
      .from('magic_links')
      .insert({
        id: createId(),
        token: link.token,
        org_id: link.org_id,
        email: link.email.toLowerCase().trim(),
        system_role: link.system_role,
        invited_by: link.invited_by,
        created_at: nowIso(),
        expires_at: link.expires_at,
        redeemed_at: null,
        redeemed_by: null
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as MagicLink;
  },

  async getByToken(token: string): Promise<MagicLink | null> {
    const client = getClient();
    const { data, error } = await client
      .from('magic_links')
      .select('*')
      .eq('token', token)
      .is('redeemed_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as MagicLink | null;
  },

  async redeem(id: string, userId: string): Promise<MagicLink> {
    const client = getClient();
    const { data, error } = await client
      .from('magic_links')
      .update({
        redeemed_at: nowIso(),
        redeemed_by: userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as MagicLink;
  },

  async listByOrg(orgId: string): Promise<MagicLink[]> {
    const client = getClient();
    const { data, error } = await client
      .from('magic_links')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as MagicLink[];
  }
};

// ============================================================================
// BILLING
// ============================================================================

export const dbBillingSubscriptions = {
  async get(id: string): Promise<OrgSubscription | null> {
    const client = getClient();
    const { data, error } = await client
      .from('org_subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as OrgSubscription | null;
  },

  async listByOrg(orgId: string): Promise<OrgSubscription[]> {
    const client = getClient();
    const { data, error } = await client
      .from('org_subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as OrgSubscription[];
  },

  async getActiveForOrg(orgId: string): Promise<OrgSubscription | null> {
    const client = getClient();
    const { data, error } = await client
      .from('org_subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .neq('status', 'canceled')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) throw new Error(error.message);
    return ((data || [])[0] as OrgSubscription | undefined) || null;
  },

  async create(subscription: {
    org_id: string;
    plan_id: BillingPlanId;
    status: SubscriptionStatus;
    billing_interval: BillingInterval;
    seat_count: number;
    trial_ends_at?: string | null;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end?: boolean;
    canceled_at?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<OrgSubscription> {
    const client = getClient();
    const { data, error } = await client
      .from('org_subscriptions')
      .insert({
        id: createId(),
        org_id: subscription.org_id,
        plan_id: subscription.plan_id,
        status: subscription.status,
        billing_interval: subscription.billing_interval,
        seat_count: subscription.seat_count,
        trial_ends_at: subscription.trial_ends_at || null,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        canceled_at: subscription.canceled_at || null,
        metadata: subscription.metadata || {},
        created_at: nowIso(),
        updated_at: nowIso()
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as OrgSubscription;
  },

  async update(
    id: string,
    updates: Partial<
      Pick<
        OrgSubscription,
        | 'plan_id'
        | 'status'
        | 'billing_interval'
        | 'seat_count'
        | 'trial_ends_at'
        | 'current_period_start'
        | 'current_period_end'
        | 'cancel_at_period_end'
        | 'canceled_at'
        | 'metadata'
      >
    >
  ): Promise<OrgSubscription> {
    const client = getClient();
    const { data, error } = await client
      .from('org_subscriptions')
      .update({
        ...updates,
        updated_at: nowIso()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as OrgSubscription;
  }
};

export const dbBillingUsage = {
  async get(orgId: string, metric: string): Promise<OrgUsageCounter | null> {
    const client = getClient();
    const { data, error } = await client
      .from('org_usage_counters')
      .select('*')
      .eq('org_id', orgId)
      .eq('metric', metric)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as OrgUsageCounter | null;
  },

  async listByOrg(orgId: string): Promise<OrgUsageCounter[]> {
    const client = getClient();
    const { data, error } = await client
      .from('org_usage_counters')
      .select('*')
      .eq('org_id', orgId)
      .order('metric', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as OrgUsageCounter[];
  },

  async upsert(orgId: string, metric: string, value: number): Promise<OrgUsageCounter> {
    const client = getClient();
    const payload = {
      org_id: orgId,
      metric,
      value,
      updated_at: nowIso()
    };

    const { data, error } = await client
      .from('org_usage_counters')
      .upsert(payload, { onConflict: 'org_id,metric' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as OrgUsageCounter;
  },

  async increment(orgId: string, metric: string, delta: number): Promise<OrgUsageCounter> {
    const existing = await this.get(orgId, metric);
    const nextValue = Math.max(0, Number(existing?.value || 0) + delta);
    return this.upsert(orgId, metric, nextValue);
  }
};

export const dbBillingInvoices = {
  async get(id: string): Promise<OrgInvoice | null> {
    const client = getClient();
    const { data, error } = await client
      .from('org_invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as OrgInvoice | null;
  },

  async listByOrg(orgId: string): Promise<OrgInvoice[]> {
    const client = getClient();
    const { data, error } = await client
      .from('org_invoices')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as OrgInvoice[];
  },

  async create(invoice: {
    org_id: string;
    subscription_id?: string | null;
    status: InvoiceStatus;
    amount_cents: number;
    currency?: string;
    due_at?: string | null;
    paid_at?: string | null;
    period_start: string;
    period_end: string;
    metadata?: Record<string, unknown>;
  }): Promise<OrgInvoice> {
    const client = getClient();
    const { data, error } = await client
      .from('org_invoices')
      .insert({
        id: createId(),
        org_id: invoice.org_id,
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
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as OrgInvoice;
  },

  async update(
    id: string,
    updates: Partial<Pick<OrgInvoice, 'status' | 'due_at' | 'paid_at' | 'metadata'>>
  ): Promise<OrgInvoice> {
    const client = getClient();
    const { data, error } = await client
      .from('org_invoices')
      .update({
        ...updates,
        updated_at: nowIso()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as OrgInvoice;
  }
};

// ============================================================================
// SEARCH
// ============================================================================

export const dbSearch = {
  async search(query: string, options: {
    org_id?: string;
    project_id?: string;
    types?: ('documents' | 'tasks' | 'comments')[];
    limit?: number;
  }): Promise<{
    documents: Document[];
    tasks: Task[];
    comments: Comment[];
  }> {
    const client = getClient();
    const types = options.types || ['documents', 'tasks', 'comments'];
    const limit = options.limit || 20;

    const results = {
      documents: [] as Document[],
      tasks: [] as Task[],
      comments: [] as Comment[]
    };

    const searches: Promise<void>[] = [];

    if (types.includes('documents')) {
      searches.push(
        (async () => {
          let q = client
            .from('documents')
            .select('*')
            .ilike('title', `%${query}%`)
            .eq('is_archived', false)
            .limit(limit);

          if (options.project_id) {
            q = q.eq('project_id', options.project_id);
          }

          const { data, error } = await q;
          if (!error) results.documents = (data || []) as Document[];
        })()
      );
    }

    if (types.includes('tasks')) {
      searches.push(
        (async () => {
          let q = client
            .from('tasks')
            .select('*')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .limit(limit);

          if (options.project_id) {
            q = q.eq('project_id', options.project_id);
          }

          const { data, error } = await q;
          if (!error) results.tasks = (data || []) as Task[];
        })()
      );
    }

    if (types.includes('comments')) {
      searches.push(
        (async () => {
          const { data, error } = await client
            .from('comments')
            .select('*')
            .ilike('body', `%${query}%`)
            .limit(limit);

          if (!error) results.comments = (data || []) as Comment[];
        })()
      );
    }

    await Promise.all(searches);
    return results;
  }
};

// ============================================================================
// ADMIN STATS
// ============================================================================

export const dbAdminStats = {
  async getOrgStats(orgId: string): Promise<{
    user_count: number;
    project_count: number;
    task_count: number;
    document_count: number;
  }> {
    const client = getClient();

    const [users, projects, tasks, docs] = await Promise.all([
      client
        .from('org_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('org_id', orgId),
      client
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .is('archived_at', null),
      client
        .from('tasks')
        .select('id, projects!inner(org_id)', { count: 'exact', head: true })
        .eq('projects.org_id', orgId),
      client
        .from('documents')
        .select('id, projects!inner(org_id)', { count: 'exact', head: true })
        .eq('projects.org_id', orgId)
        .eq('is_archived', false)
    ]);

    return {
      user_count: users.count || 0,
      project_count: projects.count || 0,
      task_count: tasks.count || 0,
      document_count: docs.count || 0
    };
  }
};

// ============================================================================
// EXPORT UNIFIED DB OBJECT
// ============================================================================

export const db = {
  organizations: dbOrganizations,
  users: dbUsers,
  orgMembers: dbOrgMembers,
  projects: dbProjects,
  projectMembers: dbProjectMembers,
  documents: dbDocuments,
  documentContent: dbDocumentContent,
  tasks: dbTasks,
  comments: dbComments,
  notifications: dbNotifications,
  activity: dbActivity,
  invitations: dbInvitations,
  magicLinks: dbMagicLinks,
  billingSubscriptions: dbBillingSubscriptions,
  billingUsage: dbBillingUsage,
  billingInvoices: dbBillingInvoices,
  search: dbSearch,
  adminStats: dbAdminStats
};
