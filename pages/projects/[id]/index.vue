<script setup lang="ts">
import type { Task } from '~/types/domain';

const route = useRoute();
const api = useWorkbenchApi();

const projectId = computed(() => route.params.id as string);

// Tab state
type Tab = 'overview' | 'members';
const activeTab = ref<Tab>('overview');

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' }
];
const loading = ref(true);

const project = ref<{
  id: string;
  name: string;
  description?: string | null;
  metrics?: {
    documents: number;
    tasks: number;
    open_tasks: number;
    overdue_tasks: number;
  };
} | null>(null);

const documents = ref<Array<{ id: string; title: string; updated_at: string }>>([]);
const tasks = ref<Task[]>([]);
const activity = ref<Array<{ id: string; actor_id: string; action: string; target_type: string; target_id: string; created_at: string }>>([]);

const stats = computed(() => [
  { value: project.value?.metrics?.documents || 0, label: 'documents' },
  { value: project.value?.metrics?.tasks || 0, label: 'total tasks' },
  { value: project.value?.metrics?.open_tasks || 0, label: 'open tasks' },
  { value: project.value?.metrics?.overdue_tasks || 0, label: 'overdue' }
]);

const load = async () => {
  loading.value = true;

  try {
    const [projectResponse, documentResponse, taskResponse, activityResponse] = await Promise.all([
      api.get<{ data: typeof project.value }>(`/api/projects/${projectId.value}`),
      api.get<{ data: { flat: Array<{ id: string; title: string; updated_at: string }> } }>(`/api/projects/${projectId.value}/documents`),
      api.get<{ data: Task[] }>(`/api/projects/${projectId.value}/tasks`),
      api.get<{ data: typeof activity.value }>(`/api/projects/${projectId.value}/activity`)
    ]);

    project.value = projectResponse.data;
    documents.value = documentResponse.data.flat.slice(0, 6);
    tasks.value = taskResponse.data.slice(0, 8);
    activity.value = activityResponse.data.slice(0, 10);
  } finally {
    loading.value = false;
  }
};

watch(projectId, load, { immediate: true });

const navigateToDoc = (docId: string) => {
  navigateTo(`/projects/${projectId.value}/documents/${docId}`);
};

const navigateToTask = (taskId: string) => {
  navigateTo(`/projects/${projectId.value}/tasks/list?task=${taskId}`);
};
</script>

<template>
  <div class="overview-page">
    <UiPageHeader
      :title="project?.name || 'Project Overview'"
      :subtitle="project?.description || 'No project description yet.'"
    />

    <!-- Tab Navigation -->
    <nav class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- Overview Tab Content -->
    <template v-if="activeTab === 'overview'">
      <div v-if="loading" class="loading">Loading project dashboard...</div>

      <template v-else>
      <!-- Stats -->
      <ViewsOverviewStats :stats="stats" />

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Left Column -->
        <div class="column">
          <!-- Recent Documents -->
          <section class="section">
            <UiSectionHeader
              label="recent documents"
              link-text="view all"
              @link-click="navigateTo(`/projects/${projectId}/documents`)"
            />

            <div v-if="documents.length" class="list">
              <ViewsDocListItem
                v-for="doc in documents"
                :key="doc.id"
                :title="doc.title"
                :updated-at="doc.updated_at"
                @click="navigateToDoc(doc.id)"
              />
            </div>

            <p v-else class="empty-text">No documents yet. Create one from the documents view.</p>
          </section>
        </div>

        <!-- Right Column -->
        <div class="column">
          <!-- Task Snapshot -->
          <section class="section">
            <UiSectionHeader
              label="task snapshot"
              link-text="view all"
              @link-click="navigateTo(`/projects/${projectId}/tasks/list`)"
            />

            <div v-if="tasks.length" class="list">
              <ViewsTaskSnapshotItem
                v-for="task in tasks"
                :key="task.id"
                :task="task"
                @click="navigateToTask(task.id)"
              />
            </div>

            <p v-else class="empty-text">No tasks yet. Start in list view to create and assign work.</p>
          </section>
        </div>
      </div>

      <!-- Activity Section -->
      <section class="section activity-section">
        <UiSectionHeader label="recent activity" />

        <div v-if="activity.length" class="list">
          <ViewsActivityItem
            v-for="entry in activity"
            :key="entry.id"
            :actor="entry.actor_id"
            :action="entry.action"
            :target="entry.target_type"
            :timestamp="entry.created_at"
          />
        </div>

        <p v-else class="empty-text">No activity yet.</p>
      </section>
      </template>
    </template>

    <!-- Members Tab Content -->
    <template v-if="activeTab === 'members'">
      <ProjectMemberList :project-id="projectId" />
    </template>
  </div>
</template>

<style scoped>
.overview-page {
  max-width: var(--content-max-width);
}

.tab-nav {
  display: flex;
  gap: var(--space-1);
  margin-bottom: var(--space-6);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-2);
}

.tab-button {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.tab-button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.tab-button.active {
  background: var(--color-bg-active);
  color: var(--color-text);
  font-weight: 500;
}

.loading {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  margin-bottom: var(--space-12);
}

.section {
  margin-bottom: var(--space-8);
}

.activity-section {
  margin-top: var(--space-12);
}

.list {
  display: flex;
  flex-direction: column;
}

.empty-text {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-4) 0;
}
</style>
