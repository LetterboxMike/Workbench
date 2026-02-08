<script setup lang="ts">
const api = useWorkbenchApi();
const loading = ref(true);
const session = ref<{
  user: {
    id: string;
    email: string;
    display_name?: string | null;
  };
  active_org_id: string | null;
  organizations: Array<{
    id: string;
    name: string;
    system_role: string;
  }>;
} | null>(null);
const members = ref<
  Array<{
    id: string;
    user_id: string;
    org_id: string;
    system_role: string;
    joined_at: string;
    user: {
      id: string;
      email: string;
      display_name?: string | null;
    } | null;
  }>
>([]);

// Modal composables
const inviteModal = useInviteModal();
const editModal = useEditMemberModal();
const deleteModal = useDeleteMemberModal();

const activeOrg = computed(() =>
  session.value?.organizations.find(org => org.id === session.value?.active_org_id)
);

const currentUserId = computed(() => session.value?.user.id || null);
const activeOrgRole = computed(() =>
  session.value?.organizations.find((org) => org.id === session.value?.active_org_id)?.system_role || null
);
const isSuperAdmin = computed(() => activeOrgRole.value === 'super_admin');

const canEdit = (member: any) => {
  return isSuperAdmin.value && member.user_id !== currentUserId.value;
};

const canDelete = (member: any) => {
  return isSuperAdmin.value && member.user_id !== currentUserId.value;
};

const load = async () => {
  loading.value = true;

  try {
    // Get current session and active org
    const sessionResponse = await api.get<{ data: typeof session.value }>('/api/auth/session');
    session.value = sessionResponse.data;

    // If there's an active org, fetch its members
    if (session.value?.active_org_id) {
      const membersResponse = await api.get<{ data: typeof members.value }>(
        `/api/orgs/${session.value.active_org_id}/members`
      );
      members.value = membersResponse.data;
    }
  } finally {
    loading.value = false;
  }
};

const handleInvite = () => {
  if (session.value?.active_org_id) {
    inviteModal.open();
  }
};

const handleEdit = (member: any) => {
  editModal.open(member);
};

const handleDelete = (member: any) => {
  deleteModal.open(member);
};

const handleInvited = async () => {
  await load();
};

const handleUpdated = async () => {
  await load();
};

const handleDeleted = async () => {
  await load();
};

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'super_admin':
      return 'role-badge--admin';
    case 'admin':
      return 'role-badge--admin';
    case 'member':
      return 'role-badge--member';
    default:
      return 'role-badge--member';
  }
};

const formatRole = (role: string) => {
  return role.replace('_', ' ');
};

onMounted(load);
</script>

<template>
  <section>
    <header>
      <div>
        <h1>Users</h1>
        <p v-if="activeOrg">Members of {{ activeOrg.name }}</p>
        <p v-else>Organization members and permissions.</p>
      </div>

      <div class="header-actions">
        <PrimaryButton
          v-if="isSuperAdmin"
          label="Invite User"
          @click="handleInvite"
        />
        <span>{{ members.length }} {{ members.length === 1 ? 'member' : 'members' }}</span>
      </div>
    </header>

    <p v-if="loading">Loading users...</p>

    <section v-else-if="!session?.active_org_id" class="empty-state">
      <p>No active organization selected.</p>
    </section>

    <section v-else class="users-list">
      <article v-for="member in members" :key="member.id" class="user-card">
        <div class="user-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>

        <div class="user-info">
          <h2>{{ member.user?.display_name || member.user?.email || 'Unknown User' }}</h2>
          <p class="user-email">{{ member.user?.email }}</p>
          <p class="user-joined">Joined {{ new Date(member.joined_at).toLocaleDateString() }}</p>
        </div>

        <div class="user-meta">
          <span class="role-badge" :class="getRoleBadgeClass(member.system_role)">
            {{ formatRole(member.system_role) }}
          </span>
          <span v-if="member.user_id === session?.user.id" class="you-badge">You</span>
        </div>

        <div v-if="canEdit(member) || canDelete(member)" class="user-actions">
          <button
            v-if="canEdit(member)"
            type="button"
            class="action-btn"
            @click="handleEdit(member)"
          >
            Edit
          </button>
          <button
            v-if="canDelete(member)"
            type="button"
            class="action-btn danger"
            @click="handleDelete(member)"
          >
            Remove
          </button>
        </div>
      </article>

      <p v-if="members.length === 0" class="empty-message">
        No members found in this organization.
      </p>
    </section>

    <!-- Modals -->
    <InviteUserModal
      :open="inviteModal.isOpen.value"
      :org-id="session?.active_org_id || ''"
      @close="inviteModal.close"
      @invited="handleInvited"
    />

    <EditMemberModal
      :open="editModal.isOpen.value"
      :org-id="session?.active_org_id || ''"
      :member="editModal.member.value"
      @close="editModal.close"
      @updated="handleUpdated"
    />

    <DeleteMemberModal
      :open="deleteModal.isOpen.value"
      :org-id="session?.active_org_id || ''"
      :member="deleteModal.member.value"
      @close="deleteModal.close"
      @deleted="handleDeleted"
    />
  </section>
</template>

<style scoped>
section {
  max-width: var(--content-max-width);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

header h1 {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

header > div:first-child p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
}

header > div:last-child span {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

section > p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-12) 0;
}

.empty-state p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.users-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.user-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-surface);
  transition: border-color var(--transition-fast);
}

.user-card:hover {
  border-color: var(--color-border-strong);
}

.user-avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.user-avatar svg {
  width: 24px;
  height: 24px;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.user-info h2 {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-joined {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}

.user-meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-badge--admin {
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.role-badge--member {
  background: var(--color-bg-surface);
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
}

.empty-message {
  grid-column: 1 / -1;
  text-align: center;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

.you-badge {
  display: inline-flex;
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-hover);
  border-radius: var(--radius-xs);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.user-actions {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 72px;
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.action-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.action-btn.danger {
  color: var(--color-text-secondary);
  border-color: var(--color-border-strong);
}

.action-btn.danger:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}
</style>

