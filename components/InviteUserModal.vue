<script setup lang="ts">
import type { SystemRole } from '~/types/domain';

const props = defineProps<{
  open: boolean;
  orgId: string;
}>();

const emit = defineEmits<{
  close: [];
  invited: [];
}>();

const api = useWorkbenchApi();
const email = ref('');
const systemRole = ref<SystemRole>('member');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const inviteUrl = ref('');

const reset = () => {
  email.value = '';
  systemRole.value = 'member';
  errorMessage.value = '';
  successMessage.value = '';
  inviteUrl.value = '';
};

const close = () => {
  emit('close');
  reset();
};

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(inviteUrl.value);
    successMessage.value = 'Link copied to clipboard!';
    setTimeout(() => {
      successMessage.value = '';
    }, 2000);
  } catch (err) {
    errorMessage.value = 'Failed to copy link';
  }
};

const submit = async () => {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await api.post<{
      data: {
        invite_url: string;
        email: string;
        system_role: string;
      };
    }>(`/api/orgs/${props.orgId}/members/invite`, {
      email: email.value,
      system_role: systemRole.value
    });

    inviteUrl.value = response.data.invite_url;
    successMessage.value = `Invitation created for ${response.data.email}`;
    emit('invited');
  } catch (error) {
    errorMessage.value = (error as any)?.statusMessage || 'Failed to create invitation';
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
      reset();
    }
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEscape);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="close">
      <section class="modal-dialog" role="dialog" aria-modal="true" aria-label="Invite User">
        <header class="modal-header">
          <div>
            <h2>Invite User</h2>
            <p>Send a magic link invitation to add a new member to your organization.</p>
          </div>
          <button type="button" class="close-btn" @click="close">Close</button>
        </header>

        <div class="modal-body">
          <form v-if="!inviteUrl" @submit.prevent="submit">
            <label class="form-field">
              <span class="field-label">Email Address</span>
              <InputField
                v-model="email"
                type="email"
                placeholder="user@example.com"
              />
            </label>

            <label class="form-field">
              <span class="field-label">Role</span>
              <select v-model="systemRole" class="field-select">
                <option value="member">Member</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </label>

            <div class="form-actions">
              <PrimaryButton
                label="Generate Invite Link"
                :loading="loading"
                @click="submit"
              />
              <button type="button" class="cancel-btn" @click="close">
                Cancel
              </button>
            </div>
          </form>

          <div v-else class="invite-result">
            <p class="result-label">Invitation Link</p>
            <div class="link-container">
              <code class="invite-link">{{ inviteUrl }}</code>
              <button type="button" class="copy-btn" @click="copyToClipboard">
                Copy
              </button>
            </div>
            <p class="help-text">
              Share this link with the user. It expires in 24 hours and can only be used once.
            </p>
          </div>

          <p v-if="successMessage" class="message success">{{ successMessage }}</p>
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

.invite-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.result-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.link-container {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.invite-link {
  flex: 1;
  padding: var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text);
  word-break: break-all;
}

.copy-btn {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.copy-btn:hover {
  background: var(--color-bg-active);
}

.help-text {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.message {
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
}

.message.success {
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
}

.message.error {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}
</style>
