<script setup lang="ts">
import type { OrgMember } from '~/types/domain';

const props = defineProps<{
  open: boolean;
  orgId: string;
  member: (OrgMember & { user: any }) | null;
}>();

const emit = defineEmits<{
  close: [];
  deleted: [];
}>();

const api = useWorkbenchApi();
const loading = ref(false);
const errorMessage = ref('');

const close = () => {
  emit('close');
  errorMessage.value = '';
};

const submit = async () => {
  if (!props.member) return;

  loading.value = true;
  errorMessage.value = '';

  try {
    await api.delete(`/api/orgs/${props.orgId}/members/${props.member.user_id}`);
    emit('deleted');
    close();
  } catch (error) {
    errorMessage.value = (error as any)?.statusMessage || 'Failed to remove member';
  } finally {
    loading.value = false;
  }
};

const onEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') close();
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      window.addEventListener('keydown', onEscape);
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
      <section class="modal-dialog danger" role="dialog" aria-modal="true" aria-label="Delete Member">
        <header class="modal-header">
          <div>
            <h2>Remove Member</h2>
            <p>This action cannot be undone.</p>
          </div>
          <button type="button" class="close-btn" @click="close">Close</button>
        </header>

        <div class="modal-body">
          <div class="warning-box">
            <p>
              Are you sure you want to remove
              <strong>{{ member.user?.display_name || member.user?.email }}</strong>
              from this organization?
            </p>
            <ul class="warning-list">
              <li>They will lose access to all projects in this organization</li>
              <li>They will be removed from all project teams</li>
              <li>This action cannot be undone</li>
            </ul>
          </div>

          <div class="form-actions">
            <button type="button" class="danger-btn" :disabled="loading" @click="submit">
              {{ loading ? 'Removing...' : 'Remove Member' }}
            </button>
            <button type="button" class="cancel-btn" @click="close">
              Cancel
            </button>
          </div>

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

.modal-dialog.danger {
  border-color: rgba(239, 68, 68, 0.3);
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
  color: rgb(239, 68, 68);
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

.warning-box {
  padding: var(--space-4);
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.warning-box p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text);
  margin-bottom: var(--space-3);
}

.warning-box strong {
  font-weight: 600;
}

.warning-list {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  list-style: disc;
  padding-left: var(--space-5);
}

.warning-list li {
  margin-bottom: var(--space-1);
}

.form-actions {
  display: flex;
  gap: var(--space-3);
}

.danger-btn {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: white;
  background: rgb(239, 68, 68);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.danger-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
