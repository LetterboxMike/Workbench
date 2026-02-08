<script setup lang="ts">
import type { Task, ProjectMember, User, Document, ActivityLog } from '~/types/domain';

interface MemberWithUser extends ProjectMember {
  user: User | null;
}

interface ActivityWithUser extends ActivityLog {
  user?: User | null;
}

const route = useRoute();
const api = useWorkbenchApi();

const projectId = computed(() => route.params.id as string);

// Tab state
type Tab = 'overview' | 'members';
const activeTab = ref<Tab>('overview');

const tabs = [
  { key: 'overview', label: 'overview' },
  { key: 'members', label: 'members' }
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
    completed_tasks?: number;
    in_progress_tasks?: number;
  };
} | null>(null);

const documents = ref<Document[]>([]);
const tasks = ref<Task[]>([]);
const activity = ref<ActivityWithUser[]>([]);
const members = ref<MemberWithUser[]>([]);

// User lookup map from members
const userMap = computed(() => {
  const map = new Map<string, User>();
  for (const member of members.value) {
    if (member.user) {
      map.set(member.user_id, member.user);
    }
  }
  return map;
});

// Get user name by ID
const getUserName = (userId: string): string => {
  const user = userMap.value.get(userId);
  return user?.name || 'Unknown';
};

// Stats for the Overview section - now showing: total tasks, completed, in progress, documents
const stats = computed(() => {
  const totalTasks = project.value?.metrics?.tasks || 0;
  const completedTasks = tasks.value.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.value.filter(t => t.status === 'in_progress').length;
  const docCount = project.value?.metrics?.documents || 0;

  return [
    { value: totalTasks, label: 'total tasks' },
    { value: completedTasks, label: 'completed' },
    { value: inProgressTasks, label: 'in progress' },
    { value: docCount, label: 'documents' }
  ];
});

// Activity feed limited to 5 items
const recentActivity = computed(() => activity.value.slice(0, 5));
const hasMoreActivity = computed(() => activity.value.length > 5);

// Documents sorted by updated_at descending, limited to 5 items
const recentDocuments = computed(() => {
  return [...documents.value]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);
});
const hasMoreDocuments = computed(() => documents.value.length > 5);

const load = async () => {
  loading.value = true;

  const [projectResult, documentResult, taskResult, activityResult, membersResult] = await Promise.allSettled([
    api.get<{ data: typeof project.value }>(`/api/projects/${projectId.value}`),
    api.get<{ data: { flat: Document[]; tree: unknown[] } }>(`/api/projects/${projectId.value}/documents`),
    api.get<{ data: Task[] }>(`/api/projects/${projectId.value}/tasks`),
    api.get<{ data: ActivityWithUser[] }>(`/api/projects/${projectId.value}/activity`),
    api.get<{ data: MemberWithUser[] }>(`/api/projects/${projectId.value}/members`)
  ]);

  if (projectResult.status === 'fulfilled') {
    const projectResponse = projectResult.value;
    if (projectResponse && typeof projectResponse === 'object' && 'data' in projectResponse) {
      project.value = projectResponse.data || null;
    } else {
      project.value = projectResponse as typeof project.value;
    }
  } else {
    console.error('Failed to load project details:', projectResult.reason);
    project.value = null;
  }

  if (documentResult.status === 'fulfilled') {
    const docsList = documentResult.value?.data?.flat;
    documents.value = Array.isArray(docsList) ? docsList : [];
  } else {
    console.error('Failed to load project documents:', documentResult.reason);
    documents.value = [];
  }

  if (taskResult.status === 'fulfilled') {
    tasks.value = Array.isArray(taskResult.value?.data) ? taskResult.value.data : [];
  } else {
    console.error('Failed to load project tasks:', taskResult.reason);
    tasks.value = [];
  }

  if (activityResult.status === 'fulfilled') {
    activity.value = Array.isArray(activityResult.value?.data) ? activityResult.value.data : [];
  } else {
    console.error('Failed to load project activity:', activityResult.reason);
    activity.value = [];
  }

  if (membersResult.status === 'fulfilled') {
    members.value = Array.isArray(membersResult.value?.data) ? membersResult.value.data : [];
  } else {
    console.error('Failed to load project members:', membersResult.reason);
    members.value = [];
  }

  loading.value = false;
};

// Load data when projectId changes or on mount
watch(projectId, load, { immediate: true });

// Also load on mounted as a backup for client-side navigation
onMounted(() => {
  if (!project.value && projectId.value) {
    load();
  }
});

