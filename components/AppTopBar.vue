<script setup lang="ts">
const props = defineProps<{
  sectionLabel: string;
  currentProjectName?: string;
  currentOrgName?: string;
  organizations?: Array<{ id: string; name: string; is_active?: boolean }>;
  projectContext?: boolean;
  unreadCount: number;
  currentUserName?: string | null;
  authEnabled?: boolean;
}>();

const emit = defineEmits<{
  openSearch: [];
  toggleTheme: [];
  openAi: [];
  switchOrg: [orgId: string];
  logout: [];
}>();

const { isDark } = useTheme();
const actionsMenuOpen = ref(false);
const route = useRoute();

const currentProjectId = computed(() => {
  const param = route.params.id;
  return typeof param === 'string' ? param : null;
});

const onKeydown = (event: KeyboardEvent) => {
  // Cmd/Ctrl + K for search
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    emit('openSearch');
  }
  // Cmd/Ctrl + J for AI panel
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
    event.preventDefault();
    emit('openAi');
  }
};

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});

const userInitial = computed(() => {
  if (!props.currentUserName) return '?';
  return props.currentUserName.charAt(0).toUpperCase();
});
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <NuxtLink to="/projects" class="wordmark">workbench</NuxtLink>
      <span class="separator">/</span>
      <template v-if="authEnabled && (organizations?.length || 0) > 1">
        <select
          class="org-select"
          :value="organizations?.find((org) => org.is_active)?.id"
          @change="emit('switchOrg', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option>
        </select>
      </template>
      <span v-else-if="currentOrgName" class="org-name">{{ currentOrgName }}</span>
    </div>

    <div class="topbar-right">
      <div
        class="actions-wrapper"
        @mouseenter="actionsMenuOpen = true"
        @mouseleave="actionsMenuOpen = false"
      >
        <button type="button" class="actions-button">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="5" r="1" fill="currentColor" />
            <circle cx="12" cy="19" r="1" fill="currentColor" />
          </svg>
          <span>actions</span>
        </button>

        <div v-if="actionsMenuOpen" class="actions-menu">
          <NuxtLink to="/projects" class="menu-item">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>New Project</span>
          </NuxtLink>

          <template v-if="currentProjectId">
            <NuxtLink :to="`/projects/${currentProjectId}/documents`" class="menu-item">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>New Document</span>
            </NuxtLink>

            <NuxtLink :to="`/projects/${currentProjectId}/tasks/list`" class="menu-item">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span>New Task</span>
            </NuxtLink>

            <div class="menu-divider" />
          </template>

          <button type="button" class="menu-item" @click="emit('openAi')">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
            <span>AssistDeez</span>
            <kbd>⌘J</kbd>
          </button>

          <NuxtLink to="/notifications" class="menu-item">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span>View Notifications</span>
            <span v-if="unreadCount > 0" class="menu-badge">{{ unreadCount }}</span>
          </NuxtLink>
        </div>
      </div>

      <button type="button" class="search-button" @click="emit('openSearch')">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span>search</span>
        <kbd>&#8984;K</kbd>
      </button>

      <NuxtLink to="/notifications" class="icon-button" aria-label="Open notifications">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </NuxtLink>

      <button type="button" class="icon-button" aria-label="Toggle theme" @click="emit('toggleTheme')">
        <svg v-if="isDark" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>

      <div v-if="authEnabled && currentUserName" class="avatar" :title="currentUserName">
        {{ userInitial }}
      </div>

      <button v-if="authEnabled" type="button" class="text-button" @click="emit('logout')">
        sign out
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
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
  gap: var(--space-2);
}

.actions-wrapper {
  position: relative;
}

.actions-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.actions-button:hover {
  background: var(--color-bg-hover);
}

.actions-button .icon {
  width: 13px;
  height: 13px;
}

.actions-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 200px;
  background: var(--color-bg-sidebar);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: var(--space-2);
  z-index: 100;
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.menu-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.menu-item .icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.menu-item kbd {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

.menu-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  line-height: 18px;
  text-align: center;
  color: var(--color-text-inverse);
  background: var(--color-text);
  border-radius: var(--radius-pill);
}

.menu-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-2) 0;
}

.search-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.search-button:hover {
  background: var(--color-bg-hover);
}

.search-button .icon {
  width: 13px;
  height: 13px;
}

.search-button kbd {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
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

.badge {
  position: absolute;
  top: 2px;
  right: 2px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  line-height: 16px;
  text-align: center;
  color: var(--color-text-inverse);
  background: var(--color-text);
  border-radius: var(--radius-pill);
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: var(--color-bg-active);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text);
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
</style>
