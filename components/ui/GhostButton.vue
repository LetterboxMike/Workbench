<script setup lang="ts">
defineProps<{
  label: string;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button type="button" class="ghost-button" @click="emit('click')">
    {{ label }} →
  </button>
</template>

<style scoped>
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-tertiary);
  opacity: 0.5;
  background: transparent;
  border: none;
  padding: 0 var(--space-2);
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

.ghost-button:hover {
  opacity: 0.8;
}
</style>
