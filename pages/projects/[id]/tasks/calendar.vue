<script setup lang="ts">
const route = useRoute();
const api = useWorkbenchApi();

const projectId = computed(() => route.params.id as string);
const loading = ref(true);
const tasks = ref<Array<{ id: string; title: string; status: string; priority: string; due_date?: string | null }>>([]);
const monthCursor = ref(new Date());

const todayIso = new Date().toISOString().slice(0, 10);

const monthStart = computed(() => new Date(monthCursor.value.getFullYear(), monthCursor.value.getMonth(), 1));
const monthLabel = computed(() => monthStart.value.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));

const toLocalDate = (year: number, month: number, day: number) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const loadTasks = async () => {
  loading.value = true;

  try {
    const response = await api.get<{ data: typeof tasks.value }>(`/api/projects/${projectId.value}/tasks`);
    tasks.value = response.data;
  } finally {
    loading.value = false;
  }
};

const tasksByDate = computed(() => {
  const map = new Map<string, typeof tasks.value>();

  for (const task of tasks.value) {
    if (!task.due_date) {
      continue;
    }

    const list = map.get(task.due_date) || [];
    list.push(task);
    map.set(task.due_date, list);
  }

  return map;
});

const calendarCells = computed(() => {
  const start = monthStart.value;
  const year = start.getFullYear();
  const month = start.getMonth();
  const firstWeekday = start.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string | null; day: number | null; tasks: typeof tasks.value }> = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({ date: null, day: null, tasks: [] });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toLocalDate(year, month, day);
    cells.push({ date, day, tasks: tasksByDate.value.get(date) || [] });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, day: null, tasks: [] });
  }

  return cells;
});

const unscheduled = computed(() => tasks.value.filter((task) => !task.due_date));

const prevMonth = () => {
  monthCursor.value = new Date(monthCursor.value.getFullYear(), monthCursor.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  monthCursor.value = new Date(monthCursor.value.getFullYear(), monthCursor.value.getMonth() + 1, 1);
};

const onDragStart = (event: DragEvent, taskId: string) => {
  event.dataTransfer?.setData('text/task-id', taskId);
};

const onDropDate = async (event: DragEvent, date: string) => {
  const taskId = event.dataTransfer?.getData('text/task-id');

  if (!taskId) {
    return;
  }

  await api.patch(`/api/tasks/${taskId}`, { due_date: date });
  await loadTasks();
};

watch(projectId, loadTasks, { immediate: true });
</script>

<template>
  <section>
    <header>
      <div>
        <h1>Calendar</h1>
        <p>Plan due dates and drag unscheduled work directly into calendar cells.</p>
      </div>

      <div>
        <NuxtLink :to="`/projects/${projectId}/tasks/list`">List</NuxtLink>
        <NuxtLink :to="`/projects/${projectId}/tasks/kanban`">Kanban</NuxtLink>
        <NuxtLink :to="`/projects/${projectId}/tasks/calendar`">Calendar</NuxtLink>
      </div>
    </header>

    <p v-if="loading">Loading calendar...</p>

    <template v-else>
      <section>
        <div>
          <button type="button" @click="prevMonth">Previous</button>
          <h2>{{ monthLabel }}</h2>
          <button type="button" @click="nextMonth">Next</button>
        </div>

        <div>
          <div>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div>
            <article
              v-for="(cell, index) in calendarCells"
              :key="index"

              @dragover.prevent
              @drop.prevent="cell.date ? onDropDate($event, cell.date) : null"
            >
              <div>{{ cell.day || '' }}</div>

              <div>
                <article
                  v-for="task in cell.tasks"
                  :key="task.id"

                  draggable="true"
                  @dragstart="(event) => onDragStart(event, task.id)"
                >
                  <strong>{{ task.title }}</strong>
                  <TaskPill kind="priority" :value="task.priority" />
                </article>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section>
        <h3>Unscheduled tasks</h3>
        <p>Drag these tasks into a date cell to assign due dates.</p>

        <div v-if="unscheduled.length">
          <article v-for="task in unscheduled" :key="task.id" draggable="true" @dragstart="(event) => onDragStart(event, task.id)">
            <strong>{{ task.title }}</strong>
            <TaskPill kind="status" :value="task.status" />
          </article>
        </div>

        <p v-else>Every task has a due date for this month scope.</p>
      </section>
    </template>
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

header > div:last-child {
  display: flex;
  gap: var(--space-2);
}

header > div:last-child a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast), color var(--transition-fast);
}

header > div:last-child a:hover,
header > div:last-child a.router-link-active {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

section > p {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-tertiary);
  padding: var(--space-8) 0;
}

/* Calendar navigation */
section > section:first-of-type > div:first-child {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

section > section:first-of-type > div:first-child button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

section > section:first-of-type > div:first-child button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text);
}

section > section:first-of-type > div:first-child h2 {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  min-width: 180px;
  text-align: center;
}

/* Calendar grid */
section > section:first-of-type > div:last-child {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

section > section:first-of-type > div:last-child > div:first-child {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--color-bg-surface);
  border-bottom: 1px solid var(--color-border);
}

section > section:first-of-type > div:last-child > div:first-child span {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  text-align: center;
  padding: var(--space-3);
}

section > section:first-of-type > div:last-child > div:last-child {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

section > section:first-of-type > div:last-child > div:last-child > article {
  min-height: 100px;
  padding: var(--space-2);
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  transition: background var(--transition-fast);
}

section > section:first-of-type > div:last-child > div:last-child > article:nth-child(7n) {
  border-right: none;
}

section > section:first-of-type > div:last-child > div:last-child > article:hover {
  background: var(--color-bg-hover);
}

section > section:first-of-type > div:last-child > div:last-child > article > div:first-child {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

section > section:first-of-type > div:last-child > div:last-child > article > div:last-child {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

section > section:first-of-type > div:last-child > div:last-child > article > div:last-child > article {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xs);
  cursor: grab;
  transition: background var(--transition-fast);
}

section > section:first-of-type > div:last-child > div:last-child > article > div:last-child > article:hover {
  background: var(--color-bg-surface);
}

section > section:first-of-type > div:last-child > div:last-child > article > div:last-child > article:active {
  cursor: grabbing;
}

section > section:first-of-type > div:last-child > div:last-child > article > div:last-child > article strong {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Unscheduled section */
section > section:last-of-type {
  margin-top: var(--space-8);
  padding: var(--space-6);
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

section > section:last-of-type h3 {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}

section > section:last-of-type > p {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

section > section:last-of-type > div {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

section > section:last-of-type > div > article {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: grab;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

section > section:last-of-type > div > article:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-strong);
}

section > section:last-of-type > div > article:active {
  cursor: grabbing;
}

section > section:last-of-type > div > article strong {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}
</style>
