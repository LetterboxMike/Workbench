<script setup lang="ts">
import type { Task } from '~/types/domain';

defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  toggle: [];
  click: [];
}>();

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
</script>

<template>
  <div class="task-row" @click="emit('click')">
    <div class="cell cell-checkbox">
      <UiTaskCheckbox
        :checked="task.status === 'done'"
        @change="emit('toggle')"
        @click.stop
      />
    </div>
    <div class="cell cell-title" :class="{ completed: task.status === 'done' }">
      {{ task.title }}
    </div>
    <div class="cell cell-status">
      <UiStatusLabel :status="task.status" />
    </div>
    <div class="cell cell-priority">
      <UiPriorityDot :priority="task.priority" />
    </div>
    <div class="cell cell-assignee">
      {{ task.assignee_id || '—' }}
    </div>
    <div class="cell cell-due">
      {{ formatDate(task.due_date) }}
    </div>
    <div class="cell cell-source">
      {{ task.source_document_id ? 'document' : 'standalone' }}
    </div>
  </div>
</template>

<style scoped>
.task-row {
  display: grid;
  grid-template-columns: 24px 1fr 100px 80px 100px 80px 120px;
  align-items: center;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.task-row:hover {
  background: var(--color-bg-hover);
}

.cell {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.cell-title {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  padding-right: var(--space-4);
}

.cell-title.completed {
  color: var(--color-text-tertiary);
  text-decoration: line-through;
}

.cell-assignee,
.cell-due,
.cell-source {
  font-size: 11px;
  color: var(--color-text-tertiary);
}
</style>
