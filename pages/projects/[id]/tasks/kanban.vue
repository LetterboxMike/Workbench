<script setup lang="ts">
import type { Task } from '~/types/domain';

const route = useRoute();
const router = useRouter();
const api = useWorkbenchApi();

const projectId = computed(() => route.params.id as string);
const loading = ref(true);
const tasks = ref<Task[]>([]);

const statuses = [
  { key: 'backlog', label: 'backlog' },
  { key: 'todo', label: 'todo' },
  { key: 'in_progress', label: 'in progress' },
  { key: 'in_review', label: 'in review' },
  { key: 'done', label: 'done' }
];

const viewTabs = [
  { key: 'list', label: 'list' },
  { key: 'kanban', label: 'kanban' },
  { key: 'calendar', label: 'calendar' }
];

const drafts = reactive<Record<string, string>>({
  backlog: '',
  todo: '',
  in_progress: '',
  in_review: '',
  done: ''
});

const grouped = computed(() => {
  return statuses.map((column) => ({
    ...column,
    tasks: tasks.value.filter((task) => task.status === column.key)
  }));
});

const loadTasks = async () => {
  loading.value = true;

  try {
    const response = await api.get<{ data: Task[] }>(`/api/projects/${projectId.value}/tasks`);
    tasks.value = response.data;
  } finally {
    loading.value = false;
  }
};

const onDragStart = (event: DragEvent, taskId: string) => {
  event.dataTransfer?.setData('text/task-id', taskId);
};

const onDrop = async (event: DragEvent, status: string) => {
  const taskId = event.dataTransfer?.getData('text/task-id');

  if (!taskId) {
    return;
  }

  await api.patch(`/api/tasks/${taskId}`, { status });
  await loadTasks();
};

const quickAdd = async (status: string) => {
  const title = drafts[status]?.trim();

  if (!title) {
    return;
  }

  await api.post(`/api/projects/${projectId.value}/tasks`, {
    title,
    status,
    priority: 'medium'
  });

  drafts[status] = '';
  await loadTasks();
};

const onViewChange = (key: string) => {
  router.push(`/projects/${projectId.value}/tasks/${key}`);
};

watch(projectId, loadTasks, { immediate: true });
</script>

<template>
  <div class="kanban-page">
    <UiPageHeader
      title="Kanban"
      subtitle="Drag tasks between workflow stages"
    >
      <template #right>
        <UiViewTabs :tabs="viewTabs" active="kanban" @change="onViewChange" />
      </template>
    </UiPageHeader>

    <div v-if="loading" class="loading">Loading columns...</div>

    <div v-else class="kanban-board">
      <div
        v-for="column in grouped"
        :key="column.key"
        class="kanban-column"
        @dragover.prevent
        @drop.prevent="(event) => onDrop(event, column.key)"
      >
        <header class="column-header">
          <span class="column-label">{{ column.label }}</span>
          <span class="column-count">{{ column.tasks.length }}</span>
        </header>

        <div class="column-cards">
          <article
            v-for="task in column.tasks"
            :key="task.id"
            class="kanban-card"
            draggable="true"
            @dragstart="(event) => onDragStart(event, task.id)"
          >
            <p class="card-title">{{ task.title }}</p>
            <div class="card-meta">
              <div class="meta-left">
                <UiPriorityDot :priority="task.priority" />
                <span v-if="task.assignee_id" class="assignee">{{ task.assignee_id }}</span>
              </div>
              <span v-if="task.due_date" class="due-date">
                {{ new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}
              </span>
            </div>
          </article>

          <p v-if="!column.tasks.length" class="empty-column">No tasks</p>
        </div>

        <form class="quick-add" @submit.prevent="quickAdd(column.key)">
          <input
            v-model="drafts[column.key]"
            class="quick-input"
            :placeholder="`add ${column.label} task...`"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-page {
  max-width: none;
}

.loading {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

.kanban-board {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  padding-bottom: var(--space-4);
}

.kanban-column {
  flex: 1;
  min-width: var(--kanban-column-min-width);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.column-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) 0;
}

.column-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
}

.column-count {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  opacity: 0.4;
}

.column-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  min-height: 200px;
}

.kanban-card {
  padding: 14px var(--space-4);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: grab;
  transition: background var(--transition-fast);
}

.kanban-card:hover {
  background: var(--color-bg-hover);
}

.kanban-card:active {
  cursor: grabbing;
}

.card-title {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--color-text);
  margin: 0;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.assignee,
.due-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.empty-column {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  opacity: 0.5;
  text-align: center;
  padding: var(--space-4);
}

.quick-add {
  margin-top: auto;
}

.quick-input {
  width: 100%;
  padding: 10px var(--space-3);
  background: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text);
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.quick-input::placeholder {
  color: var(--color-text-tertiary);
}

.quick-input:focus {
  outline: none;
  background: var(--color-bg-input);
  border-style: solid;
  border-color: var(--color-border-strong);
}
</style>
