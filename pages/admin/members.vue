<script setup lang="ts">
definePageMeta({
  middleware: ['admin']
});

interface User {
  id: string;
  email: string;
  display_name?: string | null;
}

interface OrgMember {
  id: string;
  user_id: string;
  org_id: string;
  system_role: 'super_admin' | 'member';
  joined_at: string;
  user: User | null;
}

interface Session {
  user: User;
  active_org_id: string | null;
  organizations: Array<{
    id: string;
    name: string;
    system_role: string;
  }>;
}

const api = useWorkbenchApi();
const loading = ref(true);
const updating = ref<string | null>(null);
const error = ref<string | null>(null);
const searchQuery = ref('');

const session = ref<Session | null>(null);
const members = ref<OrgMember[]>([]);

const activeOrg = computed(() =>
  session.value?.organizations.find((org) => org.id === session.value?.active_org_id)
);

const filteredMembers = computed(() => {
  if (!searchQuery.value.trim()) {
    return members.value;
  }

  const query = searchQuery.value.toLowerCase().trim();

  return members.value.filter((member) => {
    const name = member.user?.display_name?.toLowerCase() || '';
    const email = member.user?.email?.toLowerCase() || '';
    return name.includes(query) || email.includes(query);
  });
});

const memberCount = computed(() => members.value.length);

const load = async () => {
  loading.value = true;
  error.value = null;

  try {
    const sessionResponse = await api.get<{ data: Session }>('/api/auth/session');
    session.value = sessionResponse.data;

    if (session.value?.active_org_id) {
      const membersResponse = await api.get<{ data: OrgMember[] }>(
        `/api/orgs/${session.value.active_org_id}/members`
      );
      members.value = membersResponse.data;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load members.';
  } finally {
    loading.value = false;
  }
};

const toggleRole = async (member: OrgMember) => {
  if (!session.value?.active_org_id || updating.value) {
    return;
  }

  const newRole = member.system_role === 'super_admin' ? 'member' : 'super_admin';

  updating.value = member.user_id;
  error.value = null;

  try {
    await api.patch<{ data: OrgMember }>(
      `/api/orgs/${session.value.active_org_id}/members/${member.user_id}`,
      { system_role: newRole }
    );

    // Update local state
    const index = members.value.findIndex((m) => m.user_id === member.user_id);
    if (index !== -1) {
      members.value[index].system_role = newRole;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update role.';
  } finally {
    updating.value = null;
  }
};

const formatRole = (role: string) => {
  return role.replace('_', ' ');
};

const getInitials = (member: OrgMember): string => {
  if (member.user?.display_name) {
    return member.user.display_name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  if (member.user?.email) {
    return member.user.email.slice(0, 2).toUpperCase();
  }

  return '??';
};

onMounted(load);
</script>

<template>
  <div class="members-page">
    <UiPageHeader
      title="Organization Members"
      :subtitle="activeOrg ? `Manage members of ${activeOrg.name}` : 'Manage organization members and permissions.'"
    >
      <template #right>
        <span class="member-count">{{ memberCount }} {{ memberCount === 1 ? 'member' : 'members' }}</span>
      </template>
    </UiPageHeader>

    <!-- Search Bar -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Search by name or email..."
        />
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="error-banner">
      <span>{{ error }}</span>
      <button type="button" class="error-dismiss" @click="error = null">Dismiss</button>
    </div>

    <!-- Loading State -->
    <p v-if="loading" class="loading-text">Loading members...</p>

    <!-- No Org State -->
    <section v-else-if="!session?.active_org_id" class="empty-state">
      <p>No active organization selected.</p>
    </section>

    <!-- Members Table -->
    <section v-else class="members-section">
      <UiSectionHeader label="member directory" />

      <div v-if="filteredMembers.length" class="members-table">
        <div class="table-header">
          <div class="col col-member">member</div>
          <div class="col col-email">email</div>
          <div class="col col-role">role</div>
          <div class="col col-joined">joined</div>
          <div class="col col-action">action</div>
        </div>

        <div class="table-body">
          <div
            v-for="member in filteredMembers"
            :key="member.id"
            class="table-row"
          >
            <div class="col col-member">
              <div class="member-avatar">
                {{ getInitials(member) }}
              </div>
              <span class="member-name">
                {{ member.user?.display_name || member.user?.email || 'Unknown User' }}
              </span>
            </div>

            <div class="col col-email">
              <span class="email-text">{{ member.user?.email || '—' }}</span>
            </div>

            <div class="col col-role">
              <span
                class="role-badge"
                :class="{
                  'role-badge--admin': member.system_role === 'super_admin',
                  'role-badge--member': member.system_role === 'member'
                }"
              >
                {{ formatRole(member.system_role) }}
              </span>
            </div>

            <div class="col col-joined">
              {{ new Date(member.joined_at).toLocaleDateString() }}
            </div>

            <div class="col col-action">
              <button
                type="button"
                class="role-toggle"
                :class="{
                  'role-toggle--loading': updating === member.user_id
                }"
                :disabled="updating === member.user_id"
                @click="toggleRole(member)"
              >
                <template v-if="updating === member.user_id">
                  updating...
                </template>
                <template v-else>
                  {{ member.system_role === 'super_admin' ? 'demote' : 'promote' }}
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="searchQuery && members.length > 0" class="empty-state">
        <p>No members match "{{ searchQuery }}"</p>
        <button type="button" class="clear-search" @click="searchQuery = ''">
          Clear search
        </button>
      </div>

      <div v-else class="empty-state">
        <p>No members found in this organization.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.members-page {
  max-width: var(--content-max-width);
}

/* Member Count */
.member-count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Search Bar */
.search-bar {
  margin-bottom: var(--space-6);
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: var(--space-3);
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3) var(--space-2) var(--space-10);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-6);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgb(239, 68, 68);
}

.error-dismiss {
  padding: var(--space-1) var(--space-2);
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  color: rgb(239, 68, 68);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.error-dismiss:hover {
  background: rgba(239, 68, 68, 0.1);
}

/* Loading State */
.loading-text {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-12) var(--space-6);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.empty-state p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.clear-search {
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.clear-search:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* Members Section */
.members-section {
  margin-top: var(--space-2);
}

/* Members Table */
.members-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 120px 100px 100px;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
}

.table-header .col {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
}

.table-body {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 120px 100px 100px;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--color-bg-hover);
}

.col {
  display: flex;
  align-items: center;
}

.col-member {
  gap: var(--space-3);
}

/* Member Avatar */
.member-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.member-name {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Email */
.email-text {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Role Badge */
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
  background: rgba(139, 92, 246, 0.1);
  color: rgb(139, 92, 246);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.role-badge--member {
  background: rgba(107, 114, 128, 0.1);
  color: rgb(107, 114, 128);
  border: 1px solid rgba(107, 114, 128, 0.2);
}

/* Joined Date */
.col-joined {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Role Toggle Button */
.role-toggle {
  padding: var(--space-1) var(--space-3);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.role-toggle:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
  border-color: var(--color-border-strong);
}

.role-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.role-toggle--loading {
  color: var(--color-text-tertiary);
}
</style>
