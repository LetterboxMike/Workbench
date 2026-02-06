<script setup lang="ts">
type Status = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled' | null | undefined;

defineProps<{
  status: Status;
}>();

const formatStatus = (status: Status): string => {
  if (!status) return '—';
  return status.replace(/_/g, ' ');
};
</script>

<template>
  <span class="status-label" :class="`status-${status || 'none'}`">
    {{ formatStatus(status) }}
  </span>
</template>

<style scoped>
.status-label {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  text-transform: lowercase;
}

.status-in_progress {
  color: var(--color-text);
}

.status-todo,
.status-in_review {
  color: var(--color-text-secondary);
}

.status-backlog,
.status-done,
.status-cancelled,
.status-none {
  color: var(--color-text-tertiary);
}
</style>
