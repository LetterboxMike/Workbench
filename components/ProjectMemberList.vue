<script setup lang="ts">
import type { ProjectMember, ProjectRole, User, Invitation } from '~/types/domain';

interface MemberWithUser extends ProjectMember {
  user: User | null;
}

const props = defineProps<{
  projectId: string;
}>();

const api = useWorkbenchApi();

const members = ref<MemberWithUser[]>([]);
const invitations = ref<Invitation[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

const inviteEmail = ref('');
const inviteRole = ref<ProjectRole>('viewer');
const inviting = ref(false);
const inviteError = ref<string | null>(null);

const updatingRoleFor = ref<string | null>(null);
const removingMember = ref<string | null>(null);
const confirmRemoveId = ref<string | null>(null);

const roles: { value: ProjectRole; label: string }[] = [
  { value: 'admin', label: 'admin' },
  { value: 'editor', label: 'editor' },
  { value: 'viewer', label: 'viewer' }
];

const fetchMembers = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await api.get<{ data: MemberWithUser[] }>(`/api/projects/${props.projectId}/members`);
    members.value = response.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load members.';
  } finally {
    loading.value = false;
  }
};

const fetchInvitations = async () => {
  try {
    const response = await api.get<{ data: Invitation[] }>(`/api/projects/${props.projectId}/invitations`);
    invitations.value = response.data.filter((inv) => !inv.accepted_at);
  } catch {
    // Invitations endpoint may not exist; silently ignore
    invitations.value = [];
  }
};

const inviteMember = async () => {
  if (!inviteEmail.value.trim() || inviting.value) {
    return;
  }

  inviting.value = true;
  inviteError.value = null;

  try {
    await api.post(`/api/projects/${props.projectId}/members`, {
      email: inviteEmail.value.trim(),
      role: inviteRole.value
    });

    inviteEmail.value = '';
    inviteRole.value = 'viewer';

    await Promise.all([fetchMembers(), fetchInvitations()]);
  } catch (err) {
    inviteError.value = err instanceof Error ? err.message : 'Failed to invite member.';
  } finally {
    inviting.value = false;
  }
};

