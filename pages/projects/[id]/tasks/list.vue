<script setup lang="ts">
import type { Task } from '~/types/domain';

const route = useRoute();
const router = useRouter();
const api = useWorkbenchApi();

const projectId = computed(() => route.params.id as string);
const loading = ref(true);

const tasks = ref<Task[]>([]);

const filters = reactive({
  status: '',
  priority: '',
  q: ''
});

const selected = ref<string[]>([]);
const draft = ref('');

const hasSelection = computed(() => selected.value.length > 0);
const isTaskSelected = (taskId: string) => selected.value.includes(taskId);

const viewTabs = [
  { key: 'list', label: 'list' },
  { key: 'kanban', label: 'kanban' },
  { key: 'calendar', label: 'calendar' }
];

const queryString = computed(() => {
  const search = new URLSearchParams();

  if (filters.status) {
    search.set('status', filters.status);
  }

  if (filters.priority) {
    search.set('priority', filters.priority);
  }

  if (filters.q.trim()) {
    search.set('q', filters.q.trim());
  }

  return search.toString();
});

const loadTasks = async () => {
  loading.value = true;

  try {
    const response = await api.get<{ data: Task[] }>(
      `/api/projects/${projectId.value}/tasks${queryString.value ? `?${queryString.value}` : ''}`
    );

    tasks.value = response.data;
    const visibleTaskIds = new Set(tasks.value.map((task) => task.id));
    selected.value = selected.value.filter((id) => visibleTaskIds.has(id));
  } finally {
    loading.value = false;
  }
};

const createTask = async () => {
  const title = draft.value.trim();

  if (!title) {
    return;
  }

  await api.post(`/api/projects/${projectId.value}/tasks`, {
    title,
    status: 'todo',
    priority: 'medium'
  });

  draft.value = '';
  await loadTasks();
};

const toggleTaskStatus = async (task: Task) => {
  const newStatus = task.status === 'done' ? 'todo' : 'done';
  await api.patch(`/api/tasks/${task.id}`, { status: newStatus });
  await loadTasks();
};

const toggleTaskSelection = (taskId: string, checked: boolean) => {
  if (checked) {
    if (!selected.value.includes(taskId)) {
      selected.value = [...selected.value, taskId];
    }
    return;
  }

  selected.value = selected.value.filter((id) => id !== taskId);
};

const bulkSetStatus = async (status: string) => {
  if (!hasSelection.value) {
    return;
  }

  await api.post(`/api/projects/${projectId.value}/tasks/bulk`, {
    task_ids: selected.value,
    status
  });

  selected.value = [];
  await loadTasks();
};

const onViewChange = (key: string) => {
  router.push(`/projects/${projectId.value}/tasks/${key}`);
};

watch([projectId, queryString], loadTasks, { immediate: true });
</script>

<template>
  <div class="list-page">
    <UiPageHeader
      title="Tasks"
      subtitle="Filter and manage tasks across the project"
    >
      <template #right>
        <UiViewTabs :tabs="viewTabs" active="list" @change="onViewChange" />
      </template>
    </UiPageHeader>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="filters">
        <input
          v-model="filters.q"
          class="search-input"
          type="text"
          aria-label="Search tasks"
          placeholder="search tasks..."
        />

        <select v-model="filters.status" class="filter-select" aria-label="Filter by status">
          <option value="">all statuses</option>
          <option value="backlog">backlog</option>
          <option value="todo">todo</option>
          <option value="in_progress">in progress</option>
          <option value="in_review">in review</option>
          <option value="done">done</option>
          <option value="cancelled">cancelled</option>
        </select>

        <select v-model="filters.priority" class="filter-select" aria-label="Filter by priority">
          <option value="">all priorities</option>
          <option value="none">no priority</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="urgent">urgent</option>
        </select>
      </div>

      <form class="add-form" @submit.prevent="createTask">
        <input
          v-model="draft"
          class="add-input"
          type="text"
          aria-label="Quick add task title"
          placeholder="quick add task..."
        />
        <PrimaryButton label="add task" @click="createTask">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </template>
        </PrimaryButton>
      </form>
    </div>

    <!-- Bulk Actions -->
    <div v-if="hasSelection" class="bulk-actions">
      <span class="selection-count">{{ selected.length }} selected</span>
      <div class="bulk-buttons">
        <button type="button" class="bulk-btn" @click="bulkSetStatus('todo')">set todo</button>
        <button type="button" class="bulk-btn" @click="bulkSetStatus('in_progress')">set in progress</button>
        <button type="button" class="bulk-btn" @click="bulkSetStatus('done')">set done</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading">Loading tasks...</div>

    <!-- Task Table -->
    <div v-else-if="tasks.length" class="task-table">
      <ViewsTaskTableHeader />

      <div class="table-body">
        <ViewsTaskTableRow
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :selected="isTaskSelected(task.id)"
          @toggle-selected="toggleTaskSelection(task.id, $event)"
          @toggle-status="toggleTaskStatus(task)"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <p>No tasks match the current filters.</p>
    </div>
  </div>
</template>

<style scoped>
.list-page {
  max-width: var(--content-max-width-list);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.filters {
  display: flex;
  gap: var(--space-2);
}

.search-input,
.filter-select {
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text);
}

.search-input {
  width: 200px;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.filter-select {
  cursor: pointer;
}

.add-form {
  display: flex;
  gap: var(--space-2);
}

.add-input {
  width: 200px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text);
}

.add-input::placeholder {
  color: var(--color-text-tertiary);
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-surface);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.selection-count {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text);
}

.bulk-buttons {
  display: flex;
  gap: var(--space-2);
}

.bulk-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-1) var(--space-3);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.bulk-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

.loading {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

.task-table {
  border-top: 1px solid var(--color-border);
}

.table-body {
  display: flex;
  flex-direction: column;
}

.empty-state {
  padding: var(--space-12) 0;
  text-align: center;
}

.empty-state p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
}
</style>
