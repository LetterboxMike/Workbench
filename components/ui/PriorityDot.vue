<script setup lang="ts">
type Priority = 'urgent' | 'high' | 'medium' | 'low' | 'none' | null | undefined;

defineProps<{
  priority: Priority;
}>();
</script>

<template>
  <span
    class="priority-dot"
    :class="`priority-${priority || 'none'}`"
    :title="priority ? `Priority: ${priority}` : 'No priority'"
  />
</template>

<style scoped>
.priority-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.priority-urgent {
  background: var(--color-priority-urgent);
}

.priority-high {
  background: var(--color-priority-high);
}

.priority-medium {
  background: var(--color-priority-medium);
}

.priority-low {
  background: var(--color-priority-low);
}

.priority-none {
  background: var(--color-priority-none);
}
</style>