const navigateToDoc = (docId: string) => {
  navigateTo(`/projects/${projectId.value}/documents/${docId}`);
};

const navigateToTask = (taskId: string) => {
  navigateTo(`/projects/${projectId.value}/tasks/list?task=${taskId}`);
};

const navigateToTasks = () => {
  navigateTo(`/projects/${projectId.value}/tasks/list`);
};

const navigateToDocuments = () => {
  navigateTo(`/projects/${projectId.value}/documents`);
};

const createDocument = () => {
  navigateTo(`/projects/${projectId.value}/documents?new=true`);
};

// Get user name from activity
const getActorName = (entry: ActivityWithUser): string => {
  if (entry.user?.name) return entry.user.name;
  if (entry.actor_type === 'ai') return 'AI Assistant';
  if (entry.actor_type === 'system') return 'System';
  return 'Unknown';
};

const getActorAvatar = (entry: ActivityWithUser): string | null => {
  return entry.user?.avatar_url || null;
};

const formatActivityAction = (entry: ActivityWithUser): string => {
  return `${entry.action} ${entry.target_type}`;
};
</script>

<template>
  <div class="overview-page">
    <!-- Page Header -->
    <header class="page-header">
      <h1 class="page-title">{{ project?.name || 'Project' }}</h1>
      <ViewTabs
        :tabs="tabs"
        :active="activeTab"
        @change="activeTab = $event as Tab"
      />
    </header>

    <!-- Overview Tab Content -->
    <template v-if="activeTab === 'overview'">
      <div v-if="loading" class="loading">loading...</div>

      <template v-else>
        <!-- Top Section: 2-Column Layout -->
        <div class="top-section">
          <!-- Left Column: Overview Stats -->
          <div class="stats-column">
            <OverviewStats :stats="stats" layout="grid" />
          </div>

          <!-- Right Column: Activity Feed -->
          <div class="activity-column">
            <div class="section-header">
              <span class="section-label">recent activity</span>
            </div>

            <div v-if="recentActivity.length" class="activity-list">
              <ActivityItem
                v-for="entry in recentActivity"
                :key="entry.id"
                :actor="getActorName(entry)"
                :actor-avatar="getActorAvatar(entry)"
                :action="formatActivityAction(entry)"
                :timestamp="entry.created_at"
              />
            </div>

            <div v-else class="empty-state">
              <span class="empty-text">no activity yet</span>
              <span class="empty-hint">activity will appear as you create tasks and documents</span>
            </div>

            <GhostButton
              v-if="hasMoreActivity"
              label="view all"
              class="view-all-btn"
              @click="navigateTo(`/projects/${projectId}/activity`)"
            />
          </div>
        </div>

        <!-- Tasks Due Section -->
        <TasksDueSection
          :tasks="tasks"
          @task-click="navigateToTask"
          @view-all="navigateToTasks"
        />

        <!-- Recent Documents Section -->
        <section class="documents-section">
          <SectionHeader
            label="recent documents"
            :link-text="hasMoreDocuments ? 'view all' : undefined"
            @link-click="navigateToDocuments"
          />

          <div v-if="recentDocuments.length" class="document-list">
            <DocListItem
              v-for="doc in recentDocuments"
              :key="doc.id"
              :title="doc.title"
              :updated-at="doc.updated_at"
              :owner="getUserName(doc.created_by)"
              @click="navigateToDoc(doc.id)"
            />
          </div>

          <DashedButton
            v-else
            label="create first document"
            @click="createDocument"
          />
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
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 48px;
}

/* Page Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title {
  font-family: var(--font-body);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-text);
  margin: 0;
}

/* Loading State */
.loading {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: 32px 0;
}

/* Top Section: 2-Column Grid */
.top-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  margin-bottom: 32px;
}

/* Stats Column */
.stats-column {
  padding-top: 8px;
}

/* Activity Column */
.activity-column {
  display: flex;
  flex-direction: column;
}

.section-header {
  margin-bottom: 16px;
}

.section-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 300;
  letter-spacing: 0.08em;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
}

.activity-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-text {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.empty-hint {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  opacity: 0.4;
}

.view-all-btn {
  align-self: flex-end;
}

/* Documents Section */
.documents-section {
  margin-top: 32px;
}

.document-list {
  display: flex;
  flex-direction: column;
}

/* Responsive */
@media (max-width: 768px) {
  .overview-page {
    padding: 24px;
  }

  .top-section {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>
