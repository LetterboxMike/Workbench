<script setup lang="ts">
import type { Task } from '~/types/domain';

defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  click: [];
}>();

const formatDate = (date: string | null | undefined): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
</script>

<template>
  <article class="kanban-card" @click="emit('click')">
    <p class="card-title">{{ task.title }}</p>
    <div class="card-meta">
      <div class="meta-left">
        <UiPriorityDot :priority="task.priority" />
        <span v-if="task.assignee_id" class="assignee">{{ task.assignee_id }}</span>
      </div>
      <span v-if="task.due_date" class="due-date">{{ formatDate(task.due_date) }}</span>
    </div>
  </article>
</template>

<style scoped>
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

.assignee {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.due-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
}
</style>
