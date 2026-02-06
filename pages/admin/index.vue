<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
});

interface ActivityEntry {
  id: string;
  actor_id?: string;
  actor?: { id: string; email: string; name?: string } | null;
  action: string;
  target_type: string;
  target_id?: string;
  created_at: string;
}

interface Stats {
  org_id: string;
  user_count: number;
  project_count: number;
  task_count: number;
  document_count: number;
}

const api = useWorkbenchApi();

const loading = ref(true);
const statsLoading = ref(true);
const activityLoading = ref(true);
const error = ref<string | null>(null);

const stats = ref<Stats | null>(null);
const activity = ref<ActivityEntry[]>([]);

const statCards = computed(() => {
  if (!stats.value) return [];
  return [
    { value: stats.value.user_count, label: 'users', icon: 'users' },
    { value: stats.value.project_count, label: 'projects', icon: 'projects' },
    { value: stats.value.task_count, label: 'tasks', icon: 'tasks' },
    { value: stats.value.document_count, label: 'documents', icon: 'documents' }
  ];
});

const loadStats = async () => {
  statsLoading.value = true;
  try {
    const response = await api.get<{ data: Stats }>('/api/admin/stats');
    stats.value = response.data;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load stats';
  } finally {
    statsLoading.value = false;
  }
};

const loadActivity = async () => {
  activityLoading.value = true;
  try {
    const response = await api.get<{ data: ActivityEntry[] }>('/api/admin/activity?limit=10');
    activity.value = response.data;
  } catch (err) {
    // Non-critical, don't set error
    console.error('Failed to load activity:', err);
  } finally {
    activityLoading.value = false;
  }
};

const loadData = async () => {
  loading.value = true;
  error.value = null;

  await Promise.all([loadStats(), loadActivity()]);

  loading.value = false;
};

const getActorName = (entry: ActivityEntry): string => {
  if (entry.actor?.name) return entry.actor.name;
  if (entry.actor?.email) return entry.actor.email.split('@')[0];
  if (entry.actor_id) return entry.actor_id.slice(0, 8);
  return 'System';
};

const formatAction = (action: string): string => {
  return action.replace(/_/g, ' ');
};

const formatTargetType = (type: string): string => {
  return type.replace(/_/g, ' ');
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

onMounted(loadData);
</script>

<template>
  <div class="admin-dashboard">
    <UiPageHeader
      title="Admin Dashboard"
      subtitle="Organization overview and recent activity."
    />

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <p class="error-text">{{ error }}</p>
      <button type="button" class="retry-button" @click="loadData">
        Try again
      </button>
    </div>

    <template v-else>
      <!-- Stats Cards -->
      <section class="stats-section">
        <div v-if="statsLoading" class="loading-text">Loading stats...</div>

        <div v-else class="stats-grid">
          <div v-for="card in statCards" :key="card.label" class="stat-card">
            <div class="stat-icon-wrap">
              <!-- Users icon -->
              <svg v-if="card.icon === 'users'" class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <!-- Projects icon -->
              <svg v-else-if="card.icon === 'projects'" class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <!-- Tasks icon -->
              <svg v-else-if="card.icon === 'tasks'" class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <!-- Documents icon -->
              <svg v-else-if="card.icon === 'documents'" class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ card.value }}</span>
              <span class="stat-label">{{ card.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activity -->
      <section class="activity-section">
        <UiSectionHeader
          label="recent activity"
          link-text="view all"
          @link-click="navigateTo('/admin/activity')"
        />

        <div v-if="activityLoading" class="loading-text">Loading activity...</div>

        <div v-else-if="activity.length" class="activity-list">
          <div v-for="entry in activity" :key="entry.id" class="activity-item">
            <div class="activity-content">
              <span class="activity-actor">{{ getActorName(entry) }}</span>
              <span class="activity-action">{{ formatAction(entry.action) }}</span>
              <span class="activity-target">{{ formatTargetType(entry.target_type) }}</span>
            </div>
            <span class="activity-time">{{ formatTime(entry.created_at) }}</span>
          </div>
        </div>

        <div v-else class="empty-state">
          <p class="empty-text">No activity recorded yet.</p>
        </div>
      </section>

      <!-- Quick Links -->
      <section class="links-section">
        <UiSectionHeader label="quick actions" />

        <div class="links-grid">
          <NuxtLink to="/admin/members" class="link-card">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <div class="link-content">
              <span class="link-title">Manage Members</span>
              <span class="link-desc">Invite users and manage roles</span>
            </div>
          </NuxtLink>

          <NuxtLink to="/admin/activity" class="link-card">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <div class="link-content">
              <span class="link-title">View Activity Log</span>
              <span class="link-desc">See all organization activity</span>
            </div>
          </NuxtLink>

          <NuxtLink to="/admin/settings" class="link-card">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <div class="link-content">
              <span class="link-title">Organization Settings</span>
              <span class="link-desc">Configure workspace preferences</span>
            </div>
          </NuxtLink>

          <NuxtLink to="/projects" class="link-card">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <div class="link-content">
              <span class="link-title">Go to Projects</span>
              <span class="link-desc">Return to the main workspace</span>
            </div>
          </NuxtLink>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.admin-dashboard {
  max-width: var(--content-max-width);
}

/* Loading & Error States */
.loading-text {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-4) 0;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-12);
  text-align: center;
}

.error-text {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
}

.retry-button {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.retry-button:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

/* Stats Section */
.stats-section {
  margin-bottom: var(--space-12);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: border-color var(--transition-fast);
}

.stat-card:hover {
  border-color: var(--color-border-strong);
}

.stat-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-bg-hover);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.stat-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-secondary);
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 300;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--color-text);
}

.stat-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}

/* Activity Section */
.activity-section {
  margin-bottom: var(--space-12);
}

.activity-list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: var(--color-bg-hover);
}

.activity-content {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 13px;
  line-height: 1.4;
}

.activity-actor {
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-text);
}

.activity-action {
  font-family: var(--font-body);
  color: var(--color-text-secondary);
}

.activity-target {
  font-family: var(--font-body);
  font-weight: 500;
  color: var(--color-text);
}

.activity-time {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  margin-left: var(--space-4);
}

.empty-state {
  padding: var(--space-8);
  text-align: center;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

.empty-text {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
}

/* Quick Links Section */
.links-section {
  margin-bottom: var(--space-8);
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}

@media (max-width: 600px) {
  .links-grid {
    grid-template-columns: 1fr;
  }
}

.link-card {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.link-card:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

.link-icon {
  width: 24px;
  height: 24px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.link-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.link-title {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.link-desc {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
