<script setup lang="ts">
interface ProjectItem {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  role?: string | null;
  open_tasks?: number;
  document_count?: number;
}

const api = useWorkbenchApi();
const projects = ref<ProjectItem[]>([]);
const loading = ref(true);
const creating = ref(false);
const showCreate = ref(false);
const errorMessage = ref('');

const createForm = reactive({
  name: '',
  description: '',
  icon: '',
  color: '#5a5a5a'
});

const toNeutralGrayHex = (hex: string): string => {
  const normalized = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return '#5a5a5a';
  }

  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const avg = Math.round((r + g + b) / 3);
  const gray = avg.toString(16).padStart(2, '0');
  return `#${gray}${gray}${gray}`;
};

const normalizeDraftColor = () => {
  createForm.color = toNeutralGrayHex(createForm.color);
};

const loadProjects = async () => {
  loading.value = true;

  try {
    const response = await api.get<{ data: ProjectItem[] }>('/api/projects');
    projects.value = response.data;
  } finally {
    loading.value = false;
  }
};

const createProject = async () => {
  const name = createForm.name.trim();

  if (!name || creating.value) {
    return;
  }

  creating.value = true;
  errorMessage.value = '';

  try {
    const response = await api.post<{ data: { id: string } }>('/api/projects', {
      name,
      description: createForm.description,
      icon: createForm.icon.trim().slice(0, 4) || name.slice(0, 2).toUpperCase(),
      color: toNeutralGrayHex(createForm.color)
    });

    createForm.name = '';
    createForm.description = '';
    createForm.icon = '';
    await loadProjects();
    await navigateTo(`/projects/${response.data.id}`);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to create project.';
  } finally {
    creating.value = false;
  }
};

const projectTotals = computed(() => ({
  projects: projects.value.length,
  openTasks: projects.value.reduce((sum, project) => sum + (project.open_tasks || 0), 0),
  documents: projects.value.reduce((sum, project) => sum + (project.document_count || 0), 0)
}));

const getProjectCode = (project: ProjectItem): string => {
  if (project.icon) return project.icon.slice(0, 2).toUpperCase();
  return project.name.slice(0, 2).toUpperCase();
};

onMounted(loadProjects);
</script>

