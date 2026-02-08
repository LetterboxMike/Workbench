<script setup lang="ts">
definePageMeta({
  layout: false
});

const route = useRoute();
const api = useWorkbenchApi();
const config = useRuntimeConfig();

// Initialize theme
useTheme();

const authEnabled = computed(() => config.public.authMode !== 'disabled');
const authModeLabel = computed(() => (config.public.authMode === 'supabase' ? 'supabase auth' : 'local auth'));
const mode = ref<'login' | 'signup'>('login');
const loading = ref(false);
const errorMessage = ref('');
const infoMessage = ref('');

const form = reactive({
  name: '',
  email: '',
  password: ''
});

const nextPath = computed(() => (typeof route.query.redirect === 'string' ? route.query.redirect : '/projects'));

onMounted(async () => {
  if (!authEnabled.value) {
    return;
  }

  try {
    // Use skipAuthRedirect to prevent redirect loops when session check fails
    await api.get('/api/auth/session', { skipAuthRedirect: true });
    await navigateTo(nextPath.value);
  } catch {
    // No valid session - stay on login screen (expected behavior)
  }
});

const submit = async () => {
  if (!authEnabled.value) {
    await navigateTo('/projects');
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  infoMessage.value = '';

  try {
    if (mode.value === 'login') {
      await api.post('/api/auth/login', {
        email: form.email,
        password: form.password
      });
    } else {
      const response = await api.post<{ data: { email_confirmed: boolean } }>('/api/auth/signup', {
        name: form.name,
        email: form.email,
        password: form.password
      });

      if (!response.data.email_confirmed) {
        infoMessage.value = 'Account created. Confirm your email if your Supabase project requires verification.';
      }
    }

    await navigateTo(nextPath.value);
  } catch (error) {
    errorMessage.value = (error as { statusMessage?: string; message?: string } | null)?.statusMessage || 'Authentication failed.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Left Panel -->
      <aside class="brand-panel">
        <div class="brand-content">
          <p class="brand-name">workbench</p>
          <h1 class="brand-headline">Operational clarity for project teams.</h1>
          <p class="brand-description">
            A single environment for project planning, document execution, and AI-assisted updates.
          </p>

          <ul class="feature-list">
            <li>One shared task index across list, board, and calendar.</li>
            <li>Document editing linked directly to execution tasks.</li>
            <li>Notifications and activity aligned to project access.</li>
          </ul>
        </div>
      </aside>

      <!-- Right Panel -->
      <article class="auth-panel">
        <div class="auth-content">
          <header class="auth-header">
            <h2 class="auth-title">{{ mode === 'login' ? 'sign in' : 'create account' }}</h2>
            <p class="auth-subtitle">
              {{ authEnabled ? `use your workspace account to continue (${authModeLabel}).` : 'auth is disabled in this environment.' }}
            </p>
          </header>

          <template v-if="authEnabled">
            <!-- Mode Toggle -->
            <div class="mode-toggle">
              <button
                type="button"
                class="mode-btn"
                :class="{ active: mode === 'login' }"
                @click="mode = 'login'"
              >
                sign in
              </button>
              <button
                type="button"
                class="mode-btn"
                :class="{ active: mode === 'signup' }"
                @click="mode = 'signup'"
              >
                sign up
              </button>
            </div>

            <!-- Auth Form -->
            <form class="auth-form" @submit.prevent="submit">
              <label v-if="mode === 'signup'" class="form-field">
                <span class="field-label">full name</span>
                <input
                  v-model="form.name"
                  class="field-input"
                  type="text"
                  autocomplete="name"
                  required
                />
              </label>

              <label class="form-field">
                <span class="field-label">email</span>
                <input
                  v-model="form.email"
                  class="field-input"
                  type="email"
                  autocomplete="email"
                  required
                />
              </label>

              <label class="form-field">
                <span class="field-label">password</span>
                <input
                  v-model="form.password"
                  class="field-input"
                  type="password"
                  autocomplete="current-password"
                  required
                />
              </label>

              <button type="submit" class="submit-btn" :disabled="loading">
                {{ loading ? 'please wait...' : mode === 'login' ? 'sign in' : 'create account' }}
              </button>
            </form>
          </template>

          <button v-else type="button" class="submit-btn" @click="navigateTo('/projects')">
            continue in demo mode
          </button>

          <!-- Messages -->
          <p v-if="infoMessage" class="message info">{{ infoMessage }}</p>
          <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 900px;
  width: 100%;
  gap: var(--space-12);
}

/* Brand Panel */
.brand-panel {
  display: flex;
  align-items: center;
}

.brand-content {
  max-width: 360px;
}

.brand-name {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-6);
}

.brand-headline {
  font-family: var(--font-body);
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--color-text);
  margin: 0 0 var(--space-4);
}

.brand-description {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-6);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.feature-list li {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  padding-left: var(--space-4);
  position: relative;
}

.feature-list li::before {
  content: '—';
  position: absolute;
  left: 0;
}

/* Auth Panel */
.auth-panel {
  display: flex;
  align-items: center;
}

.auth-content {
  width: 100%;
  max-width: 320px;
}

.auth-header {
  margin-bottom: var(--space-6);
}

.auth-title {
  font-family: var(--font-body);
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--space-2);
}

.auth-subtitle {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin: 0;
}

/* Mode Toggle */
.mode-toggle {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.mode-btn {
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.mode-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.mode-btn.active {
  background: var(--color-bg-active);
  color: var(--color-text);
  border-color: var(--color-border-strong);
}

/* Form */
.auth-form {
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
  margin-top: var(--space-2);
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

/* Messages */
.message {
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
}

.message.info {
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
}

.message.error {
  background: var(--color-bg-surface);
  color: var(--color-text);
}

/* Responsive */
@media (max-width: 768px) {
  .login-container {
    grid-template-columns: 1fr;
    gap: var(--space-8);
  }

  .brand-panel {
    display: none;
  }
}
</style>
