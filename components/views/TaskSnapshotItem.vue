<script setup lang="ts">
import type { Task } from '~/types/domain';

defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <div class="snapshot-item" @click="emit('click')">
    <UiPriorityDot :priority="task.priority" />
    <span class="task-title">{{ task.title }}</span>
    <UiStatusLabel :status="task.status" />
  </div>
</template>

<style scoped>
.snapshot-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.snapshot-item:hover {
  background: var(--color-bg-hover);
  margin: 0 calc(-1 * var(--space-3));
  padding-left: var(--space-3);
  padding-right: var(--space-3);
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
</style>
