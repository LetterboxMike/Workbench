<script setup lang="ts">
import type { OrgMember, SystemRole } from '~/types/domain';

const props = defineProps<{
  open: boolean;
  orgId: string;
  member: (OrgMember & { user: any }) | null;
}>();

const emit = defineEmits<{
  close: [];
  updated: [];
}>();

const api = useWorkbenchApi();
const systemRole = ref<SystemRole>('member');
const loading = ref(false);
const errorMessage = ref('');

const reset = () => {
  errorMessage.value = '';
  if (props.member) {
    systemRole.value = props.member.system_role;
  }
};

const close = () => {
  emit('close');
  reset();
};

const submit = async () => {
  if (!props.member) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    await api.patch(`/api/orgs/${props.orgId}/members/${props.member.user_id}`, {
      system_role: systemRole.value
    });

    emit('updated');
    close();
  } catch (error) {
    errorMessage.value = (error as any)?.statusMessage || 'Failed to update member role';
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.member,
  (member) => {
    if (member) {
      systemRole.value = member.system_role;
    }
  }
);

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close();
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      window.addEventListener('keydown', onEscape);
      reset();
    } else {
      window.removeEventListener('keydown', onEscape);
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEscape);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open && member" class="modal-backdrop" @click.self="close">
      <section class="modal-dialog" role="dialog" aria-modal="true" aria-label="Edit Member">
        <header class="modal-header">
          <div>
            <h2>Edit Member Role</h2>
            <p>Update {{ member.user?.display_name || member.user?.email }}'s role in this organization.</p>
          </div>
          <button type="button" class="close-btn" @click="close">Close</button>
        </header>

        <div class="modal-body">
          <form @submit.prevent="submit">
            <label class="form-field">
              <span class="field-label">System Role</span>
              <select v-model="systemRole" class="field-select">
                <option value="member">Member</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <span class="field-help">
                Super admins can manage members and organization settings.
              </span>
            </label>

            <div class="form-actions">
              <PrimaryButton
                label="Update Role"
                :loading="loading"
                @click="submit"
              />
              <button type="button" class="cancel-btn" @click="close">
                Cancel
              </button>
            </div>
          </form>

          <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-6);
}

.modal-dialog {
  width: 100%;
  max-width: 500px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-1);
}

.modal-header p {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.close-btn {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: transparent;
  border: none;
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.close-btn:hover {
  color: var(--color-text);
}

.modal-body {
  padding: var(--space-6);
}

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.field-select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
}

.field-select:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

.field-help {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.cancel-btn {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.cancel-btn:hover {
  background: var(--color-bg-hover);
}

.message.error {
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}
</style>
