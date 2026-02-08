<script setup lang="ts">
import type { Task } from '~/types/domain';

const props = defineProps<{
  tasks: Task[];
}>();

const emit = defineEmits<{
  taskClick: [taskId: string];
  viewAll: [];
}>();

// Categorize tasks by due date
const today = new Date();
today.setHours(0, 0, 0, 0);

const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

const categorizedTasks = computed(() => {
  const overdue: Task[] = [];
  const dueToday: Task[] = [];
  const upcoming: Task[] = [];

  for (const task of props.tasks) {
    // Skip completed/cancelled tasks
    if (task.status === 'done' || task.status === 'cancelled') continue;
    if (!task.due_date) continue;

    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      overdue.push(task);
    } else if (dueDate.getTime() === today.getTime()) {
      dueToday.push(task);
    } else if (dueDate < nextWeek) {
      upcoming.push(task);
    }
  }

  return { overdue, dueToday, upcoming };
});

const hasAnyTasks = computed(() => {
  const { overdue, dueToday, upcoming } = categorizedTasks.value;
  return overdue.length > 0 || dueToday.length > 0 || upcoming.length > 0;
});

const formatDueDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
</script>

<template>
  <section class="tasks-due-section">
    <SectionHeader
      label="tasks due"
      :link-text="hasAnyTasks ? 'view all tasks' : undefined"
      @link-click="emit('viewAll')"
    />

    <div class="columns">
      <!-- Overdue Column -->
      <div class="column">
        <span class="column-header">overdue</span>
        <div v-if="categorizedTasks.overdue.length" class="task-list">
          <div
            v-for="task in categorizedTasks.overdue"
            :key="task.id"
            class="task-row"
            @click="emit('taskClick', task.id)"
          >
            <PriorityDot :priority="task.priority" />
            <span class="task-title">{{ task.title }}</span>
            <span class="task-due">{{ formatDueDate(task.due_date!) }}</span>
          </div>
        </div>
        <span v-else class="empty">none</span>
      </div>

      <!-- Due Today Column -->
      <div class="column">
        <span class="column-header">due today</span>
        <div v-if="categorizedTasks.dueToday.length" class="task-list">
          <div
            v-for="task in categorizedTasks.dueToday"
            :key="task.id"
            class="task-row"
            @click="emit('taskClick', task.id)"
          >
            <PriorityDot :priority="task.priority" />
            <span class="task-title">{{ task.title }}</span>
            <span class="task-due">{{ formatDueDate(task.due_date!) }}</span>
          </div>
        </div>
        <span v-else class="empty">none</span>
      </div>

      <!-- Upcoming Column -->
      <div class="column">
        <span class="column-header">upcoming</span>
        <div v-if="categorizedTasks.upcoming.length" class="task-list">
          <div
            v-for="task in categorizedTasks.upcoming"
            :key="task.id"
            class="task-row"
            @click="emit('taskClick', task.id)"
          >
            <PriorityDot :priority="task.priority" />
            <span class="task-title">{{ task.title }}</span>
            <span class="task-due">{{ formatDueDate(task.due_date!) }}</span>
          </div>
        </div>
        <span v-else class="empty">none</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tasks-due-section {
  margin-top: 32px;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 32px;
}

.column-header {
  display: block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 300;
  letter-spacing: 0.06em;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
  margin-bottom: 12px;
}

.task-list {
  display: flex;
  flex-direction: column;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.task-row:hover {
  background: var(--color-bg-hover);
  margin: 0 -8px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 4px;
}

.task-title {
  flex: 1;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-due {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.empty {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

@media (max-width: 768px) {
  .columns {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
</style>
