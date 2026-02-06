<script setup lang="ts">
const api = useWorkbenchApi();
const loading = ref(true);
const user = ref<{
  id: string;
  email: string;
  display_name?: string | null;
  role?: string;
} | null>(null);

const load = async () => {
  loading.value = true;

  try {
    const response = await api.get<{ user: typeof user.value }>('/api/auth/me');
    user.value = response.user;
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<template>
  <section>
    <header>
      <div>
        <h1>Settings</h1>
        <p>Manage your account preferences and workspace configuration.</p>
      </div>
    </header>

    <p v-if="loading">Loading settings...</p>

    <section v-else class="settings-content">
      <article class="settings-group">
        <h2>Account</h2>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Email</span>
            <span class="setting-value">{{ user?.email }}</span>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Display Name</span>
            <span class="setting-value">{{ user?.display_name || 'Not set' }}</span>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Role</span>
            <span class="setting-value">{{ user?.role || 'member' }}</span>
          </div>
        </div>
      </article>

      <article class="settings-group">
        <h2>Preferences</h2>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Theme</span>
            <span class="setting-description">Choose your interface theme</span>
          </div>
          <select class="setting-control">
            <option>System</option>
            <option>Light</option>
            <option>Dark</option>
          </select>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Notifications</span>
            <span class="setting-description">Receive email notifications for updates</span>
          </div>
          <input type="checkbox" class="setting-control" checked>
        </div>
      </article>

      <article class="settings-group">
        <h2>Workspace</h2>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Default View</span>
            <span class="setting-description">Your preferred task view</span>
          </div>
          <select class="setting-control">
            <option>List</option>
            <option>Kanban</option>
            <option>Calendar</option>
          </select>
        </div>
      </article>
    </section>
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

section > p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.settings-group {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  background: var(--color-bg-surface);
}

.settings-group h2 {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4) 0;
}

.setting-row:not(:last-child) {
  border-bottom: 1px solid var(--color-border);
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.setting-label {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.setting-value {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
}

.setting-description {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.setting-control {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.setting-control:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

select.setting-control {
  min-width: 150px;
}

input[type="checkbox"].setting-control {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
</style>
