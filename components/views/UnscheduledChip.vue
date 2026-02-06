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
  <div class="unscheduled-chip" draggable="true" @click="emit('click')">
    <UiPriorityDot :priority="task.priority" />
    <span class="chip-title">{{ task.title }}</span>
  </div>
</template>

<style scoped>
.unscheduled-chip {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 14px;
  background: var(--color-bg-surface);
  border-radius: var(--radius-md);
  cursor: grab;
  transition: background var(--transition-fast);
}

.unscheduled-chip:hover {
  background: var(--color-bg-hover);
}

.unscheduled-chip:active {
  cursor: grabbing;
}

.chip-title {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text);
}
</style>
