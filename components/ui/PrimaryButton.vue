<script setup lang="ts">
defineProps<{
  label: string;
  disabled?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    class="primary-button"
    :disabled="disabled || loading"
    @click="emit('click')"
  >
    <slot name="icon" />
    <span>{{ label }}</span>
    <span v-if="loading" class="spinner" />
  </button>
</template>

<style scoped>
.primary-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-text);
  color: var(--color-bg);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  text-transform: lowercase;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.primary-button:hover:not(:disabled) {
  opacity: 0.9;
}

.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary-button :slotted(svg) {
  width: 14px;
  height: 14px;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: var(--radius-full);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
