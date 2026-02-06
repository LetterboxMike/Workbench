<script setup lang="ts">
const route = useRoute();
const api = useWorkbenchApi();
const { toggle: toggleTheme } = useTheme();
const config = useRuntimeConfig();

const authEnabled = computed(() => config.public.authMode !== 'disabled');

const currentUserName = ref<string | null>(null);
const currentOrgName = ref<string>('');

interface SessionOrganization {
  id: string;
  name: string;
  is_active?: boolean;
}

const organizations = ref<SessionOrganization[]>([]);

const navItems = [
  {
    label: 'dashboard',
    path: '/admin',
    icon: 'dashboard'
  },
  {
    label: 'members',
    path: '/admin/members',
    icon: 'users'
  },
  {
    label: 'activity',
    path: '/admin/activity',
    icon: 'activity'
  },
  {
    label: 'settings',
    path: '/admin/settings',
    icon: 'settings'
  }
];

const isActive = (path: string) => {
  if (path === '/admin') {
    return route.path === '/admin';
  }
  return route.path.startsWith(path);
};

const loadSessionData = async () => {
  if (!authEnabled.value) return;

  try {
    const response = await api.get<{
      data: {
        user: { name: string };
        organizations?: SessionOrganization[];
      };
    }>('/api/auth/session');

    currentUserName.value = response.data?.user?.name || null;
    organizations.value = response.data?.organizations || [];
    currentOrgName.value = organizations.value.find((org) => org.is_active)?.name || organizations.value[0]?.name || '';
  } catch {
    currentUserName.value = null;
    organizations.value = [];
    currentOrgName.value = '';
  }
};

onMounted(loadSessionData);

const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } finally {
    await navigateTo('/login');
  }
};

const switchOrg = async (orgId: string) => {
  await api.post('/api/auth/switch-org', { org_id: orgId });
  await navigateTo('/admin');
  await loadSessionData();
};
</script>

<template>
  <div class="admin-shell">
    <!-- Header -->
    <header class="admin-topbar">
      <div class="topbar-left">
        <NuxtLink to="/projects" class="wordmark">workbench</NuxtLink>
        <span class="separator">/</span>
        <span class="admin-badge">admin</span>
        <template v-if="authEnabled && (organizations?.length || 0) > 1">
          <span class="separator">/</span>
          <select
            class="org-select"
            :value="organizations?.find((org) => org.is_active)?.id"
            @change="switchOrg(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
          </select>
        </template>
        <span v-else-if="currentOrgName" class="separator">/</span>
        <span v-if="currentOrgName && organizations.length <= 1" class="org-name">{{ currentOrgName }}</span>
      </div>

      <div class="topbar-right">
        <NuxtLink to="/projects" class="back-link">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>back to app</span>
        </NuxtLink>

        <button type="button" class="icon-button" aria-label="Toggle theme" @click="toggleTheme">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>

        <button v-if="authEnabled" type="button" class="text-button" @click="logout">
          sign out
        </button>
      </div>
    </header>

    <div class="admin-body">
      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <nav class="sidebar-nav">
          <p class="nav-label">admin</p>
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
          >
            <!-- Dashboard icon -->
            <svg v-if="item.icon === 'dashboard'" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <!-- Users icon -->
            <svg v-else-if="item.icon === 'users'" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <!-- Activity icon -->
            <svg v-else-if="item.icon === 'activity'" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <!-- Settings icon -->
            <svg v-else-if="item.icon === 'settings'" class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="admin-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

/* Topbar */
.admin-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--topbar-height);
  padding: 0 var(--space-6);
  background: var(--color-bg-sidebar);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.wordmark {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
}

.separator {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.admin-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-inverse);
  background: var(--color-text);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
}

.org-name {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.org-select {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
}

.org-select:hover {
  background: var(--color-bg-hover);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.back-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  text-decoration: none;
  padding: 6px var(--space-3);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.back-link:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.back-link .icon {
  width: 14px;
  height: 14px;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.icon-button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.icon-button .icon {
  width: 16px;
  height: 16px;
}

.text-button {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  background: transparent;
  border: none;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.text-button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

/* Body */
.admin-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.admin-sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-nav {
  padding: var(--space-4) 0;
}

.nav-label {
  padding: var(--space-3) var(--space-3) var(--space-1);
  padding-left: 26px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.14em;
  color: var(--color-text-tertiary);
  opacity: 0.4;
  text-transform: lowercase;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 var(--space-3);
  padding: 6px var(--space-3);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.nav-item:hover {
  background: var(--color-bg-sidebar-hover);
}

.nav-item.active {
  background: var(--color-bg-sidebar-active);
  color: var(--color-text);
  font-weight: 500;
}

.nav-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  color: inherit;
}

.nav-item.active .nav-icon {
  color: var(--color-text);
}

/* Content */
.admin-content {
  flex: 1;
  overflow-y: auto;
  background: var(--color-bg);
  padding: var(--space-10) var(--space-12);
}

.admin-content > :deep(*) {
  max-width: var(--content-max-width);
  margin-left: auto;
  margin-right: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-sidebar {
    width: 200px;
  }

  .admin-content {
    padding: var(--space-6) var(--space-4);
  }

  .back-link span {
    display: none;
  }
}
</style>
