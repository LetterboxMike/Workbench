<script setup lang="ts">
defineProps<{
  checked: boolean;
}>();

const emit = defineEmits<{
  change: [checked: boolean];
}>();
</script>

<template>
  <button
    type="button"
    class="task-checkbox"
    :class="{ checked }"
    role="checkbox"
    :aria-checked="checked"
    @click="emit('change', !checked)"
  >
    <svg v-if="checked" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  </button>
</template>

<style scoped>
.task-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  background: transparent;
  border: 1.5px solid var(--color-text-secondary);
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
  flex-shrink: 0;
}

.task-checkbox:hover {
  border-color: var(--color-text);
}

.task-checkbox.checked {
  background: var(--color-text-tertiary);
  border-color: var(--color-text-tertiary);
}

.check-icon {
  width: 10px;
  height: 10px;
  color: var(--color-bg);
}
</style>
