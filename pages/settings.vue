<script setup lang="ts">
const api = useWorkbenchApi();
const loading = ref(true);
const user = ref<{
  id: string;
  email: string;
  name?: string;
  display_name?: string;
} | null>(null);
const role = ref('member');
const themePreference = ref('system');
const emailNotifications = ref(true);
const defaultView = ref('list');

const load = async () => {
  loading.value = true;

  try {
    const response = await api.get<{
      data: {
        user: {
          id: string;
          email: string;
          name?: string;
          display_name?: string;
        };
        active_org_id: string | null;
        organizations: Array<{ id: string; system_role: string }>;
      };
    }>('/api/auth/session');

    user.value = response.data.user;
    role.value =
      response.data.organizations.find((org) => org.id === response.data.active_org_id)?.system_role ||
      'member';
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
            <span class="setting-value">{{ user?.display_name || user?.name || 'Not set' }}</span>
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Role</span>
            <span class="setting-value">{{ role }}</span>
          </div>
        </div>
      </article>

      <article class="settings-group">
        <h2>Preferences</h2>
        <div class="setting-row">
          <div class="setting-info">
            <label class="setting-label" for="theme-select">Theme</label>
            <span class="setting-description">Choose your interface theme</span>
          </div>
          <select id="theme-select" v-model="themePreference" class="setting-control" aria-label="Theme preference">
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <label class="setting-label" for="notifications-toggle">Notifications</label>
            <span class="setting-description">Receive email notifications for updates</span>
          </div>
          <input
            id="notifications-toggle"
            v-model="emailNotifications"
            type="checkbox"
            class="setting-control"
            aria-label="Enable email notifications"
          >
        </div>
      </article>

      <article class="settings-group">
        <h2>Workspace</h2>
        <div class="setting-row">
          <div class="setting-info">
            <label class="setting-label" for="default-view-select">Default View</label>
            <span class="setting-description">Your preferred task view</span>
          </div>
          <select
            id="default-view-select"
            v-model="defaultView"
            class="setting-control"
            aria-label="Default task view"
          >
            <option value="list">List</option>
            <option value="kanban">Kanban</option>
            <option value="calendar">Calendar</option>
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
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
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
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
</style>
