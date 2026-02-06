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

const props = defineProps<{
  projects: ProjectSummary[];
  currentProjectId?: string | null;
  documentTree?: DocumentNode[];
}>();

const emit = defineEmits<{
  openAi: [];
  togglePin: [projectId: string];
}>();

const route = useRoute();

const projectsExpanded = ref(true);

const pinnedProjects = computed(() =>
  props.projects.filter(p => p.pinned)
);

const unpinnedProjects = computed(() =>
  props.projects.filter(p => !p.pinned)
);

const visibleProjects = computed(() => {
  if (projectsExpanded.value) {
    return props.projects;
  }
  return pinnedProjects.value;
});

const toggleProjectsSection = () => {
  projectsExpanded.value = !projectsExpanded.value;
};

const flattenedDocs = computed(() => {
  const rows: Array<{ id: string; title: string; depth: number }> = [];

  const walk = (nodes: DocumentNode[] = [], depth = 0) => {
    for (const node of nodes) {
      rows.push({
        id: node.id,
        title: node.title,
        depth
      });

      if (node.children?.length) {
        walk(node.children, depth + 1);
      }
    }
  };

  walk(props.documentTree || []);
  return rows;
});

const isActive = (path: string) => {
  return route.path === path;
};

const isActivePrefix = (prefix: string) => {
  return route.path.startsWith(prefix);
};
</script>

<template>
  <aside class="sidebar" aria-label="Primary navigation">
    <div class="sidebar-inner">
      <!-- AI Button -->
      <button type="button" class="ai-button" @click="emit('openAi')">
        <svg class="sparkle-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
          <path opacity="0.15" d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
          <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill="none" />
          <path opacity="0.3" d="M19 15L19.75 17.25L22 18L19.75 18.75L19 21L18.25 18.75L16 18L18.25 17.25L19 15Z" />
        </svg>
        <span>ask ai</span>
        <kbd>&#8984;J</kbd>
      </button>

      <div class="divider" />

      <!-- Workspace Section -->
      <section class="nav-section">
        <p class="section-label">workspace</p>
        <NuxtLink
          to="/notifications"
          class="nav-item"
          :class="{ active: isActive('/notifications') }"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span>notifications</span>
        </NuxtLink>
        <NuxtLink
          to="/users"
          class="nav-item"
          :class="{ active: isActive('/users') }"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>users</span>
        </NuxtLink>
        <NuxtLink
          to="/settings"
          class="nav-item"
          :class="{ active: isActive('/settings') }"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
          </svg>
          <span>settings</span>
        </NuxtLink>
      </section>

      <!-- Projects Section -->
      <section class="nav-section">
        <button
          type="button"
          class="section-header"
          @click="toggleProjectsSection"
        >
          <svg
            class="chevron-icon"
            :class="{ expanded: projectsExpanded }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span>projects</span>
        </button>
        <div v-if="visibleProjects.length > 0">
          <div
            v-for="project in visibleProjects"
            :key="project.id"
            class="nav-item-wrapper"
          >
            <NuxtLink
              :to="`/projects/${project.id}`"
              class="nav-item"
              :class="{ active: currentProjectId === project.id }"
            >
              <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span>{{ project.name }}</span>
            </NuxtLink>
            <button
              type="button"
              class="pin-button"
              :class="{ pinned: project.pinned }"
              :title="project.pinned ? 'Unpin project' : 'Pin project'"
              @click="emit('togglePin', project.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <!-- Project Context Sections -->
      <template v-if="currentProjectId">
        <!-- Views Section -->
        <section class="nav-section">
          <p class="section-label">views</p>
          <NuxtLink
            :to="`/projects/${currentProjectId}`"
            class="nav-item"
            :class="{ active: isActive(`/projects/${currentProjectId}`) }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>overview</span>
          </NuxtLink>
          <NuxtLink
            :to="`/projects/${currentProjectId}/tasks`"
            class="nav-item"
            :class="{ active: isActivePrefix(`/projects/${currentProjectId}/tasks`) }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <span>tasks</span>
          </NuxtLink>
          <NuxtLink
            :to="`/projects/${currentProjectId}/documents`"
            class="nav-item"
            :class="{ active: isActivePrefix(`/projects/${currentProjectId}/documents`) }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            <span>documents</span>
          </NuxtLink>
        </section>

        <!-- Task Views Section -->
        <section class="nav-section">
          <p class="section-label">task views</p>
          <NuxtLink
            :to="`/projects/${currentProjectId}/tasks/list`"
            class="nav-item nav-item--indent"
            :class="{ active: isActive(`/projects/${currentProjectId}/tasks/list`) }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span>list</span>
          </NuxtLink>
          <NuxtLink
            :to="`/projects/${currentProjectId}/tasks/kanban`"
            class="nav-item nav-item--indent"
            :class="{ active: isActive(`/projects/${currentProjectId}/tasks/kanban`) }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="4" y="4" width="4" height="16" rx="1" />
              <rect x="10" y="4" width="4" height="10" rx="1" />
              <rect x="16" y="4" width="4" height="14" rx="1" />
            </svg>
            <span>kanban</span>
          </NuxtLink>
          <NuxtLink
            :to="`/projects/${currentProjectId}/tasks/calendar`"
            class="nav-item nav-item--indent"
            :class="{ active: isActive(`/projects/${currentProjectId}/tasks/calendar`) }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>calendar</span>
          </NuxtLink>
        </section>

        <!-- Documents Section -->
        <section v-if="flattenedDocs.length > 0" class="nav-section">
          <p class="section-label">documents</p>
          <NuxtLink
            v-for="doc in flattenedDocs"
            :key="doc.id"
            :to="`/projects/${currentProjectId}/documents/${doc.id}`"
            class="nav-item nav-item--indent"
            :class="{ active: isActive(`/projects/${currentProjectId}/documents/${doc.id}`) }"
            :style="{ paddingLeft: `${32 + doc.depth * 12}px` }"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            <span class="doc-title">{{ doc.title }}</span>
          </NuxtLink>
        </section>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-inner {
  padding: var(--space-3) 0;
}

