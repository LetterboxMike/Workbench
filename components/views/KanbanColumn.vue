<script setup lang="ts">
import type { Task } from '~/types/domain';

defineProps<{
  status: string;
  label: string;
  tasks: Task[];
}>();

const emit = defineEmits<{
  addTask: [];
  taskClick: [taskId: string];
}>();

const formatLabel = (label: string): string => {
  return label.replace(/_/g, ' ');
};
</script>

<template>
  <div class="kanban-column">
    <header class="column-header">
      <span class="column-label">{{ formatLabel(label) }}</span>
      <span class="column-count">{{ tasks.length }}</span>
    </header>

    <div class="column-cards">
      <ViewsKanbanCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @click="emit('taskClick', task.id)"
      />
    </div>

    <UiDashedButton label="add" @click="emit('addTask')" />
  </div>
</template>

<style scoped>
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
  min-height: 100px;
}
</style>
