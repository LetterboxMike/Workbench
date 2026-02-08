<script setup lang="ts">
interface ProjectSummary {
  id: string;
  name: string;
  icon?: string | null;
  pinned?: boolean;
}

interface DocumentNode {
  id: string;
  title: string;
  children?: DocumentNode[];
}

interface DocumentTreeResponse {
  data: {
    tree: DocumentNode[];
  };
}

interface SessionOrganization {
  id: string;
  name: string;
  is_active?: boolean;
}

const route = useRoute();
const api = useWorkbenchApi();
const { toggle: toggleTheme } = useTheme();
const { isOpen: aiOpen, toggle: toggleAi } = useAiPanel();
const config = useRuntimeConfig();

const authEnabled = computed(() => config.public.authMode !== 'disabled');

const projects = ref<ProjectSummary[]>([]);
const documentTree = ref<DocumentNode[]>([]);
const unreadCount = ref(0);
const searchOpen = ref(false);
const currentUserName = ref<string | null>(null);
const organizations = ref<SessionOrganization[]>([]);
const mobileNavOpen = ref(false);

// Load pinned projects from localStorage
const loadPinnedProjects = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  const stored = localStorage.getItem('pinnedProjects');
  return stored ? new Set(JSON.parse(stored)) : new Set();
};

const pinnedProjectIds = ref<Set<string>>(new Set());

const currentProjectId = computed(() => {
  const param = route.params.id;
  return typeof param === 'string' ? param : null;
});

const currentProjectName = computed(() => {
  if (!currentProjectId.value) {
    return '';
  }

  return projects.value.find((project) => project.id === currentProjectId.value)?.name || 'Project';
});

const currentOrgName = computed(() => {
  return organizations.value.find((org) => org.is_active)?.name || organizations.value[0]?.name || '';
});

const sectionLabel = computed(() => {
  const path = route.path;

  if (path === '/projects') {
    return 'Projects';
  }

  if (path.startsWith('/notifications')) {
    return 'Notifications';
  }

  if (path.includes('/tasks/list')) {
    return 'Task List';
  }

  if (path.includes('/tasks/kanban')) {
    return 'Task Board';
  }

  if (path.includes('/tasks/calendar')) {
    return 'Task Calendar';
  }

  if (path.endsWith('/tasks')) {
    return 'Tasks';
  }

  if (path.includes('/documents/')) {
    return 'Document';
  }

  if (path.endsWith('/documents')) {
    return 'Documents';
  }

  if (currentProjectId.value) {
    return 'Project Overview';
  }

  return 'Workspace';
});

const loadShellData = async () => {
  try {
    const requests: Array<Promise<unknown>> = [
      api.get<{ data: ProjectSummary[] }>('/api/projects'),
      api.get<{ unread_count: number }>('/api/notifications')
    ];

    if (authEnabled.value) {
      requests.push(
        api.get<{
          data: {
            user: { name: string };
            organizations?: SessionOrganization[];
          };
        }>('/api/auth/session')
      );
    }

    const [projectResponse, notificationResponse, sessionResponse] = await Promise.all(requests);

    // Mark projects as pinned based on localStorage
    const projectsData = (projectResponse as { data: ProjectSummary[] }).data;
    projects.value = projectsData.map(project => ({
      ...project,
      pinned: pinnedProjectIds.value.has(project.id)
    }));

    unreadCount.value = (notificationResponse as { unread_count: number }).unread_count;
    currentUserName.value = (sessionResponse as { data?: { user?: { name?: string } } } | undefined)?.data?.user?.name || null;
    organizations.value = (sessionResponse as { data?: { organizations?: SessionOrganization[] } } | undefined)?.data?.organizations || [];

    if (currentProjectId.value) {
      const docResponse = await api.get<DocumentTreeResponse>(`/api/projects/${currentProjectId.value}/documents`);
      documentTree.value = docResponse.data.tree || [];
    } else {
      documentTree.value = [];
    }
  } catch {
    projects.value = [];
    documentTree.value = [];
    organizations.value = [];
    currentUserName.value = null;
  }
};

const togglePin = (projectId: string) => {
  if (pinnedProjectIds.value.has(projectId)) {
    pinnedProjectIds.value.delete(projectId);
  } else {
    pinnedProjectIds.value.add(projectId);
  }

  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('pinnedProjects', JSON.stringify(Array.from(pinnedProjectIds.value)));
  }

  // Update projects list
  projects.value = projects.value.map(project => ({
    ...project,
    pinned: pinnedProjectIds.value.has(project.id)
  }));
};

onMounted(() => {
  pinnedProjectIds.value = loadPinnedProjects();
});

watch(
  () => route.fullPath,
  () => {
    mobileNavOpen.value = false;
    loadShellData();
  },
  { immediate: true }
);

const openSearch = () => {
  searchOpen.value = true;
};

const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } finally {
    await navigateTo('/login');
  }
};

const switchOrg = async (orgId: string) => {
  await api.post('/api/auth/switch-org', { org_id: orgId });
  await navigateTo('/projects');
  await loadShellData();
};

const toggleMobileNav = () => {
  mobileNavOpen.value = !mobileNavOpen.value;
};
</script>

<template>
  <div :class="['app-shell', { 'mobile-nav-open': mobileNavOpen }]">
    <AppTopBar
      :section-label="sectionLabel"
      :current-project-name="currentProjectName"
      :current-org-name="currentOrgName"
      :organizations="organizations"
      :project-context="Boolean(currentProjectId)"
      :unread-count="unreadCount"
      :current-user-name="currentUserName"
      :auth-enabled="authEnabled"
      :mobile-nav-open="mobileNavOpen"
      @open-search="openSearch"
      @toggle-theme="toggleTheme"
      @open-ai="toggleAi"
      @switch-org="switchOrg"
      @logout="logout"
      @toggle-nav="toggleMobileNav"
    />

    <div class="app-body">
      <div
        v-if="mobileNavOpen"
        class="mobile-backdrop"
        @click="mobileNavOpen = false"
      />

      <AppSidebar
        class="shell-sidebar"
        :projects="projects"
        :current-project-id="currentProjectId"
        :document-tree="documentTree"
        @open-ai="toggleAi"
        @toggle-pin="togglePin"
      />

      <main class="main-content">
        <slot />
      </main>

      <AIChatPanel
        v-if="aiOpen"
        :open="aiOpen"
        :project-id="currentProjectId"
        @close="toggleAi"
      />
    </div>

    <SearchPalette :open="searchOpen" :project-id="currentProjectId" @close="searchOpen = false" />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--color-bg);
  padding: var(--space-10) var(--space-12);
}

/* Content centering and max-width */
.main-content > :deep(*) {
  max-width: var(--content-max-width);
  margin-left: auto;
  margin-right: auto;
}

.mobile-backdrop {
  position: fixed;
  top: var(--topbar-height);
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(22, 22, 22, 0.35);
  z-index: 30;
}

@media (max-width: 900px) {
  .main-content {
    padding: var(--space-6) var(--space-4);
  }

  .main-content > :deep(*) {
    max-width: 100%;
  }

  .shell-sidebar {
    position: fixed;
    top: var(--topbar-height);
    left: 0;
    bottom: 0;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform var(--transition-normal);
  }

  .mobile-nav-open .shell-sidebar {
    transform: translateX(0);
  }
}
</style>
