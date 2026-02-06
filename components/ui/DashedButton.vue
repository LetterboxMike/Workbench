<script setup lang="ts">
defineProps<{
  label: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button type="button" class="dashed-button" @click="emit('click')">
    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
    <span>{{ label }}</span>
  </button>
</template>

<style scoped>
.dashed-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.dashed-button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.icon {
  width: 12px;
  height: 12px;
}
</style>
