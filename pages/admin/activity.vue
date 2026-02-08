<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin']
});

interface ActivityEntry {
  id: string;
  org_id: string;
  project_id?: string | null;
  actor_id?: string | null;
  actor_type: 'user' | 'ai' | 'system';
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: { id: string; email: string; name?: string; display_name?: string } | null;
}

interface PaginationInfo {
  limit: number;
  offset: number;
  has_more: boolean;
}

const api = useWorkbenchApi();

const loading = ref(true);
const exportingCsv = ref(false);
const error = ref<string | null>(null);

const activity = ref<ActivityEntry[]>([]);
const pagination = ref<PaginationInfo>({ limit: 50, offset: 0, has_more: false });

// Filters
const actionFilter = ref('all');
const targetTypeFilter = ref('all');

// Pagination
const pageSize = 50;
const currentPage = computed(() => Math.floor(pagination.value.offset / pageSize) + 1);

const actionOptions = [
  { value: 'all', label: 'All Actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' }
];

const targetTypeOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'project', label: 'Project' },
  { value: 'task', label: 'Task' },
  { value: 'document', label: 'Document' },
  { value: 'comment', label: 'Comment' },
  { value: 'user', label: 'User' },
  { value: 'org_member', label: 'Member' }
];

const loadActivity = async (offset = 0) => {
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();
    params.set('limit', String(pageSize));
    params.set('offset', String(offset));

    if (actionFilter.value !== 'all') {
      params.set('action', actionFilter.value);
    }
    if (targetTypeFilter.value !== 'all') {
      params.set('target_type', targetTypeFilter.value);
    }

    const response = await api.get<{ data: ActivityEntry[]; pagination: PaginationInfo }>(
      `/api/admin/activity?${params.toString()}`
    );
    activity.value = response.data;
    pagination.value = response.pagination;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load activity log.';
  } finally {
    loading.value = false;
  }
};

const goToPreviousPage = () => {
  const newOffset = Math.max(0, pagination.value.offset - pageSize);
  loadActivity(newOffset);
};

const goToNextPage = () => {
  if (pagination.value.has_more) {
    loadActivity(pagination.value.offset + pageSize);
  }
};

const applyFilters = () => {
  loadActivity(0);
};

const getActorName = (entry: ActivityEntry): string => {
  if (entry.actor_type === 'system') return 'System';
  if (entry.actor_type === 'ai') return 'AI Assistant';
  if (entry.actor?.display_name) return entry.actor.display_name;
  if (entry.actor?.name) return entry.actor.name;
  if (entry.actor?.email) return entry.actor.email.split('@')[0];
  if (entry.actor_id) return entry.actor_id.slice(0, 8);
  return 'Unknown';
};

const getActorBadgeClass = (entry: ActivityEntry): string => {
  if (entry.actor_type === 'system') return 'actor-badge--system';
  if (entry.actor_type === 'ai') return 'actor-badge--ai';
  return 'actor-badge--user';
};

const formatAction = (action: string): string => {
  return action.replace(/_/g, ' ');
};

const formatTargetType = (type: string): string => {
  return type.replace(/_/g, ' ');
};

const truncateId = (id: string): string => {
  return id.length > 8 ? id.slice(0, 8) + '...' : id;
};

const formatDateTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const exportToCsv = async () => {
  if (exportingCsv.value) {
    return;
  }

  exportingCsv.value = true;

  try {
    const params = new URLSearchParams();
    params.set('format', 'csv');

    if (actionFilter.value !== 'all') {
      params.set('action', actionFilter.value);
    }
    if (targetTypeFilter.value !== 'all') {
      params.set('target_type', targetTypeFilter.value);
    }

    const response = await fetch(`/api/admin/activity?${params.toString()}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to export activity CSV.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const disposition = response.headers.get('content-disposition') || '';
    const matched = disposition.match(/filename="?([^"]+)"?/);
    const filename = matched?.[1] || `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to export activity CSV.';
  } finally {
    exportingCsv.value = false;
  }
};

// Watch for filter changes
watch([actionFilter, targetTypeFilter], () => {
  applyFilters();
});

onMounted(() => loadActivity(0));
</script>

<template>
  <div class="activity-page">
    <UiPageHeader
      title="Activity Log"
      subtitle="View all activity across the organization."
    >
      <template #right>
        <button type="button" class="export-button" :disabled="exportingCsv" @click="exportToCsv">
          <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {{ exportingCsv ? 'Exporting...' : 'Export CSV' }}
        </button>
      </template>
    </UiPageHeader>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group">
        <label class="filter-label" for="action-filter">Action</label>
        <select
          id="action-filter"
          v-model="actionFilter"
          class="filter-select"
        >
          <option v-for="option in actionOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label" for="target-filter">Target Type</label>
        <select
          id="target-filter"
          v-model="targetTypeFilter"
          class="filter-select"
        >
          <option v-for="option in targetTypeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-banner">
      <span>{{ error }}</span>
      <button type="button" class="error-dismiss" @click="error = null; loadActivity(0)">
        Retry
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-text">Loading activity log...</div>

    <!-- Activity Table -->
    <section v-else class="activity-section">
      <UiSectionHeader label="activity entries" />

      <div v-if="activity.length" class="activity-table">
        <div class="table-header">
          <div class="col col-datetime">date/time</div>
          <div class="col col-actor">actor</div>
          <div class="col col-action">action</div>
          <div class="col col-target-type">target type</div>
          <div class="col col-target-id">target id</div>
        </div>

        <div class="table-body">
          <div
            v-for="entry in activity"
            :key="entry.id"
            class="table-row"
          >
            <div class="col col-datetime">
              <span class="datetime-text">{{ formatDateTime(entry.created_at) }}</span>
            </div>

            <div class="col col-actor">
              <span class="actor-badge" :class="getActorBadgeClass(entry)">
                {{ getActorName(entry) }}
              </span>
            </div>

            <div class="col col-action">
              <span class="action-text">{{ formatAction(entry.action) }}</span>
            </div>

            <div class="col col-target-type">
              <span class="target-type-text">{{ formatTargetType(entry.target_type) }}</span>
            </div>

            <div class="col col-target-id">
              <span class="target-id-text" :title="entry.target_id">
                {{ truncateId(entry.target_id) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <p>No activity entries found.</p>
        <p v-if="actionFilter !== 'all' || targetTypeFilter !== 'all'" class="empty-hint">
          Try adjusting your filters.
        </p>
      </div>

      <!-- Pagination -->
      <div v-if="activity.length" class="pagination-bar">
        <div class="pagination-info">
          Page {{ currentPage }}
        </div>

        <div class="pagination-controls">
          <button
            type="button"
            class="pagination-button"
            :disabled="pagination.offset === 0"
            @click="goToPreviousPage"
          >
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Previous
          </button>

          <button
            type="button"
            class="pagination-button"
            :disabled="!pagination.has_more"
            @click="goToNextPage"
          >
            Next
            <svg class="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.activity-page {
  max-width: var(--content-max-width);
}

/* Export Button */
.export-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.export-button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
  border-color: var(--color-border-strong);
}

.export-button .button-icon {
  width: 14px;
  height: 14px;
}

/* Filters Bar */
.filters-bar {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.filter-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
}

.filter-select {
  min-height: 44px;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text);
  cursor: pointer;
  transition: border-color var(--transition-fast);
  min-width: 150px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-border-strong);
}

/* Error Banner */
.error-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.error-dismiss {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-1) var(--space-2);
  background: transparent;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.error-dismiss:hover {
  background: var(--color-bg-hover);
}

/* Loading State */
.loading-text {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

/* Activity Section */
.activity-section {
  margin-top: var(--space-2);
}

/* Activity Table */
.activity-table {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 180px 1fr 100px 120px 100px;
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
  grid-template-columns: 180px 1fr 100px 120px 100px;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
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

/* DateTime Column */
.datetime-text {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* Actor Badge */
.actor-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actor-badge--user {
  background: var(--color-bg-surface);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.actor-badge--ai {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.actor-badge--system {
  background: var(--color-bg-surface);
  color: var(--color-text-tertiary);
  border: 1px solid var(--color-border);
}

/* Action Text */
.action-text {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text);
  text-transform: capitalize;
}

/* Target Type */
.target-type-text {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

/* Target ID */
.target-id-text {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  cursor: default;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-6);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  text-align: center;
}

.empty-icon {
  width: 32px;
  height: 32px;
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

.empty-state p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
  margin: 0;
}

.empty-hint {
  font-size: 12px !important;
  opacity: 0.7;
}

/* Pagination Bar */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--space-4);
  padding: var(--space-3) 0;
}

.pagination-info {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.pagination-controls {
  display: flex;
  gap: var(--space-2);
}

.pagination-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}

.pagination-button:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text);
  border-color: var(--color-border-strong);
}

.pagination-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.pagination-button .button-icon {
  width: 14px;
  height: 14px;
}

/* Responsive */
@media (max-width: 900px) {
  .table-header,
  .table-row {
    grid-template-columns: 150px 1fr 80px 100px 80px;
  }
}

@media (max-width: 700px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }

  .table-header {
    display: none;
  }

  .table-row {
    padding: var(--space-4);
  }

  .col {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }

  .col::before {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 300;
    letter-spacing: 0.06em;
    color: var(--color-text-tertiary);
    text-transform: lowercase;
  }

  .col-datetime::before {
    content: 'date/time';
  }

  .col-actor::before {
    content: 'actor';
  }

  .col-action::before {
    content: 'action';
  }

  .col-target-type::before {
    content: 'target type';
  }

  .col-target-id::before {
    content: 'target id';
  }
}
</style>