/* AI Button */
.ai-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: calc(100% - var(--space-6));
  margin: 0 var(--space-3) var(--space-3);
  padding: var(--space-3) 14px;
  background: var(--color-ai-bg);
  border: 1px solid var(--color-ai-border);
  border-radius: var(--radius-xl);
  box-shadow: 0 0 0 1px var(--color-ai-glow), 0 2px 8px var(--color-ai-glow);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.ai-button:hover {
  background: var(--color-bg-hover);
}

.ai-button .sparkle-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.ai-button kbd {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

/* Divider */
.divider {
  height: 1px;
  margin: 0 var(--space-3) var(--space-3);
  background: var(--color-border);
}

/* Nav Section */
.nav-section {
  margin-bottom: var(--space-4);
}

.section-label {
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

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-3) var(--space-3) var(--space-1);
  padding-left: 20px;
  background: none;
  border: none;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.14em;
  color: var(--color-text-tertiary);
  opacity: 0.4;
  text-transform: lowercase;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.section-header:hover {
  opacity: 0.6;
}

.chevron-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.chevron-icon.expanded {
  transform: rotate(90deg);
}

/* Nav Item */
.nav-item-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin: 0 var(--space-3);
}

.nav-item-wrapper:hover .pin-button {
  opacity: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
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

.nav-section > .nav-item {
  margin: 0 var(--space-3);
}

.nav-item-wrapper .nav-item {
  flex: 1;
  margin: 0;
}

.nav-item:hover {
  background: var(--color-bg-sidebar-hover);
}

.nav-item.active {
  background: var(--color-bg-sidebar-active);
  color: var(--color-text);
  font-weight: 500;
}

.nav-item--indent {
  padding-left: 32px;
}

.pin-button {
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-tertiary);
  opacity: 0;
  cursor: pointer;
  transition: opacity var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
}

.pin-button:hover {
  background: var(--color-bg-sidebar-hover);
  color: var(--color-text-secondary);
}

.pin-button.pinned {
  opacity: 1;
  color: var(--color-text);
}

.pin-button svg {
  width: 14px;
  height: 14px;
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

.doc-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
