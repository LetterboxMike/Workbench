<script setup lang="ts">
import type { Task } from '~/types/domain';

const route = useRoute();
const router = useRouter();
const api = useWorkbenchApi();

const projectId = computed(() => route.params.id as string);
const loading = ref(true);
const creating = ref(false);

const tasks = ref<Task[]>([]);

// View tabs - default to list
type ViewType = 'list' | 'kanban' | 'calendar';
const activeView = ref<ViewType>('list');

const viewTabs = [
  { key: 'list', label: 'list' },
  { key: 'kanban', label: 'kanban' },
  { key: 'calendar', label: 'calendar' }
];

const filters = reactive({
  status: '',
  priority: '',
  q: ''
});

const selected = ref<string[]>([]);
const draft = ref('');

const hasSelection = computed(() => selected.value.length > 0);
const isTaskSelected = (taskId: string) => selected.value.includes(taskId);

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

  if (!title || creating.value) {
    return;
  }

  creating.value = true;

  try {
    await api.post(`/api/projects/${projectId.value}/tasks`, {
      title,
      status: 'todo',
      priority: 'medium'
    });

    draft.value = '';
    await loadTasks();
  } finally {
    creating.value = false;
  }
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
  if (key === 'list') {
    activeView.value = 'list';
  } else {
    router.push(`/projects/${projectId.value}/tasks/${key}`);
  }
};

watch([projectId, queryString], loadTasks, { immediate: true });
</script>

<template>
  <section>
    <header>
      <div>
        <h1>Tasks</h1>
        <p>Manage and track work across your project.</p>
      </div>

      <div class="header-actions">
        <span>{{ tasks.length }} {{ tasks.length === 1 ? 'task' : 'tasks' }}</span>
        <UiViewTabs :tabs="viewTabs" active="list" @change="onViewChange" />
      </div>
    </header>

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
        <button type="submit" :disabled="creating">{{ creating ? 'Creating...' : 'New task' }}</button>
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

    <section>
      <p v-if="loading">Loading tasks...</p>

      <div v-else-if="tasks.length">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in tasks" :key="task.id">
              <td>
                <input
                  type="checkbox"
                  :checked="isTaskSelected(task.id)"
                  :aria-label="`Select task ${task.title}`"
                  @change="toggleTaskSelection(task.id, ($event.target as HTMLInputElement).checked)"
                />
              </td>
              <td>
                <strong>{{ task.title }}</strong>
              </td>
              <td>
                <TaskPill kind="status" :value="task.status" />
              </td>
              <td>
                <TaskPill kind="priority" :value="task.priority" />
              </td>
              <td>
                <span v-if="task.due_date">{{ new Date(task.due_date).toLocaleDateString() }}</span>
                <span v-else class="no-date">—</span>
              </td>
              <td>
                <button type="button" class="toggle-btn" @click="toggleTaskStatus(task)">
                  {{ task.status === 'done' ? 'Reopen' : 'Complete' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-else>No tasks yet. Create your first task to start tracking work.</p>
    </section>
  </section>
</template>

<style scoped>
section {
  max-width: var(--content-max-width);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

header h1 {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

header > div:first-child p {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.header-actions span {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-tertiary);
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
  width: 180px;
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
  width: 180px;
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

.add-form button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-bg);
  background: var(--color-text);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.add-form button:hover:not(:disabled) {
  opacity: 0.9;
}

.add-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

section > section p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  border-bottom: 1px solid var(--color-border);
}

th {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
  padding: var(--space-3) var(--space-4);
}

th:first-child {
  width: 44px;
}

tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

tbody tr:hover {
  background: var(--color-bg-hover);
}

td {
  padding: var(--space-4);
  vertical-align: middle;
}

td input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

td strong {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

td span {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

td .no-date {
  color: var(--color-text-tertiary);
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color var(--transition-fast);
}

.toggle-btn:hover {
  color: var(--color-text);
}
</style>
