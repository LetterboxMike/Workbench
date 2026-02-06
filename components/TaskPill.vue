<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    kind: 'status' | 'priority';
    value: string;
  }>(),
  {
    kind: 'status'
  }
);

const STATUS_LABELS: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
  cancelled: 'Cancelled'
};

const PRIORITY_LABELS: Record<string, string> = {
  none: 'No priority',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
};

const label = computed(() => {
  if (props.kind === 'status') {
    return STATUS_LABELS[props.value] || props.value.replaceAll('_', ' ');
  }

  return PRIORITY_LABELS[props.value] || props.value.replaceAll('_', ' ');
});
</script>

<template>
  <span>
    {{ label }}
  </span>
</template>

<style scoped>
span {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-bg-surface);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-xs);
  text-transform: capitalize;
}
</style>
