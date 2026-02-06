<script setup lang="ts">
import type { Task } from '~/types/domain';

defineProps<{
  date: number;
  isToday?: boolean;
  isCurrentMonth?: boolean;
  tasks: Task[];
}>();

const emit = defineEmits<{
  taskClick: [taskId: string];
}>();
</script>

<template>
  <div class="calendar-cell" :class="{ today: isToday, 'other-month': !isCurrentMonth }">
    <div class="cell-header">
      <span class="date-number" :class="{ 'today-badge': isToday }">{{ date }}</span>
    </div>
    <div class="cell-tasks">
      <div
        v-for="task in tasks.slice(0, 3)"
        :key="task.id"
        class="task-chip"
        @click="emit('taskClick', task.id)"
      >
        <UiPriorityDot :priority="task.priority" />
        <span class="chip-title">{{ task.title }}</span>
      </div>
      <span v-if="tasks.length > 3" class="more-count">+{{ tasks.length - 3 }} more</span>
    </div>
  </div>
</template>

<style scoped>
.calendar-cell {
  min-height: 100px;
  padding: var(--space-2);
  border-top: 1px solid var(--color-border);
}

.calendar-cell.today {
  background: var(--color-bg-surface);
}

.calendar-cell.other-month {
  opacity: 0.4;
}

.cell-header {
  margin-bottom: var(--space-2);
}

.date-number {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.date-number.today-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--color-calendar-today-bg);
  color: var(--color-calendar-today-text);
  border-radius: var(--radius-full);
  font-weight: 600;
}

.cell-tasks {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.task-chip {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.task-chip:hover {
  background: var(--color-bg-hover);
}

.chip-title {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-tertiary);
  padding: var(--space-1) var(--space-2);
}
</style>