const updateRole = async (userId: string, newRole: ProjectRole) => {
  updatingRoleFor.value = userId;

  try {
    await api.patch(`/api/projects/${props.projectId}/members/${userId}`, {
      role: newRole
    });

    const member = members.value.find((m) => m.user_id === userId);

    if (member) {
      member.role = newRole;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update role.';
  } finally {
    updatingRoleFor.value = null;
  }
};

const confirmRemove = (userId: string) => {
  confirmRemoveId.value = userId;
};

const cancelRemove = () => {
  confirmRemoveId.value = null;
};

const removeMember = async (userId: string) => {
  removingMember.value = userId;
  confirmRemoveId.value = null;

  try {
    await api.del(`/api/projects/${props.projectId}/members/${userId}`);
    members.value = members.value.filter((m) => m.user_id !== userId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to remove member.';
  } finally {
    removingMember.value = null;
  }
};

const getInitials = (name: string | undefined): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

onMounted(() => {
  fetchMembers();
  fetchInvitations();
});

watch(
  () => props.projectId,
  () => {
    fetchMembers();
    fetchInvitations();
  }
);
</script>

<template>
  <div class="member-list">
    <!-- Invite Form -->
    <div class="invite-section">
      <UiSectionHeader label="invite member" />
      <form class="invite-form" @submit.prevent="inviteMember">
        <UiInputField
          v-model="inviteEmail"
          type="email"
          placeholder="email@example.com"
          class="invite-email"
        />
        <select v-model="inviteRole" class="role-select">
          <option v-for="role in roles" :key="role.value" :value="role.value">
            {{ role.label }}
          </option>
        </select>
        <UiPrimaryButton
          label="invite"
          :loading="inviting"
          :disabled="!inviteEmail.trim()"
          @click="inviteMember"
        />
      </form>
      <p v-if="inviteError" class="error-message">{{ inviteError }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="spinner" />
      <span>loading members...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button type="button" class="retry-button" @click="fetchMembers">retry</button>
    </div>

    <!-- Members List -->
    <div v-else class="members-section">
      <UiSectionHeader label="members" />
      <div v-if="members.length === 0" class="empty-state">
        No members found.
      </div>
      <ul v-else class="members-list">
        <li v-for="member in members" :key="member.user_id" class="member-row">
          <div class="member-info">
            <div class="avatar" :style="{ backgroundColor: member.user?.avatar_url ? 'transparent' : 'var(--color-bg-active)' }">
              <img v-if="member.user?.avatar_url" :src="member.user.avatar_url" :alt="member.user?.name" class="avatar-img" />
              <span v-else class="avatar-initials">{{ getInitials(member.user?.name) }}</span>
            </div>
            <div class="member-details">
              <span class="member-name">{{ member.user?.name || 'Unknown' }}</span>
              <span class="member-email">{{ member.user?.email || '—' }}</span>
            </div>
          </div>

          <div class="member-actions">
            <!-- Role Dropdown -->
            <div class="role-wrapper">
              <select
                :value="member.role"
                class="role-select role-select-inline"
                :disabled="updatingRoleFor === member.user_id"
                @change="updateRole(member.user_id, ($event.target as HTMLSelectElement).value as ProjectRole)"
              >
                <option v-for="role in roles" :key="role.value" :value="role.value">
                  {{ role.label }}
                </option>
              </select>
              <span v-if="updatingRoleFor === member.user_id" class="spinner spinner-small" />
            </div>

            <!-- Remove Button -->
            <div class="remove-wrapper">
              <button
                v-if="confirmRemoveId !== member.user_id"
                type="button"
                class="remove-button"
                :disabled="removingMember === member.user_id"
                @click="confirmRemove(member.user_id)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div v-else class="confirm-remove">
                <button type="button" class="confirm-yes" @click="removeMember(member.user_id)">
                  remove
                </button>
                <button type="button" class="confirm-no" @click="cancelRemove">
                  cancel
                </button>
              </div>
              <span v-if="removingMember === member.user_id" class="spinner spinner-small" />
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Pending Invitations -->
    <div v-if="invitations.length > 0" class="invitations-section">
      <UiSectionHeader label="pending invitations" />
      <ul class="invitations-list">
        <li v-for="invitation in invitations" :key="invitation.id" class="invitation-row">
          <div class="invitation-info">
            <div class="avatar avatar-pending">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div class="invitation-details">
              <span class="invitation-email">{{ invitation.email }}</span>
              <span class="invitation-status">pending</span>
            </div>
          </div>
          <span class="role-badge">{{ invitation.role }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.member-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* Invite Section */
.invite-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.invite-form {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.invite-email {
  flex: 1;
  max-width: 280px;
}

.role-select {
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 28px;
}

.role-select:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

/* Loading and Error States */
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.error-message {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #dc2626;
  margin: 0;
}

.retry-button {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.retry-button:hover {
  background: var(--color-bg-hover);
}

.empty-state {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Members Section */
.members-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.members-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.member-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.member-row:last-child {
  border-bottom: none;
}

.member-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.avatar-pending {
  background: var(--color-bg-elevated);
}

.avatar-pending svg {
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.member-name {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.member-email {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.member-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.role-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.role-select-inline {
  padding: var(--space-1) var(--space-2);
  font-size: 11px;
  padding-right: 24px;
}

.remove-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.remove-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.remove-button:hover {
  background: var(--color-bg-hover);
  color: #dc2626;
}

.remove-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.remove-button svg {
  width: 14px;
  height: 14px;
}

.confirm-remove {
  display: flex;
  gap: var(--space-2);
}

.confirm-yes,
.confirm-no {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.confirm-yes {
  background: #dc2626;
  color: white;
  border: none;
}

.confirm-yes:hover {
  background: #b91c1c;
}

.confirm-no {
  background: transparent;
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
}

.confirm-no:hover {
  background: var(--color-bg-hover);
}

/* Invitations Section */
.invitations-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.invitations-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.invitation-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
  opacity: 0.7;
}

.invitation-row:last-child {
  border-bottom: none;
}

.invitation-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.invitation-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.invitation-email {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.invitation-status {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
}

.role-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  background: var(--color-bg-elevated);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
}

/* Spinner */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-text);
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

.spinner-small {
  width: 12px;
  height: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