<template>
  <div class="projects-page">
    <!-- Header -->
    <UiPageHeader
      title="Projects"
      subtitle="Manage active workspaces and route people into the right operational context."
    />

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stats">
        <span class="stat">{{ projectTotals.projects }} projects</span>
        <span class="stat-divider">·</span>
        <span class="stat">{{ projectTotals.openTasks }} open tasks</span>
        <span class="stat-divider">·</span>
        <span class="stat">{{ projectTotals.documents }} docs</span>
      </div>
      <button
        type="button"
        class="toggle-btn"
        @click="showCreate = !showCreate"
      >
        {{ showCreate ? 'hide form' : 'new project' }}
      </button>
    </div>

    <!-- Create Project Form -->
    <section v-if="showCreate" class="create-section">
      <UiSectionHeader label="create project" />

      <form class="create-form" @submit.prevent="createProject">
        <div class="form-row">
          <label class="form-field form-field--grow">
            <span class="field-label">project name</span>
            <input
              v-model="createForm.name"
              class="field-input"
              type="text"
              placeholder="e.g. Q1 Marketing Campaign"
              required
            />
          </label>

          <label class="form-field form-field--small">
            <span class="field-label">code</span>
            <input
              v-model="createForm.icon"
              class="field-input"
              type="text"
              maxlength="4"
              placeholder="AUTO"
            />
          </label>

          <label class="form-field form-field--small">
            <span class="field-label">color</span>
            <div class="color-input-wrapper">
              <input
                v-model="createForm.color"
                class="field-input field-input--color"
                type="color"
                @change="normalizeDraftColor"
              />
              <span class="color-value">{{ createForm.color }}</span>
            </div>
          </label>
        </div>

        <label class="form-field">
          <span class="field-label">description</span>
          <textarea
            v-model="createForm.description"
            class="field-textarea"
            rows="2"
            placeholder="What is this project responsible for?"
          />
        </label>

        <div class="form-actions">
          <PrimaryButton
            :label="creating ? 'creating...' : 'create project'"
            :disabled="creating || !createForm.name.trim()"
            @click="createProject"
          >
            <template #icon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </template>
          </PrimaryButton>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </div>
      </form>
    </section>

    <!-- Project Directory -->
    <section class="directory-section">
      <UiSectionHeader label="project directory" />

      <p v-if="loading" class="loading-text">Loading projects...</p>

      <div v-else-if="projects.length" class="project-table">
        <div class="table-header">
          <div class="col col-project">project</div>
          <div class="col col-role">role</div>
          <div class="col col-tasks">tasks</div>
          <div class="col col-docs">docs</div>
          <div class="col col-description">description</div>
          <div class="col col-action" />
        </div>

        <div class="table-body">
          <div
            v-for="project in projects"
            :key="project.id"
            class="table-row"
            @click="navigateTo(`/projects/${project.id}`)"
          >
            <div class="col col-project">
              <span
                class="project-icon"
                :style="{ backgroundColor: project.color || '#5a5a5a' }"
              >
                {{ getProjectCode(project) }}
              </span>
              <span class="project-name">{{ project.name }}</span>
            </div>
            <div class="col col-role">
              <span class="role-badge">{{ project.role || 'member' }}</span>
            </div>
            <div class="col col-tasks">{{ project.open_tasks || 0 }}</div>
            <div class="col col-docs">{{ project.document_count || 0 }}</div>
            <div class="col col-description">{{ project.description || '—' }}</div>
            <div class="col col-action">
              <NuxtLink :to="`/projects/${project.id}`" class="open-link" @click.stop>
                open →
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>No projects yet. Create one to start planning tasks and documents.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.projects-page {
  max-width: var(--content-max-width);
}

/* Stats Bar */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.stats {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stat {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.stat-divider {
  color: var(--color-text-tertiary);
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.toggle-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

/* Create Section */
.create-section {
  margin-bottom: var(--space-10);
  padding: var(--space-6);
  background: var(--color-bg-surface);
  border-radius: var(--radius-lg);
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-row {
  display: flex;
  gap: var(--space-4);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-field--grow {
  flex: 1;
}

.form-field--small {
  width: 120px;
  flex-shrink: 0;
}

.field-label {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.field-input {
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
}

.field-input::placeholder {
  color: var(--color-text-tertiary);
}

.field-input:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.field-input--color {
  width: 32px;
  height: 32px;
  padding: 2px;
  cursor: pointer;
}

.color-value {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.field-textarea {
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
  resize: vertical;
  min-height: 60px;
}

.field-textarea::placeholder {
  color: var(--color-text-tertiary);
}

.field-textarea:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

.form-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-2);
}

.error-message {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text);
}

/* Directory Section */
.directory-section {
  margin-top: var(--space-6);
}

.loading-text {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-4) 0;
}

/* Project Table */
.project-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 2fr 100px 80px 80px 1fr 80px;
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
}

.table-header .col {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
}

.table-body {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 100px 80px 80px 1fr 80px;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: var(--color-bg-hover);
}

.col {
  display: flex;
  align-items: center;
}

.col-project {
  gap: var(--space-3);
}

.project-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-inverse);
  flex-shrink: 0;
}

.project-name {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.role-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding: 2px var(--space-2);
  background: var(--color-bg-surface);
  border-radius: var(--radius-xs);
}

.col-tasks,
.col-docs {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.col-description {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: var(--space-4);
}

.open-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: 0 var(--space-2);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.open-link:hover {
  color: var(--color-text);
}

@media (max-width: 900px) {
  .open-link {
    min-height: 44px;
    padding: 0 var(--space-2);
  }
}

/* Empty State */
.empty-state {
  padding: var(--space-12) var(--space-6);
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.empty-state p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
}
</style>

