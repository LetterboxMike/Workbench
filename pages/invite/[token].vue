<script setup lang="ts">
definePageMeta({
  layout: false
});

const route = useRoute();
const api = useWorkbenchApi();
useTheme();

const token = computed(() => route.params.token as string);
const loading = ref(false);
const errorMessage = ref('');
const form = reactive({
  name: '',
  password: ''
});

const config = useRuntimeConfig();
const isLocalAuth = computed(() => config.public.authMode === 'local');

const submit = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.post<{ data: { redirect_to: string } }>(
      '/api/auth/redeem-magic-link',
      {
        token: token.value,
        name: form.name || undefined,
        password: form.password || undefined
      }
    );

    await navigateTo(response.data.redirect_to);
  } catch (error) {
    errorMessage.value = (error as any)?.statusMessage || 'Failed to redeem invitation';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="invite-page">
    <div class="invite-container">
      <article class="invite-panel">
        <div class="invite-content">
          <header class="invite-header">
            <h1>Welcome to Workbench</h1>
            <p>You've been invited to join an organization.</p>
          </header>

          <form class="invite-form" @submit.prevent="submit">
            <label v-if="isLocalAuth" class="form-field">
              <span class="field-label">Your Name</span>
              <input
                v-model="form.name"
                class="field-input"
                type="text"
                autocomplete="name"
                required
              />
            </label>

            <label v-if="isLocalAuth" class="form-field">
              <span class="field-label">Choose Password</span>
              <input
                v-model="form.password"
                class="field-input"
                type="password"
                autocomplete="new-password"
                required
              />
            </label>

            <button type="submit" class="submit-btn" :disabled="loading">
              {{ loading ? 'Accepting invitation...' : 'Accept Invitation' }}
            </button>
          </form>

          <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

          <p class="help-text">
            By accepting this invitation, you'll gain access to projects and documents within the organization.
          </p>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.invite-page {
  min-height: 100vh;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.invite-container {
  width: 100%;
  max-width: 450px;
}

.invite-panel {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
}

.invite-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.invite-header h1 {
  font-family: var(--font-body);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

.invite-header p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.invite-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
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

.field-input {
  padding: var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
}

.field-input:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

.submit-btn {
  padding: var(--space-3) var(--space-4);
  background: var(--color-text);
  color: var(--color-bg);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.message {
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
}

.message.error {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}

.help-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-align: center;
}
</style>
