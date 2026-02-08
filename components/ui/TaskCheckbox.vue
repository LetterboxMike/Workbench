<script setup lang="ts">
defineProps<{
  checked: boolean;
  label?: string;
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
    :aria-label="label || 'Toggle task selection'"
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
  width: 44px;
  height: 44px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  flex-shrink: 0;
  position: relative;
}

.task-checkbox::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--color-text-secondary);
  border-radius: var(--radius-xs);
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.task-checkbox:hover {
  background: var(--color-bg-hover);
}

.task-checkbox:hover::before {
  border-color: var(--color-text);
}

.task-checkbox.checked::before {
  background: var(--color-text-tertiary);
  border-color: var(--color-text-tertiary);
}

.check-icon {
  position: absolute;
  width: 10px;
  height: 10px;
  color: var(--color-text-inverse);
}
</style>
